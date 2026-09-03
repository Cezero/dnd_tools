import { prisma } from '@/lib/prisma';
import { EntityAppliesToType } from '@shared/static-data';

/**
 * Keeps CharacterCompanion rows in sync with Animal Companion / Familiar feature choices.
 * Pets (`companionId` null) are never created or deleted here.
 */
export const companionSyncService = {
    /**
     * Upserts class-linked companions from persisted feature choices and deletes
     * class-linked rows whose choice was cleared. Player-assigned name, purpose,
     * tricks, skills, feats, and HP are preserved when the template is unchanged.
     */
    async syncFromFeatureChoices(characterId: number): Promise<void> {
        const choices = await prisma.characterFeatureChoice.findMany({
            where: { characterId },
            select: {
                featureId: true,
                featureEntityId: true,
                appliesToId: true,
                advancementId: true,
            },
        });

        if (choices.length === 0) {
            await prisma.characterCompanion.deleteMany({
                where: {
                    characterId,
                    companionId: { not: null },
                },
            });
            return;
        }

        const entities = await prisma.featureEntity.findMany({
            where: {
                id: { in: choices.map((c) => c.featureEntityId) },
                appliesTo: {
                    in: [EntityAppliesToType.AnimalCompanion, EntityAppliesToType.Familiar],
                },
            },
            select: { id: true, appliesTo: true },
        });
        const companionEntityIds = new Set(entities.map((e) => e.id));

        const selectedCompanionIds = new Set<number>();
        const choiceByCompanionId = new Map<number, typeof choices[number]>();
        for (const choice of choices) {
            if (!companionEntityIds.has(choice.featureEntityId)) {
                continue;
            }
            if (choice.appliesToId > 0) {
                selectedCompanionIds.add(choice.appliesToId);
                choiceByCompanionId.set(choice.appliesToId, choice);
            }
        }

        const templates = selectedCompanionIds.size > 0
            ? await prisma.companion.findMany({
                where: { id: { in: [...selectedCompanionIds] } },
            })
            : [];
        const templateById = new Map(templates.map((t) => [t.id, t]));

        const existing = await prisma.characterCompanion.findMany({
            where: {
                characterId,
                companionId: { not: null },
            },
        });
        const existingByCompanionId = new Map(
            existing
                .filter((row) => row.companionId !== null)
                .map((row) => [row.companionId as number, row])
        );
        const unmatchedPets = await prisma.characterCompanion.findMany({
            where: {
                characterId,
                companionId: null,
            },
        });

        for (const companionId of selectedCompanionIds) {
            const template = templateById.get(companionId);
            if (!template) {
                continue;
            }
            const choice = choiceByCompanionId.get(companionId);
            const current = existingByCompanionId.get(companionId);

            if (!current) {
                const adoptablePet = unmatchedPets.find((row) => row.monsterId === template.monsterId);
                if (adoptablePet) {
                    await prisma.characterCompanion.update({
                        where: { id: adoptablePet.id },
                        data: {
                            companionId: template.id,
                            monsterId: template.monsterId,
                            levelAcquired: adoptablePet.levelAcquired
                                ?? (choice ? await this.getChoiceLevel(choice.advancementId) : null),
                        },
                    });
                    continue;
                }
                const monster = await prisma.monster.findUnique({
                    where: { id: template.monsterId },
                    select: { averageHP: true },
                });
                await prisma.characterCompanion.create({
                    data: {
                        characterId,
                        monsterId: template.monsterId,
                        companionId: template.id,
                        levelAcquired: choice ? await this.getChoiceLevel(choice.advancementId) : null,
                        hitPoints: monster?.averageHP ?? null,
                        wounds: 0,
                    },
                });
                continue;
            }

            if (current.monsterId !== template.monsterId) {
                const monster = await prisma.monster.findUnique({
                    where: { id: template.monsterId },
                    select: { averageHP: true },
                });
                await prisma.characterCompanion.update({
                    where: { id: current.id },
                    data: {
                        monsterId: template.monsterId,
                        hitPoints: monster?.averageHP ?? current.hitPoints,
                    },
                });
            }
        }

        const staleIds = existing
            .filter((row) => row.companionId !== null && !selectedCompanionIds.has(row.companionId))
            .map((row) => row.id);

        if (staleIds.length > 0) {
            await prisma.characterCompanion.deleteMany({
                where: { id: { in: staleIds } },
            });
        }
    },

    async getChoiceLevel(advancementId: number): Promise<number | null> {
        const advancement = await prisma.characterAdvancement.findUnique({
            where: { id: advancementId },
            select: { level: true },
        });
        return advancement?.level ?? null;
    },
};

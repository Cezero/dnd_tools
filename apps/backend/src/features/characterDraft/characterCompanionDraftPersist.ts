import { Prisma } from '@shared/prisma-client';
import type { CharacterCompanionDraft, CharacterSelectedFormDraft } from '@shared/schema';

/**
 * Replaces persisted companions and selected forms with the character-draft collections.
 */
export async function persistCompanionDraftCollections(
    tx: Prisma.TransactionClient,
    characterId: number,
    companions: CharacterCompanionDraft[] | undefined,
    selectedForms: CharacterSelectedFormDraft[] | undefined
): Promise<void> {
    if (companions !== undefined) {
        await tx.characterCompanion.deleteMany({ where: { characterId } });
        for (const companion of companions) {
            const created = await tx.characterCompanion.create({
                data: {
                    characterId,
                    monsterId: companion.monsterId,
                    companionId: companion.companionId ?? null,
                    trickPurposeId: companion.trickPurposeId ?? null,
                    name: companion.name ?? null,
                    levelAcquired: companion.levelAcquired ?? null,
                    hitPoints: companion.hitPoints ?? null,
                    wounds: companion.wounds ?? 0,
                },
            });

            if (companion.tricks && companion.tricks.length > 0) {
                await tx.characterCompanionTrick.createMany({
                    data: companion.tricks.map((trick) => ({
                        characterCompanionId: created.id,
                        trickId: trick.trickId,
                        timesTrained: trick.timesTrained ?? 1,
                        isBonus: trick.isBonus ?? false,
                        fromPurpose: trick.fromPurpose ?? false,
                    })),
                    skipDuplicates: true,
                });
            }

            if (companion.skills && companion.skills.length > 0) {
                await tx.characterCompanionSkill.createMany({
                    data: companion.skills.map((skill) => ({
                        characterCompanionId: created.id,
                        skillId: skill.skillId,
                        skillSubId: skill.skillSubId ?? null,
                        ranks: skill.ranks,
                    })),
                });
            }

            if (companion.feats && companion.feats.length > 0) {
                await tx.characterCompanionFeat.createMany({
                    data: companion.feats.map((feat) => ({
                        characterCompanionId: created.id,
                        featId: feat.featId,
                        notes: feat.notes ?? null,
                    })),
                });
            }
        }
    }

    if (selectedForms !== undefined) {
        await tx.characterSelectedForm.deleteMany({ where: { characterId } });
        if (selectedForms.length > 0) {
            await tx.characterSelectedForm.createMany({
                data: selectedForms.map((form) => ({
                    characterId,
                    featureId: form.featureId,
                    monsterId: form.monsterId,
                    sortOrder: form.sortOrder ?? 0,
                })),
            });
        }
    }
}

import { persistCharacterCompanionAdvancements } from '@/features/companion/companionAdvancementPersist';
import { Prisma } from '@shared/prisma-client';
import type { CharacterCompanionDraft, CharacterSelectedFormDraft } from '@shared/schema';
import { sumAdvancementHitPoints } from '@shared/static-data';

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
            const advancements = companion.advancements ?? [];
            const created = await tx.characterCompanion.create({
                data: {
                    characterId,
                    monsterId: companion.monsterId,
                    companionId: companion.companionId ?? null,
                    trickPurposeId: companion.trickPurposeId ?? null,
                    name: companion.name ?? null,
                    levelAcquired: companion.levelAcquired ?? null,
                    hitPoints: advancements.length > 0
                        ? sumAdvancementHitPoints(advancements)
                        : (companion.hitPoints ?? null),
                    wounds: companion.wounds ?? 0,
                    maxHpAtFirstLevel: companion.maxHpAtFirstLevel ?? false,
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

            await persistCharacterCompanionAdvancements(tx, created.id, advancements);
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

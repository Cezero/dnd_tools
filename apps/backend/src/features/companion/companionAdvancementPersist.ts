import { Prisma } from '@shared/prisma-client';
import type { CreatureAdvancementDraft, CreatureAdvancementInput } from '@shared/schema';

type AdvancementWrite = CreatureAdvancementDraft | CreatureAdvancementInput;

/**
 * Replaces a companion's HD advancement rows and nested skill/feat assignments.
 */
export async function persistCharacterCompanionAdvancements(
    tx: Prisma.TransactionClient,
    characterCompanionId: number,
    advancements: AdvancementWrite[] | undefined
): Promise<void> {
    await tx.characterCompanionAdvancement.deleteMany({
        where: { characterCompanionId },
    });

    if (!advancements || advancements.length === 0) {
        return;
    }

    for (const row of advancements) {
        const created = await tx.characterCompanionAdvancement.create({
            data: {
                characterCompanionId,
                sequence: row.sequence,
                hitDiceQty: row.hitDiceQty,
                hitDiceType: row.hitDiceType,
                hitPoints: row.hitPoints,
                classId: row.classId ?? null,
                notes: row.notes ?? null,
            },
        });

        const skills = row.skills ?? [];
        if (skills.length > 0) {
            await tx.characterCompanionAdvancementSkill.createMany({
                data: skills.map((skill) => ({
                    advancementId: created.id,
                    skillId: skill.skillId,
                    skillSubId: skill.skillSubId ?? null,
                    ranks: skill.ranks,
                })),
            });
        }

        const feats = row.feats ?? [];
        if (feats.length > 0) {
            await tx.characterCompanionAdvancementFeat.createMany({
                data: feats.map((feat) => ({
                    advancementId: created.id,
                    featId: feat.featId,
                    featSubId: feat.featSubId ?? null,
                    notes: feat.notes ?? null,
                })),
            });
        }
    }
}

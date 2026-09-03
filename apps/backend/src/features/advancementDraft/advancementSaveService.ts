import { prisma } from '@/lib/prisma';
import { resolveMaxFirstLevelHitPointsForClasses } from '@/utils/firstLevelHitPoints';
import { AdvancementEditStateSchema } from '@shared/schema';

import { companionSyncService } from '../companion/companionSyncService';

/**
 * Save service for Advancement draft sessions.
 *
 * Supports:
 * - Updating the persisted current advancement (in-place).
 * - Creating a new advancement row for level-up (draft-only negative id -> persisted id).
 *
 * Does NOT yet support retraining (append-only revision rows for existing levels).
 * TODO(retrain): implement explicit retraining workflow that creates a new (level, version) row.
 */
export class AdvancementSaveService {
    /**
     * Persist an advancement draft to MySQL.
     *
     * @param advancementDraftId - Draft id (negative) or persisted advancement id (positive)
     * @param state - Draft state object (validated via shared schema)
     * @param _userId - User id (reserved for future permission checks)
     *
     * Level 1 with `maxHpAtFirstLevel` writes max HD + CON so a draft value of 0
     * does not persist after character save already applied the official 1st-level HP.
     */
    async saveSessionToMySQL(
        advancementDraftId: number,
        state: Record<string, unknown>,
        _userId: number
    ): Promise<number> {
        const parsed = AdvancementEditStateSchema.parse(state);

        let hitPoints = parsed.hitPoints;
        if (parsed.level === 1 && parsed.classId > 0 && parsed.characterId > 0) {
            const config = await prisma.characterConfig.findUnique({
                where: { characterId: parsed.characterId },
                select: { maxHpAtFirstLevel: true },
            });
            if (config?.maxHpAtFirstLevel ?? false) {
                const abilityScores = await prisma.characterAbilityScore.findMany({
                    where: { characterId: parsed.characterId },
                    select: { abilityId: true, value: true },
                });
                const computedHitPoints = await resolveMaxFirstLevelHitPointsForClasses({
                    primaryClassId: parsed.classId,
                    secondaryClassId: parsed.secondaryClassId,
                    abilityScores,
                });
                if (computedHitPoints !== null) {
                    hitPoints = computedHitPoints;
                }
            }
        }

        // Drafts created during character creation reference a draft-only (negative) characterId.
        // We intentionally do not allow persisting an Advancement without a persisted character.
        // Creation workflow should save Character + Advancement together in one transaction (implemented later).
        if (parsed.characterId < 0) {
            throw new Error(
                'Cannot save an advancement draft for a draft-only character. ' +
                'Save the character draft first (creation workflow persists both together).'
            );
        }

        if (advancementDraftId > 0) {
            // Update existing advancement in-place.
            await prisma.$transaction(async (tx) => {
                await tx.characterAdvancement.update({
                    where: { id: advancementDraftId },
                    data: {
                        classId: parsed.classId,
                        secondaryClassId: parsed.secondaryClassId ?? null,
                        hitPoints,
                        abilityId: parsed.abilityId ?? null,
                        notes: parsed.notes ?? null,
                    },
                });

                // Replace nested collections (draft is authoritative)
                await tx.advancementSkill.deleteMany({ where: { advancementId: advancementDraftId } });
                if (parsed.skills.length > 0) {
                    await tx.advancementSkill.createMany({
                        data: parsed.skills.map((s) => ({
                            advancementId: advancementDraftId,
                            skillId: s.skillId,
                            skillSubId: s.skillSubId ?? null,
                            pointsSpent: s.pointsSpent,
                            customSubtype: s.customSubtype ?? null,
                        })),
                    });
                }

                await tx.advancementFeat.deleteMany({ where: { advancementId: advancementDraftId } });
                if (parsed.feats.length > 0) {
                    await tx.advancementFeat.createMany({
                        data: parsed.feats.map((f) => ({
                            advancementId: advancementDraftId,
                            featId: f.featId,
                            featSubId: f.featSubId ?? null,
                        })),
                    });
                }

                await tx.advancementSpell.deleteMany({ where: { advancementId: advancementDraftId } });
                if (parsed.spellsKnown.length > 0) {
                    await tx.advancementSpell.createMany({
                        data: parsed.spellsKnown.map((s) => ({
                            advancementId: advancementDraftId,
                            spellId: s.spellId,
                            isFreeGrant: s.isFreeGrant ?? false,
                        })),
                    });
                }

                await tx.characterFeatureChoice.deleteMany({ where: { advancementId: advancementDraftId } });
                if (parsed.featureChoices.length > 0) {
                    await tx.characterFeatureChoice.createMany({
                        data: parsed.featureChoices.map((c) => ({
                            characterId: parsed.characterId,
                            advancementId: advancementDraftId,
                            featureId: c.featureId,
                            featureEntityId: c.featureEntityId,
                            appliesToId: c.appliesToId,
                            appliesToSubId: c.appliesToSubId ?? null,
                            choiceIndex: c.choiceIndex ?? null,
                            choiceGroupId: c.choiceGroupId ?? null,
                            choiceData: c.choiceData ?? null,
                            linkedChoiceGroupId: c.linkedChoiceGroupId ?? null,
                        })),
                    });
                }

                // Note: currentAdvancementId was removed from the schema; current advancement is computed.
            });

            await companionSyncService.syncFromFeatureChoices(parsed.characterId);
            return advancementDraftId;
        }

        // Create a new persisted advancement row (level-up draft).
        const createdId = await prisma.$transaction(async (tx) => {
            const created = await tx.characterAdvancement.create({
                data: {
                    characterId: parsed.characterId,
                    level: parsed.level,
                    version: parsed.version ?? 1,
                    classId: parsed.classId,
                    secondaryClassId: parsed.secondaryClassId ?? null,
                    hitPoints,
                    abilityId: parsed.abilityId ?? null,
                    notes: parsed.notes ?? null,
                    skills: parsed.skills.length > 0 ? { create: parsed.skills } : undefined,
                    feats: parsed.feats.length > 0 ? { create: parsed.feats } : undefined,
                    spellsKnown: parsed.spellsKnown.length > 0 ? { create: parsed.spellsKnown } : undefined,
                    featureChoices:
                        parsed.featureChoices.length > 0
                            ? {
                                create: parsed.featureChoices.map((c) => ({
                                    characterId: parsed.characterId,
                                    featureId: c.featureId,
                                    featureEntityId: c.featureEntityId,
                                    appliesToId: c.appliesToId,
                                    appliesToSubId: c.appliesToSubId ?? null,
                                    choiceIndex: c.choiceIndex ?? null,
                                    choiceGroupId: c.choiceGroupId ?? null,
                                    choiceData: c.choiceData ?? null,
                                    linkedChoiceGroupId: c.linkedChoiceGroupId ?? null,
                                })),
                            }
                            : undefined,
                },
                select: { id: true },
            });

            return created.id;
        });

        await companionSyncService.syncFromFeatureChoices(parsed.characterId);
        return createdId;
    }
}


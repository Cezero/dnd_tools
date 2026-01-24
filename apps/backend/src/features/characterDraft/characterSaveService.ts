import { prisma } from '@/lib/prisma';
import type { CharacterEditState } from '@shared/schema';
import { CharacterEditStateSchema } from '@shared/schema';

import { parseDraftState } from '../shared/draftState/draftSaveUtils';

/**
 * Persists `CharacterEditState` (draft edit state) into MySQL.
 *
 * This is used by the draft editing system when saving a Character draft session.
 * The save operation is intentionally scoped to the character configuration and the
 * advancement at `state.level` (skills, feats, and feature choices).
 */
export class CharacterSaveService {
    async saveSessionToMySQL(
        characterId: number,
        state: CharacterEditState | Record<string, unknown>,
        userId: number
    ): Promise<number> {
        const validatedState = parseDraftState(CharacterEditStateSchema.parse, state);

        if (validatedState.raceId === null) {
            throw new Error('Cannot save character: raceId is required.');
        }
        if (validatedState.classId === null) {
            throw new Error('Cannot save character: classId is required.');
        }

        // Hoist required fields into non-null locals so TypeScript narrowing remains valid
        // inside the Prisma transaction callback.
        const raceId = validatedState.raceId;
        const classId = validatedState.classId;

        await prisma.$transaction(async (tx) => {
            const character = await tx.userCharacter.findUnique({
                where: { id: characterId },
                select: { userId: true }
            });

            if (!character) {
                throw new Error(`Character ${characterId} not found`);
            }
            if (character.userId !== userId) {
                throw new Error('Access denied');
            }

            await tx.userCharacter.update({
                where: { id: characterId },
                data: {
                    raceId,
                    editionId: validatedState.editionId,
                    allowVariantClasses: validatedState.allowVariantClasses,
                    ignoreLevelAdjustment: validatedState.ignoreLevelAdjustment,
                    isGestalt: validatedState.isGestalt,
                }
            });

            // Ability scores: upsert to match state
            const existingScores = await tx.userCharacterAbilityScore.findMany({
                where: { characterId }
            });
            const existingMap = new Map(existingScores.map((score) => [score.abilityId, score]));
            const requestedAbilityIds = new Set(validatedState.abilityScores.map((score) => score.abilityId));

            for (const abilityScore of validatedState.abilityScores) {
                const existing = existingMap.get(abilityScore.abilityId);
                if (existing) {
                    if (existing.value !== abilityScore.value) {
                        await tx.userCharacterAbilityScore.update({
                            where: { id: existing.id },
                            data: { value: abilityScore.value },
                        });
                    }
                } else {
                    await tx.userCharacterAbilityScore.create({
                        data: {
                            characterId,
                            abilityId: abilityScore.abilityId,
                            value: abilityScore.value,
                        }
                    });
                }
            }

            const toDelete = existingScores.filter((score) => !requestedAbilityIds.has(score.abilityId));
            if (toDelete.length > 0) {
                await tx.userCharacterAbilityScore.deleteMany({
                    where: { id: { in: toDelete.map((score) => score.id) } }
                });
            }

            // Ensure advancement row exists for the target level (use latest version)
            const secondaryClassId = validatedState.secondaryClassId ?? null;
            const existingAdvancement = await tx.characterAdvancement.findFirst({
                where: { characterId, level: validatedState.level },
                orderBy: { version: 'desc' }
            });

            let advancementId: number;
            if (!existingAdvancement) {
                const created = await tx.characterAdvancement.create({
                    data: {
                        characterId,
                        level: validatedState.level,
                        version: 1,
                        classId,
                        secondaryClassId,
                        hitPoints: 0,
                        abilityId: null,
                        notes: null,
                    }
                });
                advancementId = created.id;
            } else {
                await tx.characterAdvancement.update({
                    where: { id: existingAdvancement.id },
                    data: {
                        classId,
                        secondaryClassId,
                    }
                });
                advancementId = existingAdvancement.id;
            }

            // Replace skills at this level
            await tx.advancementSkill.deleteMany({ where: { advancementId } });
            if (validatedState.skillRanks.length > 0) {
                await tx.advancementSkill.createMany({
                    data: validatedState.skillRanks.map((skill) => ({
                        advancementId,
                        skillId: skill.skillId,
                        skillSubId: skill.skillSubId,
                        customSubtype: skill.customSubtype,
                        pointsSpent: skill.pointsSpent,
                    }))
                });
            }

            // Replace feats at this level (featSubId not currently modeled in CharacterEditState)
            await tx.advancementFeat.deleteMany({ where: { advancementId } });
            const uniqueFeatIds = Array.from(new Set(validatedState.selectedFeats));
            if (uniqueFeatIds.length > 0) {
                await tx.advancementFeat.createMany({
                    data: uniqueFeatIds.map((featId) => ({
                        advancementId,
                        featId,
                        featSubId: null,
                    }))
                });
            }

            // Replace feature choices at this level
            await tx.characterFeatureChoice.deleteMany({ where: { advancementId } });
            if (validatedState.featureChoices.length > 0) {
                const uniqueChoices = new Map<string, typeof validatedState.featureChoices[number]>();
                for (const choice of validatedState.featureChoices) {
                    uniqueChoices.set(`${choice.featureId}-${choice.featureEntityId}`, choice);
                }

                await tx.characterFeatureChoice.createMany({
                    data: Array.from(uniqueChoices.values()).map((choice) => ({
                        characterId,
                        advancementId,
                        featureId: choice.featureId,
                        featureEntityId: choice.featureEntityId,
                        appliesToId: choice.appliesToId,
                        appliesToSubId: choice.appliesToSubId ?? null,
                        choiceIndex: choice.choiceIndex ?? null,
                        choiceGroupId: choice.choiceGroupId ?? null,
                        choiceData: choice.choiceData ?? null,
                        linkedChoiceGroupId: choice.linkedChoiceGroupId ?? null,
                    }))
                });
            }

            // Sync disallowed sources to match state
            await tx.characterDisallowedSource.deleteMany({ where: { characterId } });
            const uniqueSourceBookIds = Array.from(
                new Set(validatedState.disallowedSources.map((s) => s.sourceBookId))
            );
            if (uniqueSourceBookIds.length > 0) {
                await tx.characterDisallowedSource.createMany({
                    data: uniqueSourceBookIds.map((sourceBookId) => ({
                        characterId,
                        sourceBookId
                    }))
                });
            }
        });

        return characterId;
    }
}


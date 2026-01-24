import { prisma } from '@/lib/prisma';
import type { AdvancementEditState, CharacterEditState } from '@shared/schema';
import { AdvancementEditStateSchema, CharacterEditStateSchema } from '@shared/schema';
import { DraftType } from '@shared/static-data';

import { parseDraftState } from '../shared/draftState/draftSaveUtils';
import { DraftStateService } from '../shared/draftState/DraftStateService';

/**
 * Persists `CharacterEditState` (draft edit state) into MySQL.
 *
 * This is used by the draft editing system when saving a Character draft session.
 *
 * NOTE:
 * With the introduction of `DraftType.Advancement`, this save is intentionally scoped
 * to **character-core** fields only (race/config/ability scores/disallowed sources).
 * Advancement decisions are persisted via `AdvancementSaveService` instead.
 */
export class CharacterSaveService {
    async saveSessionToMySQL(
        characterId: number,
        state: CharacterEditState | Record<string, unknown>,
        userId: number,
        context?: unknown
    ): Promise<number> {
        const validatedState = parseDraftState(CharacterEditStateSchema.parse, state);

        if (validatedState.raceId === null) {
            throw new Error('Cannot save character: raceId is required.');
        }

        // Hoist required fields into non-null locals so TypeScript narrowing remains valid
        // inside the Prisma transaction callback.
        const raceId = validatedState.raceId;

        const draftStateService = new DraftStateService();

        // Create workflow: characterId is a draft-only negative id. Create character + level-1 advancement in one transaction.
        if (characterId < 0) {
            const maybeContext = context as { advancementDraftId?: unknown } | undefined;
            const advancementDraftId =
                typeof maybeContext?.advancementDraftId === 'number' ? maybeContext.advancementDraftId : NaN;

            if (Number.isNaN(advancementDraftId) || advancementDraftId === 0) {
                throw new Error('Character draft create save requires context.advancementDraftId');
            }

            const advancementDraftRaw = await draftStateService.getState<Record<string, unknown>>(
                DraftType.Advancement,
                advancementDraftId
            );

            if (!advancementDraftRaw) {
                throw new Error('Advancement draft state not found for create save');
            }

            const advancementDraft: AdvancementEditState = parseDraftState(AdvancementEditStateSchema.parse, advancementDraftRaw);

            if (advancementDraft.characterId !== characterId) {
                throw new Error('Advancement draft does not match character draft id');
            }
            if (advancementDraft.level !== 1) {
                throw new Error('Create save expects level 1 advancement');
            }
            if (advancementDraft.classId < 1) {
                throw new Error('Cannot save character: classId is required.');
            }

            const createdCharacterId = await prisma.$transaction(async (tx) => {
                const createdCharacter = await tx.userCharacter.create({
                    data: {
                        userId,
                        name: validatedState.name,
                        raceId,
                        alignmentId: null,
                        deityId: null,
                        age: null,
                        height: null,
                        weight: null,
                        eyes: null,
                        hair: null,
                        gender: null,
                        notes: null,
                        editionId: validatedState.editionId,
                        allowVariantClasses: validatedState.allowVariantClasses,
                        isGestalt: validatedState.isGestalt,
                        ignoreLevelAdjustment: validatedState.ignoreLevelAdjustment,
                        platinum: 0,
                        gold: 0,
                        silver: 0,
                        copper: 0,
                    },
                    select: { id: true },
                });

                // Ability scores
                if (validatedState.abilityScores.length > 0) {
                    await tx.userCharacterAbilityScore.createMany({
                        data: validatedState.abilityScores.map((a) => ({
                            characterId: createdCharacter.id,
                            abilityId: a.abilityId,
                            value: a.value,
                        })),
                    });
                }

                // Disallowed sources
                const uniqueSourceBookIds = Array.from(
                    new Set(validatedState.disallowedSources.map((s) => s.sourceBookId))
                );
                if (uniqueSourceBookIds.length > 0) {
                    await tx.characterDisallowedSource.createMany({
                        data: uniqueSourceBookIds.map((sourceBookId) => ({
                            characterId: createdCharacter.id,
                            sourceBookId,
                        })),
                    });
                }

                // Create level-1 advancement from the advancement draft
                const createdAdvancement = await tx.characterAdvancement.create({
                    data: {
                        characterId: createdCharacter.id,
                        level: 1,
                        version: 1,
                        classId: advancementDraft.classId,
                        secondaryClassId: advancementDraft.secondaryClassId ?? null,
                        hitPoints: advancementDraft.hitPoints,
                        abilityId: advancementDraft.abilityId ?? null,
                        notes: advancementDraft.notes ?? null,
                        skills: advancementDraft.skills.length > 0 ? { create: advancementDraft.skills } : undefined,
                        feats: advancementDraft.feats.length > 0 ? { create: advancementDraft.feats } : undefined,
                        spellsKnown: advancementDraft.spellsKnown.length > 0 ? { create: advancementDraft.spellsKnown } : undefined,
                        featureChoices:
                            advancementDraft.featureChoices.length > 0
                                ? {
                                    create: advancementDraft.featureChoices.map((c) => ({
                                        characterId: createdCharacter.id,
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

                await tx.userCharacter.update({
                    where: { id: createdCharacter.id },
                    data: { currentAdvancementId: createdAdvancement.id },
                });

                return createdCharacter.id;
            });

            return createdCharacterId;
        }

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
                    name: validatedState.name,
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


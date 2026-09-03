import { prisma } from '@/lib/prisma';
import { resolveMaxFirstLevelHitPointsForClasses } from '@/utils/firstLevelHitPoints';
import type { AdvancementEditState, CharacterEditState } from '@shared/schema';
import { AdvancementEditStateSchema, CharacterEditStateSchema } from '@shared/schema';
import { DraftType } from '@shared/static-data';

import { parseDraftState } from '../shared/draftState/draftSaveUtils';
import { DraftStateService } from '../shared/draftState/DraftStateService';

import { persistCompanionDraftCollections } from './characterCompanionDraftPersist';

/**
 * Persists `CharacterEditState` (draft edit state) into MySQL.
 *
 * This is used by the draft editing system when saving a Character draft session.
 *
 * NOTE:
 * With the introduction of `DraftType.Advancement`, this save is intentionally scoped
 * to **character-core** fields only (race/config/ability scores/disallowed sources).
 * Advancement decisions are persisted via `AdvancementSaveService` instead.
 *
 * `isGestalt` is taken from the character draft, and forced true when the
 * paired advancement has a `secondaryClassId` (gestalt UI can set the class
 * pair even if the config flag never reached Redis).
 *
 * When `maxHpAtFirstLevel` is true, level-1 `hitPoints` is set to max HD + CON
 * (gestalt uses the better hit die). Advancement save must apply the same rule
 * so a later advancement persist does not overwrite with the draft's 0.
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

            const advancementDraft: AdvancementEditState = parseDraftState(
                AdvancementEditStateSchema.parse,
                advancementDraftRaw
            );

            if (advancementDraft.characterId !== characterId) {
                throw new Error('Advancement draft does not match character draft id');
            }
            if (advancementDraft.level !== 1) {
                throw new Error('Create save expects level 1 advancement');
            }
            if (advancementDraft.classId < 1) {
                throw new Error('Cannot save character: classId is required.');
            }

            const hasSecondaryClass =
                advancementDraft.secondaryClassId !== null && advancementDraft.secondaryClassId > 0;
            const isGestalt = validatedState.isGestalt || hasSecondaryClass;

            let level1HitPoints = advancementDraft.hitPoints;
            if (validatedState.maxHpAtFirstLevel) {
                const computedHitPoints = await resolveMaxFirstLevelHitPointsForClasses({
                    primaryClassId: advancementDraft.classId,
                    secondaryClassId: advancementDraft.secondaryClassId,
                    abilityScores: validatedState.abilityScores,
                });
                if (computedHitPoints !== null) {
                    level1HitPoints = computedHitPoints;
                }
            }

            const createdCharacterId = await prisma.$transaction(async (tx) => {
                const createdCharacter = await tx.character.create({
                    data: {
                        userId,
                        name: validatedState.name,
                        raceId,
                        alignmentId: validatedState.alignmentId ?? null,
                        deityId: validatedState.deityId ?? null,
                        age: validatedState.age ?? null,
                        height: validatedState.height ?? null,
                        weight: validatedState.weight ?? null,
                        eyes: validatedState.eyes ?? null,
                        hair: validatedState.hair ?? null,
                        gender: validatedState.gender ?? null,
                        notes: validatedState.notes ?? null,
                        editionId: validatedState.editionId,
                        config: {
                            create: {
                                allowVariantClasses: validatedState.allowVariantClasses,
                                isGestalt,
                                ignoreLevelAdjustment: validatedState.ignoreLevelAdjustment,
                                maxHpAtFirstLevel: validatedState.maxHpAtFirstLevel,
                            },
                        },
                    },
                    select: { id: true },
                });

                // Ability scores
                if (validatedState.abilityScores.length > 0) {
                    await tx.characterAbilityScore.createMany({
                        data: validatedState.abilityScores.map((a) => ({
                            characterId: createdCharacter.id,
                            abilityId: a.abilityId,
                            value: a.value,
                        })),
                    });
                }

                if (validatedState.wealth && validatedState.wealth.length > 0) {
                    await tx.characterWealth.createMany({
                        data: validatedState.wealth.map((w) => ({
                            characterId: createdCharacter.id,
                            currencyId: w.currencyId,
                            quantity: w.quantity,
                            value: w.value ?? null,
                            description: w.description ?? null,
                        })),
                    });
                }

                if (validatedState.characterItems && validatedState.characterItems.length > 0) {
                    await tx.characterItem.createMany({
                        data: validatedState.characterItems.map((item) => ({
                            characterId: createdCharacter.id,
                            baseItemId: item.baseItemId,
                            name: item.name,
                            quantity: item.quantity,
                            location: item.location ?? null,
                        })),
                    });
                }

                if (validatedState.attackDefinitions && validatedState.attackDefinitions.length > 0) {
                    await tx.characterAttackDefinition.createMany({
                        data: validatedState.attackDefinitions.map((attack) => ({
                            characterId: createdCharacter.id,
                            attackSlot: attack.attackSlot ?? null,
                            mainHandCharacterItemId: attack.mainHandCharacterItemId ?? null,
                            offHandCharacterItemId: attack.offHandCharacterItemId ?? null,
                        })),
                    });
                }

                if (validatedState.characterLanguages && validatedState.characterLanguages.length > 0) {
                    await tx.characterLanguageMap.createMany({
                        data: validatedState.characterLanguages.map((lang) => ({
                            characterId: createdCharacter.id,
                            languageId: lang.languageId,
                        })),
                    });
                }

                await persistCompanionDraftCollections(
                    tx,
                    createdCharacter.id,
                    validatedState.companions,
                    validatedState.selectedForms
                );

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
                        hitPoints: level1HitPoints,
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

                return createdCharacter.id;
            });

            return createdCharacterId;
        }

        let level1HitPointsUpdate: { id: number; hitPoints: number } | null = null;
        if (validatedState.maxHpAtFirstLevel) {
            const level1Advancement = await prisma.characterAdvancement.findFirst({
                where: { characterId, level: 1 },
                select: { id: true, classId: true, secondaryClassId: true },
            });
            if (level1Advancement && level1Advancement.classId > 0) {
                const computedHitPoints = await resolveMaxFirstLevelHitPointsForClasses({
                    primaryClassId: level1Advancement.classId,
                    secondaryClassId: level1Advancement.secondaryClassId,
                    abilityScores: validatedState.abilityScores,
                });
                if (computedHitPoints !== null) {
                    level1HitPointsUpdate = { id: level1Advancement.id, hitPoints: computedHitPoints };
                }
            }
        }

        await prisma.$transaction(async (tx) => {
            const character = await tx.character.findUnique({
                where: { id: characterId },
                select: { userId: true }
            });

            if (!character) {
                throw new Error(`Character ${characterId} not found`);
            }
            if (character.userId !== userId) {
                throw new Error('Access denied');
            }

            await tx.character.update({
                where: { id: characterId },
                data: {
                    name: validatedState.name,
                    raceId,
                    editionId: validatedState.editionId,
                    alignmentId: validatedState.alignmentId ?? null,
                    deityId: validatedState.deityId ?? null,
                    age: validatedState.age ?? null,
                    height: validatedState.height ?? null,
                    weight: validatedState.weight ?? null,
                    eyes: validatedState.eyes ?? null,
                    hair: validatedState.hair ?? null,
                    gender: validatedState.gender ?? null,
                    notes: validatedState.notes ?? null,
                }
            });

            const gestaltAdvancement = await tx.characterAdvancement.findFirst({
                where: {
                    characterId,
                    secondaryClassId: { gt: 0 },
                },
                select: { id: true },
            });
            const isGestalt = validatedState.isGestalt || gestaltAdvancement !== null;

            await tx.characterConfig.upsert({
                where: { characterId },
                create: {
                    characterId,
                    allowVariantClasses: validatedState.allowVariantClasses,
                    isGestalt,
                    ignoreLevelAdjustment: validatedState.ignoreLevelAdjustment,
                    maxHpAtFirstLevel: validatedState.maxHpAtFirstLevel,
                },
                update: {
                    allowVariantClasses: validatedState.allowVariantClasses,
                    isGestalt,
                    ignoreLevelAdjustment: validatedState.ignoreLevelAdjustment,
                    maxHpAtFirstLevel: validatedState.maxHpAtFirstLevel,
                },
            });

            if (level1HitPointsUpdate !== null) {
                await tx.characterAdvancement.update({
                    where: { id: level1HitPointsUpdate.id },
                    data: { hitPoints: level1HitPointsUpdate.hitPoints },
                });
            }

            if (validatedState.wealth) {
                await tx.characterWealth.deleteMany({ where: { characterId } });
                if (validatedState.wealth.length > 0) {
                    await tx.characterWealth.createMany({
                        data: validatedState.wealth.map((w) => ({
                            characterId,
                            currencyId: w.currencyId,
                            quantity: w.quantity,
                            value: w.value ?? null,
                            description: w.description ?? null,
                        })),
                    });
                }
            }

            // Ability scores: upsert to match state
            const existingScores = await tx.characterAbilityScore.findMany({
                where: { characterId }
            });
            const existingMap = new Map(existingScores.map((score) => [score.abilityId, score]));
            const requestedAbilityIds = new Set(validatedState.abilityScores.map((score) => score.abilityId));

            for (const abilityScore of validatedState.abilityScores) {
                const existing = existingMap.get(abilityScore.abilityId);
                if (existing) {
                    if (existing.value !== abilityScore.value) {
                        await tx.characterAbilityScore.update({
                            where: { id: existing.id },
                            data: { value: abilityScore.value },
                        });
                    }
                } else {
                    await tx.characterAbilityScore.create({
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
                await tx.characterAbilityScore.deleteMany({
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

            if (validatedState.characterItems) {
                await tx.characterItem.deleteMany({ where: { characterId } });
                if (validatedState.characterItems.length > 0) {
                    await tx.characterItem.createMany({
                        data: validatedState.characterItems.map((item) => ({
                            characterId,
                            baseItemId: item.baseItemId,
                            name: item.name,
                            quantity: item.quantity,
                            location: item.location ?? null,
                        })),
                    });
                }
            }

            if (validatedState.attackDefinitions) {
                await tx.characterAttackDefinition.deleteMany({ where: { characterId } });
                if (validatedState.attackDefinitions.length > 0) {
                    await tx.characterAttackDefinition.createMany({
                        data: validatedState.attackDefinitions.map((attack) => ({
                            characterId,
                            attackSlot: attack.attackSlot ?? null,
                            mainHandCharacterItemId: attack.mainHandCharacterItemId ?? null,
                            offHandCharacterItemId: attack.offHandCharacterItemId ?? null,
                        })),
                    });
                }
            }

            if (validatedState.characterLanguages) {
                await tx.characterLanguageMap.deleteMany({ where: { characterId } });
                if (validatedState.characterLanguages.length > 0) {
                    await tx.characterLanguageMap.createMany({
                        data: validatedState.characterLanguages.map((lang) => ({
                            characterId,
                            languageId: lang.languageId,
                        })),
                    });
                }
            }

            await persistCompanionDraftCollections(
                tx,
                characterId,
                validatedState.companions,
                validatedState.selectedForms
            );
        });

        return characterId;
    }
}


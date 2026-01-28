import { applyFeatureFormula } from '@/lib/character-calculation/utils/formulaApplier';
import { extractSaveProgression } from '@/lib/feature-extraction/classMechanicsExtractor';
import type { CharacterWithAllDetailsResponse, FeatureWithRelations, DnDClass } from '@shared/schema';
import { AbilityId, GetAbilityModifier, ABILITY_MAP, ProgressionType, EntityAppliesToType, EntityType, SavingThrowId, FeatureSourceType } from '@shared/static-data';

import { getAbilityScore } from './abilityScore';
import type { CalculationResult, BreakdownMap, BreakdownComponent } from '../types';
import { createBreakdownComponent, createFeatBreakdownComponent, createFeatureBreakdownComponent, createItemBreakdownComponent } from '../utils/breakdownBuilder';
import { resolveStandardBonuses, buildCalculationResult } from '../utils/calculationHelpers';

/**
 * Save type enum
 */
export const SaveType = {
    Fortitude: 1,
    Reflex: 2,
    Will: 3,
} as const;

/**
 * Breakdown map for saving throw
 */
export interface SavingThrowBreakdownMap extends BreakdownMap {
    base: BreakdownComponent;
    abilityMod: BreakdownComponent;
    feat: BreakdownComponent;
    feature: BreakdownComponent;
    item: BreakdownComponent;
}

/**
 * Get saving throw modifier
 * 
 * Uses pre-resolved formula values from backend when available (resolvedFormulaValues map).
 * Falls back to calculating directly from formula entities if resolved values not available.
 */
export function getSavingThrow(
    character: CharacterWithAllDetailsResponse,
    saveType: number,
    resolvedProgressions: FeatureWithRelations[],
    classDetailsMap: Map<number, DnDClass>,
    resolvedFormulaValues?: Record<string, number>
): CalculationResult<SavingThrowBreakdownMap> {
    // Determine ability score for this save
    let abilityId: number;
    if (saveType === SaveType.Fortitude) {
        abilityId = AbilityId.Constitution;
    } else if (saveType === SaveType.Reflex) {
        abilityId = AbilityId.Dexterity;
    } else {
        abilityId = AbilityId.Wisdom; // Will
    }

    // Get ability modifier using total ability score (base + racial modifiers + feat bonuses, etc.)
    const abilityScoreResult = getAbilityScore(character, abilityId, resolvedProgressions);
    const abilityTotalValue = abilityScoreResult.value;
    const abilityMod = GetAbilityModifier(abilityTotalValue);

    // Check if character is gestalt
    const isGestalt =
        (character.config?.isGestalt ?? false) ||
        character.advancements.some((adv) => adv.secondaryClassId !== null && adv.secondaryClassId !== 0);

    // Map saveType to SavingThrowId
    let savingThrowId: SavingThrowId;
    if (saveType === SaveType.Fortitude) {
        savingThrowId = SavingThrowId.Fortitude;
    } else if (saveType === SaveType.Reflex) {
        savingThrowId = SavingThrowId.Reflex;
    } else {
        savingThrowId = SavingThrowId.Will;
    }

    let baseSave = 0;

    // Try to use pre-resolved values first
    if (resolvedFormulaValues) {
        // Find save entities for this save type in resolved features
        const saveEntities: Array<{ entityId: number; feature: FeatureWithRelations }> = [];
        for (const feature of resolvedProgressions) {
            if (feature.entities) {
                for (const entity of feature.entities) {
                    if (entity.appliesTo === EntityAppliesToType.SavingThrow &&
                        entity.appliesToId === savingThrowId &&
                        entity.formulaParams) {
                        saveEntities.push({ entityId: entity.id, feature });
                    }
                }
            }
        }

        // Try to use pre-resolved values first
        if (resolvedFormulaValues) {
            const saveKey = `save_${savingThrowId}`;
            const resolvedSave = resolvedFormulaValues[saveKey];
            if (resolvedSave !== undefined) {
                baseSave = resolvedSave;
            }
        }
    }

    // Fallback: if no resolved values found
    if (baseSave === 0) {
        if (isGestalt) {
            // For gestalt, backend has already filtered to include only the best save feature
            // Use total character level with the best feature from resolved features
            const totalLevel = character.advancements.length;

            if (resolvedProgressions && resolvedProgressions.length > 0) {
                // Find the best save feature from resolved features
                // For gestalt, filter by sourceType and EntityType instead of feature slug
                const classProgressions = resolvedProgressions.filter(p =>
                    p.sourceType === FeatureSourceType.Class &&
                    p.entities?.some(e =>
                        e.type === EntityType.Base &&
                        e.appliesTo === EntityAppliesToType.SavingThrow &&
                        e.appliesToId === savingThrowId
                    )
                );

                if (classProgressions.length > 0) {
                    // Calculate save directly from formula entities
                    for (const feature of classProgressions) {
                        if (feature.entities) {
                            for (const entity of feature.entities) {
                                if (entity.type === EntityType.Base &&
                                    entity.appliesTo === EntityAppliesToType.SavingThrow &&
                                    entity.appliesToId === savingThrowId &&
                                    entity.formulaParams) {
                                    const saveValue = applyFeatureFormula(entity, character, totalLevel);
                                    if (saveValue !== null && saveValue !== undefined) {
                                        baseSave = saveValue;
                                        break; // Only use first matching entity per feature
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // Non-gestalt multiclass: sum saves from all classes
            const classLevelCounts = new Map<number, number>();
            for (const advancement of character.advancements) {
                const currentLevel = classLevelCounts.get(advancement.classId) ?? 0;
                classLevelCounts.set(advancement.classId, currentLevel + 1);
            }

            // Calculate base save from class features
            for (const [classId, level] of classLevelCounts.entries()) {
                const classDetails = classDetailsMap.get(classId);
                if (!classDetails) continue;

                // Calculate save directly from formula entities
                const classProgressions = resolvedProgressions.filter(p =>
                    p.sourceType === FeatureSourceType.Class &&
                    p.classes?.some(c => c.classId === classId) &&
                    p.entities?.some(e =>
                        e.type === EntityType.Base &&
                        e.appliesTo === EntityAppliesToType.SavingThrow &&
                        e.appliesToId === savingThrowId
                    )
                );

                for (const feature of classProgressions) {
                    if (feature.entities) {
                        for (const entity of feature.entities) {
                            if (entity.type === EntityType.Base &&
                                entity.appliesTo === EntityAppliesToType.SavingThrow &&
                                entity.appliesToId === savingThrowId &&
                                entity.formulaParams) {
                                const saveValue = applyFeatureFormula(entity, character, level);
                                if (saveValue !== null && saveValue !== undefined) {
                                    baseSave += saveValue;
                                    break; // Only use first matching entity per feature
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Get standard bonuses (feat and feature)
    // Note: FeatBenefitContext doesn't support saveType filtering, but EntityAppliesToType.SavingThrow is sufficient
    const { featBonus, featureBonus, featBenefits, featureBonuses } = resolveStandardBonuses(
        character,
        EntityAppliesToType.SavingThrow,
        resolvedProgressions
    );

    // Item bonuses (would come from equipped items)
    const itemBonus = 0; // TODO: Implement item bonus resolution

    // Calculate total
    const total = baseSave + abilityMod + featBonus + featureBonus + itemBonus;

    // Build breakdown
    const breakdown: SavingThrowBreakdownMap = {
        base: createBreakdownComponent(baseSave, 'base save', 'base'),
        abilityMod: createBreakdownComponent(
            abilityMod,
            `${ABILITY_MAP[abilityId]?.abbreviation ?? 'MOD'} modifier`,
            'ability',
            abilityId
        ),
        feat: createFeatBreakdownComponent(featBonus, featBenefits),
        feature: createFeatureBreakdownComponent(featureBonus, featureBonuses),
        item: createItemBreakdownComponent(itemBonus),
    };

    return buildCalculationResult(total, breakdown, 'Saving Throw');
}


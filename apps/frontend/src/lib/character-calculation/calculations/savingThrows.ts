import { extractSaveProgression } from '@/lib/feature-extraction/classMechanicsExtractor';
import type { CharacterWithAllDetailsResponse, FeatureProgression, DnDClass } from '@shared/schema';
import { AbilityId, GetAbilityModifier, ABILITY_MAP, ProgressionType, EntityAppliesToType, SavingThrowId, FeatureSourceType } from '@shared/static-data';
import { getSaveProgression } from '@shared/utils';

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
 */
export function getSavingThrow(
    character: CharacterWithAllDetailsResponse,
    saveType: number,
    resolvedProgressions: FeatureProgression[],
    classDetailsMap: Map<number, DnDClass>
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
    const isGestalt = character.isGestalt || character.advancements.some(adv => adv.secondaryClassId !== null && adv.secondaryClassId !== 0);

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

    if (isGestalt) {
        // For gestalt, backend has already filtered to include only the best save progression
        // Use total character level with the best progression from resolved progressions
        const totalLevel = character.advancements.length;
        
        if (resolvedProgressions && resolvedProgressions.length > 0) {
            // Find the best save progression from resolved progressions
            // For gestalt, there should only be one class-mechanics progression with the best saves
            const classMechanicsProgressions = resolvedProgressions.filter(p =>
                p.feature?.slug === 'class-mechanics' &&
                p.sourceType === FeatureSourceType.Class
            );
            
            if (classMechanicsProgressions.length > 0) {
                // Extract save progression from the first class-mechanics progression (should be the merged/best one)
                const progression = extractSaveProgression(classMechanicsProgressions, savingThrowId);
                if (progression !== null && progression !== undefined) {
                    if (progression === ProgressionType.good || progression === ProgressionType.poor) {
                        baseSave = getSaveProgression(totalLevel, progression);
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

        // Calculate base save from class progressions
        for (const [classId, level] of classLevelCounts.entries()) {
            const classDetails = classDetailsMap.get(classId);
            if (!classDetails) continue;

            // Extract progression from resolved progressions (class-mechanics feature)
            const classProgressions = resolvedProgressions.filter(p =>
                p.sourceType === FeatureSourceType.Class &&
                p.classes?.some(c => c.classId === classId)
            );
            const progression = extractSaveProgression(classProgressions, savingThrowId, classId);

            // Check for progression value - must check !== undefined, not truthy (0 is valid for good)
            if (progression !== undefined && progression !== null) {
                // Use existing getSaveProgression utility function
                if (progression === ProgressionType.good || progression === ProgressionType.poor) {
                    baseSave += getSaveProgression(level, progression);
                }
                // progression === 1 (average) is not used in D&D 3.5, skip it
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


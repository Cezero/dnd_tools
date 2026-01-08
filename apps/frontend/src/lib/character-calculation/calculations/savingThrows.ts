import type { CharacterWithAllDetailsResponse, FeatureProgression, DnDClass, Feat } from '@shared/schema';
import { AbilityId, GetAbilityModifier, ABILITY_MAP, ProgressionType, FeatBenefitType, EntityAppliesToType } from '@shared/static-data';
import { getSaveProgression } from '@shared/utils';

import { resolveFeatBenefits } from '../core/featBenefitResolver';
import { resolveFeatureBonuses } from '../core/featureBonusResolver';
import { getAbilityScore } from './abilityScore';
import type { CalculationResult, BreakdownMap, BreakdownComponent } from '../types';
import { buildBreakdownString, createBreakdownComponent } from '../utils/breakdownBuilder';

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
    classDetailsMap: Map<number, DnDClass>,
    featsMap?: Map<number, Feat>
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
    const abilityScoreResult = getAbilityScore(character, abilityId, resolvedProgressions, featsMap);
    const abilityTotalValue = abilityScoreResult.value;
    const abilityMod = GetAbilityModifier(abilityTotalValue);

    // Calculate base save from class levels
    // TODO: Implement proper base save calculation from class progressions
    let baseSave = 0;
    const classLevelCounts = new Map<number, number>();
    for (const advancement of character.advancements) {
        const currentLevel = classLevelCounts.get(advancement.classId) ?? 0;
        classLevelCounts.set(advancement.classId, currentLevel + 1);
    }

    // Calculate base save from class progressions using existing utility functions
    for (const [classId, level] of classLevelCounts.entries()) {
        const classDetails = classDetailsMap.get(classId);
        if (!classDetails) continue;

        let progression: number | undefined;
        if (saveType === SaveType.Fortitude) {
            progression = classDetails.fortProgression;
        } else if (saveType === SaveType.Reflex) {
            progression = classDetails.refProgression;
        } else {
            progression = classDetails.willProgression;
        }

        // Check for progression value - must check !== undefined, not truthy (0 is valid for good)
        if (progression !== undefined && progression !== null) {
            // Use existing getSaveProgression utility function
            if (progression === ProgressionType.good || progression === ProgressionType.poor) {
                baseSave += getSaveProgression(level, progression);
            }
            // progression === 1 (average) is not used in D&D 3.5, skip it
        }
    }

    // Get feat benefits
    // Note: FeatBenefitContext doesn't support saveType filtering, but FeatBenefitType.SAVE is sufficient
    const featBenefits = resolveFeatBenefits(
        character,
        FeatBenefitType.SAVE,
        undefined,
        featsMap,
        resolvedProgressions
    );
    const featBonus = featBenefits.reduce((sum, b) => sum + b.amount, 0);

    // Get feature bonuses
    // Note: Feature bonus context doesn't support saveType filtering
    const featureBonuses = resolveFeatureBonuses(
        resolvedProgressions,
        EntityAppliesToType.SavingThrow,
        character,
        character.advancements.length
    );
    const featureBonus = featureBonuses.reduce((sum, b) => sum + b.value, 0);

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
        feat: createBreakdownComponent(
            featBonus,
            featBonus > 0 ? `Feat: ${featBenefits.map(b => b.source.name).join(', ')}` : null,
            featBonus > 0 ? 'feat' : null,
            featBenefits[0]?.source.id
        ),
        feature: createBreakdownComponent(
            featureBonus,
            featureBonus > 0 ? `Feature: ${featureBonuses.map(b => b.source.name).join(', ')}` : null,
            featureBonus > 0 ? 'feature' : null,
            featureBonuses[0]?.source.id
        ),
        item: createBreakdownComponent(itemBonus, itemBonus > 0 ? 'item' : null, itemBonus > 0 ? 'item' : null),
    };

    const breakdownString = buildBreakdownString(breakdown);

    return {
        value: total,
        breakdownString: `Saving Throw: ${breakdownString}`,
        breakdown,
    };
}


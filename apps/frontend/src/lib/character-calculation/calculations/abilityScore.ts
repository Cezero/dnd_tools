import type { CharacterWithAllDetailsResponse, FeatureWithRelations } from '@shared/schema';
import { AbilityId, GetAbilityModifier, EntityAppliesToType, EntityType } from '@shared/static-data';

import type { CalculationResult, BreakdownMap, BreakdownComponent } from '../types';
import { createBreakdownComponent, createFeatBreakdownComponent, createFeatureBreakdownComponent, createItemBreakdownComponent } from '../utils/breakdownBuilder';
import { resolveStandardBonuses, buildCalculationResult } from '../utils/calculationHelpers';

/**
 * Breakdown map for ability score calculation.
 * 
 * Follows the standard breakdown component architecture pattern:
 * - Extends BreakdownMap to ensure compatibility with breakdown utilities
 * - Uses BreakdownComponent for all fields (not custom inline types or TypedBreakdownComponent)
 * 
 * @see {@link BreakdownComponent} for the standard breakdown component structure
 * @see {@link BreakdownMap} for the base breakdown map interface
 */
export interface AbilityScoreBreakdownMap extends BreakdownMap {
    base: BreakdownComponent;
    advancement: BreakdownComponent;
    feat: BreakdownComponent;
    feature: BreakdownComponent;
    item: BreakdownComponent;
}

/**
 * Get ability score with all bonuses applied
 */
export function getAbilityScore(
    character: CharacterWithAllDetailsResponse,
    abilityId: number,
    resolvedProgressions: FeatureWithRelations[]
): CalculationResult<AbilityScoreBreakdownMap> {
    // Get base ability score
    const abilityScore = character.abilityScores.find(a => a.abilityId === abilityId);
    const baseValue = abilityScore?.value ?? 10;

    // Sum advancement bonuses (ability score improvements from feature choices)
    // Count feature choices where appliesTo = Ability and appliesToId = abilityId
    let advancementBonus = 0;
    for (const advancement of character.advancements) {
        if (advancement.featureChoices) {
            for (const choice of advancement.featureChoices) {
                // Check if this is an ability score increase choice for this ability
                if (choice.appliesToId === abilityId) {
                    // Verify this choice is for an ability score increase entity
                    // by checking resolved features for matching entity
                    const matchingProgression = resolvedProgressions.find(
                        p => p.id === choice.featureId
                    );
                    if (matchingProgression?.entities) {
                        const matchingEntity = matchingProgression.entities.find(
                            e => e.id === choice.featureEntityId &&
                                e.type === EntityType.Choice &&
                                e.appliesTo === EntityAppliesToType.Ability
                        );
                        if (matchingEntity) {
                            advancementBonus += 1; // Each ability score increase adds +1
                        }
                    }
                }
            }
        }
        // Also check abilityId field (for characters not yet using feature choices)
        if (advancement.abilityId === abilityId) {
            advancementBonus += 1;
        }
    }

    // Get standard bonuses (feat and feature)
    const { featBonus, featureBonus, featBenefits, featureBonuses } = resolveStandardBonuses(
        character,
        EntityAppliesToType.Ability,
        resolvedProgressions,
        { abilityId }
    );

    // Item bonuses (would come from equipped items)
    const itemBonus = 0; // TODO: Implement item bonus resolution

    // Calculate total
    const total = baseValue + advancementBonus + featBonus + featureBonus + itemBonus;

    // Build breakdown
    const breakdown: AbilityScoreBreakdownMap = {
        base: createBreakdownComponent(baseValue, 'base', 'base'),
        advancement: createBreakdownComponent(
            advancementBonus,
            advancementBonus > 0 ? 'ability score improvements' : null,
            'advancement'
        ),
        feat: createFeatBreakdownComponent(featBonus, featBenefits),
        feature: createFeatureBreakdownComponent(featureBonus, featureBonuses),
        item: createItemBreakdownComponent(itemBonus),
    };

    return buildCalculationResult(total, breakdown, 'Ability Score');
}

/**
 * Get ability modifier with all bonuses applied
 */
export function getAbilityModifierWithBonuses(
    character: CharacterWithAllDetailsResponse,
    abilityId: number,
    resolvedProgressions: FeatureWithRelations[]
): number {
    const result = getAbilityScore(character, abilityId, resolvedProgressions);
    return GetAbilityModifier(result.value);
}


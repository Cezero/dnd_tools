import type { CharacterWithAllDetailsResponse, FeatureWithRelations } from '@shared/schema';
import { AbilityId, GetAbilityModifier, EntityAppliesToType } from '@shared/static-data';

import { getAbilityScore } from './abilityScore';
import type { CalculationResult, BreakdownMap, BreakdownComponent } from '../types';
import { createBreakdownComponent, createFeatBreakdownComponent, createFeatureBreakdownComponent, createItemBreakdownComponent } from '../utils/breakdownBuilder';
import { resolveStandardBonuses, buildCalculationResult } from '../utils/calculationHelpers';

/**
 * Breakdown map for initiative calculation.
 * 
 * Follows the standard breakdown component architecture pattern:
 * - Extends BreakdownMap to ensure compatibility with breakdown utilities
 * - Uses BreakdownComponent for all fields (not custom inline types)
 * 
 * @see {@link BreakdownComponent} for the standard breakdown component structure
 * @see {@link BreakdownMap} for the base breakdown map interface
 */
export interface InitiativeBreakdownMap extends BreakdownMap {
    dexMod: BreakdownComponent;
    feat: BreakdownComponent;
    feature: BreakdownComponent;
    item: BreakdownComponent;
}

/**
 * Get initiative modifier
 */
export function getInitiative(
    character: CharacterWithAllDetailsResponse,
    resolvedProgressions: FeatureWithRelations[]
): CalculationResult<InitiativeBreakdownMap> {
    // Get Dex modifier using total ability score (base + racial modifiers + feat bonuses, etc.)
    const dexScoreResult = getAbilityScore(character, AbilityId.Dexterity, resolvedProgressions);
    const dexTotalValue = dexScoreResult.value;
    const dexMod = GetAbilityModifier(dexTotalValue);

    // Get standard bonuses (feat and feature)
    const { featBonus, featureBonus, featBenefits, featureBonuses } = resolveStandardBonuses(
        character,
        EntityAppliesToType.Initiative,
        resolvedProgressions
    );

    // Item bonuses (would come from equipped items)
    const itemBonus = 0; // TODO: Implement item bonus resolution

    // Calculate total
    const total = dexMod + featBonus + featureBonus + itemBonus;

    // Build breakdown
    const breakdown: InitiativeBreakdownMap = {
        dexMod: createBreakdownComponent(dexMod, 'Dex modifier', 'ability', AbilityId.Dexterity),
        feat: createFeatBreakdownComponent(featBonus, featBenefits),
        feature: createFeatureBreakdownComponent(featureBonus, featureBonuses),
        item: createItemBreakdownComponent(itemBonus),
    };

    return buildCalculationResult(total, breakdown, 'Initiative');
}


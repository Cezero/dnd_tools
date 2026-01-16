import { extractRaceMechanicsFromResolved } from '@/lib/feature-extraction/raceMechanicsExtractor';
import type { CharacterWithAllDetailsResponse, FeatureProgression, Race } from '@shared/schema';
import { EntityAppliesToType, FeatureSourceType } from '@shared/static-data';

import type { CalculationResult, BreakdownMap, BreakdownComponent } from '../types';
import { createBreakdownComponent, createFeatBreakdownComponent, createFeatureBreakdownComponent, createItemBreakdownComponent } from '../utils/breakdownBuilder';
import { resolveStandardBonuses, buildCalculationResult } from '../utils/calculationHelpers';


/**
 * Breakdown map for speed
 */
export interface SpeedBreakdownMap extends BreakdownMap {
    base: BreakdownComponent;
    feat: BreakdownComponent;
    feature: BreakdownComponent;
    item: BreakdownComponent;
}

/**
 * Get movement speed
 */
export function getSpeed(
    character: CharacterWithAllDetailsResponse,
    resolvedProgressions: FeatureProgression[],
    race: Race | null
): CalculationResult<SpeedBreakdownMap> {
    // Extract base speed from resolved progressions (race-mechanics feature)
    const raceMechanics = extractRaceMechanicsFromResolved(resolvedProgressions);
    const baseSpeed = raceMechanics.speed ?? 30;

    // Get standard bonuses (feat and feature)
    // Note: Speed might not have a specific feat benefit type, this is a placeholder
    const { featBonus, featureBonus, featBenefits, featureBonuses } = resolveStandardBonuses(
        character,
        EntityAppliesToType.MovementSpeed,
        resolvedProgressions
    );

    // Item bonuses (would come from equipped items)
    const itemBonus = 0; // TODO: Implement item bonus resolution

    // Calculate total
    const total = baseSpeed + featBonus + featureBonus + itemBonus;

    // Build breakdown
    const breakdown: SpeedBreakdownMap = {
        base: createBreakdownComponent(baseSpeed, race?.name ?? 'base', 'base'),
        feat: createFeatBreakdownComponent(featBonus, featBenefits),
        feature: createFeatureBreakdownComponent(featureBonus, featureBonuses),
        item: createItemBreakdownComponent(itemBonus),
    };

    // Override breakdown string to add "ft." unit
    const result = buildCalculationResult(total, breakdown, 'Speed');
    return {
        ...result,
        breakdownString: `${result.breakdownString} ft.`,
    };
}


import type { CharacterWithAllDetailsResponse, FeatureProgression, Race } from '@shared/schema';
import { EntityAppliesToType } from '@shared/static-data';

import { resolveFeatureBonuses } from '../core/featureBonusResolver';
import type { CalculationResult, BreakdownMap, BreakdownComponent } from '../types';
import { buildBreakdownString, createBreakdownComponent } from '../utils/breakdownBuilder';


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
    // Get base speed from race (default 30 if not available)
    const baseSpeed = race?.speed ?? 30;

    // Get feat benefits (if any feats affect speed)
    // Note: Speed might not have a specific feat benefit type, this is a placeholder
    const featBonus = 0; // TODO: Check if there's a speed-related feat benefit type

    // Get feature bonuses
    const featureBonuses = resolveFeatureBonuses(
        resolvedProgressions,
        EntityAppliesToType.MovementSpeed,
        character,
        character.advancements.length
    );
    const featureBonus = featureBonuses.reduce((sum, b) => sum + b.value, 0);

    // Item bonuses (would come from equipped items)
    const itemBonus = 0; // TODO: Implement item bonus resolution

    // Calculate total
    const total = baseSpeed + featBonus + featureBonus + itemBonus;

    // Build breakdown
    const breakdown: SpeedBreakdownMap = {
        base: createBreakdownComponent(baseSpeed, race?.name ?? 'base', 'base'),
        feat: createBreakdownComponent(featBonus, featBonus > 0 ? 'feat' : null, featBonus > 0 ? 'feat' : null),
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
        breakdownString: `Speed: ${breakdownString} ft.`,
        breakdown,
    };
}


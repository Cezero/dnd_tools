import type { CharacterWithAllDetailsResponse, FeatureWithRelations } from '@shared/schema';
import { EntityAppliesToType } from '@shared/static-data';

import { resolveFeatBenefits } from '../core/featBenefitResolver';
import { resolveFeatureBonuses } from '../core/featureBonusResolver';
import type { FeatBenefit, FeatBenefitContext, FeatureBonus, BreakdownMap, CalculationResult } from '../types';
import { buildBreakdownString } from './breakdownBuilder';

/**
 * Resolve standard feat and feature bonuses for a calculation.
 * 
 * This utility function centralizes the common pattern of resolving feat benefits
 * and feature bonuses for calculation functions, eliminating duplicate code.
 * 
 * @param character - The character to calculate bonuses for
 * @param appliesTo - The EntityAppliesToType this calculation applies to
 * @param resolvedProgressions - Resolved feature features for the character
 * @param context - Optional context for feat benefit resolution (e.g., abilityId, itemId)
 * @returns Object containing feat bonus, feature bonus, and the raw benefit arrays
 * 
 * @example
 * ```typescript
 * const { featBonus, featureBonus, featBenefits, featureBonuses } = resolveStandardBonuses(
 *     character,
 *     EntityAppliesToType.Initiative,
 *     resolvedProgressions
 * );
 * ```
 */
export function resolveStandardBonuses(
    character: CharacterWithAllDetailsResponse,
    appliesTo: EntityAppliesToType,
    resolvedProgressions: FeatureWithRelations[],
    context?: FeatBenefitContext | { abilityId?: number }
): {
    featBonus: number;
    featureBonus: number;
    featBenefits: FeatBenefit[];
    featureBonuses: FeatureBonus[];
} {
    // Get feat benefits
    const featBenefits = resolveFeatBenefits(
        character,
        appliesTo,
        context,
        resolvedProgressions
    );
    const featBonus = featBenefits.reduce((sum, b) => sum + b.amount, 0);

    // Get feature bonuses
    const featureBonuses = resolveFeatureBonuses(
        resolvedProgressions,
        appliesTo,
        character,
        character.advancements.length,
        context
    );
    const featureBonus = featureBonuses.reduce((sum, b) => sum + b.value, 0);

    return {
        featBonus,
        featureBonus,
        featBenefits,
        featureBonuses,
    };
}

/**
 * Build a calculation result with standardized breakdown string formatting.
 * 
 * This utility function centralizes the common pattern of building CalculationResult
 * objects, ensuring consistent breakdown string formatting across all calculations.
 * 
 * @param total - The total calculated value
 * @param breakdown - The breakdown map for this calculation
 * @param calculationName - The name of the calculation (e.g., "Initiative", "AC")
 * @param formulaModifications - Optional formula modifications to include
 * @returns A CalculationResult with properly formatted breakdown string
 * 
 * @example
 * ```typescript
 * return buildCalculationResult(total, breakdown, 'Initiative');
 * ```
 */
export function buildCalculationResult<T extends BreakdownMap>(
    total: number,
    breakdown: T,
    calculationName: string,
    formulaModifications?: CalculationResult<T>['formulaModifications']
): CalculationResult<T> {
    const breakdownString = buildBreakdownString(breakdown);

    return {
        value: total,
        breakdownString: `${calculationName}: ${breakdownString}`,
        breakdown,
        ...(formulaModifications ? { formulaModifications } : {}),
    };
}

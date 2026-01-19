import type { FormulaParamsData } from '@shared/schema';

import type { DisplayContext } from './types';

/**
 * Shared utility for building formula parameters
 * Consolidates the logic from calculators.ts and display-strategies.ts
 */
export function buildFormulaParams(
    formula: FormulaParamsData,
    level: number,
    startLevel: number,
    context?: DisplayContext,
    modifierValue?: number
): Record<string, unknown> {
    // Use the formula object directly and add the additional parameters
    // scalingValue comes from entity.value (modifierValue parameter), default to 1 if not provided
    const scalingValue = modifierValue !== undefined ? modifierValue : 1;

    const params: Record<string, unknown> = {
        ...formula,
        level,
        startLevel,
        scalingValue,
        baseValue: modifierValue !== undefined ? modifierValue : 1, // Add baseValue for Ability-based formulas
        context // Pass context to formulas
    };

    return params;
}

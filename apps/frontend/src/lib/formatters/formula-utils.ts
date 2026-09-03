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
    const scalingValue = modifierValue !== undefined ? modifierValue : 1;
    const baseValue = modifierValue !== undefined ? modifierValue : 1;

    const params: Record<string, unknown> = {
        ...formula,
        level,
        startLevel,
        scalingValue,
        baseValue,
        startingValue: formula.startingValue ?? undefined,
        context
    };

    return params;
}

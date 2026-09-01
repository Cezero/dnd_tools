import type { FormulaParamsData } from '@shared/schema';
import { FormulaId } from '@shared/static-data';

import type { DisplayContext } from './types';

/**
 * Shared utility for building formula parameters
 * Consolidates the logic from calculators.ts and display-strategies.ts
 *
 * For spell-slot formulas (SPELL_SLOTS_TRIANGULAR, SPELL_SLOTS_LINEAR):
 * - baseValue = starting slots (from formulaParams.baseValue)
 * - scalingValue = cap (from formulaParams.maxValue; fallback entity.value for backward compatibility)
 * For other formulas, modifierValue is used as both baseValue and scalingValue where applicable.
 */
export function buildFormulaParams(
    formula: FormulaParamsData,
    level: number,
    startLevel: number,
    context?: DisplayContext,
    modifierValue?: number
): Record<string, unknown> {
    const formulaId = formula.formulaId;
    const isSpellSlotsFormula =
        formulaId === FormulaId.SPELL_SLOTS_TRIANGULAR || formulaId === FormulaId.SPELL_SLOTS_LINEAR;

    // scalingValue: spell-slot formulas use formulaParams.maxValue (cap), others use entity.value
    const scalingValue = isSpellSlotsFormula
        ? (formula.maxValue ?? modifierValue ?? 1)
        : (modifierValue !== undefined ? modifierValue : 1);

    // baseValue: for spell-slot formulas use formulaParams.baseValue (starting slots); otherwise use modifierValue
    const baseValue = isSpellSlotsFormula
        ? (formula.baseValue !== null && formula.baseValue !== undefined ? formula.baseValue : 1)
        : (modifierValue !== undefined ? modifierValue : 1);

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

import type { FeatureFormulaParams } from '@shared/schema';
import { FormulaId, ProgressionType } from '@shared/static-data';

/**
 * Reverse lookup: Determine BAB ProgressionType from formula params
 * Used for backward compatibility when extracting mechanics for display/editing
 */
export function getBABProgressionTypeFromFormula(
    formulaParams: FeatureFormulaParams | null | undefined,
    entityValue: number | null | undefined
): ProgressionType | null {
    if (!formulaParams) return null;

    if (formulaParams.formulaId === FormulaId.LINEAR_SCALING) {
        // Good BAB: LINEAR_SCALING with scalingValue=1 (stored in entity.value)
        if (entityValue === 1) {
            return ProgressionType.good;
        }
        return ProgressionType.good; // Default assumption for LINEAR_SCALING
    } else if (formulaParams.formulaId === FormulaId.LEVEL_TIMES_VALUE) {
        // Average or Poor BAB: LEVEL_TIMES_VALUE with scalingValue in entity.value
        if (entityValue === 0.75) {
            return ProgressionType.average;
        } else if (entityValue === 0.5) {
            return ProgressionType.poor;
        }
        // If value is 1, it might be Good BAB using LEVEL_TIMES_VALUE (unlikely but possible)
        if (entityValue === 1) {
            return ProgressionType.good;
        }
    }

    return null;
}

/**
 * Reverse lookup: Determine Save ProgressionType from formula params
 * Used for backward compatibility when extracting mechanics for display/editing
 */
export function getSaveProgressionTypeFromFormula(
    formulaParams: FeatureFormulaParams | null | undefined
): ProgressionType | null {
    if (!formulaParams) return null;

    if (formulaParams.formulaId === FormulaId.LEVEL_DIVIDED_BY_PLUS_BASE) {
        // Good Save: LEVEL_DIVIDED_BY_PLUS_BASE with divisor=2, baseValue=2
        if (formulaParams.divisor === 2 && formulaParams.baseValue === 2) {
            return ProgressionType.good;
        }
    } else if (formulaParams.formulaId === FormulaId.LEVEL_DIVIDED_BY) {
        // Poor Save: LEVEL_DIVIDED_BY with divisor=3
        if (formulaParams.divisor === 3) {
            return ProgressionType.poor;
        }
    }

    return null;
}

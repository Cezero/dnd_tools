import type { CreateFeatureFormulaParamsRequest } from '@shared/schema';
import { FormulaId, ProgressionType } from '@shared/static-data';

/**
 * Generate formula parameters for BAB progression based on ProgressionType
 * Note: startLevel comes from the progression level, not from formula params
 */
export function generateBABFormulaParams(
    progressionType: typeof ProgressionType.good | typeof ProgressionType.average | typeof ProgressionType.poor
): CreateFeatureFormulaParamsRequest {
    if (progressionType === ProgressionType.good) {
        // Good BAB: level (LINEAR_SCALING with scalingValue=1)
        // Note: scalingValue will be stored in entity.value, not in formulaParams
        return {
            formulaId: FormulaId.LINEAR_SCALING,
            interval: null,
            formulaStartLevel: null,
            abilityId: null,
            thresholds: null,
            values: null,
            valuesRepresent: null,
            cumulative: false,
            includeProgressionLevel: true,
        };
    } else if (progressionType === ProgressionType.average) {
        // Average BAB: floor(3 × level / 4) (LEVEL_TIMES_VALUE with scalingValue=0.75)
        // Note: scalingValue will be stored in entity.value as Float
        return {
            formulaId: FormulaId.LEVEL_TIMES_VALUE,
            interval: null,
            formulaStartLevel: null,
            abilityId: null,
            thresholds: null,
            values: null,
            valuesRepresent: null,
            cumulative: false,
            includeProgressionLevel: true,
        };
    } else {
        // Poor BAB: floor(level / 2) (LEVEL_TIMES_VALUE with scalingValue=0.5)
        // Note: scalingValue will be stored in entity.value as Float
        return {
            formulaId: FormulaId.LEVEL_TIMES_VALUE,
            interval: null,
            formulaStartLevel: null,
            abilityId: null,
            thresholds: null,
            values: null,
            valuesRepresent: null,
            cumulative: false,
            includeProgressionLevel: true,
        };
    }
}

/**
 * Generate formula parameters for saving throw progression based on ProgressionType
 * Note: startLevel comes from the progression level, not from formula params
 */
export function generateSaveFormulaParams(
    progressionType: typeof ProgressionType.good | typeof ProgressionType.poor
): CreateFeatureFormulaParamsRequest {
    if (progressionType === ProgressionType.good) {
        // Good Save: floor(level / 2) + 2 (LEVEL_DIVIDED_BY_PLUS_BASE)
        return {
            formulaId: FormulaId.LEVEL_DIVIDED_BY_PLUS_BASE,
            divisor: 2,
            baseValue: 2,
            interval: null,
            formulaStartLevel: null,
            abilityId: null,
            thresholds: null,
            values: null,
            valuesRepresent: null,
            cumulative: false,
            includeProgressionLevel: true,
        };
    } else {
        // Poor Save: floor(level / 3) (LEVEL_DIVIDED_BY)
        return {
            formulaId: FormulaId.LEVEL_DIVIDED_BY,
            divisor: 3,
            baseValue: null,
            interval: null,
            formulaStartLevel: null,
            abilityId: null,
            thresholds: null,
            values: null,
            valuesRepresent: null,
            cumulative: false,
            includeProgressionLevel: true,
        };
    }
}

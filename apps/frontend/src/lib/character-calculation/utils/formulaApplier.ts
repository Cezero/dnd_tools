import type { FeatureEntity, FormulaParamsData, CharacterWithAllDetailsResponse } from '@shared/schema';
import { FORMULA_MAP } from '@shared/static-data';

/**
 * Apply a feature formula to get the calculated value
 */
export function applyFeatureFormula(
    entity: FeatureEntity,
    character: CharacterWithAllDetailsResponse,
    level: number
): number | null {
    if (!entity.formulaParams) {
        return entity.value ?? null;
    }

    const formulaDef = FORMULA_MAP[entity.formulaParams.formulaId];
    if (!formulaDef) {
        return null;
    }

    const startLevel = entity.formulaParams.formulaStartLevel ?? 1;
    const scalingValue = entity.value !== null && entity.value !== undefined ? entity.value : 1;
    const params = {
        ...entity.formulaParams,
        level,
        startLevel,
        scalingValue,
        context: {
            character,
            level,
        },
    };

    try {
        const result = formulaDef.calculate(params);
        return typeof result === 'number' ? result : null;
    } catch (error) {
        console.error('Error applying formula:', error);
        return null;
    }
}

/**
 * Get display string for a feature formula
 */
export function getFormulaDisplayString(
    formulaParams: FormulaParamsData,
    level: number
): string {
    const formulaDef = FORMULA_MAP[formulaParams.formulaId];
    if (!formulaDef) {
        return `Formula ${formulaParams.formulaId}`;
    }

    const startLevel = formulaParams.formulaStartLevel ?? 1;
    const params = {
        ...formulaParams,
        level,
        startLevel,
    };

    return formulaDef.getDisplayString ? formulaDef.getDisplayString(params) : formulaDef.name;
}


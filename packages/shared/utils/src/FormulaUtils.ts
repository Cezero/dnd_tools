import { FORMULA_MAP } from '@shared/static-data';

/**
 * Calculate formula result
 */
export function calculateFormula(formulaId: number, parameters: Record<string, number>): number | null {
    const formula = FORMULA_MAP[formulaId];
    if (!formula) {
        throw new Error(`Unknown formula ID: ${formulaId}`);
    }

    try {
        return formula.calculate(parameters);
    } catch (error) {
        throw new Error(`Error calculating formula ${formula.name}: ${error}`);
    }
}

/**
 * Get default parameters for a formula
 */
export function getDefaultParameters(formulaId: number): Record<string, number> {
    const formula = FORMULA_MAP[formulaId];
    if (!formula) {
        return {};
    }

    const defaults: Record<string, number> = {};
    formula.parameters.forEach(param => {
        if (param.defaultValue !== undefined) {
            defaults[param.name] = param.defaultValue;
        }
    });

    return defaults;
}

/**
 * Preview formula results across levels
 */
export function previewFormula(formulaId: number, parameters: Record<string, number>): Array<{ level: number; value: number | null }> {
    const results: Array<{ level: number; value: number | null }> = [];

    for (let level = 1; level <= 20; level++) {
        const levelParams = { ...parameters, level };
        const value = calculateFormula(formulaId, levelParams);
        results.push({ level, value });
    }

    return results;
}

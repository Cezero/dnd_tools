import type { FeatureEntity, FeatureFormulaParams, FormulaCalculationParams } from '@shared/schema';
import { FORMULA_MAP } from '@shared/static-data';

/**
 * Evaluates a feature entity formula at an effective companion or class level.
 * Returns null when the formula does not apply yet or cannot be calculated.
 */
export function evaluateEntityFormula(
    entity: FeatureEntity,
    level: number,
    featureLevel: number
): number | null {
    if (!entity.formulaParams) {
        if (entity.value !== null && entity.value !== undefined && level >= featureLevel) {
            return entity.value;
        }
        return null;
    }

    const formulaDef = FORMULA_MAP[entity.formulaParams.formulaId];
    if (!formulaDef) {
        return null;
    }

    const formulaStartLevel = entity.formulaParams.formulaStartLevel ?? featureLevel;
    if (level < formulaStartLevel && entity.formulaParams.featureLevelZero !== true) {
        return null;
    }

    const scalingValue = entity.value ?? 1;
    const params: FormulaCalculationParams = {
        ...entity.formulaParams,
        level,
        startLevel: featureLevel,
        scalingValue,
        context: {
            character: {
                abilityScores: {},
            },
        },
        baseValue: entity.formulaParams.baseValue ?? undefined,
        divisor: entity.formulaParams.divisor ?? undefined,
        startingValue: entity.formulaParams.startingValue ?? undefined,
    };

    try {
        const result = formulaDef.calculate(params);
        if (typeof result === 'number') {
            return result;
        }
        if (typeof result === 'string') {
            const parsed = Number(result);
            return Number.isFinite(parsed) ? parsed : null;
        }
        return null;
    } catch (error) {
        console.error('Error calculating companion/form formula:', error);
        return null;
    }
}

/**
 * Collects every numeric formula value whose threshold is met at `level`.
 * Used for Wild Shape size/type unlocks, where CONDITIONAL_SCALING's single-value
 * result would hide earlier unlocks.
 */
export function collectUnlockedFormulaValues(
    formulaParams: FeatureFormulaParams,
    level: number
): number[] {
    const thresholds = formulaParams.thresholds ?? [];
    const values = formulaParams.values ?? [];
    const unlocked: number[] = [];

    for (let i = 0; i < thresholds.length; i++) {
        if (level >= thresholds[i]) {
            const raw = values[i];
            const num = typeof raw === 'number' ? raw : Number(raw);
            if (Number.isFinite(num)) {
                unlocked.push(num);
            }
        }
    }

    return unlocked;
}

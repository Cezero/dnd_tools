import type { BaseMap, Formula } from './types';
import { NameSelectOptionList } from './Util';

export const enum FormulaId {
    LINEAR_SCALING = 1,         // Generic: level * multiplier
    EVERY_N_LEVELS = 2,         // Generic: increases every N levels (with optional formulaStartLevel)
    CONDITIONAL_SCALING = 3,    // Generic: different values based on level thresholds
    DICE_SCALING = 5,           // Generic: dice scaling (e.g., +1d6 every N levels)
    // NEW: Attribute-dependent formulas
    ATTRIBUTE_BASED = 6,        // Base value + attribute modifier
    ATTRIBUTE_MODIFIER = 7,     // Just attribute modifier
    LEVEL_TIMES_ATTRIBUTE = 8,  // Level × attribute modifier
}

// ============================================================================
// GENERIC D&D 3.5 FORMULAS
// ============================================================================

export const FORMULA_MAP: BaseMap<Formula> = {
    [FormulaId.LINEAR_SCALING]: {
        id: FormulaId.LINEAR_SCALING,
        name: 'Linear Scaling',
        description: 'Scales linearly with level starting from a specific level (e.g., level * scalingValue starting at level 1)',
        parameters: [
            { name: 'level', description: 'Character level', required: true },
            { name: 'startLevel', description: 'Starting level for the progression', required: true },
            { name: 'scalingValue', description: 'Value to scale by (from FeatureModifier.value)', required: true }
        ],
        calculate: (params) => {
            // If character level is before the starting level, return 0
            if (params.level < params.startLevel) {
                return 0;
            }
            // Calculate levels since the progression started
            const levelsSinceStart = params.level - params.startLevel + 1;
            return levelsSinceStart * params.scalingValue;
        }
    },

    [FormulaId.EVERY_N_LEVELS]: {
        id: FormulaId.EVERY_N_LEVELS,
        name: 'Every N Levels',
        description: 'Increases every N levels starting from a specific level (e.g., every 3 levels starting at level 7). Can use formulaStartLevel to start progression at a different level than the feature.',
        parameters: [
            { name: 'level', description: 'Character level', required: true },
            { name: 'startLevel', description: 'Starting level for the progression', required: true },
            { name: 'scalingValue', description: 'Value to scale by (from FeatureModifier.value)', required: true },
            { name: 'interval', description: 'Level interval (from ProgressionFormulaParams.interval)', required: true },
            { name: 'formulaStartLevel', description: 'Level when formula progression begins (from ProgressionFormulaParams.formulaStartLevel)', required: false }
        ],
        calculate: (params) => {
            // If character level is before the starting level, return 0
            if (params.level < params.startLevel) {
                return 0;
            }

            // If character level is before the formula start level, return the base scaling value
            if (params.formulaStartLevel && params.level < params.formulaStartLevel) {
                return params.scalingValue;
            }

            // Calculate how many intervals have passed since formulaStartLevel
            // The formula should start at formulaStartLevel and increase every interval levels
            let intervals;
            if (params.formulaStartLevel) {
                // When formulaStartLevel is explicitly set, include it in the interval calculation
                const levelsSinceStart = params.level - params.formulaStartLevel;
                intervals = Math.floor(levelsSinceStart / params.interval) + 1;
            } else {
                // When formulaStartLevel is not set (null/undefined), use the original logic
                // Start counting intervals from the start level, not including it
                intervals = Math.floor((params.level - params.startLevel) / params.interval);
            }

            return params.scalingValue + (intervals * params.scalingValue);
        }
    },

    [FormulaId.CONDITIONAL_SCALING]: {
        id: FormulaId.CONDITIONAL_SCALING,
        name: 'Conditional Scaling',
        description: 'Different values based on level thresholds starting from a specific level',
        parameters: [
            { name: 'level', description: 'Character level', required: true },
            { name: 'startLevel', description: 'Starting level for the progression', required: true },
            { name: 'scalingValue', description: 'Base scaling value (from FeatureModifier.value)', required: true },
            { name: 'thresholds', description: 'Level thresholds (comma-separated)', required: true },
            { name: 'values', description: 'Corresponding values (comma-separated)', required: true }
        ],
        calculate: (params) => {
            // If character level is before the starting level, return 0
            if (params.level < params.startLevel) {
                return 0;
            }

            const thresholds = params.thresholds.toString().split(',').map(Number);
            const values = params.values.toString().split(',').map(Number);

            if (thresholds.length !== values.length) {
                throw new Error('Thresholds and values arrays must have the same length');
            }

            // Adjust thresholds to be relative to the starting level
            const adjustedThresholds = thresholds.map(t => t + params.startLevel - 1);

            for (let i = 0; i < adjustedThresholds.length; i++) {
                if (params.level <= adjustedThresholds[i]) {
                    return values[i] * params.scalingValue;
                }
            }

            return values[values.length - 1] * params.scalingValue; // Return last value if level exceeds all thresholds
        }
    },

    [FormulaId.DICE_SCALING]: {
        id: FormulaId.DICE_SCALING,
        name: 'Dice Scaling',
        description: 'Dice scaling patterns starting from a specific level (e.g., +1d6 every N levels)',
        parameters: [
            { name: 'level', description: 'Character level', required: true },
            { name: 'startLevel', description: 'Starting level for the progression', required: true },
            { name: 'scalingValue', description: 'Base dice count (from FeatureModifier.value)', required: true },
            { name: 'interval', description: 'Level interval for additional dice (from ProgressionFormulaParams.interval)', required: true }
        ],
        calculate: (params) => {
            // If character level is before the starting level, return 0
            if (params.level < params.startLevel) {
                return 0;
            }

            // Calculate how many intervals have passed since the starting level
            const levelsSinceStart = params.level - params.startLevel;
            const intervals = Math.floor(levelsSinceStart / params.interval);
            return (intervals + 1) * params.scalingValue;
        }
    },

    [FormulaId.ATTRIBUTE_BASED]: {
        id: FormulaId.ATTRIBUTE_BASED,
        name: 'Attribute Based',
        description: 'Base value plus attribute modifier (e.g., 3 + CHA modifier)',
        parameters: [
            { name: 'baseValue', description: 'Base value to add to attribute modifier', required: true },
            { name: 'attributeId', description: 'Attribute ID to use for modifier', required: true }
        ],
        calculate: (params) => {
            // This will be calculated in frontend with character context
            return params.baseValue; // Placeholder - frontend will add attribute modifier
        }
    },

    [FormulaId.ATTRIBUTE_MODIFIER]: {
        id: FormulaId.ATTRIBUTE_MODIFIER,
        name: 'Attribute Modifier',
        description: 'Just the attribute modifier (e.g., +WIS modifier to AC)',
        parameters: [
            { name: 'attributeId', description: 'Attribute ID to use for modifier', required: true }
        ],
        calculate: (params) => {
            // This will be calculated in frontend with character context
            return 0; // Placeholder - frontend will return attribute modifier
        }
    },

    [FormulaId.LEVEL_TIMES_ATTRIBUTE]: {
        id: FormulaId.LEVEL_TIMES_ATTRIBUTE,
        name: 'Level Times Attribute',
        description: 'Level multiplied by attribute modifier (e.g., level × CHA modifier)',
        parameters: [
            { name: 'attributeId', description: 'Attribute ID to use for modifier', required: true }
        ],
        calculate: (params) => {
            // This will be calculated in frontend with character context
            return params.level; // Placeholder - frontend will multiply by attribute modifier
        }
    },


};

// ============================================================================
// ALL FORMULAS
// ============================================================================

export const FORMULA_LIST = Object.values(FORMULA_MAP);
export const FORMULA_SELECT_LIST = NameSelectOptionList(FORMULA_LIST);

// ============================================================================
// FORMULA UTILITIES
// ============================================================================

/**
 * Calculate a formula with given parameters
 */
export function calculateFormula(formulaId: number, parameters: Record<string, number>): number {
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
 * Preview a formula for levels 1-20
 */
export function previewFormula(formulaId: number, parameters: Record<string, number>): Array<{ level: number; value: number }> {
    const results = [];
    const baseParams = { ...parameters };

    for (let level = 1; level <= 20; level++) {
        const levelParams = { ...baseParams, level };
        try {
            const value = calculateFormula(formulaId, levelParams);
            results.push({ level, value });
        } catch (error) {
            // If calculation fails for a level, skip it
            console.warn(`Failed to calculate formula ${formulaId} for level ${level}:`, error);
        }
    }

    return results;
}

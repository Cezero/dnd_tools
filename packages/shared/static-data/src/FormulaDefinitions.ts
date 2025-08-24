import type { BaseMap, Formula } from './types';
import { NameSelectOptionList } from './Util';

export const enum FormulaId {
    LINEAR_SCALING = 1,         // Scales since feature started: (level - startLevel + 1) × multiplier
    EVERY_N_LEVELS = 2,         // Generic: increases every N levels (with optional formulaStartLevel)
    CONDITIONAL_SCALING = 3,    // Generic: different values based on level thresholds
    DICE_SCALING = 5,           // Generic: dice scaling (e.g., +1d6 every N levels)
    // NEW: Attribute-dependent formulas
    ATTRIBUTE_BASED = 6,        // Base value + attribute modifier
    ATTRIBUTE_MODIFIER = 7,     // Just attribute modifier
    LEVEL_TIMES_ATTRIBUTE = 8,  // Level × attribute modifier
    // NEW: Level-based multiplication
    LEVEL_TIMES_VALUE = 9,      // Total level × base value (e.g., 2 × level for healing)
    // NEW: Fixed value plus level
    VALUE_PLUS_LEVEL = 10,      // Fixed value + level (e.g., 10 + level for Spell Resistance)
    // NEW: Level plus attribute modifier
    LEVEL_PLUS_ATTRIBUTE = 11,  // Level + attribute modifier (e.g., level + CHA for Wild Empathy)
}

// ============================================================================
// GENERIC D&D 3.5 FORMULAS
// ============================================================================

export const FORMULA_MAP: BaseMap<Formula> = {
    [FormulaId.LINEAR_SCALING]: {
        id: FormulaId.LINEAR_SCALING,
        name: 'Linear Scaling (Since Feature Started)',
        description: 'Scales linearly since the feature started: (level - startLevel + 1) × scalingValue. Use when the feature should scale based on how long it has been active.',
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
            // For conditional scaling, we don't use startLevel - thresholds are absolute levels
            // If character level is before the first threshold, return the first value
            // Handle incomplete parameters gracefully
            if (!params.thresholds || !params.values) {
                return params.scalingValue; // Return base value if parameters are missing
            }

            const thresholdsStr = params.thresholds.toString().trim();
            const valuesStr = params.values.toString().trim();

            // If parameters are empty, return base value
            if (!thresholdsStr || !valuesStr) {
                return params.scalingValue;
            }

            const thresholds = thresholdsStr.split(',').map(t => t.trim()).filter(t => t).map(Number);
            const values = valuesStr.split(',').map(v => v.trim()).filter(v => v);

            // Validate that we have valid numbers for thresholds
            if (thresholds.some(isNaN)) {
                return params.scalingValue; // Return base value if invalid thresholds
            }

            // For damage dice, values are strings, so we don't validate them as numbers
            // For numeric values, we can optionally validate them
            const numericValues = values.map(v => Number(v));
            const hasNumericValues = !numericValues.some(isNaN);

            if (thresholds.length === 0) {
                return params.scalingValue; // Return base value if no thresholds defined
            }

            // For conditional scaling, values array can be one longer than thresholds
            // The last value applies to all levels after the last threshold
            if (values.length < thresholds.length || values.length > thresholds.length + 1) {
                return params.scalingValue; // Return base value if arrays don't match properly
            }

            // Use thresholds as absolute levels (not relative to startLevel)
            const absoluteThresholds = thresholds;

            // For conditional scaling, thresholds and values should have the same length
            // Each threshold corresponds to the value that applies at/after that level
            // We need to find the highest threshold that the level is >= to
            for (let i = absoluteThresholds.length - 1; i >= 0; i--) {
                if (params.level >= absoluteThresholds[i]) {
                    const value = values[i]; // Return the value that applies at/after this threshold
                    // If the value is numeric, return it as a number, otherwise return as string
                    const numericValue = Number(value);
                    return isNaN(numericValue) ? value : numericValue;
                }
            }

            // If we get here, level is before all thresholds
            // This shouldn't happen if thresholds start at 1, but return the first value as fallback
            const firstValue = values[0];
            const numericValue = Number(firstValue);
            return isNaN(numericValue) ? firstValue : numericValue;
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

    [FormulaId.LEVEL_TIMES_VALUE]: {
        id: FormulaId.LEVEL_TIMES_VALUE,
        name: 'Level Times Value (Total Level)',
        description: 'Total character level multiplied by a base value: level × scalingValue. Use when the feature should scale with total character level, not just since the feature started.',
        parameters: [
            { name: 'level', description: 'Character level', required: true },
            { name: 'startLevel', description: 'Starting level for the progression', required: true },
            { name: 'scalingValue', description: 'Base value to multiply by level (from FeatureModifier.value)', required: true }
        ],
        calculate: (params) => {
            // If character level is before the starting level, return 0
            if (params.level < params.startLevel) {
                return 0;
            }
            return params.level * params.scalingValue;
        }
    },

    [FormulaId.VALUE_PLUS_LEVEL]: {
        id: FormulaId.VALUE_PLUS_LEVEL,
        name: 'Value Plus Level',
        description: 'Fixed value plus character level (e.g., 10 + level for Spell Resistance)',
        parameters: [
            { name: 'level', description: 'Character level', required: true },
            { name: 'startLevel', description: 'Starting level for the progression', required: true },
            { name: 'scalingValue', description: 'Fixed value to add to level (from FeatureModifier.value)', required: true }
        ],
        calculate: (params) => {
            // If character level is before the starting level, return 0
            if (params.level < params.startLevel) {
                return 0;
            }
            return params.scalingValue + params.level;
        }
    },

    [FormulaId.LEVEL_PLUS_ATTRIBUTE]: {
        id: FormulaId.LEVEL_PLUS_ATTRIBUTE,
        name: 'Level Plus Attribute',
        description: 'Character level plus attribute modifier (e.g., level + CHA for Wild Empathy, level + CHA for Turn Undead uses)',
        parameters: [
            { name: 'level', description: 'Character level', required: true },
            { name: 'startLevel', description: 'Starting level for the progression', required: true },
            { name: 'attributeId', description: 'Attribute ID to use for modifier', required: true }
        ],
        calculate: (params) => {
            // If character level is before the starting level, return 0
            if (params.level < params.startLevel) {
                return 0;
            }
            // This will be calculated in frontend with character context
            return params.level; // Placeholder - frontend will add attribute modifier
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
export function calculateFormula(formulaId: number, parameters: Record<string, number>): number | string {
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
export function previewFormula(formulaId: number, parameters: Record<string, number>): Array<{ level: number; value: number | string }> {
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


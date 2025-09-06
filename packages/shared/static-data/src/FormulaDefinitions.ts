import type { BaseMap, Formula } from './types';
import { NameSelectOptionList } from './Util';
import { GetAbilityModifier, ABILITY_MAP } from './AbilityData';

export const enum FormulaId {
    LINEAR_SCALING = 1,         // Scales since feature started: (level - startLevel + 1) × multiplier
    EVERY_N_LEVELS = 2,         // Generic: increases every N levels (with optional formulaStartLevel)
    CONDITIONAL_SCALING = 3,    // Generic: different values based on level thresholds
    DICE_SCALING = 5,           // Generic: dice scaling (e.g., +1d6 every N levels)
    // NEW: Ability-dependent formulas
    ABILITY_BASED = 6,        // Base value + ability modifier
    ABILITY_MODIFIER = 7,     // Just ability modifier
    LEVEL_TIMES_ABILITY = 8,  // Level × ability modifier
    // NEW: Level-based multiplication
    LEVEL_TIMES_VALUE = 9,      // Total level × base value (e.g., 2 × level for healing)
    // NEW: Fixed value plus level
    VALUE_PLUS_LEVEL = 10,      // Fixed value + level (e.g., 10 + level for Spell Resistance)
    // NEW: Level plus ability modifier
    LEVEL_PLUS_ABILITY = 11,  // Level + ability modifier (e.g., level + CHA for Wild Empathy)
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
        },
        getDisplayString: (params) => {
            return `(${params.level} - ${params.startLevel} + 1) × ${params.scalingValue}`;
        },
        isCharacterDependent: false
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
        },
        getDisplayString: (params) => {
            if (params.formulaStartLevel) {
                return `${params.scalingValue} + (intervals since ${params.formulaStartLevel}) × ${params.scalingValue}`;
            }
            return `${params.scalingValue} + (intervals since ${params.startLevel}) × ${params.scalingValue}`;
        },
        isCharacterDependent: false
    },

    [FormulaId.CONDITIONAL_SCALING]: {
        id: FormulaId.CONDITIONAL_SCALING,
        name: 'Conditional Scaling',
        description: 'Different values based on level thresholds',
        parameters: [
            { name: 'level', description: 'Character level', required: true },
            { name: 'startLevel', description: 'Starting level for the progression', required: true },
            { name: 'scalingValue', description: 'Base scaling value (from FeatureModifier.value)', required: true },
            { name: 'thresholds', description: 'Level thresholds (comma-separated)', required: true },
            { name: 'values', description: 'Corresponding values (comma-separated)', required: true },
            { name: 'valuesRepresent', description: 'What the values represent (Value or AppliesToId)', required: false }
            // Remove cumulative parameter - handled in progression generator
        ],
        calculate: (params) => {
            // ONLY calculate single value based on highest applicable threshold
            // Remove cumulative logic - that belongs in progression generator
            if (!params.thresholds || !params.values) {
                return params.scalingValue; // Return base value if parameters are missing
            }

            const thresholds = params.thresholds;
            const values = params.values;

            if (thresholds.length === 0) {
                return params.scalingValue; // Return base value if no thresholds defined
            }

            // Use thresholds as absolute levels (not relative to startLevel)
            const absoluteThresholds = thresholds;

            // Find highest threshold that level meets or exceeds
            for (let i = absoluteThresholds.length - 1; i >= 0; i--) {
                if (params.level >= absoluteThresholds[i]) {
                    return values[i]; // Return the value that applies at/after this threshold
                }
            }

            // If we get here, level is before all thresholds
            return params.scalingValue;
        },
        getDisplayString: (params) => {
            return `Conditional scaling based on level thresholds`;
        },
        isCharacterDependent: false
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
        },
        getDisplayString: (params) => {
            return `${params.scalingValue}d6 + (intervals since ${params.startLevel}) × ${params.scalingValue}d6`;
        },
        isCharacterDependent: false
    },

    [FormulaId.ABILITY_BASED]: {
        id: FormulaId.ABILITY_BASED,
        name: 'Ability Based',
        description: 'Base value plus ability modifier (e.g., 3 + CHA modifier)',
        parameters: [
            { name: 'baseValue', description: 'Base value to add to ability modifier', required: true },
            { name: 'abilityId', description: 'Ability ID to use for modifier', required: true }
        ],
        calculate: (params) => {
            // Always expect context to be available when calculate() is called
            const abilityScore = params.context.character.abilityScores[params.abilityId];
            const modifier = GetAbilityModifier(abilityScore);
            return params.baseValue + modifier;
        },
        getDisplayString: (params) => {
            // Always return formula structure, no context needed
            const abilityName = ABILITY_MAP[params.abilityId]?.abbreviation || 'ability';
            return `${params.baseValue} + ${abilityName}`;
        },
        isCharacterDependent: true
    },

    [FormulaId.ABILITY_MODIFIER]: {
        id: FormulaId.ABILITY_MODIFIER,
        name: 'Ability Modifier',
        description: 'Just the ability modifier (e.g., +WIS modifier to AC)',
        parameters: [
            { name: 'abilityId', description: 'Ability ID to use for modifier', required: true }
        ],
        calculate: (params) => {
            // Always expect context to be available when calculate() is called
            const abilityScore = params.context.character.abilityScores[params.abilityId];
            return GetAbilityModifier(abilityScore);
        },
        getDisplayString: (params) => {
            // Always return formula structure, no context needed
            const abilityName = ABILITY_MAP[params.abilityId]?.abbreviation || 'ability';
            return `+${abilityName}`;
        },
        isCharacterDependent: true
    },

    [FormulaId.LEVEL_TIMES_ABILITY]: {
        id: FormulaId.LEVEL_TIMES_ABILITY,
        name: 'Level Times Ability',
        description: 'Level multiplied by ability modifier (e.g., level × CHA modifier)',
        parameters: [
            { name: 'abilityId', description: 'Ability ID to use for modifier', required: true }
        ],
        calculate: (params) => {
            // Always expect context to be available when calculate() is called
            const abilityScore = params.context.character.abilityScores[params.abilityId];
            const modifier = GetAbilityModifier(abilityScore);
            return params.level * modifier;
        },
        getDisplayString: (params) => {
            // Always return formula structure, no context needed
            const abilityName = ABILITY_MAP[params.abilityId]?.abbreviation || 'ability';
            return `level × ${abilityName}`;
        },
        isCharacterDependent: true
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
        },
        getDisplayString: (params) => {
            return `level × ${params.scalingValue}`;
        },
        isCharacterDependent: false
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
        },
        getDisplayString: (params) => {
            return `${params.scalingValue} + level`;
        },
        isCharacterDependent: false
    },

    [FormulaId.LEVEL_PLUS_ABILITY]: {
        id: FormulaId.LEVEL_PLUS_ABILITY,
        name: 'Level Plus Ability',
        description: 'Character level plus ability modifier (e.g., level + CHA for Wild Empathy, level + CHA for Turn Undead uses)',
        parameters: [
            { name: 'level', description: 'Character level', required: true },
            { name: 'startLevel', description: 'Starting level for the progression', required: true },
            { name: 'abilityId', description: 'Ability ID to use for modifier', required: true }
        ],
        calculate: (params) => {
            // If character level is before the starting level, return 0
            if (params.level < params.startLevel) {
                return 0;
            }
            // Always expect context to be available when calculate() is called
            const abilityScore = params.context.character.abilityScores[params.abilityId];
            const modifier = GetAbilityModifier(abilityScore);
            return params.level + modifier;
        },
        getDisplayString: (params) => {
            // Always return formula structure, no context needed
            const abilityName = params.abilityId && ABILITY_MAP[params.abilityId] ? ABILITY_MAP[params.abilityId].abbreviation : '[ability]';
            return `${params.level} + ${abilityName}`;
        },
        isCharacterDependent: true
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


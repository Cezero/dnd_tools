import type { BaseMap, Formula } from './types';
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
    LEVEL_TIMES_VALUE = 9,      // Total level × base value with floor (e.g., floor(level × 0.5) for Poor BAB)
    // NEW: Fixed value plus level
    VALUE_PLUS_LEVEL = 10,      // Fixed value + level (e.g., 10 + level for Spell Resistance)
    // NEW: Level plus ability modifier
    LEVEL_PLUS_ABILITY = 11,  // Level + ability modifier (e.g., level + CHA for Wild Empathy)
    // NEW: Static value every N levels (doesn't multiply by level)
    STATIC_EVERY_N_LEVELS = 12, // Fixed value every N levels (e.g., 1 skill point every level)
    // NEW: Division-based formulas for BAB and saves
    LEVEL_DIVIDED_BY = 14,      // floor(level / divisor) (e.g., floor(level / 3) for Poor Save)
    LEVEL_DIVIDED_BY_PLUS_BASE = 15, // floor(level / divisor) + baseValue (e.g., floor(level / 2) + 2 for Good Save)
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
            // If character level is before the starting level, return null
            if (params.level < params.startLevel) {
                return null;
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
        description: 'Increases every N levels starting from a specific level (e.g., every 3 levels starting at level 7). Can use formulaStartLevel to start progression at a different level than the feature. When includeProgressionLevel is false, returns null for levels before formulaStartLevel instead of returning the base starting value. When featureLevelZero is true, returns 0 for levels before formulaStartLevel. Supports startingValue parameter to set a different starting value than the increment amount (e.g., start at 2 and then add 1 every 2 levels).',
        parameters: [
            { name: 'level', description: 'Character level', required: true },
            { name: 'startLevel', description: 'Starting level for the progression', required: true },
            { name: 'scalingValue', description: 'Increment amount to add every interval (from FeatureEntity.value)', required: true },
            { name: 'startingValue', description: 'Starting value (from FeatureFormulaParams.startingValue, defaults to scalingValue if not set)', required: false },
            { name: 'interval', description: 'Level interval (from ProgressionFormulaParams.interval)', required: true },
            { name: 'formulaStartLevel', description: 'Level when formula progression begins (from ProgressionFormulaParams.formulaStartLevel)', required: false },
            { name: 'includeProgressionLevel', description: 'Whether to include the progression level in the calculation. When false and formulaStartLevel is set, returns null for levels before formulaStartLevel instead of returning the base starting value.', required: false },
            { name: 'featureLevelZero', description: 'When true, returns 0 for levels below formulaStartLevel instead of null or starting value.', required: false }
        ],
        calculate: (params) => {
            // If character level is before the starting level, return null
            if (params.level < params.startLevel) {
                return null;
            }

            // Use startingValue if provided, otherwise fall back to scalingValue
            const startingValue = params.startingValue ?? params.scalingValue;

            // Handle featureLevelZero: return 0 for levels below formulaStartLevel
            if (params.featureLevelZero === true && params.formulaStartLevel && params.level < params.formulaStartLevel) {
                return 0;
            }

            // Handle includeProgressionLevel logic within the formula
            if (params.includeProgressionLevel === false && params.level < params.formulaStartLevel) {
                return null; // Don't include anything before the formula start level
            }

            // If character level is before the formula start level, return the base starting value
            if (params.formulaStartLevel && params.level < params.formulaStartLevel) {
                return startingValue;
            }

            // Calculate how many intervals have passed since formulaStartLevel
            // The formula should start at formulaStartLevel and increase every interval levels
            let intervals;
            if (params.formulaStartLevel) {
                const levelsSinceStart = params.level - params.formulaStartLevel;
                if (params.includeProgressionLevel === false) {
                    // When includeProgressionLevel is false, start at startingValue at formulaStartLevel
                    // then add scalingValue every interval levels after that
                    if (levelsSinceStart === 0) {
                        // At formulaStartLevel, return just the base startingValue
                        return startingValue;
                    }
                    // Calculate intervals since formulaStartLevel (not including formulaStartLevel itself)
                    intervals = Math.floor(levelsSinceStart / params.interval);
                } else {
                    // When includeProgressionLevel is true, include formulaStartLevel in the interval calculation
                    intervals = Math.floor(levelsSinceStart / params.interval) + 1;
                }
            } else {
                // When formulaStartLevel is not set (null/undefined), use the original logic
                // Start counting intervals from the start level, not including it
                intervals = Math.floor((params.level - params.startLevel) / params.interval);
            }

            return startingValue + (intervals * params.scalingValue);
        },
        getDisplayString: (params) => {
            const startingValue = params.startingValue ?? params.scalingValue;
            if (params.formulaStartLevel) {
                if (params.startingValue !== undefined && params.startingValue !== null) {
                    return `${startingValue} + (intervals since ${params.formulaStartLevel}) × ${params.scalingValue}`;
                }
                return `${startingValue} + (intervals since ${params.formulaStartLevel}) × ${params.scalingValue}`;
            }
            if (params.startingValue !== undefined && params.startingValue !== null) {
                return `${startingValue} + (intervals since ${params.startLevel}) × ${params.scalingValue}`;
            }
            return `${startingValue} + (intervals since ${params.startLevel}) × ${params.scalingValue}`;
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
            // If character level is before the starting level, return null
            if (params.level < params.startLevel) {
                return null;
            }

            // ONLY calculate single value based on highest applicable threshold
            // Remove cumulative logic - that belongs in progression generator
            if (!params.thresholds || !params.values) {
                return null; // Return null if parameters are missing
            }

            const thresholds = params.thresholds;
            const values = params.values;

            if (thresholds.length === 0) {
                return null; // Return null if no thresholds defined
            }

            // Find highest threshold that level meets or exceeds
            for (let i = thresholds.length - 1; i >= 0; i--) {
                if (params.level >= thresholds[i]) {
                    return values[i]; // Return the value that applies at/after this threshold
                }
            }

            // If we get here, level is before all thresholds
            return null;
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
            // If character level is before the starting level, return null
            if (params.level < params.startLevel) {
                return null;
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
            const abilityScore = params.context.character.abilityScores[params.abilityId] as number;
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
        description: 'Total character level multiplied by a base value with floor: floor(level × scalingValue). Use when the feature should scale with total character level, not just since the feature started. Applies Math.floor() to the result, allowing fractional scalingValues (e.g., 0.5 for floor(level/2), 0.75 for floor(3×level/4)). scalingValue can come from entity.value (integer) or formulaParams.scalingValue (stored as hundredths, e.g., 50 for 0.5, 75 for 0.75).',
        parameters: [
            { name: 'level', description: 'Character level', required: true },
            { name: 'startLevel', description: 'Starting level for the progression', required: true },
            { name: 'scalingValue', description: 'Base value to multiply by level. Can come from entity.value (integer) or formulaParams.scalingValue (float).', required: true }
        ],
        calculate: (params) => {
            // If character level is before the starting level, return null
            if (params.level < params.startLevel) {
                return null;
            }
            // Apply Math.floor() to allow fractional scalingValues for division operations
            return Math.floor(params.level * params.scalingValue);
        },
        getDisplayString: (params) => {
            return `floor(level × ${params.scalingValue})`;
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
            // If character level is before the starting level, return null
            if (params.level < params.startLevel) {
                return null;
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
            // If character level is before the starting level, return null
            if (params.level < params.startLevel) {
                return null;
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

    [FormulaId.STATIC_EVERY_N_LEVELS]: {
        id: FormulaId.STATIC_EVERY_N_LEVELS,
        name: 'Static Value Every N Levels',
        description: 'Grants a fixed value every N levels without multiplying by level (e.g., 1 skill point every level, 2 skill points every 2 levels). Returns the value for THIS level only, not cumulative. When includeProgressionLevel is false, returns null for levels before formulaStartLevel. When featureLevelZero is true, returns 0 for levels before formulaStartLevel.',
        parameters: [
            { name: 'level', description: 'Character level', required: true },
            { name: 'startLevel', description: 'Starting level for the progression', required: true },
            { name: 'scalingValue', description: 'Fixed value granted at each interval (from FeatureModifier.value)', required: true },
            { name: 'interval', description: 'Level interval (from ProgressionFormulaParams.interval)', required: true },
            { name: 'formulaStartLevel', description: 'Level when formula progression begins (from ProgressionFormulaParams.formulaStartLevel)', required: false },
            { name: 'includeProgressionLevel', description: 'Whether to include the progression level in the calculation. When false and formulaStartLevel is set, returns null for levels before formulaStartLevel.', required: false },
            { name: 'featureLevelZero', description: 'When true, returns 0 for levels below formulaStartLevel instead of null.', required: false }
        ],
        calculate: (params) => {
            // If character level is before the starting level, return null
            if (params.level < params.startLevel) {
                return null;
            }

            // Handle featureLevelZero: return 0 for levels below formulaStartLevel
            if (params.featureLevelZero === true && params.formulaStartLevel && params.level < params.formulaStartLevel) {
                return 0;
            }

            // Handle includeProgressionLevel logic within the formula
            if (params.includeProgressionLevel === false && params.formulaStartLevel && params.level < params.formulaStartLevel) {
                return null; // Don't include anything before the formula start level
            }

            // Determine the effective start level for interval calculation
            const effectiveStartLevel = params.formulaStartLevel ?? params.startLevel;

            // If character level is before the effective start level, return null
            if (params.level < effectiveStartLevel) {
                return null;
            }

            // Calculate how many levels have passed since the effective start level
            const levelsSinceStart = params.level - effectiveStartLevel;

            // Check if this level is at an interval boundary
            // At the start level (levelsSinceStart = 0), we always grant the value
            // Then every 'interval' levels after that
            if (levelsSinceStart % params.interval === 0) {
                // This level is at an interval boundary, grant the value
                return params.scalingValue;
            }

            // This level is not at an interval boundary, return 0 (no value this level)
            return 0;
        },
        getDisplayString: (params) => {
            const effectiveStartLevel = params.formulaStartLevel ?? params.startLevel;
            if (params.interval === 1) {
                return `${params.scalingValue} every level (starting at ${effectiveStartLevel})`;
            }
            return `${params.scalingValue} every ${params.interval} levels (starting at ${effectiveStartLevel})`;
        },
        isCharacterDependent: false
    },

    [FormulaId.LEVEL_DIVIDED_BY]: {
        id: FormulaId.LEVEL_DIVIDED_BY,
        name: 'Level Divided By',
        description: 'Calculates floor(level / divisor). Use when you need division that starts at 0 (e.g., floor(level / 3) for Poor Save progression).',
        parameters: [
            { name: 'level', description: 'Character level', required: true },
            { name: 'startLevel', description: 'Starting level for the progression', required: true },
            { name: 'divisor', description: 'Divisor value (e.g., 3 for level/3)', required: true }
        ],
        calculate: (params) => {
            // If character level is before the starting level, return null
            if (params.level < params.startLevel) {
                return null;
            }
            return Math.floor(params.level / params.divisor);
        },
        getDisplayString: (params) => {
            return `floor(level / ${params.divisor})`;
        },
        isCharacterDependent: false
    },

    [FormulaId.LEVEL_DIVIDED_BY_PLUS_BASE]: {
        id: FormulaId.LEVEL_DIVIDED_BY_PLUS_BASE,
        name: 'Level Divided By Plus Base',
        description: 'Calculates floor(level / divisor) + baseValue. Use for progressions that combine division with a base value (e.g., floor(level / 2) + 2 for Good Save progression).',
        parameters: [
            { name: 'level', description: 'Character level', required: true },
            { name: 'startLevel', description: 'Starting level for the progression', required: true },
            { name: 'divisor', description: 'Divisor value (e.g., 2 for level/2)', required: true },
            { name: 'baseValue', description: 'Base value to add (e.g., 2 for +2)', required: true }
        ],
        calculate: (params) => {
            // If character level is before the starting level, return null
            if (params.level < params.startLevel) {
                return null;
            }
            return Math.floor(params.level / params.divisor) + params.baseValue;
        },
        getDisplayString: (params) => {
            return `floor(level / ${params.divisor}) + ${params.baseValue}`;
        },
        isCharacterDependent: false
    },

};

// ============================================================================
// ALL FORMULAS
// ============================================================================

export const FORMULA_LIST = Object.values(FORMULA_MAP);

// ============================================================================
// FORMULA UTILITIES
// ============================================================================



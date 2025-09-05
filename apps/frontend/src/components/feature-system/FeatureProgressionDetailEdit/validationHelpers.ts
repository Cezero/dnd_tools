import type { FeatureModifier, FeatureChoice } from '@shared/schema';
import { FeatureChoiceType, FeatureChoiceBehavior, FormulaId } from '@shared/static-data';

// Generic function to check if an entity has valid formula parameters
function hasValidFormulaParamsGeneric(entity: { formulaParams?: { formulaId?: number; interval?: number; abilityId?: number; thresholds?: number[]; values?: (string | number)[] } }): boolean {
    if (!entity.formulaParams?.formulaId) {
        return false;
    }

    const formulaId = entity.formulaParams.formulaId;

    // Check required fields based on formula type
    switch (formulaId) {
        case FormulaId.LINEAR_SCALING:
        case FormulaId.EVERY_N_LEVELS:
        case FormulaId.DICE_SCALING:
            return !!entity.formulaParams.interval;

        case FormulaId.ABILITY_BASED:
        case FormulaId.ABILITY_MODIFIER:
        case FormulaId.LEVEL_TIMES_ABILITY:
        case FormulaId.LEVEL_PLUS_ABILITY:
            return !!entity.formulaParams.abilityId;

        case FormulaId.CONDITIONAL_SCALING:
            return !!(
                entity.formulaParams.thresholds &&
                entity.formulaParams.values &&
                entity.formulaParams.thresholds.length > 0 &&
                entity.formulaParams.values.length > 0 &&
                entity.formulaParams.thresholds.length === entity.formulaParams.values.length
            );

        case FormulaId.LEVEL_TIMES_VALUE:
        case FormulaId.VALUE_PLUS_LEVEL:
            return true; // No additional parameters needed

        default:
            return false;
    }
}

// Check if a modifier has valid formula parameters
export function hasValidFormulaParams(modifier: FeatureModifier): boolean {
    return hasValidFormulaParamsGeneric(modifier);
}

// Check if a choice has valid formula parameters
export function hasValidChoiceFormulaParams(choice: FeatureChoice): boolean {
    return hasValidFormulaParamsGeneric(choice);
}

// Check if a choice has valid configuration
export function hasValidChoiceConfig(choice: FeatureChoice): boolean {
    // Basic validation
    if (!choice.label || choice.pickCount < 1) {
        return false;
    }

    // Type-specific validation
    switch (choice.type) {
        case FeatureChoiceType.Feat:
            // For feat choices, either filterType or featId should be set
            return !!(choice.filterType || choice.featId);

        case FeatureChoiceType.Feature:
            // For feature choices, featureId is optional
            return true;

        case FeatureChoiceType.CreatureType:
            // For creature type choices, behavior should be valid
            return choice.behavior === FeatureChoiceBehavior.Single || choice.behavior === FeatureChoiceBehavior.Allocation;

        default:
            return false;
    }
}

// Get validation error message for a modifier
export function getModifierValidationError(modifier: FeatureModifier): string | null {
    return hasValidFormulaParams(modifier) ? null : 'Invalid formula parameters';
}

// Get validation error message for a choice
export function getChoiceValidationError(choice: FeatureChoice): string | null {
    if (!hasValidChoiceConfig(choice)) {
        return 'Invalid choice configuration';
    }
    return choice.formulaParams?.formulaId && !hasValidChoiceFormulaParams(choice) ? 'Invalid formula parameters' : null;
}

// Check if all entities in a progression are valid
export function validateProgressionEntities(
    modifiers: FeatureModifier[],
    choices: FeatureChoice[]
): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate modifiers
    modifiers.forEach((modifier, index) => {
        const error = getModifierValidationError(modifier);
        if (error) {
            errors.push(`Modifier ${index + 1}: ${error}`);
        }
    });

    // Validate choices
    choices.forEach((choice, index) => {
        const error = getChoiceValidationError(choice);
        if (error) {
            errors.push(`Choice ${index + 1}: ${error}`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
}

// Check if a progression has at least one component
export function hasProgressionComponents(
    modifiers: FeatureModifier[],
    choices: FeatureChoice[]
): boolean {
    return modifiers.length > 0 || choices.length > 0;
}

// Validate progression level
export function validateProgressionLevel(level: number): boolean {
    return level >= 1 && level <= 20 && Number.isInteger(level);
}

// Validate feature ID
export function validateFeatureId(featureId: number): boolean {
    return featureId > 0;
}

import type { FeatureEntity } from '@shared/schema';
import { EntityAppliesToType, FormulaId, EntityType } from '@shared/static-data';

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
        case FormulaId.STATIC_EVERY_N_LEVELS:
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
export function hasValidFormulaParams(entity: FeatureEntity): boolean {
    return hasValidFormulaParamsGeneric(entity);
}

// Check if an entity has valid configuration
export function hasValidEntityConfig(entity: FeatureEntity): boolean {

    // Type-specific validation
    switch (entity.appliesTo) {
        case EntityAppliesToType.Feat:
            // For feat entities, either filterType or appliesToId should be set
            return !!(entity.filterType || entity.appliesToId);

        case EntityAppliesToType.Proficiency:
            // For proficiency entities, appliesToId should be set (proficiency type ID)
            return !!entity.appliesToId;

        case EntityAppliesToType.Feature:
            // For feature entities, featureId is optional
            return true;

        case EntityAppliesToType.CreatureType:
            // For creature type entities, should be choice or allocation type
            return entity.type === EntityType.Choice || entity.type === EntityType.Allocation;

        default:
            return false;
    }
}

// Get validation error message for an entity
export function getEntityValidationError(entity: FeatureEntity): string | null {
    if (!hasValidEntityConfig(entity)) {
        return 'Invalid entity configuration';
    }
    return entity.formulaParams?.formulaId && !hasValidFormulaParams(entity) ? 'Invalid formula parameters' : null;
}

// Check if all entities in a progression are valid
export function validateProgressionEntities(
    entities: FeatureEntity[]
): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate entities
    entities.forEach((entity, index) => {
        const error = getEntityValidationError(entity);
        if (error) {
            errors.push(`Entity ${index + 1}: ${error}`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
}

// Check if a progression has at least one component
export function hasProgressionComponents(
    entities: FeatureEntity[]
): boolean {
    return entities.length > 0;
}

// Validate progression level
export function validateProgressionLevel(level: number): boolean {
    return level >= 1 && level <= 20 && Number.isInteger(level);
}

// Validate feature ID
export function validateFeatureId(featureId: number): boolean {
    return featureId > 0;
}

import type { FeatureEntity, FeatureProgression } from '@shared/schema';
import { EntityType } from '@shared/static-data';

/**
 * Result of processing a feature entity
 */
export interface EntityProcessingResult {
    grants: FeatureEntity[];
    warnings?: string[];
    errors?: string[];
}

/**
 * Service for processing feature entities
 * Ported from frontend FeatureEntityHandlers
 */
export class FeatureEntityHandlers {
    /**
     * Process a feature entity and return the grants it provides
     */
    static processFeatureEntity(
        entity: FeatureEntity,
        progression: FeatureProgression
    ): EntityProcessingResult {
        const result: EntityProcessingResult = {
            grants: []
        };

        // Handle different entity types
        switch (entity.type) {
            case EntityType.Other:
                return this.processOtherEntity(entity, progression);
            case EntityType.Bonus:
                return this.processBonusEntity(entity, progression);
            case EntityType.Choice:
                return this.processChoiceEntity(entity, progression);
            case EntityType.Allocation:
                return this.processAllocationEntity(entity, progression);
            default:
                result.warnings = [`Unknown entity type: ${entity.type}`];
                return result;
        }
    }

    /**
     * Process Other entity type (class skills, proficiencies, languages, etc.)
     */
    private static processOtherEntity(
        entity: FeatureEntity,
        _progression: FeatureProgression
    ): EntityProcessingResult {
        const result: EntityProcessingResult = {
            grants: []
        };

        // For Other entities, they directly grant features
        // The entity itself contains all the information needed
        result.grants.push(entity);

        return result;
    }

    /**
     * Process Bonus entity type (ability adjustments, skill bonuses, etc.)
     */
    private static processBonusEntity(
        entity: FeatureEntity,
        _progression: FeatureProgression
    ): EntityProcessingResult {
        const result: EntityProcessingResult = {
            grants: []
        };

        // For Bonus entities, they directly grant bonuses
        // The entity itself contains all the information needed
        result.grants.push(entity);

        return result;
    }

    /**
     * Process Choice entity type (domain choices, feat choices, etc.)
     */
    private static processChoiceEntity(
        _entity: FeatureEntity,
        _progression: FeatureProgression
    ): EntityProcessingResult {
        const result: EntityProcessingResult = {
            grants: []
        };

        // Choice entities don't directly grant features
        // They create pending choices that need user input
        // This will be handled by the choice resolution system

        return result;
    }

    /**
     * Process Allocation entity type (skill point allocations, etc.)
     */
    private static processAllocationEntity(
        _entity: FeatureEntity,
        _progression: FeatureProgression
    ): EntityProcessingResult {
        const result: EntityProcessingResult = {
            grants: []
        };

        // Allocation entities grant allocation points
        // The entity itself contains all the information needed
        // For now, we just return the entity as a grant
        // This may need refinement based on how allocations are handled

        return result;
    }

}











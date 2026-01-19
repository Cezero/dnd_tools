import { FeatureEntity, FeatureProgression } from '@shared/schema';
import { EntityType } from '@shared/static-data';

import type { EntityProcessingResult } from './types';

/**
 * Service for processing feature entities
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
            case EntityType.Base:
                return this.processBaseEntity(entity, progression);
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
     * Process Base entity type (BAB, saves, hit dice, skill points, size, speed, etc.)
     */
    private static processBaseEntity(
        entity: FeatureEntity,
        _progression: FeatureProgression
    ): EntityProcessingResult {
        const result: EntityProcessingResult = {
            grants: []
        };

        // For Base entities, they directly grant base values
        // The entity itself contains all the information needed
        result.grants.push(entity);

        return result;
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

        // Allocation entities handle resource allocation
        // This will be handled by the allocation system

        return result;
    }
}

import type { FeatureEntity } from '@shared/schema';
import { EntityAppliesToType } from '@shared/static-data';

/**
 * Change detection result for entities
 */
export interface EntityChangeResult {
    needsFeatFetch: boolean;
    needsFeatureFetch: boolean;
    hasChanges: boolean;
}

/**
 * Detects changes in a FeatureEntity that require entity fetching
 */
export function detectEntityChanges(
    originalEntity: FeatureEntity,
    newEntity: FeatureEntity
): EntityChangeResult {
    const changes: EntityChangeResult = {
        needsFeatFetch: false,
        needsFeatureFetch: false,
        hasChanges: false
    };

    // Check if appliesTo changed to Feat
    if (newEntity.appliesTo === EntityAppliesToType.Feat &&
        originalEntity.appliesTo !== EntityAppliesToType.Feat) {
        // Only need to fetch if we don't already have the full feat data
        if (!newEntity.feat || newEntity.feat.id !== newEntity.appliesToId) {
            changes.needsFeatFetch = true;
        }
        changes.hasChanges = true;
    }

    // Check if feat ID changed
    if (newEntity.appliesTo === EntityAppliesToType.Feat &&
        originalEntity.appliesTo === EntityAppliesToType.Feat &&
        newEntity.appliesToId !== originalEntity.appliesToId) {
        // Only need to fetch if we don't already have the full feat data
        if (!newEntity.feat || newEntity.feat.id !== newEntity.appliesToId) {
            changes.needsFeatFetch = true;
        }
        changes.hasChanges = true;
    }

    // Check if appliesTo changed to Feature
    if (newEntity.appliesTo === EntityAppliesToType.Feature &&
        originalEntity.appliesTo !== EntityAppliesToType.Feature) {
        // Only need to fetch if we don't already have the full feature data
        if (!newEntity.feature || newEntity.feature.id !== newEntity.appliesToId) {
            changes.needsFeatureFetch = true;
        }
        changes.hasChanges = true;
    }

    // Check if appliesTo changed to Spell
    if (newEntity.appliesTo === EntityAppliesToType.Spell &&
        originalEntity.appliesTo !== EntityAppliesToType.Spell) {
        // Spell grants only need ID and name from static data - no fetching required
        changes.hasChanges = true;
    }

    // Check if feature ID changed
    if (newEntity.appliesTo === EntityAppliesToType.Feature &&
        originalEntity.appliesTo === EntityAppliesToType.Feature &&
        newEntity.appliesToId !== originalEntity.appliesToId) {
        // Only need to fetch if we don't already have the full feature data
        if (!newEntity.feature || newEntity.feature.id !== newEntity.appliesToId) {
            changes.needsFeatureFetch = true;
        }
        changes.hasChanges = true;
    }

    // Check if spell ID changed
    if (newEntity.appliesTo === EntityAppliesToType.Spell &&
        originalEntity.appliesTo === EntityAppliesToType.Spell &&
        newEntity.appliesToId !== originalEntity.appliesToId) {
        // Spell grants only need ID and name from static data - no fetching required
        changes.hasChanges = true;
    }

    // Check for other changes (formulaParams, values, etc.)
    if (JSON.stringify(originalEntity.formulaParams) !== JSON.stringify(newEntity.formulaParams) ||
        originalEntity.value !== newEntity.value ||
        originalEntity.bonusType !== newEntity.bonusType ||
        originalEntity.type !== newEntity.type ||
        originalEntity.filterType !== newEntity.filterType) {
        changes.hasChanges = true;
    }

    return changes;
}

/**
 * Detects changes for a new entity (not existing)
 */
export function detectNewEntityChanges(newEntity: FeatureEntity): EntityChangeResult {
    return {
        needsFeatFetch: newEntity.appliesTo === EntityAppliesToType.Feat &&
            (!newEntity.feat || newEntity.feat.id !== newEntity.appliesToId),
        needsFeatureFetch: newEntity.appliesTo === EntityAppliesToType.Feature &&
            (!newEntity.feature || newEntity.feature.id !== newEntity.appliesToId),
        hasChanges: true
    };
}

/**
 * Collects all entity IDs that need fetching from change results
 */
export function collectEntityIdsToFetch(
    entityChanges: EntityChangeResult[],
    entities: FeatureEntity[]
): { featIds: Set<number>; featureIds: Set<number> } {
    const featIds = new Set<number>();
    const featureIds = new Set<number>();

    // Collect feat and feature IDs from entity changes
    entityChanges.forEach((change, index) => {
        if (change.needsFeatFetch && entities[index]?.appliesToId) {
            featIds.add(entities[index].appliesToId);
        }
        if (change.needsFeatureFetch && entities[index]?.appliesToId) {
            featureIds.add(entities[index].appliesToId);
        }
    });

    return { featIds, featureIds };
}

/**
 * Checks if an entity already has full feat data
 */
export function hasFullFeatData(entity: FeatureEntity): boolean {
    return entity.appliesTo === EntityAppliesToType.Feat &&
        entity.feat !== null &&
        entity.feat !== undefined &&
        entity.feat.id === entity.appliesToId;
}

/**
 * Checks if an entity already has full feature data
 */
export function hasFullFeatureData(entity: FeatureEntity): boolean {
    return entity.appliesTo === EntityAppliesToType.Feature &&
        entity.feature !== null &&
        entity.feature !== undefined &&
        entity.feature.id === entity.appliesToId;
}


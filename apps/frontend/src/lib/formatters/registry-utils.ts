import { EntityAppliesToType, EntityType } from '@shared/static-data';

/**
 * Generate hierarchical key for registry storage
 * Used by both formatter and labeler registries
 */
export function generateKey(
    entityType: EntityType,
    appliesToId?: EntityAppliesToType,
    featureId?: number
): string {
    let key = `${entityType}:${appliesToId}`;
    if (featureId !== undefined) {
        key += `:${featureId}`;
    }
    return key;
}

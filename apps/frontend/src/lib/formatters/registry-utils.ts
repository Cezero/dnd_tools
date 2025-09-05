import { ModifierAppliesToType, ModifierType, FeatureType, FeatureChoiceType } from '@shared/static-data';

/**
 * Generate hierarchical key for registry storage
 * Used by both formatter and labeler registries
 */
export function generateKey(
    featureType: FeatureType,
    featureSubType: ModifierType | FeatureChoiceType,
    subTypeId?: ModifierAppliesToType,
    _featureId?: number
): string {
    let key = `${featureType}:${featureSubType}`;
    if (subTypeId !== undefined) {
        key += `:${subTypeId}`;
    }
    return key;
}

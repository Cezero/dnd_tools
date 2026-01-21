import type {
    FeatureEntity,
    FeatureWithRelations,
    Feature
} from '@shared/schema';
import { FeatureSourceType, EntityType, EntityAppliesToType } from '@shared/static-data';

// Initialize form data with proper defaults
export function initializeFormData(
    feature: FeatureWithRelations | null,
    preSelectedFeature?: Feature
): FeatureWithRelations {
    // If feature exists, use it as-is (but ensure sourceType is set if featId/classId/etc is set)
    if (feature) {
        // Infer sourceType from context if not explicitly set
        if (feature.sourceType === FeatureSourceType.None || !feature.sourceType) {
            if (feature.editionId) {
                return { ...feature, sourceType: FeatureSourceType.Edition };
            } else if (feature.featId) {
                return { ...feature, sourceType: FeatureSourceType.Feat };
            } else if (feature.classes && feature.classes.length > 0) {
                return { ...feature, sourceType: FeatureSourceType.Class };
            } else if (feature.races && feature.races.length > 0) {
                return { ...feature, sourceType: FeatureSourceType.Race };
            } else if (feature.domainId) {
                return { ...feature, sourceType: FeatureSourceType.Domain };
            }
        }
        return feature;
    }

    // If no feature, create empty structure with required fields
    // Note: featureId is for form schema purposes (linking to feature templates), not part of FeatureWithRelations type
    return {
        id: 0,
        slug: '',
        name: '',
        description: '',
        displayInCharacterSheet: true,
        sourceType: FeatureSourceType.None,
        domainId: null,
        featId: null,
        companionId: null,
        editionId: null,
        level: 1,
        entities: [],
        // featureId is for form schema only, cast to any to include it
        ...(preSelectedFeature ? { featureId: preSelectedFeature.id } : { featureId: 0 }),
    } as FeatureWithRelations & { featureId?: number };
}

// Create default entity for new additions
export function createDefaultEntity(): FeatureEntity {
    return {
        id: 0,
        featureId: 0,
        type: EntityType.Bonus,
        appliesTo: EntityAppliesToType.Ability,
        appliesToId: null,
        appliesToSubId: null,
        value: 0,
        bonusType: null,
        formulaParamsId: null,
        groupingId: 0,
        displayInDetail: true,
        filterType: null,
        conditions: [],
        formulaParams: null,
    };
}

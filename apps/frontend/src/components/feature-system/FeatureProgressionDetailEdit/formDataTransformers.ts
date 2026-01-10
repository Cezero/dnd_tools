import type {
    FeatureEntity,
    FeatureProgression,
    Feature
} from '@shared/schema';
import { FeatureSourceType, EntityType, EntityAppliesToType } from '@shared/static-data';

// Initialize form data with proper defaults
export function initializeFormData(
    progression: FeatureProgression | null,
    preSelectedFeature?: Feature
): FeatureProgression {
    // If progression exists, use it as-is (but ensure sourceType is set if featId/classId/etc is set)
    if (progression) {
        // Infer sourceType from context if not explicitly set
        if (progression.sourceType === FeatureSourceType.None || !progression.sourceType) {
            if (progression.featId) {
                return { ...progression, sourceType: FeatureSourceType.Feat };
            } else if (progression.classId) {
                return { ...progression, sourceType: FeatureSourceType.Class };
            } else if (progression.raceId) {
                return { ...progression, sourceType: FeatureSourceType.Race };
            } else if (progression.domainId) {
                return { ...progression, sourceType: FeatureSourceType.Domain };
            }
        }
        return progression;
    }

    // If no progression, create empty structure with required fields
    return {
        id: 0,
        sourceType: FeatureSourceType.None,
        classId: null,
        raceId: null,
        domainId: null,
        featId: null,
        companionId: null,
        variantOverrideId: null,
        level: 1,
        featureId: preSelectedFeature?.id || 0,
        entities: [],
    };
}

// Create default entity for new additions
export function createDefaultEntity(): FeatureEntity {
    return {
        id: 0,
        progressionId: 0,
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
        item: null,
        feat: null,
        feature: null,
        formulaParams: null,
    };
}

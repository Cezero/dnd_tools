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
    // If progression exists, use it as-is
    if (progression) {
        return progression;
    }

    // If no progression, create empty structure with required fields
    return {
        id: 0,
        sourceType: FeatureSourceType.None,
        classId: null,
        raceId: null,
        domainId: null,
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

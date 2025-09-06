import type {
    CreateFeatureProgressionRequest,
    FeatureModifier,
    FeatureChoice,
    FeatureProgression,
    Feature
} from '@shared/schema';
import { FormulaId, FeatureSourceType, ModifierType, FeatureChoiceType, FeatureChoiceBehavior } from '@shared/static-data';

// Transform form data to submission format with proper type conversion
export function transformFormDataForSubmission(
    formData: Partial<FeatureProgression>
): CreateFeatureProgressionRequest {
    // Deep clone and convert string numbers to actual numbers for thresholds
    const transformedData = JSON.parse(JSON.stringify(formData));

    // Convert thresholds from strings to numbers in modifiers
    if (transformedData.modifiers) {
        transformedData.modifiers = transformedData.modifiers.map((modifier: any) => {
            if (modifier.formulaParams?.thresholds) {
                modifier.formulaParams.thresholds = modifier.formulaParams.thresholds.map((threshold: any) =>
                    typeof threshold === 'string' ? parseInt(threshold, 10) : threshold
                );
            }
            return modifier;
        });
    }

    // Convert thresholds from strings to numbers in choices
    if (transformedData.choices) {
        transformedData.choices = transformedData.choices.map((choice: any) => {
            if (choice.formulaParams?.thresholds) {
                choice.formulaParams.thresholds = choice.formulaParams.thresholds.map((threshold: any) =>
                    typeof threshold === 'string' ? parseInt(threshold, 10) : threshold
                );
            }
            return choice;
        });
    }

    return transformedData as CreateFeatureProgressionRequest;
}

// Add feature info if missing
export function transformProgressionForDisplay(
    formData: Partial<FeatureProgression>,
    progression: FeatureProgression | null,
    preSelectedFeature?: Feature
): Partial<FeatureProgression> {
    if (formData.feature) return formData;

    return {
        ...formData,
        feature: progression?.feature || preSelectedFeature || {
            id: formData.featureId!,
            name: 'Unknown Feature',
            description: '',
            slug: 'unknown-feature'
        }
    };
}

// Initialize form data with proper defaults
export function initializeFormData(
    progression: FeatureProgression | null,
    preSelectedFeature?: Feature
): Partial<FeatureProgression> {
    // If progression exists, use it as-is
    if (progression) {
        return progression;
    }

    // If no progression, create empty structure
    return {
        sourceType: FeatureSourceType.Class,
        classId: 0,
        raceId: null,
        level: 1,
        featureId: preSelectedFeature?.id || 0,
        modifiers: [],
        choices: [],
    };
}

// Create default entities for new additions
export function createDefaultModifier(): FeatureModifier {
    return {
        id: 0,
        progressionId: 0,
        type: ModifierType.Bonus,
        value: 0,
        bonusType: null,
        appliesTo: null,
        appliesToId: null,
        conditions: [],
        formulaParams: undefined,
        groupingId: 0,
    };
}

export function createDefaultChoice(): FeatureChoice {
    return {
        id: 0,
        progressionId: 0,
        label: '',
        pickCount: 1,
        type: FeatureChoiceType.Feat,
        behavior: FeatureChoiceBehavior.Single,
        featId: null,
        featureId: null,
        filterType: null,
        feat: null,
        feature: null,
        formulaParams: undefined,
        groupingId: 0,
    };
}

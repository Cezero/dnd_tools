import { useState, useEffect } from 'react';

import { useValidatedForm } from '@/components/forms';
import {
    CreateFeatureRequestSchema,
    CreateFeatureFormSchema,
    FeatureWithRelations,
    Feature,
} from '@shared/schema';
import { FORMULA_MAP } from '@shared/static-data';

import { initializeFormData } from './formDataTransformers';

export function useFeatureForm(
    feature: FeatureWithRelations | null,
    preSelectedFeature?: Feature
) {
    const [formData, setFormData] = useState<FeatureWithRelations>(() =>
        initializeFormData(feature, preSelectedFeature)
    );

    // Set up validation - use form schema for new features (id = 0), regular schema for existing features
    // featureId is for form schema purposes (linking to feature templates), but only for new features
    // For existing features (id > 0), use CreateFeatureRequestSchema which doesn't require featureId
    const schema = formData.id === 0 ? CreateFeatureFormSchema : CreateFeatureRequestSchema;
    const form = useValidatedForm(schema, formData, setFormData, {
        validateOnChange: false,
        validateOnBlur: false
    });

    // Update form data when feature or preSelectedFeature changes
    useEffect(() => {
        const newFormData = initializeFormData(feature, preSelectedFeature);
        setFormData(newFormData);
    }, [feature, preSelectedFeature]);

    // Get current section states
    const hasEntities = (formData.entities || []).length > 0;

    // Helper function to get selected formula description
    const getSelectedFormulaDescription = () => {
        const entities = formData.entities || [];
        const formulaEntity = entities.find(entity => entity.formulaParams?.formulaId);

        if (!formulaEntity) return null;

        const formula = FORMULA_MAP[formulaEntity.formulaParams.formulaId];
        return formula?.description || null;
    };

    return {
        formData,
        setFormData,
        form,
        hasEntities,
        getSelectedFormulaDescription,
        schema
    };
}

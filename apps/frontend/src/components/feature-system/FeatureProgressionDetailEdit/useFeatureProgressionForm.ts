import { useState, useEffect } from 'react';

import { useValidatedForm } from '@/components/forms';
import {
    CreateFeatureProgressionSchema,
    CreateFeatureProgressionFormSchema,
    FeatureProgression,
    Feature,
} from '@shared/schema';
import { FORMULA_MAP } from '@shared/static-data';

import { initializeFormData } from './formDataTransformers';

export function useFeatureProgressionForm(
    progression: FeatureProgression | null,
    preSelectedFeature?: Feature
) {
    const [formData, setFormData] = useState<FeatureProgression>(() =>
        initializeFormData(progression, preSelectedFeature)
    );

    // Set up validation - use form schema for new features (featureId = 0), regular schema for existing features
    const schema = (formData.featureId === 0 || !formData.featureId) ? CreateFeatureProgressionFormSchema : CreateFeatureProgressionSchema;
    const form = useValidatedForm(schema, formData, setFormData, {
        validateOnChange: false,
        validateOnBlur: false
    });

    // Update form data when progression or preSelectedFeature changes
    useEffect(() => {
        const newFormData = initializeFormData(progression, preSelectedFeature);
        setFormData(newFormData);
    }, [progression, preSelectedFeature]);

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

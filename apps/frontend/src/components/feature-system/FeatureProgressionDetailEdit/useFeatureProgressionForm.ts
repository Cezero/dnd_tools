import { useState, useEffect } from 'react';

import { useValidatedForm } from '@/components/forms';
import {
    CreateFeatureProgressionSchema,
    CreateFeatureProgressionFormSchema,
    FeatureProgression,
    Feature,
    FeatureModifier,
    FeatureChoice
} from '@shared/schema';
import { FORMULA_MAP } from '@shared/static-data';

import { initializeFormData } from './formDataTransformers';

export function useFeatureProgressionForm(
    progression: FeatureProgression | null,
    preSelectedFeature?: Feature
) {
    const [formData, setFormData] = useState<Partial<FeatureProgression>>(() =>
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
    const hasModifiers = (formData.modifiers || []).length > 0;
    const hasChoices = (formData.choices || []).length > 0;

    // Helper function to get selected formula description
    const getSelectedFormulaDescription = () => {
        const modifiers = formData.modifiers || [];
        const formulaModifier = modifiers.find(mod => mod.formulaParams?.formulaId);

        if (!formulaModifier) return null;

        const formula = FORMULA_MAP[formulaModifier.formulaParams.formulaId];
        return formula?.description || null;
    };

    return {
        formData,
        setFormData,
        form,
        hasModifiers,
        hasChoices,
        getSelectedFormulaDescription,
        schema
    };
}

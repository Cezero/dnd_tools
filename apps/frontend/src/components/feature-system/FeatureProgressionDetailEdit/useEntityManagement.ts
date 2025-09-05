import { useCallback } from 'react';

import type { FeatureProgression } from '@shared/schema';
import { FeatureType } from '@shared/static-data';

import { updateGroupingStateAfterRemoval } from './entityHelpers';
import { createDefaultModifier, createDefaultChoice } from './formDataTransformers';
import type { GroupingState } from './types';


export function useEntityManagement(
    formData: Partial<FeatureProgression>,
    setFormData: (data: Partial<FeatureProgression> | ((prev: Partial<FeatureProgression>) => Partial<FeatureProgression>)) => void,
    groupingState: GroupingState,
    setGroupingState: (state: GroupingState | ((prev: GroupingState) => GroupingState)) => void
) {
    // Add modifier
    const addModifier = useCallback(() => {
        const newModifier = createDefaultModifier();
        setFormData(prev => ({
            ...prev,
            modifiers: [...(prev.modifiers || []), newModifier]
        }));
    }, [setFormData]);

    // Remove modifier
    const removeModifier = useCallback((index: number) => {
        setFormData(prev => ({
            ...prev,
            modifiers: (prev.modifiers || []).filter((_, i) => i !== index)
        }));

        // Update grouping state
        setGroupingState(prev => updateGroupingStateAfterRemoval(prev, FeatureType.Modifier, index));
    }, [setFormData, setGroupingState]);

    // Add choice
    const addChoice = useCallback(() => {
        const newChoice = createDefaultChoice();
        setFormData(prev => ({
            ...prev,
            choices: [...(prev.choices || []), newChoice]
        }));
    }, [setFormData]);

    // Remove choice
    const removeChoice = useCallback((index: number) => {
        setFormData(prev => ({
            ...prev,
            choices: (prev.choices || []).filter((_, i) => i !== index)
        }));

        // Update grouping state
        setGroupingState(prev => updateGroupingStateAfterRemoval(prev, FeatureType.Choice, index));
    }, [setFormData, setGroupingState]);

    // Toggle modifier section
    const toggleModifiers = useCallback((checked: boolean) => {
        if (checked && !(formData.modifiers || []).length) {
            addModifier();
        } else if (!checked && (formData.modifiers || []).length) {
            setFormData(prev => ({ ...prev, modifiers: [] }));
        }
    }, [formData, addModifier, setFormData]);

    // Toggle choice section
    const toggleChoices = useCallback((checked: boolean) => {
        if (checked && !(formData.choices || []).length) {
            addChoice();
        } else if (!checked && (formData.choices || []).length) {
            setFormData(prev => ({ ...prev, choices: [] }));
        }
    }, [formData, addChoice, setFormData]);

    return {
        addModifier,
        removeModifier,
        addChoice,
        removeChoice,
        toggleModifiers,
        toggleChoices
    };
}

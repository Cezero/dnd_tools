import { useCallback } from 'react';

import type { FeatureProgression } from '@shared/schema';

import { updateGroupingStateAfterRemoval } from './entityHelpers';
import { createDefaultEntity } from './formDataTransformers';
import type { GroupingState } from './types';


export function useEntityManagement(
    formData: FeatureProgression,
    setFormData: (data: FeatureProgression | ((prev: FeatureProgression) => FeatureProgression)) => void,
    groupingState: GroupingState,
    setGroupingState: (state: GroupingState | ((prev: GroupingState) => GroupingState)) => void
) {
    // Add entity
    const addEntity = useCallback(() => {
        const newEntity = createDefaultEntity();
        setFormData(prev => ({
            ...prev,
            entities: [...(prev.entities || []), newEntity]
        }));
    }, [setFormData]);

    // Remove entity
    const removeEntity = useCallback((index: number) => {
        setFormData(prev => ({
            ...prev,
            entities: (prev.entities || []).filter((_, i) => i !== index)
        }));

        // Update grouping state
        setGroupingState(prev => updateGroupingStateAfterRemoval(prev, index));
    }, [setFormData, setGroupingState]);

    // Toggle entities section
    const toggleEntities = useCallback((checked: boolean) => {
        if (checked && !(formData.entities || []).length) {
            addEntity();
        } else if (!checked && (formData.entities || []).length) {
            setFormData(prev => ({ ...prev, entities: [] }));
        }
    }, [formData, addEntity, setFormData]);

    return {
        addEntity,
        removeEntity,
        toggleEntities
    };
}

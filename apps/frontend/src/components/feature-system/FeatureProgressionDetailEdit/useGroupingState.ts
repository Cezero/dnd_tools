import { useState, useEffect } from 'react';

import type { FeatureProgression } from '@shared/schema';
import { FeatureType } from '@shared/static-data';

import { updateGroupingState } from './entityHelpers';
import type { GroupingState } from './types';

export function useGroupingState(progression: FeatureProgression | null) {
    // Grouping state management - initialize empty
    const [groupingState, setGroupingState] = useState<GroupingState>({
        [FeatureType.Modifier]: new Map<number, number>(),
        [FeatureType.Choice]: new Map<number, number>()
    });

    // Initialize grouping state from existing entities
    useEffect(() => {
        if (!progression) return;

        const newGroupingState = {
            [FeatureType.Modifier]: new Map<number, number>(),
            [FeatureType.Choice]: new Map<number, number>()
        };

        // Initialize from existing progression data
        (progression.modifiers || []).forEach((modifier, index) => {
            newGroupingState[FeatureType.Modifier].set(index, modifier.groupingId || 0);
        });
        (progression.choices || []).forEach((choice, index) => {
            newGroupingState[FeatureType.Choice].set(index, choice.groupingId || 0);
        });

        setGroupingState(newGroupingState);
    }, [progression]);

    // Update grouping state for a specific entity
    const updateEntityGrouping = (
        entityType: FeatureType,
        index: number,
        groupingId: number
    ) => {
        setGroupingState(prev => updateGroupingState(prev, entityType, index, groupingId));
    };

    return {
        groupingState,
        setGroupingState,
        updateEntityGrouping
    };
}

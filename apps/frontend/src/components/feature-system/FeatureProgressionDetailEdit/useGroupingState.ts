import { useState, useEffect } from 'react';

import type { FeatureProgression } from '@shared/schema';

import { updateGroupingState } from './entityHelpers';
import type { GroupingState } from './types';

export function useGroupingState(progression: FeatureProgression | null) {
    // Grouping state management - initialize empty
    const [groupingState, setGroupingState] = useState<GroupingState>({});

    // Initialize grouping state from existing entities
    useEffect(() => {
        if (!progression) return;

        const newGroupingState: GroupingState = {};

        // Initialize from existing progression data
        (progression.entities || []).forEach((entity, index) => {
            newGroupingState[index] = new Map<number, number>();
            newGroupingState[index].set(index, entity.groupingId || 0);
        });

        setGroupingState(newGroupingState);
    }, [progression]);

    // Update grouping state for a specific entity
    const updateEntityGrouping = (
        index: number,
        groupingId: number
    ) => {
        setGroupingState(prev => updateGroupingState(prev, index, groupingId));
    };

    return {
        groupingState,
        setGroupingState,
        updateEntityGrouping
    };
}

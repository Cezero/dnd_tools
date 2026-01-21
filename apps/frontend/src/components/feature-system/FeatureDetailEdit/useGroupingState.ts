import { useState, useEffect } from 'react';

import type { FeatureWithRelations } from '@shared/schema';

import { updateGroupingState } from './entityHelpers';
import type { GroupingState } from './types';

export function useGroupingState(feature: FeatureWithRelations | null) {
    // Grouping state management - initialize empty
    const [groupingState, setGroupingState] = useState<GroupingState>({});

    // Initialize grouping state from existing entities
    useEffect(() => {
        if (!feature) return;

        const newGroupingState: GroupingState = {};

        // Initialize from existing feature data
        (feature.entities || []).forEach((entity, index) => {
            newGroupingState[index] = new Map<number, number>();
            newGroupingState[index].set(index, entity.groupingId || 0);
        });

        setGroupingState(newGroupingState);
    }, [feature]);

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

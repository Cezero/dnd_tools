import type { FeatureEntity } from '@shared/schema';

import type { GroupingState } from './types';

// Helper function to update grouping state after entity removal
export function updateGroupingStateAfterRemoval(
    groupingState: GroupingState,
    removedIndex: number
): GroupingState {
    const newState = { ...groupingState };

    // Remove the deleted index
    delete newState[removedIndex];

    // Shift down all indices after the removed item
    for (let i = removedIndex; i < Object.keys(newState).length; i++) {
        const nextIndex = i + 1;
        if (newState[nextIndex]) {
            newState[i] = newState[nextIndex];
            delete newState[nextIndex];
        }
    }

    return newState;
}

// Helper function to update grouping state
export function updateGroupingState(
    groupingState: GroupingState,
    index: number,
    groupingId: number
): GroupingState {
    const newState = { ...groupingState };

    if (!newState[index]) {
        newState[index] = new Map<number, number>();
    }

    newState[index].set(index, groupingId);

    return newState;
}

// Helper function to get entities grouped by groupingId
export function getGroupedEntities(
    entities: FeatureEntity[]
): Map<number, number[]> {
    const groups = new Map<number, number[]>();

    entities.forEach((entity, index) => {
        const groupingId = entity.groupingId || 0;
        if (!groups.has(groupingId)) {
            groups.set(groupingId, []);
        }
        groups.get(groupingId)!.push(index);
    });

    return groups;
}

import type { FeatureModifier, FeatureChoice } from '@shared/schema';
import { FeatureType } from '@shared/static-data';

import type { GroupingState } from './types';

// Helper function to update grouping state after entity removal
export function updateGroupingStateAfterRemoval(
    groupingState: GroupingState,
    entityType: FeatureType,
    removedIndex: number
): GroupingState {
    const newState = { ...groupingState };
    const entityMap = new Map(newState[entityType]);

    // Remove the deleted index
    entityMap.delete(removedIndex);

    // Shift down all indices after the removed item
    for (let i = removedIndex; i < entityMap.size; i++) {
        const value = entityMap.get(i + 1);
        if (value !== undefined) {
            entityMap.set(i, value);
            entityMap.delete(i + 1);
        }
    }

    newState[entityType] = entityMap;
    return newState;
}

// Helper function to update grouping state
export function updateGroupingState(
    groupingState: GroupingState,
    entityType: FeatureType,
    index: number,
    groupingId: number
): GroupingState {
    const newState = { ...groupingState };
    const entityMap = new Map(newState[entityType]);

    entityMap.set(index, groupingId);
    newState[entityType] = entityMap;

    return newState;
}

// Helper function to get entities grouped by groupingId
export function getGroupedEntities(
    entities: (FeatureModifier | FeatureChoice)[]
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

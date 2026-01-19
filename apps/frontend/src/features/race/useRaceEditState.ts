import { useGenericEditState } from '@/lib/hooks/useGenericEditState';

import type { RaceEditState, RaceEditStateUpdate } from './types';
import { RaceEditStateUpdateType } from './types';

/**
 * Custom hook for managing centralized race edit state.
 * 
 * Provides a single source of truth for all race data and eliminates
 * the need for per-tab state management. This hook is a thin wrapper
 * around `useGenericEditState` that provides Race-specific configuration.
 * 
 * **Implementation Note**: Uses the generic `useGenericEditState` hook
 * with a Race-specific reducer function. This ensures consistent state
 * management patterns across all entity types.
 * 
 * @param initialState - Optional initial state overrides
 * @returns Object containing current state and update function
 * 
 * @see useGenericEditState - Generic implementation
 */
export function useRaceEditState(initialState?: Partial<RaceEditState>) {
    return useGenericEditState<RaceEditState, RaceEditStateUpdate>(
        {
            initialState: {
                // Core race identity
                raceId: null,
                name: '',
                editionId: 1, // Default edition
                isVisible: true,
                description: null,
                sourceBookInfo: null,

                // Feature progressions
                featureProgressions: [],

                // UI state
                activeTab: 'basic',
                isFeatureAssocOpen: false,
                isProgressionDialogOpen: false,
                editingProgression: null,
                preSelectedFeature: undefined,
            },
            reducer: (state, update) => {
                switch (update.type) {
                    case RaceEditStateUpdateType.SET_RACE_ID:
                        return { ...state, raceId: update.payload.raceId };
                    case RaceEditStateUpdateType.SET_NAME:
                        return { ...state, name: update.payload.name };
                    case RaceEditStateUpdateType.SET_EDITION_ID:
                        return { ...state, editionId: update.payload.editionId };
                    case RaceEditStateUpdateType.SET_IS_VISIBLE:
                        return { ...state, isVisible: update.payload.isVisible };
                    case RaceEditStateUpdateType.SET_DESCRIPTION:
                        return { ...state, description: update.payload.description };
                    case RaceEditStateUpdateType.SET_SOURCE_BOOK_INFO:
                        return { ...state, sourceBookInfo: update.payload.sourceBookInfo };
                    case RaceEditStateUpdateType.SET_FEATURE_PROGRESSIONS:
                        return { ...state, featureProgressions: update.payload.featureProgressions };
                    case RaceEditStateUpdateType.ADD_FEATURE_PROGRESSION:
                        return { ...state, featureProgressions: [...state.featureProgressions, update.payload.progression] };
                    case RaceEditStateUpdateType.UPDATE_FEATURE_PROGRESSION: {
                        const index = state.featureProgressions.findIndex(p => p.id === update.payload.progressionId);
                        if (index === -1) return state;
                        return {
                            ...state,
                            featureProgressions: [
                                ...state.featureProgressions.slice(0, index),
                                { ...state.featureProgressions[index], ...update.payload.progression },
                                ...state.featureProgressions.slice(index + 1)
                            ]
                        };
                    }
                    case RaceEditStateUpdateType.REMOVE_FEATURE_PROGRESSION:
                        return {
                            ...state,
                            featureProgressions: state.featureProgressions.filter(p => p.id !== update.payload.progressionId)
                        };
                    case RaceEditStateUpdateType.SET_ACTIVE_TAB:
                        return { ...state, activeTab: update.payload.activeTab };
                    case RaceEditStateUpdateType.SET_IS_FEATURE_ASSOC_OPEN:
                        return { ...state, isFeatureAssocOpen: update.payload.isFeatureAssocOpen };
                    case RaceEditStateUpdateType.SET_IS_PROGRESSION_DIALOG_OPEN:
                        return { ...state, isProgressionDialogOpen: update.payload.isProgressionDialogOpen };
                    case RaceEditStateUpdateType.SET_EDITING_PROGRESSION:
                        return { ...state, editingProgression: update.payload.editingProgression };
                    case RaceEditStateUpdateType.SET_PRE_SELECTED_FEATURE:
                        return { ...state, preSelectedFeature: update.payload.preSelectedFeature };
                    default:
                        return state;
                }
            }
        },
        initialState
    );
}

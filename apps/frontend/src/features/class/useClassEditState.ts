import { useGenericEditState } from '@/lib/hooks/useGenericEditState';

import type { ClassEditState, ClassEditStateUpdate } from './types';
import { ClassEditStateUpdateType } from './types';

/**
 * Custom hook for managing centralized class edit state.
 * 
 * Provides a single source of truth for all class data and eliminates
 * the need for per-tab state management. This hook is a thin wrapper
 * around `useGenericEditState` that provides Class-specific configuration.
 * 
 * **Implementation Note**: Uses the generic `useGenericEditState` hook
 * with a Class-specific reducer function. This ensures consistent state
 * management patterns across all entity types.
 * 
 * @param initialState - Optional initial state overrides
 * @returns Object containing current state and update function
 * 
 * @see useGenericEditState - Generic implementation
 */
export function useClassEditState(initialState?: Partial<ClassEditState>) {
    return useGenericEditState<ClassEditState, ClassEditStateUpdate>(
        {
            initialState: {
                // Core class identity
                classId: null,
                name: '',
                abbreviation: '',
                editionId: 1, // Default edition
                isPrestige: false,
                isVisible: true,
                canCastSpells: false,
                spellsKnown: false,
                isDivine: false,
                description: null,

                // Feature progressions
                featureProgressions: [],

                // Spellcasting progressions
                spellcastingProgression: [],
                spellsKnownProgression: [],

                // UI state
                activeTab: 'basic',
                isFeatureAssocOpen: false,
                isProgressionDialogOpen: false,
                editingProgression: null,
                preSelectedFeature: undefined,
            },
            reducer: (state, update) => {
                switch (update.type) {
                    case ClassEditStateUpdateType.SET_CLASS_ID:
                        return { ...state, classId: update.payload.classId };
                    case ClassEditStateUpdateType.SET_NAME:
                        return { ...state, name: update.payload.name };
                    case ClassEditStateUpdateType.SET_ABBREVIATION:
                        return { ...state, abbreviation: update.payload.abbreviation };
                    case ClassEditStateUpdateType.SET_EDITION_ID:
                        return { ...state, editionId: update.payload.editionId };
                    case ClassEditStateUpdateType.SET_IS_PRESTIGE:
                        return { ...state, isPrestige: update.payload.isPrestige };
                    case ClassEditStateUpdateType.SET_IS_VISIBLE:
                        return { ...state, isVisible: update.payload.isVisible };
                    case ClassEditStateUpdateType.SET_CAN_CAST_SPELLS:
                        return { ...state, canCastSpells: update.payload.canCastSpells };
                    case ClassEditStateUpdateType.SET_SPELLS_KNOWN:
                        return { ...state, spellsKnown: update.payload.spellsKnown };
                    case ClassEditStateUpdateType.SET_IS_DIVINE:
                        return { ...state, isDivine: update.payload.isDivine };
                    case ClassEditStateUpdateType.SET_DESCRIPTION:
                        return { ...state, description: update.payload.description };
                    case ClassEditStateUpdateType.SET_FEATURE_PROGRESSIONS:
                        return { ...state, featureProgressions: update.payload.featureProgressions };
                    case ClassEditStateUpdateType.ADD_FEATURE_PROGRESSION:
                        return { ...state, featureProgressions: [...state.featureProgressions, update.payload.progression] };
                    case ClassEditStateUpdateType.UPDATE_FEATURE_PROGRESSION: {
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
                    case ClassEditStateUpdateType.REMOVE_FEATURE_PROGRESSION:
                        return {
                            ...state,
                            featureProgressions: state.featureProgressions.filter(p => p.id !== update.payload.progressionId)
                        };
                    case ClassEditStateUpdateType.SET_SPELLCASTING_PROGRESSION:
                        return { ...state, spellcastingProgression: update.payload.progression };
                    case ClassEditStateUpdateType.SET_SPELLS_KNOWN_PROGRESSION:
                        return { ...state, spellsKnownProgression: update.payload.progression };
                    case ClassEditStateUpdateType.SET_ACTIVE_TAB:
                        return { ...state, activeTab: update.payload.activeTab };
                    case ClassEditStateUpdateType.SET_IS_FEATURE_ASSOC_OPEN:
                        return { ...state, isFeatureAssocOpen: update.payload.isFeatureAssocOpen };
                    case ClassEditStateUpdateType.SET_IS_PROGRESSION_DIALOG_OPEN:
                        return { ...state, isProgressionDialogOpen: update.payload.isProgressionDialogOpen };
                    case ClassEditStateUpdateType.SET_EDITING_PROGRESSION:
                        return { ...state, editingProgression: update.payload.editingProgression };
                    case ClassEditStateUpdateType.SET_PRE_SELECTED_FEATURE:
                        return { ...state, preSelectedFeature: update.payload.preSelectedFeature };
                    default:
                        return state;
                }
            }
        },
        initialState
    );
}

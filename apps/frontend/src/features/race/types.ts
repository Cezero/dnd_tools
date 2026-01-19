import type { RaceEditState as SharedRaceEditState, FeatureProgression, SourceMap } from '@shared/schema';

/**
 * Centralized state for RaceEdit component that eliminates per-tab state management
 * and provides a single source of truth for all race data.
 * 
 * Extends the shared RaceEditState with UI-specific state fields.
 */
export interface RaceEditState extends SharedRaceEditState {
    // UI state
    activeTab: string;
    isFeatureAssocOpen: boolean;
    isProgressionDialogOpen: boolean;
    editingProgression: FeatureProgression | null;
    preSelectedFeature: FeatureProgression['feature'] | undefined;
}

/**
 * Granular update types for performance optimization.
 * Each update type targets specific state properties to minimize re-renders.
 */
export enum RaceEditStateUpdateType {
    SET_RACE_ID = 0,
    SET_NAME = 1,
    SET_EDITION_ID = 2,
    SET_IS_VISIBLE = 3,
    SET_DESCRIPTION = 4,
    SET_SOURCE_BOOK_INFO = 5,
    SET_FEATURE_PROGRESSIONS = 6,
    ADD_FEATURE_PROGRESSION = 7,
    UPDATE_FEATURE_PROGRESSION = 8,
    REMOVE_FEATURE_PROGRESSION = 9,
    SET_ACTIVE_TAB = 10,
    SET_IS_FEATURE_ASSOC_OPEN = 11,
    SET_IS_PROGRESSION_DIALOG_OPEN = 12,
    SET_EDITING_PROGRESSION = 13,
    SET_PRE_SELECTED_FEATURE = 14,
}

export type RaceEditStateUpdate =
    | { type: RaceEditStateUpdateType.SET_RACE_ID; payload: { raceId: number | null } }
    | { type: RaceEditStateUpdateType.SET_NAME; payload: { name: string } }
    | { type: RaceEditStateUpdateType.SET_EDITION_ID; payload: { editionId: number } }
    | { type: RaceEditStateUpdateType.SET_IS_VISIBLE; payload: { isVisible: boolean } }
    | { type: RaceEditStateUpdateType.SET_DESCRIPTION; payload: { description: string | null } }
    | { type: RaceEditStateUpdateType.SET_SOURCE_BOOK_INFO; payload: { sourceBookInfo: SourceMap[] | null } }
    | { type: RaceEditStateUpdateType.SET_FEATURE_PROGRESSIONS; payload: { featureProgressions: FeatureProgression[] } }
    | { type: RaceEditStateUpdateType.ADD_FEATURE_PROGRESSION; payload: { progression: FeatureProgression } }
    | { type: RaceEditStateUpdateType.UPDATE_FEATURE_PROGRESSION; payload: { progressionId: number; progression: Partial<FeatureProgression> } }
    | { type: RaceEditStateUpdateType.REMOVE_FEATURE_PROGRESSION; payload: { progressionId: number } }
    | { type: RaceEditStateUpdateType.SET_ACTIVE_TAB; payload: { activeTab: string } }
    | { type: RaceEditStateUpdateType.SET_IS_FEATURE_ASSOC_OPEN; payload: { isFeatureAssocOpen: boolean } }
    | { type: RaceEditStateUpdateType.SET_IS_PROGRESSION_DIALOG_OPEN; payload: { isProgressionDialogOpen: boolean } }
    | { type: RaceEditStateUpdateType.SET_EDITING_PROGRESSION; payload: { editingProgression: FeatureProgression | null } }
    | { type: RaceEditStateUpdateType.SET_PRE_SELECTED_FEATURE; payload: { preSelectedFeature: FeatureProgression['feature'] | undefined } };

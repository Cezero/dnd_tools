import type { RaceEditState as SharedRaceEditState, SourceMap } from '@shared/schema';

/**
 * Centralized state for RaceEdit component that eliminates per-tab state management
 * and provides a single source of truth for all race data.
 * 
 * Extends the shared RaceEditState with UI-specific state fields.
 * 
 * **Note**: Features are now managed independently via the feature state system.
 * Race state only contains featureIds, not full feature objects.
 */
export interface RaceEditState extends SharedRaceEditState {
    // UI state
    activeTab: string;
    isFeatureAssocOpen: boolean;
    editingFeatureId: number | null;
    preSelectedFeatureId: number | undefined;
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
    SET_FEATURE_IDS = 6,
    LINK_FEATURE = 7,
    UNLINK_FEATURE = 8,
    SET_ACTIVE_TAB = 10,
    SET_IS_FEATURE_ASSOC_OPEN = 11,
    SET_EDITING_FEATURE_ID = 12,
    SET_PRE_SELECTED_FEATURE_ID = 13,
}

export type RaceEditStateUpdate =
    | { type: RaceEditStateUpdateType.SET_RACE_ID; payload: { raceId: number | null } }
    | { type: RaceEditStateUpdateType.SET_NAME; payload: { name: string } }
    | { type: RaceEditStateUpdateType.SET_EDITION_ID; payload: { editionId: number } }
    | { type: RaceEditStateUpdateType.SET_IS_VISIBLE; payload: { isVisible: boolean } }
    | { type: RaceEditStateUpdateType.SET_DESCRIPTION; payload: { description: string | null } }
    | { type: RaceEditStateUpdateType.SET_SOURCE_BOOK_INFO; payload: { sourceBookInfo: SourceMap[] | null } }
    | { type: RaceEditStateUpdateType.SET_FEATURE_IDS; payload: { featureIds: number[] } }
    | { type: RaceEditStateUpdateType.LINK_FEATURE; payload: { featureId: number } }
    | { type: RaceEditStateUpdateType.UNLINK_FEATURE; payload: { featureId: number } }
    | { type: RaceEditStateUpdateType.SET_ACTIVE_TAB; payload: { activeTab: string } }
    | { type: RaceEditStateUpdateType.SET_IS_FEATURE_ASSOC_OPEN; payload: { isFeatureAssocOpen: boolean } }
    | { type: RaceEditStateUpdateType.SET_EDITING_FEATURE_ID; payload: { editingFeatureId: number | null } }
    | { type: RaceEditStateUpdateType.SET_PRE_SELECTED_FEATURE_ID; payload: { preSelectedFeatureId: number | undefined } };

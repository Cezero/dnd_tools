import type { ClassEditState as SharedClassEditState, FeatureProgression, SpellcastingProgressionWithSlots } from '@shared/schema';

/**
 * Centralized state for ClassEdit component that eliminates per-tab state management
 * and provides a single source of truth for all class data.
 * 
 * Extends the shared ClassEditState with UI-specific state fields.
 */
export interface ClassEditState extends SharedClassEditState {
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
export enum ClassEditStateUpdateType {
    SET_CLASS_ID = 0,
    SET_NAME = 1,
    SET_ABBREVIATION = 2,
    SET_EDITION_ID = 3,
    SET_IS_PRESTIGE = 4,
    SET_IS_VISIBLE = 5,
    SET_CAN_CAST_SPELLS = 6,
    SET_SPELLS_KNOWN = 7,
    SET_IS_DIVINE = 8,
    SET_DESCRIPTION = 9,
    SET_FEATURE_PROGRESSIONS = 10,
    ADD_FEATURE_PROGRESSION = 11,
    UPDATE_FEATURE_PROGRESSION = 12,
    REMOVE_FEATURE_PROGRESSION = 13,
    SET_SPELLCASTING_PROGRESSION = 14,
    SET_SPELLS_KNOWN_PROGRESSION = 15,
    SET_ACTIVE_TAB = 16,
    SET_IS_FEATURE_ASSOC_OPEN = 17,
    SET_IS_PROGRESSION_DIALOG_OPEN = 18,
    SET_EDITING_PROGRESSION = 19,
    SET_PRE_SELECTED_FEATURE = 20,
}

export type ClassEditStateUpdate =
    | { type: ClassEditStateUpdateType.SET_CLASS_ID; payload: { classId: number | null } }
    | { type: ClassEditStateUpdateType.SET_NAME; payload: { name: string } }
    | { type: ClassEditStateUpdateType.SET_ABBREVIATION; payload: { abbreviation: string } }
    | { type: ClassEditStateUpdateType.SET_EDITION_ID; payload: { editionId: number } }
    | { type: ClassEditStateUpdateType.SET_IS_PRESTIGE; payload: { isPrestige: boolean } }
    | { type: ClassEditStateUpdateType.SET_IS_VISIBLE; payload: { isVisible: boolean } }
    | { type: ClassEditStateUpdateType.SET_CAN_CAST_SPELLS; payload: { canCastSpells: boolean } }
    | { type: ClassEditStateUpdateType.SET_SPELLS_KNOWN; payload: { spellsKnown: boolean } }
    | { type: ClassEditStateUpdateType.SET_IS_DIVINE; payload: { isDivine: boolean } }
    | { type: ClassEditStateUpdateType.SET_DESCRIPTION; payload: { description: string | null } }
    | { type: ClassEditStateUpdateType.SET_FEATURE_PROGRESSIONS; payload: { featureProgressions: FeatureProgression[] } }
    | { type: ClassEditStateUpdateType.ADD_FEATURE_PROGRESSION; payload: { progression: FeatureProgression } }
    | { type: ClassEditStateUpdateType.UPDATE_FEATURE_PROGRESSION; payload: { progressionId: number; progression: Partial<FeatureProgression> } }
    | { type: ClassEditStateUpdateType.REMOVE_FEATURE_PROGRESSION; payload: { progressionId: number } }
    | { type: ClassEditStateUpdateType.SET_SPELLCASTING_PROGRESSION; payload: { progression: SpellcastingProgressionWithSlots[] } }
    | { type: ClassEditStateUpdateType.SET_SPELLS_KNOWN_PROGRESSION; payload: { progression: SpellcastingProgressionWithSlots[] } }
    | { type: ClassEditStateUpdateType.SET_ACTIVE_TAB; payload: { activeTab: string } }
    | { type: ClassEditStateUpdateType.SET_IS_FEATURE_ASSOC_OPEN; payload: { isFeatureAssocOpen: boolean } }
    | { type: ClassEditStateUpdateType.SET_IS_PROGRESSION_DIALOG_OPEN; payload: { isProgressionDialogOpen: boolean } }
    | { type: ClassEditStateUpdateType.SET_EDITING_PROGRESSION; payload: { editingProgression: FeatureProgression | null } }
    | { type: ClassEditStateUpdateType.SET_PRE_SELECTED_FEATURE; payload: { preSelectedFeature: FeatureProgression['feature'] | undefined } };

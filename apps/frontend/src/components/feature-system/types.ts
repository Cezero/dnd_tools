import type { FeatureWithRelations } from '@shared/schema';
import { FeatureSourceType } from '@shared/static-data';

import type { ClassEditState, ClassEditStateUpdate } from '../../features/class/types';
import type { RaceEditState, RaceEditStateUpdate } from '../../features/race/types';

// Minimal state interface for components that don't use ClassEditState/RaceEditState
export interface MinimalFeatureState {
    features: FeatureWithRelations[];
    editingProgression?: FeatureWithRelations | null;
    isProgressionDialogOpen?: boolean;
    preSelectedFeature?: FeatureWithRelations | null;
}

// Discriminated union for minimal state updates with type-safe payloads
export type MinimalStateUpdate =
    | { type: 'SET_FEATURES'; payload: { features: FeatureWithRelations[] } }
    | { type: 'SET_EDITING_PROGRESSION'; payload: { editingProgression: FeatureWithRelations | null } }
    | { type: 'SET_IS_PROGRESSION_DIALOG_OPEN'; payload: { isProgressionDialogOpen: boolean } }
    | { type: 'SET_PRE_SELECTED_FEATURE'; payload: { preSelectedFeature: FeatureWithRelations | null } }
    | { type: 'ADD_FEATURE_PROGRESSION'; payload: { feature: FeatureWithRelations } }
    | { type: 'REMOVE_FEATURE_PROGRESSION'; payload: { featureId: number } };

// Union types for edit state (exported for use in FeaturesManagerProps)
export type EditState = ClassEditState | RaceEditState;
export type EditStateUpdate = ClassEditStateUpdate | RaceEditStateUpdate;

// Props for FeaturesManager component
export interface FeaturesManagerProps {
    // State-based props (required)
    state: EditState | MinimalFeatureState;
    updateState: (update: EditStateUpdate | MinimalStateUpdate) => void;

    // Context-specific props
    contextType: FeatureSourceType;
    contextId?: number; // Optional when using state-based pattern
    parentType?: 'class' | 'race' | 'domain' | 'feat';

    // UI text props
    title: string;
    emptyMessage: string;

    /**
     * Optional link/unlink handlers for parent-managed draft syncing.
     *
     * When provided, FeaturesManager will call these in addition to updating local UI state.
     * This is used by Class/Race edit flows to apply `DraftAction.Add/Remove` updates to the Redis draft.
     */
    onLinkFeatureId?: (featureId: number) => Promise<void> | void;
    onUnlinkFeatureId?: (featureId: number) => Promise<void> | void;

    // Special feature filtering
    excludeSpecialFeatures?: number[];
}

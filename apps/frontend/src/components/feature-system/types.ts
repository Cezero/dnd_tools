import type { ComponentType } from 'react';

import type { FeatureWithRelations } from '@shared/schema';
import { FeatureSourceType } from '@shared/static-data';

import type { ClassEditState, ClassEditStateUpdate } from '../../features/class/types';
import type { RaceEditState, RaceEditStateUpdate } from '../../features/race/types';

// Feature system specific types
// These types are used for feature data management and UI state

export interface ProficiencyFeat {
    id: number;
    name: string;
    proficiencyTypeId: number;
}

export interface ProficiencyItem {
    id: number;
    name: string;
    typeId: number;
    weapon?: {
        category: number;
        type: number;
    };
    armor?: {
        category: number;
    };
}

// Feature form state
export interface FeatureFormState {
    isEditing: boolean;
    isSaving: boolean;
    hasChanges: boolean;
    errors: Record<string, string>;
}

// Feature selection state
export interface FeatureSelectionState {
    selectedFeatureId?: number;
    selectedProgressionId?: number;
    selectedChoiceId?: number;
}

// Feature validation state
export interface FeatureValidationState {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

// Feature filter state
export interface FeatureFilterState {
    searchTerm: string;
    selectedTypes: number[];
    selectedSources: number[];
    selectedLevels: number[];
}

// Feature sort state
export interface FeatureSortState {
    sortBy: 'name' | 'level' | 'type' | 'source';
    sortDirection: 'asc' | 'desc';
}

// Feature pagination state
export interface FeaturePaginationState {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

// Feature list state
export interface FeatureListState {
    features: FeatureWithRelations[];
    loading: boolean;
    error?: string;
    filter: FeatureFilterState;
    sort: FeatureSortState;
    pagination: FeaturePaginationState;
}

// Feature detail state
export interface FeatureDetailState {
    feature?: FeatureWithRelations;
    features: FeatureWithRelations[];
    loading: boolean;
    error?: string;
}

// Feature edit state
export interface FeatureEditState {
    originalFeature?: FeatureWithRelations;
    editedFeature?: FeatureWithRelations;
    isDirty: boolean;
    saving: boolean;
    error?: string;
}

// Component prop types for different entity forms
export interface BaseFormProps {
    index: number;
    preSelectedFeature?: { id: number; name: string; description: string; slug: string };
    feature?: FeatureWithRelations | null;
}

// Entity type configuration for reusable rendering in FeatureEditForm
export interface EntityTypeConfig<TFormData = Record<string, unknown>, TGroupingState = Record<string, unknown>> {
    key: 'entities';
    label: string;
    formComponent: ComponentType<BaseFormProps>;
    addFunction: () => void;
    removeFunction: (index: number) => void;
    formDataKey: keyof TFormData;
    groupingStateKey: keyof TGroupingState;
    hasFeature: boolean;
}

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

    // Special feature filtering
    excludeSpecialFeatures?: number[];
}

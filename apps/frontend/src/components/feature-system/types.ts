import type { ComponentType } from 'react';

import type { FeatureProgression } from '@shared/schema';

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
    features: FeatureProgression[];
    loading: boolean;
    error?: string;
    filter: FeatureFilterState;
    sort: FeatureSortState;
    pagination: FeaturePaginationState;
}

// Feature detail state
export interface FeatureDetailState {
    feature?: FeatureProgression;
    progressions: FeatureProgression[];
    loading: boolean;
    error?: string;
}

// Feature edit state
export interface FeatureEditState {
    originalFeature?: FeatureProgression;
    editedFeature?: FeatureProgression;
    isDirty: boolean;
    saving: boolean;
    error?: string;
}

// Component prop types for different entity forms
export interface BaseFormProps {
    index: number;
    preSelectedFeature?: { id: number; name: string; description: string; slug: string };
    progression?: FeatureProgression | null;
}

export interface ModifierFormProps extends BaseFormProps {
    feats: Array<{ id: number; name: string }>;
    featsLoading: boolean;
}

export type ChoiceFormProps = BaseFormProps;

export type EffectFormProps = BaseFormProps;

// Union type for all possible form component props
export type FormComponentProps = ModifierFormProps | ChoiceFormProps | EffectFormProps;

// Entity type configuration for reusable rendering in FeatureProgressionDetailEdit
export interface EntityTypeConfig<TFormData = Record<string, unknown>, TGroupingState = Record<string, unknown>> {
    key: 'modifiers' | 'choices';
    label: string;
    formComponent: ComponentType<FormComponentProps>;
    addFunction: () => void;
    removeFunction: (index: number) => void;
    formDataKey: keyof TFormData;
    groupingStateKey: keyof TGroupingState;
    hasFeature: boolean;
}

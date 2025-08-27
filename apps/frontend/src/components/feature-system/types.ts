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

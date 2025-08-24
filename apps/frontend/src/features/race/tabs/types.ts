import { FeatureProgressionWithRelations } from '@shared/schema';

// Form data type for race editing
export interface RaceFormData {
    id?: number;
    name: string;
    editionId: number;
    isVisible: boolean;
    description: string;
    sizeId: number;
    speed: number;
    favoredClassId: number;
}

// Validation state interface
interface ValidationState {
    hasErrors: boolean;
    getError: (field: string) => string | null;
    validateForm: (data: any) => boolean;
    validationState: {
        errors: Record<string, string[]>;
        touched: Record<string, boolean>;
    };
    [key: string]: unknown;
}

// Props interface for all tab components
export interface RaceTabProps {
    formData: RaceFormData;
    setFormData: (data: RaceFormData) => void;
    validation: ValidationState;
    isLoading?: boolean;
    featureProgressions?: FeatureProgressionWithRelations[];
    setFeatureProgressions?: (progressions: FeatureProgressionWithRelations[]) => void;

    // Dialog state and handlers
    isFeatureAssocOpen?: boolean;
    setIsFeatureAssocOpen?: (open: boolean) => void;
    isProgressionDialogOpen?: boolean;
    setIsProgressionDialogOpen?: (open: boolean) => void;
    editingProgression?: FeatureProgressionWithRelations | null;
    setEditingProgression?: (progression: FeatureProgressionWithRelations | null) => void;
    preSelectedFeature?: FeatureProgressionWithRelations['feature'] | null;
    setPreSelectedFeature?: (feature: FeatureProgressionWithRelations['feature'] | null) => void;

    // Feature management callbacks
    onEditProgression?: (progression: FeatureProgressionWithRelations) => void;
    onRemoveProgression?: (progressionId: number) => void;
    onAddFeature?: (feature: { id: number; name: string; description: string; slug: string }) => void;

    // Special feature callbacks (already implemented)
    onAddLanguage?: (languageId: number, isAutomatic: boolean) => void;
    onRemoveLanguage?: (languageId: number) => void;
    onAbilityChange?: (abilityId: number, parsedValue: number) => void;

    raceId?: number;
}

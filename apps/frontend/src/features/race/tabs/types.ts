import { useZodValidation } from '@/hooks/useZodValidation';
import type { CreateRaceRequest, FeatureProgression, UpdateRaceRequest } from '@shared/schema';

// Form data type for race editing
export type RaceFormData = CreateRaceRequest | UpdateRaceRequest;

// Props interface for all tab components
export interface RaceTabProps {
    formData: RaceFormData;
    setFormData: (data: RaceFormData) => void;
    validation: ReturnType<typeof useZodValidation>;
    isLoading?: boolean;
    featureProgressions?: FeatureProgression[];
    setFeatureProgressions?: (progressions: FeatureProgression[]) => void;

    // Dialog state and handlers
    isFeatureAssocOpen?: boolean;
    setIsFeatureAssocOpen?: (open: boolean) => void;
    isProgressionDialogOpen?: boolean;
    setIsProgressionDialogOpen?: (open: boolean) => void;
    editingProgression?: FeatureProgression | null;
    setEditingProgression?: (progression: FeatureProgression | null) => void;
    preSelectedFeature?: FeatureProgression['feature'] | null;
    setPreSelectedFeature?: (feature: FeatureProgression['feature'] | null) => void;

    // Feature management callbacks
    onEditProgression?: (progression: FeatureProgression) => void;
    onRemoveProgression?: (progressionId: number) => void;
    onAddFeature?: (feature: { id: number; name: string; description: string; slug: string }) => void;

    // Special feature callbacks (already implemented)
    onAddLanguage?: (languageId: number, isAutomatic: boolean) => void;
    onRemoveLanguage?: (languageId: number) => void;
    onAbilityChange?: (abilityId: number, parsedValue: number) => void;

    raceId?: number;
}

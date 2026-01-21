import { useZodValidation } from '@/hooks/useZodValidation';
import type { CreateRaceRequest, FeatureWithRelations, UpdateRaceRequest } from '@shared/schema';

import type { RaceEditState, RaceEditStateUpdate } from '../types';

// Form data type for race editing
export type RaceFormData = CreateRaceRequest | UpdateRaceRequest;

// Props interface for all tab components
export interface RaceTabProps {
    // State-based props (preferred)
    state: RaceEditState;
    updateState: (update: RaceEditStateUpdate) => void;
    validation: ReturnType<typeof useZodValidation>;
    isLoading?: boolean;
    features?: FeatureWithRelations[];
    setFeatures?: (features: FeatureWithRelations[]) => void;

    // Dialog state and handlers
    isFeatureAssocOpen?: boolean;
    setIsFeatureAssocOpen?: (open: boolean) => void;
    isProgressionDialogOpen?: boolean;
    setIsProgressionDialogOpen?: (open: boolean) => void;
    editingProgression?: FeatureWithRelations | null;
    setEditingProgression?: (feature: FeatureWithRelations | null) => void;
    preSelectedFeature?: FeatureWithRelations | null;
    setPreSelectedFeature?: (feature: FeatureWithRelations | null) => void;

    // Feature management callbacks
    onEditProgression?: (feature: FeatureWithRelations) => void;
    onRemoveProgression?: (progressionId: number) => void;
    onAddFeature?: (feature: { id: number; name: string; description: string; slug: string }) => void;

    // Special feature callbacks (already implemented)
    onAddLanguage?: (languageId: number, isAutomatic: boolean) => void;
    onRemoveLanguage?: (languageId: number) => void;
    onAbilityChange?: (abilityId: number, parsedValue: number) => void;

    raceId?: number;
}

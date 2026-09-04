import { useZodValidation } from '@/lib/hooks/useZodValidation';
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
    /**
     * Parent-managed link/unlink callbacks for draft syncing.
     *
     * For race editing, these call `resolution.updateValue('featureIds', id, DraftAction.Add/Remove)`
     * so the Redis draft stays in sync when features are linked/unlinked in the UI.
     */
    onLinkFeatureId?: (featureId: number) => Promise<void> | void;
    onUnlinkFeatureId?: (featureId: number) => Promise<void> | void;

    // Special feature callbacks (already implemented)
    onAddLanguage?: (languageId: number, isAutomatic: boolean) => void | Promise<void>;
    onRemoveLanguage?: (languageId: number, isAutomatic: boolean) => void | Promise<void>;
    onAbilityChange?: (abilityId: number, parsedValue: number) => void | Promise<void>;

    raceId?: number;
}

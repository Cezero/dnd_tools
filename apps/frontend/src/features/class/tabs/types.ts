import React from 'react';
import type { CreateClassRequest, UpdateClassRequest, FeatureProgressionWithRelations, SpellcastingProgressionWithSlots } from '@shared/schema';

// Type definitions for the form state
export type ClassFormData = CreateClassRequest | UpdateClassRequest;

// Interface for tab configuration
export interface TabConfig {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    component: React.ComponentType<ClassTabProps>;
}

// Validation interface
interface ValidationState {
    getError?: (field: string) => string | undefined;
    babProgression?: string;
    fortProgression?: string;
    refProgression?: string;
    willProgression?: string;
    [key: string]: unknown;
}

// Props interface for all tab components
export interface ClassTabProps {
    formData: ClassFormData;
    setFormData: (data: ClassFormData) => void;
    validation: ValidationState;
    isLoading?: boolean;
    // Additional props that may be needed by specific tabs
    featureProgressions?: FeatureProgressionWithRelations[];
    setFeatureProgressions?: (progressions: FeatureProgressionWithRelations[]) => void;
    spellcastingProgression?: SpellcastingProgressionWithSlots[];
    setSpellcastingProgression?: (progression: SpellcastingProgressionWithSlots[]) => void;
    spellsKnownProgression?: SpellcastingProgressionWithSlots[];
    setSpellsKnownProgression?: (progression: SpellcastingProgressionWithSlots[]) => void;
    // Dialog state and handlers
    isFeatureAssocOpen?: boolean;
    setIsFeatureAssocOpen?: (open: boolean) => void;
    isProficiencyDialogOpen?: boolean;
    setIsProficiencyDialogOpen?: (open: boolean) => void;
    isProgressionDialogOpen?: boolean;
    setIsProgressionDialogOpen?: (open: boolean) => void;
    editingProgression?: FeatureProgressionWithRelations | null;
    setEditingProgression?: (progression: FeatureProgressionWithRelations | null) => void;
    preSelectedFeature?: FeatureProgressionWithRelations['feature'] | null;
    setPreSelectedFeature?: (feature: FeatureProgressionWithRelations['feature'] | null) => void;
}

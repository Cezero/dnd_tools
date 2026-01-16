import React from 'react';

import { useZodValidation } from '@/hooks/useZodValidation';
import type { CreateClassRequest, UpdateClassRequest, FeatureProgression, SpellcastingProgressionWithSlots } from '@shared/schema';

// Type definitions for the form state
export type ClassFormData = CreateClassRequest | UpdateClassRequest;

// Interface for tab configuration
export interface TabConfig {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    component: React.ComponentType<ClassTabProps>;
}

/**
 * Proficiency item type for proficiencies tab
 */
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


// Props interface for all tab components
export interface ClassTabProps {
    formData: ClassFormData;
    setFormData: (data: ClassFormData) => void;
    validation: ReturnType<typeof useZodValidation>;
    isLoading?: boolean;
    // Additional props that may be needed by specific tabs
    featureProgressions?: FeatureProgression[];
    setFeatureProgressions?: (progressions: FeatureProgression[]) => void;
    spellcastingProgression?: SpellcastingProgressionWithSlots[];
    setSpellcastingProgression?: (progression: SpellcastingProgressionWithSlots[]) => void;
    spellsKnownProgression?: SpellcastingProgressionWithSlots[];
    setSpellsKnownProgression?: (progression: SpellcastingProgressionWithSlots[]) => void;
    // Dialog state and handlers
    isFeatureAssocOpen?: boolean;
    setIsFeatureAssocOpen?: (open: boolean) => void;
    isProgressionDialogOpen?: boolean;
    setIsProgressionDialogOpen?: (open: boolean) => void;
    editingProgression?: FeatureProgression | null;
    setEditingProgression?: (progression: FeatureProgression | null) => void;
    preSelectedFeature?: FeatureProgression['feature'] | null;
    setPreSelectedFeature?: (feature: FeatureProgression['feature'] | null) => void;
    // Skill management callbacks
    onAddSkill: (skillId: number) => void;
    onRemoveSkill: (skillId: number) => void;
    // Proficiency management callbacks
    onAddProficiency: (featId: number, itemId: number, featName: string, itemName: string) => void;
    onRemoveProficiency: (featId: number, itemId: number) => void;
    // Feature management callbacks
    onEditProgression?: (progression: FeatureProgression) => void;
    onRemoveProgression?: (progressionId: number) => void;
    onAddFeature?: (feature: { id: number; name: string; description: string; slug: string }) => void;
    classId?: number;
}

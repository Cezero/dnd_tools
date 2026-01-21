import React from 'react';

import { useZodValidation } from '@/hooks/useZodValidation';
import type { CreateClassRequest, UpdateClassRequest, FeatureWithRelations, SpellcastingProgressionWithSlots } from '@shared/schema';

import type { ClassEditState, ClassEditStateUpdate } from '../types';

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
    // State-based props (preferred)
    state: ClassEditState;
    updateState: (update: ClassEditStateUpdate) => void;
    validation: ReturnType<typeof useZodValidation>;
    isLoading?: boolean;
    // Additional props that may be needed by specific tabs
    features?: FeatureWithRelations[];
    setFeatures?: (features: FeatureWithRelations[]) => void;
    spellcastingProgression?: SpellcastingProgressionWithSlots[];
    setSpellcastingProgression?: (feature: SpellcastingProgressionWithSlots[]) => void;
    spellsKnownProgression?: SpellcastingProgressionWithSlots[];
    setSpellsKnownProgression?: (feature: SpellcastingProgressionWithSlots[]) => void;
    // Dialog state and handlers
    isFeatureAssocOpen?: boolean;
    setIsFeatureAssocOpen?: (open: boolean) => void;
    isProgressionDialogOpen?: boolean;
    setIsProgressionDialogOpen?: (open: boolean) => void;
    editingProgression?: FeatureWithRelations | null;
    setEditingProgression?: (feature: FeatureWithRelations | null) => void;
    preSelectedFeature?: FeatureWithRelations | null;
    setPreSelectedFeature?: (feature: FeatureWithRelations | null) => void;
    // Skill management callbacks
    onAddSkill: (skillId: number) => void;
    onRemoveSkill: (skillId: number) => void;
    // Proficiency management callbacks
    onAddProficiency: (featId: number, itemId: number, featName: string, itemName: string) => void;
    onRemoveProficiency: (featId: number, itemId: number) => void;
    // Feature management callbacks
    onEditProgression?: (feature: FeatureWithRelations) => void;
    onRemoveProgression?: (progressionId: number) => void;
    onAddFeature?: (feature: { id: number; name: string; description: string; slug: string }) => void;
    classId?: number;
}

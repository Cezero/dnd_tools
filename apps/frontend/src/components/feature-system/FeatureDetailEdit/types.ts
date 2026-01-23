import type { ComponentType } from 'react';

import type {
    FeatureEntity,
    FeatureWithRelations,
    Feature,
    FeatureEntityCondition
} from '@shared/schema';
import { EntityAppliesToType, EntityType } from '@shared/static-data';



// Entity type configuration for reusable rendering
export interface EntityTypeConfig {
    key: EntityType;
    label: string;
    formComponent: ComponentType<BaseFormProps>;
    addFunction: () => void;
    removeFunction: (index: number) => void;
    hasFeature: boolean;
}

// Grouping state management
export interface GroupingState {
    [key: number]: Map<number, number>; // index -> groupingId
}

// Hover state for group/ungroup buttons
export interface HoverState {
    hoveredIndex: string | null;
}

// Base form component props
export interface BaseFormProps {
    index: number;
    preSelectedFeature?: Feature;
    feature?: FeatureWithRelations | null;
    editionId?: number | null; // Edition ID for context (e.g., for FavoredClass options)
}

// Formula preview props
export interface FormulaPreviewProps {
    item: FeatureEntity;
    featureLevel: number;
    featureName?: string;
}

// Entity section renderer props
export interface EntitySectionRendererProps {
    config: EntityTypeConfig;
    formData: FeatureWithRelations;
    hoveredIndex: string | null;
    onGroup: (index: number) => void;
    onUngroup: (index: number) => void;
    setHoveredIndex: (index: string | null) => void;
    preSelectedFeature?: Feature;
    feature?: FeatureWithRelations | null;
    editionId?: number | null; // Edition ID for context (e.g., for FavoredClass options)
}

// Section selector props
export interface SectionSelectorProps {
    hasModifiers: boolean;
    hasChoices: boolean;
    modifierCount: number;
    choiceCount: number;
    onModifierToggle: (checked: boolean) => void;
    onChoiceToggle: (checked: boolean) => void;
}

// Grouping controls props
export interface GroupingControlsProps {
    index: number;
    nextIndex: number;
    nextGroupingId: number;
    isGroupButton: boolean;
    onGroup: () => void;
    onUngroup: () => void;
    hoveredIndex: string | null;
    setHoveredIndex: (index: string | null) => void;
}

// Condition editor props
export interface ConditionEditorProps {
    index: number;
    conditions: FeatureEntityCondition[];
    onAddCondition: () => void;
    onRemoveCondition: (conditionIndex: number) => void;
}

// Applies to selector props
export interface AppliesToSelectorProps {
    index: number;
    entityType: EntityType;
    appliesTo: EntityAppliesToType | null;
    // Additional props for enhanced conditional scaling
    formulaId?: number | null;
    valuesRepresent?: number | null;
    editionId?: number | null; // Edition ID for context (e.g., for FavoredClass options)
}

/**
 * Legacy editor props (FeatureDetailEdit component removed).
 *
 * This interface is intentionally removed to prevent new usage.
 */

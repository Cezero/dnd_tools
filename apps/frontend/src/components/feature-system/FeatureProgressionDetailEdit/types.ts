import type { ComponentType } from 'react';

import type {
    FeatureModifier,
    FeatureChoice,
    FeatureProgression,
    Feature,
    FeatureModifierCondition
} from '@shared/schema';
import { FeatureType } from '@shared/static-data';
import type { CoreComponent } from '@shared/static-data';

// Entity type configuration for reusable rendering
export interface EntityTypeConfig {
    key: FeatureType;
    label: string;
    formComponent: ComponentType<ModifierDetailFormProps | ChoiceDetailFormProps>;
    addFunction: () => void;
    removeFunction: (index: number) => void;
    hasFeature: boolean;
}

// Grouping state management
export interface GroupingState {
    [FeatureType.Modifier]: Map<number, number>; // index -> groupingId
    [FeatureType.Choice]: Map<number, number>;
}

// Hover state for group/ungroup buttons
export interface HoverState {
    hoveredIndex: string | null;
    hoveredEntityType: FeatureType | null;
}

// Base form component props
export interface BaseFormProps {
    index: number;
    preSelectedFeature?: Feature;
    progression?: FeatureProgression | null;
}

// Modifier form props
export interface ModifierDetailFormProps extends BaseFormProps {
    feats: CoreComponent[];
    featsLoading: boolean;
}

// Choice form props
export type ChoiceDetailFormProps = BaseFormProps;

// Formula preview props
export interface FormulaPreviewProps {
    item: FeatureModifier | FeatureChoice;
    progressionLevel: number;
    featureName?: string;
}

// Entity section renderer props
export interface EntitySectionRendererProps {
    config: EntityTypeConfig;
    formData: Partial<FeatureProgression>;
    groupingState: GroupingState;
    hoveredIndex: string | null;
    hoveredEntityType: FeatureType | null;
    onGroup: (entityType: FeatureType, index: number) => void;
    onUngroup: (entityType: FeatureType, index: number) => void;
    setHoveredIndex: (index: string | null) => void;
    setHoveredEntityType: (type: FeatureType | null) => void;
    feats?: CoreComponent[];
    featsLoading?: boolean;
    preSelectedFeature?: Feature;
    progression?: FeatureProgression | null;
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
    entityType: FeatureType;
    index: number;
    nextIndex: number;
    nextGroupingId: number;
    isGroupButton: boolean;
    onGroup: () => void;
    onUngroup: () => void;
    hoveredIndex: string | null;
    hoveredEntityType: FeatureType | null;
    setHoveredIndex: (index: string | null) => void;
    setHoveredEntityType: (type: FeatureType | null) => void;
}

// Formula parameters editor props
export interface FormulaParamsEditorProps {
    formulaId: number;
    index: number;
    entityType: FeatureType;
    thresholds?: number[];
    values?: number[];
    onThresholdsChange: (thresholds: number[]) => void;
    onValuesChange: (values: number[]) => void;
}

// Condition editor props
export interface ConditionEditorProps {
    index: number;
    entityType: FeatureType;
    conditions: FeatureModifierCondition[];
    onAddCondition: () => void;
    onRemoveCondition: (conditionIndex: number) => void;
}

// Applies to selector props
export interface AppliesToSelectorProps {
    index: number;
    entityType: FeatureType;
    modifierType: number | null;
    appliesTo: number | null;
    appliesToId: number | null;
    onAppliesToChange: (value: number | null) => void;
    onAppliesToIdChange: (value: number | null) => void;
}

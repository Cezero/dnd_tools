// Main component
export { FeatureProgressionDetailEdit } from './FeatureProgressionDetailEdit';

// Hooks
export { useFeatureProgressionForm } from './useFeatureProgressionForm';
export { useGroupingState } from './useGroupingState';
export { useEntityManagement } from './useEntityManagement';
export { useFormulaPreview } from './useFormulaPreview';

// Components
export { FormulaPreview } from './FormulaPreview';
export { EntitySectionRenderer } from './EntitySectionRenderer';
export { GroupingControls } from './GroupingControls';
export { SectionSelector } from './SectionSelector';

// Form components
export { ModifierDetailForm } from './ModifierDetailForm';
export { ChoiceDetailForm } from './ChoiceDetailForm';

// Shared components
export { FormulaManager } from './FormulaManager';
export { ConditionEditor } from './ConditionEditor';
export { AppliesToSelector } from './AppliesToSelector';

// Types
export type {
    EntityTypeConfig,
    GroupingState,
    HoverState,
    BaseFormProps,
    ModifierDetailFormProps,
    ChoiceDetailFormProps,
    FormulaPreviewProps,
    EntitySectionRendererProps,
    SectionSelectorProps,
    GroupingControlsProps,
    ConditionEditorProps,
    AppliesToSelectorProps
} from './types';

// Utilities
export {
    updateGroupingStateAfterRemoval,
    updateGroupingState,
    getGroupedEntities
} from './entityHelpers';

export {
    transformFormDataForSubmission,
    transformProgressionForDisplay,
    initializeFormData,
    createDefaultModifier,
    createDefaultChoice
} from './formDataTransformers';

export {
    hasValidFormulaParams,
    hasValidChoiceFormulaParams,
    hasValidChoiceConfig,
    getModifierValidationError,
    getChoiceValidationError,
    validateProgressionEntities,
    hasProgressionComponents,
    validateProgressionLevel,
    validateFeatureId
} from './validationHelpers';

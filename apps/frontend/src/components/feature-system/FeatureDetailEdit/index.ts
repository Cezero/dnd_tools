// Main component - FeatureDetailEdit removed, use FeatureEditForm instead

// Hooks
export { useFeatureForm } from './useFeatureForm';
export { useGroupingState } from './useGroupingState';
export { useEntityManagement } from './useEntityManagement';
export { useFormulaPreview } from './useFormulaPreview';

// Components
export { FormulaPreview } from './FormulaPreview';
export { EntitySectionRenderer } from './EntitySectionRenderer';
export { GroupingControls } from './GroupingControls';
export { SectionSelector } from './SectionSelector';

// Form components
export { EntityDetailForm } from './EntityDetailForm';

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
    initializeFormData,
    createDefaultEntity,
} from './formDataTransformers';

export {
    hasValidFormulaParams,
    hasValidEntityConfig,
    getEntityValidationError,
    validateFeatureEntities,
    hasFeatureComponents,
    validateFeatureLevel,
    validateFeatureId
} from './validationHelpers';

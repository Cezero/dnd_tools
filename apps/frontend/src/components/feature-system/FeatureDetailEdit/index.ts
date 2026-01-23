// FeatureDetailEdit legacy entrypoint removed, FeatureEditForm is canonical.

// Hooks
export { useGroupingState } from './useGroupingState';
export { useEntityManagement } from './useEntityManagement';
export { useFormulaPreview } from './useFormulaPreview';

// Components
export { FormulaPreview } from './FormulaPreview';
export { EntitySectionRenderer } from './EntitySectionRenderer';
export { GroupingControls } from './GroupingControls';

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

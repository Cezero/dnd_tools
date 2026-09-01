import { CreateFeatureRequest, FeatureWithRelations, UpdateFeature } from '@shared/schema';
import { FeatureSourceType } from '@shared/static-data';

export interface FeatureEditContext {
    sourceType: FeatureSourceType;
    parentId: number;
    parentType: 'class' | 'race' | 'domain' | 'feat';
    editionId?: number | null;
}

export interface FeatureEditFormProps {
    featureId?: number;
    isOpen?: boolean;
    /** Called when the modal is closed. If the feature was edited but not saved, draftState is the current draft so the parent can update its view (e.g. ClassEdit's feature list). */
    onClose?: (draftState?: FeatureWithRelations | null) => void;
    onSave?: (featureId: number) => void;
    onCancel?: () => void;
    mode?: 'modal' | 'embedded';
    context?: FeatureEditContext;
    showHeader?: boolean;
}

/**
 * Props for PrerequisiteDetailForm component
 */
export interface PrerequisiteDetailFormProps {
    index: number;
}

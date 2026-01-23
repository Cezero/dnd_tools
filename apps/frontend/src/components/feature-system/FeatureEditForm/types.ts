import { CreateFeatureRequest, UpdateFeature } from '@shared/schema';
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
    onClose?: () => void;
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

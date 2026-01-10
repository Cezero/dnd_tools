import { Feature, FeatureProgression } from '@shared/schema';
import { FeatureSourceType } from '@shared/static-data';

export interface FeatureEditContext {
    sourceType: FeatureSourceType;
    parentId: number;
    parentType: 'class' | 'race' | 'domain' | 'feat';
}

export interface FeatureEditFormProps {
    featureId?: number | 'new';
    isOpen?: boolean;
    onClose?: () => void;
    onSave?: (feature: Feature, progressions: FeatureProgression[]) => void;
    onCancel?: () => void;
    mode?: 'modal' | 'embedded';
    context?: FeatureEditContext;
    initialProgressions?: FeatureProgression[];
    showHeader?: boolean;
}

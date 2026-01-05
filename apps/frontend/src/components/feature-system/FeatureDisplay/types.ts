import { Feature, FeatureProgression } from '@shared/schema';

export interface FeatureDisplayProps {
    feature: Feature;
    progressions: FeatureProgression[];
    onEditProgression?: (progression: FeatureProgression) => void;
    onRemoveProgression?: (progressionId: number) => void;
    onAddProgression?: (feature: Feature) => void;
    showAddProgressionButton?: boolean;
    className?: string;
    onEditFeature?: (featureId: number) => void;
    parentType?: 'class' | 'race';
    parentId?: number;
}

export interface FeatureDisplayData {
    feature: Feature;
    progressions: FeatureProgression[];
}

import { Feature, FeatureWithRelations } from '@shared/schema';

export interface FeatureDisplayProps {
    feature: Feature;
    features: FeatureWithRelations[];
    onEditProgression?: (feature: FeatureWithRelations) => void;
    onRemoveProgression?: (progressionId: number) => void;
    onAddProgression?: (feature: Feature) => void;
    showAddProgressionButton?: boolean;
    className?: string;
    parentType?: 'class' | 'race';
    parentId?: number;
}

export interface FeatureDisplayData {
    feature: Feature;
    features: FeatureWithRelations[];
}

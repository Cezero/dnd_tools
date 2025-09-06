import { z } from 'zod';

import { FeatureSystemApi } from '@/components/feature-system/FeatureSystemApi';
import { ListSelectionDialog } from '@/components/generic-list';
import { FeatureSchema } from '@shared/schema';

type ClassFeatureItem = z.infer<typeof FeatureSchema>;

interface SelectedFeatureData {
    featureId: number;
    slug: string;
    name: string;
    description: string;
    level: number;
    [key: string]: unknown; // Add index signature to satisfy BaseSelectedItem constraint
}

interface ClassFeatureAssocProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (selectedFeatures: SelectedFeatureData[]) => void;
    initialSelectedFeatureIds?: number[];
    classId?: number;
}

/**
 * Component for associating class features with a class. This dialog allows selecting existing features
 * from a list to associate them with a class. When features are selected, the dialog closes and the
 * selected features' information is passed to the `onSave` handler.
 */
export function ClassFeatureAssoc({ isOpen, onClose, onSave, initialSelectedFeatureIds = [], classId }: ClassFeatureAssocProps) {

    const transformSelectedFeatures = (features: ClassFeatureItem[]): SelectedFeatureData[] => {
        return features.map(feature => ({
            featureId: feature.id,
            slug: feature.slug,
            name: feature.name,
            description: feature.description,
            level: 1, // Default level, will be editable in the class edit form
        }));
    };



    return (
        <ListSelectionDialog<ClassFeatureItem, SelectedFeatureData>
            isOpen={isOpen}
            onClose={onClose}
            onSave={onSave}
            initialSelectedIds={initialSelectedFeatureIds}
            parentId={classId}
            parentType="class"
            serviceFunction={async () => {
                const response = await FeatureSystemApi.getFeatures({ sourceType: 1 }); // 1 = FeatureSourceType.Class
                return response;
            }}
            storageKey="classFeatureSelectionList"
            itemDesc="feature"
            createNewRoute="/features/new/edit"
            transformSelectedItems={transformSelectedFeatures}
            dialogTitle="Select Class Feature(s)"
            createNewButtonText="Create New Feature"
        />
    );
} 

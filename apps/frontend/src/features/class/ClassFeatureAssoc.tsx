import { useCallback } from 'react';

import { ListSelectionDialog } from '@/components/generic-list';
import { FeatureQueryHooks } from '@/services/query/FeatureQueryHooks';
import type { Feature } from '@shared/schema';
import { FeatureSourceType } from '@shared/static-data';


interface SelectedFeatureData extends Feature {
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

    const transformSelectedFeatures = (features: Feature[]): SelectedFeatureData[] => {
        return features.map(feature => ({
            ...feature,
            level: 1, // Default level, will be editable in the class edit form
        }));
    };

    const dataFetcher = useCallback(async () => {
        return await FeatureQueryHooks.getFeatures({ requestData: { sourceTypes: [FeatureSourceType.Class, FeatureSourceType.ClassVariant] } });
    }, []);

    return (
        <ListSelectionDialog<Feature, SelectedFeatureData>
            isOpen={isOpen}
            onClose={onClose}
            onSave={onSave}
            initialSelectedIds={initialSelectedFeatureIds}
            parentId={classId}
            parentType="class"
            dataFetcher={dataFetcher}
            storageKey="classFeatureSelectionList"
            itemDesc="feature"
            createNewRoute="/features/new/edit"
            transformSelectedItems={transformSelectedFeatures}
            dialogTitle="Select Class Feature(s)"
            createNewButtonText="Create New Feature"
        />
    );
} 

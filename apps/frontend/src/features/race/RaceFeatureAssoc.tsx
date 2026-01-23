import { useCallback } from 'react';

import { FeatureQueryHooks } from '@/components/feature-system/FeatureQueryHooks';
import { ListSelectionDialog } from '@/components/generic-list';
import type { Feature } from '@shared/schema';
import { FeatureSourceType } from '@shared/static-data';

interface SelectedFeatureData extends Feature {
    level: number;
    [key: string]: unknown; // Add index signature to satisfy BaseSelectedItem constraint
};

// Props interface for RaceFeatureAssoc component
interface RaceFeatureAssocProps {
    /** Whether the dialog is open */
    isOpen: boolean;
    /** Function to call when the dialog is closed */
    onClose: () => void;
    /** Function to call with the selected feature data when a feature is chosen */
    onSave: (features: SelectedFeatureData[]) => void;
    /** Array of feature slugs already associated with the race */
    initialSelectedFeatureIds: string[];
    /** The ID of the race currently being edited, used for returning to the correct RaceEdit page */
    raceId?: number;
}

/**
 * Component for associating race features with a race. This dialog allows selecting existing features
 * from a list to associate them with a race. When features are selected, the dialog closes and the
 * selected features' information is passed to the `onSave` handler.
 */
export function RaceFeatureAssoc({ isOpen, onClose, onSave, initialSelectedFeatureIds = [], raceId }: RaceFeatureAssocProps) {
    const transformSelectedFeatures = (features: Feature[]): SelectedFeatureData[] => {
        return features.map(feature => ({
            ...feature,
            level: 1, // Default level for racial features
        }));
    };

    const dataFetcher = useCallback(async () => {
        return await FeatureQueryHooks.getFeatures({ sourceTypes: [FeatureSourceType.Race] });
    }, []);

    return (
        <ListSelectionDialog<Feature, SelectedFeatureData>
            isOpen={isOpen}
            onClose={onClose}
            onSave={onSave}
            initialSelectedIds={initialSelectedFeatureIds}
            parentId={raceId}
            parentType="race"
            dataFetcher={dataFetcher}
            storageKey="raceFeatureSelectionList"
            itemDesc="feature"
            createNewRoute="/features/new/edit"
            transformSelectedItems={transformSelectedFeatures}
            dialogTitle="Select Race Feature(s)"
            createNewButtonText="Create New Feature"
        />
    );
}

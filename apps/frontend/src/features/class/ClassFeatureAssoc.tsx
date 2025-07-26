import { z } from 'zod';

import { ItemAssoc } from '@/lib/ItemAssoc';
import { ClassFeatureService } from './ClassFeatureService';
import { ClassFeatureSchema } from '@shared/schema';

// Type for class feature items
type ClassFeatureItem = z.infer<typeof ClassFeatureSchema>;

// Type for the selected feature data
type SelectedFeatureData = {
    slug: string;
    description: string;
    level: number;
};

// Props interface for ClassFeatureAssoc component
interface ClassFeatureAssocProps {
    /** Whether the dialog is open */
    isOpen: boolean;
    /** Function to call when the dialog is closed */
    onClose: () => void;
    /** Function to call with the selected feature data when a feature is chosen */
    onSave: (features: SelectedFeatureData[]) => void;
    /** Array of feature slugs already associated with the class */
    initialSelectedFeatureIds: string[];
    /** The ID of the class currently being edited, used for returning to the correct ClassEdit page */
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
            slug: feature.slug,
            description: feature.description,
            level: 1, // Default level, will be editable in the class edit form
        }));
    };

    const getMarkdownId = (feature: ClassFeatureItem): string => {
        return `class-feature-${feature.slug}-description`;
    };

    return (
        <ItemAssoc<ClassFeatureItem, SelectedFeatureData>
            isOpen={isOpen}
            onClose={onClose}
            onSave={onSave}
            initialSelectedIds={initialSelectedFeatureIds}
            parentId={classId}
            serviceFunction={async () => {
                const response = await ClassFeatureService.getClassFeatures({});
                return response;
            }}
            storageKey="classFeatureSelectionList"
            itemDesc="feature"
            createNewRoute="/classes/features/new/edit"
            transformSelectedItems={transformSelectedFeatures}
            getMarkdownId={getMarkdownId}
            dialogTitle="Select Class Feature(s)"
            createNewButtonText="Create New Feature"
        />
    );
} 

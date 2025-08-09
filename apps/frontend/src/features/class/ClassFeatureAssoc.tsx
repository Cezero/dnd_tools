import React, { useState, useMemo } from 'react';
import { z } from 'zod';

import { ItemAssoc } from '@/lib/ItemAssoc';
import { FeatureSystemService } from '@/services/FeatureSystemService';
import { FeatureSchema } from '@shared/schema';

type ClassFeatureItem = z.infer<typeof FeatureSchema>;

interface SelectedFeatureData {
    featureId: number;
    slug: string;
    name: string;
    description: string;
    level: number;
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
    const [availableFeatures, setAvailableFeatures] = useState<ClassFeatureItem[]>([]);

    const transformSelectedFeatures = (features: ClassFeatureItem[]): SelectedFeatureData[] => {
        return features.map(feature => ({
            featureId: feature.id,
            slug: feature.slug,
            name: feature.name,
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
                const response = await FeatureSystemService.getFeatures({});
                setAvailableFeatures(response.results);
                return response;
            }}
            storageKey="classFeatureSelectionList"
            itemDesc="feature"
            createNewRoute="/features/new/edit"
            transformSelectedItems={transformSelectedFeatures}
            getMarkdownId={getMarkdownId}
            dialogTitle="Select Class Feature(s)"
            createNewButtonText="Create New Feature"
        />
    );
} 

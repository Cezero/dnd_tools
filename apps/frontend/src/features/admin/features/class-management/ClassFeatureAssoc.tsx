import { Dialog } from '@base-ui-components/react/dialog';
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { GenericList } from '@/components/generic-list/GenericList';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { ClassFeatureService } from '@/features/admin/features/class-management/ClassFeatureService';
import { ClassFeatureQuerySchema, ClassFeatureSchema } from '@shared/schema';

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
 * Component for associating a class feature with a class. This dialog allows selecting an existing feature
 * from a list to associate it with a class. When a feature is selected, the dialog closes and the
 * selected feature's information is passed to the `onSave` handler.
 */
export function ClassFeatureAssoc({ isOpen, onClose, onSave, initialSelectedFeatureIds = [], classId }: ClassFeatureAssocProps) {
    const navigate = useNavigate();
    const [currentSelectedFeatureIds, setCurrentSelectedFeatureIds] = useState<string[]>(initialSelectedFeatureIds);
    const [availableFeatures, setAvailableFeatures] = useState<ClassFeatureItem[]>([]);

    useEffect(() => {
        setCurrentSelectedFeatureIds(initialSelectedFeatureIds);
    }, [initialSelectedFeatureIds]);

    // Fetch available features when dialog opens
    useEffect(() => {
        if (isOpen) {
            const fetchFeatures = async () => {
                try {
                    const response = await ClassFeatureService.getClassFeatures({ page: 1, limit: 1000 });
                    setAvailableFeatures(response.results);
                } catch (error) {
                    console.error('Failed to fetch features:', error);
                }
            };
            fetchFeatures();
        }
    }, [isOpen]);

    const columnDefinitions = useMemo(() => ({
        slug: {
            label: 'Feature Slug',
            sortable: true,
            filter: {
                type: 'input',
                label: 'Search Features',
                multiColumn: ['slug', 'description'],
                alwaysVisible: true
            },
            isDefault: true,
        },
        description: {
            label: 'Description',
            sortable: false,
            isDefault: true,
        },
    }), []);

    const renderFeatureCell = useCallback((item: ClassFeatureItem, columnId: string) => {
        if (columnId === 'description') {
            return <ProcessMarkdown id={`class-feature-${item.slug}-description`} markdown={item.description || ''} />;
        } else if (columnId === 'slug') {
            return item.slug;
        }
        return null;
    }, []);

    const handleSelectedIdsChange = useCallback((selectedIdsFromGenericList: (string | number)[]) => {
        setCurrentSelectedFeatureIds(selectedIdsFromGenericList as string[]);
    }, []);

    const handleAddSelectedFeatures = useCallback(async () => {
        const selectedFeatureObjects = currentSelectedFeatureIds
            .map(id => availableFeatures.find(feature => feature.slug === id))
            .filter((feature): feature is ClassFeatureItem => feature !== undefined)
            .map(feature => ({
                slug: feature.slug,
                description: feature.description,
                level: 1, // Default level, will be editable in the class edit form
            }));
        console.log('[ClassFeatureAssoc] currentSelectedFeatureIds', currentSelectedFeatureIds);
        console.log('[ClassFeatureAssoc] availableFeatures', availableFeatures);
        console.log('[ClassFeatureAssoc] selectedFeatureObjects', selectedFeatureObjects);
        onSave(selectedFeatureObjects);
        onClose();
    }, [currentSelectedFeatureIds, availableFeatures, onSave, onClose]);

    if (!isOpen) return null;

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Backdrop className="fixed inset-0 bg-black bg-opacity-25 z-40" />
            <Dialog.Portal>
                <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-6xl transform overflow-visible rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-800">
                        <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                            Select Class Feature(s)
                        </Dialog.Title>
                        <form className="mt-4" onSubmit={(e) => e.preventDefault()}>
                            <div className="mb-4">
                                <GenericList<ClassFeatureItem>
                                    storageKey="classFeatureSelectionList"
                                    isColumnConfigurable={false}
                                    isOptionSelector={true}
                                    selectedIds={currentSelectedFeatureIds}
                                    onSelectedIdsChange={handleSelectedIdsChange}
                                    columnDefinitions={columnDefinitions}
                                    querySchema={ClassFeatureQuerySchema}
                                    serviceFunction={ClassFeatureService.getClassFeatures}
                                    renderCell={renderFeatureCell}
                                    detailPagePath="/admin/classes/features/:slug"
                                    itemDesc="feature"
                                    initialLimit={10}
                                />
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button
                                    type="button"
                                    className="inline-flex justify-center rounded-md border border-transparent bg-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200 mr-2"
                                    onClick={onClose}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 mr-2"
                                    onClick={handleAddSelectedFeatures}
                                >
                                    Apply Changes
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600"
                                    onClick={() => {
                                        onClose();
                                        navigate('/admin/classes/features/new/edit', { state: { from: 'ClassFeatureAssoc', classId: classId } });
                                    }}
                                >
                                    Create New Feature
                                </button>
                            </div>
                        </form>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
} 
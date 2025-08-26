import { Dialog } from '@base-ui-components/react/dialog';
import { ColumnDef } from '@tanstack/react-table';
import React, { useState, useEffect } from 'react';

import { GenericList } from '@/components/generic-list';
import { createContainsFilter } from '@/components/generic-list/filterFunctions';
import { FeatureSystemService } from '@/services/FeatureSystemService';
import { FeatureInQueryResponse } from '@shared/schema';
import { FilterType } from '@shared/static-data';

interface FeatureSelectionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onFeatureSelected: (feature: { id: number; name: string; description: string; slug: string }) => void;
    classId?: number;
    raceId?: number;
}

export function FeatureSelectionDialog({
    isOpen,
    onClose,
    onFeatureSelected,
    classId,
    raceId
}: FeatureSelectionDialogProps): React.JSX.Element {
    const [selectedFeature, setSelectedFeature] = useState<{ id: number; name: string; description: string; slug: string } | null>(null);
    const [selectedFeatureId, setSelectedFeatureId] = useState<number | null>(null);
    const [featureData, setFeatureData] = useState<Record<number, { id: number; name: string; description: string; slug: string }>>({});

    // Column configuration with filters
    const columns: ColumnDef<FeatureInQueryResponse, unknown>[] = [
        {
            accessorKey: 'name',
            header: 'Name',
            enableSorting: true,
            enableColumnFilter: true,
            enableResizing: true,
            size: 200,
            filterFn: createContainsFilter(),
            meta: {
                filterType: FilterType.TEXT_INPUT,
                placeholder: 'Filter by name...'
            },
        },
        {
            accessorKey: 'slug',
            header: 'Slug',
            enableSorting: true,
            enableColumnFilter: true,
            enableResizing: true,
            size: 150,
            filterFn: createContainsFilter(),
            meta: {
                filterType: FilterType.TEXT_INPUT,
                placeholder: 'Filter by slug...'
            },
        },
        {
            accessorKey: 'description',
            header: 'Description',
            enableResizing: true,
            size: 300,
            cell: ({ getValue }) => {
                const description = getValue() as string;
                return description ? (description.length > 200 ? `${description.substring(0, 200)}...` : description) : '';
            },
            meta: {
                truncate: 200,
                isMarkdown: true,
            },
        },
    ];

    // Load feature data when selection changes
    useEffect(() => {
        if (selectedFeatureId && !featureData[selectedFeatureId]) {
            FeatureSystemService.getFeatureById(undefined, { id: selectedFeatureId })
                .then(feature => {
                    setFeatureData(prev => ({
                        ...prev,
                        [selectedFeatureId]: {
                            id: feature.id,
                            name: feature.name,
                            description: feature.description,
                            slug: feature.slug,
                        }
                    }));
                    setSelectedFeature({
                        id: feature.id,
                        name: feature.name,
                        description: feature.description,
                        slug: feature.slug,
                    });
                })
                .catch(error => {
                    console.error('Failed to load feature:', error);
                });
        } else if (selectedFeatureId && featureData[selectedFeatureId]) {
            setSelectedFeature(featureData[selectedFeatureId]);
        } else {
            setSelectedFeature(null);
        }
    }, [selectedFeatureId, featureData]);

    const handleConfirm = () => {
        if (selectedFeature) {
            onFeatureSelected(selectedFeature);
            setSelectedFeature(null);
            setSelectedFeatureId(null);
            onClose();
        }
    };

    const handleCancel = () => {
        setSelectedFeature(null);
        setSelectedFeatureId(null);
        onClose();
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Backdrop className="fixed inset-0 bg-black bg-opacity-25 z-40" />
            <Dialog.Portal>
                <Dialog.Popup className="fixed inset-0 flex items-center justify-center p-4">
                    <div className="w-full max-w-7xl max-h-[80vh] transform overflow-visible rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                        <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Select Feature to Add
                        </Dialog.Title>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Choose a feature to add to this {classId ? 'class' : raceId ? 'race' : 'entity'}. A default level 1 progression will be created.
                        </p>

                        <div className="flex-1 overflow-hidden mb-4">
                            <GenericList
                                storageKey="feature-selection"
                                columns={columns}
                                serviceFunction={FeatureSystemService.getFeatures}
                                itemDesc="features"
                                initialLimit={20}
                                isOptionSelector={true}
                                selectedIds={selectedFeatureId ? [selectedFeatureId] : []}
                                onSelectedIdsChange={(ids) => {
                                    if (ids.length > 0) {
                                        setSelectedFeatureId(ids[0]);
                                    } else {
                                        setSelectedFeatureId(null);
                                    }
                                }}
                            />
                        </div>

                        <div className="flex justify-end space-x-2">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={!selectedFeature}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add Feature
                            </button>
                        </div>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

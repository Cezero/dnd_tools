import { Dialog } from '@base-ui-components/react/dialog';
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { GenericList } from '@/components/generic-list/GenericList';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { RaceTraitService } from '@/features/admin/features/race-management/RaceTraitService';
import { RaceTraitQuerySchema, RaceTraitSchema } from '@shared/schema';

// Type for race trait items
type RaceTraitItem = z.infer<typeof RaceTraitSchema>;

// Type for the selected trait data
type SelectedTraitData = {
    slug: string;
    description: string;
    hasValue: boolean;
    value: string;
};

// Props interface for RaceTraitAssoc component
interface RaceTraitAssocProps {
    /** Whether the dialog is open */
    isOpen: boolean;
    /** Function to call when the dialog is closed */
    onClose: () => void;
    /** Function to call with the selected trait data when a trait is chosen */
    onSave: (traits: SelectedTraitData[]) => void;
    /** Array of trait slugs already associated with the race */
    initialSelectedTraitIds: string[];
    /** The ID of the race currently being edited, used for returning to the correct RaceEdit page */
    raceId?: number;
}

/**
 * Component for associating a race trait with a race. This dialog allows selecting an existing trait
 * from a list to associate it with a race. When a trait is selected, the dialog closes and the
 * selected trait's information is passed to the `onSave` handler.
 */
export function RaceTraitAssoc({ isOpen, onClose, onSave, initialSelectedTraitIds = [], raceId }: RaceTraitAssocProps) {
    const navigate = useNavigate();
    const [currentSelectedTraitIds, setCurrentSelectedTraitIds] = useState<string[]>(initialSelectedTraitIds);
    const [availableTraits, setAvailableTraits] = useState<RaceTraitItem[]>([]);

    useEffect(() => {
        setCurrentSelectedTraitIds(initialSelectedTraitIds);
    }, [initialSelectedTraitIds]);

    const columnDefinitions = useMemo(() => ({
        slug: {
            label: 'Trait Slug',
            sortable: true,
            filter: {
                type: 'input',
                label: 'Search Traits',
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

    const renderTraitCell = useCallback((item: RaceTraitItem, columnId: string) => {
        if (columnId === 'description') {
            return <ProcessMarkdown id={`race-trait-${item.slug}-description`} markdown={item.description || ''} />;
        } else if (columnId === 'slug') {
            return item.slug;
        }
        return null;
    }, []);

    const handleSelectedIdsChange = useCallback((selectedIdsFromGenericList: (string | number)[]) => {
        setCurrentSelectedTraitIds(selectedIdsFromGenericList as string[]);
    }, []);

    const handleAddSelectedTraits = useCallback(async () => {
        const selectedTraitObjects = currentSelectedTraitIds
            .map(id => availableTraits.find(trait => trait.slug === id))
            .filter(Boolean)
            .map(trait => ({
                slug: trait!.slug,
                description: trait!.description,
                hasValue: trait!.hasValue,
                value: trait!.hasValue ? '' : '',
            }));
        console.log('[RaceTraitAssoc] selectedTraitObjects', selectedTraitObjects);
        onSave(selectedTraitObjects);
        onClose();
    }, [currentSelectedTraitIds, availableTraits, onSave, onClose]);

    if (!isOpen) return null;

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Backdrop className="fixed inset-0 bg-black bg-opacity-25 z-40" />
            <Dialog.Portal>
                <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-6xl transform overflow-visible rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-800">
                        <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                            Select Race Trait(s)
                        </Dialog.Title>
                        <form className="mt-4" onSubmit={(e) => e.preventDefault()}>
                            <div className="mb-4">
                                <GenericList<RaceTraitItem>
                                    storageKey="raceTraitSelectionList"
                                    isColumnConfigurable={false}
                                    isOptionSelector={true}
                                    selectedIds={currentSelectedTraitIds}
                                    onSelectedIdsChange={handleSelectedIdsChange}
                                    columnDefinitions={columnDefinitions}
                                    querySchema={RaceTraitQuerySchema}
                                    serviceFunction={RaceTraitService.getRaceTraits}
                                    renderCell={renderTraitCell}
                                    detailPagePath="/admin/races/traits/:slug"
                                    itemDesc="trait"
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
                                    onClick={handleAddSelectedTraits}
                                >
                                    Apply Changes
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600"
                                    onClick={() => {
                                        onClose();
                                        navigate('/admin/races/traits/new/edit', { state: { from: 'RaceTraitAssoc', raceId: raceId } });
                                    }}
                                >
                                    Create New Trait
                                </button>
                            </div>
                        </form>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
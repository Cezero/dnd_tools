import { Dialog } from '@base-ui-components/react/dialog';
import { ColumnDef } from '@tanstack/react-table';
import { useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { FilterType } from '@shared/static-data';

import { GenericList } from './GenericList';

// Generic type for item data
interface BaseItem {
    name: string;
    slug: string;
    description: string;
    [key: string]: unknown;
}

// Generic type for selected item data
interface BaseSelectedItem {
    slug: string;
    description: string;
    [key: string]: unknown;
}

// Props interface for the generic ListSelectionDialog component
interface ListSelectionDialogProps<T extends BaseItem, U extends BaseSelectedItem> {
    /** Whether the dialog is open */
    isOpen: boolean;
    /** Function to call when the dialog is closed */
    onClose: () => void;
    /** Function to call with the selected item data when items are chosen */
    onSave: (items: U[]) => void;
    /** Array of item IDs already associated */
    initialSelectedIds: (string | number)[];
    /** The ID of the parent item currently being edited */
    parentId?: number;
    /** The type of parent item (class or race) */
    parentType?: 'class' | 'race';
    /** Service function to fetch all items */
    serviceFunction: () => Promise<{ results: T[]; total: number }>;
    /** Storage key for the GenericList */
    storageKey: string;
    /** Item description for UI text */
    itemDesc: string;
    /** Route to navigate to for creating new items */
    createNewRoute: string;
    /** Function to transform selected items to the expected format */
    transformSelectedItems: (items: T[]) => U[];
    /** Title for the dialog */
    dialogTitle: string;
    /** Button text for creating new items */
    createNewButtonText: string;
}

/**
 * Generic component for selecting items from a list. This dialog allows selecting existing items
 * from a list and transforming them into the expected format. When items are selected, the dialog 
 * closes and the selected items' information is passed to the `onSave` handler.
 */
export function ListSelectionDialog<T extends BaseItem, U extends BaseSelectedItem>({
    isOpen,
    onClose,
    onSave,
    initialSelectedIds = [],
    parentId,
    parentType,
    serviceFunction,
    storageKey,
    itemDesc,
    createNewRoute,
    transformSelectedItems,
    dialogTitle,
    createNewButtonText,
}: ListSelectionDialogProps<T, U>) {
    const navigate = useNavigate();
    const [currentSelectedIds, setCurrentSelectedIds] = useState<(string | number)[]>(initialSelectedIds);
    const [availableItems, setAvailableItems] = useState<T[]>([]);

    useEffect(() => {
        setCurrentSelectedIds(initialSelectedIds);
    }, [initialSelectedIds]);

    // Fetch available items when dialog opens
    useEffect(() => {
        if (isOpen) {
            const fetchItems = async () => {
                try {
                    const response = await serviceFunction();
                    setAvailableItems(response.results);
                } catch (error) {
                    console.error(`Failed to fetch ${itemDesc}s:`, error);
                }
            };
            fetchItems();
        }
    }, [isOpen, serviceFunction, itemDesc]);

    const columns: ColumnDef<T>[] = useMemo(() => [
        {
            accessorKey: 'name',
            header: 'Name',
            enableSorting: true,
            enableColumnFilter: true,
            size: 200,
            meta: {
                required: true,
                filterType: FilterType.TEXT_INPUT,
                placeholder: 'Filter by name...'
            }
        },
        {
            accessorKey: 'slug',
            header: `${itemDesc.charAt(0).toUpperCase() + itemDesc.slice(1)} Slug`,
            enableSorting: true,
            enableColumnFilter: true,
            size: 150,
            meta: {
                filterType: FilterType.TEXT_INPUT,
                placeholder: 'Filter by slug...'
            }
        },
        {
            accessorKey: 'description',
            header: 'Description',
            meta: {
                truncate: 200,
                isMarkdown: true,
            },
        },
    ], [itemDesc]);

    const handleSelectedIdsChange = useCallback((selectedIdsFromGenericList: (string | number)[]) => {
        setCurrentSelectedIds(selectedIdsFromGenericList);
    }, []);

    const handleAddSelectedItems = useCallback(async () => {
        const selectedItemObjects = currentSelectedIds
            .map(id => availableItems.find(item => (item as Record<string, unknown>).id === id || item.slug === id))
            .filter((item): item is T => item !== undefined);

        const transformedItems = transformSelectedItems(selectedItemObjects);
        console.log(`[ListSelectionDialog] selected${itemDesc.charAt(0).toUpperCase() + itemDesc.slice(1)}Objects`, transformedItems);
        onSave(transformedItems);
        onClose();
    }, [currentSelectedIds, availableItems, transformSelectedItems, onSave, onClose, itemDesc]);

    if (!isOpen) return null;

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Backdrop className="fixed inset-0 bg-black bg-opacity-25 z-40" />
            <Dialog.Portal>
                <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-6xl transform overflow-visible rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-800">
                        <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                            {dialogTitle}
                        </Dialog.Title>
                        <form className="mt-4" onSubmit={(e) => e.preventDefault()}>
                            <div className="mb-4">
                                <GenericList<T>
                                    storageKey={storageKey}
                                    isOptionSelector={true}
                                    selectedIds={currentSelectedIds}
                                    onSelectedIdsChange={handleSelectedIdsChange}
                                    columns={columns}
                                    serviceFunction={serviceFunction}
                                    itemDesc={itemDesc}
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
                                    onClick={handleAddSelectedItems}
                                >
                                    Apply Changes
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600"
                                    onClick={() => {
                                        onClose();
                                        const returnPath = parentType === 'class'
                                            ? `/classes/${parentId}/edit`
                                            : parentType === 'race'
                                                ? `/races/${parentId}/edit`
                                                : '/features';

                                        navigate(createNewRoute, {
                                            state: {
                                                from: 'ListSelectionDialog',
                                                parentId: parentId,
                                                parentType: parentType,
                                                returnPath: returnPath
                                            }
                                        });
                                    }}
                                >
                                    {createNewButtonText}
                                </button>
                            </div>
                        </form>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

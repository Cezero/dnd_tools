import { Dialog } from '@base-ui-components/react/dialog';
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';

import { GenericList } from '@/components/generic-list/GenericList';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';

// Generic type for item data
interface BaseItem {
    slug: string;
    description: string;
    [key: string]: any;
}

// Generic type for selected item data
interface BaseSelectedItem {
    slug: string;
    description: string;
    [key: string]: any;
}

// Props interface for the generic ItemAssoc component
interface ItemAssocProps<T extends BaseItem, U extends BaseSelectedItem> {
    /** Whether the dialog is open */
    isOpen: boolean;
    /** Function to call when the dialog is closed */
    onClose: () => void;
    /** Function to call with the selected item data when items are chosen */
    onSave: (items: U[]) => void;
    /** Array of item slugs already associated */
    initialSelectedIds: string[];
    /** The ID of the parent item currently being edited */
    parentId?: number;
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
    /** Function to get the markdown ID for an item */
    getMarkdownId: (item: T) => string;
    /** Title for the dialog */
    dialogTitle: string;
    /** Button text for creating new items */
    createNewButtonText: string;
}

/**
 * Generic component for associating items with a parent item. This dialog allows selecting existing items
 * from a list to associate them with a parent item. When items are selected, the dialog closes and the
 * selected items' information is passed to the `onSave` handler.
 */
export function ItemAssoc<T extends BaseItem, U extends BaseSelectedItem>({
    isOpen,
    onClose,
    onSave,
    initialSelectedIds = [],
    parentId,
    serviceFunction,
    storageKey,
    itemDesc,
    createNewRoute,
    transformSelectedItems,
    getMarkdownId,
    dialogTitle,
    createNewButtonText,
}: ItemAssocProps<T, U>) {
    const navigate = useNavigate();
    const [currentSelectedIds, setCurrentSelectedIds] = useState<string[]>(initialSelectedIds);
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
            accessorKey: 'slug',
            header: `${itemDesc.charAt(0).toUpperCase() + itemDesc.slice(1)} Slug`,
            meta: {
                required: true,
            },
        },
        {
            accessorKey: 'description',
            header: 'Description',
            meta: {
                truncate: 200,
                isMarkdown: true,
            },
        },
    ], [itemDesc, getMarkdownId]);

    const handleSelectedIdsChange = useCallback((selectedIdsFromGenericList: (string | number)[]) => {
        setCurrentSelectedIds(selectedIdsFromGenericList as string[]);
    }, []);

    const handleAddSelectedItems = useCallback(async () => {
        const selectedItemObjects = currentSelectedIds
            .map(id => availableItems.find(item => item.slug === id))
            .filter((item): item is T => item !== undefined);

        const transformedItems = transformSelectedItems(selectedItemObjects);
        console.log(`[ItemAssoc] selected${itemDesc.charAt(0).toUpperCase() + itemDesc.slice(1)}Objects`, transformedItems);
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
                                        navigate(createNewRoute, { state: { from: 'ItemAssoc', parentId: parentId } });
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

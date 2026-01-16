import { ChevronUpDownIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ColumnDef } from '@tanstack/react-table';
import React, { useCallback, useMemo, useState, useRef } from 'react';

import { EntityTooltip } from '@/components/entity-tooltip/EntityTooltip';
import { CustomSelect } from '@/components/forms/FormComponents';
import { ScrollableCategorizedList } from '@/components/scrollable-categorized-list/ScrollableCategorizedList';
import { CharacterDetailStateUpdateType } from '@/features/character/types';
import { canSplitItem, getOccupiedLocations, getSplitTargetLocation, getSplitTargetLocationName, calculateSplitQuantities } from '@/features/character/utils/equipmentUtils';
import { LOCATION_ENUM, LOCATION_LIST, ITEM_TYPES } from '@shared/static-data';

import type { EquipmentTabProps, GroupedItem } from './types';

const slotItems = [
    { slot: 'Ring Slot (RH)', location: LOCATION_ENUM.RightRing },
    { slot: 'Ring Slot (LH)', location: LOCATION_ENUM.LeftRing },
    { slot: 'Hand Slot', location: LOCATION_ENUM.Hands },
    { slot: 'Arm Slot', location: LOCATION_ENUM.Arms },
    { slot: 'Head Slot', location: LOCATION_ENUM.Head },
    { slot: 'Face Slot', location: LOCATION_ENUM.Face },
    { slot: 'Shoulder Slot', location: LOCATION_ENUM.Shoulders },
    { slot: 'Neck Slot', location: LOCATION_ENUM.Neck },
    { slot: 'Body Slot', location: LOCATION_ENUM.Body },
    { slot: 'Torso Slot', location: LOCATION_ENUM.Torso },
    { slot: 'Waist Slot', location: LOCATION_ENUM.Waist },
    { slot: 'Feet Slot', location: LOCATION_ENUM.Feet },
];

/**
 * EquipmentTab displays gear, possessions, editable money, and carrying capacity.
 */
export function EquipmentTab({ character, items, state, updateState }: EquipmentTabProps): React.JSX.Element {
    // Split dialog state
    const [splitDialogOpen, setSplitDialogOpen] = useState(false);
    const [splitItem, setSplitItem] = useState<GroupedItem | null>(null);
    const [splitKeepQuantity, setSplitKeepQuantity] = useState<number>(1);

    // Handle money change - update state, CharacterDetail will sync automatically
    const handleMoneyChange = useCallback((currency: 'platinum' | 'gold' | 'silver' | 'copper', value: number) => {
        updateState({
            type: CharacterDetailStateUpdateType.SET_MONEY,
            payload: {
                money: {
                    ...state.money,
                    [currency]: value,
                }
            }
        });
    }, [state.money, updateState]);

    // Group possessions items (similar to PDF logic) - use state.items instead of character.characterItems
    const groupedPossessions = useMemo(() => {
        const generalItems = state.items.filter(
            ci =>
                !ci.location ||
                ci.location === LOCATION_ENUM.Owned ||
                ci.location === LOCATION_ENUM.Carried ||
                ci.location === LOCATION_ENUM.MainHand ||
                ci.location === LOCATION_ENUM.OffHand
        );

        const groupedItemsMap = new Map<string, GroupedItem>();

        for (const charItem of generalItems) {
            const location = charItem.location ?? LOCATION_ENUM.Owned;
            const isOwned = location === LOCATION_ENUM.Owned || location === null;
            const key = `${charItem.baseItemId}_${location}`;
            const item = items.find(it => it.id === charItem.baseItemId);
            const quantity = charItem.quantity ?? 1;

            if (groupedItemsMap.has(key)) {
                const existing = groupedItemsMap.get(key)!;
                existing.totalQuantity += quantity;
                existing.characterItemIds.push(charItem.id);
            } else {
                groupedItemsMap.set(key, {
                    id: charItem.id, // Use the first characterItemId as the unique identifier
                    baseItemId: charItem.baseItemId ?? 0,
                    location,
                    totalQuantity: quantity,
                    name: charItem.name || item?.name || '',
                    weight: item?.weight ? Number(item.weight) : null,
                    isOwned,
                    characterItemIds: [charItem.id],
                    typeId: item?.typeId || 1,
                });
            }
        }

        return Array.from(groupedItemsMap.values());
    }, [state.items, items]);

    // Calculate total weight carried
    const totalWeight = useMemo(() => {
        let weight = 0;

        // Add weight from possessions (only carried items, not owned)
        for (const groupedItem of groupedPossessions) {
            if (!groupedItem.isOwned && groupedItem.weight !== null) {
                weight += groupedItem.weight * groupedItem.totalQuantity;
            }
        }

        // Add weight from equipped items
        for (const slotItem of slotItems) {
            const equippedItem = state.items.find(ci => ci.location === slotItem.location);
            if (equippedItem) {
                const item = items.find(i => i.id === equippedItem.baseItemId);
                if (item?.weight) {
                    weight += Number(item.weight);
                }
            }
        }

        return weight;
    }, [groupedPossessions, state.items, items]);

    // Handle remove item - update state, CharacterDetail will sync automatically
    const handleRemoveItem = useCallback(
        (groupedItem: GroupedItem) => {
            // Remove all character items for this grouped item
            const updatedItems = state.items.filter(item => !groupedItem.characterItemIds.includes(item.id));
            updateState({
                type: CharacterDetailStateUpdateType.SET_ITEMS,
                payload: { items: updatedItems }
            });
        },
        [state.items, updateState]
    );

    const handleSplit = useCallback(() => {
        if (!splitItem) return;

        const totalQuantity = splitItem.totalQuantity;
        const { keepQuantity, moveQuantity } = calculateSplitQuantities(totalQuantity, splitKeepQuantity);

        if (moveQuantity <= 0) {
            setSplitDialogOpen(false);
            return;
        }

        // Determine new location (toggle between Owned/Carried)
        const currentLocation = splitItem.location;
        const newLocation = getSplitTargetLocation(currentLocation);

        // Remove all original character items and add two new items with split quantities
        const updatedItems = state.items.filter(item => !splitItem.characterItemIds.includes(item.id));

        // Add keep item
        const keepItem = {
            id: Date.now(), // Temporary ID
            baseItemId: splitItem.baseItemId,
            quantity: keepQuantity,
            location: currentLocation,
            name: splitItem.name,
        };

        // Add move item
        const moveItem = {
            id: Date.now() + 1, // Temporary ID
            baseItemId: splitItem.baseItemId,
            quantity: moveQuantity,
            location: newLocation === LOCATION_ENUM.Owned ? null : newLocation,
            name: splitItem.name,
        };

        updateState({
            type: CharacterDetailStateUpdateType.SET_ITEMS,
            payload: { items: [...updatedItems, keepItem, moveItem] }
        });

        setSplitDialogOpen(false);
        setSplitItem(null);
    }, [splitItem, splitKeepQuantity, state.items, updateState]);

    // Column definitions for possessions list
    const possessionsColumns = useMemo<ColumnDef<GroupedItem, unknown>[]>(
        () => [
            {
                accessorKey: 'typeId',
                header: 'Type',
                enableSorting: false,
                enableColumnFilter: false,
                enableResizing: false,
                size: 0,
                enableHiding: false,
                cell: (info) => {
                    const typeId = info.getValue() as number;
                    const typeName = ITEM_TYPES[typeId]?.name || `Type ${typeId}`;
                    return `-- ${typeName} --`;
                },
                meta: {
                    hidden: true, // Hidden from display but used for grouping header formatting
                },
            },
            {
                accessorKey: 'name',
                header: 'Item Name',
                enableSorting: true,
                cell: (info) => {
                    const item = info.row.original;
                    return (
                        <EntityTooltip entityType="item" entityId={item.baseItemId}>
                            <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                                {item.name}
                            </span>
                        </EntityTooltip>
                    );
                },
            },
            {
                accessorKey: 'totalQuantity',
                header: 'Qty',
                enableSorting: true,
                cell: (info) => {
                    const item = info.row.original;
                    const qty = info.getValue() as number;

                    // Show split button if quantity > 1 and in Owned or Carried location
                    const canSplit = canSplitItem(qty, item.location);

                    if (qty <= 1) {
                        return '';
                    }

                    return (
                        <div className="flex items-center gap-2">
                            <span>{qty}</span>
                            {canSplit && (
                                <button
                                    onClick={() => {
                                        setSplitItem(item);
                                        setSplitKeepQuantity(Math.floor(qty / 2));
                                        setSplitDialogOpen(true);
                                    }}
                                    className="px-2 py-0.5 text-xs rounded bg-green-600 text-white hover:bg-green-700"
                                    title="Split item"
                                >
                                    Split
                                </button>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'weight',
                header: 'Weight',
                enableSorting: true,
                cell: (info) => {
                    const item = info.row.original;
                    if (item.isOwned) return '';
                    if (item.weight === null) return '';
                    const totalWeight = item.weight * item.totalQuantity;
                    return `${totalWeight} lb.`;
                },
            },
            {
                accessorKey: 'location',
                header: 'Location',
                enableSorting: true,
                enableResizing: true,
                size: 95,
                cell: (info) => {
                    const groupedItem = info.row.original;
                    const currentLocation = groupedItem.location;

                    // Get all occupied locations (except 'carried' and 'owned' which allow multiple)
                    const excludeIds = new Set(groupedItem.characterItemIds);
                    const occupiedLocations = getOccupiedLocations(state.items, excludeIds);

                    return (
                        <CustomSelect
                            value={currentLocation ?? LOCATION_ENUM.Owned}
                            onValueChange={(newLocation) => {
                                // Update all items in this group with new location
                                const locationToUse = newLocation === LOCATION_ENUM.Owned ? null : newLocation;
                                const updatedItems = state.items.map(item => {
                                    if (groupedItem.characterItemIds.includes(item.id)) {
                                        return { ...item, location: locationToUse };
                                    }
                                    return item;
                                });
                                updateState({
                                    type: CharacterDetailStateUpdateType.SET_ITEMS,
                                    payload: { items: updatedItems }
                                });
                            }}
                            options={LOCATION_LIST}
                            getOptionDisabled={(option) => {
                                // Disable if location is occupied (except for 'Carried' and 'Owned')
                                return option.id !== LOCATION_ENUM.Carried &&
                                    option.id !== LOCATION_ENUM.Owned &&
                                    occupiedLocations.has(option.id);
                            }}
                            componentExtraClassName="w-[95px]"
                            triggerExtraClassName="px-2 py-0.5 text-sm w-full"
                            itemTextExtraClassName="text-sm"
                            icon={<ChevronUpDownIcon className="h-4 w-4" aria-hidden="true" />}
                        />
                    );
                },
            },
            {
                id: 'actions',
                header: 'Actions',
                enableSorting: false,
                size: 50,
                cell: (info) => {
                    const item = info.row.original;
                    return (
                        <button
                            onClick={() => handleRemoveItem(item)}
                            className="p-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            title="Remove item"
                        >
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    );
                },
            },
        ],
        [handleRemoveItem, state.items, updateState]
    );

    // Data fetcher for possessions - use ref to prevent unnecessary recreations
    const groupedPossessionsRef = useRef<GroupedItem[]>([]);
    groupedPossessionsRef.current = groupedPossessions;

    const possessionsDataFetcher = useCallback(async () => {
        return {
            results: groupedPossessionsRef.current,
            total: groupedPossessionsRef.current.length,
        };
    }, []); // Empty deps - always use the latest ref value

    return (
        <div className="space-y-6">
            {/* Money Section */}
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Money</h3>
                <div className="grid grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Platinum (PP)</label>
                        <input
                            type="number"
                            min="0"
                            value={state.money.platinum}
                            onChange={(e) => handleMoneyChange('platinum', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gold (GP)</label>
                        <input
                            type="number"
                            min="0"
                            value={state.money.gold}
                            onChange={(e) => handleMoneyChange('gold', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Silver (SP)</label>
                        <input
                            type="number"
                            min="0"
                            value={state.money.silver}
                            onChange={(e) => handleMoneyChange('silver', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Copper (CP)</label>
                        <input
                            type="number"
                            min="0"
                            value={state.money.copper}
                            onChange={(e) => handleMoneyChange('copper', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            {/* Other Possessions */}
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Other Possessions</h3>
                <div className="h-[500px]">
                    <ScrollableCategorizedList
                        dataFetcher={possessionsDataFetcher}
                        groupingFields={['typeId']}
                        groupingConfig={{
                            sortGroupKeys: (keys) => {
                                return keys.sort(([a], [b]) => {
                                    const aNum = typeof a === 'number' ? a : 0;
                                    const bNum = typeof b === 'number' ? b : 0;
                                    return aNum - bNum;
                                });
                            },
                        }}
                        columns={possessionsColumns}
                        searchPlaceholder="Search possessions..."
                        itemDesc="possession"
                        maxHeight="auto"
                    />
                </div>
            </div>

            {/* Equipped Items by Slot */}
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Equipped Items by Slot</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                    {slotItems.map((slotItem) => {
                        const equippedItem = state.items.find(ci => ci.location === slotItem.location);
                        const item = equippedItem ? items.find(i => i.id === equippedItem.baseItemId) : null;
                        const itemName = equippedItem?.name || item?.name || '';

                        return (
                            <div key={slotItem.location} className="flex justify-between items-center">
                                <span className="text-sm text-gray-700 dark:text-gray-300">{slotItem.slot}:</span>
                                <span className="text-sm text-gray-900 dark:text-white">
                                    {itemName ? (
                                        <EntityTooltip entityType="item" entityId={equippedItem!.baseItemId}>
                                            <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                                                {itemName}
                                            </span>
                                        </EntityTooltip>
                                    ) : (
                                        <span className="text-gray-400 dark:text-gray-500">—</span>
                                    )}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Total Weight Carried */}
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Weight Carried</span>
                    <span className="text-sm text-gray-900 dark:text-white">{totalWeight.toFixed(1)} lb.</span>
                </div>
            </div>

            {/* Split Dialog */}
            {splitDialogOpen && splitItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Split {splitItem.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Total quantity: {splitItem.totalQuantity}
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Keep in current location:
                            </label>
                            <input
                                type="number"
                                min="1"
                                max={splitItem.totalQuantity - 1}
                                value={splitKeepQuantity}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value) || 1;
                                    const max = splitItem.totalQuantity - 1;
                                    setSplitKeepQuantity(Math.max(1, Math.min(value, max)));
                                }}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {splitItem.totalQuantity - splitKeepQuantity} will be moved to{' '}
                                {getSplitTargetLocationName(splitItem.location)}
                            </p>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setSplitDialogOpen(false);
                                    setSplitItem(null);
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSplit}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                            >
                                Split
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

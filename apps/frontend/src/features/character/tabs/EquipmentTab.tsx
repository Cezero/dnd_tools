import { ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';

import { CustomSelect } from '@/components/forms/FormComponents';
import { createContainsFilter } from '@/components/generic-list/filterFunctions';
import { TabComponentProps, CharacterEditStateUpdateType } from '@/features/character/types';
import { nextNegativeTempId } from '@/features/character/utils/draftKeyUtils';
import { canSplitItem, getOccupiedLocations, getSplitTargetLocation, getSplitTargetLocationName, calculateSplitQuantities } from '@/features/character/utils/equipmentUtils';
import { addGpToMoney, convertGpToMoney, CURRENCY_TO_MONEY_KEY, getItemCostInGp, getTotalGoldInGp } from '@/features/character/utils/moneyUtils';
import { useStartingGold } from '@/features/character/utils/startingGold';
import { ItemQueryHooks } from '@/features/item/ItemQueryHooks';
import { formatCostAsCurrency } from '@/features/item/utils';
import { extractProficiencies } from '@/lib/attack-calculation';
import type { ItemWithDetails } from '@shared/schema';
import { ARMOR_CATEGORIES, CURRENCY_LIST, DAMAGE_TYPES, FilterType, ITEM_TYPE_LIST, ITEM_TYPES, LOCATION_ENUM, LOCATION_LIST, WEAPON_CATEGORIES, WEAPON_TYPES } from '@shared/static-data';

import { EquipmentList } from '../components/EquipmentList';
import type { EquipmentItem } from '../types';

export function EquipmentTab({
    state,
    updateState,
    resolvedData,
    isLoading
}: TabComponentProps): React.JSX.Element {
    const queryClient = useQueryClient();
    const { generateRandomGold, convertGpToMoney, isReady: isDiceReady } = useStartingGold();

    // Use a ref to always access the latest equipment state
    const equipmentRef = useRef(state.equipment);
    const [equipmentVersion, setEquipmentVersion] = useState(0);
    useEffect(() => {
        equipmentRef.current = state.equipment;
        setEquipmentVersion(prev => prev + 1); // Increment to force dataFetcher recreation
    }, [state.equipment]);

    // Split dialog state
    const [splitDialogOpen, setSplitDialogOpen] = useState(false);
    const [splitItem, setSplitItem] = useState<OwnedItemWithEquipmentId | null>(null);
    const [splitKeepQuantity, setSplitKeepQuantity] = useState<number>(1);

    /**
     * Session-only add mode. Level 1 defaults to purchase (creation shopping);
     * level > 1 defaults to free (loot, import, or between-session updates).
     * Remounts with the Equipment tab so the default follows the current level.
     */
    const [addItemsForFree, setAddItemsForFree] = useState(state.level > 1);

    // Extract proficiencies from resolved features
    const proficiencies = useMemo(() => {
        return extractProficiencies(resolvedData.features);
    }, [resolvedData.features]);

    const handleGenerateRandomGold = useCallback(async () => {
        if (!state.classId || !isDiceReady) {
            return;
        }

        try {
            const totalGp = await generateRandomGold(state.classId);
            const money = convertGpToMoney(totalGp, state.money);
            updateState({ type: CharacterEditStateUpdateType.SET_MONEY, payload: { money } });
        } catch (error) {
            console.error('Error generating random gold:', error);
        }
    }, [state.classId, state.money, isDiceReady, generateRandomGold, convertGpToMoney, updateState]);

    const handleMoneyChange = (currencyId: number, value: number) => {
        const property = CURRENCY_TO_MONEY_KEY[currencyId];
        if (property) {
            const newMoney = { ...state.money, [property]: value };
            updateState({ type: CharacterEditStateUpdateType.SET_MONEY, payload: { money: newMoney } });
        }
    };

    const availableGold = getTotalGoldInGp(state.money);

    // Column definitions for available items to purchase
    const purchaseItemColumns = useMemo<ColumnDef<ItemWithDetails, unknown>[]>(() => [
        {
            accessorKey: 'name',
            header: 'Item Name',
            enableSorting: true,
            enableColumnFilter: true,
            enableResizing: true,
            size: 200,
            filterFn: createContainsFilter<ItemWithDetails>(),
            meta: {
                required: true,
                filterType: FilterType.TEXT_INPUT,
                placeholder: 'Filter by name...'
            },
        },
        {
            accessorKey: 'typeId',
            header: 'Type',
            enableSorting: false,
            enableColumnFilter: false,
            enableResizing: false,
            size: 0,
            enableHiding: false,
            cell: info => {
                const typeId = info.getValue() as number;
                return ITEM_TYPES[typeId]?.name || typeId;
            },
            meta: {
                hidden: true, // Hidden from display but used for grouping header formatting
            },
        },
        {
            accessorKey: 'weapon.category',
            header: 'Weapon Category',
            enableSorting: false,
            enableColumnFilter: false,
            enableResizing: false,
            size: 0,
            enableHiding: false,
            cell: info => {
                const item = info.row.original;
                if (item.weapon) {
                    return WEAPON_CATEGORIES[item.weapon.category]?.name || '';
                }
                return '';
            },
            meta: {
                hidden: true, // Hidden from display but used for grouping header formatting
            },
        },
        {
            accessorKey: 'weapon.type',
            header: 'Weapon Type',
            enableSorting: false,
            enableColumnFilter: false,
            enableResizing: false,
            size: 0,
            enableHiding: false,
            cell: info => {
                const item = info.row.original;
                if (item.weapon) {
                    return WEAPON_TYPES[item.weapon.type]?.name || '';
                }
                return '';
            },
            meta: {
                hidden: true, // Hidden from display but used for grouping header formatting
            },
        },
        {
            accessorKey: 'armor.category',
            header: 'Armor Category',
            enableSorting: false,
            enableColumnFilter: false,
            enableResizing: false,
            size: 0,
            enableHiding: false,
            cell: info => {
                const item = info.row.original;
                if (item.armor) {
                    return ARMOR_CATEGORIES[item.armor.category]?.name || '';
                }
                return '';
            },
            meta: {
                hidden: true, // Hidden from display but used for grouping header formatting
            },
        },
        {
            accessorKey: 'details',
            header: 'Details',
            enableSorting: false,
            enableResizing: true,
            size: 350,
            cell: info => {
                const item = info.row.original;
                const parts: string[] = [];

                // Prioritize armor details for items with armor category (including shields)
                // This ensures shields show armor info instead of weapon info
                if (item.armor) {
                    // Armor details
                    if (item.armor.bonus !== null) {
                        parts.push(`+${item.armor.bonus}`);
                    }
                    if (item.armor.dexterityCap !== null) {
                        parts.push(`Dex +${item.armor.dexterityCap}`);
                    }
                    if (item.armor.checkPenalty !== null) {
                        parts.push(`ACP: ${item.armor.checkPenalty}`);
                    }
                    if (item.armor.speedCapThirty !== null) {
                        parts.push(`${item.armor.speedCapThirty} ft`);
                    }
                } else if (item.weapon) {
                    // Weapon details - format: "Dmg: 1d6, Crit: x2, piercing"
                    if (item.weapon.damageMedium) {
                        parts.push(`Dmg: ${item.weapon.damageMedium}`);
                    }
                    if (item.weapon.critical) {
                        parts.push(`Crit: ${item.weapon.critical}`);
                    }
                    if (item.weapon.damageType) {
                        // Parse damage type string (can be "2", "2|3", "1&2", etc.)
                        const parseDamageType = (damageTypeStr: string): string => {
                            if (!damageTypeStr) return '';

                            // Check if it contains operators
                            if (damageTypeStr.includes('&')) {
                                // AND logic
                                const values = damageTypeStr.split('&').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
                                const names = values.map(v => DAMAGE_TYPES[v]?.name || '').filter(n => n);
                                return names.join(' and ');
                            } else if (damageTypeStr.includes('|')) {
                                // OR logic
                                const values = damageTypeStr.split('|').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
                                const names = values.map(v => DAMAGE_TYPES[v]?.name || '').filter(n => n);
                                return names.join(' or ');
                            } else {
                                // Single value
                                const value = parseInt(damageTypeStr);
                                if (!isNaN(value)) {
                                    return DAMAGE_TYPES[value]?.name || '';
                                }
                                return damageTypeStr; // Fallback to original string
                            }
                        };

                        const damageTypeName = parseDamageType(item.weapon.damageType);
                        if (damageTypeName) {
                            parts.push(damageTypeName.toLowerCase());
                        }
                    }
                    // Always show range if present (for thrown weapons like daggers and throwing axes)
                    if (item.weapon.range) {
                        parts.push(`Rng: ${item.weapon.range}`);
                    }
                }

                return parts.length > 0 ? parts.join(', ') : '-';
            },
        },
        {
            accessorKey: 'cost',
            header: 'Cost',
            enableSorting: true,
            enableColumnFilter: true,
            enableResizing: true,
            size: 70,
            cell: info => {
                const cost = info.getValue();
                return formatCostAsCurrency(cost as string | number | null);
            },
            meta: {
                filterType: FilterType.TEXT_INPUT,
                placeholder: 'Filter by cost...'
            },
        },
        {
            accessorKey: 'weight',
            header: 'Weight',
            enableSorting: true,
            enableResizing: true,
            size: 70,
            cell: info => {
                const weight = info.getValue() as number | null;
                return weight !== null ? `${weight} lbs` : '-';
            },
        },
    ], []);

    // Extended type to track which equipment item this represents and aggregated quantity
    type OwnedItemWithEquipmentId = ItemWithDetails & {
        _equipmentItemId: number;
        _quantity: number; // Aggregated quantity for items with same itemId and location
        _equipmentItemIds: number[]; // All equipment item IDs that make up this aggregated item
        _location?: number | null; // Location for this aggregated group
    };

    // Column definitions for owned items (reduced sizes to prevent horizontal scroll)
    const ownedItemColumns = useMemo<ColumnDef<OwnedItemWithEquipmentId, unknown>[]>(() => [
        {
            accessorKey: 'name',
            header: 'Item Name',
            enableSorting: true,
            enableColumnFilter: true,
            enableResizing: true,
            size: 160,
            filterFn: createContainsFilter<OwnedItemWithEquipmentId>(),
            meta: {
                required: true,
                filterType: FilterType.TEXT_INPUT,
                placeholder: 'Filter by name...'
            },
        },
        {
            accessorKey: 'typeId',
            header: 'Type',
            enableSorting: true,
            enableColumnFilter: true,
            enableResizing: true,
            size: 100,
            cell: info => {
                const typeId = info.getValue() as number;
                return ITEM_TYPES[typeId]?.name || typeId;
            },
            meta: {
                filterType: FilterType.SINGLE_SELECT,
                options: ITEM_TYPE_LIST,
                hidden: true, // Hidden from display but used for grouping header formatting
            },
        },
        {
            accessorKey: 'cost',
            header: 'Cost',
            enableSorting: true,
            enableResizing: true,
            size: 80,
            cell: info => {
                const cost = info.getValue();
                return formatCostAsCurrency(cost as string | number | null);
            },
        },
        {
            accessorKey: 'weight',
            header: 'Weight',
            enableSorting: true,
            enableResizing: true,
            size: 80,
            cell: info => {
                const weight = info.getValue() as number | null;
                return weight !== null ? `${weight} lbs` : '-';
            },
        },
        {
            accessorKey: '_quantity',
            header: 'Quantity',
            enableSorting: true,
            enableResizing: true,
            size: 80,
            cell: info => {
                const quantity = info.getValue() as number;
                return quantity.toString();
            },
        },
        {
            accessorKey: 'location',
            header: 'Location',
            enableSorting: true,
            enableResizing: true,
            size: 95,
            cell: info => {
                const item = info.row.original;
                // Find the first equipment item instance (since items are aggregated by baseItemId)
                // For now, we'll edit the first instance's location
                const firstEquipmentItemId = item._equipmentItemIds?.[0] ?? item._equipmentItemId;
                const equipmentItem = state.equipment.find(eq => eq.id === firstEquipmentItemId);
                const currentLocation = equipmentItem?.location ?? null;

                // Get all occupied locations (except 'carried' which allows multiple)
                const excludeIds = equipmentItem ? new Set([equipmentItem.id]) : undefined;
                const occupiedLocations = getOccupiedLocations(state.equipment, excludeIds);

                return (
                    <CustomSelect
                        value={currentLocation ?? LOCATION_ENUM.Owned}
                        onValueChange={(newLocation) => {
                            if (equipmentItem) {
                                const updatedEquipment = state.equipment.map(eq =>
                                    eq.id === equipmentItem.id
                                        ? { ...eq, location: newLocation === LOCATION_ENUM.Owned ? null : newLocation }
                                        : eq
                                );
                                updateState({
                                    type: CharacterEditStateUpdateType.SET_EQUIPMENT,
                                    payload: { equipment: updatedEquipment }
                                });
                            }
                        }}
                        options={LOCATION_LIST}
                        getOptionDisabled={(option) => {
                            // Disable if location is occupied (except for 'Carried')
                            return option.id !== LOCATION_ENUM.Carried && occupiedLocations.has(option.id);
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
            accessorKey: 'split',
            header: 'Split',
            enableSorting: false,
            enableResizing: false,
            size: 80,
            cell: info => {
                const item = info.row.original;
                const currentLocation = item._location ?? null;
                const quantity = item._quantity;

                // Show split button only if quantity > 1 and in Owned or Carried location
                const canSplit = canSplitItem(quantity, currentLocation);

                if (!canSplit) {
                    return null;
                }

                return (
                    <button
                        onClick={() => {
                            setSplitItem(item);
                            setSplitKeepQuantity(Math.floor(quantity / 2));
                            setSplitDialogOpen(true);
                        }}
                        className="px-2 py-0.5 text-sm rounded bg-green-600 text-white hover:bg-green-700"
                    >
                        Split
                    </button>
                );
            },
        },
    ], [state.equipment, updateState]);

    // Grouping fields for available items (with sub-groupings)
    const purchaseGroupingFields = useMemo(() => {
        return ['typeId', 'weapon.category', 'weapon.type', 'armor.category'];
    }, []);

    // Grouping fields for owned items (only by typeId, no sub-groupings)
    const ownedGroupingFields = useMemo(() => {
        return ['typeId'];
    }, []);

    // Data fetcher for available items - filter out items with negative IDs (like -1 for "all items")
    const purchaseDataFetcher = useMemo(() => {
        return async () => {
            // Use queryClient.fetchQuery to leverage TanStack Query cache
            const result = await queryClient.fetchQuery({
                queryKey: ItemQueryHooks.getAllItemsQueryKey(),
                queryFn: () => ItemQueryHooks.getAllItemsQueryFn(),
                staleTime: 5 * 60 * 1000, // 5 minutes
                gcTime: 10 * 60 * 1000, // 10 minutes
            });
            // Filter out items with negative IDs (these are special placeholder items used in proficiency editor)
            const filteredResults = result.results.filter(item => {
                const itemId = typeof item.id === 'number' ? item.id : parseInt(String(item.id), 10);
                return !isNaN(itemId) && itemId > 0;
            });
            return {
                results: filteredResults,
                total: filteredResults.length,
            };
        };
    }, [queryClient]);

    // Data fetcher for owned items - convert EquipmentItem[] to ItemWithDetails[] with equipment item ID
    // Aggregates items with the same baseItemId and sums their quantities
    // Use useCallback to ensure it updates when equipment changes
    const ownedItemsDataFetcher = useCallback(async () => {
        // Only show items that were purchased (have baseItemId)
        // Use ref to get the latest equipment state (avoids stale closure issues)
        const currentEquipment = equipmentRef.current;
        const purchasedItems = currentEquipment.filter(eq => eq.baseItemId !== null);

        if (purchasedItems.length === 0) {
            return {
                results: [] as OwnedItemWithEquipmentId[],
                total: 0,
            };
        }

        // Fetch all items to get details for owned items - use TanStack Query cache
        const allItemsResult = await queryClient.fetchQuery({
            queryKey: ItemQueryHooks.getAllItemsQueryKey(),
            queryFn: () => ItemQueryHooks.getAllItemsQueryFn(),
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
        });

        // Aggregate items by baseItemId and location (only group items with same location)
        // Use a composite key: `${baseItemId}-${location ?? 'null'}`
        const itemMap = new Map<string, {
            item: ItemWithDetails;
            quantity: number;
            equipmentItemIds: number[];
            firstEquipmentItemId: number;
            location: number | null;
        }>();

        for (const equipmentItem of purchasedItems) {
            if (equipmentItem.baseItemId) {
                const item = allItemsResult.results.find(i => i.id === equipmentItem.baseItemId);
                if (!item) {
                    continue;
                }
                const location = equipmentItem.location ?? null;
                const key = `${equipmentItem.baseItemId}-${location ?? 'null'}`;
                const existing = itemMap.get(key);
                if (existing) {
                    // Aggregate: sum quantities and collect equipment item IDs (same baseItemId and location)
                    existing.quantity += equipmentItem.quantity || 1;
                    existing.equipmentItemIds.push(equipmentItem.id);
                } else {
                    // First occurrence: create entry
                    itemMap.set(key, {
                        item,
                        quantity: equipmentItem.quantity || 1,
                        equipmentItemIds: [equipmentItem.id],
                        firstEquipmentItemId: equipmentItem.id,
                        location: location,
                    });
                }
            }
        }

        // Convert map to array
        const ownedItems: OwnedItemWithEquipmentId[] = Array.from(itemMap.values()).map(entry => ({
            ...entry.item,
            _equipmentItemId: entry.firstEquipmentItemId, // Use first ID for return functionality
            _quantity: entry.quantity,
            _equipmentItemIds: entry.equipmentItemIds,
            _location: entry.location, // Store location for split logic
        }));

        return {
            results: ownedItems,
            total: ownedItems.length,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [equipmentVersion]); // Include version so function reference changes when equipment changes (needed to trigger useEffect in ScrollableCategorizedList)

    /**
     * Add a catalog item to equipment. In purchase mode, deducts gold and stores
     * cost for refund. In free mode, leaves money unchanged and stores cost 0.
     */
    const handlePurchase = useCallback((item: ItemWithDetails) => {
        const costInGp = addItemsForFree ? 0 : getItemCostInGp(item);
        if (!addItemsForFree && costInGp > availableGold) {
            return;
        }

        const newItem: EquipmentItem = {
            id: nextNegativeTempId(equipmentRef.current.map((eq) => eq.id)),
            baseItemId: item.id,
            costInGp,
            quantity: 1,
            location: null,
            notes: item.name,
        };
        const newItems = [...equipmentRef.current, newItem];
        equipmentRef.current = newItems;

        updateState({ type: CharacterEditStateUpdateType.SET_EQUIPMENT, payload: { equipment: newItems } });
        if (!addItemsForFree) {
            const newMoney = convertGpToMoney(availableGold - costInGp);
            updateState({ type: CharacterEditStateUpdateType.SET_MONEY, payload: { money: newMoney } });
        }
    }, [addItemsForFree, availableGold, convertGpToMoney, updateState]);

    /**
     * Remove one owned instance. Refunds gold only when this session stored a
     * purchase cost greater than 0.
     */
    const handleReturn = useCallback((item: ItemWithDetails & { _equipmentItemId?: number; _equipmentItemIds?: number[] }) => {
        const ownedItem = item as OwnedItemWithEquipmentId;
        const currentEquipment = equipmentRef.current;
        const equipmentItemId = ownedItem._equipmentItemIds?.[0] ?? ownedItem._equipmentItemId;
        const equipmentItem = (equipmentItemId
            ? currentEquipment.find(eq => eq.id === equipmentItemId)
            : undefined)
            ?? currentEquipment.find(eq =>
                eq.baseItemId === ownedItem.id
                && (eq.location ?? null) === (ownedItem._location ?? null)
            );

        if (!equipmentItem) {
            return;
        }

        const newItems = currentEquipment.filter(eq => eq.id !== equipmentItem.id);
        equipmentRef.current = newItems;
        updateState({ type: CharacterEditStateUpdateType.SET_EQUIPMENT, payload: { equipment: newItems } });

        const refundGp = equipmentItem.costInGp;
        if (refundGp !== null && refundGp > 0) {
            const newMoney = addGpToMoney(state.money, refundGp);
            updateState({ type: CharacterEditStateUpdateType.SET_MONEY, payload: { money: newMoney } });
        }
    }, [state.money, updateState]);

    const isPurchaseDisabled = useCallback((item: ItemWithDetails): boolean => {
        if (addItemsForFree) {
            return false;
        }
        const costInGp = getItemCostInGp(item);
        return costInGp > availableGold;
    }, [addItemsForFree, availableGold]);

    const handleSplit = useCallback(() => {
        if (!splitItem) return;

        // Get all equipment items that are part of this aggregated group
        const equipmentItems = state.equipment.filter(eq =>
            splitItem._equipmentItemIds?.includes(eq.id) || eq.id === splitItem._equipmentItemId
        );

        if (equipmentItems.length === 0 || !equipmentItems[0].baseItemId) return;

        const firstItem = equipmentItems[0];
        const totalQuantity = splitItem._quantity;
        const { keepQuantity, moveQuantity } = calculateSplitQuantities(totalQuantity, splitKeepQuantity);

        if (moveQuantity <= 0) {
            setSplitDialogOpen(false);
            return;
        }

        // Use the location from the aggregated item (stored in _location)
        const currentLocation = splitItem._location ?? null;
        const newLocation = getSplitTargetLocation(currentLocation);

        // Remove all existing items that are part of this aggregated group
        const otherEquipment = state.equipment.filter(eq =>
            !splitItem._equipmentItemIds?.includes(eq.id) && eq.id !== splitItem._equipmentItemId
        );

        // Create two new items: one for keep, one for move
        const keepId = nextNegativeTempId(state.equipment.map((eq) => eq.id));
        const moveId = nextNegativeTempId([...state.equipment.map((eq) => eq.id), keepId]);
        const keepItem: EquipmentItem = {
            id: keepId,
            baseItemId: firstItem.baseItemId,
            costInGp: firstItem.costInGp,
            quantity: keepQuantity,
            location: currentLocation,
            notes: firstItem.notes,
        };

        const moveItem: EquipmentItem = {
            id: moveId,
            baseItemId: firstItem.baseItemId,
            costInGp: firstItem.costInGp,
            quantity: moveQuantity,
            location: newLocation === LOCATION_ENUM.Owned ? null : newLocation,
            notes: firstItem.notes,
        };

        const finalEquipment = [...otherEquipment, keepItem, moveItem];

        updateState({
            type: CharacterEditStateUpdateType.SET_EQUIPMENT,
            payload: { equipment: finalEquipment }
        });

        setSplitDialogOpen(false);
        setSplitItem(null);
    }, [splitItem, splitKeepQuantity, state.equipment, updateState]);

    const canGenerateGold = state.classId !== null && isDiceReady;

    const coinCurrencies = CURRENCY_LIST.filter((currency) => currency.gpValue > 0);
    const valuableCurrencies = CURRENCY_LIST.filter((currency) => currency.gpValue === 0);

    /**
     * Coin and valuable quantities live on `state.money`. Generate Starting Gold
     * only replaces coins.
     */
    const getDisplayedQuantity = (currencyId: number): number => {
        const property = CURRENCY_TO_MONEY_KEY[currencyId];
        return property ? state.money[property] : 0;
    };

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Equipment
            </h2>

            {/* Loading State */}
            {isLoading && (
                <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg shadow-sm p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                Loading character data...
                            </h3>
                        </div>
                    </div>
                </div>
            )}

            {/* Money: coins + generate on the first row; valuables on the second. */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 mb-6 space-y-3">
                <div className="flex flex-wrap items-center gap-6">
                    {coinCurrencies.map((currency) => (
                        <div key={currency.id} className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                {currency.name} ({currency.abbreviation}):
                            </label>
                            <input
                                type="number"
                                value={getDisplayedQuantity(currency.id)}
                                onChange={(e) => handleMoneyChange(currency.id, parseInt(e.target.value) || 0)}
                                className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                            />
                        </div>
                    ))}
                    <button
                        onClick={handleGenerateRandomGold}
                        disabled={!canGenerateGold}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        Generate Starting Gold
                    </button>
                </div>
                <div className="flex flex-wrap items-center gap-6">
                    {valuableCurrencies.map((currency) => (
                        <div key={currency.id} className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                {currency.name} ({currency.abbreviation}):
                            </label>
                            <input
                                type="number"
                                value={getDisplayedQuantity(currency.id)}
                                onChange={(e) => handleMoneyChange(currency.id, parseInt(e.target.value) || 0)}
                                className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Owned Equipment */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Your Equipment
                </h3>
                <div className="h-[400px]">
                    <EquipmentList<OwnedItemWithEquipmentId>
                        key={`owned-${state.equipment.length}-${state.equipment.map(e => e.id).join(',')}`}
                        dataFetcher={ownedItemsDataFetcher}
                        groupingFields={ownedGroupingFields}
                        columns={ownedItemColumns}
                        actionButtonLabel="Return"
                        onAction={handleReturn}
                        searchPlaceholder="Search owned items..."
                        storageKey="equipment-owned"
                        itemDesc="owned items"
                        maxHeight="auto"
                        allowAll={true} // Owned items don't need proficiency checks
                    />
                </div>
            </div>

            {/* Available Items to Purchase */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Available Items
                    </h3>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={addItemsForFree}
                            onChange={(e) => setAddItemsForFree(e.target.checked)}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Add for free
                        </span>
                    </label>
                </div>
                <div className="h-[500px]">
                    <EquipmentList
                        dataFetcher={purchaseDataFetcher}
                        groupingFields={purchaseGroupingFields}
                        columns={purchaseItemColumns}
                        actionButtonLabel={addItemsForFree ? 'Add' : 'Buy'}
                        onAction={handlePurchase}
                        isActionDisabled={isPurchaseDisabled}
                        proficientWeaponCategories={proficiencies.weaponCategories}
                        proficientArmorCategories={proficiencies.armorCategories}
                        proficientItemIds={proficiencies.itemIds}
                        allowAll={false} // Equipment tab should respect proficiencies
                        searchPlaceholder="Search items by name..."
                        storageKey="equipment-purchase"
                        itemDesc="items"
                        maxHeight="auto"
                    />
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
                            Total quantity: {splitItem._quantity}
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Keep in current location:
                            </label>
                            <input
                                type="number"
                                min="1"
                                max={splitItem._quantity - 1}
                                value={splitKeepQuantity}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value) || 1;
                                    const max = splitItem._quantity - 1;
                                    setSplitKeepQuantity(Math.max(1, Math.min(value, max)));
                                }}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {splitItem._quantity - splitKeepQuantity} will be moved to{' '}
                                {getSplitTargetLocationName(splitItem._location)}
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

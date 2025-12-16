import React, { useCallback, useMemo } from 'react';

import { ScrollableCategorizedList } from '@/components/scrollable-categorized-list';
import { createContainsFilter } from '@/components/generic-list/filterFunctions';
import { ColumnDef } from '@tanstack/react-table';
import type { TabComponentProps } from '@/features/character/types';
import { CharacterEditStateUpdateType } from '@/features/character/types';
import { useStartingGold } from '@/features/character/utils/startingGold';
import { ItemQueryHooks } from '@/services/query/ItemQueryHooks';
import { CURRENCY_LIST, ITEM_TYPES, ITEM_TYPE_LIST, WEAPON_CATEGORIES, WEAPON_TYPES, ARMOR_CATEGORIES, FilterType, PROFICIENCY_TYPE_ENUM, PROFICIENCY_TYPES, FeatBenefitType, EntityType, EntityAppliesToType, ITEM_TYPE_ENUM } from '@shared/static-data';
import type { ItemWithDetails } from '@shared/schema';
import type { FeatureProgression, FeatureEntity } from '@shared/schema';

import { formatCostAsCurrency } from '@/features/item/utils';
import type { EquipmentItem } from '../types';

/**
 * Convert Money object to total gold pieces
 */
function getTotalGoldInGp(money: { platinum: number; gold: number; silver: number; copper: number }): number {
    const { platinum, gold, silver, copper } = money;
    return platinum * 10 + gold + silver * 0.1 + copper * 0.01;
}

/**
 * Convert gold pieces to Money object, keeping gold as gold (no upconversion to platinum)
 */
function convertGpToMoney(gp: number): { platinum: number; gold: number; silver: number; copper: number } {
    const gold = Math.floor(gp);
    const goldDecimal = gp - gold;
    const silver = Math.floor(goldDecimal * 10);
    const copper = Math.round((goldDecimal * 10 - silver) * 10);
    return { platinum: 0, gold, silver, copper };
}

/**
 * Add gold pieces to existing money
 */
function addGpToMoney(money: { platinum: number; gold: number; silver: number; copper: number }, gp: number): { platinum: number; gold: number; silver: number; copper: number } {
    const totalGp = getTotalGoldInGp(money) + gp;
    return convertGpToMoney(totalGp);
}

/**
 * Get item cost in gold pieces
 */
function getItemCostInGp(item: ItemWithDetails): number {
    if (!item.cost) {
        return 0;
    }
    const costStr = typeof item.cost === 'string' ? item.cost : item.cost.toString();
    return parseFloat(costStr) || 0;
}

/**
 * Extract proficiencies from resolved feature progressions
 * Returns weapon category IDs, armor category IDs, and specific item IDs
 */
function extractProficiencies(progressions: FeatureProgression[]): {
    weaponCategories: number[];
    armorCategories: number[];
    itemIds: number[];
} {
    const weaponCategories = new Set<number>();
    const armorCategories = new Set<number>();
    const itemIds = new Set<number>();

    for (const progression of progressions) {
        if (progression.entities) {
            for (const entity of progression.entities) {
                // Check if this is a proficiency entity
                if (entity.type === EntityType.Proficiency && entity.appliesTo === EntityAppliesToType.Feat) {
                    if (!entity.appliesToId) continue;

                    // Check if it's a category-based proficiency (appliesToSubId === -1 means "all")
                    if (entity.appliesToSubId === -1 || entity.appliesToSubId === null) {
                        // Category-based proficiency - get the proficiency type from the feat
                        if (entity.feat?.benefits) {
                            const proficiencyBenefit = entity.feat.benefits.find(
                                benefit => benefit.typeId === FeatBenefitType.PROFICIENCY
                            );
                            
                            if (proficiencyBenefit?.referenceId) {
                                const proficiencyType = PROFICIENCY_TYPES[proficiencyBenefit.referenceId];
                                if (proficiencyType) {
                                    // Check if it's a weapon or armor proficiency
                                    if (proficiencyType.itemTypeId === ITEM_TYPE_ENUM.Weapon) {
                                        weaponCategories.add(proficiencyType.category);
                                    } else if (proficiencyType.itemTypeId === ITEM_TYPE_ENUM.Armor) {
                                        armorCategories.add(proficiencyType.category);
                                    }
                                }
                            }
                        }
                    } else if (entity.appliesToSubId && entity.appliesToSubId > 0) {
                        // Specific item proficiency - appliesToSubId is the item ID
                        itemIds.add(entity.appliesToSubId);
                    }
                }
            }
        }
    }

    return {
        weaponCategories: Array.from(weaponCategories),
        armorCategories: Array.from(armorCategories),
        itemIds: Array.from(itemIds),
    };
}

export function EquipmentTab({
    state,
    updateState,
    resolvedData,
    isLoading
}: TabComponentProps): React.JSX.Element {
    const { generateRandomGold, convertGpToMoney, isReady: isDiceReady } = useStartingGold();

    // Extract proficiencies from resolved features
    const proficiencies = useMemo(() => {
        return extractProficiencies(resolvedData.progressions);
    }, [resolvedData.progressions]);

    const handleGenerateRandomGold = useCallback(async () => {
        if (!state.classId || !isDiceReady) {
            return;
        }

        try {
            const totalGp = await generateRandomGold(state.classId);
            const money = convertGpToMoney(totalGp);
            updateState({ type: CharacterEditStateUpdateType.SET_MONEY, payload: { money } });
        } catch (error) {
            console.error('Error generating random gold:', error);
        }
    }, [state.classId, isDiceReady, generateRandomGold, convertGpToMoney, updateState]);

    const handleMoneyChange = (currencyId: number, value: number) => {
        // Map currency ID to Money property name
        const currencyMap: Record<number, keyof typeof state.money> = {
            1: 'copper',
            2: 'silver',
            3: 'gold',
            4: 'platinum',
        };
        const property = currencyMap[currencyId];
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
            enableSorting: true,
            enableColumnFilter: true,
            enableResizing: true,
            size: 120,
            cell: info => {
                const typeId = info.getValue() as number;
                return ITEM_TYPES[typeId]?.name || typeId;
            },
            meta: {
                filterType: FilterType.SINGLE_SELECT,
                options: ITEM_TYPE_LIST,
            },
        },
        {
            accessorKey: 'weapon.category',
            header: 'Weapon Category',
            enableSorting: true,
            enableResizing: true,
            size: 120,
            cell: info => {
                const item = info.row.original;
                if (item.weapon) {
                    return WEAPON_CATEGORIES[item.weapon.category]?.name || '';
                }
                return '';
            },
        },
        {
            accessorKey: 'weapon.type',
            header: 'Weapon Type',
            enableSorting: true,
            enableResizing: true,
            size: 120,
            cell: info => {
                const item = info.row.original;
                if (item.weapon) {
                    return WEAPON_TYPES[item.weapon.type]?.name || '';
                }
                return '';
            },
        },
        {
            accessorKey: 'armor.category',
            header: 'Armor Category',
            enableSorting: true,
            enableResizing: true,
            size: 120,
            cell: info => {
                const item = info.row.original;
                if (item.armor) {
                    return ARMOR_CATEGORIES[item.armor.category]?.name || '';
                }
                return '';
            },
        },
        {
            accessorKey: 'cost',
            header: 'Cost',
            enableSorting: true,
            enableColumnFilter: true,
            enableResizing: true,
            size: 100,
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
            size: 100,
            cell: info => {
                const weight = info.getValue() as number | null;
                return weight !== null ? `${weight} lbs` : '-';
            },
        },
    ], []);

    // Column definitions for owned items (reduced sizes to prevent horizontal scroll)
    const ownedItemColumns = useMemo<ColumnDef<ItemWithDetails, unknown>[]>(() => [
        {
            accessorKey: 'name',
            header: 'Item Name',
            enableSorting: true,
            enableColumnFilter: true,
            enableResizing: true,
            size: 150,
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
            enableSorting: true,
            enableColumnFilter: true,
            enableResizing: true,
            size: 80,
            cell: info => {
                const typeId = info.getValue() as number;
                return ITEM_TYPES[typeId]?.name || typeId;
            },
            meta: {
                filterType: FilterType.SINGLE_SELECT,
                options: ITEM_TYPE_LIST,
            },
        },
        {
            accessorKey: 'cost',
            header: 'Purchase Cost',
            enableSorting: true,
            enableResizing: true,
            size: 90,
            cell: info => {
                const cost = info.getValue();
                return formatCostAsCurrency(cost as string | number | null);
            },
        },
    ], []);

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
            const result = await ItemQueryHooks.getItems();
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
    }, []);

    // Extended type to track which equipment item this represents
    type OwnedItemWithEquipmentId = ItemWithDetails & { _equipmentItemId: number };

    // Data fetcher for owned items - convert EquipmentItem[] to ItemWithDetails[] with equipment item ID
    // Use useCallback to ensure it updates when equipment changes
    const ownedItemsDataFetcher = useCallback(async () => {
        // Only show items that were purchased (have itemId)
        const purchasedItems = state.equipment.filter(eq => eq.itemId !== null);
        
        if (purchasedItems.length === 0) {
            return {
                results: [] as OwnedItemWithEquipmentId[],
                total: 0,
            };
        }

        // Fetch all items to get details for owned items
        const allItemsResult = await ItemQueryHooks.getItems();
        const ownedItems: OwnedItemWithEquipmentId[] = [];
        
        for (const equipmentItem of purchasedItems) {
            if (equipmentItem.itemId) {
                const item = allItemsResult.results.find(i => i.id === equipmentItem.itemId);
                if (item) {
                    // Add equipment item ID as metadata
                    ownedItems.push({
                        ...item,
                        _equipmentItemId: equipmentItem.id,
                    });
                }
            }
        }

        return {
            results: ownedItems,
            total: ownedItems.length,
        };
    }, [state.equipment]);

    const handlePurchase = useCallback((item: ItemWithDetails) => {
        const costInGp = getItemCostInGp(item);
        if (costInGp > availableGold) {
            return;
        }

        // Deduct cost from money
        const newMoney = convertGpToMoney(availableGold - costInGp);

        // Add item to equipment
        const newItem: EquipmentItem = {
            id: Date.now(),
            itemId: item.id,
            costInGp: costInGp,
            quantity: 1,
            location: null,
            notes: item.name,
        };
        const newItems = [...state.equipment, newItem];
        
        // Update both equipment and money
        updateState({ type: CharacterEditStateUpdateType.SET_EQUIPMENT, payload: { equipment: newItems } });
        updateState({ type: CharacterEditStateUpdateType.SET_MONEY, payload: { money: newMoney } });
    }, [state.equipment, availableGold, updateState]);

    const handleReturn = useCallback((item: ItemWithDetails & { _equipmentItemId?: number }) => {
        // Use the equipment item ID if available (for owned items)
        const equipmentItemId = (item as OwnedItemWithEquipmentId)._equipmentItemId;
        const equipmentItem = equipmentItemId 
            ? state.equipment.find(eq => eq.id === equipmentItemId)
            : state.equipment.find(eq => eq.itemId === item.id);
            
        if (!equipmentItem || !equipmentItem.costInGp) {
            return;
        }

        // Refund the cost
        const refundGp = equipmentItem.costInGp;
        const newMoney = addGpToMoney(state.money, refundGp);

        // Remove item from equipment
        const newItems = state.equipment.filter(eq => eq.id !== equipmentItem.id);
        
        // Update both equipment and money
        updateState({ type: CharacterEditStateUpdateType.SET_EQUIPMENT, payload: { equipment: newItems } });
        updateState({ type: CharacterEditStateUpdateType.SET_MONEY, payload: { money: newMoney } });
    }, [state.equipment, state.money, updateState]);

    const isPurchaseDisabled = useCallback((item: ItemWithDetails): boolean => {
        const costInGp = getItemCostInGp(item);
        return costInGp > availableGold;
    }, [availableGold]);

    const canGenerateGold = state.classId !== null && isDiceReady;

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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Money */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Money
                        </h3>
                        <button
                            onClick={handleGenerateRandomGold}
                            disabled={!canGenerateGold}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Generate Random Starting Gold
                        </button>
                    </div>
                    <div className="space-y-3">
                        {CURRENCY_LIST.map((currency) => (
                            <div key={currency.id} className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {currency.name} ({currency.abbreviation})
                                </label>
                                <input
                                    type="number"
                                    value={
                                        currency.id === 1 ? state.money.copper :
                                        currency.id === 2 ? state.money.silver :
                                        currency.id === 3 ? state.money.gold :
                                        currency.id === 4 ? state.money.platinum : 0
                                    }
                                    onChange={(e) => handleMoneyChange(currency.id, parseInt(e.target.value) || 0)}
                                    className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    min="0"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Owned Equipment */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Your Equipment
                    </h3>
                    <div className="h-[400px]">
                        <ScrollableCategorizedList<OwnedItemWithEquipmentId>
                            key={`owned-${state.equipment.length}`}
                            dataFetcher={ownedItemsDataFetcher}
                            groupingFields={ownedGroupingFields}
                            columns={ownedItemColumns}
                            actionButtonLabel="Return"
                            onAction={handleReturn}
                            allowMultiple={true}
                            searchPlaceholder="Search owned items..."
                            storageKey="equipment-owned"
                            itemDesc="owned items"
                            maxHeight="auto"
                        />
                    </div>
                </div>
            </div>

            {/* Available Items to Purchase */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Available Items
                </h3>
                <div className="h-[500px]">
                    <ScrollableCategorizedList<ItemWithDetails>
                        dataFetcher={purchaseDataFetcher}
                        groupingFields={purchaseGroupingFields}
                        columns={purchaseItemColumns}
                        actionButtonLabel="Buy"
                        onAction={handlePurchase}
                        isActionDisabled={isPurchaseDisabled}
                        allowMultiple={true}
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
        </div>
    );
}

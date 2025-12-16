import { Dialog } from '@base-ui-components/react/dialog';
import { ColumnDef } from '@tanstack/react-table';
import React, { useMemo } from 'react';

import { ScrollableCategorizedList } from '@/components/scrollable-categorized-list';
import { createContainsFilter } from '@/components/generic-list/filterFunctions';
import { ItemQueryHooks } from '@/services/query/ItemQueryHooks';
import type { ItemWithDetails } from '@shared/schema';
import { CurrencyId, CURRENCY, ITEM_TYPES, ITEM_TYPE_LIST, WEAPON_CATEGORIES, WEAPON_TYPES, ARMOR_CATEGORIES, FilterType } from '@shared/static-data';

import { formatCostAsCurrency } from '@/features/item/utils';
import type { Money } from '../types';
import { CharacterEditStateUpdateType } from '../types';

interface EquipmentPurchaseDialogProps {
    isOpen: boolean;
    onClose: () => void;
    money: Money;
    onPurchase: (item: ItemWithDetails, newMoney: Money) => void;
}

/**
 * Convert Money object to total gold pieces
 */
function getTotalGoldInGp(money: Money): number {
    const { platinum, gold, silver, copper } = money;
    return platinum * 10 + gold + silver * 0.1 + copper * 0.01;
}

/**
 * Convert gold pieces to Money object, preferring gold pieces
 */
function convertGpToMoney(gp: number): Money {
    const platinum = Math.floor(gp / 10);
    const remainingAfterPlatinum = gp - (platinum * 10);
    const gold = Math.floor(remainingAfterPlatinum);
    const remainingAfterGold = remainingAfterPlatinum - gold;
    const silver = Math.floor(remainingAfterGold * 10);
    const remainingAfterSilver = remainingAfterGold - (silver * 0.1);
    const copper = Math.round(remainingAfterSilver * 100);

    return {
        platinum,
        gold,
        silver,
        copper,
    };
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
 * Deduct cost from money
 */
function deductCost(money: Money, costInGp: number): Money {
    const totalGp = getTotalGoldInGp(money);
    const remainingGp = Math.max(0, totalGp - costInGp);
    return convertGpToMoney(remainingGp);
}

export function EquipmentPurchaseDialog({
    isOpen,
    onClose,
    money,
    onPurchase,
}: EquipmentPurchaseDialogProps): React.JSX.Element {
    const availableGold = getTotalGoldInGp(money);

    // Create column definitions for items
    const itemColumns = useMemo<ColumnDef<ItemWithDetails, unknown>[]>(() => [
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

    // Determine grouping fields based on item type
    // For weapons: group by typeId, then weapon.category, then weapon.type
    // For armor: group by typeId, then armor.category
    // For others: just group by typeId
    const groupingFields = useMemo(() => {
        // We'll use a dynamic approach - group by typeId first, then conditionally by category/type
        // For simplicity, we'll group by: typeId, then check if weapon/armor exists
        return ['typeId', 'weapon.category', 'weapon.type', 'armor.category'];
    }, []);

    const handlePurchase = (item: ItemWithDetails): void => {
        const costInGp = getItemCostInGp(item);
        if (costInGp > availableGold) {
            // Should be disabled, but double-check
            return;
        }

        const newMoney = deductCost(money, costInGp);
        onPurchase(item, newMoney);
    };

    const isActionDisabled = (item: ItemWithDetails): boolean => {
        const costInGp = getItemCostInGp(item);
        return costInGp > availableGold;
    };

    // Create data fetcher
    const dataFetcher = useMemo(() => {
        return async () => {
            const result = await ItemQueryHooks.itemQuery({});
            return result;
        };
    }, []);

    if (!isOpen) {
        return <></>;
    }

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Backdrop className="fixed inset-0 bg-black bg-opacity-25 z-40" />
            <Dialog.Portal>
                <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-6xl max-h-[90vh] transform overflow-visible rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-800 flex flex-col">
                        <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4">
                            Purchase Equipment
                        </Dialog.Title>
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                            <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                Available Gold: {availableGold.toFixed(2)} gp
                            </div>
                            <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                                {money.platinum > 0 && `${money.platinum} pp, `}
                                {money.gold > 0 && `${money.gold} gp, `}
                                {money.silver > 0 && `${money.silver} sp, `}
                                {money.copper > 0 && `${money.copper} cp`}
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <ScrollableCategorizedList<ItemWithDetails>
                                dataFetcher={dataFetcher}
                                groupingFields={groupingFields}
                                columns={itemColumns}
                                actionButtonLabel="Buy"
                                onAction={handlePurchase}
                                isActionDisabled={isActionDisabled}
                                allowMultiple={true}
                                searchPlaceholder="Search items by name..."
                                storageKey="equipment-purchase"
                                itemDesc="items"
                            />
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Dialog.Close className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                                Close
                            </Dialog.Close>
                        </div>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}


import React, { useMemo } from 'react';

import { ScrollableCategorizedList } from '@/components/scrollable-categorized-list';
import type { GroupingConfig, ItemFilterConfig } from '@/components/scrollable-categorized-list/types';
import { getFieldValue } from '@/components/scrollable-categorized-list/types';
import type { ItemWithDetails } from '@shared/schema';

import type { EquipmentListProps } from './types';

/**
 * Equipment-specific wrapper around ScrollableCategorizedList
 * Handles equipment-specific grouping and proficiency logic
 */
export function EquipmentList<T extends ItemWithDetails = ItemWithDetails>({
    dataFetcher,
    columns,
    groupingFields,
    actionButtonLabel,
    onAction,
    isActionDisabled,
    proficientWeaponCategories,
    proficientArmorCategories,
    proficientItemIds,
    allowAll = false,
    searchPlaceholder = 'Search items by name...',
    storageKey,
    itemDesc = 'items',
    maxHeight = 'auto',
}: EquipmentListProps<T>): React.JSX.Element {
    // Equipment-specific grouping config
    const groupingConfig = useMemo<GroupingConfig<T>>(() => ({
        // Determine which fields to use for grouping (skip weapon fields for armor items)
        getEffectiveFields: (item: T, fields: string[]): string[] => {
            const hasArmorCategory = getFieldValue(item, 'armor.category') !== null &&
                getFieldValue(item, 'armor.category') !== undefined;

            if (hasArmorCategory) {
                // Skip weapon.category and weapon.type if armor.category exists
                return fields.filter(field =>
                    field !== 'weapon.category' && field !== 'weapon.type'
                );
            }
            return fields;
        },

        // Determine which field to use for formatting category labels
        getEffectiveFieldForFormatting: (
            currentField: string,
            categoryValue: unknown,
            sampleItem: ItemWithDetails | null,
            _groupingFields: string[],
            _currentFieldIndex: number
        ): string => {
            // If current field is a weapon field, check if items have armor.category instead
            if ((currentField === 'weapon.category' || currentField === 'weapon.type') && sampleItem) {
                const hasArmorCategory = getFieldValue(sampleItem, 'armor.category') !== null &&
                    getFieldValue(sampleItem, 'armor.category') !== undefined;
                if (hasArmorCategory) {
                    // Use armor.category instead of weapon.category/weapon.type
                    return 'armor.category';
                }
            }
            return currentField;
        },

        // Sort group keys for proper ordering
        sortGroupKeys: (
            keys: Array<[unknown, unknown]>,
            fieldPath: string,
            _groupingFields: string[],
            _currentFieldIndex: number
        ): Array<[unknown, unknown]> => {
            // Sort weapon categories: Simple (1), Martial (2), Exotic (3)
            if (fieldPath === 'weapon.category') {
                return keys.sort(([a], [b]) => {
                    const aVal = a as number;
                    const bVal = b as number;
                    // Simple (1) < Martial (2) < Exotic (3)
                    return aVal - bVal;
                });
            }

            // Sort weapon types: Unarmed (1), Light (2), One-Handed (3), Two-Handed (4), Ranged (5)
            if (fieldPath === 'weapon.type') {
                return keys.sort(([a], [b]) => {
                    const aVal = a as number;
                    const bVal = b as number;
                    // Unarmed (1) < Light (2) < One-Handed (3) < Two-Handed (4) < Ranged (5)
                    return aVal - bVal;
                });
            }

            // Sort armor categories: Light (1), Medium (2), Heavy (3), Shield (4)
            if (fieldPath === 'armor.category') {
                return keys.sort(([a], [b]) => {
                    const aVal = a as number;
                    const bVal = b as number;
                    // Light (1) < Medium (2) < Heavy (3) < Shield (4)
                    return aVal - bVal;
                });
            }

            // Default: no sorting
            return keys;
        },
    }), []);

    // Equipment-specific item filter (proficiency checking)
    const itemFilter = useMemo<ItemFilterConfig<T>>(() => ({
        isItemEnabled: (item: T): boolean => {
            // If allowAll is true, bypass proficiency checks
            if (allowAll) {
                return true;
            }

            // If no proficiency data provided, allow all items
            if (!proficientWeaponCategories && !proficientArmorCategories && !proficientItemIds) {
                return true;
            }

            // Check if item is in proficientItemIds (specific item proficiency)
            if (proficientItemIds && item.id !== undefined) {
                const itemId = typeof item.id === 'number' ? item.id : parseInt(String(item.id), 10);
                if (!isNaN(itemId) && proficientItemIds.includes(itemId)) {
                    return true;
                }
            }

            // Get both weapon and armor categories
            const weaponCategory = getFieldValue(item, 'weapon.category') as number | undefined;
            const armorCategory = getFieldValue(item, 'armor.category') as number | undefined;

            // Prioritize armor proficiency check for items with armor category (including shields)
            // This ensures shields are available when character has "all shields" proficiency
            if (armorCategory !== undefined) {
                if (proficientArmorCategories && proficientArmorCategories.includes(armorCategory)) {
                    return true;
                }
                // If item has armor category but is not proficient, return false
                // (don't check weapon proficiency for armor items)
                return false;
            }

            // Check weapon proficiency for items that only have weapon category
            if (weaponCategory !== undefined) {
                if (proficientWeaponCategories && proficientWeaponCategories.includes(weaponCategory)) {
                    return true;
                }
                // If item has weapon category but is not proficient, return false
                return false;
            }

            // For non-weapon/armor items, allow them (they don't require proficiency)
            return true;
        },
    }), [allowAll, proficientWeaponCategories, proficientArmorCategories, proficientItemIds]);

    return (
        <ScrollableCategorizedList<T>
            dataFetcher={dataFetcher}
            groupingFields={groupingFields}
            groupingConfig={groupingConfig}
            columns={columns}
            actionButtonLabel={actionButtonLabel}
            onAction={onAction}
            isActionDisabled={isActionDisabled}
            itemFilter={itemFilter}
            searchPlaceholder={searchPlaceholder}
            storageKey={storageKey}
            itemDesc={itemDesc}
            maxHeight={maxHeight}
        />
    );
}


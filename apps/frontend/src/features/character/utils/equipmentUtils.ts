import type { ItemWithDetails } from '@shared/schema';
import { LOCATION_ENUM } from '@shared/static-data';

import type { AggregatedItem, EquipmentItemBase } from '../types';

/**
 * Utility functions for equipment-related logic on the frontend.
 * 
 * **Frontend-only utilities**: These functions are used for UI state management, item aggregation,
 * location tracking, and item splitting. They operate on equipment items in the frontend state
 * and are not shared with the backend.
 */

/**
 * Aggregate equipment items by baseItemId and location.
 * 
 * **Frontend-only utility**: Groups items with the same baseItemId and location together, summing their quantities.
 * Used for UI display purposes to show consolidated equipment lists.
 * 
 * @param equipmentItems - Array of equipment items to aggregate
 * @param allItems - Array of all available items for lookup
 * @returns Map of aggregated items keyed by `${baseItemId}-${location}`
 */
export function aggregateEquipmentItems<T extends EquipmentItemBase>(
    equipmentItems: T[],
    allItems: ItemWithDetails[]
): Map<string, AggregatedItem> {
    const itemMap = new Map<string, AggregatedItem>();

    for (const equipmentItem of equipmentItems) {
        if (!equipmentItem.baseItemId) continue;

        const item = allItems.find(i => i.id === equipmentItem.baseItemId);
        if (!item) continue;

        const location = equipmentItem.location ?? null;
        const key = `${equipmentItem.baseItemId}-${location ?? 'null'}`;
        const existing = itemMap.get(key);

        if (existing) {
            existing.quantity += equipmentItem.quantity || 1;
            existing.equipmentItemIds.push(equipmentItem.id);
        } else {
            itemMap.set(key, {
                item,
                quantity: equipmentItem.quantity || 1,
                equipmentItemIds: [equipmentItem.id],
                firstEquipmentItemId: equipmentItem.id,
                location,
            });
        }
    }

    return itemMap;
}

/**
 * Get occupied equipment locations (excluding Carried and Owned which allow multiple items).
 * 
 * **Frontend-only utility**: Used for UI validation to prevent placing items in occupied locations.
 * 
 * @param equipmentItems - Array of equipment items
 * @param excludeIds - Optional set of equipment item IDs to exclude from the check
 * @returns Set of occupied location IDs
 */
export function getOccupiedLocations<T extends EquipmentItemBase>(
    equipmentItems: T[],
    excludeIds?: Set<number>
): Set<number> {
    return new Set(
        equipmentItems
            .filter(eq => {
                if (excludeIds?.has(eq.id)) return false;
                return eq.location !== null &&
                    eq.location !== LOCATION_ENUM.Owned &&
                    eq.location !== LOCATION_ENUM.Carried;
            })
            .map(eq => eq.location)
            .filter((loc): loc is number => loc !== null)
    );
}

/**
 * Check if an item can be split (quantity > 1 and in Owned or Carried location).
 * 
 * **Frontend-only utility**: Used for UI to determine if split action should be enabled.
 * 
 * @param quantity - The item quantity
 * @param location - The item location
 * @returns True if the item can be split
 */
export function canSplitItem(quantity: number, location: number | null): boolean {
    return quantity > 1 &&
        (location === null || location === LOCATION_ENUM.Owned || location === LOCATION_ENUM.Carried);
}

/**
 * Calculate the new location when splitting an item.
 * 
 * **Frontend-only utility**: Toggles between Owned and Carried for UI split operations.
 * 
 * @param currentLocation - The current location of the item
 * @returns The new location for the split portion
 */
export function getSplitTargetLocation(currentLocation: number | null): number | null {
    if (currentLocation === null || currentLocation === LOCATION_ENUM.Owned) {
        return LOCATION_ENUM.Carried;
    }
    return LOCATION_ENUM.Owned;
}

/**
 * Get the display name for a split target location.
 * 
 * **Frontend-only utility**: Used for UI display when showing split options.
 * 
 * @param currentLocation - The current location of the item
 * @returns Display name for the target location ('Carried' or 'Owned')
 */
export function getSplitTargetLocationName(currentLocation: number | null): string {
    if (currentLocation === null || currentLocation === LOCATION_ENUM.Owned) {
        return 'Carried';
    }
    return 'Owned';
}

/**
 * Calculate valid split quantities.
 * 
 * **Frontend-only utility**: Validates and calculates split quantities for UI operations.
 * 
 * @param totalQuantity - Total quantity of the item
 * @param keepQuantity - Desired quantity to keep in current location
 * @returns Object with validated keepQuantity and moveQuantity
 */
export function calculateSplitQuantities(
    totalQuantity: number,
    keepQuantity: number
): { keepQuantity: number; moveQuantity: number } {
    const validKeepQuantity = Math.max(1, Math.min(keepQuantity, totalQuantity - 1));
    const moveQuantity = totalQuantity - validKeepQuantity;
    return { keepQuantity: validKeepQuantity, moveQuantity };
}

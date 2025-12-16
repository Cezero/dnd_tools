import { ColumnDef } from '@tanstack/react-table';

import type { TanStackQueryHook } from '@/components/generic-list/types';

export interface ScrollableCategorizedListProps<T> {
    // Data fetching (similar to GenericList)
    queryHook?: TanStackQueryHook<T>;
    dataFetcher?: () => Promise<{ results: T[]; total: number }>;
    serviceFunction?: () => Promise<{ results: T[]; total: number }>;

    // Grouping configuration
    groupingFields: string[]; // Field paths for hierarchical grouping (e.g., ['itemTypeId', 'weapon.category', 'weapon.type'])

    // Column definitions (same as GenericList)
    columns: ColumnDef<T, unknown>[];

    // Action button configuration
    actionButtonLabel: string;
    onAction: (item: T) => void;
    isActionDisabled?: (item: T) => boolean;
    allowMultiple?: boolean; // If false, items can only be obtained once

    // Proficiency filtering
    proficientWeaponCategories?: number[]; // Array of weapon category IDs (e.g., [1, 2] for Simple and Martial)
    proficientArmorCategories?: number[]; // Array of armor category IDs
    proficientItemIds?: number[]; // Array of specific item IDs that character is proficient with
    allowAll?: boolean; // If true, bypass proficiency checks (for treasure/other use cases)

    // Search
    searchPlaceholder?: string;

    // State persistence
    storageKey?: string;

    // Display
    itemDesc?: string;
    
    // Height configuration
    maxHeight?: number | 'auto'; // Max height in pixels, or 'auto' to calculate from parent
}

/**
 * Extract value from item using field path (supports nested paths like 'weapon.category')
 */
export function getFieldValue<T>(item: T, fieldPath: string): unknown {
    const parts = fieldPath.split('.');
    let value: unknown = item;

    for (const part of parts) {
        if (value === null || value === undefined || typeof value !== 'object') {
            return undefined;
        }
        value = (value as Record<string, unknown>)[part];
    }

    return value;
}

/**
 * Group items by field paths
 * Returns a hierarchical structure: Map<value, Map<value, ...items[]>>
 * Handles missing fields by grouping under '_null' or skipping to next applicable field
 */
export function groupItemsByFields<T>(
    items: T[],
    groupingFields: string[]
): Map<unknown, unknown> {
    if (groupingFields.length === 0) {
        // No grouping, return all items in a single group
        const map = new Map();
        map.set('_all', items);
        return map;
    }

    const result = new Map<unknown, unknown>();

    for (const item of items) {
        let currentMap = result;
        
        // Special handling: if item has armor.category, skip weapon.category and weapon.type
        // This ensures items like shields (which have both armor and weapon properties) 
        // are grouped only by typeId and armor.category
        const hasArmorCategory = getFieldValue(item, 'armor.category') !== null && 
                                  getFieldValue(item, 'armor.category') !== undefined;
        
        // Determine which fields to actually use for this item
        const effectiveFields: string[] = [];
        for (let i = 0; i < groupingFields.length; i++) {
            const fieldPath = groupingFields[i];
            // Skip weapon.category and weapon.type if armor.category exists
            if (hasArmorCategory && (fieldPath === 'weapon.category' || fieldPath === 'weapon.type')) {
                continue;
            }
            effectiveFields.push(fieldPath);
        }

        if (effectiveFields.length === 0) {
            // No effective fields, group under '_null'
            const key = '_null';
            if (!currentMap.has(key)) {
                currentMap.set(key, []);
            }
            const existing = currentMap.get(key);
            if (Array.isArray(existing)) {
                existing.push(item);
            }
            continue;
        }

        let lastValidFieldIndex = -1;

        // Find the last valid (non-null) field value
        for (let i = effectiveFields.length - 1; i >= 0; i--) {
            const fieldPath = effectiveFields[i];
            const value = getFieldValue(item, fieldPath);
            if (value !== null && value !== undefined) {
                lastValidFieldIndex = i;
                break;
            }
        }

        // If no valid fields found, group under '_null' at root level
        if (lastValidFieldIndex === -1) {
            const key = '_null';
            if (!currentMap.has(key)) {
                currentMap.set(key, []);
            }
            const existing = currentMap.get(key);
            if (Array.isArray(existing)) {
                existing.push(item);
            }
            continue;
        }

        // Group by fields up to the last valid one
        for (let i = 0; i <= lastValidFieldIndex; i++) {
            const fieldPath = effectiveFields[i];
            const currentValue = getFieldValue(item, fieldPath);
            const key = currentValue ?? '_null';

            if (i === lastValidFieldIndex) {
                // Last level - store items
                if (!currentMap.has(key)) {
                    currentMap.set(key, []);
                }
                const existing = currentMap.get(key);
                if (Array.isArray(existing)) {
                    existing.push(item);
                } else if (existing instanceof Map) {
                    // This shouldn't happen, but if it does, convert to array
                    const itemsArray: T[] = [];
                    for (const val of existing.values()) {
                        if (Array.isArray(val)) {
                            itemsArray.push(...(val as T[]));
                        }
                    }
                    currentMap.set(key, itemsArray);
                    itemsArray.push(item);
                }
                break;
            } else {
                // Intermediate level - create nested map
                if (!currentMap.has(key)) {
                    currentMap.set(key, new Map());
                }
                const existing = currentMap.get(key);
                if (existing instanceof Map) {
                    currentMap = existing;
                } else if (Array.isArray(existing)) {
                    // This key already has items at this level
                    // We can't nest further, so add this item to the array
                    existing.push(item);
                    break;
                } else {
                    // Shouldn't happen, but break to avoid errors
                    break;
                }
            }
        }
    }

    return result;
}


import { ColumnDef } from '@tanstack/react-table';

/**
 * Configuration for grouping behavior
 */
export interface GroupingConfig<T> {
    /**
     * Determine which fields should be used for grouping a specific item.
     * This allows filtering out certain fields based on item properties.
     * @param item The item being grouped
     * @param groupingFields The full list of grouping fields
     * @returns The effective fields to use for this item
     */
    getEffectiveFields?: (item: T, groupingFields: string[]) => string[];

    /**
     * Determine which field path should be used for formatting a category label.
     * This is useful when the actual grouping field differs from the expected field
     * (e.g., armor items grouped by armor.category but the groupingFields array
     * might have weapon.category at that position).
     * @param currentField The field path from groupingFields at the current index
     * @param categoryValue The value being formatted
     * @param sampleItem A sample item from the group (may be null)
     * @param groupingFields The full list of grouping fields
     * @param currentFieldIndex The current index in groupingFields
     * @returns The field path to use for formatting
     */
    getEffectiveFieldForFormatting?: (
        currentField: string,
        categoryValue: unknown,
        sampleItem: T | null,
        groupingFields: string[],
        currentFieldIndex: number
    ) => string;

    /**
     * Sort the keys at a specific grouping level.
     * This allows custom sorting of category groups (e.g., Simple, Martial, Exotic for weapons).
     * @param keys Array of [key, value] pairs from the Map at this level
     * @param fieldPath The field path being grouped at this level
     * @param groupingFields The full list of grouping fields
     * @param currentFieldIndex The current index in groupingFields
     * @returns Sorted array of [key, value] pairs
     */
    sortGroupKeys?: (
        keys: Array<[unknown, unknown]>,
        fieldPath: string,
        groupingFields: string[],
        currentFieldIndex: number
    ) => Array<[unknown, unknown]>;
}

/**
 * Configuration for item filtering/checking
 */
export interface ItemFilterConfig<T> {
    /**
     * Check if an item should be considered "enabled" or "available".
     * This is used to disable items that don't meet certain criteria.
     * @param item The item to check
     * @returns true if the item is enabled/available, false otherwise
     */
    isItemEnabled?: (item: T) => boolean;
}

export interface ScrollableCategorizedListProps<T> {
    // Data fetching
    dataFetcher?: () => Promise<{ results: T[]; total: number }>;

    // Grouping configuration
    groupingFields: string[]; // Field paths for hierarchical grouping (e.g., ['itemTypeId', 'weapon.category', 'weapon.type'])
    groupingConfig?: GroupingConfig<T>; // Optional configuration for custom grouping behavior

    // Column definitions (same as GenericList)
    columns: ColumnDef<T, unknown>[];

    // Action button configuration
    actionButtonLabel?: string;
    onAction?: (item: T) => void;
    isActionDisabled?: (item: T) => boolean;
    allowMultiple?: boolean; // If false, items can only be obtained once

    // Item filtering
    itemFilter?: ItemFilterConfig<T>; // Optional configuration for item filtering/enabling

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
    groupingFields: string[],
    groupingConfig?: GroupingConfig<T>
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

        // Determine which fields to actually use for this item
        // Use custom logic if provided, otherwise use all fields
        const effectiveFields = groupingConfig?.getEffectiveFields
            ? groupingConfig.getEffectiveFields(item, groupingFields)
            : groupingFields;

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


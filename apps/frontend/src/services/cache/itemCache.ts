import type { QueryClient } from '@tanstack/react-query';

import type { ItemCacheEntry, ItemCacheResponse } from '@shared/schema';
import { ITEM_TYPE_ENUM, PROFICIENCY_TYPES, PROFICIENCY_TYPE_ENUM, type CoreComponent } from '@shared/static-data';

import { getIdByNameFromCache, getIdByNameFromCacheStandalone, getStandaloneQueryClient } from './utils';

/**
 * Item cache functions (including weapons and armor)
 */

/**
 * Create item cache hook functions
 */
export const createItemCacheHooks = (queryClient: QueryClient) => {
    const getItemIdByName = (name: string): number | undefined => {
        return getIdByNameFromCache(queryClient, ['items-cache'], name);
    };

    const getItemNameFromCache = (id: number): string | undefined => {
        const cacheData = queryClient.getQueryData<ItemCacheResponse>(['items-cache']);
        if (!cacheData?.results) return undefined;
        const item = cacheData.results.find(i => i.id === id);
        return item?.name;
    };

    /**
     * Retrieves all items from the items cache.
     * 
     * Returns all item cache entries including weapons, armor, gear, and other item types.
     * The cache is pre-populated by CacheProvider on app startup.
     * 
     * @returns Array of all item cache entries, or empty array if cache not available
     * 
     * @see ItemCacheEntry type for available fields
     * @see [Cache-Based ID Maps](../../../../packages/shared/docs/application-overview/cache-based-id-maps.md)
     */
    const getItemSelectFull = (): ItemCacheEntry[] => {
        const cacheData = queryClient.getQueryData<ItemCacheResponse>(['items-cache']);
        if (!cacheData?.results) return [];
        return cacheData.results;
    };

    /**
     * Retrieves all weapons from the items cache.
     * 
     * Filters items by typeId to return only weapons. Includes all weapon categories
     * (simple, martial, exotic) and all weapon types.
     * 
     * @returns Array of weapon cache entries, or empty array if cache not available
     * 
     * @see ItemCacheEntry type for available fields (includes weaponCategory)
     * @see ITEM_TYPE_ENUM.Weapon for weapon type constant
     * @see [Cache-Based ID Maps](../../../../packages/shared/docs/application-overview/cache-based-id-maps.md)
     */
    const getAllWeapons = (): ItemCacheEntry[] => {
        const allItems = getItemSelectFull();
        return allItems.filter(item => item.typeId === ITEM_TYPE_ENUM.Weapon);
    };

    /**
     * Retrieves weapons from the items cache filtered by weapon category.
     * 
     * Filters weapons by weaponCategory field. Common categories include:
     * - Simple weapons
     * - Martial weapons
     * - Exotic weapons
     * 
     * @param categoryId - The weapon category ID to filter by
     * @returns Array of weapon cache entries matching the category, or empty array if cache not available
     * 
     * @see ItemCacheEntry.weaponCategory for category field
     * @see WEAPON_CATEGORY_ENUM for category constants
     * @see [Cache-Based ID Maps](../../../../packages/shared/docs/application-overview/cache-based-id-maps.md)
     */
    const getAllWeaponsByCategory = (categoryId: number): ItemCacheEntry[] => {
        const allWeapons = getAllWeapons();
        return allWeapons.filter(weapon => weapon.weaponCategory === categoryId);
    };

    /**
     * Retrieves all armor from the items cache.
     * 
     * Filters items by typeId to return only armor. Includes all armor categories
     * (light, medium, heavy, shields) and all armor types.
     * 
     * @returns Array of armor cache entries, or empty array if cache not available
     * 
     * @see ItemCacheEntry type for available fields (includes armorCategory)
     * @see ITEM_TYPE_ENUM.Armor for armor type constant
     * @see [Cache-Based ID Maps](../../../../packages/shared/docs/application-overview/cache-based-id-maps.md)
     */
    const getAllArmor = (): ItemCacheEntry[] => {
        const allItems = getItemSelectFull();
        return allItems.filter(item => item.typeId === ITEM_TYPE_ENUM.Armor);
    };

    /**
     * Retrieves armor from the items cache filtered by armor category.
     * 
     * Filters armor by armorCategory field. Common categories include:
     * - Light armor
     * - Medium armor
     * - Heavy armor
     * - Shields
     * 
     * @param categoryId - The armor category ID to filter by
     * @returns Array of armor cache entries matching the category, or empty array if cache not available
     * 
     * @see ItemCacheEntry.armorCategory for category field
     * @see ARMOR_CATEGORY_ENUM for category constants
     * @see [Cache-Based ID Maps](../../../../packages/shared/docs/application-overview/cache-based-id-maps.md)
     */
    const getAllArmorByCategory = (categoryId: number): ItemCacheEntry[] => {
        const allArmor = getAllArmor();
        return allArmor.filter(armor => armor.armorCategory === categoryId);
    };

    /**
     * Creates a Map of item ID to item name from the items cache.
     * 
     * Useful for efficient bulk name lookups when you need to resolve multiple item IDs.
     * The cache is pre-populated by CacheProvider on app startup.
     * 
     * @returns Map with item IDs as keys and item names as values, or empty Map if cache not available
     * 
     * @see [Cache-Based ID Maps](../../../../packages/shared/docs/application-overview/cache-based-id-maps.md)
     */
    const getItemNameMap = (): Map<number, string> => {
        const allItems = getItemSelectFull();
        const map = new Map<number, string>();
        allItems.forEach(item => {
            map.set(item.id, item.name);
        });
        return map;
    };

    /**
     * Transforms a single ItemCacheEntry to ItemWithDetails-like format.
     * 
     * Converts the flat ItemCacheEntry structure to a format with nested weapon/armor objects
     * that match the ItemWithDetails schema structure.
     * 
     * @param item - The ItemCacheEntry to transform
     * @returns Transformed item with weapon and armor objects, or undefined if item is null/undefined
     */
    const transformItemCacheEntryToItemWithDetails = (item: ItemCacheEntry | null | undefined): {
        id: number;
        name: string;
        typeId: number;
        weapon?: { category: number };
        armor?: { category: number };
    } | undefined => {
        if (!item) return undefined;
        return {
            id: item.id,
            name: item.name,
            typeId: item.typeId,
            weapon: item.weaponCategory ? { category: item.weaponCategory } : undefined,
            armor: item.armorCategory ? { category: item.armorCategory } : undefined,
        };
    };

    /**
     * Transforms an array of ItemCacheEntry to ItemWithDetails-like format.
     * 
     * Converts the flat ItemCacheEntry structure to a format with nested weapon/armor objects
     * that match the ItemWithDetails schema structure.
     * 
     * @param items - Array of ItemCacheEntry to transform
     * @returns Array of transformed items with weapon and armor objects
     */
    const transformItemCacheEntriesToItemWithDetails = (items: ItemCacheEntry[]): Array<{
        id: number;
        name: string;
        typeId: number;
        weapon?: { category: number };
        armor?: { category: number };
    }> => {
        return items.map(item => ({
            id: item.id,
            name: item.name,
            typeId: item.typeId,
            weapon: item.weaponCategory ? { category: item.weaponCategory } : undefined,
            armor: item.armorCategory ? { category: item.armorCategory } : undefined,
        }));
    };

    /**
     * Transforms an array of ItemCacheEntry to ProficiencyItem format.
     * 
     * Converts items to the ProficiencyItem interface format used by proficiency selection.
     * Note: weapon.type is set to 0 as a default since ItemCacheEntry doesn't include weapon type.
     * 
     * @param items - Array of ItemCacheEntry to transform
     * @returns Array of ProficiencyItem objects
     */
    const transformItemCacheEntriesToProficiencyItems = (items: ItemCacheEntry[]): Array<{
        id: number;
        name: string;
        typeId: number;
        weapon?: { category: number; type: number };
        armor?: { category: number };
    }> => {
        return items.map(item => ({
            id: item.id,
            name: item.name,
            typeId: item.typeId,
            weapon: item.weaponCategory ? { category: item.weaponCategory, type: 0 } : undefined,
            armor: item.armorCategory ? { category: item.armorCategory } : undefined,
        }));
    };

    /**
     * Transforms an array of ItemCacheEntry to CoreComponent format.
     * 
     * Converts items to the CoreComponent interface format used by select components
     * and other UI elements that need id, name, and abbreviation fields.
     * 
     * @param items - Array of ItemCacheEntry to transform
     * @returns Array of CoreComponent objects
     */
    const transformItemCacheEntriesToCoreComponents = (items: ItemCacheEntry[]): CoreComponent[] => {
        return items.map(item => ({
            id: item.id,
            name: item.name,
            abbreviation: item.name, // Use name as abbreviation if needed
        }));
    };

    /**
     * Retrieves items filtered by proficiency type with transformation.
     * 
     * High-level function that combines getting items by proficiency type, applying
     * special filters (e.g., tower shield), and transforming to the expected format.
     * 
     * @param proficiencyTypeId - The proficiency type ID from PROFICIENCY_TYPES
     * @returns Object with results array and total count, or empty results if proficiency type not found
     * 
     * @see PROFICIENCY_TYPES for available proficiency types
     * @see PROFICIENCY_TYPE_ENUM for proficiency type constants
     */
    const getItemsByProficiencyType = (proficiencyTypeId: number): {
        results: Array<{
            id: number;
            name: string;
            typeId: number;
            weapon?: { category: number };
            armor?: { category: number };
        }>;
        total: number;
    } => {
        const proficiencyInfo = PROFICIENCY_TYPES[proficiencyTypeId];

        if (!proficiencyInfo) {
            return {
                results: [],
                total: 0
            };
        }

        // Get items by type and category
        let filteredItems: ItemCacheEntry[];
        if (proficiencyInfo.itemTypeId === ITEM_TYPE_ENUM.Weapon) {
            filteredItems = getAllWeaponsByCategory(proficiencyInfo.category);
        } else if (proficiencyInfo.itemTypeId === ITEM_TYPE_ENUM.Armor) {
            filteredItems = getAllArmorByCategory(proficiencyInfo.category);
        } else {
            return { results: [], total: 0 };
        }

        // Apply additional filtering logic (tower shield)
        const finalItems = filteredItems.filter(item => {
            if (proficiencyTypeId === PROFICIENCY_TYPE_ENUM.TowerShield) {
                return item.name.toLowerCase().includes('tower');
            }
            return true;
        });

        // Transform to expected format
        return {
            results: transformItemCacheEntriesToItemWithDetails(finalItems),
            total: finalItems.length,
        };
    };

    return {
        getItemIdByName,
        getItemNameFromCache,
        getItemSelectFull,
        getAllWeapons,
        getAllWeaponsByCategory,
        getAllArmor,
        getAllArmorByCategory,
        getItemNameMap,
        transformItemCacheEntryToItemWithDetails,
        transformItemCacheEntriesToItemWithDetails,
        transformItemCacheEntriesToProficiencyItems,
        transformItemCacheEntriesToCoreComponents,
        getItemsByProficiencyType,
    };
};

/**
 * Get item ID by name (standalone)
 */
export const getItemIdByName = (name: string): number | undefined => {
    return getIdByNameFromCacheStandalone<{ id: number; name: string }>(['items-cache'], name);
};

/**
 * Get item name from cache (standalone)
 * 
 * @param id - Item ID (can be null or undefined)
 * @returns Item name or null if not found
 */
export const getItemNameFromCache = (id: number | null | undefined): string | null => {
    if (!id) {
        return null;
    }

    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<ItemCacheResponse>(['items-cache']);
    if (!cacheData?.results) return undefined;
    const item = cacheData.results.find(i => i.id === id);
    return item?.name;
};

/**
 * Retrieves all items from the items cache.
 * 
 * Returns all item cache entries including weapons, armor, gear, and other item types.
 * The cache is pre-populated by CacheProvider on app startup.
 * 
 * Standalone version for use outside React components.
 * 
 * @returns Array of all item cache entries, or empty array if cache not available
 * 
 * @see ItemCacheEntry type for available fields
 * @see [Cache-Based ID Maps](../../../../packages/shared/docs/application-overview/cache-based-id-maps.md)
 */
export const getItemSelectFull = (): ItemCacheEntry[] => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<ItemCacheResponse>(['items-cache']);
    if (!cacheData?.results) return [];
    return cacheData.results;
};

/**
 * Retrieves all weapons from the items cache.
 * 
 * Filters items by typeId to return only weapons. Includes all weapon categories
 * (simple, martial, exotic) and all weapon types.
 * 
 * Standalone version for use outside React components.
 * 
 * @returns Array of weapon cache entries, or empty array if cache not available
 * 
 * @see ItemCacheEntry type for available fields (includes weaponCategory)
 * @see ITEM_TYPE_ENUM.Weapon for weapon type constant
 * @see [Cache-Based ID Maps](../../../../packages/shared/docs/application-overview/cache-based-id-maps.md)
 */
export const getAllWeapons = (): ItemCacheEntry[] => {
    const allItems = getItemSelectFull();
    return allItems.filter(item => item.typeId === ITEM_TYPE_ENUM.Weapon);
};

/**
 * Retrieves weapons from the items cache filtered by weapon category.
 * 
 * Filters weapons by weaponCategory field. Common categories include:
 * - Simple weapons
 * - Martial weapons
 * - Exotic weapons
 * 
 * Standalone version for use outside React components.
 * 
 * @param categoryId - The weapon category ID to filter by
 * @returns Array of weapon cache entries matching the category, or empty array if cache not available
 * 
 * @see ItemCacheEntry.weaponCategory for category field
 * @see WEAPON_CATEGORY_ENUM for category constants
 * @see [Cache-Based ID Maps](../../../../packages/shared/docs/application-overview/cache-based-id-maps.md)
 */
export const getAllWeaponsByCategory = (categoryId: number): ItemCacheEntry[] => {
    const allWeapons = getAllWeapons();
    return allWeapons.filter(weapon => weapon.weaponCategory === categoryId);
};

/**
 * Retrieves all armor from the items cache.
 * 
 * Filters items by typeId to return only armor. Includes all armor categories
 * (light, medium, heavy, shields) and all armor types.
 * 
 * Standalone version for use outside React components.
 * 
 * @returns Array of armor cache entries, or empty array if cache not available
 * 
 * @see ItemCacheEntry type for available fields (includes armorCategory)
 * @see ITEM_TYPE_ENUM.Armor for armor type constant
 * @see [Cache-Based ID Maps](../../../../packages/shared/docs/application-overview/cache-based-id-maps.md)
 */
export const getAllArmor = (): ItemCacheEntry[] => {
    const allItems = getItemSelectFull();
    return allItems.filter(item => item.typeId === ITEM_TYPE_ENUM.Armor);
};

/**
 * Retrieves armor from the items cache filtered by armor category.
 * 
 * Filters armor by armorCategory field. Common categories include:
 * - Light armor
 * - Medium armor
 * - Heavy armor
 * - Shields
 * 
 * Standalone version for use outside React components.
 * 
 * @param categoryId - The armor category ID to filter by
 * @returns Array of armor cache entries matching the category, or empty array if cache not available
 * 
 * @see ItemCacheEntry.armorCategory for category field
 * @see ARMOR_CATEGORY_ENUM for category constants
 * @see [Cache-Based ID Maps](../../../../packages/shared/docs/application-overview/cache-based-id-maps.md)
 */
export const getAllArmorByCategory = (categoryId: number): ItemCacheEntry[] => {
    const allArmor = getAllArmor();
    return allArmor.filter(armor => armor.armorCategory === categoryId);
};

/**
 * Creates a Map of item ID to item name from the items cache.
 * 
 * Useful for efficient bulk name lookups when you need to resolve multiple item IDs.
 * The cache is pre-populated by CacheProvider on app startup.
 * 
 * Standalone version for use outside React components.
 * 
 * @returns Map with item IDs as keys and item names as values, or empty Map if cache not available
 * 
 * @see [Cache-Based ID Maps](../../../../packages/shared/docs/application-overview/cache-based-id-maps.md)
 */
export const getItemNameMap = (): Map<number, string> => {
    const allItems = getItemSelectFull();
    const map = new Map<number, string>();
    allItems.forEach(item => {
        map.set(item.id, item.name);
    });
    return map;
};

/**
 * Transforms a single ItemCacheEntry to ItemWithDetails-like format.
 * 
 * Converts the flat ItemCacheEntry structure to a format with nested weapon/armor objects
 * that match the ItemWithDetails schema structure.
 * 
 * Standalone version for use outside React components.
 * 
 * @param item - The ItemCacheEntry to transform
 * @returns Transformed item with weapon and armor objects, or undefined if item is null/undefined
 */
export const transformItemCacheEntryToItemWithDetails = (item: ItemCacheEntry | null | undefined): {
    id: number;
    name: string;
    typeId: number;
    weapon?: { category: number };
    armor?: { category: number };
} | undefined => {
    if (!item) return undefined;
    return {
        id: item.id,
        name: item.name,
        typeId: item.typeId,
        weapon: item.weaponCategory ? { category: item.weaponCategory } : undefined,
        armor: item.armorCategory ? { category: item.armorCategory } : undefined,
    };
};

/**
 * Transforms an array of ItemCacheEntry to ItemWithDetails-like format.
 * 
 * Converts the flat ItemCacheEntry structure to a format with nested weapon/armor objects
 * that match the ItemWithDetails schema structure.
 * 
 * Standalone version for use outside React components.
 * 
 * @param items - Array of ItemCacheEntry to transform
 * @returns Array of transformed items with weapon and armor objects
 */
export const transformItemCacheEntriesToItemWithDetails = (items: ItemCacheEntry[]): Array<{
    id: number;
    name: string;
    typeId: number;
    weapon?: { category: number };
    armor?: { category: number };
}> => {
    return items.map(item => ({
        id: item.id,
        name: item.name,
        typeId: item.typeId,
        weapon: item.weaponCategory ? { category: item.weaponCategory } : undefined,
        armor: item.armorCategory ? { category: item.armorCategory } : undefined,
    }));
};

/**
 * Transforms an array of ItemCacheEntry to ProficiencyItem format.
 * 
 * Converts items to the ProficiencyItem interface format used by proficiency selection.
 * Note: weapon.type is set to 0 as a default since ItemCacheEntry doesn't include weapon type.
 * 
 * Standalone version for use outside React components.
 * 
 * @param items - Array of ItemCacheEntry to transform
 * @returns Array of ProficiencyItem objects
 */
export const transformItemCacheEntriesToProficiencyItems = (items: ItemCacheEntry[]): Array<{
    id: number;
    name: string;
    typeId: number;
    weapon?: { category: number; type: number };
    armor?: { category: number };
}> => {
    return items.map(item => ({
        id: item.id,
        name: item.name,
        typeId: item.typeId,
        weapon: item.weaponCategory ? { category: item.weaponCategory, type: 0 } : undefined,
        armor: item.armorCategory ? { category: item.armorCategory } : undefined,
    }));
};

/**
 * Transforms an array of ItemCacheEntry to CoreComponent format.
 * 
 * Converts items to the CoreComponent interface format used by select components
 * and other UI elements that need id, name, and abbreviation fields.
 * 
 * Standalone version for use outside React components.
 * 
 * @param items - Array of ItemCacheEntry to transform
 * @returns Array of CoreComponent objects
 */
export const transformItemCacheEntriesToCoreComponents = (items: ItemCacheEntry[]): CoreComponent[] => {
    return items.map(item => ({
        id: item.id,
        name: item.name,
        abbreviation: item.name, // Use name as abbreviation if needed
    }));
};

/**
 * Retrieves items filtered by proficiency type with transformation.
 * 
 * High-level function that combines getting items by proficiency type, applying
 * special filters (e.g., tower shield), and transforming to the expected format.
 * 
 * Standalone version for use outside React components.
 * 
 * @param proficiencyTypeId - The proficiency type ID from PROFICIENCY_TYPES
 * @returns Object with results array and total count, or empty results if proficiency type not found
 * 
 * @see PROFICIENCY_TYPES for available proficiency types
 * @see PROFICIENCY_TYPE_ENUM for proficiency type constants
 */
export const getItemsByProficiencyType = (proficiencyTypeId: number): {
    results: Array<{
        id: number;
        name: string;
        typeId: number;
        weapon?: { category: number };
        armor?: { category: number };
    }>;
    total: number;
} => {
    const proficiencyInfo = PROFICIENCY_TYPES[proficiencyTypeId];

    if (!proficiencyInfo) {
        return {
            results: [],
            total: 0
        };
    }

    // Get items by type and category
    let filteredItems: ItemCacheEntry[];
    if (proficiencyInfo.itemTypeId === ITEM_TYPE_ENUM.Weapon) {
        filteredItems = getAllWeaponsByCategory(proficiencyInfo.category);
    } else if (proficiencyInfo.itemTypeId === ITEM_TYPE_ENUM.Armor) {
        filteredItems = getAllArmorByCategory(proficiencyInfo.category);
    } else {
        return { results: [], total: 0 };
    }

    // Apply additional filtering logic (tower shield)
    const finalItems = filteredItems.filter(item => {
        if (proficiencyTypeId === PROFICIENCY_TYPE_ENUM.TowerShield) {
            return item.name.toLowerCase().includes('tower');
        }
        return true;
    });

    // Transform to expected format
    return {
        results: transformItemCacheEntriesToItemWithDetails(finalItems),
        total: finalItems.length,
    };
};

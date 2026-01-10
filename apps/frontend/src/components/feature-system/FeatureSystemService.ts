import { CacheQueryHooks } from '@/services/query/CacheQueryHooks';
import { PROFICIENCY_TYPES, ITEM_TYPE_ENUM } from '@shared/static-data';

export const FeatureSystemService = {
    /**
     * Get items filtered by proficiency type using client-side filtering from items-cache.
     * 
     * **Client-Side Filtering Approach**:
     * This method demonstrates the client-side filtering pattern used throughout the application.
     * Instead of using a server-side query endpoint (e.g., /items/query), it:
     * 1. Fetches all items from the lightweight items-cache endpoint
     * 2. Filters items client-side by typeId and category (weaponCategory or armorCategory)
     * 3. Applies additional filtering logic (e.g., tower shield name filtering)
     * 4. Transforms results to match expected format
     * 
     * **Benefits**:
     * - Eliminates need for server-side query endpoints
     * - Leverages TanStack Query cache (items-cache is already cached)
     * - Faster filtering (no network latency)
     * - Consistent caching strategy
     * 
     * **Cache Schema Extension**:
     * The ItemCacheSchema was extended to include weaponCategory and armorCategory specifically
     * to enable this client-side filtering. This balances cache size with filtering capability.
     * 
     * @param proficiencyTypeId - The proficiency type ID from PROFICIENCY_TYPES
     * @returns Promise resolving to filtered items with id, name, typeId, and optional weapon/armor objects
     * 
     * @see ItemCacheSchema for cache data structure
     * @see [Query Hooks and Caching Architecture](../../../../packages/shared/docs/application-overview/query-hooks-and-caching.md)
     */
    async getItemsByProficiencyType(proficiencyTypeId: number) {
        const proficiencyInfo = PROFICIENCY_TYPES[proficiencyTypeId];

        if (!proficiencyInfo) {
            return {
                results: [],
                total: 0
            };
        }

        try {
            // Get items from cache
            const cacheData = await CacheQueryHooks.getItemsCache();
            if (!cacheData?.results) {
                return { results: [], total: 0 };
            }

            // Filter by typeId and category
            const filteredItems = cacheData.results.filter(item => {
                if (item.typeId !== proficiencyInfo.itemTypeId) return false;
                
                // Check if category matches (weapon or armor)
                if (proficiencyInfo.itemTypeId === ITEM_TYPE_ENUM.Weapon) {
                    return item.weaponCategory === proficiencyInfo.category;
                } else if (proficiencyInfo.itemTypeId === ITEM_TYPE_ENUM.Armor) {
                    return item.armorCategory === proficiencyInfo.category;
                }
                return false;
            });

            // Apply additional filtering logic (tower shield)
            const finalItems = filteredItems.filter(item => {
                if (proficiencyTypeId === 8) { // Tower Shield
                    return item.name.toLowerCase().includes('tower');
                }
                return true;
            });

            // Transform to match expected format (only id and name needed)
            return {
                results: finalItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    typeId: item.typeId,
                    weapon: item.weaponCategory ? { category: item.weaponCategory } : undefined,
                    armor: item.armorCategory ? { category: item.armorCategory } : undefined,
                })),
                total: finalItems.length,
            };
        } catch (error) {
            console.error('Failed to fetch items by proficiency type:', error);
            return {
                results: [],
                total: 0
            };
        }
    },
}

import type { QueryClient } from '@tanstack/react-query';

import { getQueryClient } from '@/lib/formatters/utils/queryClientAccessor';
import { EditionId } from '@shared/static-data';
import type { FilterableComponent } from '@shared/static-data';

/**
 * Type assertion utility for cache entries that extend FilterableComponent
 */
export type CacheEntryAsCoreComponent<T> = T & FilterableComponent;

/**
 * Generic edition filter function
 * Filters items by edition ID, with special handling for DND_3x (includes both 3E and 3.5E)
 */
export const getByEdition = <T extends FilterableComponent>(
    items: T[],
    editionId: number
): T[] => {
    if (editionId === EditionId.DND_3x) {
        return items.filter(item =>
            (item.editionId === EditionId.DND_3E ||
                item.editionId === EditionId.DND_3_5E) && item.isVisible
        );
    }
    return items.filter(item => item.editionId === editionId);
};

/**
 * Generic helper function for name-to-ID lookups from cache (hook version)
 * Used within React components that have access to queryClient via useQueryClient
 */
export const getIdByNameFromCache = <T extends { id: number; name: string }>(
    queryClient: QueryClient,
    cacheKey: (string | number | object)[],
    name: string
): number | undefined => {
    const cacheData = queryClient.getQueryData<{ results: T[] }>(cacheKey);
    if (!cacheData?.results) return undefined;

    const lowerName = name.toLowerCase();
    const entity = cacheData.results.find(e => e.name.toLowerCase() === lowerName);
    return entity?.id;
};

/**
 * Generic helper function for name-to-ID lookups from cache (standalone version)
 * Used outside React components
 */
export function getIdByNameFromCacheStandalone<T extends { id: number; name: string }>(
    cacheKey: (string | number | object)[],
    name: string
): number | undefined {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<{ results: T[] }>(cacheKey);
    if (!cacheData?.results) return undefined;

    const lowerName = name.toLowerCase();
    const entity = cacheData.results.find(e => e.name.toLowerCase() === lowerName);
    return entity?.id;
}

/**
 * Get query client for standalone functions (outside React components)
 */
export const getStandaloneQueryClient = (): QueryClient => {
    return getQueryClient();
};

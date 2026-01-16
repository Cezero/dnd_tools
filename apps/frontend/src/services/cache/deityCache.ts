import type { QueryClient } from '@tanstack/react-query';

import type { DeityCacheEntry, DeityCacheResponse } from '@shared/schema';
import type { FilterableComponent } from '@shared/static-data';

import { getByEdition, getIdByNameFromCache, getIdByNameFromCacheStandalone, getStandaloneQueryClient } from './utils';
import type { CacheEntryAsCoreComponent } from './utils';

/**
 * Deity cache functions
 */

/**
 * Create deity cache hook functions
 */
export const createDeityCacheHooks = (queryClient: QueryClient) => {
    const getDeitySummaryById = (id: number): DeityCacheEntry | undefined => {
        const cacheData = queryClient.getQueryData<DeityCacheResponse>(['deities-cache']);
        if (!cacheData?.results) return undefined;
        return cacheData.results.find(item => item.id === id);
    };

    const getDeitySelectFull = (): CacheEntryAsCoreComponent<DeityCacheEntry>[] => {
        const cacheData = queryClient.getQueryData<DeityCacheResponse>(['deities-cache']);
        if (!cacheData?.results) return [];
        return cacheData.results as CacheEntryAsCoreComponent<DeityCacheEntry>[];
    };

    const getDeitySelectByEdition = (editionId: number): CacheEntryAsCoreComponent<DeityCacheEntry>[] => {
        const allDeities = getDeitySelectFull();
        return getByEdition(allDeities, editionId);
    };

    const getDeityIdByName = (name: string): number | undefined => {
        return getIdByNameFromCache(queryClient, ['deities-cache'], name);
    };

    const getDeityNameFromCache = (id: number): string | undefined => {
        const cacheData = queryClient.getQueryData<DeityCacheResponse>(['deities-cache']);
        if (!cacheData?.results) return undefined;
        const deity = cacheData.results.find(d => d.id === id);
        return deity?.name;
    };

    return {
        getDeitySummaryById,
        getDeitySelectFull,
        getDeitySelectByEdition,
        getDeityIdByName,
        getDeityNameFromCache,
    };
};

/**
 * Get deity ID by name (standalone)
 */
export const getDeityIdByName = (name: string): number | undefined => {
    return getIdByNameFromCacheStandalone<{ id: number; name: string }>(['deities-cache'], name);
};

/**
 * Get deity name from cache (standalone)
 */
export const getDeityNameFromCache = (id: number): string | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<DeityCacheResponse>(['deities-cache']);
    if (!cacheData?.results) return undefined;
    const deity = cacheData.results.find(d => d.id === id);
    return deity?.name;
};

/**
 * Get deity summary by ID (standalone)
 */
export const getDeitySummaryById = (id: number): DeityCacheEntry | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<DeityCacheResponse>(['deities-cache']);
    if (!cacheData?.results) return undefined;
    return cacheData.results.find(item => item.id === id);
};

/**
 * Get all deities (standalone)
 */
export const getDeitySelectFull = (): Array<DeityCacheEntry & FilterableComponent> => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<DeityCacheResponse>(['deities-cache']);
    if (!cacheData?.results) return [];
    return cacheData.results as Array<DeityCacheEntry & FilterableComponent>;
};

/**
 * Get deities by edition (standalone)
 */
export const getDeitySelectByEdition = (editionId: number): Array<DeityCacheEntry & FilterableComponent> => {
    const allDeities = getDeitySelectFull();
    return getByEdition(allDeities, editionId);
};

import type { QueryClient } from '@tanstack/react-query';

import type { DomainCacheEntry, DomainCacheResponse } from '@shared/schema';
import type { FilterableComponent } from '@shared/static-data';

import { getByEdition, getIdByNameFromCache, getIdByNameFromCacheStandalone, getStandaloneQueryClient } from './utils';
import type { CacheEntryAsCoreComponent } from './utils';

/**
 * Domain cache functions
 */

/**
 * Create domain cache hook functions
 */
export const createDomainCacheHooks = (queryClient: QueryClient) => {
    const getDomainSummaryById = (id: number): DomainCacheEntry | undefined => {
        const cacheData = queryClient.getQueryData<DomainCacheResponse>(['domains-cache']);
        if (!cacheData?.results) return undefined;
        return cacheData.results.find(item => item.id === id);
    };

    const getDomainSelectFull = (): CacheEntryAsCoreComponent<DomainCacheEntry>[] => {
        const cacheData = queryClient.getQueryData<DomainCacheResponse>(['domains-cache']);
        if (!cacheData?.results) return [];
        return cacheData.results as CacheEntryAsCoreComponent<DomainCacheEntry>[];
    };

    const getDomainSelectByEdition = (editionId: number): CacheEntryAsCoreComponent<DomainCacheEntry>[] => {
        const allDomains = getDomainSelectFull();
        return getByEdition(allDomains, editionId);
    };

    const getDomainIdByName = (name: string): number | undefined => {
        return getIdByNameFromCache(queryClient, ['domains-cache'], name);
    };

    const getDomainNameFromCache = (id: number): string | undefined => {
        const cacheData = queryClient.getQueryData<DomainCacheResponse>(['domains-cache']);
        if (!cacheData?.results) return undefined;
        const domain = cacheData.results.find(d => d.id === id);
        return domain?.name;
    };

    return {
        getDomainSummaryById,
        getDomainSelectFull,
        getDomainSelectByEdition,
        getDomainIdByName,
        getDomainNameFromCache,
    };
};

/**
 * Get domain ID by name (standalone)
 */
export const getDomainIdByName = (name: string): number | undefined => {
    return getIdByNameFromCacheStandalone<{ id: number; name: string }>(['domains-cache'], name);
};

/**
 * Get domain name from cache (standalone)
 */
export const getDomainNameFromCache = (id: number): string | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<DomainCacheResponse>(['domains-cache']);
    if (!cacheData?.results) return undefined;
    const domain = cacheData.results.find(d => d.id === id);
    return domain?.name;
};

/**
 * Get domain summary by ID (standalone)
 */
export const getDomainSummaryById = (id: number): DomainCacheEntry | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<DomainCacheResponse>(['domains-cache']);
    if (!cacheData?.results) return undefined;
    return cacheData.results.find(item => item.id === id);
};

/**
 * Get domains by edition (standalone)
 */
export const getDomainSelectByEdition = (editionId: number): Array<DomainCacheEntry & FilterableComponent> => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<DomainCacheResponse>(['domains-cache']);
    if (!cacheData?.results) return [];
    const allDomains = cacheData.results as Array<DomainCacheEntry & FilterableComponent>;
    return getByEdition(allDomains, editionId);
};

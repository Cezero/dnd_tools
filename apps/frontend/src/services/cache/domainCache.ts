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
 * 
 * @param id - Domain ID (can be null or undefined)
 * @returns Domain name or null if not found
 */
export const getDomainNameFromCache = (id: number | null | undefined): string | null => {
    if (!id) {
        return null;
    }

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
 * Get all domains (standalone)
 */
export const getDomainSelectFull = (): Array<DomainCacheEntry & FilterableComponent> => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<DomainCacheResponse>(['domains-cache']);
    if (!cacheData?.results) return [];
    return cacheData.results as Array<DomainCacheEntry & FilterableComponent>;
};

/**
 * Get domains by edition (standalone)
 */
export const getDomainSelectByEdition = (editionId: number): Array<DomainCacheEntry & FilterableComponent> => {
    const allDomains = getDomainSelectFull();
    return getByEdition(allDomains, editionId);
};

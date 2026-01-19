import type { QueryClient } from '@tanstack/react-query';

import type { CompanionCacheEntry, CompanionCacheResponse } from '@shared/schema';

import { getIdByNameFromCache, getIdByNameFromCacheStandalone, getStandaloneQueryClient } from './utils';

/**
 * Companion cache functions
 */

/**
 * Create companion cache hook functions
 */
export const createCompanionCacheHooks = (queryClient: QueryClient) => {
    const getCompanionIdByName = (name: string): number | undefined => {
        return getIdByNameFromCache(queryClient, ['companions-cache'], name);
    };

    const getCompanionNameFromCache = (id: number): string | undefined => {
        const cacheData = queryClient.getQueryData<CompanionCacheResponse>(['companions-cache']);
        if (!cacheData?.results) return undefined;
        const companion = cacheData.results.find(c => c.id === id);
        return companion?.name;
    };

    const getCompanionSummaryById = (id: number): CompanionCacheEntry | undefined => {
        const cacheData = queryClient.getQueryData<CompanionCacheResponse>(['companions-cache']);
        if (!cacheData?.results) return undefined;
        return cacheData.results.find(c => c.id === id);
    };

    return {
        getCompanionIdByName,
        getCompanionNameFromCache,
        getCompanionSummaryById,
    };
};

/**
 * Get companion ID by name (standalone)
 */
export const getCompanionIdByName = (name: string): number | undefined => {
    return getIdByNameFromCacheStandalone<{ id: number; name: string }>(['companions-cache'], name);
};

/**
 * Get companion name from cache (standalone)
 * 
 * @param id - Companion ID (can be null or undefined)
 * @returns Companion name or null if not found
 */
export const getCompanionNameFromCache = (id: number | null | undefined): string | null => {
    if (!id) {
        return null;
    }

    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<CompanionCacheResponse>(['companions-cache']);
    if (!cacheData?.results) return undefined;
    const companion = cacheData.results.find(c => c.id === id);
    return companion?.name;
};

/**
 * Get companion summary by ID (standalone)
 */
export const getCompanionSummaryById = (id: number): CompanionCacheEntry | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<CompanionCacheResponse>(['companions-cache']);
    if (!cacheData?.results) return undefined;
    return cacheData.results.find(c => c.id === id);
};

import type { QueryClient } from '@tanstack/react-query';

import type { FeatureCacheEntry, FeatureCacheResponse } from '@shared/schema';

import { getIdByNameFromCache, getIdByNameFromCacheStandalone, getStandaloneQueryClient } from './utils';

/**
 * Feature cache functions
 */

/**
 * Create feature cache hook functions
 */
export const createFeatureCacheHooks = (queryClient: QueryClient) => {
    const getFeatureSummaryById = (id: number): FeatureCacheEntry | undefined => {
        const cacheData = queryClient.getQueryData<FeatureCacheResponse>(['features-cache']);
        if (!cacheData?.results) return undefined;
        return cacheData.results.find(item => item.id === id);
    };

    const getFeatureIdByName = (name: string): number | undefined => {
        return getIdByNameFromCache(queryClient, ['features-cache'], name);
    };

    const getFeatureNameFromCache = (id: number): string | undefined => {
        const cacheData = queryClient.getQueryData<FeatureCacheResponse>(['features-cache']);
        if (!cacheData?.results) return undefined;
        const feature = cacheData.results.find(f => f.id === id);
        return feature?.name;
    };

    return {
        getFeatureSummaryById,
        getFeatureIdByName,
        getFeatureNameFromCache,
    };
};

/**
 * Get feature ID by name (standalone)
 */
export const getFeatureIdByName = (name: string): number | undefined => {
    return getIdByNameFromCacheStandalone<{ id: number; name: string }>(['features-cache'], name);
};

/**
 * Get feature name from cache (standalone)
 * 
 * Enhanced version that checks multiple cache keys with priority:
 * 1. Individual feature cache: ['features', 'item', featureId]
 * 2. Features cache: ['features-cache']
 * 
 * @param id - Feature ID (can be null or undefined)
 * @returns Feature name or null if not found
 */
export const getFeatureNameFromCache = (id: number | null | undefined): string | null => {
    if (!id) {
        return null;
    }

    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<FeatureCacheResponse>(['features-cache']);
    if (!cacheData?.results) return undefined;
    const feature = cacheData.results.find(f => f.id === id);
    return feature?.name;
};

/**
 * Get feature summary by ID (standalone)
 */
export const getFeatureSummaryById = (id: number): FeatureCacheEntry | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<FeatureCacheResponse>(['features-cache']);
    if (!cacheData?.results) return undefined;
    return cacheData.results.find(item => item.id === id);
};

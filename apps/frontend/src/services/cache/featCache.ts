import type { QueryClient } from '@tanstack/react-query';

import type { FeatCacheEntry, FeatCacheResponse } from '@shared/schema';
import type { FilterableComponent } from '@shared/static-data';

import { getByEdition, getIdByNameFromCache, getIdByNameFromCacheStandalone, getStandaloneQueryClient } from './utils';
import type { CacheEntryAsCoreComponent } from './utils';

/**
 * Feat cache functions (including proficiency feats)
 */

/**
 * Create feat cache hook functions
 */
export const createFeatCacheHooks = (queryClient: QueryClient) => {
    const getFeatSummaryById = (id: number): FeatCacheEntry | undefined => {
        const cacheData = queryClient.getQueryData<FeatCacheResponse>(['feats-cache']);
        if (!cacheData?.results) return undefined;
        return cacheData.results.find(item => item.id === id);
    };

    const getProficiencyFeatSummaryById = (id: number): FeatCacheEntry | undefined => {
        const cacheData = queryClient.getQueryData<FeatCacheResponse>(['feats-cache']);
        if (!cacheData?.results) return undefined;
        return cacheData.results.find(item => item.id === id);
    };

    const getFeatSelectFull = (): CacheEntryAsCoreComponent<FeatCacheEntry>[] => {
        const cacheData = queryClient.getQueryData<FeatCacheResponse>(['feats-cache']);
        if (!cacheData?.results) return [];
        return cacheData.results as CacheEntryAsCoreComponent<FeatCacheEntry>[];
    };

    const getFeatSelectByEdition = (editionId: number): CacheEntryAsCoreComponent<FeatCacheEntry>[] => {
        const allFeats = getFeatSelectFull();
        return getByEdition(allFeats, editionId);
    };

    const getProficiencyFeatSelectFull = (): CacheEntryAsCoreComponent<FeatCacheEntry>[] => {
        const cacheData = queryClient.getQueryData<FeatCacheResponse>(['feats-cache']);
        if (!cacheData?.results) return [];
        return cacheData.results as CacheEntryAsCoreComponent<FeatCacheEntry>[];
    };

    const getProficiencyFeatSelectByEdition = (editionId: number): CacheEntryAsCoreComponent<FeatCacheEntry>[] => {
        const allProficiencyFeats = getProficiencyFeatSelectFull();
        return getByEdition(allProficiencyFeats, editionId);
    };

    const getFeatIdByName = (name: string): number | undefined => {
        return getIdByNameFromCache(queryClient, ['feats-cache'], name);
    };

    const getFeatNameFromCache = (id: number): string | undefined => {
        const cacheData = queryClient.getQueryData<FeatCacheResponse>(['feats-cache']);
        if (!cacheData?.results) return undefined;
        const feat = cacheData.results.find(f => f.id === id);
        return feat?.name;
    };

    const getFeatByIdFromCache = (id: number): { id: number; name: string; useSubId: boolean } | undefined => {
        const cacheData = queryClient.getQueryData<FeatCacheResponse>(['feats-cache']);
        if (!cacheData?.results) return undefined;
        const feat = cacheData.results.find(f => f.id === id);
        if (!feat) return undefined;
        return {
            id: feat.id,
            name: feat.name,
            useSubId: feat.useSubId,
        };
    };

    return {
        getFeatSummaryById,
        getProficiencyFeatSummaryById,
        getFeatSelectFull,
        getFeatSelectByEdition,
        getProficiencyFeatSelectFull,
        getProficiencyFeatSelectByEdition,
        getFeatIdByName,
        getFeatNameFromCache,
        getFeatByIdFromCache,
    };
};

/**
 * Get feat ID by name (standalone)
 */
export const getFeatIdByName = (name: string): number | undefined => {
    return getIdByNameFromCacheStandalone<{ id: number; name: string }>(['feats-cache'], name);
};

/**
 * Get feat name from cache (standalone)
 */
export const getFeatNameFromCache = (id: number): string | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<FeatCacheResponse>(['feats-cache']);
    if (!cacheData?.results) return undefined;
    const feat = cacheData.results.find(f => f.id === id);
    return feat?.name;
};

/**
 * Get feat by ID from cache (standalone)
 */
export const getFeatByIdFromCache = (id: number): { id: number; name: string; useSubId: boolean } | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<FeatCacheResponse>(['feats-cache']);
    if (!cacheData?.results) return undefined;
    const feat = cacheData.results.find(f => f.id === id);
    if (!feat) return undefined;
    return {
        id: feat.id,
        name: feat.name,
        useSubId: feat.useSubId,
    };
};

/**
 * Get feat summary by ID (standalone)
 */
export const getFeatSummaryById = (id: number): FeatCacheEntry | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<FeatCacheResponse>(['feats-cache']);
    if (!cacheData?.results) return undefined;
    return cacheData.results.find(item => item.id === id);
};

/**
 * Get proficiency feat summary by ID (standalone)
 */
export const getProficiencyFeatSummaryById = (id: number): FeatCacheEntry | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<FeatCacheResponse>(['feats-cache']);
    if (!cacheData?.results) return undefined;
    return cacheData.results.find(item => item.id === id);
};

/**
 * Get all feats (standalone)
 */
export const getFeatSelectFull = (): Array<FeatCacheEntry & FilterableComponent> => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<FeatCacheResponse>(['feats-cache']);
    if (!cacheData?.results) return [];
    return cacheData.results as Array<FeatCacheEntry & FilterableComponent>;
};

/**
 * Get feats by edition (standalone)
 */
export const getFeatSelectByEdition = (editionId: number): Array<FeatCacheEntry & FilterableComponent> => {
    const allFeats = getFeatSelectFull();
    return getByEdition(allFeats, editionId);
};

/**
 * Get all proficiency feats (standalone)
 */
export const getProficiencyFeatSelectFull = (): Array<FeatCacheEntry & FilterableComponent> => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<FeatCacheResponse>(['feats-cache']);
    if (!cacheData?.results) return [];
    return cacheData.results as Array<FeatCacheEntry & FilterableComponent>;
};

/**
 * Get proficiency feats by edition (standalone)
 */
export const getProficiencyFeatSelectByEdition = (editionId: number): Array<FeatCacheEntry & FilterableComponent> => {
    const allProficiencyFeats = getProficiencyFeatSelectFull();
    return getByEdition(allProficiencyFeats, editionId);
};

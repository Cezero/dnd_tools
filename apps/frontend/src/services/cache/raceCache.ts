import type { QueryClient } from '@tanstack/react-query';

import type { RaceCacheEntry, RaceCacheResponse } from '@shared/schema';
import type { FilterableComponent } from '@shared/static-data';

import { getByEdition, getIdByNameFromCache, getIdByNameFromCacheStandalone, getStandaloneQueryClient } from './utils';
import type { CacheEntryAsCoreComponent } from './utils';

/**
 * Race cache functions
 */

/**
 * Create race cache hook functions
 */
export const createRaceCacheHooks = (queryClient: QueryClient) => {
    const getRaceSummaryById = (id: number): RaceCacheEntry | undefined => {
        const cacheData = queryClient.getQueryData<RaceCacheResponse>(['races-cache']);
        if (!cacheData?.results) return undefined;
        return cacheData.results.find(item => item.id === id);
    };

    const getRaceSelectFull = (): CacheEntryAsCoreComponent<RaceCacheEntry>[] => {
        const cacheData = queryClient.getQueryData<RaceCacheResponse>(['races-cache']);
        if (!cacheData?.results) return [];
        return cacheData.results as CacheEntryAsCoreComponent<RaceCacheEntry>[];
    };

    const getRaceSelectByEdition = (editionId: number): CacheEntryAsCoreComponent<RaceCacheEntry>[] => {
        const allRaces = getRaceSelectFull();
        return getByEdition(allRaces, editionId);
    };

    const getRaceIdByName = (name: string): number | undefined => {
        return getIdByNameFromCache(queryClient, ['races-cache'], name);
    };

    const getRaceNameFromCache = (id: number): string | undefined => {
        const cacheData = queryClient.getQueryData<RaceCacheResponse>(['races-cache']);
        if (!cacheData?.results) return undefined;
        const race = cacheData.results.find(r => r.id === id);
        return race?.name;
    };

    return {
        getRaceSummaryById,
        getRaceSelectFull,
        getRaceSelectByEdition,
        getRaceIdByName,
        getRaceNameFromCache,
    };
};

/**
 * Get race ID by name (standalone)
 */
export const getRaceIdByName = (name: string): number | undefined => {
    return getIdByNameFromCacheStandalone<{ id: number; name: string }>(['races-cache'], name);
};

/**
 * Get race name from cache (standalone)
 * 
 * @param id - Race ID (can be null or undefined)
 * @returns Race name or null if not found
 */
export const getRaceNameFromCache = (id: number | null | undefined): string | null => {
    if (!id) {
        return null;
    }

    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<RaceCacheResponse>(['races-cache']);
    if (!cacheData?.results) return undefined;
    const race = cacheData.results.find(r => r.id === id);
    return race?.name;
};

/**
 * Get race summary by ID (standalone)
 */
export const getRaceSummaryById = (id: number): RaceCacheEntry | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<RaceCacheResponse>(['races-cache']);
    if (!cacheData?.results) return undefined;
    return cacheData.results.find(item => item.id === id);
};

/**
 * Get all races (standalone)
 */
export const getRaceSelectFull = (): Array<RaceCacheEntry & FilterableComponent> => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<RaceCacheResponse>(['races-cache']);
    if (!cacheData?.results) return [];
    return cacheData.results as Array<RaceCacheEntry & FilterableComponent>;
};

/**
 * Get races by edition (standalone)
 */
export const getRaceSelectByEdition = (editionId: number): Array<RaceCacheEntry & FilterableComponent> => {
    const allRaces = getRaceSelectFull();
    return getByEdition(allRaces, editionId);
};

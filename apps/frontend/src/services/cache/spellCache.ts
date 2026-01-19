import type { QueryClient } from '@tanstack/react-query';

import type { SpellCacheEntry, SpellCacheResponse } from '@shared/schema';

import { getIdByNameFromCache, getIdByNameFromCacheStandalone, getStandaloneQueryClient } from './utils';

/**
 * Spell cache functions
 */

/**
 * Create spell cache hook functions
 */
export const createSpellCacheHooks = (queryClient: QueryClient) => {
    const getSpellSummaryById = (id: number): SpellCacheEntry | undefined => {
        const cacheData = queryClient.getQueryData<SpellCacheResponse>(['spells-cache']);
        if (!cacheData?.results) return undefined;
        return cacheData.results.find(item => item.id === id);
    };

    const getSpellIdByName = (name: string): number | undefined => {
        return getIdByNameFromCache(queryClient, ['spells-cache'], name);
    };

    const getSpellNameFromCache = (id: number): string | undefined => {
        const cacheData = queryClient.getQueryData<SpellCacheResponse>(['spells-cache']);
        if (!cacheData?.results) return undefined;
        const spell = cacheData.results.find(s => s.id === id);
        return spell?.name;
    };

    const getSpellSummaryFromCache = (id: number): string | null | undefined => {
        const cacheData = queryClient.getQueryData<SpellCacheResponse>(['spells-cache']);
        if (!cacheData?.results) return undefined;
        const spell = cacheData.results.find(s => s.id === id);
        return spell?.summary;
    };

    return {
        getSpellSummaryById,
        getSpellIdByName,
        getSpellNameFromCache,
        getSpellSummaryFromCache,
    };
};

/**
 * Get spell ID by name (standalone)
 */
export const getSpellIdByName = (name: string): number | undefined => {
    return getIdByNameFromCacheStandalone<{ id: number; name: string }>(['spells-cache'], name);
};

/**
 * Get spell name from cache (standalone)
 * 
 * @param id - Spell ID (can be null or undefined)
 * @returns Spell name or null if not found
 */
export const getSpellNameFromCache = (id: number | null | undefined): string | null => {
    if (!id) {
        return null;
    }

    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<SpellCacheResponse>(['spells-cache']);
    if (!cacheData?.results) return undefined;
    const spell = cacheData.results.find(s => s.id === id);
    return spell?.name;
};

/**
 * Get spell summary from cache (standalone)
 */
export const getSpellSummaryFromCache = (id: number): string | null | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<SpellCacheResponse>(['spells-cache']);
    if (!cacheData?.results) return undefined;
    const spell = cacheData.results.find(s => s.id === id);
    return spell?.summary;
};

/**
 * Get spell summary by ID (standalone)
 */
export const getSpellSummaryById = (id: number): SpellCacheEntry | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<SpellCacheResponse>(['spells-cache']);
    if (!cacheData?.results) return undefined;
    return cacheData.results.find(item => item.id === id);
};

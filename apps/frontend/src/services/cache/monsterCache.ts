import type { QueryClient } from '@tanstack/react-query';

import type { MonsterCacheResponse } from '@shared/schema';

import { getIdByNameFromCacheStandalone, getStandaloneQueryClient } from './utils';

/**
 * Monster cache functions
 * Note: Monster functions are only available as standalone functions (not in useCacheFunctions hook)
 */

/**
 * Get monster ID by name (hook version)
 */
export const createMonsterCacheHooks = (_queryClient: QueryClient) => {
    // Monster functions are only standalone, no hook versions needed
    return {};
};

/**
 * Get monster ID by name (standalone)
 */
export const getMonsterIdByName = (name: string): number | undefined => {
    return getIdByNameFromCacheStandalone<{ id: number; name: string }>(['monsters-cache'], name);
};

/**
 * Get monster name from cache (standalone)
 */
export const getMonsterNameFromCache = (id: number): string | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<MonsterCacheResponse>(['monsters-cache']);
    if (!cacheData?.results) return undefined;
    const monster = cacheData.results.find(m => m.id === id);
    return monster?.name;
};

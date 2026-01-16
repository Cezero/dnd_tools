import { useQueryClient } from '@tanstack/react-query';

import { createClassCacheHooks } from './classCache';
import { createCompanionCacheHooks } from './companionCache';
import { createDeityCacheHooks } from './deityCache';
import { createDomainCacheHooks } from './domainCache';
import { createFeatCacheHooks } from './featCache';
import { createFeatureCacheHooks } from './featureCache';
import { createItemCacheHooks } from './itemCache';
import { createMonsterCacheHooks } from './monsterCache';
import { createRaceCacheHooks } from './raceCache';
import { createSkillCacheHooks } from './skillCache';
import { createSourceBookCacheHooks } from './sourceBookCache';
import { createSpellCacheHooks } from './spellCache';

// Re-export all standalone functions from entity files
export * from './classCache';
export * from './companionCache';
export * from './deityCache';
export * from './domainCache';
export * from './featCache';
export * from './featureCache';
export * from './itemCache';
export * from './monsterCache';
export * from './raceCache';
export * from './skillCache';
export * from './sourceBookCache';
export * from './sourceFormatting';
export * from './spellCache';

/**
 * Custom hook that provides cache utility functions
 * 
 * Combines all entity-specific cache hook functions into a single hook.
 * Use this hook in React components to access cache functions.
 * 
 * @returns Object containing all cache utility functions
 * 
 * @example
 * const { getClassSummaryById, getSpellNameFromCache } = useCacheFunctions();
 */
export const useCacheFunctions = () => {
    const queryClient = useQueryClient();

    return {
        ...createClassCacheHooks(queryClient),
        ...createCompanionCacheHooks(queryClient),
        ...createDeityCacheHooks(queryClient),
        ...createDomainCacheHooks(queryClient),
        ...createFeatCacheHooks(queryClient),
        ...createFeatureCacheHooks(queryClient),
        ...createItemCacheHooks(queryClient),
        ...createMonsterCacheHooks(queryClient),
        ...createRaceCacheHooks(queryClient),
        ...createSkillCacheHooks(queryClient),
        ...createSourceBookCacheHooks(queryClient),
        ...createSpellCacheHooks(queryClient),
    };
};

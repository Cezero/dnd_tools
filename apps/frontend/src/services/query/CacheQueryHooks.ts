/**
 * Cache Query Hooks
 * 
 * Provides lightweight cache endpoints for dropdowns, select components, and client-side filtering.
 * Cache endpoints return minimal data structures optimized for performance, containing only essential
 * fields needed for common UI operations.
 * 
 * **When to Use Cache Endpoints**:
 * - Populating dropdown/select components
 * - Client-side filtering operations
 * - When only basic entity information is needed
 * - Performance-critical scenarios where payload size matters
 * 
 * **When to Use List Queries Instead**:
 * - Displaying full entity details
 * - When relationships or composite data are needed
 * - Detail views and edit forms
 * 
 * @see [Query Hooks and Caching Architecture](../../../../packages/shared/docs/application-overview/query-hooks-and-caching.md)
 */

import {
    ClassCacheResponseSchema,
    RaceCacheResponseSchema,
    SpellCacheResponseSchema,
    SkillCacheResponseSchema,
    FeatCacheResponseSchema,
    DeityCacheResponseSchema,
    DomainCacheResponseSchema,
    MonsterCacheResponseSchema,
    ItemCacheResponseSchema,
    SourceBookCacheResponseSchema,
    CompanionCacheResponseSchema,
} from '@shared/schema';

import { createQueryHooks } from './QueryHooksFactory';

// Cache endpoint configurations - all use simplified query keys without parameters
// Query key pattern: ['entity-cache']

/**
 * Classes cache endpoint - lightweight class data for dropdowns and filtering
 * Contains: id, name, and other essential fields (see ClassCacheSchema)
 */
const classesCacheConfig = createQueryHooks({
    path: '/classes/cache',
    method: 'GET',
    responseSchema: ClassCacheResponseSchema,
    queryKey: 'classes-cache',
    queryKeyBuilder: () => ['classes-cache'],
});

/**
 * Races cache endpoint - lightweight race data for dropdowns and filtering
 * Contains: id, name, and other essential fields (see RaceCacheSchema)
 */
const racesCacheConfig = createQueryHooks({
    path: '/races/cache',
    method: 'GET',
    responseSchema: RaceCacheResponseSchema,
    queryKey: 'races-cache',
    queryKeyBuilder: () => ['races-cache'],
});

/**
 * Spells cache endpoint - lightweight spell data for dropdowns and filtering
 * Contains: id, name, and other essential fields (see SpellCacheSchema)
 */
const spellsCacheConfig = createQueryHooks({
    path: '/spells/cache',
    method: 'GET',
    responseSchema: SpellCacheResponseSchema,
    queryKey: 'spells-cache',
    queryKeyBuilder: () => ['spells-cache'],
});

/**
 * Skills cache endpoint - lightweight skill data for dropdowns and filtering
 * Contains: id, name, and other essential fields (see SkillCacheSchema)
 */
const skillsCacheConfig = createQueryHooks({
    path: '/skills/cache',
    method: 'GET',
    responseSchema: SkillCacheResponseSchema,
    queryKey: 'skills-cache',
    queryKeyBuilder: () => ['skills-cache'],
});

/**
 * Feats cache endpoint - lightweight feat data for dropdowns and filtering
 * Contains: id, name, and other essential fields (see FeatCacheSchema)
 */
const featsCacheConfig = createQueryHooks({
    path: '/feats/cache',
    method: 'GET',
    responseSchema: FeatCacheResponseSchema,
    queryKey: 'feats-cache',
    queryKeyBuilder: () => ['feats-cache'],
});

/**
 * Deities cache endpoint - lightweight deity data for dropdowns and filtering
 * Contains: id, name, and other essential fields (see DeityCacheSchema)
 */
const deitiesCacheConfig = createQueryHooks({
    path: '/deities/cache',
    method: 'GET',
    responseSchema: DeityCacheResponseSchema,
    queryKey: 'deities-cache',
    queryKeyBuilder: () => ['deities-cache'],
});

/**
 * Domains cache endpoint - lightweight domain data for dropdowns and filtering
 * Contains: id, name, and other essential fields (see DomainCacheSchema)
 */
const domainsCacheConfig = createQueryHooks({
    path: '/domains/cache',
    method: 'GET',
    responseSchema: DomainCacheResponseSchema,
    queryKey: 'domains-cache',
    queryKeyBuilder: () => ['domains-cache'],
});

/**
 * Monsters cache endpoint - lightweight monster data for dropdowns and filtering
 * Contains: id, name, and other essential fields (see MonsterCacheSchema)
 */
const monstersCacheConfig = createQueryHooks({
    path: '/monsters/cache',
    method: 'GET',
    responseSchema: MonsterCacheResponseSchema,
    queryKey: 'monsters-cache',
    queryKeyBuilder: () => ['monsters-cache'],
});

/**
 * Items cache endpoint - lightweight item data for dropdowns and client-side filtering
 * Contains: id, name, typeId, weaponCategory, armorCategory, and other essential fields
 * 
 * **Extended Fields**: Includes weaponCategory and armorCategory to enable client-side filtering
 * by proficiency type. This eliminates the need for server-side query endpoints.
 * 
 * @see ItemCacheSchema for complete field list
 */
const itemsCacheConfig = createQueryHooks({
    path: '/items/cache',
    method: 'GET',
    responseSchema: ItemCacheResponseSchema,
    queryKey: 'items-cache',
    queryKeyBuilder: () => ['items-cache'],
});

/**
 * Sourcebooks cache endpoint - lightweight sourcebook data for dropdowns and filtering
 * Contains: id, name, and other essential fields (see SourceBookCacheSchema)
 */
const sourcebooksCacheConfig = createQueryHooks({
    path: '/sourcebooks/cache',
    method: 'GET',
    responseSchema: SourceBookCacheResponseSchema,
    queryKey: 'sourcebooks-cache',
    queryKeyBuilder: () => ['sourcebooks-cache'],
});

/**
 * Companions cache endpoint - lightweight companion data for dropdowns and filtering
 * Contains: id, monsterId, name (from monster), type, and minLevel (see CompanionCacheSchema)
 */
const companionsCacheConfig = createQueryHooks({
    path: '/companions/cache',
    method: 'GET',
    responseSchema: CompanionCacheResponseSchema,
    queryKey: 'companions-cache',
    queryKeyBuilder: () => ['companions-cache'],
});

/**
 * Cache Query Hooks Export
 * 
 * Provides both React hooks (useXxxCache) and imperative methods (getXxxCache) for all cache endpoints.
 * 
 * **React Hooks**: Use in React components for reactive data fetching
 * **Imperative Methods**: Use in event handlers, utilities, or async functions outside React components
 */
export const CacheQueryHooks = {
    // React hooks for use in components
    useClassesCache: classesCacheConfig.useQuery,
    useRacesCache: racesCacheConfig.useQuery,
    useSpellsCache: spellsCacheConfig.useQuery,
    useSkillsCache: skillsCacheConfig.useQuery,
    useFeatsCache: featsCacheConfig.useQuery,
    useDeitiesCache: deitiesCacheConfig.useQuery,
    useDomainsCache: domainsCacheConfig.useQuery,
    useMonstersCache: monstersCacheConfig.useQuery,
    useItemsCache: itemsCacheConfig.useQuery,
    useSourcebooksCache: sourcebooksCacheConfig.useQuery,
    useCompanionsCache: companionsCacheConfig.useQuery,

    // Add imperative methods
    getClassesCache: (params?: unknown) => classesCacheConfig.fetch(params),
    getRacesCache: (params?: unknown) => racesCacheConfig.fetch(params),
    getSpellsCache: (params?: unknown) => spellsCacheConfig.fetch(params),
    getSkillsCache: (params?: unknown) => skillsCacheConfig.fetch(params),
    getFeatsCache: (params?: unknown) => featsCacheConfig.fetch(params),
    getDeitiesCache: (params?: unknown) => deitiesCacheConfig.fetch(params),
    getDomainsCache: (params?: unknown) => domainsCacheConfig.fetch(params),
    getMonstersCache: (params?: unknown) => monstersCacheConfig.fetch(params),
    getItemsCache: (params?: unknown) => itemsCacheConfig.fetch(params),
    getSourcebooksCache: (params?: unknown) => sourcebooksCacheConfig.fetch(params),
    getCompanionsCache: (params?: unknown) => companionsCacheConfig.fetch(params),

    // Expose query functions for advanced usage
    getClassesCacheQueryFn: classesCacheConfig.queryFn,
    getRacesCacheQueryFn: racesCacheConfig.queryFn,
    getSpellsCacheQueryFn: spellsCacheConfig.queryFn,
    getSkillsCacheQueryFn: skillsCacheConfig.queryFn,
    getFeatsCacheQueryFn: () => featsCacheConfig.queryFn(),
    getDeitiesCacheQueryFn: deitiesCacheConfig.queryFn,
    getDomainsCacheQueryFn: domainsCacheConfig.queryFn,
    getMonstersCacheQueryFn: monstersCacheConfig.queryFn,
    getItemsCacheQueryFn: itemsCacheConfig.queryFn,
    getSourcebooksCacheQueryFn: sourcebooksCacheConfig.queryFn,
    getCompanionsCacheQueryFn: companionsCacheConfig.queryFn,
};

import {
    ClassCacheResponseSchema,
    RaceCacheResponseSchema,
    SpellCacheResponseSchema,
    SkillCacheResponseSchema,
    FeatCacheResponseSchema,
    DeityCacheResponseSchema,
    DomainCacheResponseSchema,
    FeatQuerySchema,
} from '@shared/schema';

import { createQueryHooks } from './QueryHooksFactory';

// Create query hook configurations
const classesCacheConfig = createQueryHooks({
    path: '/classes/cache',
    method: 'GET',
    responseSchema: ClassCacheResponseSchema,
    queryKey: 'classes-cache',
    queryKeyBuilder: () => ['classes-cache'],
});

const racesCacheConfig = createQueryHooks({
    path: '/races/cache',
    method: 'GET',
    responseSchema: RaceCacheResponseSchema,
    queryKey: 'races-cache',
    queryKeyBuilder: () => ['races-cache'],
});

const spellsCacheConfig = createQueryHooks({
    path: '/spells/cache',
    method: 'GET',
    responseSchema: SpellCacheResponseSchema,
    queryKey: 'spells-cache',
    queryKeyBuilder: () => ['spells-cache'],
});

const skillsCacheConfig = createQueryHooks({
    path: '/skills/cache',
    method: 'GET',
    responseSchema: SkillCacheResponseSchema,
    queryKey: 'skills-cache',
    queryKeyBuilder: () => ['skills-cache'],
});

const featsCacheConfig = createQueryHooks({
    path: '/feats/cache',
    requestSchema: FeatQuerySchema,
    method: 'GET',
    responseSchema: FeatCacheResponseSchema,
    queryKey: 'feats-cache',
    queryKeyBuilder: (params) => ['feats-cache', params as string | number | object],
});

const deitiesCacheConfig = createQueryHooks({
    path: '/deities/cache',
    method: 'GET',
    responseSchema: DeityCacheResponseSchema,
    queryKey: 'deities-cache',
    queryKeyBuilder: () => ['deities-cache'],
});

const domainsCacheConfig = createQueryHooks({
    path: '/domains/cache',
    method: 'GET',
    responseSchema: DomainCacheResponseSchema,
    queryKey: 'domains-cache',
    queryKeyBuilder: () => ['domains-cache'],
});

export const CacheQueryHooks = {
    // Keep existing hooks for backward compatibility during transition
    useClassesCache: classesCacheConfig.useQuery,
    useRacesCache: racesCacheConfig.useQuery,
    useSpellsCache: spellsCacheConfig.useQuery,
    useSkillsCache: skillsCacheConfig.useQuery,
    useFeatsCache: featsCacheConfig.useQuery,
    useDeitiesCache: deitiesCacheConfig.useQuery,
    useDomainsCache: domainsCacheConfig.useQuery,

    // Add imperative methods
    getClassesCache: (params?: unknown) => classesCacheConfig.fetch(params),
    getRacesCache: (params?: unknown) => racesCacheConfig.fetch(params),
    getSpellsCache: (params?: unknown) => spellsCacheConfig.fetch(params),
    getSkillsCache: (params?: unknown) => skillsCacheConfig.fetch(params),
    getFeatsCache: (data: unknown) => featsCacheConfig.fetch({ requestData: data }),
    getDeitiesCache: (params?: unknown) => deitiesCacheConfig.fetch(params),
    getDomainsCache: (params?: unknown) => domainsCacheConfig.fetch(params),

    // Expose query functions for advanced usage
    getClassesCacheQueryFn: classesCacheConfig.queryFn,
    getRacesCacheQueryFn: racesCacheConfig.queryFn,
    getSpellsCacheQueryFn: spellsCacheConfig.queryFn,
    getSkillsCacheQueryFn: skillsCacheConfig.queryFn,
    getFeatsCacheQueryFn: featsCacheConfig.queryFn,
    getDeitiesCacheQueryFn: deitiesCacheConfig.queryFn,
    getDomainsCacheQueryFn: domainsCacheConfig.queryFn,
};

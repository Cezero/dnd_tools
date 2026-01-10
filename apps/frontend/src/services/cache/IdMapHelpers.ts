import type { QueryClient } from '@tanstack/react-query';

import type {
    SpellCacheResponse,
    MonsterCacheResponse,
    FeatCacheResponse,
    SkillCacheResponse,
    ClassCacheResponse,
    RaceCacheResponse,
    DomainCacheResponse,
    DeityCacheResponse,
    ItemCacheResponse,
    SourceBookCacheResponse,
} from '@shared/schema';

// Generic helper function for name-to-ID lookups from cache
function getIdByNameFromCache<T extends { id: number; name: string }>(
    queryClient: QueryClient,
    cacheKey: (string | number | object)[],
    name: string
): number | undefined {
    const cacheData = queryClient.getQueryData<{ results: T[] }>(cacheKey);
    if (!cacheData?.results) return undefined;

    const lowerName = name.toLowerCase();
    const entity = cacheData.results.find(e => e.name.toLowerCase() === lowerName);
    return entity?.id;
}

// Spell helper functions
export function getSpellIdByName(queryClient: QueryClient, name: string): number | undefined {
    return getIdByNameFromCache<{ id: number; name: string }>(
        queryClient,
        ['spells-cache'],
        name
    );
}

export function getSpellNameFromCache(queryClient: QueryClient, id: number): string | undefined {
    const cacheData = queryClient.getQueryData<SpellCacheResponse>(['spells-cache']);
    if (!cacheData?.results) return undefined;
    const spell = cacheData.results.find(s => s.id === id);
    return spell?.name;
}

// Monster helper functions
export function getMonsterIdByName(queryClient: QueryClient, name: string): number | undefined {
    return getIdByNameFromCache<{ id: number; name: string }>(
        queryClient,
        ['monsters-cache'],
        name
    );
}

export function getMonsterNameFromCache(queryClient: QueryClient, id: number): string | undefined {
    const cacheData = queryClient.getQueryData<MonsterCacheResponse>(['monsters-cache']);
    if (!cacheData?.results) return undefined;
    const monster = cacheData.results.find(m => m.id === id);
    return monster?.name;
}

// Feat helper functions
export function getFeatIdByName(queryClient: QueryClient, name: string): number | undefined {
    return getIdByNameFromCache<{ id: number; name: string }>(
        queryClient,
        ['feats-cache'],
        name
    );
}

export function getFeatNameFromCache(queryClient: QueryClient, id: number): string | undefined {
    const cacheData = queryClient.getQueryData<FeatCacheResponse>(['feats-cache']);
    if (!cacheData?.results) return undefined;
    const feat = cacheData.results.find(f => f.id === id);
    return feat?.name;
}

export function getFeatByIdFromCache(queryClient: QueryClient, id: number): { id: number; name: string; useSubId: boolean } | undefined {
    const cacheData = queryClient.getQueryData<FeatCacheResponse>(['feats-cache']);
    if (!cacheData?.results) return undefined;
    const feat = cacheData.results.find(f => f.id === id);
    if (!feat) return undefined;
    return {
        id: feat.id,
        name: feat.name,
        useSubId: feat.useSubId,
    };
}

// Skill helper functions
export function getSkillIdByName(queryClient: QueryClient, name: string): number | undefined {
    return getIdByNameFromCache<{ id: number; name: string }>(
        queryClient,
        ['skills-cache'],
        name
    );
}

export function getSkillNameFromCache(queryClient: QueryClient | undefined, id: number): string | undefined {
    if (!queryClient) return undefined;
    const cacheData = queryClient.getQueryData<SkillCacheResponse>(['skills-cache']);
    if (!cacheData?.results) return undefined;
    const skill = cacheData.results.find(s => s.id === id);
    return skill?.name;
}

// Class helper functions
export function getClassIdByName(queryClient: QueryClient, name: string): number | undefined {
    return getIdByNameFromCache<{ id: number; name: string }>(
        queryClient,
        ['classes-cache'],
        name
    );
}

export function getClassNameFromCache(queryClient: QueryClient, id: number): string | undefined {
    const cacheData = queryClient.getQueryData<ClassCacheResponse>(['classes-cache']);
    if (!cacheData?.results) return undefined;
    const classEntry = cacheData.results.find(c => c.id === id);
    return classEntry?.name;
}

// Race helper functions
export function getRaceIdByName(queryClient: QueryClient, name: string): number | undefined {
    return getIdByNameFromCache<{ id: number; name: string }>(
        queryClient,
        ['races-cache'],
        name
    );
}

export function getRaceNameFromCache(queryClient: QueryClient, id: number): string | undefined {
    const cacheData = queryClient.getQueryData<RaceCacheResponse>(['races-cache']);
    if (!cacheData?.results) return undefined;
    const race = cacheData.results.find(r => r.id === id);
    return race?.name;
}

// Domain helper functions
export function getDomainIdByName(queryClient: QueryClient, name: string): number | undefined {
    return getIdByNameFromCache<{ id: number; name: string }>(
        queryClient,
        ['domains-cache'],
        name
    );
}

export function getDomainNameFromCache(queryClient: QueryClient, id: number): string | undefined {
    const cacheData = queryClient.getQueryData<DomainCacheResponse>(['domains-cache']);
    if (!cacheData?.results) return undefined;
    const domain = cacheData.results.find(d => d.id === id);
    return domain?.name;
}

// Deity helper functions
export function getDeityIdByName(queryClient: QueryClient, name: string): number | undefined {
    return getIdByNameFromCache<{ id: number; name: string }>(
        queryClient,
        ['deities-cache'],
        name
    );
}

export function getDeityNameFromCache(queryClient: QueryClient, id: number): string | undefined {
    const cacheData = queryClient.getQueryData<DeityCacheResponse>(['deities-cache']);
    if (!cacheData?.results) return undefined;
    const deity = cacheData.results.find(d => d.id === id);
    return deity?.name;
}

// Item helper functions
export function getItemIdByName(queryClient: QueryClient, name: string): number | undefined {
    return getIdByNameFromCache<{ id: number; name: string }>(
        queryClient,
        ['items-cache'],
        name
    );
}

export function getItemNameFromCache(queryClient: QueryClient, id: number): string | undefined {
    const cacheData = queryClient.getQueryData<ItemCacheResponse>(['items-cache']);
    if (!cacheData?.results) return undefined;
    const item = cacheData.results.find(i => i.id === id);
    return item?.name;
}

// SourceBook helper functions
export function getSourceBookIdByName(queryClient: QueryClient, name: string): number | undefined {
    return getIdByNameFromCache<{ id: number; name: string }>(
        queryClient,
        ['sourcebooks-cache'],
        name
    );
}

export function getSourceBookNameFromCache(queryClient: QueryClient, id: number): string | undefined {
    const cacheData = queryClient.getQueryData<SourceBookCacheResponse>(['sourcebooks-cache']);
    if (!cacheData?.results) return undefined;
    const sourceBook = cacheData.results.find(sb => sb.id === id);
    return sourceBook?.name;
}

export function getSourceBookFromCache(queryClient: QueryClient, id: number): { id: number; name: string; abbreviation: string } | undefined {
    const cacheData = queryClient.getQueryData<SourceBookCacheResponse>(['sourcebooks-cache']);
    if (!cacheData?.results) return undefined;
    const sourceBook = cacheData.results.find(sb => sb.id === id);
    if (!sourceBook) return undefined;
    return {
        id: sourceBook.id,
        name: sourceBook.name,
        abbreviation: sourceBook.abbreviation,
    };
}

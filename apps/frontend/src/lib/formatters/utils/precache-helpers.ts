import type { QueryClient } from '@tanstack/react-query';

import { CacheQueryHooks } from '@/services/query/CacheQueryHooks';
import { ClassQueryHooks } from '@/services/query/ClassQueryHooks';
import { FeatQueryHooks } from '@/services/query/FeatQueryHooks';
import { FeatureQueryHooks } from '@/services/query/FeatureQueryHooks';

import type {
    Feat,
    FeatCacheResponse,
    FeatQueryResponse,
    Feature,
    SpellCacheResponse,
    SkillCacheResponse,
    DomainCacheResponse,
    ClassCacheResponse,
    RaceCacheResponse,
    DnDClass,
} from '@shared/schema';

/**
 * Precaches a feat if it's not already in cache.
 * Checks individual cache, full list cache, and legacy cache formats.
 */
export async function precacheFeat(
    queryClient: QueryClient,
    featId: number
): Promise<void> {
    // Check if already cached
    const cachedFeat = queryClient.getQueryData<Feat>(['feats', 'item', featId]);
    if (cachedFeat) {
        return;
    }

    const fullFeatsData = queryClient.getQueryData<FeatQueryResponse>(['feats', 'full']);
    const isInFullCache = fullFeatsData?.results?.some(f => f.id === featId);
    if (isInFullCache) {
        return;
    }

    const featsCacheData = queryClient.getQueryData<FeatCacheResponse>(['feats-cache']);
    const isInFeatsCache = featsCacheData?.results?.some(f => f.id === featId);
    if (isInFeatsCache) {
        return;
    }

    // Fetch if not cached
    try {
        await queryClient.fetchQuery({
            queryKey: ['feats', 'item', featId],
            queryFn: () => FeatQueryHooks.getFeatByIdQueryFn({ pathParams: { id: featId } }),
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
        });
    } catch (error) {
        console.warn(`Failed to precache feat ${featId}:`, error);
        // Don't throw - allow formatting to continue with fallback
    }
}

/**
 * Precaches a feature if it's not already in cache.
 */
export async function precacheFeature(
    queryClient: QueryClient,
    featureId: number
): Promise<void> {
    // Check if already cached
    const cachedFeature = queryClient.getQueryData<Feature>(['features', 'item', featureId]);
    if (cachedFeature) {
        return;
    }

    // Fetch if not cached
    try {
        await queryClient.fetchQuery({
            queryKey: ['features', 'item', featureId],
            queryFn: async () => {
                const result = await FeatureQueryHooks.getFeatureById(featureId);
                return result;
            },
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
        });
    } catch (error) {
        console.warn(`Failed to precache feature ${featureId}:`, error);
        // Don't throw - allow formatting to continue with fallback
    }
}

/**
 * Precaches a spell if it's not already in cache.
 * Spells are typically cached via CacheQueryHooks.useSpellsCache, so we fetch the cache if needed.
 */
export async function precacheSpell(
    queryClient: QueryClient,
    spellId: number
): Promise<void> {
    // Check if already cached
    const spellsData = queryClient.getQueryData<SpellCacheResponse>(['spells-cache']);
    const isInCache = spellsData?.results?.some(s => s.id === spellId);
    if (isInCache) {
        return;
    }

    // Try to fetch the spells cache if not loaded
    try {
        await queryClient.fetchQuery({
            queryKey: ['spells-cache'],
            queryFn: () => CacheQueryHooks.getSpellsCacheQueryFn(),
            staleTime: Infinity,
            gcTime: Infinity,
        });
        // After fetching, check again
        const updatedSpellsData = queryClient.getQueryData<SpellCacheResponse>(['spells-cache']);
        if (!updatedSpellsData?.results?.some(s => s.id === spellId)) {
            // Still not found after fetching cache - this is unusual but not critical
            console.debug(`Spell ${spellId} not found in spells cache after fetch.`);
        }
    } catch (error) {
        console.warn(`Failed to fetch spells cache for spell ${spellId}:`, error);
        // Don't throw - allow formatting to continue with fallback
    }
}

/**
 * Precaches a domain if it's not already in cache.
 * Domains are typically cached via CacheQueryHooks.useDomainsCache, so we fetch the cache if needed.
 */
export async function precacheDomain(
    queryClient: QueryClient,
    domainId: number
): Promise<void> {
    // Check if already cached
    const domainsData = queryClient.getQueryData<DomainCacheResponse>(['domains-cache']);
    const isInCache = domainsData?.results?.some(d => d.id === domainId);
    if (isInCache) {
        return;
    }

    // Try to fetch the domains cache if not loaded
    try {
        await queryClient.fetchQuery({
            queryKey: ['domains-cache'],
            queryFn: () => CacheQueryHooks.getDomainsCacheQueryFn(),
            staleTime: Infinity,
            gcTime: Infinity,
        });
        // After fetching, check again
        const updatedDomainsData = queryClient.getQueryData<DomainCacheResponse>(['domains-cache']);
        if (!updatedDomainsData?.results?.some(d => d.id === domainId)) {
            // Still not found after fetching cache - this is unusual but not critical
            console.debug(`Domain ${domainId} not found in domains cache after fetch.`);
        }
    } catch (error) {
        console.warn(`Failed to fetch domains cache for domain ${domainId}:`, error);
        // Don't throw - allow formatting to continue with fallback
    }
}

/**
 * Precaches a class if it's not already in cache.
 * Checks individual cache and classes cache.
 */
export async function precacheClass(
    queryClient: QueryClient,
    classId: number
): Promise<void> {
    // Check if already cached
    const individualClass = queryClient.getQueryData<DnDClass>(['classes', 'item', classId]);
    if (individualClass) {
        return;
    }

    const classesData = queryClient.getQueryData<ClassCacheResponse>(['classes-cache']);
    const isInCache = classesData?.results?.some(c => c.id === classId);
    if (isInCache) {
        return;
    }

    // Fetch if not cached
    try {
        await queryClient.fetchQuery({
            queryKey: ['classes', 'item', classId],
            queryFn: () => ClassQueryHooks.getClassByIdQueryFn({ pathParams: { id: classId } }),
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
        });
    } catch (error) {
        console.warn(`Failed to precache class ${classId}:`, error);
        // Don't throw - allow formatting to continue with fallback
    }
}

/**
 * Precaches a skill if it's not already in cache.
 * Skills are typically cached via CacheQueryHooks.useSkillsCache, so we fetch the cache if needed.
 */
export async function precacheSkill(
    queryClient: QueryClient,
    skillId: number
): Promise<void> {
    // Check if already cached
    const skillsData = queryClient.getQueryData<SkillCacheResponse>(['skills-cache']);
    const isInCache = skillsData?.results?.some(s => s.id === skillId);
    if (isInCache) {
        return;
    }

    // Try to fetch the skills cache if not loaded
    try {
        await queryClient.fetchQuery({
            queryKey: ['skills-cache'],
            queryFn: () => CacheQueryHooks.getSkillsCacheQueryFn(),
            staleTime: Infinity,
            gcTime: Infinity,
        });
        // After fetching, check again
        const updatedSkillsData = queryClient.getQueryData<SkillCacheResponse>(['skills-cache']);
        if (!updatedSkillsData?.results?.some(s => s.id === skillId)) {
            // Still not found after fetching cache - this is unusual but not critical
            console.debug(`Skill ${skillId} not found in skills cache after fetch.`);
        }
    } catch (error) {
        console.warn(`Failed to fetch skills cache for skill ${skillId}:`, error);
        // Don't throw - allow formatting to continue with fallback
    }
}

/**
 * Precaches a race if it's not already in cache.
 * Races are typically cached via CacheQueryHooks.useRacesCache, so we fetch the cache if needed.
 */
export async function precacheRace(
    queryClient: QueryClient,
    raceId: number
): Promise<void> {
    // Check if already cached
    const racesData = queryClient.getQueryData<RaceCacheResponse>(['races-cache']);
    const isInCache = racesData?.results?.some(r => r.id === raceId);
    if (isInCache) {
        return;
    }

    // Try to fetch the races cache if not loaded
    try {
        await queryClient.fetchQuery({
            queryKey: ['races-cache'],
            queryFn: () => CacheQueryHooks.getRacesCacheQueryFn(),
            staleTime: Infinity,
            gcTime: Infinity,
        });
        // After fetching, check again
        const updatedRacesData = queryClient.getQueryData<RaceCacheResponse>(['races-cache']);
        if (!updatedRacesData?.results?.some(r => r.id === raceId)) {
            // Still not found after fetching cache - this is unusual but not critical
            console.debug(`Race ${raceId} not found in races cache after fetch.`);
        }
    } catch (error) {
        console.warn(`Failed to fetch races cache for race ${raceId}:`, error);
        // Don't throw - allow formatting to continue with fallback
    }
}

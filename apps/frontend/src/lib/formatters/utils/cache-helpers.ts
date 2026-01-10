import type { QueryClient } from '@tanstack/react-query';

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
 * Synchronous cache access helpers for formatters
 * These functions use queryClient.getQueryData() to read from cache without triggering fetches
 *
 * IMPORTANT: Entities should be precached before formatting to ensure names are available.
 * Use the `usePrecacheFeatureEntities` hook in React components, or call
 * `DisplayStrategyBase.precacheEntities()` imperatively before formatting.
 *
 * @example
 * ```tsx
 * // In a React component:
 * const { isComplete } = usePrecacheFeatureEntities(progressions);
 * if (!isComplete) return <div>Loading...</div>;
 * const result = strategy.format(progressions, { queryClient });
 * ```
 *
 * @example
 * ```typescript
 * // Imperative usage:
 * await DisplayStrategyBase.precacheEntities(progressions, queryClient);
 * const result = strategy.format(progressions, { queryClient });
 * ```
 */

/**
 * Get feat name from cache synchronously
 * 
 * Cache key priorities:
 * 1. Individual feat cache: ['feats', 'item', featId]
 * 2. Full feats list cache: ['feats', 'full']
 * 3. Legacy cache format: ['feats-cache', { queryType: 'all' }]
 */
export function getFeatNameFromCache(queryClient: QueryClient | undefined, featId: number | null | undefined): string | null {
    if (!queryClient || !featId) {
        return null;
    }

    try {
        // Priority 1: Check individual feat cache
        const individualFeat = queryClient.getQueryData<Feat>(['feats', 'item', featId]);
        if (individualFeat?.name) {
            return individualFeat.name;
        }

        // Priority 2: Check full feats list cache
        const fullFeatsData = queryClient.getQueryData<FeatQueryResponse>(['feats', 'full']);
        if (fullFeatsData?.results) {
            const feat = fullFeatsData.results.find(f => f.id === featId);
            if (feat?.name) {
                return feat.name;
            }
        }

        // Priority 3: Check legacy cache format (for backward compatibility)
        const legacyFeatsData = queryClient.getQueryData<FeatCacheResponse>(['feats-cache', { queryType: 'all' }]);
        if (legacyFeatsData?.results) {
            const feat = legacyFeatsData.results.find(f => f.id === featId);
            if (feat?.name) {
                return feat.name;
            }
        }
    } catch {
        // Ignore errors, return null
    }

    return null;
}

/**
 * Get feature name from cache synchronously
 */
export function getFeatureNameFromCache(queryClient: QueryClient | undefined, featureId: number | null | undefined): string | null {
    if (!queryClient || !featureId) {
        return null;
    }

    try {
        const feature = queryClient.getQueryData<Feature>(['features', 'item', featureId]);
        return feature?.name || null;
    } catch {
        // Ignore errors, return null
    }

    return null;
}

/**
 * Get spell name from cache synchronously
 */
export function getSpellNameFromCache(queryClient: QueryClient | undefined, spellId: number | null | undefined): string | null {
    if (!queryClient || !spellId) {
        return null;
    }

    try {
        const spellsData = queryClient.getQueryData<SpellCacheResponse>(['spells-cache']);
        if (spellsData?.results) {
            const spell = spellsData.results.find(s => s.id === spellId);
            return spell?.name || null;
        }
    } catch {
        // Ignore errors, return null
    }

    return null;
}

/**
 * Get skill name from cache synchronously
 */
export function getSkillNameFromCache(queryClient: QueryClient | undefined, skillId: number | null | undefined): string | null {
    if (!queryClient || !skillId) {
        return null;
    }

    try {
        const skillsData = queryClient.getQueryData<SkillCacheResponse>(['skills-cache']);
        if (skillsData?.results) {
            const skill = skillsData.results.find(s => s.id === skillId);
            return skill?.name || null;
        }
    } catch {
        // Ignore errors, return null
    }

    return null;
}

/**
 * Get domain name from cache synchronously
 */
export function getDomainNameFromCache(queryClient: QueryClient | undefined, domainId: number | null | undefined): string | null {
    if (!queryClient || !domainId) {
        return null;
    }

    try {
        const domainsData = queryClient.getQueryData<DomainCacheResponse>(['domains-cache']);
        if (domainsData?.results) {
            const domain = domainsData.results.find(d => d.id === domainId);
            return domain?.name || null;
        }
    } catch {
        // Ignore errors, return null
    }

    return null;
}

/**
 * Get class name from cache synchronously
 */
export function getClassNameFromCache(queryClient: QueryClient | undefined, classId: number | null | undefined): string | null {
    if (!queryClient || !classId) {
        return null;
    }

    try {
        // Priority 1: Check individual class cache (from getClassById)
        const individualClass = queryClient.getQueryData<DnDClass>(['classes', 'item', classId]);
        if (individualClass?.name) {
            return individualClass.name;
        }

        // Priority 2: Check classes cache
        const classesData = queryClient.getQueryData<ClassCacheResponse>(['classes-cache']);
        if (classesData?.results) {
            const classData = classesData.results.find(c => c.id === classId);
            if (classData?.name) {
                return classData.name;
            }
        }
    } catch {
        // Ignore errors, return null
    }

    return null;
}

/**
 * Get race name from cache synchronously
 */
export function getRaceNameFromCache(queryClient: QueryClient | undefined, raceId: number | null | undefined): string | null {
    if (!queryClient || !raceId) {
        return null;
    }

    try {
        const racesData = queryClient.getQueryData<RaceCacheResponse>(['races-cache']);
        if (racesData?.results) {
            const race = racesData.results.find(r => r.id === raceId);
            return race?.name || null;
        }
    } catch {
        // Ignore errors, return null
    }

    return null;
}


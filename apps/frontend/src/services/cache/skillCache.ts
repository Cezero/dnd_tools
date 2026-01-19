import type { QueryClient } from '@tanstack/react-query';

import type { SkillCacheEntry, SkillCacheResponse } from '@shared/schema';
import type { FilterableComponent } from '@shared/static-data';

import { getByEdition, getIdByNameFromCache, getIdByNameFromCacheStandalone, getStandaloneQueryClient } from './utils';
import type { CacheEntryAsCoreComponent } from './utils';

/**
 * Skill cache functions
 */

/**
 * Create skill cache hook functions
 */
export const createSkillCacheHooks = (queryClient: QueryClient) => {
    const getSkillSummaryById = (id: number): SkillCacheEntry | undefined => {
        const cacheData = queryClient.getQueryData<SkillCacheResponse>(['skills-cache']);
        if (!cacheData?.results) return undefined;
        return cacheData.results.find(item => item.id === id);
    };

    const getSkillSelectFull = (): CacheEntryAsCoreComponent<SkillCacheEntry>[] => {
        const cacheData = queryClient.getQueryData<SkillCacheResponse>(['skills-cache']);
        if (!cacheData?.results) return [];
        return cacheData.results as CacheEntryAsCoreComponent<SkillCacheEntry>[];
    };

    const getSkillSelectByEdition = (editionId: number): CacheEntryAsCoreComponent<SkillCacheEntry>[] => {
        const allSkills = getSkillSelectFull();
        return getByEdition(allSkills, editionId);
    };

    const getSkillIdByName = (name: string): number | undefined => {
        return getIdByNameFromCache(queryClient, ['skills-cache'], name);
    };

    const getSkillNameFromCache = (id: number): string | undefined => {
        const cacheData = queryClient.getQueryData<SkillCacheResponse>(['skills-cache']);
        if (!cacheData?.results) return undefined;
        const skill = cacheData.results.find(s => s.id === id);
        return skill?.name;
    };

    return {
        getSkillSummaryById,
        getSkillSelectFull,
        getSkillSelectByEdition,
        getSkillIdByName,
        getSkillNameFromCache,
    };
};

/**
 * Get skill ID by name (standalone)
 */
export const getSkillIdByName = (name: string): number | undefined => {
    return getIdByNameFromCacheStandalone<{ id: number; name: string }>(['skills-cache'], name);
};

/**
 * Get skill name from cache (standalone)
 * 
 * @param id - Skill ID (can be null or undefined)
 * @returns Skill name or null if not found
 */
export const getSkillNameFromCache = (id: number | null | undefined): string | null => {
    if (!id) {
        return null;
    }

    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<SkillCacheResponse>(['skills-cache']);
    if (!cacheData?.results) return undefined;
    const skill = cacheData.results.find(s => s.id === id);
    return skill?.name;
};

/**
 * Check if skill is trained only (standalone)
 */
export const isSkillTrainedOnly = (id: number): boolean => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<SkillCacheResponse>(['skills-cache']);
    if (!cacheData?.results) return false;
    const skill = cacheData.results.find(s => s.id === id);
    return skill?.trainedOnly ?? false;
};

/**
 * Get skill by ID from cache (standalone)
 */
export const getSkillByIdFromCache = (id: number): { id: number; name: string; abilityId: number; trainedOnly?: boolean } | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<SkillCacheResponse>(['skills-cache']);
    if (!cacheData?.results) return undefined;
    const skill = cacheData.results.find(s => s.id === id);
    if (!skill) return undefined;
    return {
        id: skill.id,
        name: skill.name,
        abilityId: skill.abilityId,
        trainedOnly: skill.trainedOnly,
    };
};

/**
 * Get skill summary by ID (standalone)
 */
export const getSkillSummaryById = (id: number): SkillCacheEntry | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<SkillCacheResponse>(['skills-cache']);
    if (!cacheData?.results) return undefined;
    return cacheData.results.find(item => item.id === id);
};

/**
 * Get all skills (standalone)
 */
export const getSkillSelectFull = (): Array<SkillCacheEntry & FilterableComponent> => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<SkillCacheResponse>(['skills-cache']);
    if (!cacheData?.results) return [];
    return cacheData.results as Array<SkillCacheEntry & FilterableComponent>;
};

/**
 * Get skills by edition (standalone)
 */
export const getSkillSelectByEdition = (editionId: number): Array<SkillCacheEntry & FilterableComponent> => {
    const allSkills = getSkillSelectFull();
    return getByEdition(allSkills, editionId);
};

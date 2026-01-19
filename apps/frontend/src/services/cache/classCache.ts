import type { QueryClient } from '@tanstack/react-query';

import type { ClassCacheEntry, ClassCacheResponse } from '@shared/schema';
import type { FilterableComponent } from '@shared/static-data';

import { getByEdition, getIdByNameFromCache, getIdByNameFromCacheStandalone, getStandaloneQueryClient } from './utils';
import type { CacheEntryAsCoreComponent } from './utils';

/**
 * Class cache functions
 */

/**
 * Create class cache hook functions
 */
export const createClassCacheHooks = (queryClient: QueryClient) => {
    const getClassSummaryById = (id: number): ClassCacheEntry | undefined => {
        const cacheData = queryClient.getQueryData<ClassCacheResponse>(['classes-cache']);
        if (!cacheData?.results) return undefined;
        return cacheData.results.find(item => item.id === id);
    };

    const getClassSelectFull = (): CacheEntryAsCoreComponent<ClassCacheEntry>[] => {
        const cacheData = queryClient.getQueryData<ClassCacheResponse>(['classes-cache']);
        if (!cacheData?.results) return [];
        return cacheData.results as CacheEntryAsCoreComponent<ClassCacheEntry>[];
    };

    const getClassSelectByEdition = (
        editionId: number,
        includePrestige?: boolean
    ): CacheEntryAsCoreComponent<ClassCacheEntry>[] => {
        const allClasses = getClassSelectFull();
        const editionFilteredClasses = getByEdition(allClasses, editionId);

        // If no filters specified, return all classes for this edition
        if (includePrestige === undefined) {
            return editionFilteredClasses;
        }

        return editionFilteredClasses.filter(classEntry => {
            const isPrestige = classEntry.isPrestige;

            // Base classes (not prestige) are always included
            if (!isPrestige) return true;

            // Prestige classes: include only if includePrestige is true or undefined
            return includePrestige !== false;
        });
    };

    const getBaseClassSelectByEdition = (editionId: number): CacheEntryAsCoreComponent<ClassCacheEntry>[] => {
        return getClassSelectByEdition(editionId, false);
    };

    const getSpellcasterClassSelectByEdition = (editionId: number): CacheEntryAsCoreComponent<ClassCacheEntry>[] => {
        const allClasses = getClassSelectByEdition(editionId);
        return allClasses.filter(classEntry => classEntry.canCastSpells);
    };

    const getClassIdByName = (name: string): number | undefined => {
        return getIdByNameFromCache(queryClient, ['classes-cache'], name);
    };

    const getClassNameFromCache = (id: number): string | undefined => {
        const cacheData = queryClient.getQueryData<ClassCacheResponse>(['classes-cache']);
        if (!cacheData?.results) return undefined;
        const classEntry = cacheData.results.find(c => c.id === id);
        return classEntry?.name;
    };

    return {
        getClassSummaryById,
        getClassSelectFull,
        getClassSelectByEdition,
        getBaseClassSelectByEdition,
        getSpellcasterClassSelectByEdition,
        getClassIdByName,
        getClassNameFromCache,
    };
};

/**
 * Get class ID by name (standalone)
 */
export const getClassIdByName = (name: string): number | undefined => {
    return getIdByNameFromCacheStandalone<{ id: number; name: string }>(['classes-cache'], name);
};

/**
 * Get class name from cache (standalone)
 * 
 * Enhanced version that checks multiple cache keys with priority:
 * 1. Individual class cache: ['classes', 'item', classId]
 * 2. Classes cache: ['classes-cache']
 * 
 * @param id - Class ID (can be null or undefined)
 * @returns Class name or null if not found
 */
export const getClassNameFromCache = (id: number | null | undefined): string | null => {
    if (!id) {
        return null;
    }

    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<ClassCacheResponse>(['classes-cache']);
    if (!cacheData?.results) return undefined;
    const classEntry = cacheData.results.find(c => c.id === id);
    return classEntry?.name;
};

/**
 * Get class summary by ID (standalone)
 */
export const getClassSummaryById = (id: number): ClassCacheEntry | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<ClassCacheResponse>(['classes-cache']);
    if (!cacheData?.results) return undefined;
    return cacheData.results.find(item => item.id === id);
};

/**
 * Get all classes (standalone)
 */
export const getClassSelectFull = (): Array<ClassCacheEntry & FilterableComponent> => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<ClassCacheResponse>(['classes-cache']);
    if (!cacheData?.results) return [];
    return cacheData.results as Array<ClassCacheEntry & FilterableComponent>;
};

/**
 * Get classes by edition (standalone)
 */
export const getClassSelectByEdition = (
    editionId: number,
    includePrestige?: boolean
): Array<ClassCacheEntry & FilterableComponent> => {
    const allClasses = getClassSelectFull();
    const editionFilteredClasses = getByEdition(allClasses, editionId);

    // If no filters specified, return all classes for this edition
    if (includePrestige === undefined) {
        return editionFilteredClasses;
    }

    return editionFilteredClasses.filter(classEntry => {
        const isPrestige = classEntry.isPrestige;

        // Base classes (not prestige) are always included
        if (!isPrestige) return true;

        // Prestige classes: include only if includePrestige is true or undefined
        return includePrestige !== false;
    });
};

/**
 * Get base classes by edition (standalone)
 */
export const getBaseClassSelectByEdition = (editionId: number): Array<ClassCacheEntry & FilterableComponent> => {
    return getClassSelectByEdition(editionId, false);
};

/**
 * Get spellcaster classes by edition (standalone)
 */
export const getSpellcasterClassSelectByEdition = (editionId: number): Array<ClassCacheEntry & FilterableComponent> => {
    const allClasses = getClassSelectByEdition(editionId);
    return allClasses.filter(classEntry => classEntry.canCastSpells);
};

import type { QueryClient } from '@tanstack/react-query';

import type { SourceBookCacheEntry, SourceBookCacheResponse } from '@shared/schema';
import { EditionId, SourceType, Setting } from '@shared/static-data';
import { isEditionCompatible } from '@shared/utils';

import { getIdByNameFromCache, getIdByNameFromCacheStandalone, getStandaloneQueryClient } from './utils';

/**
 * SourceBook cache functions
 */

/**
 * Create sourceBook cache hook functions
 */
export const createSourceBookCacheHooks = (queryClient: QueryClient) => {
    const getSourceBookIdByName = (name: string): number | undefined => {
        return getIdByNameFromCache(queryClient, ['sourcebooks-cache'], name);
    };

    const getSourceBookNameFromCache = (id: number): string | undefined => {
        const cacheData = queryClient.getQueryData<SourceBookCacheResponse>(['sourcebooks-cache']);
        if (!cacheData?.results) return undefined;
        const sourceBook = cacheData.results.find(sb => sb.id === id);
        return sourceBook?.name;
    };

    const getSourceBookFromCache = (id: number): { id: number; name: string; abbreviation: string } | undefined => {
        const cacheData = queryClient.getQueryData<SourceBookCacheResponse>(['sourcebooks-cache']);
        if (!cacheData?.results) return undefined;
        const sourceBook = cacheData.results.find(sb => sb.id === id);
        if (!sourceBook) return undefined;
        return {
            id: sourceBook.id,
            name: sourceBook.name,
            abbreviation: sourceBook.abbreviation,
        };
    };

    /**
     * Retrieves source books from cache filtered by content type and optionally by edition.
     * 
     * Uses database content flags (hasCore, hasClasses, hasSpells, etc.) to filter source books
     * by the type of content they contain. Optionally filters by edition compatibility.
     * 
     * Content Type Flags:
     * - SourceType.Core: Filters by hasCore flag (core rulebooks like PHB, DMG)
     * - SourceType.Classes: Filters by hasClasses flag
     * - SourceType.Spells: Filters by hasSpells flag
     * - SourceType.Races: Filters by hasRaces flag
     * - SourceType.Domains: Filters by hasDomains flag
     * - SourceType.Deities: Filters by hasDeities flag
     * - SourceType.Items: Filters by hasItems flag
     * - SourceType.All: Returns all source books (no content type filtering)
     * 
     * @param sourceType - The type of content to filter by (from SourceType enum)
     * @param editionId - Optional edition ID to filter by compatibility
     * @returns Array of source book cache entries matching the filter criteria
     * 
     * @see SourceType enum in @shared/static-data/src/SourceData.ts
     * @see SourceBookCacheEntry type for available fields
     */
    const getSourceBooksByType = (sourceType: SourceType, editionId?: EditionId): SourceBookCacheEntry[] => {
        const cacheData = queryClient.getQueryData<SourceBookCacheResponse>(['sourcebooks-cache']);
        if (!cacheData?.results) return [];

        // If All is selected, return all books without filtering by content type
        if (sourceType === SourceType.All) {
            let filtered = cacheData.results;
            if (editionId !== undefined) {
                filtered = filtered.filter(book => isEditionCompatible(book.editionId, editionId, book.isVisible !== false));
            }
            return filtered;
        }

        const SOURCE_TYPE_TO_FLAG: Record<Exclude<SourceType, typeof SourceType.All>, keyof SourceBookCacheEntry> = {
            [SourceType.Core]: 'hasCore',
            [SourceType.Classes]: 'hasClasses',
            [SourceType.Spells]: 'hasSpells',
            [SourceType.Races]: 'hasRaces',
            [SourceType.Domains]: 'hasDomains',
            [SourceType.Deities]: 'hasDeities',
            [SourceType.Items]: 'hasItems',
        };

        const flag = SOURCE_TYPE_TO_FLAG[sourceType];
        let filtered = cacheData.results.filter(book => book[flag] === true);

        if (editionId !== undefined) {
            filtered = filtered.filter(book => isEditionCompatible(book.editionId, editionId, book.isVisible !== false));
        }

        return filtered;
    };

    /**
     * Retrieves source books from cache that contain character creation options.
     * 
     * Filters source books that have any character option content (classes, spells, races,
     * domains, or deities) and optionally filters by edition compatibility.
     * 
     * Character options include:
     * - Classes (hasClasses flag)
     * - Spells (hasSpells flag)
     * - Races (hasRaces flag)
     * - Domains (hasDomains flag)
     * - Deities (hasDeities flag)
     * 
     * Note: Items are excluded from character options as they are not part of character creation.
     * 
     * @param editionId - Edition ID to filter by compatibility
     * @returns Array of source book cache entries containing character options
     * 
     * @see SourceBookCacheEntry type for available fields
     */
    const getCharacterOptionsSourceBooks = (editionId: EditionId): SourceBookCacheEntry[] => {
        const cacheData = queryClient.getQueryData<SourceBookCacheResponse>(['sourcebooks-cache']);
        if (!cacheData?.results) return [];

        const characterOptionBooks = cacheData.results.filter(book =>
            book.hasClasses || book.hasSpells || book.hasRaces || book.hasDomains || book.hasDeities
        );

        return characterOptionBooks.filter(book => isEditionCompatible(book.editionId, editionId, book.isVisible !== false));
    };

    /**
     * Retrieves source books from cache filtered by campaign setting and optionally by edition.
     * 
     * Filters source books by their settingId field, which links to the Setting enum.
     * Optionally filters by edition compatibility.
     * 
     * Campaign settings include:
     * - Setting.ForgottenRealms: Forgotten Realms setting books
     * - Setting.Eberron: Eberron setting books
     * - Setting.Greyhawk: Greyhawk setting books
     * - Other setting values as defined in Setting enum
     * 
     * @param setting - The campaign setting to filter by (from Setting enum)
     * @param editionId - Optional edition ID to filter by compatibility
     * @returns Array of source book cache entries matching the setting and edition
     * 
     * @see Setting enum in @shared/static-data/src/CommonData.ts
     * @see SourceBookCacheEntry type for available fields
     */
    const getSourceBooksBySetting = (setting: Setting, editionId?: EditionId): SourceBookCacheEntry[] => {
        const cacheData = queryClient.getQueryData<SourceBookCacheResponse>(['sourcebooks-cache']);
        if (!cacheData?.results) return [];

        let filtered = cacheData.results.filter(book => book.settingId === setting);

        if (editionId !== undefined) {
            filtered = filtered.filter(book => isEditionCompatible(book.editionId, editionId, book.isVisible !== false));
        }

        return filtered;
    };

    return {
        getSourceBookIdByName,
        getSourceBookNameFromCache,
        getSourceBookFromCache,
        getSourceBooksByType,
        getCharacterOptionsSourceBooks,
        getSourceBooksBySetting,
    };
};

/**
 * Get source book ID by name (standalone)
 */
export const getSourceBookIdByName = (name: string): number | undefined => {
    return getIdByNameFromCacheStandalone<{ id: number; name: string }>(['sourcebooks-cache'], name);
};

/**
 * Get source book name from cache (standalone)
 */
export const getSourceBookNameFromCache = (id: number): string | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<SourceBookCacheResponse>(['sourcebooks-cache']);
    if (!cacheData?.results) return undefined;
    const sourceBook = cacheData.results.find(sb => sb.id === id);
    return sourceBook?.name;
};

/**
 * Get source book from cache (standalone)
 */
export const getSourceBookFromCache = (id: number): { id: number; name: string; abbreviation: string } | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<SourceBookCacheResponse>(['sourcebooks-cache']);
    if (!cacheData?.results) return undefined;
    const sourceBook = cacheData.results.find(sb => sb.id === id);
    if (!sourceBook) return undefined;
    return {
        id: sourceBook.id,
        name: sourceBook.name,
        abbreviation: sourceBook.abbreviation,
    };
};

/**
 * Standalone version of getSourceBooksByType for use outside React components.
 * 
 * Retrieves source books from cache filtered by content type and optionally by edition.
 * Uses database content flags to filter source books by the type of content they contain.
 * 
 * Special handling:
 * - SourceType.All: Returns all source books (no content type filtering)
 * 
 * @param sourceType - The type of content to filter by (from SourceType enum)
 * @param editionId - Optional edition ID to filter by compatibility
 * @returns Array of source book cache entries matching the filter criteria
 * 
 * @see getSourceBooksByType hook version for React components
 * @see SourceType enum in @shared/static-data/src/SourceData.ts
 */
export const getSourceBooksByType = (sourceType: SourceType, editionId?: EditionId): SourceBookCacheEntry[] => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<SourceBookCacheResponse>(['sourcebooks-cache']);
    if (!cacheData?.results) return [];

    // If All is selected, return all books without filtering by content type
    if (sourceType === SourceType.All) {
        let filtered = cacheData.results;
        if (editionId !== undefined) {
            filtered = filtered.filter(book => isEditionCompatible(book.editionId, editionId, book.isVisible !== false));
        }
        return filtered;
    }

    const SOURCE_TYPE_TO_FLAG: Record<Exclude<SourceType, typeof SourceType.All>, keyof SourceBookCacheEntry> = {
        [SourceType.Core]: 'hasCore',
        [SourceType.Classes]: 'hasClasses',
        [SourceType.Spells]: 'hasSpells',
        [SourceType.Races]: 'hasRaces',
        [SourceType.Domains]: 'hasDomains',
        [SourceType.Deities]: 'hasDeities',
        [SourceType.Items]: 'hasItems',
    };

    const flag = SOURCE_TYPE_TO_FLAG[sourceType];
    let filtered = cacheData.results.filter(book => book[flag] === true);

    if (editionId !== undefined) {
        filtered = filtered.filter(book => isEditionCompatible(book.editionId, editionId, book.isVisible !== false));
    }

    return filtered;
};

/**
 * Standalone version of getCharacterOptionsSourceBooks for use outside React components.
 * 
 * Retrieves source books from cache that contain character creation options.
 * Filters source books that have any character option content and filters by edition compatibility.
 * 
 * @param editionId - Edition ID to filter by compatibility
 * @returns Array of source book cache entries containing character options
 * 
 * @see getCharacterOptionsSourceBooks hook version for React components
 */
export const getCharacterOptionsSourceBooks = (editionId: EditionId): SourceBookCacheEntry[] => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<SourceBookCacheResponse>(['sourcebooks-cache']);
    if (!cacheData?.results) return [];

    const characterOptionBooks = cacheData.results.filter(book =>
        book.hasClasses || book.hasSpells || book.hasRaces || book.hasDomains || book.hasDeities
    );

    return characterOptionBooks.filter(book => isEditionCompatible(book.editionId, editionId, book.isVisible !== false));
};

/**
 * Standalone version of getSourceBooksBySetting for use outside React components.
 * 
 * Retrieves source books from cache filtered by campaign setting and optionally by edition.
 * Filters source books by their settingId field, which links to the Setting enum.
 * 
 * @param setting - The campaign setting to filter by (from Setting enum)
 * @param editionId - Optional edition ID to filter by compatibility
 * @returns Array of source book cache entries matching the setting and edition
 * 
 * @see getSourceBooksBySetting hook version for React components
 * @see Setting enum in @shared/static-data/src/CommonData.ts
 */
export const getSourceBooksBySetting = (setting: Setting, editionId?: EditionId): SourceBookCacheEntry[] => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<SourceBookCacheResponse>(['sourcebooks-cache']);
    if (!cacheData?.results) return [];

    let filtered = cacheData.results.filter(book => book.settingId === setting);

    if (editionId !== undefined) {
        filtered = filtered.filter(book => isEditionCompatible(book.editionId, editionId, book.isVisible !== false));
    }

    return filtered;
};

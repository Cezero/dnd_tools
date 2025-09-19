import { SOURCE_BOOK_MAP } from '@shared/static-data';
import type { SelectOption } from '@shared/static-data';

export interface FilterOption {
    id: string;
    value: unknown;
}

/**
 * Generic utility function to filter source books based on edition selection and content type.
 * This can be used by any table that wants to allow filtering by source book.
 * 
 * @param currentFilters - Array of current filter options
 * @param editionFilterId - The ID of the edition filter (default: 'editionId')
 * @param contentType - The type of content to filter by ('hasClasses', 'hasSpells', 'hasRaces', 'hasDomains', 'hasDeities')
 * @param fallbackOptions - Fallback options to return when no editions are selected
 * @returns Array of filtered source book options
 */
export const getSourceBookOptionsForEdition = (
    currentFilters: FilterOption[],
    editionFilterId: string = 'editionId',
    contentType: keyof Pick<typeof SOURCE_BOOK_MAP[1], 'hasClasses' | 'hasSpells' | 'hasRaces' | 'hasDomains' | 'hasDeities'>,
    fallbackOptions: SelectOption[] = []
): SelectOption[] => {
    const editionFilter = currentFilters.find(f => f.id === editionFilterId);
    let selectedEditionIds: number[] = [];

    if (editionFilter) {
        if (editionFilter.value && typeof editionFilter.value === 'object' && 'values' in editionFilter.value) {
            selectedEditionIds = (editionFilter.value as { values: number[] }).values;
        } else if (Array.isArray(editionFilter.value)) {
            selectedEditionIds = editionFilter.value as number[];
        } else if (editionFilter.value) {
            selectedEditionIds = [editionFilter.value as number];
        }
    }

    if (selectedEditionIds.length === 0) {
        return fallbackOptions;
    }

    const filteredSourceBooks = Object.values(SOURCE_BOOK_MAP).filter(book =>
        book[contentType] && selectedEditionIds.includes(book.editionId)
    );

    return filteredSourceBooks.map(book => ({
        value: book.id,
        label: book.name
    }));
};

/**
 * Convenience function specifically for classes
 */
export const getSourceBookOptionsForClasses = (
    currentFilters: FilterOption[],
    fallbackOptions: SelectOption[] = []
): SelectOption[] => {
    return getSourceBookOptionsForEdition(currentFilters, 'editionId', 'hasClasses', fallbackOptions);
};

/**
 * Convenience function specifically for spells
 */
export const getSourceBookOptionsForSpells = (
    currentFilters: FilterOption[],
    fallbackOptions: SelectOption[] = []
): SelectOption[] => {
    return getSourceBookOptionsForEdition(currentFilters, 'editionId', 'hasSpells', fallbackOptions);
};

/**
 * Convenience function specifically for races
 */
export const getSourceBookOptionsForRaces = (
    currentFilters: FilterOption[],
    fallbackOptions: SelectOption[] = []
): SelectOption[] => {
    return getSourceBookOptionsForEdition(currentFilters, 'editionId', 'hasRaces', fallbackOptions);
};

/**
 * Convenience function specifically for domains
 */
export const getSourceBookOptionsForDomains = (
    currentFilters: FilterOption[],
    fallbackOptions: SelectOption[] = []
): SelectOption[] => {
    return getSourceBookOptionsForEdition(currentFilters, 'editionId', 'hasDomains', fallbackOptions);
};

/**
 * Convenience function specifically for deities
 */
export const getSourceBookOptionsForDeities = (
    currentFilters: FilterOption[],
    fallbackOptions: SelectOption[] = []
): SelectOption[] => {
    return getSourceBookOptionsForEdition(currentFilters, 'editionId', 'hasDeities', fallbackOptions);
};

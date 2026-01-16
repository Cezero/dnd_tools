import { getSourceBookFromCache } from './sourceBookCache';
import type { SourceFormatOptions, SourceReference } from './types';

/**
 * Source Formatting Utilities
 *
 * This module provides centralized source book reference formatting functions.
 *
 * **Architecture Decision**: All source formatting has been consolidated into these
 * unified functions, standardizing on space format ("PHB 123") across the entire
 * application. The sourceBookInfo arrays only contain IDs and page numbers - all
 * formatting must use getSourceBookFromCache() to resolve names/abbreviations.
 *
 * @see packages/shared/docs/formatting-system/architecture-decisions.md
 */

/**
 * Format a single source reference
 *
 * Uses standardized space format: "PHB 123" (no parentheses, no "pg" prefix).
 * All source formatting uses getSourceBookFromCache() internally since sourceBookInfo
 * only contains IDs, not names/abbreviations.
 *
 * @param source - Source reference with sourceBookId and optional pageNumber
 * @param options - Formatting options
 * @returns Formatted string (e.g., "PHB 123")
 *
 * @example
 * formatSourceReference({ sourceBookId: 1, pageNumber: 123 }) // "PHB 123"
 * formatSourceReference({ sourceBookId: 1, pageNumber: null }) // "PHB"
 * formatSourceReference({ sourceBookId: 1 }, { useAbbreviation: false }) // "Player's Handbook"
 */
export function formatSourceReference(
    source: { sourceBookId: number; pageNumber?: number | null } | null | undefined,
    options?: SourceFormatOptions
): string {
    if (!source?.sourceBookId) return '';

    const { useAbbreviation = true } = options ?? {};
    const book = getSourceBookFromCache(source.sourceBookId);

    if (!book) return 'Unknown Source';

    const displayTitle = useAbbreviation ? book.abbreviation : book.name;
    if (!source.pageNumber) return displayTitle;
    return `${displayTitle} ${source.pageNumber}`;
}

/**
 * Format multiple source references (comma-separated)
 *
 * Uses standardized space format: "PHB 123, DMG 45" (no parentheses, no "pg" prefix).
 * All source formatting uses getSourceBookFromCache() internally since sourceBookInfo
 * only contains IDs, not names/abbreviations.
 *
 * @param sources - Array of source references
 * @param options - Formatting options
 * @returns Formatted string (e.g., "PHB 123, DMG 45")
 *
 * @example
 * formatSourceReferences([
 *   { sourceBookId: 1, pageNumber: 123 },
 *   { sourceBookId: 2, pageNumber: 45 }
 * ]) // "PHB 123, DMG 45"
 */
export function formatSourceReferences(
    sources: Array<{ sourceBookId: number; pageNumber?: number | null }> | null | undefined,
    options?: SourceFormatOptions
): string {
    if (!sources || sources.length === 0) return '';

    const { sourceSelection = 'all' } = options ?? {};

    if (sourceSelection === 'first') {
        return formatSourceReference(sources[0], options);
    }

    return sources
        .map(source => formatSourceReference(source, options))
        .filter(Boolean)
        .join(', ');
}

/**
 * Format source from object with sourceBookInfo property
 *
 * Convenience function for extracting and formatting sourceBookInfo from objects.
 * Uses standardized space format: "PHB 123" (no parentheses, no "pg" prefix).
 *
 * @param obj - Object with optional sourceBookInfo array
 * @param options - Formatting options (sourceSelection: 'first' for single, 'all' for comma-separated)
 * @returns Formatted string
 *
 * @example
 * formatSourceFromObject(spell, { sourceSelection: 'first' }) // "PHB 123"
 * formatSourceFromObject(monster, { sourceSelection: 'all' }) // "PHB 123, DMG 45"
 */
export function formatSourceFromObject<T extends { sourceBookInfo?: Array<{ sourceBookId: number; pageNumber?: number | null }> }>(
    obj: T | null | undefined,
    options?: SourceFormatOptions
): string {
    if (!obj?.sourceBookInfo || obj.sourceBookInfo.length === 0) return '';
    return formatSourceReferences(obj.sourceBookInfo, options);
}

/**
 * Formats source book references for display in the UI.
 * 
 * **Note**: This function now uses standardized space format ("PHB 123") instead of
 * the previous parentheses format ("PHB (pg 123)"). This change standardizes source
 * formatting across the entire application.
 * 
 * Retrieves source book information from the cache and formats it as a readable string.
 * Supports both full names and abbreviations, and optionally includes page numbers.
 * 
 * Format examples:
 * - "Player's Handbook" (full name)
 * - "PHB" (abbreviation)
 * - "Player's Handbook 45" (with page number, full name)
 * - "PHB 123" (abbreviation with page number)
 * - "PHB 123, DMG 45" (multiple sources)
 * 
 * @param sources - Array of source references with sourceBookId and optional pageNumber
 * @param useAbbrev - If true, uses abbreviation instead of full name
 * @returns Formatted string of source book references, comma-separated
 * 
 * @see getSourceBookFromCache for cache lookup implementation
 * @see SourceReference interface for source reference structure
 * @see formatSourceReferences for the underlying implementation
 */
export const getSourceDisplay = (sources: SourceReference[], useAbbrev: boolean = false): string => {
    return formatSourceReferences(sources, { useAbbreviation: useAbbrev });
};

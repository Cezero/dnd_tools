/**
 * Type definitions for cache service
 */

/**
 * Source reference structure
 * Contains source book ID and optional page number
 */
export interface SourceReference {
    sourceBookId: number;
    pageNumber?: number;
}

/**
 * Options for source reference formatting
 */
export interface SourceFormatOptions {
    /** Use abbreviation (true) or full name (false). Default: true */
    useAbbreviation?: boolean;
    /** Which source to use when array has multiple entries: 'first' or 'all'. Default: 'all' */
    sourceSelection?: 'first' | 'all';
}

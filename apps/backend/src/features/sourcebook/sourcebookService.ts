import { prisma } from '@/lib/prisma';
import {
    SourceBookCacheResponse,
} from '@shared/schema';

import type { SourceBookService } from './types';

/**
 * Source Book Service
 * 
 * Provides lightweight source book cache endpoint optimized for frontend performance.
 * Uses selective field loading to include only essential fields and content flags,
 * reducing payload size and improving response time.
 * 
 * Key Features:
 * - Selective field loading for performance
 * - Content flags (hasClasses, hasSpells, hasRaces, etc.) for filtering
 * - Lightweight response optimized for frontend cache
 * - Read-only cache endpoint
 * 
 * Integration Points:
 * - Frontend Cache System: Pre-populated on app startup via CacheProvider
 * - Source Attribution: Used throughout system for source book selection and filtering
 * 
 * @see SourceBookService interface for method signatures
 * @see sourcebookController for request handling
 * @see sourcebookRoutes for API endpoints
 */
export const sourceBookService: SourceBookService = {
    /**
     * Retrieves lightweight source book summaries with content flags for frontend cache population.
     * 
     * Uses selective field loading to include only essential fields and content flags,
     * reducing payload size and improving performance. Orders results by name for
     * consistent presentation.
     * 
     * Content Flags:
     * - hasCore: Indicates core rulebooks (PHB, DMG) for each edition
     * - hasClasses: Indicates book contains class options
     * - hasSpells: Indicates book contains spells
     * - hasRaces: Indicates book contains race options
     * - hasDomains: Indicates book contains domain options
     * - hasDeities: Indicates book contains deity options
     * - hasItems: Indicates book contains item options
     * 
     * @returns Promise resolving to SourceBookCacheResponse with total count and results array
     */
    async getSourceBookCache(): Promise<SourceBookCacheResponse> {
        const sourceBooks = await prisma.sourceBook.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                abbreviation: true,
                editionId: true,
                isVisible: true,
                settingId: true,
                hasCore: true,
                hasClasses: true,
                hasSpells: true,
                hasRaces: true,
                hasDomains: true,
                hasDeities: true,
                hasItems: true,
            }
        });
        return {
            total: sourceBooks.length,
            results: sourceBooks,
        };
    },
};

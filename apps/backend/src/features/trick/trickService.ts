import { prisma } from '@/lib/prisma';
import {
    TrickIdParamRequest,
    CreateTrickRequest,
    UpdateTrickRequest,
    GetAllTricksResponse,
    GetTrickResponse,
    CreateResponse,
    UpdateResponse,
} from '@shared/schema';

import type { TrickService } from './types';

/**
 * Trick Service
 * 
 * Provides trick management for animal companions. Tricks are abilities that can be taught
 * to animal companions. Supports edition-based filtering, visibility management, and source
 * book attribution through transaction-based source book mapping.
 * 
 * Key Features:
 * - Trick CRUD operations with source book management
 * - Edition-based filtering for multi-edition support
 * - Visibility flag for content management
 * - Transaction-based source book mapping with delete/recreate pattern
 * 
 * Integration Points:
 * - Companion System: Character companions have tricks
 * - Source Book System: Tricks have source attribution
 * 
 * @see TrickService interface for method signatures
 * @see trickController for request handling
 * @see trickRoutes for API endpoints
 */
export const trickService: TrickService = {
    /**
     * Retrieves all tricks with optional edition filtering and visibility filtering.
     * 
     * Supports optional editionId parameter for filtering tricks by edition. Always filters
     * by isVisible flag to hide unpublished tricks. Orders results by name for consistent
     * presentation.
     * 
     * @param editionId - Optional edition ID to filter by
     * @returns Promise resolving to GetAllTricksResponse with total count and results array
     */
    async getAllTricks(editionId?: number): Promise<GetAllTricksResponse> {
        const where = editionId ? { editionId, isVisible: true } : { isVisible: true };

        const [tricks, total] = await Promise.all([
            prisma.trick.findMany({
                where,
                orderBy: { name: 'asc' },
                include: {
                    sourceBookInfo: {
                        select: {
                            sourceBookId: true,
                            pageNumber: true
                        }
                    }
                }
            }),
            prisma.trick.count({ where }),
        ]);

        return {
            total,
            results: tricks,
        };
    },

    async getTrickById(query: TrickIdParamRequest): Promise<GetTrickResponse | null> {
        const trick = await prisma.trick.findUnique({
            where: { id: query.id },
            include: {
                sourceBookInfo: {
                    select: {
                        sourceBookId: true,
                        pageNumber: true
                    }
                }
            }
        });

        if (!trick) {
            return null;
        }

        return trick;
    },

    async createTrick(data: CreateTrickRequest): Promise<CreateResponse> {
        const { sourceBookInfo, ...trickData } = data;

        const result = await prisma.$transaction(async (tx) => {
            // Create the trick first
            const trickResult = await tx.trick.create({
                data: trickData,
            });

            // Create source book mappings if provided
            if (sourceBookInfo && sourceBookInfo.length > 0) {
                await tx.trickSourceMap.createMany({
                    data: sourceBookInfo.map((source) => ({
                        trickId: trickResult.id,
                        sourceBookId: source.sourceBookId,
                        pageNumber: source.pageNumber || null,
                    }))
                });
            }

            return trickResult;
        });

        return { id: result.id.toString(), message: 'Trick created successfully' };
    },

    /**
     * Updates an existing trick with source book mapping management.
     * 
     * Uses delete/recreate pattern for source book mappings to ensure data consistency.
     * Only updates source book mappings if sourceBookInfo array is explicitly provided
     * (undefined means no change).
     * 
     * @param data - UpdateTrickRequest with updated data and optional sourceBookInfo array
     * @param query - TrickIdParamRequest with trick ID
     * @returns Promise resolving to UpdateResponse with success message
     */
    async updateTrick(data: UpdateTrickRequest, query: TrickIdParamRequest): Promise<UpdateResponse> {
        const { sourceBookInfo, ...trickData } = data;

        await prisma.$transaction(async (tx) => {
            // Update the trick
            await tx.trick.update({
                where: { id: query.id },
                data: trickData,
            });

            // Update source book mappings if provided
            if (sourceBookInfo !== undefined) {
                // Delete existing source mappings
                await tx.trickSourceMap.deleteMany({
                    where: { trickId: query.id }
                });

                // Create new source mappings
                if (sourceBookInfo.length > 0) {
                    await tx.trickSourceMap.createMany({
                        data: sourceBookInfo.map((source) => ({
                            trickId: query.id,
                            sourceBookId: source.sourceBookId,
                            pageNumber: source.pageNumber || null,
                        }))
                    });
                }
            }
        });

        return { message: 'Trick updated successfully' };
    },

    async deleteTrick(query: TrickIdParamRequest): Promise<UpdateResponse> {
        await prisma.trick.delete({
            where: { id: query.id }
        });

        return { message: 'Trick deleted successfully' };
    },
};


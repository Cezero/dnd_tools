import { PrismaClient } from '@shared/prisma-client';
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

const prisma = new PrismaClient();

export const trickService: TrickService = {
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


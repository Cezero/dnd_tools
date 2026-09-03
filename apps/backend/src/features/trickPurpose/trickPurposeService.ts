import { prisma } from '@/lib/prisma';
import {
    TrickPurposeIdParamRequest,
    CreateTrickPurposeRequest,
    UpdateTrickPurposeRequest,
    GetAllTrickPurposesResponse,
    GetTrickPurposeResponse,
    CreateResponse,
    UpdateResponse,
    TrickPurposeCacheResponse,
} from '@shared/schema';

import type { TrickPurposeService } from './types';

/**
 * Admin CRUD for Handle Animal general purposes and their trick packages.
 */
export const trickPurposeService: TrickPurposeService = {
    /**
     * Lists visible purposes with nested tricks and source attribution.
     */
    async getAllTrickPurposes(editionId?: number): Promise<GetAllTrickPurposesResponse> {
        const where = editionId ? { editionId, isVisible: true } : { isVisible: true };

        const [purposes, total] = await Promise.all([
            prisma.trickPurpose.findMany({
                where,
                orderBy: { name: 'asc' },
                include: {
                    tricks: {
                        include: { trick: true },
                    },
                    sourceBookInfo: {
                        select: {
                            sourceBookId: true,
                            pageNumber: true,
                        },
                    },
                },
            }),
            prisma.trickPurpose.count({ where }),
        ]);

        return {
            total,
            results: purposes,
        };
    },

    async getTrickPurposeById(query: TrickPurposeIdParamRequest): Promise<GetTrickPurposeResponse | null> {
        const purpose = await prisma.trickPurpose.findUnique({
            where: { id: query.id },
            include: {
                tricks: {
                    include: { trick: true },
                },
                sourceBookInfo: {
                    select: {
                        sourceBookId: true,
                        pageNumber: true,
                    },
                },
            },
        });

        return purpose;
    },

    async createTrickPurpose(data: CreateTrickPurposeRequest): Promise<CreateResponse> {
        const { tricks, sourceBookInfo, ...purposeData } = data;

        const result = await prisma.$transaction(async (tx) => {
            const purpose = await tx.trickPurpose.create({
                data: purposeData,
            });

            if (tricks && tricks.length > 0) {
                await tx.trickPurposeTrick.createMany({
                    data: tricks.map((trick) => ({
                        purposeId: purpose.id,
                        trickId: trick.trickId,
                        timesTrained: trick.timesTrained ?? 1,
                    })),
                });
            }

            if (sourceBookInfo && sourceBookInfo.length > 0) {
                await tx.trickPurposeSourceMap.createMany({
                    data: sourceBookInfo.map((source) => ({
                        trickPurposeId: purpose.id,
                        sourceBookId: source.sourceBookId,
                        pageNumber: source.pageNumber || null,
                    })),
                });
            }

            return purpose;
        });

        return { id: result.id.toString(), message: 'Trick purpose created successfully' };
    },

    /**
     * Updates a purpose. Nested tricks and source maps use delete/recreate when provided.
     */
    async updateTrickPurpose(data: UpdateTrickPurposeRequest, query: TrickPurposeIdParamRequest): Promise<UpdateResponse> {
        const { tricks, sourceBookInfo, ...purposeData } = data;

        await prisma.$transaction(async (tx) => {
            await tx.trickPurpose.update({
                where: { id: query.id },
                data: purposeData,
            });

            if (tricks !== undefined) {
                await tx.trickPurposeTrick.deleteMany({
                    where: { purposeId: query.id },
                });
                if (tricks.length > 0) {
                    await tx.trickPurposeTrick.createMany({
                        data: tricks.map((trick) => ({
                            purposeId: query.id,
                            trickId: trick.trickId,
                            timesTrained: trick.timesTrained ?? 1,
                        })),
                    });
                }
            }

            if (sourceBookInfo !== undefined) {
                await tx.trickPurposeSourceMap.deleteMany({
                    where: { trickPurposeId: query.id },
                });
                if (sourceBookInfo.length > 0) {
                    await tx.trickPurposeSourceMap.createMany({
                        data: sourceBookInfo.map((source) => ({
                            trickPurposeId: query.id,
                            sourceBookId: source.sourceBookId,
                            pageNumber: source.pageNumber || null,
                        })),
                    });
                }
            }
        });

        return { message: 'Trick purpose updated successfully' };
    },

    async deleteTrickPurpose(query: TrickPurposeIdParamRequest): Promise<UpdateResponse> {
        await prisma.trickPurpose.delete({
            where: { id: query.id },
        });

        return { message: 'Trick purpose deleted successfully' };
    },

    /**
     * Lightweight purpose list for dropdowns.
     */
    async getTrickPurposeCache(): Promise<TrickPurposeCacheResponse> {
        const purposes = await prisma.trickPurpose.findMany({
            where: { isVisible: true },
            orderBy: { name: 'asc' },
        });

        return {
            total: purposes.length,
            results: purposes,
        };
    },
};

import { Feat, Prisma, PrismaClient } from '@shared/prisma-client';
import {
    FeatIdParamRequest,
    CreateFeatRequest,
    UpdateFeatRequest,
    GetAllFeatsResponse,
    CreateResponse,
    UpdateResponse,
    FeatQueryResponse,
    FeatQueryRequest,
    GetFeatListResponse,
    FeatCacheResponse
} from '@shared/schema';
import { FeatBenefitType } from '@shared/static-data';

import type { FeatService } from './types';

const prisma = new PrismaClient();

export const featService: FeatService = {
    async getAllFeats(): Promise<GetAllFeatsResponse> {
        const [feats] = await Promise.all([
            prisma.feat.findMany({
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
            prisma.feat.count(),
        ]);

        return {
            total: feats.length,
            results: feats,
        };
    },

    async featQuery(query: FeatQueryRequest): Promise<FeatQueryResponse> {
        let whereClause: Prisma.FeatWhereInput = {};
        if (query.queryType === 'proficiency') {
            whereClause = {
                benefits: {
                    some: {
                        typeId: FeatBenefitType.PROFICIENCY
                    }
                }
            }
        }
        // For 'all' query type, no where clause is needed - get all feats
        const [feats] = await Promise.all([
            prisma.feat.findMany({
                where: whereClause,
                include: {
                    benefits: true,
                    prereqs: true,
                    sourceBookInfo: {
                        select: {
                            sourceBookId: true,
                            pageNumber: true
                        }
                    }
                },
                orderBy: { name: 'asc' },
            }),
            prisma.feat.count({
                where: whereClause,
            }),
        ]);
        return {
            total: feats.length,
            results: feats,
        };
    },

    async getFeatList(query: FeatQueryRequest): Promise<GetFeatListResponse> {
        let whereClause: Prisma.FeatWhereInput = {};
        if (query.queryType === 'proficiency') {
            whereClause = {
                benefits: {
                    some: {
                        typeId: FeatBenefitType.PROFICIENCY
                    }
                }
            }
        }
        // For 'all' query type, no where clause is needed - get all feats

        const feats = await prisma.feat.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
            },
            orderBy: { name: 'asc' },
        });

        return feats;
    },

    async getFeatById(query: FeatIdParamRequest): Promise<Feat | null> {
        const feat = await prisma.feat.findUnique({
            where: { id: query.id },
            include: {
                benefits: true,
                prereqs: true,
                sourceBookInfo: {
                    select: {
                        sourceBookId: true,
                        pageNumber: true
                    }
                }
            },
        });

        return feat as Feat;
    },

    async createFeat(data: CreateFeatRequest): Promise<CreateResponse> {
        const result = await prisma.$transaction(async (tx) => {
            const newFeat = await tx.feat.create({
                data: {
                    ...data,
                    benefits: data.benefits ? {
                        create: data.benefits
                    } : undefined,
                    prereqs: data.prereqs ? {
                        create: data.prereqs
                    } : undefined,
                    sourceBookInfo: {
                        create: data.sourceBookInfo?.map(source => ({
                            sourceBookId: source.sourceBookId,
                            pageNumber: source.pageNumber
                        })) || []
                    }
                },
            });

            return newFeat.id;
        });

        return { id: result.toString(), message: 'Feat created successfully' };
    },

    async updateFeat(query: FeatIdParamRequest, data: UpdateFeatRequest): Promise<UpdateResponse> {
        await prisma.$transaction(async (tx) => {
            // Handle prerequisites separately to avoid unique constraint issues
            if (data.prereqs) {
                // Delete existing prerequisites
                await tx.featPrerequisiteMap.deleteMany({
                    where: { featId: query.id }
                });

                // Create new prerequisites with proper indexing
                if (data.prereqs.length > 0) {
                    await tx.featPrerequisiteMap.createMany({
                        data: data.prereqs.map((prereq, index) => ({
                            featId: query.id,
                            typeId: prereq.typeId,
                            referenceId: prereq.referenceId,
                            amount: prereq.amount,
                            index: index
                        }))
                    });
                }
            }

            // Handle benefits separately
            if (data.benefits) {
                // Delete existing benefits
                await tx.featBenefitMap.deleteMany({
                    where: { featId: query.id }
                });

                // Create new benefits with proper indexing
                if (data.benefits.length > 0) {
                    await tx.featBenefitMap.createMany({
                        data: data.benefits.map((benefit, index) => ({
                            featId: query.id,
                            typeId: benefit.typeId,
                            referenceId: benefit.referenceId,
                            amount: benefit.amount,
                            index: index
                        }))
                    });
                }
            }

            // Handle source book info separately
            if (data.sourceBookInfo) {
                // Delete existing source book info
                await tx.featSourceBookMap.deleteMany({
                    where: { featId: query.id }
                });

                // Create new source book info
                if (data.sourceBookInfo.length > 0) {
                    await tx.featSourceBookMap.createMany({
                        data: data.sourceBookInfo.map(source => ({
                            featId: query.id,
                            sourceBookId: source.sourceBookId,
                            pageNumber: source.pageNumber
                        }))
                    });
                }
            }

            // Update the main feat record (excluding the relationship fields)
            const { benefits, prereqs, sourceBookInfo, ...featData } = data;
            const updatedFeat = await tx.feat.update({
                where: { id: query.id },
                data: featData
            });

            return updatedFeat;
        });

        return { message: 'Feat updated successfully' };
    },

    async deleteFeat(query: FeatIdParamRequest): Promise<UpdateResponse> {
        await prisma.feat.delete({
            where: { id: query.id },
        });
        return { message: 'Feat deleted successfully' };
    },

    async getFeatCache(query: FeatQueryRequest): Promise<FeatCacheResponse> {
        let whereClause: Prisma.FeatWhereInput = {};
        if (query.queryType === 'proficiency') {
            whereClause = {
                benefits: {
                    some: {
                        typeId: FeatBenefitType.PROFICIENCY
                    }
                }
            }
        }
        const feats = await prisma.feat.findMany({
            where: whereClause,
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                editionId: true,
                isVisible: true,
                typeId: true,
                fighterBonus: true,
                useSubId: true,
            }
        });

        return {
            total: feats.length,
            results: feats,
        };
    },

    async getAllFeatsFull(): Promise<FeatQueryResponse> {
        const [feats] = await Promise.all([
            prisma.feat.findMany({
                include: {
                    benefits: true,
                    prereqs: true,
                    sourceBookInfo: {
                        select: {
                            sourceBookId: true,
                            pageNumber: true
                        }
                    }
                },
                orderBy: { name: 'asc' },
            }),
            prisma.feat.count(),
        ]);

        return {
            total: feats.length,
            results: feats,
        };
    },
}; 

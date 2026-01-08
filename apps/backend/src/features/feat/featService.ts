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
import { FeatBenefitType, FeatureSourceType, EntityAppliesToType, EntityType } from '@shared/static-data';

import type { FeatService } from './types';
import { featureSystemService } from '../featureSystem/index';


const prisma = new PrismaClient();

export const featService: FeatService = {
    async getAllFeats(): Promise<GetAllFeatsResponse> {
        const [feats] = await Promise.all([
            prisma.feat.findMany({
                orderBy: { name: 'asc' },
                select: {
                    id: true,
                    name: true,
                    typeId: true,
                    description: true,
                    benefit: true,
                    summary: true,
                    normalEffect: true,
                    specialEffect: true,
                    prerequisites: true,
                    repeatable: true,
                    fighterBonus: true,
                    useSubId: true,
                    isVisible: true,
                    editionId: true,
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
        let featIds: number[] | undefined = undefined;

        if (query.queryType === 'proficiency') {
            // Query FeatureProgression to find feats with proficiency entities
            const progressions = await prisma.featureProgression.findMany({
                where: {
                    sourceType: FeatureSourceType.Feat,
                    entities: {
                        some: {
                            appliesTo: EntityAppliesToType.Feat,
                            type: EntityType.Proficiency,
                        }
                    }
                },
                select: {
                    featId: true,
                }
            });

            featIds = progressions
                .map(p => p.featId)
                .filter((id): id is number => id !== null);
        }

        const whereClause: Prisma.FeatWhereInput = featIds && featIds.length > 0
            ? { id: { in: featIds } }
            : {};

        // For 'all' query type, no where clause is needed - get all feats
        const [feats] = await Promise.all([
            prisma.feat.findMany({
                where: whereClause,
                include: {
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
        let featIds: number[] | undefined = undefined;

        if (query.queryType === 'proficiency') {
            // Query FeatureProgression to find feats with proficiency entities
            const progressions = await prisma.featureProgression.findMany({
                where: {
                    sourceType: FeatureSourceType.Feat,
                    entities: {
                        some: {
                            appliesTo: EntityAppliesToType.Feat,
                            type: EntityType.Proficiency,
                        }
                    }
                },
                select: {
                    featId: true,
                }
            });

            featIds = progressions
                .map(p => p.featId)
                .filter((id): id is number => id !== null);
        }

        const whereClause: Prisma.FeatWhereInput = featIds && featIds.length > 0
            ? { id: { in: featIds } }
            : {};

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
                sourceBookInfo: {
                    select: {
                        sourceBookId: true,
                        pageNumber: true
                    }
                }
            },
        });

        if (!feat) {
            return null;
        }

        // Get fully populated feature progressions using the feature system service
        const progressions = await featureSystemService.getFeatureProgressionsByFeatIds([query.id]);

        // Attach progressions to the feat object
        return {
            ...feat,
            featureProgressions: progressions,
        } as Feat;
    },

    async createFeat(data: CreateFeatRequest): Promise<CreateResponse> {
        const result = await prisma.$transaction(async (tx) => {
            // benefits and prereqs are no longer part of the Feat model - handled via Feature system
            const { sourceBookInfo, ...featData } = data;
            const newFeat = await tx.feat.create({
                data: {
                    ...featData,
                    sourceBookInfo: {
                        create: sourceBookInfo?.map(source => ({
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
            // benefits and prereqs are no longer part of the Feat model - handled via Feature system
            const { sourceBookInfo, ...featData } = data;

            // Handle source book info separately
            if (sourceBookInfo) {
                // Delete existing source book info
                await tx.featSourceBookMap.deleteMany({
                    where: { featId: query.id }
                });

                // Create new source book info
                if (sourceBookInfo.length > 0) {
                    await tx.featSourceBookMap.createMany({
                        data: sourceBookInfo.map(source => ({
                            featId: query.id,
                            sourceBookId: source.sourceBookId,
                            pageNumber: source.pageNumber
                        }))
                    });
                }
            }

            // Update the main feat record
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
        let featIds: number[] | undefined = undefined;

        if (query.queryType === 'proficiency') {
            // Query FeatureProgression to find feats with proficiency entities
            const progressions = await prisma.featureProgression.findMany({
                where: {
                    sourceType: FeatureSourceType.Feat,
                    entities: {
                        some: {
                            appliesTo: EntityAppliesToType.Feat,
                            type: EntityType.Proficiency,
                        }
                    }
                },
                select: {
                    featId: true,
                }
            });

            featIds = progressions
                .map(p => p.featId)
                .filter((id): id is number => id !== null);
        }

        const whereClause: Prisma.FeatWhereInput = featIds && featIds.length > 0
            ? { id: { in: featIds } }
            : {};

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

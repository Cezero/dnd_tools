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
    FeatCacheResponse,
    GetAllFeatsWithFeatureInfoResponse
} from '@shared/schema';
import { FeatureSourceType, EntityAppliesToType, EntityType } from '@shared/static-data';

import type { FeatService } from './types';
import { featureSystemService } from '../featureSystem/index';
import type { FeatureProgressionContext } from '../featureSystem/types';


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

    /**
     * Get all feats with feature information (description and summary).
     * 
     * This method returns a lightweight schema containing only:
     * - id: from Feat.id
     * - name: from Feat.name
     * - description: from the associated Feature.description (via FeatureProgression)
     * - summary: from the associated Feature.summary (via FeatureProgression)
     * 
     * IMPORTANT: This is a composite schema where:
     * - id and name come from the Feat table
     * - description and summary come from the associated Feature table
     * 
     * If a feat has no associated feature, description and summary will be null.
     * If a feat has multiple feature progressions, the first one's feature is used.
     * 
     * This endpoint is optimized for list views where full feat data and progressions
     * are not needed, but feature description/summary are required for display.
     */
    async getAllFeatsWithFeatureInfo(): Promise<GetAllFeatsWithFeatureInfoResponse> {
        // Get all feats
        const feats = await prisma.feat.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: { name: 'asc' },
        });

        // Get all feat IDs
        const featIds = feats.map(f => f.id);

        if (featIds.length === 0) {
            return {
                total: 0,
                results: [],
            };
        }

        // Get feature progressions for all feats
        const progressions = await featureSystemService.getFeatureProgressionsByFeatIds(featIds);

        // Create a map of featId -> feature (using first progression if multiple exist)
        const featFeatureMap = new Map<number, { description: string | null; summary: string | null }>();
        for (const progression of progressions) {
            if (progression.featId && progression.feature) {
                // Only set if not already set (use first progression)
                if (!featFeatureMap.has(progression.featId)) {
                    featFeatureMap.set(progression.featId, {
                        description: progression.feature.description || null,
                        summary: progression.feature.summary || null,
                    });
                }
            }
        }

        // Combine feat data with feature info
        const results = feats.map(feat => {
            const featureInfo = featFeatureMap.get(feat.id);
            return {
                id: feat.id,
                name: feat.name,
                description: featureInfo?.description ?? null,
                summary: featureInfo?.summary ?? null,
            };
        });

        return {
            total: results.length,
            results,
        };
    },

    async featQuery(query: FeatQueryRequest): Promise<FeatQueryResponse> {
        // All feats are returned - proficiency feats are identified via FeatureProgressions, not query filtering
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

    async getFeatList(query: FeatQueryRequest): Promise<GetFeatListResponse> {
        // All feats are returned - proficiency feats are identified via FeatureProgressions, not query filtering
        const feats = await prisma.feat.findMany({
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
            const { sourceBookInfo, featureProgressions, ...featData } = data;
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

            // Create feature progressions if provided
            if (featureProgressions && featureProgressions.length > 0) {
                const context: FeatureProgressionContext = { featId: newFeat.id };
                await featureSystemService.createMultipleFeatureProgressions(featureProgressions, context, tx);
            }

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
        // All feats are returned - proficiency feats are identified via FeatureProgressions, not query filtering
        const feats = await prisma.feat.findMany({
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

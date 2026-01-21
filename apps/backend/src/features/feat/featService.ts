import { Prisma, PrismaClient } from '@shared/prisma-client';
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
    GetAllFeatsWithFeatureInfoResponse,
    GetFeatByIdResponse,
} from '@shared/schema';

import type { FeatService } from './types';
import { featureSystemService } from '../featureSystem/index';
import type { FeatureContext } from '../featureSystem/types';


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
     * - description: from the associated Feature.description (via FeatureWithRelations)
     * - summary: from the associated Feature.summary (via FeatureWithRelations)
     * 
     * IMPORTANT: This is a composite schema where:
     * - id and name come from the Feat table
     * - description and summary come from the associated Feature table
     * 
     * If a feat has no associated feature, description and summary will be null.
     * If a feat has multiple feature features, the first one's feature is used.
     * 
     * This endpoint is optimized for list views where full feat data and features
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

        // Get feature features for all feats
        const features = await featureSystemService.getFeaturesByFeatIds(featIds);

        // Create a map of featId -> feature (using first feature if multiple exist)
        const featFeatureMap = new Map<number, { description: string | null; summary: string | null }>();
        for (const feature of features) {
            if (feature.featId) {
                // Only set if not already set (use first feature)
                if (!featFeatureMap.has(feature.featId)) {
                    featFeatureMap.set(feature.featId, {
                        description: feature.description || null,
                        summary: feature.summary || null,
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

    async getFeatById(query: FeatIdParamRequest): Promise<GetFeatByIdResponse | null> {
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

        // Get fully populated feature features using the feature system service
        const features = await featureSystemService.getFeaturesByFeatIds([query.id]);

        // Attach features to the feat object
        return {
            ...feat,
            features: features,
        } as GetFeatByIdResponse;
    },

    async createFeat(data: CreateFeatRequest): Promise<CreateResponse> {
        const result = await prisma.$transaction(async (tx) => {
            // benefits and prereqs are no longer part of the Feat model - handled via Feature system
            const { sourceBookInfo, features, ...featData } = data;
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

            // Create feature features if provided
            if (features && features.length > 0) {
                const context: FeatureContext = { featId: newFeat.id };
                await featureSystemService.createMultipleFeatures(features, context, tx);
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

    async getFeatCache(_query?: FeatQueryRequest): Promise<FeatCacheResponse> {
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

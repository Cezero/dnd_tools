import { PrismaClient } from '@shared/prisma-client';
import {
    GetAllFeaturesResponse,
    CreateFeatureRequest,
    UpdateFeatureRequest,
    FeatureIdParamRequest,
    GetFeatureResponse,
    CreateResponse,
    UpdateResponse,
    CreateFeatureProgressionRequest,
} from '@shared/schema';

import type { FeatureSystemService } from './types';

const prisma = new PrismaClient();

export const featureSystemService: FeatureSystemService = {
    // Core Feature CRUD operations
    async getAllFeatures(sourceType?: number): Promise<GetAllFeaturesResponse> {
        let whereClause = {};

        if (sourceType !== undefined) {
            // Filter features that have progressions with the specified source type
            whereClause = {
                progressions: {
                    some: {
                        sourceType: sourceType
                    }
                }
            };
        }

        const [features] = await Promise.all([
            prisma.feature.findMany({
                where: whereClause,
                orderBy: { slug: 'asc' },
            }),
            prisma.feature.count({
                where: whereClause,
            }),
        ]);

        return {
            total: features.length,
            results: features,
        };
    },

    async getFeatureById(query: FeatureIdParamRequest): Promise<GetFeatureResponse | null> {
        const feature = await prisma.feature.findUnique({
            where: { id: query.id },
            include: {
                prerequisites: true, // Include prerequisites
            },
        });

        return feature as GetFeatureResponse;
    },

    async createFeature(data: CreateFeatureRequest): Promise<CreateResponse> {
        // Extract prerequisites from data
        const { prerequisites, ...featureData } = data;

        const result = await prisma.$transaction(async (tx) => {
            // Create the feature first
            const feature = await tx.feature.create({
                data: {
                    name: featureData.name,
                    slug: featureData.slug,
                    description: featureData.description || '',
                },
            });

            // Create prerequisites if any
            if (prerequisites && prerequisites.length > 0) {
                await tx.featurePrerequisite.createMany({
                    data: prerequisites.map(prereq => ({
                        ...prereq,
                        featureId: feature.id,
                    })),
                });
            }

            return feature;
        });

        return { id: result.id.toString(), message: 'Feature created successfully' };
    },

    async updateFeature(query: FeatureIdParamRequest, data: UpdateFeatureRequest): Promise<UpdateResponse> {
        // Extract prerequisites from data
        const { prerequisites, ...featureData } = data;

        await prisma.$transaction(async (tx) => {
            // Update the feature
            await tx.feature.update({
                where: { id: query.id },
                data: {
                    name: featureData.name,
                    slug: featureData.slug,
                    description: featureData.description,
                },
            });

            // Handle prerequisites if provided
            if (prerequisites !== undefined) {
                // Delete existing prerequisites
                await tx.featurePrerequisite.deleteMany({
                    where: { featureId: query.id },
                });

                // Create new prerequisites if any
                if (prerequisites.length > 0) {
                    const feature = await tx.feature.findUnique({
                        where: { id: query.id },
                        select: { id: true },
                    });

                    if (feature) {
                        await tx.featurePrerequisite.createMany({
                            data: prerequisites.map(prereq => ({
                                ...prereq,
                                featureId: feature.id,
                            })),
                        });
                    }
                }
            }
        });

        return { message: 'Feature updated successfully' };
    },

    async updateFeatureById(query: FeatureIdParamRequest, data: UpdateFeatureRequest): Promise<UpdateResponse> {
        // Extract prerequisites from data
        const { prerequisites, ...featureData } = data;

        await prisma.$transaction(async (tx) => {
            // Update the feature
            await tx.feature.update({
                where: { id: query.id },
                data: {
                    name: featureData.name,
                    slug: featureData.slug,
                    description: featureData.description,
                },
            });

            // Handle prerequisites if provided
            if (prerequisites !== undefined) {
                // Delete existing prerequisites
                await tx.featurePrerequisite.deleteMany({
                    where: { featureId: query.id },
                });

                // Create new prerequisites if any
                if (prerequisites.length > 0) {
                    await tx.featurePrerequisite.createMany({
                        data: prerequisites.map(prereq => ({
                            ...prereq,
                            featureId: query.id,
                        })),
                    });
                }
            }
        });

        return { message: 'Feature updated successfully' };
    },

    async deleteFeature(query: FeatureIdParamRequest): Promise<UpdateResponse> {
        await prisma.feature.delete({
            where: { id: query.id },
        });

        return { message: 'Feature deleted successfully' };
    },

    async deleteFeatureById(query: FeatureIdParamRequest): Promise<UpdateResponse> {
        await prisma.feature.delete({
            where: { id: query.id },
        });

        return { message: 'Feature deleted successfully' };
    },

    // Bulk Feature Progression management (for class/race creation)
    async createFeatureProgressionWithRelations(data: CreateFeatureProgressionRequest): Promise<CreateResponse> {
        const { modifiers, choices, effects, ...progressionData } = data;

        const result = await prisma.$transaction(async (tx) => {
            // Create the feature progression
            const featureProgression = await tx.featureProgression.create({
                data: progressionData,
            });

            // Create related modifiers
            if (modifiers && modifiers.length > 0) {
                for (const modifier of modifiers) {
                    const { conditions, formulaParams, ...modifierData } = modifier;

                    // Create the modifier
                    const createdModifier = await tx.featureModifier.create({
                        data: {
                            ...modifierData,
                            featureProgressionId: featureProgression.id,
                        },
                    });

                    // Create related formula params if any
                    if (formulaParams) {
                        await tx.featureModifierFormulaParams.create({
                            data: {
                                ...formulaParams,
                                featureModifier: {
                                    connect: { id: createdModifier.id }
                                }
                            },
                        });
                    }

                    // Create related conditions if any
                    if (conditions && conditions.length > 0) {
                        await tx.featureModifierCondition.createMany({
                            data: conditions.map(condition => ({
                                ...condition,
                                featureModifierId: createdModifier.id,
                            })),
                        });
                    }
                }
            }

            // Create related choices
            if (choices && choices.length > 0) {
                await tx.featureChoice.createMany({
                    data: choices.map(choice => ({
                        ...choice,
                        progressionId: featureProgression.id,
                    })),
                });
            }

            // Create related effects
            if (effects && effects.length > 0) {
                await tx.featureSpecialEffect.createMany({
                    data: effects.map(effect => ({
                        ...effect,
                        progressionId: featureProgression.id,
                        featId: effect.featId || null,
                        itemId: effect.itemId || null,
                    })),
                });
            }

            return featureProgression;
        });

        return { id: result.id.toString(), message: 'Feature progression created successfully' };
    },
}; 

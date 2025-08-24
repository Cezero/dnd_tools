import { PrismaClient, Prisma } from '@shared/prisma-client';
import {
    GetAllFeaturesResponse,
    CreateFeatureRequest,
    UpdateFeatureRequest,
    FeatureIdParamRequest,
    GetFeatureResponse,
    CreateResponse,
    UpdateResponse,
    CreateFeatureProgressionRequest,
    FeatureProgressionWithRelations,
} from '@shared/schema';

import type { FeatureSystemService } from './types';
import { transformFormulaParamsForDatabase, transformFormulaParamsFromDatabase } from '../../utils/formulaParamTransformers';


const prisma = new PrismaClient();

export const featureSystemService: FeatureSystemService = {
    // Core Feature CRUD operations
    async getAllFeatures(sourceType?: number): Promise<GetAllFeaturesResponse> {
        let whereClause: Prisma.FeatureWhereInput = {
            // Always filter out special features (IDs 1-5)
            id: {
                notIn: [1, 2, 3, 4, 5]
            }
        };

        if (sourceType !== undefined) {
            // If sourceType is specified, filter by source type (for ClassList/RaceList)
            whereClause.progressions = {
                some: {
                    sourceType: sourceType
                }
            };
        } else {
            // If no sourceType specified, also filter out features associated with classes/races (for standalone features)
            whereClause.progressions = {
                none: {
                    OR: [
                        { classId: { not: null } },
                        { raceId: { not: null } }
                    ]
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

    async deleteFeature(query: { id: number }): Promise<UpdateResponse> {
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
                        // Transform arrays to strings for database storage
                        const dbFormulaParams = transformFormulaParamsForDatabase(formulaParams);
                        await tx.featureFormulaParams.create({
                            data: {
                                ...dbFormulaParams,
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
                for (const choice of choices) {
                    const { formulaParams, ...choiceData } = choice;

                    // Create formula params first if they exist
                    let formulaParamsId = null;
                    if (formulaParams) {
                        // Transform arrays to strings for database storage
                        const dbFormulaParams = transformFormulaParamsForDatabase(formulaParams);
                        const createdFormulaParams = await tx.featureFormulaParams.create({
                            data: dbFormulaParams,
                        });
                        formulaParamsId = createdFormulaParams.id;
                    }

                    // Create the choice with formula params reference
                    await tx.featureChoice.create({
                        data: {
                            ...choiceData,
                            progressionId: featureProgression.id,
                            formulaParamsId: formulaParamsId,
                        },
                    });
                }
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

    // Consolidated method for creating multiple feature progressions (used by class/race services)
    async createMultipleFeatureProgressions(
        progressions: CreateFeatureProgressionRequest[],
        context: { classId?: number; raceId?: number },
        tx?: Prisma.TransactionClient
    ): Promise<void> {
        if (!progressions || progressions.length === 0) {
            return;
        }

        const executeTransaction = async (transactionClient: Prisma.TransactionClient) => {
            for (const progression of progressions) {
                const { modifiers, choices, effects, ...progressionData } = progression;

                // Create the feature progression with context
                const featureProgression = await transactionClient.featureProgression.create({
                    data: {
                        ...progressionData,
                        classId: context.classId || null,
                        raceId: context.raceId || null,
                    },
                });

                // Create related modifiers
                if (modifiers && modifiers.length > 0) {
                    for (const modifier of modifiers) {
                        const { conditions, formulaParams, ...modifierData } = modifier;

                        // Create formula params first if they exist
                        let formulaParamsId = null;
                        if (formulaParams) {
                            // Transform arrays to strings for database storage
                            const dbFormulaParams = transformFormulaParamsForDatabase(formulaParams);
                            const createdFormulaParams = await transactionClient.featureFormulaParams.create({
                                data: dbFormulaParams,
                            });
                            formulaParamsId = createdFormulaParams.id;
                        }

                        // Create the modifier with formula params reference
                        const createdModifier = await transactionClient.featureModifier.create({
                            data: {
                                ...modifierData,
                                featureProgressionId: featureProgression.id,
                                formulaParamsId: formulaParamsId,
                            },
                        });

                        // Create related conditions if any
                        if (conditions && conditions.length > 0) {
                            await transactionClient.featureModifierCondition.createMany({
                                data: conditions.map(condition => {
                                    // Ensure conditionValue is always an integer for database compatibility
                                    const intValue = condition.conditionValue != null ? Number(condition.conditionValue) : 0;
                                    return {
                                        conditionType: condition.conditionType,
                                        conditionValue: intValue,
                                        featureModifierId: createdModifier.id,
                                    };
                                }),
                            });
                        }
                    }
                }

                // Create related choices
                if (choices && choices.length > 0) {
                    for (const choice of choices) {
                        const { formulaParams, ...choiceData } = choice;

                        // Create formula params first if they exist and have a formulaId
                        let formulaParamsId = null;
                        if (formulaParams && formulaParams.formulaId !== null) {
                            // Transform arrays to strings for database storage
                            const dbFormulaParams = transformFormulaParamsForDatabase(formulaParams);
                            const createdFormulaParams = await transactionClient.featureFormulaParams.create({
                                data: dbFormulaParams,
                            });
                            formulaParamsId = createdFormulaParams.id;
                        }

                        // Create the choice with formula params reference
                        await transactionClient.featureChoice.create({
                            data: {
                                ...choiceData,
                                progressionId: featureProgression.id,
                                formulaParamsId: formulaParamsId,
                            },
                        });
                    }
                }

                // Create related effects
                if (effects && effects.length > 0) {
                    await transactionClient.featureSpecialEffect.createMany({
                        data: effects.map(effect => ({
                            ...effect,
                            progressionId: featureProgression.id,
                            featId: effect.featId || null,
                            itemId: effect.itemId || null,
                        })),
                    });
                }
            }
        };

        if (tx) {
            // Use provided transaction
            await executeTransaction(tx);
        } else {
            // Create new transaction
            await prisma.$transaction(executeTransaction, {
                timeout: 30000 // Increase timeout to 30 seconds
            });
        }
    },

    // Consolidated method for deleting feature progressions (used by class/race services)
    async deleteFeatureProgressionsForContext(
        context: { classId?: number; raceId?: number },
        tx?: Prisma.TransactionClient
    ): Promise<void> {
        const whereClause: { classId?: number; raceId?: number } = {};
        if (context.classId) {
            whereClause.classId = context.classId;
        }
        if (context.raceId) {
            whereClause.raceId = context.raceId;
        }

        if (Object.keys(whereClause).length === 0) {
            return;
        }

        const executeTransaction = async (transactionClient: Prisma.TransactionClient) => {
            // Find existing progressions
            const existingProgressions = await transactionClient.featureProgression.findMany({
                where: whereClause,
                select: { id: true }
            });

            if (existingProgressions.length > 0) {
                const progressionIds = existingProgressions.map((p: { id: number }) => p.id);

                // Collect existing formula params before deleting modifiers and choices
                const existingModifiers = await transactionClient.featureModifier.findMany({
                    where: { featureProgressionId: { in: progressionIds } },
                    select: { formulaParamsId: true }
                });

                const existingChoices = await transactionClient.featureChoice.findMany({
                    where: { progressionId: { in: progressionIds } },
                    select: { formulaParamsId: true }
                });

                const existingFormulaParamIds = [
                    ...existingModifiers.map((m: { formulaParamsId: number | null }) => m.formulaParamsId),
                    ...existingChoices.map((c: { formulaParamsId: number | null }) => c.formulaParamsId)
                ].filter((id: number | null): id is number => id !== null);

                // Delete related entities first (in correct order to respect foreign key constraints)
                // First, get the modifier IDs to delete their conditions
                const modifierIds = await transactionClient.featureModifier.findMany({
                    where: { featureProgressionId: { in: progressionIds } },
                    select: { id: true }
                });

                const modifierIdList = modifierIds.map(m => m.id);

                // Delete conditions first (they reference modifiers)
                if (modifierIdList.length > 0) {
                    await transactionClient.featureModifierCondition.deleteMany({
                        where: { featureModifierId: { in: modifierIdList } }
                    });
                }

                // Then delete modifiers
                await transactionClient.featureModifier.deleteMany({
                    where: { featureProgressionId: { in: progressionIds } }
                });
                await transactionClient.featureChoice.deleteMany({
                    where: { progressionId: { in: progressionIds } }
                });
                await transactionClient.featureSpecialEffect.deleteMany({
                    where: { progressionId: { in: progressionIds } }
                });

                // Delete orphaned formula params
                if (existingFormulaParamIds.length > 0) {
                    await transactionClient.featureFormulaParams.deleteMany({
                        where: { id: { in: existingFormulaParamIds } }
                    });
                }

                // Delete the progressions
                await transactionClient.featureProgression.deleteMany({
                    where: whereClause
                });
            }
        };

        if (tx) {
            // Use provided transaction
            await executeTransaction(tx);
        } else {
            // Create new transaction
            await prisma.$transaction(executeTransaction, {
                timeout: 30000 // Increase timeout to 30 seconds
            });
        }
    },

    async updateFeatureProgressions(featureId: number, progressions: CreateFeatureProgressionRequest[]): Promise<UpdateResponse> {
        await prisma.$transaction(async (tx) => {
            // Delete existing progressions for this feature
            const existingProgressions = await tx.featureProgression.findMany({
                where: { featureId },
                select: { id: true }
            });

            if (existingProgressions.length > 0) {
                const progressionIds = existingProgressions.map(p => p.id);

                // Collect existing formula params before deleting modifiers
                const existingModifiers = await tx.featureModifier.findMany({
                    where: { featureProgressionId: { in: progressionIds } },
                    select: { formulaParamsId: true }
                });

                const existingFormulaParamIds = existingModifiers
                    .map(m => m.formulaParamsId)
                    .filter(id => id !== null) as number[];

                // Delete related entities first (in correct order to respect foreign key constraints)
                // First, get the modifier IDs to delete their conditions
                const modifierIds = await tx.featureModifier.findMany({
                    where: { featureProgressionId: { in: progressionIds } },
                    select: { id: true }
                });

                const modifierIdList = modifierIds.map(m => m.id);

                // Delete conditions first (they reference modifiers)
                if (modifierIdList.length > 0) {
                    await tx.featureModifierCondition.deleteMany({
                        where: { featureModifierId: { in: modifierIdList } }
                    });
                }

                // Then delete modifiers
                await tx.featureModifier.deleteMany({
                    where: { featureProgressionId: { in: progressionIds } }
                });
                await tx.featureChoice.deleteMany({
                    where: { progressionId: { in: progressionIds } }
                });
                await tx.featureSpecialEffect.deleteMany({
                    where: { progressionId: { in: progressionIds } }
                });

                // Delete orphaned formula params
                if (existingFormulaParamIds.length > 0) {
                    await tx.featureFormulaParams.deleteMany({
                        where: { id: { in: existingFormulaParamIds } }
                    });
                }

                // Delete the progressions
                await tx.featureProgression.deleteMany({
                    where: { featureId }
                });
            }

            // Create new progressions
            if (progressions && progressions.length > 0) {
                for (const progression of progressions) {
                    const { modifiers, choices, effects, ...progressionData } = progression;

                    // Create the feature progression
                    const featureProgression = await tx.featureProgression.create({
                        data: {
                            sourceType: progressionData.sourceType,
                            level: progressionData.level,
                            featureId,
                            classId: progressionData.classId || null,
                            raceId: progressionData.raceId || null,
                        },
                    });

                    // Create related modifiers
                    if (modifiers && modifiers.length > 0) {
                        for (const modifier of modifiers) {
                            const { conditions, formulaParams, ...modifierData } = modifier;

                            // Create formula params first if they exist
                            let formulaParamsId = null;
                            if (formulaParams) {
                                // Transform arrays to strings for database storage
                                const dbFormulaParams = transformFormulaParamsForDatabase(formulaParams);
                                const createdFormulaParams = await tx.featureFormulaParams.create({
                                    data: dbFormulaParams,
                                });
                                formulaParamsId = createdFormulaParams.id;
                            }

                            // Create the modifier
                            const createdModifier = await tx.featureModifier.create({
                                data: {
                                    ...modifierData,
                                    featureProgressionId: featureProgression.id,
                                    formulaParamsId,
                                },
                            });

                            // Create related conditions
                            if (conditions && conditions.length > 0) {
                                await tx.featureModifierCondition.createMany({
                                    data: conditions.map((condition) => ({
                                        ...condition,
                                        featureModifierId: createdModifier.id,
                                    })),
                                });
                            }
                        }
                    }

                    // Create related choices
                    if (choices && choices.length > 0) {
                        for (const choice of choices) {
                            const { formulaParams, ...choiceData } = choice;

                            // Create formula params first if they exist
                            let formulaParamsId = null;
                            if (formulaParams) {
                                // Transform arrays to strings for database storage
                                const dbFormulaParams = transformFormulaParamsForDatabase(formulaParams);
                                const createdFormulaParams = await tx.featureFormulaParams.create({
                                    data: dbFormulaParams,
                                });
                                formulaParamsId = createdFormulaParams.id;
                            }

                            // Create the choice with formula params reference
                            await tx.featureChoice.create({
                                data: {
                                    ...choiceData,
                                    progressionId: featureProgression.id,
                                    formulaParamsId: formulaParamsId,
                                },
                            });
                        }
                    }

                    // Create related effects
                    if (effects && effects.length > 0) {
                        await tx.featureSpecialEffect.createMany({
                            data: effects.map((effect) => ({
                                ...effect,
                                progressionId: featureProgression.id,
                                featId: effect.featId || null,
                                itemId: effect.itemId || null,
                            })),
                        });
                    }
                }
            }
        });

        return { message: 'Feature progressions updated successfully' };
    },

    async getFeatureProgressions(featureId: number): Promise<FeatureProgressionWithRelations[]> {
        const progressions = await prisma.featureProgression.findMany({
            where: { featureId },
            include: {
                feature: {
                    select: {
                        id: true,
                        slug: true,
                        name: true,
                        description: true,
                        prerequisites: true
                    }
                },
                modifiers: {
                    include: {
                        formulaParams: true,
                        conditions: true
                    }
                },
                choices: {
                    include: {
                        feat: {
                            select: {
                                id: true,
                                name: true
                            }
                        },
                        feature: {
                            select: {
                                id: true,
                                name: true,
                                slug: true
                            }
                        },
                        formulaParams: true
                    }
                },
                effects: {
                    include: {
                        feat: true,
                        item: true
                    }
                }
            }
        });

        // Transform formula parameters from strings to arrays for frontend consumption
        const transformedProgressions = progressions.map(progression => ({
            ...progression,
            modifiers: progression.modifiers?.map(modifier => ({
                ...modifier,
                formulaParams: modifier.formulaParams
                    ? transformFormulaParamsFromDatabase(modifier.formulaParams)
                    : null
            })),
            choices: progression.choices?.map(choice => ({
                ...choice,
                formulaParams: choice.formulaParams
                    ? transformFormulaParamsFromDatabase(choice.formulaParams)
                    : null
            }))
        }));

        return transformedProgressions as FeatureProgressionWithRelations[];
    },
}; 

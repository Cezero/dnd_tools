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
    UpdateFeatureProgression,
    FeatureProgression,
    GetFeatureListResponse,
    CreateFeatureEntityRequest,
    CreateFeatureEntityConditionRequest,
} from '@shared/schema';
import { EntityAppliesToType, SpecialFeatureId, FeatureSourceType } from '@shared/static-data';

import type { FeatureSystemService, FeatureProgressionContext } from './types';
import { transformFormulaParamsForDatabaseCreate, transformFormulaParamsFromDatabase } from '../../utils/formulaParamTransformers';


const prisma = new PrismaClient();

/**
 * Helper function to create related entities for a feature progression
 */
async function createRelatedEntities(
    transactionClient: Prisma.TransactionClient,
    entities: CreateFeatureEntityRequest[] | undefined,
    featureProgressionId: number
): Promise<void> {
    if (!entities || entities.length === 0) {
        return;
    }

    for (const entity of entities) {
        const { conditions, formulaParams, ...entityData } = entity;

        // Create formula params first if they exist
        let formulaParamsId = null;
        if (formulaParams) {
            // Transform arrays to strings for database storage
            const dbFormulaParams = transformFormulaParamsForDatabaseCreate(formulaParams);
            const createdFormulaParams = await transactionClient.featureFormulaParams.create({
                data: dbFormulaParams,
            });
            formulaParamsId = createdFormulaParams.id;
        }

        // Create the entity with formula params reference
        const createdEntity = await transactionClient.featureEntity.create({
            data: {
                ...entityData,
                progressionId: featureProgressionId,
                formulaParamsId: formulaParamsId,
            },
        });

        // Create related conditions if any
        if (conditions && conditions.length > 0) {
            await transactionClient.featureEntityCondition.createMany({
                data: conditions.map((condition: CreateFeatureEntityConditionRequest) => {
                    // Ensure conditionValue is always an integer for database compatibility
                    const intValue = condition.conditionValue != null ? Number(condition.conditionValue) : 0;
                    return {
                        ...condition,
                        featureEntityId: createdEntity.id,
                        conditionValue: intValue,
                    };
                }),
            });
        }
    }
}

/**
 * Helper function to create display conditions for a feature progression
 */
async function createDisplayConditions(
    transactionClient: Prisma.TransactionClient,
    displayConditions: Array<{ conditionType: number; conditionValue: number; id?: number; progressionId?: number }> | undefined,
    featureProgressionId: number
): Promise<void> {
    if (!displayConditions || displayConditions.length === 0) {
        return;
    }

    await transactionClient.featureProgressionCondition.createMany({
        data: displayConditions.map((condition) => ({
            progressionId: featureProgressionId,
            conditionType: condition.conditionType,
            conditionValue: condition.conditionValue,
        })),
    });
}

// Helper function to create the special feature filter
function createSpecialFeatureFilter(): Prisma.FeatureWhereInput['id'] {
    return {
        notIn: [
            SpecialFeatureId.ClassSkill,
            SpecialFeatureId.ClassProficiency,
            SpecialFeatureId.AutomaticLanguage,
            SpecialFeatureId.BonusLanguage,
            SpecialFeatureId.AbilityAdjustment
        ]
    };
}

export const featureSystemService: FeatureSystemService = {
    // Core Feature CRUD operations
    async getAllFeatures(sourceTypes?: number[]): Promise<GetAllFeaturesResponse> {
        let whereClause: Prisma.FeatureWhereInput;

        if (sourceTypes && sourceTypes.length > 0) {
            // If sourceTypes are specified, show features with any of those sourceTypes AND orphaned features
            whereClause = {
                // Always filter out special features
                id: createSpecialFeatureFilter(),
                OR: [
                    // Features with progressions of any of the specified sourceTypes
                    {
                        progressions: {
                            some: {
                                sourceType: {
                                    in: sourceTypes
                                }
                            }
                        }
                    },
                    // Orphaned features (no progressions at all)
                    {
                        progressions: {
                            none: {}
                        }
                    }
                ]
            };
        } else {
            // If no sourceTypes specified, also filter out features associated with classes/races (for standalone features)
            whereClause = {
                // Always filter out special features
                id: createSpecialFeatureFilter(),
                progressions: {
                    none: {
                        OR: [
                            { classId: { not: null } },
                            { raceId: { not: null } }
                        ]
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

    async getFeatureList(sourceTypes?: number[]): Promise<GetFeatureListResponse> {
        let whereClause: Prisma.FeatureWhereInput;

        if (sourceTypes && sourceTypes.length > 0) {
            // If sourceTypes are specified, show features with any of those sourceTypes AND orphaned features
            whereClause = {
                // Always filter out special features
                id: createSpecialFeatureFilter(),
                OR: [
                    // Features with progressions of any of the specified sourceTypes
                    {
                        progressions: {
                            some: {
                                sourceType: {
                                    in: sourceTypes
                                }
                            }
                        }
                    },
                    // Orphaned features (no progressions at all)
                    {
                        progressions: {
                            none: {}
                        }
                    }
                ]
            };
        } else {
            // If no sourceTypes specified, also filter out features associated with classes/races (for standalone features)
            whereClause = {
                // Always filter out special features
                id: createSpecialFeatureFilter(),
                progressions: {
                    none: {
                        OR: [
                            { classId: { not: null } },
                            { raceId: { not: null } }
                        ]
                    }
                }
            };
        }

        const features = await prisma.feature.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
            },
            orderBy: { name: 'asc' },
        });

        return features;
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
                    summary: featureData.summary ?? null,
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
                    summary: featureData.summary ?? null,
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
        const { entities, displayConditions, ...progressionData } = data;

        const result = await prisma.$transaction(async (tx) => {
            // Create the feature progression
            const featureProgression = await tx.featureProgression.create({
                data: progressionData,
            });

            // Create related entities
            await createRelatedEntities(tx, entities, featureProgression.id);

            // Create display conditions
            await createDisplayConditions(tx, displayConditions, featureProgression.id);

            return featureProgression;
        });

        return { id: result.id.toString(), message: 'Feature progression created successfully' };
    },

    // Consolidated method for creating multiple feature progressions (used by class/race services)
    async createMultipleFeatureProgressions(
        progressions: CreateFeatureProgressionRequest[],
        context: FeatureProgressionContext,
        tx?: Prisma.TransactionClient
    ): Promise<void> {
        if (!progressions || progressions.length === 0) {
            return;
        }

        const executeTransaction = async (transactionClient: Prisma.TransactionClient) => {
            for (const progression of progressions) {
                const { entities, displayConditions, ...progressionData } = progression;

                // Determine sourceType from context (override progressionData.sourceType if present)
                let sourceType = progressionData.sourceType;
                if (context.raceId) {
                    sourceType = FeatureSourceType.Race;
                } else if (context.classId) {
                    sourceType = FeatureSourceType.Class;
                } else if (context.domainId) {
                    sourceType = FeatureSourceType.Domain;
                } else if (context.featId) {
                    sourceType = FeatureSourceType.Feat;
                } else if (context.variantOverrideId) {
                    sourceType = FeatureSourceType.ClassVariant;
                }
                // If no context matches, use progressionData.sourceType (fallback for Template, etc.)

                // Create the feature progression with context
                const featureProgression = await transactionClient.featureProgression.create({
                    data: {
                        ...progressionData,
                        sourceType, // Use determined sourceType
                        classId: context.classId || null,
                        raceId: context.raceId || null,
                        variantOverrideId: context.variantOverrideId || null,
                        domainId: context.domainId || null,
                        featId: context.featId || null,
                    },
                });

                // Create related entities
                await createRelatedEntities(transactionClient, entities, featureProgression.id);

                // Create display conditions
                await createDisplayConditions(transactionClient, displayConditions, featureProgression.id);

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


    // Consolidated method for deleting feature progressions (used by class/race/variant services)
    async deleteFeatureProgressionsForContext(
        context: FeatureProgressionContext,
        tx?: Prisma.TransactionClient
    ): Promise<void> {
        const whereClause: { classId?: number; raceId?: number; variantOverrideId?: number; domainId?: number; featId?: number } = {};
        if (context.classId) {
            whereClause.classId = context.classId;
        }
        if (context.raceId) {
            whereClause.raceId = context.raceId;
        }
        if (context.variantOverrideId) {
            whereClause.variantOverrideId = context.variantOverrideId;
        }
        if (context.domainId) {
            whereClause.domainId = context.domainId;
        }
        if (context.featId) {
            whereClause.featId = context.featId;
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

                // Collect existing formula params before deleting entities
                const existingEntities = await transactionClient.featureEntity.findMany({
                    where: { progressionId: { in: progressionIds } },
                    select: { formulaParamsId: true }
                });

                const existingFormulaParamIds = existingEntities
                    .map((e: { formulaParamsId: number | null }) => e.formulaParamsId)
                    .filter((id: number | null): id is number => id !== null);

                // Delete related entities first (in correct order to respect foreign key constraints)
                // First, get the entity IDs to delete their conditions
                const entityIds = await transactionClient.featureEntity.findMany({
                    where: { progressionId: { in: progressionIds } },
                    select: { id: true }
                });

                const entityIdList = entityIds.map(e => e.id);

                // Delete character feature choices first (they reference entities)
                if (entityIdList.length > 0) {
                    await transactionClient.characterFeatureChoice.deleteMany({
                        where: { featureEntityId: { in: entityIdList } }
                    });
                }

                // Delete conditions (they reference entities)
                if (entityIdList.length > 0) {
                    await transactionClient.featureEntityCondition.deleteMany({
                        where: { featureEntityId: { in: entityIdList } }
                    });
                }

                // Then delete entities
                await transactionClient.featureEntity.deleteMany({
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

    async updateFeatureProgressions(featureId: number, progressions: UpdateFeatureProgression[]): Promise<UpdateResponse> {
        await prisma.$transaction(async (tx) => {
            // Delete existing progressions for this feature
            const existingProgressions = await tx.featureProgression.findMany({
                where: { featureId },
                select: { id: true, level: true, sourceType: true }
            });

            if (existingProgressions.length > 0) {
                const progressionIds = existingProgressions.map(p => p.id);

                // CRITICAL: Preserve CharacterFeatureChoice records by collecting them before deletion
                // and migrating them to new entity IDs after recreation
                const existingCharacterChoices = await tx.characterFeatureChoice.findMany({
                    where: { progressionId: { in: progressionIds } },
                    include: {
                        featureEntity: {
                            select: {
                                id: true,
                                appliesTo: true,
                                appliesToId: true,
                                appliesToSubId: true,
                                type: true,
                                value: true,
                                bonusType: true,
                                groupingId: true,
                                progressionId: true,
                            }
                        }
                    }
                });

                // Create a mapping from old entity signatures to old entity IDs and their choices
                // Entity signature: combination of properties that uniquely identify an entity
                type EntitySignature = string;
                const entitySignatureMap = new Map<EntitySignature, {
                    oldEntityId: number;
                    oldProgressionId: number;
                    choices: typeof existingCharacterChoices;
                }>();

                for (const choice of existingCharacterChoices) {
                    const entity = choice.featureEntity;
                    // Create a signature based on entity properties (excluding ID)
                    const signature: EntitySignature = JSON.stringify({
                        appliesTo: entity.appliesTo,
                        appliesToId: entity.appliesToId,
                        appliesToSubId: entity.appliesToSubId,
                        type: entity.type,
                        value: entity.value,
                        bonusType: entity.bonusType,
                        groupingId: entity.groupingId,
                        progressionLevel: existingProgressions.find(p => p.id === entity.progressionId)?.level,
                        progressionSourceType: existingProgressions.find(p => p.id === entity.progressionId)?.sourceType,
                    });

                    if (!entitySignatureMap.has(signature)) {
                        entitySignatureMap.set(signature, {
                            oldEntityId: entity.id,
                            oldProgressionId: entity.progressionId,
                            choices: []
                        });
                    }
                    entitySignatureMap.get(signature)!.choices.push(choice);
                }

                // Collect existing formula params before deleting entities
                const existingEntities = await tx.featureEntity.findMany({
                    where: { progressionId: { in: progressionIds } },
                    select: { formulaParamsId: true }
                });

                const existingFormulaParamIds = existingEntities
                    .map(e => e.formulaParamsId)
                    .filter(id => id !== null) as number[];

                // Delete related entities first (in correct order to respect foreign key constraints)
                // First, get the entity IDs to delete their conditions
                const entityIds = await tx.featureEntity.findMany({
                    where: { progressionId: { in: progressionIds } },
                    select: { id: true }
                });

                const entityIdList = entityIds.map(e => e.id);

                // Delete character feature choices (we'll recreate them with new IDs)
                if (entityIdList.length > 0) {
                    await tx.characterFeatureChoice.deleteMany({
                        where: { featureEntityId: { in: entityIdList } }
                    });
                }

                // Delete conditions (they reference entities)
                if (entityIdList.length > 0) {
                    await tx.featureEntityCondition.deleteMany({
                        where: { featureEntityId: { in: entityIdList } }
                    });
                }

                // Then delete entities
                await tx.featureEntity.deleteMany({
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

                // Create new progressions and migrate CharacterFeatureChoice records
                if (progressions && progressions.length > 0) {
                    for (const progression of progressions) {
                        const { entities, ...progressionData } = progression;

                        // Create the feature progression
                        const featureProgression = await tx.featureProgression.create({
                            data: {
                                sourceType: progressionData.sourceType || 0,
                                level: progressionData.level || 1,
                                featureId,
                                classId: progressionData.classId || null,
                                raceId: progressionData.raceId || null,
                                domainId: progressionData.domainId || null,
                                variantOverrideId: progressionData.variantOverrideId || null,
                                featId: progressionData.featId || null,
                                companionId: progressionData.companionId || null,
                            },
                        });

                        // Create related entities and track new entity IDs
                        if (entities && entities.length > 0) {
                            for (const entity of entities) {
                                const { conditions, formulaParams, ...entityData } = entity;

                                // Create formula params first if they exist
                                let formulaParamsId = null;
                                if (formulaParams) {
                                    const dbFormulaParams = transformFormulaParamsForDatabaseCreate(formulaParams);
                                    const createdFormulaParams = await tx.featureFormulaParams.create({
                                        data: dbFormulaParams,
                                    });
                                    formulaParamsId = createdFormulaParams.id;
                                }

                                // Create the entity
                                const createdEntity = await tx.featureEntity.create({
                                    data: {
                                        ...entityData,
                                        progressionId: featureProgression.id,
                                        formulaParamsId: formulaParamsId,
                                    },
                                });

                                // Create related conditions if any
                                if (conditions && conditions.length > 0) {
                                    await tx.featureEntityCondition.createMany({
                                        data: conditions.map((condition: CreateFeatureEntityConditionRequest) => {
                                            const intValue = condition.conditionValue != null ? Number(condition.conditionValue) : 0;
                                            return {
                                                ...condition,
                                                featureEntityId: createdEntity.id,
                                                conditionValue: intValue,
                                            };
                                        }),
                                    });
                                }

                                // Migrate CharacterFeatureChoice records: match new entity to old entity by signature
                                const newEntitySignature: EntitySignature = JSON.stringify({
                                    appliesTo: entityData.appliesTo,
                                    appliesToId: entityData.appliesToId ?? null,
                                    appliesToSubId: entityData.appliesToSubId ?? null,
                                    type: entityData.type,
                                    value: entityData.value ?? null,
                                    bonusType: entityData.bonusType ?? null,
                                    groupingId: entityData.groupingId ?? 0,
                                    progressionLevel: progressionData.level || 1,
                                    progressionSourceType: progressionData.sourceType || 0,
                                });

                                const matchingOldEntity = entitySignatureMap.get(newEntitySignature);
                                if (matchingOldEntity && matchingOldEntity.choices.length > 0) {
                                    // Migrate choices to new entity and progression IDs
                                    await tx.characterFeatureChoice.createMany({
                                        data: matchingOldEntity.choices.map(choice => ({
                                            characterId: choice.characterId,
                                            progressionId: featureProgression.id, // New progression ID
                                            advancementId: choice.advancementId,
                                            featureEntityId: createdEntity.id, // New entity ID
                                            appliesToId: choice.appliesToId,
                                            appliesToSubId: choice.appliesToSubId,
                                            choiceIndex: choice.choiceIndex,
                                        }))
                                    });
                                }
                            }
                        }
                    }
                }
            } else {
                // No existing progressions, just create new ones
                if (progressions && progressions.length > 0) {
                    for (const progression of progressions) {
                        const { entities, ...progressionData } = progression;

                        // Create the feature progression
                        const featureProgression = await tx.featureProgression.create({
                            data: {
                                sourceType: progressionData.sourceType || 0,
                                level: progressionData.level || 1,
                                featureId,
                                classId: progressionData.classId || null,
                                raceId: progressionData.raceId || null,
                                domainId: progressionData.domainId || null,
                                variantOverrideId: progressionData.variantOverrideId || null,
                                featId: progressionData.featId || null,
                                companionId: progressionData.companionId || null,
                            },
                        });

                        // Create related entities
                        await createRelatedEntities(tx, entities, featureProgression.id);
                    }
                }
            }
        });

        return { message: 'Feature progressions updated successfully' };
    },

    async getFeatureProgressions(featureId: number): Promise<FeatureProgression[]> {
        // Get progression IDs for this feature
        const progressionIds = await prisma.featureProgression.findMany({
            where: { featureId },
            select: { id: true }
        });

        // Delegate to core method
        return await this.getFeatureProgressionsByIds(progressionIds.map(p => p.id));
    },

    // NEW: Core method for getting feature progressions by IDs with smart population
    async getFeatureProgressionsByIds(
        progressionIds: number[],
        characterFeatureChoices?: Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>
    ): Promise<FeatureProgression[]> {
        if (progressionIds.length === 0) {
            return [];
        }

        // Single query with all the complex includes
        const progressions = await prisma.featureProgression.findMany({
            where: { id: { in: progressionIds } },
            include: {
                feature: {
                    include: {
                        prerequisites: true
                    },
                    // Explicitly select the fields we need (Prisma allows this with include)
                },
                entities: {
                    include: {
                        formulaParams: true,
                        conditions: true
                    }
                },
                feat: {
                    select: {
                        id: true,
                        typeId: true,
                        repeatable: true,
                        fighterBonus: true,
                        useSubId: true,
                        isVisible: true,
                        editionId: true,
                    }
                }
            }
        });

        // Extract class, race, and feat IDs from progressions
        const classIds = progressions
            .filter(p => p.classId !== null && p.classId !== undefined)
            .map(p => p.classId!)
            .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates

        const raceIds = progressions
            .filter(p => p.raceId !== null && p.raceId !== undefined)
            .map(p => p.raceId!)
            .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates

        const progressionFeatIds = progressions
            .filter(p => p.featId !== null && p.featId !== undefined)
            .map(p => p.featId!)
            .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates

        // Create a map of character choices by progressionId and featureEntityId
        const choiceMap = new Map<string, { appliesToId: number | null; appliesToSubId: number | null }>();
        if (characterFeatureChoices) {
            for (const choice of characterFeatureChoices) {
                const key = `${choice.progressionId}:${choice.featureEntityId}`;
                choiceMap.set(key, { appliesToId: choice.appliesToId, appliesToSubId: choice.appliesToSubId });
            }
        }

        // Fetch items, feats, and features for entities that need them
        const allEntities = progressions.flatMap(p => p.entities);
        const itemIds = allEntities
            .filter(e => e.appliesToSubId && e.appliesToSubId > 0 && e.appliesTo !== EntityAppliesToType.Skill)
            .map(e => e.appliesToSubId!);

        // Also fetch items for Weapon Familiarity entities (stored in appliesToId)
        const weaponFamiliarityItemIds = allEntities
            .filter(e => e.appliesTo === EntityAppliesToType.WeaponFamiliarity && e.appliesToId !== null && e.appliesToId !== undefined)
            .map(e => e.appliesToId!)
            .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates

        // Collect IDs from entities and from choices
        const featIdsSet = new Set<number>();
        const featureIdsSet = new Set<number>();
        const spellIdsSet = new Set<number>();
        const domainIdsSet = new Set<number>();

        // Add IDs from entities
        for (const entity of allEntities) {
            if (entity.appliesTo === EntityAppliesToType.Feat && entity.appliesToId !== null && entity.appliesToId !== undefined) {
                featIdsSet.add(entity.appliesToId);
            }
            if (entity.appliesTo === EntityAppliesToType.Feature && entity.appliesToId !== null && entity.appliesToId !== undefined) {
                featureIdsSet.add(entity.appliesToId);
            }
            if (entity.appliesTo === EntityAppliesToType.Spell && entity.appliesToId !== null && entity.appliesToId !== undefined) {
                spellIdsSet.add(entity.appliesToId);
            }
            if (entity.appliesTo === EntityAppliesToType.Domain && entity.appliesToId !== null && entity.appliesToId !== undefined) {
                domainIdsSet.add(entity.appliesToId);
            }
        }

        // Add IDs from character choices
        if (characterFeatureChoices) {
            for (const choice of characterFeatureChoices) {
                // Find the entity to determine its appliesTo type
                const entity = allEntities.find(e => e.id === choice.featureEntityId && e.progressionId === choice.progressionId);
                if (entity && choice.appliesToId !== null) {
                    if (entity.appliesTo === EntityAppliesToType.Feat) {
                        featIdsSet.add(choice.appliesToId);
                    } else if (entity.appliesTo === EntityAppliesToType.Feature) {
                        featureIdsSet.add(choice.appliesToId);
                    } else if (entity.appliesTo === EntityAppliesToType.Spell) {
                        spellIdsSet.add(choice.appliesToId);
                    } else if (entity.appliesTo === EntityAppliesToType.Domain) {
                        domainIdsSet.add(choice.appliesToId);
                    }
                }
            }
        }

        const featIds = Array.from(featIdsSet);
        const featureIds = Array.from(featureIdsSet);
        const spellIds = Array.from(spellIdsSet);
        const domainIds = Array.from(domainIdsSet);

        // Fetch items, feats, and features
        const allItemIds = [...itemIds, ...weaponFamiliarityItemIds];
        const items = allItemIds.length > 0 ? await prisma.item.findMany({
            where: { id: { in: allItemIds } }
        }) : [];

        const feats = featIds.length > 0 ? await prisma.feat.findMany({
            where: { id: { in: featIds } }
        }) : [];

        const features = featureIds.length > 0 ? await prisma.feature.findMany({
            where: { id: { in: featureIds } },
            include: {
                prerequisites: true
            }
        }) : [];

        const spells = spellIds.length > 0 ? await prisma.spell.findMany({
            where: { id: { in: spellIds } },
            select: {
                id: true,
                name: true
            }
        }) : [];

        const domains = domainIds.length > 0 ? await prisma.domain.findMany({
            where: { id: { in: domainIds } },
            select: {
                id: true,
                name: true
            }
        }) : [];

        // Fetch classes and races
        const classes = classIds.length > 0 ? await prisma.class.findMany({
            where: { id: { in: classIds } },
            select: {
                id: true,
                name: true,
                abbreviation: true
            }
        }) : [];

        const races = raceIds.length > 0 ? await prisma.race.findMany({
            where: { id: { in: raceIds } },
            select: {
                id: true,
                name: true
            }
        }) : [];

        const featDetails = progressionFeatIds.length > 0 ? await prisma.feat.findMany({
            where: { id: { in: progressionFeatIds } },
            select: {
                id: true,
                typeId: true,
                repeatable: true,
                fighterBonus: true,
                useSubId: true,
                isVisible: true,
                editionId: true,
            }
        }) : [];

        // Create lookup maps
        const itemMap = new Map(items.map(item => [item.id, item]));
        const featMap = new Map(feats.map(feat => [feat.id, feat]));
        const featureMap = new Map(features.map(feature => [feature.id, feature]));
        const spellMap = new Map(spells.map(spell => [spell.id, spell]));
        const domainMap = new Map(domains.map(domain => [domain.id, domain]));
        const classMap = new Map(classes.map(cls => [cls.id, cls]));
        const raceMap = new Map(races.map(race => [race.id, race]));
        const featDetailMap = new Map(featDetails.map(feat => [feat.id, feat]));

        // Transform formula parameters and add item/feat data
        const transformedProgressions = progressions.map(progression => {
            const classData = progression.classId ? classMap.get(progression.classId) : undefined;
            const raceData = progression.raceId ? raceMap.get(progression.raceId) : undefined;

            return {
                ...progression,
                ...(classData ? { class: classData } : {}),
                ...(raceData ? { race: raceData } : {}),
                entities: progression.entities?.map(entity => {
                    // Check if there's a character choice for this entity
                    const choiceKey = `${progression.id}:${entity.id}`;
                    const choice = choiceMap.get(choiceKey);

                    // Use choice's appliesToId if available, otherwise use entity's appliesToId
                    const effectiveAppliesToId = choice?.appliesToId ?? entity.appliesToId;
                    const effectiveAppliesToSubId = choice?.appliesToSubId ?? entity.appliesToSubId;

                    return {
                        ...entity,
                        formulaParams: entity.formulaParams
                            ? transformFormulaParamsFromDatabase(entity.formulaParams)
                            : null,
                        // Add item data if appliesToSubId > 0 (and not a Skill entity, where appliesToSubId is a skill subtype)
                        // OR if it's Weapon Familiarity (appliesToId)
                        item: entity.appliesTo !== EntityAppliesToType.Skill &&
                            effectiveAppliesToSubId && effectiveAppliesToSubId > 0
                            ? itemMap.get(effectiveAppliesToSubId) || null
                            : entity.appliesTo === EntityAppliesToType.WeaponFamiliarity && effectiveAppliesToId
                                ? itemMap.get(effectiveAppliesToId) || null
                            : null,
                        // Add feature data if appliesTo === Feature (use choice's appliesToId if available)
                        feature: entity.appliesTo === EntityAppliesToType.Feature && effectiveAppliesToId
                            ? featureMap.get(effectiveAppliesToId) || null
                            : null,
                        // Add spell data if appliesTo === Spell (use choice's appliesToId if available)
                        spell: entity.appliesTo === EntityAppliesToType.Spell && effectiveAppliesToId
                            ? spellMap.get(effectiveAppliesToId) || null
                            : null,
                        // Add domain data if appliesTo === Domain (use choice's appliesToId if available)
                        domain: entity.appliesTo === EntityAppliesToType.Domain && effectiveAppliesToId
                            ? domainMap.get(effectiveAppliesToId) || null
                            : null
                    };
                })
            };
        });

        return transformedProgressions as FeatureProgression[];
    },

    // NEW: Lightweight wrapper methods
    async getFeatureProgressionsByClassId(
        classId: number,
        characterFeatureChoices?: Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>
    ): Promise<FeatureProgression[]> {
        // Get progression IDs for this class
        const progressionIds = await prisma.featureProgression.findMany({
            where: { classId },
            select: { id: true }
        });

        // Delegate to core method with choices
        return await this.getFeatureProgressionsByIds(progressionIds.map(p => p.id), characterFeatureChoices);
    },

    async getFeatureProgressionsByRaceId(
        raceId: number,
        characterFeatureChoices?: Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>
    ): Promise<FeatureProgression[]> {
        // Get progression IDs for this race
        const progressionIds = await prisma.featureProgression.findMany({
            where: { raceId },
            select: { id: true }
        });

        // Delegate to core method with choices
        return await this.getFeatureProgressionsByIds(progressionIds.map(p => p.id), characterFeatureChoices);
    },

    async getFeatureProgressionsByDomainId(
        domainId: number,
        characterFeatureChoices?: Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>
    ): Promise<FeatureProgression[]> {
        // Get progression IDs for this domain
        const progressionIds = await prisma.featureProgression.findMany({
            where: { domainId },
            select: { id: true }
        });

        // Delegate to core method with choices
        return await this.getFeatureProgressionsByIds(progressionIds.map(p => p.id), characterFeatureChoices);
    },

    async getFeatureProgressionsByFeatIds(
        featIds: number[],
        characterFeatureChoices?: Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>
    ): Promise<FeatureProgression[]> {
        if (featIds.length === 0) {
            return [];
        }

        // Get progression IDs for these feats
        const progressionIds = await prisma.featureProgression.findMany({
            where: {
                featId: { in: featIds },
                sourceType: FeatureSourceType.Feat,
            },
            select: { id: true }
        });

        // Delegate to core method with choices
        return await this.getFeatureProgressionsByIds(progressionIds.map(p => p.id), characterFeatureChoices);
    },

    async getFeatureProgressionsByCompanionId(
        companionId: number,
        characterFeatureChoices?: Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>
    ): Promise<FeatureProgression[]> {
        // Get progression IDs for this companion
        const progressionIds = await prisma.featureProgression.findMany({
            where: { companionId },
            select: { id: true }
        });

        // Delegate to core method with choices
        return await this.getFeatureProgressionsByIds(progressionIds.map(p => p.id), characterFeatureChoices);
    },

    async getFeatureProgressionById(
        progressionId: number,
        characterFeatureChoices?: Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>
    ): Promise<FeatureProgression | null> {
        const progressions = await this.getFeatureProgressionsByIds([progressionId], characterFeatureChoices);
        return progressions.length > 0 ? progressions[0] : null;
    },
}; 

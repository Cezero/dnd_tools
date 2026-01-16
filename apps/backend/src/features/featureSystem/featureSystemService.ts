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
    CreateFeatureProgressionConditionRequest,
} from '@shared/schema';
import { EntityAppliesToType, SpecialFeatureId, FeatureSourceType, FeatureEntityConditionType, EntityType, FeatureBonusType } from '@shared/static-data';

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

/**
 * Update entities for a progression in place.
 * Matches entities by ID (if present = update, if no id = create).
 * Deletes entities not in incoming list (but preserves CharacterFeatureChoice records).
 */
async function updateProgressionEntities(
    tx: Prisma.TransactionClient,
    progressionId: number,
    incomingEntities: CreateFeatureEntityRequest[],
    _existingProgression: { entities: Array<{ id: number; formulaParamsId: number | null }> }
): Promise<void> {
    // Load existing entities with choices for preservation
    const existingEntities = await tx.featureEntity.findMany({
        where: { progressionId },
        include: {
            conditions: true,
            formulaParams: true,
            characterFeatureChoice: true
        }
    });

    const existingEntityMap = new Map(existingEntities.map(e => [e.id, e]));
    const incomingEntityMap = new Map<number, CreateFeatureEntityRequest>();
    const newEntities: CreateFeatureEntityRequest[] = [];

    // Type guard for entities with id (update requests)
    type EntityWithId = CreateFeatureEntityRequest & { id: number };
    const hasId = (e: CreateFeatureEntityRequest): e is EntityWithId => {
        return 'id' in e && typeof (e as { id?: number }).id === 'number';
    };

    // Separate incoming entities into updates (have id) and new (no id)
    for (const entity of incomingEntities) {
        if (hasId(entity)) {
            incomingEntityMap.set(entity.id, entity);
        } else {
            newEntities.push(entity);
        }
    }

    // Preserve CharacterFeatureChoice records by matching entity signatures
    type EntitySignature = string;
    const entitySignatureMap = new Map<EntitySignature, {
        oldEntityId: number;
        choices: typeof existingEntities[0]['characterFeatureChoice'];
    }>();

    for (const existingEntity of existingEntities) {
        const signature: EntitySignature = JSON.stringify({
            appliesTo: existingEntity.appliesTo,
            appliesToId: existingEntity.appliesToId,
            appliesToSubId: existingEntity.appliesToSubId,
            type: existingEntity.type,
            value: existingEntity.value,
            bonusType: existingEntity.bonusType,
            groupingId: existingEntity.groupingId,
        });

        if (!entitySignatureMap.has(signature)) {
            entitySignatureMap.set(signature, {
                oldEntityId: existingEntity.id,
                choices: existingEntity.characterFeatureChoice
            });
        } else {
            // Merge choices if signature already exists
            entitySignatureMap.get(signature)!.choices.push(...existingEntity.characterFeatureChoice);
        }
    }

    // Update existing entities
    for (const [entityId, incoming] of incomingEntityMap) {
        const existing = existingEntityMap.get(entityId);
        if (!existing) {
            // ID provided but entity doesn't exist - treat as new
            newEntities.push(incoming);
            continue;
        }

        const { conditions, formulaParams, ...entityData } = incoming;

        // Update formula params if changed
        let formulaParamsId = existing.formulaParamsId;
        if (formulaParams) {
            const dbFormulaParams = transformFormulaParamsForDatabaseCreate(formulaParams);
            if (existing.formulaParamsId) {
                // Update existing formula params
                await tx.featureFormulaParams.update({
                    where: { id: existing.formulaParamsId },
                    data: dbFormulaParams
                });
            } else {
                // Create new formula params
                const createdFormulaParams = await tx.featureFormulaParams.create({
                    data: dbFormulaParams
                });
                formulaParamsId = createdFormulaParams.id;
            }
        }

        // Update entity
        await tx.featureEntity.update({
            where: { id: entityId },
            data: {
                ...entityData,
                formulaParamsId
            }
        });

        // Update conditions
        if (conditions !== undefined) {
            // Delete existing conditions
            await tx.featureEntityCondition.deleteMany({
                where: { featureEntityId: entityId }
            });

            // Create new conditions
            if (conditions.length > 0) {
                await tx.featureEntityCondition.createMany({
                    data: conditions.map(condition => {
                        const intValue = condition.conditionValue != null ? Number(condition.conditionValue) : 0;
                        return {
                            ...condition,
                            featureEntityId: entityId,
                            conditionValue: intValue
                        };
                    })
                });
            }
        }
    }

    // Create new entities
    for (const entity of newEntities) {
        const { conditions, formulaParams, ...entityData } = entity;

        // Create formula params first if they exist
        let formulaParamsId = null;
        if (formulaParams) {
            const dbFormulaParams = transformFormulaParamsForDatabaseCreate(formulaParams);
            const createdFormulaParams = await tx.featureFormulaParams.create({
                data: dbFormulaParams
            });
            formulaParamsId = createdFormulaParams.id;
        }

        // Create the entity
        const createdEntity = await tx.featureEntity.create({
            data: {
                ...entityData,
                progressionId,
                formulaParamsId
            }
        });

        // Create conditions
        if (conditions && conditions.length > 0) {
            await tx.featureEntityCondition.createMany({
                data: conditions.map(condition => {
                    const intValue = condition.conditionValue != null ? Number(condition.conditionValue) : 0;
                    return {
                        ...condition,
                        featureEntityId: createdEntity.id,
                        conditionValue: intValue
                    };
                })
            });
        }

        // Migrate CharacterFeatureChoice records by matching entity signature
        const newEntitySignature: EntitySignature = JSON.stringify({
            appliesTo: entityData.appliesTo,
            appliesToId: entityData.appliesToId ?? null,
            appliesToSubId: entityData.appliesToSubId ?? null,
            type: entityData.type,
            value: entityData.value ?? null,
            bonusType: entityData.bonusType ?? null,
            groupingId: entityData.groupingId ?? 0,
        });

        const matchingOldEntity = entitySignatureMap.get(newEntitySignature);
        if (matchingOldEntity && matchingOldEntity.choices.length > 0) {
            // Migrate choices to new entity ID
            await tx.characterFeatureChoice.createMany({
                data: matchingOldEntity.choices.map(choice => ({
                    characterId: choice.characterId,
                    progressionId: choice.progressionId,
                    advancementId: choice.advancementId,
                    featureEntityId: createdEntity.id, // New entity ID
                    appliesToId: choice.appliesToId,
                    appliesToSubId: choice.appliesToSubId,
                    choiceIndex: choice.choiceIndex
                }))
            });
        }
    }

    // Delete entities not in incoming list (but preserve CharacterFeatureChoice by signature matching)
    const incomingEntityIds = new Set(incomingEntityMap.keys());
    const entitiesToDelete = existingEntities.filter(e => !incomingEntityIds.has(e.id));

    for (const entity of entitiesToDelete) {
        // Try to migrate choices to a matching entity if one exists
        const entitySignature: EntitySignature = JSON.stringify({
            appliesTo: entity.appliesTo,
            appliesToId: entity.appliesToId,
            appliesToSubId: entity.appliesToSubId,
            type: entity.type,
            value: entity.value,
            bonusType: entity.bonusType,
            groupingId: entity.groupingId,
        });

        // Find a matching entity in the incoming list
        let matchingNewEntityId: number | null = null;
        for (const [newEntityId, newEntity] of incomingEntityMap) {
            const newEntitySignature: EntitySignature = JSON.stringify({
                appliesTo: newEntity.appliesTo,
                appliesToId: newEntity.appliesToId ?? null,
                appliesToSubId: newEntity.appliesToSubId ?? null,
                type: newEntity.type,
                value: newEntity.value ?? null,
                bonusType: newEntity.bonusType ?? null,
                groupingId: newEntity.groupingId ?? 0,
            });
            if (newEntitySignature === entitySignature) {
                matchingNewEntityId = newEntityId;
                break;
            }
        }

        // If no exact match, try new entities (we'd need to track created IDs - skip for now)
        // This is a limitation - choices might be lost if entity is deleted and no exact match exists

        // Migrate choices if we found a match
        if (matchingNewEntityId !== null && entity.characterFeatureChoice.length > 0) {
            await tx.characterFeatureChoice.updateMany({
                where: { featureEntityId: entity.id },
                data: { featureEntityId: matchingNewEntityId }
            });
        }

        // Delete conditions
        await tx.featureEntityCondition.deleteMany({
            where: { featureEntityId: entity.id }
        });

        // Delete formula params if orphaned
        if (entity.formulaParamsId) {
            const otherEntityWithSameParams = await tx.featureEntity.findFirst({
                where: {
                    formulaParamsId: entity.formulaParamsId,
                    id: { not: entity.id }
                }
            });
            if (!otherEntityWithSameParams) {
                await tx.featureFormulaParams.delete({
                    where: { id: entity.formulaParamsId }
                });
            }
        }

        // Delete the entity
        await tx.featureEntity.delete({
            where: { id: entity.id }
        });
    }
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
            // Since we're using many-to-many relationships, check for progressions with sourceType Class or Race
            whereClause = {
                // Always filter out special features
                id: createSpecialFeatureFilter(),
                progressions: {
                    none: {
                        OR: [
                            { sourceType: FeatureSourceType.Class },
                            { sourceType: FeatureSourceType.Race }
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
            // Since we're using many-to-many relationships, check for progressions with sourceType Class or Race
            whereClause = {
                // Always filter out special features
                id: createSpecialFeatureFilter(),
                progressions: {
                    none: {
                        OR: [
                            { sourceType: FeatureSourceType.Class },
                            { sourceType: FeatureSourceType.Race }
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
    async createFeatureProgressionWithRelations(data: CreateFeatureProgressionRequest & { classes?: Array<{ classId: number }>; races?: Array<{ raceId: number }> }): Promise<CreateResponse> {
        const { entities, displayConditions, classes, races, ...progressionData } = data;

        const result = await prisma.$transaction(async (tx) => {
            // Create the feature progression
            // Exclude 'classes' and 'races' as they're relations that can't be created directly
            const featureProgression = await tx.featureProgression.create({
                data: progressionData,
            });

            // Create many-to-many class links if provided
            if (classes && classes.length > 0) {
                await tx.featureProgressionClassMap.createMany({
                    data: classes.map((c: { classId: number }) => ({
                        progressionId: featureProgression.id,
                        classId: c.classId
                    })),
                    skipDuplicates: true
                });
            }

            // Create many-to-many race links if provided
            if (races && races.length > 0) {
                await tx.featureProgressionRaceMap.createMany({
                    data: races.map((r: { raceId: number }) => ({
                        progressionId: featureProgression.id,
                        raceId: r.raceId
                    })),
                    skipDuplicates: true
                });
            }

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
                const { entities, displayConditions, classes, races, ...progressionData } = progression as CreateFeatureProgressionRequest & { classes?: Array<{ classId: number }>; races?: Array<{ raceId: number }> };

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
                }
                // If no context matches, use progressionData.sourceType (fallback for Template, etc.)

                // Create the feature progression with context
                const featureProgression = await transactionClient.featureProgression.create({
                    data: {
                        ...progressionData,
                        sourceType, // Use determined sourceType
                        domainId: context.domainId || null,
                        featId: context.featId || null,
                    },
                });

                // Create many-to-many class links if provided in classes array or context
                const classIdsToLink: number[] = [];
                if (classes && classes.length > 0) {
                    classIdsToLink.push(...classes.map(c => c.classId));
                } else if (context.classId) {
                    // If no classes array provided but context has classId, use it
                    classIdsToLink.push(context.classId);
                }
                if (classIdsToLink.length > 0) {
                    await transactionClient.featureProgressionClassMap.createMany({
                        data: classIdsToLink.map(classId => ({
                            progressionId: featureProgression.id,
                            classId
                        })),
                        skipDuplicates: true
                    });
                }

                // Create many-to-many race links if provided in races array or context
                const raceIdsToLink: number[] = [];
                if (races && races.length > 0) {
                    raceIdsToLink.push(...races.map(r => r.raceId));
                } else if (context.raceId) {
                    // If no races array provided but context has raceId, use it
                    raceIdsToLink.push(context.raceId);
                }
                if (raceIdsToLink.length > 0) {
                    await transactionClient.featureProgressionRaceMap.createMany({
                        data: raceIdsToLink.map(raceId => ({
                            progressionId: featureProgression.id,
                            raceId
                        })),
                        skipDuplicates: true
                    });
                }

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
        const whereClause: { domainId?: number; featId?: number } = {};
        if (context.domainId) {
            whereClause.domainId = context.domainId;
        }
        if (context.featId) {
            whereClause.featId = context.featId;
        }

        const executeTransaction = async (transactionClient: Prisma.TransactionClient) => {
            // Find existing progressions
            // For classId and raceId, use many-to-many relationship tables
            let progressionIds: number[] = [];

            if (context.classId) {
                // Find progressions linked via FeatureProgressionClassMap
                const classLinks = await transactionClient.featureProgressionClassMap.findMany({
                    where: { classId: context.classId },
                    select: { progressionId: true }
                });
                progressionIds = classLinks.map(link => link.progressionId);
            } else if (context.raceId) {
                // Find progressions linked via FeatureProgressionRaceMap
                const raceLinks = await transactionClient.featureProgressionRaceMap.findMany({
                    where: { raceId: context.raceId },
                    select: { progressionId: true }
                });
                progressionIds = raceLinks.map(link => link.progressionId);
            }

            // If we have progressionIds from many-to-many relationships, use them
            // Otherwise, use the whereClause for other context types
            let existingProgressions: Array<{ id: number }>;
            if (progressionIds.length > 0) {
                existingProgressions = await transactionClient.featureProgression.findMany({
                    where: {
                        id: { in: progressionIds },
                        ...whereClause
                    },
                    select: { id: true }
                });
            } else if (Object.keys(whereClause).length > 0) {
                existingProgressions = await transactionClient.featureProgression.findMany({
                    where: whereClause,
                    select: { id: true }
                });
            } else {
                return; // No context provided
            }

            if (existingProgressions.length > 0) {
                const finalProgressionIds = existingProgressions.map((p: { id: number }) => p.id);

                // Collect existing formula params before deleting entities
                const existingEntities = await transactionClient.featureEntity.findMany({
                    where: { progressionId: { in: finalProgressionIds } },
                    select: { formulaParamsId: true }
                });

                const existingFormulaParamIds = existingEntities
                    .map((e: { formulaParamsId: number | null }) => e.formulaParamsId)
                    .filter((id: number | null): id is number => id !== null);

                // Delete related entities first (in correct order to respect foreign key constraints)
                // First, get the entity IDs to delete their conditions
                const entityIds = await transactionClient.featureEntity.findMany({
                    where: { progressionId: { in: finalProgressionIds } },
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
                    where: { progressionId: { in: finalProgressionIds } }
                });

                // Delete many-to-many relationship links
                if (finalProgressionIds.length > 0) {
                    await transactionClient.featureProgressionClassMap.deleteMany({
                        where: { progressionId: { in: finalProgressionIds } }
                    });
                    await transactionClient.featureProgressionRaceMap.deleteMany({
                        where: { progressionId: { in: finalProgressionIds } }
                    });
                }

                // Delete orphaned formula params
                if (existingFormulaParamIds.length > 0) {
                    await transactionClient.featureFormulaParams.deleteMany({
                        where: { id: { in: existingFormulaParamIds } }
                    });
                }

                // Delete the progressions
                await transactionClient.featureProgression.deleteMany({
                    where: { id: { in: finalProgressionIds } }
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

    /**
     * Sync FeatureProgressionClassMap entries for a specific class.
     * Removes links for progressions not in the incoming list, adds links for new progressions,
     * and deletes orphaned progressions (those with no remaining class or race links).
     */
    async syncClassFeatureProgressions(
        classId: number,
        progressionIds: number[],
        tx: Prisma.TransactionClient
    ): Promise<void> {
        // Get current progressions linked to this class
        const currentLinks = await tx.featureProgressionClassMap.findMany({
            where: { classId },
            select: { progressionId: true }
        });
        const currentProgressionIds = new Set(currentLinks.map(link => link.progressionId));
        const incomingProgressionIds = new Set(progressionIds);

        // Find progressions to remove (in current but not in incoming)
        const progressionIdsToRemove = Array.from(currentProgressionIds).filter(
            id => !incomingProgressionIds.has(id)
        );

        // Find progressions to add (in incoming but not in current)
        const progressionIdsToAdd = Array.from(incomingProgressionIds).filter(
            id => !currentProgressionIds.has(id)
        );

        // Remove links for progressions no longer associated with this class
        if (progressionIdsToRemove.length > 0) {
            await tx.featureProgressionClassMap.deleteMany({
                where: {
                    classId,
                    progressionId: { in: progressionIdsToRemove }
                }
            });

            // Check for orphaned progressions (no class or race links remaining)
            for (const progressionId of progressionIdsToRemove) {
                const classLinkCount = await tx.featureProgressionClassMap.count({
                    where: { progressionId }
                });
                const raceLinkCount = await tx.featureProgressionRaceMap.count({
                    where: { progressionId }
                });

                // If no links remain, delete the orphaned progression
                if (classLinkCount === 0 && raceLinkCount === 0) {
                    // Get entity IDs for this progression
                    const entities = await tx.featureEntity.findMany({
                        where: { progressionId },
                        select: { id: true, formulaParamsId: true }
                    });
                    const entityIds = entities.map(e => e.id);
                    const formulaParamIds = entities
                        .map(e => e.formulaParamsId)
                        .filter(id => id !== null) as number[];

                    // Delete character feature choices
                    if (entityIds.length > 0) {
                        await tx.characterFeatureChoice.deleteMany({
                            where: { featureEntityId: { in: entityIds } }
                        });
                    }

                    // Delete conditions
                    if (entityIds.length > 0) {
                        await tx.featureEntityCondition.deleteMany({
                            where: { featureEntityId: { in: entityIds } }
                        });
                    }

                    // Delete entities
                    if (entityIds.length > 0) {
                        await tx.featureEntity.deleteMany({
                            where: { progressionId }
                        });
                    }

                    // Delete orphaned formula params
                    if (formulaParamIds.length > 0) {
                        await tx.featureFormulaParams.deleteMany({
                            where: { id: { in: formulaParamIds } }
                        });
                    }

                    // Delete display conditions
                    await tx.featureProgressionCondition.deleteMany({
                        where: { progressionId }
                    });

                    // Delete the orphaned progression
                    await tx.featureProgression.delete({
                        where: { id: progressionId }
                    });
                }
            }
        }

        // Add links for new progressions
        if (progressionIdsToAdd.length > 0) {
            await tx.featureProgressionClassMap.createMany({
                data: progressionIdsToAdd.map(progressionId => ({
                    progressionId,
                    classId
                })),
                skipDuplicates: true
            });
        }
    },

    /**
     * Sync FeatureProgressionRaceMap entries for a specific race.
     * Same logic as syncClassFeatureProgressions but for races.
     */
    async syncRaceFeatureProgressions(
        raceId: number,
        progressionIds: number[],
        tx: Prisma.TransactionClient
    ): Promise<void> {
        // Get current progressions linked to this race
        const currentLinks = await tx.featureProgressionRaceMap.findMany({
            where: { raceId },
            select: { progressionId: true }
        });
        const currentProgressionIds = new Set(currentLinks.map(link => link.progressionId));
        const incomingProgressionIds = new Set(progressionIds);

        // Find progressions to remove (in current but not in incoming)
        const progressionIdsToRemove = Array.from(currentProgressionIds).filter(
            id => !incomingProgressionIds.has(id)
        );

        // Find progressions to add (in incoming but not in current)
        const progressionIdsToAdd = Array.from(incomingProgressionIds).filter(
            id => !currentProgressionIds.has(id)
        );

        // Remove links for progressions no longer associated with this race
        if (progressionIdsToRemove.length > 0) {
            await tx.featureProgressionRaceMap.deleteMany({
                where: {
                    raceId,
                    progressionId: { in: progressionIdsToRemove }
                }
            });

            // Check for orphaned progressions (no class or race links remaining)
            for (const progressionId of progressionIdsToRemove) {
                const classLinkCount = await tx.featureProgressionClassMap.count({
                    where: { progressionId }
                });
                const raceLinkCount = await tx.featureProgressionRaceMap.count({
                    where: { progressionId }
                });

                // If no links remain, delete the orphaned progression
                if (classLinkCount === 0 && raceLinkCount === 0) {
                    // Get entity IDs for this progression
                    const entities = await tx.featureEntity.findMany({
                        where: { progressionId },
                        select: { id: true, formulaParamsId: true }
                    });
                    const entityIds = entities.map(e => e.id);
                    const formulaParamIds = entities
                        .map(e => e.formulaParamsId)
                        .filter(id => id !== null) as number[];

                    // Delete character feature choices
                    if (entityIds.length > 0) {
                        await tx.characterFeatureChoice.deleteMany({
                            where: { featureEntityId: { in: entityIds } }
                        });
                    }

                    // Delete conditions
                    if (entityIds.length > 0) {
                        await tx.featureEntityCondition.deleteMany({
                            where: { featureEntityId: { in: entityIds } }
                        });
                    }

                    // Delete entities
                    if (entityIds.length > 0) {
                        await tx.featureEntity.deleteMany({
                            where: { progressionId }
                        });
                    }

                    // Delete orphaned formula params
                    if (formulaParamIds.length > 0) {
                        await tx.featureFormulaParams.deleteMany({
                            where: { id: { in: formulaParamIds } }
                        });
                    }

                    // Delete display conditions
                    await tx.featureProgressionCondition.deleteMany({
                        where: { progressionId }
                    });

                    // Delete the orphaned progression
                    await tx.featureProgression.delete({
                        where: { id: progressionId }
                    });
                }
            }
        }

        // Add links for new progressions
        if (progressionIdsToAdd.length > 0) {
            await tx.featureProgressionRaceMap.createMany({
                data: progressionIdsToAdd.map(progressionId => ({
                    progressionId,
                    raceId
                })),
                skipDuplicates: true
            });
        }
    },

    async updateFeatureProgressions(featureId: number, progressions: UpdateFeatureProgression[]): Promise<UpdateResponse> {
        await prisma.$transaction(async (tx) => {
            // Load existing progressions for this feature with full context
            const existingProgressions = await tx.featureProgression.findMany({
                where: { featureId },
                include: {
                    entities: {
                        include: {
                            conditions: true,
                            formulaParams: true
                        }
                    },
                    displayConditions: true
                }
            });

            const existingProgressionMap = new Map(existingProgressions.map(p => [p.id, p]));
            const incomingProgressionMap = new Map<number, UpdateFeatureProgression>();
            const newProgressions: UpdateFeatureProgression[] = [];

            // Separate incoming progressions into updates (have id) and new (no id)
            for (const progression of progressions) {
                if (progression.id !== undefined && progression.id !== null) {
                    incomingProgressionMap.set(progression.id, progression);
                } else {
                    newProgressions.push(progression);
                }
            }

            // Update existing progressions
            for (const [progressionId, incoming] of incomingProgressionMap) {
                const existing = existingProgressionMap.get(progressionId);
                if (!existing) {
                    // ID provided but progression doesn't exist - skip or create as new?
                    // For safety, treat as new progression
                    newProgressions.push(incoming);
                    continue;
                }

                const { entities, displayConditions, ...progressionData } = incoming;

                // Update progression fields if changed
                await tx.featureProgression.update({
                    where: { id: progressionId },
                    data: {
                        sourceType: progressionData.sourceType ?? existing.sourceType,
                        level: progressionData.level ?? existing.level,
                        domainId: progressionData.domainId !== undefined ? progressionData.domainId : existing.domainId,
                        featId: progressionData.featId !== undefined ? progressionData.featId : existing.featId,
                        companionId: progressionData.companionId !== undefined ? progressionData.companionId : existing.companionId,
                        editionId: progressionData.editionId !== undefined ? progressionData.editionId : existing.editionId,
                    }
                });

                // Update entities
                if (entities !== undefined) {
                    await updateProgressionEntities(tx, progressionId, entities, existing);
                }

                // Update display conditions
                if (displayConditions !== undefined) {
                    // Delete existing conditions
                    await tx.featureProgressionCondition.deleteMany({
                        where: { progressionId }
                    });

                    // Create new conditions
                    if (displayConditions.length > 0) {
                        await tx.featureProgressionCondition.createMany({
                            data: displayConditions.map(condition => ({
                                progressionId,
                                conditionType: condition.conditionType,
                                conditionValue: condition.conditionValue
                            }))
                        });
                    }
                }
            }

            // Create new progressions
            for (const progression of newProgressions) {
                const { entities, displayConditions, ...progressionData } = progression;

                const featureProgression = await tx.featureProgression.create({
                    data: {
                        sourceType: progressionData.sourceType || 0,
                        level: progressionData.level || 1,
                        featureId,
                        domainId: progressionData.domainId || null,
                        featId: progressionData.featId || null,
                        companionId: progressionData.companionId || null,
                        editionId: progressionData.editionId || null,
                    }
                });

                // Create entities
                if (entities && entities.length > 0) {
                    await createRelatedEntities(tx, entities, featureProgression.id);
                }

                // Create display conditions
                if (displayConditions && displayConditions.length > 0) {
                    await createDisplayConditions(tx, displayConditions, featureProgression.id);
                }
            }

            // Delete progressions that exist but weren't in incoming list
            const incomingIds = new Set(incomingProgressionMap.keys());
            const progressionsToDelete = existingProgressions.filter(p => !incomingIds.has(p.id));

            for (const progression of progressionsToDelete) {
                // Check if progression is shared (has class or race links)
                const classLinkCount = await tx.featureProgressionClassMap.count({
                    where: { progressionId: progression.id }
                });
                const raceLinkCount = await tx.featureProgressionRaceMap.count({
                    where: { progressionId: progression.id }
                });

                // Only delete if not shared (no class or race links)
                if (classLinkCount === 0 && raceLinkCount === 0) {
                    // Get entity IDs
                    const entities = await tx.featureEntity.findMany({
                        where: { progressionId: progression.id },
                        select: { id: true, formulaParamsId: true }
                    });
                    const entityIds = entities.map(e => e.id);
                    const formulaParamIds = entities
                        .map(e => e.formulaParamsId)
                        .filter(id => id !== null) as number[];

                    // Delete character feature choices
                    if (entityIds.length > 0) {
                        await tx.characterFeatureChoice.deleteMany({
                            where: { featureEntityId: { in: entityIds } }
                        });
                    }

                    // Delete conditions
                    if (entityIds.length > 0) {
                        await tx.featureEntityCondition.deleteMany({
                            where: { featureEntityId: { in: entityIds } }
                        });
                    }

                    // Delete entities
                    if (entityIds.length > 0) {
                        await tx.featureEntity.deleteMany({
                            where: { progressionId: progression.id }
                        });
                    }

                    // Delete orphaned formula params
                    if (formulaParamIds.length > 0) {
                        await tx.featureFormulaParams.deleteMany({
                            where: { id: { in: formulaParamIds } }
                        });
                    }

                    // Delete display conditions
                    await tx.featureProgressionCondition.deleteMany({
                        where: { progressionId: progression.id }
                    });

                    // Delete the progression
                    await tx.featureProgression.delete({
                        where: { id: progression.id }
                    });
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

        // Delegate to core method, exclude class/race info
        return await this.getFeatureProgressionsByIds(progressionIds.map(p => p.id), undefined, false);
    },

    // NEW: Core method for getting feature progressions by IDs with smart population
    async getFeatureProgressionsByIds(
        progressionIds: number[],
        characterFeatureChoices?: Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>,
        includeClassRaceInfo: boolean = false
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
                },
                // NEW: Include classes relationship for shared progression info (only if requested)
                // Only need classId - frontend can fetch name/abbreviation from cache
                ...(includeClassRaceInfo ? {
                    classes: {
                        select: {
                            progressionId: true,
                            classId: true
                        }
                    },
                    // NEW: Include races relationship for shared progression info
                    // Only need raceId - frontend can fetch name from cache
                    races: {
                        select: {
                            progressionId: true,
                            raceId: true
                        }
                    }
                } : {})
            }
        });

        // Extract class, race, and feat IDs from progressions (using many-to-many relationships)
        // Only if includeClassRaceInfo is true
        const classIds = includeClassRaceInfo
            ? progressions
                .flatMap(p => (p.classes || []).map(c => c.classId))
                .filter((id, index, arr) => arr.indexOf(id) === index) // Remove duplicates
            : [];

        const raceIds = includeClassRaceInfo
            ? progressions
                .flatMap(p => (p.races || []).map(r => r.raceId))
                .filter((id, index, arr) => arr.indexOf(id) === index) // Remove duplicates
            : [];

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

        // Fetch classes and races (only if includeClassRaceInfo is true)
        const classes = includeClassRaceInfo && classIds.length > 0 ? await prisma.class.findMany({
            where: { id: { in: classIds } },
            select: {
                id: true,
                name: true,
                abbreviation: true
            }
        }) : [];

        const races = includeClassRaceInfo && raceIds.length > 0 ? await prisma.race.findMany({
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
        const _featMap = new Map(feats.map(feat => [feat.id, feat]));
        const featureMap = new Map(features.map(feature => [feature.id, feature]));
        const spellMap = new Map(spells.map(spell => [spell.id, spell]));
        const domainMap = new Map(domains.map(domain => [domain.id, domain]));
        const classMap = new Map(classes.map(cls => [cls.id, cls]));
        const raceMap = new Map(races.map(race => [race.id, race]));
        const _featDetailMap = new Map(featDetails.map(feat => [feat.id, feat]));

        // Transform formula parameters and add item/feat data
        const transformedProgressions = progressions.map(progression => {
            // Get class data from first class in classes array if available (only if includeClassRaceInfo is true)
            const firstClassId = includeClassRaceInfo && progression.classes && progression.classes.length > 0 ? progression.classes[0].classId : undefined;
            const classData = firstClassId ? classMap.get(firstClassId) : undefined;
            // Get race data from first race in races array if available (only if includeClassRaceInfo is true)
            const firstRaceId = includeClassRaceInfo && progression.races && progression.races.length > 0 ? progression.races[0].raceId : undefined;
            const raceData = firstRaceId ? raceMap.get(firstRaceId) : undefined;

            return {
                ...progression,
                ...(classData ? { class: classData } : {}),
                ...(raceData ? { race: raceData } : {}),
                // Include classes relationship for shared progression info (only if requested)
                // Only include classId - frontend can fetch name/abbreviation from cache
                ...(includeClassRaceInfo ? {
                    classes: progression.classes?.map(classMap => ({
                        progressionId: classMap.progressionId,
                        classId: classMap.classId
                    })) || [],
                    // Include races relationship for shared progression info
                    // Only include raceId - frontend can fetch name from cache
                    races: progression.races?.map(raceMap => ({
                        progressionId: raceMap.progressionId,
                        raceId: raceMap.raceId
                    })) || []
                } : {}),
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
        // Get progression IDs for this class via many-to-many relationship
        const classLinks = await prisma.featureProgressionClassMap.findMany({
            where: { classId },
            select: { progressionId: true }
        });
        const progressionIds = classLinks.map(link => link.progressionId);

        // Delegate to core method with choices, exclude class/race info (context is clear - it's for this class)
        return await this.getFeatureProgressionsByIds(progressionIds, characterFeatureChoices, false);
    },

    async getFeatureProgressionsByRaceId(
        raceId: number,
        characterFeatureChoices?: Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>
    ): Promise<FeatureProgression[]> {
        // Get progression IDs for this race via many-to-many relationship
        const raceLinks = await prisma.featureProgressionRaceMap.findMany({
            where: { raceId },
            select: { progressionId: true }
        });
        const progressionIds = raceLinks.map(link => link.progressionId);

        // Delegate to core method with choices, exclude class/race info (context is clear - it's for this race)
        return await this.getFeatureProgressionsByIds(progressionIds, characterFeatureChoices, false);
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

        // Delegate to core method with choices, exclude class/race info
        return await this.getFeatureProgressionsByIds(progressionIds.map(p => p.id), characterFeatureChoices, false);
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

        // Delegate to core method with choices, exclude class/race info
        return await this.getFeatureProgressionsByIds(progressionIds.map(p => p.id), characterFeatureChoices, false);
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

        // Delegate to core method with choices, exclude class/race info
        return await this.getFeatureProgressionsByIds(progressionIds.map(p => p.id), characterFeatureChoices, false);
    },

    async getFeatureProgressionsByEditionId(
        editionId: number,
        characterFeatureChoices?: Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>
    ): Promise<FeatureProgression[]> {
        // Get progression IDs for this edition
        const progressionIds = await prisma.featureProgression.findMany({
            where: {
                editionId,
                sourceType: FeatureSourceType.Edition,
            },
            select: { id: true }
        });

        // Delegate to core method with choices, exclude class/race info
        return await this.getFeatureProgressionsByIds(progressionIds.map(p => p.id), characterFeatureChoices, false);
    },

    async getFeatureProgressionById(
        progressionId: number,
        characterFeatureChoices?: Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>
    ): Promise<FeatureProgression | null> {
        // Exclude class/race info by default
        const progressions = await this.getFeatureProgressionsByIds([progressionId], characterFeatureChoices, false);
        return progressions.length > 0 ? progressions[0] : null;
    },

    /**
     * Clone feature progressions from a source class to a target class.
     * 
     * @param sourceClassId - The class to copy progressions from
     * @param targetClassId - The class to copy progressions to
     * @param forkProgressions - If true, creates copies of progressions. If false, shares progressions via many-to-many relationship.
     */
    async cloneClassFeatures(
        sourceClassId: number,
        targetClassId: number,
        forkProgressions: boolean = false
    ): Promise<void> {
        // Get all progressions from source class via many-to-many relationship
        const classLinks = await prisma.featureProgressionClassMap.findMany({
            where: { classId: sourceClassId },
            select: { progressionId: true }
        });
        const progressionIds = classLinks.map(link => link.progressionId);

        const sourceProgressions = await prisma.featureProgression.findMany({
            where: {
                id: { in: progressionIds }
            },
            include: {
                entities: {
                    include: {
                        conditions: true,
                        formulaParams: true
                    }
                },
                displayConditions: true
            }
        });

        if (forkProgressions) {
            // Create new progressions (copies) for target class
            const context: FeatureProgressionContext = { classId: targetClassId };
            const progressionsToCreate: CreateFeatureProgressionRequest[] = sourceProgressions.map(prog => ({
                sourceType: prog.sourceType as FeatureSourceType,
                level: prog.level,
                featureId: prog.featureId,
                domainId: null,
                featId: null,
                companionId: null,
                editionId: null,
                entities: (prog.entities || []).map((entity): CreateFeatureEntityRequest => {
                    // Transform formula params from database format (strings) to application format (arrays)
                    let formulaParams = undefined;
                    if (entity.formulaParams) {
                        const transformed = transformFormulaParamsFromDatabase(entity.formulaParams);
                        formulaParams = {
                            formulaId: transformed.formulaId,
                            interval: transformed.interval,
                            formulaStartLevel: transformed.formulaStartLevel,
                            abilityId: transformed.abilityId,
                            thresholds: transformed.thresholds,
                            values: transformed.values,
                            includeProgressionLevel: transformed.includeProgressionLevel,
                            valuesRepresent: transformed.valuesRepresent,
                            cumulative: transformed.cumulative
                        };
                    }

                    return {
                        type: entity.type as EntityType,
                        appliesTo: entity.appliesTo as EntityAppliesToType,
                        appliesToId: entity.appliesToId,
                        appliesToSubId: entity.appliesToSubId,
                        value: entity.value,
                        bonusType: entity.bonusType as FeatureBonusType | null,
                        groupingId: entity.groupingId,
                        displayInDetail: entity.displayInDetail,
                        filterType: entity.filterType,
                        conditions: (entity.conditions || []).map((cond): CreateFeatureEntityConditionRequest => ({
                            conditionType: cond.conditionType as typeof FeatureEntityConditionType[keyof typeof FeatureEntityConditionType],
                            conditionValue: cond.conditionValue
                        })),
                        formulaParams
                    };
                }),
                displayConditions: (prog.displayConditions || []).map((cond: { conditionType: number; conditionValue: number }): CreateFeatureProgressionConditionRequest => ({
                    conditionType: cond.conditionType as typeof FeatureEntityConditionType[keyof typeof FeatureEntityConditionType],
                    conditionValue: cond.conditionValue
                }))
            }));

            await this.createMultipleFeatureProgressions(progressionsToCreate, context);
        } else {
            // Share progressions via many-to-many relationship
            // Only share progressions that aren't already linked to target class
            const existingLinks = await prisma.featureProgressionClassMap.findMany({
                where: { classId: targetClassId },
                select: { progressionId: true }
            });
            const existingProgressionIds = new Set(existingLinks.map(link => link.progressionId));

            const progressionsToShare = sourceProgressions.filter(prog => !existingProgressionIds.has(prog.id));

            if (progressionsToShare.length > 0) {
                await prisma.featureProgressionClassMap.createMany({
                    data: progressionsToShare.map(progression => ({
                        progressionId: progression.id,
                        classId: targetClassId
                    }))
                });
            }
        }
    },

    /**
     * Fork a shared progression to make it class-specific.
     * 
     * @param progressionId - The progression to fork
     * @param classId - The class to create a class-specific copy for
     * @returns The ID of the newly created forked progression
     */
    async forkProgressionForClass(
        progressionId: number,
        classId: number
    ): Promise<number> {
        // Get original progression with all relations
        const original = await this.getFeatureProgressionById(progressionId);

        if (!original) {
            throw new Error(`FeatureProgression with ID ${progressionId} not found`);
        }

        // Remove shared link if it exists
        await prisma.featureProgressionClassMap.deleteMany({
            where: {
                progressionId: progressionId,
                classId: classId
            }
        });

        // Create new progression (copy) with class link via many-to-many relationship
        const context: FeatureProgressionContext = { classId: classId };
        const progressionToCreate: CreateFeatureProgressionRequest = {
            sourceType: original.sourceType as FeatureSourceType,
            level: original.level,
            featureId: original.featureId,
            domainId: null,
            featId: null,
            companionId: null,
            editionId: null,
            entities: original.entities?.map((entity): CreateFeatureEntityRequest => ({
                type: entity.type as EntityType,
                appliesTo: entity.appliesTo as EntityAppliesToType,
                appliesToId: entity.appliesToId,
                appliesToSubId: entity.appliesToSubId,
                value: entity.value,
                bonusType: entity.bonusType as FeatureBonusType | null,
                groupingId: entity.groupingId,
                displayInDetail: entity.displayInDetail,
                filterType: entity.filterType,
                conditions: entity.conditions?.map((cond: { conditionType: number; conditionValue: number }): CreateFeatureEntityConditionRequest => ({
                    conditionType: cond.conditionType as typeof FeatureEntityConditionType[keyof typeof FeatureEntityConditionType],
                    conditionValue: cond.conditionValue
                })) || [],
                // Formula params are already in application format (arrays) from getFeatureProgressionById
                formulaParams: entity.formulaParams ? {
                    formulaId: entity.formulaParams.formulaId,
                    interval: entity.formulaParams.interval,
                    formulaStartLevel: entity.formulaParams.formulaStartLevel,
                    abilityId: entity.formulaParams.abilityId,
                    thresholds: entity.formulaParams.thresholds,
                    values: entity.formulaParams.values,
                    includeProgressionLevel: entity.formulaParams.includeProgressionLevel,
                    valuesRepresent: entity.formulaParams.valuesRepresent,
                    cumulative: entity.formulaParams.cumulative
                } : undefined
            })) || [],
            displayConditions: original.displayConditions?.map((cond): CreateFeatureProgressionConditionRequest => ({
                conditionType: cond.conditionType as typeof FeatureEntityConditionType[keyof typeof FeatureEntityConditionType],
                conditionValue: cond.conditionValue
            })) || []
        };

        await this.createMultipleFeatureProgressions([progressionToCreate], context);

        // Get the newly created progression ID (find via many-to-many relationship)
        const classLinks = await prisma.featureProgressionClassMap.findMany({
            where: { classId: classId },
            select: { progressionId: true }
        });
        const progressionIds = classLinks.map(link => link.progressionId);
        const newProgressions = await prisma.featureProgression.findMany({
            where: {
                id: { in: progressionIds },
                featureId: original.featureId,
                level: original.level
            },
            orderBy: { id: 'desc' },
            take: 1,
            select: { id: true }
        });

        if (newProgressions.length === 0) {
            throw new Error('Failed to create forked progression');
        }

        return newProgressions[0].id;
    },
}; 

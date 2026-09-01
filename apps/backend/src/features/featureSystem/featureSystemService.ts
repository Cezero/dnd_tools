import { prisma } from '@/lib/prisma';
import { Prisma } from '@shared/prisma-client';
import {
    GetAllFeaturesResponse,
    CreateFeatureBasicRequest,
    UpdateFeature,
    FeatureIdParamRequest,
    GetFeatureResponse,
    CreateResponse,
    UpdateResponse,
    CreateFeatureRequest,
    FeatureWithRelations,
    GetFeatureListResponse,
    CreateFeatureEntityRequest,
    CreateFeatureEntityConditionRequest,
    CreateFeatureConditionRequest,
    FeatureCacheResponse,
    GetOrphanedFeaturesResponse,
    DeleteOrphanedFeaturesResponse,
} from '@shared/schema';
import { EntityAppliesToType, FeatureSourceType, FeatureEntityConditionType, EntityType, FeatureBonusType } from '@shared/static-data';

import type { FeatureSystemService, FeatureContext } from './types';
import { transformFormulaParamsForDatabaseCreate, transformFormulaParamsFromDatabase } from '../../utils/formulaParamTransformers';

/**
 * Helper function to create related entities for a feature
 */
async function createRelatedEntities(
    transactionClient: Prisma.TransactionClient,
    entities: CreateFeatureEntityRequest[] | undefined,
    featureId: number
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
                featureId: featureId,
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
 * Helper function to create display conditions for a feature
 */
async function createDisplayConditions(
    transactionClient: Prisma.TransactionClient,
    displayConditions: Array<{ conditionType: number; conditionValue: number; id?: number; featureId?: number }> | undefined,
    featureId: number
): Promise<void> {
    if (!displayConditions || displayConditions.length === 0) {
        return;
    }

    await transactionClient.featureCondition.createMany({
        data: displayConditions.map((condition) => ({
            featureId: featureId,
            conditionType: condition.conditionType,
            conditionValue: condition.conditionValue,
        })),
    });
}

/**
 * Update entities for a feature in place.
 * Matches entities by ID (if present = update, if no id = create).
 * Deletes entities not in incoming list (but preserves CharacterFeatureChoice records).
 */
async function updateFeatureEntities(
    tx: Prisma.TransactionClient,
    featureId: number,
    incomingEntities: CreateFeatureEntityRequest[],
    _existingFeature: { entities: Array<{ id: number; formulaParamsId: number | null }> }
): Promise<void> {
    // Load existing entities with choices for preservation
    const existingEntities = await tx.featureEntity.findMany({
        where: { featureId },
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
    // TODO don't do this, just use the entity id
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
                featureId,
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
        // TODO don't do this, just use the entity id
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
                    featureId: choice.featureId,
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

export const featureSystemService: FeatureSystemService = {
    // Core Feature CRUD operations
    async getAllFeatures(sourceTypes?: number[]): Promise<GetAllFeaturesResponse> {
        let whereClause: Prisma.FeatureWhereInput;

        if (sourceTypes && sourceTypes.length > 0) {
            // If sourceTypes are specified, show features with any of those sourceTypes
            whereClause = {
                sourceType: {
                    in: sourceTypes
                }
            };
        } else {
            // If no sourceTypes specified, filter out features associated with classes/races (for standalone features)
            whereClause = {
                NOT: {
                    OR: [
                        { sourceType: FeatureSourceType.Class },
                        { sourceType: FeatureSourceType.Race }
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
            results: features.map(f => ({
                ...f,
                sourceType: f.sourceType as FeatureSourceType,
            })),
        };
    },

    async getFeatureList(sourceTypes?: number[]): Promise<GetFeatureListResponse> {
        let whereClause: Prisma.FeatureWhereInput;

        if (sourceTypes && sourceTypes.length > 0) {
            // If sourceTypes are specified, show features with any of those sourceTypes
            whereClause = {
                sourceType: {
                    in: sourceTypes
                }
            };
        } else {
            // If no sourceTypes specified, filter out features associated with classes/races (for standalone features)
            whereClause = {
                NOT: {
                    OR: [
                        { sourceType: FeatureSourceType.Class },
                        { sourceType: FeatureSourceType.Race }
                    ]
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

    async getFeatureCache(): Promise<FeatureCacheResponse> {
        const features = await prisma.feature.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
            }
        });

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
                entities: {
                    include: {
                        conditions: true,
                        formulaParams: true,
                    },
                },
                displayConditions: true,
            },
        });

        if (!feature) {
            return null;
        }

        // Transform formula params from database format to application format
        const transformedFeature = {
            ...feature,
            entities: feature.entities?.map(entity => {
                const transformedEntity = {
                    ...entity,
                    type: entity.type as EntityType,
                    appliesTo: entity.appliesTo as EntityAppliesToType,
                    bonusType: entity.bonusType as FeatureBonusType | null,
                    formulaParams: entity.formulaParams
                        ? transformFormulaParamsFromDatabase(entity.formulaParams)
                        : null,
                };
                return transformedEntity;
            }),
        };

        return transformedFeature as GetFeatureResponse;
    },

    async createFeature(data: CreateFeatureBasicRequest): Promise<CreateResponse> {
        // Extract prerequisites from data
        const { prerequisites, ...featureData } = data;

        const result = await prisma.$transaction(async (tx) => {
            // Create the feature first (requires sourceType and level for unified Feature model)
            const feature = await tx.feature.create({
                data: {
                    name: featureData.name,
                    slug: featureData.slug,
                    description: featureData.description || '',
                    summary: featureData.summary ?? null,
                    sourceType: FeatureSourceType.Template, // Default for standalone features
                    level: 1, // Default level for standalone features
                    displayInCharacterSheet: featureData.displayInCharacterSheet ?? true,
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

    async updateFeature(query: FeatureIdParamRequest, data: UpdateFeature): Promise<UpdateResponse> {
        // Extract prerequisites and entities from data
        const { prerequisites, entities, ...featureData } = data;

        await prisma.$transaction(async (tx) => {
            // Load existing feature for entity updates
            const existingFeature = await tx.feature.findUnique({
                where: { id: query.id },
                include: {
                    entities: {
                        include: {
                            conditions: true,
                            formulaParams: true
                        }
                    }
                }
            });

            if (!existingFeature) {
                throw new Error(`Feature with id ${query.id} not found`);
            }

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

            // Handle entities if provided
            if (entities !== undefined) {
                await updateFeatureEntities(tx, query.id, entities, existingFeature);
            }

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

    async deleteFeature(query: { id: number }): Promise<UpdateResponse> {
        await prisma.feature.delete({
            where: { id: query.id },
        });

        return { message: 'Feature deleted successfully' };
    },

    // Bulk Feature management (for class/race creation)
    async createFeatureWithRelations(data: CreateFeatureRequest & { classes?: Array<{ classId: number }>; races?: Array<{ raceId: number }> }): Promise<CreateResponse> {
        const { entities, displayConditions, classes, races, ...featureData } = data;

        const result = await prisma.$transaction(async (tx) => {
            // Create the feature (merged Feature/FeatureWithRelations)
            // Exclude 'classes' and 'races' as they're relations that can't be created directly
            // Explicitly select only Prisma Feature fields
            const feature = await tx.feature.create({
                data: {
                    name: featureData.name,
                    slug: featureData.slug,
                    description: featureData.description ?? '', // Ensure description is always a string
                    summary: featureData.summary ?? null,
                    displayInCharacterSheet: featureData.displayInCharacterSheet ?? true,
                    sourceType: featureData.sourceType,
                    level: featureData.level,
                    domainId: featureData.domainId ?? null,
                    featId: featureData.featId ?? null,
                    companionId: featureData.companionId ?? null,
                    editionId: featureData.editionId ?? null,
                },
            });

            // Create many-to-many class links if provided
            if (classes && classes.length > 0) {
                await tx.featureClassMap.createMany({
                    data: classes.map((c: { classId: number }) => ({
                        featureId: feature.id,
                        classId: c.classId
                    })),
                    skipDuplicates: true
                });
            }

            // Create many-to-many race links if provided
            if (races && races.length > 0) {
                await tx.featureRaceMap.createMany({
                    data: races.map((r: { raceId: number }) => ({
                        featureId: feature.id,
                        raceId: r.raceId
                    })),
                    skipDuplicates: true
                });
            }

            // Create related entities
            await createRelatedEntities(tx, entities, feature.id);

            // Create display conditions
            await createDisplayConditions(tx, displayConditions, feature.id);

            return feature;
        });

        return { id: result.id.toString(), message: 'Feature created successfully' };
    },

    // Consolidated method for creating multiple features (used by class/race services)
    async createMultipleFeatures(
        features: CreateFeatureRequest[],
        context: FeatureContext,
        tx?: Prisma.TransactionClient
    ): Promise<void> {
        if (!features || features.length === 0) {
            return;
        }

        const executeTransaction = async (transactionClient: Prisma.TransactionClient) => {
            for (const featureItem of features) {
                const { entities, displayConditions, classes, races, ...featureData } = featureItem as CreateFeatureRequest & { classes?: Array<{ classId: number }>; races?: Array<{ raceId: number }> };

                // Determine sourceType from context (override featureData.sourceType if present)
                let sourceType = featureData.sourceType;
                if (context.raceId) {
                    sourceType = FeatureSourceType.Race;
                } else if (context.classId) {
                    sourceType = FeatureSourceType.Class;
                } else if (context.domainId) {
                    sourceType = FeatureSourceType.Domain;
                } else if (context.featId) {
                    sourceType = FeatureSourceType.Feat;
                }
                // If no context matches, use featureData.sourceType (fallback for Template, etc.)

                // Create the feature with context (merged Feature/FeatureWithRelations)
                // Explicitly select only Prisma Feature fields
                const feature = await transactionClient.feature.create({
                    data: {
                        name: featureData.name,
                        slug: featureData.slug,
                        description: featureData.description ?? '', // Ensure description is always a string
                        summary: featureData.summary ?? null,
                        displayInCharacterSheet: featureData.displayInCharacterSheet ?? true,
                        sourceType, // Use determined sourceType
                        level: featureData.level,
                        domainId: context.domainId || null,
                        featId: context.featId || null,
                        companionId: context.companionId || null,
                        editionId: context.editionId || null,
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
                    await transactionClient.featureClassMap.createMany({
                        data: classIdsToLink.map(classId => ({
                            featureId: feature.id,
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
                    await transactionClient.featureRaceMap.createMany({
                        data: raceIdsToLink.map(raceId => ({
                            featureId: feature.id,
                            raceId
                        })),
                        skipDuplicates: true
                    });
                }

                // Create related entities
                await createRelatedEntities(transactionClient, entities, feature.id);

                // Create display conditions
                await createDisplayConditions(transactionClient, displayConditions, feature.id);

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


    // Consolidated method for deleting features (used by class/race/variant services)
    async deleteFeaturesForContext(
        context: FeatureContext,
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
            // Find existing features
            // For classId and raceId, use many-to-many relationship tables
            let featureIds: number[] = [];

            if (context.classId) {
                // Find features linked via FeatureClassMap
                const classLinks = await transactionClient.featureClassMap.findMany({
                    where: { classId: context.classId },
                    select: { featureId: true }
                });
                featureIds = classLinks.map(link => link.featureId);
            } else if (context.raceId) {
                // Find features linked via FeatureRaceMap
                const raceLinks = await transactionClient.featureRaceMap.findMany({
                    where: { raceId: context.raceId },
                    select: { featureId: true }
                });
                featureIds = raceLinks.map(link => link.featureId);
            }

            // If we have featureIds from many-to-many relationships, use them
            // Otherwise, use the whereClause for other context types
            let existingFeatures: Array<{ id: number }>;
            if (featureIds.length > 0) {
                existingFeatures = await transactionClient.feature.findMany({
                    where: {
                        id: { in: featureIds },
                        ...whereClause
                    },
                    select: { id: true }
                });
            } else if (Object.keys(whereClause).length > 0) {
                existingFeatures = await transactionClient.feature.findMany({
                    where: whereClause,
                    select: { id: true }
                });
            } else {
                return; // No context provided
            }

            if (existingFeatures.length > 0) {
                const finalFeatureIds = existingFeatures.map((p: { id: number }) => p.id);

                // Collect existing formula params before deleting entities
                const existingEntities = await transactionClient.featureEntity.findMany({
                    where: { featureId: { in: finalFeatureIds } },
                    select: { formulaParamsId: true }
                });

                const existingFormulaParamIds = existingEntities
                    .map((e: { formulaParamsId: number | null }) => e.formulaParamsId)
                    .filter((id: number | null): id is number => id !== null);

                // Delete related entities first (in correct order to respect foreign key constraints)
                // First, get the entity IDs to delete their conditions
                const entityIds = await transactionClient.featureEntity.findMany({
                    where: { featureId: { in: finalFeatureIds } },
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
                    where: { featureId: { in: finalFeatureIds } }
                });

                // Delete many-to-many relationship links
                if (finalFeatureIds.length > 0) {
                    await transactionClient.featureClassMap.deleteMany({
                        where: { featureId: { in: finalFeatureIds } }
                    });
                    await transactionClient.featureRaceMap.deleteMany({
                        where: { featureId: { in: finalFeatureIds } }
                    });
                }

                // Delete display conditions
                if (finalFeatureIds.length > 0) {
                    await transactionClient.featureCondition.deleteMany({
                        where: { featureId: { in: finalFeatureIds } }
                    });
                }

                // Delete orphaned formula params
                if (existingFormulaParamIds.length > 0) {
                    await transactionClient.featureFormulaParams.deleteMany({
                        where: { id: { in: existingFormulaParamIds } }
                    });
                }

                // Delete the features
                await transactionClient.feature.deleteMany({
                    where: { id: { in: finalFeatureIds } }
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
     * Sync FeatureClassMap entries for a specific class.
     * Removes links for features not in the incoming list, adds links for new features.
     * Returns orphaned feature IDs that should be cleaned up in a separate transaction.
     */
    async syncClassFeatures(
        classId: number,
        featureIds: number[],
        tx: Prisma.TransactionClient
    ): Promise<number[]> {
        console.log(`[FeatureSystemService] syncClassFeatures: classId=${classId}, incoming featureIds=[${featureIds.join(', ')}]`);

        // Validate that feature IDs exist before syncing
        if (featureIds.length > 0) {
            const existingFeatures = await tx.feature.findMany({
                where: { id: { in: featureIds } },
                select: { id: true }
            });
            const existingIds = new Set(existingFeatures.map(f => f.id));
            const invalidIds = featureIds.filter(id => !existingIds.has(id));
            if (invalidIds.length > 0) {
                console.error(`[FeatureSystemService] WARNING: ${invalidIds.length} invalid feature IDs provided: ${invalidIds.join(', ')}`);
                // Filter out invalid IDs
                const validFeatureIds = featureIds.filter(id => existingIds.has(id));
                if (validFeatureIds.length === 0) {
                    console.error(`[FeatureSystemService] CRITICAL ERROR: All feature IDs are invalid! This will remove all FeatureClassMap entries for class ${classId}`);
                }
                featureIds = validFeatureIds;
            }
        }

        // Get current features linked to this class
        const currentLinks = await tx.featureClassMap.findMany({
            where: { classId },
            select: { featureId: true }
        });
        const currentFeatureIds = new Set(currentLinks.map(link => link.featureId));
        const incomingFeatureIds = new Set(featureIds);

        console.log(`[FeatureSystemService] Current links: ${currentFeatureIds.size}, Incoming: ${incomingFeatureIds.size}`);

        // Find features to remove (in current but not in incoming)
        const featureIdsToRemove = Array.from(currentFeatureIds).filter(
            id => !incomingFeatureIds.has(id)
        );

        // Find features to add (in incoming but not in current)
        const featureIdsToAdd = Array.from(incomingFeatureIds).filter(
            id => !currentFeatureIds.has(id)
        );

        console.log(`[FeatureSystemService] Will remove ${featureIdsToRemove.length} links, add ${featureIdsToAdd.length} links`);
        if (featureIdsToRemove.length > 0) {
            console.log(`[FeatureSystemService] Removing links for feature IDs: ${featureIdsToRemove.join(', ')}`);
        }
        if (featureIdsToAdd.length > 0) {
            console.log(`[FeatureSystemService] Adding links for feature IDs: ${featureIdsToAdd.join(', ')}`);
        }

        // Critical warning if removing all links
        if (featureIdsToRemove.length === currentFeatureIds.size && currentFeatureIds.size > 0 && incomingFeatureIds.size === 0) {
            console.error(`[FeatureSystemService] CRITICAL WARNING: Removing ALL ${currentFeatureIds.size} FeatureClassMap entries for class ${classId}!`);
        }

        // Remove links for features no longer associated with this class
        if (featureIdsToRemove.length > 0) {
            await tx.featureClassMap.deleteMany({
                where: {
                    classId,
                    featureId: { in: featureIdsToRemove }
                }
            });
        }

        // Add links for new features
        if (featureIdsToAdd.length > 0) {
            await tx.featureClassMap.createMany({
                data: featureIdsToAdd.map(featureId => ({
                    featureId,
                    classId
                })),
                skipDuplicates: true
            });
            console.log(`[FeatureSystemService] Successfully added ${featureIdsToAdd.length} new FeatureClassMap entries`);
        }

        // Final verification
        const finalLinks = await tx.featureClassMap.findMany({
            where: { classId },
            select: { featureId: true }
        });
        console.log(`[FeatureSystemService] Final state: ${finalLinks.length} FeatureClassMap entries for class ${classId}`);

        // Return empty array if no orphans found
        return [];
    },

    /**
     * Clean up orphaned features in a separate transaction.
     * 
     * TODO: This method should NOT be called automatically by class/race services.
     * Instead, create an admin UI that:
     * 1. Lists orphaned features (features with no class/race/feat/domain/companion links)
     * 2. Allows admin to review and select features for deletion
     * 3. Calls this method with selected feature IDs
     * 
     * This prevents accidental deletion of features that might be intentionally orphaned
     * or temporarily unlinked during editing.
     * 
     * This should be called after the main operation completes successfully.
     */
    async cleanupOrphanedFeatures(orphanedFeatureIds: number[]): Promise<void> {
        if (orphanedFeatureIds.length === 0) {
            return;
        }

        console.log(`[FeatureSystemService] Cleaning up ${orphanedFeatureIds.length} orphaned features in separate transaction`);

        await prisma.$transaction(async (tx) => {
            // Get all entities for orphaned features in one query
            const allEntities = await tx.featureEntity.findMany({
                where: { featureId: { in: orphanedFeatureIds } },
                select: { id: true, formulaParamsId: true }
            });
            const allEntityIds = allEntities.map(e => e.id);
            const allFormulaParamIds = allEntities
                .map(e => e.formulaParamsId)
                .filter(id => id !== null) as number[];

            // Batch delete all related data
            if (allEntityIds.length > 0) {
                // Delete character feature choices
                await tx.characterFeatureChoice.deleteMany({
                    where: { featureEntityId: { in: allEntityIds } }
                });

                // Delete conditions
                await tx.featureEntityCondition.deleteMany({
                    where: { featureEntityId: { in: allEntityIds } }
                });
            }

            // Delete entities
            if (allEntityIds.length > 0) {
                await tx.featureEntity.deleteMany({
                    where: { featureId: { in: orphanedFeatureIds } }
                });
            }

            // Delete orphaned formula params
            if (allFormulaParamIds.length > 0) {
                await tx.featureFormulaParams.deleteMany({
                    where: { id: { in: allFormulaParamIds } }
                });
            }

            // Delete display conditions
            await tx.featureCondition.deleteMany({
                where: { featureId: { in: orphanedFeatureIds } }
            });

            // Delete the orphaned features
            await tx.feature.deleteMany({
                where: { id: { in: orphanedFeatureIds } }
            });

            console.log(`[FeatureSystemService] Successfully deleted ${orphanedFeatureIds.length} orphaned features and their related data`);
        }, {
            timeout: 60000 // 60 seconds timeout for large cleanup operations
        });
    },

    /**
     * Lists orphaned features for manual admin review.
     *
     * Orphaned features are Feature rows that have no owning progression source:
     * - no FeatureClassMap links
     * - no FeatureRaceMap links
     * - no domain/feat/companion/edition foreign keys
     *
     * Note: this does not attempt to infer intent; it simply surfaces candidates for review.
     */
    async getOrphanedFeatures(): Promise<GetOrphanedFeaturesResponse> {
        const orphaned = await prisma.feature.findMany({
            where: {
                domainId: null,
                featId: null,
                companionId: null,
                editionId: null,
                classes: { none: {} },
                races: { none: {} },
            },
            select: {
                id: true,
                name: true,
                editionId: true,
                level: true,
                sourceType: true,
            },
            orderBy: { id: 'asc' },
        });

        return {
            total: orphaned.length,
            results: orphaned.map((f) => ({
                id: f.id,
                name: f.name,
                editionId: f.editionId,
                level: f.level,
                sourceType: f.sourceType as FeatureSourceType,
            })),
        };
    },

    /**
     * Deletes orphaned features selected by an administrator.
     *
     * Only features that are still orphaned at delete time are removed; non-orphan IDs are ignored.
     */
    async deleteOrphanedFeatures(featureIds: number[]): Promise<DeleteOrphanedFeaturesResponse> {
        if (featureIds.length === 0) {
            return { deletedCount: 0, deletedFeatureIds: [] };
        }

        const orphaned = await prisma.feature.findMany({
            where: {
                id: { in: featureIds },
                domainId: null,
                featId: null,
                companionId: null,
                editionId: null,
                classes: { none: {} },
                races: { none: {} },
            },
            select: { id: true }
        });

        const orphanedIds = orphaned.map((f) => f.id);
        await this.cleanupOrphanedFeatures(orphanedIds);

        return {
            deletedCount: orphanedIds.length,
            deletedFeatureIds: orphanedIds,
        };
    },

    /**
     * Sync FeatureRaceMap entries for a specific race.
     * Same logic as syncClassFeatures but for races.
     * Returns orphaned feature IDs that should be cleaned up in a separate transaction.
     */
    async syncRaceFeatures(
        raceId: number,
        featureIds: number[],
        tx: Prisma.TransactionClient
    ): Promise<number[]> {
        // Get current features linked to this race
        const currentLinks = await tx.featureRaceMap.findMany({
            where: { raceId },
            select: { featureId: true }
        });
        const currentFeatureIds = new Set(currentLinks.map(link => link.featureId));
        const incomingFeatureIds = new Set(featureIds);

        // Find features to remove (in current but not in incoming)
        const featureIdsToRemove = Array.from(currentFeatureIds).filter(
            id => !incomingFeatureIds.has(id)
        );

        // Find features to add (in incoming but not in current)
        const featureIdsToAdd = Array.from(incomingFeatureIds).filter(
            id => !currentFeatureIds.has(id)
        );

        // Remove links for features no longer associated with this race
        if (featureIdsToRemove.length > 0) {
            await tx.featureRaceMap.deleteMany({
                where: {
                    raceId,
                    featureId: { in: featureIdsToRemove }
                }
            });
        }

        // Add links for new features
        if (featureIdsToAdd.length > 0) {
            await tx.featureRaceMap.createMany({
                data: featureIdsToAdd.map(featureId => ({
                    featureId,
                    raceId
                })),
                skipDuplicates: true
            });
        }

        // Return empty array if no orphans found
        return [];
    },

    async updateFeatures(featureId: number, features: UpdateFeature[]): Promise<UpdateResponse> {
        await prisma.$transaction(async (tx) => {
            // Load existing features for this featureId with full context
            // Note: featureId parameter here refers to the old Feature.id, but now we're working with merged Feature table
            // This method may need refactoring since Feature and FeatureWithRelations are merged
            const existingFeatures = await tx.feature.findMany({
                where: { id: featureId },
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

            const existingFeatureMap = new Map(existingFeatures.map(f => [f.id, f]));
            const incomingFeatureMap = new Map<number, UpdateFeature>();
            const newFeatures: UpdateFeature[] = [];

            // Separate incoming features into updates (have id) and new (no id)
            for (const feature of features) {
                if (feature.id !== undefined && feature.id !== null) {
                    incomingFeatureMap.set(feature.id, feature);
                } else {
                    newFeatures.push(feature);
                }
            }

            // Update existing features
            for (const [featureId, incoming] of incomingFeatureMap) {
                const existing = existingFeatureMap.get(featureId);
                if (!existing) {
                    // ID provided but feature doesn't exist - skip or create as new?
                    // For safety, treat as new feature
                    newFeatures.push(incoming);
                    continue;
                }

                const { entities, displayConditions, ...featureData } = incoming;

                // Update feature fields if changed
                await tx.feature.update({
                    where: { id: featureId },
                    data: {
                        sourceType: featureData.sourceType ?? existing.sourceType,
                        level: featureData.level ?? existing.level,
                        domainId: featureData.domainId !== undefined ? featureData.domainId : existing.domainId,
                        featId: featureData.featId !== undefined ? featureData.featId : existing.featId,
                        companionId: featureData.companionId !== undefined ? featureData.companionId : existing.companionId,
                        editionId: featureData.editionId !== undefined ? featureData.editionId : existing.editionId,
                    }
                });

                // Update entities
                if (entities !== undefined) {
                    await updateFeatureEntities(tx, featureId, entities, existing);
                }

                // Update display conditions
                if (displayConditions !== undefined) {
                    // Delete existing conditions
                    await tx.featureCondition.deleteMany({
                        where: { featureId: featureId }
                    });

                    // Create new conditions
                    if (displayConditions.length > 0) {
                        await tx.featureCondition.createMany({
                            data: displayConditions.map(condition => ({
                                featureId: featureId,
                                conditionType: condition.conditionType,
                                conditionValue: condition.conditionValue
                            }))
                        });
                    }
                }
            }

            // Create new features
            for (const featureItem of newFeatures) {
                const { entities, displayConditions, ...featureData } = featureItem;

                // Explicitly select only Prisma Feature fields
                const feature = await tx.feature.create({
                    data: {
                        name: featureData.name ?? '',
                        slug: featureData.slug ?? '',
                        description: featureData.description ?? '', // Ensure description is always a string
                        summary: featureData.summary ?? null,
                        displayInCharacterSheet: featureData.displayInCharacterSheet ?? true,
                        sourceType: featureData.sourceType || 0,
                        level: featureData.level || 1,
                        domainId: featureData.domainId ?? null,
                        featId: featureData.featId ?? null,
                        companionId: featureData.companionId ?? null,
                        editionId: featureData.editionId ?? null,
                    }
                });

                // Create entities
                if (entities && entities.length > 0) {
                    await createRelatedEntities(tx, entities, feature.id);
                }

                // Create display conditions
                if (displayConditions && displayConditions.length > 0) {
                    await createDisplayConditions(tx, displayConditions, feature.id);
                }
            }

            // Delete features that exist but weren't in incoming list
            // IMPORTANT: Only delete if this method is being used for feat/domain/companion features,
            // NOT for class/race features (which are managed via FeatureClassMap/FeatureRaceMap)
            const incomingIds = new Set(incomingFeatureMap.keys());
            const featuresToDelete = existingFeatures.filter(f => !incomingIds.has(f.id));

            for (const feature of featuresToDelete) {
                // Check if feature is shared (has class or race links)
                const classLinkCount = await tx.featureClassMap.count({
                    where: { featureId: feature.id }
                });
                const raceLinkCount = await tx.featureRaceMap.count({
                    where: { featureId: feature.id }
                });

                // CRITICAL: Never delete features that have class or race links
                // Class/race features are managed through FeatureClassMap/FeatureRaceMap, not through this method
                // Also check if the feature's sourceType is Class or Race to be extra safe
                const isClassOrRaceFeature = feature.sourceType === FeatureSourceType.Class ||
                    feature.sourceType === FeatureSourceType.Race ||
                    classLinkCount > 0 ||
                    raceLinkCount > 0;

                // Only delete if not shared and not a class/race feature
                if (!isClassOrRaceFeature) {
                    // Get entity IDs
                    const entities = await tx.featureEntity.findMany({
                        where: { featureId: feature.id },
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
                            where: { featureId: feature.id }
                        });
                    }

                    // Delete orphaned formula params
                    if (formulaParamIds.length > 0) {
                        await tx.featureFormulaParams.deleteMany({
                            where: { id: { in: formulaParamIds } }
                        });
                    }

                    // Delete display conditions
                    await tx.featureCondition.deleteMany({
                        where: { featureId: feature.id }
                    });

                    // Delete the feature
                    await tx.feature.delete({
                        where: { id: feature.id }
                    });
                }
            }
        });

        return { message: 'Features updated successfully' };
    },

    async getFeatures(featureId: number): Promise<FeatureWithRelations[]> {
        // Feature is now unified, so featureId is the Feature.id
        // Delegate to core method, exclude class/race info
        return await this.getFeaturesByIds([featureId], undefined, false);
    },

    // Core method for getting features by IDs with smart population
    async getFeaturesByIds(
        featureIds: number[],
        characterFeatureChoices?: Array<{ featureId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>,
        includeClassRaceInfo: boolean = false
    ): Promise<FeatureWithRelations[]> {
        if (featureIds.length === 0) {
            return [];
        }

        // Single query with all the complex includes
        const features = await prisma.feature.findMany({
            where: { id: { in: featureIds } },
            include: {
                prerequisites: true,
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
                // NEW: Include classes relationship for shared feature info (only if requested)
                // Only need classId - frontend can fetch name/abbreviation from cache
                ...(includeClassRaceInfo ? {
                    classes: {
                        select: {
                            featureId: true,
                            classId: true
                        }
                    },
                    // Include races relationship for shared feature info
                    // Only need raceId - frontend can fetch name from cache
                    races: {
                        select: {
                            featureId: true,
                            raceId: true
                        }
                    }
                } : {})
            }
        });

        // Create a map of character choices by featureId and featureEntityId
        const choiceMap = new Map<string, { appliesToId: number | null; appliesToSubId: number | null }>();
        if (characterFeatureChoices) {
            for (const choice of characterFeatureChoices) {
                const key = `${choice.featureId}:${choice.featureEntityId}`;
                choiceMap.set(key, { appliesToId: choice.appliesToId, appliesToSubId: choice.appliesToSubId });
            }
        }

        // Transform formula parameters and add item/feat data
        const transformedFeatures = features.map(feature => {

            return {
                ...feature,
                entities: feature.entities?.map((entity) => {
                    // Check if there's a character choice for this entity
                    const choiceKey = `${feature.id}:${entity.id}`;
                    const choice = choiceMap.get(choiceKey);

                    // Use choice's appliesToId/appliesToSubId if available, otherwise use entity's
                    // Frontend should look up items, spells, features, domains from caches using these IDs
                    const effectiveAppliesToId = choice?.appliesToId ?? entity.appliesToId;
                    const effectiveAppliesToSubId = choice?.appliesToSubId ?? entity.appliesToSubId;

                    return {
                        ...entity,
                        type: entity.type as EntityType,
                        appliesTo: entity.appliesTo as EntityAppliesToType,
                        bonusType: entity.bonusType as FeatureBonusType | null,
                        appliesToId: effectiveAppliesToId,
                        appliesToSubId: effectiveAppliesToSubId,
                        formulaParams: entity.formulaParams
                            ? transformFormulaParamsFromDatabase(entity.formulaParams)
                            : null,
                    };
                })
            };
        });

        return transformedFeatures as FeatureWithRelations[];
    },

    // Lightweight wrapper methods
    async getFeaturesByClassId(
        classId: number,
        characterFeatureChoices?: Array<{ featureId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>,
        includeClassRaceInfo = false
    ): Promise<FeatureWithRelations[]> {
        // Get feature IDs for this class via many-to-many relationship
        const classLinks = await prisma.featureClassMap.findMany({
            where: { classId },
            select: { featureId: true }
        });
        const featureIds = classLinks.map(link => link.featureId);

        return await this.getFeaturesByIds(featureIds, characterFeatureChoices, includeClassRaceInfo);
    },

    async getFeaturesByRaceId(
        raceId: number,
        characterFeatureChoices?: Array<{ featureId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>,
        includeClassRaceInfo = false
    ): Promise<FeatureWithRelations[]> {
        // Get feature IDs for this race via many-to-many relationship
        const raceLinks = await prisma.featureRaceMap.findMany({
            where: { raceId },
            select: { featureId: true }
        });
        const featureIds = raceLinks.map(link => link.featureId);

        return await this.getFeaturesByIds(featureIds, characterFeatureChoices, includeClassRaceInfo);
    },

    async getFeaturesByDomainId(
        domainId: number,
        characterFeatureChoices?: Array<{ featureId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>
    ): Promise<FeatureWithRelations[]> {
        // Get feature IDs for this domain
        const features = await prisma.feature.findMany({
            where: { domainId },
            select: { id: true }
        });

        // Delegate to core method with choices, exclude class/race info
        return await this.getFeaturesByIds(features.map(f => f.id), characterFeatureChoices, false);
    },

    async getFeaturesByFeatIds(
        featIds: number[],
        characterFeatureChoices?: Array<{ featureId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>
    ): Promise<FeatureWithRelations[]> {
        if (featIds.length === 0) {
            return [];
        }

        // Get feature IDs for these feats
        const features = await prisma.feature.findMany({
            where: {
                featId: { in: featIds },
                sourceType: FeatureSourceType.Feat,
            },
            select: { id: true }
        });

        // Delegate to core method with choices, exclude class/race info
        return await this.getFeaturesByIds(features.map(f => f.id), characterFeatureChoices, false);
    },

    async getFeaturesByCompanionId(
        companionId: number,
        characterFeatureChoices?: Array<{ featureId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>
    ): Promise<FeatureWithRelations[]> {
        // Get feature IDs for this companion
        const features = await prisma.feature.findMany({
            where: { companionId },
            select: { id: true }
        });

        // Delegate to core method with choices, exclude class/race info
        return await this.getFeaturesByIds(features.map(f => f.id), characterFeatureChoices, false);
    },

    async getFeaturesByEditionId(
        editionId: number,
        characterFeatureChoices?: Array<{ featureId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>
    ): Promise<FeatureWithRelations[]> {
        // Get feature IDs for this edition
        const features = await prisma.feature.findMany({
            where: {
                editionId,
                sourceType: FeatureSourceType.Edition,
            },
            select: { id: true }
        });

        // Delegate to core method with choices, exclude class/race info
        return await this.getFeaturesByIds(features.map(f => f.id), characterFeatureChoices, false);
    },

    async getFeatureByIdWithChoices(
        featureId: number,
        characterFeatureChoices?: Array<{ featureId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>
    ): Promise<FeatureWithRelations | null> {
        // Exclude class/race info by default
        const features = await this.getFeaturesByIds([featureId], characterFeatureChoices, false);
        return features.length > 0 ? features[0] : null;
    },

    /**
     * Clone features from a source class to a target class.
     * 
     * @param sourceClassId - The class to copy features from
     * @param targetClassId - The class to copy features to
     * @param forkFeatures - If true, creates copies of features. If false, shares features via many-to-many relationship.
     */
    async cloneClassFeatures(
        sourceClassId: number,
        targetClassId: number,
        forkFeatures: boolean = false
    ): Promise<void> {
        // Get all features from source class via many-to-many relationship
        const classLinks = await prisma.featureClassMap.findMany({
            where: { classId: sourceClassId },
            select: { featureId: true }
        });
        const featureIds = classLinks.map(link => link.featureId);

        const sourceFeatures = await prisma.feature.findMany({
            where: {
                id: { in: featureIds }
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

        if (forkFeatures) {
            // Create new features (copies) for target class
            const context: FeatureContext = { classId: targetClassId };
            const featuresToCreate: CreateFeatureRequest[] = sourceFeatures.map(feature => ({
                name: feature.name,
                slug: feature.slug,
                description: feature.description,
                summary: feature.summary ?? null,
                displayInCharacterSheet: feature.displayInCharacterSheet ?? true,
                sourceType: feature.sourceType as FeatureSourceType,
                level: feature.level,
                domainId: null,
                featId: null,
                companionId: null,
                editionId: null,
                entities: (feature.entities || []).map((entity): CreateFeatureEntityRequest => {
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
                            featureLevelZero: transformed.featureLevelZero,
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
                        showFullProgression: entity.showFullProgression,
                        filterType: entity.filterType,
                        conditions: (entity.conditions || []).map((cond): CreateFeatureEntityConditionRequest => ({
                            conditionType: cond.conditionType as typeof FeatureEntityConditionType[keyof typeof FeatureEntityConditionType],
                            conditionValue: cond.conditionValue
                        })),
                        formulaParams
                    };
                }),
                displayConditions: (feature.displayConditions || []).map((cond: { conditionType: number; conditionValue: number }): CreateFeatureConditionRequest => ({
                    conditionType: cond.conditionType as typeof FeatureEntityConditionType[keyof typeof FeatureEntityConditionType],
                    conditionValue: cond.conditionValue
                }))
            }));

            await this.createMultipleFeatures(featuresToCreate, context);
        } else {
            // Share features via many-to-many relationship
            // Only share features that aren't already linked to target class
            const existingLinks = await prisma.featureClassMap.findMany({
                where: { classId: targetClassId },
                select: { featureId: true }
            });
            const existingFeatureIds = new Set(existingLinks.map(link => link.featureId));

            const featuresToShare = sourceFeatures.filter(f => !existingFeatureIds.has(f.id));

            if (featuresToShare.length > 0) {
                await prisma.featureClassMap.createMany({
                    data: featuresToShare.map(feature => ({
                        featureId: feature.id,
                        classId: targetClassId
                    }))
                });
            }
        }
    },

    /**
     * Fork a shared feature to make it class-specific.
     * 
     * @param featureId - The feature to fork
     * @param classId - The class to create a class-specific copy for
     * @returns The ID of the newly created forked feature
     */
    async forkFeatureForClass(
        featureId: number,
        classId: number
    ): Promise<number> {
        // Get original feature with all relations
        const original = await this.getFeatureByIdWithChoices(featureId);

        if (!original) {
            throw new Error(`Feature with ID ${featureId} not found`);
        }

        // Remove shared link if it exists
        await prisma.featureClassMap.deleteMany({
            where: {
                featureId: featureId,
                classId: classId
            }
        });

        // Create new feature (copy) with class link via many-to-many relationship
        const context: FeatureContext = { classId: classId };
        const featureToCreate: CreateFeatureRequest = {
            slug: original.slug,
            name: original.name,
            description: original.description,
            summary: original.summary ?? undefined,
            displayInCharacterSheet: original.displayInCharacterSheet,
            sourceType: original.sourceType as FeatureSourceType,
            level: original.level,
            domainId: original.domainId ?? null,
            featId: original.featId ?? null,
            companionId: original.companionId ?? null,
            editionId: original.editionId ?? null,
            entities: original.entities?.map((entity): CreateFeatureEntityRequest => ({
                type: entity.type as EntityType,
                appliesTo: entity.appliesTo as EntityAppliesToType,
                appliesToId: entity.appliesToId,
                appliesToSubId: entity.appliesToSubId,
                value: entity.value,
                bonusType: entity.bonusType as FeatureBonusType | null,
                groupingId: entity.groupingId,
                displayInDetail: entity.displayInDetail,
                showFullProgression: entity.showFullProgression,
                filterType: entity.filterType,
                conditions: entity.conditions?.map((cond: { conditionType: number; conditionValue: number }): CreateFeatureEntityConditionRequest => ({
                    conditionType: cond.conditionType as typeof FeatureEntityConditionType[keyof typeof FeatureEntityConditionType],
                    conditionValue: cond.conditionValue
                })) || [],
                // Formula params are already in application format (arrays) from getFeatureById
                formulaParams: entity.formulaParams ? {
                    formulaId: entity.formulaParams.formulaId,
                    interval: entity.formulaParams.interval,
                    formulaStartLevel: entity.formulaParams.formulaStartLevel,
                    abilityId: entity.formulaParams.abilityId,
                    thresholds: entity.formulaParams.thresholds,
                    values: entity.formulaParams.values,
                    includeProgressionLevel: entity.formulaParams.includeProgressionLevel,
                    featureLevelZero: entity.formulaParams.featureLevelZero,
                    valuesRepresent: entity.formulaParams.valuesRepresent,
                    cumulative: entity.formulaParams.cumulative
                } : undefined
            })) || [],
            displayConditions: original.displayConditions?.map((cond): CreateFeatureConditionRequest => ({
                conditionType: cond.conditionType as typeof FeatureEntityConditionType[keyof typeof FeatureEntityConditionType],
                conditionValue: cond.conditionValue
            })) || []
        };

        await this.createMultipleFeatures([featureToCreate], context);

        // Get the newly created feature ID (find via many-to-many relationship)
        const classLinks = await prisma.featureClassMap.findMany({
            where: { classId: classId },
            select: { featureId: true }
        });
        const featureIds = classLinks.map(link => link.featureId);
        const newFeatures = await prisma.feature.findMany({
            where: {
                id: { in: featureIds },
                slug: original.slug,
                level: original.level
            },
            orderBy: { id: 'desc' },
            take: 1,
            select: { id: true }
        });

        if (newFeatures.length === 0) {
            throw new Error('Failed to create forked feature');
        }

        return newFeatures[0].id;
    },
}; 

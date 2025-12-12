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
import { EntityAppliesToType, SpecialFeatureId } from '@shared/static-data';

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
        const { entities, ...progressionData } = data;

        const result = await prisma.$transaction(async (tx) => {
            // Create the feature progression
            const featureProgression = await tx.featureProgression.create({
                data: progressionData,
            });

            // Create related entities
            await createRelatedEntities(tx, entities, featureProgression.id);

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
                const { entities, ...progressionData } = progression;

                // Create the feature progression with context
                const featureProgression = await transactionClient.featureProgression.create({
                    data: {
                        ...progressionData,
                        classId: context.classId || null,
                        raceId: context.raceId || null,
                        variantOverrideId: context.variantOverrideId || null,
                        domainId: context.domainId || null,
                    },
                });

                // Create related entities
                await createRelatedEntities(transactionClient, entities, featureProgression.id);

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
        const whereClause: { classId?: number; raceId?: number; variantOverrideId?: number; domainId?: number } = {};
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

                // Delete conditions first (they reference entities)
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
                select: { id: true }
            });

            if (existingProgressions.length > 0) {
                const progressionIds = existingProgressions.map(p => p.id);

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

                // Delete conditions first (they reference entities)
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
            }

            // Create new progressions
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
                        },
                    });

                    // Create related entities
                    await createRelatedEntities(tx, entities, featureProgression.id);

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
    async getFeatureProgressionsByIds(progressionIds: number[]): Promise<FeatureProgression[]> {
        if (progressionIds.length === 0) {
            return [];
        }

        // Single query with all the complex includes
        const progressions = await prisma.featureProgression.findMany({
            where: { id: { in: progressionIds } },
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
                entities: {
                    include: {
                        formulaParams: true,
                        conditions: true
                    }
                }
            }
        });

        // Fetch items, feats, and features for entities that need them
        const allEntities = progressions.flatMap(p => p.entities);
        const itemIds = allEntities
            .filter(e => e.appliesToSubId && e.appliesToSubId > 0)
            .map(e => e.appliesToSubId!);

        // Also fetch items for Weapon Familiarity entities (stored in appliesToId)
        const weaponFamiliarityItemIds = allEntities
            .filter(e => e.appliesTo === EntityAppliesToType.WeaponFamiliarity && e.appliesToId !== null && e.appliesToId !== undefined)
            .map(e => e.appliesToId!)
            .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates
        const featIds = allEntities
            .filter(e => e.appliesTo === EntityAppliesToType.Feat && e.appliesToId !== null && e.appliesToId !== undefined)
            .map(e => e.appliesToId!)
            .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates
        const featureIds = allEntities
            .filter(e => e.appliesTo === EntityAppliesToType.Feature && e.appliesToId !== null && e.appliesToId !== undefined)
            .map(e => e.appliesToId!)
            .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates
        const spellIds = allEntities
            .filter(e => e.appliesTo === EntityAppliesToType.Spell && e.appliesToId !== null && e.appliesToId !== undefined)
            .map(e => e.appliesToId!)
            .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates
        const domainIds = allEntities
            .filter(e => e.appliesTo === EntityAppliesToType.Domain && e.appliesToId !== null && e.appliesToId !== undefined)
            .map(e => e.appliesToId!)
            .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates

        // Fetch items, feats, and features
        const allItemIds = [...itemIds, ...weaponFamiliarityItemIds];
        const items = allItemIds.length > 0 ? await prisma.item.findMany({
            where: { id: { in: allItemIds } }
        }) : [];

        const feats = featIds.length > 0 ? await prisma.feat.findMany({
            where: { id: { in: featIds } },
            include: {
                benefits: true
            }
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


        // Create lookup maps
        const itemMap = new Map(items.map(item => [item.id, item]));
        const featMap = new Map(feats.map(feat => [feat.id, feat]));
        const featureMap = new Map(features.map(feature => [feature.id, feature]));
        const spellMap = new Map(spells.map(spell => [spell.id, spell]));
        const domainMap = new Map(domains.map(domain => [domain.id, domain]));

        // Transform formula parameters and add item/feat data
        const transformedProgressions = progressions.map(progression => ({
            ...progression,
            entities: progression.entities?.map(entity => ({
                ...entity,
                formulaParams: entity.formulaParams
                    ? transformFormulaParamsFromDatabase(entity.formulaParams)
                    : null,
                // Add item data if appliesToSubId > 0 OR if it's Weapon Familiarity (appliesToId)
                item: entity.appliesToSubId && entity.appliesToSubId > 0
                    ? itemMap.get(entity.appliesToSubId) || null
                    : entity.appliesTo === EntityAppliesToType.WeaponFamiliarity && entity.appliesToId
                        ? itemMap.get(entity.appliesToId) || null
                        : null,
                // Add feat data if appliesTo === Feat
                feat: entity.appliesTo === EntityAppliesToType.Feat && entity.appliesToId
                    ? featMap.get(entity.appliesToId) || null
                    : null,
                // Add feature data if appliesTo === Feature
                feature: entity.appliesTo === EntityAppliesToType.Feature && entity.appliesToId
                    ? featureMap.get(entity.appliesToId) || null
                    : null,
                // Add spell data if appliesTo === Spell (minimal data only)
                spell: entity.appliesTo === EntityAppliesToType.Spell && entity.appliesToId
                    ? spellMap.get(entity.appliesToId) || null
                    : null,
                // Add domain data if appliesTo === Domain (minimal data only)
                domain: entity.appliesTo === EntityAppliesToType.Domain && entity.appliesToId
                    ? domainMap.get(entity.appliesToId) || null
                    : null
            }))
        }));

        return transformedProgressions as FeatureProgression[];
    },

    // NEW: Lightweight wrapper methods
    async getFeatureProgressionsByClassId(classId: number): Promise<FeatureProgression[]> {
        // Get progression IDs for this class
        const progressionIds = await prisma.featureProgression.findMany({
            where: { classId },
            select: { id: true }
        });

        // Delegate to core method
        return await this.getFeatureProgressionsByIds(progressionIds.map(p => p.id));
    },

    async getFeatureProgressionsByRaceId(raceId: number): Promise<FeatureProgression[]> {
        // Get progression IDs for this race
        const progressionIds = await prisma.featureProgression.findMany({
            where: { raceId },
            select: { id: true }
        });

        // Delegate to core method
        return await this.getFeatureProgressionsByIds(progressionIds.map(p => p.id));
    },

    async getFeatureProgressionsByDomainId(domainId: number): Promise<FeatureProgression[]> {
        // Get progression IDs for this domain
        const progressionIds = await prisma.featureProgression.findMany({
            where: { domainId },
            select: { id: true }
        });

        // Delegate to core method
        return await this.getFeatureProgressionsByIds(progressionIds.map(p => p.id));
    },

    async getFeatureProgressionById(progressionId: number): Promise<FeatureProgression | null> {
        const progressions = await this.getFeatureProgressionsByIds([progressionId]);
        return progressions.length > 0 ? progressions[0] : null;
    },
}; 

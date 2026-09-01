/**
 * Class Service - Central service for all class management operations.
 * 
 * This service provides comprehensive class management capabilities including:
 * - Class CRUD operations (create, read, update, delete)
 * - Class feature feature management through feature system integration
 * - Spellcasting integration for classes with spellcasting abilities
 * - Variant class relationship management
 * - Formula parameter handling for class features
 * 
 * Architecture Decisions:
 * - Feature System Integration: All class features are managed through the feature
 *   system service, ensuring consistency with other feature sources (races, domains)
 * - Spellcasting Support: Integrates with spell system for class spell lists and
 *   spell feature management
 * - Variant Classes: Supports variant classes that modify base class features
 * - Formula Parameters: Handles complex feature formulas with conditional scaling
 * 
 * Usage Pattern:
 * Controllers call service methods which delegate feature operations to the feature
 * system service, ensuring all features use the same underlying system.
 * 
 * Source File: `apps/backend/src/features/class/classService.ts`
 * 
 * @see ClassService interface for method signatures
 * @see classController for HTTP request handling
 * @see classRoutes for API endpoint definitions
 */

import { prisma } from '@/lib/prisma';
import {
    GetAllClassesResponse,
    GetAllClassesQuery,
    CreateClassRequest,
    UpdateClassRequest,
    IdParamRequest,
    DnDClass,
    CreateResponse,
    CreateSpellcastingProgressionRequest,
    CreateSpellcastingSlotRequest,
    ClassCacheResponse,
} from '@shared/schema';
import { FeatureSourceType, EntityType, EntityAppliesToType } from '@shared/static-data';
import { buildEditionWhereClause } from '@shared/utils';

import type { ClassService } from './types';
import { featureSystemService } from '../featureSystem/featureSystemService';

/**
 * Detects if an ID is a temporary frontend ID (created with Date.now() + Math.random())
 * vs a real database ID.
 * 
 * **Always Send IDs Pattern**: This function is part of the architecture pattern where
 * the frontend always sends IDs (temporary for new items, real for existing) and the
 * backend uses this function to distinguish between them. This eliminates the need for
 * frontend logic to determine whether an item is new or existing.
 * 
 * **Temporary ID Format**: Frontend generates temporary IDs using `Date.now() + Math.random()`,
 * which creates numbers that are:
 * - Very large (Date.now() is ~1.7 trillion as of 2024)
 * - May have decimal parts (from Math.random())
 * - Always >= 1 billion
 * 
 * **Real Database IDs**: Database auto-increment IDs are:
 * - Positive integers (no decimals)
 * - Typically much smaller (< 1 billion in practice)
 * 
 * @param id - The ID to check
 * @returns `true` if the ID is a temporary frontend ID, `false` if it's a real database ID
 */
function isTemporaryId(id: number): boolean {
    // Temporary IDs are very large (Date.now() is ~1.7 trillion) and may have decimals
    // Real database IDs are positive integers, typically < 1 billion
    return !Number.isInteger(id) || id >= 1000000000;
}

export const classService: ClassService = {
    async getAllClasses(query?: GetAllClassesQuery): Promise<GetAllClassesResponse> {

        // Build where clause for base classes
        const whereClause: Omit<Partial<GetAllClassesQuery>, 'editionId'> & { editionId?: number | { in: number[] } } = {};
        if (query?.isVisible !== undefined) {
            whereClause.isVisible = query.isVisible;
        }
        if (query?.isPrestige !== undefined) {
            whereClause.isPrestige = query.isPrestige;
        }
        if (query?.canCastSpells !== undefined) {
            whereClause.canCastSpells = query.canCastSpells;
        }
        if (query?.editionId !== undefined) {
            const editionClause = buildEditionWhereClause(query.editionId);
            Object.assign(whereClause, editionClause);
        }
        if (query?.editionIds !== undefined && query.editionIds.length > 0) {
            whereClause.editionId = { in: query.editionIds };
        }

        const classes = await prisma.class.findMany({
            where: whereClause,
            orderBy: { name: 'asc' },
            include: {
                sourceBookInfo: {
                    select: {
                        sourceBookId: true,
                        pageNumber: true
                    }
                },
            }
        });

        return {
            total: classes.length,
            results: classes as GetAllClassesResponse['results'],
        };
    },

    async getClassById(
        query: IdParamRequest,
        characterFeatureChoices?: Array<{ featureId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>
    ): Promise<DnDClass | null> {
        const classData = await prisma.class.findUnique({
            where: { id: query.id },
            include: {
                sourceBookInfo: {
                    select: {
                        sourceBookId: true,
                        pageNumber: true
                    }
                },
            },
        });

        if (!classData) {
            return null;
        }

        // Get feature IDs using the new architecture
        const features = await featureSystemService.getFeaturesByClassId(query.id, characterFeatureChoices);

        // Combine class data with feature IDs only
        // Spellcasting is now handled via FeatureWithRelations, so these fields are null
        const transformedClassData = {
            ...classData,
            featureIds: features.map(f => f.id),
            spellcastingProgression: null,
            spellsKnownProgression: null,
            sourceBookInfo: classData.sourceBookInfo !== undefined ? classData.sourceBookInfo : null,
        };

        return transformedClassData as DnDClass;
    },

    async getClassFeatures(
        query: IdParamRequest,
        characterFeatureChoices?: Array<{ featureId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>
    ) {
        return featureSystemService.getFeaturesByClassId(query.id, characterFeatureChoices, true);
    },

    async createClass(data: CreateClassRequest): Promise<CreateResponse> {
        const { featureIds, spellcastingProgression, spellsKnownProgression, ...classData } = data;

        const result = await prisma.$transaction(async (tx) => {
            // Create the class first
            const classResult = await tx.class.create({
                data: {
                    ...classData,
                    sourceBookInfo: {
                        create: data.sourceBookInfo?.map(sourceBookInfo => ({
                            sourceBookId: sourceBookInfo.sourceBookId,
                            pageNumber: sourceBookInfo.pageNumber
                        })) || [],
                    },
                },
            });

            // Sync FeatureClassMap links using featureIds
            if (featureIds && featureIds.length > 0) {
                await featureSystemService.syncClassFeatures(classResult.id, featureIds, tx);
            }

            // Create spellcasting feature (spell slots)
            // Phase 3: Also create FeatureWithRelations entries that link to SpellcastingProgression
            if (spellcastingProgression && spellcastingProgression.length > 0) {
                for (const spellcastingFeature of spellcastingProgression as CreateSpellcastingProgressionRequest[]) {
                    const { slots, ...progressionData } = spellcastingFeature;

                    // Create the spellcasting feature
                    const createdSpellcastingProgression = await tx.spellcastingProgression.create({
                        data: {
                            ...progressionData,
                            spellcastingType: classResult.spellsKnown ? 2 : 1, // 1 = SpellsPerDay, 2 = SpellsKnown
                        },
                    });

                    // Create related slots
                    if (slots && slots.length > 0) {
                        await tx.spellcastingSlot.createMany({
                            data: slots.map((slot: CreateSpellcastingSlotRequest) => ({
                                ...slot,
                                progressionId: createdSpellcastingProgression.id,
                            })),
                        });
                    }

                    // Phase 3: Create FeatureWithRelations that links to this SpellcastingProgression
                    // Create Feature for spellcasting (merged Feature/FeatureWithRelations)
                    const feature = await tx.feature.create({
                        data: {
                            slug: `spellcasting-${classResult.name.toLowerCase().replace(/\s+/g, '-')}`,
                            name: `${classResult.name} Spellcasting`,
                            description: `Spellcasting ability for ${classResult.name}`,
                            displayInCharacterSheet: false,
                            sourceType: FeatureSourceType.Class,
                            level: 1
                        }
                    });

                    // Link to class via many-to-many relationship
                    await tx.featureClassMap.create({
                        data: {
                            featureId: feature.id,
                            classId: classResult.id
                        }
                    });

                    // Create FeatureEntity for SpellcastingProgression reference
                    await tx.featureEntity.create({
                        data: {
                            featureId: feature.id,
                            type: EntityType.Base,
                            appliesTo: EntityAppliesToType.SpellcastingProgression,
                            appliesToId: null,
                            appliesToSubId: null,
                            value: createdSpellcastingProgression.id,
                            bonusType: null,
                            groupingId: 0,
                            displayInDetail: true,
                            showFullProgression: false
                        }
                    });

                    // Note: Casting ability and type should be added via feature features
                    // They are no longer stored directly on the Class model

                    // Link SpellcastingProgression to Feature
                    await tx.spellcastingProgression.update({
                        where: { id: createdSpellcastingProgression.id },
                        data: {
                            featureId: feature.id
                        }
                    });
                }
            }

            // Create spells known feature
            // Phase 3: Also create FeatureWithRelations entries that link to SpellcastingProgression
            if (spellsKnownProgression && spellsKnownProgression.length > 0) {
                for (const feature of spellsKnownProgression as CreateSpellcastingProgressionRequest[]) {
                    const { slots, ...progressionData } = feature;

                    // Create the spells known feature
                    const createdSpellsKnownProgression = await tx.spellcastingProgression.create({
                        data: {
                            ...progressionData,
                            spellcastingType: 2, // 2 = SpellsKnown
                        },
                    });

                    // Create related slots
                    if (slots && slots.length > 0) {
                        await tx.spellcastingSlot.createMany({
                            data: slots.map((slot: CreateSpellcastingSlotRequest) => ({
                                ...slot,
                                progressionId: createdSpellsKnownProgression.id,
                            })),
                        });
                    }

                    // Phase 3: Create Feature that links to this SpellcastingProgression
                    // Note: Since featureId is unique, spells-known gets its own Feature
                    // Create Feature for spells-known (merged Feature/FeatureWithRelations)
                    const spellsKnownFeature = await tx.feature.create({
                        data: {
                            slug: `spellcasting-spells-known-${classResult.name.toLowerCase().replace(/\s+/g, '-')}`,
                            name: `${classResult.name} Spells Known`,
                            description: `Spells known feature for ${classResult.name}`,
                            displayInCharacterSheet: false,
                            sourceType: FeatureSourceType.Class,
                            level: 1
                        }
                    });

                    // Link to class via many-to-many relationship
                    await tx.featureClassMap.create({
                        data: {
                            featureId: spellsKnownFeature.id,
                            classId: classResult.id
                        }
                    });

                    // Create FeatureEntity for SpellsKnown progression reference
                    await tx.featureEntity.create({
                        data: {
                            featureId: spellsKnownFeature.id,
                            type: EntityType.Base,
                            appliesTo: EntityAppliesToType.SpellsKnownProgression,
                            appliesToId: null,
                            appliesToSubId: null,
                            value: createdSpellsKnownProgression.id,
                            bonusType: null,
                            groupingId: 0,
                            displayInDetail: true,
                            showFullProgression: false
                        }
                    });

                    // Link SpellcastingProgression to FeatureWithRelations
                    await tx.spellcastingProgression.update({
                        where: { id: createdSpellsKnownProgression.id },
                        data: {
                            featureId: spellsKnownFeature.id
                        }
                    });
                }
            }

            return classResult;
        });

        return { id: result.id.toString(), message: 'Class created successfully' };
    },

    async updateClass(query: IdParamRequest, data: UpdateClassRequest) {
        await prisma.$transaction(async (tx) => {
            // Delete existing source book mappings
            await tx.classSourceMap.deleteMany({ where: { classId: query.id } });

            // Delete existing spellcasting feature and slots
            // Find via FeatureClassMap links
            const classFeatures = await tx.featureClassMap.findMany({
                where: {
                    classId: query.id
                },
                select: { featureId: true }
            });

            const existingFeatureIds = classFeatures.map(fp => fp.featureId);

            if (existingFeatureIds.length > 0) {
                const existingSpellcastingProgressions = await tx.spellcastingProgression.findMany({
                    where: { featureId: { in: existingFeatureIds } },
                    select: { id: true }
                });

                if (existingSpellcastingProgressions.length > 0) {
                    const progressionIds = existingSpellcastingProgressions.map(p => p.id);

                    // Delete related slots first
                    await tx.spellcastingSlot.deleteMany({
                        where: { progressionId: { in: progressionIds } }
                    });

                    // Delete the features
                    await tx.spellcastingProgression.deleteMany({
                        where: { id: { in: progressionIds } }
                    });
                }
            }

            const { featureIds, spellcastingProgression, spellsKnownProgression, ...classData } = data;

            // Remove deprecated fields that are now stored in feature features
            const { hitDie: _hitDie, skillPoints: _skillPoints, babProgression: _babProgression, fortProgression: _fortProgression, refProgression: _refProgression, willProgression: _willProgression, ...validClassData } = classData as Record<string, unknown>;

            // Update the class
            await tx.class.update({
                where: { id: query.id },
                data: {
                    ...validClassData,
                    sourceBookInfo: {
                        create: data.sourceBookInfo?.map(sourceBookInfo => ({
                            sourceBookId: sourceBookInfo.sourceBookId,
                            pageNumber: sourceBookInfo.pageNumber
                        })) || []
                    },
                },
            });

            // Sync FeatureClassMap links using featureIds from request.
            // IMPORTANT: `featureIds` is optional in UpdateClassRequest. When omitted, treat it as "no change".
            // Only sync when the caller explicitly provides an array (including empty array to remove all).
            if (Array.isArray(featureIds)) {
                await featureSystemService.syncClassFeatures(query.id, featureIds, tx);
            }

            // Create new spellcasting feature (spell slots)
            // Phase 3: Also create FeatureWithRelations entries that link to SpellcastingProgression
            if (spellcastingProgression && spellcastingProgression.length > 0) {
                // Get updated class data for spellcasting info
                const updatedClass = await tx.class.findUnique({
                    where: { id: query.id },
                    select: {
                        name: true,
                        spellsKnown: true
                    }
                });

                if (!updatedClass) {
                    throw new Error('Class not found');
                }

                for (const spellcastingFeature of spellcastingProgression as CreateSpellcastingProgressionRequest[]) {
                    const { slots, ...progressionData } = spellcastingFeature;

                    // Create the spellcasting feature
                    const createdSpellcastingProgression = await tx.spellcastingProgression.create({
                        data: {
                            ...progressionData,
                            spellcastingType: updatedClass.spellsKnown ? 2 : 1, // 1 = SpellsPerDay, 2 = SpellsKnown
                        },
                    });

                    // Create related slots
                    if (slots && slots.length > 0) {
                        await tx.spellcastingSlot.createMany({
                            data: slots.map((slot: CreateSpellcastingSlotRequest) => ({
                                ...slot,
                                progressionId: createdSpellcastingProgression.id,
                            })),
                        });
                    }

                    // Phase 3: Create FeatureWithRelations that links to this SpellcastingProgression
                    // Create Feature for spellcasting (merged Feature/FeatureWithRelations)
                    const feature = await tx.feature.create({
                        data: {
                            slug: `spellcasting-${updatedClass.name.toLowerCase().replace(/\s+/g, '-')}`,
                            name: `${updatedClass.name} Spellcasting`,
                            description: `Spellcasting ability for ${updatedClass.name}`,
                            displayInCharacterSheet: false,
                            sourceType: FeatureSourceType.Class,
                            level: 1
                        }
                    });

                    // Link to class via many-to-many relationship
                    await tx.featureClassMap.create({
                        data: {
                            featureId: feature.id,
                            classId: query.id
                        }
                    });

                    // Create FeatureEntity for SpellcastingProgression reference
                    await tx.featureEntity.create({
                        data: {
                            featureId: feature.id,
                            type: EntityType.Base,
                            appliesTo: EntityAppliesToType.SpellcastingProgression,
                            appliesToId: null,
                            appliesToSubId: null,
                            value: createdSpellcastingProgression.id,
                            bonusType: null,
                            groupingId: 0,
                            displayInDetail: true,
                            showFullProgression: false
                        }
                    });

                    // Note: Casting ability and type should be added via features
                    // They are no longer stored directly on the Class model

                    // Link SpellcastingProgression to Feature
                    await tx.spellcastingProgression.update({
                        where: { id: createdSpellcastingProgression.id },
                        data: {
                            featureId: feature.id
                        }
                    });
                }
            }

            // Create new spells known feature
            // Phase 3: Also create FeatureWithRelations entries that link to SpellcastingProgression
            if (spellsKnownProgression && spellsKnownProgression.length > 0) {
                // Get updated class data for spellcasting info
                const updatedClass = await tx.class.findUnique({
                    where: { id: query.id },
                    select: {
                        name: true,
                        spellsKnown: true
                    }
                });

                if (!updatedClass) {
                    throw new Error('Class not found');
                }

                for (const feature of spellsKnownProgression as CreateSpellcastingProgressionRequest[]) {
                    const { slots, ...progressionData } = feature;

                    // Create the spells known feature
                    const createdSpellsKnownProgression = await tx.spellcastingProgression.create({
                        data: {
                            ...progressionData,
                            spellcastingType: 2, // 2 = SpellsKnown
                        },
                    });

                    // Create related slots
                    if (slots && slots.length > 0) {
                        await tx.spellcastingSlot.createMany({
                            data: slots.map((slot: CreateSpellcastingSlotRequest) => ({
                                ...slot,
                                progressionId: createdSpellsKnownProgression.id,
                            })),
                        });
                    }

                    // Phase 3: Create Feature that links to this SpellcastingProgression
                    // Note: Since featureId is unique, spells-known gets its own Feature
                    // Create Feature for spells-known (merged Feature/FeatureWithRelations)
                    const spellsKnownFeature = await tx.feature.create({
                        data: {
                            slug: `spellcasting-spells-known-${updatedClass.name.toLowerCase().replace(/\s+/g, '-')}`,
                            name: `${updatedClass.name} Spells Known`,
                            description: `Spells known feature for ${updatedClass.name}`,
                            displayInCharacterSheet: false,
                            sourceType: FeatureSourceType.Class,
                            level: 1
                        }
                    });

                    // Link to class via many-to-many relationship
                    await tx.featureClassMap.create({
                        data: {
                            featureId: spellsKnownFeature.id,
                            classId: query.id
                        }
                    });

                    // Create FeatureEntity for SpellsKnown progression reference
                    await tx.featureEntity.create({
                        data: {
                            featureId: spellsKnownFeature.id,
                            type: EntityType.Base,
                            appliesTo: EntityAppliesToType.SpellsKnownProgression,
                            appliesToId: null,
                            appliesToSubId: null,
                            value: createdSpellsKnownProgression.id,
                            bonusType: null,
                            groupingId: 0,
                            displayInDetail: true,
                            showFullProgression: false
                        }
                    });

                    // Link SpellcastingProgression to Feature
                    await tx.spellcastingProgression.update({
                        where: { id: createdSpellsKnownProgression.id },
                        data: {
                            featureId: spellsKnownFeature.id
                        }
                    });
                }
            }
        }, {
            timeout: 60000 // 60 seconds timeout for large operations
        });

        return { message: 'Class updated successfully' };
    },

    async deleteClass(query: IdParamRequest) {
        await prisma.class.delete({
            where: { id: query.id },
        });

        return { message: 'Class deleted successfully' };
    },

    async getClassCache(): Promise<ClassCacheResponse> {
        const classes = await prisma.class.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                abbreviation: true,
                editionId: true,
                isPrestige: true,
                isVisible: true,
                canCastSpells: true,
                isDivine: true,
            }
        });

        return {
            total: classes.length,
            results: classes,
        };
    },

};

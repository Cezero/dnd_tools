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

import { PrismaClient } from '@shared/prisma-client';
import {
    GetAllClassesResponse,
    GetAllClassesQuery,
    CreateClassRequest,
    UpdateClassRequest,
    ClassIdParamRequest,
    DnDClass,
    CreateResponse,
    CreateSpellcastingProgressionRequest,
    CreateSpellcastingSlotRequest,
    ClassCacheResponse,
    CreateFeatureRequest,
    UpdateFeature,
} from '@shared/schema';
import { FeatureSourceType, EntityType, EntityAppliesToType } from '@shared/static-data';
import { buildEditionWhereClause } from '@shared/utils';

import type { ClassService } from './types';
import { featureSystemService } from '../featureSystem/featureSystemService';
import type { FeatureContext } from '../featureSystem/types';

const prisma = new PrismaClient();

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
        query: ClassIdParamRequest,
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

        // Get feature features using the new architecture
        // Pass character feature choices to enrich features with choice data
        const features = await featureSystemService.getFeaturesByClassId(query.id, characterFeatureChoices);

        // Combine class data with enriched feature features
        // Spellcasting is now handled via FeatureWithRelations, so these fields are null
        const transformedClassData = {
            ...classData,
            features,
            spellcastingProgression: null,
            spellsKnownProgression: null,
            sourceBookInfo: classData.sourceBookInfo !== undefined ? classData.sourceBookInfo : null,
        };

        return transformedClassData as DnDClass;
    },

    async createClass(data: CreateClassRequest): Promise<CreateResponse> {
        const { features, spellcastingProgression, spellsKnownProgression, ...classData } = data;

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

            // Create feature features using consolidated feature system service
            // Convert UpdateFeature[] to CreateFeatureRequest[] by providing defaults
            if (features && features.length > 0) {
                const context: FeatureContext = { classId: classResult.id };
                const createProgressions: CreateFeatureRequest[] = features.map(prog => ({
                    name: prog.name ?? '',
                    slug: prog.slug ?? '',
                    description: prog.description ?? '',
                    summary: prog.summary ?? null,
                    displayInCharacterSheet: prog.displayInCharacterSheet ?? true,
                    level: prog.level ?? 1,
                    sourceType: prog.sourceType ?? FeatureSourceType.Class,
                    domainId: prog.domainId ?? null,
                    featId: prog.featId ?? null,
                    companionId: prog.companionId ?? null,
                    editionId: prog.editionId ?? null,
                    entities: prog.entities,
                    displayConditions: prog.displayConditions,
                }));
                await featureSystemService.createMultipleFeatures(createProgressions, context);
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
                            displayInDetail: true
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

                    // Create FeatureEntity for SpellsKnown SpellcastingProgression reference
                    await tx.featureEntity.create({
                        data: {
                            featureId: spellsKnownFeature.id,
                            type: EntityType.Other,
                            appliesTo: EntityAppliesToType.SpellcastingProgression,
                            appliesToId: null,
                            appliesToSubId: null,
                            value: createdSpellsKnownProgression.id,
                            bonusType: null,
                            groupingId: 0,
                            displayInDetail: true
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

    async updateClass(query: ClassIdParamRequest, data: UpdateClassRequest) {
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

            const featureIds = classFeatures.map(fp => fp.featureId);

            if (featureIds.length > 0) {
                const existingSpellcastingProgressions = await tx.spellcastingProgression.findMany({
                    where: { featureId: { in: featureIds } },
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

            const { features, spellcastingProgression, spellsKnownProgression, ...classData } = data;

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

            // Sync FeatureClassMap links
            // Features are already saved via state system, we only need to sync the links
            if (features && features.length > 0) {
                console.log(`[ClassService] Syncing FeatureClassMap for class ${query.id} with ${features.length} features`);

                // Extract feature IDs from the features array
                // Features should have id fields (they were already saved via state system)
                const featureIds: number[] = [];
                for (const feature of features) {
                    if (feature.id && typeof feature.id === 'number' && !isTemporaryId(feature.id)) {
                        featureIds.push(feature.id);
                    }
                }

                console.log(`[ClassService] Extracted ${featureIds.length} feature IDs: ${featureIds.join(', ')}`);

                // Verify all feature IDs exist in database
                if (featureIds.length > 0) {
                    const existingFeatures = await tx.feature.findMany({
                        where: { id: { in: featureIds } },
                        select: { id: true }
                    });

                    const foundIds = new Set(existingFeatures.map(f => f.id));
                    const missingIds = featureIds.filter(id => !foundIds.has(id));

                    if (missingIds.length > 0) {
                        console.error(`[ClassService] WARNING: ${missingIds.length} feature IDs not found in database: ${missingIds.join(', ')}`);
                        // Filter out missing IDs
                        const validFeatureIds = featureIds.filter(id => foundIds.has(id));
                        await featureSystemService.syncClassFeatures(query.id, validFeatureIds, tx);
                    } else {
                        // All IDs are valid, sync links
                        await featureSystemService.syncClassFeatures(query.id, featureIds, tx);
                    }
                } else {
                    console.warn(`[ClassService] No valid feature IDs found in features array`);
                    // Sync to empty list (removes all links for this class)
                    await featureSystemService.syncClassFeatures(query.id, [], tx);
                }
            } else {
                // No features provided - sync to empty list (removes all links for this class)
                console.log(`[ClassService] No features provided for class ${query.id}, removing all FeatureClassMap entries`);
                await featureSystemService.syncClassFeatures(query.id, [], tx);
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
                            displayInDetail: true
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

                    // Create FeatureEntity for SpellsKnown SpellcastingProgression reference
                    await tx.featureEntity.create({
                        data: {
                            featureId: spellsKnownFeature.id,
                            type: EntityType.Other,
                            appliesTo: EntityAppliesToType.SpellcastingProgression,
                            appliesToId: null,
                            appliesToSubId: null,
                            value: createdSpellsKnownProgression.id,
                            bonusType: null,
                            groupingId: 0,
                            displayInDetail: true
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

    async deleteClass(query: ClassIdParamRequest) {
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

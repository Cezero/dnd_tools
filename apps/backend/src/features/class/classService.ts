/**
 * Class Service - Central service for all class management operations.
 * 
 * This service provides comprehensive class management capabilities including:
 * - Class CRUD operations (create, read, update, delete)
 * - Class feature progression management through feature system integration
 * - Spellcasting integration for classes with spellcasting abilities
 * - Variant class relationship management
 * - Formula parameter handling for class features
 * 
 * Architecture Decisions:
 * - Feature System Integration: All class features are managed through the feature
 *   system service, ensuring consistency with other feature sources (races, domains)
 * - Spellcasting Support: Integrates with spell system for class spell lists and
 *   spell progression management
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
    CreateFeatureProgressionRequest,
    UpdateFeatureProgression,
} from '@shared/schema';
import { FeatureSourceType, EntityType, EntityAppliesToType } from '@shared/static-data';
import { buildEditionWhereClause } from '@shared/utils';

import type { ClassService } from './types';
import { featureSystemService } from '../featureSystem/featureSystemService';
import type { FeatureProgressionContext } from '../featureSystem/types';

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
        characterFeatureChoices?: Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>
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
                spellcastingProgression: {
                    include: {
                        slots: true,
                    },
                },
                classSpellsKnown: {
                    include: {
                        slots: true,
                    },
                },
            },
        });

        if (!classData) {
            return null;
        }

        // Get feature progressions using the new architecture
        // Pass character feature choices to enrich progressions with choice data
        const features = await featureSystemService.getFeatureProgressionsByClassId(query.id, characterFeatureChoices);

        // Combine class data with enriched feature progressions
        const transformedClassData = {
            ...classData,
            features,
            spellcastingProgression: classData.spellcastingProgression ?? null,
            spellsKnownProgression: classData.classSpellsKnown ?? null,
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

            // Create feature progressions using consolidated feature system service
            // Convert UpdateFeatureProgression[] to CreateFeatureProgressionRequest[] by providing defaults
            if (features && features.length > 0) {
                const context: FeatureProgressionContext = { classId: classResult.id };
                const createProgressions: CreateFeatureProgressionRequest[] = features.map(prog => ({
                    level: prog.level ?? 1,
                    sourceType: prog.sourceType ?? FeatureSourceType.Class,
                    featureId: prog.featureId!,
                    domainId: prog.domainId ?? null,
                    featId: prog.featId ?? null,
                    companionId: prog.companionId ?? null,
                    editionId: prog.editionId ?? null,
                    entities: prog.entities,
                    displayConditions: prog.displayConditions,
                }));
                await featureSystemService.createMultipleFeatureProgressions(createProgressions, context);
            }

            // Create spellcasting progression (spell slots)
            // Phase 3: Also create FeatureProgression entries that link to SpellcastingProgression
            if (spellcastingProgression && spellcastingProgression.length > 0) {
                for (const progression of spellcastingProgression as CreateSpellcastingProgressionRequest[]) {
                    const { slots, ...progressionData } = progression;

                    // Create the spellcasting progression (keep classId for backward compatibility)
                    const createdSpellcastingProgression = await tx.spellcastingProgression.create({
                        data: {
                            ...progressionData,
                            classId: classResult.id, // Keep for backward compatibility
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

                    // Phase 3: Create FeatureProgression that links to this SpellcastingProgression
                    // Find or create spellcasting feature
                    let spellcastingFeature = await tx.feature.findFirst({
                        where: {
                            slug: `spellcasting-${classResult.name.toLowerCase().replace(/\s+/g, '-')}`
                        }
                    });

                    if (!spellcastingFeature) {
                        spellcastingFeature = await tx.feature.create({
                            data: {
                                slug: `spellcasting-${classResult.name.toLowerCase().replace(/\s+/g, '-')}`,
                                name: `${classResult.name} Spellcasting`,
                                description: `Spellcasting ability for ${classResult.name}`,
                                displayInCharacterSheet: false
                            }
                        });
                    }

                    // Create FeatureProgression for spellcasting
                    const featureProgression = await tx.featureProgression.create({
                        data: {
                            sourceType: FeatureSourceType.Class,
                            level: 1,
                            featureId: spellcastingFeature.id
                        }
                    });

                    // Link to class via many-to-many relationship
                    await tx.featureProgressionClassMap.create({
                        data: {
                            progressionId: featureProgression.id,
                            classId: classResult.id
                        }
                    });

                    // Create FeatureEntity for SpellcastingProgression reference
                    await tx.featureEntity.create({
                        data: {
                            progressionId: featureProgression.id,
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

                    // Note: Casting ability and type should be added via feature progressions
                    // They are no longer stored directly on the Class model

                    // Link SpellcastingProgression to FeatureProgression
                    await tx.spellcastingProgression.update({
                        where: { id: createdSpellcastingProgression.id },
                        data: {
                            featureProgressionId: featureProgression.id
                        }
                    });
                }
            }

            // Create spells known progression
            // Phase 3: Also create FeatureProgression entries that link to SpellcastingProgression
            if (spellsKnownProgression && spellsKnownProgression.length > 0) {
                for (const progression of spellsKnownProgression as CreateSpellcastingProgressionRequest[]) {
                    const { slots, ...progressionData } = progression;

                    // Create the spells known progression (keep classId for backward compatibility)
                    const createdSpellsKnownProgression = await tx.spellcastingProgression.create({
                        data: {
                            ...progressionData,
                            classId: classResult.id, // Keep for backward compatibility
                            classSpellsKnownId: classResult.id, // Link to the class via spells known relation
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

                    // Phase 3: Create FeatureProgression that links to this SpellcastingProgression
                    // Note: Since featureProgressionId is unique, spells-known gets its own FeatureProgression
                    // Find or create spellcasting feature for spells-known
                    let spellsKnownFeature = await tx.feature.findFirst({
                        where: {
                            slug: `spellcasting-spells-known-${classResult.name.toLowerCase().replace(/\s+/g, '-')}`
                        }
                    });

                    if (!spellsKnownFeature) {
                        spellsKnownFeature = await tx.feature.create({
                            data: {
                                slug: `spellcasting-spells-known-${classResult.name.toLowerCase().replace(/\s+/g, '-')}`,
                                name: `${classResult.name} Spells Known`,
                                description: `Spells known progression for ${classResult.name}`,
                                displayInCharacterSheet: false
                            }
                        });
                    }

                    // Create FeatureProgression for spells-known
                    const spellsKnownFeatureProgression = await tx.featureProgression.create({
                        data: {
                            sourceType: FeatureSourceType.Class,
                            level: 1,
                            featureId: spellsKnownFeature.id
                        }
                    });

                    // Link to class via many-to-many relationship
                    await tx.featureProgressionClassMap.create({
                        data: {
                            progressionId: spellsKnownFeatureProgression.id,
                            classId: classResult.id
                        }
                    });

                    // Create FeatureEntity for SpellsKnown SpellcastingProgression reference
                    await tx.featureEntity.create({
                        data: {
                            progressionId: spellsKnownFeatureProgression.id,
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

                    // Link SpellcastingProgression to FeatureProgression
                    await tx.spellcastingProgression.update({
                        where: { id: createdSpellsKnownProgression.id },
                        data: {
                            featureProgressionId: spellsKnownFeatureProgression.id
                        }
                    });
                }
            }

            return classResult;
        });

        return { id: result.id.toString(), message: 'Class created successfully' };
    },

    async updateClass(query: ClassIdParamRequest, data: UpdateClassRequest) {
        // Track orphaned progression IDs to clean up after the main transaction completes
        const orphanedProgressionIdsToCleanup: number[] = [];

        await prisma.$transaction(async (tx) => {
            // Delete existing source book mappings
            await tx.classSourceMap.deleteMany({ where: { classId: query.id } });

            // Delete existing spellcasting progression and slots
            const existingSpellcastingProgressions = await tx.spellcastingProgression.findMany({
                where: { classId: query.id, classSpellsKnownId: null },
                select: { id: true }
            });

            if (existingSpellcastingProgressions.length > 0) {
                const progressionIds = existingSpellcastingProgressions.map(p => p.id);

                // Delete related slots first
                await tx.spellcastingSlot.deleteMany({
                    where: { progressionId: { in: progressionIds } }
                });

                // Delete the progressions
                await tx.spellcastingProgression.deleteMany({
                    where: { id: { in: progressionIds } }
                });
            }

            // Delete existing spells known progression and slots
            const existingSpellsKnownProgressions = await tx.spellcastingProgression.findMany({
                where: { classSpellsKnownId: query.id },
                select: { id: true }
            });

            if (existingSpellsKnownProgressions.length > 0) {
                const progressionIds = existingSpellsKnownProgressions.map(p => p.id);

                // Delete related slots first
                await tx.spellcastingSlot.deleteMany({
                    where: { progressionId: { in: progressionIds } }
                });

                // Delete the progressions
                await tx.spellcastingProgression.deleteMany({
                    where: { id: { in: progressionIds } }
                });
            }

            const { features, spellcastingProgression, spellsKnownProgression, ...classData } = data;

            // Remove deprecated fields that are now stored in feature progressions
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

            // Update/create feature progressions using new upsert logic
            if (features && features.length > 0) {
                console.log(`[ClassService] Updating class ${query.id} with ${features.length} feature progressions`);

                // Type guard for progressions with real database ID (update requests)
                // Always Send IDs Pattern: Frontend always sends IDs (temporary or real), we filter out
                // temporary IDs here to identify progressions that should be updated vs created
                type ProgressionWithId = UpdateFeatureProgression & { id: number };
                const hasId = (p: UpdateFeatureProgression): p is ProgressionWithId => {
                    return 'id' in p &&
                        typeof (p as { id?: number }).id === 'number' &&
                        !isTemporaryId((p as { id: number }).id); // Filter out temporary IDs - only real DB IDs indicate updates
                };

                // Log incoming progressions and their IDs
                const progressionsWithIds = features.filter(hasId);
                const progressionsWithTemporaryIds = features.filter(p =>
                    'id' in p &&
                    typeof (p as { id?: number }).id === 'number' &&
                    isTemporaryId((p as { id: number }).id)
                );
                const progressionsWithoutIds = features.filter(p => !('id' in p) || (p as { id?: number }).id === undefined || (p as { id?: number }).id === null);

                console.log(`[ClassService] Progressions breakdown: ${progressionsWithIds.length} with real IDs, ${progressionsWithTemporaryIds.length} with temporary IDs, ${progressionsWithoutIds.length} without IDs`);
                if (progressionsWithIds.length > 0) {
                    console.log(`[ClassService] Real progression IDs: ${progressionsWithIds.map(p => (p as { id: number }).id).join(', ')}`);
                }

                // Get featureIds for existing progressions (those with real database IDs)
                const progressionIds = progressionsWithIds.map(p => p.id);

                const existingProgressions = progressionIds.length > 0
                    ? await tx.featureProgression.findMany({
                        where: { id: { in: progressionIds } },
                        select: { id: true, featureId: true }
                    })
                    : [];

                if (progressionIds.length > 0) {
                    console.log(`[ClassService] Found ${existingProgressions.length} existing progressions out of ${progressionIds.length} requested`);
                    if (existingProgressions.length < progressionIds.length) {
                        const foundIds = new Set(existingProgressions.map(p => p.id));
                        const missingIds = progressionIds.filter(id => !foundIds.has(id));
                        console.error(`[ClassService] WARNING: ${missingIds.length} progression IDs not found in database: ${missingIds.join(', ')}`);
                    }
                }

                // Group progressions by featureId
                // Cast to UpdateFeatureProgression[] since updateFeatureProgressions expects that type
                const progressionsByFeatureId = new Map<number, UpdateFeatureProgression[]>();

                // For existing progressions, group by their featureId
                for (const progression of features) {
                    if (hasId(progression)) {
                        const existing = existingProgressions.find(p => p.id === progression.id);
                        if (existing) {
                            const featureId = existing.featureId;
                            if (!progressionsByFeatureId.has(featureId)) {
                                progressionsByFeatureId.set(featureId, []);
                            }
                            // Cast to UpdateFeatureProgression since it has id
                            progressionsByFeatureId.get(featureId)!.push(progression as UpdateFeatureProgression);
                        }
                    } else if (progression.featureId !== undefined && progression.featureId !== null) {
                        // New progression - need featureId from progression data
                        // For new progressions in class updates, they should have featureId
                        const featureId = progression.featureId;
                        if (!progressionsByFeatureId.has(featureId)) {
                            progressionsByFeatureId.set(featureId, []);
                        }
                        // Cast to UpdateFeatureProgression (id will be undefined, which is valid)
                        progressionsByFeatureId.get(featureId)!.push(progression as UpdateFeatureProgression);
                    }
                }

                // Update progressions for each feature
                for (const [featureId, progressions] of progressionsByFeatureId) {
                    console.log(`[ClassService] Updating ${progressions.length} progressions for feature ${featureId}`);
                    await featureSystemService.updateFeatureProgressions(featureId, progressions);
                }

                // After updating, rebuild finalProgressionIds by re-querying the database
                // This ensures we only include progression IDs that actually exist after updates
                const finalProgressionIds: number[] = [];

                // For progressions with real database IDs: verify they still exist after update
                for (const progressionId of progressionIds) {
                    const stillExists = await tx.featureProgression.findUnique({
                        where: { id: progressionId },
                        select: { id: true }
                    });
                    if (stillExists) {
                        finalProgressionIds.push(progressionId);
                    } else {
                        console.error(`[ClassService] WARNING: Progression ${progressionId} was deleted during updateFeatureProgressions`);
                    }
                }

                // For new progressions (those without real IDs or with temporary IDs), find them by matching characteristics
                const newProgressions = features.filter(p => !hasId(p));
                console.log(`[ClassService] Finding ${newProgressions.length} new progressions by matching characteristics`);
                for (const newProgression of newProgressions) {
                    if (newProgression.featureId !== undefined && newProgression.featureId !== null) {
                        const featureId = newProgression.featureId;
                        // Find matching progression by level, sourceType, and other characteristics
                        const matching = await tx.featureProgression.findFirst({
                            where: {
                                featureId,
                                level: newProgression.level ?? 1,
                                sourceType: newProgression.sourceType ?? 0,
                                domainId: newProgression.domainId ?? null,
                                featId: newProgression.featId ?? null,
                                companionId: newProgression.companionId ?? null,
                                editionId: newProgression.editionId ?? null,
                            },
                            orderBy: { id: 'desc' }, // Get the most recently created
                            select: { id: true }
                        });
                        if (matching) {
                            finalProgressionIds.push(matching.id);
                            console.log(`[ClassService] Found new progression ${matching.id} for feature ${featureId}`);
                        } else {
                            console.error(`[ClassService] WARNING: Could not find new progression for feature ${featureId} after creation`);
                        }
                    }
                }

                console.log(`[ClassService] Final progression IDs for sync: ${finalProgressionIds.length} progressions (${finalProgressionIds.join(', ')})`);
                if (finalProgressionIds.length === 0 && features.length > 0) {
                    console.error(`[ClassService] CRITICAL WARNING: No valid progression IDs found after update, but ${features.length} progressions were provided. This will remove all FeatureProgressionClassMap entries!`);
                }

                // Sync FeatureProgressionClassMap entries for this class
                console.log(`[ClassService] Syncing FeatureProgressionClassMap for class ${query.id} with ${finalProgressionIds.length} progression IDs`);
                const orphanedProgressionIds = await featureSystemService.syncClassFeatureProgressions(query.id, finalProgressionIds, tx);

                // Clean up orphaned progressions in a separate transaction after the main update completes
                if (orphanedProgressionIds.length > 0) {
                    // Store for cleanup after transaction commits
                    orphanedProgressionIdsToCleanup.push(...orphanedProgressionIds);
                }
            } else {
                // No features provided - sync to empty list (removes all links for this class)
                console.log(`[ClassService] No features provided for class ${query.id}, removing all FeatureProgressionClassMap entries`);
                const orphanedProgressionIds = await featureSystemService.syncClassFeatureProgressions(query.id, [], tx);

                // Clean up orphaned progressions in a separate transaction after the main update completes
                if (orphanedProgressionIds.length > 0) {
                    orphanedProgressionIdsToCleanup.push(...orphanedProgressionIds);
                }
            }

            // Create new spellcasting progression (spell slots)
            // Phase 3: Also create FeatureProgression entries that link to SpellcastingProgression
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

                for (const progression of spellcastingProgression as CreateSpellcastingProgressionRequest[]) {
                    const { slots, ...progressionData } = progression;

                    // Create the spellcasting progression (keep classId for backward compatibility)
                    const createdSpellcastingProgression = await tx.spellcastingProgression.create({
                        data: {
                            ...progressionData,
                            classId: query.id, // Keep for backward compatibility
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

                    // Phase 3: Create FeatureProgression that links to this SpellcastingProgression
                    // Find or create spellcasting feature
                    let spellcastingFeature = await tx.feature.findFirst({
                        where: {
                            slug: `spellcasting-${updatedClass.name.toLowerCase().replace(/\s+/g, '-')}`
                        }
                    });

                    if (!spellcastingFeature) {
                        spellcastingFeature = await tx.feature.create({
                            data: {
                                slug: `spellcasting-${updatedClass.name.toLowerCase().replace(/\s+/g, '-')}`,
                                name: `${updatedClass.name} Spellcasting`,
                                description: `Spellcasting ability for ${updatedClass.name}`,
                                displayInCharacterSheet: false
                            }
                        });
                    }

                    // Create FeatureProgression for spellcasting
                    const featureProgression = await tx.featureProgression.create({
                        data: {
                            sourceType: FeatureSourceType.Class,
                            level: 1,
                            featureId: spellcastingFeature.id
                        }
                    });

                    // Link to class via many-to-many relationship
                    await tx.featureProgressionClassMap.create({
                        data: {
                            progressionId: featureProgression.id,
                            classId: query.id
                        }
                    });

                    // Create FeatureEntity for SpellcastingProgression reference
                    await tx.featureEntity.create({
                        data: {
                            progressionId: featureProgression.id,
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

                    // Note: Casting ability and type should be added via feature progressions
                    // They are no longer stored directly on the Class model

                    // Link SpellcastingProgression to FeatureProgression
                    await tx.spellcastingProgression.update({
                        where: { id: createdSpellcastingProgression.id },
                        data: {
                            featureProgressionId: featureProgression.id
                        }
                    });
                }
            }

            // Create new spells known progression
            // Phase 3: Also create FeatureProgression entries that link to SpellcastingProgression
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

                for (const progression of spellsKnownProgression as CreateSpellcastingProgressionRequest[]) {
                    const { slots, ...progressionData } = progression;

                    // Create the spells known progression (keep classId for backward compatibility)
                    const createdSpellsKnownProgression = await tx.spellcastingProgression.create({
                        data: {
                            ...progressionData,
                            classId: query.id, // Keep for backward compatibility
                            classSpellsKnownId: query.id, // Link to the class via spells known relation
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

                    // Phase 3: Create FeatureProgression that links to this SpellcastingProgression
                    // Note: Since featureProgressionId is unique, spells-known gets its own FeatureProgression
                    // Find or create spellcasting feature for spells-known
                    let spellsKnownFeature = await tx.feature.findFirst({
                        where: {
                            slug: `spellcasting-spells-known-${updatedClass.name.toLowerCase().replace(/\s+/g, '-')}`
                        }
                    });

                    if (!spellsKnownFeature) {
                        spellsKnownFeature = await tx.feature.create({
                            data: {
                                slug: `spellcasting-spells-known-${updatedClass.name.toLowerCase().replace(/\s+/g, '-')}`,
                                name: `${updatedClass.name} Spells Known`,
                                description: `Spells known progression for ${updatedClass.name}`,
                                displayInCharacterSheet: false
                            }
                        });
                    }

                    // Create FeatureProgression for spells-known
                    const spellsKnownFeatureProgression = await tx.featureProgression.create({
                        data: {
                            sourceType: FeatureSourceType.Class,
                            level: 1,
                            featureId: spellsKnownFeature.id
                        }
                    });

                    // Link to class via many-to-many relationship
                    await tx.featureProgressionClassMap.create({
                        data: {
                            progressionId: spellsKnownFeatureProgression.id,
                            classId: query.id
                        }
                    });

                    // Create FeatureEntity for SpellsKnown SpellcastingProgression reference
                    await tx.featureEntity.create({
                        data: {
                            progressionId: spellsKnownFeatureProgression.id,
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

                    // Link SpellcastingProgression to FeatureProgression
                    await tx.spellcastingProgression.update({
                        where: { id: createdSpellsKnownProgression.id },
                        data: {
                            featureProgressionId: spellsKnownFeatureProgression.id
                        }
                    });
                }
            }
        }, {
            timeout: 60000 // 60 seconds timeout for large operations
        });

        // Clean up orphaned progressions in a separate transaction after the main update succeeds
        if (orphanedProgressionIdsToCleanup.length > 0) {
            try {
                await featureSystemService.cleanupOrphanedProgressions(orphanedProgressionIdsToCleanup);
            } catch (error) {
                // Log error but don't fail the class update - orphan cleanup is a separate concern
                console.error(`[ClassService] Failed to clean up ${orphanedProgressionIdsToCleanup.length} orphaned progressions:`, error);
            }
        }

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

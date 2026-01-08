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
} from '@shared/schema';
import { buildEditionWhereClause, isVariantId } from '@shared/utils';

import type { ClassService } from './types';
import { VariantClassService } from './variantClassService.js';
import { featureSystemService } from '../featureSystem/featureSystemService';
import type { FeatureProgressionContext } from '../featureSystem/types';

const prisma = new PrismaClient();
const variantClassService = new VariantClassService(prisma);

export const classService: ClassService = {
    async getAllClasses(query?: GetAllClassesQuery): Promise<GetAllClassesResponse> {
        const baseClassesOnly = query?.baseClassesOnly || false;

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

        const classesPromise = prisma.class.findMany({
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

        const variantsPromise = baseClassesOnly
            ? Promise.resolve([])
            : prisma.classVariant.findMany({
                orderBy: { name: 'asc' },
                include: {
                    baseClass: {
                        include: {
                            sourceBookInfo: {
                                select: {
                                    sourceBookId: true,
                                    pageNumber: true
                                }
                            },
                        }
                    }
                }
            });

        const [classes, variants] = await Promise.all([classesPromise, variantsPromise]);

        // Combine classes and variants into a single list
        const allItems = [
            // Base classes (unchanged)
            ...classes,
            // Variants with resolved class data and custom IDs
            ...variants.map(variant => {
                return {
                    ...variant.baseClass,
                    id: variant.id, // Use the custom ID that was calculated during creation
                    name: variant.name, // Use variant name
                    description: variant.description || variant.baseClass.description,
                    // Apply variant overrides to summary fields
                    hitDie: variant.hitDie ?? variant.baseClass.hitDie,
                    skillPoints: variant.skillPoints ?? variant.baseClass.skillPoints,
                    babProgression: variant.babProgression ?? variant.baseClass.babProgression,
                    fortProgression: variant.fortProgression ?? variant.baseClass.fortProgression,
                    refProgression: variant.refProgression ?? variant.baseClass.refProgression,
                    willProgression: variant.willProgression ?? variant.baseClass.willProgression,
                };
            })
        ];

        // Sort combined list by name
        allItems.sort((a, b) => a.name.localeCompare(b.name));

        return {
            total: allItems.length,
            results: allItems as GetAllClassesResponse['results'],
        };
    },

    async getClassById(
        query: ClassIdParamRequest,
        characterFeatureChoices?: Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>
    ): Promise<DnDClass | null> {
        const id = query.id;

        // Check if this is a custom variant ID
        if (isVariantId(id)) {
            // For variant IDs, we need to look up the variant directly by its custom ID
            // The resolveClassWithVariantById method will handle the base class lookup
            return await variantClassService.resolveClassWithVariantById(id);
        }

        // Otherwise, return base class as normal
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
            baseClassId: null,
            variantId: null,
            isVariant: false,
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
            if (features && features.length > 0) {
                const context: FeatureProgressionContext = { classId: classResult.id };
                await featureSystemService.createMultipleFeatureProgressions(features, context);
            }

            // Create spellcasting progression (spell slots)
            if (spellcastingProgression && spellcastingProgression.length > 0) {
                for (const progression of spellcastingProgression as CreateSpellcastingProgressionRequest[]) {
                    const { slots, ...progressionData } = progression;

                    // Create the spellcasting progression
                    const createdSpellcastingProgression = await tx.spellcastingProgression.create({
                        data: {
                            ...progressionData,
                            classId: classResult.id,
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
                }
            }

            // Create spells known progression
            if (spellsKnownProgression && spellsKnownProgression.length > 0) {
                for (const progression of spellsKnownProgression as CreateSpellcastingProgressionRequest[]) {
                    const { slots, ...progressionData } = progression;

                    // Create the spells known progression
                    const createdSpellsKnownProgression = await tx.spellcastingProgression.create({
                        data: {
                            ...progressionData,
                            classId: classResult.id, // Required field
                            classSpellsKnownId: classResult.id, // Link to the class via spells known relation
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

            // Delete existing feature progressions using consolidated feature system service
            const deleteContext: FeatureProgressionContext = { classId: query.id };
            await featureSystemService.deleteFeatureProgressionsForContext(deleteContext, tx);

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

            // Update the class
            await tx.class.update({
                where: { id: query.id },
                data: {
                    ...classData,
                    sourceBookInfo: {
                        create: data.sourceBookInfo?.map(sourceBookInfo => ({
                            sourceBookId: sourceBookInfo.sourceBookId,
                            pageNumber: sourceBookInfo.pageNumber
                        })) || []
                    },
                },
            });

            // Create new feature progressions using consolidated feature system service
            if (features && features.length > 0) {
                const createContext: FeatureProgressionContext = { classId: query.id };
                await featureSystemService.createMultipleFeatureProgressions(features, createContext, tx);
            }

            // Create new spellcasting progression (spell slots)
            if (spellcastingProgression && spellcastingProgression.length > 0) {
                for (const progression of spellcastingProgression as CreateSpellcastingProgressionRequest[]) {
                    const { slots, ...progressionData } = progression;

                    // Create the spellcasting progression
                    const createdSpellcastingProgression = await tx.spellcastingProgression.create({
                        data: {
                            ...progressionData,
                            classId: query.id,
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
                }
            }

            // Create new spells known progression
            if (spellsKnownProgression && spellsKnownProgression.length > 0) {
                for (const progression of spellsKnownProgression as CreateSpellcastingProgressionRequest[]) {
                    const { slots, ...progressionData } = progression;

                    // Create the spells known progression
                    const createdSpellsKnownProgression = await tx.spellcastingProgression.create({
                        data: {
                            ...progressionData,
                            classId: query.id, // Required field
                            classSpellsKnownId: query.id, // Link to the class via spells known relation
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
                }
            }
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
        const classesPromise = prisma.class.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                abbreviation: true,
                editionId: true,
                isPrestige: true,
                isVisible: true,
                canCastSpells: true,
            }
        });

        const variantsPromise = prisma.classVariant.findMany({
            orderBy: { name: 'asc' },
            include: {
                baseClass: {
                    select: {
                        editionId: true,
                        isPrestige: true,
                        isVisible: true,
                        canCastSpells: true,
                    }
                }
            }
        });

        const [classes, variants] = await Promise.all([classesPromise, variantsPromise]);

        // Combine classes and variants into a single list
        const allItems = [
            // Base classes (unchanged)
            ...classes,
            // Variants with inherited properties from base class
            ...variants.map(variant => {
                return {
                    id: variant.id, // Use the custom variant ID
                    name: variant.name, // Use variant name
                    abbreviation: variant.abbreviation, // Use variant abbreviation
                    // Inherit from base class
                    editionId: variant.baseClass.editionId,
                    isPrestige: variant.baseClass.isPrestige,
                    isVisible: variant.baseClass.isVisible,
                    canCastSpells: variant.baseClass.canCastSpells,
                };
            })
        ];

        // Sort combined list by name
        allItems.sort((a, b) => a.name.localeCompare(b.name));

        return {
            total: allItems.length,
            results: allItems,
        };
    },

};

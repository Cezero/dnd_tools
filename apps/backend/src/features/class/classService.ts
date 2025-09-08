import { PrismaClient } from '@shared/prisma-client';
import {
    GetAllClassesResponse,
    CreateClassRequest,
    UpdateClassRequest,
    ClassIdParamRequest,
    DnDClass,
    CreateResponse,
    CreateSpellcastingProgressionRequest,
    CreateSpellcastingSlotRequest,
} from '@shared/schema';

import type { ClassService } from './types';
import { transformFormulaParamsFromDatabase } from '../../utils/formulaParamTransformers';
import { featureSystemService } from '../featureSystem/featureSystemService';


const prisma = new PrismaClient();

export const classService: ClassService = {
    async getAllClasses(): Promise<GetAllClassesResponse> {
        const [classes] = await Promise.all([
            prisma.class.findMany({
                orderBy: { name: 'asc' },
                include: {
                    sourceBookInfo: {
                        select: {
                            sourceBookId: true,
                            pageNumber: true
                        }
                    },
                }
            }),
            prisma.class.count(),
        ]);

        return {
            total: classes.length,
            results: classes as GetAllClassesResponse['results'],
        };
    },

    async getClassById(query: ClassIdParamRequest) {
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
        const features = await featureSystemService.getFeatureProgressionsByClassId(query.id);

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
            if (features && features.length > 0) {
                await featureSystemService.createMultipleFeatureProgressions(features, { classId: classResult.id });
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
            await featureSystemService.deleteFeatureProgressionsForContext({ classId: query.id }, tx);

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
                await featureSystemService.createMultipleFeatureProgressions(features, { classId: query.id }, tx);
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


};

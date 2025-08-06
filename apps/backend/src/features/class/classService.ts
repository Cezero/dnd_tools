import { PrismaClient } from '@shared/prisma-client';
import {
    ClassIdParamRequest,
    CreateClassRequest,
    GetAllClassesResponse,
    GetClassResponse,
    UpdateClassRequest,
    CreateResponse
} from '@shared/schema';
import type { SpellProgressionType, ProgressionType, SpellsKnownType } from '@shared/static-data';

import type { ClassService } from './types';

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
                features: {
                    include: {
                        feature: {
                            select: {
                                id: true,
                                slug: true,
                                name: true,
                                description: true
                            }
                        },
                        modifiers: true,
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
                                }
                            }
                        },
                        effects: true
                    }
                },
                spellcastingProgression: true,
            },
        });

        return {
            ...classData,
            spellcastingProgression: classData?.spellcastingProgression ?? null,
        } as GetClassResponse;
    },

    async createClass(data: CreateClassRequest): Promise<CreateResponse> {
        const { features, spellcastingProgression, ...classData } = data;

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

            // Create feature progressions with their related entities
            if (features && features.length > 0) {
                for (const progression of features) {
                    const { modifiers, choices, effects, feature, class: classRelation, spellcasting, ...progressionData } = progression;

                    // Create the feature progression
                    const featureProgression = await tx.featureProgression.create({
                        data: {
                            ...progressionData,
                            classId: classResult.id,
                        },
                    });

                    // Create related modifiers
                    if (modifiers && modifiers.length > 0) {
                        await tx.featureModifier.createMany({
                            data: modifiers.map(modifier => ({
                                ...modifier,
                                featureProgressionId: featureProgression.id,
                            })),
                        });
                    }

                    // Create related choices
                    if (choices && choices.length > 0) {
                        await tx.featureChoice.createMany({
                            data: choices.map(choice => ({
                                ...choice,
                                progressionId: featureProgression.id,
                            })),
                        });
                    }

                    // Create related effects
                    if (effects && effects.length > 0) {
                        await tx.featureSpecialEffect.createMany({
                            data: effects.map(effect => ({
                                ...effect,
                                progressionId: featureProgression.id,
                            })),
                        });
                    }
                }
            }

            // Create spellcasting progression
            if (spellcastingProgression && spellcastingProgression.length > 0) {
                await tx.spellcastingProgression.createMany({
                    data: spellcastingProgression.map(prog => ({
                        ...prog,
                        classId: classResult.id,
                    })),
                });
            }

            return classResult;
        });

        return { id: result.id.toString(), message: 'Class created successfully' };
    },

    async updateClass(query: ClassIdParamRequest, data: UpdateClassRequest) {
        await prisma.$transaction(async (tx) => {
            // Delete existing source book mappings
            await tx.classSourceMap.deleteMany({ where: { classId: query.id } });

            // Delete existing feature progressions and their related entities
            const existingProgressions = await tx.featureProgression.findMany({
                where: { classId: query.id },
                select: { id: true }
            });

            if (existingProgressions.length > 0) {
                const progressionIds = existingProgressions.map(p => p.id);

                // Delete related entities first
                await tx.featureModifier.deleteMany({
                    where: { featureProgressionId: { in: progressionIds } }
                });
                await tx.featureChoice.deleteMany({
                    where: { progressionId: { in: progressionIds } }
                });
                await tx.featureSpecialEffect.deleteMany({
                    where: { progressionId: { in: progressionIds } }
                });

                // Delete the progressions
                await tx.featureProgression.deleteMany({
                    where: { classId: query.id }
                });
            }

            // Delete existing spellcasting progression
            await tx.spellcastingProgression.deleteMany({
                where: { classId: query.id }
            });

            const { features, spellcastingProgression, ...classData } = data;

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

            // Create new feature progressions with their related entities
            if (features && features.length > 0) {
                for (const progression of features) {
                    const { modifiers, choices, effects, feature, class: classRelation, spellcasting, ...progressionData } = progression;

                    // Create the feature progression
                    const featureProgression = await tx.featureProgression.create({
                        data: {
                            ...progressionData,
                            classId: query.id,
                        },
                    });

                    // Create related modifiers
                    if (modifiers && modifiers.length > 0) {
                        await tx.featureModifier.createMany({
                            data: modifiers.map(modifier => ({
                                ...modifier,
                                featureProgressionId: featureProgression.id,
                            })),
                        });
                    }

                    // Create related choices
                    if (choices && choices.length > 0) {
                        await tx.featureChoice.createMany({
                            data: choices.map(choice => ({
                                ...choice,
                                progressionId: featureProgression.id,
                            })),
                        });
                    }

                    // Create related effects
                    if (effects && effects.length > 0) {
                        await tx.featureSpecialEffect.createMany({
                            data: effects.map(effect => ({
                                ...effect,
                                progressionId: featureProgression.id,
                            })),
                        });
                    }
                }
            }

            // Create new spellcasting progression
            if (spellcastingProgression && spellcastingProgression.length > 0) {
                await tx.spellcastingProgression.createMany({
                    data: spellcastingProgression.map(prog => ({
                        ...prog,
                        classId: query.id,
                    })),
                });
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

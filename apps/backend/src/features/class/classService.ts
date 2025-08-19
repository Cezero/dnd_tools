import { PrismaClient } from '@shared/prisma-client';
import {
    ClassIdParamRequest,
    CreateClassRequest,
    GetAllClassesResponse,
    GetClassResponse,
    UpdateClassRequest,
    CreateResponse
} from '@shared/schema';
import type { CreateSpellcastingProgressionRequest, CreateSpellcastingSlotRequest } from '@shared/schema';


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
                                description: true,
                                prerequisites: true
                            }
                        },
                        modifiers: {
                            include: {
                                formulaParams: true,
                                conditions: true
                            }
                        },
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
                        effects: {
                            include: {
                                feat: true,
                                item: true
                            }
                        }
                        // prerequisites removed - now at feature level
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

        return {
            ...classData,
            spellcastingProgression: classData?.spellcastingProgression ?? null,
            spellsKnownProgression: classData?.classSpellsKnown ?? null,
        } as GetClassResponse;
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

            // Create feature progressions with their related entities
            if (features && features.length > 0) {
                for (const progression of features) {
                    const { modifiers, choices, effects, ...progressionData } = progression;

                    // Create the feature progression
                    const featureProgression = await tx.featureProgression.create({
                        data: {
                            ...progressionData,
                            classId: classResult.id,
                        },
                    });

                    // Create related modifiers
                    if (modifiers && modifiers.length > 0) {
                        for (const modifier of modifiers) {
                            const { conditions, formulaParams, ...modifierData } = modifier;

                            // Create formula params first if they exist
                            let formulaParamsId = null;
                            if (formulaParams) {
                                const createdFormulaParams = await tx.featureModifierFormulaParams.create({
                                    data: {
                                        formulaId: formulaParams.formulaId,
                                        interval: formulaParams.interval,
                                        formulaStartLevel: formulaParams.formulaStartLevel,
                                        attributeId: formulaParams.attributeId,
                                    },
                                });
                                formulaParamsId = createdFormulaParams.id;
                            }

                            // Create the modifier with formula params reference
                            const createdModifier = await tx.featureModifier.create({
                                data: {
                                    ...modifierData,
                                    featureProgressionId: featureProgression.id,
                                    formulaParamsId: formulaParamsId,
                                },
                            });

                            // Create related conditions if any
                            if (conditions && conditions.length > 0) {
                                await tx.featureModifierCondition.createMany({
                                    data: conditions.map(condition => ({
                                        ...condition,
                                        featureModifierId: createdModifier.id,
                                    })),
                                });
                            }
                        }
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
                                featId: effect.featId || null,
                                itemId: effect.itemId || null,
                            })),
                        });
                    }

                    // Prerequisites are now handled at the feature level
                    // No need to create prerequisites for progressions
                }
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
                // Prerequisites are now at the feature level, not the progression level
                // No need to delete prerequisites for progressions

                // Delete the progressions
                await tx.featureProgression.deleteMany({
                    where: { classId: query.id }
                });
            }

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

            // Create new feature progressions with their related entities
            if (features && features.length > 0) {
                for (const progression of features) {
                    const { modifiers, choices, effects, ...progressionData } = progression;

                    // Create the feature progression
                    const featureProgression = await tx.featureProgression.create({
                        data: {
                            ...progressionData,
                            classId: query.id,
                        },
                    });

                    // Create related modifiers
                    if (modifiers && modifiers.length > 0) {
                        for (const modifier of modifiers) {
                            const { conditions, formulaParams, ...modifierData } = modifier;

                            // Create formula params first if they exist
                            let formulaParamsId = null;
                            if (formulaParams) {
                                const createdFormulaParams = await tx.featureModifierFormulaParams.create({
                                    data: {
                                        formulaId: formulaParams.formulaId,
                                        interval: formulaParams.interval,
                                        formulaStartLevel: formulaParams.formulaStartLevel,
                                        attributeId: formulaParams.attributeId,
                                    },
                                });
                                formulaParamsId = createdFormulaParams.id;
                            }

                            // Create the modifier with formula params reference
                            const createdModifier = await tx.featureModifier.create({
                                data: {
                                    ...modifierData,
                                    featureProgressionId: featureProgression.id,
                                    formulaParamsId: formulaParamsId,
                                },
                            });

                            // Create related conditions if any
                            if (conditions && conditions.length > 0) {
                                await tx.featureModifierCondition.createMany({
                                    data: conditions.map(condition => ({
                                        ...condition,
                                        featureModifierId: createdModifier.id,
                                    })),
                                });
                            }
                        }
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
                                featId: effect.featId || null,
                                itemId: effect.itemId || null,
                            })),
                        });
                    }

                    // Prerequisites are now handled at the feature level
                    // No need to create prerequisites for progressions
                }
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

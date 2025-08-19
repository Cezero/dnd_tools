import { PrismaClient } from '@shared/prisma-client';
import type {
    RaceIdParamRequest,
    CreateRaceRequest,
    UpdateRaceRequest,
    CreateResponse,
    GetRaceResponse,
    UpdateResponse,
    GetAllRacesResponse,
} from '@shared/schema';

import { RaceService } from './types';

const prisma = new PrismaClient();

export const raceService: RaceService = {
    async getAllRaces(): Promise<GetAllRacesResponse> {
        const [races] = await Promise.all([
            prisma.race.findMany({
                orderBy: { name: 'asc' },
                include: {
                    featureProgression: {
                        include: {
                            feature: {
                                select: {
                                    id: true,
                                    slug: true,
                                    name: true,
                                    description: true
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
                        }
                    },
                    sources: {
                        select: {
                            sourceBookId: true,
                            pageNumber: true
                        }
                    }
                },
            }),
            prisma.race.count(),
        ]);

        // Map featureProgression to features for schema compatibility
        const racesWithFeatures = races.map(race => ({
            ...race,
            features: race.featureProgression || null
        }));

        return {
            total: races.length,
            results: racesWithFeatures,
        };
    },

    async getRaceById(id: RaceIdParamRequest): Promise<GetRaceResponse | null> {
        const race = await prisma.race.findUnique({
            where: { id: id.id },
            include: {
                featureProgression: {
                    include: {
                        feature: {
                            select: {
                                id: true,
                                slug: true,
                                name: true,
                                description: true
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
                    }
                },
                sources: true,
            },
        });

        if (!race) {
            return null;
        }

        // Map featureProgression to features for schema compatibility
        return {
            ...race,
            features: race.featureProgression || null
        } as GetRaceResponse;
    },

    async createRace(data: CreateRaceRequest): Promise<CreateResponse> {
        const { features, ...raceData } = data;
        // Use Prisma input type directly - it handles nested relationships
        const result = await prisma.race.create({
            data: {
                ...raceData,
                sources: {
                    create: data.sources?.map(source => ({
                        sourceBookId: source.sourceBookId,
                        pageNumber: source.pageNumber
                    })) || []
                }
            },
        });

        // Create feature progressions if provided
        if (features && features.length > 0) {
            for (const progression of features) {
                const { modifiers, choices, effects, ...progressionData } = progression;

                await prisma.featureProgression.create({
                    data: {
                        ...progressionData,
                        raceId: result.id,
                        modifiers: {
                            create: modifiers?.map(mod => {
                                const { conditions, ...modData } = mod;
                                return {
                                    ...modData,
                                    conditions: {
                                        create: conditions?.map(condition => ({
                                            ...condition
                                        })) || []
                                    }
                                };
                            }) || []
                        },
                        choices: {
                            create: choices?.map(choice => ({
                                ...choice,
                                feat: null,
                                feature: null
                            })) || []
                        },
                        effects: {
                            create: effects?.map(effect => ({
                                ...effect
                            })) || []
                        }
                    }
                });
            }
        }

        return { id: result.id.toString(), message: 'Race created successfully' };
    },

    async updateRace(id: RaceIdParamRequest, data: UpdateRaceRequest): Promise<UpdateResponse> {
        const { features, ...raceData } = data;
        // Use Prisma input type directly - it handles nested relationships
        await prisma.$transaction(async (tx) => {
            // First, get existing feature progressions to delete related records
            const existingProgressions = await tx.featureProgression.findMany({
                where: { raceId: id.id },
                include: {
                    modifiers: true,
                    choices: true,
                    effects: true
                }
            });

            // Delete related records first (in correct order)
            for (const progression of existingProgressions) {
                // Delete conditions for each modifier
                for (const modifier of progression.modifiers) {
                    await tx.featureModifierCondition.deleteMany({
                        where: { featureModifierId: modifier.id }
                    });
                }

                // Delete modifiers
                await tx.featureModifier.deleteMany({
                    where: { featureProgressionId: progression.id }
                });

                // Delete choices
                await tx.featureChoice.deleteMany({
                    where: { progressionId: progression.id }
                });

                // Delete effects
                await tx.featureSpecialEffect.deleteMany({
                    where: { progressionId: progression.id }
                });
            }

            // Now delete the feature progressions
            await tx.featureProgression.deleteMany({ where: { raceId: id.id } });

            // Delete existing race source maps
            await tx.raceSourceMap.deleteMany({ where: { raceId: id.id } });

            // Update the race
            await tx.race.update({
                where: { id: id.id },
                data: {
                    ...raceData,
                    sources: {
                        create: data.sources?.map(source => ({
                            sourceBookId: source.sourceBookId,
                            pageNumber: source.pageNumber
                        })) || []
                    }
                }
            });

            // Create new feature progressions if provided
            if (features && features.length > 0) {
                for (const progression of features) {
                    const { modifiers, choices, effects, ...progressionData } = progression;

                    await tx.featureProgression.create({
                        data: {
                            ...progressionData,
                            raceId: id.id,
                            modifiers: {
                                create: modifiers?.map(mod => {
                                    const { conditions, ...modData } = mod;
                                    return {
                                        ...modData,
                                        conditions: {
                                            create: conditions?.map(condition => ({
                                                ...condition
                                            })) || []
                                        }
                                    };
                                }) || []
                            },
                            choices: {
                                create: choices?.map(choice => ({
                                    ...choice,
                                    feat: null,
                                    feature: null
                                })) || []
                            },
                            effects: {
                                create: effects?.map(effect => ({
                                    ...effect
                                })) || []
                            }
                        }
                    });
                }
            }
        });

        return { message: 'Race updated successfully' };
    },

    async deleteRace(id: RaceIdParamRequest): Promise<UpdateResponse> {
        await prisma.race.delete({
            where: { id: id.id },
        });
        return { message: 'Race deleted successfully' };
    },


};

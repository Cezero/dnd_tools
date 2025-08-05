import { PrismaClient, Prisma } from '@shared/prisma-client';
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

        return {
            total: races.length,
            results: races,
        };
    },

    async getRaceById(id: RaceIdParamRequest): Promise<GetRaceResponse | null> {
        return prisma.race.findUnique({
            where: { id: id.id },
            include: {
                featureProgression: {
                    include: {
                        feature: {
                            select: {
                                slug: true,
                                name: true,
                                description: true
                            }
                        },
                        modifiers: true,
                        choices: true,
                        effects: true
                    }
                },
                sources: true,
            },
        });
    },

    async createRace(data: CreateRaceRequest): Promise<CreateResponse> {
        const { featureProgression, ...raceData } = data;
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

        return { id: result.id.toString(), message: 'Race created successfully' };
    },

    async updateRace(id: RaceIdParamRequest, data: UpdateRaceRequest): Promise<UpdateResponse> {
        const { featureProgression, ...raceData } = data;
        // Use Prisma input type directly - it handles nested relationships
        await prisma.$transaction(async (tx) => {
            await tx.raceSourceMap.deleteMany({ where: { raceId: id.id } });

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

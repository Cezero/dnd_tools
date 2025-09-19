import { PrismaClient } from '@shared/prisma-client';
import {
    GetAllRacesResponse,
    Race,
    CreateRaceRequest,
    UpdateRaceRequest,
    RaceIdParamRequest,
    CreateResponse,
    UpdateResponse,
} from '@shared/schema';

import type { RaceService } from './types';
import { featureSystemService } from '../featureSystem/featureSystemService';
import type { FeatureProgressionContext } from '../featureSystem/types';



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

        // Get feature progressions for all races using the feature system service
        const racesWithFeatures = await Promise.all(
            races.map(async (race) => {
                const features = await featureSystemService.getFeatureProgressionsByRaceId(race.id);
                return {
                    ...race,
                    features,
                };
            })
        );

        return {
            total: races.length,
            results: racesWithFeatures,
        };
    },

    async getRaceById(id: RaceIdParamRequest): Promise<Race | null> {
        const race = await prisma.race.findUnique({
            where: { id: id.id },
            include: {
                sources: true,
            },
        });

        if (!race) {
            return null;
        }

        // Get feature progressions using the new architecture
        const features = await featureSystemService.getFeatureProgressionsByRaceId(id.id);

        // Combine race data with enriched feature progressions
        const transformedRace = {
            ...race,
            features,
        };

        return transformedRace as Race;
    },

    async createRace(data: CreateRaceRequest): Promise<CreateResponse> {
        const { features, ...raceData } = data;

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

        // Create feature progressions using consolidated feature system service
        if (features && features.length > 0) {
            const context: FeatureProgressionContext = { raceId: result.id };
            await featureSystemService.createMultipleFeatureProgressions(features, context);
        }

        return { id: result.id.toString(), message: 'Race created successfully' };
    },

    async updateRace(id: RaceIdParamRequest, data: UpdateRaceRequest): Promise<UpdateResponse> {
        const { features, ...raceData } = data;

        await prisma.$transaction(async (tx) => {
            // Delete existing feature progressions using consolidated feature system service
            const deleteContext: FeatureProgressionContext = { raceId: id.id };
            await featureSystemService.deleteFeatureProgressionsForContext(deleteContext, tx);

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

            // Create new feature progressions using consolidated feature system service
            if (features && features.length > 0) {
                const createContext: FeatureProgressionContext = { raceId: id.id };
                await featureSystemService.createMultipleFeatureProgressions(features, createContext, tx);
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

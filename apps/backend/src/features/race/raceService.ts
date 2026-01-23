import { PrismaClient } from '@shared/prisma-client';
import {
    GetAllRacesResponse,
    Race,
    CreateRaceRequest,
    UpdateRaceRequest,
    IdParamRequest,
    CreateResponse,
    UpdateResponse,
    RaceCacheResponse,
    CreateFeatureRequest,
} from '@shared/schema';
import { FeatureSourceType } from '@shared/static-data';

import type { RaceService } from './types';
import { extractRaceMechanicsFromProgressions } from '../../utils/raceMechanicsExtractor';
import { featureSystemService } from '../featureSystem/featureSystemService';
import type { FeatureContext } from '../featureSystem/types';

const prisma = new PrismaClient();

export const raceService: RaceService = {
    async getAllRaces(): Promise<GetAllRacesResponse> {
        const [races] = await Promise.all([
            prisma.race.findMany({
                orderBy: { name: 'asc' },
                include: {
                    sourceBookInfo: {
                        select: {
                            sourceBookId: true,
                            pageNumber: true
                        }
                    }
                },
            }),
            prisma.race.count(),
        ]);

        // Get feature features for all races and extract mechanics for summary
        const racesWithMechanics = await Promise.all(
            races.map(async (race) => {
                const features = await featureSystemService.getFeaturesByRaceId(race.id);
                const mechanics = extractRaceMechanicsFromProgressions(features, race.id);

                return {
                    ...race,
                    sizeId: mechanics.sizeId,
                    speed: mechanics.speed,
                    favoredClassId: mechanics.favoredClassId,
                };
            })
        );

        return {
            total: races.length,
            results: racesWithMechanics.map(race => ({
                ...race,
                featureIds: [] // Cache response doesn't include featureIds
            })),
        };
    },

    async getRaceById(
        id: IdParamRequest,
        characterFeatureChoices?: Array<{ featureId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>
    ): Promise<Race | null> {
        const race = await prisma.race.findUnique({
            where: { id: id.id },
            include: {
                sourceBookInfo: true,
            },
        });

        if (!race) {
            return null;
        }

        // Get feature IDs using the new architecture
        const features = await featureSystemService.getFeaturesByRaceId(id.id, characterFeatureChoices);

        // Combine race data with feature IDs only
        const transformedRace = {
            ...race,
            featureIds: features.map(f => f.id),
        };

        return transformedRace as Race;
    },

    async getRaceFeatures(
        id: IdParamRequest,
        characterFeatureChoices?: Array<{ featureId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>
    ) {
        return featureSystemService.getFeaturesByRaceId(id.id, characterFeatureChoices, true);
    },

    async createRace(data: CreateRaceRequest): Promise<CreateResponse> {
        const { featureIds, ...raceData } = data;

        const result = await prisma.race.create({
            data: {
                ...raceData,
                sourceBookInfo: {
                    create: data.sourceBookInfo?.map(source => ({
                        sourceBookId: source.sourceBookId,
                        pageNumber: source.pageNumber
                    })) || []
                }
            },
        });

        // Sync FeatureRaceMap links using featureIds
        if (featureIds && featureIds.length > 0) {
            await prisma.$transaction(async (tx) => {
                await featureSystemService.syncRaceFeatures(result.id, featureIds, tx);
            });
        }

        return { id: result.id.toString(), message: 'Race created successfully' };
    },

    async updateRace(id: IdParamRequest, data: UpdateRaceRequest): Promise<UpdateResponse> {
        const { featureIds, ...raceData } = data;

        await prisma.$transaction(async (tx) => {
            // Delete existing race source maps
            await tx.raceSourceMap.deleteMany({ where: { raceId: id.id } });

            // Update the race
            await tx.race.update({
                where: { id: id.id },
                data: {
                    ...raceData,
                    sourceBookInfo: {
                        create: data.sourceBookInfo?.map(source => ({
                            sourceBookId: source.sourceBookId,
                            pageNumber: source.pageNumber
                        })) || []
                    }
                }
            });

            // Sync FeatureRaceMap links using featureIds from request
            if (featureIds && featureIds.length > 0) {
                await featureSystemService.syncRaceFeatures(id.id, featureIds, tx);
            } else {
                // No featureIds provided - sync to empty list (removes all links for this race)
                await featureSystemService.syncRaceFeatures(id.id, [], tx);
            }
        });

        return { message: 'Race updated successfully' };
    },

    async deleteRace(id: IdParamRequest): Promise<UpdateResponse> {
        await prisma.race.delete({
            where: { id: id.id },
        });
        return { message: 'Race deleted successfully' };
    },

    async getRaceCache(): Promise<RaceCacheResponse> {
        const races = await prisma.race.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                editionId: true,
                isVisible: true,
            }
        });

        return {
            total: races.length,
            results: races.map(race => ({
                ...race,
                featureIds: [] // Cache response doesn't include featureIds
            })),
        };
    },

};

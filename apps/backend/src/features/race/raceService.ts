import { PrismaClient } from '@shared/prisma-client';
import {
    GetAllRacesResponse,
    Race,
    CreateRaceRequest,
    UpdateRaceRequest,
    RaceIdParamRequest,
    CreateResponse,
    UpdateResponse,
    RaceCacheResponse,
    CreateFeatureProgressionRequest,
} from '@shared/schema';
import { FeatureSourceType } from '@shared/static-data';

import type { RaceService } from './types';
import { featureSystemService } from '../featureSystem/featureSystemService';
import type { FeatureProgressionContext } from '../featureSystem/types';
import { extractRaceMechanicsFromProgressions } from '../../utils/raceMechanicsExtractor';

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

        // Get feature progressions for all races and extract mechanics for summary
        const racesWithMechanics = await Promise.all(
            races.map(async (race) => {
                const features = await featureSystemService.getFeatureProgressionsByRaceId(race.id);
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
            results: racesWithMechanics,
        };
    },

    async getRaceById(
        id: RaceIdParamRequest,
        characterFeatureChoices?: Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>
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

        // Get feature progressions using the new architecture
        // Pass character feature choices to enrich progressions with choice data
        const features = await featureSystemService.getFeatureProgressionsByRaceId(id.id, characterFeatureChoices);

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
                sourceBookInfo: {
                    create: data.sourceBookInfo?.map(source => ({
                        sourceBookId: source.sourceBookId,
                        pageNumber: source.pageNumber
                    })) || []
                }
            },
        });

        // Create feature progressions using consolidated feature system service
        // Convert UpdateFeatureProgression[] to CreateFeatureProgressionRequest[] by providing defaults
        if (features && features.length > 0) {
            const context: FeatureProgressionContext = { raceId: result.id };
            const createProgressions: CreateFeatureProgressionRequest[] = features.map(prog => ({
                level: prog.level ?? 1,
                sourceType: prog.sourceType ?? FeatureSourceType.Race,
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
                    sourceBookInfo: {
                        create: data.sourceBookInfo?.map(source => ({
                            sourceBookId: source.sourceBookId,
                            pageNumber: source.pageNumber
                        })) || []
                    }
                }
            });

            // Create new feature progressions using consolidated feature system service
            // Convert UpdateFeatureProgression[] to CreateFeatureProgressionRequest[] by providing defaults
            if (features && features.length > 0) {
                const createContext: FeatureProgressionContext = { raceId: id.id };
                const createProgressions: CreateFeatureProgressionRequest[] = features.map(prog => ({
                    level: prog.level ?? 1,
                    sourceType: prog.sourceType ?? FeatureSourceType.Race,
                    featureId: prog.featureId!,
                    domainId: prog.domainId ?? null,
                    featId: prog.featId ?? null,
                    companionId: prog.companionId ?? null,
                    editionId: prog.editionId ?? null,
                    entities: prog.entities,
                    displayConditions: prog.displayConditions,
                }));
                await featureSystemService.createMultipleFeatureProgressions(createProgressions, createContext, tx);
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
            results: races,
        };
    },

};

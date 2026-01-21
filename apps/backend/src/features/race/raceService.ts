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
            results: racesWithMechanics,
        };
    },

    async getRaceById(
        id: RaceIdParamRequest,
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

        // Get feature features using the new architecture
        // Pass character feature choices to enrich features with choice data
        const features = await featureSystemService.getFeaturesByRaceId(id.id, characterFeatureChoices);

        // Combine race data with enriched feature features
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

        // Create feature features using consolidated feature system service
        // Convert UpdateFeature[] to CreateFeatureRequest[] by providing defaults
        if (features && features.length > 0) {
            const context: FeatureContext = { raceId: result.id };
            const createProgressions: CreateFeatureRequest[] = features.map(prog => ({
                name: prog.name ?? '',
                slug: prog.slug ?? '',
                description: prog.description ?? '',
                summary: prog.summary ?? null,
                displayInCharacterSheet: prog.displayInCharacterSheet ?? true,
                level: prog.level ?? 1,
                sourceType: prog.sourceType ?? FeatureSourceType.Race,
                domainId: prog.domainId ?? null,
                featId: prog.featId ?? null,
                companionId: prog.companionId ?? null,
                editionId: prog.editionId ?? null,
                entities: prog.entities,
                displayConditions: prog.displayConditions,
            }));
            await featureSystemService.createMultipleFeatures(createProgressions, context);
        }

        return { id: result.id.toString(), message: 'Race created successfully' };
    },

    async updateRace(id: RaceIdParamRequest, data: UpdateRaceRequest): Promise<UpdateResponse> {
        const { features, ...raceData } = data;

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

            // Sync FeatureRaceMap links
            // Features are already saved via state system, we only need to sync the links
            if (features && features.length > 0) {
                console.log(`[RaceService] Syncing FeatureRaceMap for race ${id.id} with ${features.length} features`);

                // Extract feature IDs from the features array
                // Features should have id fields (they were already saved via state system)
                const featureIds: number[] = [];
                for (const feature of features) {
                    if (feature.id && typeof feature.id === 'number') {
                        featureIds.push(feature.id);
                    }
                }

                console.log(`[RaceService] Extracted ${featureIds.length} feature IDs: ${featureIds.join(', ')}`);

                // Verify all feature IDs exist in database
                if (featureIds.length > 0) {
                    const existingFeatures = await tx.feature.findMany({
                        where: { id: { in: featureIds } },
                        select: { id: true }
                    });

                    const foundIds = new Set(existingFeatures.map(f => f.id));
                    const missingIds = featureIds.filter(id => !foundIds.has(id));

                    if (missingIds.length > 0) {
                        console.error(`[RaceService] WARNING: ${missingIds.length} feature IDs not found in database: ${missingIds.join(', ')}`);
                        // Filter out missing IDs
                        const validFeatureIds = featureIds.filter(id => foundIds.has(id));
                        await featureSystemService.syncRaceFeatures(id.id, validFeatureIds, tx);
                    } else {
                        // All IDs are valid, sync links
                        await featureSystemService.syncRaceFeatures(id.id, featureIds, tx);
                    }
                } else {
                    console.warn(`[RaceService] No valid feature IDs found in features array`);
                    // Sync to empty list (removes all links for this race)
                    await featureSystemService.syncRaceFeatures(id.id, [], tx);
                }
            } else {
                // No features provided - sync to empty list (removes all links for this race)
                console.log(`[RaceService] No features provided for race ${id.id}, removing all FeatureRaceMap entries`);
                await featureSystemService.syncRaceFeatures(id.id, [], tx);
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

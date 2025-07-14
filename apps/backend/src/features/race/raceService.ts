import { PrismaClient, Prisma } from '@shared/prisma-client';
import type {
    RaceIdParamRequest,
    CreateRaceRequest,
    UpdateRaceRequest,
    RaceTraitSlugParamRequest,
    CreateRaceTraitRequest,
    UpdateRaceTraitRequest,
    CreateResponse,
    GetRaceResponse,
    UpdateResponse,
    GetRaceTraitResponse,
    GetAllRacesResponse,
    GetAllRaceTraitsResponse,
} from '@shared/schema';

import { RaceService } from './types';

const prisma = new PrismaClient();

export const raceService: RaceService = {
    async getAllRaces(): Promise<GetAllRacesResponse> {
        const [races] = await Promise.all([
            prisma.race.findMany({
                orderBy: { name: 'asc' },
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
                languages: true,
                abilityAdjustments: true,
                traits: {
                    include: {
                        trait: true,
                    },
                },
                sources: true,
            },
        });
    },

    async createRace(data: CreateRaceRequest): Promise<CreateResponse> {
        // Use Prisma input type directly - it handles nested relationships
        const result = await prisma.race.create({
            data: {
                ...data,
                languages: {
                    create: data.languages?.map(languageId => ({ languageId: languageId.languageId }))
                },
                traits: {
                    create: data.traits?.map(traitId => ({ traitSlug: traitId.traitSlug }))
                },
                abilityAdjustments: {
                    create: data.abilityAdjustments?.map(abilityAdjustment => ({
                        abilityId: abilityAdjustment.abilityId,
                        value: abilityAdjustment.value
                    })) || []
                },
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
        // Use Prisma input type directly - it handles nested relationships
        await prisma.$transaction(async (tx) => {
            await tx.raceLanguageMap.deleteMany({ where: { raceId: id.id } });
            await tx.raceTraitMap.deleteMany({ where: { raceId: id.id } });
            await tx.raceAbilityAdjustment.deleteMany({ where: { raceId: id.id } });
            await tx.raceSourceMap.deleteMany({ where: { raceId: id.id } });

            await tx.race.update({
                where: { id: id.id },
                data: {
                    ...data,
                    languages: {
                        create: data.languages?.map(languageId => ({ languageId: languageId.languageId }))
                    },
                    traits: {
                        create: data.traits?.map(traitId => ({ traitSlug: traitId.traitSlug }))
                    },
                    abilityAdjustments: {
                        create: data.abilityAdjustments?.map(abilityAdjustment => ({
                            abilityId: abilityAdjustment.abilityId,
                            value: abilityAdjustment.value
                        })) || []
                    },
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

    // Race Trait methods
    async getRaceTraits(): Promise<GetAllRaceTraitsResponse> {

        const [traits] = await Promise.all([
            prisma.raceTrait.findMany({
                orderBy: { slug: 'asc' },
            }),
            prisma.raceTrait.count(),
        ]);

        return {
            total: traits.length,
            results: traits,
        };
    },

    async getRaceTraitBySlug(slug: RaceTraitSlugParamRequest): Promise<GetRaceTraitResponse | null> {
        return prisma.raceTrait.findUnique({
            where: { slug: slug.slug },
        });
    },

    async createRaceTrait(data: CreateRaceTraitRequest): Promise<CreateResponse> {
        // Use Prisma input type directly
        const result = await prisma.raceTrait.create({
            data,
        });

        return { id: result.slug, message: 'Race trait created successfully' };
    },

    async updateRaceTrait(slug: RaceTraitSlugParamRequest, data: UpdateRaceTraitRequest): Promise<UpdateResponse> {
        // Use Prisma input type directly
        await prisma.raceTrait.update({
            where: { slug: slug.slug },
            data,
        });

        return { message: 'Race trait updated successfully' };
    },

    async deleteRaceTrait(slug: RaceTraitSlugParamRequest): Promise<UpdateResponse> {
        await prisma.raceTrait.delete({
            where: { slug: slug.slug },
        });
        return { message: 'Race trait deleted successfully' };
    },
};

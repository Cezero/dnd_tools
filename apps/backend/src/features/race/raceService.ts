import { PrismaClient, Prisma } from '@shared/prisma-client';
import type {
    RaceQueryRequest,
    RaceIdParamRequest,
    CreateRaceRequest,
    UpdateRaceRequest,
    RaceTraitQueryRequest,
    RaceTraitSlugParamRequest,
    CreateRaceTraitRequest,
    UpdateRaceTraitRequest,
} from '@shared/schema';

import { RaceService } from './types';

const prisma = new PrismaClient();

export const raceService: RaceService = {
    async getRaces(query: RaceQueryRequest) {
        const page = query.page;
        const limit = query.limit;
        const skip = (page - 1) * limit;

        // Build where clause for filtering
        const where: Prisma.RaceWhereInput = {};

        if (query.name) {
            where.name = { contains: query.name };
        }
        if (query.editionId) {
            where.editionId = query.editionId;
        }
        if (query.isVisible !== undefined) {
            where.isVisible = query.isVisible;
        }
        if (query.description) {
            where.description = { contains: query.description };
        }

        const [races, total] = await Promise.all([
            prisma.race.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
            }),
            prisma.race.count({ where }),
        ]);

        return {
            page,
            limit,
            total,
            results: races,
        };
    },

    async getRaceById(id: RaceIdParamRequest) {
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
            },
        });
    },

    async createRace(data: CreateRaceRequest) {
        // Use Prisma input type directly - it handles nested relationships
        const result = await prisma.race.create({
            data: {
                ...data,
                languages: {
                    create: data.languages?.map(languageId => ({ languageId: languageId.languageId }))
                },
                traits: {
                    create: data.traits?.map(traitId => ({ traitId: traitId.traitId }))
                }
            },
        });

        return { id: result.id, message: 'Race created successfully' };
    },

    async updateRace(id: RaceIdParamRequest, data: UpdateRaceRequest) {
        // Use Prisma input type directly - it handles nested relationships
        await prisma.$transaction(async (tx) => {
            await tx.raceLanguageMap.deleteMany({ where: { raceId: id.id } });
            await tx.raceTraitMap.deleteMany({ where: { raceId: id.id } });

            await tx.race.update({
                where: { id: id.id },
                data: {
                    ...data,
                    languages: {
                        create: data.languages?.map(languageId => ({ languageId: languageId.languageId }))
                    },
                    traits: {
                        create: data.traits?.map(traitId => ({ traitId: traitId.traitId }))
                    }
                }
            });
        });

        return { message: 'Race updated successfully' };
    },

    async deleteRace(id: RaceIdParamRequest) {
        await prisma.race.delete({
            where: { id: id.id },
        });
        return { message: 'Race deleted successfully' };
    },

    // Race Trait methods
    async getRaceTraits(query: RaceTraitQueryRequest) {
        const page = query.page;
        const limit = query.limit;
        const skip = (page - 1) * limit;

        // Build where clause for filtering
        const where: Prisma.RaceTraitWhereInput = {};

        if (query.slug) {
            where.slug = { contains: query.slug };
        }
        if (query.name) {
            where.name = { contains: query.name };
        }
        if (query.hasValue !== undefined) {
            where.hasValue = query.hasValue;
        }

        const [traits, total] = await Promise.all([
            prisma.raceTrait.findMany({
                where,
                skip,
                take: limit,
                orderBy: { slug: 'asc' },
            }),
            prisma.raceTrait.count({ where }),
        ]);

        return {
            page,
            limit,
            total,
            results: traits,
        };
    },

    async getRaceTraitsList() {
        const traits = await prisma.raceTrait.findMany();

        return traits;
    },

    async getRaceTraitBySlug(slug: RaceTraitSlugParamRequest) {
        return prisma.raceTrait.findUnique({
            where: { slug: slug.slug },
        });
    },

    async createRaceTrait(data: CreateRaceTraitRequest) {
        // Use Prisma input type directly
        const result = await prisma.raceTrait.create({
            data,
        });

        return { slug: result.slug, message: 'Race trait created successfully' };
    },

    async updateRaceTrait(slug: RaceTraitSlugParamRequest, data: UpdateRaceTraitRequest) {
        // Use Prisma input type directly
        await prisma.raceTrait.update({
            where: { slug: slug.slug },
            data,
        });

        return { message: 'Race trait updated successfully' };
    },

    async deleteRaceTrait(slug: RaceTraitSlugParamRequest) {
        await prisma.raceTrait.delete({
            where: { slug: slug.slug },
        });
        return { message: 'Race trait deleted successfully' };
    },
};
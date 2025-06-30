import { PrismaClient, Prisma } from '@shared/prisma-client';

import type {
    RaceQuery,
    RaceListResponse,
    RaceWithRelations,
    RaceTraitQuery,
    RaceService
} from './types';

const prisma = new PrismaClient();

// Helper function to validate race data (works for both create and update)
function validateRaceData(race: Prisma.RaceCreateInput | Prisma.RaceUpdateInput): string | null {
    // For create operations, required fields must be present
    if ('name' in race && race.name && typeof race.name === 'string' && race.name.trim() === '') {
        return 'Race name cannot be empty.';
    }
    if ('sizeId' in race && race.sizeId && typeof race.sizeId === 'number' && race.sizeId <= 0) {
        return 'Size ID must be a positive integer.';
    }
    if ('speed' in race && race.speed && typeof race.speed === 'number' && race.speed < 0) {
        return 'Speed must be non-negative.';
    }
    if ('favoredClassId' in race && race.favoredClassId && typeof race.favoredClassId === 'number' && race.favoredClassId < 0) {
        return 'Favored class ID must be non-negative.';
    }
    return null; // No error
}

// Helper function to validate race trait data
function validateRaceTraitData(trait: Prisma.RaceTraitCreateInput): string | null {
    const { slug } = trait;
    if (!slug || slug.trim() === '') {
        return 'Trait slug cannot be empty.';
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
        return 'Trait slug can only contain lowercase letters, numbers, and hyphens.';
    }
    return null; // No error
}

export const raceService: RaceService = {
    async getAllRaces(query) {
        const page = parseInt(query.page || '1');
        const limit = parseInt(query.limit || '10');
        const skip = (page - 1) * limit;

        // Build where clause for filtering
        const where: Prisma.RaceWhereInput = {};

        if (query.name) {
            where.name = { contains: query.name };
        }
        if (query.editionId) {
            where.editionId = parseInt(query.editionId);
        }
        if (query.isVisible !== undefined) {
            where.isVisible = query.isVisible === 'true';
        }
        if (query.sizeId) {
            where.sizeId = parseInt(query.sizeId);
        }
        if (query.speed) {
            where.speed = parseInt(query.speed);
        }
        if (query.favoredClassId) {
            where.favoredClassId = parseInt(query.favoredClassId);
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

    async getAllRacesSimple() {
        return prisma.race.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: { name: 'asc' },
        });
    },

    async getRaceById(id) {
        return prisma.race.findUnique({
            where: { id },
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

    async createRace(data) {
        const validationError = validateRaceData(data);
        if (validationError) {
            throw new Error(validationError);
        }

        // Use Prisma input type directly - it handles nested relationships
        const result = await prisma.race.create({
            data,
        });

        return { id: result.id, message: 'Race created successfully' };
    },

    async updateRace(id, data) {
        const validationError = validateRaceData(data);
        if (validationError) {
            throw new Error(validationError);
        }

        // Use Prisma input type directly - it handles nested relationships
        await prisma.race.update({
            where: { id },
            data,
        });

        return { message: 'Race updated successfully' };
    },

    async deleteRace(id) {
        await prisma.race.delete({
            where: { id },
        });
        return { message: 'Race deleted successfully' };
    },

    // Race Trait methods
    async getAllRaceTraits(query) {
        const page = parseInt(query.page || '1');
        const limit = parseInt(query.limit || '10');
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
            where.hasValue = query.hasValue === 'true';
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

    async getAllRaceTraitsSimple() {
        const traits = await prisma.raceTrait.findMany({
            select: {
                slug: true,
                name: true,
                description: true,
                hasValue: true,
            },
            orderBy: { slug: 'asc' },
        });

        // Return the actual Prisma result type
        return traits as Array<{
            slug: string;
            name: string | null;
            description: string | null;
            hasValue: boolean;
        }>;
    },

    async getRaceTraitBySlug(slug) {
        return prisma.raceTrait.findUnique({
            where: { slug },
        });
    },

    async createRaceTrait(data) {
        const validationError = validateRaceTraitData(data);
        if (validationError) {
            throw new Error(validationError);
        }

        // Use Prisma input type directly
        const result = await prisma.raceTrait.create({
            data,
        });

        return { slug: result.slug, message: 'Race trait created successfully' };
    },

    async updateRaceTrait(slug, data) {
        // Use Prisma input type directly
        await prisma.raceTrait.update({
            where: { slug },
            data,
        });

        return { message: 'Race trait updated successfully' };
    },

    async deleteRaceTrait(slug) {
        await prisma.raceTrait.delete({
            where: { slug },
        });
        return { message: 'Race trait deleted successfully' };
    },

    validateRaceData,
    validateRaceTraitData,
}; 
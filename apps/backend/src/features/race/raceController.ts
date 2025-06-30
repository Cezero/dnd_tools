import { Request, Response } from 'express';

import { PrismaClient, Prisma } from '@shared/prisma-client';

import type {
    RaceRequest,
    RaceCreateRequest,
    RaceUpdateRequest,
    RaceDeleteRequest,
    RaceTraitRequest,
    RaceTraitCreateRequest,
    RaceTraitUpdateRequest,
    RaceTraitDeleteRequest
} from './types';

const prisma = new PrismaClient();

/**
 * Fetches all races from the database with pagination and filtering.
 */
export const GetRaces = async (req: RaceRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '10');
        const skip = (page - 1) * limit;

        // Build where clause for filtering
        const where: Prisma.RaceWhereInput = {};

        if (req.query.name) {
            where.name = { contains: req.query.name };
        }
        if (req.query.editionId) {
            where.editionId = parseInt(req.query.editionId);
        }
        if (req.query.isVisible !== undefined) {
            where.isVisible = req.query.isVisible === 'true';
        }
        if (req.query.sizeId) {
            where.sizeId = parseInt(req.query.sizeId);
        }
        if (req.query.speed) {
            where.speed = parseInt(req.query.speed);
        }
        if (req.query.favoredClassId) {
            where.favoredClassId = parseInt(req.query.favoredClassId);
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

        res.json({
            page,
            limit,
            total,
            results: races,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

export const GetAllRaces = async (req: Request, res: Response): Promise<void> => {
    try {
        const races = await prisma.race.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: { name: 'asc' },
        });
        res.json(races);
    } catch (error) {
        console.error('Error fetching all races:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Fetches a single race by its ID.
 */
export const GetRaceById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const race = await prisma.race.findUnique({
            where: { id: parseInt(id) },
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

        if (!race) {
            res.status(404).send('Race not found');
            return;
        }

        res.json(race);
    } catch (error) {
        console.error('Error fetching race by ID:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Fetches all race traits from the database.
 */
export const GetRaceTraits = async (req: RaceTraitRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '10');
        const skip = (page - 1) * limit;

        // Build where clause for filtering
        const where: Prisma.RaceTraitWhereInput = {};

        if (req.query.slug) {
            where.slug = { contains: req.query.slug };
        }
        if (req.query.name) {
            where.name = { contains: req.query.name };
        }
        if (req.query.hasValue !== undefined) {
            where.hasValue = req.query.hasValue === 'true';
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

        res.json({
            page,
            limit,
            total,
            results: traits,
        });
    } catch (error) {
        console.error('Error fetching race traits:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Fetches a single race trait by its slug.
 */
export const GetRaceTraitBySlug = async (req: Request<{ slug: string }>, res: Response): Promise<void> => {
    const { slug } = req.params;
    try {
        const trait = await prisma.raceTrait.findUnique({
            where: { slug },
        });

        if (!trait) {
            res.status(404).send('Race trait not found');
            return;
        }

        res.json(trait);
    } catch (error) {
        console.error('Error fetching race trait by slug:', error);
        res.status(500).send('Server error');
    }
};

export const GetAllRaceTraits = async (req: Request, res: Response): Promise<void> => {
    try {
        const traits = await prisma.raceTrait.findMany({
            select: {
                slug: true,
                name: true,
                description: true,
                hasValue: true,
            },
            orderBy: { slug: 'asc' },
        });
        res.json(traits);
    } catch (error) {
        console.error('Error fetching all race traits:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Creates a new race.
 */
export const CreateRace = async (req: RaceCreateRequest, res: Response): Promise<void> => {
    const {
        name,
        description,
        sizeId,
        speed,
        favoredClassId,
        editionId,
        isVisible,
        languages,
        adjustments,
        traits
    } = req.body;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const newRace = await tx.race.create({
                data: {
                    name,
                    description,
                    sizeId,
                    speed,
                    favoredClassId,
                    editionId,
                    isVisible,
                },
            });

            if (languages && languages.length > 0) {
                await tx.raceLanguageMap.createMany({
                    data: languages.map(lang => ({
                        raceId: newRace.id,
                        languageId: lang.languageId,
                        isAutomatic: lang.isAutomatic,
                    })),
                });
            }

            if (adjustments && adjustments.length > 0) {
                await tx.raceAbilityAdjustment.createMany({
                    data: adjustments.map(adj => ({
                        raceId: newRace.id,
                        abilityId: adj.abilityId,
                        value: adj.value,
                    })),
                });
            }

            if (traits && traits.length > 0) {
                await tx.raceTraitMap.createMany({
                    data: traits.map(trait => ({
                        raceId: newRace.id,
                        traitId: trait.traitId,
                        value: trait.value,
                    })),
                });
            }

            return newRace.id;
        });

        res.status(201).json({ id: result, message: 'Race created successfully' });
    } catch (error) {
        console.error('Error creating race:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Creates a new race trait.
 */
export const CreateRaceTrait = async (req: RaceTraitCreateRequest, res: Response): Promise<void> => {
    const { slug, name, description, hasValue } = req.body;

    try {
        const result = await prisma.raceTrait.create({
            data: {
                slug,
                name,
                description,
                hasValue,
            },
        });

        res.status(201).json({ slug: result.slug, message: 'Race trait created successfully' });
    } catch (error) {
        console.error('Error creating race trait:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Updates an existing race.
 */
export const UpdateRace = async (req: RaceUpdateRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const {
        name,
        description,
        sizeId,
        speed,
        favoredClassId,
        editionId,
        isVisible,
        languages,
        adjustments,
        traits
    } = req.body;

    try {
        await prisma.$transaction(async (tx) => {
            const updatedRace = await tx.race.update({
                where: { id: parseInt(id) },
                data: {
                    name,
                    description,
                    sizeId,
                    speed,
                    favoredClassId,
                    editionId,
                    isVisible,
                },
            });

            // Update languages
            await tx.raceLanguageMap.deleteMany({
                where: { raceId: parseInt(id) },
            });
            if (languages && languages.length > 0) {
                await tx.raceLanguageMap.createMany({
                    data: languages.map(lang => ({
                        raceId: parseInt(id),
                        languageId: lang.languageId,
                        isAutomatic: lang.isAutomatic,
                    })),
                });
            }

            // Update ability adjustments
            await tx.raceAbilityAdjustment.deleteMany({
                where: { raceId: parseInt(id) },
            });
            if (adjustments && adjustments.length > 0) {
                await tx.raceAbilityAdjustment.createMany({
                    data: adjustments.map(adj => ({
                        raceId: parseInt(id),
                        abilityId: adj.abilityId,
                        value: adj.value,
                    })),
                });
            }

            // Update traits
            await tx.raceTraitMap.deleteMany({
                where: { raceId: parseInt(id) },
            });
            if (traits && traits.length > 0) {
                await tx.raceTraitMap.createMany({
                    data: traits.map(trait => ({
                        raceId: parseInt(id),
                        traitId: trait.traitId,
                        value: trait.value,
                    })),
                });
            }

            return updatedRace;
        });

        res.status(200).json({ message: 'Race updated successfully' });
    } catch (error) {
        console.error('Error updating race:', error);
        if (error instanceof Error && error.message.includes('Record to update not found')) {
            res.status(404).send('Race not found or no changes made');
        } else {
            res.status(500).send('Server error');
        }
    }
};

/**
 * Updates an existing race trait.
 */
export const UpdateRaceTrait = async (req: RaceTraitUpdateRequest, res: Response): Promise<void> => {
    const { slug } = req.params;
    const { name, description, hasValue } = req.body;

    try {
        const _updatedTrait = await prisma.raceTrait.update({
            where: { slug },
            data: {
                name,
                description,
                hasValue,
            },
        });

        res.status(200).json({ message: 'Race trait updated successfully' });
    } catch (error) {
        console.error('Error updating race trait:', error);
        if (error instanceof Error && error.message.includes('Record to update not found')) {
            res.status(404).send('Race trait not found or no changes made');
        } else {
            res.status(500).send('Server error');
        }
    }
};

/**
 * Deletes a race by its ID.
 */
export const DeleteRace = async (req: RaceDeleteRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        await prisma.race.delete({
            where: { id: parseInt(id) },
        });
        res.status(200).send('Race deleted successfully');
    } catch (error) {
        console.error('Error deleting race:', error);
        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
            res.status(404).send('Race not found');
        } else {
            res.status(500).send('Server error');
        }
    }
};

/**
 * Deletes a race trait by its slug.
 */
export const DeleteRaceTrait = async (req: RaceTraitDeleteRequest, res: Response): Promise<void> => {
    const { slug } = req.params;
    try {
        await prisma.raceTrait.delete({
            where: { slug },
        });
        res.status(200).send('Race trait deleted successfully');
    } catch (error) {
        console.error('Error deleting race trait:', error);
        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
            res.status(404).send('Race trait not found');
        } else {
            res.status(500).send('Server error');
        }
    }
}; 
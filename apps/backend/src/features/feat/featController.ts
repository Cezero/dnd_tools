import { Request, Response } from 'express';

import { PrismaClient, Prisma } from '@shared/prisma-client';

import type {
    FeatRequest,
    FeatCreateRequest,
    FeatUpdateRequest,
    FeatDeleteRequest
} from './types';

const prisma = new PrismaClient();

/**
 * Fetches all feats from the database with pagination and filtering.
 */
export const GetFeats = async (req: FeatRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '10');
        const skip = (page - 1) * limit;

        // Build where clause for filtering
        const where: Prisma.FeatWhereInput = {};

        if (req.query.name) {
            where.name = { contains: req.query.name };
        }
        if (req.query.typeId) {
            where.typeId = parseInt(req.query.typeId);
        }
        if (req.query.description) {
            where.description = { contains: req.query.description };
        }
        if (req.query.benefit) {
            where.benefit = { contains: req.query.benefit };
        }
        if (req.query.normalEffect) {
            where.normalEffect = { contains: req.query.normalEffect };
        }
        if (req.query.specialEffect) {
            where.specialEffect = { contains: req.query.specialEffect };
        }
        if (req.query.prerequisites) {
            where.prerequisites = { contains: req.query.prerequisites };
        }
        if (req.query.repeatable !== undefined) {
            where.repeatable = req.query.repeatable === 'true';
        }

        const [feats, total] = await Promise.all([
            prisma.feat.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
                include: {
                    benefits: true,
                    prerequisitesMap: true,
                },
            }),
            prisma.feat.count({ where }),
        ]);

        res.json({
            page,
            limit,
            total,
            results: feats,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

export const GetAllFeats = async (req: Request, res: Response): Promise<void> => {
    try {
        const feats = await prisma.feat.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: { name: 'asc' },
        });
        res.json(feats);
    } catch (error) {
        console.error('Error fetching all feats:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Fetches a single feat by its ID.
 */
export const GetFeatById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const feat = await prisma.feat.findUnique({
            where: { id: parseInt(id) },
            include: {
                benefits: true,
                prerequisitesMap: true,
            },
        });

        if (!feat) {
            res.status(404).send('Feat not found');
            return;
        }

        res.json(feat);
    } catch (error) {
        console.error('Error fetching feat by ID:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Creates a new feat.
 */
export const CreateFeat = async (req: FeatCreateRequest, res: Response): Promise<void> => {
    const {
        name,
        typeId,
        description,
        benefit,
        normalEffect,
        specialEffect,
        prerequisites,
        repeatable,
        benefits,
        prereqs
    } = req.body;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const newFeat = await tx.feat.create({
                data: {
                    name,
                    typeId,
                    description,
                    benefit,
                    normalEffect,
                    specialEffect,
                    prerequisites,
                    repeatable,
                },
            });

            if (benefits && benefits.length > 0) {
                await tx.featBenefitMap.createMany({
                    data: benefits.map(benefit => ({
                        featId: newFeat.id,
                        typeId: benefit.typeId,
                        referenceId: benefit.referenceId,
                        amount: benefit.amount,
                        index: benefit.index,
                    })),
                });
            }

            if (prereqs && prereqs.length > 0) {
                await tx.featPrerequisiteMap.createMany({
                    data: prereqs.map(prereq => ({
                        featId: newFeat.id,
                        typeId: prereq.typeId,
                        referenceId: prereq.referenceId,
                        amount: prereq.amount,
                        index: prereq.index,
                    })),
                });
            }

            return newFeat.id;
        });

        res.status(201).json({ id: result, message: 'Feat created successfully' });
    } catch (error) {
        console.error('Error creating feat:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Updates an existing feat.
 */
export const UpdateFeat = async (req: FeatUpdateRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const {
        name,
        typeId,
        description,
        benefit,
        normalEffect,
        specialEffect,
        prerequisites,
        repeatable,
        benefits,
        prereqs
    } = req.body;

    try {
        await prisma.$transaction(async (tx) => {
            const updatedFeat = await tx.feat.update({
                where: { id: parseInt(id) },
                data: {
                    name,
                    typeId,
                    description,
                    benefit,
                    normalEffect,
                    specialEffect,
                    prerequisites,
                    repeatable,
                },
            });

            // Update benefits
            await tx.featBenefitMap.deleteMany({
                where: { featId: parseInt(id) },
            });
            if (benefits && benefits.length > 0) {
                await tx.featBenefitMap.createMany({
                    data: benefits.map(benefit => ({
                        featId: parseInt(id),
                        typeId: benefit.typeId,
                        referenceId: benefit.referenceId,
                        amount: benefit.amount,
                        index: benefit.index,
                    })),
                });
            }

            // Update prerequisites
            await tx.featPrerequisiteMap.deleteMany({
                where: { featId: parseInt(id) },
            });
            if (prereqs && prereqs.length > 0) {
                await tx.featPrerequisiteMap.createMany({
                    data: prereqs.map(prereq => ({
                        featId: parseInt(id),
                        typeId: prereq.typeId,
                        referenceId: prereq.referenceId,
                        amount: prereq.amount,
                        index: prereq.index,
                    })),
                });
            }

            return updatedFeat;
        });

        res.status(200).json({ message: 'Feat updated successfully' });
    } catch (error) {
        console.error('Error updating feat:', error);
        if (error instanceof Error && error.message.includes('Record to update not found')) {
            res.status(404).send('Feat not found or no changes made');
        } else {
            res.status(500).send('Server error');
        }
    }
};

/**
 * Deletes a feat by its ID.
 */
export const DeleteFeat = async (req: FeatDeleteRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        await prisma.feat.delete({
            where: { id: parseInt(id) },
        });
        res.status(204).send(); // No Content
    } catch (error) {
        console.error('Error deleting feat:', error);
        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
            res.status(404).send('Feat not found');
        } else {
            res.status(500).send('Server error');
        }
    }
}; 
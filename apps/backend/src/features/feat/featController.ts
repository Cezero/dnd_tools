import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@shared/prisma-client';

const prisma = new PrismaClient();

interface FeatRequest extends Request {
    query: {
        page?: string;
        limit?: string;
        feat_name?: string;
        feat_type?: string;
        feat_description?: string;
        feat_benefit?: string;
        feat_normal?: string;
        feat_special?: string;
        feat_prereq?: string;
        feat_multi_times?: string;
    };
}

interface FeatCreateRequest extends Request {
    body: {
        feat_name: string;
        feat_type: number;
        feat_description?: string;
        feat_benefit?: string;
        feat_normal?: string;
        feat_special?: string;
        feat_prereq?: string;
        feat_multi_times: boolean;
        benefits?: Array<{
            benefit_index: number;
            benefit_type: number;
            benefit_type_id?: number;
            benefit_amount?: number;
        }>;
        prereqs?: Array<{
            prereq_index: number;
            prereq_type: number;
            prereq_amount?: number;
            prereq_type_id?: number;
        }>;
    };
}

interface FeatUpdateRequest extends Request {
    params: { id: string };
    body: {
        feat_name: string;
        feat_type: number;
        feat_description?: string;
        feat_benefit?: string;
        feat_normal?: string;
        feat_special?: string;
        feat_prereq?: string;
        feat_multi_times: boolean;
        benefits?: Array<{
            benefit_index: number;
            benefit_type: number;
            benefit_type_id?: number;
            benefit_amount?: number;
        }>;
        prereqs?: Array<{
            prereq_index: number;
            prereq_type: number;
            prereq_amount?: number;
            prereq_type_id?: number;
        }>;
    };
}

interface FeatDeleteRequest extends Request {
    params: { id: string };
}

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

        if (req.query.feat_name) {
            where.name = { contains: req.query.feat_name };
        }
        if (req.query.feat_type) {
            where.typeId = parseInt(req.query.feat_type);
        }
        if (req.query.feat_description) {
            where.description = { contains: req.query.feat_description };
        }
        if (req.query.feat_benefit) {
            where.benefit = { contains: req.query.feat_benefit };
        }
        if (req.query.feat_normal) {
            where.normalEffect = { contains: req.query.feat_normal };
        }
        if (req.query.feat_special) {
            where.specialEffect = { contains: req.query.feat_special };
        }
        if (req.query.feat_prereq) {
            where.prerequisites = { contains: req.query.feat_prereq };
        }
        if (req.query.feat_multi_times !== undefined) {
            where.repeatable = req.query.feat_multi_times === 'true';
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
        feat_name,
        feat_type,
        feat_description,
        feat_benefit,
        feat_normal,
        feat_special,
        feat_prereq,
        feat_multi_times,
        benefits,
        prereqs
    } = req.body;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const newFeat = await tx.feat.create({
                data: {
                    name: feat_name,
                    typeId: feat_type,
                    description: feat_description,
                    benefit: feat_benefit,
                    normalEffect: feat_normal,
                    specialEffect: feat_special,
                    prerequisites: feat_prereq,
                    repeatable: feat_multi_times,
                },
            });

            if (benefits && benefits.length > 0) {
                await tx.featBenefitMap.createMany({
                    data: benefits.map(benefit => ({
                        featId: newFeat.id,
                        typeId: benefit.benefit_type,
                        referenceId: benefit.benefit_type_id,
                        amount: benefit.benefit_amount,
                        index: benefit.benefit_index,
                    })),
                });
            }

            if (prereqs && prereqs.length > 0) {
                await tx.featPrerequisiteMap.createMany({
                    data: prereqs.map(prereq => ({
                        featId: newFeat.id,
                        typeId: prereq.prereq_type,
                        referenceId: prereq.prereq_type_id,
                        amount: prereq.prereq_amount,
                        index: prereq.prereq_index,
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
        feat_name,
        feat_type,
        feat_description,
        feat_benefit,
        feat_normal,
        feat_special,
        feat_prereq,
        feat_multi_times,
        benefits,
        prereqs
    } = req.body;

    try {
        await prisma.$transaction(async (tx) => {
            const updatedFeat = await tx.feat.update({
                where: { id: parseInt(id) },
                data: {
                    name: feat_name,
                    typeId: feat_type,
                    description: feat_description,
                    benefit: feat_benefit,
                    normalEffect: feat_normal,
                    specialEffect: feat_special,
                    prerequisites: feat_prereq,
                    repeatable: feat_multi_times,
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
                        typeId: benefit.benefit_type,
                        referenceId: benefit.benefit_type_id,
                        amount: benefit.benefit_amount,
                        index: benefit.benefit_index,
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
                        typeId: prereq.prereq_type,
                        referenceId: prereq.prereq_type_id,
                        amount: prereq.prereq_amount,
                        index: prereq.prereq_index,
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
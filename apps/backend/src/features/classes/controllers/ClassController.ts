import { Request, Response } from 'express';
import { PrismaClient } from '@shared/prisma-client';

const prisma = new PrismaClient();

interface ClassRequest extends Request {
    query: {
        page?: string;
        limit?: string;
        name?: string;
        abbreviation?: string;
        editionId?: string;
        isPrestige?: string;
        isVisible?: string;
        canCastSpells?: string;
        hitDie?: string;
        skillPoints?: string;
        castingAbilityId?: string;
    };
}

interface ClassCreateRequest extends Request {
    body: {
        name: string;
        abbreviation: string;
        editionId?: number;
        isPrestige: boolean;
        isVisible: boolean;
        canCastSpells: boolean;
        hitDie: number;
        skillPoints: number;
        castingAbilityId?: number;
        description?: string;
    };
}

interface ClassUpdateRequest extends Request {
    params: { id: string };
    body: {
        name: string;
        abbreviation: string;
        editionId?: number;
        isPrestige: boolean;
        isVisible: boolean;
        canCastSpells: boolean;
        hitDie: number;
        skillPoints: number;
        castingAbilityId?: number;
        description?: string;
    };
}

interface ClassDeleteRequest extends Request {
    params: { id: string };
}

/**
 * Fetches all classes from the database with pagination and filtering.
 */
export const GetClasses = async (req: ClassRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '10');
        const skip = (page - 1) * limit;

        // Build where clause for filtering
        const where: any = {};

        if (req.query.name) {
            where.name = { contains: req.query.name, mode: 'insensitive' };
        }
        if (req.query.abbreviation) {
            where.abbreviation = { contains: req.query.abbreviation, mode: 'insensitive' };
        }
        if (req.query.editionId) {
            where.editionId = parseInt(req.query.editionId);
        }
        if (req.query.isPrestige !== undefined) {
            where.isPrestige = req.query.isPrestige === 'true';
        }
        if (req.query.isVisible !== undefined) {
            where.isVisible = req.query.isVisible === 'true';
        }
        if (req.query.canCastSpells !== undefined) {
            where.canCastSpells = req.query.canCastSpells === 'true';
        }
        if (req.query.hitDie) {
            where.hitDie = parseInt(req.query.hitDie);
        }
        if (req.query.skillPoints) {
            where.skillPoints = parseInt(req.query.skillPoints);
        }
        if (req.query.castingAbilityId) {
            where.castingAbilityId = parseInt(req.query.castingAbilityId);
        }

        const [classes, total] = await Promise.all([
            prisma.class.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
            }),
            prisma.class.count({ where }),
        ]);

        res.json({
            page,
            limit,
            total,
            results: classes,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

export const GetAllClasses = async (req: Request, res: Response): Promise<void> => {
    try {
        const classes = await prisma.class.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: { name: 'asc' },
        });
        res.json(classes);
    } catch (error) {
        console.error('Error fetching all classes:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Fetches a single class by its ID.
 */
export const GetClassById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const cls = await prisma.class.findUnique({
            where: { id: parseInt(id) },
        });

        if (!cls) {
            res.status(404).send('Class not found');
            return;
        }

        res.json(cls);
    } catch (error) {
        console.error('Error fetching class by ID:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Creates a new class.
 */
export const CreateClass = async (req: ClassCreateRequest, res: Response): Promise<void> => {
    const {
        name,
        abbreviation,
        editionId,
        isPrestige,
        isVisible,
        canCastSpells,
        hitDie,
        skillPoints,
        castingAbilityId,
        description
    } = req.body;

    try {
        const result = await prisma.class.create({
            data: {
                name,
                abbreviation,
                editionId,
                isPrestige,
                isVisible,
                canCastSpells,
                hitDie,
                skillPoints,
                castingAbilityId,
                description,
            },
        });

        res.status(201).json({ id: result.id, message: 'Class created successfully' });
    } catch (error) {
        console.error('Error creating class:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Updates an existing class.
 */
export const UpdateClass = async (req: ClassUpdateRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const {
        name,
        abbreviation,
        editionId,
        isPrestige,
        isVisible,
        canCastSpells,
        hitDie,
        skillPoints,
        castingAbilityId,
        description
    } = req.body;

    try {
        const updatedClass = await prisma.class.update({
            where: { id: parseInt(id) },
            data: {
                name,
                abbreviation,
                editionId,
                isPrestige,
                isVisible,
                canCastSpells,
                hitDie,
                skillPoints,
                castingAbilityId,
                description,
            },
        });

        res.status(200).json({ message: 'Class updated successfully' });
    } catch (error) {
        console.error('Error updating class:', error);
        if (error instanceof Error && error.message.includes('Record to update not found')) {
            res.status(404).send('Class not found or no changes made');
        } else {
            res.status(500).send('Server error');
        }
    }
};

/**
 * Deletes a class by its ID.
 */
export const DeleteClass = async (req: ClassDeleteRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        await prisma.class.delete({
            where: { id: parseInt(id) },
        });
        res.status(200).send('Class deleted successfully');
    } catch (error) {
        console.error('Error deleting class:', error);
        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
            res.status(404).send('Class not found');
        } else {
            res.status(500).send('Server error');
        }
    }
}; 
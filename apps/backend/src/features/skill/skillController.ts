import { Request, Response } from 'express';

import { PrismaClient, Prisma } from '@shared/prisma-client';

const prisma = new PrismaClient();

interface SkillRequest extends Request {
    query: {
        page?: string;
        limit?: string;
        name?: string;
        abilityId?: string;
        trainedOnly?: string;
        affectedByArmor?: string;
    };
}

interface SkillCreateRequest extends Request {
    body: {
        name: string;
        abilityId: number;
        trainedOnly: boolean;
        affectedByArmor: boolean;
        description?: string;
        checkDescription?: string;
        actionDescription?: string;
        retryTypeId?: number;
        retryDescription?: string;
        specialNotes?: string;
        synergyNotes?: string;
        untrainedNotes?: string;
    };
}

interface SkillUpdateRequest extends Request {
    params: { id: string };
    body: {
        name: string;
        abilityId: number;
        trainedOnly: boolean;
        affectedByArmor: boolean;
        description?: string;
        checkDescription?: string;
        actionDescription?: string;
        retryTypeId?: number;
        retryDescription?: string;
        specialNotes?: string;
        synergyNotes?: string;
        untrainedNotes?: string;
    };
}

interface SkillDeleteRequest extends Request {
    params: { id: string };
}

/**
 * Fetches all skills from the database with pagination and filtering.
 */
export const GetSkills = async (req: SkillRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '10');
        const skip = (page - 1) * limit;

        // Build where clause for filtering
        const where: Prisma.SkillWhereInput = {};

        if (req.query.name) {
            where.name = { contains: req.query.name };
        }
        if (req.query.abilityId) {
            where.abilityId = parseInt(req.query.abilityId);
        }
        if (req.query.trainedOnly !== undefined) {
            where.trainedOnly = req.query.trainedOnly === 'true';
        }
        if (req.query.affectedByArmor !== undefined) {
            where.affectedByArmor = req.query.affectedByArmor === 'true';
        }

        const [skills, total] = await Promise.all([
            prisma.skill.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
            }),
            prisma.skill.count({ where }),
        ]);

        res.json({
            page,
            limit,
            total,
            results: skills,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

export const GetAllSkills = async (req: Request, res: Response): Promise<void> => {
    try {
        const skills = await prisma.skill.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: { name: 'asc' },
        });
        res.json(skills);
    } catch (error) {
        console.error('Error fetching all skills:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Fetches a single skill by its ID.
 */
export const GetSkillById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const skill = await prisma.skill.findUnique({
            where: { id: parseInt(id) },
        });

        if (!skill) {
            res.status(404).send('Skill not found');
            return;
        }

        res.json(skill);
    } catch (error) {
        console.error('Error fetching skill by ID:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Creates a new skill.
 */
export const CreateSkill = async (req: SkillCreateRequest, res: Response): Promise<void> => {
    const {
        name,
        abilityId,
        trainedOnly,
        affectedByArmor,
        description,
        checkDescription,
        actionDescription,
        retryTypeId,
        retryDescription,
        specialNotes,
        synergyNotes,
        untrainedNotes
    } = req.body;

    try {
        const result = await prisma.skill.create({
            data: {
                name,
                abilityId,
                trainedOnly,
                affectedByArmor,
                description,
                checkDescription,
                actionDescription,
                retryTypeId,
                retryDescription,
                specialNotes,
                synergyNotes,
                untrainedNotes,
            },
        });

        res.status(201).json({ id: result.id, message: 'Skill created successfully' });
    } catch (error) {
        console.error('Error creating skill:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Updates an existing skill.
 */
export const UpdateSkill = async (req: SkillUpdateRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const {
        name,
        abilityId,
        trainedOnly,
        affectedByArmor,
        description,
        checkDescription,
        actionDescription,
        retryTypeId,
        retryDescription,
        specialNotes,
        synergyNotes,
        untrainedNotes
    } = req.body;

    try {
        const _updatedSkill = await prisma.skill.update({
            where: { id: parseInt(id) },
            data: {
                name,
                abilityId,
                trainedOnly,
                affectedByArmor,
                description,
                checkDescription,
                actionDescription,
                retryTypeId,
                retryDescription,
                specialNotes,
                synergyNotes,
                untrainedNotes,
            },
        });

        res.status(200).json({ message: 'Skill updated successfully' });
    } catch (error) {
        console.error('Error updating skill:', error);
        if (error instanceof Error && error.message.includes('Record to update not found')) {
            res.status(404).send('Skill not found or no changes made');
        } else {
            res.status(500).send('Server error');
        }
    }
};

/**
 * Deletes a skill by its ID.
 */
export const DeleteSkill = async (req: SkillDeleteRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        await prisma.skill.delete({
            where: { id: parseInt(id) },
        });
        res.status(200).send('Skill deleted successfully');
    } catch (error) {
        console.error('Error deleting skill:', error);
        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
            res.status(404).send('Skill not found');
        } else {
            res.status(500).send('Server error');
        }
    }
}; 
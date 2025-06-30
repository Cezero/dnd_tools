import { Request, Response } from 'express';

import { skillService } from './skillService.js';
import type { SkillQuery } from './types.js';

/**
 * Fetches all skills from the database with pagination and filtering.
 */
export const GetSkills = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await skillService.getAllSkills(req.query as SkillQuery);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

export const GetAllSkills = async (req: Request, res: Response): Promise<void> => {
    try {
        const skills = await skillService.getAllSkillsSimple();
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
        const skill = await skillService.getSkillById(parseInt(id));

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
export const CreateSkill = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await skillService.createSkill(req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating skill:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Updates an existing skill.
 */
export const UpdateSkill = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const result = await skillService.updateSkill(parseInt(id), req.body);
        res.status(200).json(result);
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
export const DeleteSkill = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const result = await skillService.deleteSkill(parseInt(id));
        res.status(200).send(result.message);
    } catch (error) {
        console.error('Error deleting skill:', error);
        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
            res.status(404).send('Skill not found');
        } else {
            res.status(500).send('Server error');
        }
    }
}; 
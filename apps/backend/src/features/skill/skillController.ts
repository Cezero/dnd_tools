import { Response } from 'express';

import { ValidatedQueryT, ValidatedParamsT, ValidatedParamsBodyT, ValidatedBodyT } from '@/util/validated-types'
import { CreateSkillRequest, SkillIdParamRequest, SkillQueryRequest, UpdateSkillRequest, SkillResponse, SkillQueryResponse } from '@shared/schema';

import { skillService } from './skillService.js';
/**
 * Fetches all skills from the database with pagination and filtering.
 */
export async function GetSkills(req: ValidatedQueryT<SkillQueryRequest, SkillQueryResponse>, res: Response) {
    const result = await skillService.getSkills(req.query);
    res.json(result);
}

/**
 * Fetches a single skill by ID.
 */
export async function GetSkillById(req: ValidatedParamsT<SkillIdParamRequest, SkillResponse>, res: Response) {
    const skill = await skillService.getSkillById({ id: req.params.id });

    if (!skill) {
        res.status(404).json({error: 'Skill not found'});
        return;
    }

    res.json(skill);
}

/**
 * Creates a new skill.
 */
export async function CreateSkill(req: ValidatedBodyT<CreateSkillRequest>, res: Response) {
    await skillService.createSkill(req.body);
    res.status(201).json({message: 'Skill created successfully'});
}

/**
 * Updates an existing skill.
 */
export async function UpdateSkill(req: ValidatedParamsBodyT<SkillIdParamRequest, UpdateSkillRequest>, res: Response) {
    await skillService.updateSkill({ id: req.params.id }, req.body);
    res.status(200).json({ message: 'Skill updated successfully' });
}

/**
 * Deletes a skill.
 */
export async function DeleteSkill(req: ValidatedParamsT<SkillIdParamRequest>, res: Response) {
    await skillService.deleteSkill({ id: req.params.id });
    res.status(200).json({message: 'Skill deleted successfully'});
}
import { Response, NextFunction } from 'express';

import {
    ValidatedNoInput,
    ValidatedParamsT,
    ValidatedBodyT,
    ValidatedParamsBodyT,
    ValidatedQueryT,
} from '@/util/validated-types';
import { CreateSkillRequest, SkillIdParamRequest, UpdateSkillRequest, UpdateResponse, CreateResponse, GetSkillResponse, GetAllSkillsResponse, SkillCacheResponse } from '@shared/schema';

import { skillService } from './skillService.js';
/**
 * Fetches all skills from the database with pagination and filtering.
 */
export async function GetAllSkills(req: ValidatedNoInput<GetAllSkillsResponse>, res: Response, _next: NextFunction) {
    const skills = await skillService.getAllSkills();
    res.json(skills);
}

/**
 * Fetches a single skill by ID.
 */
export async function GetSkillById(req: ValidatedParamsT<SkillIdParamRequest, GetSkillResponse>, res: Response, _next: NextFunction) {
    const skill = await skillService.getSkillById({ id: req.params.id });

    if (!skill) {
        res.status(404).json({ error: 'Skill not found' });
        return;
    }

    res.json(skill);
}

/**
 * Creates a new skill.
 */
export async function CreateSkill(req: ValidatedBodyT<CreateSkillRequest, CreateResponse>, res: Response, _next: NextFunction) {
    const result = await skillService.createSkill(req.body);
    res.status(201).json(result);
}

/**
 * Updates an existing skill.
 */
export async function UpdateSkill(req: ValidatedParamsBodyT<SkillIdParamRequest, UpdateSkillRequest, UpdateResponse>, res: Response, _next: NextFunction) {
    const result = await skillService.updateSkill({ id: req.params.id }, req.body);
    res.status(200).json(result);
}

/**
 * Deletes a skill.
 */
export async function DeleteSkill(req: ValidatedParamsT<SkillIdParamRequest, UpdateResponse>, res: Response, _next: NextFunction) {
    const result = await skillService.deleteSkill({ id: req.params.id });
    res.status(200).json(result);
}

/**
 * Fetches all skills for cache (lightweight data).
 */
export async function GetSkillCache(req: ValidatedNoInput<SkillCacheResponse>, res: Response, _next: NextFunction) {
    const skills = await skillService.getSkillCache();
    res.json(skills);
}

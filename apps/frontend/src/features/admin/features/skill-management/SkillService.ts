import { z } from 'zod';

import { typedApi } from '@/services/Api';
import {
    SkillQuerySchema,
    SkillIdParamSchema,
    CreateSkillSchema,
    UpdateSkillSchema,
    SkillQueryResponseSchema,
    SkillSchema,
    UpdateResponseSchema,
    CreateResponseSchema,
} from '@shared/schema';

/**
 * SkillService with path parameter support
 * 
 * Usage examples:
 * 
 * // Get skills with query parameters
 * const skills = await SkillService.getSkills({ page: 1, limit: 10 });
 * 
 * // Get skill by ID (path parameter)
 * const skill = await SkillService.getSkillById(undefined, { id: 123 });
 * 
 * // Create skill
 * const newSkill = await SkillService.createSkill({ name: "Acrobatics", abilityId: 1 });
 * 
 * // Update skill (path parameter + body)
 * const updatedSkill = await SkillService.updateSkill(
 *   { name: "Updated Acrobatics" }, 
 *   { id: 123 }
 * );
 * 
 * // Delete skill (path parameter)
 * await SkillService.deleteSkill(undefined, { id: 123 });
 */
export const SkillService = {
    // Get skills with query parameters
    getSkills: typedApi<typeof SkillQuerySchema, typeof SkillQueryResponseSchema>({
        path: '/skills',
        method: 'GET',
        requestSchema: SkillQuerySchema,
        responseSchema: SkillQueryResponseSchema,
    }),

    // Get skill by ID with path parameter
    getSkillById: typedApi<undefined, typeof SkillSchema, typeof SkillIdParamSchema>({
        path: '/skills/:id',
        method: 'GET',
        paramsSchema: SkillIdParamSchema,
        responseSchema: SkillSchema,
    }),

    // Create skill
    createSkill: typedApi<typeof CreateSkillSchema, typeof CreateResponseSchema>({
        path: '/skills',
        method: 'POST',
        requestSchema: CreateSkillSchema,
        responseSchema: CreateResponseSchema,
    }),

    // Update skill with path parameter
    updateSkill: typedApi<typeof UpdateSkillSchema, typeof UpdateResponseSchema, typeof SkillIdParamSchema>({
        path: '/skills/:id',
        method: 'PUT',
        requestSchema: UpdateSkillSchema,
        paramsSchema: SkillIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    // Delete skill with path parameter
    deleteSkill: typedApi<undefined, typeof UpdateResponseSchema, typeof SkillIdParamSchema>({
        path: '/skills/:id',
        method: 'DELETE',
        paramsSchema: SkillIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),
}; 
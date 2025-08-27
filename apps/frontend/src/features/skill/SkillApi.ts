import { typedApi } from '@/services/Api';
import {
    SkillIdParamSchema,
    CreateSkillSchema,
    UpdateSkillSchema,
    SkillSchema,
    UpdateResponseSchema,
    CreateResponseSchema,
    GetAllSkillsResponseSchema,
} from '@shared/schema';

/**
 * SkillService with path parameter support
 * 
 * Usage examples:
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
export const SkillApi = {
    getSkills: typedApi({
        path: '/skills',
        method: 'GET',
        responseSchema: GetAllSkillsResponseSchema,
    }),

    getSkillById: typedApi<undefined, typeof SkillSchema, typeof SkillIdParamSchema>({
        path: '/skills/:id',
        method: 'GET',
        paramsSchema: SkillIdParamSchema,
        responseSchema: SkillSchema,
    }),

    createSkill: typedApi<typeof CreateSkillSchema, typeof CreateResponseSchema>({
        path: '/skills',
        method: 'POST',
        requestSchema: CreateSkillSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateSkill: typedApi<typeof UpdateSkillSchema, typeof UpdateResponseSchema, typeof SkillIdParamSchema>({
        path: '/skills/:id',
        method: 'PUT',
        requestSchema: UpdateSkillSchema,
        paramsSchema: SkillIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    deleteSkill: typedApi<undefined, typeof UpdateResponseSchema, typeof SkillIdParamSchema>({
        path: '/skills/:id',
        method: 'DELETE',
        paramsSchema: SkillIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),
}; 

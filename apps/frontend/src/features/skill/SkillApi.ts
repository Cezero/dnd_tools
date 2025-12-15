import { typedApi } from '@/services/Api';
import {
    GetAllSkillsResponseSchema,
} from '@shared/schema';

/**
 * SkillApi for fetching skill data
 * 
 * Usage examples:
 *
 * // Get all skills
 * const skills = await SkillApi.getSkills();
 */
export const SkillApi = {
    getSkills: typedApi({
        path: '/skills',
        method: 'GET',
        responseSchema: GetAllSkillsResponseSchema,
    }),
};


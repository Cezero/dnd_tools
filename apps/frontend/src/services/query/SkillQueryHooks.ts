import {
    SkillIdParamSchema,
    CreateSkillSchema,
    UpdateSkillSchema,
    SkillSchema,
    UpdateResponseSchema,
    CreateResponseSchema,
    GetAllSkillsResponseSchema,
} from '@shared/schema';

import { createQueryHooks } from './QueryHooksFactory';

export const SkillQueryHooks = {
    // Get all skills
    useGetSkills: createQueryHooks({
        path: '/skills',
        method: 'GET',
        responseSchema: GetAllSkillsResponseSchema,
        queryKey: 'skills',
        queryKeyBuilder: (params) => ['skills', 'list', params as string | number | object],
    }).useQuery,

    // Get skill by ID
    useGetSkillById: createQueryHooks({
        path: '/skills/:id',
        method: 'GET',
        paramsSchema: SkillIdParamSchema,
        responseSchema: SkillSchema,
        queryKey: 'skills',
        queryKeyBuilder: (params) => {
            const typedParams = params as { pathParams?: { id?: number } } | undefined;
            return ['skills', 'item', typedParams?.pathParams?.id];
        },
    }).useQuery,

    // Create skill mutation
    useCreateSkill: createQueryHooks({
        path: '/skills',
        method: 'POST',
        requestSchema: CreateSkillSchema,
        responseSchema: CreateResponseSchema,
        queryKey: 'skills',
    }).useMutation,

    // Update skill mutation
    useUpdateSkill: createQueryHooks({
        path: '/skills/:id',
        method: 'PUT',
        requestSchema: UpdateSkillSchema,
        paramsSchema: SkillIdParamSchema,
        responseSchema: UpdateResponseSchema,
        queryKey: 'skills',
    }).useMutation,

    // Delete skill mutation
    useDeleteSkill: createQueryHooks({
        path: '/skills/:id',
        method: 'DELETE',
        paramsSchema: SkillIdParamSchema,
        responseSchema: UpdateResponseSchema,
        queryKey: 'skills',
    }).useMutation,
};

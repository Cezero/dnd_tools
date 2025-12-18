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

// Create query hook configurations
const skillsConfig = createQueryHooks({
    path: '/skills',
    method: 'GET',
    responseSchema: GetAllSkillsResponseSchema,
    queryKey: 'skills',
    queryKeyBuilder: (params) => ['skills', 'list', params as string | number | object],
});

const skillByIdConfig = createQueryHooks({
    path: '/skills/:id',
    method: 'GET',
    paramsSchema: SkillIdParamSchema,
    responseSchema: SkillSchema,
    queryKey: 'skills',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number } } | undefined;
        return ['skills', 'item', typedParams?.pathParams?.id];
    },
});

const createSkillConfig = createQueryHooks({
    path: '/skills',
    method: 'POST',
    requestSchema: CreateSkillSchema,
    responseSchema: CreateResponseSchema,
    queryKey: 'skills',
});

const updateSkillConfig = createQueryHooks({
    path: '/skills/:id',
    method: 'PUT',
    requestSchema: UpdateSkillSchema,
    paramsSchema: SkillIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'skills',
});

const deleteSkillConfig = createQueryHooks({
    path: '/skills/:id',
    method: 'DELETE',
    paramsSchema: SkillIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'skills',
});

export const SkillQueryHooks = {
    // Keep existing hooks for backward compatibility during transition
    useGetSkills: skillsConfig.useQuery,
    useGetSkillById: skillByIdConfig.useQuery,
    useCreateSkill: createSkillConfig.useMutation,
    useUpdateSkill: updateSkillConfig.useMutation,
    useDeleteSkill: deleteSkillConfig.useMutation,

    // Add imperative methods
    getSkills: (params?: unknown) => skillsConfig.fetch(params),
    getSkillById: (skillId: number) => skillByIdConfig.fetch({ pathParams: { id: skillId } }),
    createSkill: (data: unknown) => createSkillConfig.mutate({ requestData: data }),
    updateSkill: (skillId: number, data: unknown) => updateSkillConfig.mutate({
        requestData: data,
        pathParams: { id: skillId }
    }),
    deleteSkill: (skillId: number) => deleteSkillConfig.mutate({
        pathParams: { id: skillId }
    }),

    // Expose query functions for advanced usage
    getSkillsQueryFn: skillsConfig.queryFn,
    getSkillByIdQueryFn: skillByIdConfig.queryFn,
    getSkillsQueryKey: (params?: unknown) => skillsConfig.queryKeyBuilder(params),
    getSkillByIdQueryKey: (skillId: number) => skillByIdConfig.queryKeyBuilder({ pathParams: { id: skillId } }),
};

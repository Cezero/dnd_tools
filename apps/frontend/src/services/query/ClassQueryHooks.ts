import {
    ClassIdParamSchema,
    ClassIdQuerySchema,
    CreateClassSchema,
    UpdateClassSchema,
    BaseClassSchema,
    CreateResponseSchema,
    UpdateResponseSchema,
    GetAllClassesResponseSchema,
    GetAllClassesQuerySchema,
} from '@shared/schema';

import { createQueryHooks } from './QueryHooksFactory';

// Create query hook configurations
const classesConfig = createQueryHooks({
    path: '/classes/query',
    method: 'POST',
    requestSchema: GetAllClassesQuerySchema,
    responseSchema: GetAllClassesResponseSchema,
    queryKey: 'classes',
    queryKeyBuilder: (params) => ['classes', 'list', params as string | number | object],
});

const classByIdConfig = createQueryHooks({
    path: '/classes/:id',
    method: 'GET',
    paramsSchema: ClassIdParamSchema,
    responseSchema: BaseClassSchema,
    queryKey: 'classes',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number } } | undefined;
        return ['classes', 'item', typedParams?.pathParams?.id];
    },
});

const createClassConfig = createQueryHooks({
    path: '/classes',
    method: 'POST',
    requestSchema: CreateClassSchema,
    responseSchema: CreateResponseSchema,
    queryKey: 'classes',
});

const updateClassConfig = createQueryHooks({
    path: '/classes/:id',
    method: 'PUT',
    requestSchema: UpdateClassSchema,
    paramsSchema: ClassIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'classes',
});

const deleteClassConfig = createQueryHooks({
    path: '/classes/:id',
    method: 'DELETE',
    paramsSchema: ClassIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'classes',
});

export const ClassQueryHooks = {
    // Keep existing hooks for backward compatibility during transition
    useGetClasses: classesConfig.useQuery,
    useGetClassById: classByIdConfig.useQuery,
    useCreateClass: createClassConfig.useMutation,
    useUpdateClass: updateClassConfig.useMutation,
    useDeleteClass: deleteClassConfig.useMutation,

    // Add imperative methods
    getClasses: (data: unknown) => classesConfig.fetch({ requestData: data }),
    getClassById: (classId: number, characterFeatureChoices?: Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>) => {
        const queryParams: { characterFeatureChoices?: string } = {};
        if (characterFeatureChoices && characterFeatureChoices.length > 0) {
            queryParams.characterFeatureChoices = JSON.stringify(characterFeatureChoices);
        }
        return classByIdConfig.fetch({
            pathParams: { id: classId },
            requestData: Object.keys(queryParams).length > 0 ? queryParams : undefined
        });
    },
    createClass: (data: unknown) => createClassConfig.mutate({ requestData: data }),
    updateClass: (classId: number, data: unknown) => updateClassConfig.mutate({
        requestData: data,
        pathParams: { id: classId }
    }),
    deleteClass: (classId: number) => deleteClassConfig.mutate({
        pathParams: { id: classId }
    }),

    // Expose query functions for advanced usage
    getClassesQueryFn: classesConfig.queryFn,
    getClassByIdQueryFn: (params: { pathParams: { id: number }; queryParams?: { characterFeatureChoices?: Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }> } }) => {
        const queryData: { characterFeatureChoices?: string } = {};
        if (params.queryParams?.characterFeatureChoices && params.queryParams.characterFeatureChoices.length > 0) {
            queryData.characterFeatureChoices = JSON.stringify(params.queryParams.characterFeatureChoices);
        }
        return classByIdConfig.queryFn({
            pathParams: params.pathParams,
            requestData: Object.keys(queryData).length > 0 ? queryData : undefined
        });
    },
    getClassesQueryKey: (params?: unknown) => classesConfig.queryKeyBuilder(params),
    getClassByIdQueryKey: (classId: number) => classByIdConfig.queryKeyBuilder({ pathParams: { id: classId } }),
};

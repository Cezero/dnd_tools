import { typedApi } from '@/services/Api';
import {
    BaseClassSchema,
    CreateClassSchema,
    CreateResponseSchema,
    DraftLockStatusSchema,
    GetFeaturesResponseSchema,
    GetAllClassesQuerySchema,
    GetAllClassesResponseSchema,
    IdParamSchema,
    UpdateClassSchema,
    UpdateResponseSchema,
} from '@shared/schema';

export const ClassApi = {
    getClasses: typedApi<typeof GetAllClassesQuerySchema, typeof GetAllClassesResponseSchema>({
        path: '/classes/query',
        method: 'POST',
        requestSchema: GetAllClassesQuerySchema,
        responseSchema: GetAllClassesResponseSchema,
    }),

    getClassById: typedApi<undefined, typeof BaseClassSchema, typeof IdParamSchema>({
        path: '/classes/:id',
        method: 'GET',
        paramsSchema: IdParamSchema,
        responseSchema: BaseClassSchema,
    }),

    getClassFeatures: typedApi<undefined, typeof GetFeaturesResponseSchema, typeof IdParamSchema>({
        path: '/classes/:id/features',
        method: 'GET',
        paramsSchema: IdParamSchema,
        responseSchema: GetFeaturesResponseSchema,
    }),

    createClass: typedApi<typeof CreateClassSchema, typeof CreateResponseSchema>({
        path: '/classes',
        method: 'POST',
        requestSchema: CreateClassSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateClass: typedApi<typeof UpdateClassSchema, typeof UpdateResponseSchema, typeof IdParamSchema>({
        path: '/classes/:id',
        method: 'PUT',
        requestSchema: UpdateClassSchema,
        paramsSchema: IdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    deleteClass: typedApi<undefined, typeof UpdateResponseSchema, typeof IdParamSchema>({
        path: '/classes/:id',
        method: 'DELETE',
        paramsSchema: IdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    getClassLockStatus: typedApi<undefined, typeof DraftLockStatusSchema, typeof IdParamSchema>({
        path: '/classes/:id/lock-status',
        method: 'GET',
        paramsSchema: IdParamSchema,
        responseSchema: DraftLockStatusSchema,
    }),
};

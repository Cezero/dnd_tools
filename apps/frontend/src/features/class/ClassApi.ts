import { typedApi } from '@/services/Api';
import {
    ClassIdParamSchema,
    CreateClassSchema,
    UpdateClassSchema,
    BaseClassSchema,
    CreateResponseSchema,
    UpdateResponseSchema,
    GetAllClassesResponseSchema,
    GetAllClassesQuerySchema,
    EntityLockStatusSchema,
} from '@shared/schema';

export const ClassApi = {
    getClasses: typedApi<typeof GetAllClassesQuerySchema, typeof GetAllClassesResponseSchema>({
        path: '/classes/query',
        method: 'POST',
        requestSchema: GetAllClassesQuerySchema,
        responseSchema: GetAllClassesResponseSchema,
    }),

    getClassById: typedApi<undefined, typeof BaseClassSchema, typeof ClassIdParamSchema>({
        path: '/classes/:id',
        method: 'GET',
        paramsSchema: ClassIdParamSchema,
        responseSchema: BaseClassSchema,
    }),

    createClass: typedApi<typeof CreateClassSchema, typeof CreateResponseSchema>({
        path: '/classes',
        method: 'POST',
        requestSchema: CreateClassSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateClass: typedApi<typeof UpdateClassSchema, typeof UpdateResponseSchema, typeof ClassIdParamSchema>({
        path: '/classes/:id',
        method: 'PUT',
        requestSchema: UpdateClassSchema,
        paramsSchema: ClassIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    deleteClass: typedApi<undefined, typeof UpdateResponseSchema, typeof ClassIdParamSchema>({
        path: '/classes/:id',
        method: 'DELETE',
        paramsSchema: ClassIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    getClassLockStatus: typedApi<undefined, typeof EntityLockStatusSchema, typeof ClassIdParamSchema>({
        path: '/classes/:id/lock-status',
        method: 'GET',
        paramsSchema: ClassIdParamSchema,
        responseSchema: EntityLockStatusSchema,
    }),
};

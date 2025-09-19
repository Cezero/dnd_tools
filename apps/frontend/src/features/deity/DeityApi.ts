import { typedApi } from '@/services/Api';
import {
    DeityIdParamSchema,
    BaseDeitySchema,
    UpdateDeitySchema,
    UpdateResponseSchema,
    CreateResponseSchema,
    GetAllDeitiesResponseSchema,
    DeitySchema,
} from '@shared/schema';

export const DeityApi = {
    getDeities: typedApi({
        path: '/deities',
        method: 'GET',
        responseSchema: GetAllDeitiesResponseSchema,
    }),

    getDeityById: typedApi<undefined, typeof DeitySchema, typeof DeityIdParamSchema>({
        path: '/deities/:id',
        method: 'GET',
        paramsSchema: DeityIdParamSchema,
        responseSchema: DeitySchema,
    }),

    createDeity: typedApi<typeof BaseDeitySchema, typeof CreateResponseSchema>({
        path: '/deities',
        method: 'POST',
        requestSchema: BaseDeitySchema,
        responseSchema: CreateResponseSchema,
    }),

    updateDeity: typedApi<typeof UpdateDeitySchema, typeof UpdateResponseSchema, typeof DeityIdParamSchema>({
        path: '/deities/:id',
        method: 'PUT',
        requestSchema: UpdateDeitySchema,
        responseSchema: UpdateResponseSchema,
        paramsSchema: DeityIdParamSchema,
    }),

    deleteDeity: typedApi<undefined, typeof UpdateResponseSchema, typeof DeityIdParamSchema>({
        path: '/deities/:id',
        method: 'DELETE',
        paramsSchema: DeityIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),
};

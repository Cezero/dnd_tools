import {
    DeityIdParamSchema,
    BaseDeitySchema,
    UpdateDeitySchema,
    UpdateResponseSchema,
    CreateResponseSchema,
    GetAllDeitiesResponseSchema,
    DeitySchema,
} from '@shared/schema';

import { createQueryHooks } from './QueryHooksFactory';

export const DeityQueryHooks = {
    // Get all deities
    useGetDeities: createQueryHooks({
        path: '/deities',
        method: 'GET',
        responseSchema: GetAllDeitiesResponseSchema,
        queryKey: 'deities',
        queryKeyBuilder: (params) => ['deities', 'list', params as string | number | object],
    }).useQuery,

    // Get deity by ID
    useGetDeityById: createQueryHooks({
        path: '/deities/:id',
        method: 'GET',
        paramsSchema: DeityIdParamSchema,
        responseSchema: DeitySchema,
        queryKey: 'deities',
        queryKeyBuilder: (params) => {
            const typedParams = params as { pathParams?: { id?: number } } | undefined;
            return ['deities', 'item', typedParams?.pathParams?.id];
        },
    }).useQuery,

    // Create deity mutation
    useCreateDeity: createQueryHooks({
        path: '/deities',
        method: 'POST',
        requestSchema: BaseDeitySchema,
        responseSchema: CreateResponseSchema,
        queryKey: 'deities',
    }).useMutation,

    // Update deity mutation
    useUpdateDeity: createQueryHooks({
        path: '/deities/:id',
        method: 'PUT',
        requestSchema: UpdateDeitySchema,
        paramsSchema: DeityIdParamSchema,
        responseSchema: UpdateResponseSchema,
        queryKey: 'deities',
    }).useMutation,

    // Delete deity mutation
    useDeleteDeity: createQueryHooks({
        path: '/deities/:id',
        method: 'DELETE',
        paramsSchema: DeityIdParamSchema,
        responseSchema: UpdateResponseSchema,
        queryKey: 'deities',
    }).useMutation,
};

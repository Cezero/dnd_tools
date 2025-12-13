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

// Create query hook configurations
const deitiesConfig = createQueryHooks({
    path: '/deities',
    method: 'GET',
    responseSchema: GetAllDeitiesResponseSchema,
    queryKey: 'deities',
    queryKeyBuilder: (params) => ['deities', 'list', params as string | number | object],
});

const deityByIdConfig = createQueryHooks({
    path: '/deities/:id',
    method: 'GET',
    paramsSchema: DeityIdParamSchema,
    responseSchema: DeitySchema,
    queryKey: 'deities',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number } } | undefined;
        return ['deities', 'item', typedParams?.pathParams?.id];
    },
});

const createDeityConfig = createQueryHooks({
    path: '/deities',
    method: 'POST',
    requestSchema: BaseDeitySchema,
    responseSchema: CreateResponseSchema,
    queryKey: 'deities',
});

const updateDeityConfig = createQueryHooks({
    path: '/deities/:id',
    method: 'PUT',
    requestSchema: UpdateDeitySchema,
    paramsSchema: DeityIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'deities',
});

const deleteDeityConfig = createQueryHooks({
    path: '/deities/:id',
    method: 'DELETE',
    paramsSchema: DeityIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'deities',
});

export const DeityQueryHooks = {
    // React hooks
    useGetDeities: deitiesConfig.useQuery,
    useGetDeityById: deityByIdConfig.useQuery,
    useCreateDeity: createDeityConfig.useMutation,
    useUpdateDeity: updateDeityConfig.useMutation,
    useDeleteDeity: deleteDeityConfig.useMutation,

    // Imperative methods
    getDeities: (params?: unknown) => deitiesConfig.fetch(params),
    getDeityById: (deityId: number) => deityByIdConfig.fetch({ pathParams: { id: deityId } }),
    createDeity: (data: unknown) => createDeityConfig.mutate({ requestData: data }),
    updateDeity: (deityId: number, data: unknown) => updateDeityConfig.mutate({
        requestData: data,
        pathParams: { id: deityId }
    }),
    deleteDeity: (deityId: number) => deleteDeityConfig.mutate({
        pathParams: { id: deityId }
    }),

    // Expose query functions for advanced usage
    getDeitiesQueryFn: deitiesConfig.queryFn,
    getDeityByIdQueryFn: deityByIdConfig.queryFn,
    getDeitiesQueryKey: (params?: unknown) => deitiesConfig.queryKeyBuilder(params),
    getDeityByIdQueryKey: (deityId: number) => deityByIdConfig.queryKeyBuilder({ pathParams: { id: deityId } }),
};

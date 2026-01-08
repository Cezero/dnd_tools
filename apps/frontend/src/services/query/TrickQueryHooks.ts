import {
    TrickIdParamSchema,
    UpdateTrickSchema,
    UpdateResponseSchema,
    CreateResponseSchema,
    GetAllTricksResponseSchema,
    TrickSchema,
    CreateTrickSchema,
} from '@shared/schema';

import { createQueryHooks } from './QueryHooksFactory';

// Create query hook configurations
const tricksConfig = createQueryHooks({
    path: '/tricks',
    method: 'GET',
    responseSchema: GetAllTricksResponseSchema,
    queryKey: 'tricks',
    queryKeyBuilder: (params) => ['tricks', 'list', params as string | number | object],
});

const trickByIdConfig = createQueryHooks({
    path: '/tricks/:id',
    method: 'GET',
    paramsSchema: TrickIdParamSchema,
    responseSchema: TrickSchema,
    queryKey: 'tricks',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number } } | undefined;
        return ['tricks', 'item', typedParams?.pathParams?.id];
    },
});

const createTrickConfig = createQueryHooks({
    path: '/tricks',
    method: 'POST',
    requestSchema: CreateTrickSchema,
    responseSchema: CreateResponseSchema,
    queryKey: 'tricks',
});

const updateTrickConfig = createQueryHooks({
    path: '/tricks/:id',
    method: 'PUT',
    requestSchema: UpdateTrickSchema,
    paramsSchema: TrickIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'tricks',
});

const deleteTrickConfig = createQueryHooks({
    path: '/tricks/:id',
    method: 'DELETE',
    paramsSchema: TrickIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'tricks',
});

export const TrickQueryHooks = {
    useGetTricks: tricksConfig.useQuery,
    useGetTrickById: trickByIdConfig.useQuery,
    useCreateTrick: createTrickConfig.useMutation,
    useUpdateTrick: updateTrickConfig.useMutation,
    useDeleteTrick: deleteTrickConfig.useMutation,

    // Add imperative methods
    getTricks: (params?: unknown) => tricksConfig.fetch(params),
    getTrickById: (trickId: number) => trickByIdConfig.fetch({ pathParams: { id: trickId } }),
    createTrick: (data: unknown) => createTrickConfig.mutate({ requestData: data }),
    updateTrick: (trickId: number, data: unknown) => updateTrickConfig.mutate({
        requestData: data,
        pathParams: { id: trickId }
    }),
    deleteTrick: (trickId: number) => deleteTrickConfig.mutate({
        pathParams: { id: trickId }
    }),

    // Expose query functions for advanced usage
    getTricksQueryFn: tricksConfig.queryFn,
    getTrickByIdQueryFn: trickByIdConfig.queryFn,
    getTricksQueryKey: (params?: unknown) => tricksConfig.queryKeyBuilder(params),
    getTrickByIdQueryKey: (trickId: number) => trickByIdConfig.queryKeyBuilder({ pathParams: { id: trickId } }),
};


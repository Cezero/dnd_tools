import {
    FeatIdParamSchema,
    BaseFeatSchema,
    UpdateFeatSchema,
    UpdateResponseSchema,
    CreateResponseSchema,
    GetAllFeatsResponseSchema,
    FeatQuerySchema,
    FeatQueryResponseSchema,
    GetFeatListResponseSchema,
    FeatSchema,
} from '@shared/schema';

import { createQueryHooks } from './QueryHooksFactory';

// Create query hook configurations
const featsConfig = createQueryHooks({
    path: '/feats',
    method: 'GET',
    responseSchema: GetAllFeatsResponseSchema,
    queryKey: 'feats',
    queryKeyBuilder: (params) => ['feats', 'list', params as string | number | object],
});

const featByIdConfig = createQueryHooks({
    path: '/feats/:id',
    method: 'GET',
    paramsSchema: FeatIdParamSchema,
    responseSchema: FeatSchema,
    queryKey: 'feats',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number } } | undefined;
        return ['feats', 'item', typedParams?.pathParams?.id];
    },
});

const createFeatConfig = createQueryHooks({
    path: '/feats',
    method: 'POST',
    requestSchema: BaseFeatSchema,
    responseSchema: CreateResponseSchema,
    queryKey: 'feats',
});

const updateFeatConfig = createQueryHooks({
    path: '/feats/:id',
    method: 'PUT',
    requestSchema: UpdateFeatSchema,
    paramsSchema: FeatIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'feats',
});

const deleteFeatConfig = createQueryHooks({
    path: '/feats/:id',
    method: 'DELETE',
    paramsSchema: FeatIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'feats',
});

const featQueryConfig = createQueryHooks({
    path: '/feats/query',
    method: 'GET',
    requestSchema: FeatQuerySchema,
    responseSchema: FeatQueryResponseSchema,
    queryKey: 'feats',
    queryKeyBuilder: (params) => ['feats', 'query', params as string | number | object],
});

const featListConfig = createQueryHooks({
    path: '/feats/list',
    method: 'GET',
    requestSchema: FeatQuerySchema,
    responseSchema: GetFeatListResponseSchema,
    queryKey: 'feats',
    queryKeyBuilder: (params) => ['feats', 'list', params as string | number | object],
});

const getAllFeatsFullConfig = createQueryHooks({
    path: '/feats/full',
    method: 'GET',
    responseSchema: FeatQueryResponseSchema,
    queryKey: 'feats',
    queryKeyBuilder: () => ['feats', 'full'],
});

export const FeatQueryHooks = {
    // Keep existing hooks for backward compatibility during transition
    useGetFeats: featsConfig.useQuery,
    useGetFeatById: featByIdConfig.useQuery,
    useCreateFeat: createFeatConfig.useMutation,
    useUpdateFeat: updateFeatConfig.useMutation,
    useDeleteFeat: deleteFeatConfig.useMutation,
    useFeatQuery: featQueryConfig.useQuery,
    useGetFeatList: featListConfig.useQuery,
    useGetAllFeatsFull: getAllFeatsFullConfig.useQuery,

    // Add imperative methods
    getFeats: (params?: unknown) => featsConfig.fetch(params),
    getFeatById: (featId: number) => featByIdConfig.fetch({ pathParams: { id: featId } }),
    createFeat: (data: unknown) => createFeatConfig.mutate({ requestData: data }),
    updateFeat: (featId: number, data: unknown) => updateFeatConfig.mutate({
        requestData: data,
        pathParams: { id: featId }
    }),
    deleteFeat: (featId: number) => deleteFeatConfig.mutate({
        pathParams: { id: featId }
    }),
    featQuery: (data: unknown) => featQueryConfig.fetch({ requestData: data }),
    getFeatList: (data: unknown) => featListConfig.fetch({ requestData: data }),
    getAllFeatsFull: (params?: unknown, options?: { staleTime?: number; cacheTime?: number }, queryClient?: any) => 
        getAllFeatsFullConfig.fetch(params, options, queryClient),

    // Expose query functions for advanced usage
    getFeatsQueryFn: featsConfig.queryFn,
    getFeatByIdQueryFn: featByIdConfig.queryFn,
    featQueryQueryFn: featQueryConfig.queryFn,
    getFeatListQueryFn: featListConfig.queryFn,
    getAllFeatsFullQueryFn: getAllFeatsFullConfig.queryFn,
    getFeatsQueryKey: (params?: unknown) => featsConfig.queryKeyBuilder(params),
    getFeatByIdQueryKey: (featId: number) => featByIdConfig.queryKeyBuilder({ pathParams: { id: featId } }),
    featQueryQueryKey: (params?: unknown) => featQueryConfig.queryKeyBuilder(params),
    getFeatListQueryKey: (params?: unknown) => featListConfig.queryKeyBuilder(params),
    getAllFeatsFullQueryKey: () => getAllFeatsFullConfig.queryKeyBuilder(),
};

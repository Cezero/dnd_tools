import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { QueryFunctionContext, QueryClient } from '@tanstack/react-query';

import {
    FeatIdParamSchema,
    BaseFeatSchema,
    CreateFeatWithProgressionsSchema,
    UpdateFeatSchema,
    UpdateResponseSchema,
    CreateResponseSchema,
    GetAllFeatsResponseSchema,
    FeatQuerySchema,
    FeatQueryResponseSchema,
    GetFeatListResponseSchema,
    FeatSchema,
    GetAllFeatsWithFeatureInfoResponseSchema,
    type Feat,
    type FeatQueryResponse,
    type GetAllFeatsWithFeatureInfoResponse,
} from '@shared/schema';

import { createQueryHooks } from './QueryHooksFactory';

// Create query hook configurations
// Use the endpoint that includes feature description and summary for list views
const featsConfig = createQueryHooks({
    path: '/feats/with-feature-info',
    method: 'GET',
    responseSchema: GetAllFeatsWithFeatureInfoResponseSchema,
    queryKey: 'feats',
    queryKeyBuilder: (params) => ['feats', 'list', params as string | number | object],
});

// Create base config for featById
const featByIdBaseConfig = createQueryHooks({
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

// Create a custom queryFn that checks the 'feats', 'full' cache first
// This works for both TanStack Query context and direct calls
const createFeatByIdQueryFn = (originalQueryFn: (params?: unknown) => Promise<Feat | null>) => {
    return async (contextOrParams: QueryFunctionContext | { pathParams?: { id?: number } } | undefined): Promise<Feat | null> => {
        // Check if this is a QueryFunctionContext from TanStack Query
        if (contextOrParams && 'queryKey' in contextOrParams) {
            const context = contextOrParams as QueryFunctionContext;
            const queryKey = context.queryKey as (string | number)[];
            const featId = queryKey[2] as number | undefined;

            // Check if 'feats', 'full' exists in cache
            if (context.client && featId !== undefined) {
                const fullFeatsData = context.client.getQueryData<FeatQueryResponse>(['feats', 'full']);
                if (fullFeatsData?.results) {
                    const feat = fullFeatsData.results.find(f => f.id === featId);
                    if (feat) {
                        return feat;
                    }
                }
            }

            // Fall back to API call - ensure params are in correct format
            const typedParams = { pathParams: { id: featId } };
            return originalQueryFn(typedParams);
        } else {
            // This is a direct call (not from TanStack Query context)
            // For direct calls, pass params as-is
            return originalQueryFn(contextOrParams);
        }
    };
};

// Override the queryFn to use our cache-checking version
const featByIdQueryFn = createFeatByIdQueryFn(featByIdBaseConfig.queryFn);

// Create a custom useQuery hook that uses the cache-checking queryFn
const useGetFeatByIdWithCache = (params?: unknown, options?: unknown) => {
    const typedParams = params as { pathParams?: { id?: number } } | undefined;
    const featId = typedParams?.pathParams?.id;
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: featByIdBaseConfig.queryKeyBuilder(params),
        queryFn: async () => {
            // Check cache first using the queryClient
            if (featId !== undefined && queryClient) {
                const fullFeatsData = queryClient.getQueryData<FeatQueryResponse>(['feats', 'full']);
                if (fullFeatsData?.results) {
                    const feat = fullFeatsData.results.find(f => f.id === featId);
                    if (feat) {
                        return feat;
                    }
                }
            }

            // Fall back to API call - pass params directly
            return featByIdQueryFn(params);
        },
        ...(options as Record<string, unknown>),
    });
};

// Override the fetch method to also check cache
const featByIdFetch = async (params?: unknown, options?: { staleTime?: number; gcTime?: number }, queryClient?: QueryClient) => {
    if (!queryClient) {
        // If no queryClient provided, just call the API directly
        return featByIdQueryFn(params);
    }

    const typedParams = params as { pathParams?: { id?: number } } | undefined;
    const featId = typedParams?.pathParams?.id;

    // Check cache first
    if (featId !== undefined) {
        const fullFeatsData = queryClient.getQueryData<FeatQueryResponse>(['feats', 'full']);
        if (fullFeatsData?.results) {
            const feat = fullFeatsData.results.find(f => f.id === featId);
            if (feat) {
                // Still cache it under the individual key for consistency
                queryClient.setQueryData(['feats', 'item', featId], feat);
                return feat;
            }
        }
    }

    // Fall back to normal fetch - use the base config's queryFn directly
    return queryClient.fetchQuery({
        queryKey: featByIdBaseConfig.queryKeyBuilder(params),
        queryFn: () => featByIdBaseConfig.queryFn(params),
        staleTime: options?.staleTime || 5 * 60 * 1000,
        gcTime: options?.gcTime || 10 * 60 * 1000,
    });
};

const featByIdConfig = {
    ...featByIdBaseConfig,
    queryFn: featByIdQueryFn,
    useQuery: useGetFeatByIdWithCache,
    fetch: featByIdFetch,
};

const createFeatConfig = createQueryHooks({
    path: '/feats',
    method: 'POST',
    requestSchema: CreateFeatWithProgressionsSchema,
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
    getAllFeatsFull: (params?: unknown, options?: { staleTime?: number; gcTime?: number }, queryClient?: QueryClient) =>
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

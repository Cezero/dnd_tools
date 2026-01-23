import { createQueryHooks } from '@/services/query/QueryHooksFactory';
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
    FeatSchema,
    GetAllFeatsWithFeatureInfoResponseSchema,
    type Feat,
    type GetAllFeatsWithFeatureInfoResponse,
} from '@shared/schema';


/**
 * Feat Query Hooks
 * 
 * Provides query hooks and imperative methods for feat-related API endpoints.
 * Includes list queries with composite data (feats with feature info) and individual feat queries.
 */

// List query configuration - returns feats with feature descriptions and summaries
// Query key: ['feats', 'list'] (no parameters - simplified to avoid duplicate cache entries)
const featsConfig = createQueryHooks({
    path: '/feats/with-feature-info',
    method: 'GET',
    responseSchema: GetAllFeatsWithFeatureInfoResponseSchema,
    queryKey: 'feats',
    queryKeyBuilder: () => ['feats', 'list'], // No parameters - endpoint doesn't accept query params
});

// Individual feat query configuration - returns single feat by ID
// Query key: ['feats', 'item', id] - includes ID in key for unique cache entries
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

const featByIdConfig = featByIdBaseConfig;

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

// Feat query configuration - parameterized query endpoint
// Query key: ['feats', 'query'] (no parameters in key - backend ignores query params anyway)
// Note: This endpoint accepts query parameters but the backend service ignores them,
// so the query key doesn't include parameters to avoid duplicate cache entries
const featQueryConfig = createQueryHooks({
    path: '/feats/query',
    method: 'GET',
    requestSchema: FeatQuerySchema,
    responseSchema: FeatQueryResponseSchema,
    queryKey: 'feats',
    queryKeyBuilder: () => ['feats', 'query'], // No parameters - backend ignores them
});

/**
 * Feat Query Hooks Export
 * 
 * Provides React hooks and imperative methods for feat-related operations.
 * 
 * **React Hooks**: Use in React components (useGetFeats, useGetFeatById, etc.)
 * **Imperative Methods**: Use in event handlers or async functions (getFeats, getFeatById, etc.)
 * **Query Functions**: Advanced usage for custom query logic (getFeatsQueryFn, etc.)
 */
export const FeatQueryHooks = {
    // React hooks for use in components
    useGetFeats: featsConfig.useQuery,
    useGetFeatById: featByIdConfig.useQuery,
    useCreateFeat: createFeatConfig.useMutation,
    useUpdateFeat: updateFeatConfig.useMutation,
    useDeleteFeat: deleteFeatConfig.useMutation,
    useFeatQuery: featQueryConfig.useQuery,

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
    featQuery: () => featQueryConfig.fetch(),

    // Expose query functions for advanced usage
    getFeatsQueryFn: featsConfig.queryFn,
    getFeatByIdQueryFn: featByIdConfig.queryFn,
    featQueryQueryFn: featQueryConfig.queryFn,
    getFeatsQueryKey: (params?: unknown) => featsConfig.queryKeyBuilder(),
    getFeatByIdQueryKey: (featId: number) => featByIdConfig.queryKeyBuilder({ pathParams: { id: featId } }),
    featQueryQueryKey: () => featQueryConfig.queryKeyBuilder(),
};

import {
    FeatureQuerySchema,
    GetAllFeaturesResponseSchema,
    FeatureIdParamSchema,
    EditionIdParamSchema,
    GetFeatureResponseSchema,
    CreateFeatureSchema,
    UpdateFeatureSchema,
    CreateResponseSchema,
    UpdateResponseSchema,
    CreateFeatureProgressionSchema,
    UpdateFeatureProgressionsRequestSchema,
    GetFeatureProgressionsResponseSchema,
    GetFeatureListResponseSchema,
} from '@shared/schema';

import { createQueryHooks } from './QueryHooksFactory';

export const FeatureQueryHooks = {
    // Get all features with query
    useGetFeatures: createQueryHooks({
        path: '/features/query',
        method: 'POST',
        requestSchema: FeatureQuerySchema,
        responseSchema: GetAllFeaturesResponseSchema,
        queryKey: 'features',
        queryKeyBuilder: (params) => ['features', 'list', params as string | number | object],
    }).useQuery,

    // Get feature by ID
    useGetFeatureById: createQueryHooks({
        path: '/features/:id',
        method: 'GET',
        paramsSchema: FeatureIdParamSchema,
        responseSchema: GetFeatureResponseSchema,
        queryKey: 'features',
        queryKeyBuilder: (params) => {
            const typedParams = params as { pathParams?: { id?: number } } | undefined;
            return ['features', 'item', typedParams?.pathParams?.id];
        },
    }).useQuery,

    // Create feature mutation
    useCreateFeature: createQueryHooks({
        path: '/features',
        method: 'POST',
        requestSchema: CreateFeatureSchema,
        responseSchema: CreateResponseSchema,
        queryKey: 'features',
    }).useMutation,

    // Update feature mutation
    useUpdateFeature: createQueryHooks({
        path: '/features/:id',
        method: 'PUT',
        requestSchema: UpdateFeatureSchema,
        paramsSchema: FeatureIdParamSchema,
        responseSchema: UpdateResponseSchema,
        queryKey: 'features',
    }).useMutation,

    // Delete feature mutation
    useDeleteFeature: createQueryHooks({
        path: '/features/:id',
        method: 'DELETE',
        paramsSchema: FeatureIdParamSchema,
        responseSchema: UpdateResponseSchema,
        queryKey: 'features',
    }).useMutation,

    // Bulk progression management (admin only)
    useCreateFeatureProgressionWithRelations: createQueryHooks({
        path: '/features/progressions/bulk',
        method: 'POST',
        requestSchema: CreateFeatureProgressionSchema,
        responseSchema: CreateResponseSchema,
        queryKey: 'features',
    }).useMutation,

    // Feature Progression management for individual features
    useUpdateFeatureProgressions: createQueryHooks({
        path: '/features/:id/progressions',
        method: 'PUT',
        requestSchema: UpdateFeatureProgressionsRequestSchema,
        paramsSchema: FeatureIdParamSchema,
        responseSchema: UpdateResponseSchema,
        queryKey: 'features',
    }).useMutation,

    useGetFeatureProgressions: createQueryHooks({
        path: '/features/:id/progressions',
        method: 'GET',
        paramsSchema: FeatureIdParamSchema,
        responseSchema: GetFeatureProgressionsResponseSchema,
        queryKey: 'features',
        queryKeyBuilder: (params) => {
            const typedParams = params as { pathParams?: { id?: number } } | undefined;
            return ['features', 'progressions', typedParams?.pathParams?.id];
        },
    }).useQuery,

    // Lightweight feature list for dropdown selections
    useGetFeatureList: createQueryHooks({
        path: '/features/list',
        method: 'POST',
        requestSchema: FeatureQuerySchema,
        responseSchema: GetFeatureListResponseSchema,
        queryKey: 'features',
        queryKeyBuilder: (params) => ['features', 'list', params as string | number | object],
    }).useQuery,

    // Imperative methods
    getFeatures: (params?: unknown) => createQueryHooks({
        path: '/features/query',
        method: 'POST',
        requestSchema: FeatureQuerySchema,
        responseSchema: GetAllFeaturesResponseSchema,
        queryKey: 'features',
        queryKeyBuilder: (params) => ['features', 'list', params as string | number | object],
    }).fetch(params),

    getFeatureById: (featureId: number) => createQueryHooks({
        path: '/features/:id',
        method: 'GET',
        paramsSchema: FeatureIdParamSchema,
        responseSchema: GetFeatureResponseSchema,
        queryKey: 'features',
    }).fetch({ pathParams: { id: featureId } }),

    createFeature: (data: unknown) => createQueryHooks({
        path: '/features',
        method: 'POST',
        requestSchema: CreateFeatureSchema,
        responseSchema: CreateResponseSchema,
        queryKey: 'features',
    }).mutate({ requestData: data }),

    updateFeature: (featureId: number, data: unknown) => createQueryHooks({
        path: '/features/:id',
        method: 'PUT',
        requestSchema: UpdateFeatureSchema,
        paramsSchema: FeatureIdParamSchema,
        responseSchema: UpdateResponseSchema,
        queryKey: 'features',
    }).mutate({ requestData: data, pathParams: { id: featureId } }),

    deleteFeature: (featureId: number) => createQueryHooks({
        path: '/features/:id',
        method: 'DELETE',
        paramsSchema: FeatureIdParamSchema,
        responseSchema: UpdateResponseSchema,
        queryKey: 'features',
    }).mutate({ pathParams: { id: featureId } }),

    getFeatureProgressions: (featureId: number) => createQueryHooks({
        path: '/features/:id/progressions',
        method: 'GET',
        paramsSchema: FeatureIdParamSchema,
        responseSchema: GetFeatureProgressionsResponseSchema,
        queryKey: 'features',
        queryKeyBuilder: (params) => {
            const typedParams = params as { pathParams?: { id?: number } } | undefined;
            return ['features', 'progressions', typedParams?.pathParams?.id];
        },
    }).fetch({ pathParams: { id: featureId } }),

    getFeatureProgressionsByFeatId: (featId: number) => createQueryHooks({
        path: '/features/by-feat/:id/progressions',
        method: 'GET',
        paramsSchema: FeatureIdParamSchema,
        responseSchema: GetFeatureProgressionsResponseSchema,
        queryKey: 'features',
        queryKeyBuilder: (params) => {
            const typedParams = params as { pathParams?: { id?: number } } | undefined;
            return ['features', 'by-feat', 'progressions', typedParams?.pathParams?.id];
        },
    }).fetch({ pathParams: { id: featId } }),

    getFeatureProgressionsByEditionId: (editionId: number) => createQueryHooks({
        path: '/features/by-edition/:editionId/progressions',
        method: 'GET',
        paramsSchema: EditionIdParamSchema,
        responseSchema: GetFeatureProgressionsResponseSchema,
        queryKey: 'features',
        queryKeyBuilder: (params) => {
            const typedParams = params as { pathParams?: { editionId?: number } } | undefined;
            return ['features', 'by-edition', 'progressions', typedParams?.pathParams?.editionId];
        },
    }).fetch({ pathParams: { editionId } }),
};

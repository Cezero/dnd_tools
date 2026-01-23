import type { QueryClient } from '@tanstack/react-query';

import { createQueryHooks } from '@/services/query/QueryHooksFactory';
import {
    CloneClassFeaturesRequestSchema,
    CreateFeatureRequestSchema,
    CreateFeatureSchema,
    CreateResponseSchema,
    DraftLockStatusSchema,
    EditionIdParamSchema,
    FeatureIdParamSchema,
    FeatureQuerySchema,
    GetAllFeaturesResponseSchema,
    GetFeatureListResponseSchema,
    GetFeatureResponseSchema,
    GetFeaturesResponseSchema,
    ForkFeatureRequestSchema,
    ForkFeatureResponseSchema,
    UpdateFeaturesRequestSchema,
    UpdateFeatureSchema,
    UpdateResponseSchema,
} from '@shared/schema';


// Create query hook configurations
const featuresConfig = createQueryHooks({
    path: '/features/query',
    method: 'POST',
    requestSchema: FeatureQuerySchema,
    responseSchema: GetAllFeaturesResponseSchema,
    queryKey: 'features',
    queryKeyBuilder: (params) => ['features', 'list', params as string | number | object],
});

const featureByIdConfig = createQueryHooks({
    path: '/features/:id',
    method: 'GET',
    paramsSchema: FeatureIdParamSchema,
    responseSchema: GetFeatureResponseSchema,
    queryKey: 'features',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number } } | undefined;
        return ['features', 'item', typedParams?.pathParams?.id];
    },
});

const featureProgressionsConfig = createQueryHooks({
    path: '/features/:id/features',
    method: 'GET',
    paramsSchema: FeatureIdParamSchema,
    responseSchema: GetFeaturesResponseSchema,
    queryKey: 'features',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number } } | undefined;
        return ['features', 'progressions', typedParams?.pathParams?.id];
    },
});

const featuresByEditionConfig = createQueryHooks({
    path: '/features/by-edition/:editionId/features',
    method: 'GET',
    paramsSchema: EditionIdParamSchema,
    responseSchema: GetFeaturesResponseSchema,
    queryKey: 'features',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { editionId?: number } } | undefined;
        return ['features', 'by-edition', typedParams?.pathParams?.editionId];
    },
});

const createFeatureConfig = createQueryHooks({
    path: '/features',
    method: 'POST',
    requestSchema: CreateFeatureSchema,
    responseSchema: CreateResponseSchema,
    queryKey: 'features',
});

const updateFeatureConfig = createQueryHooks({
    path: '/features/:id',
    method: 'PUT',
    requestSchema: UpdateFeatureSchema,
    paramsSchema: FeatureIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'features',
});

const deleteFeatureConfig = createQueryHooks({
    path: '/features/:id',
    method: 'DELETE',
    paramsSchema: FeatureIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'features',
});

const updateFeaturesConfig = createQueryHooks({
    path: '/features/:id/features',
    method: 'PUT',
    requestSchema: UpdateFeaturesRequestSchema,
    paramsSchema: FeatureIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'features',
});

const featureLockStatusConfig = createQueryHooks({
    path: '/features/:id/lock-status',
    method: 'GET',
    paramsSchema: FeatureIdParamSchema,
    responseSchema: DraftLockStatusSchema,
    queryKey: 'features',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number } } | undefined;
        return ['features', 'lock-status', typedParams?.pathParams?.id];
    },
});

const featureListConfig = createQueryHooks({
    path: '/features/list',
    method: 'POST',
    requestSchema: FeatureQuerySchema,
    responseSchema: GetFeatureListResponseSchema,
    queryKey: 'features',
    queryKeyBuilder: (params) => ['features', 'list-dropdown', params as string | number | object],
});

const createFeatureWithRelationsConfig = createQueryHooks({
    path: '/features/features/bulk',
    method: 'POST',
    requestSchema: CreateFeatureRequestSchema,
    responseSchema: CreateResponseSchema,
    queryKey: 'features',
});

const cloneClassFeaturesConfig = createQueryHooks({
    path: '/features/clone-class-features',
    method: 'POST',
    requestSchema: CloneClassFeaturesRequestSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'features',
});

const forkFeatureConfig = createQueryHooks({
    path: '/features/fork-feature',
    method: 'POST',
    requestSchema: ForkFeatureRequestSchema,
    responseSchema: ForkFeatureResponseSchema,
    queryKey: 'features',
});

export const FeatureQueryHooks = {
    // Imperative methods
    // Note: Since featuresConfig has requestSchema, we pass data directly (not wrapped in requestData)
    getFeatures: (data: unknown, queryClient?: QueryClient) => featuresConfig.fetch(data, undefined, queryClient),
    getFeatureById: (featureId: number, queryClient?: QueryClient) => {
        return featureByIdConfig.fetch(
            { pathParams: { id: featureId } },
            undefined,
            queryClient
        );
    },
    getFeatureProgressions: (featureId: number) => {
        return featureProgressionsConfig.fetch({
            pathParams: { id: featureId },
        });
    },
    updateFeatures: (featureId: number, data: unknown) => updateFeaturesConfig.mutate({
        requestData: data,
        pathParams: { id: featureId }
    }),
    getFeaturesByEditionId: (editionId: number) => {
        return featuresByEditionConfig.fetch({
            pathParams: { editionId },
        });
    },
    getFeatureLockStatus: (featureId: number, queryClient?: QueryClient) => {
        return featureLockStatusConfig.fetch(
            { pathParams: { id: featureId } },
            undefined,
            queryClient
        );
    },
    getFeatureList: (data: unknown, queryClient?: QueryClient) => featureListConfig.fetch(data, undefined, queryClient),
    createFeature: (data: unknown) => createFeatureConfig.mutate({ requestData: data }),
    createFeatureWithRelations: (data: unknown) => createFeatureWithRelationsConfig.mutate({ requestData: data }),
    updateFeature: (featureId: number, data: unknown) => updateFeatureConfig.mutate({
        requestData: data,
        pathParams: { id: featureId }
    }),
    deleteFeature: (featureId: number) => deleteFeatureConfig.mutate({
        pathParams: { id: featureId }
    }),
    cloneClassFeatures: (data: unknown) => cloneClassFeaturesConfig.mutate({ requestData: data }),
    forkFeature: (data: unknown) => forkFeatureConfig.mutate({ requestData: data }),

    // Expose query functions for advanced usage
    getFeaturesQueryFn: featuresConfig.queryFn,
    getFeatureByIdQueryFn: (params: { pathParams: { id: number } }) => {
        return featureByIdConfig.queryFn({
            pathParams: params.pathParams,
        });
    },
    getFeatureProgressionsQueryFn: (params: { pathParams: { id: number } }) => {
        return featureProgressionsConfig.queryFn({
            pathParams: params.pathParams,
        });
    },
    getFeaturesByEditionIdQueryFn: (params: { pathParams: { editionId: number } }) => {
        return featuresByEditionConfig.queryFn({
            pathParams: params.pathParams,
        });
    },
    getFeaturesQueryKey: (params?: unknown) => featuresConfig.queryKeyBuilder(params),
    getFeatureByIdQueryKey: (featureId: number) => featureByIdConfig.queryKeyBuilder({ pathParams: { id: featureId } }),
    getFeatureProgressionsQueryKey: (featureId: number) => featureProgressionsConfig.queryKeyBuilder({ pathParams: { id: featureId } }),
    getFeaturesByEditionIdQueryKey: (editionId: number) => featuresByEditionConfig.queryKeyBuilder({ pathParams: { editionId } }),
    getFeatureLockStatusQueryKey: (featureId: number) => featureLockStatusConfig.queryKeyBuilder({ pathParams: { id: featureId } }),
    getFeatureListQueryKey: (params?: unknown) => featureListConfig.queryKeyBuilder(params),
};

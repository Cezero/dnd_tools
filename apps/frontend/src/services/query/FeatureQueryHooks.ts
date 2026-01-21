import {
    FeatureIdParamSchema,
    EditionIdParamSchema,
    FeatureQuerySchema,
    CreateFeatureSchema,
    UpdateFeatureSchema,
    GetFeatureResponseSchema,
    GetAllFeaturesResponseSchema,
    GetFeaturesResponseSchema,
    CreateResponseSchema,
    UpdateResponseSchema,
} from '@shared/schema';

import { createQueryHooks } from './QueryHooksFactory';

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

export const FeatureQueryHooks = {
    // Imperative methods
    getFeatures: (data: unknown) => featuresConfig.fetch({ requestData: data }),
    getFeatureById: (featureId: number) => {
        return featureByIdConfig.fetch({
            pathParams: { id: featureId },
        });
    },
    getFeatureProgressions: (featureId: number) => {
        return featureProgressionsConfig.fetch({
            pathParams: { id: featureId },
        });
    },
    getFeaturesByEditionId: (editionId: number) => {
        return featuresByEditionConfig.fetch({
            pathParams: { editionId },
        });
    },
    createFeature: (data: unknown) => createFeatureConfig.mutate({ requestData: data }),
    updateFeature: (featureId: number, data: unknown) => updateFeatureConfig.mutate({
        requestData: data,
        pathParams: { id: featureId }
    }),
    deleteFeature: (featureId: number) => deleteFeatureConfig.mutate({
        pathParams: { id: featureId }
    }),

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
};

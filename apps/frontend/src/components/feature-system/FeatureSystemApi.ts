import { typedApi } from '@/services/Api';
import {
    FeatureIdParamSchema,
    FeatureQuerySchema,
    CreateFeatureSchema,
    UpdateFeatureSchema,
    CreateFeatureProgressionSchema,
    GetFeatureResponseSchema,
    GetAllFeaturesResponseSchema,
    GetFeatureListResponseSchema,
    CreateResponseSchema,
    UpdateResponseSchema,
    UpdateFeatureProgressionsRequestSchema,
    GetFeatureProgressionsResponseSchema,
    CloneClassFeaturesRequestSchema,
    ForkProgressionRequestSchema,
    ForkProgressionResponseSchema,
} from '@shared/schema';

/**
 * FeatureSystemApi for admin-only feature management operations
 * 
 * This service provides CRUD operations for the unified FeatureSystem.
 * All operations require admin privileges.
 * 
 * Note: Individual entity/effect CRUD operations are not included
 * as they are only ever modified as part of bulk class/race operations.
 */
export const FeatureSystemApi = {
    // Core feature CRUD (admin only)
    getFeatures: typedApi<typeof FeatureQuerySchema, typeof GetAllFeaturesResponseSchema>({
        path: '/features/query',
        method: 'POST',
        requestSchema: FeatureQuerySchema,
        responseSchema: GetAllFeaturesResponseSchema,
    }),

    getFeatureById: typedApi<undefined, typeof GetFeatureResponseSchema, typeof FeatureIdParamSchema>({
        path: '/features/:id',
        method: 'GET',
        paramsSchema: FeatureIdParamSchema,
        responseSchema: GetFeatureResponseSchema,
    }),

    createFeature: typedApi<typeof CreateFeatureSchema, typeof CreateResponseSchema>({
        path: '/features',
        method: 'POST',
        requestSchema: CreateFeatureSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateFeature: typedApi<typeof UpdateFeatureSchema, typeof UpdateResponseSchema, typeof FeatureIdParamSchema>({
        path: '/features/:id',
        method: 'PUT',
        requestSchema: UpdateFeatureSchema,
        paramsSchema: FeatureIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    deleteFeature: typedApi<undefined, typeof UpdateResponseSchema, typeof FeatureIdParamSchema>({
        path: '/features/:id',
        method: 'DELETE',
        paramsSchema: FeatureIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    // Bulk progression management (admin only)
    createFeatureProgressionWithRelations: typedApi<typeof CreateFeatureProgressionSchema, typeof CreateResponseSchema>({
        path: '/features/progressions/bulk',
        method: 'POST',
        requestSchema: CreateFeatureProgressionSchema,
        responseSchema: CreateResponseSchema,
    }),

    // Feature Progression management for individual features
    updateFeatureProgressions: typedApi<typeof UpdateFeatureProgressionsRequestSchema, typeof UpdateResponseSchema, typeof FeatureIdParamSchema>({
        path: '/features/:id/progressions',
        method: 'PUT',
        requestSchema: UpdateFeatureProgressionsRequestSchema,
        paramsSchema: FeatureIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    getFeatureProgressions: typedApi<undefined, typeof GetFeatureProgressionsResponseSchema, typeof FeatureIdParamSchema>({
        path: '/features/:id/progressions',
        method: 'GET',
        paramsSchema: FeatureIdParamSchema,
        responseSchema: GetFeatureProgressionsResponseSchema,
    }),

    // Lightweight feature list for dropdown selections
    getFeatureList: typedApi<typeof FeatureQuerySchema, typeof GetFeatureListResponseSchema>({
        path: '/features/list',
        method: 'POST',
        requestSchema: FeatureQuerySchema,
        responseSchema: GetFeatureListResponseSchema,
    }),

    // Clone and Fork operations (for variant class creation)
    cloneClassFeatures: typedApi<typeof CloneClassFeaturesRequestSchema, typeof UpdateResponseSchema>({
        path: '/features/clone-class-features',
        method: 'POST',
        requestSchema: CloneClassFeaturesRequestSchema,
        responseSchema: UpdateResponseSchema,
    }),

    forkProgression: typedApi<typeof ForkProgressionRequestSchema, typeof ForkProgressionResponseSchema>({
        path: '/features/fork-progression',
        method: 'POST',
        requestSchema: ForkProgressionRequestSchema,
        responseSchema: ForkProgressionResponseSchema,
    }),
}; 

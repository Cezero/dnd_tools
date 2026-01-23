import { typedApi } from '@/services/Api';
import {
    FeatureIdParamSchema,
    FeatureQuerySchema,
    CreateFeatureSchema,
    UpdateFeatureSchema,
    CreateFeatureRequestSchema,
    GetFeatureResponseSchema,
    GetAllFeaturesResponseSchema,
    GetFeatureListResponseSchema,
    CreateResponseSchema,
    UpdateResponseSchema,
    UpdateFeaturesRequestSchema,
    GetFeaturesResponseSchema,
    CloneClassFeaturesRequestSchema,
    ForkFeatureRequestSchema,
    ForkFeatureResponseSchema,
    DraftLockStatusSchema,
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
    getAllFeatures: typedApi<typeof FeatureQuerySchema, typeof GetAllFeaturesResponseSchema>({
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

    // Bulk feature management (admin only)
    createFeatureWithRelations: typedApi<typeof CreateFeatureRequestSchema, typeof CreateResponseSchema>({
        path: '/features/features/bulk',
        method: 'POST',
        requestSchema: CreateFeatureRequestSchema,
        responseSchema: CreateResponseSchema,
    }),

    // Feature management for individual features
    updateFeatures: typedApi<typeof UpdateFeaturesRequestSchema, typeof UpdateResponseSchema, typeof FeatureIdParamSchema>({
        path: '/features/:id/features',
        method: 'PUT',
        requestSchema: UpdateFeaturesRequestSchema,
        paramsSchema: FeatureIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    getFeatures: typedApi<undefined, typeof GetFeaturesResponseSchema, typeof FeatureIdParamSchema>({
        path: '/features/:id/features',
        method: 'GET',
        paramsSchema: FeatureIdParamSchema,
        responseSchema: GetFeaturesResponseSchema,
    }),

    getFeatureLockStatus: typedApi<undefined, typeof DraftLockStatusSchema, typeof FeatureIdParamSchema>({
        path: '/features/:id/lock-status',
        method: 'GET',
        paramsSchema: FeatureIdParamSchema,
        responseSchema: DraftLockStatusSchema,
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

    forkFeature: typedApi<typeof ForkFeatureRequestSchema, typeof ForkFeatureResponseSchema>({
        path: '/features/fork-feature',
        method: 'POST',
        requestSchema: ForkFeatureRequestSchema,
        responseSchema: ForkFeatureResponseSchema,
    }),
}; 

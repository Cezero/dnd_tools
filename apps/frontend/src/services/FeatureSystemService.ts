import { typedApi } from '@/services/Api';
import {
    FeatureSlugParamSchema,
    FeatureIdParamSchema,
    FeatureQuerySchema,
    CreateFeatureSchema,
    UpdateFeatureSchema,
    CreateFeatureProgressionSchema,
    UpdateFeatureProgressionSchema,
    CreateFeatureProgressionWithRelationsSchema,
    CreateFeatureModifierSchema,
    UpdateFeatureModifierSchema,
    CreateFeatureChoiceSchema,
    UpdateFeatureChoiceSchema,
    CreateFeatureSpecialEffectSchema,
    UpdateFeatureSpecialEffectSchema,
    GetFeatureResponseSchema,
    GetAllFeaturesResponseSchema,
    CreateResponseSchema,
    UpdateResponseSchema,
} from '@shared/schema';

/**
 * FeatureSystemService for admin-only feature management operations
 * 
 * This service provides CRUD operations for the unified FeatureSystem,
 * including features, progressions, modifiers, choices, and special effects.
 * All operations require admin privileges.
 */
export const FeatureSystemService = {
    // Core feature CRUD (admin only)
    getFeatures: typedApi<typeof FeatureQuerySchema, typeof GetAllFeaturesResponseSchema>({
        path: '/features',
        method: 'GET',
        requestSchema: FeatureQuerySchema,
        responseSchema: GetAllFeaturesResponseSchema,
    }),

    getFeatureBySlug: typedApi<undefined, typeof GetFeatureResponseSchema, typeof FeatureSlugParamSchema>({
        path: '/features/:slug',
        method: 'GET',
        paramsSchema: FeatureSlugParamSchema,
        responseSchema: GetFeatureResponseSchema,
    }),

    createFeature: typedApi<typeof CreateFeatureSchema, typeof CreateResponseSchema>({
        path: '/features',
        method: 'POST',
        requestSchema: CreateFeatureSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateFeature: typedApi<typeof UpdateFeatureSchema, typeof UpdateResponseSchema, typeof FeatureSlugParamSchema>({
        path: '/features/:slug',
        method: 'PUT',
        requestSchema: UpdateFeatureSchema,
        paramsSchema: FeatureSlugParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    deleteFeature: typedApi<undefined, typeof UpdateResponseSchema, typeof FeatureSlugParamSchema>({
        path: '/features/:slug',
        method: 'DELETE',
        paramsSchema: FeatureSlugParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    // Progression management (admin only)
    createFeatureProgression: typedApi<typeof CreateFeatureProgressionSchema, typeof CreateResponseSchema>({
        path: '/features/progressions',
        method: 'POST',
        requestSchema: CreateFeatureProgressionSchema,
        responseSchema: CreateResponseSchema,
    }),

    createFeatureProgressionWithRelations: typedApi<typeof CreateFeatureProgressionWithRelationsSchema, typeof CreateResponseSchema>({
        path: '/features/progressions/bulk',
        method: 'POST',
        requestSchema: CreateFeatureProgressionWithRelationsSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateFeatureProgression: typedApi<typeof UpdateFeatureProgressionSchema, typeof UpdateResponseSchema, typeof FeatureIdParamSchema>({
        path: '/features/progressions/:id',
        method: 'PUT',
        requestSchema: UpdateFeatureProgressionSchema,
        paramsSchema: FeatureIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    deleteFeatureProgression: typedApi<undefined, typeof UpdateResponseSchema, typeof FeatureIdParamSchema>({
        path: '/features/progressions/:id',
        method: 'DELETE',
        paramsSchema: FeatureIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    // Modifier management (admin only)
    createFeatureModifier: typedApi<typeof CreateFeatureModifierSchema, typeof CreateResponseSchema, typeof FeatureIdParamSchema>({
        path: '/features/progressions/:id/modifiers',
        method: 'POST',
        requestSchema: CreateFeatureModifierSchema,
        paramsSchema: FeatureIdParamSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateFeatureModifier: typedApi<typeof UpdateFeatureModifierSchema, typeof UpdateResponseSchema, typeof FeatureIdParamSchema>({
        path: '/features/modifiers/:id',
        method: 'PUT',
        requestSchema: UpdateFeatureModifierSchema,
        paramsSchema: FeatureIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    deleteFeatureModifier: typedApi<undefined, typeof UpdateResponseSchema, typeof FeatureIdParamSchema>({
        path: '/features/modifiers/:id',
        method: 'DELETE',
        paramsSchema: FeatureIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    // Choice management (admin only)
    createFeatureChoice: typedApi<typeof CreateFeatureChoiceSchema, typeof CreateResponseSchema, typeof FeatureIdParamSchema>({
        path: '/features/progressions/:id/choices',
        method: 'POST',
        requestSchema: CreateFeatureChoiceSchema,
        paramsSchema: FeatureIdParamSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateFeatureChoice: typedApi<typeof UpdateFeatureChoiceSchema, typeof UpdateResponseSchema, typeof FeatureIdParamSchema>({
        path: '/features/choices/:id',
        method: 'PUT',
        requestSchema: UpdateFeatureChoiceSchema,
        paramsSchema: FeatureIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    deleteFeatureChoice: typedApi<undefined, typeof UpdateResponseSchema, typeof FeatureIdParamSchema>({
        path: '/features/choices/:id',
        method: 'DELETE',
        paramsSchema: FeatureIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    // Special effect management (admin only)
    createFeatureSpecialEffect: typedApi<typeof CreateFeatureSpecialEffectSchema, typeof CreateResponseSchema, typeof FeatureIdParamSchema>({
        path: '/features/progressions/:id/effects',
        method: 'POST',
        requestSchema: CreateFeatureSpecialEffectSchema,
        paramsSchema: FeatureIdParamSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateFeatureSpecialEffect: typedApi<typeof UpdateFeatureSpecialEffectSchema, typeof UpdateResponseSchema, typeof FeatureIdParamSchema>({
        path: '/features/effects/:id',
        method: 'PUT',
        requestSchema: UpdateFeatureSpecialEffectSchema,
        paramsSchema: FeatureIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    deleteFeatureSpecialEffect: typedApi<undefined, typeof UpdateResponseSchema, typeof FeatureIdParamSchema>({
        path: '/features/effects/:id',
        method: 'DELETE',
        paramsSchema: FeatureIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),
}; 

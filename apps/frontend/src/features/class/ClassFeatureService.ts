import { typedApi } from '@/services/Api';
import {
    CreateClassFeatureSchema,
    UpdateClassFeatureSchema,
    GetClassFeatureResponseSchema,
    CreateResponseSchema,
    UpdateResponseSchema,
    GetAllClassFeaturesResponseSchema,
    ClassFeatureIdParamSchema,
    ClassFeatureSlugParamSchema,
    ClassFeatureWithRelationsSchema,
    CreateClassFeatureProgressionSchema,
    UpdateClassFeatureProgressionSchema,
    CreateClassFeatureModifierSchema,
    UpdateClassFeatureModifierSchema,
    CreateClassFeatureSpecialEffectSchema,
    UpdateClassFeatureSpecialEffectSchema,
    CreateClassFeatureChoiceSchema,
    UpdateClassFeatureChoiceSchema,
} from '@shared/schema';

/**
 * ClassFeatureService with ID-based endpoints and relationship management
 * 
 * Usage examples:
 * 
 * // Get class feature by ID (primary)
 * const feature = await ClassFeatureService.getClassFeatureById(undefined, { id: 1 });
 * 
 * // Get class feature by slug (convenience)
 * const feature = await ClassFeatureService.getClassFeatureBySlug(undefined, { slug: "spellcasting" });
 * 
 * // Get class feature with all relationships
 * const richFeature = await ClassFeatureService.getClassFeatureWithRelations(undefined, { id: 1 });
 * 
 * // Create class feature
 * const newFeature = await ClassFeatureService.createClassFeature({ slug: "spellcasting", name: "Spellcasting", description: "..." });
 * 
 * // Update class feature (ID-based)
 * const updatedFeature = await ClassFeatureService.updateClassFeature(
 *   { description: "Updated description" }, 
 *   { id: 1 }
 * );
 * 
 * // Delete class feature (ID-based)
 * await ClassFeatureService.deleteClassFeature(undefined, { id: 1 });
 */
export const ClassFeatureService = {
    // Basic CRUD operations (ID-based)
    getClassFeatures: typedApi({
        path: '/classes/features',
        method: 'GET',
        responseSchema: GetAllClassFeaturesResponseSchema,
    }),

    getClassFeatureById: typedApi<undefined, typeof GetClassFeatureResponseSchema, typeof ClassFeatureIdParamSchema>({
        path: '/classes/features/:id',
        method: 'GET',
        paramsSchema: ClassFeatureIdParamSchema,
        responseSchema: GetClassFeatureResponseSchema,
    }),

    createClassFeature: typedApi<typeof CreateClassFeatureSchema, typeof CreateResponseSchema>({
        path: '/classes/features',
        method: 'POST',
        requestSchema: CreateClassFeatureSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateClassFeature: typedApi<typeof UpdateClassFeatureSchema, typeof UpdateResponseSchema, typeof ClassFeatureIdParamSchema>({
        path: '/classes/features/:id',
        method: 'PUT',
        requestSchema: UpdateClassFeatureSchema,
        paramsSchema: ClassFeatureIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    deleteClassFeature: typedApi<undefined, typeof UpdateResponseSchema, typeof ClassFeatureIdParamSchema>({
        path: '/classes/features/:id',
        method: 'DELETE',
        paramsSchema: ClassFeatureIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    // Convenience endpoint (slug-based)
    getClassFeatureBySlug: typedApi<undefined, typeof GetClassFeatureResponseSchema, typeof ClassFeatureSlugParamSchema>({
        path: '/classes/features/slug/:slug',
        method: 'GET',
        paramsSchema: ClassFeatureSlugParamSchema,
        responseSchema: GetClassFeatureResponseSchema,
    }),

    // Rich data endpoints
    getClassFeatureWithRelations: typedApi<undefined, typeof ClassFeatureWithRelationsSchema, typeof ClassFeatureIdParamSchema>({
        path: '/classes/features/:id/with-relations',
        method: 'GET',
        paramsSchema: ClassFeatureIdParamSchema,
        responseSchema: ClassFeatureWithRelationsSchema,
    }),

    // Relationship management endpoints
    createClassFeatureProgression: typedApi<typeof CreateClassFeatureProgressionSchema, typeof CreateResponseSchema>({
        path: '/classes/features/:featureId/progressions',
        method: 'POST',
        requestSchema: CreateClassFeatureProgressionSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateClassFeatureProgression: typedApi<typeof UpdateClassFeatureProgressionSchema, typeof UpdateResponseSchema, typeof ClassFeatureIdParamSchema>({
        path: '/classes/features/progressions/:id',
        method: 'PUT',
        requestSchema: UpdateClassFeatureProgressionSchema,
        paramsSchema: ClassFeatureIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    deleteClassFeatureProgression: typedApi<undefined, typeof UpdateResponseSchema, typeof ClassFeatureIdParamSchema>({
        path: '/classes/features/progressions/:id',
        method: 'DELETE',
        paramsSchema: ClassFeatureIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    createClassFeatureModifier: typedApi<typeof CreateClassFeatureModifierSchema, typeof CreateResponseSchema>({
        path: '/classes/features/:featureId/modifiers',
        method: 'POST',
        requestSchema: CreateClassFeatureModifierSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateClassFeatureModifier: typedApi<typeof UpdateClassFeatureModifierSchema, typeof UpdateResponseSchema, typeof ClassFeatureIdParamSchema>({
        path: '/classes/features/modifiers/:id',
        method: 'PUT',
        requestSchema: UpdateClassFeatureModifierSchema,
        paramsSchema: ClassFeatureIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    deleteClassFeatureModifier: typedApi<undefined, typeof UpdateResponseSchema, typeof ClassFeatureIdParamSchema>({
        path: '/classes/features/modifiers/:id',
        method: 'DELETE',
        paramsSchema: ClassFeatureIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    createClassFeatureSpecialEffect: typedApi<typeof CreateClassFeatureSpecialEffectSchema, typeof CreateResponseSchema>({
        path: '/classes/features/progressions/:progressionId/effects',
        method: 'POST',
        requestSchema: CreateClassFeatureSpecialEffectSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateClassFeatureSpecialEffect: typedApi<typeof UpdateClassFeatureSpecialEffectSchema, typeof UpdateResponseSchema, typeof ClassFeatureIdParamSchema>({
        path: '/classes/features/effects/:id',
        method: 'PUT',
        requestSchema: UpdateClassFeatureSpecialEffectSchema,
        paramsSchema: ClassFeatureIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    deleteClassFeatureSpecialEffect: typedApi<undefined, typeof UpdateResponseSchema, typeof ClassFeatureIdParamSchema>({
        path: '/classes/features/effects/:id',
        method: 'DELETE',
        paramsSchema: ClassFeatureIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    createClassFeatureChoice: typedApi<typeof CreateClassFeatureChoiceSchema, typeof CreateResponseSchema>({
        path: '/classes/features/progressions/:progressionId/choices',
        method: 'POST',
        requestSchema: CreateClassFeatureChoiceSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateClassFeatureChoice: typedApi<typeof UpdateClassFeatureChoiceSchema, typeof UpdateResponseSchema, typeof ClassFeatureIdParamSchema>({
        path: '/classes/features/choices/:id',
        method: 'PUT',
        requestSchema: UpdateClassFeatureChoiceSchema,
        paramsSchema: ClassFeatureIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    deleteClassFeatureChoice: typedApi<undefined, typeof UpdateResponseSchema, typeof ClassFeatureIdParamSchema>({
        path: '/classes/features/choices/:id',
        method: 'DELETE',
        paramsSchema: ClassFeatureIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),
}; 

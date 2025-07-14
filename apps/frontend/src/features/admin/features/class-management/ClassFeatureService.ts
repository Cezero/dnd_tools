import { typedApi } from '@/services/Api';
import {
    ClassFeatureSlugParamSchema,
    CreateClassFeatureSchema,
    UpdateClassFeatureSchema,
    GetClassFeatureResponseSchema,
    CreateResponseSchema,
    UpdateResponseSchema,
    GetAllClassFeaturesResponseSchema,
} from '@shared/schema';

/**
 * ClassFeatureService with path parameter support
 * 
 * Usage examples:
 * 
 * // Get class feature by slug (path parameter)
 * const feature = await ClassFeatureService.getClassFeatureBySlug(undefined, { slug: "spellcasting" });
 * 
 * // Create class feature
 * const newFeature = await ClassFeatureService.createClassFeature({ slug: "spellcasting", description: "..." });
 * 
 * // Update class feature (path parameter + body)
 * const updatedFeature = await ClassFeatureService.updateClassFeature(
 *   { description: "Updated description" }, 
 *   { slug: "spellcasting" }
 * );
 * 
 * // Delete class feature (path parameter)
 * await ClassFeatureService.deleteClassFeature(undefined, { slug: "spellcasting" });
 */
export const ClassFeatureService = {
    getClassFeatures: typedApi({
        path: '/classes/features',
        method: 'GET',
        responseSchema: GetAllClassFeaturesResponseSchema,
    }),

    getClassFeatureBySlug: typedApi<undefined, typeof GetClassFeatureResponseSchema, typeof ClassFeatureSlugParamSchema>({
        path: '/classes/features/:slug',
        method: 'GET',
        paramsSchema: ClassFeatureSlugParamSchema,
        responseSchema: GetClassFeatureResponseSchema,
    }),

    createClassFeature: typedApi<typeof CreateClassFeatureSchema, typeof CreateResponseSchema>({
        path: '/classes/features',
        method: 'POST',
        requestSchema: CreateClassFeatureSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateClassFeature: typedApi<typeof UpdateClassFeatureSchema, typeof UpdateResponseSchema, typeof ClassFeatureSlugParamSchema>({
        path: '/classes/features/:slug',
        method: 'PUT',
        requestSchema: UpdateClassFeatureSchema,
        paramsSchema: ClassFeatureSlugParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    deleteClassFeature: typedApi<undefined, typeof UpdateResponseSchema, typeof ClassFeatureSlugParamSchema>({
        path: '/classes/features/:slug',
        method: 'DELETE',
        paramsSchema: ClassFeatureSlugParamSchema,
        responseSchema: UpdateResponseSchema,
    }),
}; 

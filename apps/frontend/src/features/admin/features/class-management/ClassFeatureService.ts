import { typedApi } from '@/services/Api';
import {
    ClassFeatureQuerySchema,
    ClassFeatureSlugParamSchema,
    CreateClassFeatureSchema,
    UpdateClassFeatureSchema,
    ClassFeatureQueryResponseSchema,
    GetClassFeatureResponseSchema,
    CreateResponseSchema,
    UpdateResponseSchema,
} from '@shared/schema';

/**
 * ClassFeatureService with path parameter support
 * 
 * Usage examples:
 * 
 * // Get class features with query parameters
 * const features = await ClassFeatureService.getClassFeatures({ page: 1, limit: 10 });
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
    // Get class features with query parameters
    getClassFeatures: typedApi<typeof ClassFeatureQuerySchema, typeof ClassFeatureQueryResponseSchema>({
        path: '/classes/features',
        method: 'GET',
        requestSchema: ClassFeatureQuerySchema,
        responseSchema: ClassFeatureQueryResponseSchema,
    }),

    // Get class feature by slug with path parameter
    getClassFeatureBySlug: typedApi<undefined, typeof GetClassFeatureResponseSchema, typeof ClassFeatureSlugParamSchema>({
        path: '/classes/features/:slug',
        method: 'GET',
        paramsSchema: ClassFeatureSlugParamSchema,
        responseSchema: GetClassFeatureResponseSchema,
    }),

    // Create class feature
    createClassFeature: typedApi<typeof CreateClassFeatureSchema, typeof CreateResponseSchema>({
        path: '/classes/features',
        method: 'POST',
        requestSchema: CreateClassFeatureSchema,
        responseSchema: CreateResponseSchema,
    }),

    // Update class feature with path parameter
    updateClassFeature: typedApi<typeof UpdateClassFeatureSchema, typeof UpdateResponseSchema, typeof ClassFeatureSlugParamSchema>({
        path: '/classes/features/:slug',
        method: 'PUT',
        requestSchema: UpdateClassFeatureSchema,
        paramsSchema: ClassFeatureSlugParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    // Delete class feature with path parameter
    deleteClassFeature: typedApi<undefined, typeof UpdateResponseSchema, typeof ClassFeatureSlugParamSchema>({
        path: '/classes/features/:slug',
        method: 'DELETE',
        paramsSchema: ClassFeatureSlugParamSchema,
        responseSchema: UpdateResponseSchema,
    }),
}; 
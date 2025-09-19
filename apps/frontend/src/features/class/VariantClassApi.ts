import { typedApi } from '@/services/Api';
import {
    VariantIdParamSchema,
    ClassIdParamSchema,
    CreateClassVariantSchema,
    UpdateClassVariantSchema,
    CreateResponseSchema,
    UpdateResponseSchema,
    BaseClassVariantSchema,
} from '@shared/schema';

/**
 * VariantClassService with path parameter support
 *
 * Usage examples:
 *
 * // Get variant by ID (path parameter)
 * const variant = await VariantClassService.getVariantById(undefined, { id: 123 });
 * 
 * // Create variant
 * const newVariant = await VariantClassService.createVariant({ 
 *   name: "Cloistered Cleric", 
 *   baseClassId: 1,
 *   description: "A variant of the Cleric class"
 * });
 * 
 * // Update variant (path parameter + body)
 * const updatedVariant = await VariantClassService.updateVariant(
 *   { name: "Updated Cloistered Cleric" }, 
 *   { id: 123 }
 * );
 * 
 * // Delete variant (path parameter)
 * await VariantClassService.deleteVariant(undefined, { id: 123 });
 */
export const VariantClassApi = {
    getVariantById: typedApi<undefined, typeof BaseClassVariantSchema, typeof VariantIdParamSchema>({
        path: '/classes/variants/:id',
        method: 'GET',
        paramsSchema: VariantIdParamSchema,
        responseSchema: BaseClassVariantSchema,
    }),

    createVariant: typedApi<typeof CreateClassVariantSchema, typeof CreateResponseSchema>({
        path: '/classes/variants',
        method: 'POST',
        requestSchema: CreateClassVariantSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateVariant: typedApi<typeof UpdateClassVariantSchema, typeof UpdateResponseSchema, typeof VariantIdParamSchema>({
        path: '/classes/variants/:id',
        method: 'PUT',
        requestSchema: UpdateClassVariantSchema,
        paramsSchema: VariantIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    deleteVariant: typedApi<undefined, typeof UpdateResponseSchema, typeof VariantIdParamSchema>({
        path: '/classes/variants/:id',
        method: 'DELETE',
        paramsSchema: VariantIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),
};

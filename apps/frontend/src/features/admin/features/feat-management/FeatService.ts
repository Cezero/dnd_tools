
import { typedApi } from '@/services/Api';
import {
    FeatQuerySchema,
    FeatIdParamSchema,
    CreateFeatSchema,
    UpdateFeatSchema,
    FeatQueryResponseSchema,
    UpdateResponseSchema,
    CreateResponseSchema,
    BaseFeatSchema,
    GetFeatResponseSchema,
    GetAllFeatsResponseSchema,
} from '@shared/schema';

/**
 * FeatService with path parameter support
 * 
 * Usage examples:
 * 
 * // Get feats with query parameters
 * const feats = await FeatService.getFeats({ page: 1, limit: 10 });
 * 
 * // Get feat by ID (path parameter)
 * const feat = await FeatService.getFeatById(undefined, { id: 123 });
 * 
 * // Create feat
 * const newFeat = await FeatService.createFeat({ name: "Power Attack", typeId: 1 });
 * 
 * // Update feat (path parameter + body)
 * const updatedFeat = await FeatService.updateFeat(
 *   { name: "Updated Power Attack" }, 
 *   { id: 123 }
 * );
 * 
 * // Delete feat (path parameter)
 * await FeatService.deleteFeat(undefined, { id: 123 });
 */
export const FeatService = {
    // Get feats with query parameters
    getFeats: typedApi<typeof FeatQuerySchema, typeof FeatQueryResponseSchema>({
        path: '/feats',
        method: 'GET',
        requestSchema: FeatQuerySchema,
        responseSchema: FeatQueryResponseSchema,
    }),

    getAllFeats: typedApi<undefined, typeof GetAllFeatsResponseSchema>({
        path: '/feats/all',
        method: 'GET',
        responseSchema: GetAllFeatsResponseSchema,
    }),

    getFeatById: typedApi<undefined, typeof GetFeatResponseSchema, typeof FeatIdParamSchema>({
        path: '/feats/:id',
        method: 'GET',
        paramsSchema: FeatIdParamSchema,
        responseSchema: GetFeatResponseSchema,
    }),

    // Create feat
    createFeat: typedApi<typeof CreateFeatSchema, typeof CreateResponseSchema>({
        path: '/feats',
        method: 'POST',
        requestSchema: CreateFeatSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateFeat: typedApi<typeof UpdateFeatSchema, typeof UpdateResponseSchema, typeof FeatIdParamSchema>({
        path: '/feats/:id',
        method: 'PUT',
        requestSchema: UpdateFeatSchema,
        responseSchema: UpdateResponseSchema,
        paramsSchema: FeatIdParamSchema,
    }),

    // Delete feat with path parameter
    deleteFeat: typedApi<undefined, typeof UpdateResponseSchema, typeof FeatIdParamSchema>({
        path: '/feats/:id',
        method: 'DELETE',
        paramsSchema: FeatIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),
};

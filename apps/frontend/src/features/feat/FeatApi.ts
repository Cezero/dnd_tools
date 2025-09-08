
import { typedApi } from '@/services/Api';
import {
    FeatIdParamSchema,
    BaseFeatSchema,
    UpdateFeatSchema,
    UpdateResponseSchema,
    CreateResponseSchema,
    GetAllFeatsResponseSchema,
    FeatQuerySchema,
    FeatQueryResponseSchema,
    GetFeatListResponseSchema,
    FeatSchema,
} from '@shared/schema';

/**
 * FeatService with path parameter support
 * 
 * Usage examples:
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
export const FeatApi = {
    getFeats: typedApi({
        path: '/feats',
        method: 'GET',
        responseSchema: GetAllFeatsResponseSchema,
    }),

    getFeatById: typedApi<undefined, typeof FeatSchema, typeof FeatIdParamSchema>({
        path: '/feats/:id',
        method: 'GET',
        paramsSchema: FeatIdParamSchema,
        responseSchema: FeatSchema,
    }),

    createFeat: typedApi<typeof BaseFeatSchema, typeof CreateResponseSchema>({
        path: '/feats',
        method: 'POST',
        requestSchema: BaseFeatSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateFeat: typedApi<typeof UpdateFeatSchema, typeof UpdateResponseSchema, typeof FeatIdParamSchema>({
        path: '/feats/:id',
        method: 'PUT',
        requestSchema: UpdateFeatSchema,
        responseSchema: UpdateResponseSchema,
        paramsSchema: FeatIdParamSchema,
    }),

    deleteFeat: typedApi<undefined, typeof UpdateResponseSchema, typeof FeatIdParamSchema>({
        path: '/feats/:id',
        method: 'DELETE',
        paramsSchema: FeatIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    featQuery: typedApi<typeof FeatQuerySchema, typeof FeatQueryResponseSchema>({
        path: '/feats/query',
        method: 'GET',
        requestSchema: FeatQuerySchema,
        responseSchema: FeatQueryResponseSchema,
    }),

    // Lightweight feat list for dropdown selections
    getFeatList: typedApi<typeof FeatQuerySchema, typeof GetFeatListResponseSchema>({
        path: '/feats/list',
        method: 'GET',
        requestSchema: FeatQuerySchema,
        responseSchema: GetFeatListResponseSchema,
    }),

};

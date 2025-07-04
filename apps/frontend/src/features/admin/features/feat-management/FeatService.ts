import { z } from 'zod';

import { typedApi } from '@/services/Api';
import {
    FeatQuerySchema,
    FeatIdParamSchema,
    CreateFeatSchema,
    UpdateFeatSchema,
    FeatQueryResponseSchema,
    FeatSchema,
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

    // Get feat by ID with path parameter
    getFeatById: typedApi<undefined, typeof FeatSchema, typeof FeatIdParamSchema>({
        path: '/feats/:id',
        method: 'GET',
        paramsSchema: FeatIdParamSchema,
        responseSchema: FeatSchema,
    }),

    // Create feat
    createFeat: typedApi<typeof CreateFeatSchema, typeof FeatSchema>({
        path: '/feats',
        method: 'POST',
        requestSchema: CreateFeatSchema,
        responseSchema: FeatSchema,
    }),

    // Update feat with path parameter
    updateFeat: typedApi<typeof UpdateFeatSchema, typeof FeatSchema, typeof FeatIdParamSchema>({
        path: '/feats/:id',
        method: 'PUT',
        requestSchema: UpdateFeatSchema,
        paramsSchema: FeatIdParamSchema,
        responseSchema: FeatSchema,
    }),

    // Delete feat with path parameter
    deleteFeat: typedApi<undefined, z.ZodObject<Record<string, never>>, typeof FeatIdParamSchema>({
        path: '/feats/:id',
        method: 'DELETE',
        paramsSchema: FeatIdParamSchema,
        responseSchema: z.object({}),
    }),
};

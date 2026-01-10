import { z } from 'zod';
import { QueryResponseSchema } from './query.js';
import { SourceMapSchema } from './sourcebook.js';

export const FeatQuerySchema = z.object({
    queryType: z.enum(['all']).optional().default('all'),
});

export const FeatIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

export const BaseFeatSchema = z.object({
    name: z.string()
        .min(1, 'Feat name is required')
        .max(200, 'Feat name must be less than 200 characters')
        .trim(),
    typeId: z.number().int().positive('Type ID must be a positive integer'),
    repeatable: z.boolean().nullable(),
    fighterBonus: z.boolean().nullable(),
    useSubId: z.boolean().default(false),
    // benefits, prereqs, description, and summary removed - now handled via Feature system
    isVisible: z.boolean().default(true),
    editionId: z.number().int().positive('Edition ID must be a positive integer'),
    sourceBookInfo: z.array(SourceMapSchema).optional(),
});

import { FeatureProgressionSchema, CreateFeatureProgressionSchema } from './feature.js';

export const FeatSchema = BaseFeatSchema.extend({
    id: z.number().int().positive('Feat ID must be a positive integer'),
    featureProgressions: z.array(FeatureProgressionSchema).optional(),
});

// Extended schema for creating feats with feature progressions
export const CreateFeatWithProgressionsSchema = BaseFeatSchema.extend({
    featureProgressions: z.array(CreateFeatureProgressionSchema).optional(),
});

export const FeatInQueryResponseSchema = FeatSchema.omit({ featureProgressions: true });

export const FeatSummarySchema = z.object({
    id: z.number().int().positive(),
    name: z.string().min(1).max(200),
});

/**
 * Schema for feats with feature information (description and summary).
 * 
 * This schema is used for list views where we need to display feat information
 * but don't need the full feat data or feature progressions.
 * 
 * IMPORTANT: The backend populates this schema by:
 * - id: from Feat.id
 * - name: from Feat.name
 * - description: from the associated Feature.description (via FeatureProgression)
 * - summary: from the associated Feature.summary (via FeatureProgression)
 * 
 * If a feat has no associated feature, description and summary will be null.
 * If a feat has multiple feature progressions, the first one's feature is used.
 */
export const FeatWithFeatureInfoSchema = z.object({
    id: z.number().int().positive('Feat ID must be a positive integer'),
    name: z.string().min(1, 'Feat name is required').max(200, 'Feat name must be less than 200 characters'),
    description: z.string().max(10000, 'Description must be less than 10000 characters').nullable(),
    summary: z.string().max(10000, 'Summary must be less than 10000 characters').nullable(),
});

export const GetAllFeatsWithFeatureInfoResponseSchema = QueryResponseSchema.extend({
    results: z.array(FeatWithFeatureInfoSchema),
});

export const FeatCacheSchema = FeatSchema.omit({
    repeatable: true,
    sourceBookInfo: true,
});

export const FeatCacheResponseSchema = QueryResponseSchema.extend({
    results: z.array(FeatCacheSchema),
});

export const FeatQueryResponseSchema = QueryResponseSchema.extend({
    results: z.array(FeatSchema),
});

export const GetAllFeatsResponseSchema = QueryResponseSchema.extend({
    results: z.array(FeatInQueryResponseSchema),
});

// Response schema for feat list endpoint
export const GetFeatListResponseSchema = z.array(FeatSummarySchema);

export const UpdateFeatSchema = BaseFeatSchema.partial();

export type FeatIdParamRequest = z.infer<typeof FeatIdParamSchema>;
export type FeatInQueryResponse = z.infer<typeof FeatInQueryResponseSchema>;
export type CreateFeatRequest = z.infer<typeof CreateFeatWithProgressionsSchema>;
export type UpdateFeatRequest = z.infer<typeof UpdateFeatSchema>;
export type FeatQueryRequest = z.infer<typeof FeatQuerySchema>;

export type GetAllFeatsResponse = z.infer<typeof GetAllFeatsResponseSchema>;
export type FeatQueryResponse = z.infer<typeof FeatQueryResponseSchema>;
export type GetFeatListResponse = z.infer<typeof GetFeatListResponseSchema>;
export type Feat = z.infer<typeof BaseFeatSchema>;

export type FeatSummary = z.infer<typeof FeatSummarySchema>;
export type FeatWithFeatureInfo = z.infer<typeof FeatWithFeatureInfoSchema>;
export type GetAllFeatsWithFeatureInfoResponse = z.infer<typeof GetAllFeatsWithFeatureInfoResponseSchema>;

export type FeatCacheResponse = z.infer<typeof FeatCacheResponseSchema>;
export type FeatCacheEntry = z.infer<typeof FeatCacheSchema>;

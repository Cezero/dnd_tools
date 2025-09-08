import { z } from 'zod';
import { QueryResponseSchema } from './query.js';

export const FeatQuerySchema = z.object({
    queryType: z.enum(['proficiency', 'all']),
});

export const FeatIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

export const FeatBenefitMapSchema = z.object({
    typeId: z.number().int().positive('Benefit type ID must be a positive integer'),
    referenceId: z.number().int().positive('Reference ID must be a positive integer').nullable(),
    amount: z.number().int().min(0, 'Benefit amount must be non-negative').nullable(),
    index: z.number().int().min(0, 'Benefit index must be non-negative'),
});

export const FeatPrerequisiteMapSchema = z.object({
    index: z.number().int().min(0, 'Prerequisite index must be non-negative'),
    typeId: z.number().int().positive('Prerequisite type must be a positive integer'),
    amount: z.number().int().min(0, 'Prerequisite amount must be non-negative').nullable(),
    referenceId: z.number().int('Reference ID must be an integer').nullable(),
});

export const BaseFeatSchema = z.object({
    name: z.string()
        .min(1, 'Feat name is required')
        .max(200, 'Feat name must be less than 200 characters')
        .trim(),
    typeId: z.number().int().positive('Type ID must be a positive integer'),
    description: z.string().max(10000, 'Description must be less than 10000 characters').nullable(),
    benefit: z.string().max(2000, 'Benefit must be less than 2000 characters').nullable(),
    normalEffect: z.string().max(2000, 'Normal effect must be less than 2000 characters').nullable(),
    specialEffect: z.string().max(2000, 'Special effect must be less than 2000 characters').nullable(),
    prerequisites: z.string().max(2000, 'Prerequisites must be less than 2000 characters').nullable(),
    repeatable: z.boolean().nullable(),
    fighterBonus: z.boolean().nullable(),
    benefits: z.array(FeatBenefitMapSchema).optional(),
    prereqs: z.array(FeatPrerequisiteMapSchema).optional(),
});

export const FeatSchema = BaseFeatSchema.extend({
    id: z.number().int().positive('Feat ID must be a positive integer'),
});

export const FeatInQueryResponseSchema = FeatSchema.omit({ benefits: true, prereqs: true });

export const FeatSummarySchema = z.object({
    id: z.number().int().positive(),
    name: z.string().min(1).max(200),
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
export type CreateFeatRequest = z.infer<typeof BaseFeatSchema>;
export type UpdateFeatRequest = z.infer<typeof UpdateFeatSchema>;
export type FeatQueryRequest = z.infer<typeof FeatQuerySchema>;

export type GetAllFeatsResponse = z.infer<typeof GetAllFeatsResponseSchema>;
export type FeatQueryResponse = z.infer<typeof FeatQueryResponseSchema>;
export type GetFeatListResponse = z.infer<typeof GetFeatListResponseSchema>;
export type Feat = z.infer<typeof BaseFeatSchema>;

export type FeatBenefitMap = z.infer<typeof FeatBenefitMapSchema>;

export type FeatPrerequisiteMap = z.infer<typeof FeatPrerequisiteMapSchema>;

export type FeatSummary = z.infer<typeof FeatSummarySchema>;

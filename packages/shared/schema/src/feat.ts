import { z } from 'zod';
import { PageQueryResponseSchema, PageQuerySchema } from './query.js';
import { optionalBooleanParam, optionalIntegerParam, optionalStringParam } from './utils.js';

// Schema for feat query parameters
export const FeatQuerySchema = PageQuerySchema.extend({
    name: optionalStringParam(),
    typeId: optionalIntegerParam(),
    description: optionalStringParam(),
    benefit: optionalStringParam(),
    normalEffect: optionalStringParam(),
    specialEffect: optionalStringParam(),
    prerequisites: optionalStringParam(),
    repeatable: optionalBooleanParam(),
    fighterBonus: optionalBooleanParam(),
});

// Schema for feat path parameters
export const FeatIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

// Schema for feat benefit (matches Prisma FeatBenefitMap model)
export const FeatBenefitMapSchema = z.object({
    typeId: z.number().int().positive('Benefit type ID must be a positive integer'),
    referenceId: z.number().int().positive('Reference ID must be a positive integer').nullable(),
    amount: z.number().int().min(0, 'Benefit amount must be non-negative').nullable(),
    index: z.number().int().min(0, 'Benefit index must be non-negative'),
});

// Schema for feat prerequisite (matches Prisma FeatPrerequisiteMap model)
export const FeatPrerequisiteMapSchema = z.object({
    index: z.number().int().min(0, 'Prerequisite index must be non-negative'),
    typeId: z.number().int().positive('Prerequisite type must be a positive integer'),
    amount: z.number().int().min(0, 'Prerequisite amount must be non-negative').nullable(),
    referenceId: z.number().int().positive('Reference ID must be a positive integer').nullable(),
});

// Schema for feat base
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

export const FeatQueryResponseSchema = PageQueryResponseSchema.extend({
    results: z.array(FeatSchema),
});

export const GetAllFeatsResponseSchema = z.array(FeatSchema);

export const CreateFeatSchema = BaseFeatSchema;

// Schema for updating a feat (same as create but all fields optional)
export const UpdateFeatSchema = BaseFeatSchema.partial();

// Schema for feat benefit base
export const FeatBenefitSchema = z.object({
    typeId: z.number().int().positive('Benefit type ID must be a positive integer'),
    referenceId: z.number().int().positive('Reference ID must be a positive integer').nullable(),
    amount: z.number().int().min(0, 'Benefit amount must be non-negative').nullable(),
    index: z.number().int().min(0, 'Benefit index must be non-negative'),
});

// Schema for feat prerequisite base
export const FeatPrerequisiteSchema = z.object({
    typeId: z.number().int().positive('Prerequisite type must be a positive integer'),
    amount: z.number().int().min(0, 'Prerequisite amount must be non-negative').nullable(),
    referenceId: z.number().int().positive('Reference ID must be a positive integer').nullable(),
    index: z.number().int().min(0, 'Prerequisite index must be non-negative'),
});

// Type inference from schemas
export type FeatQueryRequest = z.infer<typeof FeatQuerySchema>;
export type FeatIdParamRequest = z.infer<typeof FeatIdParamSchema>;
export type CreateFeatRequest = z.infer<typeof CreateFeatSchema>;
export type UpdateFeatRequest = z.infer<typeof UpdateFeatSchema>;
export type FeatQueryResponse = z.infer<typeof FeatQueryResponseSchema>;
export type GetAllFeatsResponse = z.infer<typeof GetAllFeatsResponseSchema>;
export type FeatResponse = z.infer<typeof FeatSchema>;

// Feat benefit types
export type FeatBenefit = z.infer<typeof FeatBenefitSchema>;

// Feat prerequisite types
export type FeatPrerequisite = z.infer<typeof FeatPrerequisiteSchema>;

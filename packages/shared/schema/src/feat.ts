import { z } from 'zod';

// Schema for feat query parameters
export const FeatQuerySchema = z.object({
    page: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : 1),
    limit: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : 10),
    feat_name: z.string().optional(),
    feat_type: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : undefined),
    feat_description: z.string().optional(),
    feat_benefit: z.string().optional(),
    feat_normal: z.string().optional(),
    feat_special: z.string().optional(),
    feat_prereq: z.string().optional(),
    feat_multi_times: z.string().optional().transform((val: string | undefined) => val === 'true'),
});

// Schema for feat path parameters
export const FeatIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

// Schema for feat benefit (matches Prisma FeatBenefitMap model)
export const FeatBenefitSchema = z.object({
    benefit_index: z.number().int().min(0, 'Benefit index must be non-negative'),
    benefit_type: z.number().int().positive('Benefit type must be a positive integer'),
    benefit_type_id: z.number().int().positive('Benefit type ID must be a positive integer').optional(),
    benefit_amount: z.number().int().min(0, 'Benefit amount must be non-negative').optional(),
});

// Schema for feat prerequisite (matches Prisma FeatPrerequisiteMap model)
export const FeatPrerequisiteSchema = z.object({
    prereq_index: z.number().int().min(0, 'Prerequisite index must be non-negative'),
    prereq_type: z.number().int().positive('Prerequisite type must be a positive integer'),
    prereq_amount: z.number().int().min(0, 'Prerequisite amount must be non-negative').optional(),
    prereq_type_id: z.number().int().positive('Prerequisite type ID must be a positive integer').optional(),
});

// Schema for creating a feat (matches Prisma Feat model field names)
export const CreateFeatSchema = z.object({
    name: z.string()
        .min(1, 'Feat name is required')
        .max(200, 'Feat name must be less than 200 characters')
        .trim(),
    typeId: z.number().int().positive('Type ID must be a positive integer'),
    description: z.string().max(10000, 'Description must be less than 10000 characters').optional(),
    benefit: z.string().max(2000, 'Benefit must be less than 2000 characters').optional(),
    normalEffect: z.string().max(2000, 'Normal effect must be less than 2000 characters').optional(),
    specialEffect: z.string().max(2000, 'Special effect must be less than 2000 characters').optional(),
    prerequisites: z.string().max(2000, 'Prerequisites must be less than 2000 characters').optional(),
    repeatable: z.boolean().optional(),
    fighterBonus: z.boolean().optional(),
    benefits: z.array(FeatBenefitSchema).optional(),
    prereqs: z.array(FeatPrerequisiteSchema).optional(),
});

// Schema for updating a feat (same as create but all fields optional)
export const UpdateFeatSchema = CreateFeatSchema.partial().extend({
    name: z.string()
        .min(1, 'Feat name is required')
        .max(200, 'Feat name must be less than 200 characters')
        .trim(),
    typeId: z.number().int().positive('Type ID must be a positive integer'),
});

// Type inference from schemas
export type FeatQueryRequest = z.infer<typeof FeatQuerySchema>;
export type FeatIdParamRequest = z.infer<typeof FeatIdParamSchema>;
export type CreateFeatRequest = z.infer<typeof CreateFeatSchema>;
export type UpdateFeatRequest = z.infer<typeof UpdateFeatSchema>; 
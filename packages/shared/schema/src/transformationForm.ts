import z from "zod";

import { numericParam, commonValidations } from "./common";
import { QueryResponseSchema } from "./query";

// Transformation Form Eligibility Schema
export const TransformationFormEligibilitySchema = z.object({
    id: commonValidations.positiveInt('Transformation form eligibility ID'),
    featureId: commonValidations.positiveInt('Feature ID'),
    monsterId: commonValidations.positiveInt('Monster ID'),
    minLevel: z.number().int().min(1, 'Minimum level must be at least 1').max(20, 'Minimum level must be at most 20').nullable().optional(),
    notes: z.string().max(10000, 'Notes must be less than 10000 characters').nullable().optional(),
});

// Transformation Form Eligibility with relations schema
export const TransformationFormEligibilityWithRelationsSchema = TransformationFormEligibilitySchema.extend({
    feature: z.object({
        id: commonValidations.positiveInt(),
        name: z.string(),
        slug: z.string(),
    }).optional(),
    monster: z.object({
        id: commonValidations.positiveInt(),
        name: z.string(),
        sizeId: z.number().int().nullable(),
    }).optional(),
});

// Request schemas
export const CreateTransformationFormSchema = TransformationFormEligibilitySchema.omit({
    id: true,
});

export const UpdateTransformationFormSchema = CreateTransformationFormSchema.partial();

// Schema exports for route validation (matching Create/Update but with proper validation)
export const CreateTransformationFormRequestSchema = CreateTransformationFormSchema;
export const UpdateTransformationFormRequestSchema = UpdateTransformationFormSchema;

// Parameter schemas
export const TransformationFormIdParamSchema = z.object({
    id: numericParam(),
});

export const FeatureIdForTransformationFormsParamSchema = z.object({
    featureId: numericParam(),
});

// Response schemas
export const GetAllTransformationFormsResponseSchema = QueryResponseSchema.extend({
    results: z.array(TransformationFormEligibilityWithRelationsSchema),
});

export const GetTransformationFormResponseSchema = TransformationFormEligibilityWithRelationsSchema;

export const GetTransformationFormsByFeatureResponseSchema = z.array(TransformationFormEligibilityWithRelationsSchema);

// Type exports
export type TransformationFormEligibility = z.infer<typeof TransformationFormEligibilitySchema>;
export type TransformationFormEligibilityWithRelations = z.infer<typeof TransformationFormEligibilityWithRelationsSchema>;
export type CreateTransformationFormRequest = z.infer<typeof CreateTransformationFormSchema>;
export type UpdateTransformationFormRequest = z.infer<typeof UpdateTransformationFormSchema>;
export type TransformationFormIdParamRequest = z.infer<typeof TransformationFormIdParamSchema>;
export type FeatureIdForTransformationFormsParamRequest = z.infer<typeof FeatureIdForTransformationFormsParamSchema>;
export type GetAllTransformationFormsResponse = z.infer<typeof GetAllTransformationFormsResponseSchema>;
export type GetTransformationFormResponse = z.infer<typeof GetTransformationFormResponseSchema>;
export type GetTransformationFormsByFeatureResponse = z.infer<typeof GetTransformationFormsByFeatureResponseSchema>;

// Re-export common response types
export { CreateResponse, UpdateResponse } from './common';


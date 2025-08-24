import { z } from 'zod';
import type { Formula } from '@shared/static-data';
import { CalculationContextSchema } from './formatter';

// Formula Context Schema - for character calculation context (alias for CalculationContextSchema)
export const FormulaContextSchema = CalculationContextSchema;

// Formula Preview Schema - for frontend preview functionality
export const FormulaPreviewSchema = z.object({
    formulaId: z.string(),
    formula: z.custom<Formula>(), // Reference to Formula from static-data
    calculatedValues: z.array(z.object({
        level: z.number().int().positive('Level must be a positive integer'),
        value: z.number().int()
    })),
    parameters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
});

// Formula Parameter Validation Schema - for parameter validation
export const FormulaParameterValidationSchema = z.object({
    name: z.string(),
    description: z.string(),
    required: z.boolean(),
    type: z.enum(['number', 'string']),
    min: z.number().optional(),
    max: z.number().optional(),
    default: z.union([z.string(), z.number()]).optional()
});

// Formula Validation Result Schema
export const FormulaValidationResultSchema = z.object({
    valid: z.boolean(),
    errors: z.array(z.string())
});

// Type exports
export type FormulaContext = z.infer<typeof FormulaContextSchema>;
export type FormulaPreview = z.infer<typeof FormulaPreviewSchema>;
export type FormulaParameterValidation = z.infer<typeof FormulaParameterValidationSchema>;
export type FormulaValidationResult = z.infer<typeof FormulaValidationResultSchema>;

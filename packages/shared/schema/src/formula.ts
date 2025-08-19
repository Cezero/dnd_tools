import { z } from 'zod';
import type { Formula } from '@shared/static-data';

// Character Context Schema - for character data in formula calculations
export const CharacterContextSchema = z.object({
    abilityScores: z.record(z.number().int(), z.number().int()), // abilityId -> score
    classLevels: z.record(z.number().int(), z.number().int()), // classId -> level
});

// Formula Context Schema - for character calculation context
export const FormulaContextSchema = z.object({
    level: z.number().int().min(1).max(20),
    progressionLevel: z.number().int().min(1).max(20), // Starting level for the progression
    characterLevel: z.number().int().min(1).max(20).optional(),
    modifierValue: z.number().int().optional(),
    // Character context for attribute calculations
    character: CharacterContextSchema.optional(),
    // Allow additional context properties for extensibility
}).passthrough();

// Formula Preview Schema - for frontend preview functionality
export const FormulaPreviewSchema = z.object({
    formulaId: z.string(),
    formula: z.custom<Formula>(), // Reference to Formula from static-data
    calculatedValues: z.array(z.object({
        level: z.number().int().min(1).max(20),
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
export type CharacterContext = z.infer<typeof CharacterContextSchema>;
export type FormulaContext = z.infer<typeof FormulaContextSchema>;
export type FormulaPreview = z.infer<typeof FormulaPreviewSchema>;
export type FormulaParameterValidation = z.infer<typeof FormulaParameterValidationSchema>;
export type FormulaValidationResult = z.infer<typeof FormulaValidationResultSchema>;

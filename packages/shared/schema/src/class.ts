import { z } from 'zod';
import { PageQueryResponseSchema, PageQuerySchema } from './query.js';
import { optionalBooleanParam, optionalIntegerParam } from './utils.js';

// Schema for class query parameters
export const ClassQuerySchema = PageQuerySchema.extend({
    name: z.string().optional(),
    abbreviation: z.string().optional(),
    editionId: optionalIntegerParam(),
    isPrestige: optionalBooleanParam(),
    isVisible: optionalBooleanParam(),
    canCastSpells: optionalBooleanParam(),
    hitDie: optionalIntegerParam(),
    skillPoints: optionalIntegerParam(),
    castingAbilityId: optionalIntegerParam(),
});

// Schema for class base
export const BaseClassSchema = z.object({
    name: z.string()
        .min(1, 'Class name is required')
        .max(100, 'Class name must be less than 100 characters')
        .trim(),
    abbreviation: z.string()
        .min(1, 'Class abbreviation is required')
        .max(10, 'Class abbreviation must be less than 10 characters')
        .trim(),
    editionId: z.number().int().positive('Edition ID must be a positive integer').nullable(),
    isPrestige: z.boolean().default(false),
    isVisible: z.boolean().default(true),
    canCastSpells: z.boolean().default(false),
    hitDie: z.number().int().min(1, 'Hit die must be at least 1').max(20, 'Hit die must be at most 20'),
    skillPoints: z.number().int().min(0, 'Skill points must be non-negative').max(100, 'Skill points must be less than 100'),
    castingAbilityId: z.number().int().positive('Casting ability ID must be a positive integer').nullable(),
    description: z.string().max(10000, 'Description must be less than 10000 characters').nullable(),
});

export const ClassSchema = BaseClassSchema.extend({
    id: z.number().int().positive('Class ID must be a positive integer'),
});

// Schema for class path parameters
export const ClassIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

export const ClassQueryResponseSchema = PageQueryResponseSchema.extend({
    results: z.array(ClassSchema),
});

export const GetAllClassesResponseSchema = z.array(ClassSchema);

// Schema for updating a class (same as create but all fields optional)
export const UpdateClassSchema = BaseClassSchema.partial();

export const CreateClassSchema = BaseClassSchema;

// Type inference from schemas
export type ClassQueryRequest = z.infer<typeof ClassQuerySchema>;
export type ClassQueryResponse = z.infer<typeof ClassQueryResponseSchema>;
export type ClassIdParamRequest = z.infer<typeof ClassIdParamSchema>;
export type GetAllClassesResponse = z.infer<typeof GetAllClassesResponseSchema>;
export type CreateClassRequest = z.infer<typeof CreateClassSchema>;
export type UpdateClassRequest = z.infer<typeof UpdateClassSchema>;
export type ClassResponse = z.infer<typeof ClassSchema>;

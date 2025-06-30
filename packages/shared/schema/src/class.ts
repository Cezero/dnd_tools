import { z } from 'zod';

// Schema for class query parameters
export const ClassQuerySchema = z.object({
    page: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : 1),
    limit: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : 10),
    name: z.string().optional(),
    abbreviation: z.string().optional(),
    editionId: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : undefined),
    isPrestige: z.string().optional().transform((val: string | undefined) => val === 'true'),
    isVisible: z.string().optional().transform((val: string | undefined) => val === 'true'),
    canCastSpells: z.string().optional().transform((val: string | undefined) => val === 'true'),
    hitDie: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : undefined),
    skillPoints: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : undefined),
    castingAbilityId: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : undefined),
});

// Schema for class path parameters
export const ClassIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

// Schema for creating a class
export const CreateClassSchema = z.object({
    name: z.string()
        .min(1, 'Class name is required')
        .max(100, 'Class name must be less than 100 characters')
        .trim(),
    abbreviation: z.string()
        .min(1, 'Class abbreviation is required')
        .max(10, 'Class abbreviation must be less than 10 characters')
        .trim(),
    editionId: z.number().int().positive('Edition ID must be a positive integer').optional(),
    isPrestige: z.boolean().default(false),
    isVisible: z.boolean().default(true),
    canCastSpells: z.boolean().default(false),
    hitDie: z.number().int().min(1, 'Hit die must be at least 1').max(20, 'Hit die must be at most 20'),
    skillPoints: z.number().int().min(0, 'Skill points must be non-negative').max(100, 'Skill points must be less than 100'),
    castingAbilityId: z.number().int().positive('Casting ability ID must be a positive integer').optional(),
    description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
});

// Schema for updating a class (same as create but all fields optional)
export const UpdateClassSchema = CreateClassSchema.partial().extend({
    name: z.string()
        .min(1, 'Class name is required')
        .max(100, 'Class name must be less than 100 characters')
        .trim(),
    abbreviation: z.string()
        .min(1, 'Class abbreviation is required')
        .max(10, 'Class abbreviation must be less than 10 characters')
        .trim(),
    hitDie: z.number().int().min(1, 'Hit die must be at least 1').max(20, 'Hit die must be at most 20'),
    skillPoints: z.number().int().min(0, 'Skill points must be non-negative').max(100, 'Skill points must be less than 100'),
});

// Type inference from schemas
export type ClassQueryRequest = z.infer<typeof ClassQuerySchema>;
export type ClassIdParamRequest = z.infer<typeof ClassIdParamSchema>;
export type CreateClassRequest = z.infer<typeof CreateClassSchema>;
export type UpdateClassRequest = z.infer<typeof UpdateClassSchema>; 
import { z } from 'zod';

// Schema for race query parameters
export const RaceQuerySchema = z.object({
    page: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : 1),
    limit: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : 10),
    name: z.string().optional(),
    description: z.string().optional(),
    editionId: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : undefined),
    isVisible: z.string().optional().transform((val: string | undefined) => val === 'true'),
});

// Schema for race path parameters
export const RaceIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

// Schema for race trait path parameters
export const RaceTraitSlugParamSchema = z.object({
    slug: z.string().min(1, 'Trait slug is required'),
});

// Schema for race language
export const RaceLanguageSchema = z.object({
    languageId: z.number().int().positive('Language ID must be a positive integer'),
    isAutomatic: z.boolean().default(false),
});

// Schema for race ability adjustment
export const RaceAbilityAdjustmentSchema = z.object({
    abilityId: z.number().int().positive('Ability ID must be a positive integer'),
    value: z.number().int().min(-10, 'Ability adjustment must be at least -10').max(10, 'Ability adjustment must be at most 10'),
});

// Schema for race trait
export const RaceTraitSchema = z.object({
    traitId: z.string().min(1, 'Trait ID is required'),
    value: z.string().optional(),
});

// Schema for creating a race
export const CreateRaceSchema = z.object({
    name: z.string()
        .min(1, 'Race name is required')
        .max(100, 'Race name must be less than 100 characters')
        .trim(),
    description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
    sizeId: z.number().int().positive('Size ID must be a positive integer'),
    speed: z.number().int().min(0, 'Speed must be non-negative').max(1000, 'Speed must be less than 1000'),
    favoredClassId: z.number().int().min(0, 'Favored class ID must be non-negative'),
    editionId: z.number().int().positive('Edition ID must be a positive integer').optional(),
    isVisible: z.boolean().default(true),
    languages: z.array(RaceLanguageSchema).optional(),
    adjustments: z.array(RaceAbilityAdjustmentSchema).optional(),
    traits: z.array(RaceTraitSchema).optional(),
});

// Schema for updating a race (same as create but all fields optional)
export const UpdateRaceSchema = CreateRaceSchema.partial().extend({
    name: z.string()
        .min(1, 'Race name is required')
        .max(100, 'Race name must be less than 100 characters')
        .trim(),
    sizeId: z.number().int().positive('Size ID must be a positive integer'),
    speed: z.number().int().min(0, 'Speed must be non-negative').max(1000, 'Speed must be less than 1000'),
    favoredClassId: z.number().int().min(0, 'Favored class ID must be non-negative'),
});

// Schema for creating a race trait
export const CreateRaceTraitSchema = z.object({
    slug: z.string()
        .min(1, 'Trait slug is required')
        .max(100, 'Trait slug must be less than 100 characters')
        .regex(/^[a-z0-9-]+$/, 'Trait slug can only contain lowercase letters, numbers, and hyphens'),
    name: z.string().max(100, 'Trait name must be less than 100 characters').optional(),
    description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
    hasValue: z.boolean().default(false),
});

// Schema for updating a race trait
export const UpdateRaceTraitSchema = z.object({
    name: z.string().max(100, 'Trait name must be less than 100 characters').optional(),
    description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
    hasValue: z.boolean().optional(),
});

// Type inference from schemas
export type RaceQueryRequest = z.infer<typeof RaceQuerySchema>;
export type RaceIdParamRequest = z.infer<typeof RaceIdParamSchema>;
export type RaceTraitSlugParamRequest = z.infer<typeof RaceTraitSlugParamSchema>;
export type CreateRaceRequest = z.infer<typeof CreateRaceSchema>;
export type UpdateRaceRequest = z.infer<typeof UpdateRaceSchema>;
export type CreateRaceTraitRequest = z.infer<typeof CreateRaceTraitSchema>;
export type UpdateRaceTraitRequest = z.infer<typeof UpdateRaceTraitSchema>; 
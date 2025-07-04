import { z } from 'zod';
import { PageQueryResponseSchema, PageQuerySchema } from './query.js';
import { optionalBooleanParam, optionalIntegerParam, optionalStringParam } from './utils.js';

// Schema for race query parameters
export const RaceQuerySchema = PageQuerySchema.extend({
    name: optionalStringParam(),
    description: optionalStringParam(),
    editionId: optionalIntegerParam(),
    isVisible: optionalBooleanParam(),
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
export const RaceLanguageMapSchema = z.object({
    languageId: z.number().int().positive('Language ID must be a positive integer'),
    isAutomatic: z.boolean().default(false),
});

// Schema for race ability adjustment
export const RaceAbilityAdjustmentSchema = z.object({
    abilityId: z.number().int().positive('Ability ID must be a positive integer'),
    value: z.number().int().min(-10, 'Ability adjustment must be at least -10').max(20, 'Ability adjustment must be at most 10'),
});

// Schema for race trait mappings
export const RaceTraitMapSchema = z.object({
    traitId: z.string().min(1, 'Trait slug is required'),
    value: z.string().nullable(),
});



export const RaceTraitQuerySchema = PageQuerySchema.extend({
    slug: optionalStringParam(),
    name: optionalStringParam(),
    description: optionalStringParam(),
    hasValue: optionalBooleanParam(),
});

export const RaceTraitSchema = z.object({
    slug: z.string().min(1, 'Trait slug is required'),
    name: z.string().min(1, 'Trait name is required').max(100, 'Trait name must be less than 100 characters').trim().nullable(),
    description: z.string().max(2000, 'Description must be less than 2000 characters').nullable(),
    hasValue: z.boolean().default(false),
});

// Schema for race trait mappings with full trait information
export const RaceTraitMapWithTraitSchema = z.object({
    traitId: z.string().min(1, 'Trait slug is required'),
    value: z.string().nullable(),
    trait: RaceTraitSchema.nullable(),
});

export const BaseRaceSchema = z.object({
    name: z.string().min(1, 'Race name is required').max(100, 'Race name must be less than 100 characters').trim(),
    description: z.string().max(10000, 'Description must be less than 10000 characters').nullable(),
    sizeId: z.number().int().positive('Size ID must be a positive integer'),
    speed: z.number().int().min(0, 'Speed must be non-negative').max(1000, 'Speed must be less than 1000'),
    favoredClassId: z.number().int().min(0, 'Favored class ID must be non-negative'),
    editionId: z.number().int().positive('Edition ID must be a positive integer').nullable(),
    isVisible: z.boolean().default(true),
    languages: z.array(RaceLanguageMapSchema).optional(),
    adjustments: z.array(RaceAbilityAdjustmentSchema).optional(),
    traits: z.array(RaceTraitMapSchema).optional(),
});

export const RaceSchema = BaseRaceSchema.extend({
    id: z.number().int().positive('Race ID must be a positive integer'),
});

// Extended race schema with full trait information
export const RaceWithTraitsSchema = BaseRaceSchema.extend({
    id: z.number().int().positive('Race ID must be a positive integer'),
    traits: z.array(RaceTraitMapWithTraitSchema).optional(),
});

export const RaceQueryResponseSchema = PageQueryResponseSchema.extend({
    results: z.array(RaceSchema),
});

export const RaceTraitGetAllResponseSchema = z.array(RaceTraitSchema);

export const RaceTraitQueryResponseSchema = PageQueryResponseSchema.extend({
    results: z.array(RaceTraitSchema),
});

// Schema for creating a race
export const CreateRaceSchema = BaseRaceSchema;

// Schema for updating a race (same as create but all fields optional)
export const UpdateRaceSchema = BaseRaceSchema.partial();

// Schema for creating a race trait
export const CreateRaceTraitSchema = RaceTraitSchema;

// Schema for updating a race trait
export const UpdateRaceTraitSchema = RaceTraitSchema.partial().extend({
    slug: z.string().min(1, 'Trait slug is required'),
});

// Type inference from schemas
export type RaceQueryRequest = z.infer<typeof RaceQuerySchema>;
export type RaceIdParamRequest = z.infer<typeof RaceIdParamSchema>;
export type CreateRaceRequest = z.infer<typeof CreateRaceSchema>;
export type UpdateRaceRequest = z.infer<typeof UpdateRaceSchema>;
export type RaceQueryResponse = z.infer<typeof RaceQueryResponseSchema>;
export type RaceResponse = z.infer<typeof RaceSchema>;

export type RaceTraitMap = z.infer<typeof RaceTraitMapSchema>;
export type RaceTraitMapWithTrait = z.infer<typeof RaceTraitMapWithTraitSchema>;
export type RaceLanguageMap = z.infer<typeof RaceLanguageMapSchema>;
export type RaceAbilityAdjustment = z.infer<typeof RaceAbilityAdjustmentSchema>;

export type RaceTraitQueryRequest = z.infer<typeof RaceTraitQuerySchema>;
export type RaceTraitSlugParamRequest = z.infer<typeof RaceTraitSlugParamSchema>;
export type CreateRaceTraitRequest = z.infer<typeof CreateRaceTraitSchema>;
export type UpdateRaceTraitRequest = z.infer<typeof UpdateRaceTraitSchema>;
export type RaceTraitQueryResponse = z.infer<typeof RaceTraitQueryResponseSchema>;
export type RaceTraitGetAllResponse = z.infer<typeof RaceTraitGetAllResponseSchema>;
export type RaceTraitResponse = z.infer<typeof RaceTraitSchema>;

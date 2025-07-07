import { z } from 'zod';
import { PageQueryResponseSchema, PageQuerySchema } from './query.js';
import { optionalBooleanParam, optionalIntegerParam, optionalStringParam } from './utils.js';
import { SourceMapSchema } from './sourcebook.js';

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
    traitSlug: z.string().min(1, 'Trait slug is required'),
    value: z.string().nullable(),
});

export const RaceTraitQuerySchema = PageQuerySchema.extend({
    slug: optionalStringParam(),
    description: optionalStringParam(),
    hasValue: optionalBooleanParam(),
});

export const RaceTraitSchema = z.object({
    slug: z.string().min(1, 'Trait slug is required'),
    description: z.string().max(2000, 'Description must be less than 2000 characters').nullable(),
    hasValue: z.boolean().default(false),
});

// Schema for race trait mappings with full trait information
export const RaceTraitMapWithTraitSchema = z.object({
    traitSlug: z.string().min(1, 'Trait slug is required'),
    value: z.number().int().nullable(),
    trait: RaceTraitSchema.nullable(),
});

export const RaceSchema = z.object({
    id: z.number().int().positive('Race ID must be a positive integer'),
    name: z.string().min(1, 'Race name is required').max(100, 'Race name must be less than 100 characters').trim(),
    description: z.string().max(10000, 'Description must be less than 10000 characters').nullable(),
    sizeId: z.number().int().positive('Size ID must be a positive integer'),
    speed: z.number().int().min(0, 'Speed must be non-negative').max(1000, 'Speed must be less than 1000'),
    favoredClassId: z.number().int().min(-1, 'Favored class ID must be -1 or greater'),
    editionId: z.number().int().positive('Edition ID must be a positive integer').nullable(),
    isVisible: z.boolean().default(true),
    languages: z.array(RaceLanguageMapSchema).optional(),
    abilityAdjustments: z.array(RaceAbilityAdjustmentSchema).optional(),
    traits: z.array(RaceTraitMapSchema).optional(),
    sources: z.array(SourceMapSchema).optional(),
});

// Extended race schema with full trait information
export const RaceWithTraitsSchema = RaceSchema.extend({
    traits: z.array(RaceTraitMapWithTraitSchema).optional(),
});

export const RaceQueryResponseSchema = PageQueryResponseSchema.extend({
    results: z.array(RaceSchema),
});

export const GetRaceResponseSchema = RaceWithTraitsSchema.omit({ id: true });

// Schema for updating a race (same as create but all fields optional)
export const UpdateRaceSchema = RaceWithTraitsSchema.omit({ id: true }).partial();

export const RaceTraitGetAllResponseSchema = z.array(RaceTraitSchema);

export const RaceTraitQueryResponseSchema = PageQueryResponseSchema.extend({
    results: z.array(RaceTraitSchema),
});

export const GetRaceTraitResponseSchema = RaceTraitSchema.omit({ slug: true });

// Schema for creating a race trait
export const CreateRaceTraitSchema = RaceTraitSchema;

// Schema for updating a race trait
export const UpdateRaceTraitSchema = RaceTraitSchema.omit({ slug: true }).partial();

// Type inference from schemas
export type RaceQueryRequest = z.infer<typeof RaceQuerySchema>;
export type RaceIdParamRequest = z.infer<typeof RaceIdParamSchema>;
export type CreateRaceRequest = z.infer<typeof GetRaceResponseSchema>;
export type UpdateRaceRequest = z.infer<typeof UpdateRaceSchema>;
export type RaceQueryResponse = z.infer<typeof RaceQueryResponseSchema>;
export type RaceInQueryResponse = z.infer<typeof RaceSchema>;
export type GetRaceResponse = z.infer<typeof GetRaceResponseSchema>;

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
export type RaceTraitInQueryResponse = z.infer<typeof RaceTraitSchema>;
export type GetRaceTraitResponse = z.infer<typeof GetRaceTraitResponseSchema>;

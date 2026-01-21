import z from "zod";

import { numericParam, commonValidations } from "./common";
import { QueryResponseSchema } from "./query";
import { TrickSchema, CharacterCompanionTrickSchema } from "./trick";
import { FeatureResponseSchema } from "./feature";

// Companion Schema
export const CompanionSchema = z.object({
    id: commonValidations.positiveInt('Companion ID'),
    type: commonValidations.positiveInt('Companion type'),
    monsterId: commonValidations.positiveInt('Monster ID'),
    minLevel: z.number().int().min(1, 'Minimum level must be at least 1').max(20, 'Minimum level must be at most 20').nullable().optional(),
});

// Character Companion Schema
export const CharacterCompanionSchema = z.object({
    id: commonValidations.positiveInt('Character companion ID'),
    characterId: commonValidations.positiveInt('Character ID'),
    monsterId: commonValidations.positiveInt('Monster ID'),
    companionId: commonValidations.positiveInt('Companion ID').nullable().optional(),
    levelAcquired: z.number().int().min(1, 'Level acquired must be at least 1').max(20, 'Level acquired must be at most 20').nullable().optional(),
    hitPoints: commonValidations.positiveInt('Hit points').nullable().optional(),
    wounds: commonValidations.nonNegativeInt('Wounds').default(0),
});

// Companion with relations schema
// monster object removed - frontend should resolve monster names from monsters-cache using monsterId
export const CompanionWithRelationsSchema = CompanionSchema.extend({
    features: z.array(FeatureResponseSchema).optional(),
});

/**
 * Schema for character companion with related data.
 * 
 * This schema extends CharacterCompanionSchema with optional related entities.
 * The companion field reuses CompanionSchema (without id) to avoid duplication.
 * The tricks field uses CharacterCompanionTrickSchema for consistency.
 * 
 * Pattern: BaseSchema.extend() + optional related schemas
 * 
 * @see CharacterCompanionSchema - Base schema this extends
 * @see CompanionSchema - Reused for companion field (without id)
 * @see CharacterCompanionTrickSchema - Reused for tricks array items
 */
export const CharacterCompanionWithRelationsSchema = CharacterCompanionSchema.extend({
    companion: CompanionSchema.omit({ id: true }).optional(),
    tricks: z.array(CharacterCompanionTrickSchema.extend({
        trick: TrickSchema.optional(),
    })).optional(),
});

// Request schemas
export const CreateCompanionSchema = CompanionSchema.omit({
    id: true,
});

export const UpdateCompanionSchema = CreateCompanionSchema.partial();

export const CreateCharacterCompanionSchema = CharacterCompanionSchema.omit({
    id: true,
}).extend({
    tricks: z.array(commonValidations.positiveInt('Trick ID')).optional(),
});

export const UpdateCharacterCompanionSchema = CreateCharacterCompanionSchema.partial();

// Parameter schemas
export const CompanionIdParamSchema = z.object({
    id: numericParam(),
});

export const CharacterCompanionIdParamSchema = z.object({
    id: numericParam(),
});

// Response schemas
export const GetAllCompanionsResponseSchema = QueryResponseSchema.extend({
    results: z.array(CompanionWithRelationsSchema),
});

export const GetCompanionResponseSchema = CompanionWithRelationsSchema;

export const GetAllCharacterCompanionsResponseSchema = QueryResponseSchema.extend({
    results: z.array(CharacterCompanionWithRelationsSchema),
});

// Cache schemas
export const CompanionCacheSchema = CompanionSchema.extend({
    name: z.string().min(1, 'Companion name is required'),
});

export const CompanionCacheResponseSchema = QueryResponseSchema.extend({
    results: z.array(CompanionCacheSchema),
});

// Type exports
export type Companion = z.infer<typeof CompanionSchema>;
export type CompanionWithRelations = z.infer<typeof CompanionWithRelationsSchema>;
export type CharacterCompanion = z.infer<typeof CharacterCompanionSchema>;
export type CharacterCompanionWithRelations = z.infer<typeof CharacterCompanionWithRelationsSchema>;
export type CreateCompanionRequest = z.infer<typeof CreateCompanionSchema>;
export type UpdateCompanionRequest = z.infer<typeof UpdateCompanionSchema>;
export type CreateCharacterCompanionRequest = z.infer<typeof CreateCharacterCompanionSchema>;
export type UpdateCharacterCompanionRequest = z.infer<typeof UpdateCharacterCompanionSchema>;
export type CompanionIdParamRequest = z.infer<typeof CompanionIdParamSchema>;
export type CharacterCompanionIdParamRequest = z.infer<typeof CharacterCompanionIdParamSchema>;
export type GetAllCompanionsResponse = z.infer<typeof GetAllCompanionsResponseSchema>;
export type GetCompanionResponse = z.infer<typeof GetCompanionResponseSchema>;
export type GetAllCharacterCompanionsResponse = z.infer<typeof GetAllCharacterCompanionsResponseSchema>;
export type CompanionCacheEntry = z.infer<typeof CompanionCacheSchema>;
export type CompanionCacheResponse = z.infer<typeof CompanionCacheResponseSchema>;

// Re-export common response types
export { CreateResponse, UpdateResponse } from './common';


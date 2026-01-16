import z from "zod";

import { numericParam, commonValidations } from "./common";
import { QueryResponseSchema } from "./query";

// Trick Schema
export const TrickSchema = z.object({
    id: commonValidations.positiveInt('Trick ID'),
    name: commonValidations.name(),
    description: commonValidations.description(10000).nullable().optional(),
    editionId: commonValidations.positiveInt('Edition ID'),
    isVisible: z.boolean().default(true),
});

// Character Companion Trick Schema (join table)
export const CharacterCompanionTrickSchema = z.object({
    id: commonValidations.positiveInt('Character companion trick ID'),
    characterCompanionId: commonValidations.positiveInt('Character companion ID'),
    trickId: commonValidations.positiveInt('Trick ID'),
});

// Trick with relations schema
export const TrickWithRelationsSchema = TrickSchema.extend({
    sourceBookInfo: z.array(z.object({
        sourceBookId: commonValidations.positiveInt(),
        pageNumber: commonValidations.positiveInt().nullable().optional(),
    })).optional(),
});

// Request schemas
export const CreateTrickSchema = TrickSchema.omit({
    id: true,
}).extend({
    sourceBookInfo: z.array(z.object({
        sourceBookId: commonValidations.positiveInt(),
        pageNumber: commonValidations.positiveInt().nullable().optional(),
    })).optional(),
});

export const UpdateTrickSchema = CreateTrickSchema.partial();

// Parameter schemas
export const TrickIdParamSchema = z.object({
    id: numericParam(),
});

// Response schemas
export const GetAllTricksResponseSchema = QueryResponseSchema.extend({
    results: z.array(TrickSchema),
});

export const GetTrickResponseSchema = TrickWithRelationsSchema;

// Type exports
export type Trick = z.infer<typeof TrickSchema>;
export type TrickWithRelations = z.infer<typeof TrickWithRelationsSchema>;
export type CharacterCompanionTrick = z.infer<typeof CharacterCompanionTrickSchema>;
export type CreateTrickRequest = z.infer<typeof CreateTrickSchema>;
export type UpdateTrickRequest = z.infer<typeof UpdateTrickSchema>;
export type TrickIdParamRequest = z.infer<typeof TrickIdParamSchema>;
export type GetAllTricksResponse = z.infer<typeof GetAllTricksResponseSchema>;
export type GetTrickResponse = z.infer<typeof GetTrickResponseSchema>;

// Re-export common response types
export { CreateResponse, UpdateResponse } from './common';


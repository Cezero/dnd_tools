import z from "zod";
import { QueryResponseSchema } from "./query";

// Trick Schema
export const TrickSchema = z.object({
    id: z.number().int().positive('Trick ID must be a positive integer'),
    name: z.string().min(1, 'Trick name is required').max(100, 'Trick name must be less than 100 characters').trim(),
    description: z.string().max(10000, 'Description must be less than 10000 characters').nullable().optional(),
    editionId: z.number().int().positive('Edition ID must be a positive integer'),
    isVisible: z.boolean().default(true),
});

// Character Companion Trick Schema (join table)
export const CharacterCompanionTrickSchema = z.object({
    id: z.number().int().positive('Character companion trick ID must be a positive integer'),
    characterCompanionId: z.number().int().positive('Character companion ID must be a positive integer'),
    trickId: z.number().int().positive('Trick ID must be a positive integer'),
});

// Trick with relations schema
export const TrickWithRelationsSchema = TrickSchema.extend({
    sourceBookInfo: z.array(z.object({
        sourceBookId: z.number().int().positive(),
        pageNumber: z.number().int().positive().nullable().optional(),
    })).optional(),
});

// Request schemas
export const CreateTrickSchema = TrickSchema.omit({
    id: true,
}).extend({
    sourceBookInfo: z.array(z.object({
        sourceBookId: z.number().int().positive(),
        pageNumber: z.number().int().positive().nullable().optional(),
    })).optional(),
});

export const UpdateTrickSchema = CreateTrickSchema.partial();

// Parameter schemas
export const TrickIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
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


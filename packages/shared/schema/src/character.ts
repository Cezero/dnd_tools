import { z } from 'zod';
import { PageQueryResponseSchema, PageQuerySchema } from './query.js';
import { optionalIntegerParam, optionalStringParam } from './utils.js';

// Schema for character query parameters
export const CharacterQuerySchema = PageQuerySchema.extend({
    sort: z.enum(['name', 'createdAt', 'age']).optional().default('name'),
    order: z.enum(['asc', 'desc']).optional().default('asc'),
    name: optionalStringParam(),
    userId: optionalIntegerParam(),
});

// Schema for character path parameters
export const CharacterIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

// Schema for character base
export const BaseCharacterSchema = z.object({
    userId: z.number().int().positive('User ID must be a positive integer'),
    name: z.string()
        .min(1, 'Character name is required')
        .max(100, 'Character name must be less than 100 characters')
        .trim(),
    raceId: z.number().int().positive('Race ID must be a positive integer'),
    alignmentId: z.number().int().positive('Alignment ID must be a positive integer'),
    age: z.number().int().min(0, 'Age must be a non-negative integer').max(1000, 'Age must be less than 1000').nullable(),
    height: z.number().int().min(1, 'Height must be a positive integer').max(1000, 'Height must be less than 1000').nullable(),
    weight: z.number().int().min(1, 'Weight must be a positive integer').max(10000, 'Weight must be less than 10000').nullable(),
    eyes: z.string().max(50, 'Eye color must be less than 50 characters').nullable(),
    hair: z.string().max(50, 'Hair color must be less than 50 characters').nullable(),
    gender: z.string().max(20, 'Gender must be less than 20 characters').nullable(),
    notes: z.string().max(1000, 'Notes must be less than 1000 characters').nullable(),
});

export const CharacterSchema = BaseCharacterSchema.extend({
    id: z.number().int().positive('Character ID must be a positive integer'),
});

export const CharacterQueryResponseSchema = PageQueryResponseSchema.extend({
    results: z.array(CharacterSchema),
});

export const GetAllCharactersResponseSchema = z.array(CharacterSchema);

// Schema for updating a character (same as create but all fields optional)
export const UpdateCharacterSchema = BaseCharacterSchema.partial();

export const CreateCharacterSchema = BaseCharacterSchema;

// Type inference from schemas
export type CharacterQueryRequest = z.infer<typeof CharacterQuerySchema>;
export type CharacterIdParamRequest = z.infer<typeof CharacterIdParamSchema>;
export type CreateCharacterRequest = z.infer<typeof CreateCharacterSchema>;
export type UpdateCharacterRequest = z.infer<typeof UpdateCharacterSchema>; 
export type CharacterQueryResponse = z.infer<typeof CharacterQueryResponseSchema>;
export type CharacterResponse = z.infer<typeof CharacterSchema>;
export type GetAllCharactersResponse = z.infer<typeof GetAllCharactersResponseSchema>;
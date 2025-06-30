import { z } from 'zod';

// Schema for character query parameters
export const CharacterQuerySchema = z.object({
    page: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : 1),
    limit: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : 25),
    sort: z.enum(['name', 'createdAt', 'age']).optional().default('name'),
    order: z.enum(['asc', 'desc']).optional().default('asc'),
    name: z.string().optional(),
    userId: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : undefined),
});

// Schema for character path parameters
export const CharacterIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

// Schema for creating a character
export const CreateCharacterSchema = z.object({
    userId: z.number().int().positive('User ID must be a positive integer'),
    name: z.string()
        .min(1, 'Character name is required')
        .max(100, 'Character name must be less than 100 characters')
        .trim(),
    raceId: z.number().int().positive('Race ID must be a positive integer'),
    alignmentId: z.number().int().positive('Alignment ID must be a positive integer'),
    age: z.number().int().min(0, 'Age must be a non-negative integer').max(1000, 'Age must be less than 1000').optional(),
    height: z.number().int().min(1, 'Height must be a positive integer').max(1000, 'Height must be less than 1000').optional(),
    weight: z.number().int().min(1, 'Weight must be a positive integer').max(10000, 'Weight must be less than 10000').optional(),
    eyes: z.string().max(50, 'Eye color must be less than 50 characters').optional(),
    hair: z.string().max(50, 'Hair color must be less than 50 characters').optional(),
    gender: z.string().max(20, 'Gender must be less than 20 characters').optional(),
    notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

// Schema for updating a character (same as create but all fields optional)
export const UpdateCharacterSchema = CreateCharacterSchema.partial().extend({
    userId: z.number().int().positive('User ID must be a positive integer'),
    name: z.string()
        .min(1, 'Character name is required')
        .max(100, 'Character name must be less than 100 characters')
        .trim(),
    raceId: z.number().int().positive('Race ID must be a positive integer'),
    alignmentId: z.number().int().positive('Alignment ID must be a positive integer'),
});

// Type inference from schemas
export type CharacterQueryRequest = z.infer<typeof CharacterQuerySchema>;
export type CharacterIdParamRequest = z.infer<typeof CharacterIdParamSchema>;
export type CreateCharacterRequest = z.infer<typeof CreateCharacterSchema>;
export type UpdateCharacterRequest = z.infer<typeof UpdateCharacterSchema>; 
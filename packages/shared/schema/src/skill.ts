import { z } from 'zod';
import { PageQueryResponseSchema, PageQuerySchema } from './query.js';
import { optionalIntegerParam, optionalBooleanParam, optionalStringParam } from './utils.js';

// Schema for skill query parameters
export const SkillQuerySchema = PageQuerySchema.extend({
    trainedOnly: optionalBooleanParam(),
    affectedByArmor: optionalBooleanParam(),
    name: optionalStringParam(),
    abilityId: optionalIntegerParam(),
});

// Schema for skill path parameters
export const SkillIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

export const SkillSchema = z.object({
    id: z.number().int().positive('Skill ID must be a positive integer'),
    name: z.string().min(1, 'Skill name is required').max(100, 'Skill name must be less than 100 characters').trim(),
    abilityId: z.number().int().positive('Ability ID must be a positive integer'),
    trainedOnly: z.boolean().nullable(),
    affectedByArmor: z.boolean().default(false),
    description: z.string().max(10000, 'Description must be less than 10000 characters').nullable(),
    checkDescription: z.string().max(1000, 'Check description must be less than 1000 characters').nullable(),
    actionDescription: z.string().max(1000, 'Action description must be less than 1000 characters').nullable(),
    retryTypeId: z.number().int().positive('Retry type ID must be a positive integer').nullable(),
    retryDescription: z.string().max(1000, 'Retry description must be less than 1000 characters').nullable(),
    specialNotes: z.string().max(1000, 'Special notes must be less than 1000 characters').nullable(),
    synergyNotes: z.string().max(1000, 'Synergy notes must be less than 1000 characters').nullable(),
    untrainedNotes: z.string().max(1000, 'Untrained notes must be less than 1000 characters').nullable(),
});

// Schema for creating a skill (matches Prisma Skill model field names)
export const CreateSkillSchema = SkillSchema;

// Schema for updating a skill (same as create but all fields optional)
export const UpdateSkillSchema = SkillSchema.partial();

export const SkillQueryResponseSchema = PageQueryResponseSchema.extend({
    results: z.array(SkillSchema),
});

// Type inference from schemas
export type SkillQueryRequest = z.infer<typeof SkillQuerySchema>;
export type SkillIdParamRequest = z.infer<typeof SkillIdParamSchema>;
export type CreateSkillRequest = z.infer<typeof CreateSkillSchema>;
export type UpdateSkillRequest = z.infer<typeof UpdateSkillSchema>; 
export type SkillQueryResponse = z.infer<typeof SkillQueryResponseSchema>;
export type SkillResponse = z.infer<typeof SkillSchema>;
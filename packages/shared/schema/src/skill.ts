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
    checkDescription: z.string().max(10000, 'Check description must be less than 10000 characters').nullable(),
    actionDescription: z.string().max(10000, 'Action description must be less than 10000 characters').nullable(),
    retryTypeId: z.number().int().min(0, 'Retry type ID must be a positive integer').nullable(),
    retryDescription: z.string().max(10000, 'Retry description must be less than 10000 characters').nullable(),
    specialNotes: z.string().max(10000, 'Special notes must be less than 10000 characters').nullable(),
    synergyNotes: z.string().max(10000, 'Synergy notes must be less than 10000 characters').nullable(),
    untrainedNotes: z.string().max(10000, 'Untrained notes must be less than 10000 characters').nullable(),
});

export const CreateSkillSchema = SkillSchema.omit({ id: true });

// Schema for updating a skill (same as create but all fields optional)
export const UpdateSkillSchema = SkillSchema.omit({ id: true }).partial();

export const SkillQueryResponseSchema = PageQueryResponseSchema.extend({
    results: z.array(SkillSchema),
});

export const GetSkillResponseSchema = SkillSchema.omit({ id: true });

// Type inference from schemas
export type SkillQueryRequest = z.infer<typeof SkillQuerySchema>;
export type SkillIdParamRequest = z.infer<typeof SkillIdParamSchema>;
export type SkillQueryResponse = z.infer<typeof SkillQueryResponseSchema>;
export type SkillInQueryResponse = z.infer<typeof SkillSchema>;
export type GetSkillResponse = z.infer<typeof GetSkillResponseSchema>;
export type CreateSkillRequest = z.infer<typeof CreateSkillSchema>;
export type UpdateSkillRequest = z.infer<typeof UpdateSkillSchema>; 

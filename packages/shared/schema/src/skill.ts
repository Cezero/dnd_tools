import { z } from 'zod';
import { QueryResponseSchema } from './query.js';

export const SkillIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

export const SkillSchema = z.object({
    id: z.number().int().positive('Skill ID must be a positive integer'),
    name: z.string().min(1, 'Skill name is required').max(100, 'Skill name must be less than 100 characters').trim(),
    abilityId: z.number().int().min(0, 'Ability ID must be 0 or higher'),
    trainedOnly: z.boolean().nullable(),
    affectedByArmor: z.boolean().default(false),
    isAnalog: z.boolean().default(false),
    description: z.string().max(10000, 'Description must be less than 10000 characters').nullish(),
    checkDescription: z.string().max(10000, 'Check description must be less than 10000 characters').nullish(),
    actionDescription: z.string().max(10000, 'Action description must be less than 10000 characters').nullish(),
    retryTypeId: z.number().int().min(0, 'Retry type ID must be 0 or higher').nullish(),
    retryDescription: z.string().max(10000, 'Retry description must be less than 10000 characters').nullish(),
    specialNotes: z.string().max(10000, 'Special notes must be less than 10000 characters').nullish(),
    synergyNotes: z.string().max(10000, 'Synergy notes must be less than 10000 characters').nullish(),
    untrainedNotes: z.string().max(10000, 'Untrained notes must be less than 10000 characters').nullish(),
    restrictionNotes: z.string().max(10000, 'Restriction notes must be less than 10000 characters').nullish(),
});

export const CreateSkillSchema = SkillSchema.omit({ id: true });

export const UpdateSkillSchema = SkillSchema.omit({ id: true }).partial();

export const GetAllSkillsResponseSchema = QueryResponseSchema.extend({
    results: z.array(SkillSchema),
});

export const GetSkillResponseSchema = SkillSchema.omit({ id: true });

export type SkillIdParamRequest = z.infer<typeof SkillIdParamSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type GetAllSkillsResponse = z.infer<typeof GetAllSkillsResponseSchema>;
export type GetSkillResponse = z.infer<typeof GetSkillResponseSchema>;
export type CreateSkillRequest = z.infer<typeof CreateSkillSchema>;
export type UpdateSkillRequest = z.infer<typeof UpdateSkillSchema>; 

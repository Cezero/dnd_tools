import { z } from 'zod';

// Schema for skill query parameters
export const SkillQuerySchema = z.object({
    page: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : 1),
    limit: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : 10),
    name: z.string().optional(),
    abilityId: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : undefined),
    trainedOnly: z.string().optional().transform((val: string | undefined) => val === 'true'),
    affectedByArmor: z.string().optional().transform((val: string | undefined) => val === 'true'),
});

// Schema for skill path parameters
export const SkillIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

// Schema for creating a skill (matches Prisma Skill model field names)
export const CreateSkillSchema = z.object({
    name: z.string()
        .min(1, 'Skill name is required')
        .max(100, 'Skill name must be less than 100 characters')
        .trim(),
    abilityId: z.number().int().positive('Ability ID must be a positive integer'),
    trainedOnly: z.boolean().optional(),
    affectedByArmor: z.boolean().default(false),
    description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
    checkDescription: z.string().max(1000, 'Check description must be less than 1000 characters').optional(),
    actionDescription: z.string().max(1000, 'Action description must be less than 1000 characters').optional(),
    retryTypeId: z.number().int().positive('Retry type ID must be a positive integer').optional(),
    retryDescription: z.string().max(1000, 'Retry description must be less than 1000 characters').optional(),
    specialNotes: z.string().max(1000, 'Special notes must be less than 1000 characters').optional(),
    synergyNotes: z.string().max(1000, 'Synergy notes must be less than 1000 characters').optional(),
    untrainedNotes: z.string().max(1000, 'Untrained notes must be less than 1000 characters').optional(),
});

// Schema for updating a skill (same as create but all fields optional)
export const UpdateSkillSchema = CreateSkillSchema.partial().extend({
    name: z.string()
        .min(1, 'Skill name is required')
        .max(100, 'Skill name must be less than 100 characters')
        .trim(),
    abilityId: z.number().int().positive('Ability ID must be a positive integer'),
});

// Type inference from schemas
export type SkillQueryRequest = z.infer<typeof SkillQuerySchema>;
export type SkillIdParamRequest = z.infer<typeof SkillIdParamSchema>;
export type CreateSkillRequest = z.infer<typeof CreateSkillSchema>;
export type UpdateSkillRequest = z.infer<typeof UpdateSkillSchema>; 
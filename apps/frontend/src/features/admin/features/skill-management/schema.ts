import { z } from 'zod';
import type { Skill, SkillCreateInput, SkillUpdateInput } from '@shared/prisma-client';

// Base skill schema for validation
export const skillSchema = z.object({
    id: z.number(),
    name: z.string().min(1, 'Skill name is required'),
    abilityId: z.number().min(1, 'Ability ID is required'),
    checkDescription: z.string().nullable(),
    actionDescription: z.string().nullable(),
    retryTypeId: z.number().nullable(),
    retryDescription: z.string().nullable(),
    specialNotes: z.string().nullable(),
    synergyNotes: z.string().nullable(),
    untrainedNotes: z.string().nullable(),
    affectedByArmor: z.boolean(),
    description: z.string().nullable(),
    trainedOnly: z.boolean().nullable(),
});

// Schema for creating a new skill
export const createSkillSchema = skillSchema.omit({ id: true });

// Schema for updating an existing skill
export const updateSkillSchema = skillSchema.partial().omit({ id: true });

// Schema for skill list response
export const skillListResponseSchema = z.object({
    data: z.array(skillSchema),
    total: z.number(),
});

// Schema for single skill response
export const skillResponseSchema = skillSchema;

// Type exports
export type SkillFormData = z.infer<typeof createSkillSchema>;
export type SkillUpdateData = z.infer<typeof updateSkillSchema>;
export type SkillListResponse = z.infer<typeof skillListResponseSchema>;
export type SkillResponse = z.infer<typeof skillResponseSchema>;

// Validation functions
export const validateCreateSkill = (data: unknown): SkillFormData => {
    return createSkillSchema.parse(data);
};

export const validateUpdateSkill = (data: unknown): SkillUpdateData => {
    return updateSkillSchema.parse(data);
};

export const validateSkillListResponse = (data: unknown): SkillListResponse => {
    return skillListResponseSchema.parse(data);
};

export const validateSkillResponse = (data: unknown): SkillResponse => {
    return skillResponseSchema.parse(data);
}; 
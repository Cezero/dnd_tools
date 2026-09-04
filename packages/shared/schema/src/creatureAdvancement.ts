import z from "zod";

import { commonValidations } from "./common";

/**
 * Skill ranks granted by one creature HD step.
 * Same shape is reused later for monster-instance advancements.
 */
export const CreatureAdvancementSkillSchema = z.object({
    id: commonValidations.positiveInt('Creature advancement skill ID'),
    skillId: commonValidations.positiveInt('Skill ID'),
    skillSubId: commonValidations.positiveInt('Skill sub ID').nullable().optional(),
    ranks: z.number().int().min(0, 'Ranks must be non-negative'),
});

export const CreatureAdvancementSkillInputSchema = CreatureAdvancementSkillSchema.omit({
    id: true,
});

export const CreatureAdvancementSkillDraftSchema = z.object({
    id: z.number().int(),
    skillId: commonValidations.positiveInt('Skill ID'),
    skillSubId: commonValidations.positiveInt('Skill sub ID').nullable().optional(),
    ranks: z.number().int().min(0, 'Ranks must be non-negative'),
});

/**
 * Feat granted by one creature HD step (when that HD crosses 1 + floor(HD/3)).
 */
export const CreatureAdvancementFeatSchema = z.object({
    id: commonValidations.positiveInt('Creature advancement feat ID'),
    featId: commonValidations.positiveInt('Feat ID'),
    featSubId: commonValidations.positiveInt('Feat sub ID').nullable().optional(),
    notes: z.string().max(128, 'Notes must be less than 128 characters').nullable().optional(),
});

export const CreatureAdvancementFeatInputSchema = CreatureAdvancementFeatSchema.omit({
    id: true,
});

export const CreatureAdvancementFeatDraftSchema = z.object({
    id: z.number().int(),
    featId: commonValidations.positiveInt('Feat ID'),
    featSubId: commonValidations.positiveInt('Feat sub ID').nullable().optional(),
    notes: z.string().max(128, 'Notes must be less than 128 characters').nullable().optional(),
});

/**
 * One HD step for a creature instance.
 * Sequence 1 is the printed/base HD bundle. Sequence 2+ are added HD.
 * Owner FK lives on the Prisma table (companion now, monster instance later).
 */
export const CreatureAdvancementSchema = z.object({
    id: commonValidations.positiveInt('Creature advancement ID'),
    sequence: z.number().int().min(1, 'Sequence must be at least 1'),
    hitDiceQty: z.number().positive('Hit dice quantity must be positive'),
    hitDiceType: commonValidations.nonNegativeInt('Hit dice type'),
    hitPoints: commonValidations.nonNegativeInt('Hit points'),
    classId: commonValidations.positiveInt('Class ID').nullable().optional(),
    notes: z.string().max(1000, 'Notes must be less than 1000 characters').nullable().optional(),
    skills: z.array(CreatureAdvancementSkillSchema).optional(),
    feats: z.array(CreatureAdvancementFeatSchema).optional(),
});

export const CreatureAdvancementDraftSchema = z.object({
    id: z.number().int(),
    sequence: z.number().int().min(1, 'Sequence must be at least 1'),
    hitDiceQty: z.number().positive('Hit dice quantity must be positive'),
    hitDiceType: commonValidations.nonNegativeInt('Hit dice type'),
    hitPoints: commonValidations.nonNegativeInt('Hit points'),
    classId: commonValidations.positiveInt('Class ID').nullable().optional(),
    notes: z.string().max(1000, 'Notes must be less than 1000 characters').nullable().optional(),
    skills: z.array(CreatureAdvancementSkillDraftSchema).optional(),
    feats: z.array(CreatureAdvancementFeatDraftSchema).optional(),
});

export const CreatureAdvancementInputSchema = CreatureAdvancementDraftSchema.omit({
    id: true,
}).extend({
    skills: z.array(CreatureAdvancementSkillInputSchema).optional(),
    feats: z.array(CreatureAdvancementFeatInputSchema).optional(),
});

/**
 * Per-HD skill/feat budget for one advancement sequence.
 */
export const CreatureAdvancementBudgetSchema = z.object({
    sequence: z.number().int().min(1),
    skillPointsUsed: z.number().int().min(0),
    skillPointsMax: z.number().int().min(0),
    featSlotsUsed: z.number().int().min(0),
    featSlotsMax: z.number().int().min(0),
});

export type CreatureAdvancementSkill = z.infer<typeof CreatureAdvancementSkillSchema>;
export type CreatureAdvancementSkillInput = z.infer<typeof CreatureAdvancementSkillInputSchema>;
export type CreatureAdvancementSkillDraft = z.infer<typeof CreatureAdvancementSkillDraftSchema>;
export type CreatureAdvancementFeat = z.infer<typeof CreatureAdvancementFeatSchema>;
export type CreatureAdvancementFeatInput = z.infer<typeof CreatureAdvancementFeatInputSchema>;
export type CreatureAdvancementFeatDraft = z.infer<typeof CreatureAdvancementFeatDraftSchema>;
export type CreatureAdvancement = z.infer<typeof CreatureAdvancementSchema>;
export type CreatureAdvancementDraft = z.infer<typeof CreatureAdvancementDraftSchema>;
export type CreatureAdvancementInput = z.infer<typeof CreatureAdvancementInputSchema>;
export type CreatureAdvancementBudget = z.infer<typeof CreatureAdvancementBudgetSchema>;

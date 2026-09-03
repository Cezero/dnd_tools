import z from "zod";

import { commonValidations, numericParam } from "./common";
import { FeatureResponseSchema } from "./feature";
import { GetMonsterResponseSchema } from "./monster";
import { QueryResponseSchema } from "./query";
import { CharacterCompanionTrickInputSchema, CharacterCompanionTrickSchema, TrickSchema } from "./trick";
import { TrickPurposeSchema } from "./trickPurpose";

export const CompanionSchema = z.object({
    id: commonValidations.positiveInt('Companion ID'),
    type: commonValidations.positiveInt('Companion type'),
    monsterId: commonValidations.positiveInt('Monster ID'),
    minLevel: z.number().int().min(1, 'Minimum level must be at least 1').max(20, 'Minimum level must be at most 20').nullable().optional(),
    levelAdjustment: z.number().int().min(0, 'Level adjustment must be at least 0').max(20, 'Level adjustment must be at most 20').nullable().optional(),
});

export const CharacterCompanionSchema = z.object({
    id: commonValidations.positiveInt('Character companion ID'),
    characterId: commonValidations.positiveInt('Character ID'),
    monsterId: commonValidations.positiveInt('Monster ID'),
    companionId: commonValidations.positiveInt('Companion ID').nullable().optional(),
    trickPurposeId: commonValidations.positiveInt('Trick purpose ID').nullable().optional(),
    name: z.string().max(100, 'Name must be less than 100 characters').nullable().optional(),
    levelAcquired: z.number().int().min(1, 'Level acquired must be at least 1').max(20, 'Level acquired must be at most 20').nullable().optional(),
    hitPoints: commonValidations.positiveInt('Hit points').nullable().optional(),
    wounds: commonValidations.nonNegativeInt('Wounds').default(0),
});

export const CharacterCompanionSkillSchema = z.object({
    id: commonValidations.positiveInt('Character companion skill ID'),
    characterCompanionId: commonValidations.positiveInt('Character companion ID'),
    skillId: commonValidations.positiveInt('Skill ID'),
    skillSubId: commonValidations.positiveInt('Skill sub ID').nullable().optional(),
    ranks: z.number().int().min(0, 'Ranks must be non-negative'),
});

export const CharacterCompanionSkillInputSchema = z.object({
    skillId: commonValidations.positiveInt('Skill ID'),
    skillSubId: commonValidations.positiveInt('Skill sub ID').nullable().optional(),
    ranks: z.number().int().min(0, 'Ranks must be non-negative'),
});

export const CharacterCompanionFeatSchema = z.object({
    id: commonValidations.positiveInt('Character companion feat ID'),
    characterCompanionId: commonValidations.positiveInt('Character companion ID'),
    featId: commonValidations.positiveInt('Feat ID'),
    notes: z.string().max(128, 'Notes must be less than 128 characters').nullable().optional(),
});

export const CharacterCompanionFeatInputSchema = z.object({
    featId: commonValidations.positiveInt('Feat ID'),
    notes: z.string().max(128, 'Notes must be less than 128 characters').nullable().optional(),
});

/**
 * Draft-safe companion row, including nested tricks/skills/feats.
 * IDs may be 0 or negative while the character edit session is unsaved.
 */
export const CharacterCompanionTrickDraftSchema = z.object({
    id: z.number().int(),
    trickId: commonValidations.positiveInt('Trick ID'),
    timesTrained: commonValidations.positiveInt('Times trained').default(1),
    isBonus: z.boolean().default(false),
    fromPurpose: z.boolean().default(false),
});

export const CharacterCompanionSkillDraftSchema = z.object({
    id: z.number().int(),
    skillId: commonValidations.positiveInt('Skill ID'),
    skillSubId: commonValidations.positiveInt('Skill sub ID').nullable().optional(),
    ranks: z.number().int().min(0, 'Ranks must be non-negative'),
});

export const CharacterCompanionFeatDraftSchema = z.object({
    id: z.number().int(),
    featId: commonValidations.positiveInt('Feat ID'),
    notes: z.string().max(128, 'Notes must be less than 128 characters').nullable().optional(),
});

export const CharacterCompanionDraftSchema = CharacterCompanionSchema.omit({
    id: true,
    characterId: true,
}).extend({
    id: z.number().int(),
    characterId: z.number().int(),
    tricks: z.array(CharacterCompanionTrickDraftSchema).optional(),
    skills: z.array(CharacterCompanionSkillDraftSchema).optional(),
    feats: z.array(CharacterCompanionFeatDraftSchema).optional(),
});

export const CompanionWithRelationsSchema = CompanionSchema.extend({
    features: z.array(FeatureResponseSchema).optional(),
});

export const CharacterCompanionTrickWithRelationsSchema = CharacterCompanionTrickSchema.extend({
    trick: TrickSchema.optional(),
});

export const CharacterCompanionWithRelationsSchema = CharacterCompanionSchema.extend({
    companion: CompanionSchema.omit({ id: true }).optional(),
    trickPurpose: TrickPurposeSchema.optional(),
    tricks: z.array(CharacterCompanionTrickWithRelationsSchema).optional(),
    skills: z.array(CharacterCompanionSkillSchema).optional(),
    feats: z.array(CharacterCompanionFeatSchema).optional(),
});

export const CreateCompanionSchema = CompanionSchema.omit({
    id: true,
});

export const UpdateCompanionSchema = CreateCompanionSchema.partial();

export const CreateCharacterCompanionSchema = CharacterCompanionSchema.omit({
    id: true,
}).extend({
    tricks: z.array(CharacterCompanionTrickInputSchema).optional(),
    skills: z.array(CharacterCompanionSkillInputSchema).optional(),
    feats: z.array(CharacterCompanionFeatInputSchema).optional(),
});

export const UpdateCharacterCompanionSchema = CreateCharacterCompanionSchema.partial();

export const CompanionIdParamSchema = z.object({
    id: numericParam(),
});

export const CharacterCompanionIdParamSchema = z.object({
    id: numericParam(),
});

export const CharacterCompanionCharacterIdParamSchema = z.object({
    characterId: numericParam(),
});

export const GetAllCompanionsResponseSchema = QueryResponseSchema.extend({
    results: z.array(CompanionWithRelationsSchema),
});

export const GetCompanionResponseSchema = CompanionWithRelationsSchema;

export const GetAllCharacterCompanionsResponseSchema = QueryResponseSchema.extend({
    results: z.array(CharacterCompanionWithRelationsSchema),
});

export const CompanionCacheSchema = CompanionSchema.extend({
    name: z.string().min(1, 'Companion name is required'),
});

export const CompanionCacheResponseSchema = QueryResponseSchema.extend({
    results: z.array(CompanionCacheSchema),
});

export const CompanionComputedStatBlockSchema = GetMonsterResponseSchema.extend({
    id: commonValidations.positiveInt('Monster ID'),
});

export const ResolvedCompanionSpecialSchema = z.object({
    slug: commonValidations.slug(),
    name: commonValidations.name(),
    description: z.string().max(10000).nullable().optional(),
});

export const ResolvedCompanionProgressionSchema = z.object({
    effectiveLevel: z.number().int().min(0),
    bonusHd: z.number().int().min(0),
    naturalArmorAdj: z.number().int().min(0),
    strAdj: z.number().int().min(0),
    dexAdj: z.number().int().min(0),
    bonusTricks: z.number().int().min(0),
    specials: z.array(ResolvedCompanionSpecialSchema),
});

export const CompanionBudgetsSchema = z.object({
    trainedSlotsUsed: z.number().int().min(0),
    trainedSlotsMax: z.number().int().min(0),
    bonusSlotsUsed: z.number().int().min(0),
    bonusSlotsMax: z.number().int().min(0),
    skillPointsUsed: z.number().int().min(0),
    skillPointsMax: z.number().int().min(0),
    featSlotsUsed: z.number().int().min(0),
    featSlotsMax: z.number().int().min(0),
});

export const ResolvedCharacterCompanionSchema = CharacterCompanionWithRelationsSchema.extend({
    role: z.number().int().min(0),
    computedStatBlock: CompanionComputedStatBlockSchema.optional(),
    progression: ResolvedCompanionProgressionSchema.nullable().optional(),
    budgets: CompanionBudgetsSchema,
});

/**
 * Draft-safe resolved companion. IDs may be negative while the character session is unsaved.
 * This is what character resolution stores on ResolvedCharacterResult.
 */
export const CharacterCompanionTrickResolvedDraftSchema = CharacterCompanionTrickDraftSchema.extend({
    trick: TrickSchema.optional(),
});

export const ResolvedCharacterCompanionDraftSchema = CharacterCompanionDraftSchema.extend({
    companion: CompanionSchema.omit({ id: true }).optional(),
    trickPurpose: TrickPurposeSchema.optional(),
    tricks: z.array(CharacterCompanionTrickResolvedDraftSchema).optional(),
    role: z.number().int().min(0),
    computedStatBlock: CompanionComputedStatBlockSchema.optional(),
    progression: ResolvedCompanionProgressionSchema.nullable().optional(),
    budgets: CompanionBudgetsSchema,
});

export const GetResolvedCharacterCompanionsResponseSchema = QueryResponseSchema.extend({
    results: z.array(ResolvedCharacterCompanionSchema),
});

export type Companion = z.infer<typeof CompanionSchema>;
export type CompanionWithRelations = z.infer<typeof CompanionWithRelationsSchema>;
export type CharacterCompanion = z.infer<typeof CharacterCompanionSchema>;
export type CharacterCompanionWithRelations = z.infer<typeof CharacterCompanionWithRelationsSchema>;
export type CharacterCompanionSkill = z.infer<typeof CharacterCompanionSkillSchema>;
export type CharacterCompanionSkillInput = z.infer<typeof CharacterCompanionSkillInputSchema>;
export type CharacterCompanionFeat = z.infer<typeof CharacterCompanionFeatSchema>;
export type CharacterCompanionFeatInput = z.infer<typeof CharacterCompanionFeatInputSchema>;
export type CharacterCompanionTrickDraft = z.infer<typeof CharacterCompanionTrickDraftSchema>;
export type CharacterCompanionSkillDraft = z.infer<typeof CharacterCompanionSkillDraftSchema>;
export type CharacterCompanionFeatDraft = z.infer<typeof CharacterCompanionFeatDraftSchema>;
export type CharacterCompanionDraft = z.infer<typeof CharacterCompanionDraftSchema>;
export type CreateCompanionRequest = z.infer<typeof CreateCompanionSchema>;
export type UpdateCompanionRequest = z.infer<typeof UpdateCompanionSchema>;
export type CreateCharacterCompanionRequest = z.infer<typeof CreateCharacterCompanionSchema>;
export type UpdateCharacterCompanionRequest = z.infer<typeof UpdateCharacterCompanionSchema>;
export type CompanionIdParamRequest = z.infer<typeof CompanionIdParamSchema>;
export type CharacterCompanionIdParamRequest = z.infer<typeof CharacterCompanionIdParamSchema>;
export type CharacterCompanionCharacterIdParamRequest = z.infer<typeof CharacterCompanionCharacterIdParamSchema>;
export type GetAllCompanionsResponse = z.infer<typeof GetAllCompanionsResponseSchema>;
export type GetCompanionResponse = z.infer<typeof GetCompanionResponseSchema>;
export type GetAllCharacterCompanionsResponse = z.infer<typeof GetAllCharacterCompanionsResponseSchema>;
export type CompanionCacheEntry = z.infer<typeof CompanionCacheSchema>;
export type CompanionCacheResponse = z.infer<typeof CompanionCacheResponseSchema>;
export type CompanionComputedStatBlock = z.infer<typeof CompanionComputedStatBlockSchema>;
export type ResolvedCompanionSpecial = z.infer<typeof ResolvedCompanionSpecialSchema>;
export type ResolvedCompanionProgression = z.infer<typeof ResolvedCompanionProgressionSchema>;
export type CompanionBudgets = z.infer<typeof CompanionBudgetsSchema>;
export type CharacterCompanionTrickResolvedDraft = z.infer<typeof CharacterCompanionTrickResolvedDraftSchema>;
export type ResolvedCharacterCompanionDraft = z.infer<typeof ResolvedCharacterCompanionDraftSchema>;
export type ResolvedCharacterCompanion = z.infer<typeof ResolvedCharacterCompanionSchema>;
export type GetResolvedCharacterCompanionsResponse = z.infer<typeof GetResolvedCharacterCompanionsResponseSchema>;

export { CreateResponse, UpdateResponse } from './common';

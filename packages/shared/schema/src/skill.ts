import { z } from 'zod';

import { commonValidations, numericParam } from './common.js';
import { QueryResponseSchema } from './query.js';
import { SourceMapSchema } from './sourcebook.js';

export const SkillIdParamSchema = z.object({
    id: numericParam(),
});

export const SkillSchema = z.object({
    id: commonValidations.positiveInt('Skill ID'),
    name: commonValidations.name(),
    abilityId: commonValidations.nonNegativeInt('Ability ID'),
    trainedOnly: z.boolean().nullable(),
    affectedByArmor: z.boolean().default(false),
    isAnalog: z.boolean().default(false),
    description: z.string().max(10000, 'Description must be less than 10000 characters').nullish(),
    checkDescription: z.string().max(10000, 'Check description must be less than 10000 characters').nullish(),
    actionDescription: z.string().max(10000, 'Action description must be less than 10000 characters').nullish(),
    retryTypeId: commonValidations.nonNegativeInt('Retry type ID').nullish(),
    retryDescription: z.string().max(10000, 'Retry description must be less than 10000 characters').nullish(),
    specialNotes: z.string().max(10000, 'Special notes must be less than 10000 characters').nullish(),
    synergyNotes: z.string().max(10000, 'Synergy notes must be less than 10000 characters').nullish(),
    untrainedNotes: z.string().max(10000, 'Untrained notes must be less than 10000 characters').nullish(),
    restrictionNotes: z.string().max(10000, 'Restriction notes must be less than 10000 characters').nullish(),
    isVisible: z.boolean().default(true),
    editionId: commonValidations.positiveInt('Edition ID'),
    hasSubtypes: z.boolean().default(false),
    usesCustomSubtype: z.boolean().default(false),
    hasNoMaxRanks: z.boolean().default(false),
    doubleArmorPenalty: z.boolean().default(false),
    sourceBookInfo: z.array(SourceMapSchema).optional(),
});

export const SkillSubtypeCacheSchema = z.object({
    id: commonValidations.positiveInt('Skill Subtype ID'),
    name: z.string().min(1, 'Skill subtype name is required'),
    editionId: commonValidations.positiveInt('Edition ID'),
    isVisible: z.boolean().default(true),
});

export const SkillCacheSchema = SkillSchema.omit({
    affectedByArmor: true,
    retryTypeId: true,
    specialNotes: true,
    synergyNotes: true,
    untrainedNotes: true,
    restrictionNotes: true,
    description: true,
    checkDescription: true,
    actionDescription: true,
    retryDescription: true,
    sourceBookInfo: true,
}).extend({
    hasSubtypes: z.boolean().default(false),
    usesCustomSubtype: z.boolean().default(false),
    hasNoMaxRanks: z.boolean().default(false),
    doubleArmorPenalty: z.boolean().default(false),
    subtypes: z.array(SkillSubtypeCacheSchema).optional(),
});

export const SkillCacheResponseSchema = QueryResponseSchema.extend({
    results: z.array(SkillCacheSchema),
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

export type SkillSubtypeCacheEntry = z.infer<typeof SkillSubtypeCacheSchema>;
export type SkillCacheEntry = z.infer<typeof SkillCacheSchema>;
export type SkillCacheResponse = z.infer<typeof SkillCacheResponseSchema>;


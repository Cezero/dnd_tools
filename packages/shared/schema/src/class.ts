import { z } from 'zod';
import { QueryResponseSchema } from './query.js';
import { SourceMapSchema } from './sourcebook.js';
import { CastingType, ProgressionType } from '@shared/static-data';
import { CreateFeatureProgressionSchema, FeatureProgressionSchema } from './feature.js';
import { CreateSpellcastingProgressionSchema, SpellcastingProgressionWithSlotsSchema } from './spellcasting.js';

// Simplified schema for character feature choices (for enriching progressions)
// Shared between class and race endpoints
export const CharacterFeatureChoiceForEnrichmentSchema = z.object({
    progressionId: z.number().int().positive('Progression ID must be a positive integer'),
    featureEntityId: z.number().int().positive('Feature entity ID must be a positive integer'),
    appliesToId: z.number().int().positive('Applies to ID must be a positive integer').nullable(),
    appliesToSubId: z.number().int().nullable(),
});

export const BaseClassSchema = z.object({
    name: z.string()
        .min(1, 'Class name is required')
        .max(100, 'Class name must be less than 100 characters')
        .trim(),
    abbreviation: z.string()
        .min(1, 'Class abbreviation is required')
        .max(10, 'Class abbreviation must be less than 10 characters')
        .trim(),
    editionId: z.number().int().positive('Edition ID must be a positive integer'),
    isPrestige: z.boolean().default(false),
    isVisible: z.boolean().default(true),
    canCastSpells: z.boolean().default(false),
    spellsKnown: z.boolean().default(false),
    isDivine: z.boolean().default(false),
    hitDie: z.number().int().min(0, 'Hit die must be at least 0').max(20, 'Hit die must be at most 20'),
    skillPoints: z.number().int().min(0, 'Skill points must be non-negative').max(100, 'Skill points must be less than 100'),
    castingAbilityId: z.number().int().positive('Casting ability ID must be a positive integer').nullable(),
    castingType: z.enum(CastingType).nullable(),
    babProgression: z.enum(ProgressionType),
    fortProgression: z.enum(ProgressionType),
    refProgression: z.enum(ProgressionType),
    willProgression: z.enum(ProgressionType),
    description: z.string().max(10000, 'Description must be less than 10000 characters').nullable(),
    sourceBookInfo: z.array(SourceMapSchema).nullable(),
    features: z.array(FeatureProgressionSchema).nullable(),
    spellcastingProgression: z.array(SpellcastingProgressionWithSlotsSchema).optional().nullable(),
    spellsKnownProgression: z.array(SpellcastingProgressionWithSlotsSchema).optional().nullable(),
});

export const ClassIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

// Query schema for optional character feature choices
export const ClassIdQuerySchema = z.object({
    characterFeatureChoices: z.string().optional().transform((val) => {
        if (!val) return undefined;
        try {
            return JSON.parse(val) as z.infer<typeof CharacterFeatureChoiceForEnrichmentSchema>[];
        } catch {
            return undefined;
        }
    }),
});

export const ClassSummarySchema = BaseClassSchema.omit({
    features: true,
    spellcastingProgression: true,
    spellsKnownProgression: true,
}).extend({
    id: z.number().int().positive('Class ID must be a positive integer'),
});

export const ClassCacheSchema = ClassSummarySchema.omit({
    spellsKnown: true,
    hitDie: true,
    skillPoints: true,
    castingAbilityId: true,
    castingType: true,
    babProgression: true,
    fortProgression: true,
    refProgression: true,
    willProgression: true,
    description: true,
    sourceBookInfo: true,
});

export const GetAllClassesQuerySchema = z.object({
    baseClassesOnly: z.boolean().optional(),
    isVisible: z.boolean().optional(),
    isPrestige: z.boolean().optional(),
    canCastSpells: z.boolean().optional(),
    editionId: z.number().int().positive().optional(),
    editionIds: z.array(z.number().int().positive()).optional(),
});

export const ClassCacheResponseSchema = QueryResponseSchema.extend({
    results: z.array(ClassCacheSchema),
});

export const GetAllClassesResponseSchema = QueryResponseSchema.extend({
    results: z.array(ClassSummarySchema),
});

export const UpdateClassSchema = BaseClassSchema.omit({
    features: true,
    spellcastingProgression: true,
    spellsKnownProgression: true,
}).extend({
    features: z.array(CreateFeatureProgressionSchema).nullable(),
    spellcastingProgression: z.array(CreateSpellcastingProgressionSchema).nullable(),
    spellsKnownProgression: z.array(CreateSpellcastingProgressionSchema).nullable(),
}).partial();

export const CreateClassSchema = BaseClassSchema.omit({
    features: true,
    spellcastingProgression: true,
    spellsKnownProgression: true,
}).extend({
    features: z.array(CreateFeatureProgressionSchema).nullable(),
    spellcastingProgression: z.array(CreateSpellcastingProgressionSchema).nullable(),
    spellsKnownProgression: z.array(CreateSpellcastingProgressionSchema).nullable(),
});

export type ClassSummary = z.infer<typeof ClassSummarySchema>;
export type ClassIdParamRequest = z.infer<typeof ClassIdParamSchema>;
export type ClassIdQueryRequest = z.infer<typeof ClassIdQuerySchema>;
export type CharacterFeatureChoiceForEnrichment = z.infer<typeof CharacterFeatureChoiceForEnrichmentSchema>;
export type GetAllClassesQuery = z.infer<typeof GetAllClassesQuerySchema>;
export type GetAllClassesResponse = z.infer<typeof GetAllClassesResponseSchema>;
export type CreateClassRequest = z.infer<typeof CreateClassSchema>;
export type UpdateClassRequest = z.infer<typeof UpdateClassSchema>;
export type DnDClass = z.infer<typeof BaseClassSchema>;

export type ClassCacheResponse = z.infer<typeof ClassCacheResponseSchema>;
export type ClassCacheEntry = z.infer<typeof ClassCacheSchema>;

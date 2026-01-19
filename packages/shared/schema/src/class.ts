import { z } from 'zod';

import { numericParam, optionalBooleanParam, commonValidations } from './common.js';
import { QueryResponseSchema } from './query.js';
import { SourceMapSchema } from './sourcebook.js';
import { CastingType, ProgressionType } from '@shared/static-data';
import { CreateFeatureProgressionRequestSchema, FeatureProgressionResponseSchema, UpdateFeatureProgressionSchema } from './feature.js';
import { CreateSpellcastingProgressionSchema, SpellcastingProgressionWithSlotsSchema } from './spellcasting.js';

// Simplified schema for character feature choices (for enriching progressions)
// Shared between class and race endpoints
export const CharacterFeatureChoiceForEnrichmentSchema = z.object({
    progressionId: commonValidations.positiveInt('Progression ID'),
    featureEntityId: commonValidations.positiveInt('Feature entity ID'),
    appliesToId: commonValidations.positiveInt('Applies to ID').nullable(),
    appliesToSubId: z.number().int().nullable(),
});

export const BaseClassSchema = z.object({
    name: commonValidations.name(),
    abbreviation: z.string()
        .min(1, 'Class abbreviation is required')
        .max(10, 'Class abbreviation must be less than 10 characters')
        .trim(),
    editionId: commonValidations.positiveInt('Edition ID'),
    isPrestige: z.boolean().default(false),
    isVisible: z.boolean().default(true),
    canCastSpells: z.boolean().default(false),
    spellsKnown: z.boolean().default(false),
    isDivine: z.boolean().default(false),
    description: commonValidations.description(10000).nullable(),
    sourceBookInfo: z.array(SourceMapSchema).nullable(),
    features: z.array(FeatureProgressionResponseSchema).nullable(),
    spellcastingProgression: z.array(SpellcastingProgressionWithSlotsSchema).optional().nullable(),
    spellsKnownProgression: z.array(SpellcastingProgressionWithSlotsSchema).optional().nullable(),
});

export const ClassIdParamSchema = z.object({
    id: numericParam(),
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
    id: commonValidations.positiveInt('Class ID'),
});

export const ClassCacheSchema = ClassSummarySchema.omit({
    spellsKnown: true,
    description: true,
    sourceBookInfo: true,
});

export const GetAllClassesQuerySchema = z.object({
    baseClassesOnly: optionalBooleanParam(),
    isVisible: optionalBooleanParam(),
    isPrestige: optionalBooleanParam(),
    canCastSpells: optionalBooleanParam(),
    editionId: commonValidations.positiveInt().optional(),
    editionIds: z.array(commonValidations.positiveInt()).optional(),
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
    features: z.array(UpdateFeatureProgressionSchema).nullable(),
    spellcastingProgression: z.array(CreateSpellcastingProgressionSchema).nullable(),
    spellsKnownProgression: z.array(CreateSpellcastingProgressionSchema).nullable(),
}).partial();

export const CreateClassSchema = BaseClassSchema.omit({
    features: true,
    spellcastingProgression: true,
    spellsKnownProgression: true,
}).extend({
    features: z.array(UpdateFeatureProgressionSchema).nullable(),
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

import { z } from 'zod';

import { numericParam, optionalBooleanParam, commonValidations } from './common.js';
import { QueryResponseSchema } from './query.js';
import { SourceMapSchema } from './sourcebook.js';
import { FeatureResponseSchema, UpdateFeatureSchema } from './feature.js';
import { CreateSpellcastingProgressionSchema, SpellcastingProgressionWithSlotsSchema } from './spellcasting.js';
import { ValidationErrorResponseSchema } from './validation.js';

// Simplified schema for character feature choices (for enriching progressions)
// Shared between class and race endpoints
export const CharacterFeatureChoiceForEnrichmentSchema = z.object({
    featureId: commonValidations.positiveInt('Feature ID'),
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
    featureIds: z.array(z.number().int()),
    spellcastingProgression: z.array(SpellcastingProgressionWithSlotsSchema).optional().nullable(),
    spellsKnownProgression: z.array(SpellcastingProgressionWithSlotsSchema).optional().nullable(),
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

/**
 * Summary schema for class list and cache. Omits `featureIds` (and progressions); used for
 * getAllClasses and classes-cache. For `featureIds`, use getClassById (DnDClass/BaseClassSchema).
 */
export const ClassSummarySchema = BaseClassSchema.omit({
    spellcastingProgression: true,
    spellsKnownProgression: true,
    featureIds: true,  // not needed for list/cache; getClassById returns BaseClassSchema with featureIds
}).extend({
    id: commonValidations.positiveInt('Class ID'),
});

/**
 * Lightweight class schema for classes-cache. Omits `spellsKnown`, `description`, `sourceBookInfo`
 * for size; does not include `featureIds`. Used for dropdowns and lookups (e.g. getClassSummaryById).
 * ClassList uses getClasses (ClassSummary) instead: the cache omits `description` and `sourceBookInfo`,
 * which ClassList's Description and Source columns need; we do not expand the cache by design.
 */
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
    spellcastingProgression: true,
    spellsKnownProgression: true,
}).extend({
    spellcastingProgression: z.array(CreateSpellcastingProgressionSchema).nullable(),
    spellsKnownProgression: z.array(CreateSpellcastingProgressionSchema).nullable(),
}).partial();

export const CreateClassSchema = BaseClassSchema.omit({
    spellcastingProgression: true,
    spellsKnownProgression: true,
}).extend({
    spellcastingProgression: z.array(CreateSpellcastingProgressionSchema).nullable(),
    spellsKnownProgression: z.array(CreateSpellcastingProgressionSchema).nullable(),
});

export type ClassSummary = z.infer<typeof ClassSummarySchema>;
export type ClassIdQueryRequest = z.infer<typeof ClassIdQuerySchema>;
export type CharacterFeatureChoiceForEnrichment = z.infer<typeof CharacterFeatureChoiceForEnrichmentSchema>;
export type GetAllClassesQuery = z.infer<typeof GetAllClassesQuerySchema>;
export type GetAllClassesResponse = z.infer<typeof GetAllClassesResponseSchema>;
export type CreateClassRequest = z.infer<typeof CreateClassSchema>;
export type UpdateClassRequest = z.infer<typeof UpdateClassSchema>;
export type DnDClass = z.infer<typeof BaseClassSchema>;

export type ClassCacheResponse = z.infer<typeof ClassCacheResponseSchema>;
export type ClassCacheEntry = z.infer<typeof ClassCacheSchema>;

// Class Edit State Schema
export const ClassEditStateSchema = z.object({
    classId: z.number().int().nullable(),
    name: z.string(),
    abbreviation: z.string(),
    editionId: commonValidations.positiveInt(),
    isPrestige: z.boolean(),
    isVisible: z.boolean(),
    canCastSpells: z.boolean(),
    spellsKnown: z.boolean(),
    isDivine: z.boolean(),
    description: z.string().nullable(),
    sourceBookInfo: z.array(SourceMapSchema).nullable(),
    featureIds: z.array(z.number().int()),
    spellcastingProgression: z.array(SpellcastingProgressionWithSlotsSchema),
    spellsKnownProgression: z.array(SpellcastingProgressionWithSlotsSchema),
});

/**
 * Draft-state schema for Class editing.
 *
 * Supports both persisted and draft-only ids:
 * - `classId > 0`: persisted class being edited
 * - `classId < 0`: draft-only class being created
 */
export const ClassDraftStateSchema = ClassEditStateSchema.extend({
    classId: z.number().int(),
});

// Schema for class entity with ID (used in resolution system)
// Extends BaseClassSchema with id field for cases where ID is needed
export const ClassWithIdSchema = BaseClassSchema.extend({
    id: commonValidations.positiveInt('Class ID'),
});

// Class Resolution TypeScript type exports
export type ClassEditState = z.infer<typeof ClassEditStateSchema>;
export type ClassDraftState = z.infer<typeof ClassDraftStateSchema>;
export type ClassWithId = z.infer<typeof ClassWithIdSchema>;

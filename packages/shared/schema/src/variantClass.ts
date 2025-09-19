import { z } from 'zod';
import { ProgressionType } from '@shared/static-data';
import { QueryResponseSchema } from './query.js';
import { SourceMapSchema } from './sourcebook.js';
import { CreateFeatureProgressionSchema, FeatureProgressionSchema } from './feature.js';



// Remove entity mapping schema - for entities to remove from original progression (with IDs)
export const BaseClassVariantFeatureProgressionRemoveEntityMapSchema = z.object({
    classVariantFeatureProgressionOverrideId: z.number().int().positive('Class variant feature progression override ID must be a positive integer'),
    featureEntityId: z.number().int().positive('Feature entity ID must be a positive integer'),
});

// Remove entity mapping create schema - for entities to remove from original progression (no IDs)
export const ClassVariantFeatureProgressionRemoveEntityMapCreateSchema = BaseClassVariantFeatureProgressionRemoveEntityMapSchema.omit({
    classVariantFeatureProgressionOverrideId: true,
});

// Feature progression override schema - operates on FeatureProgressions, NOT Features
export const BaseClassVariantFeatureProgressionOverrideSchema = z.object({
    id: z.number().int().positive('Feature progression override ID must be a positive integer'),
    variantId: z.number().int().positive('Variant ID must be a positive integer'),
    originalFeatureProgressionId: z.number().int().positive('Original feature progression ID must be a positive integer').nullable(),
    removeEntities: z.array(BaseClassVariantFeatureProgressionRemoveEntityMapSchema).nullable(),
    replacementFeatureProgression: z.array(FeatureProgressionSchema).nullable(),
});

// Feature progression override create schema - operates on FeatureProgressions, NOT Features (no IDs)
export const ClassVariantFeatureProgressionOverrideCreateSchema = BaseClassVariantFeatureProgressionOverrideSchema.omit({
    id: true,
    variantId: true,
    replacementFeatureProgression: true,
    removeEntities: true,
}).extend({
    removeEntities: z.array(ClassVariantFeatureProgressionRemoveEntityMapCreateSchema).nullable(),
    replacementFeatureProgression: z.array(CreateFeatureProgressionSchema).nullable(),
});

// Spell override schema
export const BaseClassVariantSpellOverrideSchema = z.object({
    id: z.number().int().positive('Spell override ID must be a positive integer'),
    variantId: z.number().int().positive('Variant ID must be a positive integer'),
    spellId: z.number().int().positive('Spell ID must be a positive integer'),
    level: z.number().int().min(-1, 'Level must be at least -1 (for removals)').max(9, 'Level must be at most 9'),
});

// Spell override create schema (no IDs)
export const ClassVariantSpellOverrideCreateSchema = BaseClassVariantSpellOverrideSchema.omit({
    id: true,
    variantId: true,
});

// Base variant class schema (no ID - follows established pattern)
export const BaseClassVariantSchema = z.object({
    name: z.string()
        .min(1, 'Variant name is required')
        .max(100, 'Variant name must be less than 100 characters')
        .trim(),
    abbreviation: z.string()
        .min(1, 'Variant abbreviation is required')
        .max(10, 'Variant abbreviation must be less than 10 characters')
        .trim(),
    baseClassId: z.number().int().positive('Base class ID must be a positive integer'),
    description: z.string().max(10000, 'Description must be less than 10000 characters').nullable(),

    // Override fields for class properties (nullable for database storage)
    hitDie: z.number().int().min(0, 'Hit die must be at least 0').max(20, 'Hit die must be at most 20').nullable(),
    skillPoints: z.number().int().min(0, 'Skill points must be non-negative').max(100, 'Skill points must be less than 100').nullable(),
    babProgression: z.enum(ProgressionType).nullable(),
    fortProgression: z.enum(ProgressionType).nullable(),
    refProgression: z.enum(ProgressionType).nullable(),
    willProgression: z.enum(ProgressionType).nullable(),

    // Sourcebook information for the variant
    sourceBookInfo: z.array(SourceMapSchema).nullable(),
    featureProgressionOverrides: z.array(BaseClassVariantFeatureProgressionOverrideSchema).nullable(),
    spellOverrides: z.array(BaseClassVariantSpellOverrideSchema).nullable(),
});

// Summary schema for lists (includes ID)
export const ClassVariantSummarySchema = BaseClassVariantSchema.extend({
    id: z.number().int().positive('Variant ID must be a positive integer'),
});

// Create schemas for API requests
export const CreateClassVariantSchema = BaseClassVariantSchema.omit({
    featureProgressionOverrides: true,
    spellOverrides: true,
}).extend({
    featureProgressionOverrides: z.array(ClassVariantFeatureProgressionOverrideCreateSchema).nullable(),
    spellOverrides: z.array(ClassVariantSpellOverrideCreateSchema).nullable(),
});

export const UpdateClassVariantSchema = CreateClassVariantSchema.partial();

// Parameter schemas
export const VariantIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});


// Type exports
export type ClassVariant = z.infer<typeof BaseClassVariantSchema>;
export type ClassVariantSummary = z.infer<typeof ClassVariantSummarySchema>;
export type ClassVariantFeatureProgressionOverride = z.infer<typeof BaseClassVariantFeatureProgressionOverrideSchema>;
export type ClassVariantFeatureProgressionRemoveEntityMap = z.infer<typeof BaseClassVariantFeatureProgressionRemoveEntityMapSchema>;
export type ClassVariantSpellOverride = z.infer<typeof BaseClassVariantSpellOverrideSchema>;
export type CreateClassVariantRequest = z.infer<typeof CreateClassVariantSchema>;
export type UpdateClassVariantRequest = z.infer<typeof UpdateClassVariantSchema>;
export type VariantIdParamRequest = z.infer<typeof VariantIdParamSchema>;

// Create schema type exports
export type ClassVariantFeatureProgressionOverrideCreate = z.infer<typeof ClassVariantFeatureProgressionOverrideCreateSchema>;
export type ClassVariantFeatureProgressionRemoveEntityMapCreate = z.infer<typeof ClassVariantFeatureProgressionRemoveEntityMapCreateSchema>;
export type ClassVariantSpellOverrideCreate = z.infer<typeof ClassVariantSpellOverrideCreateSchema>;

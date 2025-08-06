import z from "zod";
import { FeatureModifierType, FeatureSpecialEffectType, FeatureSourceType } from "@shared/static-data";
import { SpellcastingLinkSchema } from "./spellcasting";
import { QueryResponseSchema } from "./query";



// Enum schemas
export const ChoiceTypeEnumSchema = z.enum(['Feat', 'Feature']);
export const ChoiceBehaviorEnumSchema = z.enum(['Single', 'Multiple', 'Allocation']);

export const FeatureSchema = z.object({
    id: z.number().int().positive('Feature ID must be a positive integer'),
    slug: z.string().min(1, 'Feature slug is required').max(100, 'Feature slug must be less than 100 characters').trim(),
    name: z.string().min(1, 'Feature name is required').max(100, 'Feature name must be less than 100 characters').trim(),
    description: z.string().max(10000, 'Description must be less than 10000 characters'),
});

export const FeatureProgressionSchema = z.object({
    id: z.number().int().positive('Progression ID must be a positive integer'),
    sourceType: z.number().int().min(0, 'Source type must be at least 0').max(1, 'Source type must be at most 1'),
    level: z.number().int().min(1, 'Level must be at least 1').max(20, 'Level must be at most 20'),
    featureId: z.number().int().positive('Feature ID must be a positive integer'),
    appliesToType: z.number().int().nullable(),
    appliesTo: z.number().int().nullable(),
    classId: z.number().int().nullable(),
    raceId: z.number().int().nullable(),
});

export const FeatureModifierSchema = z.object({
    id: z.number().int().positive('Modifier ID must be a positive integer'),
    featureProgressionId: z.number().int().positive('Feature progression ID must be a positive integer'),
    modifierType: z.number().int(),
    value: z.number().int(),
    appliesIfChoiceKey: z.string().nullable(),
    appliesIfChoiceValue: z.string().nullable(),
});

export const FeatureSpecialEffectSchema = z.object({
    id: z.number().int().positive('Special effect ID must be a positive integer'),
    progressionId: z.number().int().positive('Progression ID must be a positive integer'),
    effectType: z.number().int(),
    key: z.string().nullable(),
    value: z.string().nullable(),
    numericValue: z.number().int().nullable(),
});

export const FeatureChoiceSchema = z.object({
    id: z.number().int().positive('Choice ID must be a positive integer'),
    progressionId: z.number().int().positive('Progression ID must be a positive integer'),
    label: z.string().nullable(),
    pickCount: z.number().int().nullable(),
    choiceType: ChoiceTypeEnumSchema,
    choiceBehavior: ChoiceBehaviorEnumSchema,
    featId: z.number().int().positive('Feat ID must be a positive integer').nullable(),
    chosenFeatureId: z.number().int().positive('Chosen feature ID must be a positive integer').nullable(),
});

// Schema for FeatureChoice with feat and feature relations included
export const FeatureChoiceWithFeatSchema = FeatureChoiceSchema.extend({
    feat: z.object({
        id: z.number().int().positive('Feat ID must be a positive integer'),
        name: z.string().min(1, 'Feat name is required'),
    }).nullable(),
    feature: z.object({
        id: z.number().int().positive('Feature ID must be a positive integer'),
        name: z.string().min(1, 'Feature name is required'),
        slug: z.string().min(1, 'Feature slug is required'),
    }).nullable(),
});

export const FeatureIdParamSchema = z.object({
    id: z.number().int().positive('Feature ID must be a positive integer'),
});

export const FeatureSlugParamSchema = z.object({
    slug: z.string().min(1, 'Feature slug is required').max(100, 'Feature slug must be less than 100 characters').trim(),
});

export const FeatureQuerySchema = z.object({
    sourceType: z.nativeEnum(FeatureSourceType).optional(),
});

// Request schemas for managing relationships
export const CreateFeatureProgressionSchema = FeatureProgressionSchema.omit({
    id: true,
});

export const UpdateFeatureProgressionSchema = FeatureProgressionSchema.partial().omit({
    id: true,
});

export const CreateFeatureModifierSchema = FeatureModifierSchema.omit({
    id: true,
});

export const UpdateFeatureModifierSchema = FeatureModifierSchema.partial().omit({
    id: true,
});

export const CreateFeatureSpecialEffectSchema = FeatureSpecialEffectSchema.omit({
    id: true,
});

export const UpdateFeatureSpecialEffectSchema = FeatureSpecialEffectSchema.partial().omit({
    id: true,
});

export const CreateFeatureChoiceSchema = FeatureChoiceSchema.omit({
    id: true,
});

export const UpdateFeatureChoiceSchema = FeatureChoiceSchema.partial().omit({
    id: true,
});

// Bulk creation schemas for creating progressions with related entities
export const CreateFeatureModifierForBulkSchema = FeatureModifierSchema.omit({
    id: true,
    featureProgressionId: true, // Will be set by backend
});

export const CreateFeatureChoiceForBulkSchema = FeatureChoiceSchema.omit({
    id: true,
    progressionId: true, // Will be set by backend
});

export const CreateFeatureSpecialEffectForBulkSchema = FeatureSpecialEffectSchema.omit({
    id: true,
    progressionId: true, // Will be set by backend
});

export const CreateFeatureProgressionWithRelationsSchema = FeatureProgressionSchema.omit({
    id: true,
}).extend({
    feature: FeatureSchema.optional(),
    modifiers: z.array(CreateFeatureModifierForBulkSchema).optional(),
    choices: z.array(CreateFeatureChoiceForBulkSchema).optional(),
    effects: z.array(CreateFeatureSpecialEffectForBulkSchema).optional(),
});

// Rich response schemas with relationships (defined after base schemas to avoid circular dependency)
export const FeatureProgressionWithRelationsSchema = FeatureProgressionSchema.extend({
    feature: FeatureSchema.optional(),
    class: z.object({
        name: z.string(),
        abbreviation: z.string(),
    }).optional(),
    modifiers: z.array(FeatureModifierSchema).optional(),
    choices: z.array(FeatureChoiceWithFeatSchema).optional(),
    effects: z.array(FeatureSpecialEffectSchema).optional(),
    spellcasting: SpellcastingLinkSchema.optional(),
});

export const FeatureWithRelationsSchema = FeatureSchema.extend({
    progressions: z.array(FeatureProgressionWithRelationsSchema).optional(),
    modifiers: z.array(FeatureModifierSchema).optional(),
});

export const GetAllFeaturesResponseSchema = QueryResponseSchema.extend({
    results: z.array(FeatureSchema),
});

export const GetFeatureResponseSchema = FeatureSchema;

export const UpdateFeatureSchema = FeatureSchema.partial();

export const CreateFeatureSchema = FeatureSchema.omit({
    id: true,
});

// New type exports for rich data and relationships
export type FeatureInQueryResponse = z.infer<typeof FeatureSchema>;
export type FeatureIdParamRequest = z.infer<typeof FeatureIdParamSchema>;
export type FeatureSlugParamRequest = z.infer<typeof FeatureSlugParamSchema>;
export type GetAllFeaturesResponse = z.infer<typeof GetAllFeaturesResponseSchema>;
export type CreateFeatureRequest = z.infer<typeof CreateFeatureSchema>;
export type UpdateFeatureRequest = z.infer<typeof UpdateFeatureSchema>;
export type GetFeatureResponse = z.infer<typeof GetFeatureResponseSchema>;
export type FeatureWithRelations = z.infer<typeof FeatureWithRelationsSchema>;
export type FeatureProgressionWithRelations = z.infer<typeof FeatureProgressionWithRelationsSchema>;
export type CreateFeatureProgressionRequest = z.infer<typeof CreateFeatureProgressionSchema>;
export type UpdateFeatureProgressionRequest = z.infer<typeof UpdateFeatureProgressionSchema>;
export type CreateFeatureModifierRequest = z.infer<typeof CreateFeatureModifierSchema>;
export type UpdateFeatureModifierRequest = z.infer<typeof UpdateFeatureModifierSchema>;
export type CreateFeatureSpecialEffectRequest = z.infer<typeof CreateFeatureSpecialEffectSchema>;
export type UpdateFeatureSpecialEffectRequest = z.infer<typeof UpdateFeatureSpecialEffectSchema>;
export type CreateFeatureChoiceRequest = z.infer<typeof CreateFeatureChoiceSchema>;
export type UpdateFeatureChoiceRequest = z.infer<typeof UpdateFeatureChoiceSchema>;

// Bulk creation type exports
export type CreateFeatureModifierForBulkRequest = z.infer<typeof CreateFeatureModifierForBulkSchema>;
export type CreateFeatureChoiceForBulkRequest = z.infer<typeof CreateFeatureChoiceForBulkSchema>;
export type CreateFeatureSpecialEffectForBulkRequest = z.infer<typeof CreateFeatureSpecialEffectForBulkSchema>;
export type CreateFeatureProgressionWithRelationsRequest = z.infer<typeof CreateFeatureProgressionWithRelationsSchema>;

// Enum type exports
export type ChoiceType = z.infer<typeof ChoiceTypeEnumSchema>;
export type ChoiceBehavior = z.infer<typeof ChoiceBehaviorEnumSchema>;

export type FeatureProgressionInQueryResponse = z.infer<typeof FeatureProgressionWithRelationsSchema>;
export type FeatureModifierInQueryResponse = z.infer<typeof FeatureModifierSchema>;
export type FeatureSpecialEffectInQueryResponse = z.infer<typeof FeatureSpecialEffectSchema>;
export type FeatureChoiceInQueryResponse = z.infer<typeof FeatureChoiceSchema>;

// Response schemas for collections
export const GetFeatureProgressionsResponseSchema = QueryResponseSchema.extend({
    results: z.array(FeatureProgressionWithRelationsSchema),
});

export const GetFeatureModifiersResponseSchema = QueryResponseSchema.extend({
    results: z.array(FeatureModifierSchema),
});

export const GetFeatureChoicesResponseSchema = QueryResponseSchema.extend({
    results: z.array(FeatureChoiceSchema),
});

export const GetFeatureSpecialEffectsResponseSchema = QueryResponseSchema.extend({
    results: z.array(FeatureSpecialEffectSchema),
});

// Type exports for response schemas
export type GetFeatureProgressionsResponse = z.infer<typeof GetFeatureProgressionsResponseSchema>;
export type GetFeatureModifiersResponse = z.infer<typeof GetFeatureModifiersResponseSchema>;
export type GetFeatureChoicesResponse = z.infer<typeof GetFeatureChoicesResponseSchema>;
export type GetFeatureSpecialEffectsResponse = z.infer<typeof GetFeatureSpecialEffectsResponseSchema>;

// Re-export common response types
export { CreateResponse, UpdateResponse } from './common';

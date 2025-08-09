import z from "zod";
import { ModifierType, ModifierAppliesToType, FeatureSpecialEffectType, FeatureSourceType, FeatureAppliesToType, FeatureBonusType, FeaturePrerequisiteType, FeatureModifierConditionType } from "@shared/static-data";
import { SpellcastingLinkSchema } from "./spellcasting";
import { QueryResponseSchema } from "./query";
import { FeatSchema } from "./feat";
import { ItemSchema } from "./item";

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
    appliesToType: z.nativeEnum(FeatureAppliesToType).nullable(),
    appliesTo: z.number().int().nullable(),
    classId: z.number().int().nullable(),
    raceId: z.number().int().nullable(),
});

export const FeatureModifierSchema = z.object({
    id: z.number().int().positive('Modifier ID must be a positive integer'),
    featureProgressionId: z.number().int().positive('Feature progression ID must be a positive integer'),
    type: z.nativeEnum(ModifierType),
    value: z.number().int(),
    bonusType: z.nativeEnum(FeatureBonusType).nullable(),
    appliesTo: z.nativeEnum(ModifierAppliesToType).nullable(),
    appliesToId: z.number().int().nullable(),
    appliesIfChoiceKey: z.string().nullable(),
    appliesIfChoiceValue: z.string().nullable(),
});

export const FeatureModifierConditionSchema = z.object({
    id: z.number().int().positive('Condition ID must be a positive integer'),
    featureModifierId: z.number().int().positive('Feature modifier ID must be a positive integer'),
    conditionType: z.nativeEnum(FeatureModifierConditionType),
    conditionValue: z.string().nullable(),
});

export const FeatureSpecialEffectSchema = z.object({
    id: z.number().int().positive('Special effect ID must be a positive integer'),
    progressionId: z.number().int().positive('Progression ID must be a positive integer'),
    effectType: z.nativeEnum(FeatureSpecialEffectType),
    key: z.string().nullable(),
    value: z.string().nullable(),
    numericValue: z.number().int().nullable(),
    featId: z.number().int().nullable(),
    itemId: z.number().int().nullable(),
});

export const FeaturePrerequisiteSchema = z.object({
    id: z.number().int().positive('Prerequisite ID must be a positive integer'),
    featureProgressionId: z.number().int().positive('Feature progression ID must be a positive integer'),
    type: z.nativeEnum(FeaturePrerequisiteType),
    skillId: z.number().int().nullable(),
    minValue: z.number().int(),
});

// Schema for FeatureSpecialEffect with feat and item relations included
export const FeatureSpecialEffectWithRelationsSchema = FeatureSpecialEffectSchema.extend({
    feat: FeatSchema.nullable(),
    item: ItemSchema.nullable(),
});

// Schema for FeatureModifier with conditions included
export const FeatureModifierWithConditionsSchema = FeatureModifierSchema.extend({
    conditions: z.array(FeatureModifierConditionSchema).optional(),
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

export const CreateFeaturePrerequisiteSchema = FeaturePrerequisiteSchema.omit({
    id: true,
});

export const UpdateFeaturePrerequisiteSchema = FeaturePrerequisiteSchema.partial().omit({
    id: true,
});

// FeatureModifierCondition CRUD schemas
export const CreateFeatureModifierConditionSchema = FeatureModifierConditionSchema.omit({
    id: true,
});

export const UpdateFeatureModifierConditionSchema = FeatureModifierConditionSchema.partial().omit({
    id: true,
});

export const CreateFeatureModifierConditionForBulkSchema = FeatureModifierConditionSchema.omit({
    id: true,
    featureModifierId: true, // Will be set by backend
});

export const CreateFeaturePrerequisiteForBulkSchema = FeaturePrerequisiteSchema.omit({
    id: true,
    featureProgressionId: true, // Will be set by backend
});

// Bulk creation schemas for creating progressions with related entities
export const CreateFeatureModifierForBulkSchema = FeatureModifierSchema.omit({
    id: true,
    featureProgressionId: true, // Will be set by backend
}).extend({
    conditions: z.array(CreateFeatureModifierConditionForBulkSchema).optional(),
});

export const CreateFeatureChoiceForBulkSchema = FeatureChoiceSchema.omit({
    id: true,
    progressionId: true, // Will be set by backend
});

export const CreateFeatureSpecialEffectForBulkSchema = FeatureSpecialEffectSchema.omit({
    id: true,
    progressionId: true, // Will be set by backend
}).extend({
    featId: z.number().int().nullable(),
    itemId: z.number().int().nullable(),
});

export const CreateFeatureProgressionWithRelationsSchema = FeatureProgressionSchema.omit({
    id: true,
}).extend({
    feature: FeatureSchema.optional(),
    modifiers: z.array(CreateFeatureModifierForBulkSchema).optional(),
    choices: z.array(CreateFeatureChoiceForBulkSchema).optional(),
    effects: z.array(CreateFeatureSpecialEffectForBulkSchema).optional(),
    prerequisites: z.array(CreateFeaturePrerequisiteForBulkSchema).optional(),
});

// Rich response schemas with relationships (defined after base schemas to avoid circular dependency)
export const FeatureProgressionWithRelationsSchema = FeatureProgressionSchema.extend({
    feature: FeatureSchema.optional(),
    class: z.object({
        name: z.string(),
        abbreviation: z.string(),
    }).optional(),
    modifiers: z.array(FeatureModifierWithConditionsSchema).optional(),
    choices: z.array(FeatureChoiceWithFeatSchema).optional(),
    effects: z.array(FeatureSpecialEffectWithRelationsSchema).optional(),
    spellcasting: SpellcastingLinkSchema.optional(),
    prerequisites: z.array(FeaturePrerequisiteSchema).optional(),
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
export type CreateFeaturePrerequisiteRequest = z.infer<typeof CreateFeaturePrerequisiteSchema>;
export type UpdateFeaturePrerequisiteRequest = z.infer<typeof UpdateFeaturePrerequisiteSchema>;
export type CreateFeatureModifierConditionRequest = z.infer<typeof CreateFeatureModifierConditionSchema>;
export type UpdateFeatureModifierConditionRequest = z.infer<typeof UpdateFeatureModifierConditionSchema>;

// Bulk creation type exports
export type CreateFeatureModifierForBulkRequest = z.infer<typeof CreateFeatureModifierForBulkSchema>;
export type CreateFeatureChoiceForBulkRequest = z.infer<typeof CreateFeatureChoiceForBulkSchema>;
export type CreateFeatureSpecialEffectForBulkRequest = z.infer<typeof CreateFeatureSpecialEffectForBulkSchema>;
export type CreateFeaturePrerequisiteForBulkRequest = z.infer<typeof CreateFeaturePrerequisiteForBulkSchema>;
export type CreateFeatureModifierConditionForBulkRequest = z.infer<typeof CreateFeatureModifierConditionForBulkSchema>;
export type CreateFeatureProgressionWithRelationsRequest = z.infer<typeof CreateFeatureProgressionWithRelationsSchema>;

// Enum type exports
export type ChoiceType = z.infer<typeof ChoiceTypeEnumSchema>;
export type ChoiceBehavior = z.infer<typeof ChoiceBehaviorEnumSchema>;

export type FeatureProgressionInQueryResponse = z.infer<typeof FeatureProgressionWithRelationsSchema>;
export type FeatureModifierInQueryResponse = z.infer<typeof FeatureModifierSchema>;
export type FeatureSpecialEffectInQueryResponse = z.infer<typeof FeatureSpecialEffectSchema>;
export type FeatureSpecialEffectWithRelations = z.infer<typeof FeatureSpecialEffectWithRelationsSchema>;
export type FeatureChoiceInQueryResponse = z.infer<typeof FeatureChoiceSchema>;
export type FeatureModifierWithConditions = z.infer<typeof FeatureModifierWithConditionsSchema>;
export type FeatureModifierConditionInQueryResponse = z.infer<typeof FeatureModifierConditionSchema>;

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

export const GetFeaturePrerequisitesResponseSchema = QueryResponseSchema.extend({
    results: z.array(FeaturePrerequisiteSchema),
});

export const GetFeatureModifierConditionsResponseSchema = QueryResponseSchema.extend({
    results: z.array(FeatureModifierConditionSchema),
});

// Type exports for response schemas
export type GetFeatureProgressionsResponse = z.infer<typeof GetFeatureProgressionsResponseSchema>;
export type GetFeatureModifiersResponse = z.infer<typeof GetFeatureModifiersResponseSchema>;
export type GetFeatureChoicesResponse = z.infer<typeof GetFeatureChoicesResponseSchema>;
export type GetFeatureSpecialEffectsResponse = z.infer<typeof GetFeatureSpecialEffectsResponseSchema>;
export type GetFeaturePrerequisitesResponse = z.infer<typeof GetFeaturePrerequisitesResponseSchema>;
export type GetFeatureModifierConditionsResponse = z.infer<typeof GetFeatureModifierConditionsResponseSchema>;

// Re-export common response types
export { CreateResponse, UpdateResponse } from './common';

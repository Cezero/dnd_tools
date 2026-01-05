import z from "zod";
import { FeatureSourceType, FeatureBonusType, FeaturePrerequisiteType, ConditionalScalingValueType, EntityType, FeatureEntityConditionType, EntityAppliesToType } from "@shared/static-data";
import { SpellcastingLinkSchema } from "./spellcasting";
import { QueryResponseSchema } from "./query";
import { FeatSchema } from "./feat";
import { ItemSchema } from "./item";

// Feature Prerequisite Schema
export const FeaturePrerequisiteSchema = z.object({
    id: z.number().int().positive('Prerequisite ID must be a positive integer'),
    featureId: z.number().int().positive('Feature ID must be a positive integer'),
    type: z.enum(FeaturePrerequisiteType),
    appliesToId: z.number().int().nullable(),
    minValue: z.number().int(),
});

// Core Feature Schema
export const FeatureSchema = z.object({
    id: z.number().int().positive('Feature ID must be a positive integer'),
    slug: z.string().min(1, 'Feature slug is required').max(100, 'Feature slug must be less than 100 characters').trim(),
    name: z.string().min(1, 'Feature name is required').max(100, 'Feature name must be less than 100 characters').trim(),
    description: z.string().max(10000, 'Description must be less than 10000 characters'),
    summary: z.string().max(10000, 'Summary must be less than 10000 characters').nullable().optional(),
    prerequisites: z.array(FeaturePrerequisiteSchema).optional(),
});

// Lightweight feature schema for choices and summaries
export const FeatureSummarySchema = FeatureSchema.omit({
    description: true,
    prerequisites: true,
});

// Minimal feature schema for dropdown lists (only id and name)
export const FeatureListSchema = z.object({
    id: z.number().int().positive(),
    name: z.string().min(1).max(100),
});

// Feature Formula Params Schema
export const FeatureFormulaParamsSchema = z.object({
    id: z.number().int().positive('Formula params ID must be a positive integer'),
    formulaId: z.number().int().positive('Formula ID must be a positive integer'),
    interval: z.number().int().positive('Interval must be a positive integer').optional().nullable(),
    formulaStartLevel: z.number().int().positive('Formula start level must be a positive integer').optional().nullable(),
    abilityId: z.number().int().positive('Ability ID must be a positive integer').optional().nullable(),
    thresholds: z.array(z.number().int()).nullable(),
    values: z.array(z.union([z.string(), z.number()])).nullable(),

    // Enhanced parameters for complex scaling
    valuesRepresent: z.enum(ConditionalScalingValueType).optional().nullable(),
    cumulative: z.boolean().default(false),

    // Control whether to include the progression level in the formula calculation
    includeProgressionLevel: z.boolean().default(true),
});

export const FeatureEntityConditionSchema = z.object({
    id: z.number().int().positive('Condition ID must be a positive integer'),
    featureEntityId: z.number().int().positive('Entity ID must be a positive integer'),
    conditionType: z.enum(FeatureEntityConditionType),
    conditionValue: z.number().int(),
});

export const FeatureEntitySchema = z.object({
    id: z.number().int().positive('Entity ID must be a positive integer'),
    progressionId: z.number().int().positive('Progression ID must be a positive integer'),
    type: z.enum(EntityType),
    appliesTo: z.enum(EntityAppliesToType),
    appliesToId: z.number().int().nullable(),
    appliesToSubId: z.number().int().nullable(),
    value: z.number().int().nullable(),
    bonusType: z.enum(FeatureBonusType).nullable(),
    formulaParamsId: z.number().int().optional().nullable(),
    groupingId: z.number().int().default(0),
    displayInDetail: z.boolean().default(true),
    filterType: z.number().int().nullable(),
    conditions: z.array(FeatureEntityConditionSchema).optional(),

    // Optional related entities
    item: ItemSchema.optional().nullable(),  // When appliesTo === Item
    feat: FeatSchema.optional().nullable(),  // When appliesTo === Feat
    spell: z.object({
        id: z.number().int().positive('Spell ID must be a positive integer'),
        name: z.string().min(1, 'Spell name is required')
    }).optional().nullable(),  // When appliesTo === Spell (minimal data only)
    feature: FeatureSchema.optional().nullable(),  // When appliesTo === Feature (FULL schema)
    domain: z.object({
        id: z.number().int().positive('Domain ID must be a positive integer'),
        name: z.string().min(1, 'Domain name is required')
    }).optional().nullable(),  // NEW: When appliesTo === Domain (minimal data only)
    formulaParams: FeatureFormulaParamsSchema.optional().nullable(),
});

// Feature Progression Schema (the main one used for bulk operations)
export const FeatureProgressionSchema = z.object({
    id: z.number().int().positive('Progression ID must be a positive integer'),
    sourceType: z.enum(FeatureSourceType),
    level: z.number().int().min(1, 'Level must be at least 1').max(20, 'Level must be at most 20'),
    featureId: z.number().int().positive('Feature ID must be a positive integer'),
    classId: z.number().int().nullable(),
    raceId: z.number().int().nullable(),
    variantOverrideId: z.number().int().nullable(),
    domainId: z.number().int().nullable(), // NEW: Reference to domain for domain-granted features
    feature: FeatureSchema.optional(),
    class: z.object({
        name: z.string(),
        abbreviation: z.string(),
    }).optional(),
    entities: z.array(FeatureEntitySchema).optional(),
    spellcasting: SpellcastingLinkSchema.optional(),
});

export const CreateFeatureEntityConditionSchema = FeatureEntityConditionSchema.omit({
    id: true,
    featureEntityId: true,
});

export const CreateFeatureFormulaParamsSchema = FeatureFormulaParamsSchema.omit({
    id: true,
}).extend({
    thresholds: z.array(z.number().int()).nullable().optional(),
    values: z.array(z.union([z.string(), z.number()])).nullable().optional(),
    valuesRepresent: z.enum(ConditionalScalingValueType).optional().nullable(),
    cumulative: z.boolean().optional(),
});

export const CreateFeatureEntitySchema = FeatureEntitySchema.omit({
    id: true,
    progressionId: true,
    conditions: true,
    formulaParams: true,
    formulaParamsId: true,
    // Display-only fields that should be filtered out:
    item: true,
    feat: true,
    feature: true,
    spell: true,
    domain: true,
}).extend({
    conditions: z.array(CreateFeatureEntityConditionSchema).optional(),
    formulaParams: CreateFeatureFormulaParamsSchema.optional().nullable(),
});

// Schema for creating feature progressions (used in bulk operations)
export const CreateFeatureProgressionSchema = FeatureProgressionSchema.omit({
    id: true,
    feature: true,
    class: true,
    spellcasting: true,
}).extend({
    entities: z.array(CreateFeatureEntitySchema).optional(),
});

export const UpdateFeatureProgressionSchema = CreateFeatureProgressionSchema.partial();

// Feature with relations (used for feature detail views)
export const FeatureWithRelationsSchema = FeatureSchema.extend({
    progressions: z.array(FeatureProgressionSchema).optional(),
    prerequisites: z.array(FeaturePrerequisiteSchema).optional(),
});

// Parameter schemas
export const FeatureIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

export const FeatureSlugParamSchema = z.object({
    slug: z.string().min(1, 'Feature slug is required').max(100, 'Feature slug must be less than 100 characters').trim(),
});

export const FeatureQuerySchema = z.object({
    sourceTypes: z.array(z.number().int().min(0).max(5)).optional(),
});

// Request schemas for feature management
export const CreateFeatureSchema = FeatureSchema.omit({
    id: true,
}).extend({
    prerequisites: z.array(FeaturePrerequisiteSchema.omit({
        id: true,
        featureId: true,
    })).optional(),
});

export const UpdateFeatureSchema = CreateFeatureSchema.partial();

// Response schemas
export const GetAllFeaturesResponseSchema = QueryResponseSchema.extend({
    results: z.array(FeatureSchema),
});

export const GetFeatureResponseSchema = FeatureSchema.extend({
    prerequisites: z.array(FeaturePrerequisiteSchema).optional(),
});

// Feature Progression management schemas
export const UpdateFeatureProgressionsRequestSchema = z.object({
    progressions: z.array(UpdateFeatureProgressionSchema),
});

export const GetFeatureProgressionsResponseSchema = z.array(FeatureProgressionSchema);

// Response schema for feature list endpoint
export const GetFeatureListResponseSchema = z.array(FeatureListSchema);

// Schema for creating feature progressions in frontend forms (allows featureId to be 0 for new features)
export const CreateFeatureProgressionFormSchema = CreateFeatureProgressionSchema.extend({
    featureId: z.number().int().min(0, 'Feature ID must be 0 or a positive integer'),
});

// Type exports
export type Feature = z.infer<typeof FeatureSchema>;
export type FeatureIdParamRequest = z.infer<typeof FeatureIdParamSchema>;
export type FeatureSlugParamRequest = z.infer<typeof FeatureSlugParamSchema>;
export type FeatureQueryRequest = z.infer<typeof FeatureQuerySchema>;
export type GetAllFeaturesResponse = z.infer<typeof GetAllFeaturesResponseSchema>;
export type CreateFeatureRequest = z.infer<typeof CreateFeatureSchema>;
export type UpdateFeatureRequest = z.infer<typeof UpdateFeatureSchema>;
export type GetFeatureResponse = z.infer<typeof GetFeatureResponseSchema>;
export type FeatureIdParam = z.input<typeof FeatureIdParamSchema>;
export type FeaturePrerequisite = z.infer<typeof FeaturePrerequisiteSchema>;
export type FeatureWithRelations = z.infer<typeof FeatureWithRelationsSchema>;
export type CreateFeatureProgressionRequest = z.infer<typeof CreateFeatureProgressionSchema>;
export type CreateFeatureProgressionFormRequest = z.infer<typeof CreateFeatureProgressionFormSchema>;
export type FeatureProgression = z.infer<typeof FeatureProgressionSchema>;
export type FeatureEntity = z.infer<typeof FeatureEntitySchema>;
export type CreateFeatureEntityRequest = z.infer<typeof CreateFeatureEntitySchema>;
export type CreateFeatureEntityConditionRequest = z.infer<typeof CreateFeatureEntityConditionSchema>;
export type CreateFeatureFormulaParamsRequest = z.infer<typeof CreateFeatureFormulaParamsSchema>;
export type UpdateFeatureProgression = z.infer<typeof UpdateFeatureProgressionSchema>;

export type FeatureEntityCondition = z.infer<typeof FeatureEntityConditionSchema>;
export type FeatureFormulaParams = z.infer<typeof FeatureFormulaParamsSchema>;
export type GetFeatureProgressionsResponse = z.infer<typeof GetFeatureProgressionsResponseSchema>;
export type UpdateFeatureProgressionsRequest = z.infer<typeof UpdateFeatureProgressionsRequestSchema>;
export type FeatureList = z.infer<typeof FeatureListSchema>;
export type GetFeatureListResponse = z.infer<typeof GetFeatureListResponseSchema>;

// Array schemas for frontend type safety
export const PrerequisiteArraySchema = z.array(FeaturePrerequisiteSchema);
export const EntityArraySchema = z.array(FeatureEntitySchema);

// Re-export common response types
export { CreateResponse, UpdateResponse } from './common';

// Additional type exports for frontend use
export type PrerequisiteArray = z.infer<typeof PrerequisiteArraySchema>;
export type EntityArray = z.infer<typeof EntityArraySchema>;
export type FormulaParamsData = z.infer<typeof FeatureFormulaParamsSchema>;

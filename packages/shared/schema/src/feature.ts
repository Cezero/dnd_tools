import z from "zod";

import { FeatureSourceType, FeatureBonusType, FeaturePrerequisiteType, ConditionalScalingValueType, EntityType, FeatureEntityConditionType, EntityAppliesToType } from "@shared/static-data";

import { numericParam, optionalBooleanParam, commonValidations } from "./common";
import { SpellcastingLinkSchema } from "./spellcasting";
import { QueryResponseSchema } from "./query";
import { ItemSchema } from "./item";

// Feature Prerequisite Schema
export const FeaturePrerequisiteSchema = z.object({
    id: commonValidations.positiveInt('Prerequisite ID'),
    featureId: commonValidations.positiveInt('Feature ID'),
    type: z.enum(FeaturePrerequisiteType),
    appliesToId: z.number().int().nullable(),
    minValue: z.number().int(),
});

// Core Feature Schema
export const FeatureSchema = z.object({
    id: commonValidations.positiveInt('Feature ID'),
    slug: commonValidations.slug(),
    name: commonValidations.name(),
    description: commonValidations.description(10000),
    summary: z.string().max(10000, 'Summary must be less than 10000 characters').nullable().optional().describe('Can contain template placeholders {{placeholder}} which will be resolved dynamically'),
    displayInCharacterSheet: z.boolean().default(true),
    prerequisites: z.array(FeaturePrerequisiteSchema).optional(),
});

// Lightweight feature schema for choices and summaries
export const FeatureSummarySchema = FeatureSchema.omit({
    description: true,
    prerequisites: true,
});

// Minimal feature schema for dropdown lists (only id and name)
export const FeatureListSchema = z.object({
    id: commonValidations.positiveInt(),
    name: commonValidations.name(),
});

/**
 * Minimal spell summary schema for use in feature entities.
 * Contains only id and name for lightweight references.
 * 
 * This schema is used when a feature entity references a spell but only
 * minimal spell data is needed (e.g., in FeatureEntitySchema).
 * 
 * @see FeatureEntitySchema - Uses this schema for spell references
 */
export const SpellSummarySchema = z.object({
    id: commonValidations.positiveInt('Spell ID'),
    name: commonValidations.name(),
});

/**
 * Minimal domain reference schema for use in feature entities.
 * Contains only id and name for lightweight references.
 * 
 * This schema is used when a feature entity references a domain but only
 * minimal domain data is needed (e.g., in FeatureEntitySchema).
 * 
 * Note: This is different from DomainSummarySchema in domain.ts which omits
 * heavy fields but includes more data. This schema is specifically for
 * minimal references in feature entities.
 * 
 * @see FeatureEntitySchema - Uses this schema for domain references
 * @see DomainSummarySchema - In domain.ts for domain list responses
 */
export const DomainReferenceSchema = z.object({
    id: commonValidations.positiveInt('Domain ID'),
    name: commonValidations.name(),
});

/**
 * Minimal companion summary schema for use in feature entities.
 * Contains only id and name for lightweight references.
 * 
 * This schema is used when a feature entity references a companion but only
 * minimal companion data is needed (e.g., in FeatureEntitySchema).
 * 
 * @see FeatureEntitySchema - Uses this schema for companion references
 */
export const CompanionSummarySchema = z.object({
    id: commonValidations.positiveInt('Companion ID'),
    name: commonValidations.name(),
});

// Feature Formula Params Schema
export const FeatureFormulaParamsSchema = z.object({
    id: commonValidations.positiveInt('Formula params ID'),
    formulaId: commonValidations.positiveInt('Formula ID'),
    interval: commonValidations.positiveInt('Interval').optional().nullable(),
    formulaStartLevel: commonValidations.positiveInt('Formula start level').optional().nullable(),
    abilityId: commonValidations.positiveInt('Ability ID').optional().nullable(),
    thresholds: z.array(z.number().int()).nullable(),
    values: z.array(z.union([z.string(), z.number()])).nullable(),

    // Enhanced parameters for complex scaling
    valuesRepresent: z.enum(ConditionalScalingValueType).optional().nullable(),
    cumulative: z.boolean().default(false),

    // Control whether to include the progression level in the formula calculation
    includeProgressionLevel: z.boolean().default(true),
});

export const FeatureEntityConditionSchema = z.object({
    id: commonValidations.positiveInt('Condition ID'),
    featureEntityId: commonValidations.positiveInt('Entity ID'),
    conditionType: z.enum(FeatureEntityConditionType),
    conditionValue: z.number().int(),
});

export const FeatureProgressionConditionSchema = z.object({
    id: commonValidations.positiveInt('Progression condition ID'),
    progressionId: commonValidations.positiveInt('Progression ID'),
    conditionType: z.enum(FeatureEntityConditionType),
    conditionValue: z.number().int(),
});

export const FeatureEntitySchema = z.object({
    id: commonValidations.positiveInt('Entity ID'),
    progressionId: commonValidations.positiveInt('Progression ID'),
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
    spell: SpellSummarySchema.optional().nullable(),  // When appliesTo === Spell (minimal data only)
    feature: FeatureSchema.optional().nullable(),  // When appliesTo === Feature (FULL schema)
    domain: DomainReferenceSchema.optional().nullable(),  // When appliesTo === Domain (minimal data only)
    companion: CompanionSummarySchema.optional().nullable(),  // When appliesTo === AnimalCompanion (minimal data only)
    formulaParams: FeatureFormulaParamsSchema.optional().nullable(),
});

// Feature Progression Schema (the main one used for bulk operations)
export const FeatureProgressionSchema = z.object({
    id: commonValidations.positiveInt('Progression ID'),
    sourceType: z.enum(FeatureSourceType),
    level: z.number().int().min(1, 'Level must be at least 1').max(20, 'Level must be at most 20'),
    featureId: commonValidations.positiveInt('Feature ID'),
    domainId: z.number().int().nullable(), // Reference to domain for domain-granted features
    featId: z.number().int().nullable(), // NEW: Reference to Feat (same pattern as domainId)
    companionId: z.number().int().nullable(), // NEW: Reference to Companion for companion-granted features
    editionId: z.number().int().nullable(), // Reference to edition for edition-granted features
    feature: FeatureSchema.optional(),
    class: z.object({
        name: z.string(),
        abbreviation: z.string(),
    }).optional(),
    // Many-to-many relationship for shared progressions
    // Only includes classId - frontend can fetch name/abbreviation from cache
    // NOTE: These arrays are typically excluded from API responses to reduce payload size.
    // They are only included in character resolution responses, and even then are filtered
    // to only include classes/races the character is actually associated with.
    classes: z.array(z.object({
        progressionId: z.number().int(),
        classId: z.number().int(),
    })).optional(),
    races: z.array(z.object({
        progressionId: z.number().int(),
        raceId: z.number().int(),
    })).optional(),
    entities: z.array(FeatureEntitySchema).optional(),
    spellcasting: SpellcastingLinkSchema.optional(),
    displayConditions: z.array(FeatureProgressionConditionSchema).optional(),
});

export const CreateFeatureEntityConditionSchema = FeatureEntityConditionSchema.omit({
    id: true,
    featureEntityId: true,
});

export const CreateFeatureProgressionConditionSchema = FeatureProgressionConditionSchema.omit({
    id: true,
    progressionId: true,
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
    displayConditions: z.array(CreateFeatureProgressionConditionSchema).optional(),
});

// Request schema for creating/updating feature progressions (omits classes/races arrays)
// These arrays are managed by the backend based on context (classId, raceId, etc.)
// and should not be sent in requests
export const CreateFeatureProgressionRequestSchema = CreateFeatureProgressionSchema.omit({
    classes: true,
    races: true,
});

export const UpdateFeatureProgressionSchema = CreateFeatureProgressionRequestSchema.partial().extend({
    id: z.number().int().optional()
});

// Response schema for feature progressions (omits classes/races arrays)
// These arrays are only included in character resolution responses where they're needed
// and filtered to only include classes/races relevant to the character
export const FeatureProgressionResponseSchema = FeatureProgressionSchema.omit({
    classes: true,
    races: true,
});

// Feature with relations (used for feature detail views)
export const FeatureWithRelationsSchema = FeatureSchema.extend({
    progressions: z.array(FeatureProgressionResponseSchema).optional(),
    prerequisites: z.array(FeaturePrerequisiteSchema).optional(),
});

// Parameter schemas
export const FeatureIdParamSchema = z.object({
    id: numericParam(),
});

export const EditionIdParamSchema = z.object({
    editionId: numericParam(),
});

export const FeatureSlugParamSchema = z.object({
    slug: commonValidations.slug(),
});

export const FeatureQuerySchema = z.object({
    sourceTypes: z.array(commonValidations.nonNegativeInt('Source type', 5)).optional(),
    cumulative: optionalBooleanParam(),
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
// Note: UpdateFeatureProgressionSchema already omits classes/races via CreateFeatureProgressionRequestSchema
export const UpdateFeatureProgressionsRequestSchema = z.object({
    progressions: z.array(UpdateFeatureProgressionSchema),
});

export const GetFeatureProgressionsResponseSchema = z.array(FeatureProgressionResponseSchema);

// Response schema for feature list endpoint
export const GetFeatureListResponseSchema = z.array(FeatureListSchema);

// Schema for creating feature progressions in frontend forms (allows featureId to be 0 for new features)
// Uses request schema which omits classes/races
export const CreateFeatureProgressionFormSchema = CreateFeatureProgressionRequestSchema.extend({
    featureId: commonValidations.nonNegativeInt('Feature ID'),
});

// Type exports
export type Feature = z.infer<typeof FeatureSchema>;
export type SpellSummary = z.infer<typeof SpellSummarySchema>;
export type DomainReference = z.infer<typeof DomainReferenceSchema>;
export type CompanionSummary = z.infer<typeof CompanionSummarySchema>;
export type FeatureIdParamRequest = z.infer<typeof FeatureIdParamSchema>;
export type EditionIdParamRequest = z.infer<typeof EditionIdParamSchema>;
export type FeatureSlugParamRequest = z.infer<typeof FeatureSlugParamSchema>;
export type FeatureQueryRequest = z.infer<typeof FeatureQuerySchema>;
export type GetAllFeaturesResponse = z.infer<typeof GetAllFeaturesResponseSchema>;
export type CreateFeatureRequest = z.infer<typeof CreateFeatureSchema>;
export type UpdateFeatureRequest = z.infer<typeof UpdateFeatureSchema>;
export type GetFeatureResponse = z.infer<typeof GetFeatureResponseSchema>;
export type FeatureIdParam = z.input<typeof FeatureIdParamSchema>;
export type FeaturePrerequisite = z.infer<typeof FeaturePrerequisiteSchema>;
export type FeatureWithRelations = z.infer<typeof FeatureWithRelationsSchema>;
export type CreateFeatureProgressionRequest = z.infer<typeof CreateFeatureProgressionRequestSchema>;
export type CreateFeatureProgressionFormRequest = z.infer<typeof CreateFeatureProgressionFormSchema>;
export type FeatureProgression = z.infer<typeof FeatureProgressionSchema>;
export type FeatureEntity = z.infer<typeof FeatureEntitySchema>;
export type CreateFeatureEntityRequest = z.infer<typeof CreateFeatureEntitySchema>;
export type CreateFeatureEntityConditionRequest = z.infer<typeof CreateFeatureEntityConditionSchema>;
export type CreateFeatureFormulaParamsRequest = z.infer<typeof CreateFeatureFormulaParamsSchema>;
export type UpdateFeatureProgression = z.infer<typeof UpdateFeatureProgressionSchema>;

export type FeatureEntityCondition = z.infer<typeof FeatureEntityConditionSchema>;
export type FeatureProgressionCondition = z.infer<typeof FeatureProgressionConditionSchema>;
export type CreateFeatureProgressionConditionRequest = z.infer<typeof CreateFeatureProgressionConditionSchema>;
export type FeatureFormulaParams = z.infer<typeof FeatureFormulaParamsSchema>;
export type GetFeatureProgressionsResponse = z.infer<typeof GetFeatureProgressionsResponseSchema>;
export type UpdateFeatureProgressionsRequest = z.infer<typeof UpdateFeatureProgressionsRequestSchema>;
export type FeatureList = z.infer<typeof FeatureListSchema>;
export type GetFeatureListResponse = z.infer<typeof GetFeatureListResponseSchema>;

// Array schemas for frontend type safety
export const PrerequisiteArraySchema = z.array(FeaturePrerequisiteSchema);
export const EntityArraySchema = z.array(FeatureEntitySchema);

// Clone and Fork schemas
export const CloneClassFeaturesRequestSchema = z.object({
    sourceClassId: commonValidations.positiveInt('Source class ID'),
    targetClassId: commonValidations.positiveInt('Target class ID'),
    forkProgressions: z.boolean().default(false).optional(),
});

export const ForkProgressionRequestSchema = z.object({
    progressionId: commonValidations.positiveInt('Progression ID'),
    classId: commonValidations.positiveInt('Class ID'),
});

export const ForkProgressionResponseSchema = z.object({
    forkedProgressionId: commonValidations.positiveInt('Forked progression ID'),
});

// Re-export common response types
export { CreateResponse, UpdateResponse } from './common';

// Additional type exports for frontend use
export type PrerequisiteArray = z.infer<typeof PrerequisiteArraySchema>;
export type EntityArray = z.infer<typeof EntityArraySchema>;
export type FormulaParamsData = z.infer<typeof FeatureFormulaParamsSchema>;
export type CloneClassFeaturesRequest = z.infer<typeof CloneClassFeaturesRequestSchema>;
export type ForkProgressionRequest = z.infer<typeof ForkProgressionRequestSchema>;
export type ForkProgressionResponse = z.infer<typeof ForkProgressionResponseSchema>;

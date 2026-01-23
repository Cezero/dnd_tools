import z from "zod";

import { FeatureSourceType, FeatureBonusType, FeaturePrerequisiteType, ConditionalScalingValueType, EntityType, FeatureEntityConditionType, EntityAppliesToType } from "@shared/static-data";

import { numericParam, optionalBooleanParam, commonValidations } from "./common";
import { SpellcastingLinkSchema } from "./spellcasting";
import { QueryResponseSchema } from "./query";
import { ValidationErrorResponseSchema } from './validation.js';

// Feature Prerequisite Schema
export const FeaturePrerequisiteSchema = z.object({
    id: commonValidations.positiveInt('Prerequisite ID'),
    featureId: commonValidations.positiveInt('Feature ID'),
    type: z.enum(FeaturePrerequisiteType),
    appliesToId: z.number().int().nullable(),
    minValue: z.number().int(),
});

// Core Feature Schema (unified model)
export const FeatureSchema = z.object({
    id: commonValidations.positiveInt('Feature ID'),
    slug: commonValidations.slug(),
    name: commonValidations.name(),
    description: commonValidations.description(10000),
    summary: z.string().max(10000, 'Summary must be less than 10000 characters').nullable().optional().describe('Can contain template placeholders {{placeholder}} which will be resolved dynamically'),
    displayInCharacterSheet: z.boolean().default(true),

    // Progression fields (sourceType, level, domainId, featId, companionId, editionId)
    sourceType: z.enum(FeatureSourceType),
    level: z.number().int().min(1, 'Level must be at least 1').max(20, 'Level must be at most 20'),
    domainId: z.number().int().nullable(), // Reference to domain for domain-granted features
    featId: z.number().int().nullable(), // Reference to Feat (same pattern as domainId)
    companionId: z.number().int().nullable(), // Reference to Companion for companion-granted features
    editionId: z.number().int().nullable(), // Reference to edition for edition-granted features

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

    // Control whether to include the feature level in the formula calculation
    includeProgressionLevel: z.boolean().default(true),
    // When true, returns 0 for levels below formulaStartLevel instead of null or scalingValue
    featureLevelZero: z.boolean().default(false),

    // Division-based formula parameters (for LEVEL_DIVIDED_BY and LEVEL_DIVIDED_BY_PLUS_BASE)
    divisor: commonValidations.positiveInt('Divisor').optional().nullable(),
    baseValue: z.number().int().optional().nullable(),

    // Starting value for formulas that need a different starting value than the increment (e.g., EVERY_N_LEVELS)
    startingValue: z.number().int().optional().nullable(),
});

/**
 * Formula calculation parameters for runtime formula evaluation
 * Extends FeatureFormulaParamsSchema but converts nullable baseValue/divisor/startingValue to optional undefined,
 * and adds runtime calculation fields (level, startLevel, scalingValue, context)
 */
export const FormulaCalculationParamsSchema = FeatureFormulaParamsSchema.omit({
    baseValue: true,
    divisor: true,
    startingValue: true,
}).extend({
    level: z.number().int().min(1),
    startLevel: z.number().int().min(1),
    scalingValue: z.number(),
    context: z.object({
        character: z.object({
            abilityScores: z.record(z.number().int(), z.number().int()),
        }),
    }),
    baseValue: z.number().int().optional(), // Override: optional (undefined) instead of nullable
    divisor: z.number().int().positive().optional(), // Override: optional (undefined) instead of nullable
    startingValue: z.number().int().optional(), // Override: optional (undefined) instead of nullable
});

export const FeatureEntityConditionSchema = z.object({
    id: commonValidations.positiveInt('Condition ID'),
    featureEntityId: commonValidations.positiveInt('Entity ID'),
    conditionType: z.enum(FeatureEntityConditionType),
    conditionValue: z.number().int(),
});

export const FeatureConditionSchema = z.object({
    id: commonValidations.positiveInt('Feature condition ID'),
    featureId: commonValidations.positiveInt('Feature ID'),
    conditionType: z.enum(FeatureEntityConditionType),
    conditionValue: z.number().int(),
});

export const FeatureEntitySchema = z.object({
    id: commonValidations.positiveInt('Entity ID'),
    featureId: commonValidations.positiveInt('Feature ID'),
    type: z.enum(EntityType),
    appliesTo: z.enum(EntityAppliesToType),
    appliesToId: z.number().int().nullable(), // ID reference - frontend should look up from cache
    appliesToSubId: z.number().int().nullable(), // ID reference - frontend should look up from cache
    value: z.number().nullable(),
    bonusType: z.enum(FeatureBonusType).nullable(),
    formulaParamsId: z.number().int().optional().nullable(),
    groupingId: z.number().int().default(0),
    displayInDetail: z.boolean().default(true),
    filterType: z.number().int().nullable(),
    conditions: z.array(FeatureEntityConditionSchema).optional(),
    formulaParams: FeatureFormulaParamsSchema.optional().nullable(),
});

// Feature Schema with relations
// This is the main schema used for feature operations
export const FeatureWithRelationsSchema = FeatureSchema.extend({
    // Many-to-many relationship for shared features
    // Only includes classId - frontend can fetch name/abbreviation from cache
    // NOTE: These arrays are typically excluded from API responses to reduce payload size.
    // They are only included in character resolution responses, and even then are filtered
    // to only include classes/races the character is actually associated with.
    classes: z.array(z.object({
        featureId: z.number().int(),
        classId: z.number().int(),
    })).optional(),
    races: z.array(z.object({
        featureId: z.number().int(),
        raceId: z.number().int(),
    })).optional(),
    entities: z.array(FeatureEntitySchema).optional(),
    spellcasting: SpellcastingLinkSchema.optional(),
    displayConditions: z.array(FeatureConditionSchema).optional(),
});


export const CreateFeatureEntityConditionSchema = FeatureEntityConditionSchema.omit({
    id: true,
    featureEntityId: true,
});

export const CreateFeatureConditionSchema = FeatureConditionSchema.omit({
    id: true,
    featureId: true,
});

export const CreateFeatureFormulaParamsSchema = FeatureFormulaParamsSchema.omit({
    id: true,
}).extend({
    thresholds: z.array(z.number().int()).nullable().optional(),
    values: z.array(z.union([z.string(), z.number()])).nullable().optional(),
    valuesRepresent: z.enum(ConditionalScalingValueType).optional().nullable(),
    cumulative: z.boolean().optional(),
    divisor: commonValidations.positiveInt('Divisor').optional().nullable(),
    baseValue: z.number().int().optional().nullable(),
    startingValue: z.number().int().optional().nullable(),
});

export const CreateFeatureEntitySchema = FeatureEntitySchema.omit({
    id: true,
    featureId: true,
    conditions: true,
    formulaParams: true,
    formulaParamsId: true,
}).extend({
    conditions: z.array(CreateFeatureEntityConditionSchema).optional(),
    formulaParams: CreateFeatureFormulaParamsSchema.optional().nullable(),
}).strip(); // Explicitly strip unknown fields

// Schema for creating features with relations (includes classes/races arrays)
// This is the base schema that CreateFeatureRequestSchema is derived from
export const CreateFeatureWithRelationsRequestSchema = FeatureWithRelationsSchema.omit({
    id: true,
    spellcasting: true,
}).extend({
    entities: z.array(CreateFeatureEntitySchema).optional(),
    displayConditions: z.array(CreateFeatureConditionSchema).optional(),
    prerequisites: z.array(FeaturePrerequisiteSchema.omit({
        id: true,
        featureId: true,
    })).optional(),
});

// Request schema for creating/updating features (omits classes/races arrays)
// These arrays are managed by the backend based on context (classId, raceId, etc.)
// and should not be sent in requests
export const CreateFeatureRequestSchema = CreateFeatureWithRelationsRequestSchema.omit({
    classes: true,
    races: true,
});


export const UpdateFeatureSchema = CreateFeatureRequestSchema.partial().extend({
    id: z.number().int().optional()
}).strip(); // Explicitly strip unknown fields from nested entities

// Response schema for features (omits classes/races arrays)
// These arrays are only included in character resolution responses where they're needed
// and filtered to only include classes/races relevant to the character
export const FeatureResponseSchema = FeatureWithRelationsSchema.omit({
    classes: true,
    races: true,
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

// Request schemas for feature management (basic feature without progression fields)
export const CreateFeatureBasicSchema = FeatureSchema.omit({
    id: true,
    sourceType: true,
    level: true,
    domainId: true,
    featId: true,
    companionId: true,
    editionId: true,
}).extend({
    prerequisites: z.array(FeaturePrerequisiteSchema.omit({
        id: true,
        featureId: true,
    })).optional(),
});

// Alias for backward compatibility
export const CreateFeatureSchema = CreateFeatureBasicSchema;

export const UpdateFeatureBasicSchema = CreateFeatureBasicSchema.partial();

// Response schemas
export const GetAllFeaturesResponseSchema = QueryResponseSchema.extend({
    results: z.array(FeatureSchema),
});

export const GetFeatureResponseSchema = FeatureSchema.extend({
    prerequisites: z.array(FeaturePrerequisiteSchema).optional(),
    entities: z.array(FeatureEntitySchema).optional(),
    displayConditions: z.array(FeatureConditionSchema).optional(),
});

// Feature management schemas
// Note: UpdateFeatureSchema already omits classes/races via CreateFeatureRequestSchema
export const UpdateFeaturesRequestSchema = z.object({
    features: z.array(UpdateFeatureSchema),
}).describe('Request schema for updating multiple features');

export const GetFeaturesResponseSchema = z.array(FeatureResponseSchema);

// Response schema for feature list endpoint
export const GetFeatureListResponseSchema = z.array(FeatureListSchema);

// Schema for creating features in frontend forms (allows featureId to be 0 for new features)
// Uses request schema which omits classes/races
export const CreateFeatureFormSchema = CreateFeatureRequestSchema.extend({
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
export type CreateFeatureBasicRequest = z.infer<typeof CreateFeatureSchema>;
export type UpdateFeatureBasicRequest = z.infer<typeof UpdateFeatureBasicSchema>;
export type GetFeatureResponse = z.infer<typeof GetFeatureResponseSchema>;
export type FeatureIdParam = z.input<typeof FeatureIdParamSchema>;
export type FeaturePrerequisite = z.infer<typeof FeaturePrerequisiteSchema>;
export type FeatureWithRelations = z.infer<typeof FeatureWithRelationsSchema>;
export type CreateFeatureRequest = z.infer<typeof CreateFeatureRequestSchema>;
export type CreateFeatureFormRequest = z.infer<typeof CreateFeatureFormSchema>;
export type FeatureEntity = z.infer<typeof FeatureEntitySchema>;
export type CreateFeatureEntityRequest = z.infer<typeof CreateFeatureEntitySchema>;
export type CreateFeatureEntityConditionRequest = z.infer<typeof CreateFeatureEntityConditionSchema>;
export type CreateFeatureFormulaParamsRequest = z.infer<typeof CreateFeatureFormulaParamsSchema>;
export type UpdateFeature = z.infer<typeof UpdateFeatureSchema>;

export type FeatureEntityCondition = z.infer<typeof FeatureEntityConditionSchema>;
export type FeatureCondition = z.infer<typeof FeatureConditionSchema>;
export type CreateFeatureConditionRequest = z.infer<typeof CreateFeatureConditionSchema>;
export type FeatureFormulaParams = z.infer<typeof FeatureFormulaParamsSchema>;
export type GetFeaturesResponse = z.infer<typeof GetFeaturesResponseSchema>;
export type UpdateFeaturesRequest = z.infer<typeof UpdateFeaturesRequestSchema>;
export type FeatureList = z.infer<typeof FeatureListSchema>;
export type GetFeatureListResponse = z.infer<typeof GetFeatureListResponseSchema>;

// Feature Cache Schema (minimal data for cache)
export const FeatureCacheSchema = z.object({
    id: commonValidations.positiveInt('Feature ID'),
    name: commonValidations.name(),
});

export const FeatureCacheResponseSchema = QueryResponseSchema.extend({
    results: z.array(FeatureCacheSchema),
});

export type FeatureCacheEntry = z.infer<typeof FeatureCacheSchema>;
export type FeatureCacheResponse = z.infer<typeof FeatureCacheResponseSchema>;

// Array schemas for frontend type safety
export const PrerequisiteArraySchema = z.array(FeaturePrerequisiteSchema);
export const EntityArraySchema = z.array(FeatureEntitySchema);

// Clone and Fork schemas
export const CloneClassFeaturesRequestSchema = z.object({
    sourceClassId: commonValidations.positiveInt('Source class ID'),
    targetClassId: commonValidations.positiveInt('Target class ID'),
    forkFeatures: z.boolean().default(false).optional(),
});

export const ForkFeatureRequestSchema = z.object({
    featureId: commonValidations.positiveInt('Feature ID'),
    classId: commonValidations.positiveInt('Class ID'),
});

export const ForkFeatureResponseSchema = z.object({
    forkedFeatureId: commonValidations.positiveInt('Forked feature ID'),
});

// Re-export common response types
export { CreateResponse, UpdateResponse } from './common';

// Additional type exports for frontend use
export type PrerequisiteArray = z.infer<typeof PrerequisiteArraySchema>;
export type EntityArray = z.infer<typeof EntityArraySchema>;
export type FormulaParamsData = z.infer<typeof FeatureFormulaParamsSchema>;
export type FormulaCalculationParams = z.infer<typeof FormulaCalculationParamsSchema>;
export type CloneClassFeaturesRequest = z.infer<typeof CloneClassFeaturesRequestSchema>;
export type ForkFeatureRequest = z.infer<typeof ForkFeatureRequestSchema>;
export type ForkFeatureResponse = z.infer<typeof ForkFeatureResponseSchema>;

// Feature Resolution Schemas
/**
 * Feature State Schema.
 * 
 * The feature state is the full FeatureWithRelations object, containing all
 * feature data including entities, prerequisites, and related information.
 * 
 * This schema is used for validating feature state stored in Redis.
 */
export const FeatureStateSchema = FeatureWithRelationsSchema;

/**
 * Draft-state schema for Feature editing.
 *
 * This schema is used for draft state stored in Redis. It intentionally allows:
 * - negative IDs for draft-only objects (Feature + nested children)
 * - positive IDs for persisted objects being edited
 *
 * Persistence-time validation is performed separately using Create/Update schemas based on id sign.
 */
const DraftIdSchema = z.number().int();

export const FeaturePrerequisiteDraftSchema = FeaturePrerequisiteSchema.extend({
    id: DraftIdSchema,
    featureId: DraftIdSchema,
});

export const FeatureEntityConditionDraftSchema = FeatureEntityConditionSchema.extend({
    id: DraftIdSchema,
    featureEntityId: DraftIdSchema,
});

export const FeatureConditionDraftSchema = FeatureConditionSchema.extend({
    id: DraftIdSchema,
    featureId: DraftIdSchema,
});

export const FeatureFormulaParamsDraftSchema = FeatureFormulaParamsSchema.extend({
    id: DraftIdSchema,
});

export const FeatureEntityDraftSchema = FeatureEntitySchema.extend({
    id: DraftIdSchema,
    featureId: DraftIdSchema,
    formulaParamsId: DraftIdSchema.optional().nullable(),
    conditions: z.array(FeatureEntityConditionDraftSchema).optional(),
    formulaParams: FeatureFormulaParamsDraftSchema.optional().nullable(),
});

export const FeatureDraftStateSchema = FeatureWithRelationsSchema.extend({
    id: DraftIdSchema,
    prerequisites: z.array(FeaturePrerequisiteDraftSchema).optional(),
    entities: z.array(FeatureEntityDraftSchema).optional(),
    displayConditions: z.array(FeatureConditionDraftSchema).optional(),
    classes: z.array(z.object({
        featureId: DraftIdSchema,
        classId: z.number().int(),
    })).optional(),
    races: z.array(z.object({
        featureId: DraftIdSchema,
        raceId: z.number().int(),
    })).optional(),
});

// Feature Resolution TypeScript type exports
export type FeatureState = z.infer<typeof FeatureStateSchema>;
export type FeatureDraftState = z.infer<typeof FeatureDraftStateSchema>;

// Re-export state management types for convenience
export type { UpdateStateValueRequest, UpdateStateValueResponse } from './state.js';

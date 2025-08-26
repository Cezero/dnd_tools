import z from "zod";
import { ModifierType, ModifierAppliesToType, FeatureSpecialEffectType, FeatureSourceType, FeatureBonusType, FeaturePrerequisiteType, FeatureModifierConditionType, FeatureChoiceType, FeatureChoiceBehavior } from "@shared/static-data";
import { SpellcastingLinkSchema } from "./spellcasting";
import { QueryResponseSchema } from "./query";
import { FeatSchema } from "./feat";
import { ItemSchema } from "./item";

// Feature Prerequisite Schema
export const FeaturePrerequisiteSchema = z.object({
    id: z.number().int().positive('Prerequisite ID must be a positive integer'),
    featureId: z.number().int().positive('Feature ID must be a positive integer'),
    type: z.nativeEnum(FeaturePrerequisiteType),
    skillId: z.number().int().nullable(),
    minValue: z.number().int(),
});

// Core Feature Schema
export const FeatureSchema = z.object({
    id: z.number().int().positive('Feature ID must be a positive integer'),
    slug: z.string().min(1, 'Feature slug is required').max(100, 'Feature slug must be less than 100 characters').trim(),
    name: z.string().min(1, 'Feature name is required').max(100, 'Feature name must be less than 100 characters').trim(),
    description: z.string().max(10000, 'Description must be less than 10000 characters'),
    prerequisites: z.array(FeaturePrerequisiteSchema).optional(),
});

// Feature Modifier Condition Schema
export const FeatureModifierConditionSchema = z.object({
    id: z.number().int().positive('Condition ID must be a positive integer'),
    featureModifierId: z.number().int().positive('Feature modifier ID must be a positive integer'),
    conditionType: z.nativeEnum(FeatureModifierConditionType),
    conditionValue: z.number().int(), // Made mandatory (not nullable) to match database schema
});

// Feature Formula Params Schema
export const FeatureFormulaParamsSchema = z.object({
    id: z.number().int().positive('Formula params ID must be a positive integer'),
    formulaId: z.number().int().positive('Formula ID must be a positive integer'),
    interval: z.number().int().positive('Interval must be a positive integer').optional().nullable(),
    formulaStartLevel: z.number().int().positive('Formula start level must be a positive integer').optional().nullable(),
    abilityId: z.number().int().positive('Ability ID must be a positive integer').optional().nullable(),
    // UPDATED: Convert to arrays for better validation and manipulation
    thresholds: z.array(z.number().int()).nullable(), // Array of level thresholds (e.g., [4, 8, 12])
    values: z.array(z.union([z.string(), z.number()])).nullable(), // Array of corresponding values (e.g., ["-2", "-1", 0] or [1, 2, 3])
});

// Feature Modifier Schema
export const FeatureModifierSchema = z.object({
    id: z.number().int().positive('Modifier ID must be a positive integer'),
    featureProgressionId: z.number().int().positive('Feature progression ID must be a positive integer'),
    type: z.nativeEnum(ModifierType),
    value: z.number().int(),
    formulaParamsId: z.number().int().nullable(), // References FeatureFormulaParams
    bonusType: z.nativeEnum(FeatureBonusType).nullable(),
    appliesTo: z.nativeEnum(ModifierAppliesToType).nullable(),
    appliesToId: z.number().int().nullable(),
    conditions: z.array(FeatureModifierConditionSchema).optional(),
    formulaParams: FeatureFormulaParamsSchema.optional().nullable(),
});

// Feature Special Effect Schema
export const FeatureSpecialEffectSchema = z.object({
    id: z.number().int().positive('Special effect ID must be a positive integer'),
    progressionId: z.number().int().positive('Progression ID must be a positive integer'),
    effectType: z.nativeEnum(FeatureSpecialEffectType),
    key: z.string().nullable(),
    value: z.string().nullable(),
    numericValue: z.number().int().nullable(),
    featId: z.number().int().nullable(),
    itemId: z.number().int().nullable(),
    feat: FeatSchema.nullable(),
    item: ItemSchema.nullable(),
});

// Feature Choice Schema
export const FeatureChoiceSchema = z.object({
    id: z.number().int().positive('Choice ID must be a positive integer'),
    progressionId: z.number().int().positive('Progression ID must be a positive integer'),
    label: z.string().nullable(),
    pickCount: z.number().int().nullable(),
    type: z.nativeEnum(FeatureChoiceType),
    behavior: z.nativeEnum(FeatureChoiceBehavior),
    featId: z.number().int().positive('Feat ID must be a positive integer').nullable(),
    featureId: z.number().int().positive('Feature ID must be a positive integer').nullable(),
    formulaParamsId: z.number().int().nullable(),
    filterType: z.number().int().nullable(),
    feat: z.object({
        id: z.number().int().positive('Feat ID must be a positive integer'),
        name: z.string().min(1, 'Feat name is required'),
    }).nullable(),
    feature: z.object({
        id: z.number().int().positive('Feature ID must be a positive integer'),
        name: z.string().min(1, 'Feature name is required'),
        slug: z.string().min(1, 'Feature slug is required'),
    }).nullable(),
    formulaParams: FeatureFormulaParamsSchema.optional().nullable(),
});

// Feature Progression Schema (the main one used for bulk operations)
export const FeatureProgressionSchema = z.object({
    id: z.number().int().positive('Progression ID must be a positive integer'),
    sourceType: z.number().int().min(0, 'Source type must be at least 0').max(1, 'Source type must be at most 1'),
    level: z.number().int().min(1, 'Level must be at least 1').max(20, 'Level must be at most 20'),
    featureId: z.number().int().positive('Feature ID must be a positive integer'),
    // REMOVED: appliesToType - redundant with SpecialFeatureId
    // REMOVED: appliesTo - redundant and always null in practice
    classId: z.number().int().nullable(),
    raceId: z.number().int().nullable(),
    feature: FeatureSchema.optional(),
    class: z.object({
        name: z.string(),
        abbreviation: z.string(),
    }).optional(),
    modifiers: z.array(FeatureModifierSchema).optional(),
    choices: z.array(FeatureChoiceSchema).optional(),
    effects: z.array(FeatureSpecialEffectSchema).optional(),
    spellcasting: SpellcastingLinkSchema.optional(),
});

// Schema for creating feature progressions (used in bulk operations)
export const CreateFeatureProgressionSchema = FeatureProgressionSchema.omit({
    id: true,
    feature: true,
    class: true,
    spellcasting: true,
}).extend({
    modifiers: z.array(FeatureModifierSchema.omit({
        id: true,
        featureProgressionId: true,
        conditions: true,
        formulaParams: true,
        formulaParamsId: true,
    }).extend({
        conditions: z.array(FeatureModifierConditionSchema.omit({
            id: true,
            featureModifierId: true,
        })).optional(),
        formulaParams: FeatureFormulaParamsSchema.omit({
            id: true,
        }).optional().nullable(),
    })).optional(),
    choices: z.array(FeatureChoiceSchema.omit({
        id: true,
        progressionId: true,
        feat: true,
        feature: true,
        formulaParamsId: true, // Backend sets this
    }).extend({
        formulaParams: FeatureFormulaParamsSchema.omit({
            id: true,
        }).optional().nullable(),
    })).optional(),
    effects: z.array(FeatureSpecialEffectSchema.omit({
        id: true,
        progressionId: true,
        feat: true,
        item: true,
    })).optional(),
});

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
    sourceType: z.nativeEnum(FeatureSourceType).optional(),
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

export const UpdateFeatureSchema = FeatureSchema.partial().extend({
    prerequisites: z.array(FeaturePrerequisiteSchema.omit({
        id: true,
        featureId: true,
    })).optional(),
});

// Response schemas
export const GetAllFeaturesResponseSchema = QueryResponseSchema.extend({
    results: z.array(FeatureSchema),
});

export const GetFeatureResponseSchema = FeatureSchema.extend({
    prerequisites: z.array(FeaturePrerequisiteSchema).optional(),
});

// Feature Progression management schemas
export const UpdateFeatureProgressionsRequestSchema = z.object({
    progressions: z.array(CreateFeatureProgressionSchema),
});

export const GetFeatureProgressionsResponseSchema = z.array(FeatureProgressionSchema);

// Schema for creating feature progressions in frontend forms (allows featureId to be 0 for new features)
export const CreateFeatureProgressionFormSchema = CreateFeatureProgressionSchema.extend({
    featureId: z.number().int().min(0, 'Feature ID must be 0 or a positive integer'),
});

// Type exports
export type FeatureInQueryResponse = z.infer<typeof FeatureSchema>;
export type FeatureIdParamRequest = z.infer<typeof FeatureIdParamSchema>;
export type FeatureSlugParamRequest = z.infer<typeof FeatureSlugParamSchema>;
export type GetAllFeaturesResponse = z.infer<typeof GetAllFeaturesResponseSchema>;
export type CreateFeatureRequest = z.infer<typeof CreateFeatureSchema>;
export type UpdateFeatureRequest = z.infer<typeof UpdateFeatureSchema>;
export type GetFeatureResponse = z.infer<typeof GetFeatureResponseSchema>;
export type FeatureIdParam = z.input<typeof FeatureIdParamSchema>;
export type FeaturePrerequisite = z.infer<typeof FeaturePrerequisiteSchema>;
export type FeatureWithRelations = z.infer<typeof FeatureWithRelationsSchema>;
export type FeatureProgressionWithRelations = z.infer<typeof FeatureProgressionSchema>;
export type CreateFeatureProgressionRequest = z.infer<typeof CreateFeatureProgressionSchema>;
export type CreateFeatureProgressionFormRequest = z.infer<typeof CreateFeatureProgressionFormSchema>;
export type FeatureProgressionInQueryResponse = z.infer<typeof FeatureProgressionSchema>;
export type FeatureModifierInQueryResponse = z.infer<typeof FeatureModifierSchema>;
export type FeatureSpecialEffectInQueryResponse = z.infer<typeof FeatureSpecialEffectSchema>;
export type FeatureChoiceInQueryResponse = z.infer<typeof FeatureChoiceSchema>;
export type FeatureModifierConditionInQueryResponse = z.infer<typeof FeatureModifierConditionSchema>;
export type GetFeatureProgressionsResponse = z.infer<typeof GetFeatureProgressionsResponseSchema>;
export type UpdateFeatureProgressionsRequest = z.infer<typeof UpdateFeatureProgressionsRequestSchema>;

// Array schemas for frontend type safety
export const PrerequisiteArraySchema = z.array(FeaturePrerequisiteSchema);
export const ModifierArraySchema = z.array(FeatureModifierSchema);

// Re-export common response types
export { CreateResponse, UpdateResponse } from './common';

// Additional type exports for frontend use
export type PrerequisiteArray = z.infer<typeof PrerequisiteArraySchema>;
export type ModifierArray = z.infer<typeof ModifierArraySchema>;
export type FormulaParamsData = z.infer<typeof FeatureFormulaParamsSchema>;

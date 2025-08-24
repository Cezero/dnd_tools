import z from "zod";
import {
    FeatureModifierConditionType,
    DisplayType,
    BreakdownComponentType,
    TransitionPointType,
    FeatureChoiceType,
    FeatureChoiceBehavior,
    FeatureBonusType,
    ModifierAppliesToType,
    USES_FREQUENCY_ENUM
} from "@shared/static-data";
import {
    FeatureChoiceSchema,
    FeatureModifierSchema,
    FeatureSpecialEffectSchema
} from "./feature";
import { CharacterContextSchema } from "./character";
import { RpgDice, SizeId, AbilityId } from "@shared/static-data";

// Name lookup record schema
export const NameLookupRecordSchema = z.record(z.number().int(), z.string());

// Display context for formatter display logic
export const DisplayContextSchema = z.object({
    character: CharacterContextSchema.optional(),
    displayType: z.nativeEnum(DisplayType),
    currentLevel: z.number().int().optional(),
    showBreakdown: z.boolean().optional(),
    // Name lookup tables - primarily from static-data, with backend fallbacks
    featNames: NameLookupRecordSchema.optional(), // featId -> name (from backend)
    featureNames: NameLookupRecordSchema.optional(), // featureId -> name (from backend)
    itemNames: NameLookupRecordSchema.optional(), // itemId -> name (from backend)
});

// Calculation context for formatter calculations
export const CalculationContextSchema = z.object({
    level: z.number().int().positive('Level must be a positive integer'),
    progressionLevel: z.number().int().positive('Progression level must be a positive integer'),
    characterLevel: z.number().int().positive('Character level must be a positive integer').optional(),
    modifierValue: z.number().optional(),
    character: CharacterContextSchema.optional(),
});

// Condition schema for breakdown components
export const ConditionSchema = z.object({
    condition: z.string(),
    conditionType: z.nativeEnum(FeatureModifierConditionType),
    conditionValue: z.number().int(),
    description: z.string(),
});

// Breakdown component for calculation breakdowns
export const BreakdownComponentSchema = z.object({
    source: z.string(),
    value: z.number(),
    type: z.nativeEnum(BreakdownComponentType),
    description: z.string().optional(),
    formula: z.string().optional(),
    condition: ConditionSchema.optional(),
});

// Calculation breakdown for showing "work"
export const CalculationBreakdownSchema = z.object({
    components: z.array(BreakdownComponentSchema),
    formula: z.string().optional(),
    explanation: z.string().optional(),
});

// Base calculation result schema
export const BaseCalculationResultSchema = z.object({
    value: z.number(),
    breakdown: CalculationBreakdownSchema,
});

// Conditional value for conditional calculations
export const ConditionalValueSchema = BaseCalculationResultSchema.extend({
    condition: ConditionSchema,
    displayPriority: z.number().int(),
});

// Calculation result for formula calculations
export const CalculationResultSchema = BaseCalculationResultSchema.extend({
    conditionalValues: z.array(ConditionalValueSchema).optional(),
});

// Progression value for progression calculations
export const ProgressionValueSchema = CalculationResultSchema.extend({
    level: z.number().int(),
    choices: z.array(FeatureChoiceSchema).optional(),
    modifiers: z.array(FeatureModifierSchema).optional(),
    effects: z.array(FeatureSpecialEffectSchema).optional(),
});

// Transition point for progression transitions
export const TransitionPointSchema = z.object({
    level: z.number().int(),
    type: z.nativeEnum(TransitionPointType),
    description: z.string(),
    value: z.number(),
    previousValue: z.number().optional(),
});

// Conditional display for character sheet
export const ConditionalDisplaySchema = z.object({
    condition: z.string(),
    value: z.string(),
    description: z.string(),
    priority: z.number().int(),
});

// Base display result schema
export const BaseDisplayResultSchema = z.object({
    formattedValue: z.string(),
    breakdown: CalculationBreakdownSchema,
});

// Level formatted item schema
export const LevelFormattedItemSchema = BaseDisplayResultSchema.omit({
    breakdown: true,
}).extend({
    featureId: z.number().int(),
    breakdown: CalculationBreakdownSchema.optional(),
});

// Level entry schema for display results
export const LevelEntrySchema = z.object({
    level: z.number().int(),
    description: z.string(),
    items: z.array(LevelFormattedItemSchema).optional(),
});

// Display result for formatter output
export const DisplayResultSchema = BaseDisplayResultSchema.extend({
    showBreakdown: z.boolean(),
    components: z.array(z.union([FeatureModifierSchema, FeatureChoiceSchema, FeatureSpecialEffectSchema])), // Mixed component types
    levelEntries: z.array(LevelEntrySchema).optional(),
    conditionalDisplays: z.array(ConditionalDisplaySchema).optional(),
    progressionId: z.number().int().optional(), // For xxxEdit page 1:1 relationship
});

// Edit page display result for edit pages
export const EditPageDisplayResultSchema = BaseDisplayResultSchema.extend({
    progressionId: z.number().int(),
});

// Character sheet calculation input
export const CharacterSheetCalculationInputSchema = z.object({
    choices: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])), // Character's actual choices
    calculatedBonuses: z.record(z.string(), z.number()), // Results from calculation functions
    context: CharacterContextSchema,
});

// Selected value schema for choice-based calculations
export const SelectedValueSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    value: z.number().optional(),
});

// Choice-based calculation
export const ChoiceBasedCalculationSchema = z.object({
    choiceType: z.nativeEnum(FeatureChoiceType),
    behavior: z.nativeEnum(FeatureChoiceBehavior),
    selectedValues: z.array(SelectedValueSchema),
    allocatedBonuses: z.record(z.number().int(), z.number()).optional(), // choiceId -> bonus
});

// Formatter metadata
export const FormatterMetadataSchema = z.object({
    label: z.string().optional(),
    bonusType: z.nativeEnum(FeatureBonusType).optional(),
    appliesToId: z.nativeEnum(ModifierAppliesToType).optional(),
    diceType: z.nativeEnum(RpgDice).optional(),
    size: z.nativeEnum(SizeId).optional(), // For size-based conditionals
    choiceType: z.nativeEnum(FeatureChoiceType).optional(), // For choice-based features
    useType: z.nativeEnum(USES_FREQUENCY_ENUM).optional(), // For uses per day/week/encounter
    featName: z.string().optional(), // For feat formatters
});

// Formula parameters data
export const FormulaParamsDataSchema = z.object({
    id: z.number().int(),
    formulaId: z.number().int(),
    interval: z.number().int().nullable().optional(),
    formulaStartLevel: z.number().int().nullable().optional(),
    abilityId: z.nativeEnum(AbilityId).nullable().optional(), // Renamed from attributeId for clarity
    thresholds: z.array(z.number().int()).nullable().optional(),
    values: z.array(z.union([z.string(), z.number()])).nullable().optional(),
});

// Formatted item
export const FormattedItemSchema = BaseCalculationResultSchema.extend({
    formattedValue: z.string(),
    metadata: FormatterMetadataSchema.optional(),
    progressionId: z.number().int().optional(), // For boundary validation
    featureId: z.number().int().optional(), // For feature boundary validation
});

// Type exports
export type DisplayContext = z.infer<typeof DisplayContextSchema>;
export type CalculationContext = z.infer<typeof CalculationContextSchema>;
export type BreakdownComponent = z.infer<typeof BreakdownComponentSchema>;
export type CalculationBreakdown = z.infer<typeof CalculationBreakdownSchema>;
export type ConditionalValue = z.infer<typeof ConditionalValueSchema>;
export type CalculationResult = z.infer<typeof CalculationResultSchema>;
export type ProgressionValue = z.infer<typeof ProgressionValueSchema>;
export type TransitionPoint = z.infer<typeof TransitionPointSchema>;
export type ConditionalDisplay = z.infer<typeof ConditionalDisplaySchema>;
export type DisplayResult = z.infer<typeof DisplayResultSchema>;
export type EditPageDisplayResult = z.infer<typeof EditPageDisplayResultSchema>;
export type CharacterSheetCalculationInput = z.infer<typeof CharacterSheetCalculationInputSchema>;
export type ChoiceBasedCalculation = z.infer<typeof ChoiceBasedCalculationSchema>;
export type FormatterMetadata = z.infer<typeof FormatterMetadataSchema>;
export type FormulaParamsData = z.infer<typeof FormulaParamsDataSchema>;
export type FormattedItem = z.infer<typeof FormattedItemSchema>;
export type LevelFormattedItem = z.infer<typeof LevelFormattedItemSchema>;
export type NameLookupRecord = z.infer<typeof NameLookupRecordSchema>;
export type Condition = z.infer<typeof ConditionSchema>;
export type LevelEntry = z.infer<typeof LevelEntrySchema>;
export type SelectedValue = z.infer<typeof SelectedValueSchema>;

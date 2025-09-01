import type {
    FeatureModifier,
    FeatureChoice,
    FeatureSpecialEffect,
    FormulaParamsData,
    FeatureProgression
} from '@shared/schema';
import type { BreakdownComponentType, Formula, FeatureType } from '@shared/static-data';
import { ModifierAppliesToType, DisplayType, ModifierType, FeatureSpecialEffectType, FeatureChoiceType } from '@shared/static-data';

// Processing configuration interface for consolidated processing functions
export interface ProcessingConfig {
    hasFormula: boolean;
    isCharacterDependent: boolean;
    hasProgression: boolean;
    isConditional: boolean;
    entityType: FeatureType;
    subType?: ModifierType | FeatureSpecialEffectType | FeatureChoiceType;
    subTypeId?: ModifierAppliesToType;
}

// Base context information
export interface BaseContextInfo {
    level?: number;
    metadata?: FormatterMetadata;
}

// Processing context interface for consolidated processing functions
export interface ProcessingContext extends BaseContextInfo {
    progression: FeatureProgression;
    context?: DisplayContext;
    conditionPrefix?: string;
    entityType: FeatureType;
}

// Base processing result
export interface BaseProcessingResult extends BaseFormattedValue {
    success: boolean;
    error?: string;
}

// Processing result interface for consolidated processing functions
export interface ProcessingResult extends BaseProcessingResult {
    transitions?: TransitionPoint[];
}

// Strategy interface for processing different types of entities
export interface ProcessingStrategy {
    canProcess(entities: Array<FeatureModifier | FeatureChoice | FeatureSpecialEffect>, context: ProcessingContext): boolean;
    process(entities: Array<FeatureModifier | FeatureChoice | FeatureSpecialEffect>, context: ProcessingContext): string;
    getPriority(): number; // Higher priority strategies are tried first
}

// Name lookup record - internal frontend type for id/name mappings
export interface NameLookupRecord {
    id: number;
    name: string;
}

// Formatter metadata - constructed in frontend from backend data, only used internally
export interface FormatterMetadata {
    // Name lookups - extracted from DisplayContext for specific modifier/choice
    // These are arrays because a single progression can have multiple items (e.g., Rogue Special Abilities)
    featNames?: NameLookupRecord[]; // featId -> name mapping for feat formatters
    featureNames?: NameLookupRecord[]; // featureId -> name mapping for feature formatters
    itemNames?: NameLookupRecord[]; // itemId -> name mapping for item formatters
    // Breakdown information for Conditional Scaling formulas
    breakdown?: CalculationBreakdown;
}

// Calculation breakdown for showing "work" - internal frontend type
export interface CalculationBreakdown {
    components: BreakdownComponent[];
    formula?: string;
    explanation?: string;
}

// Formula preview types - internal frontend types for formula preview functionality
export interface FormulaPreview {
    formulaId: string;
    formula: Formula; // Reference to Formula from static-data
    calculatedValues: Array<{
        level: number;
        value: number;
    }>;
    parameters: Record<string, string | number | boolean>;
}

// Formula parameter validation types - internal frontend types for parameter validation
export interface FormulaParameterValidation {
    name: string;
    description: string;
    required: boolean;
    type: 'number' | 'string';
    min?: number;
    max?: number;
    default?: string | number;
}

// Formula validation result types - internal frontend types for validation results
export interface FormulaValidationResult {
    valid: boolean;
    errors: string[];
}

// Formatted item with breakdown for grouping strategies
export interface FormattedItemWithBreakdown extends BaseFormattedValue {
    metadata?: FormatterMetadata;
    // Original data for grouping strategies to access
    modifier?: FeatureModifier;
    choice?: FeatureChoice;
    // Additional properties for other use cases
    value?: number;
    progressionId?: number;
    featureId?: number;
}

// Grouped result from grouping strategies
export interface GroupedResult extends BaseFormattedValue {
    components: Array<FormattedItemWithBreakdown>;
}

// Grouping strategy interface
export interface GroupingStrategy {
    group(items: Array<FormattedItemWithBreakdown>): GroupedResult;
}

// Base context for formatter operations
export interface BaseFormatterContext {
    character?: BaseCharacterInfo;
    level?: number;
}

// Display context for formatter display logic
export interface DisplayContext extends BaseFormatterContext {
    displayType: DisplayType;
    currentLevel?: number;
    showBreakdown?: boolean;
}

// Calculation context for formatter calculations
export interface CalculationContext extends BaseFormatterContext {
    level: number;
    progressionLevel: number;
    characterLevel?: number;
    modifierValue?: number;
}

// Condition schema for breakdown components
export interface Condition {
    condition: string;
    conditionType: number; // FeatureModifierConditionType
    conditionValue: number;
    description: string;
}

// Breakdown component for calculation breakdowns
export interface BreakdownComponent {
    source: string;
    value: number | string;
    type: BreakdownComponentType;
    description?: string;
    formula?: string;
    condition?: Condition;
}

// Conditional value for conditional calculations
export interface ConditionalValue {
    value: number | string;
    breakdown: CalculationBreakdown;
    condition: Condition;
    displayPriority: number;
}

// Base calculation result
export interface BaseCalculationResult {
    breakdown: CalculationBreakdown;
    value: number;
    conditionalValues?: ConditionalValue[];
}

// Calculation result for formula calculations
export type CalculationResult = BaseCalculationResult;

// Conditional display for character sheet
export interface ConditionalDisplay {
    condition: string;
    value: string;
    description: string;
    priority: number;
}

// Level entry schema for display results
export interface LevelEntry {
    level: number;
    description: string;
    items?: GroupedLevelItem[];
}

// Display result for formatter output
export interface DisplayResult extends BaseFormattedValue {
    showBreakdown: boolean;
    components: Array<FeatureModifier | FeatureChoice | FeatureSpecialEffect>;
    levelEntries?: LevelEntry[];
    conditionalDisplays?: ConditionalDisplay[]; // For xxxEdit page 1:1 relationship
}

// Character sheet calculation input
export interface CharacterSheetCalculationInput {
    choices: Record<string, string | number | boolean>; // Character's actual choices
    calculatedBonuses: Record<string, number>; // Results from calculation functions
    context: {
        level: number;
        race?: string;
        class?: string;
    };
}

// Selected value schema for choice-based calculations
export interface SelectedValue {
    id: number;
    name: string;
    value?: number;
}

// Choice-based calculation
export interface ChoiceBasedCalculation {
    choiceType: number; // FeatureChoiceType
    behavior: number; // FeatureChoiceBehavior
    selectedValues: SelectedValue[];
    allocatedBonuses?: Record<number, number>; // choiceId -> bonus
}



// Base character information
export interface BaseCharacterInfo {
    abilityScores: Record<number, number>; // abilityId -> score
    classLevels: Record<number, number>; // classId -> level
    raceId?: number;
    sizeId?: number;
}

// Character context for calculations
export type CharacterContext = BaseCharacterInfo;

// Progression value for progression calculations (Layer 3)
export interface ProgressionValue extends BaseCalculationResult {
    level: number;
    choices?: FeatureChoice[];
    modifiers?: FeatureModifier[];
    effects?: FeatureSpecialEffect[];
}

// Base entity information
export interface BaseEntityInfo {
    entityType: FeatureType;
    entitySubType: ModifierType | FeatureSpecialEffectType | FeatureChoiceType;
    entityAppliesTo?: number; // For modifiers, the appliesTo value
}

// Base transition information
export interface BaseTransitionInfo {
    level: number;
    type: number; // TransitionPointType
    description: string;
    value: number;
    previousValue?: number;
}

// Transition point for progression transitions (Layer 4)
export interface TransitionPoint extends BaseTransitionInfo, BaseEntityInfo { }

export interface FormattedItemWithLevel extends BaseEntityInfo {
    formattedValue: string;
    breakdown: CalculationBreakdown;
    entity: FeatureModifier | FeatureChoice | FeatureSpecialEffect;
    level: number;
    descriptionLevel: number; // The level where the feature's full description should be shown
    featureId: number; // The feature ID for easy lookup
}

export interface CalculatedValueWithLevel {
    value: number;
    breakdown: CalculationBreakdown;
    entity: FeatureModifier | FeatureChoice | FeatureSpecialEffect;
    level: number;
}

// Base level information
export interface BaseLevelInfo {
    level: number;
    featureId: number;
}

// Base formatted value information
export interface BaseFormattedValue {
    formattedValue: string;
    breakdown: CalculationBreakdown;
}

export interface EntityGroupKey {
    type: FeatureType;
    subType: ModifierType | FeatureSpecialEffectType | FeatureChoiceType;
}

// Type for grouped level items (used by groupWithinLevel, groupWithinProgression, and detectTransitions)
export interface GroupedLevelItem extends BaseLevelInfo, BaseFormattedValue, BaseEntityInfo {
    progressionId: number;
    descriptionLevel: number;
}

// Type for grouping strategy input
export interface GroupingStrategyInput extends BaseFormattedValue, BaseEntityInfo {
    metadata?: FormatterMetadata;
    modifier?: FeatureModifier;
}

// Type for transition detection results
export interface TransitionInfo extends BaseTransitionInfo, BaseEntityInfo { }

// Base formatter interface
export interface BaseFormatter {
    format(
        value: number | string,
        modifier: FeatureModifier, // Direct access to modifier data
        metadata?: FormatterMetadata // Supplementary formatting data
    ): string;
}

// Choice formatter interface
export interface ChoiceFormatter {
    formatChoice(choice: FeatureChoice, metadata?: FormatterMetadata): string;
}

// Effect formatter interface
export interface EffectFormatter {
    format(effect: FeatureSpecialEffect, level: number): string;
}

// Formula calculator interface
export interface FormulaCalculator {
    calculate(formula: FormulaParamsData, level: number, context?: CalculationContext, modifierValue?: number | string): CalculationResult;
}

// Formula definition interface for better type safety
export interface FormulaDefinition extends Formula {
    calculate: (params: Record<string, unknown>) => number | string;
    getDisplayString: (params: Record<string, unknown>) => string;
    hasProgression: boolean;
    isCharacterDependent: boolean;
}

// Formula parameter interface for better type safety
export interface FormulaParameter {
    name: string;
    description: string;
    required: boolean;
    defaultValue?: number;
}

// Progression generator interface
export interface ProgressionGenerator {
    generateValues(formula: FormulaParamsData, startLevel: number, endLevel: number, context?: CalculationContext, modifierValue?: number, formulaCalculator?: FormulaCalculator): Array<ProgressionValue>;
}

// Calculator type enum
export enum CalculatorType {
    Formula = 0,
    Choice = 1,
    Progression = 2,
    Transition = 3,
    Conditional = 4
}

export enum ProgressionGeneratorType {
    default = 0,
}

export enum TransitionDetectorType {
    default = 0,
}

// Transition detector interface
export interface TransitionDetector {
    findTransitions(values: Array<ProgressionValue>): Array<TransitionPoint>;
}

// Display strategy interface
export interface DisplayStrategy {
    format(input: FeatureProgression | FeatureProgression[], context?: DisplayContext, metadata?: FormatterMetadata): DisplayResult;
}

// Choice calculator interface
export interface IChoiceCalculator {
    calculateChoiceValue(
        choice: ChoiceBasedCalculation,
        selectedValues: SelectedValue[],
        context?: CalculationContext
    ): CalculationResult;
}

// Conditional value detector interface
export interface ConditionalValueDetector {
    detectConditionals(modifiers: FeatureModifier[], context?: CharacterContext): Array<ConditionalValue>;
}

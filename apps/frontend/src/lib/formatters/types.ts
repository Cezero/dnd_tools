import type {
    FeatureModifier,
    FeatureChoice,
    FeatureSpecialEffect,
    FormulaParamsData,
    FeatureProgression
} from '@shared/schema';
import type { BreakdownComponentType, Formula } from '@shared/static-data';
import { ModifierAppliesToType, DisplayType, ModifierType, FeatureSpecialEffectType, FeatureChoiceType } from '@shared/static-data';

// Numeric enum for feature types - moved from formatter-registry.ts
export enum FeatureType {
    Modifier = 0,
    Effect = 1,
    Choice = 2,
}

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

// Processing context interface for consolidated processing functions
export interface ProcessingContext {
    progression: FeatureProgression;
    context?: DisplayContext;
    metadata?: FormatterMetadata;
    conditionPrefix?: string;
    level?: number;
    entityType: FeatureType;
}

// Processing result interface for consolidated processing functions
export interface ProcessingResult {
    formattedValue: string;
    breakdown?: CalculationBreakdown;
    transitions?: TransitionPoint[];
    success: boolean;
    error?: string;
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
export interface FormattedItemWithBreakdown {
    formattedValue: string;
    breakdown: CalculationBreakdown;
    metadata?: FormatterMetadata;
    // Original data for grouping strategies to access
    modifier?: FeatureModifier;
    choice?: FeatureChoice;
}

// Grouped result from grouping strategies
export interface GroupedResult {
    formattedValue: string;
    breakdown: CalculationBreakdown;
    components: Array<FormattedItemWithBreakdown>;
}

// Grouping strategy interface
export interface GroupingStrategy {
    group(items: Array<FormattedItemWithBreakdown>): GroupedResult;
}

// Display context for formatter display logic
export interface DisplayContext {
    character?: {
        abilityScores: Record<number, number>; // abilityId -> score
        classLevels: Record<number, number>; // classId -> level
        raceId?: number;
        sizeId?: number;
    };
    displayType: DisplayType;
    currentLevel?: number;
    showBreakdown?: boolean;
}

// Calculation context for formatter calculations
export interface CalculationContext {
    level: number;
    progressionLevel: number;
    characterLevel?: number;
    modifierValue?: number;
    character?: {
        abilityScores: Record<number, number>; // abilityId -> score
        classLevels: Record<number, number>; // classId -> level
        raceId?: number;
        sizeId?: number;
    };
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

// Calculation result for formula calculations
export interface CalculationResult {
    value: number;
    breakdown: CalculationBreakdown;
    conditionalValues?: ConditionalValue[];
}

// Conditional display for character sheet
export interface ConditionalDisplay {
    condition: string;
    value: string;
    description: string;
    priority: number;
}

// Base display result schema
export interface BaseDisplayResult {
    formattedValue: string;
    breakdown: CalculationBreakdown;
}

// Level formatted item schema
export interface LevelFormattedItem {
    featureId: number;
    formattedValue: string;
    breakdown?: CalculationBreakdown;
}

// Level entry schema for display results
export interface LevelEntry {
    level: number;
    description: string;
    items?: LevelFormattedItem[];
}

// Display result for formatter output
export interface DisplayResult extends BaseDisplayResult {
    showBreakdown: boolean;
    components: Array<FeatureModifier | FeatureChoice | FeatureSpecialEffect>;
    levelEntries?: LevelEntry[];
    conditionalDisplays?: ConditionalDisplay[];
    progressionId?: number; // For xxxEdit page 1:1 relationship
}

// Edit page display result for edit pages
export interface EditPageDisplayResult extends BaseDisplayResult {
    progressionId: number;
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

// Formatted item
export interface FormattedItem {
    value: number;
    breakdown: CalculationBreakdown;
    formattedValue: string;
    metadata?: FormatterMetadata;
    progressionId?: number; // For boundary validation
    featureId?: number; // For feature boundary validation
}



// Character context for calculations
export interface CharacterContext {
    abilityScores: Record<number, number>; // abilityId -> score
    classLevels: Record<number, number>; // classId -> level
    raceId?: number;
    sizeId?: number;
}

// Progression value for progression calculations (Layer 3)
export interface ProgressionValue {
    level: number;
    value: number;
    breakdown: CalculationBreakdown;
    conditionalValues?: ConditionalValue[];
    choices?: FeatureChoice[];
    modifiers?: FeatureModifier[];
    effects?: FeatureSpecialEffect[];
}

// Transition point for progression transitions (Layer 4)
export interface TransitionPoint {
    level: number;
    type: number; // TransitionPointType
    description: string;
    value: number;
    previousValue?: number;
}

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
    generateValues(formula: FormulaParamsData, startLevel: number, endLevel: number, context?: CalculationContext): Array<ProgressionValue>;
    generateDisplayStrings(formula: FormulaParamsData, startLevel: number, endLevel: number): Array<string>;
}

// Transition detector interface
export interface TransitionDetector {
    findTransitions(values: Array<ProgressionValue>): Array<TransitionPoint>;
}

// Display strategy interface
export interface DisplayStrategy {
    formatProgression?(progression: FeatureProgression, context?: DisplayContext, metadata?: FormatterMetadata): EditPageDisplayResult;
    formatProgressions?(progressions: FeatureProgression[], context?: DisplayContext, metadata?: FormatterMetadata): DisplayResult;
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

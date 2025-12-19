import type {
    FeatureEntity,
    FeatureEntityCondition,
    FormulaParamsData,
    FeatureProgression,
    ItemWithDetails,
    CharacterItem,
    Race,
    DnDClass,
    CharacterWithAllDetailsResponse,
    Feat
} from '@shared/schema';
import type { BreakdownComponentType, Formula } from '@shared/static-data';
import { EntityAppliesToType, EntityType } from '@shared/static-data';

// CalculatedEntity extends FeatureEntity but allows value to be string for formatted display
export interface CalculatedEntity extends Omit<FeatureEntity, 'value'> {
    value?: number | string | null;
    calculatedValue?: number | string | null; // Original calculated result
}

// Processing configuration interface for consolidated processing functions
export interface ProcessingConfig {
    hasFormula: boolean;
    isCharacterDependent: boolean;
    isConditional: boolean;
    entityType: EntityType;
    subTypeId?: EntityAppliesToType;
}

// Base context information
export interface BaseContextInfo {
    level?: number;
}

// Processing context interface for consolidated processing functions
export interface ProcessingContext extends BaseContextInfo {
    progression: FeatureProgression;
    context?: DisplayContext;
    conditionPrefix?: string;
    entityType: EntityType;
}

// Base processing result
export interface BaseProcessingResult extends BaseFormattedValue {
    success: boolean;
    error?: string;
}

// Strategy interface for processing different types of entities
export interface ProcessingStrategy {
    canProcess(entities: Array<FeatureEntity>, context: ProcessingContext): boolean;
    process(entities: Array<FeatureEntity>, context: ProcessingContext): string;
    getPriority(): number; // Higher priority strategies are tried first
}

// Name lookup record - internal frontend type for id/name mappings
export interface NameLookupRecord {
    id: number;
    name: string;
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
    // Original data for grouping strategies to access
    entity?: CalculatedEntity;
    // Additional properties for other use cases
    value?: string | number;
    progressionId?: number;
    featureId?: number;
    groupingId: number; // Always present, no || 0 needed
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
    currentLevel?: number;
    showBreakdown?: boolean;
    featsMap?: Map<number, Feat>;
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
    conditionType: number; // FeatureEntityConditionType
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
    value: number | string;
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
    components: Array<FeatureEntity>;
    levelEntries?: LevelEntry[];
    conditionalDisplays?: ConditionalDisplay[]; // For xxxEdit page 1:1 relationship
}

// Individual entity formatting result
export interface FormattedEntityResult {
    formattedValue: string;           // "all simple weapons", "club", "+2"
    breakdown: CalculationBreakdown;  // How the value was calculated
    entity: CalculatedEntity;        // The calculated entity
    level: number;                   // Character level this applies to
    computedValue?: number;          // For bonuses: 2, for uses: 4, etc.
    structuredData?: {               // Structured data for complex cases
        type: string;                // "bonus", "uses", "proficiency"
        value: number;               // 2, 4, etc.
        interval?: string;           // "day", "level", etc.
        target?: string;             // "Survival", "simple weapons", etc.
    };
}

// Enhanced display result for character sheet strategy
export interface CharacterSheetDisplayResult extends DisplayResult {
    groupedByType: Record<EntityAppliesToType, FormattedEntityResult[]>;
    individualEntities: FormattedEntityResult[];
}

// Formatted attack result for character sheet
export interface FormattedAttackResult {
    attackBonus: string; // e.g., "+5" or "+5 (+7 nonlethal)"
    damage: string; // e.g., "1d8+3"
    critical: string; // e.g., "20/x2" or "19-20/x2"
    range: string | null; // e.g., "30 ft." or null
    weight: string | null; // e.g., "3 lb." or null
    type: string | null; // e.g., "Slashing" or null
    size: string | null; // e.g., "Medium" or null
    weaponName: string; // e.g., "Longsword"
}

// Formatted skill result
export interface FormattedSkill {
    skillId: number;
    skillSubId: number | null;
    customSubtype: string | null;
    skillName: string;
    total: string; // Formatted total modifier
    abilityMod: string; // Formatted ability modifier
    ranks: string; // Formatted ranks
    misc: string; // Formatted misc bonus
    isClassSkill: boolean;
    breakdown: CalculationBreakdown;
}

// Formatted saving throw result
export interface FormattedSavingThrow {
    total: string;
    base: string;
    abilityMod: string;
    misc: string;
    breakdown: CalculationBreakdown;
}

// Formatted armor class result
export interface FormattedArmorClass {
    total: string;
    base: string;
    armor: string;
    shield: string;
    dex: string;
    size: string;
    natural: string;
    deflection: string;
    misc: string;
    touchAC: string;
    flatFootedAC: string;
    breakdown: CalculationBreakdown;
}

// Formatted feat result
export interface FormattedFeat {
    featId: number;
    featName: string;
    formattedValue: string;
    breakdown: CalculationBreakdown;
    level: number;
}

// Formatted feature result
export interface FormattedFeature {
    featureId: number;
    featureName: string;
    formattedValue: string;
    breakdown: CalculationBreakdown;
    level: number;
}

// Formatted ability score result
export interface FormattedAbilityScore {
    abilityId: number;
    score: string;
    modifier: string;
    breakdown: CalculationBreakdown;
}

// Formatted class level result
export interface FormattedClassLevel {
    classId: number;
    className: string;
    level: number;
}

// Formatted initiative result
export interface FormattedInitiative {
    total: string;
    dexMod: string;
    misc: string;
    breakdown: CalculationBreakdown;
}

// Formatted grapple result
export interface FormattedGrapple {
    total: string;
    bab: string;
    strMod: string;
    sizeMod: string;
    misc: string;
    breakdown: CalculationBreakdown;
}

// Main formatted character result
export interface FormattedCharacterResult {
    abilities: FormattedAbilityScore[];
    attacks: FormattedAttackResult[];
    skills: FormattedSkill[];
    savingThrows: {
        fortitude: FormattedSavingThrow;
        reflex: FormattedSavingThrow;
        will: FormattedSavingThrow;
    };
    armorClass: FormattedArmorClass;
    initiative: FormattedInitiative;
    baseAttackBonus: string;
    grapple: FormattedGrapple;
    speed: string;
    hitPoints: string;
    classLevels: FormattedClassLevel[];
    feats: FormattedFeat[];
    features: FormattedFeature[];
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
export interface ProgressionValue {
    level: number;
    breakdown: CalculationBreakdown;
    conditionalValues?: ConditionalValue[];
    entity?: CalculatedEntity; // Modified entity based on formula calculation
}

// Base entity information
export interface BaseEntityInfo {
    entityAppliesTo?: EntityAppliesToType; // For entities, the appliesTo value
}

export interface FormattedItemWithLevel extends BaseEntityInfo {
    formattedValue: string;
    breakdown: CalculationBreakdown;
    entity: CalculatedEntity;
    level: number;
    descriptionLevel: number; // The level where the feature's full description should be shown
    featureId: number; // The feature ID for easy lookup
    groupingId: number; // Add groupingId for entity grouping support
}

export interface CalculatedValueWithLevel {
    // Remove value field - it's redundant with entity.value
    breakdown: CalculationBreakdown;
    entity: CalculatedEntity;
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
    type: EntityType;
    groupingId: number; // NEW: Primary grouping criterion
}

// Type for grouped level items (used by groupWithinLevel, groupWithinProgression, and detectTransitions)
export interface GroupedLevelItem extends BaseLevelInfo, BaseFormattedValue, BaseEntityInfo {
    progressionId: number;
    descriptionLevel: number;
    groupingId: number; // Add groupingId for entity grouping support
}

// Type for grouping strategy input
export interface GroupingStrategyInput extends BaseFormattedValue, BaseEntityInfo {
    entity?: FeatureEntity;
}

// Base formatter interface
export interface BaseFormatter {
    format(
        entity: CalculatedEntity, // Direct access to entity data with calculated values
    ): string;
}


// Formula calculator interface
export interface FormulaCalculator {
    calculate(formula: FormulaParamsData, level: number, context?: CalculationContext, modifierValue?: number | string): CalculationResult;
}

// Formula parameter interface for better type safety
export interface FormulaParameter {
    name: string;
    description: string;
    required: boolean;
    defaultValue?: number;
}

// Progression generator parameters
export interface ProgressionGeneratorParams {
    formula: FormulaParamsData;
    startLevel: number;
    endLevel: number;
    context?: CalculationContext;
    entityValue?: number;
    formulaCalculator?: FormulaCalculator;
    originalEntity?: FeatureEntity;
}

// Progression generator interface
export interface ProgressionGenerator {
    generateValues(params: ProgressionGeneratorParams): Array<ProgressionValue>;
}

// Calculator type enum
export enum CalculatorType {
    Formula = 0,
    Choice = 1,
    Progression = 2,
    Conditional = 4
}

export enum ProgressionGeneratorType {
    default = 0,
}

// Display strategy interface
export interface DisplayStrategy {
    format(input: FeatureProgression | FeatureProgression[], context?: DisplayContext, showLabels?: boolean): DisplayResult;
    formatAttack?(attackResult: import('@/lib/character-calculation/calculations/combatValues').CombatValuesResult, item: ItemWithDetails | CharacterItem | null): FormattedAttackResult; // Optional method for character sheet formatting
    formatCharacter?(
        character: CharacterWithAllDetailsResponse,
        resolvedProgressions: FeatureProgression[],
        items: ItemWithDetails[],
        characterItems: CharacterItem[],
        classDetailsMap: Map<number, DnDClass>,
        context?: DisplayContext,
        race?: Race | null
    ): FormattedCharacterResult;
}

// Conditional value detector interface
export interface ConditionalValueDetector {
    detectConditionals(entities: FeatureEntity[], context?: CharacterContext): Array<ConditionalValue>;
}

// Condition formatter interface
export interface ConditionFormatter {
    formatCondition(condition: FeatureEntityCondition, formattedValue: string): string;
}

/**
 * Interface for condition value formatters - simple function that takes a condition value and returns formatted string
 */
export interface ConditionValueFormatter {
    format(conditionValue: number): string;
}

# Implementation Plan

## Overview

This document provides a detailed implementation plan for the formatter system refactoring, breaking down the work into manageable phases with specific deliverables and timelines.

## Key Insights from Examples

### 1. Choice-Based Progression Patterns
- **Single Choice**: One selection from a filtered list (e.g., "Select Fighter Bonus Feat")
- **Multiple Choice**: Multiple selections from a filtered list (e.g., "Select 2 Metamagic Feats")
- **Allocation Choice**: Distribute bonus points across existing selections (e.g., "Allocate +2 to any Favored Enemy")
- **Choice Grouping**: Multiple choices within same progression can be grouped with "OR" or ","
- **Context-Dependent Display**: Different display formats for xxxEdit, xxxDetail, and Character Sheet

### 2. Conditional Value Handling
- **Size-Based Conditionals**: Different values based on character size (e.g., Monk unarmed damage)
- **Conditional Modifiers**: Bonuses that apply under specific circumstances (e.g., "vs orcs and goblins")
- **Schema-Based Detection**: Leverage `FeatureModifierCondition` for automatic conditional detection
- **Display Priority**: Order conditional values by importance and frequency

### 3. Formula System Integration
- **Formula Types**: `CONDITIONAL_SCALING`, `EVERY_N_LEVELS`, `ATTRIBUTE_BASED`
- **Formula Parameters**: `thresholds`, `values`, `interval`, `formulaStartLevel`, `attributeId`
- **Context-Aware Calculation**: Use character data when available, fall back to formula display
- **Breakdown Generation**: Track all components that contribute to final value

### 4. Character Sheet Integration
- **External Calculations**: Some features (e.g., Favored Enemy) calculated by separate functions
- **Input/Output Interface**: Formatter receives calculated results and formats for display
- **Context Aggregation**: Combine multiple sources for single character sheet values
- **Conditional Display**: Show both normal and special values with explanations

### 5. Critical Display Context Requirements

#### xxxEdit Page Grouping (CRITICAL CONSTRAINT)
- **1:1 Relationship**: Each `FeatureProgression` must produce exactly one formatted string
- **Clickable Links**: Each string must serve as a clickable link to `FeatureProgressionDetailEdit.tsx`
- **No Cross-Progression Grouping**: Never combine multiple progressions into single display
- **No Multiple Strings**: Single progression cannot produce multiple display strings

#### xxxDetail Page Grouping (CRITICAL CONSTRAINT)
- **Feature + Level Grouping**: Multiple progressions can be grouped by feature and level, but ONLY within the same feature
- **Distinct Feature Display**: Different features at same level should be displayed distinctly but grouped under same level heading
- **Allowed**: "Level 9: Sneak Attack +5d6, Trap Sense +3" (distinct features, grouped by level)
- **NOT ALLOWED**: "Level 9: Sneak Attack: +5d6, +3" (mixing values from different features into one display)
- **Same Feature Grouping**: "Level 18: Wild Shape (6/day, elemental 2/day)" (same feature, multiple progressions grouped)

#### Character Sheet Grouping
- **Minimal Grouping**: Context-specific displays for specific skills, attacks, etc.
- **Context-Aware**: Display based on character's current state and choices
- **Conditional Values**: Show both normal and special values with conditions

### 6. Choice Formatting and Name Display Requirements

#### Choice Type-Specific Formatting
- **Feat Choices**: Use `feat.name` when `featId` is set, otherwise use `filterType` name from static-data
- **Skill Choices**: Use `skill.name` when `skillId` is set, otherwise use `filterType` name from static-data
- **Language Choices**: Use `language.name` when `languageId` is set, otherwise use `filterType` name from static-data
- **Attribute Choices**: Use attribute abbreviation (e.g., "STR", "DEX") when `attributeId` is set
- **Creature Type Choices**: Use `creatureType.name` when `creatureTypeId` is set, otherwise use `filterType` name from static-data

#### Choice Grouping Patterns
- **Single Choice**: "Select [Choice Name]"
- **Multiple Choices (Same Type)**: "Select 2 [Choice Names] OR [Choice Names]"
- **Multiple Choices (Different Types)**: "Select [Type1 Name] OR [Type2 Name]"
- **Choices with Allocation**: "Select [Choice Name] + Allocate [Bonus] to existing"

#### Context-Specific Choice Display
- **xxxEdit Pages**: Show choice type and behavior (e.g., "Select Fighter Bonus Feat")
- **xxxDetail Pages**: Show actual selected values when available (e.g., "Power Attack, Cleave")
- **Character Sheet**: Show context-specific values with character's actual choices

### 7. Name Resolution Strategy

#### Priority Order for Name Resolution
1. **Passed-in Names**: Use names provided in context (from calling component)
2. **Static Data Lookup**: Use `shared/static-data` package constants and maps
3. **ID Fallback**: Display ID with warning if name cannot be resolved

#### Static Data Sources
- **Enum Names**: Use `FEATURE_FEAT_CHOICE_FILTER_TYPES[filterType].name`
- **Size Names**: Use `SIZE_SELECT_LIST` for size-based conditionals
- **Attribute Abbreviations**: Use `ABILITY_MAP` for attribute abbreviations
- **Skill Names**: Use `FULL_SKILL_SELECT_LIST` for skill names
- **Language Names**: Use `LANGUAGE_SELECT_LIST` for language names

#### Backend Data Sources
- **Feat Names**: From `getClassById()`/`getRaceById()` nested data
- **Feature Names**: From `getClassById()`/`getRaceById()` nested data
- **Item Names**: From proficiency service data or other backend sources

#### Formatter Responsibility
- **NO API Calls**: Formatter should never make API calls or handle caching
- **Caller Responsibility**: Caller must provide names or ensure static-data coverage
- **Future Strategy**: Increase static-data coverage or update callers to provide missing data

### 8. Data Structure Decisions

#### Formula Parameters (thresholds/values)
- **Current**: Stored as comma-separated strings in database
- **Decision**: Convert to arrays in Zod schemas for better validation
- **Benefits**: Better validation, clearer threshold/value pairing, easier manipulation
- **Implementation**: Transform between string/array in backend database layer only
- **Frontend Impact**: Update FeatureProgressionDetailEdit.tsx to handle arrays instead of comma-separated strings

#### Condition Values
- **Current**: `FeatureModifierCondition.conditionValue` is nullable
- **Decision**: Make mandatory since all condition types require values
- **Impact**: Simplifies conditional detection logic
- **Implementation**: Update database schema and Zod validation
- **Status**: ✅ **COMPLETED** - Database schema updated and deployed

#### Enum Handling
- **Pattern**: Store numeric IDs in database, use `z.nativeEnum()` in Zod
- **Benefits**: Avoids database joins, maintains type safety
- **Implementation**: Use `shared/static-data` enums with Zod validation

#### Name Resolution Strategy
- **Decision**: Formatter should NOT make API calls or handle caching
- **Responsibility**: Caller must provide names or formatter must resolve from static-data
- **Fallback**: Display ID with warning if name cannot be resolved
- **Future**: Increase static-data coverage or update callers to provide missing data

## Implementation Phases

### Phase 1: Foundation and Pure Formatters

**Goal**: Create the foundation for the new architecture and extract pure formatters.

#### 1.1 Create Base Interfaces and Types
**Files to Create**:
- `frontend/src/lib/formatters/types.ts`
- `frontend/src/lib/formatters/interfaces.ts`

**Deliverables**:
```typescript
// types.ts
export interface FormatterMetadata {
  label?: string;
  bonusType?: number;
  appliesToId?: number;
  diceType?: string;
  size?: string; // For size-based conditionals
  choiceType?: string; // For choice-based features
  // ... other formatting-specific metadata
}

export interface FormattedItem {
  value: number;
  formattedValue: string;
  metadata?: FormatterMetadata;
}

export interface ChoiceData {
  type: FeatureChoiceType;
  behavior: FeatureChoiceBehavior;
  filterType?: FeatureFeatChoiceFilter;
  selectedValue?: string; // For character context
}

// interfaces.ts
export interface BaseFormatter {
  format(value: number, metadata?: FormatterMetadata): string;
}

export interface ChoiceFormatter {
  formatChoice(choice: ChoiceData, context?: DisplayContext): string;
}

export interface FormulaCalculator {
  calculate(formula: FormulaParams, level: number, context?: CalculationContext): CalculationResult;
}
```

#### 1.2 Extract Pure Formatters
**Files to Create**:
- `frontend/src/lib/formatters/pure-formatters.ts`

**Deliverables**:
```typescript
export class DamageFormatter implements BaseFormatter {
  format(value: number, metadata?: FormatterMetadata): string {
    const diceType = metadata?.diceType || 'd6';
    const size = metadata?.size ? ` (${metadata.size})` : '';
    return `${value}${diceType}${size}`;
  }
}

export class HealingFormatter implements BaseFormatter {
  format(value: number): string {
    return `${value} hit points per day`;
  }
}

export class AttributeFormatter implements BaseFormatter {
  format(value: number, metadata?: FormatterMetadata): string {
    const label = metadata?.label || 'Attribute';
    return `${label}: ${formatSignedValue(value)}`;
  }
}

export class ChoiceFormatter implements ChoiceFormatter {
  formatChoice(choice: ChoiceData, context?: DisplayContext): string {
    // CRITICAL: Always use actual names/abbreviations, never IDs
    const choiceName = this.getChoiceName(choice, context);
    
    switch (choice.behavior) {
      case FeatureChoiceBehavior.Single:
        return `Select ${choiceName}`;
      case FeatureChoiceBehavior.Allocation:
        return `Allocate ${choiceName}`;
      case FeatureChoiceBehavior.Multiple:
        return `Select Multiple ${choiceName}`;
      default:
        return `Choose ${choiceName}`;
    }
  }
  
  private getChoiceName(choice: ChoiceData, context?: DisplayContext): string {
    // Get the actual name/abbreviation for the choice, never use IDs
    switch (choice.type) {
      case FeatureChoiceType.Feat:
        return this.getFeatName(choice, context);
      case FeatureChoiceType.Skill:
        return this.getSkillName(choice, context);
      case FeatureChoiceType.Language:
        return this.getLanguageName(choice, context);
      case FeatureChoiceType.Attribute:
        return this.getAttributeName(choice, context);
      case FeatureChoiceType.CreatureType:
        return this.getCreatureTypeName(choice, context);
      default:
        return choice.type;
    }
  }
  
  private getFeatName(choice: ChoiceData, context?: DisplayContext): string {
    if (choice.specificFeatId) {
      // Get actual feat name from context or lookup
      return context?.featNames?.[choice.specificFeatId] || `Feat ${choice.specificFeatId}`;
    }
    
    if (choice.filterType) {
      // Return filter type name (e.g., "Fighter Bonus Feat")
      return this.getFilterTypeName(choice.filterType);
    }
    
    return "Any Feat";
  }
  
  private getSkillName(choice: ChoiceData, context?: DisplayContext): string {
    if (choice.specificSkillId) {
      // Get actual skill name from context or lookup
      return context?.skillNames?.[choice.specificSkillId] || `Skill ${choice.specificSkillId}`;
    }
    
    return "Any Skill";
  }
  
  private getLanguageName(choice: ChoiceData, context?: DisplayContext): string {
    if (choice.specificLanguageId) {
      // Get actual language name from context or lookup
      return context?.languageNames?.[choice.specificLanguageId] || `Language ${choice.specificLanguageId}`;
    }
    
    return "Any Language";
  }
  
  private getAttributeName(choice: ChoiceData, context?: DisplayContext): string {
    if (choice.specificAttributeId) {
      // Get attribute name or abbreviation
      return this.getAttributeAbbreviation(choice.specificAttributeId);
    }
    
    return "Any Attribute";
  }
  
  private getCreatureTypeName(choice: ChoiceData, context?: DisplayContext): string {
    if (choice.specificCreatureTypeId) {
      // Get actual creature type name from context or lookup
      return context?.creatureTypeNames?.[choice.specificCreatureTypeId] || `Creature Type ${choice.specificCreatureTypeId}`;
    }
    
    return "Any Creature Type";
  }
  
  private getFilterTypeName(filterType: FeatureFeatChoiceFilter): string {
    // Return human-readable filter type names
    switch (filterType) {
      case FeatureFeatChoiceFilter.FighterBonus:
        return "Fighter Bonus Feat";
      case FeatureFeatChoiceFilter.WizardBonus:
        return "Wizard Bonus Feat";
      case FeatureFeatChoiceFilter.RangerFavoredEnemy:
        return "Ranger Favored Enemy";
      default:
        return "Filtered Feat";
    }
  }
  
  private getAttributeAbbreviation(attributeId: number): string {
    // Return standard attribute abbreviations
    switch (attributeId) {
      case 1: return "STR";
      case 2: return "DEX";
      case 3: return "CON";
      case 4: return "INT";
      case 5: return "WIS";
      case 6: return "CHA";
      default: return `Attribute ${attributeId}`;
    }
  }
}

// ... other pure formatters
```

#### 1.3 Create Formatter Registry
**Files to Create**:
- `frontend/src/lib/formatters/formatter-registry.ts`

**Deliverables**:
```typescript
export class FormatterRegistry {
  private formatters = new Map<ModifierAppliesToType, BaseFormatter>();
  private choiceFormatters = new Map<FeatureChoiceType, ChoiceFormatter>();

  register(type: ModifierAppliesToType, formatter: BaseFormatter): void {
    this.formatters.set(type, formatter);
  }

  registerChoice(type: FeatureChoiceType, formatter: ChoiceFormatter): void {
    this.choiceFormatters.set(type, formatter);
  }

  getFormatter(type: ModifierAppliesToType): BaseFormatter | undefined {
    return this.formatters.get(type);
  }

  getChoiceFormatter(type: FeatureChoiceType): ChoiceFormatter | undefined {
    return this.choiceFormatters.get(type);
  }
}
```

**Success Criteria**:
- [ ] All pure formatters implemented and tested
- [ ] Choice formatters implemented and tested
- [ ] Formatter registry working correctly
- [ ] No calculation logic in formatters
- [ ] Comprehensive unit tests for formatters

### Phase 2: Core Infrastructure

**Goal**: Create the core infrastructure and data types based on the actual Prisma schema and Zod schemas.

#### 2.1 Create Base Interfaces and Types
**Files to Create**:
- `frontend/src/lib/formatters/types.ts`

**Deliverables**:
```typescript
// Core data types based on actual schema
export interface ChoiceData {
  id: number;
  progressionId: number;
  label?: string;
  pickCount?: number;
  type: FeatureChoiceType;
  behavior: FeatureChoiceBehavior;
  featId?: number;
  featureId?: number;
  formulaParamsId?: number;
  filterType?: number;
  feat?: { id: number; name: string };
  feature?: { id: number; name: string; slug: string };
  formulaParams?: FormulaParamsData;
}

export interface FormulaParamsData {
  id: number;
  formulaId: number;
  interval?: number;
  formulaStartLevel?: number;
  attributeId?: number;
  // IMPLEMENTED: Change to arrays for better validation
  thresholds?: number[]; // Convert from comma-separated string
  values?: (string | number)[]; // Convert from comma-separated string
}

export interface ModifierData {
  id: number;
  featureProgressionId: number;
  type: ModifierType;
  value: number;
  formulaParamsId?: number;
  bonusType?: FeatureBonusType;
  appliesTo?: ModifierAppliesToType;
  appliesToId?: number;
  conditions?: ModifierConditionData[];
  formulaParams?: FormulaParamsData;
}

export interface ModifierConditionData {
  id: number;
  featureModifierId: number;
  conditionType: FeatureModifierConditionType;
  conditionValue: number; // COMPLETED: Made mandatory, not nullable
}

export interface EffectData {
  id: number;
  progressionId: number;
  effectType: FeatureSpecialEffectType;
  key?: string;
  value?: string;
  numericValue?: number;
  featId?: number;
  itemId?: number;
  feat?: { id: number; name: string };
  item?: { id: number; name: string };
}

export interface ProgressionData {
  id: number;
  sourceType: number;
  level: number;
  featureId: number;
  classId?: number;
  raceId?: number;
  feature?: { id: number; name: string; slug: string; description?: string };
  modifiers?: ModifierData[];
  choices?: ChoiceData[];
  effects?: EffectData[];
}

// Context interfaces
export interface CharacterContext {
  abilityScores: Record<number, number>; // abilityId -> score
  classLevels: Record<number, number>; // classId -> level
  raceId?: number;
  sizeId?: number; // Maps directly to FeatureModifierCondition.conditionValue
  attributes?: Record<number, number>; // attributeId -> value
}

export interface DisplayContext {
  character?: CharacterContext;
  displayType: 'detail' | 'edit' | 'character-sheet';
  currentLevel?: number;
  showBreakdown?: boolean;
  // Name lookup tables - primarily from static-data, with backend fallbacks
  featNames?: Record<number, string>; // featId -> name (from backend)
  featureNames?: Record<number, string>; // featureId -> name (from backend)
  itemNames?: Record<number, string>; // itemId -> name (from backend)
  // Static data is accessed directly, not passed in context
}

export interface CalculationContext {
  level: number;
  progressionLevel: number;
  characterLevel?: number;
  modifierValue?: number;
  character?: CharacterContext;
}

// Result interfaces
export interface CalculationResult {
  value: number;
  breakdown: CalculationBreakdown;
  conditionalValues?: Array<ConditionalValue>;
}

export interface CalculationBreakdown {
  components: Array<BreakdownComponent>;
  formula?: string;
  explanation?: string;
}

export interface BreakdownComponent {
  source: string;
  value: number;
  type: 'base' | 'bonus' | 'penalty' | 'cap' | 'replacement';
  description?: string;
  formula?: string;
  condition?: ConditionalModifier;
}

export interface ConditionalModifier {
  condition: string;
  conditionType: FeatureModifierConditionType;
  conditionValue: number; // No longer nullable
  description: string;
}

export interface ConditionalValue {
  condition: ConditionalModifier;
  value: number;
  breakdown: CalculationBreakdown;
  displayPriority: number;
}

export interface ProgressionValue {
  level: number;
  value: number;
  breakdown: CalculationBreakdown;
  conditionalValues?: Array<ConditionalValue>;
  choices?: ChoiceData[];
  modifiers?: ModifierData[];
  effects?: EffectData[];
}

export interface TransitionPoint {
  level: number;
  type: 'addition' | 'removal' | 'change';
  description: string;
  value: number;
  previousValue?: number;
}

export interface DisplayResult {
  formattedValue: string;
  breakdown: CalculationBreakdown;
  showBreakdown: boolean;
  components: Array<any>;
  levelEntries?: Array<{level: number, description: string}>;
  conditionalDisplays?: Array<ConditionalDisplay>;
  progressionId?: number; // For xxxEdit page 1:1 relationship
}

export interface ConditionalDisplay {
  condition: string;
  value: string;
  description: string;
  priority: number;
}

export interface EditPageDisplayResult {
  progressionId: number;
  formattedValue: string;
  breakdown: CalculationBreakdown;
}

// Character sheet integration interfaces
export interface CharacterSheetCalculationInput {
  choices: Record<string, any>; // Character's actual choices
  calculatedBonuses: Record<string, number>; // Results from calculation functions
  context: CharacterContext;
}

export interface ChoiceBasedCalculation {
  choiceType: FeatureChoiceType;
  behavior: FeatureChoiceBehavior;
  selectedValues: Array<{id: number, name: string, value?: number}>;
  allocatedBonuses?: Record<number, number>; // choiceId -> bonus
}
```

#### 2.2 Create Pure Formatters
**Files to Create**:
- `frontend/src/lib/formatters/pure-formatters.ts`

**Deliverables**:
```typescript
export interface BaseFormatter {
  format(value: number, metadata?: FormatterMetadata): string;
}

export interface FormatterMetadata {
  label?: string;
  bonusType?: number;
  appliesToId?: number;
  diceType?: string;
  size?: string;
  choiceType?: FeatureChoiceType;
  // ... other formatting-specific metadata
}

export class DamageFormatter implements BaseFormatter {
  format(value: number, metadata?: FormatterMetadata): string {
    const diceType = metadata?.diceType || 'd6';
    return `${value}${diceType}`;
  }
}

export class HealingFormatter implements BaseFormatter {
  format(value: number): string {
    return `${value} hit points per day`;
  }
}

export class AttributeFormatter implements BaseFormatter {
  format(value: number, metadata?: FormatterMetadata): string {
    const label = metadata?.label || 'Attribute';
    return `${label}: ${formatSignedValue(value)}`;
  }
}

export class ChoiceFormatter implements BaseFormatter {
  format(choice: ChoiceData, context?: DisplayContext): string {
    // CRITICAL: Always use actual names/abbreviations, never IDs
    const choiceName = this.getChoiceName(choice, context);
    
    switch (choice.behavior) {
      case FeatureChoiceBehavior.Single:
        return `Select ${choiceName}`;
      case FeatureChoiceBehavior.Multiple:
        const count = choice.pickCount || 1;
        return `Select ${count} ${choiceName}${count > 1 ? 's' : ''}`;
      case FeatureChoiceBehavior.Allocation:
        return `Allocate bonus to ${choiceName}`;
      default:
        return `Select ${choiceName}`;
    }
  }
  
  private getChoiceName(choice: ChoiceData, context?: DisplayContext): string {
    switch (choice.type) {
      case FeatureChoiceType.Feat:
        return this.getFeatName(choice, context);
      case FeatureChoiceType.Feature:
        return this.getFeatureName(choice, context);
      case FeatureChoiceType.CreatureType:
        return this.getCreatureTypeName(choice, context);
      default:
        return choice.label || 'Unknown Choice';
    }
  }
  
  private getFeatName(choice: ChoiceData, context?: DisplayContext): string {
    // Priority 1: Use passed-in feat data
    if (choice.feat?.name) {
      return choice.feat.name;
    }
    
    // Priority 2: Use passed-in name lookup
    if (choice.featId && context?.featNames?.[choice.featId]) {
      return context.featNames[choice.featId];
    }
    
    // Priority 3: Use static data filter type name
    if (choice.filterType && FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType]) {
      return FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType].name;
    }
    
    // Priority 4: Fall back to ID with warning
    console.warn(`Unable to resolve feat name for ID: ${choice.featId}`);
    return `Feat ID: ${choice.featId}`;
  }
  
  private getFeatureName(choice: ChoiceData, context?: DisplayContext): string {
    // Priority 1: Use passed-in feature data
    if (choice.feature?.name) {
      return choice.feature.name;
    }
    
    // Priority 2: Use passed-in name lookup
    if (choice.featureId && context?.featureNames?.[choice.featureId]) {
      return context.featureNames[choice.featureId];
    }
    
    // Priority 3: Use static data filter type name
    if (choice.filterType && FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType]) {
      return FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType].name;
    }
    
    // Priority 4: Fall back to ID with warning
    console.warn(`Unable to resolve feature name for ID: ${choice.featureId}`);
    return `Feature ID: ${choice.featureId}`;
  }
  
  private getCreatureTypeName(choice: ChoiceData, context?: DisplayContext): string {
    // Priority 1: Use static data filter type name
    if (choice.filterType && FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType]) {
      return FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType].name;
    }
    
    // Priority 2: Fall back to generic name
    return 'Creature Type';
  }
}
```

#### 2.3 Create Schema-Based Conditional Value Detector
**Files to Create**:
- `frontend/src/lib/formatters/conditional-detector.ts`

**Deliverables**:
```typescript
export class ConditionalValueDetector {
  detectConditionals(modifiers: ModifierData[], context?: CharacterContext): Array<ConditionalValue> {
    const conditionals: Array<ConditionalValue> = [];
    
    modifiers.forEach(modifier => {
      if (modifier.conditions && modifier.conditions.length > 0) {
        modifier.conditions.forEach(condition => {
          const conditionalValue = this.createConditionalValue(modifier, condition, context);
          if (conditionalValue) {
            conditionals.push(conditionalValue);
          }
        });
      }
    });
    
    return conditionals.sort((a, b) => a.displayPriority - b.displayPriority);
  }
  
  private createConditionalValue(modifier: ModifierData, condition: ModifierConditionData, context?: CharacterContext): ConditionalValue | null {
    switch (condition.conditionType) {
      case FeatureModifierConditionType.character_size:
        return this.createSizeConditional(modifier, condition, context);
      case FeatureModifierConditionType.attack_type:
        return this.createAttackTypeConditional(modifier, condition);
      case FeatureModifierConditionType.trigger:
        return this.createTriggerConditional(modifier, condition);
      case FeatureModifierConditionType.feature:
        return this.createFeatureConditional(modifier, condition);
      case FeatureModifierConditionType.other:
        return this.createOtherConditional(modifier, condition);
      default:
        return null;
    }
  }
  
  private createSizeConditional(modifier: ModifierData, condition: ModifierConditionData, context?: CharacterContext): ConditionalValue {
    // Use static data for size name - no mapping needed
    const sizeName = SIZE_SELECT_LIST.find(size => size.value === condition.conditionValue)?.label || 'Unknown Size';
    const conditionDescription = `(${sizeName} size)`;
    
    return {
      condition: {
        condition: conditionDescription,
        conditionType: FeatureModifierConditionType.character_size,
        conditionValue: condition.conditionValue,
        description: `Applies to ${sizeName} characters`
      },
      value: modifier.value,
      breakdown: {
        components: [{
          source: `${sizeName} Size Bonus`,
          value: modifier.value,
          type: 'bonus',
          description: `Bonus for ${sizeName} characters`
        }]
      },
      displayPriority: this.getSizePriority(condition.conditionValue)
    };
  }
  
  private getSizePriority(sizeId: number): number {
    // Default size (Medium = 5) has lowest priority
    if (sizeId === 5) return 100;
    // Small and Large have medium priority
    if (sizeId === 4 || sizeId === 6) return 50;
    // Other sizes have high priority
    return 10;
  }
  
  // ... other conditional creation methods
}
```

### Phase 3: Progression Value Generation and Transition Detection

**Goal**: Create progression value generation and transition detection layers.

#### 3.1 Create Progression Generators
**Files to Create**:
- `frontend/src/lib/formatters/progression-generators.ts`

**Deliverables**:
```typescript
export interface ProgressionGenerator {
  generateValues(formula: FormulaParams, startLevel: number, endLevel: number, context?: CalculationContext): Array<ProgressionValue>;
}

export interface ProgressionValue {
  level: number;
  value: number;
  breakdown: CalculationBreakdown;
  conditionalValues?: Array<ConditionalValue>;
  choiceType?: string; // For choice-based progressions
}

export class EveryNLevelsGenerator implements ProgressionGenerator {
  generateValues(formula: EveryNLevelsParams, startLevel: number, endLevel: number): Array<ProgressionValue> {
    // Generate values for every N levels
    return progressionValues;
  }
}

export class ConditionalScalingGenerator implements ProgressionGenerator {
  generateValues(formula: ConditionalScalingParams, startLevel: number, endLevel: number): Array<ProgressionValue> {
    // Generate values based on thresholds
    return progressionValues;
  }
}

export class ChoiceBasedGenerator implements ProgressionGenerator {
  generateValues(choices: ChoiceData[], startLevel: number, endLevel: number, context?: CalculationContext): Array<ProgressionValue> {
    // Generate values for choice-based progressions
    return choiceProgressionValues;
  }
}

// ... other generators
```

#### 3.2 Create Transition Detectors
**Files to Create**:
- `frontend/src/lib/formatters/transition-detectors.ts`

**Deliverables**:
```typescript
export interface TransitionDetector {
  findTransitions(values: Array<ProgressionValue>): Array<TransitionPoint>;
}

export interface TransitionPoint {
  level: number;
  value: number;
  breakdown: CalculationBreakdown;
  changeType: string;
  conditionalValues?: Array<ConditionalValue>;
}

export class DefaultTransitionDetector implements TransitionDetector {
  findTransitions(values: Array<ProgressionValue>): Array<TransitionPoint> {
    // Find points where values change
    return transitionPoints;
  }
}

export class ChoiceTransitionDetector implements TransitionDetector {
  findTransitions(values: Array<ProgressionValue>): Array<TransitionPoint> {
    // Find points where choice patterns change
    return choiceTransitionPoints;
  }
}
```

#### 3.3 Create Generator Registry
**Files to Create**:
- `frontend/src/lib/formatters/generator-registry.ts`

**Deliverables**:
```typescript
export class GeneratorRegistry {
  private generators = new Map<FormulaId, ProgressionGenerator>();
  private choiceGenerators = new Map<FeatureChoiceType, ProgressionGenerator>();

  register(formulaId: FormulaId, generator: ProgressionGenerator): void {
    this.generators.set(formulaId, generator);
  }

  registerChoice(type: FeatureChoiceType, generator: ProgressionGenerator): void {
    this.choiceGenerators.set(type, generator);
  }

  getGenerator(formulaId: FormulaId): ProgressionGenerator | undefined {
    return this.generators.get(formulaId);
  }

  getChoiceGenerator(type: FeatureChoiceType): ProgressionGenerator | undefined {
    return this.choiceGenerators.get(type);
  }
}
```

**Success Criteria**:
- [ ] All formula types have pure calculators
- [ ] Choice-based calculators implemented
- [ ] Size-based conditional calculations working
- [ ] Calculation logic separated from display logic
- [ ] Context-aware calculations working correctly
- [ ] Conditional value detection implemented
- [ ] Comprehensive unit tests for calculators and conditional detection

### Phase 4: Grouping and Display Strategies

**Goal**: Create multi-item grouping and context-aware display strategies.

#### 4.1 Create Grouping Strategies
**Files to Create**:
- `frontend/src/lib/formatters/grouping-strategies.ts`

**Deliverables**:
```typescript
export interface GroupingStrategy {
  group(items: Array<FormattedItem>): string;
}

// Strategy for xxxEdit pages - CRITICAL: only group within single FeatureProgression
export class EditPageGroupingStrategy implements GroupingStrategy {
  group(items: Array<FormattedItem>): string {
    // CRITICAL: Only group items from the same FeatureProgression
    // Never group across different FeatureProgression entries
    // Must produce exactly one string per FeatureProgression
    return items.map(item => item.formattedValue).join(', ');
  }
  
  validateProgressionBoundary(items: Array<FormattedItem>): boolean {
    // Ensure all items belong to the same FeatureProgression
    const progressionIds = new Set(items.map(item => item.progressionId));
    return progressionIds.size === 1;
  }
}

// Strategy for xxxDetail pages - can group by Feature + Level, but ONLY within same feature
export class DetailPageGroupingStrategy implements GroupingStrategy {
  group(items: Array<FormattedItem>): string {
    // Can group multiple progressions by feature and level, but ONLY within the same feature
    // Used for showing progression patterns
    // CRITICAL: Never mix values from different features within a single feature's display
    return items.map(item => item.formattedValue).join(', ');
  }
  
  validateFeatureBoundary(items: Array<FormattedItem>): boolean {
    // Ensure all items belong to the same feature
    // This prevents mixing values from different features (e.g., Sneak Attack +5d6 with Trap Sense +3)
    const featureIds = new Set(items.map(item => item.featureId));
    return featureIds.size === 1;
  }
  
  groupByFeatureAndLevel(progressions: Array<ProgressionData>): Array<{featureId: number, level: number, items: Array<FormattedItem>}> {
    // Group progressions by feature AND level
    // This ensures we only group progressions that are both:
    // 1. From the same feature
    // 2. At the same level
    const grouped = new Map<string, Array<FormattedItem>>();
    
    progressions.forEach(progression => {
      const key = `${progression.featureId}-${progression.level}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      // Add items from this progression to the group
      grouped.get(key)!.push(...this.getFormattedItems(progression));
    });
    
    return Array.from(grouped.entries()).map(([key, items]) => {
      const [featureId, level] = key.split('-').map(Number);
      return { featureId, level, items };
    });
  }
  
  groupByLevel(progressions: Array<ProgressionData>): Array<{level: number, featureGroups: Array<{featureId: number, items: Array<FormattedItem>}>}> {
    // Group by level first, then by feature within each level
    // This allows: "Level 9: Sneak Attack +5d6, Trap Sense +3"
    // But prevents: "Level 9: Sneak Attack: +5d6, +3" (mixing feature values)
    const groupedByLevel = new Map<number, Map<number, Array<FormattedItem>>>();
    
    progressions.forEach(progression => {
      const level = progression.level;
      const featureId = progression.featureId;
      
      if (!groupedByLevel.has(level)) {
        groupedByLevel.set(level, new Map());
      }
      
      const levelGroup = groupedByLevel.get(level)!;
      if (!levelGroup.has(featureId)) {
        levelGroup.set(featureId, []);
      }
      
      // Add items from this progression to the feature group
      levelGroup.get(featureId)!.push(...this.getFormattedItems(progression));
    });
    
    return Array.from(groupedByLevel.entries()).map(([level, featureGroups]) => ({
      level,
      featureGroups: Array.from(featureGroups.entries()).map(([featureId, items]) => ({
        featureId,
        items
      }))
    }));
  }
}

// Strategy for character sheet - minimal grouping, context-specific
export class CharacterSheetGroupingStrategy implements GroupingStrategy {
  group(items: Array<FormattedItem>): string {
    // Minimal grouping - often one value per specific context
    // Used for specific skill calculations, attack bonuses, etc.
    return items.map(item => item.formattedValue).join(' + ');
  }
}

export class CommaGroupingStrategy implements GroupingStrategy {
  group(items: Array<FormattedItem>): string {
    return items.map(item => item.formattedValue).join(', ');
  }
}

export class PipeGroupingStrategy implements GroupingStrategy {
  group(items: Array<FormattedItem>): string {
    return items.map(item => item.formattedValue).join(' | ');
  }
}

export class ChoiceGroupingStrategy implements GroupingStrategy {
  group(items: Array<FormattedItem>): string {
    // Group choice-based items with special formatting
    // CRITICAL: Always use actual names, never IDs
    return items.map(item => item.formattedValue).join(' OR ');
  }
  
  groupMultipleChoices(choices: Array<ChoiceData>, context?: DisplayContext): string {
    // Group multiple choices within a single progression
    // Handle different choice types and behaviors
    
    const groupedChoices = this.groupByType(choices);
    const formattedGroups: string[] = [];
    
    // Format each choice type group
    Object.entries(groupedChoices).forEach(([type, typeChoices]) => {
      if (typeChoices.length === 1) {
        // Single choice of this type
        formattedGroups.push(this.formatChoice(typeChoices[0], context));
      } else {
        // Multiple choices of this type - use OR separator
        const formattedChoices = typeChoices.map(choice => this.formatChoice(choice, context));
        formattedGroups.push(formattedChoices.join(' OR '));
      }
    });
    
    // Join different choice types with commas
    return formattedGroups.join(', ');
  }
  
  private groupByType(choices: Array<ChoiceData>): Record<string, Array<ChoiceData>> {
    // Group choices by their type (feat, skill, language, etc.)
    const grouped: Record<string, Array<ChoiceData>> = {};
    
    choices.forEach(choice => {
      const type = choice.type;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(choice);
    });
    
    return grouped;
  }
  
  private formatChoice(choice: ChoiceData, context?: DisplayContext): string {
    // Format individual choice using the ChoiceFormatter
    const formatter = new ChoiceFormatter();
    return formatter.format(choice, context);
  }
}

// ... other grouping strategies
```

#### 4.2 Create Display Context Types
**Files to Create**:
- `frontend/src/lib/formatters/display-context.ts`

**Deliverables**:
```typescript
export interface DisplayContext {
  character?: CharacterContext;
  displayType: 'detail' | 'edit' | 'character-sheet';
  currentLevel?: number;
  showBreakdown?: boolean;
  // ... other display-specific context
}

export interface ProgressionData {
  level: number;
  feature: any;
  modifiers: Array<any>;
  choices: Array<any>;
  effects: Array<any>;
}

export interface CharacterSheetCalculationInput {
  choices: Record<string, any>; // Character's actual choices
  calculatedBonuses: Record<string, number>; // Results from calculation functions
  context: CharacterContext;
}
```

#### 4.3 Create Display Strategies
**Files to Create**:
- `frontend/src/lib/formatters/display-strategies.ts`

**Deliverables**:
```typescript
export interface DisplayStrategy {
  display(progression: ProgressionData, context: DisplayContext): DisplayResult;
}

export interface DisplayResult {
  formattedValue: string;
  breakdown: CalculationBreakdown;
  showBreakdown: boolean;
  components: Array<any>;
  levelEntries?: Array<{level: number, description: string}>;
  conditionalDisplays?: Array<ConditionalDisplay>;
  progressionId?: number; // For xxxEdit page 1:1 relationship
}

export interface ConditionalDisplay {
  condition: string;
  value: string;
  description: string;
  priority: number;
}

// Strategy for xxxDetail pages - groups by Feature + Level
export class DetailPageStrategy implements DisplayStrategy {
  display(progressions: Array<ProgressionData>, context: DisplayContext): DisplayResult {
    // Show calculated values for current level only
    // Handle context-dependent calculations
    // Preserve breakdown for potential display
    // Group multiple progressions by feature and level, but ONLY within the same feature
    
    const result = this.calculateCurrentLevelValue(progressions, context);
    
    return {
      formattedValue: result.formattedValue,
      breakdown: result.breakdown,
      showBreakdown: context.showBreakdown || false,
      components: result.components,
      levelEntries: this.generateLevelEntries(progressions, context)
    };
  }
  
  private generateLevelEntries(progressions: Array<ProgressionData>, context: DisplayContext): Array<{level: number, description: string}> {
    // Generate level-by-level entries for detail page display
    // Can group multiple progressions by feature and level, but ONLY within the same feature
    // Example: "Level 18: Wild Shape (6/day, elemental 2/day)" - same feature, multiple progressions grouped
    // Example: "Level 9: Sneak Attack +5d6, Trap Sense +3" - different features at same level, each feature distinct
    // NOT ALLOWED: "Level 9: Sneak Attack: +5d6, +3" (mixing feature values)
    return levelEntries;
  }
  
  private groupByFeatureAndLevel(progressions: Array<ProgressionData>): Array<{featureId: number, level: number, progressions: Array<ProgressionData>}> {
    // Group progressions by feature AND level
    // This ensures we only group progressions that are both:
    // 1. From the same feature
    // 2. At the same level
    const grouped = new Map<string, Array<ProgressionData>>();
    
    progressions.forEach(progression => {
      const key = `${progression.featureId}-${progression.level}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(progression);
    });
    
    return Array.from(grouped.entries()).map(([key, progressions]) => {
      const [featureId, level] = key.split('-').map(Number);
      return { featureId, level, progressions };
    });
  }
  
  private groupByLevelWithFeatureSeparation(progressions: Array<ProgressionData>): Array<{level: number, featureDisplays: Array<{featureId: number, featureName: string, display: string}>}> {
    // Group by level, but keep features separate
    // This allows "Level 9: Sneak Attack +5d6, Trap Sense +3" (distinct features)
    // But prevents "Level 9: Sneak Attack: +5d6, +3" (mixing feature values)
    const grouped = new Map<number, Array<{featureId: number, featureName: string, progressions: Array<ProgressionData>}>>();
    
    progressions.forEach(progression => {
      if (!grouped.has(progression.level)) {
        grouped.set(progression.level, []);
      }
      
      const levelGroup = grouped.get(progression.level)!;
      const featureGroup = levelGroup.find(g => g.featureId === progression.featureId);
      
      if (featureGroup) {
        featureGroup.progressions.push(progression);
      } else {
        levelGroup.push({
          featureId: progression.featureId,
          featureName: progression.feature?.name || `Feature ${progression.featureId}`,
          progressions: [progression]
        });
      }
    });
    
    return Array.from(grouped.entries()).map(([level, featureGroups]) => ({
      level,
      featureDisplays: featureGroups.map(group => ({
        featureId: group.featureId,
        featureName: group.featureName,
        display: this.formatFeatureGroup(group.progressions, context)
      }))
    }));
  }
}

// Strategy for xxxEdit pages - enforces 1:1 relationship
export class EditPageStrategy implements DisplayStrategy {
  display(progression: ProgressionData, context: DisplayContext): DisplayResult {
    // CRITICAL: Each FeatureProgression must produce exactly one formatted string
    // This string serves as a clickable link to FeatureProgressionDetailEdit.tsx
    // No cross-progression grouping, no multiple strings per progression
    
    const result = this.calculateSingleProgressionDisplay(progression, context);
    
    return {
      formattedValue: result.formattedValue,
      breakdown: result.breakdown,
      showBreakdown: context.showBreakdown || false,
      components: result.components,
      progressionId: progression.id // CRITICAL: Include progression ID for 1:1 relationship
    };
  }
  
  private calculateSingleProgressionDisplay(progression: ProgressionData, context: DisplayContext): EditPageDisplayResult {
    // Calculate display for a single progression only
    // This ensures the 1:1 relationship requirement
    const formatter = new FormatterOrchestrator();
    return formatter.formatSingleProgression(progression, context);
  }
}

// Strategy for character sheet - context-aware, minimal grouping
export class CharacterSheetStrategy implements DisplayStrategy {
  display(progression: ProgressionData, context: DisplayContext): DisplayResult {
    // Context-aware display based on character's current state
    // Minimal grouping, focus on specific values for specific contexts
    // Show conditional values when applicable
    
    const result = this.calculateContextAwareValue(progression, context);
    
    return {
      formattedValue: result.formattedValue,
      breakdown: result.breakdown,
      showBreakdown: context.showBreakdown || false,
      components: result.components,
      conditionalDisplays: this.generateConditionalDisplays(progression, context)
    };
  }
  
  private generateConditionalDisplays(progression: ProgressionData, context: DisplayContext): Array<ConditionalDisplay> {
    // Generate conditional displays for character sheet
    // Show both normal and special values with explanations
    const conditionals: Array<ConditionalDisplay> = [];
    
    if (progression.modifiers) {
      const detector = new ConditionalValueDetector();
      const conditionalValues = detector.detectConditionals(progression.modifiers, context.character);
      
      conditionalValues.forEach(cv => {
        conditionals.push({
          condition: cv.condition.condition,
          value: this.formatConditionalValue(cv),
          description: cv.condition.description,
          priority: cv.displayPriority
        });
      });
    }
    
    return conditionals.sort((a, b) => a.priority - b.priority);
  }
}

export class BreakdownDisplayStrategy implements DisplayStrategy {
  display(progression: ProgressionData, context: DisplayContext): DisplayResult {
    // Special strategy for showing detailed breakdowns
    // Used when user wants to see "show your work"
    
    const result = this.calculateDetailedBreakdown(progression, context);
    
    return {
      formattedValue: result.formattedValue,
      breakdown: result.breakdown,
      showBreakdown: true,
      components: result.components
    };
  }
}
```

**Success Criteria**:
- [ ] All grouping strategies implemented
- [ ] Display strategies working correctly
- [ ] Context handling centralized
- [ ] Choice-based display strategies implemented
- [ ] **CRITICAL**: EditPageStrategy produces exactly one string per FeatureProgression
- [ ] **CRITICAL**: No cross-progression grouping in xxxEdit contexts
- [ ] **CRITICAL**: FeatureProgression relationship preserved for link generation
- [ ] **CRITICAL**: DetailPageStrategy allows different features at same level but keeps their values separate
- [ ] **CRITICAL**: Feature boundary validation prevents mixing values from different features
- [ ] **CRITICAL**: All displays use actual names/abbreviations, never IDs
- [ ] **CRITICAL**: Choice formatting uses proper names for all choice types
- [ ] **CRITICAL**: Choice grouping follows proper patterns (OR for same type, commas for different types)
- [ ] Comprehensive unit tests for strategies
- [ ] Validation tests for progression boundary constraints
- [ ] Validation tests for feature boundary constraints
- [ ] Validation tests for name display requirements
- [ ] Validation tests for choice formatting patterns

### Phase 5: Character Sheet Breakdown Support

**Goal**: Implement character sheet breakdown functionality for multi-source calculations.

#### 5.1 Create Character Sheet Calculation Types
**Files to Create**:
- `frontend/src/lib/formatters/character-sheet-types.ts`

**Deliverables**:
```typescript
export interface CharacterSheetCalculation {
  finalValue: number;
  breakdown: CharacterSheetBreakdown;
  sources: Array<CalculationSource>;
  conditionalValues?: Array<ConditionalValue>;
}

export interface CharacterSheetBreakdown {
  baseValue: number;
  bonuses: Array<BreakdownComponent>;
  penalties: Array<BreakdownComponent>;
  caps: Array<BreakdownComponent>;
  replacements: Array<BreakdownComponent>;
  choices: Array<BreakdownComponent>; // For choice-based features
  totalFormula: string;
  explanation: string;
}

export interface CalculationSource {
  type: 'class-feature' | 'race-feature' | 'feat' | 'item' | 'spell' | 'temporary' | 'choice';
  name: string;
  value: number;
  breakdown: CalculationBreakdown;
}

export interface ChoiceBasedCalculation {
  choices: Record<string, any>;
  calculatedBonuses: Record<string, number>;
  breakdown: CharacterSheetBreakdown;
}
```

#### 5.2 Create Multi-Source Aggregators
**Files to Create**:
- `frontend/src/lib/formatters/multi-source-aggregators.ts`

**Deliverables**:
```typescript
export class ACCalculationAggregator {
  aggregateAC(character: CharacterContext): CharacterSheetCalculation {
    // Aggregate AC from multiple sources (base, dex, armor, items, etc.)
    // Return detailed breakdown with all components
  }
}

export class AttackBonusAggregator {
  aggregateAttackBonus(character: CharacterContext, weaponType: string): CharacterSheetCalculation {
    // Aggregate attack bonus from multiple sources
    // Return detailed breakdown with all components
  }
}

export class FavoredEnemyAggregator {
  aggregateFavoredEnemy(character: CharacterContext): ChoiceBasedCalculation {
    // Aggregate favored enemy bonuses from character choices
    // Return choice-based calculation with breakdown
  }
}

// ... other aggregators for different character sheet calculations
```

#### 5.3 Create Conditional Display Components
**Files to Create**:
- `frontend/src/lib/formatters/conditional-display.ts`

**Deliverables**:
```typescript
export class ConditionalDisplayManager {
  displayWithConditionals(baseValue: number, conditionalValues: ConditionalValue[]): string {
    let display = `${baseValue}`;
    
    if (conditionalValues.length > 0) {
      display += '\n';
      conditionalValues
        .sort((a, b) => a.displayPriority - b.displayPriority)
        .forEach(cv => {
          display += `  Special: ${cv.value} (${cv.condition.condition}) - ${cv.condition.description}\n`;
        });
    }
    
    return display;
  }
  
  displaySkillWithConditionals(skillName: string, baseValue: number, conditionalValues: ConditionalValue[]): string {
    let display = `${skillName}: ${baseValue}`;
    
    if (conditionalValues.length > 0) {
      display += '\n';
      conditionalValues
        .sort((a, b) => a.displayPriority - b.displayPriority)
        .forEach(cv => {
          display += `  Special: ${cv.value} (${cv.condition.condition}) - ${cv.condition.description}\n`;
        });
    }
    
    return display;
  }
  
  displayAttackWithConditionals(weaponName: string, baseValue: string, conditionalValues: ConditionalValue[]): string {
    let display = `${weaponName}: ${baseValue}`;
    
    if (conditionalValues.length > 0) {
      display += '\n';
      conditionalValues
        .sort((a, b) => a.displayPriority - b.displayPriority)
        .forEach(cv => {
          display += `  Special: ${cv.value} (${cv.condition.condition}) - ${cv.condition.description}\n`;
        });
    }
    
    return display;
  }
  
  displayChoiceWithConditionals(choiceName: string, baseValue: string, conditionalValues: ConditionalValue[]): string {
    let display = `${choiceName}: ${baseValue}`;
    
    if (conditionalValues.length > 0) {
      display += '\n';
      conditionalValues
        .sort((a, b) => a.displayPriority - b.displayPriority)
        .forEach(cv => {
          display += `  Special: ${cv.value} (${cv.condition.condition}) - ${cv.condition.description}\n`;
        });
    }
    
    return display;
  }
}
```

#### 5.4 Create Breakdown Display Components
**Files to Create**:
- `frontend/src/lib/formatters/breakdown-display.ts`

**Deliverables**:
```typescript
export class CharacterSheetBreakdownDisplay {
  displayBreakdown(calculation: CharacterSheetCalculation): string {
    // Format breakdown for display
    // Show base value, bonuses, penalties, caps, etc.
  }
  
  displayCompact(calculation: CharacterSheetCalculation): string {
    // Show just the final value with option to expand
  }
  
  displayChoiceBreakdown(calculation: ChoiceBasedCalculation): string {
    // Format choice-based breakdown for display
    // Show choices made and resulting bonuses
  }
}
```

**Success Criteria**:
- [ ] Character sheet calculation types defined
- [ ] Multi-source aggregators implemented
- [ ] Choice-based aggregators implemented
- [ ] Conditional display components working
- [ ] Breakdown display components working
- [ ] Comprehensive tests for character sheet calculations

### Phase 6: Error Handling and Performance
**Files to Create**:
- `frontend/src/lib/formatters/error-handling.ts`

**Deliverables**:
```typescript
export class ErrorHandler {
  handleCalculationError(error: Error, modifier: FeatureModifier): string {
    console.warn('Calculation error:', error.message, modifier);
    return `Raw Value: ${modifier.value}`;
  }

  handleFormattingError(error: Error, value: number): string {
    console.warn('Formatting error:', error.message, value);
    return value.toString();
  }
  
  handleChoiceError(error: Error, choice: ChoiceData): string {
    console.warn('Choice processing error:', error.message, choice);
    return `Choice: ${choice.type}`;
  }
}

export class ContextValidator {
  validateContext(formula: FormulaParams, context?: CalculationContext): ValidationResult {
    // Validate that required context is available
    // Return validation result with error details
  }
  
  validateChoiceContext(choices: ChoiceData[], context?: CalculationContext): ValidationResult {
    // Validate that required choice context is available
    // Return validation result with error details
  }
}

export class ProgressionBoundaryValidator {
  validateEditPageOutput(progressions: FeatureProgression[], formattedResults: DisplayResult[]): ValidationResult {
    // CRITICAL: Validate that xxxEdit pages maintain 1:1 FeatureProgression relationship
    // Ensure each progression produces exactly one formatted string
    // Ensure no cross-progression grouping occurs
    
    const errors: string[] = [];
    
    // Check that each progression has exactly one result
    progressions.forEach(progression => {
      const results = formattedResults.filter(result => result.progressionId === progression.id);
      if (results.length === 0) {
        errors.push(`Progression ${progression.id} has no formatted output`);
      } else if (results.length > 1) {
        errors.push(`Progression ${progression.id} has multiple formatted outputs (${results.length})`);
      }
    });
    
    // Check that each result belongs to exactly one progression
    formattedResults.forEach(result => {
      if (!result.progressionId) {
        errors.push(`Formatted result missing progressionId`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  validateNameDisplay(formattedResults: DisplayResult[]): ValidationResult {
    // CRITICAL: Validate that all displays use actual names/abbreviations, never IDs
    // This ensures user-friendly displays throughout the system
    
    const errors: string[] = [];
    
    formattedResults.forEach(result => {
      // Check for ID patterns in formatted values
      if (this.containsIdPattern(result.formattedValue)) {
        errors.push(`Formatted result contains ID pattern: "${result.formattedValue}"`);
      }
      
      // Check components for ID patterns
      if (result.components) {
        result.components.forEach(component => {
          if (component.formattedValue && this.containsIdPattern(component.formattedValue)) {
            errors.push(`Component contains ID pattern: "${component.formattedValue}"`);
          }
        });
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  private containsIdPattern(text: string): boolean {
    // Check for common ID patterns that should not appear in user-facing displays
    const idPatterns = [
      /ID:\s*\d+/i,
      /:\s*\d+$/,
      /^\d+$/,
      /ID\s*\d+/i,
      /feat\s*\d+/i,
      /skill\s*\d+/i,
      /language\s*\d+/i,
      /attribute\s*\d+/i,
      /creature\s*type\s*\d+/i
    ];
    
    return idPatterns.some(pattern => pattern.test(text));
  }
  
  validateDetailPageOutput(progressions: FeatureProgression[], formattedResults: DisplayResult[]): ValidationResult {
    // Validate that xxxDetail pages group by Feature + Level, but ONLY within the same feature
    // Multiple progressions can be grouped together, but only if they're from the same feature
    // Different features can be displayed at the same level, but their values must remain separate
    
    const errors: string[] = [];
    
    // Group results by feature and level
    const groupedByFeatureAndLevel = new Map<string, Array<DisplayResult>>();
    
    formattedResults.forEach(result => {
      const key = `${result.featureId}-${result.level}`;
      if (!groupedByFeatureAndLevel.has(key)) {
        groupedByFeatureAndLevel.set(key, []);
      }
      groupedByFeatureAndLevel.get(key)!.push(result);
    });
    
    // Validate that each group contains results from the same feature
    groupedByFeatureAndLevel.forEach((results, key) => {
      const featureIds = new Set(results.map(result => result.featureId));
      if (featureIds.size > 1) {
        const [featureId, level] = key.split('-');
        errors.push(`Level ${level} contains grouped results from different features: ${Array.from(featureIds).join(', ')}`);
      }
    });
    
    // Validate that feature values are not mixed within single displays
    formattedResults.forEach(result => {
      if (result.components && result.components.length > 0) {
        const componentFeatureIds = new Set(result.components.map(comp => comp.featureId).filter(id => id !== undefined));
        if (componentFeatureIds.size > 1) {
          errors.push(`Display result mixes values from different features: ${Array.from(componentFeatureIds).join(', ')}`);
        }
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  validateCharacterSheetOutput(progressions: FeatureProgression[], formattedResults: DisplayResult[]): ValidationResult {
    // Validate that character sheet output is context-specific
    // Minimal grouping, often one value per specific context
    return { isValid: true, errors: [] };
  }
}
```

#### 5.2 Create Performance Optimizations
**Files to Create**:
- `frontend/src/lib/formatters/calculation-cache.ts`

**Deliverables**:
```typescript
export class CalculationCache {
  private cache = new Map<string, number>();
  private choiceCache = new Map<string, any>();

  getCachedValue(key: string): number | undefined {
    return this.cache.get(key);
  }

  setCachedValue(key: string, value: number): void {
    this.cache.set(key, value);
  }
  
  getCachedChoice(key: string): any {
    return this.choiceCache.get(key);
  }
  
  setCachedChoice(key: string, value: any): void {
    this.choiceCache.set(key, value);
  }

  generateKey(formula: FormulaParams, level: number, context?: CalculationContext): string {
    // Generate cache key based on formula parameters and context
    return cacheKey;
  }
  
  generateChoiceKey(choices: ChoiceData[], context?: CalculationContext): string {
    // Generate cache key for choice-based calculations
    return choiceCacheKey;
  }
}
```

#### 5.3 Create Main Orchestrator
**Files to Create**:
- `frontend/src/lib/formatters/formatter-orchestrator.ts`

**Deliverables**:
```typescript
export class FormatterOrchestrator {
  constructor(
    private formatterRegistry: FormatterRegistry,
    private calculatorRegistry: CalculatorRegistry,
    private generatorRegistry: GeneratorRegistry,
    private errorHandler: ErrorHandler,
    private calculationCache: CalculationCache
  ) {}

  formatProgression(progression: ProgressionData, context: DisplayContext): DisplayResult {
    // Main orchestration logic
    // Coordinate between all layers
    return formattedOutput;
  }
  
  formatChoiceProgression(choices: ChoiceData[], context: DisplayContext): DisplayResult {
    // Handle choice-based progression formatting
    // Coordinate choice formatters and calculators
    return choiceFormattedOutput;
  }
  
  formatCharacterSheetCalculation(calculation: CharacterSheetCalculationInput): DisplayResult {
    // Handle character sheet calculation formatting
    // Coordinate with external calculation functions
    return characterSheetFormattedOutput;
  }
}
```

**Success Criteria**:
- [ ] Robust error handling implemented
- [ ] Performance optimizations working
- [ ] Main orchestrator coordinating all layers
- [ ] Choice-based orchestration working
- [ ] Comprehensive error handling tests

### Phase 7: Migration and Integration

**Goal**: Migrate existing code to new architecture and integrate with existing components.

#### 6.1 Create Migration Adapters
**Files to Create**:
- `frontend/src/lib/formatters/migration-adapters.ts`

**Deliverables**:
```typescript
export class LegacyFormatterAdapter {
  constructor(private orchestrator: FormatterOrchestrator) {}

  formatProgression(progression: any, character?: CharacterContext): string {
    // Adapter to maintain backward compatibility
    const context: DisplayContext = {
      character,
      displayType: 'detail', // Default to detail page behavior
      currentLevel: progression.level
    };
    return this.orchestrator.formatProgression(progression, context);
  }
  
  formatChoiceProgression(choices: any[], character?: CharacterContext): string {
    // Adapter for choice-based progressions
    const context: DisplayContext = {
      character,
      displayType: 'detail',
      currentLevel: 1
    };
    return this.orchestrator.formatChoiceProgression(choices, context);
  }
}
```

#### 6.2 Update Existing Components
**Files to Update**:
- `frontend/src/lib/Formatters.ts` (gradually replace with new system)
- `frontend/src/features/class/ClassDisplay.tsx`
- `frontend/src/features/class/ClassEdit.tsx`

**Deliverables**:
- Gradual migration of existing code
- Backward compatibility maintained
- New architecture integrated
- Choice-based features supported

#### 6.3 Create Integration Tests
**Files to Create**:
- `frontend/src/lib/formatters/__tests__/integration.test.ts`

**Deliverables**:
- End-to-end tests for complete workflows
- Performance tests
- Regression tests
- Choice-based feature tests

**Success Criteria**:
- [ ] Existing functionality preserved
- [ ] New architecture integrated
- [ ] Choice-based features working
- [ ] No performance regressions
- [ ] All tests passing

### Phase 8: Cleanup and Documentation

**Goal**: Clean up old code and create comprehensive documentation.

#### 7.1 Remove Old Code
**Files to Remove/Update**:
- Remove old mixed-responsibility functions
- Clean up unused imports
- Remove deprecated code

#### 7.2 Create Documentation
**Files to Create**:
- `frontend/src/lib/formatters/README.md`
- `frontend/src/lib/formatters/API.md`
- `frontend/src/lib/formatters/examples.md`

**Deliverables**:
- Comprehensive documentation
- API reference
- Usage examples
- Migration guide
- Choice-based feature documentation

#### 7.3 Final Testing and Validation
**Deliverables**:
- Complete test suite
- Performance validation
- User acceptance testing

**Success Criteria**:
- [ ] Old code removed
- [ ] Documentation complete
- [ ] All tests passing
- [ ] Performance validated

## Detailed Task Breakdown

### Phase 1: Foundation Setup
1. Create base interfaces and types
2. Extract pure formatters
3. Create choice formatters
4. Create formatter registry and tests

### Phase 2: Pure Formatters Completion
1. Complete all pure formatters
2. Complete choice formatters
3. Comprehensive testing and validation

### Phase 3: Calculation Layer Foundation
1. Create calculation context types
2. Create pure calculation functions
3. Create choice-based calculators
4. Create calculator registry

### Phase 4: Calculation Layer Completion
1. Complete all calculators
2. Complete choice-based calculators
3. Testing and validation

### Phase 5: Progression Generation
1. Create progression generators
2. Create choice-based generators
3. Create transition detectors

### Phase 6: Progression Layer Completion
1. Complete all generators and detectors
2. Testing and validation

### Phase 7: Grouping and Display Foundation
1. Create grouping strategies
2. Create choice grouping strategies
3. Create display context types
4. Create display strategies

### Phase 8: Display Layer Completion
1. Complete all display strategies
2. Complete choice-based display strategies
3. Testing and validation

### Phase 9: Character Sheet Integration
1. Create character sheet calculation types
2. Create multi-source aggregators
3. Create choice-based aggregators
4. Create conditional display components

### Phase 10: Character Sheet Completion
1. Complete all character sheet components
2. Testing and validation

### Phase 11: Error Handling
1. Implement error handling
2. Create context validation
3. Create choice error handling

### Phase 12: Performance and Orchestration
1. Implement performance optimizations
2. Create main orchestrator
3. Create choice-based orchestration

### Phase 13: Migration Foundation
1. Create migration adapters
2. Begin component updates
3. Begin choice-based feature integration

### Phase 14: Migration Completion
1. Complete component updates
2. Complete choice-based feature integration
3. Integration testing

### Phase 15: Cleanup
1. Remove old code
2. Create documentation
3. Create choice-based feature documentation

### Phase 16: Final Validation
1. Final testing and validation
2. Performance validation and user acceptance testing

## Risk Mitigation

### Technical Risks
- **Risk**: Breaking existing functionality during migration
- **Mitigation**: Comprehensive testing, gradual migration, rollback capability

- **Risk**: Choice-based features not working correctly
- **Mitigation**: Extensive testing of choice formatters and calculators

### Timeline Risks
- **Risk**: Project taking longer than expected
- **Mitigation**: Phased approach, prioritize core functionality, incremental delivery

### Performance Risks
- **Risk**: Performance degradation
- **Mitigation**: Performance testing throughout, caching strategies, optimization

## Success Metrics

### Code Quality
- [ ] 100% test coverage for new code
- [ ] No mixed responsibilities
- [ ] Consistent interfaces across layers
- [ ] Pure functions in lower layers
- [ ] Choice-based features properly handled

### Performance
- [ ] No performance regression
- [ ] Efficient calculation caching
- [ ] Fast rendering times
- [ ] Efficient choice processing

### Maintainability
- [ ] Easy to add new modifier types
- [ ] Easy to add new formula types
- [ ] Easy to add new choice types
- [ ] Clear documentation for each layer

### User Experience
- [ ] No display regressions
- [ ] Consistent behavior across contexts
- [ ] Clear error messages
- [ ] Choice-based features display correctly

## Conclusion

This implementation plan provides a structured approach to refactoring the formatter system. The phased approach ensures:

1. **Minimal Risk**: Each phase builds on the previous one with clear deliverables
2. **Incremental Value**: Each phase delivers working functionality
3. **Comprehensive Testing**: Testing is integrated throughout the process
4. **Backward Compatibility**: Existing functionality is preserved during migration
5. **Choice Support**: Choice-based features are properly supported throughout
6. **Clear Success Criteria**: Each phase has measurable success criteria

The plan addresses all identified pain points while maintaining system stability and delivering significant improvements to code quality, maintainability, and developer experience. The addition of choice-based feature support ensures the system can handle the full range of D&D feature complexity.

## Success Criteria

### Phase 1: Analysis and Planning
- [x] Comprehensive analysis of current formatter system
- [x] Identification of all pain points and architectural issues
- [x] Design of clean, layered architecture
- [x] Creation of detailed implementation plan
- [x] Documentation of all formula types and display requirements
- [x] Analysis of schema structures and data flow

### Phase 2: Core Infrastructure
- [ ] All core data types defined based on actual Prisma schema
- [ ] Pure formatters implemented for all modifier types
- [ ] Choice formatters implemented with name resolution
- [ ] Schema-based conditional value detection working
- [ ] Context interfaces properly defined with name lookup tables
- [ ] All interfaces match actual Zod schema types
- [ ] **CRITICAL**: Name resolution uses static-data package as primary source
- [ ] **CRITICAL**: Backend name lookups only as fallback for feat/feature/item names

### Phase 3: Value Calculation Layer
- [ ] All formula types have pure calculators
- [ ] Choice-based calculators implemented
- [ ] Size-based conditional calculations working
- [ ] Calculation logic separated from display logic
- [ ] Context-aware calculations working correctly
- [ ] Conditional value detection implemented
- [ ] Comprehensive unit tests for calculators and conditional detection

### Phase 4: Progression Generation and Transition Detection
- [ ] All formula types have progression generators
- [ ] Choice-based generators implemented
- [ ] Transition detection working correctly
- [ ] Pure functions with no side effects
- [ ] Comprehensive unit tests for generators and detectors

### Phase 5: Grouping and Display Strategies
- [ ] **CRITICAL**: EditPageStrategy enforces 1:1 relationship between FeatureProgression and display string
- [ ] **CRITICAL**: DetailPageStrategy groups by feature and level, never mixes values from different features
- [ ] **CRITICAL**: CharacterSheetStrategy provides context-aware, minimal grouping
- [ ] Choice grouping strategies implemented with proper name resolution
- [ ] Modifier grouping strategies implemented
- [ ] Effect grouping strategies implemented
- [ ] Boundary validation working for all display contexts
- [ ] **CRITICAL**: All displays use actual names/abbreviations, never IDs
- [ ] **CRITICAL**: Name display validation working correctly

### Phase 6: Integration and Error Handling
- [ ] Formatter orchestrator coordinates all layers correctly
- [ ] Error handling falls back to raw values with console logging
- [ ] Performance optimization implemented
- [ ] Caching strategies working
- [ ] Legacy formatter adapter implemented
- [ ] Comprehensive integration tests

### Phase 7: Character Sheet Integration
- [ ] Character sheet calculation input interfaces defined
- [ ] Choice-based calculation interfaces implemented
- [ ] Breakdown display components working
- [ ] Conditional display components working
- [ ] Character sheet integration tests passing
- [ ] Performance acceptable for character sheet calculations

### Validation Requirements
- [ ] **CRITICAL**: All xxxEdit pages maintain 1:1 FeatureProgression to display string relationship
- [ ] **CRITICAL**: All xxxDetail pages group by feature and level, never mix feature values
- [ ] **CRITICAL**: All displays use actual names/abbreviations, never IDs
- [ ] **CRITICAL**: Choice formatting uses proper name resolution from static-data
- [ ] **CRITICAL**: Conditional values display correctly with explanations
- [ ] **CRITICAL**: Character sheet integration works with external calculation functions
- [ ] **CRITICAL**: All formula types display correctly in all contexts
- [ ] **CRITICAL**: Size-based conditionals work correctly using static-data size mapping
- [ ] **CRITICAL**: Choice-based features display correctly
- [ ] **CRITICAL**: Error handling provides meaningful fallbacks

### Performance Requirements
- [ ] Formatter system handles 100+ progressions without performance issues
- [ ] Name resolution primarily uses static-data (no performance impact)
- [ ] No API calls from formatter - all name resolution from static-data or passed context
- [ ] Conditional detection doesn't impact performance
- [ ] Character sheet calculations complete within acceptable time
- [ ] Memory usage remains reasonable for large character sheets

### Testing Requirements
- [ ] Unit tests for all pure formatters
- [ ] Unit tests for all calculators
- [ ] Unit tests for all generators
- [ ] Unit tests for all grouping strategies
- [ ] Unit tests for all display strategies
- [ ] Integration tests for complete formatter pipeline
- [ ] Tests for all formula types and display contexts
- [ ] Tests for conditional value detection
- [ ] Tests for choice formatting and name resolution
- [ ] Tests for boundary validation
- [ ] Tests for error handling and fallbacks
- [ ] Performance tests for large datasets
- [ ] **CRITICAL**: Tests for name resolution priority order (passed-in → static-data → ID fallback)
- [ ] **CRITICAL**: Tests for static-data name resolution
- [ ] **CRITICAL**: Tests for console warnings when names cannot be resolved

### Data Structure Requirements
- [ ] Formula parameters (thresholds/values) converted to arrays in Zod schemas
- [x] Condition values made mandatory (not nullable) ✅ **COMPLETED**
- [ ] Enum handling uses numeric IDs with z.nativeEnum() validation
- [ ] Size mapping uses static-data directly (no custom mapping needed)
- [ ] Filter type names resolved from static-data constants
- [ ] Frontend dialog updated to handle array-based formula parameters

### Name Resolution Requirements
- [ ] **CRITICAL**: Priority 1: Use passed-in names from context
- [ ] **CRITICAL**: Priority 2: Use static-data package constants and maps
- [ ] **CRITICAL**: Priority 3: Display ID with warning if name cannot be resolved
- [ ] **CRITICAL**: Static data sources properly integrated
- [ ] **CRITICAL**: NO API calls from formatter - caller must provide names
- [ ] **CRITICAL**: No performance impact from static-data lookups
- [ ] **CRITICAL**: Console warnings when names cannot be resolved

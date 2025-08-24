# Refactoring Strategy

## Overview

This document outlines the strategy for refactoring the formatter system to address the identified pain points and create a clean, maintainable, and extensible architecture.

## Core Principles

### 1. Single Responsibility Principle
Each layer should have one clear, well-defined responsibility.

### 2. Dependency Inversion
High-level layers should not depend on low-level layers. Both should depend on abstractions.

### 3. Open/Closed Principle
The system should be open for extension but closed for modification.

### 4. Context Handling at Highest Layer
Context should be handled at the highest layer and passed down as needed.

### 5. Pure Functions
Lower layers should be pure functions with no side effects.

## Proposed Architecture

### Layer 1: Pure Formatters (Lowest Layer)

**Responsibility**: Convert calculated values to human-readable strings
**Characteristics**: Pure functions, no context dependencies, no calculations

```typescript
interface BaseFormatter {
  format(value: number, metadata?: FormatterMetadata): string;
}

interface FormatterMetadata {
  label?: string;
  bonusType?: number;
  appliesToId?: number;
  diceType?: string;
  // ... other formatting-specific metadata
}

class DamageFormatter implements BaseFormatter {
  format(value: number, metadata?: FormatterMetadata): string {
    const diceType = metadata?.diceType || 'd6';
    return `${value}${diceType}`;
  }
}

class HealingFormatter implements BaseFormatter {
  format(value: number): string {
    return `${value} hit points per day`;
  }
}

class AttributeFormatter implements BaseFormatter {
  format(value: number, metadata?: FormatterMetadata): string {
    const label = metadata?.label || 'Attribute';
    return `${label}: ${formatSignedValue(value)}`;
  }
}
```

### Layer 2: Value Calculation (Pure Functions)

**Responsibility**: Calculate values based on formulas and context, with detailed breakdown
**Characteristics**: Pure functions, context-aware calculations, no formatting, returns both value and breakdown

```typescript
interface CalculationResult {
  value: number;
  breakdown: CalculationBreakdown;
  conditionalValues?: Array<ConditionalValue>;
}

interface ConditionalValue {
  condition: ConditionalModifier;
  value: number;
  breakdown: CalculationBreakdown;
  displayPriority: number; // For ordering multiple conditional values
}

interface CalculationBreakdown {
  components: Array<BreakdownComponent>;
  formula?: string;
  explanation?: string;
}

interface BreakdownComponent {
  source: string; // "Base AC", "Dex Modifier", "Monk WIS Bonus", etc.
  value: number;
  type: 'base' | 'bonus' | 'penalty' | 'cap' | 'replacement';
  description?: string;
  formula?: string; // For complex components
  condition?: ConditionalModifier; // For conditional components
}

interface ConditionalModifier {
  condition: string; // "vs orcs and goblins", "stone or metal", "when raging", etc.
  conditionType: 'racial' | 'class' | 'feat' | 'item' | 'circumstantial';
  bonus: number;
  description?: string;
  appliesTo?: string; // What this condition applies to (skill, attack, etc.)
}

interface FormulaCalculator {
  calculate(formula: FormulaParams, level: number, context?: CalculationContext): CalculationResult;
}

interface CalculationContext {
  character?: CharacterContext;
  progressionLevel: number;
  currentLevel?: number;
  // ... other calculation-specific context
}

class ConditionalScalingCalculator implements FormulaCalculator {
  calculate(formula: ConditionalScalingParams, level: number): CalculationResult {
    // Pure calculation logic with breakdown
    const { thresholds, values } = formula;
    // ... calculation logic
    
    return {
      value: calculatedValue,
      breakdown: {
        components: [
          {
            source: "Conditional Scaling",
            value: calculatedValue,
            type: 'replacement',
            description: `Level ${level} value from conditional scaling`,
            formula: `Threshold-based calculation: ${thresholds} -> ${values}`
          }
        ],
        formula: `Conditional scaling at level ${level}`,
        explanation: `Value determined by level thresholds`
      }
    };
  }
}

class AttributeDependentCalculator implements FormulaCalculator {
  calculate(formula: AttributeDependentParams, level: number, context?: CalculationContext): CalculationResult {
    if (!context?.character) {
      // Return formula structure when no context
      return {
        value: 0,
        breakdown: {
          components: [
            {
              source: "Attribute Modifier",
              value: 0,
              type: 'bonus',
              description: "Attribute modifier (context required)",
              formula: `+${getAttributeName(formula.attributeId)}`
            }
          ],
          formula: `Base + ${getAttributeName(formula.attributeId)}`,
          explanation: "Attribute-dependent calculation (context required)"
        }
      };
    }
    
    // Calculate with context and provide detailed breakdown
    const attributeValue = getAttributeValue(context.character, formula.attributeId);
    const baseValue = formula.baseValue || 0;
    const totalValue = baseValue + attributeValue;
    
    // Check for conditional modifiers
    const conditionalValues = this.getConditionalValues(context.character, baseValue, attributeValue);
    
    return {
      value: totalValue,
      breakdown: {
        components: [
          {
            source: "Base Value",
            value: baseValue,
            type: 'base',
            description: "Base value from feature"
          },
          {
            source: `${getAttributeName(formula.attributeId)} Modifier`,
            value: attributeValue,
            type: 'bonus',
            description: `Modifier from ${getAttributeName(formula.attributeId)} attribute`,
            formula: `${getAttributeName(formula.attributeId)} (${attributeValue})`
          }
        ],
        formula: `${baseValue} + ${getAttributeName(formula.attributeId)} (${attributeValue}) = ${totalValue}`,
        explanation: `Total calculated from base value plus attribute modifier`
      },
      conditionalValues
    };
  }
  
  private getConditionalValues(character: CharacterContext, baseValue: number, attributeValue: number): Array<ConditionalValue> {
    const conditionalValues: ConditionalValue[] = [];
    
    // Check for racial conditional modifiers
    if (character.race === 'Dwarf') {
      // Example: Dwarf stonecunning for Appraise skill
      if (this.isAppraiseSkill()) {
        conditionalValues.push({
          condition: {
            condition: "stone or metal",
            conditionType: 'racial',
            bonus: 2,
            description: "Dwarf racial bonus to Appraise checks involving stone or metal",
            appliesTo: "Appraise"
          },
          value: baseValue + attributeValue + 2,
          breakdown: {
            components: [
              {
                source: "Base Value",
                value: baseValue,
                type: 'base'
              },
              {
                source: "Attribute Modifier",
                value: attributeValue,
                type: 'bonus'
              },
              {
                source: "Dwarf Stonecunning",
                value: 2,
                type: 'bonus',
                condition: {
                  condition: "stone or metal",
                  conditionType: 'racial',
                  bonus: 2,
                  appliesTo: "Appraise"
                }
              }
            ],
            formula: `${baseValue} + ${attributeValue} + 2 = ${baseValue + attributeValue + 2}`,
            explanation: "Dwarf racial bonus applies to stone or metal items"
          },
          displayPriority: 1
        });
      }
    }
    
    return conditionalValues;
  }
}
```

### Layer 3: Progression Value Generation

**Responsibility**: Generate progression values across level ranges with breakdowns
**Characteristics**: Pure functions, context-aware, no formatting, returns both values and breakdowns

```typescript
interface ProgressionValue {
  level: number;
  value: number;
  breakdown: CalculationBreakdown;
}

interface ProgressionGenerator {
  generateValues(formula: FormulaParams, startLevel: number, endLevel: number, context?: CalculationContext): Array<ProgressionValue>;
}

class EveryNLevelsGenerator implements ProgressionGenerator {
  generateValues(formula: EveryNLevelsParams, startLevel: number, endLevel: number): Array<ProgressionValue> {
    // Generate values for every N levels with breakdowns
    const progressionValues: ProgressionValue[] = [];
    
    for (let level = startLevel; level <= endLevel; level++) {
      const result = this.calculateLevelValue(formula, level);
      progressionValues.push({
        level,
        value: result.value,
        breakdown: result.breakdown
      });
    }
    
    return progressionValues;
  }
  
  private calculateLevelValue(formula: EveryNLevelsParams, level: number): CalculationResult {
    // Calculate value for specific level with breakdown
    const intervals = Math.floor((level - formula.formulaStartLevel) / formula.interval);
    const value = formula.baseValue + (intervals * formula.baseValue);
    
    return {
      value,
      breakdown: {
        components: [
          {
            source: "Base Value",
            value: formula.baseValue,
            type: 'base',
            description: "Base value from feature"
          },
          {
            source: "Level Scaling",
            value: intervals * formula.baseValue,
            type: 'bonus',
            description: `Additional value from level scaling (${intervals} intervals)`,
            formula: `${intervals} × ${formula.baseValue}`
          }
        ],
        formula: `${formula.baseValue} + (${intervals} × ${formula.baseValue}) = ${value}`,
        explanation: `Value increases every ${formula.interval} levels starting at level ${formula.formulaStartLevel}`
      }
    };
  }
}

class ConditionalScalingGenerator implements ProgressionGenerator {
  generateValues(formula: ConditionalScalingParams, startLevel: number, endLevel: number): Array<ProgressionValue> {
    // Generate values based on thresholds with breakdowns
    const progressionValues: ProgressionValue[] = [];
    
    for (let level = startLevel; level <= endLevel; level++) {
      const result = this.calculateLevelValue(formula, level);
      progressionValues.push({
        level,
        value: result.value,
        breakdown: result.breakdown
      });
    }
    
    return progressionValues;
  }
  
  private calculateLevelValue(formula: ConditionalScalingParams, level: number): CalculationResult {
    // Calculate value for specific level with breakdown
    const value = this.getThresholdValue(formula, level);
    
    return {
      value,
      breakdown: {
        components: [
          {
            source: "Threshold-Based Value",
            value,
            type: 'replacement',
            description: `Value determined by level ${level} threshold`,
            formula: `Threshold calculation for level ${level}`
          }
        ],
        formula: `Threshold-based value at level ${level}`,
        explanation: `Value determined by level thresholds: ${formula.thresholds}`
      }
    };
  }
}
```

### Layer 4: Transition Detection

**Responsibility**: Find transition points where values change, preserving breakdowns
**Characteristics**: Pure functions, no context dependencies

```typescript
interface TransitionPoint {
  level: number;
  value: number;
  breakdown: CalculationBreakdown;
  changeType: 'increase' | 'decrease' | 'replacement';
}

interface TransitionDetector {
  findTransitions(values: Array<ProgressionValue>): Array<TransitionPoint>;
}

class DefaultTransitionDetector implements TransitionDetector {
  findTransitions(values: Array<ProgressionValue>): Array<TransitionPoint> {
    // Find points where values change, preserving breakdowns
    const transitionPoints: TransitionPoint[] = [];
    let lastValue = 0;

    for (const { level, value, breakdown } of values) {
      if (value !== lastValue) {
        const changeType = this.determineChangeType(lastValue, value);
        transitionPoints.push({
          level,
          value,
          breakdown,
          changeType
        });
        lastValue = value;
      }
    }

    return transitionPoints;
  }

  private determineChangeType(previousValue: number, currentValue: number): 'increase' | 'decrease' | 'replacement' {
    if (currentValue > previousValue) return 'increase';
    if (currentValue < previousValue) return 'decrease';
    return 'replacement';
  }
}
```

### Layer 5: Multi-Item Grouping

**Responsibility**: Combine multiple formatted items with breakdown aggregation
**Characteristics**: Pure functions, no context dependencies

```typescript
interface FormattedItemWithBreakdown {
  formattedValue: string;
  breakdown: CalculationBreakdown;
  metadata?: FormatterMetadata;
}

interface GroupedResult {
  formattedValue: string;
  breakdown: CalculationBreakdown;
  components: Array<FormattedItemWithBreakdown>;
}

interface GroupingStrategy {
  group(items: Array<FormattedItemWithBreakdown>): GroupedResult;
}

class CommaGroupingStrategy implements GroupingStrategy {
  group(items: Array<FormattedItemWithBreakdown>): GroupedResult {
    const formattedValue = items.map(item => item.formattedValue).join(', ');
    
    // Aggregate breakdowns from all items
    const aggregatedBreakdown = this.aggregateBreakdowns(items.map(item => item.breakdown));
    
    return {
      formattedValue,
      breakdown: aggregatedBreakdown,
      components: items
    };
  }

  private aggregateBreakdowns(breakdowns: Array<CalculationBreakdown>): CalculationBreakdown {
    // Combine all components from multiple breakdowns
    const allComponents = breakdowns.flatMap(bd => bd.components);
    
    return {
      components: allComponents,
      formula: breakdowns.map(bd => bd.formula).filter(Boolean).join(' + '),
      explanation: `Combined calculation from ${breakdowns.length} sources`
    };
  }
}

class PipeGroupingStrategy implements GroupingStrategy {
  group(items: Array<FormattedItemWithBreakdown>): GroupedResult {
    const formattedValue = items.map(item => item.formattedValue).join(' | ');
    
    // For choice-based grouping, maintain separate breakdowns
    const aggregatedBreakdown = this.aggregateChoiceBreakdowns(items.map(item => item.breakdown));
    
    return {
      formattedValue,
      breakdown: aggregatedBreakdown,
      components: items
    };
  }

  private aggregateChoiceBreakdowns(breakdowns: Array<CalculationBreakdown>): CalculationBreakdown {
    // For choices, show as alternatives rather than combined
    return {
      components: breakdowns.flatMap(bd => bd.components),
      formula: `Choice between: ${breakdowns.map(bd => bd.formula).filter(Boolean).join(' | ')}`,
      explanation: `Multiple choice options available`
    };
  }
}
```

### Layer 6: Context-Aware Display Logic (Highest Layer)

**Responsibility**: Determine display strategy based on context, with breakdown preservation
**Characteristics**: Context handling, strategy selection, orchestration, breakdown management

```typescript
interface DisplayResult {
  formattedValue: string;
  breakdown: CalculationBreakdown;
  showBreakdown: boolean;
  components: Array<FormattedItemWithBreakdown>;
  conditionalDisplays?: Array<ConditionalDisplay>;
}

interface ConditionalDisplay {
  condition: string;
  formattedValue: string;
  breakdown: CalculationBreakdown;
  displayPriority: number;
  conditionType: 'racial' | 'class' | 'feat' | 'item' | 'circumstantial';
}

interface DisplayStrategy {
  display(progression: ProgressionData, context: DisplayContext): DisplayResult;
}

interface DisplayContext {
  character?: CharacterContext;
  displayType: 'detail' | 'edit' | 'character-sheet' | 'breakdown';
  showBreakdown?: boolean;
  // ... other display-specific context
}

class DetailPageStrategy implements DisplayStrategy {
  display(progression: ProgressionData, context: DisplayContext): DisplayResult {
    // Show calculated values for current level only
    // Handle context-dependent calculations
    // Preserve breakdown for potential display
    
    const result = this.calculateCurrentLevelValue(progression, context);
    
    return {
      formattedValue: result.formattedValue,
      breakdown: result.breakdown,
      showBreakdown: context.showBreakdown || false,
      components: result.components
    };
  }
}

class EditPageStrategy implements DisplayStrategy {
  display(progression: ProgressionData, context: DisplayContext): DisplayResult {
    // Show full progression patterns
    // Handle context-dependent calculations
    // Preserve breakdown for potential display
    
    const result = this.calculateProgressionPattern(progression, context);
    
    return {
      formattedValue: result.formattedValue,
      breakdown: result.breakdown,
      showBreakdown: context.showBreakdown || false,
      components: result.components
    };
  }
}

class CharacterSheetStrategy implements DisplayStrategy {
  display(progression: ProgressionData, context: DisplayContext): DisplayResult {
    // Show calculated values using character data
    // Handle conditional modifiers based on character choices
    // Always preserve breakdown for character sheet display
    
    const result = this.calculateCharacterValue(progression, context);
    
    // Process conditional values for character sheet display
    const conditionalDisplays = this.processConditionalDisplays(result.conditionalValues);
    
    return {
      formattedValue: result.formattedValue,
      breakdown: result.breakdown,
      showBreakdown: true, // Always show breakdown on character sheets
      components: result.components,
      conditionalDisplays
    };
  }
  
  private processConditionalDisplays(conditionalValues?: Array<ConditionalValue>): Array<ConditionalDisplay> {
    if (!conditionalValues) return [];
    
    return conditionalValues
      .sort((a, b) => a.displayPriority - b.displayPriority)
      .map(cv => ({
        condition: cv.condition.condition,
        formattedValue: this.formatConditionalValue(cv),
        breakdown: cv.breakdown,
        displayPriority: cv.displayPriority,
        conditionType: cv.condition.conditionType
      }));
  }
  
  private formatConditionalValue(conditionalValue: ConditionalValue): string {
    // Format conditional value with condition indicator
    return `${conditionalValue.value} (${conditionalValue.condition.condition})`;
  }
}

class BreakdownDisplayStrategy implements DisplayStrategy {
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

## Formula Classification Strategy

### 1. Single Value Formulas
**Types**: LINEAR_SCALING, LEVEL_TIMES_VALUE, VALUE_PLUS_LEVEL
**Behavior**: Always show calculated value for current level
**Context Handling**: Same behavior with or without character context

### 2. Progression Pattern Formulas
**Types**: EVERY_N_LEVELS, CONDITIONAL_SCALING, DICE_SCALING
**Behavior**: Show all levels where values change
**Context Handling**: 
- With character context: Show full progression pattern
- Without character context: Show single value for current level

### 3. Attribute-Dependent Formulas
**Types**: ATTRIBUTE_BASED, ATTRIBUTE_MODIFIER, LEVEL_TIMES_ATTRIBUTE, LEVEL_PLUS_ATTRIBUTE
**Behavior**: Show calculated value or formula structure
**Context Handling**:
- With character context: Show calculated value
- Without character context: Show formula structure

## Conditional Value Handling Strategy

### 1. Schema-Based Conditional Modifiers
The system leverages the actual `FeatureModifier` and `FeatureModifierCondition` schema:

```typescript
// From the actual schema
interface FeatureModifier {
  id: number;
  featureProgressionId: number;
  type: ModifierType;
  value: number;
  bonusType: FeatureBonusType | null;
  appliesTo: ModifierAppliesToType | null;
  appliesToId: number | null;
  formulaParamsId: number | null;
  conditions: FeatureModifierCondition[];
  formulaParams?: FeatureFormulaParams;
}

interface FeatureModifierCondition {
  id: number;
  featureModifierId: number;
  conditionType: FeatureModifierConditionType;
  conditionValue: number | null;
}

// Enhanced for conditional display
interface ConditionalModifier {
  condition: string; // Human-readable condition description
  conditionType: 'racial' | 'class' | 'feat' | 'item' | 'circumstantial';
  bonus: number;
  description?: string;
  appliesTo?: string; // What this condition applies to
}
```

### 2. Schema-Based Conditional Value Detection
Conditional values are detected by examining `FeatureModifier.conditions`:

```typescript
class ConditionalValueDetector {
  detectConditionalValues(
    character: CharacterContext, 
    baseCalculation: CalculationResult,
    modifiers: FeatureModifier[]
  ): Array<ConditionalValue> {
    const conditionalValues: ConditionalValue[] = [];
    
    // Find modifiers with conditions
    const conditionalModifiers = modifiers.filter(mod => mod.conditions.length > 0);
    
    conditionalModifiers.forEach(modifier => {
      const conditionalValue = this.processConditionalModifier(
        character, 
        baseCalculation, 
        modifier
      );
      if (conditionalValue) {
        conditionalValues.push(conditionalValue);
      }
    });
    
    return conditionalValues;
  }
  
  private processConditionalModifier(
    character: CharacterContext,
    baseCalc: CalculationResult,
    modifier: FeatureModifier
  ): ConditionalValue | null {
    // Check if conditions are met
    const conditionsMet = this.evaluateConditions(modifier.conditions, character);
    if (!conditionsMet) return null;
    
    // Create conditional value based on modifier type
    switch (modifier.appliesTo) {
      case ModifierAppliesToType.Skill:
        return this.createSkillConditional(baseCalc, modifier);
      case ModifierAppliesToType.Attack:
        return this.createAttackConditional(baseCalc, modifier);
      case ModifierAppliesToType.Damage:
        return this.createDamageConditional(baseCalc, modifier);
      default:
        return this.createGenericConditional(baseCalc, modifier);
    }
  }
  
  private evaluateConditions(
    conditions: FeatureModifierCondition[], 
    character: CharacterContext
  ): boolean {
    return conditions.every(condition => {
      switch (condition.conditionType) {
        case FeatureModifierConditionType.trigger:
          return this.evaluateTriggerCondition(condition.conditionValue, character);
        case FeatureModifierConditionType.attack_type:
          return this.evaluateAttackTypeCondition(condition.conditionValue, character);
        case FeatureModifierConditionType.character_size:
          return this.evaluateSizeCondition(condition.conditionValue, character);
        case FeatureModifierConditionType.other:
          return this.evaluateOtherCondition(condition.conditionValue, character);
        default:
          return true;
      }
    });
  }
  
  private createSkillConditional(baseCalc: CalculationResult, modifier: FeatureModifier): ConditionalValue {
    const conditionDescription = this.getConditionDescription(modifier.conditions);
    
    return {
      condition: {
        condition: conditionDescription,
        conditionType: this.getConditionType(modifier),
        bonus: modifier.value,
        description: `${this.getBonusTypeName(modifier.bonusType)} bonus to skill checks`,
        appliesTo: this.getAppliesToName(modifier.appliesTo)
      },
      value: baseCalc.value + modifier.value,
      breakdown: this.createConditionalBreakdown(baseCalc, modifier),
      displayPriority: this.getDisplayPriority(modifier)
    };
  }
}
```

### 3. Concrete Conditional Display Examples

#### Dwarf Stonecunning Example
**Schema Data:**
```typescript
// FeatureModifier for Dwarf Stonecunning
{
  id: 123,
  type: ModifierType.Bonus,
  value: 2,
  appliesTo: ModifierAppliesToType.Skill,
  appliesToId: SKILL_MAP.Appraise, // Appraise skill ID
  bonusType: FeatureBonusType.Racial,
  conditions: [
    {
      id: 456,
      conditionType: FeatureModifierConditionType.other,
      conditionValue: 789 // Encoded condition: "stone_or_metal"
    }
  ]
}
```

**Display Output:**
```
Appraise: +5 (4 ranks + 1 INT)
  Special: +7 (stone or metal) - Racial bonus
```

#### Dwarf Weapon Familiarity Example
**Schema Data:**
```typescript
// FeatureModifier for Dwarf vs Orcs/Goblins
{
  id: 124,
  type: ModifierType.Bonus,
  value: 1,
  appliesTo: ModifierAppliesToType.Attack,
  appliesToId: null, // Applies to all weapon attacks
  bonusType: FeatureBonusType.Racial,
  conditions: [
    {
      id: 457,
      conditionType: FeatureModifierConditionType.other,
      conditionValue: 790 // Encoded condition: "vs_orcs_and_goblins"
    }
  ]
}
```

**Display Output:**
```
Longsword: +6/+1 (4 BAB + 2 STR)
  Special: +7/+2 (vs orcs and goblins) - Racial bonus
```

### 4. Character Sheet Integration
```typescript
class SkillDisplayManager {
  displaySkill(
    skillName: string, 
    baseValue: number, 
    conditionalValues: ConditionalValue[]
  ): string {
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
}
```

## Concrete Layer-by-Layer Examples

### Example 1: Dwarf Stonecunning (Appraise Skill)

#### Input Data (Schema)
```typescript
// FeatureProgression
{
  id: 1001,
  sourceType: FeatureSourceType.Race,
  level: 1,
  featureId: 501, // Stonecunning feature
  raceId: 1, // Dwarf
  modifiers: [
    {
      id: 2001,
      type: ModifierType.Bonus,
      value: 2,
      appliesTo: ModifierAppliesToType.Skill,
      appliesToId: 15, // Appraise skill ID
      bonusType: FeatureBonusType.Racial,
      conditions: [
        {
          id: 3001,
          conditionType: FeatureModifierConditionType.other,
          conditionValue: 789 // Encoded: "stone_or_metal"
        }
      ]
    }
  ]
}
```

#### Layer 1: Pure Formatters
```typescript
// SkillFormatter
class SkillFormatter {
  format(skillId: number, value: number): string {
    const skillName = getSkillName(skillId); // "Appraise"
    return `${skillName}: +${value}`;
  }
}

// ConditionalFormatter
class ConditionalFormatter {
  format(condition: string, value: number, bonusType: string): string {
    return `Special: +${value} (${condition}) - ${bonusType} bonus`;
  }
}
```

#### Layer 2: Value Calculation
```typescript
// Base calculation (from character sheet)
const baseCalculation = {
  value: 5, // 4 ranks + 1 INT
  breakdown: {
    components: [
      { source: "Skill Ranks", value: 4, type: 'base' },
      { source: "INT Modifier", value: 1, type: 'bonus' }
    ],
    formula: "4 + 1 = 5"
  }
};

// Conditional calculation
const conditionalCalculation = {
  value: 7, // 5 + 2 racial bonus
  breakdown: {
    components: [
      { source: "Skill Ranks", value: 4, type: 'base' },
      { source: "INT Modifier", value: 1, type: 'bonus' },
      { 
        source: "Dwarf Stonecunning", 
        value: 2, 
        type: 'bonus',
        condition: {
          condition: "stone or metal",
          conditionType: 'racial',
          bonus: 2,
          appliesTo: "Appraise"
        }
      }
    ],
    formula: "4 + 1 + 2 = 7"
  }
};
```

#### Layer 3: Progression Value Generation
```typescript
// For character sheet context (level 1)
const progressionValues = [
  {
    level: 1,
    value: 5,
    breakdown: baseCalculation.breakdown
  }
];

// Conditional values detected
const conditionalValues = [
  {
    level: 1,
    value: 7,
    breakdown: conditionalCalculation.breakdown,
    condition: {
      condition: "stone or metal",
      conditionType: 'racial',
      bonus: 2
    }
  }
];
```

#### Layer 4: Transition Detection
```typescript
// No transitions for this example (static bonus)
const transitions = []; // Empty - no level-based changes
```

#### Layer 5: Multi-Item Grouping
```typescript
// Group base and conditional values
const groupedResult = {
  formattedValue: "Appraise: +5",
  breakdown: baseCalculation.breakdown,
  components: [
    {
      type: "skill",
      value: 5,
      formattedValue: "Appraise: +5"
    }
  ],
  conditionalDisplays: [
    {
      condition: "stone or metal",
      formattedValue: "Special: +7 (stone or metal) - Racial bonus",
      breakdown: conditionalCalculation.breakdown,
      displayPriority: 1,
      conditionType: 'racial'
    }
  ]
};
```

#### Layer 6: Context-Aware Display Logic
```typescript
// Character sheet display
const characterSheetDisplay = {
  formattedValue: "Appraise: +5",
  breakdown: baseCalculation.breakdown,
  showBreakdown: true,
  components: groupedResult.components,
  conditionalDisplays: groupedResult.conditionalDisplays
};

// Final output:
// Appraise: +5 (4 ranks + 1 INT)
//   Special: +7 (stone or metal) - Racial bonus
```

### Example 2: Monk Unarmed Strike (Formula-Based Damage)

#### Input Data (Schema)
```typescript
// FeatureProgression
{
  id: 1002,
  sourceType: FeatureSourceType.Class,
  level: 1,
  featureId: 502, // Unarmed Strike feature
  classId: 3, // Monk
  modifiers: [
    {
      id: 2002,
      type: ModifierType.Replacement,
      value: 0, // Base value ignored for formula
      appliesTo: ModifierAppliesToType.UnarmedDamage,
      formulaParams: {
        id: 4001,
        formulaId: FormulaId.CONDITIONAL_SCALING,
        thresholds: "4,8,12,16,20",
        values: "1d6,1d8,1d10,2d6,2d8"
      }
    }
  ]
}
```

#### Layer 1: Pure Formatters
```typescript
// DamageFormatter
class DamageFormatter {
  format(damageDice: string): string {
    return `Unarmed Damage: ${damageDice}`;
  }
}
```

#### Layer 2: Value Calculation
```typescript
// Formula calculation for level 1
const formulaCalculation = {
  value: 6, // 1d6 average
  breakdown: {
    components: [
      { 
        source: "Unarmed Strike Formula", 
        value: 6, 
        type: 'replacement',
        formula: "1d6 (level 1-3)"
      }
    ],
    formula: "Conditional scaling: 1d6 at level 1",
    explanation: "Monk unarmed damage scales with level"
  }
};
```

#### Layer 3: Progression Value Generation
```typescript
// Generate values for all levels
const progressionValues = [
  { level: 1, value: 6, breakdown: formulaCalculation.breakdown },
  { level: 4, value: 8, breakdown: { /* level 4 breakdown */ } },
  { level: 8, value: 10, breakdown: { /* level 8 breakdown */ } },
  // ... more levels
];
```

#### Layer 4: Transition Detection
```typescript
// Detect level transitions
const transitions = [
  {
    level: 4,
    value: 8,
    breakdown: { /* level 4 breakdown */ },
    changeType: "damage_increase"
  },
  {
    level: 8,
    value: 10,
    breakdown: { /* level 8 breakdown */ },
    changeType: "damage_increase"
  }
  // ... more transitions
];
```

#### Layer 5: Multi-Item Grouping
```typescript
// Group all damage transitions
const groupedResult = {
  formattedValue: "Unarmed Damage: Level 1: 1d6, Level 4: 1d8, Level 8: 1d10, Level 12: 2d6, Level 16: 2d8",
  breakdown: { /* aggregated breakdown */ },
  components: [
    {
      type: "damage",
      value: "1d6-2d8",
      formattedValue: "Unarmed Damage: 1d6-2d8"
    }
  ]
};
```

#### Layer 6: Context-Aware Display Logic
```typescript
// Class detail display (no character context)
const classDetailDisplay = {
  formattedValue: "Unarmed Damage: Level 1: 1d6, Level 4: 1d8, Level 8: 1d10, Level 12: 2d6, Level 16: 2d8",
  breakdown: { /* full progression breakdown */ },
  showBreakdown: false,
  components: groupedResult.components
};

// Character sheet display (with character context)
const characterSheetDisplay = {
  formattedValue: "Unarmed Damage: 1d6", // Current level only
  breakdown: { /* current level breakdown */ },
  showBreakdown: true,
  components: [{ type: "damage", value: "1d6", formattedValue: "Unarmed Damage: 1d6" }]
};
```

### Example 3: Fighter Bonus Feats (Choice System)

#### Input Data (Schema)
```typescript
// FeatureProgression
{
  id: 1003,
  sourceType: FeatureSourceType.Class,
  level: 1,
  featureId: 503, // Fighter Bonus Feat feature
  classId: 1, // Fighter
  choices: [
    {
      id: 5001,
      type: FeatureChoiceType.Feat,
      behavior: FeatureChoiceBehavior.Single,
      filterType: FeatureFeatChoiceFilter.FighterBonusFeat,
      label: "Bonus Feat"
    },
    {
      id: 5002,
      type: FeatureChoiceType.Feat,
      behavior: FeatureChoiceBehavior.Single,
      filterType: FeatureFeatChoiceFilter.FighterBonusFeat,
      formulaParams: {
        id: 4002,
        formulaId: FormulaId.EVERY_N_LEVELS,
        interval: 2,
        formulaStartLevel: 2
      }
    }
  ]
}
```

#### Layer 1: Pure Formatters
```typescript
// ChoiceFormatter
class ChoiceFormatter {
  format(choice: FeatureChoice): string {
    return `Bonus Feat`;
  }
}
```

#### Layer 2: Value Calculation
```typescript
// Choice calculation
const choiceCalculation = {
  value: 1, // One feat choice
  breakdown: {
    components: [
      { source: "Fighter Bonus Feat", value: 1, type: 'choice' }
    ],
    formula: "1 bonus feat choice"
  }
};
```

#### Layer 3: Progression Value Generation
```typescript
// Generate synthetic entries for formula-based choice
const progressionValues = [
  { level: 1, value: 1, breakdown: choiceCalculation.breakdown },
  { level: 2, value: 1, breakdown: { /* level 2 breakdown */ } },
  { level: 4, value: 1, breakdown: { /* level 4 breakdown */ } },
  // ... more levels
];
```

#### Layer 4: Transition Detection
```typescript
// Detect choice availability transitions
const transitions = [
  {
    level: 2,
    value: 1,
    breakdown: { /* level 2 breakdown */ },
    changeType: "choice_available"
  },
  {
    level: 4,
    value: 1,
    breakdown: { /* level 4 breakdown */ },
    changeType: "choice_available"
  }
  // ... more transitions
];
```

#### Layer 5: Multi-Item Grouping
```typescript
// Group all choice transitions
const groupedResult = {
  formattedValue: "Level 1 (Bonus Feat), Level 2 (Bonus Feat), Level 4 (Bonus Feat), Level 6 (Bonus Feat), Level 8 (Bonus Feat), Level 10 (Bonus Feat), Level 12 (Bonus Feat), Level 14 (Bonus Feat), Level 16 (Bonus Feat), Level 18 (Bonus Feat), Level 20 (Bonus Feat)",
  breakdown: { /* aggregated breakdown */ },
  components: [
    {
      type: "choice",
      value: "Bonus Feat",
      formattedValue: "Bonus Feat"
    }
  ]
};
```

#### Layer 6: Context-Aware Display Logic
```typescript
// Class detail display
const classDetailDisplay = {
  formattedValue: "Level 1 (Bonus Feat), Level 2 (Bonus Feat), Level 4 (Bonus Feat), Level 6 (Bonus Feat), Level 8 (Bonus Feat), Level 10 (Bonus Feat), Level 12 (Bonus Feat), Level 14 (Bonus Feat), Level 16 (Bonus Feat), Level 18 (Bonus Feat), Level 20 (Bonus Feat)",
  breakdown: { /* full progression breakdown */ },
  showBreakdown: false,
  components: groupedResult.components
};
```

## Context Handling Strategy
```typescript
interface DisplayContext {
  character?: CharacterContext;
  displayType: 'detail' | 'edit' | 'character-sheet' | 'breakdown';
  showBreakdown?: boolean;
  currentLevel?: number;
  // ... other context information
}
```

### 2. Context-Aware Calculation
```typescript
interface CalculationContext {
  character?: CharacterContext;
  progressionLevel: number;
  currentLevel?: number;
  // ... other calculation context
}
```

### 3. Context Validation
```typescript
class ContextValidator {
  validateContext(formula: FormulaParams, context?: CalculationContext): ValidationResult {
    // Validate that required context is available
    // Return validation result with error details
  }
}
```

## Character Sheet Breakdown Strategy

### 1. Multi-Source Calculation Aggregation
For character sheet calculations (like AC), the system needs to aggregate multiple sources:

```typescript
interface CharacterSheetCalculation {
  finalValue: number;
  breakdown: CharacterSheetBreakdown;
  sources: Array<CalculationSource>;
}

interface CharacterSheetBreakdown {
  baseValue: number;
  bonuses: Array<BreakdownComponent>;
  penalties: Array<BreakdownComponent>;
  caps: Array<BreakdownComponent>;
  replacements: Array<BreakdownComponent>;
  totalFormula: string;
  explanation: string;
}

interface CalculationSource {
  type: 'class-feature' | 'race-feature' | 'feat' | 'item' | 'spell' | 'temporary';
  name: string;
  value: number;
  breakdown: CalculationBreakdown;
}
```

### 2. AC Calculation Example
```typescript
class ACCalculationAggregator {
  aggregateAC(character: CharacterContext): CharacterSheetCalculation {
    const sources: CalculationSource[] = [];
    
    // Base AC (10)
    sources.push({
      type: 'base',
      name: 'Base AC',
      value: 10,
      breakdown: {
        components: [{ source: 'Base AC', value: 10, type: 'base' }],
        formula: '10',
        explanation: 'Base armor class'
      }
    });
    
    // Dexterity modifier
    const dexMod = getAttributeModifier(character, 'DEX');
    sources.push({
      type: 'attribute',
      name: 'Dexterity Modifier',
      value: dexMod,
      breakdown: {
        components: [{ source: 'DEX Modifier', value: dexMod, type: 'bonus' }],
        formula: `+${dexMod}`,
        explanation: 'Dexterity modifier bonus'
      }
    });
    
    // Monk WIS bonus to AC (if applicable)
    if (hasClassFeature(character, 'Monk', 'AC Bonus')) {
      const wisMod = getAttributeModifier(character, 'WIS');
      sources.push({
        type: 'class-feature',
        name: 'Monk WIS Bonus to AC',
        value: wisMod,
        breakdown: {
          components: [{ source: 'WIS Modifier', value: wisMod, type: 'bonus' }],
          formula: `+${wisMod}`,
          explanation: 'Monk class feature: WIS bonus to AC'
        }
      });
    }
    
    // Armor (with dex cap)
    const armor = getEquippedArmor(character);
    if (armor) {
      const armorBonus = armor.armorBonus;
      const dexCap = armor.maxDexBonus;
      sources.push({
        type: 'item',
        name: armor.name,
        value: armorBonus,
        breakdown: {
          components: [
            { source: 'Armor Bonus', value: armorBonus, type: 'bonus' },
            { source: 'DEX Cap', value: dexCap, type: 'cap', description: `Maximum DEX bonus: ${dexCap}` }
          ],
          formula: `${armorBonus} (DEX cap: ${dexCap})`,
          explanation: `Armor provides ${armorBonus} bonus with DEX cap of ${dexCap}`
        }
      });
    }
    
    // Natural armor from items
    const naturalArmor = getNaturalArmorItems(character);
    naturalArmor.forEach(item => {
      sources.push({
        type: 'item',
        name: item.name,
        value: item.naturalArmorBonus,
        breakdown: {
          components: [{ source: 'Natural Armor', value: item.naturalArmorBonus, type: 'bonus' }],
          formula: `+${item.naturalArmorBonus}`,
          explanation: `Natural armor bonus from ${item.name}`
        }
      });
    });
    
    // Calculate final value with all modifiers
    const finalValue = this.calculateFinalAC(sources);
    const breakdown = this.createACBreakdown(sources);
    
    return {
      finalValue,
      breakdown,
      sources
    };
  }
}
```

### 3. Breakdown Display Strategy
```typescript
class CharacterSheetBreakdownDisplay {
  displayBreakdown(calculation: CharacterSheetCalculation): string {
    const { breakdown, sources } = calculation;
    
    let display = `AC: ${calculation.finalValue}\n\n`;
    display += `Breakdown:\n`;
    
    // Show base value
    display += `  Base: ${breakdown.baseValue}\n`;
    
    // Show bonuses
    if (breakdown.bonuses.length > 0) {
      display += `  Bonuses:\n`;
      breakdown.bonuses.forEach(bonus => {
        display += `    ${bonus.source}: +${bonus.value}`;
        if (bonus.description) display += ` (${bonus.description})`;
        display += `\n`;
      });
    }
    
    // Show penalties
    if (breakdown.penalties.length > 0) {
      display += `  Penalties:\n`;
      breakdown.penalties.forEach(penalty => {
        display += `    ${penalty.source}: ${penalty.value}\n`;
      });
    }
    
    // Show caps
    if (breakdown.caps.length > 0) {
      display += `  Caps:\n`;
      breakdown.caps.forEach(cap => {
        display += `    ${cap.source}: ${cap.description}\n`;
      });
    }
    
    // Show formula
    display += `\nFormula: ${breakdown.totalFormula}\n`;
    display += `Explanation: ${breakdown.explanation}`;
    
    return display;
  }
}
```

### 4. Future Enhancement Hooks
The system provides hooks for future enhancements:

```typescript
interface BreakdownEnhancement {
  // For future: spell effects, temporary bonuses, etc.
  type: 'spell' | 'temporary' | 'circumstantial';
  name: string;
  value: number;
  duration?: string;
  source?: string;
}

interface EnhancedCalculationContext extends CalculationContext {
  enhancements?: Array<BreakdownEnhancement>;
  spellEffects?: Array<SpellEffect>;
  temporaryBonuses?: Array<TemporaryBonus>;
}
```

## Error Handling Strategy

### 1. Graceful Degradation
```typescript
class ErrorHandler {
  handleCalculationError(error: Error, modifier: FeatureModifier): string {
    console.warn('Calculation error:', error.message, modifier);
    return `Raw Value: ${modifier.value}`;
  }

  handleFormattingError(error: Error, value: number): string {
    console.warn('Formatting error:', error.message, value);
    return value.toString();
  }
}
```

### 2. Error Propagation
- Lower layers throw specific errors
- Middle layers catch and handle errors
- Highest layer provides fallback strategies

### 3. Error Logging
- Console warnings for recoverable errors
- Console errors for unrecoverable errors
- Structured error information for debugging

## Performance Optimization Strategy

### 1. Calculation Caching
```typescript
class CalculationCache {
  private cache = new Map<string, number>();

  getCachedValue(key: string): number | undefined {
    return this.cache.get(key);
  }

  setCachedValue(key: string, value: number): void {
    this.cache.set(key, value);
  }

  generateKey(formula: FormulaParams, level: number, context?: CalculationContext): string {
    // Generate cache key based on formula parameters and context
    return cacheKey;
  }
}
```

### 2. Lazy Evaluation
- Only calculate values when needed
- Cache calculated values for reuse
- Invalidate cache when context changes

### 3. Batch Processing
- Process multiple modifiers in batches
- Share calculation context across modifiers
- Minimize redundant calculations

## Implementation Strategy

### Phase 1: Extract Pure Formatters
1. Create base formatter interfaces
2. Extract formatting logic from current formatters
3. Remove calculation logic from formatters
4. Create pure formatter implementations

### Phase 2: Separate Calculation Logic
1. Create pure calculation functions
2. Remove calculation logic from display functions
3. Standardize formula calculation interfaces
4. Implement context-aware calculators

### Phase 3: Implement Layered Architecture
1. Build each layer independently
2. Create clear interfaces between layers
3. Implement context-aware display strategies
4. Add error handling and logging

### Phase 4: Migration and Testing
1. Gradually migrate existing code to new architecture
2. Maintain backward compatibility during transition
3. Add comprehensive tests for each layer
4. Remove old mixed-responsibility functions

## Testing Strategy

### 1. Unit Tests
- Test each layer independently
- Mock dependencies between layers
- Test pure functions with various inputs
- Test error handling and edge cases

### 2. Integration Tests
- Test layer interactions
- Test context handling across layers
- Test error propagation
- Test performance characteristics

### 3. End-to-End Tests
- Test complete formatting workflows
- Test different display contexts
- Test real-world scenarios
- Test performance with large datasets

## Migration Strategy

### 1. Backward Compatibility
- Maintain existing public APIs during transition
- Use adapter pattern for gradual migration
- Deprecate old functions gradually
- Provide migration guides

### 2. Incremental Migration
- Migrate one layer at a time
- Test thoroughly after each layer
- Rollback capability for each phase
- Monitor performance and error rates

### 3. Validation
- Compare output with existing system
- Validate all formula types work correctly
- Test all display contexts
- Verify error handling works as expected

## Success Criteria

### 1. Code Quality
- [ ] Each layer has single responsibility
- [ ] No mixed responsibilities
- [ ] Consistent interfaces across layers
- [ ] Pure functions in lower layers
- [ ] Comprehensive test coverage

### 2. Performance
- [ ] No performance regression
- [ ] Efficient calculation caching
- [ ] Minimal memory usage
- [ ] Fast rendering times

### 3. Maintainability
- [ ] Easy to add new modifier types
- [ ] Easy to add new formula types
- [ ] Easy to add new display contexts
- [ ] Clear documentation for each layer

### 4. User Experience
- [ ] No display regressions
- [ ] Consistent behavior across contexts
- [ ] Clear error messages
- [ ] Fast response times

## Risk Mitigation

### 1. Technical Risks
- **Risk**: Breaking existing functionality
- **Mitigation**: Comprehensive testing, gradual migration, rollback capability

### 2. Performance Risks
- **Risk**: Performance degradation
- **Mitigation**: Performance testing, caching strategies, optimization

### 3. Complexity Risks
- **Risk**: Over-engineering the solution
- **Mitigation**: Keep it simple, focus on core requirements, iterative development

### 4. Timeline Risks
- **Risk**: Project taking too long
- **Mitigation**: Phased approach, prioritize core functionality, incremental delivery

## Conclusion

This refactoring strategy addresses the identified pain points by:

1. **Clean Layer Separation**: Each layer has a single, clear responsibility
2. **Centralized Context Handling**: Context is handled at the highest layer
3. **Consistent Interfaces**: All modifier types use the same higher-level logic
4. **Pure Functions**: Lower layers are pure and testable
5. **Extensible Architecture**: Adding new types only requires changes to the lowest layer
6. **Robust Error Handling**: Graceful fallbacks with clear error logging
7. **Performance Optimization**: Caching and efficient calculations

The phased approach ensures minimal risk while delivering significant improvements to code quality, maintainability, and developer experience.

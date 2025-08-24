# Formatter and Utility Functions

This document provides comprehensive documentation for the formatter and utility functions used throughout the feature system. These functions have been extracted from the monolithic `Formatters.ts` file into focused, reusable modules.

## Overview

The formatter system has been refactored into several focused modules:

- **`formatterUtils.ts`** - Core formatting utilities
- **`formulaUtils.ts`** - Formula-related utilities  
- **`wildShapeUtils.ts`** - Wild shape specific utilities
- **`formatterFactories.ts`** - Formatter factory functions
- **`Formatters.ts`** - Main formatter exports and core logic

## Core Formatting Utilities (`formatterUtils.ts`)

### `formatSignedValue(value: number): string`

Formats a numeric value with a sign (+ for positive, - for negative).

```typescript
formatSignedValue(5)    // "+5"
formatSignedValue(-3)   // "-3"
formatSignedValue(0)    // "0"
```

### `formatWithBonusType(baseString: string, bonusType?: number | null): string`

Adds bonus type information to a base string.

```typescript
formatWithBonusType("+2 to AC", 1)  // "+2 to AC (sacred)"
formatWithBonusType("+1 to hit")    // "+1 to hit"
```

### `joinWithCommas(...strings: (string | undefined | null)[]): string`

Joins strings with commas, filtering out empty values.

```typescript
joinWithCommas("a", "b", undefined, "c")  // "a, b, c"
joinWithCommas("single")                  // "single"
joinWithCommas()                          // ""
```

### `formatLanguageName(languageId: number, languageSelectList: Array<{ value: number; label: string }>): string`

Formats a language name from its ID.

```typescript
formatLanguageName(1, LANGUAGE_SELECT_LIST)  // "Common"
formatLanguageName(999, LANGUAGE_SELECT_LIST) // "Language 999"
```

### `formatDiceDisplay(expr: string): string`

Formats dice expressions for display.

```typescript
formatDiceDisplay("1d6/level")           // "1d6 per level"
formatDiceDisplay("1d8,max2d8")          // "1d8 (max 2d8)"
```

## Formula Utilities (`formulaUtils.ts`)

### `createFormulaContext(level: number, progressionLevel: number, character?: CharacterContext)`

Creates a context object for formula calculations.

```typescript
const context = createFormulaContext(5, 1, character);
// Returns: { level: 5, progressionLevel: 1, character }
```

### `getFormulaDisplayString(formulaId: number, valueInt: number, attributeId: number, abilityModifier?: number): string`

Generates display strings for attribute-dependent formulas.

```typescript
// FormulaId.ATTRIBUTE_BASED
getFormulaDisplayString(1, 2, 1, 3)  // "2 + STR (3) = 5"
getFormulaDisplayString(1, 2, 1)     // "2 + STR"

// FormulaId.ATTRIBUTE_MODIFIER  
getFormulaDisplayString(2, 0, 1, 3)  // "STR (3) = 3"
getFormulaDisplayString(2, 0, 1)     // "+STR"

// FormulaId.LEVEL_TIMES_ATTRIBUTE
getFormulaDisplayString(3, 1, 1, 3)  // "level × STR (3) = 3"
getFormulaDisplayString(3, 1, 1)     // "level × STR"
```

### `processAttributeFormula(modifier: any, character?: CharacterContext, valueInt?: number, level: number = 1): { calculated?: number; display?: string }`

Processes attribute-dependent formulas, returning calculated values or display strings.

```typescript
// With character context - returns calculated value
const result = processAttributeFormula(modifier, character, 2, 5);
// Returns: { calculated: 7 }

// Without character context - returns display string
const result = processAttributeFormula(modifier, undefined, 2);
// Returns: { display: "2 + STR" }
```

### `generateProgressionValues(modifier: any, startLevel: number, character?: CharacterContext, maxLevel: number = 20): Array<{ level: number; value: number }>`

Generates progression values for a modifier across a level range.

```typescript
const values = generateProgressionValues(modifier, 1, character, 5);
// Returns: [
//   { level: 1, value: 2 },
//   { level: 2, value: 3 },
//   { level: 3, value: 4 },
//   { level: 4, value: 5 },
//   { level: 5, value: 6 }
// ]
```

### `findTransitionPoints(progressionValues: Array<{ level: number; value: number }>): Array<{ level: number; value: number }>`

Finds transition points where values change.

```typescript
const transitions = findTransitionPoints([
  { level: 1, value: 2 },
  { level: 2, value: 2 },
  { level: 3, value: 3 },
  { level: 4, value: 3 },
  { level: 5, value: 4 }
]);
// Returns: [
//   { level: 3, value: 3 },
//   { level: 5, value: 4 }
// ]
```

### `getDisplayValue(formulaResult: any, valueInt: number, formatSignedValue: (value: number) => string): string`

Determines the display value from a formula result.

```typescript
const display = getDisplayValue({ calculated: 5 }, 2, formatSignedValue);
// Returns: "+5"

const display = getDisplayValue({ display: "2 + STR" }, 2, formatSignedValue);
// Returns: "2 + STR"
```

### `getDisplayAndPluralizeValue(formulaResult: any, valueInt: number, modifier: any): { displayValue: string; pluralizeValue: number }`

Gets display value and pluralize value from formula result with special handling for `LEVEL_TIMES_ATTRIBUTE`.

```typescript
const result = getDisplayAndPluralizeValue({ calculated: 3 }, 1, modifier);
// Returns: { displayValue: "3", pluralizeValue: 3 }

const result = getDisplayAndPluralizeValue({ display: "level × CHA" }, 1, modifier);
// Returns: { displayValue: "1 × CHA", pluralizeValue: 1 }
```

### `formatDamageDice(modifier: any, character?: CharacterContext, previewLevel?: number): string`

Formats damage dice for replacement modifiers with formulas.

```typescript
// With character context
formatDamageDice(modifier, character)  // "Unarmed Damage: 1d8"

// With preview level
formatDamageDice(modifier, undefined, 5)  // "Unarmed Damage: 1d10"

// Without context - shows progression pattern
formatDamageDice(modifier)  // "Unarmed Damage: Level 1: 1d6, Level 4: 1d8, ..."
```

## Wild Shape Utilities (`wildShapeUtils.ts`)

### `isWildShapeEffect(effect: any): boolean`

Checks if an effect should be processed for wild shape.

```typescript
isWildShapeEffect({ effectType: FeatureSpecialEffectType.WildShapeForm })  // true
isWildShapeEffect({ effectType: FeatureSpecialEffectType.WildShapeSize })  // true
isWildShapeEffect({ effectType: FeatureSpecialEffectType.Other })          // false
```

### `shouldSkipWildShapeEffect(effect: any): boolean`

Checks if an effect should be skipped (elemental form effect).

```typescript
shouldSkipWildShapeEffect({ 
  effectType: FeatureSpecialEffectType.WildShapeForm, 
  value: 'elemental' 
})  // true

shouldSkipWildShapeEffect({ 
  effectType: FeatureSpecialEffectType.WildShapeForm, 
  value: 'wolf' 
})  // false
```

### `processWildShapeEffects(effects: any[], hasElementalEffects: boolean): string[]`

Processes wild shape effects and returns formatted effects array.

```typescript
const effects = processWildShapeEffects([
  { effectType: FeatureSpecialEffectType.WildShapeForm, value: 'wolf' },
  { effectType: FeatureSpecialEffectType.WildShapeSize, value: 'Small' }
], false);
// Returns: ["wolf", "Small"]

const effects = processWildShapeEffects([
  { effectType: FeatureSpecialEffectType.WildShapeForm, value: 'fire' }
], true);
// Returns: ["elemental: fire"]
```

### `processWildShapeModifiers(modifiers: any[], progression: any, character?: CharacterContext): string`

Processes wild shape modifiers and returns formatted uses string.

```typescript
const uses = processWildShapeModifiers(modifiers, progression, character);
// Returns: "3/day, elemental: 1/day"
```

## Formatter Factories (`formatterFactories.ts`)

### `createAttributeFormatter(label: string)`

Creates a formatter for attribute-dependent modifiers with a custom label.

```typescript
const formatter = createAttributeFormatter('AC');
formatter.value(2, 1, null, character, modifier);  // "AC: +2"
```

### `createDamageFormatter(label: string)`

Creates a formatter for damage modifiers with replacement formula support.

```typescript
const formatter = createDamageFormatter('Damage');
formatter.value(2, 1, null, character, modifier);  // "Damage: +2" or calculated damage dice
```

### `createUsesFormatter()`

Creates a formatter for uses/frequency modifiers with special `LEVEL_TIMES_ATTRIBUTE` handling.

```typescript
const formatter = createUsesFormatter();
formatter.value(3, 1, null, character, modifier);  // "3/day"
```

### `createHealingFormatter()`

Creates a formatter for healing modifiers with special `LEVEL_TIMES_ATTRIBUTE` handling and pluralization.

```typescript
const formatter = createHealingFormatter();
formatter.value(2, 1, null, character, modifier);  // "2 hit points per day"
```

### `createSimpleFormatter(label: string, valueFormatter: (valueInt: number, appliesToId: number) => string)`

Creates a simple formatter with a custom label and value formatting.

```typescript
const formatter = createSimpleFormatter('Initiative', (value, id) => `+${value}`);
formatter.value(2, 1, null);  // "Initiative: +2"
```

### `createPluralizedFormatter(singular: string, plural: string)`

Creates a formatter for pluralized items (targets, attacks, etc.).

```typescript
const formatter = createPluralizedFormatter('target', 'targets');
formatter.value(1, 1, null);  // "1 target"
formatter.value(3, 1, null);  // "3 targets"
```

### `createAttributeWithAbbrFormatter()`

Creates a formatter for attribute modifiers with dynamic attribute abbreviation.

```typescript
const formatter = createAttributeWithAbbrFormatter();
formatter.value(2, 1, null, character, modifier);  // "STR: +2"
```

### `createSavingThrowFormatter()`

Creates a formatter for saving throw modifiers with dynamic save name.

```typescript
const formatter = createSavingThrowFormatter();
formatter.value(2, 1, null, character, modifier);  // "Fort: +2"
```

### `createLanguageFormatter()`

Creates a formatter for language modifiers.

```typescript
const formatter = createLanguageFormatter();
formatter.value(0, 1, null);  // "Common"
```

### `createFeatFormatter()`

Creates a formatter for direct feat grants.

```typescript
const formatter = createFeatFormatter();
formatter.value(0, 78, null, character, { feat: { name: 'Endurance' } });  // "Granted Feat: Endurance"
```

### `createChoiceFormatter()`

Creates a formatter for choice modifiers.

```typescript
const formatter = createChoiceFormatter();
formatter.value(0, 1, null, character, modifier);  // "choice"
```

## Main Formatter Functions (`Formatters.ts`)

### `PROGRESSION_FORMATTERS`

An object mapping `ModifierAppliesToType` to appropriate formatters.

```typescript
PROGRESSION_FORMATTERS[ModifierAppliesToType.Attribute]  // Attribute formatter
PROGRESSION_FORMATTERS[ModifierAppliesToType.Damage]     // Damage formatter
PROGRESSION_FORMATTERS[ModifierAppliesToType.Uses]       // Uses formatter
// ... etc
```

### `formatProgression(progression: FeatureProgressionWithRelations, character?: CharacterContext): { label: string; value: string; note?: string }`

Formats a feature progression for display.

```typescript
const result = formatProgression(progression, character);
// Returns: { 
//   label: "Feature Name:", 
//   value: "+2 to AC, 3/day", 
//   note: "Special effect description" 
// }
```

### `formatWildShapeProgression(progression: FeatureProgressionWithRelations, character?: CharacterContext): { label: string; value: string; note?: string }`

Special formatter for Wild Shape progressions.

```typescript
const result = formatWildShapeProgression(progression, character);
// Returns: { 
//   label: "Wild Shape:", 
//   value: "3/day, wolf, Small" 
// }
```

### `formatWildShapeProgressions(progressions: FeatureProgressionWithRelations[], character?: CharacterContext): string`

Formats multiple wild shape progressions together.

```typescript
const result = formatWildShapeProgressions(progressions, character);
// Returns: "3/day, elemental: 1/day, wolf, elemental: fire"
```

### `expandFormulaProgressions(progressions: FeatureProgressionWithRelations[]): FeatureProgressionWithRelations[]`

Expands formula-based progressions into multiple entries for display.

```typescript
const expanded = expandFormulaProgressions(progressions);
// Returns array of progressions with calculated values for each level
```

### `formatPrerequisites(prerequisites: any[]): string | null`

Formats feature prerequisites.

```typescript
const result = formatPrerequisites(prerequisites);
// Returns: "STR 13+, Character Level 4+"
```

### `formatChoiceOptions(progression: FeatureProgressionWithRelations): string | null`

Formats choice options for a feature progression.

```typescript
const result = formatChoiceOptions(progression);
// Returns: "Endurance|Toughness|Iron Will"
```

## Usage Patterns

### Creating Custom Formatters

```typescript
import { createSimpleFormatter, formatSignedValue } from './formatterUtils';

// Create a custom formatter for initiative
const initiativeFormatter = createSimpleFormatter('Initiative', (value, id) => 
  formatSignedValue(value)
);

// Use in PROGRESSION_FORMATTERS
PROGRESSION_FORMATTERS[ModifierAppliesToType.Initiative] = initiativeFormatter;
```

### Processing Formula-Based Modifiers

```typescript
import { processAttributeFormula, getDisplayValue, formatSignedValue } from './formulaUtils';

const formulaResult = processAttributeFormula(modifier, character, valueInt);
const displayValue = getDisplayValue(formulaResult, valueInt, formatSignedValue);
```

### Working with Wild Shape Features

```typescript
import { processWildShapeModifiers, processWildShapeEffects } from './wildShapeUtils';

const uses = processWildShapeModifiers(modifiers, progression, character);
const effects = processWildShapeEffects(effects, hasElementalEffects);
```

## Best Practices

1. **Use Factory Functions**: Prefer using formatter factory functions over creating formatters manually
2. **Import Dependencies**: Functions should import their dependencies directly rather than receiving them as parameters
3. **Consistent Naming**: Follow the established naming conventions for formatters
4. **Error Handling**: Always check for undefined/null values before processing
5. **Type Safety**: Use proper TypeScript types when available

## Migration Guide

When migrating from the old monolithic `Formatters.ts`:

1. **Import from New Modules**: Update imports to use the new focused modules
2. **Remove Parameter Passing**: Functions no longer need dependencies passed as parameters
3. **Use Factory Functions**: Replace manual formatter creation with factory functions
4. **Update Function Calls**: Remove unnecessary parameters from function calls

## Testing

Each utility function should be tested independently:

```typescript
import { formatSignedValue } from './formatterUtils';

describe('formatSignedValue', () => {
  it('should format positive numbers with +', () => {
    expect(formatSignedValue(5)).toBe('+5');
  });
  
  it('should format negative numbers with -', () => {
    expect(formatSignedValue(-3)).toBe('-3');
  });
});
```

This modular approach makes the codebase more maintainable, testable, and easier to understand for future developers.

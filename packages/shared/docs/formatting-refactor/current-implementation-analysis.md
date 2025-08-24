# Current Implementation Analysis

## Overview

This document provides a comprehensive analysis of the current formatter system implementation, identifying the layers, responsibilities, and issues that need to be addressed in the refactoring.

## File Structure Analysis

### Core Formatter Files

#### `frontend/src/lib/Formatters.ts` (1144 lines)
**Primary Responsibilities**:
- Main formatter exports and orchestration
- `formatProgression()` - Main entry point for formatting feature progressions
- `processModifier()` - Process individual modifiers
- `processFormulaModifiers()` - Handle formula-based modifiers
- `getFormulaProgressionPattern()` - Generate progression patterns
- `expandFormulaProgressions()` - Expand formula-based progressions into multiple entries

**Mixed Responsibilities**:
- Formula calculation AND display logic
- Context handling (character vs no character)
- Transition detection AND formatting
- Multi-modifier grouping AND individual formatting

#### `frontend/src/lib/formatterFactories.ts` (263 lines)
**Primary Responsibilities**:
- Factory functions for creating formatters
- Individual formatter implementations
- `createDamageFormatter()`, `createHealingFormatter()`, etc.

**Mixed Responsibilities**:
- Formatting AND formula calculation
- Context-aware logic within formatters
- Special case handling for different modifier types

#### `frontend/src/lib/formulaUtils.ts` (183 lines)
**Primary Responsibilities**:
- Formula-related utility functions
- `createFormulaContext()` - Create calculation context
- `processAttributeFormula()` - Handle attribute-dependent formulas
- `generateProgressionValues()` - Generate values across level range
- `findTransitionPoints()` - Find where values change
- `formatDamageDice()` - Special damage dice formatting

**Mixed Responsibilities**:
- Calculation AND display logic
- Context handling within utility functions
- Special case handling for damage dice

#### `frontend/src/lib/formulaCalculator.ts` (297 lines)
**Primary Responsibilities**:
- Core formula calculation logic
- `calculateModifierValue()` - Calculate values using formulas
- `isAttributeDependentFormula()` - Check formula type
- `calculateAttributeDependentFormula()` - Handle attribute formulas

**Relatively Clean**: This file has the most focused responsibility, but still contains some display logic.

#### `frontend/src/lib/formatterUtils.ts`
**Primary Responsibilities**:
- Core formatting utilities
- `formatSignedValue()`, `formatWithBonusType()`, etc.

**Relatively Clean**: These are mostly pure utility functions.

## Layer Analysis

### Current Layer Structure (Mixed Responsibilities)

#### Layer 1: Individual Formatters
**Files**: `formatterFactories.ts`
**Responsibilities**:
- Convert raw values to human-readable strings
- Handle formula calculations within formatters
- Context-aware logic (character vs no character)
- Special case handling for different modifier types

**Issues**:
- Mixed formatting and calculation logic
- Inconsistent parameter passing
- Context handling scattered throughout
- Special cases for different modifier types

#### Layer 2: Modifier Processing
**Files**: `Formatters.ts` (processModifier, processFormulaModifiers)
**Responsibilities**:
- Process individual modifiers
- Handle formula calculations
- Generate progression patterns
- Context-dependent behavior

**Issues**:
- Mixed calculation and display logic
- Different behavior for different modifier types
- Context handling mixed with processing logic

#### Layer 3: Formula Calculation
**Files**: `formulaCalculator.ts`, `formulaUtils.ts`
**Responsibilities**:
- Calculate values based on formulas and levels
- Generate progression values across level ranges
- Find transition points
- Handle attribute-dependent calculations

**Issues**:
- Logic duplicated across different modifier types
- Mixed with display logic in some functions
- Different behavior for different contexts

#### Layer 4: Progression Pattern Generation
**Files**: `Formatters.ts` (getFormulaProgressionPattern)
**Responsibilities**:
- Generate level-based progression patterns
- Handle different formula types
- Context-dependent pattern generation

**Issues**:
- Handles both calculation AND display
- Different logic for different modifier types
- Context-dependent behavior

#### Layer 5: Multi-Modifier Grouping
**Files**: `Formatters.ts` (formatProgression)
**Responsibilities**:
- Combine multiple modifiers/choices/effects
- Handle different grouping strategies
- Context-aware grouping

**Issues**:
- Inconsistent grouping logic
- Mixed with formula processing
- Different behavior for different types

#### Layer 6: Level Context & Transition Logic
**Files**: `Formatters.ts` (expandFormulaProgressions)
**Responsibilities**:
- Determine what to show at each level
- Handle formula expansion
- Context-dependent display logic

**Issues**:
- Transition logic mixed with formatting
- Different rules for different modifier types
- Context-dependent behavior

## Formula Types Analysis

### Current Formula Types (from FormulaDefinitions.ts)

1. **LINEAR_SCALING** (ID: 1)
   - Scales since feature started: (level - startLevel + 1) × multiplier
   - Used for: Features that scale based on how long they've been active

2. **EVERY_N_LEVELS** (ID: 2)
   - Increases every N levels starting from a specific level
   - Used for: Fighter bonus feats, Monk bonus feats, etc.

3. **CONDITIONAL_SCALING** (ID: 3)
   - Different values based on level thresholds
   - Used for: Unarmed strike damage dice, size-based scaling

4. **DICE_SCALING** (ID: 5)
   - Dice scaling (e.g., +1d6 every N levels)
   - Used for: Sneak attack, spell damage scaling

5. **ATTRIBUTE_BASED** (ID: 6)
   - Base value + attribute modifier
   - Used for: Skill bonuses, saving throw bonuses

6. **ATTRIBUTE_MODIFIER** (ID: 7)
   - Just attribute modifier
   - Used for: Pure attribute-based bonuses

7. **LEVEL_TIMES_ATTRIBUTE** (ID: 8)
   - Level × attribute modifier
   - Used for: Scaling attribute-based features

8. **LEVEL_TIMES_VALUE** (ID: 9)
   - Total level × base value
   - Used for: Monk Wholeness of Body healing

9. **VALUE_PLUS_LEVEL** (ID: 10)
   - Fixed value + level
   - Used for: Spell Resistance

10. **LEVEL_PLUS_ATTRIBUTE** (ID: 11)
    - Level + attribute modifier
    - Used for: Wild Empathy, skill analogs

### Display Requirements by Formula Type

#### Formula Types That Need Full Progression Display
- **EVERY_N_LEVELS**: Show all levels where the feature increases
- **CONDITIONAL_SCALING**: Show all transition points
- **DICE_SCALING**: Show all levels where dice increase

#### Formula Types That Need Single Value Display
- **LINEAR_SCALING**: Show calculated value for current level
- **ATTRIBUTE_BASED**: Show calculated value or formula structure
- **ATTRIBUTE_MODIFIER**: Show calculated value or formula structure
- **LEVEL_TIMES_ATTRIBUTE**: Show calculated value or formula structure
- **LEVEL_TIMES_VALUE**: Show calculated value for current level
- **VALUE_PLUS_LEVEL**: Show calculated value for current level
- **LEVEL_PLUS_ATTRIBUTE**: Show calculated value or formula structure

## Context Handling Analysis

### Current Context Usage

#### Context-Dependent Behavior
1. **With Character Context** (Character sheets)
   - Show calculated values using actual character data
   - Display full progression patterns
   - Handle attribute-dependent formulas with real values

2. **Without Character Context** (ClassDetail.tsx, ClassEdit.tsx)
   - Show calculated values for current level only
   - Display formula structures for attribute-dependent formulas
   - Handle conditional modifiers differently

#### Context Handling Issues
1. **Scattered Logic**: Context handling is spread across multiple layers
2. **Inconsistent Behavior**: Different modifier types handle context differently
3. **Mixed Responsibilities**: Context logic mixed with formatting logic
4. **Hard to Extend**: Adding new contexts requires changes in multiple places

## Data Flow Analysis

### Current Data Flow

```
FeatureProgressionWithRelations
    ↓
formatProgression()
    ↓
processFormulaModifiers() OR processModifier()
    ↓
getFormulaProgressionPattern() OR individual formatters
    ↓
FormulaCalculator.calculateModifierValue()
    ↓
calculateFormula() (from static-data)
    ↓
Formatted Output
```

### Issues with Current Data Flow

1. **Multiple Paths**: Different code paths for different modifier types
2. **Context Dependencies**: Context handling scattered throughout
3. **Mixed Responsibilities**: Calculation and display logic mixed
4. **Inconsistent Interfaces**: Different formatters expect different parameters
5. **Hard to Debug**: Complex flow makes debugging difficult

## Pain Points Identified

### 1. Mixed Responsibilities
- Formatters handle both formatting AND calculation
- Context handling mixed with display logic
- Transition detection mixed with formatting

### 2. Duplicated Logic
- Similar patterns repeated for different modifier types
- Context handling logic duplicated across layers
- Formula calculation logic mixed with display logic

### 3. Inconsistent Behavior
- Different modifier types handle context differently
- Different formula types have different display requirements
- Context-dependent behavior scattered throughout

### 4. Tight Coupling
- Changes to one layer affect others
- Adding new modifier types requires changes in multiple places
- Context changes require updates across multiple files

### 5. Hard to Extend
- Adding new formula types requires changes in multiple layers
- Adding new contexts requires updates across the system
- Adding new modifier types requires understanding multiple layers

### 6. Debugging Difficulties
- Complex data flow makes debugging hard
- Mixed responsibilities make it unclear where issues originate
- Context-dependent behavior makes testing difficult

## Specific Issues from Recent Experience

### 1. Unarmed Strike Display Issues
- Multiple conditional modifiers (small, medium, large creatures)
- Full progression showing at every transition level
- Context-dependent behavior causing different displays

### 2. Healing Modifier Issues
- Wholeness of Body showing full progression instead of single value
- Different behavior between different contexts
- Formula calculation mixed with display logic

### 3. Damage Dice Issues
- Level 1 showing "0" instead of "1d6"
- Full progression patterns showing inappropriately
- Special case handling for damage dice formatters

### 4. Choice System Issues
- Multiple choices showing as full progression
- Context-dependent choice display
- Mixed logic for different choice types

## Conclusion

The current formatter system has become overly complex due to:

1. **Mixed Responsibilities**: Each layer is doing multiple jobs
2. **Scattered Context Handling**: Context logic spread across multiple layers
3. **Duplicated Logic**: Similar patterns repeated for different types
4. **Inconsistent Interfaces**: Different formatters expect different parameters
5. **Tight Coupling**: Changes in one layer affect others

The refactoring needs to address these issues by:

1. **Clean Layer Separation**: Each layer should have a single, clear responsibility
2. **Centralized Context Handling**: Context should be handled at the highest layer
3. **Consistent Interfaces**: All modifier types should use the same higher-level logic
4. **Pure Functions**: Lower layers should be pure and testable
5. **Extensible Architecture**: Adding new types should only require changes to the lowest layer

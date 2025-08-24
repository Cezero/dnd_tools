# Schema and Data Flow Analysis

## Overview

This document analyzes the data structures, schemas, and data flow in the feature system to understand how data moves through the formatter system.

## Core Data Structures

### FeatureProgressionWithRelations

**Schema Location**: `packages/shared/schema/src/feature.ts`

**Structure**:
```typescript
export const FeatureProgressionSchema = z.object({
    id: z.number().int().positive(),
    featureId: z.number().int().positive(),
    sourceType: z.nativeEnum(FeatureSourceType),
    classId: z.number().int().nullable(),
    raceId: z.number().int().nullable(),
    level: z.number().int().positive(),
    feature: FeatureSchema.optional(),
    modifiers: z.array(FeatureModifierSchema).optional(),
    choices: z.array(FeatureChoiceSchema).optional(),
    effects: z.array(FeatureSpecialEffectSchema).optional(),
});
```

**Key Fields**:
- `level`: The level at which this progression occurs
- `feature`: The feature this progression belongs to
- `modifiers`: Array of modifiers that apply at this level
- `choices`: Array of choices available at this level
- `effects`: Array of special effects at this level

### FeatureModifier

**Schema Location**: `packages/shared/schema/src/feature.ts`

**Structure**:
```typescript
export const FeatureModifierSchema = z.object({
    id: z.number().int().positive(),
    featureProgressionId: z.number().int().positive(),
    type: z.nativeEnum(ModifierType),
    value: z.number().int(),
    formulaParamsId: z.number().int().nullable(),
    bonusType: z.nativeEnum(FeatureBonusType).nullable(),
    appliesTo: z.nativeEnum(ModifierAppliesToType).nullable(),
    appliesToId: z.number().int().nullable(),
    conditions: z.array(FeatureModifierConditionSchema).optional(),
    formulaParams: FeatureFormulaParamsSchema.optional().nullable(),
});
```

**Key Fields**:
- `type`: The type of modifier (Replacement, Quantity, Other, etc.)
- `value`: The base value for the modifier
- `formulaParamsId`: Links to formula parameters
- `appliesTo`: What the modifier applies to (Damage, Healing, Choice, etc.)
- `appliesToId`: ID of the specific thing it applies to
- `formulaParams`: The actual formula parameters (for frontend use)

### FeatureFormulaParams

**Schema Location**: `packages/shared/schema/src/feature.ts`

**Structure**:
```typescript
export const FeatureFormulaParamsSchema = z.object({
    id: z.number().int().positive(),
    formulaId: z.number().int().positive(),
    interval: z.number().int().positive().optional().nullable(),
    formulaStartLevel: z.number().int().positive().optional().nullable(),
    attributeId: z.number().int().positive().optional().nullable(),
    thresholds: z.string().nullable(),
    values: z.string().nullable(),
});
```

**Key Fields**:
- `formulaId`: References the formula definition in static-data
- `interval`: For "every N levels" formulas
- `formulaStartLevel`: Starting level for formula calculation
- `attributeId`: For attribute-dependent formulas
- `thresholds`: Comma-separated level thresholds for conditional scaling
- `values`: Comma-separated corresponding values for conditional scaling

### FeatureChoice

**Schema Location**: `packages/shared/schema/src/feature.ts`

**Structure**:
```typescript
export const FeatureChoiceSchema = z.object({
    id: z.number().int().positive(),
    progressionId: z.number().int().positive(),
    label: z.string().nullable(),
    pickCount: z.number().int().nullable(),
    type: z.nativeEnum(FeatureChoiceType),
    behavior: z.nativeEnum(FeatureChoiceBehavior),
    featId: z.number().int().positive().nullable(),
    featureId: z.number().int().positive().nullable(),
    formulaParamsId: z.number().int().nullable(),
    filterType: z.number().int().nullable(),
    feat: z.object({
        id: z.number().int().positive(),
        name: z.string().min(1),
    }).nullable(),
    feature: z.object({
        id: z.number().int().positive(),
        name: z.string().min(1),
        slug: z.string().min(1),
    }).nullable(),
    formulaParams: FeatureFormulaParamsSchema.optional().nullable(),
});
```

**Key Fields**:
- `type`: The type of choice (Feat, Feature, etc.)
- `behavior`: How the choice behaves (Single, Multiple, etc.)
- `featId`/`featureId`: Specific feat or feature ID
- `filterType`: Filter type for feat choices
- `formulaParams`: Formula parameters for formula-based choices

## Data Flow Analysis

### 1. Backend to Frontend Data Flow

```
Database
    ↓
Prisma Models
    ↓
Backend Services (classService.ts)
    ↓
API Response (FeatureProgressionWithRelations[])
    ↓
Frontend Components (ClassDisplay.tsx, ClassEdit.tsx)
    ↓
Formatter System (Formatters.ts)
    ↓
Display Output
```

### 2. Formatter System Data Flow

```
FeatureProgressionWithRelations[]
    ↓
formatProgression() (main entry point)
    ↓
For each progression:
    ├── processModifier() (for non-formula modifiers)
    ├── processFormulaModifiers() (for formula modifiers)
    └── processChoices() (for choices)
    ↓
Individual formatters (createDamageFormatter, etc.)
    ↓
FormulaCalculator.calculateModifierValue() (for formulas)
    ↓
calculateFormula() (from static-data)
    ↓
Formatted strings
```

### 3. Context Data Flow

```
CharacterContext (optional)
    ↓
Display Strategy (determined by context presence)
    ↓
Context-aware calculations
    ↓
Context-aware formatting
    ↓
Final display output
```

## Schema Relationships

### 1. FeatureProgression → FeatureModifier
- One-to-many relationship
- A progression can have multiple modifiers
- Modifiers define what changes at that level

### 2. FeatureModifier → FeatureFormulaParams
- One-to-one relationship (via formulaParamsId)
- Formula parameters define how the modifier scales
- Optional relationship (not all modifiers have formulas)

### 3. FeatureProgression → FeatureChoice
- One-to-many relationship
- A progression can have multiple choices
- Choices define what the player can select at that level

### 4. FeatureChoice → FeatureFormulaParams
- One-to-one relationship (via formulaParamsId)
- Formula parameters define how choices scale
- Optional relationship (not all choices have formulas)

## Data Transformation Points

### 1. Backend Data Fetching
**Location**: `apps/backend/src/features/class/classService.ts`
**Transformation**: Raw database data → FeatureProgressionWithRelations
**Key Operations**:
- Include related entities (feature, modifiers, choices, effects)
- Include formula parameters for modifiers and choices
- Include feat data for feat-based choices

### 2. Frontend Data Processing
**Location**: `frontend/src/lib/Formatters.ts`
**Transformation**: FeatureProgressionWithRelations → Formatted strings
**Key Operations**:
- Process modifiers based on type and formula
- Process choices based on type and behavior
- Handle context-dependent calculations

### 3. Formula Calculation
**Location**: `frontend/src/lib/formulaCalculator.ts`
**Transformation**: Formula parameters + context → Calculated values
**Key Operations**:
- Map formula parameters to calculation inputs
- Handle attribute-dependent calculations
- Apply formula logic from static-data

## Context Data Structure

### CharacterContext
**Schema Location**: `packages/shared/schema/src/character.ts`

**Key Fields**:
- `classLevels`: Object mapping class IDs to levels
- `attributes`: Object mapping attribute IDs to values
- `choices`: Object mapping choice keys to selected values

**Usage in Formatters**:
- Calculate total character level
- Get attribute modifiers for attribute-dependent formulas
- Determine which conditional modifiers apply

## Data Validation Points

### 1. Schema Validation
**Location**: Zod schemas in `packages/shared/schema/src/`
**Purpose**: Ensure data structure integrity
**Validation**: Required fields, data types, relationships

### 2. Formula Validation
**Location**: `frontages/shared/static-data/src/FormulaDefinitions.ts`
**Purpose**: Ensure formula parameters are valid
**Validation**: Required parameters, parameter types, formula logic

### 3. Context Validation
**Location**: Formatter functions
**Purpose**: Ensure context data is available when needed
**Validation**: Character context presence, attribute availability

## Error Handling in Data Flow

### 1. Missing Data
**Scenario**: Formula parameters missing for formula-based modifier
**Handling**: Fallback to raw value, log warning

### 2. Invalid Formula
**Scenario**: Unknown formula ID or invalid parameters
**Handling**: Fallback to raw value, log error

### 3. Missing Context
**Scenario**: Attribute-dependent formula without character context
**Handling**: Show formula structure instead of calculated value

### 4. Invalid Relationships
**Scenario**: Modifier references non-existent appliesToId
**Handling**: Skip modifier, log warning

## Performance Considerations

### 1. Data Loading
- Backend includes all related data in single query
- Frontend processes data in memory
- No additional API calls during formatting

### 2. Calculation Caching
- Formula calculations are not cached
- Each formatting operation recalculates values
- Potential for optimization in future

### 3. Memory Usage
- All progression data loaded into memory
- No pagination or lazy loading
- Acceptable for current data sizes

## Implications for Refactoring

### 1. Data Structure Stability
- Core schemas are stable and well-defined
- Refactoring can focus on processing logic
- No schema changes required for formatter refactoring

### 2. Context Handling
- Context is optional and well-defined
- Can be passed down through layers cleanly
- Context validation can be centralized

### 3. Error Handling
- Current error handling is scattered
- Can be centralized in refactored architecture
- Fallback strategies can be standardized

### 4. Performance Optimization
- Current performance is acceptable
- Can optimize calculations in refactored system
- Caching can be added at appropriate layers

## Conclusion

The schema analysis reveals:

1. **Well-defined data structures** with clear relationships
2. **Stable schemas** that don't need changes for refactoring
3. **Clear data flow** from backend to frontend
4. **Optional context** that can be handled cleanly
5. **Scattered error handling** that can be centralized

The refactoring can focus on:
1. **Clean layer separation** without changing data structures
2. **Centralized context handling** using existing context structure
3. **Standardized error handling** across all layers
4. **Performance optimization** opportunities in the new architecture

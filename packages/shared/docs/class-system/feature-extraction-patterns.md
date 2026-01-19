# Feature Extraction Patterns

*Guide to extracting class and race mechanics from feature progressions.*

## Overview

Class and race mechanics (hit die, BAB, saving throws, size, speed, etc.) are now stored as `FeatureEntity` entries within `FeatureProgression` objects rather than as direct fields on the `Class` and `Race` models. This document explains how to extract these mechanics from resolved progressions.

## Core Concepts

### Feature Progression Structure

Mechanics are stored in feature progressions with the slug `"class-mechanics"` (for classes) or `"race-mechanics"` (for races). Each progression contains `FeatureEntity` entries with `EntityType.Base` that represent individual mechanical values:

- **Hit Die**: `EntityAppliesToType.HitDice` with value in `appliesToId`
- **BAB Progression**: `EntityAppliesToType.BaseAttackBonus` with formula-based calculation (see Formula-Based BAB below)
- **Saving Throws**: `EntityAppliesToType.SavingThrow` with formula-based calculation (see Formula-Based Saves below)
- **Skill Points**: `EntityAppliesToType.SkillPoints` with base value in `value` (uses `ABILITY_BASED` formula)
- **Size**: `EntityAppliesToType.Size` with size ID in `appliesToId`
- **Speed**: `EntityAppliesToType.MovementSpeed` with speed value in `value`
- **Favored Class**: `EntityAppliesToType.FavoredClass` with class ID in `appliesToId`
- **Level Adjustment**: `EntityAppliesToType.LevelAdjustment` with LA value in `value`

### Many-to-Many Relationships

Progressions can be shared across multiple classes or races via:
- `FeatureProgressionClassMap` (for classes)
- `FeatureProgressionRaceMap` (for races)

This allows classes/races with identical mechanics to share the same progression.

## Extraction Functions

### Class Mechanics Extraction

**Source File**: `apps/frontend/src/lib/feature-extraction/classMechanicsExtractor.ts`

#### `extractClassMechanics(progressions, classId?)`

Extracts all class mechanics from a list of progressions.

```typescript
import { extractClassMechanics } from '@/lib/feature-extraction/classMechanicsExtractor';

const mechanics = extractClassMechanics(progressions, classId);
// Returns: {
//   hitDie: number | null,
//   skillPoints: number | null,
//   babProgression: ProgressionType | null,
//   fortProgression: ProgressionType | null,
//   refProgression: ProgressionType | null,
//   willProgression: ProgressionType | null
// }
```

#### Individual Extraction Functions

- `extractHitDie(progressions, classId?)` - Returns hit die type (d4, d6, d8, etc.)
- `extractSkillPoints(progressions, classId?)` - Returns base skill points value
- `extractBABProgression(progressions, classId?)` - Returns BAB progression type (good/average/poor) by reverse-lookup from formula
- `extractSaveProgression(progressions, saveType, classId?)` - Returns saving throw progression type (good/poor) by reverse-lookup from formula

**Note**: These functions now check for formula-based entities first and use `formulaToProgressionType` helpers to reverse-lookup the `ProgressionType` from formula parameters. They fall back to old `appliesToId`/`appliesToSubId` patterns for backward compatibility during migration.

### Race Mechanics Extraction

**Source File**: `apps/frontend/src/lib/feature-extraction/raceMechanicsExtractor.ts`

#### `extractRaceMechanics(progressions, raceId?)`

Extracts all race mechanics from a list of progressions.

```typescript
import { extractRaceMechanics } from '@/lib/feature-extraction/raceMechanicsExtractor';

const mechanics = extractRaceMechanics(progressions, raceId);
// Returns: {
//   sizeId: number | null,
//   speed: number | null,
//   favoredClassId: number | null,
//   levelAdjustment: number | null
// }
```

#### Individual Extraction Functions

- `extractSizeId(progressions, raceId?)` - Returns size ID
- `extractSpeed(progressions, raceId?)` - Returns speed value
- `extractFavoredClassId(progressions, raceId?)` - Returns favored class ID
- `extractLevelAdjustment(progressions, raceId?)` - Returns level adjustment value

### Resolved Progressions Extraction

For character resolution contexts where you have resolved progressions (filtered by source type):

```typescript
import { extractRaceMechanicsFromResolved } from '@/lib/feature-extraction/raceMechanicsExtractor';

// For resolved progressions (already filtered by sourceType)
const raceMechanics = extractRaceMechanicsFromResolved(resolvedProgressions);
```

## Value Storage Patterns

### Pattern 1: ID-Based Storage (`appliesToId`)

Used when the value references an enum or lookup table:

- **Hit Die**: Stored in `appliesToId` (references `RPG_DICE` enum)
- **Size**: Stored in `appliesToId` (references `SIZE_MAP`)
- **Favored Class**: Stored in `appliesToId` (references class ID)

**Example**:
```typescript
{
  appliesTo: EntityAppliesToType.HitDice,
  appliesToId: 6, // d6
  value: 0
}
```

**Note**: BAB Progression previously used this pattern but has been migrated to formula-based storage (see Pattern 4).

### Pattern 2: Literal Value Storage (`value`)

Used when the value is a literal number:

- **Skill Points**: Stored in `value` (with `ABILITY_BASED` formula referencing INT)
- **Speed**: Stored in `value`
- **Level Adjustment**: Stored in `value`

**Example**:
```typescript
{
  appliesTo: EntityAppliesToType.Speed,
  appliesToId: null,
  value: 30
}
```

### Pattern 3: Formula-Based BAB Storage

Used for Base Attack Bonus progressions with formula-based calculations:

- **BAB Progression**: Formula-based calculation using `FeatureFormulaParams`
- **Good BAB**: `LINEAR_SCALING` formula with `value = 1.0` (stored in `entity.value`)
- **Average BAB**: `LEVEL_TIMES_VALUE` formula with `value = 0.75` (stored in `entity.value`)
- **Poor BAB**: `LEVEL_TIMES_VALUE` formula with `value = 0.5` (stored in `entity.value`)

**Example (Good BAB)**:
```typescript
{
  appliesTo: EntityAppliesToType.BaseAttackBonus,
  appliesToId: null, // No longer uses ProgressionType enum
  appliesToSubId: null,
  value: 1.0, // scalingValue for LINEAR_SCALING
  formulaParams: {
    formulaId: FormulaId.LINEAR_SCALING,
    includeProgressionLevel: true,
    // ... other formula params
  }
}
```

**Example (Average BAB)**:
```typescript
{
  appliesTo: EntityAppliesToType.BaseAttackBonus,
  appliesToId: null,
  appliesToSubId: null,
  value: 0.75, // scalingValue for LEVEL_TIMES_VALUE
  formulaParams: {
    formulaId: FormulaId.LEVEL_TIMES_VALUE,
    includeProgressionLevel: true,
    // ... other formula params
  }
}
```

**Note**: The old pattern using `appliesToId` with `ProgressionType` enum has been migrated to this formula-based approach.

### Pattern 4: Formula-Based Saving Throw Storage

Used for saving throw progressions with formula-based calculations:

- **Saving Throws**: Formula-based calculation using `FeatureFormulaParams`
- **Good Save**: `LEVEL_DIVIDED_BY_PLUS_BASE` formula with `divisor = 2`, `baseValue = 2`
- **Poor Save**: `LEVEL_DIVIDED_BY` formula with `divisor = 3`
- **Save Type**: Stored in `appliesToId` (Fortitude, Reflex, or Will)

**Example (Good Fortitude Save)**:
```typescript
{
  appliesTo: EntityAppliesToType.SavingThrow,
  appliesToId: SavingThrowId.Fortitude, // Which save type
  appliesToSubId: null, // No longer uses ProgressionType enum
  value: null, // Not used for saves
  formulaParams: {
    formulaId: FormulaId.LEVEL_DIVIDED_BY_PLUS_BASE,
    divisor: 2,
    baseValue: 2,
    includeProgressionLevel: true,
    // ... other formula params
  }
}
```

**Example (Poor Reflex Save)**:
```typescript
{
  appliesTo: EntityAppliesToType.SavingThrow,
  appliesToId: SavingThrowId.Reflex, // Which save type
  appliesToSubId: null,
  value: null,
  formulaParams: {
    formulaId: FormulaId.LEVEL_DIVIDED_BY,
    divisor: 3,
    baseValue: null,
    includeProgressionLevel: true,
    // ... other formula params
  }
}
```

**Note**: The old pattern using `appliesToSubId` with `ProgressionType` enum has been migrated to this formula-based approach.

## Usage Examples

### Frontend Display Components

```typescript
// In ClassDisplay.tsx
const mechanics = useMemo(() => {
  if (cls.features && cls.features.length > 0) {
    const extracted = extractClassMechanics(cls.features, cls.id);
    // Prefer extracted values, fallback to cls fields for backward compatibility
    return {
      hitDie: extracted.hitDie ?? cls.hitDie,
      skillPoints: extracted.skillPoints ?? cls.skillPoints,
      babProgression: extracted.babProgression ?? cls.babProgression,
      // ... other fields
    };
  }
  // Fallback to cls fields if no features
  return {
    hitDie: cls.hitDie,
    skillPoints: cls.skillPoints,
    // ... other fields
  };
}, [cls]);
```

### PDF Generation

```typescript
// In characterPdfService.ts
import { extractRaceMechanicsFromResolved } from '@/lib/feature-extraction/raceMechanicsExtractor';

// Extract race mechanics from resolved progressions
const raceMechanics = extractRaceMechanicsFromResolved(resolvedProgressions);

// Use extracted value with fallback for backward compatibility
const sizeId = raceMechanics.sizeId ?? fullRace?.sizeId;
const speed = raceMechanics.speed ?? fullRace?.speed;
```

### Character Calculations

```typescript
// In savingThrows.ts
import { extractSaveProgression } from '@/lib/feature-extraction/classMechanicsExtractor';

// Extract saving throw progression for a specific class
const fortProgression = extractSaveProgression(
  resolvedProgressions,
  SavingThrowId.Fortitude,
  classId
);
```

## Backend Extraction

**Source File**: `apps/backend/src/utils/classMechanicsExtractor.ts` and `raceMechanicsExtractor.ts`

The backend provides equivalent extraction functions for use in backend services and API endpoints. The patterns are identical to the frontend versions.

## Best Practices

### 1. Always Provide Fallback Values

When extracting mechanics, always provide fallback to direct fields for backward compatibility during the migration period:

```typescript
const hitDie = extracted.hitDie ?? class.hitDie;
```

### 2. Handle Null Values

All extraction functions return `null` when mechanics are not found. Always handle null cases:

```typescript
const hitDie = extracted.hitDie ?? defaultHitDie;
```

### 3. Use Appropriate Extraction Function

- Use `extractClassMechanics()` / `extractRaceMechanics()` when you need all mechanics
- Use individual extraction functions when you only need one value
- Use `extractRaceMechanicsFromResolved()` for resolved progressions (already filtered)

### 4. Consider Class/Race ID

When multiple classes/races share progressions, provide the `classId` or `raceId` parameter to ensure correct extraction:

```typescript
const mechanics = extractClassMechanics(progressions, classId);
```

## Related Documentation

- [Class System Migration Guide](migration-guide.md) - Complete migration process
- [Feature System Documentation](../feature-system/README.md) - Feature system architecture
- [Class System Database Schema](database-schema.md) - Database structure
- [Race System Documentation](../race-system/README.md) - Race system implementation

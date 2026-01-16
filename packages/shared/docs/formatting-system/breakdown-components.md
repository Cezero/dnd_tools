# Breakdown Components: Two Systems Explained

## Overview

The D&D Tools project uses two distinct but related systems for categorizing breakdown components in calculations. Understanding the difference between these systems is crucial for correctly implementing and displaying calculation breakdowns.

## The Two Systems

### 1. CalculationMethodType (Formatter System)

**Location**: `@shared/static-data/src/FormatterData.ts`

**Purpose**: Represents **HOW** a value is calculated or determined in the feature system.

**Values**:
- `base`: Base values in formulas (e.g., base value parameter, level values)
- `formula`: Formula-based calculations (e.g., ability modifiers used in formulas, formula results)
- `choice`: Choice-based values (e.g., feats, features, items - things the player chooses)
- `conditional`: Conditional values that depend on specific conditions being met

**Usage**: Used in the formatter system's `BreakdownComponent` interface to categorize how each component in a calculation breakdown was determined. This helps the formatting system display and group breakdown components appropriately.

**Example**:
```typescript
import { CalculationMethodType } from '@shared/static-data';

const component = {
    source: 'Dex Modifier',
    value: 3,
    type: CalculationMethodType.formula, // HOW: calculated via formula
    description: 'Dex: +3'
};
```

### 2. BreakdownSourceType (Character Calculation System)

**Location**: `apps/frontend/src/lib/character-calculation/types.ts`

**Purpose**: Represents **WHAT** the source of a modifier or value is in character calculations.

**Values**:
- `'base'`: Base value (e.g., base AC of 10, base ability score)
- `'ability'`: Ability modifier (e.g., Dex modifier for AC, Str modifier for attack)
- `'feat'`: Bonus from a feat
- `'feature'`: Bonus from a class feature or racial feature
- `'item'`: Bonus from an equipped item
- `'advancement'`: Bonus from level advancement (e.g., ability score improvements)
- `'formula_modification'`: Modification from a formula (e.g., Monk AC bonus)
- `'penalty'`: Penalty applied to the calculation
- `null`: No specific source type

**Usage**: Used in the character-calculation system's `BreakdownComponent` interface to identify the origin/category of a breakdown component.

**Example**:
```typescript
import type { BreakdownSourceType } from '@/lib/character-calculation/types';

const component = {
    source: 'Dex Modifier',
    value: 3,
    sourceType: 'ability' as BreakdownSourceType, // WHAT: ability modifier
    sourceId: AbilityId.Dexterity,
    context: { abilityId: AbilityId.Dexterity }
};
```

## Key Distinction

| Aspect | CalculationMethodType | BreakdownSourceType |
|--------|----------------------|---------------------|
| **Question** | HOW is the value determined? | WHAT is the source? |
| **System** | Formatter system | Character calculation system |
| **Purpose** | Categorize calculation method | Identify source origin |
| **Example** | `formula` (calculated via formula) | `'ability'` (from ability modifier) |

## Mapping Between Systems

When converting from the character-calculation system's `BreakdownSourceType` to the formatter system's `CalculationMethodType`, use the following mapping (implemented in `characterSheetDisplayStrategy.ts`):

| BreakdownSourceType | CalculationMethodType | Rationale |
|---------------------|----------------------|-----------|
| `'ability'` | `formula` | Ability modifiers are used in formulas |
| `'formula_modification'` | `formula` | Formula modifications are formula-based |
| `'feat'` | `choice` | Feats are player choices |
| `'feature'` | `choice` | Features are player choices |
| `'item'` | `choice` | Items are player choices |
| `'base'` | `base` | Base values are base values |
| `'penalty'` | `base` | Penalties are base adjustments |
| `'advancement'` | `base` | Advancements are base values |

### Implementation Example

```typescript
// Mapping function from characterSheetDisplayStrategy.ts
function mapSourceType(sourceType: BreakdownSourceType): CalculationMethodType {
    switch (sourceType) {
        case 'base':
            return CalculationMethodType.base;
        case 'ability':
        case 'formula_modification':
            return CalculationMethodType.formula;
        case 'feat':
        case 'feature':
        case 'item':
            return CalculationMethodType.choice;
        case 'penalty':
            return CalculationMethodType.base;
        default:
            return CalculationMethodType.base;
    }
}
```

## Usage Guidelines

### When to Use CalculationMethodType

Use `CalculationMethodType` when:
- Working in the formatter system
- Creating breakdown components for feature progressions
- Displaying formula calculation results
- Categorizing how values were determined

### When to Use BreakdownSourceType

Use `BreakdownSourceType` when:
- Working in the character-calculation system
- Creating breakdown components for character stats (AC, saves, skills, etc.)
- Identifying the source origin of modifiers
- Building calculation breakdowns from character data

## Related Documentation

- [Character Calculation Frontend](../character-management/character-calculation-frontend.md) - Details on the character-calculation system's breakdown components
- [Formatting System Architecture](./architecture-decisions.md) - Overall formatting system architecture
- [Formula System](../feature-system/formula-system.md) - How formulas work in the system

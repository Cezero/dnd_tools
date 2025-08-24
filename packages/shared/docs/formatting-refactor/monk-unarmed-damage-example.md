# Monk Unarmed Damage Feature Progression - Layer-by-Layer Example

## Overview
This document provides a detailed example of how the refactored formatter system handles the Monk Unarmed Damage feature progression, which uses conditional scaling formulas with size-based modifiers.

## Input Data (Schema)

```typescript
// FeatureProgression for Monk Unarmed Damage
const unarmedDamageProgression = {
  id: 1001,
  sourceType: FeatureSourceType.Class,
  level: 1,
  featureId: 701, // Unarmed Damage feature
  classId: 3, // Monk
  modifiers: [
    // Default size (Medium) unarmed damage
    {
      id: 2001,
      type: ModifierType.Replacement,
      appliesTo: ModifierAppliesToType.UnarmedDamage,
      value: 0, // Base value ignored for formula
      formulaParams: {
        id: 4001,
        formulaId: FormulaId.CONDITIONAL_SCALING,
        thresholds: "1,4,8,12,16,20",
        values: "1d6,1d8,1d10,2d6,2d8,2d10"
      },
      conditions: [] // No conditions = default size
    },
    
    // Small size unarmed damage
    {
      id: 2002,
      type: ModifierType.Replacement,
      appliesTo: ModifierAppliesToType.UnarmedDamage,
      value: 0, // Base value ignored for formula
      formulaParams: {
        id: 4002,
        formulaId: FormulaId.CONDITIONAL_SCALING,
        thresholds: "1,4,8,12,16,20",
        values: "1d4,1d6,1d8,1d10,2d6,2d8"
      },
      conditions: [
        {
          id: 3001,
          conditionType: FeatureModifierConditionType.character_size,
          conditionValue: 1 // Small size identifier
        }
      ]
    },
    
    // Large size unarmed damage
    {
      id: 2003,
      type: ModifierType.Replacement,
      appliesTo: ModifierAppliesToType.UnarmedDamage,
      value: 0, // Base value ignored for formula
      formulaParams: {
        id: 4003,
        formulaId: FormulaId.CONDITIONAL_SCALING,
        thresholds: "1,4,8,12,16,20",
        values: "1d8,2d6,2d8,3d6,3d8,4d8"
      },
      conditions: [
        {
          id: 3002,
          conditionType: FeatureModifierConditionType.character_size,
          conditionValue: 3 // Large size identifier
        }
      ]
    }
  ],
  choices: [],
  effects: []
};
```

## Layer-by-Layer Processing

### Layer 1: Pure Formatters

**Input**: Raw values (damage dice strings, size identifiers)
**Logic**: Convert raw values into human-readable strings using simple formatting rules
**Output**: Formatted strings ready for display

```typescript
// DamageFormatter
class DamageFormatter {
  format(damageDice: string): string {
    return `Unarmed Damage: ${damageDice}`;
  }
}

// SizeFormatter
class SizeFormatter {
  format(size: string): string {
    return size ? `(${size})` : "";
  }
}

// ConditionalDamageFormatter
class ConditionalDamageFormatter {
  format(damageDice: string, size: string): string {
    let result = `Unarmed Damage: ${damageDice}`;
    if (size) result += ` ${size}`;
    return result;
  }
}
```

**Examples**:
- Input: `damageDice: "1d6"` → Output: `"Unarmed Damage: 1d6"`
- Input: `size: "small"` → Output: `"(small)"`
- Input: `damageDice: "1d8", size: "large"` → Output: `"Unarmed Damage: 1d8 (large)"`

### Layer 2: Value Calculation

**Input**: Raw schema data (FeatureModifier with FormulaParams and conditions) and context (character level, size)
**Logic**: Apply conditional scaling formulas based on character size, evaluate conditions, and generate detailed breakdowns
**Output**: CalculationResult objects containing final values and complete breakdowns

```typescript
// Formula calculations for different sizes at different levels
const damageCalculations = {
  // Default size (Medium) calculations
  default: {
    level1: {
      value: "1d6",
      breakdown: {
        components: [
          { source: "Unarmed Damage Formula", value: "1d6", type: 'replacement', formula: "1d6 (level 1)" }
        ],
        formula: "Conditional scaling: 1d6 at level 1",
        explanation: "Monk unarmed damage scales with level"
      }
    },
    level4: {
      value: "1d8",
      breakdown: {
        components: [
          { source: "Unarmed Damage Formula", value: "1d8", type: 'replacement', formula: "1d8 (level 4)" }
        ],
        formula: "Conditional scaling: 1d8 at level 4"
      }
    },
    level8: {
      value: "1d10",
      breakdown: {
        components: [
          { source: "Unarmed Damage Formula", value: "1d10", type: 'replacement', formula: "1d10 (level 8)" }
        ],
        formula: "Conditional scaling: 1d10 at level 8"
      }
    },
    level12: {
      value: "2d6",
      breakdown: {
        components: [
          { source: "Unarmed Damage Formula", value: "2d6", type: 'replacement', formula: "2d6 (level 12)" }
        ],
        formula: "Conditional scaling: 2d6 at level 12"
      }
    },
    level16: {
      value: "2d8",
      breakdown: {
        components: [
          { source: "Unarmed Damage Formula", value: "2d8", type: 'replacement', formula: "2d8 (level 16)" }
        ],
        formula: "Conditional scaling: 2d8 at level 16"
      }
    },
    level20: {
      value: "2d10",
      breakdown: {
        components: [
          { source: "Unarmed Damage Formula", value: "2d10", type: 'replacement', formula: "2d10 (level 20)" }
        ],
        formula: "Conditional scaling: 2d10 at level 20"
      }
    }
  },
  
  // Small size calculations
  small: {
    level1: {
      value: "1d4",
      breakdown: {
        components: [
          { source: "Unarmed Damage Formula (Small)", value: "1d4", type: 'replacement', formula: "1d4 (level 1, small size)" }
        ],
        formula: "Conditional scaling: 1d4 at level 1 for small characters",
        explanation: "Small characters deal less unarmed damage"
      }
    },
    level4: {
      value: "1d6",
      breakdown: {
        components: [
          { source: "Unarmed Damage Formula (Small)", value: "1d6", type: 'replacement', formula: "1d6 (level 4, small size)" }
        ],
        formula: "Conditional scaling: 1d6 at level 4 for small characters"
      }
    },
    // ... more levels
    level12: {
      value: "1d10",
      breakdown: {
        components: [
          { source: "Unarmed Damage Formula (Small)", value: "1d10", type: 'replacement', formula: "1d10 (level 12, small size)" }
        ],
        formula: "Conditional scaling: 1d10 at level 12 for small characters"
      }
    }
  },
  
  // Large size calculations
  large: {
    level1: {
      value: "1d8",
      breakdown: {
        components: [
          { source: "Unarmed Damage Formula (Large)", value: "1d8", type: 'replacement', formula: "1d8 (level 1, large size)" }
        ],
        formula: "Conditional scaling: 1d8 at level 1 for large characters",
        explanation: "Large characters deal more unarmed damage"
      }
    },
    level4: {
      value: "2d6",
      breakdown: {
        components: [
          { source: "Unarmed Damage Formula (Large)", value: "2d6", type: 'replacement', formula: "2d6 (level 4, large size)" }
        ],
        formula: "Conditional scaling: 2d6 at level 4 for large characters"
      }
    },
    // ... more levels
    level12: {
      value: "3d6",
      breakdown: {
        components: [
          { source: "Unarmed Damage Formula (Large)", value: "3d6", type: 'replacement', formula: "3d6 (level 12, large size)" }
        ],
        formula: "Conditional scaling: 3d6 at level 12 for large characters"
      }
    }
  }
};
```

**Examples**:
- Input: `FeatureModifier` with `FormulaParams` (thresholds: "1,4,8,12,16,20", values: "1d6,1d8,1d10,2d6,2d8,2d10") at level 4
- Logic: Apply conditional scaling formula to determine damage at specific level
- Output: `value: "1d8"` with breakdown showing "Unarmed Damage Formula: 1d8 (level 4)"

### Layer 3: Progression Value Generation

**Input**: CalculationResult objects from Layer 2 and formula parameters that define progression patterns
**Logic**: Generate synthetic progression entries for all levels by applying formulas, and create separate progressions for each size category
**Output**: Arrays of ProgressionValue objects showing complete state at each level for each size

```typescript
// Generate progression values for all levels and sizes
const progressionValues = {
  // Default size progression
  default: [
    {
      level: 1,
      value: "1d6",
      breakdown: damageCalculations.default.level1.breakdown
    },
    {
      level: 4,
      value: "1d8",
      breakdown: damageCalculations.default.level4.breakdown
    },
    {
      level: 8,
      value: "1d10",
      breakdown: damageCalculations.default.level8.breakdown
    },
    {
      level: 12,
      value: "2d6",
      breakdown: damageCalculations.default.level12.breakdown
    },
    {
      level: 16,
      value: "2d8",
      breakdown: damageCalculations.default.level16.breakdown
    },
    {
      level: 20,
      value: "2d10",
      breakdown: damageCalculations.default.level20.breakdown
    }
  ],
  
  // Small size progression
  small: [
    {
      level: 1,
      value: "1d4",
      breakdown: damageCalculations.small.level1.breakdown
    },
    {
      level: 4,
      value: "1d6",
      breakdown: damageCalculations.small.level4.breakdown
    },
    {
      level: 8,
      value: "1d8",
      breakdown: damageCalculations.small.level8.breakdown
    },
    {
      level: 12,
      value: "1d10",
      breakdown: damageCalculations.small.level12.breakdown
    },
    {
      level: 16,
      value: "2d6",
      breakdown: damageCalculations.small.level16.breakdown
    },
    {
      level: 20,
      value: "2d8",
      breakdown: damageCalculations.small.level20.breakdown
    }
  ],
  
  // Large size progression
  large: [
    {
      level: 1,
      value: "1d8",
      breakdown: damageCalculations.large.level1.breakdown
    },
    {
      level: 4,
      value: "2d6",
      breakdown: damageCalculations.large.level4.breakdown
    },
    {
      level: 8,
      value: "2d8",
      breakdown: damageCalculations.large.level8.breakdown
    },
    {
      level: 12,
      value: "3d6",
      breakdown: damageCalculations.large.level12.breakdown
    },
    {
      level: 16,
      value: "3d8",
      breakdown: damageCalculations.large.level16.breakdown
    },
    {
      level: 20,
      value: "4d8",
      breakdown: damageCalculations.large.level20.breakdown
    }
  ]
};
```

### Layer 4: Transition Detection

**Input**: Arrays of ProgressionValue objects from Layer 3 showing complete state at each level for each size
**Logic**: Compare progression values between consecutive levels to identify meaningful changes in damage dice, and categorize the type of transition
**Output**: Arrays of TransitionPoint objects showing only the levels where significant changes occur

```typescript
// Detect meaningful transitions for each size
const transitions = {
  // Default size transitions
  default: [
    {
      level: 1,
      value: "1d6",
      breakdown: damageCalculations.default.level1.breakdown,
      changeType: "damage_increase"
    },
    {
      level: 4,
      value: "1d8",
      breakdown: damageCalculations.default.level4.breakdown,
      changeType: "damage_increase"
    },
    {
      level: 8,
      value: "1d10",
      breakdown: damageCalculations.default.level8.breakdown,
      changeType: "damage_increase"
    },
    {
      level: 12,
      value: "2d6",
      breakdown: damageCalculations.default.level12.breakdown,
      changeType: "damage_increase"
    },
    {
      level: 16,
      value: "2d8",
      breakdown: damageCalculations.default.level16.breakdown,
      changeType: "damage_increase"
    },
    {
      level: 20,
      value: "2d10",
      breakdown: damageCalculations.default.level20.breakdown,
      changeType: "damage_increase"
    }
  ],
  
  // Small size transitions
  small: [
    {
      level: 1,
      value: "1d4",
      breakdown: damageCalculations.small.level1.breakdown,
      changeType: "damage_increase"
    },
    {
      level: 4,
      value: "1d6",
      breakdown: damageCalculations.small.level4.breakdown,
      changeType: "damage_increase"
    },
    {
      level: 8,
      value: "1d8",
      breakdown: damageCalculations.small.level8.breakdown,
      changeType: "damage_increase"
    },
    {
      level: 12,
      value: "1d10",
      breakdown: damageCalculations.small.level12.breakdown,
      changeType: "damage_increase"
    },
    {
      level: 16,
      value: "2d6",
      breakdown: damageCalculations.small.level16.breakdown,
      changeType: "damage_increase"
    },
    {
      level: 20,
      value: "2d8",
      breakdown: damageCalculations.small.level20.breakdown,
      changeType: "damage_increase"
    }
  ],
  
  // Large size transitions
  large: [
    {
      level: 1,
      value: "1d8",
      breakdown: damageCalculations.large.level1.breakdown,
      changeType: "damage_increase"
    },
    {
      level: 4,
      value: "2d6",
      breakdown: damageCalculations.large.level4.breakdown,
      changeType: "damage_increase"
    },
    {
      level: 8,
      value: "2d8",
      breakdown: damageCalculations.large.level8.breakdown,
      changeType: "damage_increase"
    },
    {
      level: 12,
      value: "3d6",
      breakdown: damageCalculations.large.level12.breakdown,
      changeType: "damage_increase"
    },
    {
      level: 16,
      value: "3d8",
      breakdown: damageCalculations.large.level16.breakdown,
      changeType: "damage_increase"
    },
    {
      level: 20,
      value: "4d8",
      breakdown: damageCalculations.large.level20.breakdown,
      changeType: "damage_increase"
    }
  ]
};
```

### Layer 5: Multi-Item Grouping

**Input**: Arrays of TransitionPoint objects from Layer 4 showing meaningful changes at each level for each size
**Logic**: Group transitions by size category, combine multiple size progressions, and create comprehensive summaries showing all size variations
**Output**: GroupedResult objects that organize transitions by size and provide both detailed and summary views

```typescript
// Group transitions by size and combine related changes
const groupedResult = {
  formattedValue: "Level 1 (Unarmed Damage: Level 1: 1d6, Level 4: 1d8, Level 8: 1d10, Level 12: 2d6, Level 16: 2d8, Level 20: 2d10); Level 1 (small) (Unarmed Damage: Level 1: 1d4, Level 4: 1d6, Level 8: 1d8, Level 12: 1d10, Level 16: 2d6, Level 20: 2d8); Level 1 (large) (Unarmed Damage: Level 1: 1d8, Level 4: 2d6, Level 8: 2d8, Level 12: 3d6, Level 16: 3d8, Level 20: 4d8)",
  breakdown: {
    components: [
      {
        type: "default_damage",
        value: "1d6-2d10",
        formattedValue: "Default size unarmed damage: 1d6-2d10"
      },
      {
        type: "small_damage",
        value: "1d4-2d8",
        formattedValue: "Small size unarmed damage: 1d4-2d8"
      },
      {
        type: "large_damage",
        value: "1d8-4d8",
        formattedValue: "Large size unarmed damage: 1d8-4d8"
      }
    ]
  },
  sizeProgressions: {
    default: transitions.default,
    small: transitions.small,
    large: transitions.large
  }
};
```

**Examples**:
- Input: Multiple transitions showing damage increases for default, small, and large sizes
- Logic: Group by size category and create summary showing damage ranges for each size
- Output: Organized breakdown showing default (1d6-2d10), small (1d4-2d8), and large (1d8-4d8) damage ranges

### Layer 6: Context-Aware Display Logic

**Input**: GroupedResult objects from Layer 5 and display context (class detail, character sheet, feature edit)
**Logic**: Apply context-specific formatting rules, determine which size progression to show, and structure the output for the specific display scenario
**Output**: DisplayResult objects tailored to the specific context with appropriate formatting and information density

```typescript
// Class detail display (no character context) - show default size only
const classDetailDisplay = {
  formattedValue: "Level 1: Unarmed Damage: 1d6, Level 4: Unarmed Damage: 1d8, Level 8: Unarmed Damage: 1d10, Level 12: Unarmed Damage: 2d6, Level 16: Unarmed Damage: 2d8, Level 20: Unarmed Damage: 2d10",
  breakdown: groupedResult.breakdown,
  showBreakdown: false,
  components: groupedResult.components,
  levelEntries: [
    { level: 1, description: "Unarmed Damage: 1d6" },
    { level: 4, description: "Unarmed Damage: 1d8" },
    { level: 8, description: "Unarmed Damage: 1d10" },
    { level: 12, description: "Unarmed Damage: 2d6" },
    { level: 16, description: "Unarmed Damage: 2d8" },
    { level: 20, description: "Unarmed Damage: 2d10" }
  ]
};

// Character sheet display (with character context - 6th level Human Monk)
const characterSheetDisplay = {
  formattedValue: "Unarmed Damage: 1d8",
  breakdown: {
    components: [
      { source: "Unarmed Damage Formula", value: "1d8", type: 'replacement', formula: "1d8 (level 6)" }
    ],
    formula: "Conditional scaling: 1d8 at level 6",
    explanation: "Monk unarmed damage at level 6"
  },
  showBreakdown: true,
  components: [
    {
      type: "damage",
      value: "1d8",
      formattedValue: "Unarmed Damage: 1d8"
    }
  ]
};

// Character sheet display (with character context - 12th level Gnome Monk)
const characterSheetDisplaySmall = {
  formattedValue: "Unarmed Damage: 1d10",
  breakdown: {
    components: [
      { source: "Unarmed Damage Formula (Small)", value: "1d10", type: 'replacement', formula: "1d10 (level 12, small size)" }
    ],
    formula: "Conditional scaling: 1d10 at level 12 for small characters",
    explanation: "Small character monk unarmed damage at level 12"
  },
  showBreakdown: true,
  components: [
    {
      type: "damage",
      value: "1d10",
      formattedValue: "Unarmed Damage: 1d10"
    }
  ]
};

// Feature edit display (grouped by size progressions)
const featureEditDisplay = {
  formattedValue: "Unarmed Damage Progression",
  breakdown: {
    components: [
      { source: "Default Size Formula", value: "1d6-2d10", type: 'replacement' },
      { source: "Small Size Formula", value: "1d4-2d8", type: 'replacement' },
      { source: "Large Size Formula", value: "1d8-4d8", type: 'replacement' }
    ]
  },
  showBreakdown: true,
  components: groupedResult.components,
  sizeProgressions: {
    default: {
      description: "Level 1: 1d6, Level 4: 1d8, Level 8: 1d10, Level 12: 2d6, Level 16: 2d8, Level 20: 2d10",
      type: "default_size"
    },
    small: {
      description: "Level 1: 1d4, Level 4: 1d6, Level 8: 1d8, Level 12: 1d10, Level 16: 2d6, Level 20: 2d8",
      type: "small_size"
    },
    large: {
      description: "Level 1: 1d8, Level 4: 2d6, Level 8: 2d8, Level 12: 3d6, Level 16: 3d8, Level 20: 4d8",
      type: "large_size"
    }
  }
};
```

**Examples**:
- **Class Detail Context**: Show default size progression only, with each level displayed separately
- **Character Sheet Context**: Show current level damage based on character's actual size
- **Feature Edit Context**: Group by size progressions with expanded formula details for each size

## Display Examples

### Class Detail Page
```
Level 1
Unarmed Damage: 1d6
Level 4
Unarmed Damage: 1d8
Level 8
Unarmed Damage: 1d10
Level 12
Unarmed Damage: 2d6
Level 16
Unarmed Damage: 2d8
Level 20
Unarmed Damage: 2d10
```

### Character Sheet (6th level Human Monk)
```
Unarmed Damage: 1d8
```

### Character Sheet (12th level Gnome Monk)
```
Unarmed Damage: 1d10
```

### Feature Edit Page
```
Level 1 (Unarmed Damage: Level 1: 1d6, Level 4: 1d8, Level 8: 1d10, Level 12: 2d6, Level 16: 2d8, Level 20: 2d10)
Level 1 (small) (Unarmed Damage: Level 1: 1d4, Level 4: 1d6, Level 8: 1d8, Level 12: 1d10, Level 16: 2d6, Level 20: 2d8)
Level 1 (large) (Unarmed Damage: Level 1: 1d8, Level 4: 2d6, Level 8: 2d8, Level 12: 3d6, Level 16: 3d8, Level 20: 4d8)
```

## Key Insights

1. **Size-Based Conditionals**: Unarmed damage varies by character size with separate formula progressions
2. **Default Size Display**: Class detail shows default (Medium) size progression only
3. **Context-Aware Calculation**: Character sheet shows damage based on actual character size
4. **Multiple Progressions**: Feature edit shows all size variations with full formula details
5. **Conditional Evaluation**: Size conditions determine which damage formula applies
6. **Level-by-Level Display**: Class detail shows each level separately with damage changes
7. **Size-Specific Tracking**: Character sheet tracks damage based on character's racial size
8. **Progression Grouping**: Feature edit groups by size with expanded formula details

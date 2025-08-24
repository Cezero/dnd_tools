# Druid Wildshape Feature Progression - Layer-by-Layer Example

## Overview
This document provides a detailed example of how the refactored formatter system handles the complex Druid Wildshape feature progression, which combines formula-based uses/day, cumulative size options, and form type additions.

## Input Data (Schema)

```typescript
// FeatureProgression entries for Druid Wildshape
const wildshapeProgressions = [
  // Level 5: Initial wildshape with formula-based uses
  {
    id: 1001,
    sourceType: FeatureSourceType.Class,
    level: 5,
    featureId: 601, // Wildshape feature
    classId: 4, // Druid
    modifiers: [
      {
        id: 2001,
        type: ModifierType.Quantity,
        value: 0, // Base value ignored for formula
        appliesTo: ModifierAppliesToType.Uses,
        appliesToId: 1, // "day" identifier
        formulaParams: {
          id: 4001,
          formulaId: FormulaId.CONDITIONAL_SCALING,
          thresholds: "5,6,7,10,14,18",
          values: "1,2,3,4,5,6"
        }
      }
    ],
    choices: [],
    effects: []
  },
  
  // Level 8: Large size option
  {
    id: 1002,
    sourceType: FeatureSourceType.Class,
    level: 8,
    featureId: 601,
    classId: 4,
    modifiers: [],
    choices: [],
    effects: [
      {
        id: 3001,
        effectType: FeatureSpecialEffectType.WildShapeSize,
        key: "size",
        value: "Large"
      }
    ]
  },
  
  // Level 11: Tiny size option
  {
    id: 1003,
    sourceType: FeatureSourceType.Class,
    level: 11,
    featureId: 601,
    classId: 4,
    modifiers: [],
    choices: [],
    effects: [
      {
        id: 3002,
        effectType: FeatureSpecialEffectType.WildShapeSize,
        key: "size",
        value: "Tiny"
      }
    ]
  },
  
  // Level 12: Plant form option
  {
    id: 1004,
    sourceType: FeatureSourceType.Class,
    level: 12,
    featureId: 601,
    classId: 4,
    modifiers: [],
    choices: [],
    effects: [
      {
        id: 3003,
        effectType: FeatureSpecialEffectType.WildShapeForm,
        key: "wildshape",
        value: "Plant"
      }
    ]
  },
  
  // Level 15: Huge size option
  {
    id: 1005,
    sourceType: FeatureSourceType.Class,
    level: 15,
    featureId: 601,
    classId: 4,
    modifiers: [],
    choices: [],
    effects: [
      {
        id: 3004,
        effectType: FeatureSpecialEffectType.WildShapeSize,
        key: "size",
        value: "Huge"
      }
    ]
  },
  
  // Level 16: Additional elemental uses + elemental form
  {
    id: 1006,
    sourceType: FeatureSourceType.Class,
    level: 16,
    featureId: 601,
    classId: 4,
    modifiers: [
      {
        id: 2002,
        type: ModifierType.Quantity,
        value: 1,
        appliesTo: ModifierAppliesToType.Uses,
        appliesToId: 2, // "elemental_day" identifier
        formulaParams: {
          id: 4002,
          formulaId: FormulaId.EVERY_N_LEVELS,
          interval: 2,
          formulaStartLevel: 16
        }
      }
    ],
    choices: [],
    effects: [
      {
        id: 3005,
        effectType: FeatureSpecialEffectType.WildShapeForm,
        key: "elementalwildshape",
        value: "elemental"
      }
    ]
  },
  
  // Level 20: Huge elemental size
  {
    id: 1007,
    sourceType: FeatureSourceType.Class,
    level: 20,
    featureId: 601,
    classId: 4,
    modifiers: [],
    choices: [],
    effects: [
      {
        id: 3006,
        effectType: FeatureSpecialEffectType.WildShapeSize,
        key: "elementalwildshape",
        value: "Huge"
      }
    ]
  }
];
```

## Layer-by-Layer Processing

### Layer 1: Pure Formatters

**Input**: Raw values (numbers, strings, arrays)
**Logic**: Convert raw values into human-readable strings using simple formatting rules
**Output**: Formatted strings ready for display

```typescript
// UsesFormatter
class UsesFormatter {
  format(uses: number, period: string): string {
    return `${uses}/${period}`;
  }
}

// SizeFormatter
class SizeFormatter {
  format(sizes: string[]): string {
    return sizes.join("/");
  }
}

// FormFormatter
class FormFormatter {
  format(forms: string[]): string {
    return forms.join(", ");
  }
}

// WildshapeFormatter
class WildshapeFormatter {
  format(uses: string, sizes: string, forms: string): string {
    let result = `Wildshape: ${uses}`;
    if (sizes) result += ` (${sizes})`;
    if (forms) result += ` - ${forms}`;
    return result;
  }
}
```

**Examples**:
- Input: `uses: 4, period: "day"` → Output: `"4/day"`
- Input: `sizes: ["Small", "Medium", "Large"]` → Output: `"Small/Medium/Large"`
- Input: `forms: ["Animal", "Plant"]` → Output: `"Animal, Plant"`

### Layer 2: Value Calculation

**Input**: Raw schema data (FeatureModifier, FeatureFormulaParams, FeatureSpecialEffect) and context (character level, attributes)
**Logic**: Apply formula calculations, evaluate conditions, and generate detailed breakdowns showing how each value was computed
**Output**: CalculationResult objects containing final values and complete breakdowns of how they were calculated

```typescript
// Formula calculation for uses/day at different levels
const usesCalculations = {
  level5: {
    value: 1,
    breakdown: {
      components: [
        { source: "Wildshape Formula", value: 1, type: 'quantity', formula: "1/day (level 5)" }
      ],
      formula: "Conditional scaling: 1/day at level 5",
      explanation: "Druid wildshape uses scale with level"
    }
  },
  level6: {
    value: 2,
    breakdown: {
      components: [
        { source: "Wildshape Formula", value: 2, type: 'quantity', formula: "2/day (level 6)" }
      ],
      formula: "Conditional scaling: 2/day at level 6"
    }
  },
  // ... more levels
  level16: {
    value: 6, // 6 regular uses + 1 elemental use (separate pools)
    breakdown: {
      components: [
        { source: "Wildshape Formula", value: 6, type: 'quantity', formula: "6/day (level 18)" },
        { source: "Elemental Wildshape", value: 1, type: 'quantity', formula: "1/day (level 16)" }
      ],
      formula: "6 regular uses + 1 elemental use (separate pools)"
    }
  }
};
```

**Examples**:
- Input: `FeatureModifier` with `FormulaParams` (thresholds: "5,6,7,10,14,18", values: "1,2,3,4,5,6") at level 5
- Logic: Apply conditional scaling formula to determine value at specific level
- Output: `value: 1` with breakdown showing "Wildshape Formula: 1/day (level 5)"

// Size accumulation calculation
const sizeCalculations = {
  level5: {
    value: ["Small", "Medium"],
    breakdown: {
      components: [
        { source: "Base Wildshape", value: "Small/Medium", type: 'form' }
      ],
      formula: "Default animal forms"
    }
  },
  level8: {
    value: ["Small", "Medium", "Large"],
    breakdown: {
      components: [
        { source: "Base Wildshape", value: "Small/Medium", type: 'form' },
        { source: "Large Size Option", value: "Large", type: 'form' }
      ],
      formula: "Small/Medium + Large"
    }
  },
  // ... more levels
  level15: {
    value: ["Tiny", "Small", "Medium", "Large", "Huge"],
    breakdown: {
      components: [
        { source: "Base Wildshape", value: "Small/Medium", type: 'form' },
        { source: "Large Size Option", value: "Large", type: 'form' },
        { source: "Tiny Size Option", value: "Tiny", type: 'form' },
        { source: "Huge Size Option", value: "Huge", type: 'form' }
      ],
      formula: "All size categories available"
    }
  }
};
```

**Examples**:
- Input: `FeatureSpecialEffect` with `effectType: WildShapeSize, value: "Large"` at level 8
- Logic: Accumulate size options from all previous levels plus new size option
- Output: `value: ["Small", "Medium", "Large"]` with breakdown showing each source

### Layer 3: Progression Value Generation

**Input**: CalculationResult objects from Layer 2 and formula parameters that define progression patterns
**Logic**: Generate synthetic progression entries for all levels by applying formulas, and combine multiple calculation results into comprehensive progression values
**Output**: Arrays of ProgressionValue objects showing complete state at each level

```typescript
// Generate progression values for all levels
const progressionValues = [
  {
    level: 5,
    value: {
      uses: 1,
      sizes: ["Small", "Medium"],
      forms: ["Animal"]
    },
    breakdown: {
      uses: usesCalculations.level5.breakdown,
      sizes: sizeCalculations.level5.breakdown,
      forms: { components: [{ source: "Base Forms", value: "Animal", type: 'form' }] }
    }
  },
  {
    level: 6,
    value: {
      uses: 2,
      sizes: ["Small", "Medium"],
      forms: ["Animal"]
    },
    breakdown: {
      uses: usesCalculations.level6.breakdown,
      sizes: sizeCalculations.level5.breakdown, // No change
      forms: { components: [{ source: "Base Forms", value: "Animal", type: 'form' }] }
    }
  },
  {
    level: 8,
    value: {
      uses: 3,
      sizes: ["Small", "Medium", "Large"],
      forms: ["Animal"]
    },
    breakdown: {
      uses: usesCalculations.level8.breakdown,
      sizes: sizeCalculations.level8.breakdown,
      forms: { components: [{ source: "Base Forms", value: "Animal", type: 'form' }] }
    }
  },
  {
    level: 11,
    value: {
      uses: 4,
      sizes: ["Tiny", "Small", "Medium", "Large"],
      forms: ["Animal"]
    },
    breakdown: {
      uses: usesCalculations.level11.breakdown,
      sizes: sizeCalculations.level11.breakdown,
      forms: { components: [{ source: "Base Forms", value: "Animal", type: 'form' }] }
    }
  },
  {
    level: 12,
    value: {
      uses: 4,
      sizes: ["Tiny", "Small", "Medium", "Large"],
      forms: ["Animal", "Plant"]
    },
    breakdown: {
      uses: usesCalculations.level11.breakdown, // No change
      sizes: sizeCalculations.level11.breakdown, // No change
      forms: {
        components: [
          { source: "Base Forms", value: "Animal", type: 'form' },
          { source: "Plant Form", value: "Plant", type: 'form' }
        ]
      }
    }
  },
  {
    level: 15,
    value: {
      uses: 5,
      sizes: ["Tiny", "Small", "Medium", "Large", "Huge"],
      forms: ["Animal", "Plant"]
    },
    breakdown: {
      uses: usesCalculations.level15.breakdown,
      sizes: sizeCalculations.level15.breakdown,
      forms: {
        components: [
          { source: "Base Forms", value: "Animal", type: 'form' },
          { source: "Plant Form", value: "Plant", type: 'form' }
        ]
      }
    }
  },
  {
    level: 16,
    value: {
      regularUses: 6,
      elementalUses: 1,
      sizes: ["Tiny", "Small", "Medium", "Large", "Huge"],
      forms: ["Animal", "Plant", "Elemental"]
    },
    breakdown: {
      regularUses: { components: [{ source: "Wildshape Formula", value: 6, type: 'quantity' }] },
      elementalUses: { components: [{ source: "Elemental Wildshape", value: 1, type: 'quantity' }] },
      sizes: sizeCalculations.level15.breakdown, // No change
      forms: {
        components: [
          { source: "Base Forms", value: "Animal", type: 'form' },
          { source: "Plant Form", value: "Plant", type: 'form' },
          { source: "Elemental Form", value: "Elemental", type: 'form' }
        ]
      }
    }
  },
  {
    level: 20,
    value: {
      regularUses: 6,
      elementalUses: 3,
      sizes: ["Tiny", "Small", "Medium", "Large", "Huge"],
      forms: ["Animal", "Plant", "Elemental"]
    },
    breakdown: {
      regularUses: { components: [{ source: "Wildshape Formula", value: 6, type: 'quantity' }] },
      elementalUses: { components: [{ source: "Elemental Wildshape", value: 3, type: 'quantity' }] },
      sizes: sizeCalculations.level15.breakdown, // No change
      forms: {
        components: [
          { source: "Base Forms", value: "Animal", type: 'form' },
          { source: "Plant Form", value: "Plant", type: 'form' },
          { source: "Elemental Form", value: "Elemental", type: 'form' }
        ]
      }
    }
  }
];
```

### Layer 4: Transition Detection

**Input**: Arrays of ProgressionValue objects from Layer 3 showing complete state at each level
**Logic**: Compare progression values between consecutive levels to identify meaningful changes (new abilities, value increases, form additions) and categorize the type of transition
**Output**: Arrays of TransitionPoint objects showing only the levels where significant changes occur

```typescript
// Detect meaningful transitions
const transitions = [
  {
    level: 5,
    value: {
      uses: 1,
      sizes: ["Small", "Medium"],
      forms: ["Animal"]
    },
    breakdown: progressionValues[0].breakdown,
    changeType: "wildshape_unlock"
  },
  {
    level: 8,
    value: {
      uses: 3,
      sizes: ["Small", "Medium", "Large"],
      forms: ["Animal"]
    },
    breakdown: progressionValues[2].breakdown,
    changeType: "size_expansion"
  },
  {
    level: 11,
    value: {
      uses: 4,
      sizes: ["Tiny", "Small", "Medium", "Large"],
      forms: ["Animal"]
    },
    breakdown: progressionValues[3].breakdown,
    changeType: "size_expansion"
  },
  {
    level: 12,
    value: {
      uses: 4,
      sizes: ["Tiny", "Small", "Medium", "Large"],
      forms: ["Animal", "Plant"]
    },
    breakdown: progressionValues[4].breakdown,
    changeType: "form_expansion"
  },
  {
    level: 15,
    value: {
      uses: 5,
      sizes: ["Tiny", "Small", "Medium", "Large", "Huge"],
      forms: ["Animal", "Plant"]
    },
    breakdown: progressionValues[5].breakdown,
    changeType: "size_expansion"
  },
  {
    level: 16,
    value: {
      regularUses: 6,
      elementalUses: 1,
      sizes: ["Tiny", "Small", "Medium", "Large", "Huge"],
      forms: ["Animal", "Plant", "Elemental"]
    },
    breakdown: progressionValues[6].breakdown,
    changeType: "elemental_unlock"
  },
  {
    level: 20,
    value: {
      regularUses: 6,
      elementalUses: 3,
      sizes: ["Tiny", "Small", "Medium", "Large", "Huge"],
      forms: ["Animal", "Plant", "Elemental"]
    },
    breakdown: progressionValues[7].breakdown,
    changeType: "elemental_enhancement"
  }
];
```

### Layer 5: Multi-Item Grouping

**Input**: Arrays of TransitionPoint objects from Layer 4 showing meaningful changes at each level
**Logic**: Group related transitions together, combine multiple aspects of the same feature, and create comprehensive summaries that show the full scope of the feature's capabilities
**Output**: GroupedResult objects that organize transitions into logical groups and provide both detailed and summary views

```typescript
// Group transitions by type and combine related changes
const groupedResult = {
  formattedValue: "Level 5: Wild shape (1/day), Level 6: Wild shape (2/day), Level 7: Wild shape (3/day), Level 8: Wild shape (Large), Level 10: Wild shape (4/day), Level 11: Wild shape (Tiny), Level 12: Wild shape (plant), Level 14: Wild shape (5/day), Level 15: Wild shape (Huge), Level 16: Wild shape (elemental 1/day), Level 18: Wild shape (6/day, elemental 2/day), Level 20: Wild shape (elemental 3/day, Huge elemental)",
  breakdown: {
    components: [
      {
        type: "regular_uses",
        value: "1-6/day",
        formattedValue: "Regular wildshape uses: 1-6/day"
      },
      {
        type: "elemental_uses",
        value: "1-3/day",
        formattedValue: "Elemental wildshape uses: 1-3/day"
      },
      {
        type: "sizes",
        value: "Tiny/Small/Medium/Large/Huge",
        formattedValue: "Available sizes: Tiny/Small/Medium/Large/Huge"
      },
      {
        type: "forms",
        value: "Animal, Plant, Elemental",
        formattedValue: "Available forms: Animal, Plant, Elemental"
      }
    ]
  },
  transitions: transitions
};
```

**Examples**:
- Input: Multiple transitions showing uses/day increases, size additions, and form additions
- Logic: Group by feature aspect (uses, sizes, forms) and create summary of full progression
- Output: Organized breakdown showing regular uses (1-6/day), elemental uses (1-3/day), all sizes, and all forms

### Layer 6: Context-Aware Display Logic

**Input**: GroupedResult objects from Layer 5 and display context (class detail, character sheet, feature edit)
**Logic**: Apply context-specific formatting rules, determine what information to show/hide, and structure the output for the specific display scenario
**Output**: DisplayResult objects tailored to the specific context with appropriate formatting and information density

```typescript
// Class detail display (no character context) - show each level separately
const classDetailDisplay = {
  formattedValue: "Level 5: Wild shape (1/day), Level 6: Wild shape (2/day), Level 7: Wild shape (3/day), Level 8: Wild shape (Large), Level 10: Wild shape (4/day), Level 11: Wild shape (Tiny), Level 12: Wild shape (plant), Level 14: Wild shape (5/day), Level 15: Wild shape (Huge), Level 16: Wild shape (elemental 1/day), Level 18: Wild shape (6/day, elemental 2/day), Level 20: Wild shape (elemental 3/day, Huge elemental)",
  breakdown: groupedResult.breakdown,
  showBreakdown: false,
  components: groupedResult.components,
  levelEntries: [
    { level: 5, description: "Wild shape (1/day)" },
    { level: 6, description: "Wild shape (2/day)" },
    { level: 7, description: "Wild shape (3/day)" },
    { level: 8, description: "Wild shape (Large)" },
    { level: 10, description: "Wild shape (4/day)" },
    { level: 11, description: "Wild shape (Tiny)" },
    { level: 12, description: "Wild shape (plant)" },
    { level: 14, description: "Wild shape (5/day)" },
    { level: 15, description: "Wild shape (Huge)" },
    { level: 16, description: "Wild shape (elemental 1/day)" },
    { level: 18, description: "Wild shape (6/day, elemental 2/day)" },
    { level: 20, description: "Wild shape (elemental 3/day, Huge elemental)" }
  ]
};
```

**Examples**:
- **Class Detail Context**: Show each level separately with only the changes at that level
- **Character Sheet Context**: Show current level usage with available options listed separately
- **Feature Edit Context**: Group by FeatureProgression entries with expanded formula details

// Character sheet display (with character context - level 12)
const characterSheetDisplay = {
  formattedValue: "Wild Shape (tiny, plant) 0 of 5/day used",
  breakdown: {
    components: [
      { source: "Wildshape Formula", value: 4, type: 'quantity', formula: "4/day (level 12)" },
      { source: "Available Sizes", value: "Tiny/Small/Medium/Large", type: 'form' },
      { source: "Available Forms", value: "Animal, Plant", type: 'form' }
    ],
    formula: "4 uses/day with Tiny/Small/Medium/Large sizes in Animal or Plant form",
    explanation: "Druid wildshape at level 12"
  },
  showBreakdown: true,
  components: [
    {
      type: "wildshape",
      value: "4/day",
      formattedValue: "Wild Shape (tiny, plant) 0 of 4/day used"
    },
    {
      type: "sizes",
      value: "Tiny/Small/Medium/Large",
      formattedValue: "Available sizes: Tiny, Small, Medium, Large"
    },
    {
      type: "forms",
      value: "Animal, Plant",
      formattedValue: "Available forms: Animal, Plant"
    }
  ]
};

// Feature edit display (grouped by FeatureProgression entries)
const featureEditDisplay = {
  formattedValue: "Wildshape Progression",
  breakdown: {
    components: [
      { source: "Formula-Based Uses", value: "1-6/day", type: 'quantity' },
      { source: "Elemental Uses", value: "1-3/day", type: 'quantity' },
      { source: "Size Options", value: "Tiny/Small/Medium/Large/Huge", type: 'form' },
      { source: "Form Options", value: "Animal/Plant/Elemental", type: 'form' }
    ]
  },
  showBreakdown: true,
  components: groupedResult.components,
  progressionGroups: [
    {
      level: 5,
      description: "Level 5: 1/day, Level 6: 2/day, Level 7: 3/day, Level 10: 4/day, Level 14: 5/day, Level 18: 6/day",
      type: "formula_uses"
    },
    {
      level: 8,
      description: "Size: Large",
      type: "size_option"
    },
    {
      level: 11,
      description: "Size: Tiny",
      type: "size_option"
    },
    {
      level: 12,
      description: "Form: Plant",
      type: "form_option"
    },
    {
      level: 15,
      description: "Size: Huge",
      type: "size_option"
    },
    {
      level: 16,
      description: "Level 16: elemental 1/day, Level 18: elemental 2/day, Level 20: elemental 3/day",
      type: "elemental_uses"
    },
    {
      level: 20,
      description: "elemental Size: Huge",
      type: "elemental_size"
    }
  ]
};
```

## Display Examples

### Class Detail Page
```
Level 5
Wild shape (1/day)
Level 6
Wild shape (2/day)
Level 7
Wild shape (3/day)
Level 8
Wild shape (Large)
Level 10
Wild shape (4/day)
Level 11
Wild shape (Tiny)
Level 12
Wild shape (plant)
Level 14
Wild shape (5/day)
Level 15
Wild shape (Huge)
Level 16
Wild shape (elemental 1/day)
Level 18
Wild shape (6/day, elemental 2/day)
Level 20
Wild shape (elemental 3/day, Huge elemental)
```

### Character Sheet (Level 12)
```
Wild Shape (tiny, plant) 0 of 4/day used
Available sizes: Tiny, Small, Medium, Large
Available forms: Animal, Plant
```

### Feature Edit Page
```
Level 5 (Level 5: 1/day, Level 6: 2/day, Level 7: 3/day, Level 10: 4/day, Level 14: 5/day, Level 18: 6/day)
Level 8 (Size: Large)
Level 11 (Size: Tiny)
Level 12 (Form: Plant)
Level 15 (Size: Huge)
Level 16 (Level 16: elemental 1/day, Level 18: elemental 2/day, Level 20: elemental 3/day)
Level 20 (elemental Size: Huge)
```

## Key Insights

1. **Complex Progression**: Wildshape combines formula-based uses, cumulative size options, and form additions
2. **Multiple Aspects**: Each progression entry can affect uses, sizes, or forms independently
3. **Context Matters**: Class detail shows full progression, character sheet shows current capabilities
4. **Cumulative Effects**: Sizes and forms accumulate over levels rather than replacing previous options
5. **Dual Use System**: Regular wildshape uses + elemental wildshape uses create separate usage pools
6. **Level-by-Level Display**: Class detail shows each level separately with only the changes at that level
7. **Separate Usage Tracking**: Character sheet shows current usage with available forms/sizes listed separately
8. **Progression Grouping**: Feature edit groups by FeatureProgression entries with expanded formula details

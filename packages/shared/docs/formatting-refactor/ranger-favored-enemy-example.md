# Ranger Favored Enemy Feature Progression - Layer-by-Layer Example

## Overview
This document provides a detailed example of how the refactored formatter system handles the Ranger Favored Enemy feature progression, which uses a choice-based system for creature type selection and bonus allocation.

## Input Data (Schema)

```typescript
// FeatureProgression for Ranger Favored Enemy at Level 1
const favoredEnemyLevel1 = {
  id: 1001,
  sourceType: FeatureSourceType.Class,
  level: 1,
  featureId: 801, // Favored Enemy feature
  classId: 4, // Ranger
  modifiers: [],
  choices: [
    {
      id: 2001,
      type: FeatureChoiceType.CreatureType,
      behavior: FeatureChoiceBehavior.Single,
      filterType: FeatureFeatChoiceFilter.RangerFavoredEnemy,
      // Player selects one creature type from the allowed list
    }
  ],
  effects: []
};

// FeatureProgression for Ranger Favored Enemy at Level 5
const favoredEnemyLevel5 = {
  id: 1002,
  sourceType: FeatureSourceType.Class,
  level: 5,
  featureId: 801, // Favored Enemy feature
  classId: 4, // Ranger
  modifiers: [],
  choices: [
    {
      id: 2002,
      type: FeatureChoiceType.CreatureType,
      behavior: FeatureChoiceBehavior.Single,
      filterType: FeatureFeatChoiceFilter.RangerFavoredEnemy,
      // Player selects one additional creature type
    },
    {
      id: 2003,
      type: FeatureChoiceType.CreatureType,
      behavior: FeatureChoiceBehavior.Allocation,
      filterType: FeatureFeatChoiceFilter.RangerFavoredEnemy,
      // Player allocates bonus increase to any existing favored enemy
    }
  ],
  effects: []
};

// FeatureProgression for Ranger Favored Enemy at Level 10
const favoredEnemyLevel10 = {
  id: 1003,
  sourceType: FeatureSourceType.Class,
  level: 10,
  featureId: 801, // Favored Enemy feature
  classId: 4, // Ranger
  modifiers: [],
  choices: [
    {
      id: 2004,
      type: FeatureChoiceType.CreatureType,
      behavior: FeatureChoiceBehavior.Single,
      filterType: FeatureFeatChoiceFilter.RangerFavoredEnemy,
      // Player selects one additional creature type
    },
    {
      id: 2005,
      type: FeatureChoiceType.CreatureType,
      behavior: FeatureChoiceBehavior.Allocation,
      filterType: FeatureFeatChoiceFilter.RangerFavoredEnemy,
      // Player allocates bonus increase to any existing favored enemy
    }
  ],
  effects: []
};

// FeatureProgression for Ranger Favored Enemy at Level 15
const favoredEnemyLevel15 = {
  id: 1004,
  sourceType: FeatureSourceType.Class,
  level: 15,
  featureId: 801, // Favored Enemy feature
  classId: 4, // Ranger
  modifiers: [],
  choices: [
    {
      id: 2006,
      type: FeatureChoiceType.CreatureType,
      behavior: FeatureChoiceBehavior.Single,
      filterType: FeatureFeatChoiceFilter.RangerFavoredEnemy,
      // Player selects one additional creature type
    },
    {
      id: 2007,
      type: FeatureChoiceType.CreatureType,
      behavior: FeatureChoiceBehavior.Allocation,
      filterType: FeatureFeatChoiceFilter.RangerFavoredEnemy,
      // Player allocates bonus increase to any existing favored enemy
    }
  ],
  effects: []
};

// FeatureProgression for Ranger Favored Enemy at Level 20
const favoredEnemyLevel20 = {
  id: 1005,
  sourceType: FeatureSourceType.Class,
  level: 20,
  featureId: 801, // Favored Enemy feature
  classId: 4, // Ranger
  modifiers: [],
  choices: [
    {
      id: 2008,
      type: FeatureChoiceType.CreatureType,
      behavior: FeatureChoiceBehavior.Single,
      filterType: FeatureFeatChoiceFilter.RangerFavoredEnemy,
      // Player selects one additional creature type
    },
    {
      id: 2009,
      type: FeatureChoiceType.CreatureType,
      behavior: FeatureChoiceBehavior.Allocation,
      filterType: FeatureFeatChoiceFilter.RangerFavoredEnemy,
      // Player allocates bonus increase to any existing favored enemy
    }
  ],
  effects: []
};
```

## Layer-by-Layer Processing

### Layer 1: Pure Formatters

**Input**: Raw values (creature type names, choice behavior types)
**Logic**: Convert raw values into human-readable strings using simple formatting rules
**Output**: Formatted strings ready for display

```typescript
// CreatureTypeFormatter
class CreatureTypeFormatter {
  format(creatureType: string): string {
    return creatureType; // e.g., "Goblinoid", "Undead", "Dragon"
  }
}

// ChoiceBehaviorFormatter
class ChoiceBehaviorFormatter {
  format(behavior: FeatureChoiceBehavior): string {
    switch (behavior) {
      case FeatureChoiceBehavior.Single:
        return "Select";
      case FeatureChoiceBehavior.Allocation:
        return "Allocate";
      default:
        return behavior;
    }
  }
}

// ChoiceTypeFormatter
class ChoiceTypeFormatter {
  format(type: FeatureChoiceType): string {
    switch (type) {
      case FeatureChoiceType.CreatureType:
        return "Creature Type";
      default:
        return type;
    }
  }
}
```

**Examples**:
- Input: `creatureType: "Goblinoid"` → Output: `"Goblinoid"`
- Input: `behavior: FeatureChoiceBehavior.Single` → Output: `"Select"`
- Input: `behavior: FeatureChoiceBehavior.Allocation` → Output: `"Allocate"`
- Input: `type: FeatureChoiceType.CreatureType` → Output: `"Creature Type"`

### Layer 2: Value Calculation

**Input**: Raw schema data (FeatureChoice objects) and context (character choices made)
**Logic**: Process choice objects to determine available options and format choice descriptions
**Output**: CalculationResult objects containing choice information and breakdowns

```typescript
// Choice calculations for different levels
const choiceCalculations = {
  // Level 1 - Single creature type selection
  level1: {
    value: "Select Creature Type",
    breakdown: {
      components: [
        { source: "Favored Enemy Choice", value: "Single Selection", type: 'choice', formula: "Choose one creature type from allowed list" }
      ],
      formula: "Single creature type selection",
      explanation: "Ranger selects their first favored enemy type"
    }
  },
  
  // Level 5 - New selection + allocation
  level5: {
    value: "Select Creature Type + Allocate Bonus",
    breakdown: {
      components: [
        { source: "Favored Enemy Choice", value: "New Selection", type: 'choice', formula: "Choose one additional creature type" },
        { source: "Favored Enemy Choice", value: "Bonus Allocation", type: 'choice', formula: "Increase bonus to any existing favored enemy" }
      ],
      formula: "New selection OR bonus allocation",
      explanation: "Ranger can select new enemy type or increase existing bonus"
    }
  },
  
  // Level 10 - New selection + allocation
  level10: {
    value: "Select Creature Type + Allocate Bonus",
    breakdown: {
      components: [
        { source: "Favored Enemy Choice", value: "New Selection", type: 'choice', formula: "Choose one additional creature type" },
        { source: "Favored Enemy Choice", value: "Bonus Allocation", type: 'choice', formula: "Increase bonus to any existing favored enemy" }
      ],
      formula: "New selection OR bonus allocation",
      explanation: "Ranger can select new enemy type or increase existing bonus"
    }
  },
  
  // Level 15 - New selection + allocation
  level15: {
    value: "Select Creature Type + Allocate Bonus",
    breakdown: {
      components: [
        { source: "Favored Enemy Choice", value: "New Selection", type: 'choice', formula: "Choose one additional creature type" },
        { source: "Favored Enemy Choice", value: "Bonus Allocation", type: 'choice', formula: "Increase bonus to any existing favored enemy" }
      ],
      formula: "New selection OR bonus allocation",
      explanation: "Ranger can select new enemy type or increase existing bonus"
    }
  },
  
  // Level 20 - New selection + allocation
  level20: {
    value: "Select Creature Type + Allocate Bonus",
    breakdown: {
      components: [
        { source: "Favored Enemy Choice", value: "New Selection", type: 'choice', formula: "Choose one additional creature type" },
        { source: "Favored Enemy Choice", value: "Bonus Allocation", type: 'choice', formula: "Increase bonus to any existing favored enemy" }
      ],
      formula: "New selection OR bonus allocation",
      explanation: "Ranger can select new enemy type or increase existing bonus"
    }
  }
};
```

**Examples**:
- Input: `FeatureChoice` with `behavior: Single` at level 1
- Logic: Process single creature type selection choice
- Output: `value: "Select Creature Type"` with breakdown showing choice description

### Layer 3: Progression Value Generation

**Input**: CalculationResult objects from Layer 2 and choice parameters that define progression patterns
**Logic**: Generate synthetic progression entries for all levels by processing choice objects, and create separate progressions for selection vs allocation choices
**Output**: Arrays of ProgressionValue objects showing complete state at each level

```typescript
// Generate progression values for all levels
const progressionValues = {
  // Level 1 progression
  level1: [
    {
      level: 1,
      value: "Select Creature Type",
      breakdown: choiceCalculations.level1.breakdown,
      choiceType: "single_selection"
    }
  ],
  
  // Level 5 progression
  level5: [
    {
      level: 5,
      value: "Select Creature Type + Allocate Bonus",
      breakdown: choiceCalculations.level5.breakdown,
      choiceType: "dual_choice"
    }
  ],
  
  // Level 10 progression
  level10: [
    {
      level: 10,
      value: "Select Creature Type + Allocate Bonus",
      breakdown: choiceCalculations.level10.breakdown,
      choiceType: "dual_choice"
    }
  ],
  
  // Level 15 progression
  level15: [
    {
      level: 15,
      value: "Select Creature Type + Allocate Bonus",
      breakdown: choiceCalculations.level15.breakdown,
      choiceType: "dual_choice"
    }
  ],
  
  // Level 20 progression
  level20: [
    {
      level: 20,
      value: "Select Creature Type + Allocate Bonus",
      breakdown: choiceCalculations.level20.breakdown,
      choiceType: "dual_choice"
    }
  ]
};
```

### Layer 4: Transition Detection

**Input**: Arrays of ProgressionValue objects from Layer 3 showing complete state at each level
**Logic**: Compare progression values between consecutive levels to identify meaningful changes in choice patterns, and categorize the type of transition
**Output**: Arrays of TransitionPoint objects showing only the levels where significant changes occur

```typescript
// Detect meaningful transitions for choice patterns
const transitions = [
  {
    level: 1,
    value: "Select Creature Type",
    breakdown: choiceCalculations.level1.breakdown,
    changeType: "choice_addition"
  },
  {
    level: 5,
    value: "Select Creature Type + Allocate Bonus",
    breakdown: choiceCalculations.level5.breakdown,
    changeType: "choice_expansion"
  },
  {
    level: 10,
    value: "Select Creature Type + Allocate Bonus",
    breakdown: choiceCalculations.level10.breakdown,
    changeType: "choice_expansion"
  },
  {
    level: 15,
    value: "Select Creature Type + Allocate Bonus",
    breakdown: choiceCalculations.level15.breakdown,
    changeType: "choice_expansion"
  },
  {
    level: 20,
    value: "Select Creature Type + Allocate Bonus",
    breakdown: choiceCalculations.level20.breakdown,
    changeType: "choice_expansion"
  }
];
```

### Layer 5: Multi-Item Grouping

**Input**: Arrays of TransitionPoint objects from Layer 4 showing meaningful changes at each level
**Logic**: Group transitions by choice type, combine multiple choice patterns, and create comprehensive summaries showing the progression of choice complexity
**Output**: GroupedResult objects that organize transitions by choice type and provide both detailed and summary views

```typescript
// Group transitions by choice type and combine related changes
const groupedResult = {
  formattedValue: "Level 1: Select Creature Type; Level 5: Select Creature Type + Allocate Bonus; Level 10: Select Creature Type + Allocate Bonus; Level 15: Select Creature Type + Allocate Bonus; Level 20: Select Creature Type + Allocate Bonus",
  breakdown: {
    components: [
      {
        type: "initial_selection",
        value: "Single Choice",
        formattedValue: "Initial creature type selection"
      },
      {
        type: "progressive_choices",
        value: "Dual Choices",
        formattedValue: "New selection OR bonus allocation"
      }
    ]
  },
  choiceProgressions: {
    single: [transitions[0]], // Level 1
    dual: transitions.slice(1) // Levels 5, 10, 15, 20
  }
};
```

**Examples**:
- Input: Multiple transitions showing choice pattern changes from single to dual choices
- Logic: Group by choice complexity and create summary showing progression pattern
- Output: Organized breakdown showing initial single choice followed by dual choice pattern

### Layer 6: Context-Aware Display Logic

**Input**: GroupedResult objects from Layer 5 and display context (class detail, character sheet, feature edit)
**Logic**: Apply context-specific formatting rules, determine which choice information to show, and structure the output for the specific display scenario
**Output**: DisplayResult objects tailored to the specific context with appropriate formatting and information density

```typescript
// Class detail display (no character context) - show choice progression
const classDetailDisplay = {
  formattedValue: "Level 1: Select Creature Type; Level 5: Select Creature Type + Allocate Bonus; Level 10: Select Creature Type + Allocate Bonus; Level 15: Select Creature Type + Allocate Bonus; Level 20: Select Creature Type + Allocate Bonus",
  breakdown: groupedResult.breakdown,
  showBreakdown: false,
  components: groupedResult.components,
  levelEntries: [
    { level: 1, description: "Select Creature Type" },
    { level: 5, description: "Select Creature Type + Allocate Bonus" },
    { level: 10, description: "Select Creature Type + Allocate Bonus" },
    { level: 15, description: "Select Creature Type + Allocate Bonus" },
    { level: 20, description: "Select Creature Type + Allocate Bonus" }
  ]
};

// Character sheet display (with character context - 8th level Ranger with choices made)
const characterSheetDisplay = {
  formattedValue: "Favored Enemy: Goblinoid (+4), Undead (+2)",
  breakdown: {
    components: [
      { source: "Favored Enemy Calculation", value: "Goblinoid +4", type: 'calculation', formula: "Base +2 + 4 allocations" },
      { source: "Favored Enemy Calculation", value: "Undead +2", type: 'calculation', formula: "Base +2 + 0 allocations" }
    ],
    formula: "Character sheet calculation function result",
    explanation: "Bonuses calculated from character's actual choices"
  },
  showBreakdown: true,
  components: [
    {
      type: "favored_enemy",
      value: "Goblinoid +4, Undead +2",
      formattedValue: "Favored Enemy: Goblinoid (+4), Undead (+2)"
    }
  ]
};

// Feature edit display (grouped by choice progressions)
const featureEditDisplay = {
  formattedValue: "Favored Enemy Progression",
  breakdown: {
    components: [
      { source: "Level 1 Choice", value: "Single Selection", type: 'choice' },
      { source: "Level 5+ Choices", value: "Dual Selection", type: 'choice' }
    ]
  },
  showBreakdown: true,
  components: groupedResult.components,
  choiceProgressions: {
    level1: {
      description: "Level 1: Select one creature type from allowed list",
      type: "single_selection"
    },
    level5: {
      description: "Level 5: Select new creature type OR increase existing bonus",
      type: "dual_choice"
    },
    level10: {
      description: "Level 10: Select new creature type OR increase existing bonus",
      type: "dual_choice"
    },
    level15: {
      description: "Level 15: Select new creature type OR increase existing bonus",
      type: "dual_choice"
    },
    level20: {
      description: "Level 20: Select new creature type OR increase existing bonus",
      type: "dual_choice"
    }
  }
};
```

**Examples**:
- **Class Detail Context**: Show choice progression pattern with each level displayed separately
- **Character Sheet Context**: Show actual character choices and calculated bonuses from separate function
- **Feature Edit Context**: Group by choice progressions with expanded choice details

## Display Examples

### Class Detail Page
```
Level 1
Favored Enemy: Select Creature Type
Level 5
Favored Enemy: Select Creature Type + Allocate Bonus
Level 10
Favored Enemy: Select Creature Type + Allocate Bonus
Level 15
Favored Enemy: Select Creature Type + Allocate Bonus
Level 20
Favored Enemy: Select Creature Type + Allocate Bonus
```

### Character Sheet (8th level Ranger with choices made)
```
Favored Enemy: Goblinoid (+4), Undead (+2)
```

### Feature Edit Page
```
Level 1 (Favored Enemy: Select one creature type from allowed list)
Level 5 (Favored Enemy: Select new creature type OR increase existing bonus)
Level 10 (Favored Enemy: Select new creature type OR increase existing bonus)
Level 15 (Favored Enemy: Select new creature type OR increase existing bonus)
Level 20 (Favored Enemy: Select new creature type OR increase existing bonus)
```

## Key Insights

1. **Choice-Based Progression**: Favored Enemy uses choice system rather than direct modifier modeling
2. **Dual Choice Pattern**: Levels 5+ offer both new selection and bonus allocation options
3. **Character Sheet Integration**: Actual bonuses calculated by separate function using character choices
4. **Progressive Complexity**: Choice pattern evolves from single to dual choices
5. **Context-Dependent Display**: Class detail shows choice patterns, character sheet shows calculated results
6. **Choice Allocation**: Player can choose between new selections or bonus increases
7. **Filtered Options**: Creature type choices filtered by Ranger Favored Enemy list
8. **Progression Grouping**: Feature edit groups by choice progression with expanded details

## Integration with Character Sheet Calculation

The formatter system outputs choice information that feeds into a separate character sheet calculation function:

```typescript
// Character's actual choices (from character data)
const characterChoices = {
  level1: { selectedType: "Goblinoid" },
  level5: { selectedType: "Undead", allocation: "Goblinoid" },
  level10: { allocation: "Goblinoid" },
  level15: { allocation: "Undead" },
  level20: { allocation: "Goblinoid" }
};

// Character sheet calculation function (separate from formatter)
const calculateFavoredEnemyBonuses = (characterChoices) => {
  return {
    "Goblinoid": 6, // Base +2 + 4 allocations
    "Undead": 4     // Base +2 + 2 allocations
  };
};

// Formatter input for character sheet display
const formatterInput = {
  choices: characterChoices,
  calculatedBonuses: calculateFavoredEnemyBonuses(characterChoices)
};
```

This demonstrates how the formatter system handles choice progression while leaving actual bonus calculations to specialized character sheet functions.

# Feature System Overview

*Core concepts and design principles for the D&D Tools feature system.*

## Core Architecture

The feature system provides a comprehensive framework for modeling D&D 3.x class features, racial traits, and character abilities.

### **Key Components**

- **Feature**: Canonical definition (slug, name, description)
- **FeatureProgression**: Level-based grant of a Feature by a source (class, race, template)
- **FeatureModifier**: Numeric bonuses/penalties, quantities, resources
- **FeatureModifierCondition**: Runtime contextual conditions for modifiers
- **FeatureChoice**: Selectable options offered by a progression
- **FeaturePrerequisite**: Gating criteria (e.g., skill ranks), now associated with Feature directly
- **FeatureSpecialEffect**: Non-numeric metadata (proficiencies, favored enemy)

### **Core Architecture**
```
Feature (Definition)
├── FeatureProgression (Level-based grants)
│   ├── FeatureModifier (Numeric bonuses/penalties)
│   │   └── FeatureModifierCondition (Runtime conditions)
│   ├── FeatureChoice (Player selections)
│   └── FeatureSpecialEffect (Non-numeric effects)
└── FeaturePrerequisite (Requirements - at feature level)
```

## Key Principles

### **Bulk Operations Only**
- **No Individual CRUD**: Modifiers, choices, and effects are never modified individually
- **Single API Call**: Complete feature data is sent in one request when creating/updating classes or races
- **Static System**: Features are only manipulated when adding new classes, races, or other game system entities

### **Progression Overwrite Rule**
For a given class and `Feature`, the *active* `FeatureProgression` is the row with the **largest `level` ≤ current class level**. This makes progressions act like versioned milestones: a later progression overwrites earlier values.

### **Schema Simplifications**
- **Removed Redundancy**: Eliminated base/full schema patterns for internal entities
- **Focused Schemas**: Only schemas that are actually used in API calls are maintained
- **Clear Intent**: Schema structure now clearly reflects actual usage patterns

## Usage Patterns

### **Class Creation/Update**
```typescript
// Single API call with complete nested data
const classData = {
    name: "Barbarian",
    hitDie: 12,
    features: [
        {
            sourceType: 1, // Class
            level: 1,
            featureId: 123,
            modifiers: [
                {
                    type: ModifierType.Bonus,
                    appliesTo: ModifierAppliesToType.Attribute,
                    appliesToId: ABILITY_MAP.STR,
                    value: 4,
                    bonusType: FeatureBonusType.Morale,
                    conditions: [{ type: 'trigger', value: 'rage_active' }]
                }
            ],
            choices: [],
            effects: []
        }
    ]
};

await ClassService.createClass(classData);
```

### **Class Display**
```typescript
// Backend returns fully nested class with all feature progressions
const class = await ClassService.getClassById(undefined, { id: 123 });
// class.features contains complete FeatureProgression objects
```

## Component Selection

### **When to Use Each Component**

| Feature Type | Primary Component | Example |
|--------------|-------------------|---------|
| **Numeric Bonus** | FeatureModifier | Barbarian Rage STR bonus |
| **Player Choice** | FeatureChoice | Fighter Bonus Feat |
| **Special Ability** | FeatureSpecialEffect | Uncanny Dodge |
| **Prerequisite** | FeaturePrerequisite | Skill Focus requirements |
| **Class Skills** | FeatureModifier (Container) | Fighter class skills |
| **Languages** | FeatureModifier (Container) | Elf automatic/bonus languages |

**Note**: Class skills use a special container pattern with `SpecialFeatureId.ClassSkill`. Languages use similar patterns with `FeatureAppliesToType.Language`. See **[class-skills.md](class-skills.md)** and **[languages.md](languages.md)** for details.

### **Quick Decision Tree**
1. **Is it a number?** → Use FeatureModifier
2. **Does the player choose?** → Use FeatureChoice
3. **Is it a special ability?** → Use FeatureSpecialEffect
4. **Is it a requirement?** → Use FeaturePrerequisite
5. **Is it a class skill?** → Use FeatureModifier (container pattern)
6. **Is it a language?** → Use FeatureModifier (container pattern)
7. **Is it complex?** → Combine multiple components

## Key Capabilities

- ✅ **Complete bonus type system** matching D&D 3.x stacking rules
- ✅ **Conditional modifiers** with runtime token evaluation
- ✅ **Flexible choice system** (single/multiple/allocation)
- ✅ **Level-based progression** with automatic upgrades
- ✅ **Spellcasting integration** with slot management
- ✅ **Prerequisite validation** with extensible types

## System Status

- **Current Coverage**: 85% of D&D 3.x features
- **Target Coverage**: 95%+ with planned enhancements
- **Schema Status**: Simplified and optimized
- **API Status**: Bulk operations only, no individual CRUD

## Next Steps

1. **Review [schema-reference.md](schema-reference.md)** for database structure
2. **Study [class-features.md](class-features.md)** for practical implementations
3. **Use [component-selection.md](component-selection.md)** for decision making
4. **Follow [bulk-operations.md](bulk-operations.md)** for API usage

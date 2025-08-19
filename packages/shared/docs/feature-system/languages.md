# Language Implementation

*Complete guide to how automatic and bonus languages are modeled and implemented in the feature system.*

## Overview

Languages in the D&D Tools system are implemented using the **Feature System** with a simplified pattern. Languages are identified by their `ModifierAppliesToType` and distinguished by whether they are `BonusLanguage` (require INT modifier) or `AutomaticLanguage` (granted automatically). The system uses **no special conditions or choice keys** - language selection is handled entirely by the character creation/leveling UI logic.

## Database Schema Structure

### **Core Entities**

1. **`Feature`** - The base feature definition
   ```sql
   -- Features for language grants
   -- Examples: "Automatic Languages", "Bonus Languages"
   ```

2. **`FeatureProgression`** - Links the feature to a specific race or class
   ```sql
   -- Language progression for a race or class
   featureId: SpecialFeatureId.AutomaticLanguage (3) or any unique ID for bonus languages
   raceId/classId: The race or class that gets these languages
   level: 1 (languages are level 1 features)
   sourceType: 2 (Race) or 1 (Class)
   appliesToType: FeatureAppliesToType.Language (2)
   appliesTo: null (container progression)
   ```

3. **`FeatureModifier`** - Individual language grants within the language feature
   ```sql
   -- Each language is a modifier
   featureProgressionId: Links to the FeatureProgression
   type: ModifierType.Other (not a bonus, just granting language)
   appliesTo: ModifierAppliesToType.BonusLanguage (14) or ModifierAppliesToType.AutomaticLanguage (15)
   appliesToId: The specific language ID
   value: 0 (no bonus value - just granting language)
   bonusType: null
   -- No conditions or choice keys needed
   ```

## Language Types

### **Automatic Languages**

Automatic languages are **unconditional grants** that every character knows by default. Identified by `ModifierAppliesToType.AutomaticLanguage`.

**Example**: Elves automatically know *Common* and *Elven*.

```typescript
// Automatic languages for Elves
{
    sourceType: 2, // Race
    level: 1,
    featureId: SpecialFeatureId.AutomaticLanguage, // 3
    appliesToType: FeatureAppliesToType.Language,
    appliesTo: null,
    modifiers: [
        {
            type: ModifierType.Other,
            appliesTo: ModifierAppliesToType.AutomaticLanguage, // 15
            appliesToId: LANGUAGE_MAP.COMMON,
            value: 0, // No bonus, just granting language
            bonusType: null
        },
        {
            type: ModifierType.Other,
            appliesTo: ModifierAppliesToType.AutomaticLanguage, // 15
            appliesToId: LANGUAGE_MAP.ELVEN,
            value: 0,
            bonusType: null
        }
    ],
    choices: [],
    effects: []
}
```

### **Bonus Languages**

Bonus languages are **available for selection** based on Intelligence modifier. The number of bonus languages available depends on the character's INT modifier. Identified by `ModifierAppliesToType.BonusLanguage`.

**Example**: Elves can choose from Draconic, Gnoll, Gnome, Goblin, Orc, Sylvan as bonus languages.

```typescript
// Bonus languages for Elves
{
    sourceType: 2, // Race
    level: 1,
    featureId: SpecialFeatureId.BonusLanguage, // 4
    appliesToType: FeatureAppliesToType.Language,
    appliesTo: null,
    modifiers: [
        {
            type: ModifierType.Other,
            appliesTo: ModifierAppliesToType.BonusLanguage, // 14
            appliesToId: LANGUAGE_MAP.DRACONIC,
            value: 0,
            bonusType: null
        },
        {
            type: ModifierType.Other,
            appliesTo: ModifierAppliesToType.BonusLanguage, // 14
            appliesToId: LANGUAGE_MAP.GNOLL,
            value: 0,
            bonusType: null
        }
        // ... additional bonus languages
    ],
    choices: [],
    effects: []
}
```

### **Class-Granted Languages**

Classes can **grant** both automatic and bonus languages. Class language features are identified by their `sourceType: 1 (Class)` and `appliesToType: FeatureAppliesToType.Language`.

**Example**: Clerics can choose from Celestial, Abyssal, and Infernal as additional bonus languages.

```typescript
// Class-granted bonus languages for Clerics
{
    sourceType: 1, // Class
    level: 1,
    featureId: 123, // Any unique feature ID for this class feature
    appliesToType: FeatureAppliesToType.Language,
    appliesTo: null,
    modifiers: [
        {
            type: ModifierType.Other,
            appliesTo: ModifierAppliesToType.BonusLanguage, // 14
            appliesToId: LANGUAGE_MAP.CELESTIAL,
            value: 0,
            bonusType: null
        },
        {
            type: ModifierType.Other,
            appliesTo: ModifierAppliesToType.BonusLanguage, // 14
            appliesToId: LANGUAGE_MAP.ABYSSAL,
            value: 0,
            bonusType: null
        },
        {
            type: ModifierType.Other,
            appliesTo: ModifierAppliesToType.BonusLanguage, // 14
            appliesToId: LANGUAGE_MAP.INFERNAL,
            value: 0,
            bonusType: null
        }
    ],
    choices: [],
    effects: []
}
```

**Example**: Druids automatically know Druidic as an automatic language.

```typescript
// Class-granted automatic language for Druids
{
    sourceType: 1, // Class
    level: 1,
    featureId: 124, // Any unique feature ID for this class feature
    appliesToType: FeatureAppliesToType.Language,
    appliesTo: null,
    modifiers: [
        {
            type: ModifierType.Other,
            appliesTo: ModifierAppliesToType.AutomaticLanguage, // 15
            appliesToId: LANGUAGE_MAP.DRUIDIC,
            value: 0,
            bonusType: null
        }
    ],
    choices: [],
    effects: []
}
```

## Frontend Implementation

### **LanguageService**

Similar to `ClassSkillService`, a `LanguageService` would provide functions for managing languages:

#### **1. getAutomaticLanguages() - Extract automatic languages**
```typescript
getAutomaticLanguages(progressions: FeatureProgressionWithRelations[]): number[] {
    return progressions
        .flatMap(prog =>
            prog.modifiers
                ?.filter(mod => mod.appliesTo === ModifierAppliesToType.AutomaticLanguage && mod.appliesToId)
                .map(mod => mod.appliesToId) || []
        )
        .filter(id => id > 0);
}
```

#### **2. getBonusLanguages() - Extract available bonus languages**
```typescript
getBonusLanguages(progressions: FeatureProgressionWithRelations[]): number[] {
    return progressions
        .flatMap(prog =>
            prog.modifiers
                ?.filter(mod =>
                    mod.appliesTo === ModifierAppliesToType.BonusLanguage &&
                    mod.appliesToId
                )
                .map(mod => mod.appliesToId) || []
        )
        .filter(id => id > 0);
}
```

#### **3. getClassBonusLanguages() - Extract class-granted bonus languages**
```typescript
getClassBonusLanguages(progressions: FeatureProgressionWithRelations[]): number[] {
    return progressions
        .filter(prog => this.isClassBonusLanguageFeature(prog))
        .flatMap(prog =>
            prog.modifiers
                ?.filter(mod =>
                    mod.appliesTo === ModifierAppliesToType.BonusLanguage &&
                    mod.appliesToId
                )
                .map(mod => mod.appliesToId) || []
        )
        .filter(id => id > 0);
}
```

#### **4. getClassAutomaticLanguages() - Extract class-granted automatic languages**
```typescript
getClassAutomaticLanguages(progressions: FeatureProgressionWithRelations[]): number[] {
    return progressions
        .filter(prog => this.isClassLanguageFeature(prog))
        .flatMap(prog =>
            prog.modifiers
                ?.filter(mod =>
                    mod.appliesTo === ModifierAppliesToType.AutomaticLanguage &&
                    mod.appliesToId
                )
                .map(mod => mod.appliesToId) || []
        )
        .filter(id => id > 0);
}
```

#### **5. isClassLanguageFeature() - Identify class language features**
```typescript
isClassLanguageFeature(progression: FeatureProgressionWithRelations): boolean {
    return progression.sourceType === FeatureSourceType.Class &&
           progression.appliesToType === FeatureAppliesToType.Language;
}
```

#### **6. isClassBonusLanguageFeature() - Identify class bonus language features**
```typescript
isClassBonusLanguageFeature(progression: FeatureProgressionWithRelations): boolean {
    return this.isClassLanguageFeature(progression) &&
           progression.modifiers?.some(mod => mod.appliesTo === ModifierAppliesToType.BonusLanguage);
}
```

## Backend Processing

### **Race Service Integration**

The `raceService` handles languages as part of the bulk feature operations:

1. **Creating/Updating Races**: Languages are included in the `features` array
2. **Database Storage**: Creates appropriate `FeatureProgression` and `FeatureModifier` records
3. **No Individual CRUD**: Languages cannot be modified individually

### **Example Backend Data Structure**

```typescript
// FeatureProgression for automatic languages
{
    id: 123,
    featureId: SpecialFeatureId.AutomaticLanguage, // 3
    raceId: 2, // Elf race
    level: 1,
    appliesToType: FeatureAppliesToType.Language,
    appliesTo: null,
    modifiers: [
        {
            id: 456,
            type: ModifierType.Other,
            appliesTo: ModifierAppliesToType.Language, // 14
            appliesToId: LANGUAGE_MAP.COMMON,
            value: 0,
            bonusType: null
        },
        {
            id: 457,
            type: ModifierType.Other,
            appliesTo: ModifierAppliesToType.Language, // 14
            appliesToId: LANGUAGE_MAP.ELVEN,
            value: 0,
            bonusType: null
        }
    ]
}
```

## Frontend UI Integration

### **Character Creation**

The character creation process would handle languages:

```typescript
// Get automatic languages for selected race
const automaticLanguages = LanguageService.getAutomaticLanguages(
    selectedRace.features
);

// Get available bonus languages
const bonusLanguages = LanguageService.getBonusLanguages(
    selectedRace.features,
    intModifier
);

// Get class-granted bonus languages
const classBonusLanguages = LanguageService.getClassBonusLanguages(
    selectedClass.features,
    intModifier
);

// Combine racial and class bonus languages
const allBonusLanguages = [...bonusLanguages, ...classBonusLanguages];

// Get bonus language choice configuration
const bonusLanguageChoices = LanguageService.getBonusLanguageChoices(
    selectedRace.features
);

// Calculate number of bonus language choices based on INT modifier
const intModifier = Math.floor((character.intelligence - 10) / 2);
const maxBonusLanguages = Math.max(0, intModifier);
```

### **Language Selection UI**

```typescript
// Display automatic languages
<div className="automatic-languages">
    <h3>Automatic Languages</h3>
    {automaticLanguages.map(languageId => (
        <span key={languageId} className="language-tag">
            {LANGUAGE_MAP[languageId].name}
        </span>
    ))}
</div>

// Display bonus language selection
{maxBonusLanguages > 0 && (
    <div className="bonus-languages">
        <h3>Bonus Languages (Choose {maxBonusLanguages})</h3>
        <CustomSelect
            multiple
            maxSelections={maxBonusLanguages}
            options={allBonusLanguages.map(langId => ({
                value: langId,
                label: LANGUAGE_MAP[langId].name
            }))}
            onValueChange={handleBonusLanguageSelection}
        />
    </div>
)}
```

## Key Design Principles

### **1. Container Pattern**
- One `FeatureProgression` contains multiple `FeatureModifier` records for languages
- Each modifier represents a different language
- The progression acts as a container for all languages of a type

### **2. Conditional Application**
- Automatic languages have no conditions
- Bonus languages have conditions based on INT modifier
- Conditions are evaluated at runtime during character creation

### **3. Choice Integration**
- Bonus languages use `FeatureChoice` for player selection
- Choice quantity is dynamic based on INT modifier
- UI can present proper selection widgets
- Class-granted languages expand existing racial choices via `appliesIfChoiceKey`

### **4. Class-Granted Language Expansion**
- Classes can add languages to the racial bonus language system
- Uses `appliesIfChoiceKey: "bonus_languages"` to link to racial choices
- Multiple classes can contribute to the same language pool
- Composable - each class adds its languages to the available options
- **No hardcoded feature IDs** - identified by `appliesIfChoiceKey` value

### **5. Bulk Operations Only**
- Languages are only modified as part of race/class creation/update
- No individual CRUD operations on languages
- Maintains consistency with the broader feature system

## Usage Examples

### **Creating an Elf Race with Languages**

```typescript
const elfRace = {
    name: "Elf",
    features: [
        // Automatic languages
        {
            sourceType: 2, // Race
            level: 1,
            featureId: SpecialFeatureId.AutomaticLanguage, // 3
            appliesToType: FeatureAppliesToType.Language,
            appliesTo: null,
            modifiers: [
                {
                    type: ModifierType.Other,
                    appliesTo: ModifierAppliesToType.Language, // 14
                    appliesToId: LANGUAGE_MAP.COMMON,
                    value: 0,
                    bonusType: null
                },
                {
                    type: ModifierType.Other,
                    appliesTo: ModifierAppliesToType.Language, // 14
                    appliesToId: LANGUAGE_MAP.ELVEN,
                    value: 0,
                    bonusType: null
                }
            ],
            choices: [],
            effects: []
        },
        // Bonus languages
        {
            sourceType: 2, // Race
            level: 1,
            featureId: SpecialFeatureId.BonusLanguage, // 4
            appliesToType: FeatureAppliesToType.Language,
            appliesTo: null,
            modifiers: [
                {
                    type: ModifierType.Other,
                    appliesTo: ModifierAppliesToType.Language, // 14
                    appliesToId: LANGUAGE_MAP.DRACONIC,
                    value: 0,
                    bonusType: null,
                    conditions: [
                        {
                            type: FeatureModifierConditionType.other,
                            value: 'int_modifier_greater_than_0'
                        }
                    ]
                }
                // ... additional bonus languages
            ],
            choices: [
                {
                    choiceType: ChoiceType.Feature,
                    choiceBehavior: ChoiceBehavior.Multiple,
                    appliesToType: FeatureAppliesToType.Language,
                    label: "Choose bonus languages based on INT modifier"
                }
            ],
            effects: []
        }
    ]
};

await RaceService.createRace(elfRace);
```

### **Creating a Cleric Class with Bonus Languages**

```typescript
const clericClass = {
    name: "Cleric",
    hitDie: 8,
    skillPoints: 2,
    features: [
        // Class-granted bonus languages
        {
            sourceType: 1, // Class
            level: 1,
            featureId: 123, // Any unique feature ID for this class feature
            appliesToType: FeatureAppliesToType.Language,
            appliesTo: null,
            modifiers: [
                {
                    type: ModifierType.Other,
                    appliesTo: ModifierAppliesToType.Language, // 14
                    appliesToId: LANGUAGE_MAP.CELESTIAL,
                    value: 0,
                    bonusType: null,
                    appliesIfChoiceKey: "bonus_languages", // Links to racial bonus languages
                    appliesIfChoiceValue: null, // Applies regardless of existing choice
                    conditions: [
                        {
                            type: FeatureModifierConditionType.other,
                            value: 'int_modifier_greater_than_0'
                        }
                    ]
                },
                {
                    type: ModifierType.Other,
                    appliesTo: ModifierAppliesToType.Language, // 14
                    appliesToId: LANGUAGE_MAP.ABYSSAL,
                    value: 0,
                    bonusType: null,
                    appliesIfChoiceKey: "bonus_languages",
                    appliesIfChoiceValue: null,
                    conditions: [
                        {
                            type: FeatureModifierConditionType.other,
                            value: 'int_modifier_greater_than_0'
                        }
                    ]
                },
                {
                    type: ModifierType.Other,
                    appliesTo: ModifierAppliesToType.Language, // 14
                    appliesToId: LANGUAGE_MAP.INFERNAL,
                    value: 0,
                    bonusType: null,
                    appliesIfChoiceKey: "bonus_languages",
                    appliesIfChoiceValue: null,
                    conditions: [
                        {
                            type: FeatureModifierConditionType.other,
                            value: 'int_modifier_greater_than_0'
                        }
                    ]
                }
            ],
            choices: [], // No new choices - expands existing racial choices
            effects: []
        }
        // ... other cleric features
    ]
};

await ClassService.createClass(clericClass);
```

## Benefits of This Approach

1. **Data-Driven**: Language lists are stored in the database, not hardcoded
2. **Reusable**: Same patterns can be used for class features, feats, or magic items that grant languages
3. **UI-Friendly**: Clear schema lets UI render proper selection widgets
4. **Conditional**: Supports INT modifier requirements for bonus languages
5. **Extensible**: Easy to add new languages or modify existing ones
6. **Composable**: Multiple classes can contribute to the same language pool
7. **Additive**: Class-granted languages expand rather than replace racial options
8. **Flexible**: Class bonus language features use any feature ID, identified by `appliesIfChoiceKey`

## Common Patterns

### **Filtering Languages**
```typescript
// Get all automatic language progressions
const automaticLanguageProgressions = progressions.filter(prog =>
    prog.featureId === SpecialFeatureId.AutomaticLanguage &&
    prog.appliesToType === FeatureAppliesToType.Language
);

// Get language IDs from modifiers
const languageIds = automaticLanguageProgressions.flatMap(prog =>
    prog.modifiers
        ?.filter(mod => mod.appliesTo === ModifierAppliesToType.Language && mod.appliesToId)
        .map(mod => mod.appliesToId) || []
);
```

### **Checking Language Availability**
```typescript
const isLanguageAvailable = (languageId: number, intModifier: number): boolean => {
    return progressions.some(prog =>
        prog.modifiers?.some(mod =>
            mod.appliesTo === ModifierAppliesToType.Language &&
            mod.appliesToId === languageId &&
            evaluateConditions(mod.conditions, { intModifier })
        )
    );
};
```

### **Getting Combined Bonus Languages**
```typescript
const getCombinedBonusLanguages = (
    raceProgressions: FeatureProgressionWithRelations[],
    classProgressions: FeatureProgressionWithRelations[]
): number[] => {
    // Get racial bonus languages
    const racialLanguages = LanguageService.getBonusLanguages(raceProgressions);
    
    // Get class-granted bonus languages
    const classLanguages = LanguageService.getClassBonusLanguages(classProgressions);
    
    // Combine all languages (duplicates are automatically handled)
    const allLanguages = [...racialLanguages, ...classLanguages];
    
    // Remove duplicates
    return [...new Set(allLanguages)];
};
```

## How Multiple Classes Work Together

### **Composable Language Expansion**

The system supports multiple classes contributing to the same bonus language pool. For example:

- **Elf Race**: Draconic, Gnoll, Gnome, Goblin, Orc, Sylvan
- **Cleric Class**: + Celestial, Abyssal, Infernal
- **Druid Class**: + Druidic
- **Wizard Class**: + Draconic (already available from race)

The final available bonus languages become: **Draconic, Gnoll, Gnome, Goblin, Orc, Sylvan, Celestial, Abyssal, Infernal, Druidic**

### **Implementation Details**

1. **Race Defines Base**: The race provides the initial bonus language list and choice structure
2. **Classes Expand**: Each class adds its languages to the pool via `appliesIfChoiceKey: "bonus_languages"`
3. **UI Combines**: The character creation UI combines all available languages into a single selection list
4. **Rules Engine**: The rules engine evaluates all conditions and presents the combined options

### **Example: Elf Cleric Wizard**

```typescript
// Character creation process
const elfRace = await RaceService.getRaceById(ELF_RACE_ID);
const clericClass = await ClassService.getClassById(CLERIC_CLASS_ID);
const wizardClass = await ClassService.getClassById(WIZARD_CLASS_ID);

// Get all bonus languages
const racialBonusLanguages = LanguageService.getBonusLanguages(elfRace.features);
const clericBonusLanguages = LanguageService.getClassBonusLanguages(clericClass.features);
const wizardBonusLanguages = LanguageService.getClassBonusLanguages(wizardClass.features);

// Combine all languages (duplicates are automatically handled)
const allBonusLanguages = [
    ...racialBonusLanguages,
    ...clericBonusLanguages,
    ...wizardBonusLanguages
];

// Remove duplicates
const uniqueBonusLanguages = [...new Set(allBonusLanguages)];

// Present to user: "Choose up to [INT modifier] bonus languages from:"
// Draconic, Gnoll, Gnome, Goblin, Orc, Sylvan, Celestial, Abyssal, Infernal, Druidic
```

### **Why This Works Well**

1. **Additive**: Each class adds its languages without replacing existing ones
2. **Composable**: Multiple classes can contribute to the same pool
3. **Consistent**: Uses the same `appliesIfChoiceKey` mechanism for all expansions
4. **Flexible**: Easy to add new classes with language expansions
5. **Maintainable**: Clear separation between race base and class expansions
6. **No Hardcoded IDs**: Class bonus language features use any feature ID, identified by `appliesIfChoiceKey`

For more details on the feature system, see **[overview.md](overview.md)** and **[component-selection.md](component-selection.md)**.

# Bulk Operations Guide

*Creating, updating, and reading class/race data with features using bulk operations.*

## Core Principle: Bulk Operations Only

The feature system is designed for **bulk operations only**. All feature data (modifiers, choices, effects) is sent in single API calls when creating or updating classes or races. Individual CRUD operations on sub-entities are not supported.

## Creating a Class with Features

### **Complete Class Creation**
```typescript
const classData = {
    name: "Fighter",
    hitDie: 10,
    skillPoints: 4,
    features: [
        // Class skills (special container pattern)
        {
            sourceType: 1, // Class
            level: 1,
            featureId: SpecialFeatureId.ClassSkill,
            appliesToType: FeatureAppliesToType.Skill,
            appliesTo: null,
            modifiers: [
                {
                    type: ModifierType.Other,
                    appliesTo: ModifierAppliesToType.Skill,
                    appliesToId: SKILL_MAP.CLIMB,
                    value: 0 // No bonus, just marking as class skill
                },
                {
                    type: ModifierType.Other,
                    appliesTo: ModifierAppliesToType.Skill,
                    appliesToId: SKILL_MAP.JUMP,
                    value: 0
                }
            ],
            choices: [],
            effects: []
        },
        // Fighter bonus feat
        {
            sourceType: 1, // Class
            level: 1,
            featureId: FIGHTER_BONUS_FEAT_FEATURE_ID,
            modifiers: [],
            choices: [
                {
                    choiceType: ChoiceType.Feat,
                    choiceBehavior: ChoiceBehavior.Single,
                    label: "Choose a fighter bonus feat"
                }
            ],
            effects: []
        },
        // Weapon specialization
        {
            sourceType: 1, // Class
            level: 4,
            featureId: WEAPON_SPECIALIZATION_FEATURE_ID,
            modifiers: [
                {
                    type: ModifierType.Bonus,
                    appliesTo: ModifierAppliesToType.Damage,
                    value: 2,
                    bonusType: FeatureBonusType.Other,
                    appliesIfChoiceKey: "weapon_specialization",
                    conditions: [{ type: 'other', value: 'using_chosen_weapon' }]
                }
            ],
            choices: [
                {
                    choiceType: ChoiceType.Feature,
                    choiceBehavior: ChoiceBehavior.Single,
                    appliesToType: FeatureAppliesToType.Item,
                    label: "Choose weapon for specialization"
                }
            ],
            effects: []
        }
    ]
};

await ClassService.createClass(classData);
```

### **Barbarian with Rage**
```typescript
const barbarianClass = {
    name: "Barbarian",
    hitDie: 12,
    features: [
        {
            sourceType: 1, // Class
            level: 1,
            featureId: BARBARIAN_RAGE_FEATURE_ID,
            modifiers: [
                {
                    type: ModifierType.Bonus,
                    appliesTo: ModifierAppliesToType.Attribute,
                    appliesToId: ABILITY_MAP.STR,
                    value: 4,
                    bonusType: FeatureBonusType.Morale,
                    conditions: [{ type: 'trigger', value: 'rage_active' }]
                },
                {
                    type: ModifierType.Uses,
                    value: 1,
                    bonusType: FeatureBonusType.Other
                }
            ],
            choices: [],
            effects: []
        }
    ]
};

await ClassService.createClass(barbarianClass);
```

## Updating a Class with Features

### **Complete Class Update**
```typescript
// Same pattern as creation - complete replacement of feature data
const updatedClassData = {
    id: 123,
    name: "Fighter",
    hitDie: 10,
    skillPoints: 4,
    features: [
        // Complete feature progression data
        {
            sourceType: 1,
            level: 1,
            featureId: FIGHTER_BONUS_FEAT_FEATURE_ID,
            modifiers: [],
            choices: [
                {
                    choiceType: ChoiceType.Feat,
                    choiceBehavior: ChoiceBehavior.Single,
                    label: "Choose a fighter bonus feat"
                }
            ],
            effects: []
        }
        // ... all other features
    ]
};

await ClassService.updateClass(updatedClassData, { id: 123 });
```

### **Important: Complete Replacement**
- **All existing features are deleted** and replaced
- **No partial updates** - send complete feature data
- **Backend handles cleanup** of old feature data
- **Atomic operation** - all or nothing

## Reading Class Data

### **Get Complete Class with Features**
```typescript
// Backend returns complete nested data
const class = await ClassService.getClassById(undefined, { id: 123 });

// class.features contains complete FeatureProgression objects
// Each progression includes modifiers, choices, effects, and conditions
console.log(class.features[0].modifiers); // Array of modifiers
console.log(class.features[0].choices);   // Array of choices
console.log(class.features[0].effects);   // Array of effects
```

### **Get All Classes**
```typescript
const classes = await ClassService.getAllClasses();

// Each class includes complete feature data
classes.forEach(cls => {
    console.log(`${cls.name}: ${cls.features?.length || 0} features`);
});
```

## Creating a Race with Features

### **Complete Race Creation**
```typescript
const dwarfRace = {
    name: "Dwarf",
    features: [
        {
            sourceType: 2, // Race
            level: 1,
            featureId: DWARF_TRAITS_FEATURE_ID,
            modifiers: [
                {
                    type: ModifierType.Bonus,
                    appliesTo: ModifierAppliesToType.Attribute,
                    appliesToId: ABILITY_MAP.CON,
                    value: 2,
                    bonusType: FeatureBonusType.Racial
                },
                {
                    type: ModifierType.Bonus,
                    appliesTo: ModifierAppliesToType.Attribute,
                    appliesToId: ABILITY_MAP.CHA,
                    value: -2,
                    bonusType: FeatureBonusType.Racial
                }
            ],
            choices: [],
            effects: [
                {
                    effectType: FeatureSpecialEffectType.Proficiency,
                    featId: WEAPON_ID.DWARVEN_WARAXE,
                    description: "Proficient with dwarven waraxe"
                }
            ]
        }
    ]
};

await RaceService.createRace(dwarfRace);
```

## Frontend Integration

### **Class Edit Component**
```typescript
// Prepare the complete class data including feature progressions
const classData = {
    ...formData,
    features: featureProgressions.map(prog => {
        const { id: _, ...progressionData } = prog;
        return {
            ...progressionData,
            // Remove temporary IDs from related entities
            modifiers: prog.modifiers?.map(mod => {
                const { id: _, featureProgressionId: __, ...modData } = mod;
                return modData;
            }) || [],
            choices: prog.choices?.map(choice => {
                const { id: _, progressionId: __, ...choiceData } = choice;
                return choiceData;
            }) || [],
            effects: prog.effects?.map(effect => {
                const { id: _, progressionId: __, ...effectData } = effect;
                return effectData;
            }) || [],
        };
    })
};

// Send complete data to backend
await ClassService.createClass(classData);
```

## Error Handling

### **Validation Errors**
```typescript
try {
    await ClassService.createClass(classData);
} catch (error) {
    if (error.validationErrors) {
        // Handle schema validation errors
        error.validationErrors.forEach(err => {
            console.error(`Validation error: ${err.path} - ${err.message}`);
        });
    } else {
        // Handle other errors
        console.error('Failed to create class:', error.message);
    }
}
```

## Key Patterns

1. **Complete Data**: Send full nested feature data
2. **No Individual CRUD**: Don't try to update individual modifiers/choices/effects
3. **Atomic Operations**: All features are created/updated together
4. **Backend Cleanup**: Backend handles deletion of old data
5. **Validation**: Use Zod schemas for validation
6. **Error Handling**: Handle validation and other errors gracefully
7. **Class Skills**: Use special container pattern with `SpecialFeatureId.ClassSkill`

## Best Practices

1. **Prepare complete data** before sending to backend
2. **Remove temporary IDs** from nested entities
3. **Validate data** before sending
4. **Handle errors** appropriately
5. **Cache results** when reading data
6. **Document complex features** clearly

For more details, see **[class-features.md](class-features.md)**, **[class-skills.md](class-skills.md)**, and **[racial-features.md](racial-features.md)**.

# Bulk Operations Guide

*Creating, updating, and reading class/race data with features using both individual and bulk operations.*

## Core Principle: Flexible Operations

The feature system supports both **individual CRUD operations** for standalone features and **bulk operations** for class/race feature progressions. The system is designed to handle both patterns efficiently.

## Individual Feature Operations

### **Creating Standalone Features**
```typescript
// Create a new feature with prerequisites
const featureData = {
    name: "Weapon Focus",
    slug: "weapon-focus",
    description: "Provides +1 bonus to attack rolls with a specific weapon",
    prerequisites: [
        {
            type: FeaturePrerequisiteType.Feat,
            minValue: 1 // Requires at least 1 feat
        }
    ]
};

const result = await FeatureSystemApi.createFeature(featureData);
console.log(`Created feature with ID: ${result.id}`);
```

### **Updating Standalone Features**
```typescript
// Update an existing feature
const updatedFeature = {
    name: "Weapon Focus (Longsword)",
    description: "Provides +1 bonus to attack rolls with longsword",
    prerequisites: []
};

await FeatureSystemApi.updateFeature(featureId, updatedFeature);
```

### **Reading Standalone Features**
```typescript
// Get all features
const features = await FeatureSystemApi.getAllFeatures();

// Get features by source type (0=class, 1=race)
const classFeatures = await FeatureSystemApi.getAllFeatures(0);
const raceFeatures = await FeatureSystemApi.getAllFeatures(1);

// Get specific feature
const feature = await FeatureSystemApi.getFeatureById(featureId);
```

## Bulk Operations for Class/Race Features

### **Creating a Class with Features**
```typescript
const classData = {
    name: "Fighter",
    hitDie: 10,
    skillPoints: 4,
    features: [
        // Class skills (special container pattern)
        {
            sourceType: 0, // Class
            level: 1,
            featureId: SpecialFeatureId.ClassSkill,
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
            sourceType: 0, // Class
            level: 1,
            featureId: FIGHTER_BONUS_FEAT_FEATURE_ID,
            modifiers: [],
            choices: [
                {
                    type: ChoiceType.Feat,
                    behavior: ChoiceBehavior.Single,
                    label: "Choose a fighter bonus feat",
                    filterType: FeatureFeatChoiceFilter.FighterBonus
                }
            ],
            effects: []
        },
        // Weapon specialization
        {
            sourceType: 0, // Class
            level: 4,
            featureId: WEAPON_SPECIALIZATION_FEATURE_ID,
            modifiers: [
                {
                    type: ModifierType.Bonus,
                    appliesTo: ModifierAppliesToType.Damage,
                    value: 2,
                    bonusType: FeatureBonusType.Feat
                }
            ],
            choices: [
                {
                    type: ChoiceType.Feature,
                    behavior: ChoiceBehavior.Single,
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
            sourceType: 0, // Class
            level: 1,
            featureId: BARBARIAN_RAGE_FEATURE_ID,
            modifiers: [
                {
                    type: ModifierType.Bonus,
                    appliesTo: ModifierAppliesToType.Attribute,
                    appliesToId: ABILITY_MAP.STR,
                    value: 4,
                    bonusType: FeatureBonusType.Morale
                },
                {
                    type: ModifierType.Quantity,
                    appliesTo: ModifierAppliesToType.Uses,
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

## Updating Class/Race Features

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
            sourceType: 0,
            level: 1,
            featureId: FIGHTER_BONUS_FEAT_FEATURE_ID,
            modifiers: [],
            choices: [
                {
                    type: ChoiceType.Feat,
                    behavior: ChoiceBehavior.Single,
                    label: "Choose a fighter bonus feat",
                    filterType: FeatureFeatChoiceFilter.FighterBonus
                }
            ],
            effects: []
        }
        // ... all other features
    ]
};

await ClassService.updateClass(updatedClassData, { id: 123 });
```

### **Important: Complete Replacement for Bulk Operations**
- **All existing features are deleted** and replaced
- **No partial updates** - send complete feature data
- **Backend handles cleanup** of old feature data
- **Atomic operation** - all or nothing

## Reading Class/Race Data

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
            sourceType: 1, // Race
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
                    featId: WEAPON_ID.DWARVEN_WARAXE
                }
            ]
        }
    ]
};

await RaceService.createRace(dwarfRace);
```

## Frontend Integration

### **Feature Edit Component**
```typescript
// For standalone feature editing
const handleSave = async () => {
    try {
        if (isNewFeature) {
            await FeatureSystemApi.createFeature(formData);
        } else {
            await FeatureSystemApi.updateFeature(featureId, formData);
        }
        // Handle success
    } catch (error) {
        // Handle error
    }
};
```

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
    await FeatureSystemApi.createFeature(featureData);
} catch (error) {
    if (error.validationErrors) {
        // Handle schema validation errors
        error.validationErrors.forEach(err => {
            console.error(`Validation error: ${err.path} - ${err.message}`);
        });
    } else {
        // Handle other errors
        console.error('Failed to create feature:', error.message);
    }
}
```

### **Bulk Operation Errors**
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

1. **Individual Operations**: Use for standalone feature management
2. **Bulk Operations**: Use for class/race feature progressions
3. **Complete Data**: Send full nested feature data for bulk operations
4. **Atomic Operations**: All features are created/updated together in bulk operations
5. **Backend Cleanup**: Backend handles deletion of old data in bulk operations
6. **Validation**: Use Zod schemas for validation
7. **Error Handling**: Handle validation and other errors gracefully
8. **Class Skills**: Use special container pattern with `SpecialFeatureId.ClassSkill`

## Best Practices

1. **Choose the right operation type**: Individual for standalone features, bulk for class/race features
2. **Prepare complete data** before sending to backend for bulk operations
3. **Remove temporary IDs** from nested entities
4. **Validate data** before sending
5. **Handle errors** appropriately
6. **Cache results** when reading data
7. **Document complex features** clearly

For more details, see **[class-features.md](class-features.md)**, **[class-skills.md](class-skills.md)**, and **[racial-features.md](racial-features.md)**.

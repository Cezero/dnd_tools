# Class Feature Examples

*Complete examples for implementing D&D class features using the feature system.*

## Barbarian Rage

### **Level 1 Rage**
```typescript
const rageLevel1: FeatureProgression = {
    level: 1,
    sourceType: FeatureSourceType.Class,
    classId: BARBARIAN_CLASS_ID,
    modifiers: [
        // STR bonus (conditional)
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Attribute,
            appliesToId: ABILITY_MAP.STR,
            value: 4,
            bonusType: FeatureBonusType.Morale,
            conditions: [{ type: 'trigger', value: 'rage_active' }]
        },
        // CON bonus (conditional)
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Attribute,
            appliesToId: ABILITY_MAP.CON,
            value: 4,
            bonusType: FeatureBonusType.Morale,
            conditions: [{ type: 'trigger', value: 'rage_active' }]
        },
        // AC penalty (conditional)
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.AC,
            value: -2,
            bonusType: FeatureBonusType.Other,
            conditions: [{ type: 'trigger', value: 'rage_active' }]
        },
        // Uses per day
        {
            type: ModifierType.Uses,
            value: 1,
            bonusType: FeatureBonusType.Other
        }
    ],
    choices: [],
    effects: []
};
```

### **Level 11 Rage (Overrides Level 1)**
```typescript
const rageLevel11: FeatureProgression = {
    level: 11,
    sourceType: FeatureSourceType.Class,
    classId: BARBARIAN_CLASS_ID,
    modifiers: [
        // Enhanced STR bonus
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Attribute,
            appliesToId: ABILITY_MAP.STR,
            value: 6, // Increased from 4
            bonusType: FeatureBonusType.Morale,
            conditions: [{ type: 'trigger', value: 'rage_active' }]
        },
        // Enhanced uses per day
        {
            type: ModifierType.Uses,
            value: 3, // Increased from 1
            bonusType: FeatureBonusType.Other
        }
    ],
    choices: [],
    effects: []
};
```

## Fighter Bonus Feats

### **Formula-Based Approach (Recommended)**
```typescript
const fighterBonusFeat: FeatureProgression = {
    level: 1, // Single entry with formula handles all levels
    sourceType: FeatureSourceType.Class,
    classId: FIGHTER_CLASS_ID,
    appliesToType: FeatureAppliesToType.Feat,
    appliesTo: FeatureFeatChoiceFilter.FighterBonus,
    modifiers: [{
        type: ModifierType.Other,
        appliesTo: ModifierAppliesToType.Choice,
        appliesToId: 1, // 1 = Fighter Bonus Feat
        value: 1,
        formulaId: 2, // EVERY_N_LEVELS formula ID
        formulaParamsId: 123, // Links to FeatureModifierFormulaParams
        bonusType: FeatureBonusType.Other
    }],
    // FeatureModifierFormulaParams (created separately)
    // {
    //     id: 123,
    //     formulaId: 2, // EVERY_N_LEVELS
    //     interval: 2,  // Every 2 levels
    //     formulaStartLevel: 2, // Start at level 2
    //     attributeId: null
    // }
    choices: [{
        choiceType: ChoiceType.Feat,
        choiceBehavior: ChoiceBehavior.Single,
        label: "Choose a fighter bonus feat"
    }],
    effects: []
};
```

### **Explicit Progression Approach**
```typescript
// Multiple FeatureProgression entries for each level
const fighterBonusFeatLevel1: FeatureProgression = {
    level: 1,
    sourceType: FeatureSourceType.Class,
    classId: FIGHTER_CLASS_ID,
    appliesToType: FeatureAppliesToType.Feat,
    appliesTo: FeatureFeatChoiceFilter.FighterBonus,
    modifiers: [{
        type: ModifierType.Other,
        appliesTo: ModifierAppliesToType.Choice,
        appliesToId: 1, // 1 = Fighter Bonus Feat
        value: 1,
        bonusType: FeatureBonusType.Other
    }],
    choices: [{
        choiceType: ChoiceType.Feat,
        choiceBehavior: ChoiceBehavior.Single,
        label: "Choose a fighter bonus feat"
    }],
    effects: []
};

// Repeat for levels 2, 4, 6, 8, 10, 12, 14, 16, 18, 20
```

### **Key Components**
- **ModifierType.Other + ModifierAppliesToType.Choice**: Tracks levels where choices can be made
- **appliesToId: 1**: Identifies this as a Fighter Bonus Feat choice
- **FeatureAppliesToType.Feat**: Specifies this applies to feats
- **FeatureFeatChoiceFilter.FighterBonus**: Restricts choices to fighter bonus feats
- **formulaId: 'fighter_bonus_feats'**: Calculates progression pattern (every 2 levels)

## Druid Wild Shape

### **Base Wild Shape (Level 1)**
```typescript
const wildShapeBase: FeatureProgression = {
    level: 1,
    sourceType: FeatureSourceType.Class,
    classId: DRUID_CLASS_ID,
    modifiers: [{
        type: ModifierType.Quantity,
        appliesTo: ModifierAppliesToType.Uses,
        value: 1,
        formulaId: 1, // USES_1_TO_6 formula ID
        formulaParamsId: 789, // Links to FeatureModifierFormulaParams
        bonusType: FeatureBonusType.Other
    }],
    // FeatureModifierFormulaParams (created separately)
    // {
    //     id: 789,
    //     formulaId: 1, // USES_1_TO_6
    //     interval: null,
    //     formulaStartLevel: null,
    //     attributeId: null
    // }
    choices: [],
    effects: [{
        effectType: FeatureSpecialEffectType.WildShapeForm,
        key: 'wildshape',
        value: 'animal'
    }]
};
```

### **Elemental Wild Shape (Level 16)**
```typescript
const elementalWildShape: FeatureProgression = {
    level: 16,
    sourceType: FeatureSourceType.Class,
    classId: DRUID_CLASS_ID,
    modifiers: [{
        type: ModifierType.Quantity,
        appliesTo: ModifierAppliesToType.Uses,
        value: 1,
        formulaId: 2, // EVERY_N_LEVELS formula ID
        formulaParamsId: 456, // Links to FeatureModifierFormulaParams
        bonusType: FeatureBonusType.Other
    }],
    // FeatureModifierFormulaParams (created separately)
    // {
    //     id: 456,
    //     formulaId: 2, // EVERY_N_LEVELS
    //     interval: 2,  // Every 2 levels
    //     formulaStartLevel: 16, // Start at level 16
    //     attributeId: null
    // }
    choices: [],
    effects: [
        {
            effectType: FeatureSpecialEffectType.WildShapeForm,
            key: 'elementalwildshape',
            value: 'elemental'
        },
        {
            effectType: FeatureSpecialEffectType.WildShapeSize,
            key: 'elementalwildshape',
            value: 'Large'
        }
    ]
};
```

### **Elemental Wild Shape Size Progression (Level 18, 20)**
```typescript
const elementalWildShapeLevel18: FeatureProgression = {
    level: 18,
    sourceType: FeatureSourceType.Class,
    classId: DRUID_CLASS_ID,
    modifiers: [], // No additional uses, just size upgrade
    choices: [],
    effects: [
        {
            effectType: FeatureSpecialEffectType.WildShapeForm,
            key: 'elementalwildshape',
            value: 'elemental'
        },
        {
            effectType: FeatureSpecialEffectType.WildShapeSize,
            key: 'elementalwildshape',
            value: 'Huge'
        }
    ]
};

const elementalWildShapeLevel20: FeatureProgression = {
    level: 20,
    sourceType: FeatureSourceType.Class,
    classId: DRUID_CLASS_ID,
    modifiers: [], // No additional uses, just size upgrade
    choices: [],
    effects: [
        {
            effectType: FeatureSpecialEffectType.WildShapeForm,
            key: 'elementalwildshape',
            value: 'elemental'
        },
        {
            effectType: FeatureSpecialEffectType.WildShapeSize,
            key: 'elementalwildshape',
            value: 'Huge'
        }
    ]
};
```

### **Key Components for Wild Shape**
- **ModifierType.Quantity + ModifierAppliesToType.Uses**: Tracks uses per day
- **FeatureSpecialEffectType.WildShapeForm**: Specifies what forms are available
- **FeatureSpecialEffectType.WildShapeSize**: Specifies size limitations
- **key: 'wildshape' vs 'elementalwildshape'**: Distinguishes regular vs elemental wild shape
- **formulaId: 'uses_1_to_6'**: For base wild shape uses
- **formulaId: 'every_2_levels'**: For elemental wild shape uses

### **Display Format**
The system will display:
- **Level 1**: "Wild Shape: 1/day, animal"
- **Level 16**: "Wild Shape: 6/day, elemental: 1/day, elemental: Large"
- **Level 18**: "Wild Shape: 6/day, elemental: 2/day, elemental: Huge"
- **Level 20**: "Wild Shape: 6/day, elemental: 3/day, elemental: Huge"

## Ranger Favored Enemy

### **Implementation Strategy**

Favored Enemy uses the **Allocation choice behavior** to allow players to distribute +2 bonuses among creature types:

1. **Base Bonus**: Every favored enemy gets +2 to skills/damage
2. **Additional Bonuses**: At certain levels, players get extra +2 bonuses to allocate
3. **Allocation**: Players can distribute these extra bonuses among their existing favored enemies

### **Progression Structure**

#### **Level 1: First Favored Enemy**
```typescript
const favoredEnemyLevel1: FeatureProgression = {
    level: 1,
    sourceType: FeatureSourceType.Class,
    classId: RANGER_CLASS_ID,
    modifiers: [], // No modifiers in progression - handled by custom character sheet function
    choices: [{
        choiceType: ChoiceType.CreatureType,
        choiceBehavior: ChoiceBehavior.Single,
        label: "Choose first favored enemy",
        pickCount: 1
    }],
    effects: []
};
```

#### **Level 5: Second Favored Enemy + First Allocation**
```typescript
const favoredEnemyLevel5: FeatureProgression = {
    level: 5,
    sourceType: FeatureSourceType.Class,
    classId: RANGER_CLASS_ID,
    modifiers: [],
    choices: [
        {
            choiceType: ChoiceType.CreatureType,
            choiceBehavior: ChoiceBehavior.Single,
            label: "Choose second favored enemy",
            pickCount: 1
        },
        {
            choiceType: ChoiceType.CreatureType,
            choiceBehavior: ChoiceBehavior.Allocation,
            label: "Allocate +2 bonus to one of your favored enemies",
            pickCount: 1
        }
    ],
    effects: []
};
```

#### **Level 10: Third Favored Enemy + Second Allocation**
```typescript
const favoredEnemyLevel10: FeatureProgression = {
    level: 10,
    sourceType: FeatureSourceType.Class,
    classId: RANGER_CLASS_ID,
    modifiers: [],
    choices: [
        {
            choiceType: ChoiceType.CreatureType,
            choiceBehavior: ChoiceBehavior.Single,
            label: "Choose third favored enemy",
            pickCount: 1
        },
        {
            choiceType: ChoiceType.CreatureType,
            choiceBehavior: ChoiceBehavior.Allocation,
            label: "Allocate +2 bonus to one of your favored enemies",
            pickCount: 1
        }
    ],
    effects: []
};
```

### **How It Works**

- **Level 1**: Choose Dragon → Dragon: +2 (base)
- **Level 5**: Choose Orc + allocate +2 → Dragon: +4, Orc: +2 OR Dragon: +2, Orc: +4
- **Level 10**: Choose Goblin + allocate +2 → Can reallocate previous bonus + new bonus
  - Could be: Dragon: +6, Orc: +2, Goblin: +2
  - Could be: Dragon: +2, Orc: +4, Goblin: +4
  - Could be: Dragon: +4, Orc: +4, Goblin: +2

### **Character Sheet Function**

The custom character sheet function handles the bonus calculations:

1. **Collect all favored enemy choices** (Single behavior choices)
2. **Collect all allocation choices** (Allocation behavior choices)
3. **Calculate final bonuses**: Base +2 for each favored enemy + sum of all allocations to that enemy type
4. **Apply to skills/damage**: +X to Bluff, Listen, Sense Motive, Spot, Survival, and damage vs that creature type

### **Creature Types**

Available creature types are defined in `shared/static-data/src/FeatureData.ts`:
- Aberration, Animal, Construct, Dragon, Elemental, Fey, Giant, Humanoid, Magical Beast, Monstrous Humanoid, Ooze, Outsider, Plant, Undead, Vermin

### **Benefits of This Approach**

1. **Simple Model**: FeatureProgression just defines choices, not complex modifiers
2. **Flexible Allocation**: Players can distribute bonuses as they prefer
3. **Reallocation Support**: Character sheet can offer reallocation during level-up
4. **Clean Separation**: Model defines capabilities, UI provides user experience

## Future Character Sheet Enhancements

### **Favored Enemy Character Sheet Integration**

The current implementation defines the choice capabilities, but the character sheet system needs enhancements to handle the actual choice selection and bonus calculation:

#### **Required Character Sheet Features**
1. **Creature Type Selection UI**: Interface for players to select specific creature types from the available list
2. **Allocation Interface**: UI for distributing +2 bonuses among chosen creature types
3. **Choice Persistence**: Store character's specific choices in the database
4. **Bonus Calculation**: Custom function to calculate final bonuses (base +2 + allocations)
5. **Skill/Damage Application**: Apply bonuses to Bluff, Listen, Sense Motive, Spot, Survival, and damage vs specific creature types
6. **Reallocation Support**: Allow players to reallocate bonuses during level-up
7. **Choice History**: Track and display character's choice history for features

#### **Character Sheet Data Structure**
```typescript
interface CharacterFavoredEnemyChoice {
    characterId: number;
    featureProgressionId: number;
    choiceType: 'Single' | 'Allocation';
    creatureTypeId: number;
    allocatedBonus: number; // 0 for base, 2 for each allocation
    totalBonus: number; // base + allocated
}
```

#### **Bonus Calculation Function**
```typescript
function calculateFavoredEnemyBonuses(character: Character): Map<CreatureType, number> {
    // Collect all favored enemy choices
    // Calculate base +2 for each chosen creature type
    // Add allocated bonuses
    // Return map of creature type -> total bonus
}
```

### **Combat Style Character Sheet Integration**

#### **Required Features**
1. **Feature Selection UI**: Interface for choosing between Archery and Two-Weapon Combat
2. **Feature Application**: Apply chosen combat style features to character abilities
3. **Choice Persistence**: Store character's combat style choice
4. **Validation**: Ensure only one combat style can be chosen

### **Implementation Priority**
1. **High Priority**: Creature type selection and allocation UI
2. **Medium Priority**: Bonus calculation and application to skills/damage
3. **Low Priority**: Reallocation support and choice history

## Rogue Sneak Attack

### **Level 1 Sneak Attack**
```typescript
const sneakAttackLevel1: FeatureProgression = {
    level: 1,
    sourceType: FeatureSourceType.Class,
    classId: ROGUE_CLASS_ID,
    modifiers: [{
        type: ModifierType.Quantity,
        appliesTo: ModifierAppliesToType.Damage,
        appliesToId: RpgDice.D6,
        value: 1,
        conditions: [{ type: 'attack_type', value: 'sneak_attack' }]
    }],
    choices: [],
    effects: []
};
```

### **Level 3 Sneak Attack (Overrides Level 1)**
```typescript
const sneakAttackLevel3: FeatureProgression = {
    level: 3,
    sourceType: FeatureSourceType.Class,
    classId: ROGUE_CLASS_ID,
    modifiers: [{
        type: ModifierType.Quantity,
        appliesTo: ModifierAppliesToType.Damage,
        appliesToId: RpgDice.D6,
        value: 2 // Overrides level 1 value
    }],
    choices: [],
    effects: []
};
```

## Key Patterns Demonstrated

1. **Conditional Bonuses**: Rage shows temporary bonuses with conditions
2. **Progression Scaling**: Later levels override earlier ones (Sneak Attack)
3. **Player Choices**: Bonus feats and favored enemy selection
4. **Resource Tracking**: Uses per day for rage
5. **Choice Dependencies**: Modifiers that depend on player choices

## Class Creation

```typescript
const barbarianClass = {
    name: "Barbarian",
    hitDie: 12,
    features: [rageLevel1, rageLevel11]
};

await ClassService.createClass(barbarianClass);
```

For more examples, see **[racial-features.md](racial-features.md)** and **[component-selection.md](component-selection.md)**.

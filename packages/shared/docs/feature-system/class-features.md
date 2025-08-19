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

### **Bonus Feat Selection**
```typescript
const fighterBonusFeat: FeatureProgression = {
    level: 1, // Also at 2, 4, 6, 8, 10, 12, 14, 16, 18, 20
    sourceType: FeatureSourceType.Class,
    classId: FIGHTER_CLASS_ID,
    modifiers: [],
    choices: [{
        choiceType: ChoiceType.Feat,
        choiceBehavior: ChoiceBehavior.Single,
        appliesToType: FeatureAppliesToType.Feat,
        appliesTo: FeatureFeatChoiceFilter.FighterBonus,
        label: "Choose a fighter bonus feat"
    }],
    effects: []
};
```

## Ranger Favored Enemy

### **Base Favored Enemy**
```typescript
const favoredEnemyBase: FeatureProgression = {
    level: 1,
    sourceType: FeatureSourceType.Class,
    classId: RANGER_CLASS_ID,
    modifiers: [
        // Attack bonus vs favored enemy
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Attack,
            value: 2,
            bonusType: FeatureBonusType.Other,
            appliesIfChoiceKey: "favored_enemy_1",
            conditions: [{ type: 'other', value: 'target_is_favored_enemy' }]
        },
        // Damage bonus vs favored enemy
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Damage,
            value: 2,
            bonusType: FeatureBonusType.Other,
            appliesIfChoiceKey: "favored_enemy_1",
            conditions: [{ type: 'other', value: 'target_is_favored_enemy' }]
        }
    ],
    choices: [{
        choiceType: ChoiceType.Feature,
        choiceBehavior: ChoiceBehavior.Single,
        appliesToType: FeatureAppliesToType.Other,
        label: "Choose first favored enemy"
    }],
    effects: []
};
```

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

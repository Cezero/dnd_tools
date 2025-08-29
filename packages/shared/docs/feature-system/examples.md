# Feature System Implementation Examples

*Comprehensive examples for implementing D&D features using the feature system.*

## 📋 **Overview**

This document provides complete, working examples for implementing various D&D features using the feature system. These examples demonstrate real-world usage patterns and can be used as templates for implementing new features.

**Related Documentation:**
- **[Modifier System](./modifier-system.md)** - Comprehensive modifier system reference
- **[Choice System](./choice-system.md)** - Choice system implementation guide
- **[Formula System](./formula-system.md)** - Formula system reference

## 🎯 **Class Feature Examples**

### **Barbarian Rage**

**D&D 3.5 Rule**: At 1st level, a barbarian can rage once per day. While raging, the barbarian gains +4 to Strength and Constitution, +2 to Will saves, and -2 to AC. The rage lasts for 3 + Constitution modifier rounds.

#### **Level 1 Rage**
```typescript
const rageLevel1: FeatureProgression = {
    level: 1,
    sourceType: FeatureSourceType.Class,
    classId: BARBARIAN_CLASS_ID,
    modifiers: [
        // STR bonus (conditional)
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Ability,
            appliesToId: ABILITY_MAP.STR,
            value: 4,
            bonusType: FeatureBonusType.Morale,
            conditions: [{ conditionType: FeatureModifierConditionType.trigger, conditionValue: 1 }] // rage_active
        },
        // CON bonus (conditional)
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Ability,
            appliesToId: ABILITY_MAP.CON,
            value: 4,
            bonusType: FeatureBonusType.Morale,
            conditions: [{ conditionType: FeatureModifierConditionType.trigger, conditionValue: 1 }] // rage_active
        },
        // Will save bonus (conditional)
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.SavingThrow,
            value: 2,
            bonusType: FeatureBonusType.Morale,
            conditions: [{ conditionType: FeatureModifierConditionType.trigger, conditionValue: 1 }] // rage_active
        },
        // AC penalty (conditional)
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.AC,
            value: -2,
            bonusType: FeatureBonusType.Other,
            conditions: [{ conditionType: FeatureModifierConditionType.trigger, conditionValue: 1 }] // rage_active
        },
        // Uses per day
        {
            type: ModifierType.Quantity,
            appliesTo: ModifierAppliesToType.Uses,
            value: 1,
            bonusType: FeatureBonusType.Other
        }
    ],
    choices: [],
    effects: []
};
```

#### **Level 11 Rage (Overrides Level 1)**
```typescript
const rageLevel11: FeatureProgression = {
    level: 11,
    sourceType: FeatureSourceType.Class,
    classId: BARBARIAN_CLASS_ID,
    modifiers: [
        // Enhanced STR bonus
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Ability,
            appliesToId: ABILITY_MAP.STR,
            value: 6, // Increased from 4
            bonusType: FeatureBonusType.Morale,
            conditions: [{ conditionType: FeatureModifierConditionType.trigger, conditionValue: 1 }] // rage_active
        },
        // Enhanced uses per day
        {
            type: ModifierType.Quantity,
            appliesTo: ModifierAppliesToType.Uses,
            value: 3, // Increased from 1
            bonusType: FeatureBonusType.Other
        }
    ],
    choices: [],
    effects: []
};
```

### **Fighter Bonus Feats**

**D&D 3.5 Rule**: At 1st level, 2nd level, and every four levels thereafter (6th, 10th, 14th, and 18th level), a fighter may select a bonus feat from the fighter bonus feat list.

#### **Choice-Based Approach (Recommended)**
```typescript
const fighterBonusFeat: FeatureProgression = {
    level: 1, // Single entry with formula handles all levels
    sourceType: FeatureSourceType.Class,
    classId: FIGHTER_CLASS_ID,
    modifiers: [],
    choices: [{
        type: FeatureChoiceType.Feat,
        behavior: FeatureChoiceBehavior.Single,
        label: "Choose a fighter bonus feat",
        filterType: FeatureFeatChoiceFilter.FighterBonus,
        formulaParamsId: 123 // Links to FeatureFormulaParams
    }],
    effects: []
};

// FeatureFormulaParams (created separately)
// {
//     id: 123,
//     formulaId: FormulaId.EVERY_N_LEVELS, // EVERY_N_LEVELS
//     interval: 4,  // Every 4 levels
//     formulaStartLevel: 2, // Start at level 2
//     abilityId: null
// }
```

#### **Explicit Progression Approach**
```typescript
// Multiple FeatureProgression entries for each level
const fighterBonusFeatLevel1: FeatureProgression = {
    level: 1,
    sourceType: FeatureSourceType.Class,
    classId: FIGHTER_CLASS_ID,
    modifiers: [],
    choices: [{
        type: FeatureChoiceType.Feat,
        behavior: FeatureChoiceBehavior.Single,
        label: "Choose a fighter bonus feat",
        filterType: FeatureFeatChoiceFilter.FighterBonus
    }],
    effects: []
};

// Repeat for levels 2, 6, 10, 14, 18
```

### **Monk Flurry of Blows**

**D&D 3.5 Rule**: At 1st level, a monk can make a flurry of blows as a full-round action. When doing so, he may make one extra attack that takes a -2 penalty on the attack rolls. This penalty decreases by 1 at 4th level and by an additional 1 for every four levels thereafter (8th, 12th, 16th, and 20th level).

#### **Attack Penalty with Conditional Scaling**
```typescript
const flurryOfBlows: FeatureProgression = {
    level: 1,
    sourceType: FeatureSourceType.Class,
    classId: MONK_CLASS_ID,
    modifiers: [
        // Attack penalty (conditional scaling)
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Attack,
            value: -2, // Base penalty value
            bonusType: FeatureBonusType.Other,
            formulaParamsId: 456 // Links to FeatureFormulaParams with conditional scaling
        },
        // Extra attacks
        {
            type: ModifierType.Quantity,
            appliesTo: ModifierAppliesToType.ExtraAttacks,
            value: 1,
            bonusType: FeatureBonusType.Other
        }
    ],
    choices: [],
    effects: []
};

// FeatureFormulaParams for conditional scaling
// {
//     id: 456,
//     formulaId: FormulaId.CONDITIONAL_SCALING,
//     thresholds: "1,4,8,12,16,20", // Level thresholds
//     values: "-2,-1,0,1,2,3"       // Corresponding penalty values
// }
```

### **Monk Unarmed Strike**

**D&D 3.5 Rule**: A monk's unarmed strike damage increases with level and varies by character size.

#### **Size-Based Damage with Conditional Scaling**
```typescript
const unarmedStrike: FeatureProgression = {
    level: 1,
    sourceType: FeatureSourceType.Class,
    classId: MONK_CLASS_ID,
    modifiers: [
        // Medium size damage
        {
            type: ModifierType.Replacement,
            appliesTo: ModifierAppliesToType.UnarmedDamage,
            value: 0, // Base value (not used in conditional scaling)
            bonusType: FeatureBonusType.Other,
            conditions: [{ conditionType: FeatureModifierConditionType.character_size, conditionValue: 2 }], // Medium
            formulaParamsId: 789 // Links to FeatureFormulaParams
        },
        // Small size damage
        {
            type: ModifierType.Replacement,
            appliesTo: ModifierAppliesToType.UnarmedDamage,
            value: 0,
            bonusType: FeatureBonusType.Other,
            conditions: [{ conditionType: FeatureModifierConditionType.character_size, conditionValue: 1 }], // Small
            formulaParamsId: 790
        },
        // Large size damage
        {
            type: ModifierType.Replacement,
            appliesTo: ModifierAppliesToType.UnarmedDamage,
            value: 0,
            bonusType: FeatureBonusType.Other,
            conditions: [{ conditionType: FeatureModifierConditionType.character_size, conditionValue: 3 }], // Large
            formulaParamsId: 791
        }
    ],
    choices: [],
    effects: []
};

// FeatureFormulaParams for size-based damage
// Medium size: thresholds "1,4,8,12,16,20", values "1d6,1d8,1d10,2d6,2d8,2d10"
// Small size: thresholds "1,4,8,12,16,20", values "1d4,1d6,1d8,1d10,2d6,2d8"
// Large size: thresholds "1,4,8,12,16,20", values "1d8,2d6,2d8,3d6,3d8,4d8"
```

### **Monk Diamond Soul**

**D&D 3.5 Rule**: At 13th level, a monk gains spell resistance equal to his current monk level + 10.

#### **Value Plus Level Formula**
```typescript
const diamondSoul: FeatureProgression = {
    level: 13,
    sourceType: FeatureSourceType.Class,
    classId: MONK_CLASS_ID,
    modifiers: [
        {
            type: ModifierType.Quantity,
            appliesTo: ModifierAppliesToType.SpellResistance,
            value: 10, // Fixed value
            bonusType: FeatureBonusType.Other,
            formulaParamsId: 123 // Links to FeatureFormulaParams
        }
    ],
    choices: [],
    effects: []
};

// FeatureFormulaParams
// {
//     id: 123,
//     formulaId: FormulaId.VALUE_PLUS_LEVEL, // VALUE_PLUS_LEVEL
//     // Formula: 10 + level
//     // Level 13: 23, Level 14: 24, Level 15: 25, etc.
// }
```

### **Monk Wholeness of Body**

**D&D 3.5 Rule**: At 7th level, a monk can heal his own wounds. He can heal a number of hit points of damage equal to his monk level × 2.

#### **Level Times Value Formula**
```typescript
const wholenessOfBody: FeatureProgression = {
    level: 7,
    sourceType: FeatureSourceType.Class,
    classId: MONK_CLASS_ID,
    modifiers: [
        {
            type: ModifierType.Quantity,
            appliesTo: ModifierAppliesToType.Healing,
            value: 2, // Scaling multiplier
            bonusType: FeatureBonusType.Other,
            formulaParamsId: 456 // Links to FeatureFormulaParams
        }
    ],
    choices: [],
    effects: []
};

// FeatureFormulaParams
// {
//     id: 456,
//     formulaId: FormulaId.LEVEL_TIMES_VALUE, // LEVEL_TIMES_VALUE
//     // Formula: level × 2
//     // Level 7: 14, Level 8: 16, Level 9: 18, etc.
// }
```

### **Druid Wild Shape**

**D&D 3.5 Rule**: At 1st level, a druid can wild shape into animals. The number of times per day increases with level.

#### **Base Wild Shape (Level 1)**
```typescript
const wildShapeBase: FeatureProgression = {
    level: 1,
    sourceType: FeatureSourceType.Class,
    classId: DRUID_CLASS_ID,
    modifiers: [{
        type: ModifierType.Quantity,
        appliesTo: ModifierAppliesToType.Uses,
        value: 1,
        formulaParamsId: 789 // Links to FeatureFormulaParams
        bonusType: FeatureBonusType.Other
    }],
    // FeatureFormulaParams (created separately)
    // {
    //     id: 789,
    //     formulaId: FormulaId.EVERY_N_LEVELS, // EVERY_N_LEVELS
    //     interval: 1,  // Every level
    //     formulaStartLevel: 1, // Start at level 1
    //     abilityId: null
    // }
    choices: [],
    effects: [{
        effectType: FeatureSpecialEffectType.WildShapeForm,
        key: 'wildshape',
        value: 'animal'
    }]
};
```

#### **Elemental Wild Shape (Level 16)**
```typescript
const elementalWildShape: FeatureProgression = {
    level: 16,
    sourceType: FeatureSourceType.Class,
    classId: DRUID_CLASS_ID,
    modifiers: [{
        type: ModifierType.Quantity,
        appliesTo: ModifierAppliesToType.Uses,
        value: 1,
        formulaParamsId: 456 // Links to FeatureFormulaParams
        bonusType: FeatureBonusType.Other
    }],
    // FeatureFormulaParams (created separately)
    // {
    //     id: 456,
    //     formulaId: FormulaId.EVERY_N_LEVELS, // EVERY_N_LEVELS
    //     interval: 2,  // Every 2 levels
    //     formulaStartLevel: 16, // Start at level 16
    //     abilityId: null
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
            key: 'elementalsize',
            value: 'large'
        }
    ]
};
```

## 🎯 **Racial Feature Examples**

### **Dwarf Racial Traits**

**D&D 3.5 Rule**: Dwarves gain +2 Constitution, -2 Charisma, +2 save bonus vs poison, +4 dodge bonus to AC vs giants, and weapon familiarity with dwarven waraxes and urgroshes.

#### **Complete Dwarf Implementation**
```typescript
const dwarfTraits: FeatureProgression = {
    level: 1,
    sourceType: FeatureSourceType.Race,
    raceId: DWARF_RACE_ID,
    modifiers: [
        // Ability adjustments
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Ability,
            appliesToId: ABILITY_MAP.CON,
            value: 2,
            bonusType: FeatureBonusType.Racial
        },
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Ability,
            appliesToId: ABILITY_MAP.CHA,
            value: -2,
            bonusType: FeatureBonusType.Racial
        },
        // Save bonus vs poison
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.SavingThrow,
            value: 2,
            bonusType: FeatureBonusType.Racial,
            conditions: [{ conditionType: FeatureModifierConditionType.other, conditionValue: 1 }] // against_poison
        },
        // AC bonus vs giants
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.AC,
            value: 4,
            bonusType: FeatureBonusType.Dodge,
            conditions: [{ conditionType: FeatureModifierConditionType.other, conditionValue: 2 }] // opponent_type:giant
        }
    ],
    choices: [],
    effects: [
        // Weapon familiarity
        {
            effectType: FeatureSpecialEffectType.WeaponFamiliarity,
            numericValue: WEAPON_ID.DWARVEN_WARAXE,
            key: 'weapon_familiarity',
            value: 'dwarven_waraxe'
        },
        {
            effectType: FeatureSpecialEffectType.WeaponFamiliarity,
            numericValue: WEAPON_ID.DWARVEN_URGROSH,
            key: 'weapon_familiarity',
            value: 'dwarven_urgrosh'
        },
        // Stonecunning
        {
            effectType: FeatureSpecialEffectType.Other,
            key: "stonecunning",
            value: "automatic_search_check_near_stone",
            description: "Automatic search checks near unusual stonework"
        }
    ]
};
```

### **Elf Racial Traits**

**D&D 3.5 Rule**: Elves gain +2 Dexterity, -2 Constitution, +2 save bonus vs enchantments, and weapon proficiency with longswords, rapiers, longbows, and shortbows.

#### **Elf Abilities**
```typescript
const elfTraits: FeatureProgression = {
    level: 1,
    sourceType: FeatureSourceType.Race,
    raceId: ELF_RACE_ID,
    modifiers: [
        // Ability adjustments
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Ability,
            appliesToId: ABILITY_MAP.DEX,
            value: 2,
            bonusType: FeatureBonusType.Racial
        },
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Ability,
            appliesToId: ABILITY_MAP.CON,
            value: -2,
            bonusType: FeatureBonusType.Racial
        },
        // Save bonus vs enchantments
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.SavingThrow,
            value: 2,
            bonusType: FeatureBonusType.Racial,
            conditions: [{ conditionType: FeatureModifierConditionType.other, conditionValue: 3 }] // against_enchantment_spells
        }
    ],
    choices: [],
    effects: [
        // Weapon proficiencies
        {
            effectType: FeatureSpecialEffectType.Proficiency,
            numericValue: WEAPON_ID.LONGSWORD,
            key: 'weapon_proficiency',
            value: 'longsword'
        },
        {
            effectType: FeatureSpecialEffectType.Proficiency,
            numericValue: WEAPON_ID.RAPIER,
            key: 'weapon_proficiency',
            value: 'rapier'
        },
        {
            effectType: FeatureSpecialEffectType.Proficiency,
            numericValue: WEAPON_ID.LONGBOW,
            key: 'weapon_proficiency',
            value: 'longbow'
        },
        {
            effectType: FeatureSpecialEffectType.Proficiency,
            numericValue: WEAPON_ID.SHORTBOW,
            key: 'weapon_proficiency',
            value: 'shortbow'
        }
    ]
};
```

## 🎯 **Specialized System Examples**

### **Class Skills Implementation**

**D&D 3.5 Rule**: Each class has a list of class skills. Characters gain a +3 bonus on class skill checks if they have at least 1 rank in the skill.

#### **Fighter Class Skills**
```typescript
const fighterClassSkills: FeatureProgression = {
    level: 1,
    sourceType: FeatureSourceType.Class,
    classId: FIGHTER_CLASS_ID,
    featureId: SpecialFeatureId.ClassSkill, // Special feature ID
    appliesToType: FeatureAppliesToType.Skill,
    appliesTo: null, // Container progression
    modifiers: [
        // Each class skill is a modifier
        {
            type: ModifierType.Other, // Not a bonus, just marking as class skill
            appliesTo: ModifierAppliesToType.Skill,
            appliesToId: SKILL_ID.CLIMB,
            value: 0, // No bonus value - just marking as class skill
            bonusType: null
        },
        {
            type: ModifierType.Other,
            appliesTo: ModifierAppliesToType.Skill,
            appliesToId: SKILL_ID.JUMP,
            value: 0,
            bonusType: null
        },
        {
            type: ModifierType.Other,
            appliesTo: ModifierAppliesToType.Skill,
            appliesToId: SKILL_ID.SWIM,
            value: 0,
            bonusType: null
        }
        // ... additional class skills
    ],
    choices: [],
    effects: []
};
```

### **Language Implementation**

**D&D 3.5 Rule**: Characters know Common plus bonus languages based on Intelligence modifier and race.

#### **Elf Automatic Languages**
```typescript
const elfAutomaticLanguages: FeatureProgression = {
    level: 1,
    sourceType: FeatureSourceType.Race,
    raceId: ELF_RACE_ID,
    featureId: SpecialFeatureId.AutomaticLanguage, // Special feature ID
    appliesToType: FeatureAppliesToType.Language,
    appliesTo: null, // Container progression
    modifiers: [
        // Common (automatic)
        {
            type: ModifierType.Other,
            appliesTo: ModifierAppliesToType.AutomaticLanguage,
            appliesToId: LANGUAGE_ID.COMMON,
            value: 0, // No bonus, just granting language
            bonusType: null
        },
        // Elven (automatic)
        {
            type: ModifierType.Other,
            appliesTo: ModifierAppliesToType.AutomaticLanguage,
            appliesToId: LANGUAGE_ID.ELVEN,
            value: 0,
            bonusType: null
        }
    ],
    choices: [],
    effects: []
};
```

#### **Elf Bonus Languages**
```typescript
const elfBonusLanguages: FeatureProgression = {
    level: 1,
    sourceType: FeatureSourceType.Race,
    raceId: ELF_RACE_ID,
    featureId: SpecialFeatureId.BonusLanguage, // Special feature ID
    appliesToType: FeatureAppliesToType.Language,
    appliesTo: null, // Container progression
    modifiers: [
        // Available bonus languages
        {
            type: ModifierType.Other,
            appliesTo: ModifierAppliesToType.BonusLanguage,
            appliesToId: LANGUAGE_ID.DRACONIC,
            value: 0,
            bonusType: null
        },
        {
            type: ModifierType.Other,
            appliesTo: ModifierAppliesToType.BonusLanguage,
            appliesToId: LANGUAGE_ID.GNOMISH,
            value: 0,
            bonusType: null
        }
        // ... additional bonus languages
    ],
    choices: [],
    effects: []
};
```

### **Direct Feat Grant Implementation**

**D&D 3.5 Rule**: Some features directly grant specific feats, such as Ranger Track and Endurance.

#### **Ranger Track Feat**
```typescript
const rangerTrack: FeatureProgression = {
    level: 1,
    sourceType: FeatureSourceType.Class,
    classId: RANGER_CLASS_ID,
    modifiers: [
        {
            type: ModifierType.Other,
            appliesTo: ModifierAppliesToType.Feat,
            appliesToId: FEAT_ID.TRACK,
            value: 0, // No bonus value - just granting feat
            bonusType: null
        }
    ],
    choices: [],
    effects: []
};
```

## 🎯 **Complex Feature Examples**

### **Ranger Favored Enemy with Choice System**

**D&D 3.5 Rule**: At 1st level, a ranger may select a type of creature as a favored enemy. The ranger gains a +2 bonus on Bluff, Listen, Sense Motive, Spot, and Survival checks when using these skills against creatures of this type. The ranger also gains the same bonus on weapon damage rolls against creatures of this type.

#### **Favored Enemy Choice**
```typescript
const favoredEnemy: FeatureProgression = {
    level: 1,
    sourceType: FeatureSourceType.Class,
    classId: RANGER_CLASS_ID,
    modifiers: [
        // Attack bonus vs chosen creature type
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Attack,
            value: 2,
            bonusType: FeatureBonusType.Other,
            // Applied when attacking chosen creature type
        },
        // Damage bonus vs chosen creature type
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Damage,
            value: 2,
            bonusType: FeatureBonusType.Other,
            // Applied when damaging chosen creature type
        },
        // Skill bonuses vs chosen creature type
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Skill,
            appliesToId: SKILL_ID.BLUFF,
            value: 2,
            bonusType: FeatureBonusType.Other,
            // Applied when using Bluff vs chosen creature type
        },
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Skill,
            appliesToId: SKILL_ID.LISTEN,
            value: 2,
            bonusType: FeatureBonusType.Other,
            // Applied when using Listen vs chosen creature type
        },
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Skill,
            appliesToId: SKILL_ID.SENSE_MOTIVE,
            value: 2,
            bonusType: FeatureBonusType.Other,
            // Applied when using Sense Motive vs chosen creature type
        },
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Skill,
            appliesToId: SKILL_ID.SPOT,
            value: 2,
            bonusType: FeatureBonusType.Other,
            // Applied when using Spot vs chosen creature type
        },
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Skill,
            appliesToId: SKILL_ID.SURVIVAL,
            value: 2,
            bonusType: FeatureBonusType.Other,
            // Applied when using Survival vs chosen creature type
        }
    ],
    choices: [
        {
            type: FeatureChoiceType.CreatureType,
            behavior: FeatureChoiceBehavior.Single,
            label: "Choose favored enemy type",
            // Player selects creature type from available options
        }
    ],
    effects: []
};
```

## 📚 **Implementation Patterns**

### **Common Patterns**

1. **Conditional Modifiers**: Use `conditions` array for modifiers that only apply in specific situations
2. **Formula-Based Scaling**: Use `formulaParamsId` for modifiers that scale with level
3. **Choice Integration**: Use `choices` array for features that offer player selections
4. **Special Effects**: Use `effects` array for non-numeric abilities like proficiencies
5. **Container Patterns**: Use special feature IDs for container features like class skills and languages

### **Best Practices**

1. **Use Appropriate Modifier Types**: Choose the correct `ModifierType` for the effect
2. **Use Appropriate Bonus Types**: Choose the correct `FeatureBonusType` for stacking rules
3. **Use Conditions Sparingly**: Only use conditions when necessary for complex logic
4. **Use Formulas for Scaling**: Use formulas instead of multiple progression entries when possible
5. **Reference Source Files**: Always reference the actual source files for current implementation details

## 📚 **Related Documentation**

- **[Modifier System](./modifier-system.md)** - Comprehensive modifier system reference
- **[Choice System](./choice-system.md)** - Choice system implementation guide
- **[Formula System](./formula-system.md)** - Formula system reference
- **[Component Selection](./component-selection.md)** - When to use each component type

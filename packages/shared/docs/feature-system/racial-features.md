# Racial Feature Examples

*Complete examples for implementing D&D racial traits using the feature system.*

## Dwarf Racial Traits

### **Complete Dwarf Implementation**
```typescript
const dwarfTraits: FeatureProgression = {
    level: 1,
    sourceType: FeatureSourceType.Race,
    raceId: DWARF_RACE_ID,
    modifiers: [
        // Ability adjustments
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
        },
        // Save bonus vs poison
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.SavingThrow,
            value: 2,
            bonusType: FeatureBonusType.Racial,
            conditions: [{ type: 'other', value: 'against_poison' }]
        },
        // AC bonus vs giants
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.AC,
            value: 4,
            bonusType: FeatureBonusType.Dodge,
            conditions: [{ type: 'other', value: 'opponent_type:giant' }]
        }
    ],
    choices: [],
    effects: [
        // Weapon proficiency
        {
            effectType: FeatureSpecialEffectType.Proficiency,
            featId: WEAPON_ID.DWARVEN_WARAXE,
            description: "Proficient with dwarven waraxe"
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

## Elf Racial Traits

### **Elf Abilities**
```typescript
const elfTraits: FeatureProgression = {
    level: 1,
    sourceType: FeatureSourceType.Race,
    raceId: ELF_RACE_ID,
    modifiers: [
        // Ability adjustments
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Attribute,
            appliesToId: ABILITY_MAP.DEX,
            value: 2,
            bonusType: FeatureBonusType.Racial
        },
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Attribute,
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
            conditions: [{ type: 'other', value: 'against_enchantment_spells' }]
        }
    ],
    choices: [],
    effects: [
        // Weapon proficiencies
        {
            effectType: FeatureSpecialEffectType.Proficiency,
            featId: WEAPON_ID.LONGSWORD,
            description: "Proficient with longsword"
        },
        {
            effectType: FeatureSpecialEffectType.Proficiency,
            featId: WEAPON_ID.RAPIER,
            description: "Proficient with rapier"
        },
        // Low-light vision
        {
            effectType: FeatureSpecialEffectType.Vision,
            key: "low_light_vision",
            value: "see_twice_as_far_in_dim_light",
            description: "Can see twice as far as humans in dim light"
        },
        // Immunity to sleep
        {
            effectType: FeatureSpecialEffectType.Immunity,
            key: "sleep_immunity",
            value: "immune_to_sleep_spells",
            description: "Immune to magical sleep effects"
        }
    ]
};
```

## Halfling Racial Traits

### **Halfling Abilities**
```typescript
const halflingTraits: FeatureProgression = {
    level: 1,
    sourceType: FeatureSourceType.Race,
    raceId: HALFLING_RACE_ID,
    modifiers: [
        // Ability adjustments
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Attribute,
            appliesToId: ABILITY_MAP.DEX,
            value: 2,
            bonusType: FeatureBonusType.Racial
        },
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Attribute,
            appliesToId: ABILITY_MAP.STR,
            value: -2,
            bonusType: FeatureBonusType.Racial
        },
        // Size-based AC bonus
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.AC,
            value: 1,
            bonusType: FeatureBonusType.Size,
            conditions: [{ type: 'other', value: 'size_small' }]
        },
        // Size-based hide bonus
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Skill,
            appliesToId: SKILL_MAP.HIDE,
            value: 4,
            bonusType: FeatureBonusType.Size,
            conditions: [{ type: 'other', value: 'size_small' }]
        }
    ],
    choices: [],
    effects: [
        // Weapon proficiency
        {
            effectType: FeatureSpecialEffectType.Proficiency,
            featId: WEAPON_ID.SLING,
            description: "Proficient with sling"
        }
    ]
};
```

## Human Racial Traits

### **Human Abilities**
```typescript
const humanTraits: FeatureProgression = {
    level: 1,
    sourceType: FeatureSourceType.Race,
    raceId: HUMAN_RACE_ID,
    modifiers: [
        // No ability adjustments for humans
    ],
    choices: [
        // Bonus feat at 1st level
        {
            choiceType: ChoiceType.Feat,
            choiceBehavior: ChoiceBehavior.Single,
            appliesToType: FeatureAppliesToType.Feat,
            label: "Choose a bonus feat"
        },
        // Extra skill points
        {
            choiceType: ChoiceType.Feature,
            choiceBehavior: ChoiceBehavior.Allocation,
            appliesToType: FeatureAppliesToType.Skill,
            label: "Allocate 4 extra skill points",
            pickCount: 4
        }
    ],
    effects: []
};
```

## Key Patterns Demonstrated

1. **Ability Adjustments**: Racial bonuses/penalties to ability scores
2. **Conditional Bonuses**: Save bonuses against specific effects
3. **Size-Based Modifiers**: AC and skill bonuses for small races
4. **Weapon Proficiencies**: Automatic weapon proficiencies
5. **Special Abilities**: Darkvision, sleep immunity, stonecunning
6. **Player Choices**: Human bonus feat and skill point allocation

## Race Creation

```typescript
const dwarfRace = {
    name: "Dwarf",
    features: [dwarfTraits]
};

await RaceService.createRace(dwarfRace);
```

For more examples, see **[class-features.md](class-features.md)** and **[component-selection.md](component-selection.md)**.

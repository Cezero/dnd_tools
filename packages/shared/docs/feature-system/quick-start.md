# Quick Start Guide

*First steps for implementing D&D features using the feature system.*

## Getting Started

### **1. Understand the Core Concept**
The feature system uses **bulk operations only**. All feature data (modifiers, choices, effects) is sent in single API calls when creating or updating classes or races.

### **2. Choose the Right Component**
Use this decision tree:
1. **Is it a number?** → Use FeatureModifier
2. **Does the player choose?** → Use FeatureChoice
3. **Is it a special ability?** → Use FeatureSpecialEffect
4. **Is it a requirement?** → Use FeaturePrerequisite
5. **Is it a class skill?** → Use FeatureModifier (special container pattern)

### **3. Follow the Pattern**
```typescript
// 1. Define the feature
const feature = {
    slug: "barbarian-rage",
    name: "Rage",
    description: "A barbarian can fly into a rage..."
};

// 2. Create the progression
const progression = {
    level: 1,
    sourceType: FeatureSourceType.Class,
    classId: BARBARIAN_CLASS_ID,
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
};

// 3. Create the class with features
const classData = {
    name: "Barbarian",
    hitDie: 12,
    features: [progression]
};

await ClassService.createClass(classData);
```

## Common Patterns

### **Simple Ability Bonus**
```typescript
{
    type: ModifierType.Bonus,
    appliesTo: ModifierAppliesToType.Attribute,
    appliesToId: ABILITY_MAP.STR,
    value: 2,
    bonusType: FeatureBonusType.Racial
}
```

### **Conditional Bonus**
```typescript
{
    type: ModifierType.Bonus,
    appliesTo: ModifierAppliesToType.Attack,
    value: 2,
    bonusType: FeatureBonusType.Other,
    conditions: [{ type: 'other', value: 'target_is_favored_enemy' }]
}
```

### **Player Choice**
```typescript
{
    choiceType: ChoiceType.Feat,
    choiceBehavior: ChoiceBehavior.Single,
    appliesToType: FeatureAppliesToType.Feat,
    label: "Choose a fighter bonus feat"
}
```

### **Weapon Proficiency**
```typescript
{
    effectType: FeatureSpecialEffectType.Proficiency,
    featId: WEAPON_ID.LONGSWORD,
    description: "Proficient with longsword"
}
```

### **Class Skills**
```typescript
// Container progression for class skills
{
    featureId: SpecialFeatureId.ClassSkill,
    appliesToType: FeatureAppliesToType.Skill,
    modifiers: [
        {
            type: ModifierType.Other,
            appliesTo: ModifierAppliesToType.Skill,
            appliesToId: SKILL_MAP.CLIMB,
            value: 0 // No bonus, just marking as class skill
        }
    ]
}
```

## Key Rules

### **Bonus Stacking**
- **Same type bonuses don't stack** (highest applies)
- **Different type bonuses stack** (add together)
- **Circumstance bonuses stack** with everything

### **Progression Override**
- **Later levels override earlier ones**
- **Use separate progressions for scaling features**
- **Each scaling milestone gets its own progression**

### **Bulk Operations**
- **No individual CRUD** on modifiers, choices, or effects
- **Send complete data** in single requests
- **Backend handles cleanup** of old data

## Common Mistakes to Avoid

### **❌ Wrong: Multiple Enhancement Bonuses**
```typescript
// These won't stack
{
    bonusType: FeatureBonusType.Enhancement,
    value: 4
},
{
    bonusType: FeatureBonusType.Enhancement,
    value: 2
}
```

### **✅ Correct: Different Bonus Types**
```typescript
// These will stack
{
    bonusType: FeatureBonusType.Enhancement,
    value: 4
},
{
    bonusType: FeatureBonusType.Morale,
    value: 2
}
```

### **❌ Wrong: Using Special Effects for Numbers**
```typescript
{
    effectType: FeatureSpecialEffectType.Other,
    key: "strength_bonus",
    value: "+4"
}
```

### **✅ Correct: Use Modifiers for Numbers**
```typescript
{
    type: ModifierType.Bonus,
    appliesTo: ModifierAppliesToType.Attribute,
    appliesToId: ABILITY_MAP.STR,
    value: 4,
    bonusType: FeatureBonusType.Racial
}
```

## Next Steps

1. **Study [class-features.md](class-features.md)** for complete examples
2. **For class skills** see **[class-skills.md](class-skills.md)** for the special container pattern
3. **Review [component-selection.md](component-selection.md)** for decision making
4. **Follow [bulk-operations.md](bulk-operations.md)** for API usage
5. **Check [common-pitfalls.md](common-pitfalls.md)** to avoid mistakes

## Quick Reference

| Feature Type | Component | Example |
|--------------|-----------|---------|
| **Numeric Bonus** | FeatureModifier | STR +2 |
| **Player Choice** | FeatureChoice | Choose feat |
| **Special Ability** | FeatureSpecialEffect | Weapon proficiency |
| **Class Skills** | FeatureModifier (Container) | Fighter skills |
| **Resource** | FeatureModifier (Uses) | 3/day |

For complete documentation, see **[overview.md](overview.md)** and **[schema-reference.md](schema-reference.md)**.

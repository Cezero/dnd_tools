# Common Pitfalls and Solutions

*Common mistakes when implementing D&D features and how to avoid them.*

## 1. Bonus Type Conflicts

### **❌ Wrong: Multiple Enhancement Bonuses**
```typescript
// These won't stack - only the highest applies
{
    bonusType: FeatureBonusType.Enhancement,
    appliesTo: ModifierAppliesToType.Attribute,
    appliesToId: ABILITY_MAP.STR,
    value: 4
},
{
    bonusType: FeatureBonusType.Enhancement,
    appliesTo: ModifierAppliesToType.Attribute,
    appliesToId: ABILITY_MAP.STR,
    value: 2
}
```

### **✅ Correct: Use Appropriate Bonus Types**
```typescript
// These will stack - different bonus types
{
    bonusType: FeatureBonusType.Enhancement, // Belt of Giant Strength
    appliesTo: ModifierAppliesToType.Attribute,
    appliesToId: ABILITY_MAP.STR,
    value: 4
},
{
    bonusType: FeatureBonusType.Morale, // Rage bonus
    appliesTo: ModifierAppliesToType.Attribute,
    appliesToId: ABILITY_MAP.STR,
    value: 2
}
```

### **D&D Stacking Rules**
- **Same type bonuses don't stack** (highest applies)
- **Different type bonuses stack** (add together)
- **Circumstance bonuses stack** with everything
- **Dodge bonuses stack** with other dodge bonuses

## 2. Condition Specificity

### **❌ Too Broad: Will Apply in Unintended Situations**
```typescript
conditions: [{ type: 'attack_type', value: 'melee' }]
// This applies to ALL melee attacks, even when not intended
```

### **✅ Specific: Clearly Defined Application**
```typescript
conditions: [
    { type: 'attack_type', value: 'sneak_attack' },
    { type: 'other', value: 'target_denied_dex_bonus' }
]
// Only applies when both conditions are met
```

## 3. Choice Dependencies

### **❌ Missing Choice Validation**
```typescript
{
    appliesIfChoiceKey: "favored_enemy",
    appliesIfChoiceValue: "dragon" // Hard-coded value
}
// What if player chooses "goblin" instead?
```

### **✅ Proper Choice Handling**
```typescript
{
    appliesIfChoiceKey: "favored_enemy_1",
    // Value determined by player choice at runtime
    // appliesIfChoiceValue will be set based on actual choice
}
```

## 4. Progression Override Issues

### **❌ Wrong: Multiple Progressions for Same Feature**
```typescript
// Level 1: +1d6 sneak attack
const sneakAttack1 = {
    level: 1,
    modifiers: [{ value: 1 }]
};

// Level 3: +2d6 sneak attack
const sneakAttack3 = {
    level: 3,
    modifiers: [{ value: 2 }]
};
// Both apply - character gets +3d6 total!
```

### **✅ Correct: Later Levels Override Earlier Ones**
```typescript
// Level 1: +1d6 sneak attack
const sneakAttack1 = {
    level: 1,
    modifiers: [{ value: 1 }]
};

// Level 3: +2d6 sneak attack (overrides level 1)
const sneakAttack3 = {
    level: 3,
    modifiers: [{ value: 2 }] // Replaces level 1 value
};
// Only level 3 applies - character gets +2d6
```

## 5. Resource Tracking Mistakes

### **❌ Wrong: Using Bonus Type for Resources**
```typescript
{
    type: ModifierType.Bonus,
    appliesTo: ModifierAppliesToType.Other,
    value: 3,
    bonusType: FeatureBonusType.Other
    // This looks like a +3 bonus, not 3 uses per day
}
```

### **✅ Correct: Use Uses Type for Resources**
```typescript
{
    type: ModifierType.Uses,
    value: 3,
    bonusType: FeatureBonusType.Other
    // Character sheet shows: "Rage: 3/day"
}
```

## 6. Special Effect Misuse

### **❌ Wrong: Using Special Effects for Numbers**
```typescript
{
    effectType: FeatureSpecialEffectType.Other,
    key: "strength_bonus",
    value: "+4",
    description: "Strength +4"
}
// Should use FeatureModifier instead
```

### **✅ Correct: Use Special Effects for Abilities**
```typescript
{
    effectType: FeatureSpecialEffectType.Other,
    key: "uncanny_dodge",
    value: "retain_dex_bonus_when_flat_footed",
    description: "Retains Dex bonus to AC when flat-footed"
}
```

## 7. Testing Pitfalls

### **❌ Wrong: Only Testing Positive Cases**
```typescript
test('Rage provides STR bonus', () => {
    const modifiers = calculateModifiers({ activeTokens: ['rage_active'] });
    expect(modifiers.STR).toBe(20);
});
// What about when rage is not active?
```

### **✅ Correct: Test Both Positive and Negative Cases**
```typescript
test('Rage provides STR bonus only when active', () => {
    // Without rage
    let modifiers = calculateModifiers({ activeTokens: [] });
    expect(modifiers.STR).toBe(16);
    
    // With rage
    modifiers = calculateModifiers({ activeTokens: ['rage_active'] });
    expect(modifiers.STR).toBe(20);
});
```

## Prevention Checklist

Before implementing a feature, verify:

- [ ] **Bonus types** follow D&D stacking rules
- [ ] **Conditions** are specific and well-defined
- [ ] **Choices** are properly validated
- [ ] **Progressions** override correctly
- [ ] **Resources** use Uses type
- [ ] **Special effects** are for non-numeric abilities
- [ ] **Tests** cover both positive and negative cases

## Key Principles

1. **Follow D&D rules** for bonus stacking
2. **Be specific** about when effects apply
3. **Validate choices** at runtime
4. **Use the right component** for each feature type
5. **Test thoroughly** including edge cases
6. **Document clearly** for maintainability

For more details, see **[component-selection.md](component-selection.md)** and **[testing-patterns.md](testing-patterns.md)**.

# Component Selection Guide

*When to use modifiers, choices, effects, and prerequisites in the feature system.*

## Quick Decision Tree

### When to Use Each Component

```mermaid
graph TD
    A[New Feature] --> B{Numeric Bonus/Penalty?}
    B -->|Yes| C[Use FeatureModifier]
    B -->|No| D{Player Choice Required?}
    D -->|Yes| E[Use FeatureChoice]
    D -->|No| F{Special Rule/Proficiency?}
    F -->|Yes| G[Use FeatureSpecialEffect]
    F -->|No| H{Prerequisite Check?}
    H -->|Yes| I[Use FeaturePrerequisite]
    H -->|No| J[Complex Feature - Combine Components]
```

## Component Selection Matrix

| Feature Type | Primary Component | Secondary Components | Example |
|--------------|-------------------|---------------------|---------|
| **Ability Bonus** | FeatureModifier | Conditions | Barbarian Rage STR bonus |
| **Skill Bonus** | FeatureModifier | Prerequisites | Skill Focus feat |
| **Attack Bonus** | FeatureModifier | Conditions | Favored Enemy bonus |
| **Attack Penalty** | FeatureModifier | Formula | Monk Flurry of Blows penalty |
| **Extra Attacks** | FeatureModifier | Formula | Monk Flurry of Blows extra attacks |
| **Damage Bonus** | FeatureModifier | Choices + Conditions | Sneak Attack |
| **Class Skills** | FeatureModifier (Container) | - | Fighter class skills |
| **Languages** | FeatureModifier (Container) | Conditions + Choices | Elf languages |
| **Proficiency** | FeatureSpecialEffect | - | Weapon proficiency |
| **Player Selection** | FeatureChoice | Modifiers dependent on choice | Fighting Style |
| **Resource Grant** | FeatureModifier (Uses) | Special Effects | Turn Undead |
| **Transformation** | FeatureSpecialEffect | Multiple modifiers | Wild Shape |

## FeatureModifier Usage

### **When to Use Modifiers**
- **Numeric bonuses/penalties** to attributes, skills, saves, AC, attack, damage
- **Resource tracking** (uses per day, charges, etc.)
- **Quantity changes** (extra dice, additional actions, extra attacks)
- **Temporary effects** that modify numbers
- **Class skills** (special container pattern with `ModifierType.Other`)
- **Languages** (container pattern with `ModifierType.Other` and `FeatureAppliesToType.Language`)

### **Modifier Types**
```typescript
enum ModifierType {
    Bonus = 'bonus',           // +2 to attack
    Penalty = 'penalty',       // -2 to AC
    Quantity = 'quantity',     // +1d6 damage, extra attacks
    Uses = 'uses'              // 3/day
}
```

### **Bonus Types (Stacking Rules)**
```typescript
enum FeatureBonusType {
    Circumstance = 'circumstance',   // Stack with everything
    Competence = 'competence',       // Don't stack with other competence
    Dodge = 'dodge',                 // Don't stack with other dodge
    Enhancement = 'enhancement',     // Don't stack with other enhancement
    Insight = 'insight',             // Don't stack with other insight
    Luck = 'luck',                   // Don't stack with other luck
    Morale = 'morale',               // Don't stack with other morale
    Profane = 'profane',             // Don't stack with other profane
    Racial = 'racial',               // Don't stack with other racial
    Sacred = 'sacred',               // Don't stack with other sacred
    Size = 'size',                   // Don't stack with other size
    Other = 'other'                  // Custom stacking rules
}
```

### **Modifier Examples**
```typescript
// Simple ability bonus
{
    type: ModifierType.Bonus,
    appliesTo: ModifierAppliesToType.Attribute,
    appliesToId: ABILITY_MAP.STR,
    value: 2,
    bonusType: FeatureBonusType.Racial
}

// Conditional attack penalty (Monk Flurry of Blows)
{
    type: ModifierType.Penalty,
    appliesTo: ModifierAppliesToType.Attack,
    value: 0, // Base value (not used in conditional scaling)
    bonusType: FeatureBonusType.Other,
    formulaParams: {
        formulaId: FormulaId.CONDITIONAL_SCALING,
        thresholds: "1,4,8", // Level thresholds
        values: "-2,-1,0"    // Corresponding penalty values
    }
}

// Extra attacks (Monk Flurry of Blows)
{
    type: ModifierType.Quantity,
    appliesTo: ModifierAppliesToType.ExtraAttacks,
    value: 0, // Base value (not used in conditional scaling)
    bonusType: FeatureBonusType.Other,
    formulaParams: {
        formulaId: FormulaId.CONDITIONAL_SCALING,
        thresholds: "1,11", // Level thresholds
        values: "1,2"       // Corresponding extra attack values
    }
}

// Conditional attack bonus
{
    type: ModifierType.Bonus,
    appliesTo: ModifierAppliesToType.Attack,
    value: 2,
    bonusType: FeatureBonusType.Other,
    conditions: [{ type: 'other', value: 'target_is_favored_enemy' }]
}

// Resource tracking
{
    type: ModifierType.Uses,
    value: 3,
    bonusType: FeatureBonusType.Other
    // Character sheet shows: "Rage: 3/day"
}

// Class skill (special container pattern)
{
    type: ModifierType.Other,
    appliesTo: ModifierAppliesToType.Skill,
    appliesToId: SKILL_MAP.CLIMB,
    value: 0, // No bonus, just marking as class skill
    bonusType: null
}

// Language grant (container pattern)
{
    type: ModifierType.Other,
    appliesTo: ModifierAppliesToType.Language,
    appliesToId: LANGUAGE_MAP.COMMON,
    value: 0, // No bonus, just granting language
    bonusType: null
}
```

## FeatureChoice Usage

### **When to Use Choices**
- **Player selections** (feats, weapons, enemies, schools)
- **Multiple options** from a list
- **Allocation decisions** (skill points, bonuses)
- **Complex selections** with dependencies

### **Choice Behaviors**
```typescript
enum ChoiceBehavior {
    Single = 'single',         // Choose one option
    Multiple = 'multiple',     // Choose several options
    Allocation = 'allocation'  // Distribute points/bonuses
}
```

### **Choice Examples**
```typescript
// Single feat selection
{
    choiceType: ChoiceType.Feat,
    choiceBehavior: ChoiceBehavior.Single,
    appliesToType: FeatureAppliesToType.Feat,
    label: "Choose a fighter bonus feat"
}

// Multiple weapon proficiencies
{
    choiceType: ChoiceType.Feature,
    choiceBehavior: ChoiceBehavior.Multiple,
    appliesToType: FeatureAppliesToType.Item,
    label: "Choose two weapon proficiencies",
    pickCount: 2
}

// Skill point allocation
{
    choiceType: ChoiceType.Feature,
    choiceBehavior: ChoiceBehavior.Allocation,
    appliesToType: FeatureAppliesToType.Skill,
    label: "Allocate 4 skill points",
    pickCount: 4
}
```

## FeatureSpecialEffect Usage

### **When to Use Special Effects**
- **Non-numeric abilities** (proficiencies, immunities, special senses)
- **Complex rules** that don't fit modifiers
- **Transformations** and special states
- **Unique abilities** with custom logic

### **Effect Types**
```typescript
enum FeatureSpecialEffectType {
    Proficiency = 'proficiency',     // Weapon/armor proficiency
    Immunity = 'immunity',           // Immunity to effects
    Vision = 'vision',               // Special vision modes
    Other = 'other'                  // Custom effects
}
```

### **Special Effect Examples**
```typescript
// Weapon proficiency
{
    effectType: FeatureSpecialEffectType.Proficiency,
    featId: WEAPON_ID.LONGSWORD,
    description: "Proficient with longsword"
}

// Immunity
{
    effectType: FeatureSpecialEffectType.Immunity,
    key: "sleep_immunity",
    value: "immune_to_sleep_spells",
    description: "Immune to magical sleep effects"
}

// Special vision
{
    effectType: FeatureSpecialEffectType.Vision,
    key: "darkvision",
    value: "see_60ft_in_darkness",
    description: "Can see 60 feet in total darkness"
}
```

## Formula System Integration

### **When to Use Formulas**
- **Level-based scaling** (bonuses that increase with level)
- **Conditional values** (different values at different levels)
- **Resource patterns** (uses per day that scale with level)
- **Attribute-dependent** calculations (bonuses based on ability scores)

### **Formula Examples**
```typescript
// Linear scaling (Barbarian Rage bonus)
{
    type: ModifierType.Bonus,
    appliesTo: ModifierAppliesToType.Attribute,
    appliesToId: ABILITY_MAP.STR,
    value: 2, // Base bonus
    bonusType: FeatureBonusType.Morale,
    formulaParams: {
        formulaId: FormulaId.LINEAR_SCALING,
        // Scales linearly: +2 at level 1, +4 at level 2, etc.
    }
}

// Every N levels (Fighter bonus feats)
{
    type: ModifierType.Other,
    appliesTo: ModifierAppliesToType.Choice,
    value: 1, // Base choice
    bonusType: null,
    formulaParams: {
        formulaId: FormulaId.EVERY_N_LEVELS,
        interval: 2, // Every 2 levels
        // Results in: 1 choice at level 1, 2 at level 3, 3 at level 5, etc.
    }
}

// Conditional scaling (Monk Flurry of Blows)
{
    type: ModifierType.Penalty,
    appliesTo: ModifierAppliesToType.Attack,
    value: 0, // Base value (not used)
    bonusType: FeatureBonusType.Other,
    formulaParams: {
        formulaId: FormulaId.CONDITIONAL_SCALING,
        thresholds: "1,4,8", // Level thresholds
        values: "-2,-1,0"    // Penalty values
        // Results in: -2 penalty at levels 1-3, -1 at levels 4-7, 0 at level 8+
    }
}

// Attribute-dependent (Wild Empathy)
{
    type: ModifierType.Bonus,
    appliesTo: ModifierAppliesToType.Skill,
    appliesToId: SKILL_MAP.HANDLE_ANIMAL,
    value: 3, // Base bonus
    bonusType: FeatureBonusType.Other,
    formulaParams: {
        formulaId: FormulaId.ATTRIBUTE_BASED,
        attributeId: ABILITY_MAP.CHA, // Add Charisma modifier
        // Results in: 3 + CHA modifier
    }
}
```

## Common Anti-Patterns

### **❌ Don't Use Modifiers For**
- Non-numeric abilities (use Special Effects)
- Player choices (use Choices)
- Complex rules (use Special Effects)

**Exception**: Class skills use `ModifierType.Other` with `value: 0` as a special container pattern. Languages use similar patterns with `FeatureAppliesToType.Language`. See **[class-skills.md](class-skills.md)** and **[languages.md](languages.md)** for details.

### **❌ Don't Use Choices For**
- Simple numeric bonuses (use Modifiers)
- Automatic abilities (use Special Effects)
- Prerequisites (use Prerequisites)

### **❌ Don't Use Special Effects For**
- Numeric bonuses (use Modifiers)
- Player selections (use Choices)
- Requirements (use Prerequisites)

## Decision Checklist

Before implementing a feature, ask:

1. **Is it a number?** → Use FeatureModifier
2. **Does the player choose?** → Use FeatureChoice
3. **Is it a special ability?** → Use FeatureSpecialEffect
4. **Is it a requirement?** → Use FeaturePrerequisite
5. **Is it a class skill?** → Use FeatureModifier (special container pattern)
6. **Is it a language?** → Use FeatureModifier (container pattern)
7. **Does it scale with level?** → Use FeatureModifier with Formula
8. **Is it complex?** → Combine multiple components

## Key Principles

1. **Use the right tool for the job**
2. **Keep components focused and single-purpose**
3. **Combine components for complex features**
4. **Follow D&D stacking rules for bonus types**
5. **Make choices clear and unambiguous**
6. **Document special effects thoroughly**
7. **Use formulas for level-based scaling**
8. **Use conditional scaling for complex progressions**

For complete examples, see **[class-features.md](class-features.md)** and **[racial-features.md](racial-features.md)**.

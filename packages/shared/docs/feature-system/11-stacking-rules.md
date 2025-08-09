# 11 — Bonus Stacking Rules

*This document explains how the feature system implements D&D 3.5's bonus stacking rules using `FeatureBonusType`.*

## Core Stacking Rules

D&D 3.5 has specific rules about which bonuses stack and which don't. The feature system implements these through the `bonusType` field on `FeatureModifier`.

### Stacking Behavior by Bonus Type

Based on official D&D 3.x rules, bonuses fall into three categories:

#### **Always Stacking Bonuses**
These bonuses always add together:
- **Dodge** (`FeatureBonusType.Dodge = 0`) - Never from spells/magic items
- **Circumstance** (`FeatureBonusType.Circumstance = 1`) - Unless from same source
- **Untyped bonuses** (`bonusType = null`) - Always stack

#### **Non-Stacking Bonuses** (Highest Applies)
These bonuses never stack with the same type:
- **Enhancement** (`FeatureBonusType.Enhancement = 2`)
- **Morale** (`FeatureBonusType.Morale = 3`) 
- **Competence** (`FeatureBonusType.Competence = 4`)
- **Alchemical** (`FeatureBonusType.Alchemical = 5`)
- **Armor** (`FeatureBonusType.Armor = 6`)
- **Deflection** (`FeatureBonusType.Deflection = 7`)
- **Insight** (`FeatureBonusType.Insight = 8`)
- **Luck** (`FeatureBonusType.Luck = 9`)
- **Natural Armor** (`FeatureBonusType.NaturalArmor = 10`)
- **Profane** (`FeatureBonusType.Profane = 11`)
- **Racial** (`FeatureBonusType.Racial = 12`)
- **Resistance** (`FeatureBonusType.Resistance = 13`)
- **Sacred** (`FeatureBonusType.Sacred = 14`)
- **Shield** (`FeatureBonusType.Shield = 15`)
- **Size** (`FeatureBonusType.Size = 16`)

### Implementation Logic

When multiple `FeatureModifier` entries apply to the same target:

1. **Always stacking bonuses** (Dodge, Circumstance, Untyped): Add all together
2. **Non-stacking bonuses**: Only the highest value applies per type
3. **Source checking**: Circumstance bonuses from the same source don't stack
4. **Special cases**: Ability modifiers always stack with typed bonuses

## Examples

### Example 1: Multiple STR bonuses
```
Character has:
- Belt of Giant Strength +4 (Enhancement)
- Bull's Strength spell +4 (Enhancement)  
- Barbarian Rage +4 (Morale)
- Magic Weapon +1 (Enhancement to attack)

Result for STR:
- Enhancement: max(4, 4) = 4 (Belt OR spell, not both)
- Morale: 4 (Rage stacks with Enhancement)
- Total STR bonus: +8
```

### Example 2: AC bonuses (Comprehensive)
```
Character has:
- Bracers of Armor +2 (Armor bonus)
- Ring of Protection +1 (Deflection bonus) 
- Combat Expertise +2 (Dodge bonus)
- Shield +2 (Shield bonus)
- Barkskin +3 (Natural Armor enhancement)
- Fighting defensively +2 (Dodge bonus)
- Dexterity modifier +3 (Ability modifier - always stacks)

Total AC bonus: 2 + 1 + 2 + 2 + 3 + 2 + 3 = +15
(All different bonus types, Dodge bonuses stack together)
```

### Example 3: Attack roll bonuses
```
Character has:
- Magic Weapon +1 (Enhancement)
- Masterwork Weapon +1 (Enhancement)
- Bless spell +1 (Morale)

Result:
- Enhancement: max(1, 1) = 1 (Magic OR masterwork, not both)
- Morale: 1 (Bless stacks)
- Total attack bonus: +2
```

## Implementation Guidelines

### In FeatureModifier Creation
```typescript
// Enhancement bonus to STR
{
  type: ModifierType.Bonus,
  appliesTo: ModifierAppliesToType.Attribute,
  appliesToId: 1, // STR
  value: 4,
  bonusType: FeatureBonusType.Enhancement
}

// Dodge bonus to AC  
{
  type: ModifierType.Bonus,
  appliesTo: ModifierAppliesToType.AC,
  value: 2,
  bonusType: FeatureBonusType.Dodge
}
```

### In Runtime Calculation
```typescript
function applyBonuses(modifiers: FeatureModifier[]) {
  const bonusByType = new Map<number, number>();
  let dodgeTotal = 0;
  let untypedTotal = 0;
  
  for (const mod of modifiers) {
    if (mod.bonusType === FeatureBonusType.Dodge) {
      dodgeTotal += mod.value;
    } else if (mod.bonusType === null) {
      untypedTotal += mod.value;
    } else {
      const existing = bonusByType.get(mod.bonusType) || 0;
      bonusByType.set(mod.bonusType, Math.max(existing, mod.value));
    }
  }
  
  return untypedTotal + dodgeTotal + Array.from(bonusByType.values()).reduce((a, b) => a + b, 0);
}
```

## Special Cases

### Size Bonuses
Size modifiers are typically untyped bonuses that stack with everything except other size bonuses from the same source.

### Circumstance Bonuses  
Circumstance bonuses (not explicitly typed) usually stack unless they come from the same circumstance.

### Penalties
Penalties follow the same stacking rules as bonuses but in reverse (most negative applies for typed penalties, all penalties stack for untyped).

## Common Pitfalls

1. **Multiple enhancement items**: Belt +4 and Gloves +2 both enhance STR → only +4 applies
2. **Masterwork + Magic**: Both are enhancement bonuses to attack → don't stack
3. **Spell + Item conflicts**: Many spells provide enhancement bonuses that don't stack with magic items
4. **Temporary vs Permanent**: Doesn't affect stacking - a temporary enhancement doesn't stack with permanent enhancement

---

**Related Documentation**: See `07-examples.md` for practical examples of implementing these rules in common D&D scenarios.

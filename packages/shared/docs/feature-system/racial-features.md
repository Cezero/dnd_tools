# Racial Feature Examples

*Quick reference for racial feature implementation patterns. For comprehensive examples, see **[examples.md](./examples.md)**.*

## Overview

This document provides quick reference patterns for implementing racial features. For complete, working examples with full implementation details, see the **[examples.md](./examples.md)** file.

## Quick Reference Patterns

### **Ability Score Adjustments**
```typescript
// Racial ability bonuses/penalties
{
    type: ModifierType.Bonus,
    appliesTo: ModifierAppliesToType.Ability,
    appliesToId: ABILITY_MAP.CON,
    value: 2,
    bonusType: FeatureBonusType.Racial
}
```

### **Conditional Bonuses**
```typescript
// Bonuses that only apply in specific situations
{
    type: ModifierType.Bonus,
    appliesTo: ModifierAppliesToType.AC,
    value: 4,
    bonusType: FeatureBonusType.Dodge,
    conditions: [{ conditionType: FeatureModifierConditionType.other, conditionValue: 2 }] // vs giants
}
```

### **Weapon Familiarity**
```typescript
// Special effects for weapon familiarity
{
    effectType: FeatureSpecialEffectType.WeaponFamiliarity,
    numericValue: WEAPON_ID.DWARVEN_WARAXE,
    key: 'weapon_familiarity',
    value: 'dwarven_waraxe'
}
```

### **Weapon Proficiencies**
```typescript
// Special effects for weapon proficiencies
{
    effectType: FeatureSpecialEffectType.Proficiency,
    numericValue: WEAPON_ID.LONGSWORD,
    key: 'weapon_proficiency',
    value: 'longsword'
}
```

## Implementation Examples

For complete, working examples of racial features including:
- **Dwarf Racial Traits** (ability adjustments, conditional bonuses, weapon familiarity)
- **Elf Racial Traits** (ability adjustments, conditional bonuses, weapon proficiencies)

See **[examples.md](./examples.md)** for comprehensive implementation details.

## Related Documentation

- **[Modifier System](./modifier-system.md)** - Comprehensive modifier system reference
- **[Choice System](./choice-system.md)** - Choice system implementation guide
- **[Formula System](./formula-system.md)** - Formula system reference


# Class Feature Examples

*Quick reference for class feature implementation patterns. For comprehensive examples, see **[examples.md](./examples.md)**.*

## Overview

This document provides quick reference patterns for implementing class features. For complete, working examples with full implementation details, see the **[examples.md](./examples.md)** file.

## Quick Reference Patterns

### **Conditional Modifiers**

Modifiers that only apply in specific situations, such as during combat or when certain conditions are met. These modifiers use condition types to determine when they should be applied, allowing for complex feature mechanics that respond to game state.

**Common Use Cases**: Combat bonuses that only apply during specific situations, ability score bonuses that activate under certain conditions, or skill bonuses that only apply to specific types of checks.

**Implementation Pattern**: Create a modifier with the appropriate type and value, then add conditions that specify when the modifier should be applied. Conditions can include trigger types, attack types, character states, or other game conditions.

### **Formula-Based Scaling**

Modifiers that scale with character level or other factors, providing dynamic progression that changes as the character advances. These modifiers link to formula parameters that define the mathematical relationship between level and effect.

**Common Use Cases**: Attack bonuses that improve with level, damage that scales with character progression, or ability scores that increase over time.

**Implementation Pattern**: Create a modifier with a formula parameters reference, then define the formula parameters with the appropriate mathematical relationship. Formulas can be linear, conditional, or based on other character statistics.

### **Choice Integration**

Features that offer player selections, allowing for character customization and specialization. These features provide choices between different options, such as feats, skills, or other abilities.

**Common Use Cases**: Bonus feat selections, skill focus choices, weapon specialization options, or ability score improvements.

**Implementation Pattern**: Create choice objects with appropriate types and behaviors, then define the available options and selection rules. Choices can be single selections, multiple selections, or resource allocations.

### **Resource Tracking**

Features that track uses per day, per encounter, or other limited resources. These features provide abilities that can be used a limited number of times, requiring strategic resource management.

**Common Use Cases**: Daily spell-like abilities, encounter powers, limited-use class features, or temporary bonuses.

**Implementation Pattern**: Create quantity modifiers that track the number of uses available, then implement logic to consume and restore these uses as appropriate.

## Implementation Examples

For complete, working examples of class features including:
- **Barbarian Rage** (conditional modifiers, resource tracking)
- **Fighter Bonus Feats** (choice system, formula scaling)
- **Monk Flurry of Blows** (conditional scaling, attack penalties)
- **Monk Unarmed Strike** (size-based damage, conditional scaling)
- **Monk Diamond Soul** (value plus level formula)
- **Monk Wholeness of Body** (level times value formula)
- **Druid Wild Shape** (uses per day, special effects)

See **[examples.md](./examples.md)** for comprehensive implementation details.

## Related Documentation

- **[Modifier System](./modifier-system.md)** - Comprehensive modifier system reference
- **[Choice System](./choice-system.md)** - Choice system implementation guide
- **[Formula System](./formula-system.md)** - Formula system reference
- **[Component Selection](./component-selection.md)** - When to use each component type

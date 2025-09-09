# Feature System Implementation Examples

*Comprehensive examples for implementing D&D features using the unified FeatureEntity approach.*

## 📋 **Overview**

This document provides practical examples for implementing various D&D features using the feature system's unified entity approach. These examples demonstrate real-world usage patterns and serve as templates for implementing new features.

The feature system uses a unified `FeatureEntity` model that handles all feature effects through type-based differentiation, replacing the previous separate modifier, choice, and special effect models.

**Related Documentation:**
- **[Database Schema](database-schema.md)** - Feature system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Feature system validation rules and schemas
- **[Static Data](static-data.md)** - Feature system enums and types
- **[Formula System](formula-system.md)** - Formula system reference

## 🎯 **Quick Reference Patterns**

### **Entity Type Selection Guide**

The unified `FeatureEntity` model uses the `EntityType` enum to differentiate between different types of effects:

- **Bonus Entities** (`EntityType.Bonus`): Numeric bonuses and penalties to attributes, skills, saves, AC, attack, damage
- **Quantity Entities** (`EntityType.Quantity`): Counts, amounts, resources (uses per day, extra attacks, damage dice)
- **Replacement Entities** (`EntityType.Replacement`): Replace existing values (unarmed damage, base speed)
- **Choice Entities** (`EntityType.Choice`): Player selections and allocations
- **Other Entities** (`EntityType.Other`): Special abilities that don't fit other categories

### **Common Implementation Patterns**

#### **Conditional Bonuses**
Bonuses that only apply in specific situations, such as during combat or when certain conditions are met. These entities use `FeatureEntityCondition` to determine when they should be applied.

**Common Use Cases**: Combat bonuses that only apply during specific situations, ability score bonuses that activate under certain conditions, or skill bonuses that only apply to specific types of checks.

**Implementation Pattern**: Create a bonus entity with the appropriate type and value, then add conditions that specify when the entity should be applied. Conditions can include trigger types, attack types, character states, or other game conditions.

#### **Formula-Based Scaling**
Entities that scale with character level or other factors, providing dynamic progression that changes as the character advances. These entities link to `FeatureFormulaParams` that define the mathematical relationship between level and effect.

**Common Use Cases**: Attack bonuses that improve with level, damage that scales with character progression, or ability scores that increase over time.

**Implementation Pattern**: Create an entity with a formula parameters reference, then define the formula parameters with the appropriate mathematical relationship. Formulas can be linear, conditional, or based on other character statistics.

#### **Player Choice Integration**
Features that offer player selections, allowing for character customization and specialization. These features provide choices between different options, such as feats, skills, or other abilities.

**Common Use Cases**: Bonus feat selections, skill focus choices, weapon specialization options, or ability score improvements.

**Implementation Pattern**: Create choice entities with appropriate types and behaviors, then define the available options and selection rules. Choices can be single selections, multiple selections, or resource allocations.

#### **Resource Tracking**
Features that track uses per day, per encounter, or other limited resources. These features provide abilities that can be used a limited number of times, requiring strategic resource management.

**Common Use Cases**: Daily spell-like abilities, encounter powers, limited-use class features, or temporary bonuses.

**Implementation Pattern**: Create quantity entities that track the number of uses available, then implement logic to consume and restore these uses as appropriate.

## 🎯 **Class Feature Examples**

### **Barbarian Rage**

**D&D 3.5 Rule**: At 1st level, a barbarian can rage once per day. While raging, the barbarian gains +4 to Strength and Constitution, +2 to Will saves, and -2 to AC. The rage lasts for 3 + Constitution modifier rounds.

**Implementation Approach**: This feature requires multiple entities to represent different aspects of the rage ability:

1. **Strength Bonus Entity**: A bonus entity that applies +4 to Strength when rage is active
2. **Constitution Bonus Entity**: A bonus entity that applies +4 to Constitution when rage is active  
3. **Will Save Bonus Entity**: A bonus entity that applies +2 to Will saves when rage is active
4. **AC Penalty Entity**: A bonus entity that applies -2 to AC when rage is active
5. **Uses Per Day Entity**: A quantity entity that tracks 1 use per day

**Conditional Application**: All bonus entities use `FeatureEntityCondition` with `FeatureEntityConditionType.trigger` to ensure they only apply when the rage is active.

**Source File**: See actual implementation in `apps/backend/src/features/featureSystem/featureSystemService.ts`

### **Fighter Bonus Feats**

**D&D 3.5 Rule**: Fighters gain bonus feats at 1st, 2nd, 4th, 6th, 8th, 10th, 12th, 14th, 16th, 18th, and 20th level. These feats must be selected from the fighter bonus feat list.

**Implementation Approach**: This feature uses choice entities to represent the player's feat selections:

1. **Choice Entity**: An entity with `EntityType.Choice` that allows players to select from available feats
2. **Formula Integration**: Uses `FeatureFormulaParams` with `FormulaId.EVERY_N_LEVELS` to determine when choices are available
3. **Feat Filtering**: Uses `filterType` to restrict choices to fighter bonus feats only

**Choice Behavior**: The choice entity uses `EntityAppliesToType.Feat` to indicate it's selecting feats, and the `filterType` field restricts the available options.

**Source File**: See actual implementation in `apps/backend/src/features/featureSystem/featureSystemService.ts`

## 🎯 **Racial Feature Examples**

### **Dwarf Racial Traits**

**D&D 3.5 Rule**: Dwarves gain +2 Constitution, +2 to saves against poison, +4 dodge bonus to AC against giants, and weapon familiarity with dwarven waraxes and dwarven urgroshes.

**Implementation Approach**: This feature requires multiple entities to represent different racial abilities:

1. **Constitution Bonus Entity**: A bonus entity that applies +2 to Constitution
2. **Poison Save Bonus Entity**: A bonus entity that applies +2 to saves against poison
3. **Giant AC Bonus Entity**: A bonus entity that applies +4 dodge bonus to AC against giants
4. **Weapon Familiarity Entity**: An other entity that grants weapon familiarity with specific weapons

**Conditional Application**: The giant AC bonus uses `FeatureEntityCondition` to ensure it only applies against giant-type creatures.

**Source File**: See actual implementation in `apps/backend/src/features/featureSystem/featureSystemService.ts`

## 🎯 **Direct Feat Grant Examples**

### **Ranger Track Feature**

**D&D 3.5 Rule**: Rangers automatically gain the Track feat at 1st level.

**Implementation Approach**: This feature uses an other entity to represent the direct feat grant:

1. **Feat Grant Entity**: An entity with `EntityType.Other` that grants a specific feat
2. **Feat Reference**: Uses `EntityAppliesToType.Feat` to indicate it's granting a feat
3. **Specific Feat**: Uses `appliesToId` to reference the specific Track feat

**Display Integration**: The formatter system automatically displays "Granted Feat: Track" instead of showing the feat ID.

**Source File**: See actual implementation in `apps/backend/src/features/featureSystem/featureSystemService.ts`

## 🎯 **Best Practices**

### **Entity Type Selection**

When implementing features, choose the appropriate entity type based on the effect:

- **Use Bonus Entities** for numeric bonuses and penalties
- **Use Quantity Entities** for counts, amounts, and resources
- **Use Replacement Entities** for replacing existing values
- **Use Choice Entities** for player selections
- **Use Other Entities** for special abilities and proficiencies

### **Conditional Application**

Use `FeatureEntityCondition` to ensure entities only apply when appropriate:

- **Trigger Conditions**: For abilities that can be activated (rage, flurry of blows)
- **Attack Type Conditions**: For bonuses that only apply to specific attack types
- **Character State Conditions**: For bonuses that depend on character state
- **Opponent Type Conditions**: For bonuses that only apply against specific creature types

### **Formula Integration**

Use `FeatureFormulaParams` for features that scale with level or other factors:

- **Linear Scaling**: For steady progression patterns
- **Conditional Scaling**: For threshold-based progression
- **Value Plus Level**: For base value plus level calculations
- **Every N Levels**: For abilities that improve at regular intervals

### **Cross-System Integration**

Ensure proper integration with other systems:

- **Feat Integration**: Use `EntityAppliesToType.Feat` for direct feat grants
- **Item Integration**: Use `EntityAppliesToType.Item` for item-related effects
- **Feature Integration**: Use `EntityAppliesToType.Feature` for feature-to-feature relationships

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Feature system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Feature system validation rules and schemas
- **[Static Data](static-data.md)** - Feature system enums and types
- **[Formula System](formula-system.md)** - Formula system reference
- **[Common Pitfalls](common-pitfalls.md)** - Common mistakes and how to avoid them
- **[Testing Patterns](testing-patterns.md)** - Testing strategies for feature implementations

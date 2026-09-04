# Feat System Static Data

*Complete documentation for the feat system static data, including enums, types, and reference data structures.*

## 📋 **Overview**

The feat system static data provides enums, types, and utility functions that define the behavior and capabilities of the feat system. This includes feat types and various utility functions for feat calculations and management.

Benefits and prerequisites are now handled through the unified Feature system, which uses `EntityAppliesToType`, `EntityType`, and `FeaturePrerequisiteType` enums. See [Feature System Static Data](../feature-system/static-data.md) for details.

The static data layer serves as the foundation for type safety, validation, and consistent behavior across the feat system. It defines the vocabulary and rules that govern how feats interact with characters and other game systems.

**Source File**: `packages/shared/static-data/src/FeatData.ts`

## 🏗️ **Core Enums and Types**

### **Feat Types**

Defines the different categories of feats available in the game system.

**Purpose**: Identifies the different types of feats, providing categorization and organizational structure for feat management.

**Values**:
- **`GENERAL` (1)**: General feats available to all characters
- **`ITEM_CREATION` (2)**: Feats for creating magical items
- **`METAMAGIC` (3)**: Feats for modifying spellcasting

**Usage**: Used throughout the application for feat categorization, filtering, and display.

**Source File**: `packages/shared/static-data/src/FeatData.ts` (FeatType enum)

### **Feature System Enums**

Feat benefits and prerequisites now use the unified Feature system enums:

- **`EntityAppliesToType`**: Defines what the benefit applies to (Skill, SavingThrow, Attack, etc.)
- **`EntityType`**: Defines the type of entity (Bonus, Other, etc.)
- **`FeaturePrerequisiteType`**: Defines prerequisite types (AbilityScore, SkillRanks, Feat, etc.)
- **`AttackBonusAppliesTo`**: Special enum for attack bonus contexts (MainHand, OffHand, Thrown)

**AttackBonusAppliesTo Enum**:
- **`MainHand (1)`: Attack bonus applies only to main hand in two-weapon fighting
- **`OffHand (2)`: Attack bonus applies only to off hand in two-weapon fighting
- **`Thrown (3)`: Attack bonus applies only to thrown weapons

**Usage**: Used in FeatureEntity entries with `appliesTo: EntityAppliesToType.Attack` and `appliesToSubId: AttackBonusAppliesTo.MainHand` (or OffHand/Thrown) to specify special attack bonus contexts.

**Example**: Two-Weapon Fighting feat has two FeatureEntity entries:
- Main hand: `appliesTo: Attack`, `appliesToSubId: MainHand`, `value: 2`
- Off hand: `appliesTo: Attack`, `appliesToSubId: OffHand`, `value: 6`

**Oversized Two-Weapon Fighting** does not add another attack bonus. It uses `EntityAppliesToType.TwoWeaponFightingOffHandTreatAsLight` so a one-handed off-hand uses the existing light-off-hand +2/+2 TWF reduction:
- `type: EntityType.Other`
- `appliesTo: TwoWeaponFightingOffHandTreatAsLight`
- `appliesToId: WEAPON_TYPE_ENUM.OneHandedMeleeWeapon`

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (AttackBonusAppliesTo and EntityAppliesToType enums)

**Related Documentation**: [Feature System Static Data](../feature-system/static-data.md)

## 🔧 **Feat Data Structures**

### **Feat Type Maps**

The primary data structures containing feat type definitions with their characteristics.

**Purpose**: Provides comprehensive maps of all feat types with their defining characteristics.

**Key Maps**:

**FEAT_TYPES**: Complete map of all feat types
- **Purpose**: Provides complete map of all available feat types
- **Usage**: Used for feat type selection and display

**FEAT_TYPE_BY_ID**: ID to name mapping for feat types
- **Purpose**: Provides ID to name mapping for feat types
- **Usage**: Used for feat type lookup and display

**FEAT_TYPE_LIST**: Complete list of all feat types
- **Purpose**: Provides complete list of all available feat types
- **Usage**: Used for feat type selection and iteration

**FEAT_TYPE_SELECT_LIST**: Feat type list for selection components
- **Purpose**: Provides feat type list formatted for selection components
- **Usage**: Used in feat type selection dropdowns and lists

**Source File**: `packages/shared/static-data/src/FeatData.ts` (Feat type definitions)

## 🎯 **Feat Calculations**

### **Feat Type Integration**

The feat type integration system for determining feat categories and behavior.

**Purpose**: Calculate and validate feat types for feat categorization and behavior.

**Calculation Pattern**:
- **Feat Lookup**: Look up feat by ID in feat data
- **Type Reference**: Extract type ID from feat definition
- **Type Validation**: Validate type ID against feat type system
- **Type Calculation**: Use feat type for categorization and behavior

**Example**: Feat ID 1 has type ID 1 (General), so it's categorized as a general feat

**Source File**: `packages/shared/static-data/src/FeatData.ts` (Feat type integration)

### **Feature System Integration**

Feat benefits and prerequisites are now calculated through the Feature system:

**Benefit Calculation**: Uses FeatureEntity entries with EntityAppliesToType to determine what the benefit applies to
**Prerequisite Validation**: Uses FeaturePrerequisite entries with FeaturePrerequisiteType to validate requirements
**Attack Bonus Contexts**: Uses AttackBonusAppliesTo enum with appliesToSubId to handle special attack bonus contexts

**Related Documentation**: [Feature System Static Data](../feature-system/static-data.md)

## 🔗 **Integration with Other Systems**

### **Character System Integration**

The feat system integrates with the character system through feat selection and prerequisites:

**Feat Selection**: Characters can select and acquire feats
**Prerequisite Validation**: Character abilities and skills are validated against feat prerequisites
**Feat Benefits**: Character abilities are modified by feat benefits
**Feat Progression**: Character feat progression follows level and class rules

**Integration Pattern**: The feat system provides the framework for character feat management, with character abilities and skills determining feat access and progression.

**Related Documentation**: [Character Management Static Data](../character-management/static-data.md)


### **Feature System Integration**

The feat system is fully integrated with the Feature system for managing benefits and prerequisites:

**Feat Benefits**: All feat benefits are defined through FeatureEntity entries using EntityAppliesToType
**Feat Prerequisites**: All feat prerequisites are defined through FeaturePrerequisite entries using FeaturePrerequisiteType
**Unified System**: Feats use the same Feature system as races, classes, and other sources

**Integration Pattern**: Each feat has one or more FeatureProgression entries (sourceType: Feat) that define its benefits and prerequisites through FeatureEntity and FeaturePrerequisite entries.

**Related Documentation**: [Feature System Static Data](../feature-system/static-data.md)

## 🔧 **Performance Considerations**

### **Data Access Patterns**

The feat system static data is optimized for efficient access:

**Map-based Access**: Direct access to feat data by ID
**Cached Lookups**: Frequently accessed data is cached for performance
**Lazy Loading**: Data is loaded only when needed
**Memory Management**: Efficient memory usage for large datasets

### **Calculation Optimization**

Feat calculations are optimized for performance:

**Pre-calculated Values**: Common calculations are pre-computed
**Formula Caching**: Formula results are cached to avoid recalculation
**Efficient Algorithms**: Optimized algorithms for feat calculations
**Batch Processing**: Multiple calculations are processed in batches

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Feat system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Feat system validation rules and schemas
- **[Backend Implementation](backend-implementation.md)** - Feat system backend implementation
- **[Frontend Components](frontend-components.md)** - Feat system frontend implementation
- **[Character Management Static Data](../character-management/static-data.md)** - Character system enums and types
- **[Ability System Static Data](../ability-system/static-data.md)** - Ability system enums and types
- **[Skill System Static Data](../skill-system/static-data.md)** - Skill system enums and types
- **[Feature System Static Data](../feature-system/static-data.md)** - Feature system enums and types
- **[Static Data Patterns](../application-overview/static-data.md)** - Shared static data patterns and conventions

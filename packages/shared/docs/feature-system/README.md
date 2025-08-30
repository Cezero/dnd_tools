# Feature System Documentation

*Comprehensive documentation for the feature system, covering database schema, validation rules, static data, backend implementation, and frontend components.*

## 📋 **Overview**

The Feature System is the core mechanism for defining and managing character abilities, bonuses, and special effects. It provides a flexible framework for creating class features, racial traits, feat benefits, and other character capabilities through a combination of modifiers, choices, and special effects.

The system enables complex character customization by allowing features to scale with level, provide player choices, and integrate with other game systems like spellcasting and character progression.

**Source Files**: 
- Database: `apps/backend/prisma/schema.prisma` (Feature-related models)
- Validation: `packages/shared/schema/src/feature.ts`
- Static Data: `packages/shared/static-data/src/FeatureData.ts`, `packages/shared/static-data/src/FormulaDefinitions.ts`
- Backend: `apps/backend/src/features/featureSystem/` (featureSystemService.ts, featureSystemController.ts, featureSystemRoutes.ts, types.ts)
- Frontend: `apps/frontend/src/components/feature-system/` (FeatureEdit.tsx, FeatureDetail.tsx, FeatureProgressionDetailEdit.tsx, FeaturesTab.tsx, FeatureSystemApi.ts, FeatureSystemService.ts, ArrayPairEditor.tsx, types.ts)

## 🏗️ **Documentation Structure**

This documentation follows a layered approach, with each layer building upon the previous one:

### **Core Documentation**
- **[Architecture Principles](architecture-principles.md)** - System architecture and design principles
- **[Database Schema](database-schema.md)** - Prisma models, relationships, and constraints
- **[Validation Schemas](validation-schemas.md)** - Zod validation rules and type safety
- **[Static Data](static-data.md)** - Enums, types, and formula definitions
- **[Backend Implementation](backend-implementation.md)** - Services, controllers, and API endpoints
- **[Frontend Components](frontend-components.md)** - React components and user interface

### **Specialized Documentation**
- **[Formula System](formula-system.md)** - Mathematical formulas for feature progression
- **[Modifier System](modifier-system.md)** - Bonus, quantity, and replacement modifiers
- **[Choice System](choice-system.md)** - Feature choices and selection mechanics
- **[Special Effects](special-effects.md)** - Special abilities and unique features

### **Implementation Examples**
- **[Examples](examples.md)** - Comprehensive examples for implementing D&D features
- **[Class Features](class-features.md)** - Quick reference patterns for class features
- **[Racial Features](racial-features.md)** - Quick reference patterns for racial traits
- **[Monk Class Features Implementation](monk-class-features-implementation.md)** - Detailed monk feature implementation

### **Implementation Guides**
- **[Implementation Status](implementation-status.md)** - Current implementation status and completion tracking
- **[Feature Progression Management](feature-progression-management.md)** - Managing feature progression and scaling
- **[Bulk Operations](bulk-operations.md)** - Individual and bulk feature operations for classes and races
- **[Runtime Calculation](runtime-calculation.md)** - Real-time feature calculation and application
- **[Testing Patterns](testing-patterns.md)** - Testing strategies and patterns for feature system

### **Specialized Systems**
- **[Class Skills](class-skills.md)** - Class skill system and proficiency management
- **[Languages](languages.md)** - Language system and automatic language grants
- **[Weapon Familiarity System](weapon-familiarity-system.md)** - Weapon proficiency and familiarity mechanics
- **[Feature-Linked Skill Analogs](feature-linked-skill-analogs.md)** - Skill-like features and analogs
- **[Direct Feat Grants](direct-feat-grants.md)** - Direct feat granting through features
- **[Component Selection](component-selection.md)** - Component selection and configuration patterns

### **Troubleshooting and Best Practices**
- **[Common Pitfalls](common-pitfalls.md)** - Common issues and how to avoid them

### **Formatter System Integration**
- **[Formatting README](formatting/README.md)** - Overview of the formatter system integration
- **[Formatting Usage Guidelines](formatting/usage-guidelines.md)** - Guidelines for using the formatter system
- **[Formatting Refactoring Strategy](formatting/refactoring-strategy.md)** - Strategy for refactoring the formatter system
- **[Formatting Final Implementation Summary](formatting/final-implementation-summary.md)** - Summary of formatter system implementation
- **[Formatting Architecture Decisions](formatting/architecture-decisions.md)** - Key architectural decisions and future extensibility

## 🎯 **Key Concepts**

### **Feature Components**

**Features**: Core definitions with names, descriptions, and prerequisites that represent character abilities or traits.

**Feature Progressions**: Level-based feature grants that define when and how features are acquired, including modifiers and choices.

**Modifiers**: Numerical bonuses, quantities, and replacements that provide mechanical benefits to characters.

**Choices**: Player selections for feats, features, or other options that allow character customization.

**Special Effects**: Unique abilities like proficiencies, favored enemies, and other non-numeric effects.

### **System Integration**

**Class Integration**: Features granted by character classes that scale with class level and provide class-specific abilities.

**Race Integration**: Features granted by character races that provide racial traits and abilities.

**Spellcasting Integration**: Features that grant spellcasting abilities or modify spellcasting mechanics.

**Character Integration**: Features applied to character statistics and abilities during character creation and advancement.

### **Formula System**

**Linear Scaling**: Features that scale linearly with character level, providing steady progression.

**Conditional Scaling**: Features with level-based thresholds that provide benefits at specific levels.

**Ability-Based**: Features dependent on ability scores that scale with character attributes.

**Dice Scaling**: Features with dice-based progression that provide variable benefits.

## 🔧 **System Architecture**

### **Database Layer**

The feature system uses several interconnected models to represent complex feature relationships:

**Feature**: Core feature definitions with names, descriptions, and prerequisites
**FeatureProgression**: Level-based feature grants with source tracking
**FeatureModifier**: Numerical bonuses and effects with formula support
**FeatureChoice**: Player selection options with behavior patterns
**FeatureSpecialEffect**: Unique abilities and non-numeric effects

**Source File**: `apps/backend/prisma/schema.prisma` (Feature-related models)

### **Validation Layer**

The system uses Zod schemas to ensure type safety and data integrity across all operations:

**Feature Schemas**: Validation for core feature data and relationships
**Progression Schemas**: Validation for level-based feature grants
**Modifier Schemas**: Validation for numerical bonuses and effects
**Choice Schemas**: Validation for player selection options
**Formula Schemas**: Validation for mathematical progression calculations

**Source File**: `packages/shared/schema/src/feature.ts`

### **Static Data Layer**

The system provides enums and types that define the feature system's capabilities:

**Modifier Types**: Bonus, quantity, replacement, and other modifier categories
**Applies To Types**: Targets for modifier application (abilities, skills, saves, etc.)
**Choice Types**: Different types of player choices (feats, features, etc.)
**Formula Types**: Mathematical progression patterns and calculations

**Source Files**: 
- `packages/shared/static-data/src/FeatureData.ts` (enums and types)
- `packages/shared/static-data/src/FormulaDefinitions.ts` (formula definitions)

### **Business Logic Layer**

The backend provides comprehensive services for feature management:

**Feature Management**: Create, read, update, and delete feature definitions
**Progression Management**: Handle level-based feature grants and scaling
**Modifier Calculation**: Calculate and apply feature modifiers to characters
**Choice Management**: Handle player selections and choice validation

**Source Files**: 
- `apps/backend/src/features/featureSystem/featureSystemService.ts`
- `apps/backend/src/features/featureSystem/featureSystemController.ts`
- `apps/backend/src/features/featureSystem/featureSystemRoutes.ts`
- `apps/backend/src/features/featureSystem/types.ts`

### **Presentation Layer**

The frontend provides user interfaces for feature management and interaction:

**Feature Creation**: Interfaces for creating and editing feature definitions
**Progression Setup**: Tools for configuring level-based feature grants
**Modifier Configuration**: Interfaces for setting up numerical bonuses and effects
**Choice Management**: User interfaces for managing player selection options

**Source Files**: 
- `apps/frontend/src/components/feature-system/FeatureEdit.tsx`
- `apps/frontend/src/components/feature-system/FeatureDetail.tsx`
- `apps/frontend/src/components/feature-system/FeatureProgressionDetailEdit.tsx`
- `apps/frontend/src/components/feature-system/FeaturesTab.tsx`
- `apps/frontend/src/components/feature-system/FeatureSystemApi.ts`
- `apps/frontend/src/components/feature-system/FeatureSystemService.ts`
- `apps/frontend/src/components/feature-system/ArrayPairEditor.tsx`
- `apps/frontend/src/components/feature-system/types.ts`

## 🔗 **Common Patterns**

### **Bonus Modifiers**

Bonus modifiers provide numerical improvements to character statistics:

**Combat Bonuses**: Attack bonuses, damage bonuses, armor class improvements
**Skill Bonuses**: Skill check improvements and skill point bonuses
**Saving Throw Bonuses**: Improvements to fortitude, reflex, and will saves
**Ability Bonuses**: Temporary or permanent ability score improvements

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (ModifierType and FeatureBonusType enums)

### **Quantity Modifiers**

Quantity modifiers provide counts, amounts, and resources:

**Movement Speed**: Base movement speed and speed modifications
**Uses Per Day**: Daily uses of abilities and special powers
**Hit Dice**: Temporary hit points and healing resources
**Targets**: Number of targets for area effects and abilities

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (ModifierAppliesToType enum)

### **Replacement Modifiers**

Replacement modifiers replace existing values with new ones:

**Damage Replacement**: Replace unarmed damage or weapon damage
**Speed Replacement**: Replace base movement speed
**Ability Replacement**: Replace ability score calculations
**Skill Replacement**: Replace skill rank calculations

### **Feature Choices**

Feature choices allow players to customize their characters:

**Feat Choices**: Select feats from available options
**Feature Choices**: Choose between different feature options
**Skill Choices**: Select skills for specialization
**Equipment Choices**: Choose equipment or proficiencies

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (FeatureChoiceType and FeatureChoiceBehavior enums)

## 🔧 **Integration Examples**

### **Class Feature Integration**

Class features are granted through feature progressions that scale with class level:

**Level-Based Grants**: Features granted at specific class levels
**Scaling Modifiers**: Modifiers that improve with class level
**Class Choices**: Choices specific to class abilities and specializations
**Prerequisites**: Requirements based on class level and abilities

**Source File**: `apps/backend/prisma/schema.prisma` (FeatureProgression model with classId)

### **Racial Feature Integration**

Racial features provide innate abilities and traits:

**Automatic Features**: Features granted automatically to all members of a race
**Ability Adjustments**: Racial ability score modifications
**Skill Bonuses**: Racial skill bonuses and specializations
**Special Abilities**: Unique racial abilities and traits

**Source File**: `apps/backend/prisma/schema.prisma` (FeatureProgression model with raceId)

### **Spellcasting Integration**

Features can grant or modify spellcasting abilities:

**Spellcasting Progression**: Features that grant spellcasting abilities
**Spell Modifications**: Features that modify spell effects or casting
**Spell Choices**: Features that allow spell selection
**Casting Enhancements**: Features that improve spellcasting abilities

**Source File**: `apps/backend/prisma/schema.prisma` (SpellcastingLink model)

## 🎯 **Best Practices**

### **Feature Design**

**Clear Naming**: Use descriptive names that clearly indicate the feature's purpose
**Comprehensive Descriptions**: Provide detailed descriptions of feature effects and mechanics
**Appropriate Prerequisites**: Set prerequisites that make sense for the feature's power level
**Progression Planning**: Consider how the feature will scale with character level

### **Modifier Usage**

**Appropriate Types**: Choose the correct modifier type for the intended effect
**Bonus Stacking**: Use appropriate bonus types that follow stacking rules
**Specific Targets**: Apply modifiers to specific, well-defined targets
**Formula Integration**: Use formulas for complex progression patterns

### **Choice Implementation**

**Clear Labels**: Provide clear, descriptive labels for choice options
**Appropriate Behavior**: Set behavior patterns that match the choice's purpose
**Validation**: Implement proper validation for choice prerequisites
**Dependencies**: Consider choice dependencies and interactions

### **Performance Considerations**

**Efficient Queries**: Use optimized database queries for feature lookups
**Caching Strategy**: Cache frequently accessed feature data
**Formula Optimization**: Optimize formula calculations for performance
**UI Responsiveness**: Minimize unnecessary re-renders in user interfaces

## 🛠️ **Troubleshooting**

### **Common Issues**

**Modifier Not Applying**: Check appliesTo and appliesToId values for correct targeting
**Formula Not Calculating**: Verify formula parameters and level thresholds
**Choice Not Working**: Ensure choice type and behavior are correctly configured
**Validation Errors**: Check Zod schema requirements and data types

### **Debugging Tips**

**Feature System Tools**: Use built-in debugging tools for feature analysis
**Database Relationships**: Verify database relationships and foreign keys
**Enum Values**: Check that enum values match expected types
**Formula Testing**: Test formulas with known inputs to verify calculations

## 📚 **Related Documentation**

- **[Class System](../class-system/)** - Class feature integration and progression
- **[Race System](../race-system/)** - Racial feature integration and traits
- **[Spell System](../spell-system/)** - Spellcasting feature integration
- **[Character Management](../character-management/)** - Character feature application and calculation

## 🔗 **API Reference**

For detailed API documentation, see:
- **[Backend Implementation](backend-implementation.md)** - Service methods and endpoints
- **[Validation Schemas](validation-schemas.md)** - Request/response schemas
- **[Frontend Components](frontend-components.md)** - Component APIs and props

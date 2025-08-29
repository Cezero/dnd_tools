# Feature System Database Schema

*Comprehensive documentation of the Prisma database schema for the feature system, including all models, relationships, and constraints.*

## 📋 **Overview**

The feature system database schema provides a flexible framework for defining character features, their progression, modifiers, choices, and special effects. The schema supports complex feature interactions while maintaining data integrity through proper relationships and constraints.

The schema is designed to handle the complexity of D&D character features, including level-based progression, player choices, mathematical formulas, and integration with other game systems like spellcasting and character advancement.

**Source File**: `prisma/schema.prisma` (Feature-related models)

## 🏗️ **Core Models**

### **Feature Model**

The core feature definition containing basic information about character abilities, traits, and capabilities.

**Purpose**: Defines the fundamental characteristics of a feature, including its name, description, and prerequisites.

**Key Fields**:
- **`id`**: Unique identifier for the feature
- **`slug`**: URL-friendly identifier for the feature
- **`name`**: Human-readable feature name
- **`description`**: Detailed feature description and mechanics

**Relationships**:
- **`progressions`**: Links to feature progressions that grant this feature
- **`featureChoice`**: Links to choices that reference this feature
- **`prerequisites`**: Links to prerequisites required for this feature

**Usage**: Core feature definitions that are referenced by progressions, choices, and other feature system components.

**Source File**: `prisma/schema.prisma` (Feature model)

### **FeatureProgression Model**

Defines when and how features are granted to characters, including level-based progression and source tracking.

**Purpose**: Connects features to their sources (classes, races) and defines when they are acquired during character advancement.

**Key Fields**:
- **`sourceType`**: Type of source (Race, Class, Template)
- **`level`**: Character level when feature is granted
- **`featureId`**: Reference to the feature being granted
- **`classId`**: Reference to class (if class-granted)
- **`raceId`**: Reference to race (if race-granted)

**Relationships**:
- **`class`**: Links to class that grants this feature
- **`race`**: Links to race that grants this feature
- **`feature`**: Links to the feature being granted
- **`choices`**: Links to choices associated with this progression
- **`spellcasting`**: Links to spellcasting abilities (if applicable)
- **`effects`**: Links to special effects for this progression
- **`modifiers`**: Links to modifiers for this progression

**Usage**: The central model that connects features to their sources and defines progression patterns.

**Source File**: `prisma/schema.prisma` (FeatureProgression model)

## 🔧 **Modifier Models**

### **FeatureModifier Model**

Defines numerical bonuses, quantities, and replacements that features provide to character statistics.

**Purpose**: Provides the mechanical effects of features through various types of modifiers that can be applied to character statistics.

**Key Fields**:
- **`featureProgressionId`**: Links to the feature progression
- **`type`**: Type of modifier (Bonus, Quantity, Replacement, Other)
- **`value`**: Numerical value of the modifier
- **`bonusType`**: Bonus type for stacking rules (if applicable)
- **`appliesTo`**: What the modifier applies to (ability, skill, save, etc.)
- **`appliesToId`**: Specific target ID (if applicable)
- **`formulaParamsId`**: Reference to formula parameters (if formula-based)

**Relationships**:
- **`featureProgression`**: Links to the feature progression
- **`conditions`**: Links to conditional requirements
- **`formulaParams`**: Links to formula parameters (if formula-based)

**Usage**: Defines the mechanical effects of features, including bonuses, quantities, and replacements that modify character statistics.

**Source File**: `prisma/schema.prisma` (FeatureModifier model)

### **FeatureModifierCondition Model**

Defines conditional requirements for when modifiers apply, such as attack types or character states.

**Purpose**: Provides conditional logic for when modifiers should be applied, allowing for complex feature mechanics.

**Key Fields**:
- **`featureModifierId`**: Links to the feature modifier
- **`conditionType`**: Type of condition (trigger, attack type, character size, etc.)
- **`conditionValue`**: Value for the condition

**Relationships**:
- **`featureModifier`**: Links to the feature modifier

**Usage**: Enables conditional application of modifiers based on various game conditions and character states.

**Source File**: `prisma/schema.prisma` (FeatureModifierCondition model)

### **FeatureFormulaParams Model**

Defines mathematical formulas for feature progression, including intervals, thresholds, and ability dependencies.

**Purpose**: Supports complex mathematical progression patterns for features that scale with character level or ability scores.

**Key Fields**:
- **`formulaId`**: Reference to the formula type
- **`interval`**: Interval for progression calculations
- **`formulaStartLevel`**: Starting level for formula calculations
- **`abilityId`**: Reference to ability score (if ability-dependent)
- **`thresholds`**: Level thresholds for conditional progression
- **`values`**: Values corresponding to thresholds

**Relationships**:
- **`featureModifier`**: Links to feature modifiers using this formula
- **`featureChoice`**: Links to feature choices using this formula

**Usage**: Enables complex mathematical progression patterns for features that need to scale with character advancement.

**Source File**: `prisma/schema.prisma` (FeatureFormulaParams model)

## 🎯 **Choice Models**

### **FeatureChoice Model**

Defines player selection options for features, including feat choices, feature choices, and other customizable elements.

**Purpose**: Provides player choice mechanics for features that allow customization and character personalization.

**Key Fields**:
- **`progressionId`**: Links to the feature progression
- **`label`**: Human-readable label for the choice
- **`pickCount`**: Number of choices the player can make
- **`type`**: Type of choice (Feat, Feature, etc.)
- **`behavior`**: Behavior pattern for the choice (Single, Multiple, etc.)
- **`featId`**: Reference to feat (if feat choice)
- **`featureId`**: Reference to feature (if feature choice)
- **`formulaParamsId`**: Reference to formula parameters (if formula-based)
- **`filterType`**: Type of filtering for choice options

**Relationships**:
- **`featureProgression`**: Links to the feature progression
- **`feat`**: Links to feat (if feat choice)
- **`feature`**: Links to feature (if feature choice)
- **`formulaParams`**: Links to formula parameters (if formula-based)
- **`characterFeatureChoice`**: Links to character choices

**Usage**: Enables player choice mechanics for features, allowing customization of character abilities and traits.

**Source File**: `prisma/schema.prisma` (FeatureChoice model)

## ✨ **Special Effect Models**

### **FeatureSpecialEffect Model**

Defines unique abilities and non-numeric effects that features provide, such as proficiencies, favored enemies, and special abilities.

**Purpose**: Handles non-numeric effects that don't fit into the modifier system, such as proficiencies, special abilities, and unique traits.

**Key Fields**:
- **`progressionId`**: Links to the feature progression
- **`effectType`**: Type of special effect
- **`key`**: Key for the effect (if applicable)
- **`value`**: String value for the effect (if applicable)
- **`numericValue`**: Numeric value for the effect (if applicable)
- **`featId`**: Reference to feat (if feat-related)
- **`itemId`**: Reference to item (if item-related)

**Relationships**:
- **`featureProgression`**: Links to the feature progression
- **`feat`**: Links to feat (if feat-related)
- **`item`**: Links to item (if item-related)

**Usage**: Handles special abilities, proficiencies, and other non-numeric effects that features can provide.

**Source File**: `prisma/schema.prisma` (FeatureSpecialEffect model)

## 📋 **Prerequisite Models**

### **FeaturePrerequisite Model**

Defines requirements that must be met before a feature can be acquired, such as ability scores, skill ranks, or other features.

**Purpose**: Ensures that features are only available when appropriate prerequisites are met, maintaining game balance and logical progression.

**Key Fields**:
- **`featureId`**: Links to the feature
- **`type`**: Type of prerequisite (ability score, skill rank, etc.)
- **`skillId`**: Reference to skill (if skill-based)
- **`minValue`**: Minimum value required

**Relationships**:
- **`feature`**: Links to the feature
- **`skill`**: Links to skill (if skill-based)

**Usage**: Defines requirements that must be met before features can be acquired, ensuring proper character progression.

**Source File**: `prisma/schema.prisma` (FeaturePrerequisite model)

## 🔗 **Integration Models**

### **CharacterFeatureChoice Model**

Tracks player choices for feature options, storing the specific selections made by players for their characters.

**Purpose**: Records the specific choices that players make for their characters, enabling character customization and persistence.

**Key Fields**:
- **`characterId`**: Links to the character
- **`featureChoiceId`**: Links to the feature choice
- **`selectedValue`**: The value selected by the player
- **`selectedValueId`**: ID of the selected value (if applicable)

**Relationships**:
- **`character`**: Links to the character
- **`featureChoice`**: Links to the feature choice

**Usage**: Tracks player choices for feature options, enabling character customization and choice persistence.

**Source File**: `prisma/schema.prisma` (CharacterFeatureChoice model)

## 🏗️ **Schema Relationships**

The feature system follows the standard **Relationship Patterns** documented in the [Database Schema Patterns](../application-overview/database-schema.md#relationship-patterns).

### **Feature-Specific Relationships**

#### **Core Relationships**
**Feature → FeatureProgression**: Features are granted through progressions
**FeatureProgression → FeatureModifier**: Progressions provide modifiers
**FeatureProgression → FeatureChoice**: Progressions can include choices
**FeatureProgression → FeatureSpecialEffect**: Progressions can include special effects
**FeatureModifier → FeatureFormulaParams**: Modifiers can use formulas
**FeatureModifier → FeatureModifierCondition**: Modifiers can have conditions

#### **Integration Relationships**
**FeatureProgression → Class**: Class-granted features
**FeatureProgression → Race**: Race-granted features
**FeatureProgression → SpellcastingLink**: Spellcasting features
**FeatureChoice → Feat**: Feat choices
**FeatureSpecialEffect → Feat**: Feat-related special effects
**FeatureSpecialEffect → Item**: Item-related special effects

## 📊 **Data Integrity**

The feature system follows the standard **Data Integrity** patterns documented in the [Database Schema Patterns](../application-overview/database-schema.md#data-integrity).

### **Feature-Specific Constraints**

**Unique Constraints**: Feature slugs must be unique
**Foreign Key Constraints**: All relationships are properly constrained
**Nullable Fields**: Appropriate fields are nullable based on usage
**Cascade Deletes**: Proper cascade behavior for related records

## 🔧 **Migration Considerations**

The feature system follows the standard **Schema Evolution** patterns documented in the [Database Schema Patterns](../application-overview/database-schema.md#schema-evolution).

### **Feature-Specific Performance Optimization**

**Efficient Queries**: Optimized for feature lookups and calculations
**Relationship Performance**: Efficient joins between related models
**Index Strategy**: Strategic indexing for common query patterns
**Caching Support**: Schema supports effective caching strategies

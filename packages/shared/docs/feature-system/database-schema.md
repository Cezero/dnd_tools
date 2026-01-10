# Feature System Database Schema

*Comprehensive documentation of the Prisma database schema for the feature system, including all models, relationships, and constraints.*

## 📋 **Overview**

The feature system database schema provides a flexible framework for defining character features, their progression, and their effects. The schema uses a unified entity approach where all feature effects (modifiers, choices, special effects) are handled through a single `FeatureEntity` model, providing consistency and flexibility.

The schema is designed to handle the complexity of D&D character features, including level-based progression, player choices, mathematical formulas, and integration with other game systems like spellcasting and character advancement.

**Source File**: `apps/backend/prisma/schema.prisma` (Feature-related models)

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
- **`prerequisites`**: Links to prerequisites required for this feature

**Usage**: Core feature definitions that are referenced by progressions and other feature system components.

**Source File**: `apps/backend/prisma/schema.prisma` (Feature model)

### **FeatureProgression Model**

Defines when and how features are granted to characters, including level-based progression and source tracking.

**Purpose**: Connects features to their sources (classes, races, domains, feats, companions) and defines when they are acquired during character advancement.

**Key Fields**:
- **`id`**: Unique identifier for the feature progression
- **`sourceType`**: Type of source (Race, Class, Template, ClassVariant, Domain, Feat, Companion) - references @FeatureSourceType enum
- **`level`**: Character level when feature is granted
- **`featureId`**: Reference to the feature being granted
- **`classId`**: Reference to class (if class-granted)
- **`raceId`**: Reference to race (if race-granted)
- **`variantOverrideId`**: Reference to class variant override (if variant-granted)
- **`domainId`**: Reference to domain (if domain-granted)
- **`featId`**: Reference to feat (if feat-granted)
- **`companionId`**: Reference to companion (if companion-granted)

**Relationships**:
- **`class`**: Links to class that grants this feature
- **`race`**: Links to race that grants this feature
- **`classVariantOverride`**: Links to class variant override (if applicable)
- **`domain`**: Links to domain that grants this feature (if applicable)
- **`feat`**: Links to feat that grants this feature (if applicable)
- **`companion`**: Links to companion that grants this feature (if applicable)
- **`feature`**: Links to the feature being granted
- **`spellcasting`**: Links to spellcasting abilities (if applicable)
- **`entities`**: Links to feature entities that define the feature's effects
- **`characterFeatureChoice`**: Links to character choices for this progression
- **`displayConditions`**: Links to display conditions for this progression

**Constraints**:
- **Indexes**: `@@index([featId])`, `@@index([companionId])` - Indexed for efficient queries by feat and companion

**Usage**: The central model that connects features to their sources and defines progression patterns. Supports multiple source types including classes, races, domains, feats, and companions.

**Related Documentation**: [Companion System](../monster-system/database-schema.md) for Companion model details (companion-granted features)

**Source File**: `apps/backend/prisma/schema.prisma` (FeatureProgression model)

## 🔧 **Unified Entity Model**

### **FeatureEntity Model**

The unified model that handles all types of feature effects including modifiers, choices, and special effects through a single, flexible structure.

**Purpose**: Provides a consistent approach for defining all feature effects, whether they are numerical bonuses, player choices, or special abilities.

**Key Fields**:
- **`id`**: Unique identifier for the feature entity
- **`progressionId`**: Links to the feature progression
- **`appliesTo`**: What the entity applies to (ability, skill, save, etc.) - references @EntityAppliesToType enum
- **`appliesToId`**: Specific target ID (if applicable)
- **`appliesToSubId`**: Sub-target ID for complex applications
- **`formulaParamsId`**: Reference to formula parameters (if formula-based)
- **`groupingId`**: Groups related entities together (default: 0)
- **`type`**: Type of entity (Bonus, Quantity, Replacement, Other, Choice, Allocation) - references @EntityType enum. Note: Proficiencies use EntityType.Other with appliesTo = EntityAppliesToType.Proficiency
- **`value`**: Numerical value of the entity (if applicable)
- **`bonusType`**: Bonus type for stacking rules (if applicable)
- **`displayInDetail`**: Whether to display this entity in detailed views (default: true)
- **`filterType`**: Type of filtering for choice options (if applicable)

**Relationships**:
- **`featureProgression`**: Links to the feature progression
- **`conditions`**: Links to conditional requirements
- **`formulaParams`**: Links to formula parameters (if formula-based)

**Usage**: The unified approach allows a single feature to have multiple effects of different types, all managed through one consistent model. This eliminates the need for separate modifier, choice, and special effect models while providing the same functionality.

**Real-World Example**: The Monk's "AC Bonus" feature (FeatureProgression ID 16592) demonstrates the unified entity approach with a single entity that applies Wisdom modifier to AC (type: 0=Bonus, appliesTo: 3=AC, formulaParams: ability-based calculation).

**Source File**: `apps/backend/prisma/schema.prisma` (FeatureEntity model)

### **FeatureEntityCondition Model**

Defines conditional requirements for when feature entities apply, such as attack types or character states.

**Purpose**: Provides conditional logic for when feature entities should be applied, allowing for complex feature mechanics.

**Key Fields**:
- **`id`**: Unique identifier for the condition
- **`featureEntityId`**: Links to the feature entity
- **`conditionType`**: Type of condition (trigger, attack type, character size, etc.)
- **`conditionValue`**: Value for the condition

**Relationships**:
- **`featureEntity`**: Links to the feature entity

**Usage**: Enables conditional application of feature entities based on various game conditions and character states.

**Source File**: `apps/backend/prisma/schema.prisma` (FeatureEntityCondition model)

### **FeatureFormulaParams Model**

Defines mathematical formulas for feature progression, including intervals, thresholds, and ability dependencies.

**Purpose**: Supports complex mathematical progression patterns for features that scale with character level or ability scores.

**Key Fields**:
- **`id`**: Unique identifier for the formula parameters
- **`formulaId`**: Reference to the formula type
- **`interval`**: Interval for progression calculations
- **`formulaStartLevel`**: Starting level for formula calculations
- **`abilityId`**: Reference to ability score (if ability-dependent)
- **`thresholds`**: Level thresholds for conditional progression (stored as string)
- **`values`**: Values corresponding to thresholds (stored as string)
- **`includeProgressionLevel`**: Whether to include progression level in calculations (default: true)
- **`valuesRepresent`**: What the values represent (conditional scaling value type)
- **`cumulative`**: Whether values accumulate over time (default: false)

**Relationships**:
- **`featureEntity`**: Links to feature entities using this formula

**Usage**: Enables complex mathematical progression patterns for features that need to scale with character advancement.

**Real-World Examples**: 
- **Monk AC Bonus**: Uses formulaId 7 with abilityId 5 (Wisdom) to add Wisdom modifier to AC
- **Monk Unarmed Damage**: Uses formulaId 3 with thresholds [1,4,8,12,16,20] and values ["1d6","1d8","1d10","2d6","2d8","2d10"] for damage progression
- **Monk Flurry of Blows**: Uses formulaId 3 with thresholds [1,5,9] and values [-2,-1,0] for attack penalty reduction

**Source File**: `apps/backend/prisma/schema.prisma` (FeatureFormulaParams model)

## 📋 **Prerequisite Models**

### **FeaturePrerequisite Model**

Defines requirements that must be met before a feature can be acquired, such as ability scores, skill ranks, or other features.

**Purpose**: Ensures that features are only available when appropriate prerequisites are met, maintaining game balance and logical progression.

**Key Fields**:
- **`id`**: Unique identifier for the prerequisite
- **`featureId`**: Links to the feature
- **`type`**: Type of prerequisite (ability score, skill rank, etc.)
- **`skillId`**: Reference to skill (if skill-based)
- **`minValue`**: Minimum value required

**Relationships**:
- **`feature`**: Links to the feature
- **`skill`**: Links to skill (if skill-based)

**Usage**: Defines requirements that must be met before features can be acquired, ensuring proper character progression.

**Source File**: `apps/backend/prisma/schema.prisma` (FeaturePrerequisite model)

## 🔗 **Integration Models**

### **CharacterFeatureChoice Model**

Tracks player choices for feature options, storing the specific selections made by players for their characters.

**Purpose**: Records the specific choices that players make for their characters, enabling character customization and persistence.

**Key Fields**:
- **`id`**: Unique identifier for the character feature choice
- **`characterId`**: Links to the character
- **`progressionId`**: Links to the feature progression
- **`advancementId`**: Links to the character advancement
- **`key`**: Key identifier for the choice (may be replaced with specific identifiers)
- **`value`**: The value selected by the player (may be replaced with specific identifiers)
- **`choiceIndex`**: Index of the choice (if applicable)

**Relationships**:
- **`featureProgression`**: Links to the feature progression
- **`advancement`**: Links to the character advancement

**Usage**: Tracks player choices for feature options, enabling character customization and choice persistence.

**Source File**: `apps/backend/prisma/schema.prisma` (CharacterFeatureChoice model)

## 🏗️ **Schema Relationships**

The feature system follows the standard **Relationship Patterns** documented in the [Database Schema Patterns](../application-overview/database-schema.md#relationship-patterns).

### **Feature-Specific Relationships**

#### **Core Relationships**
**Feature → FeatureProgression**: Features are granted through progressions
**FeatureProgression → FeatureEntity**: Progressions provide entities that define all feature effects
**FeatureEntity → FeatureFormulaParams**: Entities can use formulas for complex calculations
**FeatureEntity → FeatureEntityCondition**: Entities can have conditional requirements

#### **Integration Relationships**
**FeatureProgression → Class**: Class-granted features
**FeatureProgression → Race**: Race-granted features
**FeatureProgression → Domain**: Domain-granted features
**FeatureProgression → Feat**: Feat-granted features
**FeatureProgression → Companion**: Companion-granted features (e.g., familiar benefits, animal companion benefits)
**FeatureProgression → SpellcastingLink**: Spellcasting features
**FeatureProgression → CharacterFeatureChoice**: Player choices for feature options
**CharacterFeatureChoice → CharacterAdvancement**: Choices are tied to character advancement

## 📊 **Data Integrity**

The feature system follows the standard **Data Integrity** patterns documented in the [Database Schema Patterns](../application-overview/database-schema.md#data-integrity).

### **Feature-Specific Constraints**

**Unique Constraints**: 
- Feature slugs must be unique
- Character feature choices are unique per advancement, progression, and key combination

**Foreign Key Constraints**: All relationships are properly constrained with appropriate cascade behavior

**Nullable Fields**: Appropriate fields are nullable based on usage:
- `classId`, `raceId`, `variantOverrideId`, `domainId`, `featId`, and `companionId` in FeatureProgression (only one source type should be set per progression)
- `appliesToId`, `appliesToSubId`, `formulaParamsId` in FeatureEntity (optional based on entity type)
- `value`, `bonusType`, `filterType` in FeatureEntity (optional based on entity type)

**Cascade Deletes**: Proper cascade behavior for related records to maintain data integrity

## 🔧 **Migration Considerations**

The feature system follows the standard **Schema Evolution** patterns documented in the [Database Schema Patterns](../application-overview/database-schema.md#schema-evolution).

### **Feature-Specific Performance Optimization**

**Efficient Queries**: Optimized for feature lookups and calculations through the unified entity approach
**Relationship Performance**: Efficient joins between related models, especially FeatureProgression → FeatureEntity relationships
**Index Strategy**: Strategic indexing for common query patterns:
- Feature lookups by slug
- FeatureProgression queries by source type and level
- FeatureProgression queries by featId and companionId (indexed for efficient companion/feat feature lookups)
- FeatureEntity queries by progression and type
**Caching Support**: Schema supports effective caching strategies for feature calculations and character progression

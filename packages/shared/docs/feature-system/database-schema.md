# Feature System Database Schema

*Comprehensive documentation of the Prisma database schema for the feature system, including all models, relationships, and constraints.*

## 📋 **Overview**

The feature system database schema provides a flexible framework for defining character features, their progression, and their effects. The schema uses a unified entity approach where all feature effects (modifiers, choices, special effects) are handled through a single `FeatureEntity` model, providing consistency and flexibility.

The schema is designed to handle the complexity of D&D character features, including level-based progression, player choices, mathematical formulas, and integration with other game systems like spellcasting and character advancement.

**Source File**: `apps/backend/prisma/schema.prisma` (Feature-related models)

## 🏗️ **Core Models**

### **Feature Model**

The unified feature model that combines feature definitions with progression information, defining when and how features are granted to characters.

**Purpose**: Defines the fundamental characteristics of a feature, including its name, description, prerequisites, and progression details (level, source type, and source references).

**Key Fields**:
- **`id`**: Unique identifier for the feature (inherited from the old FeatureProgression.id)
- **`slug`**: URL-friendly identifier for the feature
- **`name`**: Human-readable feature name
- **`description`**: Detailed feature description and mechanics
- **`summary`**: Optional summary text that can contain template placeholders
- **`displayInCharacterSheet`**: Whether to display this feature on the character viewer Features list and PDF special abilities (default: true). Shared chassis features (`good-bab`, save progressions, hit dice) are `false`.
- **`sourceType`**: Type of source (Race, Class, Template, ClassVariant, Domain, Feat, Companion, Edition) - references @FeatureSourceType enum
- **`level`**: Character level when feature is granted
- **`domainId`**: Reference to domain (if domain-granted)
- **`featId`**: Reference to feat (if feat-granted)
- **`companionId`**: Reference to companion (if companion-granted)
- **`editionId`**: Reference to edition (if edition-granted)

**Relationships**:
- **`classes`**: Many-to-many relationship via `FeatureClassMap` - links to classes that grant this feature (for shared features)
- **`races`**: Many-to-many relationship via `FeatureRaceMap` - links to races that grant this feature (for shared features)
- **`domain`**: Links to domain that grants this feature (if applicable)
- **`feat`**: Links to feat that grants this feature (if applicable)
- **`companion`**: Links to companion that grants this feature (if applicable)
- **`prerequisites`**: Links to prerequisites required for this feature
- **`transformationForms`**: Links to transformation form eligibility
- **`spellcasting`**: Links to spellcasting abilities (if applicable)
- **`characterFeatureChoice`**: Links to character choices for this feature
- **`displayConditions`**: Links to display conditions via `FeatureCondition`
- **`entities`**: Links to feature entities that define the feature's effects

**Constraints**:
- **Indexes**: `@@index([featId])`, `@@index([companionId])` - Indexed for efficient queries by feat and companion

**Usage**: The central model that defines features and their progression patterns. Supports multiple source types including classes, races, domains, feats, companions, and editions. Features can be shared across multiple classes or races via the many-to-many junction tables.

**Migration Note**: This model is the result of merging the previous `Feature` and `FeatureProgression` models. The new `Feature.id` uses the old `FeatureProgression.id` to maintain foreign key relationships.

**Related Documentation**: [Companion System](../monster-system/database-schema.md) for Companion model details (companion-granted features)

**Source File**: `apps/backend/prisma/schema.prisma` (Feature model)

## 🔧 **Unified Entity Model**

### **FeatureEntity Model**

The unified model that handles all types of feature effects including modifiers, choices, and special effects through a single, flexible structure.

**Purpose**: Provides a consistent approach for defining all feature effects, whether they are numerical bonuses, player choices, or special abilities.

**Key Fields**:
- **`id`**: Unique identifier for the feature entity
- **`featureId`**: Links to the feature
- **`appliesTo`**: What the entity applies to (ability, skill, save, etc.) - references @EntityAppliesToType enum
- **`appliesToId`**: Specific target ID (if applicable)
- **`appliesToSubId`**: Sub-target ID for complex applications
- **`formulaParamsId`**: Reference to formula parameters (if formula-based)
- **`groupingId`**: Groups related entities together (default: 0)
- **`type`**: Type of entity (Bonus, Quantity, Replacement, Base, Other, Choice, Allocation) - references @EntityType enum. Note: Class and race mechanics use EntityType.Base. Proficiencies use EntityType.Other with appliesTo = EntityAppliesToType.Proficiency
- **`value`**: Numerical value of the entity (if applicable)
- **`bonusType`**: Bonus type for stacking rules (if applicable)
- **`displayInDetail`**: Whether to display this entity in class/race detail narrative lists (default: true). Chassis formula entities (BAB, saves, spells per day) are `false`. The character viewer Features list omits a feature when every entity is hidden this way.
- **`showFullProgression`**: When true, progression previews show every level from formula start to 20 instead of only transition levels (default: false)
- **`filterType`**: Type of filtering for choice options (if applicable)

**Relationships**:
- **`feature`**: Links to the feature
- **`conditions`**: Links to conditional requirements via `FeatureEntityCondition`
- **`formulaParams`**: Links to formula parameters (if formula-based)

**Usage**: The unified approach allows a single feature to have multiple effects of different types, all managed through one consistent model. This eliminates the need for separate modifier, choice, and special effect models while providing the same functionality.

**Real-World Example**: The Monk's "AC Bonus" feature (Feature ID 16592) demonstrates the unified entity approach with a single entity that applies Wisdom modifier to AC (type: 0=Bonus, appliesTo: 3=AC, formulaParams: ability-based calculation).

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
- **`featureLevelZero`**: Returns 0 for levels below formulaStartLevel instead of null or scalingValue (default: false)
- **`valuesRepresent`**: What the values represent (conditional scaling value type)
- **`cumulative`**: Whether values accumulate over time (default: false)
- **`divisor`**: Divisor value for division-based formulas (e.g., floor(level / divisor))
- **`baseValue`**: Base value to add for division-based formulas (e.g., floor(level / divisor) + baseValue)
- **`startingValue`**: Starting value for formulas that need a different starting value than the increment (e.g., EVERY_N_LEVELS). Defaults to entity.value if null.
- **`maxValue`**: Optional cap for formulas that have an upper bound. Unused by spell-table `CONDITIONAL_SCALING` columns.

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
- **`featureId`**: Links to the feature
- **`advancementId`**: Links to the character advancement
- **`featureEntityId`**: Links to the feature entity that defines the choice
- **`appliesToId`**: The selected value ID (e.g., feat ID, domain ID)
- **`appliesToSubId`**: Sub-value ID for complex choices (e.g., feat sub-ID)
- **`choiceIndex`**: Index of the choice (if applicable)
- **`choiceGroupId`**: Identifier for grouping related choices
- **`choiceData`**: JSON data for complex choice information
- **`linkedChoiceGroupId`**: Identifier for linked choice groups (if applicable)

**Relationships**:
- **`feature`**: Links to the feature
- **`featureEntity`**: Links to the feature entity that defines the choice
- **`advancement`**: Links to the character advancement

**Constraints**:
- **Unique Constraint**: `@@unique([advancementId, featureId, featureEntityId])` - Ensures one choice per advancement/feature/entity combination

**Usage**: Tracks player choices for feature options, enabling character customization and choice persistence.

**Source File**: `apps/backend/prisma/schema.prisma` (CharacterFeatureChoice model)

### **CharacterFeatureUses Model**

Tracks usage counts for feature abilities that have limited uses per day, week, level, or encounter.

**Purpose**: Records current and maximum uses for feature abilities that have usage limits, enabling resource tracking and management.

**Key Fields**:
- **`id`**: Unique identifier for the feature uses record
- **`characterId`**: Links to the character
- **`featureId`**: Links to the feature
- **`featureEntityId`**: Links to the feature entity that defines the uses
- **`currentUses`**: Current number of uses remaining (default: 0)
- **`maxUses`**: Maximum number of uses available
- **`frequency`**: Frequency of use reset (PER_DAY, PER_WEEK, PER_LEVEL, PER_ENCOUNTER) - references @USES_FREQUENCY_ENUM

**Relationships**:
- **`character`**: Links to the character
- **`feature`**: Links to the feature
- **`featureEntity`**: Links to the feature entity that defines the uses

**Constraints**:
- **Unique Constraint**: `@@unique([characterId, featureId, featureEntityId])` - Ensures one uses record per character/feature/entity combination
- **Indexes**: `@@index([characterId])` - Indexed for efficient queries by character

**Usage**: Tracks usage counts for feature abilities with limited uses, enabling resource management and tracking.

**Source File**: `apps/backend/prisma/schema.prisma` (CharacterFeatureUses model)

### **FeatureCondition Model**

Defines conditional requirements for when features apply, such as attack types or character states.

**Purpose**: Provides conditional logic for when features should be applied, allowing for complex feature mechanics.

**Key Fields**:
- **`id`**: Unique identifier for the condition
- **`featureId`**: Links to the feature
- **`conditionType`**: Type of condition (trigger, attack type, character size, etc.) - references @FeatureEntityConditionType enum
- **`conditionValue`**: Value for the condition

**Relationships**:
- **`feature`**: Links to the feature

**Constraints**:
- **Indexes**: `@@index([featureId])` - Indexed for efficient queries by feature

**Usage**: Enables conditional application of features based on various game conditions and character states.

**Source File**: `apps/backend/prisma/schema.prisma` (FeatureCondition model)

### **FeatureClassMap Model**

Junction table for the many-to-many relationship between features and classes, enabling features to be shared across multiple classes.

**Purpose**: Enables features to be linked to multiple classes, supporting reusable feature definitions and variant class creation.

**Key Fields**:
- **`featureId`**: Links to the feature
- **`classId`**: Links to the class

**Relationships**:
- **`feature`**: Links to the feature
- **`class`**: Links to the class

**Constraints**:
- **Primary Key**: `@@id([featureId, classId])` - Composite primary key
- **Indexes**: `@@index([classId])`, `@@index([featureId])` - Indexed for efficient queries in both directions

**Usage**: Enables features to be shared across multiple classes, supporting efficient variant class creation and data reuse.

**Source File**: `apps/backend/prisma/schema.prisma` (FeatureClassMap model)

### **FeatureRaceMap Model**

Junction table for the many-to-many relationship between features and races, enabling features to be shared across multiple races.

**Purpose**: Enables features to be linked to multiple races, supporting reusable feature definitions.

**Key Fields**:
- **`featureId`**: Links to the feature
- **`raceId`**: Links to the race

**Relationships**:
- **`feature`**: Links to the feature
- **`race`**: Links to the race

**Constraints**:
- **Primary Key**: `@@id([featureId, raceId])` - Composite primary key
- **Indexes**: `@@index([raceId])`, `@@index([featureId])` - Indexed for efficient queries in both directions

**Usage**: Enables features to be shared across multiple races, supporting efficient data reuse.

**Source File**: `apps/backend/prisma/schema.prisma` (FeatureRaceMap model)

## 🏗️ **Schema Relationships**

The feature system follows the standard **Relationship Patterns** documented in the [Database Schema Patterns](../application-overview/database-schema.md#relationship-patterns).

### **Feature-Specific Relationships**

#### **Core Relationships**
**Feature → FeatureEntity**: Features provide entities that define all feature effects
**Feature → FeatureCondition**: Features can have display conditions
**Feature → FeaturePrerequisite**: Features can have prerequisites
**FeatureEntity → FeatureFormulaParams**: Entities can use formulas for complex calculations
**FeatureEntity → FeatureEntityCondition**: Entities can have conditional requirements

#### **Integration Relationships**
**Feature → Class**: Class-granted features (via `FeatureClassMap` many-to-many relationship)
**Feature → Race**: Race-granted features (via `FeatureRaceMap` many-to-many relationship)
**Feature → Domain**: Domain-granted features (via `domainId` foreign key)
**Feature → Feat**: Feat-granted features (via `featId` foreign key)
**Feature → Companion**: Companion-granted features (via `companionId` foreign key)
**Feature → SpellcastingLink**: Spellcasting features (via `spellcasting` relationship)
**Feature → CharacterFeatureChoice**: Player choices for feature options
**Feature → CharacterFeatureUses**: Feature usage tracking
**CharacterFeatureChoice → CharacterAdvancement**: Choices are tied to character advancement

## 📊 **Data Integrity**

The feature system follows the standard **Data Integrity** patterns documented in the [Database Schema Patterns](../application-overview/database-schema.md#data-integrity).

### **Feature-Specific Constraints**

**Unique Constraints**: 
- Feature slugs must be unique
- Character feature choices are unique per advancement, feature, and entity combination (`@@unique([advancementId, featureId, featureEntityId])`)
- Character feature uses are unique per character, feature, and entity combination (`@@unique([characterId, featureId, featureEntityId])`)

**Foreign Key Constraints**: All relationships are properly constrained with appropriate cascade behavior

**Nullable Fields**: Appropriate fields are nullable based on usage:
- `domainId`, `featId`, `companionId`, and `editionId` in Feature (only one source type should be set per feature based on `sourceType`)
- `summary` in Feature (optional summary text)
- Class and race relationships are handled via many-to-many junction tables (`FeatureClassMap` and `FeatureRaceMap`)
- `appliesToId`, `appliesToSubId`, `formulaParamsId` in FeatureEntity (optional based on entity type)
- `value`, `bonusType`, `filterType` in FeatureEntity (optional based on entity type)
- `appliesToSubId`, `choiceIndex`, `choiceGroupId`, `choiceData`, `linkedChoiceGroupId` in CharacterFeatureChoice (optional based on choice type)

**Cascade Deletes**: Proper cascade behavior for related records to maintain data integrity

## 🔧 **Migration Considerations**

The feature system follows the standard **Schema Evolution** patterns documented in the [Database Schema Patterns](../application-overview/database-schema.md#schema-evolution).

### **Feature-Specific Performance Optimization**

**Efficient Queries**: Optimized for feature lookups and calculations through the unified entity approach
**Relationship Performance**: Efficient joins between related models, especially Feature → FeatureEntity relationships
**Index Strategy**: Strategic indexing for common query patterns:
- Feature lookups by slug (unique index)
- Feature queries by source type and level
- Feature queries by featId and companionId (indexed for efficient companion/feat feature lookups)
- FeatureEntity queries by featureId and type
- FeatureCondition queries by featureId (indexed)
- CharacterFeatureUses queries by characterId (indexed)
- FeatureClassMap and FeatureRaceMap queries (indexed in both directions)
**Caching Support**: Schema supports effective caching strategies for feature calculations and character progression

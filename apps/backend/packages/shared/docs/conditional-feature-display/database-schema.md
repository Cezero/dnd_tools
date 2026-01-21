# Conditional Feature Display Database Schema

*Complete documentation for the conditional feature display and dynamic summary system database schema, including all models, relationships, and constraints.*

## 📋 **Overview**

The conditional feature display system database schema provides a comprehensive framework for managing conditional feature display, dynamic summaries, companions, and transformation forms. The schema extends existing feature and choice models while introducing new models for companion management and transformation form eligibility.

**Source File**: [`apps/backend/prisma/schema.prisma`](../../../../apps/backend/prisma/schema.prisma) (Conditional feature display related models)

## 🏗️ **Extended Models**

### **Feature Model Extensions**

The `Feature` model has been extended with one new field to support conditional display, and the `summary` field now supports dynamic templates:

**New Fields**:
- **`displayInCharacterSheet`**: `Boolean @default(true)` - Controls whether the feature should be displayed on PDF character sheets. When `false`, the feature is hidden from character sheet output.

**Extended Fields**:
- **`summary`**: `String? @db.Text` - Summary text that can optionally contain template placeholders for dynamic summary generation. If the summary contains `{{placeholder}}` syntax, it will be parsed as a template and resolved at runtime. Otherwise, it is treated as static text.

**Relationships**:
- **`transformationForms`**: One-to-many relationship with `TransformationFormEligibility` - Links features to eligible monster forms for transformation abilities (e.g., Wild Shape).

**Source File**: [`apps/backend/prisma/schema.prisma`](../../../../apps/backend/prisma/schema.prisma) (Feature model)

**Related Documentation**: [Feature System Database Schema](../feature-system/database-schema.md) for complete Feature model documentation

### **CharacterFeatureChoice Model Extensions**

The `CharacterFeatureChoice` model has been extended with three new fields to support complex linked choices:

**New Fields**:
- **`choiceGroupId`**: `String?` - Groups related choices together (e.g., wizard school specialization group). Choices with the same `choiceGroupId` are considered part of the same choice group.
- **`choiceData`**: `Json?` - Stores complex choice data as JSON (e.g., `{specialization: "Necromancy", forbiddenSchools: ["Evocation", "Enchantment"]}`). Allows flexible storage of structured choice information.
- **`linkedChoiceGroupId`**: `String?` - Links this choice to another choice group. Used for dependent choices where one choice group's selection affects another (e.g., cleric energy type linking Turn/Rebuke and Spontaneous Casting).

**Source File**: [`apps/backend/prisma/schema.prisma`](../../../../apps/backend/prisma/schema.prisma) (CharacterFeatureChoice model)

**Related Documentation**: [Feature System Database Schema](../feature-system/database-schema.md) for complete CharacterFeatureChoice model documentation

### **FeatureProgression Model Extensions**

The `FeatureProgression` model has been extended with a new relationship:

**New Relationships**:
- **`displayConditions`**: One-to-many relationship with `FeatureProgressionCondition` - Conditions that determine whether a feature progression should be displayed.

**Source File**: [`apps/backend/prisma/schema.prisma`](../../../../apps/backend/prisma/schema.prisma) (FeatureProgression model)

**Related Documentation**: [Feature System Database Schema](../feature-system/database-schema.md) for complete FeatureProgression model documentation

## 🆕 **New Models**

### **FeatureProgressionCondition Model**

Defines display conditions at the feature progression level, allowing features to be conditionally displayed based on character attributes.

**Purpose**: Controls whether a feature progression should be displayed on character sheets based on character state (level, alignment, choices, etc.).

**Key Fields**:
- **`id`**: `Int @id @default(autoincrement())` - Unique identifier
- **`progressionId`**: `Int` - Reference to the feature progression
- **`conditionType`**: `Int` - Condition type (reuses `@FeatureEntityConditionType` enum from static data)
- **`conditionValue`**: `Int` - Value for the condition (e.g., minimum level, alignment ID)

**Relationships**:
- **`progression`**: Many-to-one relationship with `FeatureProgression` - The feature progression this condition applies to

**Constraints**:
- **Index**: `@@index([progressionId])` - Indexed for efficient queries by progression

**Usage**: Used to conditionally display features based on character attributes. For example, a feature might only be displayed if the character is level 5 or higher, or has a specific alignment.

**Source File**: [`apps/backend/prisma/schema.prisma`](../../../../apps/backend/prisma/schema.prisma) (FeatureProgressionCondition model)

**Related Documentation**: [Feature System Database Schema](../feature-system/database-schema.md) for FeatureEntityCondition model (uses same condition types)

### **Companion Model**

Defines available companions, familiars, and animal companions that characters can acquire.

**Purpose**: Stores companion definitions including links to monster statistics. Companion benefits are now managed through the unified Feature system.

**Key Fields**:
- **`id`**: `Int @id @default(autoincrement())` - Unique identifier
- **`type`**: `Int` - Companion type (references `@CompanionType` enum from static data: Familiar, AnimalCompanion, etc.)
- **`monsterId`**: `Int` - Reference to Monster model for base statistics (required)
- **`minLevel`**: `Int?` - Minimum character level required (for Alternative Companions and Improved Familiars)

**Relationships**:
- **`monster`**: Many-to-one relationship with `Monster` - Links to monster statistics
- **`featureProgressions`**: One-to-many relationship with `FeatureProgression` - Feature progressions for companion benefits (e.g., familiar benefits, animal companion benefits)
- **`characterCompanions`**: One-to-many relationship with `CharacterCompanion` - Characters who have selected this companion

**Constraints**:
- **Unique**: `@@unique([type, monsterId, minLevel])` - Unique combination of type, monster, and minimum level
- **Indexes**: `@@index([type])`, `@@index([monsterId])` - Indexed for efficient queries

**Usage**: Defines companions that can be selected by characters (e.g., wizard familiars, druid animal companions). Links to Monster model for statistics. Companion benefits are managed through the unified Feature system using `FeatureProgression` with `sourceType: FeatureSourceType.Companion` and `companionId` set to this companion.

**Migration Note**: Companion benefits were consolidated from the old `CompanionBenefitMap` and `CompanionBenefitCondition` models into the unified Feature system. Benefits are now defined as `FeatureProgression` records with distinct named features (e.g., "Cat Familiar Benefit"), `sourceType: FeatureSourceType.Companion`, and `companionId` linking to this companion.

**Source File**: [`apps/backend/prisma/schema.prisma`](../../../../apps/backend/prisma/schema.prisma) (Companion model)

**Related Documentation**: 
- [Feature System Database Schema](../feature-system/database-schema.md) for FeatureProgression model details
- [Monster System Database Schema](../monster-system/database-schema.md) for Monster model details

### **CharacterCompanion Model**

Links characters to their selected companions.

**Purpose**: Records which companions a character has selected and when they were acquired.

**Key Fields**:
- **`id`**: `Int @id @default(autoincrement())` - Unique identifier
- **`characterId`**: `Int` - Reference to the character
- **`monsterId`**: `Int` - Direct reference to Monster (not through Companion)
- **`companionId`**: `Int?` - Optional reference to Companion for familiars with benefits
- **`levelAcquired`**: `Int?` - Level at which the companion was acquired
- **`hitPoints`**: `Int?` - Current/max hit points (defaults to Monster.averageHP, can be rolled)
- **`wounds`**: `Int @default(0)` - Current damage taken (for combat tracking)

**Relationships**:
- **`character`**: Many-to-one relationship with `UserCharacter` - The character who has this companion
- **`monster`**: Many-to-one relationship with `Monster` - Links to monster statistics
- **`companion`**: Many-to-one relationship with `Companion` - Optional link to companion definition (for familiars with benefits)
- **`tricks`**: One-to-many relationship with `CharacterCompanionTrick` - Tricks known by the companion

**Constraints**:
- **Indexes**: `@@index([characterId])`, `@@index([monsterId])`, `@@index([companionId])` - Indexed for efficient queries
- **Cascade Delete**: `onDelete: Cascade` - Deleting a character deletes their companion selections

**Usage**: Tracks which companions each character has selected. Used for displaying companion information on character sheets and managing companion progression. Companion benefits are resolved through the Feature system using `FeatureProgression` records linked to the companion via `companionId`.

**Source File**: [`apps/backend/prisma/schema.prisma`](../../../../apps/backend/prisma/schema.prisma) (CharacterCompanion model)

**Related Documentation**: 
- [Character Management Database Schema](../character-management/database-schema.md) for UserCharacter model details
- [Feature System Database Schema](../feature-system/database-schema.md) for companion benefit resolution

### **TransformationFormEligibility Model**

Links features to eligible monster forms for transformation abilities (e.g., Wild Shape).

**Purpose**: Defines which monster forms are eligible for specific transformation features, with optional level restrictions.

**Key Fields**:
- **`id`**: `Int @id @default(autoincrement())` - Unique identifier
- **`featureId`**: `Int` - Reference to the feature (e.g., Wild Shape)
- **`monsterId`**: `Int` - Reference to the eligible monster form
- **`minLevel`**: `Int?` - Optional minimum level required for this specific form
- **`notes`**: `String? @db.Text` - Special restrictions or notes about this form

**Relationships**:
- **`feature`**: Many-to-one relationship with `Feature` - The transformation feature
- **`monster`**: Many-to-one relationship with `Monster` - The eligible monster form

**Constraints**:
- **Unique**: `@@unique([featureId, monsterId])` - A feature cannot have the same monster form listed twice
- **Indexes**: `@@index([featureId])`, `@@index([monsterId])` - Indexed for efficient queries
- **Cascade Delete**: `onDelete: Cascade` - Deleting a feature or monster deletes eligibility entries

**Usage**: Defines which monster forms are available for transformation abilities. Used by the template resolution system to generate dynamic summaries showing available forms based on character level and restrictions.

**Source File**: [`apps/backend/prisma/schema.prisma`](../../../../apps/backend/prisma/schema.prisma) (TransformationFormEligibility model)

**Related Documentation**: 
- [Feature System Database Schema](../feature-system/database-schema.md) for Feature model details
- [Monster System Database Schema](../monster-system/database-schema.md) for Monster model details

## 🔗 **Integration Points**

### **Feature System Integration**

The conditional feature display system extends the existing feature system:

- **Feature Model**: Extended with `displayInCharacterSheet` field; `summary` field now supports template placeholders
- **FeatureProgression Model**: Extended with `displayConditions` relationship and `companionId` field for companion-granted features
- **CharacterFeatureChoice Model**: Extended with `choiceGroupId`, `choiceData`, and `linkedChoiceGroupId` fields
- **FeatureEntityCondition**: Reused for `FeatureProgressionCondition` condition types
- **Companion Benefits**: Companion benefits are now managed through the unified Feature system using `FeatureProgression` with `sourceType: FeatureSourceType.Companion`

**Related Documentation**: [Feature System Database Schema](../feature-system/database-schema.md)

### **Monster System Integration**

The system integrates with the monster system for companion and transformation form data:

- **Companion Model**: Links to `Monster` model via `monsterId` for base statistics
- **TransformationFormEligibility Model**: Links to `Monster` model for eligible transformation forms

**Related Documentation**: [Monster System Database Schema](../monster-system/database-schema.md)

### **Character System Integration**

The system integrates with the character system for companion selection:

- **CharacterCompanion Model**: Links to `UserCharacter` model to track character companion selections

**Related Documentation**: [Character Management Database Schema](../character-management/database-schema.md)

## 📊 **Static Data Integration**

### **CompanionType Enum Integration**

Companion types reference the `CompanionType` enum from static data:

**Type Field**: `Companion.type` references `@CompanionType` enum values

**Enum Values**:
- **`Familiar` (1)**: Wizard familiars
- **`AnimalCompanion` (2)**: Druid/ranger animal companions
- **`AlternativeAnimalCompanion` (3)**: Alternative animal companion options
- **`ImprovedFamiliar` (4)**: Improved familiar options

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (CompanionType definition)

### **FeatureEntityConditionType Enum Integration**

Feature progression conditions reuse the `FeatureEntityConditionType` enum:

**Condition Type Field**: `FeatureProgressionCondition.conditionType` references `@FeatureEntityConditionType` enum values

**Source File**: `packages/shared/static-data/src/FeatureData.ts`

**Related Documentation**: [Feature System Static Data](../feature-system/static-data.md)

## 🎯 **Design Notes**

### **Template String Storage**

The `summary` field can contain template strings with `{{placeholder}}` syntax. If placeholders are detected, the summary is parsed as a template and resolved at runtime using character-specific data from `DisplayContext`. Otherwise, it is treated as static text.

### **Choice Group Management**

The `choiceGroupId` field allows grouping related choices together. For example, wizard school specialization choices are grouped, and forbidden school choices are linked to the specialization choice.

### **Linked Choices**

The `linkedChoiceGroupId` field enables dependent choices where one choice group's selection affects another. For example, cleric energy type choices link Turn/Rebuke and Spontaneous Casting features.

### **Transformation Form Eligibility**

The `TransformationFormEligibility` model allows admins to define which monster forms are eligible for transformation features. The system filters eligible forms based on character level, monster type, size, and Hit Dice restrictions.

## 📚 **Related Documentation**

- **[Feature System Database Schema](../feature-system/database-schema.md)** - Complete Feature system documentation
- **[Monster System Database Schema](../monster-system/database-schema.md)** - Monster model documentation
- **[Character Management Database Schema](../character-management/database-schema.md)** - UserCharacter model documentation
- **[Database Schema Patterns](../application-overview/database-schema.md)** - Common database patterns and conventions


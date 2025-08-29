# Feature System Validation Schemas

*Comprehensive documentation of Zod validation schemas for the feature system, covering type safety, validation rules, and error handling.*

## 📋 **Overview**

The feature system uses Zod validation schemas to ensure type safety and data integrity across all API operations. These schemas provide runtime validation, automatic error messages, and TypeScript type generation for the feature system's complex data structures.

The validation layer follows the shared [Validation Schema Patterns](../application-overview/validation-schemas.md) with feature-specific validation rules and constraints.

**Source File**: `packages/shared/schema/src/feature.ts`

## 🏗️ **Schema Architecture**

The feature system validation follows the shared [Layered Validation Architecture](../application-overview/validation-schemas.md#layered-validation-architecture) with feature-specific implementations:

**Schema Layer**: Zod schemas for runtime validation and type safety
**Type Layer**: TypeScript types generated from schemas for compile-time safety
**Error Layer**: Comprehensive error handling and user feedback
**Integration Layer**: API integration and frontend form validation

### **Schema Hierarchy Pattern**

The feature system uses the shared [Schema Hierarchy Pattern](../application-overview/validation-schemas.md#schema-hierarchy-pattern) with feature-specific variations:

**Base Schemas**: Core validation for individual entities
**Creation Schemas**: Validation for creating new entities (omitting read-only fields)
**Update Schemas**: Validation for updating existing entities (making fields optional)
**Response Schemas**: Validation for API responses (including computed fields)

### **Static Data Integration**

The feature system integrates with static data following the shared [Static Data Integration](../application-overview/validation-schemas.md#static-data-integration) patterns:

**Enum Validation**: Validates against static data enums for type safety
**Reference Validation**: Validates foreign key references against existing data
**Range Validation**: Validates numeric ranges against business rules
**Format Validation**: Validates string formats and patterns

## 🎯 **Core Feature Schemas**

### **FeatureSchema**

The base schema for feature validation, defining all required and optional fields with proper validation rules.

**Purpose**: Validates core feature data including name, description, and prerequisites.

**Key Validations**:
- **`id`**: Required positive integer for unique identification
- **`slug`**: Required string, 1-100 characters, trimmed, unique identifier
- **`name`**: Required string, 1-100 characters, trimmed for display
- **`description`**: Optional string, maximum 10000 characters for detailed descriptions
- **`prerequisites`**: Optional array of prerequisite schemas for requirements

**Usage**: Primary validation for feature data in API requests and responses.

**Source File**: `packages/shared/schema/src/feature.ts` (FeatureSchema definition)

### **FeaturePrerequisiteSchema**

Schema for feature prerequisites, defining requirements that must be met before a feature can be acquired.

**Purpose**: Validates prerequisite data including type, minimum values, and skill requirements.

**Key Validations**:
- **`id`**: Required positive integer for unique identification
- **`featureId`**: Required positive integer linking to the feature
- **`type`**: Required enum value from FeaturePrerequisiteType
- **`skillId`**: Optional positive integer or null for skill-based prerequisites
- **`minValue`**: Required integer for minimum required value

**Prerequisite Types** (see [Static Data](static-data.md) for complete enum):
- **SkillRanks**: Minimum ranks in a specific skill
- **AbilityScore**: Minimum ability score requirement
- **CharacterLevel**: Minimum character level
- **ClassLevel**: Minimum class level
- **BaseAttackBonus**: Minimum base attack bonus
- **Other**: Custom prerequisite types

**Usage**: Validates prerequisite data for feature requirements and character progression.

**Source File**: `packages/shared/schema/src/feature.ts` (FeaturePrerequisiteSchema definition)

## 🔧 **Feature Progression Schemas**

### **FeatureProgressionSchema**

The main schema for feature progression validation, used for bulk operations and complex feature definitions.

**Purpose**: Validates feature progression data including source tracking, level requirements, and associated components.

**Key Validations**:
- **`id`**: Required positive integer for unique identification
- **`sourceType`**: Required integer, 0-1 range (0=Race, 1=Class)
- **`level`**: Required integer, 1-20 range for character level
- **`featureId`**: Required positive integer linking to the feature
- **`classId`/`raceId`**: Optional positive integers (mutually exclusive)
- **`feature`**: Optional nested feature schema for complete data
- **`class`**: Optional class summary object for display
- **`modifiers`**: Optional array of modifier schemas
- **`choices`**: Optional array of choice schemas
- **`effects`**: Optional array of special effect schemas
- **`spellcasting`**: Optional spellcasting link schema

**Usage**: Primary validation for feature progression data in complex operations.

**Source File**: `packages/shared/schema/src/feature.ts` (FeatureProgressionSchema definition)

### **CreateFeatureProgressionSchema**

Schema for creating new feature progressions, omitting read-only fields and including nested creation schemas.

**Purpose**: Validates data for creating new feature progressions without requiring existing IDs or computed fields.

**Key Differences from Base Schema**:
- **Omits**: `id`, `feature`, `class`, `spellcasting` (read-only or computed)
- **Includes**: Nested creation schemas for modifiers, choices, and effects
- **Validation**: Ensures proper source type and level constraints

**Usage**: Validates feature progression creation requests in API endpoints.

**Source File**: `packages/shared/schema/src/feature.ts` (CreateFeatureProgressionSchema definition)

### **UpdateFeatureProgressionSchema**

Schema for updating existing feature progressions, making fields optional and allowing partial updates.

**Purpose**: Validates data for updating existing feature progressions with flexible field requirements.

**Key Characteristics**:
- **Optional Fields**: All fields except ID are optional for partial updates
- **Validation**: Maintains constraints for provided fields
- **Flexibility**: Allows updating individual components without full data

**Usage**: Validates feature progression update requests in API endpoints.

**Source File**: `packages/shared/schema/src/feature.ts` (UpdateFeatureProgressionSchema definition)

## 🔧 **Modifier Schemas**

### **FeatureModifierSchema**

Schema for feature modifiers, defining numerical bonuses, quantities, and replacements.

**Purpose**: Validates modifier data including type, value, target, and conditions.

**Key Validations**:
- **`id`**: Required positive integer for unique identification
- **`featureProgressionId`**: Required positive integer linking to progression
- **`type`**: Required enum value from ModifierType
- **`value`**: Required integer for modifier value
- **`bonusType`**: Optional enum value from FeatureBonusType for stacking rules
- **`appliesTo`**: Optional enum value from ModifierAppliesToType for target
- **`appliesToId`**: Optional positive integer for specific target ID
- **`formulaParamsId`**: Optional positive integer linking to formula parameters
- **`conditions`**: Optional array of condition schemas
- **`formulaParams`**: Optional nested formula parameters schema

**Usage**: Validates modifier data for feature mechanical effects.

**Source File**: `packages/shared/schema/src/feature.ts` (FeatureModifierSchema definition)

### **FeatureModifierConditionSchema**

Schema for modifier conditions, defining when modifiers apply.

**Purpose**: Validates condition data for conditional modifier application.

**Key Validations**:
- **`id`**: Required positive integer for unique identification
- **`featureModifierId`**: Required positive integer linking to modifier
- **`conditionType`**: Required enum value from FeatureModifierConditionType
- **`conditionValue`**: Required integer for condition value

**Usage**: Validates condition data for conditional modifier application.

**Source File**: `packages/shared/schema/src/feature.ts` (FeatureModifierConditionSchema definition)

### **FeatureFormulaParamsSchema**

Schema for formula parameters, defining mathematical progression calculations.

**Purpose**: Validates formula parameter data for dynamic feature calculations.

**Key Validations**:
- **`id`**: Required positive integer for unique identification
- **`formulaId`**: Required positive integer linking to formula definition
- **`interval`**: Optional positive integer for calculation intervals
- **`formulaStartLevel`**: Optional positive integer for starting level
- **`abilityId`**: Optional positive integer for ability-based formulas
- **`thresholds`**: Optional array of integers for level thresholds
- **`values`**: Optional array of strings/numbers for threshold values

**Usage**: Validates formula parameter data for dynamic feature calculations.

**Source File**: `packages/shared/schema/src/feature.ts` (FeatureFormulaParamsSchema definition)

## 🎯 **Choice Schemas**

### **FeatureChoiceSchema**

Schema for feature choices, defining player selection options.

**Purpose**: Validates choice data for player customization options.

**Key Validations**:
- **`id`**: Required positive integer for unique identification
- **`progressionId`**: Required positive integer linking to progression
- **`label`**: Optional string for choice display label
- **`pickCount`**: Optional positive integer for number of selections
- **`type`**: Required enum value from FeatureChoiceType
- **`behavior`**: Required enum value from FeatureChoiceBehavior
- **`featId`**: Optional positive integer linking to feat options
- **`featureId`**: Optional positive integer linking to feature options
- **`formulaParamsId`**: Optional positive integer linking to formula parameters
- **`filterType`**: Optional positive integer for choice filtering
- **`feat`**: Optional nested feat summary object
- **`feature`**: Optional nested feature summary object
- **`formulaParams`**: Optional nested formula parameters schema

**Usage**: Validates choice data for player selection options.

**Source File**: `packages/shared/schema/src/feature.ts` (FeatureChoiceSchema definition)

## ✨ **Special Effect Schemas**

### **FeatureSpecialEffectSchema**

Schema for special effects, defining unique abilities and non-numeric effects.

**Purpose**: Validates special effect data for unique feature abilities.

**Key Validations**:
- **`id`**: Required positive integer for unique identification
- **`progressionId`**: Required positive integer linking to progression
- **`effectType`**: Required enum value from FeatureSpecialEffectType
- **`key`**: Optional string for effect parameter key
- **`value`**: Optional string for effect parameter value
- **`numericValue`**: Optional integer for numeric effect value
- **`featId`**: Optional positive integer linking to feat
- **`itemId`**: Optional positive integer linking to item
- **`feat`**: Optional nested feat object
- **`item`**: Optional nested item object

**Usage**: Validates special effect data for unique feature abilities.

**Source File**: `packages/shared/schema/src/feature.ts` (FeatureSpecialEffectSchema definition)

## 📋 **Creation and Update Schemas**

### **CreateFeatureSchema**

Schema for creating new features, omitting read-only fields.

**Purpose**: Validates feature creation data without requiring existing IDs.

**Key Characteristics**:
- **Omits**: `id` (auto-generated)
- **Includes**: All required fields for feature creation
- **Validation**: Ensures proper field constraints and relationships

**Usage**: Validates feature creation requests in API endpoints.

**Source File**: `packages/shared/schema/src/feature.ts` (CreateFeatureSchema definition)

### **UpdateFeatureSchema**

Schema for updating existing features, making fields optional.

**Purpose**: Validates feature update data with flexible field requirements.

**Key Characteristics**:
- **Optional Fields**: All fields except ID are optional for partial updates
- **Validation**: Maintains constraints for provided fields
- **Flexibility**: Allows updating individual fields without full data

**Usage**: Validates feature update requests in API endpoints.

**Source File**: `packages/shared/schema/src/feature.ts` (UpdateFeatureSchema definition)

### **CreateFeatureProgressionRequest**

Schema for creating feature progressions with full relationship data.

**Purpose**: Validates complete feature progression creation including all related entities.

**Key Characteristics**:
- **Includes**: All progression data with nested modifiers, choices, and effects
- **Validation**: Ensures proper relationships and constraints
- **Completeness**: Requires all necessary data for complete progression creation

**Usage**: Validates bulk feature progression creation requests.

**Source File**: `packages/shared/schema/src/feature.ts` (CreateFeatureProgressionRequest definition)

## 🔗 **Cross-System Integration**

### **Spellcasting Integration**

The feature system integrates with the spellcasting system through validation schemas:

**SpellcastingLinkSchema**: Validates spellcasting links in feature progressions
**SpellcastingProgressionSchema**: Validates spellcasting progression data
**Integration Validation**: Ensures proper spellcasting integration constraints

### **Feat System Integration**

The feature system integrates with the feat system through validation schemas:

**FeatSchema**: Validates feat data in feature choices and effects
**FeatReferenceValidation**: Ensures valid feat references in feature components
**FeatTypeValidation**: Validates feat types and categories

### **Item System Integration**

The feature system integrates with the item system through validation schemas:

**ItemSchema**: Validates item data in feature effects
**ItemReferenceValidation**: Ensures valid item references in feature components
**ItemTypeValidation**: Validates item types and categories

## 📊 **Error Handling**

The feature system follows the shared [Error Handling Patterns](../application-overview/validation-schemas.md#error-handling) with feature-specific error scenarios:

**Validation Errors**: Detailed field-specific error messages
**Business Logic Errors**: Feature-specific business rule violations
**Cross-System Errors**: Integration errors with related systems
**Type Safety Errors**: TypeScript type safety violations

## 🔧 **Performance Considerations**

The feature system implements validation performance optimizations following the shared [Performance Optimization](../application-overview/performance-optimization.md) patterns:

**Efficient Validation**: Optimized validation logic for complex schemas
**Caching**: Appropriate caching for validation results
**Lazy Validation**: Lazy validation for large datasets
**Batch Validation**: Batch validation for bulk operations

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Feature system database models and relationships
- **[Static Data](static-data.md)** - Feature system enums and types
- **[Backend Implementation](backend-implementation.md)** - Feature system backend implementation
- **[Frontend Components](frontend-components.md)** - Feature system frontend implementation
- **[Validation Schema Patterns](../application-overview/validation-schemas.md)** - Shared validation patterns and conventions
- **[Performance Optimization](../application-overview/performance-optimization.md)** - Shared performance optimization strategies

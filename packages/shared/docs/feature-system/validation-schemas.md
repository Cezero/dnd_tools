# Feature System Validation Schemas

*Comprehensive documentation of Zod validation schemas for the feature system, covering type safety, validation rules, and error handling.*

## 📋 **Overview**

The feature system uses Zod validation schemas to ensure type safety and data integrity across all API operations. These schemas provide runtime validation, automatic error messages, and TypeScript type generation for the feature system's complex data structures.

The validation layer follows the shared [Validation Schema Patterns](../application-overview/validation-schemas.md) with feature-specific validation rules and constraints. The system uses a unified entity approach where all feature effects are handled through a single `FeatureEntitySchema`.

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

**Enum Validation**: Validates against static data enums for type safety (@EntityType, @EntityAppliesToType, @FeatureBonusType)
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
- **`description`**: Required string, maximum 10000 characters for detailed descriptions
- **`prerequisites`**: Optional array of prerequisite schemas for requirements

**Usage**: Primary validation for feature data in API requests and responses.

**Source File**: `packages/shared/schema/src/feature.ts` (FeatureSchema definition)

### **FeaturePrerequisiteSchema**

Schema for feature prerequisites, defining requirements that must be met before a feature can be acquired.

**Purpose**: Validates prerequisite data including type, minimum values, and skill requirements.

**Key Validations**:
- **`id`**: Required positive integer for unique identification
- **`featureId`**: Required positive integer linking to the feature
- **`type`**: Required enum value from @FeaturePrerequisiteType
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

**Purpose**: Validates feature progression data including source tracking, level requirements, and associated entities.

**Key Validations**:
- **`id`**: Required positive integer for unique identification
- **`sourceType`**: Required integer, 0-1 range (0=Race, 1=Class)
- **`level`**: Required integer, 1-20 range for character level
- **`featureId`**: Required positive integer linking to the feature
- **`classId`/`raceId`**: Optional positive integers (mutually exclusive)
- **`feature`**: Optional nested feature schema for complete data
- **`class`**: Optional class summary object for display
- **`entities`**: Optional array of feature entity schemas (unified approach)
- **`spellcasting`**: Optional spellcasting link schema

**Usage**: Primary validation for feature progression data in complex operations.

**Source File**: `packages/shared/schema/src/feature.ts` (FeatureProgressionSchema definition)

### **CreateFeatureProgressionSchema**

Schema for creating new feature progressions, omitting read-only fields and including nested creation schemas.

**Purpose**: Validates data for creating new feature progressions without requiring existing IDs or computed fields.

**Key Differences from Base Schema**:
- **Omits**: `id`, `feature`, `class`, `spellcasting` (read-only or computed)
- **Includes**: Nested creation schemas for entities (unified approach)
- **Validation**: Ensures proper source type and level constraints

**Usage**: Validates feature progression creation requests in API endpoints.

**Source File**: `packages/shared/schema/src/feature.ts` (CreateFeatureProgressionSchema definition)

### **CreateFeatureProgressionFormSchema**

Schema for creating feature progressions in frontend forms, allowing featureId to be 0 for new features.

**Purpose**: Validates data for frontend form submissions where new features can be created alongside progressions.

**Key Characteristics**:
- **Flexible Feature ID**: Allows `featureId` to be 0 for new features
- **Form Integration**: Designed for frontend form validation
- **Creation Support**: Supports creating both features and progressions in one operation

**Usage**: Validates feature progression form submissions in frontend applications.

**Source File**: `packages/shared/schema/src/feature.ts` (CreateFeatureProgressionFormSchema definition)

## 🔧 **Unified Entity Schemas**

### **FeatureEntitySchema**

The unified schema that handles all types of feature effects including modifiers, choices, and special effects through a single, flexible structure.

**Purpose**: Validates all feature effects using a unified approach, whether they are numerical bonuses, player choices, or special abilities.

**Key Validations**:
- **`id`**: Required positive integer for unique identification
- **`progressionId`**: Required positive integer linking to the feature progression
- **`type`**: Required enum value from @EntityType (Bonus, Quantity, Replacement, Other, Proficiency, Choice, Allocation)
- **`appliesTo`**: Required enum value from @EntityAppliesToType for target specification
- **`appliesToId`**: Optional positive integer for specific target ID
- **`appliesToSubId`**: Optional positive integer for sub-target ID
- **`value`**: Optional integer for numerical value (if applicable)
- **`bonusType`**: Optional enum value from @FeatureBonusType for stacking rules
- **`formulaParamsId`**: Optional positive integer linking to formula parameters
- **`groupingId`**: Optional integer for grouping related entities (default: 0)
- **`displayInDetail`**: Optional boolean for display control (default: true)
- **`filterType`**: Optional integer for choice filtering
- **`conditions`**: Optional array of condition schemas
- **`formulaParams`**: Optional nested formula parameters schema
- **`item`**: Optional nested item schema (when appliesTo === Item)
- **`feat`**: Optional nested feat schema (when appliesTo === Feat)
- **`feature`**: Optional nested feature schema (when appliesTo === Feature)

**Usage**: The unified approach allows a single feature to have multiple effects of different types, all managed through one consistent schema. This eliminates the need for separate modifier, choice, and special effect schemas while providing the same functionality.

**Source File**: `packages/shared/schema/src/feature.ts` (FeatureEntitySchema definition)

### **CreateFeatureEntitySchema**

Schema for creating new feature entities, omitting read-only fields and including nested creation schemas.

**Purpose**: Validates data for creating new feature entities without requiring existing IDs or computed fields.

**Key Differences from Base Schema**:
- **Omits**: `id`, `progressionId`, `conditions`, `formulaParams`, `formulaParamsId`, `item`
- **Includes**: Nested creation schemas for conditions and formula parameters
- **Validation**: Ensures proper entity type and appliesTo constraints

**Usage**: Validates feature entity creation requests in API endpoints.

**Source File**: `packages/shared/schema/src/feature.ts` (CreateFeatureEntitySchema definition)

### **FeatureEntityConditionSchema**

Schema for feature entity conditions, defining when entities apply.

**Purpose**: Validates condition data for conditional entity application.

**Key Validations**:
- **`id`**: Required positive integer for unique identification
- **`featureEntityId`**: Required positive integer linking to the feature entity
- **`conditionType`**: Required enum value from @FeatureEntityConditionType
- **`conditionValue`**: Required integer for condition value

**Usage**: Validates condition data for conditional entity application.

**Source File**: `packages/shared/schema/src/feature.ts` (FeatureEntityConditionSchema definition)

### **CreateFeatureEntityConditionSchema**

Schema for creating new feature entity conditions, omitting read-only fields.

**Purpose**: Validates data for creating new feature entity conditions without requiring existing IDs.

**Key Differences from Base Schema**:
- **Omits**: `id`, `featureEntityId` (read-only fields)
- **Validation**: Ensures proper condition type and value constraints

**Usage**: Validates feature entity condition creation requests in API endpoints.

**Source File**: `packages/shared/schema/src/feature.ts` (CreateFeatureEntityConditionSchema definition)

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
- **`valuesRepresent`**: Optional enum value from @ConditionalScalingValueType
- **`cumulative`**: Optional boolean for value accumulation (default: false)
- **`includeProgressionLevel`**: Optional boolean for progression level inclusion (default: true)

**Usage**: Validates formula parameter data for dynamic feature calculations.

**Source File**: `packages/shared/schema/src/feature.ts` (FeatureFormulaParamsSchema definition)

### **CreateFeatureFormulaParamsSchema**

Schema for creating new formula parameters, omitting read-only fields and making optional fields more flexible.

**Purpose**: Validates data for creating new formula parameters without requiring existing IDs.

**Key Differences from Base Schema**:
- **Omits**: `id` (read-only field)
- **Flexible Fields**: Makes thresholds, values, valuesRepresent, and cumulative optional for creation
- **Validation**: Ensures proper formula constraints

**Usage**: Validates formula parameter creation requests in API endpoints.

**Source File**: `packages/shared/schema/src/feature.ts` (CreateFeatureFormulaParamsSchema definition)

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

### **UpdateFeatureProgressionsRequestSchema**

Schema for updating multiple feature progressions in bulk operations.

**Purpose**: Validates bulk feature progression update requests including all related entities.

**Key Characteristics**:
- **Includes**: Array of feature progression creation schemas
- **Validation**: Ensures proper relationships and constraints for all progressions
- **Bulk Operations**: Supports updating multiple progressions in a single request

**Usage**: Validates bulk feature progression update requests.

**Source File**: `packages/shared/schema/src/feature.ts` (UpdateFeatureProgressionsRequestSchema definition)

## 🔗 **Cross-System Integration**

### **Spellcasting Integration**

The feature system integrates with the spellcasting system through validation schemas:

**SpellcastingLinkSchema**: Validates spellcasting links in feature progressions
**SpellcastingProgressionSchema**: Validates spellcasting progression data
**Integration Validation**: Ensures proper spellcasting integration constraints

### **Feat System Integration**

The feature system integrates with the feat system through the unified entity approach:

**FeatSchema**: Validates feat data in feature entities (when appliesTo === Feat)
**FeatReferenceValidation**: Ensures valid feat references in feature entities
**FeatTypeValidation**: Validates feat types and categories through entity relationships

### **Item System Integration**

The feature system integrates with the item system through the unified entity approach:

**ItemSchema**: Validates item data in feature entities (when appliesTo === Item)
**ItemReferenceValidation**: Ensures valid item references in feature entities
**ItemTypeValidation**: Validates item types and categories through entity relationships

### **Feature System Self-Integration**

The feature system supports self-referential relationships through the unified entity approach:

**FeatureSchema**: Validates feature data in feature entities (when appliesTo === Feature)
**FeatureReferenceValidation**: Ensures valid feature references in feature entities
**FeatureTypeValidation**: Validates feature types and categories through entity relationships

## 📊 **Error Handling**

The feature system follows the shared [Error Handling Patterns](../application-overview/validation-schemas.md#error-handling) with feature-specific error scenarios:

**Validation Errors**: Detailed field-specific error messages for all entity types
**Business Logic Errors**: Feature-specific business rule violations including entity type constraints
**Cross-System Errors**: Integration errors with related systems (spellcasting, feats, items)
**Type Safety Errors**: TypeScript type safety violations for unified entity approach
**Entity Validation Errors**: Specific validation errors for entity type and appliesTo combinations

## 🔧 **Performance Considerations**

The feature system implements validation performance optimizations following the shared [Performance Optimization](../application-overview/performance-optimization.md) patterns:

**Efficient Validation**: Optimized validation logic for unified entity schemas
**Caching**: Appropriate caching for validation results and entity type lookups
**Lazy Validation**: Lazy validation for large datasets with complex entity relationships
**Batch Validation**: Batch validation for bulk operations with multiple entities
**Entity Type Optimization**: Efficient validation based on entity type and appliesTo combinations

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Feature system database models and relationships
- **[Static Data](static-data.md)** - Feature system enums and types
- **[Backend Implementation](backend-implementation.md)** - Feature system backend implementation
- **[Frontend Components](frontend-components.md)** - Feature system frontend implementation
- **[Validation Schema Patterns](../application-overview/validation-schemas.md)** - Shared validation patterns and conventions
- **[Performance Optimization](../application-overview/performance-optimization.md)** - Shared performance optimization strategies

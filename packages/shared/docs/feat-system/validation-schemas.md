# Feat System Validation Schemas

*Complete documentation for the feat system validation schemas, including Zod schemas, type safety, and validation rules.*

## 📋 **Overview**

The feat system uses Zod validation schemas to ensure type safety and data integrity across all API operations. These schemas provide runtime validation, automatic error messages, and TypeScript type generation for the feat system's complex data structures.

The validation layer follows the shared [Validation Schema Patterns](../application-overview/validation-schemas.md) with feat-specific validation rules and constraints.

**Source File**: `packages/shared/schema/src/feat.ts`

## 🏗️ **Schema Architecture**

The feat system validation follows the shared [Layered Validation Architecture](../application-overview/validation-schemas.md#layered-validation-architecture) with feat-specific implementations:

**Schema Layer**: Zod schemas for runtime validation and type safety
**Type Layer**: TypeScript types generated from schemas for compile-time safety
**Error Layer**: Comprehensive error handling and user feedback
**Integration Layer**: API integration and frontend form validation

### **Schema Hierarchy Pattern**

The feat system uses the shared [Schema Hierarchy Pattern](../application-overview/validation-schemas.md#schema-hierarchy-pattern) with feat-specific variations:

**Base Schemas**: Core validation for individual entities
**Creation Schemas**: Validation for creating new entities (omitting read-only fields)
**Update Schemas**: Validation for updating existing entities (making fields optional)
**Response Schemas**: Validation for API responses (including computed fields)

### **Static Data Integration**

The feat system integrates with static data following the shared [Static Data Integration](../application-overview/validation-schemas.md#static-data-integration) patterns:

**Enum Validation**: Validates against static data enums for type safety
**Reference Validation**: Validates foreign key references against existing data
**Range Validation**: Validates numeric ranges against business rules
**Format Validation**: Validates string formats and patterns

## 🎯 **Core Feat Schemas**

### **BaseFeatSchema**

The base schema for feat validation, defining all required and optional fields with proper validation rules.

**Purpose**: Validates core feat data including name, type, and descriptions. Benefits and prerequisites are handled through the Feature system (FeatureProgression).

**Key Validations**:
- **`name`**: Required string, 1-200 characters, trimmed for display
- **`typeId`**: Required positive integer for feat type reference
- **`repeatable`**: Optional boolean for repeatable feat flag
- **`fighterBonus`**: Optional boolean for fighter bonus feat flag
- **`useSubId`**: Optional boolean, defaults to false, indicates player choice mechanics
- **`isVisible`**: Optional boolean, defaults to true, controls feat visibility
- **`editionId`**: Required positive integer for edition reference
- **`sourceBookInfo`**: Optional array of source book references
- **`featureProgressions`**: Optional array of FeatureProgression entries (benefits and prerequisites)
- **Note**: `description` and `summary` are not part of BaseFeatSchema - they come from associated Features via FeatureProgression

**Usage**: Primary validation for feat data in API requests and responses.

**Source File**: `packages/shared/schema/src/feat.ts` (BaseFeatSchema definition)

### **FeatSchema**

The complete feat schema including the ID field for database operations.

**Purpose**: Validates complete feat data including the unique identifier.

**Key Validations**:
- **`id`**: Required positive integer for unique identification
- **All Base Fields**: Includes all base feat fields with appropriate validation

**Usage**: Complete feat validation for database operations and responses.

**Source File**: `packages/shared/schema/src/feat.ts` (FeatSchema definition)

### **FeatIdParamSchema**

Schema for feat ID parameter validation in URL paths.

**Purpose**: Validates and transforms feat ID parameters from URL strings to integers.

**Key Validations**:
- **`id`**: Required string that transforms to positive integer

**Usage**: Validates feat ID parameters in API routes.

**Source File**: `packages/shared/schema/src/feat.ts` (FeatIdParamSchema definition)

## 🔧 **Feature System Integration**

Benefits and prerequisites are now validated through the Feature system schemas:

- **FeatureProgressionSchema**: Validates FeatureProgression entries that link feats to features
- **FeatureEntitySchema**: Validates FeatureEntity entries that define feat benefits
- **FeaturePrerequisiteSchema**: Validates FeaturePrerequisite entries that define feat prerequisites

**Related Documentation**: [Feature System Validation Schemas](../feature-system/validation-schemas.md)
- **`amount`**: Optional non-negative integer for prerequisite amount
- **`referenceId`**: Optional integer for reference entity

**Usage**: Validates feat prerequisite relationships in feat data.

**Source File**: `packages/shared/schema/src/feat.ts` (FeatPrerequisiteMapSchema definition)

## 🔧 **Request and Response Schemas**

### **FeatQuerySchema**

Schema for feat query request validation.

**Purpose**: Validates feat query requests with query type filtering.

**Key Validations**:
- **`queryType`**: Required enum value ('proficiency', 'all') for query type

**Usage**: Validates feat query requests.

**Source File**: `packages/shared/schema/src/feat.ts` (FeatQuerySchema definition)

### **GetAllFeatsResponseSchema**

Schema for the response when retrieving all feats.

**Purpose**: Validates paginated feat list responses.

**Key Validations**:
- **`total`**: Required integer for total count
- **`results`**: Required array of feat schemas (without relationships)
- **Pagination Fields**: Includes standard pagination metadata

**Usage**: Validates responses for feat list endpoints.

**Source File**: `packages/shared/schema/src/feat.ts` (GetAllFeatsResponseSchema definition)

### **FeatWithFeatureInfoSchema**

Schema for feats with feature information (description and summary).

**Purpose**: Lightweight schema for list views that need feat information with feature description and summary, but don't require full feat data or feature progressions.

**IMPORTANT**: This is a composite schema where:
- **`id`**: Comes from `Feat.id` (the feat's database ID)
- **`name`**: Comes from `Feat.name` (the feat's name)
- **`description`**: Comes from the associated `Feature.description` (via `FeatureProgression`)
- **`summary`**: Comes from the associated `Feature.summary` (via `FeatureProgression`)

**Key Validations**:
- **`id`**: Required positive integer (from Feat table)
- **`name`**: Required string, 1-200 characters (from Feat table)
- **`description`**: Optional nullable string, max 10000 characters (from Feature table)
- **`summary`**: Optional nullable string, max 10000 characters (from Feature table)

**Backend Behavior**:
- If a feat has no associated feature, `description` and `summary` will be `null`
- If a feat has multiple feature progressions, the first one's feature is used
- The backend service method `getAllFeatsWithFeatureInfo()` handles the data combination

**Usage**: Used by the `/feats/with-feature-info` endpoint for list views that need to display feat descriptions and summaries without loading full feat data or progressions.

**Source File**: `packages/shared/schema/src/feat.ts` (FeatWithFeatureInfoSchema definition)

### **GetAllFeatsWithFeatureInfoResponseSchema**

Schema for the response when retrieving all feats with feature information.

**Purpose**: Validates paginated response containing feats with feature description and summary.

**Key Validations**:
- **`total`**: Required integer for total count
- **`results`**: Required array of `FeatWithFeatureInfoSchema` entries
- **Pagination Fields**: Includes standard pagination metadata

**Usage**: Validates responses for the `/feats/with-feature-info` endpoint.

**Source File**: `packages/shared/schema/src/feat.ts` (GetAllFeatsWithFeatureInfoResponseSchema definition)

### **FeatQueryResponseSchema**

Schema for the response when querying feats with filtering.

**Purpose**: Validates paginated feat query responses with relationships.

**Key Validations**:
- **`total`**: Required integer for total count
- **`results`**: Required array of complete feat schemas with relationships
- **Pagination Fields**: Includes standard pagination metadata

**Usage**: Validates responses for feat query endpoints.

**Source File**: `packages/shared/schema/src/feat.ts` (FeatQueryResponseSchema definition)

### **UpdateFeatSchema**

Schema for updating existing feats with partial data.

**Purpose**: Validates feat update requests with optional fields.

**Key Validations**:
- **Base Fields**: All base feat fields made optional for partial updates
- **Relationship Fields**: All relationship fields made optional for partial updates

**Usage**: Validates feat update requests.

**Source File**: `packages/shared/schema/src/feat.ts` (UpdateFeatSchema definition)

## 🔗 **Integration Schemas**

### **Character System Integration**

The feat system integrates with the character system through feat selection and prerequisites:

**Feat Selection**: Characters can select and acquire feats
**Prerequisite Validation**: Character abilities and skills are validated against feat prerequisites
**Feat Benefits**: Character abilities are modified by feat benefits

**Integration Pattern**: The feat system provides the framework for character feat management, with character abilities and skills determining feat access and progression.

**Related Documentation**: [Character Management Validation Schemas](../character-management/validation-schemas.md)


## 📊 **Type Generation**

### **Generated Types**

The validation schemas automatically generate TypeScript types for type safety:

**FeatIdParamRequest**: Type for feat ID parameter requests
**FeatQueryRequest**: Type for feat query requests
**CreateFeatRequest**: Type for feat creation requests
**UpdateFeatRequest**: Type for feat update requests
**GetAllFeatsResponse**: Type for feat list responses
**FeatQueryResponse**: Type for feat query responses
**Feat**: Type for complete feat data
**FeatBenefitMap**: Type for feat benefit relationships
**FeatPrerequisiteMap**: Type for feat prerequisite relationships

**Type Safety Benefits**:
- **Compile-time Validation**: TypeScript catches type errors at compile time
- **IDE Support**: Full IntelliSense and autocomplete support
- **Refactoring Safety**: Safe refactoring with type checking
- **Documentation**: Types serve as living documentation

**Source File**: `packages/shared/schema/src/feat.ts` (Type definitions)

## 🔧 **Validation Patterns**

### **String Validation**

**Name Validation**: Feat names are required, trimmed, and limited to 200 characters
**Description Validation**: Feat descriptions are optional and limited to 10000 characters
**Benefit Validation**: Benefit descriptions are optional and limited to 2000 characters
**Effect Validation**: Effect descriptions are optional and limited to 2000 characters

**Validation Benefits**:
- **Data Quality**: Ensures consistent, clean data
- **User Experience**: Provides clear error messages for validation failures
- **Performance**: Prevents overly large strings from affecting performance
- **Display Safety**: Ensures data is safe for display in user interfaces

### **Numeric Validation**

**Type ID Validation**: Type ID must be a positive integer
**Reference ID Validation**: Reference IDs must be positive integers
**Amount Validation**: Amounts must be non-negative integers
**Index Validation**: Index values must be non-negative integers

**Validation Benefits**:
- **Data Integrity**: Ensures numeric data is within valid ranges
- **Business Logic**: Enforces game mechanics and business rules
- **Error Prevention**: Prevents invalid data from entering the system
- **Type Safety**: Ensures proper numeric types throughout the system

### **Boolean Validation**

**Repeatable Validation**: Boolean flag for repeatable feats
**Fighter Bonus Validation**: Boolean flag for fighter bonus feats

**Validation Benefits**:
- **Data Consistency**: Ensures boolean flags are properly set
- **Game Mechanics**: Enforces proper feat mechanics and rules
- **Error Prevention**: Prevents invalid boolean values from entering the system
- **Type Safety**: Ensures proper boolean types throughout the system

### **Reference Validation**

**Type ID Validation**: Type IDs must reference valid feat types
**Benefit Type Validation**: Benefit type IDs must reference valid benefit types
**Prerequisite Type Validation**: Prerequisite type IDs must reference valid prerequisite types

**Validation Benefits**:
- **Data Consistency**: Ensures all references are valid
- **Referential Integrity**: Maintains proper relationships between entities
- **Error Prevention**: Prevents invalid references from entering the system
- **Type Safety**: Ensures proper reference types throughout the system

## 🔗 **Error Handling**

### **Validation Error Patterns**

The feat system follows the shared [Error Handling Patterns](../application-overview/validation-schemas.md#error-handling) with feat-specific error scenarios:

**Field Validation Errors**: Specific error messages for each field validation failure
**Business Rule Errors**: Feat-specific business rule violations
**Integration Errors**: Errors from related system validations
**Type Conversion Errors**: Errors from string to number conversions

### **Error Message Standards**

**User-Friendly Messages**: Clear, actionable error messages for users
**Field-Specific Messages**: Specific messages for each validation field
**Context Information**: Include context about what was being validated
**Debug Information**: Additional debug information in development mode

## 🎯 **Player Choice Validation**

### **UseSubId Property Validation**
The `useSubId` property enables special validation for player choice feats.

**Validation Rules**:
- **`useSubId: false`**: Standard feat validation, all FeatureEntity entries must have valid `appliesToId`
- **`useSubId: true`**: Player choice feat validation, FeatureEntity entries may have `null` `appliesToId` (player choice required)

**Implementation Pattern**:
```typescript
// Predefined feat validation
if (!feat.useSubId) {
  // All FeatureEntity entries must have valid appliesToId
  for (const progression of feat.featureProgressions) {
    for (const entity of progression.entities || []) {
      if (!entity.appliesToId) {
        throw new Error('Predefined feats must have valid appliesToId for all entities');
      }
    }
  }
}

// Player choice feat validation
if (feat.useSubId) {
  // FeatureEntity entries may have null appliesToId (player choice)
  for (const progression of feat.featureProgressions) {
    for (const entity of progression.entities || []) {
      if (entity.appliesToId === null) {
        // This is valid for player choice feats
        continue;
      }
    }
  }
}
```

### **Character Feat Selection Validation**
When a character selects a feat with `useSubId: true`:

**Required Validations**:
- **Choice Required**: Character must specify which entity (skill, weapon, etc.) via CharacterFeatureChoice
- **Valid Entity**: The chosen entity must be valid for the appliesTo type (EntityAppliesToType)
- **Unique Selection**: Character cannot select the same entity multiple times

**Example Validation**:
```typescript
// Skill Focus feat selection validation
if (feat.useSubId && entity.appliesTo === EntityAppliesToType.Skill) {
  if (!characterFeatureChoice.appliesToSubId) {
    throw new Error('Player must choose a skill for Skill Focus');
  }
  
  if (!isValidSkill(characterFeatureChoice.appliesToSubId)) {
    throw new Error('Invalid skill selection for Skill Focus');
  }
}
```

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Feat system database models and relationships
- **[Static Data](static-data.md)** - Feat system enums and types
- **[Backend Implementation](backend-implementation.md)** - Feat system backend implementation
- **[Frontend Components](frontend-components.md)** - Feat system frontend implementation
- **[Character Management Validation Schemas](../character-management/validation-schemas.md)** - Character system validation patterns
- **[Ability System Validation Schemas](../ability-system/validation-schemas.md)** - Ability system validation patterns
- **[Skill System Validation Schemas](../skill-system/validation-schemas.md)** - Skill system validation patterns
- **[Validation Schema Patterns](../application-overview/validation-schemas.md)** - Shared validation patterns and conventions

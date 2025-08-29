# Class System Validation Schemas

*Complete documentation for the class system validation schemas, including Zod schemas, type safety, and validation rules.*

## 📋 **Overview**

The class system uses Zod validation schemas to ensure type safety and data integrity across all API operations. These schemas provide runtime validation, automatic error messages, and TypeScript type generation for the class system's complex data structures.

The validation layer follows the shared [Validation Schema Patterns](../application-overview/validation-schemas.md) with class-specific validation rules and constraints.

**Source File**: `packages/shared/schema/src/class.ts`

## 🏗️ **Schema Architecture**

The class system validation follows the shared [Layered Validation Architecture](../application-overview/validation-schemas.md#layered-validation-architecture) with class-specific implementations:

**Schema Layer**: Zod schemas for runtime validation and type safety
**Type Layer**: TypeScript types generated from schemas for compile-time safety
**Error Layer**: Comprehensive error handling and user feedback
**Integration Layer**: API integration and frontend form validation

### **Schema Hierarchy Pattern**

The class system uses the shared [Schema Hierarchy Pattern](../application-overview/validation-schemas.md#schema-hierarchy-pattern) with class-specific variations:

**Base Schemas**: Core validation for individual entities
**Creation Schemas**: Validation for creating new entities (omitting read-only fields)
**Update Schemas**: Validation for updating existing entities (making fields optional)
**Response Schemas**: Validation for API responses (including computed fields)

### **Static Data Integration**

The class system integrates with static data following the shared [Static Data Integration](../application-overview/validation-schemas.md#static-data-integration) patterns:

**Enum Validation**: Validates against static data enums for type safety
**Reference Validation**: Validates foreign key references against existing data
**Range Validation**: Validates numeric ranges against business rules
**Format Validation**: Validates string formats and patterns

## 🎯 **Core Class Schemas**

### **BaseClassSchema**

The base schema for class validation, defining all required and optional fields with proper validation rules.

**Purpose**: Validates core class data including name, abbreviation, progression values, and related data.

**Key Validations**:
- **`name`**: Required string, 1-100 characters, trimmed for display
- **`abbreviation`**: Required string, 1-10 characters, trimmed for short display
- **`editionId`**: Optional positive integer for edition reference
- **`isPrestige`**: Boolean flag for prestige class status
- **`isVisible`**: Boolean flag for visibility in lists
- **`canCastSpells`**: Boolean flag for spellcasting capability
- **`spellsKnown`**: Boolean flag for spontaneous casting
- **`hitDie`**: Integer, 0-20 range for hit die value
- **`skillPoints`**: Integer, 0-100 range for skill points per level
- **`castingAbilityId`**: Optional positive integer for primary casting ability
- **`castingType`**: Optional enum value from CastingType
- **`babProgression`**: Required enum value from ProgressionType for base attack bonus
- **`fortProgression`**: Required enum value from ProgressionType for Fortitude saves
- **`refProgression`**: Required enum value from ProgressionType for Reflex saves
- **`willProgression`**: Required enum value from ProgressionType for Will saves
- **`description`**: Optional string, maximum 10000 characters for detailed descriptions
- **`sourceBookInfo`**: Optional array of source book references
- **`features`**: Optional array of feature progression schemas
- **`spellcastingProgression`**: Optional array of spellcasting progression schemas
- **`spellsKnownProgression`**: Optional array of spells known progression schemas

**Usage**: Primary validation for class data in API requests and responses.

**Source File**: `packages/shared/schema/src/class.ts` (BaseClassSchema definition)

### **ClassIdParamSchema**

Schema for class ID parameter validation in URL paths.

**Purpose**: Validates and transforms class ID parameters from URL strings to integers.

**Key Validations**:
- **`id`**: Required string that transforms to positive integer

**Usage**: Validates class ID parameters in API routes.

**Source File**: `packages/shared/schema/src/class.ts` (ClassIdParamSchema definition)

### **ClassSummarySchema**

Schema for class summary data, excluding complex nested relationships.

**Purpose**: Validates class data for list views and summary displays.

**Key Validations**:
- **`id`**: Required positive integer for unique identification
- **All Base Fields**: Includes all base class fields except features and spellcasting
- **Excluded Fields**: Omits features and spellcasting progression for performance

**Usage**: Validates class data for list responses and summary displays.

**Source File**: `packages/shared/schema/src/class.ts` (ClassSummarySchema definition)

## 🔧 **Request and Response Schemas**

### **GetAllClassesResponseSchema**

Schema for the response when retrieving all classes.

**Purpose**: Validates paginated class list responses.

**Key Validations**:
- **`total`**: Required integer for total count
- **`results`**: Required array of class summary schemas
- **Pagination Fields**: Includes standard pagination metadata

**Usage**: Validates responses for class list endpoints.

**Source File**: `packages/shared/schema/src/class.ts` (GetAllClassesResponseSchema definition)

### **CreateClassSchema**

Schema for creating new classes with complete data.

**Purpose**: Validates class creation requests with all required data.

**Key Validations**:
- **Base Fields**: All base class fields with appropriate validation
- **Features**: Optional array of feature progression creation schemas
- **Spellcasting**: Optional array of spellcasting progression creation schemas
- **Spells Known**: Optional array of spells known progression creation schemas

**Usage**: Validates class creation requests.

**Source File**: `packages/shared/schema/src/class.ts` (CreateClassSchema definition)

### **UpdateClassSchema**

Schema for updating existing classes with partial data.

**Purpose**: Validates class update requests with optional fields.

**Key Validations**:
- **Base Fields**: All base class fields made optional for partial updates
- **Features**: Optional array of feature progression creation schemas
- **Spellcasting**: Optional array of spellcasting progression creation schemas
- **Spells Known**: Optional array of spells known progression creation schemas

**Usage**: Validates class update requests.

**Source File**: `packages/shared/schema/src/class.ts` (UpdateClassSchema definition)

## 🔗 **Integration Schemas**

### **Feature Integration**

The class system integrates with the feature system through feature progression schemas:

**FeatureProgressionSchema**: Validates feature progression data for class features
**CreateFeatureProgressionSchema**: Validates feature progression creation data
**Feature System Integration**: Links to feature system validation schemas

**Integration Pattern**: The class system uses feature system schemas to validate class feature data, ensuring consistency across both systems.

**Related Documentation**: [Feature System Validation Schemas](../feature-system/validation-schemas.md)

### **Spellcasting Integration**

The class system integrates with the spellcasting system through spellcasting progression schemas:

**SpellcastingProgressionWithSlotsSchema**: Validates spellcasting progression with spell slots
**CreateSpellcastingProgressionSchema**: Validates spellcasting progression creation data
**Spellcasting System Integration**: Links to spellcasting system validation schemas

**Integration Pattern**: The class system uses spellcasting system schemas to validate class spellcasting data, ensuring consistency across both systems.

**Related Documentation**: [Spellcasting System Validation Schemas](../spell-system/validation-schemas.md)

### **Source Book Integration**

The class system integrates with the source book system through source map schemas:

**SourceMapSchema**: Validates source book references and page numbers
**Source Book Integration**: Links to source book system validation schemas

**Integration Pattern**: The class system uses source book system schemas to validate source attribution data, ensuring proper content credit.

**Related Documentation**: [Source Book System Validation Schemas](../source-book-system/validation-schemas.md)

## 📊 **Type Generation**

### **Generated Types**

The validation schemas automatically generate TypeScript types for type safety:

**ClassSummary**: Type for class summary data
**ClassIdParamRequest**: Type for class ID parameter requests
**GetAllClassesResponse**: Type for class list responses
**CreateClassRequest**: Type for class creation requests
**UpdateClassRequest**: Type for class update requests
**DnDClass**: Type for complete class data

**Type Safety Benefits**:
- **Compile-time Validation**: TypeScript catches type errors at compile time
- **IDE Support**: Full IntelliSense and autocomplete support
- **Refactoring Safety**: Safe refactoring with type checking
- **Documentation**: Types serve as living documentation

**Source File**: `packages/shared/schema/src/class.ts` (Type definitions)

## 🔧 **Validation Patterns**

### **String Validation**

**Name Validation**: Class names are required, trimmed, and limited to 100 characters
**Abbreviation Validation**: Class abbreviations are required, trimmed, and limited to 10 characters
**Description Validation**: Class descriptions are optional and limited to 10000 characters

**Validation Benefits**:
- **Data Quality**: Ensures consistent, clean data
- **User Experience**: Provides clear error messages for validation failures
- **Performance**: Prevents overly large strings from affecting performance
- **Display Safety**: Ensures data is safe for display in user interfaces

### **Numeric Validation**

**Hit Die Validation**: Hit die values must be integers in the 0-20 range
**Skill Points Validation**: Skill points must be non-negative integers up to 100
**ID Validation**: All ID fields must be positive integers
**Progression Validation**: Progression values must be valid enum values

**Validation Benefits**:
- **Data Integrity**: Ensures numeric data is within valid ranges
- **Business Logic**: Enforces game mechanics and business rules
- **Error Prevention**: Prevents invalid data from entering the system
- **Type Safety**: Ensures proper numeric types throughout the system

### **Enum Validation**

**ProgressionType Validation**: BAB and saving throw progressions must be valid progression types
**CastingType Validation**: Casting types must be valid casting type enums
**Static Data Integration**: All enums reference static data for consistency

**Validation Benefits**:
- **Consistency**: Ensures consistent enum values across the system
- **Maintainability**: Centralized enum management in static data
- **Type Safety**: Full TypeScript integration with runtime validation
- **Error Prevention**: Prevents invalid enum values from entering the system

## 🔗 **Error Handling**

### **Validation Error Patterns**

The class system follows the shared [Error Handling Patterns](../application-overview/validation-schemas.md#error-handling) with class-specific error scenarios:

**Field Validation Errors**: Specific error messages for each field validation failure
**Business Rule Errors**: Class-specific business rule violations
**Integration Errors**: Errors from related system validations
**Type Conversion Errors**: Errors from string to number conversions

### **Error Message Standards**

**User-Friendly Messages**: Clear, actionable error messages for users
**Field-Specific Messages**: Specific messages for each validation field
**Context Information**: Include context about what was being validated
**Debug Information**: Additional debug information in development mode

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Class system database models and relationships
- **[Static Data](static-data.md)** - Class system enums and types
- **[Backend Implementation](backend-implementation.md)** - Class system backend implementation
- **[Frontend Components](frontend-components.md)** - Class system frontend implementation
- **[Feature System Validation Schemas](../feature-system/validation-schemas.md)** - Feature system validation patterns
- **[Spellcasting System Validation Schemas](../spell-system/validation-schemas.md)** - Spellcasting system validation patterns
- **[Validation Schema Patterns](../application-overview/validation-schemas.md)** - Shared validation patterns and conventions

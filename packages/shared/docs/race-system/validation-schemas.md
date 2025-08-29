# Race System Validation Schemas

*Complete documentation for the race system validation schemas, including Zod schemas, type safety, and validation rules.*

## 📋 **Overview**

The race system uses Zod validation schemas to ensure type safety and data integrity across all API operations. These schemas provide runtime validation, automatic error messages, and TypeScript type generation for the race system's complex data structures.

The validation layer follows the shared [Validation Schema Patterns](../application-overview/validation-schemas.md) with race-specific validation rules and constraints.

**Source File**: `packages/shared/schema/src/race.ts`

## 🏗️ **Schema Architecture**

The race system validation follows the shared [Layered Validation Architecture](../application-overview/validation-schemas.md#layered-validation-architecture) with race-specific implementations:

**Schema Layer**: Zod schemas for runtime validation and type safety
**Type Layer**: TypeScript types generated from schemas for compile-time safety
**Error Layer**: Comprehensive error handling and user feedback
**Integration Layer**: API integration and frontend form validation

### **Schema Hierarchy Pattern**

The race system uses the shared [Schema Hierarchy Pattern](../application-overview/validation-schemas.md#schema-hierarchy-pattern) with race-specific variations:

**Base Schemas**: Core validation for individual entities
**Creation Schemas**: Validation for creating new entities (omitting read-only fields)
**Update Schemas**: Validation for updating existing entities (making fields optional)
**Response Schemas**: Validation for API responses (including computed fields)

### **Static Data Integration**

The race system integrates with static data following the shared [Static Data Integration](../application-overview/validation-schemas.md#static-data-integration) patterns:

**Enum Validation**: Validates against static data enums for type safety
**Reference Validation**: Validates foreign key references against existing data
**Range Validation**: Validates numeric ranges against business rules
**Format Validation**: Validates string formats and patterns

## 🎯 **Core Race Schemas**

### **BaseRaceSchema**

The base schema for race validation, defining all required and optional fields with proper validation rules.

**Purpose**: Validates core race data including name, size, speed, and related data.

**Key Validations**:
- **`name`**: Required string, 1-100 characters, trimmed for display
- **`description`**: Optional string, maximum 10000 characters for detailed descriptions
- **`sizeId`**: Required positive integer for size category reference
- **`speed`**: Required integer, 0-1000 range for movement speed
- **`favoredClassId`**: Integer, -1 or greater for favored class reference
- **`editionId`**: Optional positive integer for edition reference
- **`isVisible`**: Boolean flag for visibility in lists
- **`sources`**: Optional array of source book references
- **`features`**: Optional array of feature progression schemas

**Usage**: Primary validation for race data in API requests and responses.

**Source File**: `packages/shared/schema/src/race.ts` (BaseRaceSchema definition)

### **RaceIdParamSchema**

Schema for race ID parameter validation in URL paths.

**Purpose**: Validates and transforms race ID parameters from URL strings to integers.

**Key Validations**:
- **`id`**: Required string that transforms to positive integer

**Usage**: Validates race ID parameters in API routes.

**Source File**: `packages/shared/schema/src/race.ts` (RaceIdParamSchema definition)

### **RaceSummarySchema**

Schema for race summary data, excluding complex nested relationships.

**Purpose**: Validates race data for list views and summary displays.

**Key Validations**:
- **`id`**: Required positive integer for unique identification
- **All Base Fields**: Includes all base race fields except features
- **Excluded Fields**: Omits features for performance

**Usage**: Validates race data for list responses and summary displays.

**Source File**: `packages/shared/schema/src/race.ts` (RaceSummarySchema definition)

## 🔧 **Request and Response Schemas**

### **GetAllRacesResponseSchema**

Schema for the response when retrieving all races.

**Purpose**: Validates paginated race list responses.

**Key Validations**:
- **`total`**: Required integer for total count
- **`results`**: Required array of race summary schemas
- **Pagination Fields**: Includes standard pagination metadata

**Usage**: Validates responses for race list endpoints.

**Source File**: `packages/shared/schema/src/race.ts` (GetAllRacesResponseSchema definition)

### **CreateRaceSchema**

Schema for creating new races with complete data.

**Purpose**: Validates race creation requests with all required data.

**Key Validations**:
- **Base Fields**: All base race fields with appropriate validation
- **Features**: Optional array of feature progression creation schemas

**Usage**: Validates race creation requests.

**Source File**: `packages/shared/schema/src/race.ts` (CreateRaceSchema definition)

### **UpdateRaceSchema**

Schema for updating existing races with partial data.

**Purpose**: Validates race update requests with optional fields.

**Key Validations**:
- **Base Fields**: All base race fields made optional for partial updates
- **Features**: Optional array of feature progression creation schemas

**Usage**: Validates race update requests.

**Source File**: `packages/shared/schema/src/race.ts` (UpdateRaceSchema definition)

## 🔗 **Integration Schemas**

### **Feature Integration**

The race system integrates with the feature system through feature progression schemas:

**FeatureProgressionSchema**: Validates feature progression data for racial features
**CreateFeatureProgressionSchema**: Validates feature progression creation data
**Feature System Integration**: Links to feature system validation schemas

**Integration Pattern**: The race system uses feature system schemas to validate racial feature data, ensuring consistency across both systems.

**Related Documentation**: [Feature System Validation Schemas](../feature-system/validation-schemas.md)

### **Source Book Integration**

The race system integrates with the source book system through source map schemas:

**SourceMapSchema**: Validates source book references and page numbers
**Source Book Integration**: Links to source book system validation schemas

**Integration Pattern**: The race system uses source book system schemas to validate source attribution data, ensuring proper content credit.

**Related Documentation**: [Source Book System Validation Schemas](../source-book-system/validation-schemas.md)

## 📊 **Type Generation**

### **Generated Types**

The validation schemas automatically generate TypeScript types for type safety:

**RaceSummary**: Type for race summary data
**RaceIdParamRequest**: Type for race ID parameter requests
**GetAllRacesResponse**: Type for race list responses
**CreateRaceRequest**: Type for race creation requests
**UpdateRaceRequest**: Type for race update requests
**Race**: Type for complete race data

**Type Safety Benefits**:
- **Compile-time Validation**: TypeScript catches type errors at compile time
- **IDE Support**: Full IntelliSense and autocomplete support
- **Refactoring Safety**: Safe refactoring with type checking
- **Documentation**: Types serve as living documentation

**Source File**: `packages/shared/schema/src/race.ts` (Type definitions)

## 🔧 **Validation Patterns**

### **String Validation**

**Name Validation**: Race names are required, trimmed, and limited to 100 characters
**Description Validation**: Race descriptions are optional and limited to 10000 characters

**Validation Benefits**:
- **Data Quality**: Ensures consistent, clean data
- **User Experience**: Provides clear error messages for validation failures
- **Performance**: Prevents overly large strings from affecting performance
- **Display Safety**: Ensures data is safe for display in user interfaces

### **Numeric Validation**

**Speed Validation**: Speed values must be non-negative integers up to 1000
**Size ID Validation**: Size ID must be a positive integer
**Favored Class ID Validation**: Favored class ID must be -1 or greater
**ID Validation**: All ID fields must be positive integers

**Validation Benefits**:
- **Data Integrity**: Ensures numeric data is within valid ranges
- **Business Logic**: Enforces game mechanics and business rules
- **Error Prevention**: Prevents invalid data from entering the system
- **Type Safety**: Ensures proper numeric types throughout the system

### **Reference Validation**

**Size ID Validation**: Size ID must reference valid size categories
**Edition ID Validation**: Edition ID must reference valid editions
**Favored Class ID Validation**: Favored class ID must reference valid classes or -1 for none

**Validation Benefits**:
- **Data Consistency**: Ensures all references are valid
- **Referential Integrity**: Maintains proper relationships between entities
- **Error Prevention**: Prevents invalid references from entering the system
- **Type Safety**: Ensures proper reference types throughout the system

## 🔗 **Error Handling**

### **Validation Error Patterns**

The race system follows the shared [Error Handling Patterns](../application-overview/validation-schemas.md#error-handling) with race-specific error scenarios:

**Field Validation Errors**: Specific error messages for each field validation failure
**Business Rule Errors**: Race-specific business rule violations
**Integration Errors**: Errors from related system validations
**Type Conversion Errors**: Errors from string to number conversions

### **Error Message Standards**

**User-Friendly Messages**: Clear, actionable error messages for users
**Field-Specific Messages**: Specific messages for each validation field
**Context Information**: Include context about what was being validated
**Debug Information**: Additional debug information in development mode

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Race system database models and relationships
- **[Static Data](static-data.md)** - Race system enums and types
- **[Backend Implementation](backend-implementation.md)** - Race system backend implementation
- **[Frontend Components](frontend-components.md)** - Race system frontend implementation
- **[Feature System Validation Schemas](../feature-system/validation-schemas.md)** - Feature system validation patterns
- **[Source Book System Validation Schemas](../source-book-system/validation-schemas.md)** - Source book system validation patterns
- **[Validation Schema Patterns](../application-overview/validation-schemas.md)** - Shared validation patterns and conventions

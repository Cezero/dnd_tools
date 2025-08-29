# Spell System Validation Schemas

*Complete documentation for the spell system validation schemas, including Zod schemas, type safety, and validation rules.*

## 📋 **Overview**

The spell system uses Zod validation schemas to ensure type safety and data integrity across all API operations. These schemas provide runtime validation, automatic error messages, and TypeScript type generation for the spell system's complex data structures.

The validation layer follows the shared [Validation Schema Patterns](../application-overview/validation-schemas.md) with spell-specific validation rules and constraints.

**Source File**: `packages/shared/schema/src/spell.ts`

## 🏗️ **Schema Architecture**

The spell system validation follows the shared [Layered Validation Architecture](../application-overview/validation-schemas.md#layered-validation-architecture) with spell-specific implementations:

**Schema Layer**: Zod schemas for runtime validation and type safety
**Type Layer**: TypeScript types generated from schemas for compile-time safety
**Error Layer**: Comprehensive error handling and user feedback
**Integration Layer**: API integration and frontend form validation

### **Schema Hierarchy Pattern**

The spell system uses the shared [Schema Hierarchy Pattern](../application-overview/validation-schemas.md#schema-hierarchy-pattern) with spell-specific variations:

**Base Schemas**: Core validation for individual entities
**Creation Schemas**: Validation for creating new entities (omitting read-only fields)
**Update Schemas**: Validation for updating existing entities (making fields optional)
**Response Schemas**: Validation for API responses (including computed fields)

### **Static Data Integration**

The spell system integrates with static data following the shared [Static Data Integration](../application-overview/validation-schemas.md#static-data-integration) patterns:

**Enum Validation**: Validates against static data enums for type safety
**Reference Validation**: Validates foreign key references against existing data
**Range Validation**: Validates numeric ranges against business rules
**Format Validation**: Validates string formats and patterns

## 🎯 **Core Spell Schemas**

### **SpellSchema**

The base schema for spell validation, defining all required and optional fields with proper validation rules.

**Purpose**: Validates core spell data including name, level, schools, descriptors, and related data.

**Key Validations**:
- **`id`**: Required positive integer for unique identification
- **`name`**: Required string, 1-200 characters, trimmed for display
- **`editionId`**: Required positive integer for edition reference
- **`baseLevel`**: Required integer, 0-20 range for base spell level
- **`summary`**: Optional string, maximum 1000 characters for brief descriptions
- **`description`**: Optional string, maximum 10000 characters for detailed descriptions
- **`castingTime`**: Optional string, maximum 200 characters for casting time
- **`range`**: Optional string, maximum 200 characters for spell range
- **`rangeTypeId`**: Optional positive integer for range type reference
- **`rangeValue`**: Optional string, maximum 100 characters for range value
- **`area`**: Optional string, maximum 200 characters for area of effect
- **`duration`**: Optional string, maximum 200 characters for spell duration
- **`savingThrow`**: Optional string, maximum 200 characters for saving throw info
- **`spellResistance`**: Optional string, maximum 200 characters for spell resistance
- **`effect`**: Optional string, maximum 500 characters for spell effect
- **`target`**: Optional string, maximum 200 characters for spell target
- **`schoolIds`**: Optional array of spell school references
- **`subSchoolIds`**: Optional array of spell subschool references
- **`descriptorIds`**: Optional array of spell descriptor references
- **`componentIds`**: Optional array of spell component references
- **`levelMapping`**: Optional array of class spell level mappings
- **`sourceBookInfo`**: Optional array of source book references

**Usage**: Primary validation for spell data in API requests and responses.

**Source File**: `packages/shared/schema/src/spell.ts` (SpellSchema definition)

### **SpellIdParamSchema**

Schema for spell ID parameter validation in URL paths.

**Purpose**: Validates and transforms spell ID parameters from URL strings to integers.

**Key Validations**:
- **`id`**: Required string that transforms to positive integer

**Usage**: Validates spell ID parameters in API routes.

**Source File**: `packages/shared/schema/src/spell.ts` (SpellIdParamSchema definition)

## 🔧 **Relationship Schemas**

### **SpellSchoolMapSchema**

Schema for spell school relationship validation.

**Purpose**: Validates spell school relationships and references.

**Key Validations**:
- **`schoolId`**: Required non-negative integer for school reference

**Usage**: Validates spell school relationships in spell data.

**Source File**: `packages/shared/schema/src/spell.ts` (SpellSchoolMapSchema definition)

### **SpellSubschoolMapSchema**

Schema for spell subschool relationship validation.

**Purpose**: Validates spell subschool relationships and references.

**Key Validations**:
- **`subSchoolId`**: Required non-negative integer for subschool reference

**Usage**: Validates spell subschool relationships in spell data.

**Source File**: `packages/shared/schema/src/spell.ts` (SpellSubschoolMapSchema definition)

### **SpellDescriptorMapSchema**

Schema for spell descriptor relationship validation.

**Purpose**: Validates spell descriptor relationships and references.

**Key Validations**:
- **`descriptorId`**: Required non-negative integer for descriptor reference

**Usage**: Validates spell descriptor relationships in spell data.

**Source File**: `packages/shared/schema/src/spell.ts` (SpellDescriptorMapSchema definition)

### **SpellComponentMapSchema**

Schema for spell component relationship validation.

**Purpose**: Validates spell component relationships and references.

**Key Validations**:
- **`componentId`**: Required non-negative integer for component reference

**Usage**: Validates spell component relationships in spell data.

**Source File**: `packages/shared/schema/src/spell.ts` (SpellComponentMapSchema definition)

### **SpellLevelMappingSchema**

Schema for class spell level mapping validation.

**Purpose**: Validates class spell level mappings and references.

**Key Validations**:
- **`classId`**: Required positive integer for class reference
- **`level`**: Required integer, 0-9 range for spell level

**Usage**: Validates class spell level mappings in spell data.

**Source File**: `packages/shared/schema/src/spell.ts` (SpellLevelMappingSchema definition)

## 🔧 **Request and Response Schemas**

### **GetAllSpellsResponseSchema**

Schema for the response when retrieving all spells.

**Purpose**: Validates paginated spell list responses.

**Key Validations**:
- **`total`**: Required integer for total count
- **`results`**: Required array of spell schemas
- **Pagination Fields**: Includes standard pagination metadata

**Usage**: Validates responses for spell list endpoints.

**Source File**: `packages/shared/schema/src/spell.ts` (GetAllSpellsResponseSchema definition)

### **UpdateSpellSchema**

Schema for updating existing spells with partial data.

**Purpose**: Validates spell update requests with optional fields.

**Key Validations**:
- **Base Fields**: All base spell fields made optional for partial updates
- **Relationship Fields**: All relationship fields made optional for partial updates

**Usage**: Validates spell update requests.

**Source File**: `packages/shared/schema/src/spell.ts` (UpdateSpellSchema definition)

### **GetSpellResponseSchema**

Schema for spell response data, omitting the ID field.

**Purpose**: Validates spell response data for API responses.

**Key Validations**:
- **All Base Fields**: Includes all base spell fields except ID
- **Relationship Fields**: Includes all relationship fields

**Usage**: Validates spell response data.

**Source File**: `packages/shared/schema/src/spell.ts` (GetSpellResponseSchema definition)

## 🔗 **Integration Schemas**

### **Source Book Integration**

The spell system integrates with the source book system through source map schemas:

**SourceMapSchema**: Validates source book references and page numbers
**Source Book Integration**: Links to source book system validation schemas

**Integration Pattern**: The spell system uses source book system schemas to validate source attribution data, ensuring proper content credit.

**Related Documentation**: [Source Book System Validation Schemas](../source-book-system/validation-schemas.md)

### **Class System Integration**

The spell system integrates with the class system through spell level mapping:

**Level Mapping**: Validates class spell level mappings
**Class Integration**: Links to class system validation schemas

**Integration Pattern**: The spell system uses class system schemas to validate spell level mappings, ensuring proper class spell access.

**Related Documentation**: [Class System Validation Schemas](../class-system/validation-schemas.md)

## 📊 **Type Generation**

### **Generated Types**

The validation schemas automatically generate TypeScript types for type safety:

**SpellIdParamRequest**: Type for spell ID parameter requests
**UpdateSpellRequest**: Type for spell update requests
**GetSpellResponse**: Type for spell response data
**GetAllSpellsResponse**: Type for spell list responses
**Spell**: Type for complete spell data
**SpellSchoolMap**: Type for spell school relationships
**SpellSubschoolMap**: Type for spell subschool relationships
**SpellDescriptorMap**: Type for spell descriptor relationships
**SpellComponentMap**: Type for spell component relationships
**SpellLevelMapping**: Type for class spell level mappings

**Type Safety Benefits**:
- **Compile-time Validation**: TypeScript catches type errors at compile time
- **IDE Support**: Full IntelliSense and autocomplete support
- **Refactoring Safety**: Safe refactoring with type checking
- **Documentation**: Types serve as living documentation

**Source File**: `packages/shared/schema/src/spell.ts` (Type definitions)

## 🔧 **Validation Patterns**

### **String Validation**

**Name Validation**: Spell names are required, trimmed, and limited to 200 characters
**Summary Validation**: Spell summaries are optional and limited to 1000 characters
**Description Validation**: Spell descriptions are optional and limited to 10000 characters
**Field Validation**: All string fields have appropriate length constraints

**Validation Benefits**:
- **Data Quality**: Ensures consistent, clean data
- **User Experience**: Provides clear error messages for validation failures
- **Performance**: Prevents overly large strings from affecting performance
- **Display Safety**: Ensures data is safe for display in user interfaces

### **Numeric Validation**

**Base Level Validation**: Base level values must be integers in the 0-20 range
**Range Type Validation**: Range type IDs must be positive integers
**ID Validation**: All ID fields must be positive integers
**Level Validation**: Spell levels must be integers in the 0-9 range

**Validation Benefits**:
- **Data Integrity**: Ensures numeric data is within valid ranges
- **Business Logic**: Enforces game mechanics and business rules
- **Error Prevention**: Prevents invalid data from entering the system
- **Type Safety**: Ensures proper numeric types throughout the system

### **Reference Validation**

**School ID Validation**: School IDs must reference valid spell schools
**Subschool ID Validation**: Subschool IDs must reference valid spell subschools
**Descriptor ID Validation**: Descriptor IDs must reference valid spell descriptors
**Component ID Validation**: Component IDs must reference valid spell components
**Class ID Validation**: Class IDs must reference valid classes

**Validation Benefits**:
- **Data Consistency**: Ensures all references are valid
- **Referential Integrity**: Maintains proper relationships between entities
- **Error Prevention**: Prevents invalid references from entering the system
- **Type Safety**: Ensures proper reference types throughout the system

## 🔗 **Error Handling**

### **Validation Error Patterns**

The spell system follows the shared [Error Handling Patterns](../application-overview/validation-schemas.md#error-handling) with spell-specific error scenarios:

**Field Validation Errors**: Specific error messages for each field validation failure
**Business Rule Errors**: Spell-specific business rule violations
**Integration Errors**: Errors from related system validations
**Type Conversion Errors**: Errors from string to number conversions

### **Error Message Standards**

**User-Friendly Messages**: Clear, actionable error messages for users
**Field-Specific Messages**: Specific messages for each validation field
**Context Information**: Include context about what was being validated
**Debug Information**: Additional debug information in development mode

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Spell system database models and relationships
- **[Static Data](static-data.md)** - Spell system enums and types
- **[Backend Implementation](backend-implementation.md)** - Spell system backend implementation
- **[Frontend Components](frontend-components.md)** - Spell system frontend implementation
- **[Class System Validation Schemas](../class-system/validation-schemas.md)** - Class system validation patterns
- **[Source Book System Validation Schemas](../source-book-system/validation-schemas.md)** - Source book system validation patterns
- **[Validation Schema Patterns](../application-overview/validation-schemas.md)** - Shared validation patterns and conventions

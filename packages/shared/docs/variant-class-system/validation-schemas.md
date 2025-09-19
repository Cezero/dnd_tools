# Variant Class System - Validation Schemas

*Comprehensive documentation of the Zod validation schemas for the variant class system, including request/response validation, type safety, and business rules.*

## 📋 **Overview**

The variant class system uses comprehensive Zod validation schemas to ensure type safety and data integrity across all API endpoints and frontend components. The schemas follow established patterns with Base, Summary, Create, and Update variants for consistent validation.

The validation system follows the shared [Validation Schema Patterns](../application-overview/validation-schemas.md) with variant-specific business logic and validation rules.

**Source Files**: 
- Validation: `packages/shared/schema/src/variantClass.ts`
- Types: `packages/shared/schema/src/types.ts`

## 🏗️ **Schema Architecture Overview**

The variant class validation system follows the shared [Layered Validation Architecture](../application-overview/validation-schemas.md#layered-validation-architecture) with variant-specific implementations:

**Schema Layer**: Zod schemas for runtime validation and type safety
**Type Layer**: TypeScript types generated from schemas for compile-time safety
**Error Layer**: Comprehensive error handling and user feedback
**Integration Layer**: API integration and frontend form validation

### **Schema Hierarchy Pattern**

The validation system uses a hierarchical schema structure following the shared [Schema Hierarchy Pattern](../application-overview/validation-schemas.md#schema-hierarchy-pattern):

**Base Schemas**: Core validation for individual entities
**Creation Schemas**: Validation for creating new entities (omitting read-only fields)
**Update Schemas**: Validation for updating existing entities (making fields optional)
**Response Schemas**: Validation for API responses (including computed fields)

### **Key Design Principles**

**Override-Based Validation**: Validates variant overrides with complete feature progression objects
**Custom ID Validation**: Validates custom variant IDs and base class relationships
**Feature System Integration**: Leverages existing feature system validation schemas
**Spell System Integration**: Integrates with spell system validation for spell overrides

## 🔧 **Core Schemas**

### **BaseClassVariantSchema**

The base schema for variant class data without ID fields provides comprehensive validation for all variant class properties and relationships.

**Purpose**: Validates complete variant class data including overrides, source attribution, and relationships.

**Validation Rules**:
- **Name Validation**: Required string, 1-100 characters, trimmed of whitespace
- **Abbreviation Validation**: Required string, 1-10 characters, trimmed of whitespace
- **Base Class Reference**: Required positive integer for base class ID
- **Description Validation**: Optional string, up to 10,000 characters, nullable
- **Override Fields**: Nullable fields for class property overrides (hit die, skill points, progressions)
- **Source Attribution**: Array of source book information, nullable
- **Feature Overrides**: Array of feature progression overrides, nullable
- **Spell Overrides**: Array of spell overrides, nullable

**Field Validation**:
- **Class Properties**: Hit die (0-20), skill points (0-100), progression types (enum validation)
- **Override Validation**: Nullable fields allow selective property overrides
- **Array Validation**: Validates feature and spell override arrays with proper item types
- **Business Rules**: Enforces variant-specific business logic through validation constraints

**Source File**: `packages/shared/schema/src/variantClass.ts`

### **ClassVariantSummarySchema**

The schema for variant class lists with ID included provides validation for summary displays and list operations.

**Purpose**: Validates variant class data for list views and summary displays with ID included.

**Usage**: Used for variant class lists and summary displays, ensuring that list data is properly validated and typed.

**ID Validation**: Validates variant IDs with positive integer validation, ensuring that all variant references are valid.

**Schema Structure**: Extends `BaseClassVariantSchema` with required ID field for list operations.

### **CreateClassVariantSchema**

The schema for creating new variant classes provides validation for creation operations and ensures that all required fields are present.

**Purpose**: Validates variant class creation data with proper override handling and required field validation.

**Key Changes**: 
- **Override Schemas**: Uses create schemas for feature and spell overrides (omits ID fields)
- **Required Fields**: Ensures all required fields are present for new variants
- **ID Prevention**: Prevents sending IDs for new records through schema omission
- **Override Validation**: Validates feature and spell overrides with create-specific schemas

**Validation**: Validates creation data through comprehensive validation rules, ensuring that new variants are properly structured and valid.

### **UpdateClassVariantSchema**

The schema for updating existing variant classes provides validation for update operations and ensures that all fields are optional for partial updates.

**Purpose**: Validates variant class update data with partial validation and flexible updates.

**Key Features**: 
- **Partial Validation**: Makes all fields optional for flexible partial updates
- **Override Updates**: Supports updating feature and spell overrides independently
- **Type Safety**: Ensures type safety for partial updates through schema validation
- **Flexible Updates**: Allows updating any combination of variant fields

**Validation**: Validates update data through comprehensive validation rules, ensuring that updates are properly structured and valid.

## 🎯 **Feature Override Schemas**

### **BaseClassVariantFeatureProgressionOverrideSchema**

The base schema for feature progression overrides provides comprehensive validation for feature override operations.

**Purpose**: Validates complete feature progression override data including original progression references, entity removal mappings, and replacement progressions.

**Validation Rules**:
- **ID Fields**: Validates override ID, variant ID, and original progression ID with positive integer validation
- **Nullable Fields**: Allows nullable original progression ID for new feature additions
- **Array Validation**: Validates remove entities and replacement progressions arrays
- **Feature Progression Validation**: Uses existing `FeatureProgressionSchema` for replacement progressions

**Override Types**: Supports three primary override types:
- **Add New Features**: Create entirely new feature progressions for the variant
- **Remove Features**: Remove existing features from the base class
- **Modify Features**: Replace existing features with modified versions, including selective entity removal

**Source File**: `packages/shared/schema/src/variantClass.ts`

### **ClassVariantFeatureProgressionOverrideCreateSchema**

The create schema for feature progression overrides provides validation for creating new feature overrides.

**Purpose**: Validates feature progression override creation data with proper ID omission and create-specific validation.

**Key Changes**: 
- **ID Omission**: Omits ID fields for new records (id, variantId)
- **Create Schemas**: Uses `CreateFeatureProgressionSchema` for replacement progressions
- **Remove Entity Mapping**: Uses create schema for entity removal mappings
- **Data Structure**: Ensures proper data structure for creation operations

**Validation**: Validates creation data through comprehensive validation rules, ensuring that new feature overrides are properly structured and valid.

### **BaseClassVariantFeatureProgressionRemoveEntityMapSchema**

The schema for remove entity mappings provides validation for entity removal operations.

**Purpose**: Tracks which entities should be removed from original feature progressions when applying overrides.

**Validation Rules**:
- **Override ID**: Validates class variant feature progression override ID with positive integer validation
- **Entity ID**: Validates feature entity ID with positive integer validation
- **Relationship Validation**: Ensures proper relationship between override and entity

**Usage**: Used within feature progression overrides to specify which entities should be removed from the original progression.

### **ClassVariantFeatureProgressionRemoveEntityMapCreateSchema**

The create schema for remove entity mappings provides validation for creating new entity removal mappings.

**Purpose**: Validates entity removal mapping creation data with ID omission for new records.

**Key Changes**: Omits `classVariantFeatureProgressionOverrideId` for new records (set by backend).

## 🎯 **Spell Override Schemas**

### **BaseClassVariantSpellOverrideSchema**

The base schema for spell overrides provides comprehensive validation for spell override operations.

**Purpose**: Validates complete spell override data including spell references and level assignments.

**Validation Rules**:
- **ID Fields**: Validates override ID and variant ID with positive integer validation
- **Spell ID**: Validates spell ID with positive integer validation
- **Level Validation**: Validates spell level with range validation (-1 to 9)
- **Business Rules**: Enforces spell override business logic through validation constraints

**Level Validation**: 
- **Addition Level**: Level > 0 for spell additions (1-9)
- **Removal Level**: Level = -1 for spell removals
- **Range Validation**: Ensures levels are within valid spell level ranges

### **ClassVariantSpellOverrideCreateSchema**

The create schema for spell overrides provides validation for creating new spell overrides.

**Purpose**: Validates spell override creation data with proper ID omission and level validation.

**Key Changes**: 
- **ID Omission**: Omits ID fields for new records (id, variantId)
- **Level Validation**: Maintains level range validation for new overrides
- **Spell ID**: Requires spell ID for new overrides
- **Data Structure**: Ensures proper data structure for creation operations

**Validation**: Validates creation data through comprehensive validation rules, ensuring that new spell overrides are properly structured and valid.

## 🔧 **Parameter Schemas**

### **VariantIdParamSchema**

The schema for variant ID parameters provides validation for API endpoints that require variant ID parameters.

**Purpose**: Validates variant ID parameters from URL paths with proper type conversion and validation.

**Usage**: Used for API endpoints that require variant ID parameters, ensuring that variant IDs are properly validated and typed.

**Validation**: 
- **String Input**: Accepts string input from URL parameters
- **Type Conversion**: Transforms string to integer for validation
- **Integer Validation**: Validates converted integer with positive validation
- **Error Handling**: Provides clear error messages for invalid IDs

**Implementation**: Uses Zod transform to convert string parameters to integers for validation.

## 📊 **Type Exports**

### **Core Types**

The system exports comprehensive types for all variant class operations, ensuring type safety across the system.

**Variant Types**:
- **ClassVariant**: Complete variant class data with all fields
- **ClassVariantSummary**: Variant class data with ID for list operations
- **CreateClassVariantRequest**: Variant creation request data
- **UpdateClassVariantRequest**: Variant update request data

**Override Types**:
- **ClassVariantFeatureProgressionOverride**: Complete feature progression override data
- **ClassVariantFeatureProgressionRemoveEntityMap**: Entity removal mapping data
- **ClassVariantSpellOverride**: Complete spell override data

**Create Types**:
- **ClassVariantFeatureProgressionOverrideCreate**: Feature override creation data
- **ClassVariantFeatureProgressionRemoveEntityMapCreate**: Entity removal creation data
- **ClassVariantSpellOverrideCreate**: Spell override creation data

**Parameter Types**:
- **VariantIdParamRequest**: Variant ID parameter request data

### **Type Safety**

The system ensures type safety through comprehensive type exports, ensuring that all variant operations are properly typed and validated.

**Consistency**: The system ensures consistency through established type patterns, ensuring that all variant operations follow the same patterns.

## 🔗 **Cross-System Integration**

### **Feature System Integration**

The variant system integrates with the feature system through shared schemas and established patterns.

**Feature Progression Schema**: The system uses existing `FeatureProgressionSchema` and `CreateFeatureProgressionSchema` for feature override validation, ensuring consistency with the broader feature system.

**Integration Points**: The system integrates with the feature system through established patterns, ensuring consistency and maintainability.

**Schema Reuse**: Leverages existing feature system schemas to avoid duplication and ensure consistency.

### **Spell System Integration**

The variant system integrates with the spell system through spell references and established patterns.

**Spell Validation**: The system validates spell references through established patterns, ensuring that spell overrides are properly structured and valid.

**Integration Points**: The system integrates with the spell system through established patterns, ensuring consistency and maintainability.

**Reference Validation**: Validates spell ID references against existing spell data.

### **Class System Integration**

The variant system integrates with the class system through base class references and established patterns.

**Base Class Validation**: The system validates base class references through established patterns, ensuring that variant classes are properly linked to base classes.

**Integration Points**: The system integrates with the class system through established patterns, ensuring consistency and maintainability.

**Relationship Validation**: Ensures proper relationships between variants and base classes.

## 🛡️ **Error Handling**

### **Validation Error Messages**

The system provides comprehensive error messages for all validation errors, ensuring that users understand what needs to be corrected.

**Field-Specific Messages**: The system provides specific error messages for each field, ensuring that users understand what validation errors occurred and how to fix them.

**Error Message Patterns**: The system uses established error message patterns, ensuring consistency and clarity across all validation errors.

**Business Rule Messages**: Provides clear error messages for business rule violations and constraint violations.

### **Custom Validation**

The system provides custom validation for business rules and complex validation scenarios.

**Business Rule Validation**: The system validates business rules through custom validation functions, ensuring that variant data follows established business rules.

**Validation Patterns**: The system uses established validation patterns, ensuring consistency and maintainability across all validation scenarios.

**Constraint Validation**: Enforces database constraints and business rules through validation.

## 📈 **Performance Considerations**

### **Schema Optimization**

The system optimizes validation performance through efficient validation patterns and established optimization techniques.

**Efficient Validation**: The system uses specific Zod types for better performance, enum validation for known values, and array validation with specific item types.

**Validation Patterns**: The system uses established validation patterns, ensuring efficient validation and consistent performance.

**Schema Reuse**: Leverages existing schemas to avoid duplication and improve performance.

### **Error Handling Performance**

The system optimizes error handling performance through efficient error messages and established optimization techniques.

**Efficient Error Messages**: The system uses specific error messages for better performance and transform functions for type conversion.

**Error Handling Patterns**: The system uses established error handling patterns, ensuring efficient error handling and consistent performance.

## 🔧 **Testing Strategy**

### **Schema Testing**

The system provides comprehensive schema testing for all validation scenarios and edge cases.

**Unit Testing**: The system tests validation through established patterns, ensuring proper functionality and error handling.

**Integration Testing**: The system tests integration through established patterns, ensuring proper functionality and error handling.

**Edge Case Testing**: Tests boundary conditions and edge cases for comprehensive validation coverage.

### **Error Testing**

The system provides comprehensive error testing for validation errors and edge cases.

**Validation Testing**: The system tests validation through established patterns, ensuring proper error handling and user feedback.

**Edge Case Testing**: The system tests edge cases through established patterns, ensuring proper error handling and user feedback.

**Business Rule Testing**: Tests business rule validation and constraint enforcement.

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Variant class system database models and relationships
- **[Static Data](static-data.md)** - Variant class system enums and types
- **[Backend Implementation](backend-implementation.md)** - Backend implementation details
- **[Frontend Implementation](frontend-implementation.md)** - Frontend implementation details
- **[Validation Schema Patterns](../application-overview/validation-schemas.md)** - Shared validation patterns and conventions
- **[Feature System Validation Schemas](../feature-system/validation-schemas.md)** - Feature system validation integration

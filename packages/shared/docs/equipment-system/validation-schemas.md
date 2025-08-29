# Equipment System Validation Schemas

*Complete documentation for the equipment system validation schemas, including Zod schemas, type safety, and validation rules.*

## 📋 **Overview**

The equipment system uses Zod validation schemas to ensure type safety and data integrity across all API operations. These schemas provide runtime validation, automatic error messages, and TypeScript type generation for the equipment system's complex data structures.

The validation layer follows the shared [Validation Schema Patterns](../application-overview/validation-schemas.md) with equipment-specific validation rules and constraints.

**Source File**: `shared/schema/src/item.ts`

## 🏗️ **Schema Architecture**

The equipment system validation follows the shared [Layered Validation Architecture](../application-overview/validation-schemas.md#layered-validation-architecture) with equipment-specific implementations:

**Schema Layer**: Zod schemas for runtime validation and type safety
**Type Layer**: TypeScript types generated from schemas for compile-time safety
**Error Layer**: Comprehensive error handling and user feedback
**Integration Layer**: API integration and frontend form validation

### **Schema Hierarchy Pattern**

The equipment system uses the shared [Schema Hierarchy Pattern](../application-overview/validation-schemas.md#schema-hierarchy-pattern) with equipment-specific variations:

**Base Schemas**: Core validation for individual entities
**Creation Schemas**: Validation for creating new entities (omitting read-only fields)
**Update Schemas**: Validation for updating existing entities (making fields optional)
**Response Schemas**: Validation for API responses (including computed fields)

### **Static Data Integration**

The equipment system integrates with static data following the shared [Static Data Integration](../application-overview/validation-schemas.md#static-data-integration) patterns:

**Enum Validation**: Validates against static data enums for type safety
**Reference Validation**: Validates foreign key references against existing data
**Range Validation**: Validates numeric ranges against business rules
**Format Validation**: Validates string formats and patterns

## 🎯 **Core Equipment Schemas**

### **BaseItemSchema**

The base schema for equipment validation, defining all required and optional fields with proper validation rules.

**Purpose**: Validates core equipment data including name, type, descriptions, cost, weight, and quantity.

**Key Validations**:
- **`name`**: Required string, 1-100 characters, trimmed for display
- **`description`**: Optional string, maximum 10000 characters for detailed descriptions
- **`typeId`**: Required positive integer for equipment type reference
- **`cost`**: Optional decimal string, 0-999999.99 for equipment cost
- **`weight`**: Optional decimal string, 0-999.99 for equipment weight
- **`quantity`**: Optional non-negative integer for equipment quantity

**Usage**: Primary validation for equipment data in API requests and responses.

**Source File**: `shared/schema/src/item.ts` (BaseItemSchema definition)

### **ItemSchema**

The complete equipment schema including the ID field for database operations.

**Purpose**: Validates complete equipment data including the unique identifier.

**Key Validations**:
- **`id`**: Required integer (-1 for all items or positive integer) for unique identification
- **All Base Fields**: Includes all base equipment fields with appropriate validation

**Usage**: Complete equipment validation for database operations and responses.

**Source File**: `shared/schema/src/item.ts` (ItemSchema definition)

### **ItemIdParamSchema**

Schema for equipment ID parameter validation in URL paths.

**Purpose**: Validates and transforms equipment ID parameters from URL strings to integers.

**Key Validations**:
- **`id`**: Required string that transforms to integer

**Usage**: Validates equipment ID parameters in API routes.

**Source File**: `shared/schema/src/item.ts` (ItemIdParamSchema definition)

## 🔧 **Equipment Extension Schemas**

### **ArmorSchema**

Schema for armor-specific data validation.

**Purpose**: Validates armor-specific data and properties for equipment that are armor.

**Key Validations**:
- **`category`**: Required integer for armor category reference
- **`bonus`**: Optional integer for armor bonus
- **`dexterityCap`**: Optional integer for dexterity cap
- **`checkPenalty`**: Optional integer for skill check penalty
- **`arcaneSpellFailure`**: Optional integer for arcane spell failure chance
- **`speedCapThirty`**: Optional integer for speed cap at 30 feet
- **`speedCapTwenty`**: Optional integer for speed cap at 20 feet

**Usage**: Validates armor-specific data in equipment creation and updates.

**Source File**: `shared/schema/src/item.ts` (ArmorSchema definition)

### **WeaponSchema**

Schema for weapon-specific data validation.

**Purpose**: Validates weapon-specific data and properties for equipment that are weapons.

**Key Validations**:
- **`category`**: Required integer for weapon category reference
- **`type`**: Required integer for weapon type reference
- **`attackBonus`**: Optional integer for attack bonus
- **`damageSmall`**: Optional string for small creature damage
- **`damageMedium`**: Optional string for medium creature damage
- **`critical`**: Optional string for critical hit information
- **`range`**: Optional string for weapon range
- **`damageType`**: Optional string for damage type
- **`reach`**: Optional boolean for reach weapon flag
- **`double`**: Optional boolean for double weapon flag
- **`nonlethal`**: Optional boolean for nonlethal weapon flag

**Usage**: Validates weapon-specific data in equipment creation and updates.

**Source File**: `shared/schema/src/item.ts` (WeaponSchema definition)

## 🔧 **Request and Response Schemas**

### **ItemQuerySchema**

Schema for equipment query request validation with discriminated union.

**Purpose**: Validates equipment query requests with different query types.

**Key Validations**:
- **`queryType`**: Required enum value ('byType', 'byCategory', 'byName') for query type
- **`typeId`**: Required for byType and byCategory queries
- **`category`**: Required for byCategory queries
- **`name`**: Required for byName queries

**Usage**: Validates equipment query requests.

**Source File**: `shared/schema/src/item.ts` (ItemQuerySchema definition)

### **GetAllItemsResponseSchema**

Schema for the response when retrieving all equipment.

**Purpose**: Validates paginated equipment list responses.

**Key Validations**:
- **`total`**: Required integer for total count
- **`results`**: Required array of equipment schemas with weapon and armor relationships
- **Pagination Fields**: Includes standard pagination metadata

**Usage**: Validates responses for equipment list endpoints.

**Source File**: `shared/schema/src/item.ts` (GetAllItemsResponseSchema definition)

### **ItemWithDetailsSchema**

Schema for equipment with weapon and armor details.

**Purpose**: Validates equipment responses that include weapon and armor relationships.

**Key Validations**:
- **Base Equipment**: All base equipment fields with appropriate validation
- **`armor`**: Optional armor schema for armor-specific data
- **`weapon`**: Optional weapon schema for weapon-specific data

**Usage**: Validates equipment responses with detailed weapon and armor information.

**Source File**: `shared/schema/src/item.ts` (ItemWithDetailsSchema definition)

### **CreateItemSchema**

Schema for creating new equipment with weapon and armor data.

**Purpose**: Validates equipment creation requests with optional weapon and armor data.

**Key Validations**:
- **Base Equipment**: All base equipment fields with appropriate validation
- **`armor`**: Optional armor schema for armor-specific data
- **`weapon`**: Optional weapon schema for weapon-specific data

**Usage**: Validates equipment creation requests.

**Source File**: `shared/schema/src/item.ts` (CreateItemSchema definition)

### **UpdateItemSchema**

Schema for updating existing equipment with partial data.

**Purpose**: Validates equipment update requests with optional fields.

**Key Validations**:
- **Base Fields**: All base equipment fields made optional for partial updates
- **Relationship Fields**: All relationship fields made optional for partial updates

**Usage**: Validates equipment update requests.

**Source File**: `shared/schema/src/item.ts` (UpdateItemSchema definition)

## 🔗 **Integration Schemas**

### **Character System Integration**

The equipment system integrates with the character system through equipment selection and usage:

**Equipment Selection**: Characters can select and acquire equipment
**Equipment Usage**: Characters can use equipment for combat and other activities
**Equipment Benefits**: Character abilities are modified by equipment
**Equipment Restrictions**: Equipment restrictions based on character capabilities

**Integration Pattern**: The equipment system provides the framework for character equipment management, with character abilities and proficiencies determining equipment access and usage.

**Related Documentation**: [Character Management Validation Schemas](../character-management/validation-schemas.md)

## 📊 **Type Generation**

### **Generated Types**

The validation schemas automatically generate TypeScript types for type safety:

**ItemIdParamRequest**: Type for equipment ID parameter requests
**ItemQueryRequest**: Type for equipment query requests
**CreateItemRequest**: Type for equipment creation requests
**UpdateItemRequest**: Type for equipment update requests
**GetAllItemsResponse**: Type for equipment list responses
**ItemWithDetails**: Type for complete equipment data with relationships
**ItemPropertyTypeEnum**: Type for item property type enums
**ItemApplicableTypeEnum**: Type for item applicable type enums

**Type Safety Benefits**:
- **Compile-time Validation**: TypeScript catches type errors at compile time
- **IDE Support**: Full IntelliSense and autocomplete support
- **Refactoring Safety**: Safe refactoring with type checking
- **Documentation**: Types serve as living documentation

**Source File**: `shared/schema/src/item.ts` (Type definitions)

## 🔧 **Validation Patterns**

### **String Validation**

**Name Validation**: Equipment names are required, trimmed, and limited to 100 characters
**Description Validation**: Equipment descriptions are optional and limited to 10000 characters
**Damage Validation**: Weapon damage strings are optional and flexible
**Range Validation**: Weapon range strings are optional and flexible

**Validation Benefits**:
- **Data Quality**: Ensures consistent, clean data
- **User Experience**: Provides clear error messages for validation failures
- **Performance**: Prevents overly large strings from affecting performance
- **Display Safety**: Ensures data is safe for display in user interfaces

### **Numeric Validation**

**Type ID Validation**: Type ID must be a positive integer
**Category Validation**: Category values must be integers
**Cost Validation**: Cost must be between 0 and 999999.99
**Weight Validation**: Weight must be between 0 and 999.99
**Quantity Validation**: Quantity must be non-negative

**Validation Benefits**:
- **Data Integrity**: Ensures numeric data is within valid ranges
- **Business Logic**: Enforces game mechanics and business rules
- **Error Prevention**: Prevents invalid data from entering the system
- **Type Safety**: Ensures proper numeric types throughout the system

### **Decimal Validation**

**Cost Validation**: Cost values are validated as decimal strings with proper range checking
**Weight Validation**: Weight values are validated as decimal strings with proper range checking
**Decimal Transformation**: String values are transformed to Decimal objects for precision

**Validation Benefits**:
- **Precision**: Ensures accurate decimal calculations
- **Range Safety**: Prevents invalid decimal values
- **Type Consistency**: Maintains consistent decimal handling
- **Business Rules**: Enforces proper cost and weight ranges

### **Reference Validation**

**Type ID Validation**: Type IDs must reference valid equipment types
**Category Validation**: Category values must reference valid weapon or armor categories
**Weapon Type Validation**: Weapon type values must reference valid weapon types

**Validation Benefits**:
- **Data Consistency**: Ensures all references are valid
- **Referential Integrity**: Maintains proper relationships between entities
- **Error Prevention**: Prevents invalid references from entering the system
- **Type Safety**: Ensures proper reference types throughout the system

## 🔗 **Error Handling**

### **Validation Error Patterns**

The equipment system follows the shared [Error Handling Patterns](../application-overview/validation-schemas.md#error-handling) with equipment-specific error scenarios:

**Field Validation Errors**: Specific error messages for each field validation failure
**Business Rule Errors**: Equipment-specific business rule violations
**Integration Errors**: Errors from related system validations
**Type Conversion Errors**: Errors from string to number conversions

### **Error Message Standards**

**User-Friendly Messages**: Clear, actionable error messages for users
**Field-Specific Messages**: Specific messages for each validation field
**Context Information**: Include context about what was being validated
**Debug Information**: Additional debug information in development mode

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Equipment system database models and relationships
- **[Static Data](static-data.md)** - Equipment system enums and types
- **[Backend Implementation](backend-implementation.md)** - Equipment system backend implementation
- **[Frontend Components](frontend-components.md)** - Equipment system frontend implementation
- **[Character Management Validation Schemas](../character-management/validation-schemas.md)** - Character system validation patterns
- **[Validation Schema Patterns](../application-overview/validation-schemas.md)** - Shared validation patterns and conventions

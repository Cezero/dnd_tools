# Skill System Validation Schemas

*Complete documentation for the skill system validation schemas, including Zod schemas, type safety, and validation rules.*

## 📋 **Overview**

The skill system uses Zod validation schemas to ensure type safety and data integrity across all API operations. These schemas provide runtime validation, automatic error messages, and TypeScript type generation for the skill system's complex data structures.

The validation layer follows the shared [Validation Schema Patterns](../application-overview/validation-schemas.md) with skill-specific validation rules and constraints.

**Source File**: `packages/shared/schema/src/skill.ts`

## 🏗️ **Schema Architecture**

The skill system validation follows the shared [Layered Validation Architecture](../application-overview/validation-schemas.md#layered-validation-architecture) with skill-specific implementations:

**Schema Layer**: Zod schemas for runtime validation and type safety
**Type Layer**: TypeScript types generated from schemas for compile-time safety
**Error Layer**: Comprehensive error handling and user feedback
**Integration Layer**: API integration and frontend form validation

### **Schema Hierarchy Pattern**

The skill system uses the shared [Schema Hierarchy Pattern](../application-overview/validation-schemas.md#schema-hierarchy-pattern) with skill-specific variations:

**Base Schemas**: Core validation for individual entities
**Creation Schemas**: Validation for creating new entities (omitting read-only fields)
**Update Schemas**: Validation for updating existing entities (making fields optional)
**Response Schemas**: Validation for API responses (including computed fields)

### **Static Data Integration**

The skill system integrates with static data following the shared [Static Data Integration](../application-overview/validation-schemas.md#static-data-integration) patterns:

**Enum Validation**: Validates against static data enums for type safety
**Reference Validation**: Validates foreign key references against existing data
**Range Validation**: Validates numeric ranges against business rules
**Format Validation**: Validates string formats and patterns

## 🎯 **Core Skill Schemas**

### **SkillSchema**

The base schema for skill validation, defining all required and optional fields with proper validation rules.

**Purpose**: Validates core skill data including name, key ability, training requirements, and related data.

**Key Validations**:
- **`id`**: Required positive integer for unique identification
- **`name`**: Required string, 1-100 characters, trimmed for display
- **`abilityId`**: Required integer, 0 or higher for key ability reference
- **`trainedOnly`**: Optional boolean for training requirement
- **`affectedByArmor`**: Boolean flag for armor check penalty, defaults to false
- **`isAnalog`**: Boolean flag for analog skill type, defaults to false
- **`hasSubtypes`**: Boolean flag indicating if skill uses predefined subtypes (Craft, Knowledge), defaults to false
- **`usesCustomSubtype`**: Boolean flag indicating if skill uses custom subtypes (Perform, Profession), defaults to false
- **`hasNoMaxRanks`**: Boolean flag indicating if skill has no maximum rank limit (Speak Language), defaults to false
- **`doubleArmorPenalty`**: Boolean flag indicating if skill has double armor check penalty (Swim), defaults to false
- **`description`**: Optional string, maximum 10000 characters for detailed descriptions
- **`checkDescription`**: Optional string, maximum 10000 characters for check mechanics
- **`actionDescription`**: Optional string, maximum 10000 characters for action requirements
- **`retryTypeId`**: Optional integer, 0 or higher for retry type reference
- **`retryDescription`**: Optional string, maximum 10000 characters for retry rules
- **`specialNotes`**: Optional string, maximum 10000 characters for special rules
- **`synergyNotes`**: Optional string, maximum 10000 characters for synergy bonuses
- **`untrainedNotes`**: Optional string, maximum 10000 characters for untrained use
- **`restrictionNotes`**: Optional string, maximum 10000 characters for restrictions
- **`subtypes`**: Optional array of skill subtypes (for skills with predefined subtypes)

**Usage**: Primary validation for skill data in API requests and responses.

**Source File**: `packages/shared/schema/src/skill.ts` (SkillSchema definition)

### **SkillIdParamSchema**

Schema for skill ID parameter validation in URL paths.

**Purpose**: Validates and transforms skill ID parameters from URL strings to integers.

**Key Validations**:
- **`id`**: Required string that transforms to positive integer

**Usage**: Validates skill ID parameters in API routes.

**Source File**: `packages/shared/schema/src/skill.ts` (SkillIdParamSchema definition)

### **SkillSubtypeSchema**

Schema for skill subtype validation, defining subtypes for skills with predefined subtypes (Craft, Knowledge).

**Purpose**: Validates skill subtype data including parent skill reference and subtype name.

**Key Validations**:
- **`id`**: Required positive integer for unique identification
- **`skillId`**: Required positive integer for parent skill reference
- **`name`**: Required string, 1-100 characters, trimmed for display
- **`editionId`**: Required positive integer for edition reference
- **`isVisible`**: Boolean flag for visibility in UI, defaults to true

**Usage**: Validates skill subtype data in API requests and responses.

**Source File**: `packages/shared/schema/src/skill.ts` (SkillSubtypeSchema definition)

### **SkillSubtypeCacheSchema**

Schema for skill subtype cache entries, omitting fields not needed in the frontend cache.

**Purpose**: Validates lightweight skill subtype data for frontend caching.

**Key Validations**:
- **`id`**: Required positive integer for unique identification
- **`name`**: Required string, 1-100 characters, trimmed for display
- **Omitted Fields**: `skillId`, `editionId`, `isVisible` are omitted from cache entries

**Usage**: Validates skill subtype data in skills-cache API responses.

**Source File**: `packages/shared/schema/src/skill.ts` (SkillSubtypeCacheSchema definition)

## 🔧 **Request and Response Schemas**

### **GetAllSkillsResponseSchema**

Schema for the response when retrieving all skills.

**Purpose**: Validates paginated skill list responses.

**Key Validations**:
- **`total`**: Required integer for total count
- **`results`**: Required array of skill schemas
- **Pagination Fields**: Includes standard pagination metadata

**Usage**: Validates responses for skill list endpoints.

**Source File**: `packages/shared/schema/src/skill.ts` (GetAllSkillsResponseSchema definition)

### **CreateSkillSchema**

Schema for creating new skills with complete data.

**Purpose**: Validates skill creation requests with all required data.

**Key Validations**:
- **Base Fields**: All base skill fields with appropriate validation
- **Omitted Fields**: Omits ID field for creation

**Usage**: Validates skill creation requests.

**Source File**: `packages/shared/schema/src/skill.ts` (CreateSkillSchema definition)

### **UpdateSkillSchema**

Schema for updating existing skills with partial data.

**Purpose**: Validates skill update requests with optional fields.

**Key Validations**:
- **Base Fields**: All base skill fields made optional for partial updates
- **Omitted Fields**: Omits ID field for updates

**Usage**: Validates skill update requests.

**Source File**: `packages/shared/schema/src/skill.ts` (UpdateSkillSchema definition)

### **GetSkillResponseSchema**

Schema for skill response data, omitting the ID field.

**Purpose**: Validates skill response data for API responses.

**Key Validations**:
- **All Base Fields**: Includes all base skill fields except ID
- **Response Format**: Proper response format for API endpoints

**Usage**: Validates skill response data.

**Source File**: `packages/shared/schema/src/skill.ts` (GetSkillResponseSchema definition)

### **SkillCacheSchema**

Schema for skill cache entries, providing lightweight skill data for frontend use.

**Purpose**: Validates skill cache data including subtypes and special behavior flags, optimized for frontend caching.

**Key Validations**:
- **Base Skill Fields**: Includes core skill fields (id, name, abilityId, trainedOnly, editionId, isVisible, isAnalog)
- **Special Behavior Flags**: Includes `hasSubtypes`, `usesCustomSubtype`, `hasNoMaxRanks`, `doubleArmorPenalty` flags
- **Subtypes Array**: Optional array of `SkillSubtypeCacheEntry` objects
- **Omitted Fields**: Omits detailed description fields and source book info for performance

**Usage**: Validates skill cache data in skills-cache API responses.

**Source File**: `packages/shared/schema/src/skill.ts` (SkillCacheSchema definition)

### **SkillCacheResponseSchema**

Schema for the skills-cache API response.

**Purpose**: Validates paginated skill cache list responses.

**Key Validations**:
- **`total`**: Required integer for total count
- **`results`**: Required array of skill cache schemas
- **Pagination Fields**: Includes standard pagination metadata

**Usage**: Validates responses for skills-cache endpoint.

**Source File**: `packages/shared/schema/src/skill.ts` (SkillCacheResponseSchema definition)

## 🔗 **Integration Schemas**

### **Ability System Integration**

The skill system integrates with the ability system through key ability references:

**Ability ID Validation**: Skill ability IDs are validated against ability system
**Ability Integration**: Links to ability system validation schemas

**Integration Pattern**: The skill system uses ability system schemas to validate key ability references, ensuring proper ability modifier usage in skill calculations.

**Related Documentation**: [Ability System Validation Schemas](../ability-system/validation-schemas.md)

### **Character System Integration**

The skill system integrates with the character system through skill management:

**Character Skills**: Characters can have skill ranks and bonuses
**Skill Progression**: Character skill progression follows class and level rules
**Skill Checks**: Characters make skill checks using their skill ranks and ability modifiers

**Integration Pattern**: The skill system provides the framework for character skill management, with character classes and levels determining skill access and progression.

**Related Documentation**: [Character Management Validation Schemas](../character-management/validation-schemas.md)

### **CharacterBonusSkillRankSchema**

Validates DM-granted bonus ranks on a character. Defined in `packages/shared/schema/src/character.ts`, not `skill.ts`.

**Key Validations**:
- **`skillId`**: Required positive integer
- **`skillSubId`**: Nullable positive integer for Craft / Knowledge
- **`customSubtype`**: Nullable string, max 100 characters, for Perform / Profession
- **`ranks`**: Required positive integer
- **`description`**: Required string, 1–255 characters

Draft (`CharacterBonusSkillRankDraftSchema`) and create (`CreateCharacterBonusSkillRankSchema`) variants follow the same nested-collection pattern as attack definitions. `bonusSkillRanks` is optional on `CharacterWithAllDetailsSchema`, `CharacterEditStateSchema`, and `SaveCharacterSchema`.

## 📊 **Type Generation**

### **Generated Types**

The validation schemas automatically generate TypeScript types for type safety:

**SkillIdParamRequest**: Type for skill ID parameter requests
**Skill**: Type for complete skill data
**SkillSubtype**: Type for skill subtype data
**SkillSubtypeCacheEntry**: Type for skill subtype cache entries
**SkillCacheEntry**: Type for skill cache entries
**SkillCacheResponse**: Type for skill cache API responses
**GetAllSkillsResponse**: Type for skill list responses
**GetSkillResponse**: Type for skill response data
**CreateSkillRequest**: Type for skill creation requests
**UpdateSkillRequest**: Type for skill update requests

**Type Safety Benefits**:
- **Compile-time Validation**: TypeScript catches type errors at compile time
- **IDE Support**: Full IntelliSense and autocomplete support
- **Refactoring Safety**: Safe refactoring with type checking
- **Documentation**: Types serve as living documentation

**Source File**: `packages/shared/schema/src/skill.ts` (Type definitions)

## 🔧 **Validation Patterns**

### **String Validation**

**Name Validation**: Skill names are required, trimmed, and limited to 100 characters
**Description Validation**: Skill descriptions are optional and limited to 10000 characters
**Notes Validation**: All note fields are optional and limited to 10000 characters

**Validation Benefits**:
- **Data Quality**: Ensures consistent, clean data
- **User Experience**: Provides clear error messages for validation failures
- **Performance**: Prevents overly large strings from affecting performance
- **Display Safety**: Ensures data is safe for display in user interfaces

### **Numeric Validation**

**Ability ID Validation**: Ability ID must be 0 or higher
**Retry Type ID Validation**: Retry type ID must be 0 or higher
**ID Validation**: All ID fields must be positive integers

**Validation Benefits**:
- **Data Integrity**: Ensures numeric data is within valid ranges
- **Business Logic**: Enforces game mechanics and business rules
- **Error Prevention**: Prevents invalid data from entering the system
- **Type Safety**: Ensures proper numeric types throughout the system

### **Boolean Validation**

**Trained Only Validation**: Boolean flag for training requirements
**Affected By Armor Validation**: Boolean flag for armor check penalties
**Is Analog Validation**: Boolean flag for analog skill types
**Has Subtypes Validation**: Boolean flag for skills with predefined subtypes (Craft, Knowledge)
**Uses Custom Subtype Validation**: Boolean flag for skills with custom subtypes (Perform, Profession)
**Has No Max Ranks Validation**: Boolean flag for skills with no maximum rank limit (Speak Language)
**Double Armor Penalty Validation**: Boolean flag for skills with double armor check penalty (Swim)

**Validation Benefits**:
- **Data Consistency**: Ensures boolean flags are properly set
- **Game Mechanics**: Enforces proper skill mechanics and rules
- **Error Prevention**: Prevents invalid boolean values from entering the system
- **Type Safety**: Ensures proper boolean types throughout the system
- **Dynamic Behavior**: Enables database-driven special behavior identification

### **Reference Validation**

**Ability ID Validation**: Ability ID must reference valid abilities
**Retry Type ID Validation**: Retry type ID must reference valid retry types

**Validation Benefits**:
- **Data Consistency**: Ensures all references are valid
- **Referential Integrity**: Maintains proper relationships between entities
- **Error Prevention**: Prevents invalid references from entering the system
- **Type Safety**: Ensures proper reference types throughout the system

## 🔗 **Error Handling**

### **Validation Error Patterns**

The skill system follows the shared [Error Handling Patterns](../application-overview/validation-schemas.md#error-handling) with skill-specific error scenarios:

**Field Validation Errors**: Specific error messages for each field validation failure
**Business Rule Errors**: Skill-specific business rule violations
**Integration Errors**: Errors from related system validations
**Type Conversion Errors**: Errors from string to number conversions

### **Error Message Standards**

**User-Friendly Messages**: Clear, actionable error messages for users
**Field-Specific Messages**: Specific messages for each validation field
**Context Information**: Include context about what was being validated
**Debug Information**: Additional debug information in development mode

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Skill system database models and relationships
- **[Static Data](static-data.md)** - Skill system enums and types
- **[Backend Implementation](backend-implementation.md)** - Skill system backend implementation
- **[Frontend Components](frontend-components.md)** - Skill system frontend implementation
- **[Ability System Validation Schemas](../ability-system/validation-schemas.md)** - Ability system validation patterns
- **[Character Management Validation Schemas](../character-management/validation-schemas.md)** - Character system validation patterns
- **[Validation Schema Patterns](../application-overview/validation-schemas.md)** - Shared validation patterns and conventions

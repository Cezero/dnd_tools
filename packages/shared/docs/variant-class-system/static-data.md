# Variant Class System - Static Data

*Comprehensive documentation of static data, constants, and utilities used by the variant class system.*

## 📋 **Overview**

The variant class system leverages existing static data from the class, feature, and spell systems while adding variant-specific constants and utilities. The system uses established patterns for static data organization and provides utilities for variant identification and management.

The static data system follows the shared [Static Data Patterns](../application-overview/static-data.md) with variant-specific business logic and utility functions.

**Source Files**: 
- Static Data: `packages/shared/static-data/src/ClassData.ts`, `packages/shared/static-data/src/FeatureData.ts`
- Shared Utils: `packages/shared/utils/src/VariantOverrideUtils.ts`

## 🏗️ **Static Data Architecture Overview**

The variant class static data system follows the shared [Static Data Architecture](../application-overview/static-data.md#static-data-architecture) with variant-specific implementations:

**Enum Layer**: Enums and constants for variant identification and management
**Utility Layer**: Utility functions for variant operations and calculations
**Integration Layer**: Integration with existing class, feature, and spell systems
**Performance Layer**: Caching and optimization for frequently accessed data

### **Data Organization Pattern**

The variant system uses established patterns for static data organization:

**Existing Data Leverage**: Leverages existing class, feature, and spell system static data
**Variant-Specific Extensions**: Adds variant-specific constants and utilities
**Utility Functions**: Provides comprehensive utilities for variant operations
**Integration Points**: Integrates with existing systems through established patterns

### **Key Design Principles**

**Custom ID Generation**: Uses `baseClassId * 100000 + variantId` for unique identification
**Override Management**: Provides utilities for feature and spell override management
**Integration Support**: Supports integration with class, feature, and spell systems
**Performance Optimization**: Optimizes data access and calculations

## 🔧 **Core Utilities**

### **Variant Identification**

The system provides comprehensive utilities for variant identification and management through custom ID generation and analysis.

**Custom ID Generation**: The system uses a simple formula that combines base class ID and variant ID to create unique identifiers. This approach ensures unique identification while maintaining relationships to base classes.

**ID Analysis**: The system provides utilities for analyzing variant IDs, extracting base class IDs, and determining if an ID represents a variant class.

**Core Functions**:

**isVariantId**: Determines if an ID represents a variant class
- **Parameters**: `id: number` - The ID to check
- **Business Logic**: Checks if ID is greater than 100000 (indicating a variant ID)
- **Returns**: `boolean` - True if the ID represents a variant class
- **Usage**: Used in frontend for mode detection and ID validation

**extractBaseClassId**: Extracts the base class ID from a variant ID
- **Parameters**: `variantId: number` - The variant ID to analyze
- **Business Logic**: Divides variant ID by 100000 to get base class ID
- **Returns**: `number` - The base class ID
- **Usage**: Used for base class retrieval and variant resolution

**calculateVariantId**: Calculates a custom variant ID from base class and variant IDs
- **Parameters**: `baseClassId: number, variantId: number` - Base class ID and variant ID
- **Business Logic**: Uses formula `baseClassId * 100000 + variantId`
- **Returns**: `number` - The custom variant ID
- **Usage**: Used for variant creation and ID generation

**Source File**: `packages/shared/static-data/src/ClassData.ts`

### **Variant ID Ranges**

The system defines comprehensive ID range constants and validation utilities for variant identification.

**ID Range Definitions**: The system defines minimum and maximum variant IDs, base class multipliers, and maximum variants per class through established constants.

**Range Validation**: The system provides utilities for validating variant IDs and base class IDs, ensuring that all variant references are valid.

**Constants**:
- **VARIANT_ID_MULTIPLIER**: 100000 - Multiplier for custom ID generation
- **MIN_VARIANT_ID**: 1 - Minimum variant ID for each base class
- **MAX_VARIANTS_PER_CLASS**: 99999 - Maximum variants per base class
- **VARIANT_ID_THRESHOLD**: 100000 - Threshold for variant ID detection

## 🎯 **Feature Source Types**

### **FeatureSourceType Integration**

The variant system extends the existing `FeatureSourceType` enum to support variant classes through established patterns.

**Source Type Extension**: The system adds `FeatureSourceType.ClassVariant` to support variant classes, ensuring that variant features are properly identified and managed.

**Usage in Variant System**: The system uses the extended source type for variant feature creation and management, ensuring that variant features are properly linked to their override records.

**Integration Points**:
- **Feature Creation**: Uses `FeatureSourceType.ClassVariant` for variant feature creation
- **Feature Management**: Links variant features to their override records
- **Context Management**: Passes variant context to feature system service
- **Type Safety**: Ensures type safety through enum validation

### **Source Type Validation**

The system provides comprehensive utilities for validating and working with feature source types.

**Source Type Checks**: The system provides utilities for checking if a source type represents a variant, class, or race, ensuring that features are properly categorized and managed.

**Type Validation**: The system validates source types through established patterns, ensuring that all feature source types are valid and properly managed.

**Validation Functions**:
- **isVariantSourceType**: Checks if a source type represents a variant
- **isClassSourceType**: Checks if a source type represents a class
- **isRaceSourceType**: Checks if a source type represents a race
- **getSourceTypeName**: Gets human-readable name for source type

## 🎯 **Progression Types**

### **ProgressionType Integration**

The variant system uses the existing `ProgressionType` enum for class property overrides through established patterns.

**Progression Type Usage**: The system uses progression types for overriding class properties such as hit die, skill points, and saving throw progressions.

**Override Management**: The system manages progression type overrides through established patterns, ensuring that variant classes can override any class property.

**Supported Progressions**:
- **Hit Die**: Override base class hit die size
- **Skill Points**: Override base class skill points per level
- **Base Attack Bonus**: Override BAB progression type
- **Saving Throws**: Override fortitude, reflex, and will progressions

### **Progression Type Validation**

The system provides comprehensive utilities for validating and working with progression types.

**Type Validation**: The system validates progression types through established patterns, ensuring that all progression types are valid and properly managed.

**Type Names**: The system provides utilities for getting progression type names, ensuring that users can understand what each progression type represents.

## 🎯 **Spell Override Constants**

### **Spell Level Constants**

The system defines comprehensive constants for spell level management and validation.

**Spell Level Definitions**: The system defines constants for removal level, minimum and maximum levels, and cantrip level through established patterns.

**Level Validation**: The system provides utilities for validating spell levels, ensuring that all spell levels are within valid ranges.

**Constants**:
- **SPELL_REMOVAL_LEVEL**: -1 - Level value for spell removals
- **MIN_SPELL_LEVEL**: 0 - Minimum spell level (cantrips)
- **MAX_SPELL_LEVEL**: 9 - Maximum spell level
- **CANTRIP_LEVEL**: 0 - Level for cantrips

### **Spell Override Types**

The system defines comprehensive types for spell override operations and management.

**Override Type Definitions**: The system defines types for spell additions and removals, ensuring that spell overrides are properly categorized and managed.

**Type Management**: The system provides utilities for determining override types, ensuring that spell overrides are properly categorized and managed.

## 🔧 **Shared Utils Package**

### **VariantOverrideUtils Module**

The `@shared/utils` package provides comprehensive utilities for variant class override management, ensuring consistent logic between frontend editing and backend resolution.

**Purpose**: Provides shared utility functions for applying variant overrides to base class data, ensuring that override logic is consistent across the entire system.

**Key Responsibilities**:
- **Feature Override Application**: Apply feature progression overrides to base class features
- **Spell Override Application**: Apply spell overrides to base class spell lists
- **Override Generation**: Generate override objects from frontend editing state
- **Consistent Logic**: Ensure consistent override logic between frontend and backend

**Source File**: `packages/shared/utils/src/VariantOverrideUtils.ts`

### **Core Override Functions**

**applyFeatureProgressionOverrides**: Applies feature progression overrides to base class features using comprehensive resolution logic
- **Parameters**: 
  - `baseFeatures: FeatureProgression[]` - Base class feature progressions
  - `featureOverrides: ClassVariantFeatureProgressionOverride[]` - Variant feature overrides
- **Business Logic**: 
  - Processes each override in sequence
  - Handles new feature additions (originalFeatureProgressionId === null)
  - Handles feature removals (replacementFeatureProgression === null)
  - Handles feature modifications with entity removal and replacement
  - Applies entity removal logic for selective entity removal
  - Handles feature replacement with different features
- **Returns**: `FeatureProgression[]` - Modified feature progressions with all overrides applied
- **Usage**: Used in both frontend preview and backend resolution for consistent override application
- **Integration**: Called by `resolveClassWithVariantOverrides()` in backend and frontend preview logic

**applySpellOverrides**: Applies spell overrides to base class spell lists with addition and removal logic
- **Parameters**: 
  - `baseSpells: ClassSpellListEntry[]` - Base class spell list entries
  - `spellOverrides: ClassSpellListEntry[]` - Variant spell overrides
- **Business Logic**: 
  - Starts with base class spell list
  - Applies spell additions (level > 0) with duplicate checking
  - Applies spell removals (level = -1) by filtering out removed spells
  - Maintains spell level organization and prevents duplicates
- **Returns**: `ClassSpellListEntry[]` - Modified spell list with all overrides applied
- **Usage**: Used for spell list resolution in variant classes and spell system integration
- **Integration**: Called by `applySpellOverrides()` in backend resolution

**generateFeatureProgressionOverrides**: Generates feature progression overrides from frontend editing state
- **Parameters**: 
  - `baseFeatures: FeatureProgression[]` - Original base class features
  - `currentFeatures: FeatureProgression[]` - Current features after editing
- **Business Logic**: 
  - Creates feature maps for efficient comparison
  - Identifies removed features (in base but not current)
  - Identifies added features (in current but not base)
  - Identifies modified features with entity changes
  - Handles temporary IDs for new entities
  - Generates proper override objects for database storage
- **Returns**: `ClassVariantFeatureProgressionOverride[]` - Generated override objects
- **Usage**: Used by frontend to generate overrides from editing state before submission
- **Integration**: Called by `ClassEdit` component during form submission

### **Override Resolution Logic**

The system uses sophisticated resolution logic to handle all types of feature overrides:

**New Feature Addition**: Creates overrides with `originalFeatureProgressionId: null` and complete `replacementFeatureProgression` objects

**Feature Removal**: Creates overrides with `originalFeatureProgressionId` set and `replacementFeatureProgression: null`

**Feature Modification**: Creates overrides with entity removal and replacement logic:
- **Entity Removal**: Uses `removeEntities` array to specify which entities to remove
- **Entity Addition**: Uses `replacementFeatureProgression` to add new entities
- **Selective Modification**: Allows removing specific entities while keeping others

**Feature Replacement**: Handles replacing one feature with a completely different feature while maintaining proper relationships

### **Spell Override Logic**

The system provides comprehensive spell override management:

**Spell Addition**: Adds spells to the variant's spell list with level specification
- **Level Validation**: Ensures spell levels are within valid ranges (1-9)
- **Duplicate Prevention**: Prevents adding the same spell at the same level
- **Level Organization**: Maintains proper spell level organization

**Spell Removal**: Removes spells from the variant's spell list
- **Removal Level**: Uses level = -1 to indicate spell removal
- **Complete Removal**: Removes all instances of the specified spell
- **List Maintenance**: Maintains clean spell lists after removals

### **Integration Patterns**

The shared utils package integrates with multiple systems:

**Frontend Integration**: Used by `ClassEdit` component for preview functionality and override generation
**Backend Integration**: Used by `variantClassService` for resolution and override application
**Feature System Integration**: Works with feature system schemas and types
**Spell System Integration**: Works with spell system schemas and types

**Consistent Logic**: Ensures that override logic is identical between frontend preview and backend resolution, preventing inconsistencies and user confusion.

## 🔧 **Legacy Utility Functions**

### **Variant Resolution Utilities**

The system provides comprehensive utilities for variant resolution and base class management.

**Base Class Resolution**: The system provides utilities for extracting base class IDs from variant IDs, ensuring that variants can be properly linked to their base classes.

**Variant Creation**: The system provides utilities for creating variant IDs, ensuring that new variants are properly identified and managed.

**Core Functions**:

**applyFeatureProgressionOverrides**: Applies feature progression overrides to base class features
- **Parameters**: `baseFeatures: FeatureProgression[], featureOverrides: ClassVariantFeatureProgressionOverride[]` - Base features and overrides
- **Business Logic**: Processes each override, handles additions, removals, and modifications, applies entity removal and replacement logic
- **Returns**: `FeatureProgression[]` - Modified feature progressions with overrides applied
- **Usage**: Used in both frontend and backend for consistent override application

**applySpellOverrides**: Applies spell overrides to base class spell lists
- **Parameters**: `baseSpells: ClassSpellListEntry[], spellOverrides: ClassSpellListEntry[]` - Base spells and overrides
- **Business Logic**: Processes spell additions and removals, maintains spell level organization
- **Returns**: `ClassSpellListEntry[]` - Modified spell list with overrides applied
- **Usage**: Used for spell list resolution in variant classes

**Source File**: `packages/shared/utils/src/VariantOverrideUtils.ts`

### **Override Validation Utilities**

The system provides comprehensive utilities for validating feature and spell overrides.

**Feature Override Validation**: The system provides utilities for validating feature overrides, ensuring that all feature overrides are properly structured and valid.

**Spell Override Validation**: The system provides utilities for validating spell overrides, ensuring that all spell overrides are properly structured and valid.

## 🔗 **Cross-System Integration**

### **Class System Integration**

The variant system integrates with the class system through base class validation and management.

**Base Class Validation**: The system validates base class references through established patterns, ensuring that variant classes are properly linked to base classes.

**Class Name Management**: The system provides utilities for getting base class names, ensuring that users can understand what base class a variant is based on.

**Integration Points**:
- **Base Class Retrieval**: Uses class system for base class data
- **Class Validation**: Validates base class existence and properties
- **Name Resolution**: Resolves base class names for display
- **Property Inheritance**: Inherits base class properties for variants

### **Feature System Integration**

The variant system integrates with the feature system through source type management and validation.

**Source Type Integration**: The system integrates with the feature system through established patterns, ensuring that variant features are properly managed and validated.

**Type Management**: The system provides utilities for managing feature source types, ensuring that variant features are properly categorized and managed.

**Integration Points**:
- **Feature Creation**: Uses feature system for feature management
- **Source Type Management**: Manages feature source types for variants
- **Context Passing**: Passes variant context to feature system
- **Override Resolution**: Resolves feature overrides through feature system

### **Spell System Integration**

The variant system integrates with the spell system through spell level management and validation.

**Spell Level Integration**: The system integrates with the spell system through established patterns, ensuring that variant spell overrides are properly managed and validated.

**Level Management**: The system provides utilities for managing spell levels, ensuring that variant spell overrides are properly categorized and managed.

**Integration Points**:
- **Spell List Management**: Uses spell system for spell list operations
- **Level Validation**: Validates spell levels and ranges
- **Override Application**: Applies spell overrides through spell system
- **List Resolution**: Resolves spell lists for variant classes

## 📊 **Performance Constants**

### **Caching Constants**

The system defines comprehensive constants for caching configuration and management.

**Cache Configuration**: The system defines constants for variant resolution, base class, feature override, and spell override caching through established patterns.

**Cache Key Generation**: The system provides utilities for generating cache keys, ensuring that caching is efficient and consistent.

**Constants**:
- **VARIANT_CACHE_TTL**: 3600 - Variant resolution cache TTL in seconds
- **BASE_CLASS_CACHE_TTL**: 7200 - Base class cache TTL in seconds
- **FEATURE_OVERRIDE_CACHE_TTL**: 1800 - Feature override cache TTL in seconds
- **SPELL_OVERRIDE_CACHE_TTL**: 1800 - Spell override cache TTL in seconds

### **Query Constants**

The system defines comprehensive constants for database query limits and pagination.

**Query Limits**: The system defines constants for maximum variants, feature overrides, spell overrides, and source books per query through established patterns.

**Pagination Constants**: The system defines constants for default page size, maximum page size, and minimum page size through established patterns.

**Constants**:
- **MAX_VARIANTS_PER_QUERY**: 100 - Maximum variants per query
- **MAX_FEATURE_OVERRIDES_PER_QUERY**: 50 - Maximum feature overrides per query
- **MAX_SPELL_OVERRIDES_PER_QUERY**: 100 - Maximum spell overrides per query
- **DEFAULT_PAGE_SIZE**: 20 - Default pagination page size
- **MAX_PAGE_SIZE**: 100 - Maximum pagination page size

## 🔧 **Integration Examples**

### **Variant Creation Example**

The system provides clear examples of how to use variant identification utilities:

```typescript
// Create a new variant for base class ID 3 (Cleric)
const baseClassId = 3;
const variantId = 1;
const customId = calculateVariantId(baseClassId, variantId); // 300001

// Check if an ID is a variant
const isVariant = isVariantId(300001); // true

// Extract base class ID from variant ID
const extractedBaseClassId = extractBaseClassId(300001); // 3
```

### **Override Application Example**

The system provides examples of how to apply overrides:

```typescript
// Apply feature overrides to base class features
const modifiedFeatures = applyFeatureProgressionOverrides(
    baseClassFeatures,
    variantFeatureOverrides
);

// Apply spell overrides to base class spell list
const modifiedSpells = applySpellOverrides(
    baseClassSpells,
    variantSpellOverrides
);
```

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Variant class system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Variant class system validation rules and schemas
- **[Backend Implementation](backend-implementation.md)** - Backend implementation details
- **[Frontend Implementation](frontend-implementation.md)** - Frontend implementation details
- **[Static Data Patterns](../application-overview/static-data.md)** - Shared static data patterns and conventions
- **[Class System Static Data](../class-system/static-data.md)** - Base class system static data
- **[Feature System Static Data](../feature-system/static-data.md)** - Feature system static data

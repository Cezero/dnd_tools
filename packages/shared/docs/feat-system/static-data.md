# Feat System Static Data

*Complete documentation for the feat system static data, including enums, types, and reference data structures.*

## 📋 **Overview**

The feat system static data provides enums, types, and utility functions that define the behavior and capabilities of the feat system. This includes feat types, benefit types, prerequisite types, and various utility functions for feat calculations and management.

The static data layer serves as the foundation for type safety, validation, and consistent behavior across the feat system. It defines the vocabulary and rules that govern how feats interact with characters and other game systems.

**Source File**: `packages/shared/static-data/src/FeatData.ts`

## 🏗️ **Core Enums and Types**

### **Feat Types**

Defines the different categories of feats available in the game system.

**Purpose**: Identifies the different types of feats, providing categorization and organizational structure for feat management.

**Values**:
- **`GENERAL` (1)**: General feats available to all characters
- **`ITEM_CREATION` (2)**: Feats for creating magical items
- **`METAMAGIC` (3)**: Feats for modifying spellcasting

**Usage**: Used throughout the application for feat categorization, filtering, and display.

**Source File**: `packages/shared/static-data/src/FeatData.ts` (FeatType enum)

### **Feat Benefit Types**

Defines the different types of benefits that feats can provide.

**Purpose**: Identifies the different types of benefits that feats can grant, enabling proper benefit calculation and display.

**Values**:
- **`SKILL` (1)**: Skill bonuses and proficiencies
- **`SAVE` (2)**: Saving throw bonuses
- **`PROFICIENCY` (3)**: Weapon and armor proficiencies

**Usage**: Used in feat benefit definitions to specify the type of benefit provided.

**Source File**: `packages/shared/static-data/src/FeatData.ts` (FeatBenefitType enum)

### **Feat Prerequisite Types**

Defines the different types of prerequisites that feats can require.

**Purpose**: Identifies the different types of prerequisites that feats can have, enabling proper prerequisite validation and display.

**Values**:
- **`ABILITY` (1)**: Ability score requirements
- **`SKILL` (2)**: Skill rank requirements
- **`FEAT` (3)**: Feat requirements
- **`BAB` (4)**: Base attack bonus requirements
- **`SPELLCASTING` (5)**: Spellcasting level requirements
- **`SPECIAL` (6)**: Special requirements
- **`CLASSLEVEL` (7)**: Class level requirements
- **`PROFICIENCY` (8)**: Proficiency requirements
- **`CLASSFEATURE` (9)**: Class feature requirements
- **`SIZE` (10)**: Size requirements

**Usage**: Used in feat prerequisite definitions to specify the type of requirement.

**Source File**: `packages/shared/static-data/src/FeatData.ts` (FeatPrerequisiteType enum)

## 🔧 **Feat Data Structures**

### **Feat Type Maps**

The primary data structures containing feat type definitions with their characteristics.

**Purpose**: Provides comprehensive maps of all feat types with their defining characteristics.

**Key Maps**:

**FEAT_TYPES**: Complete map of all feat types
- **Purpose**: Provides complete map of all available feat types
- **Usage**: Used for feat type selection and display

**FEAT_TYPE_BY_ID**: ID to name mapping for feat types
- **Purpose**: Provides ID to name mapping for feat types
- **Usage**: Used for feat type lookup and display

**FEAT_TYPE_LIST**: Complete list of all feat types
- **Purpose**: Provides complete list of all available feat types
- **Usage**: Used for feat type selection and iteration

**FEAT_TYPE_SELECT_LIST**: Feat type list for selection components
- **Purpose**: Provides feat type list formatted for selection components
- **Usage**: Used in feat type selection dropdowns and lists

**Source File**: `packages/shared/static-data/src/FeatData.ts` (Feat type definitions)

### **Feat Benefit Type Maps**

The primary data structures containing feat benefit type definitions with their characteristics.

**Purpose**: Provides comprehensive maps of all feat benefit types with their defining characteristics.

**Key Maps**:

**FEAT_BENEFIT_TYPES**: Complete map of all feat benefit types
- **Purpose**: Provides complete map of all available feat benefit types
- **Usage**: Used for feat benefit type selection and display

**FEAT_BENEFIT_TYPE_BY_ID**: ID to name mapping for feat benefit types
- **Purpose**: Provides ID to name mapping for feat benefit types
- **Usage**: Used for feat benefit type lookup and display

**FEAT_BENEFIT_TYPE_LIST**: Complete list of all feat benefit types
- **Purpose**: Provides complete list of all available feat benefit types
- **Usage**: Used for feat benefit type selection and iteration

**FEAT_BENEFIT_TYPE_SELECT_LIST**: Feat benefit type list for selection components
- **Purpose**: Provides feat benefit type list formatted for selection components
- **Usage**: Used in feat benefit type selection dropdowns and lists

**Source File**: `packages/shared/static-data/src/FeatData.ts` (Feat benefit type definitions)

### **Feat Prerequisite Type Maps**

The primary data structures containing feat prerequisite type definitions with their characteristics.

**Purpose**: Provides comprehensive maps of all feat prerequisite types with their defining characteristics.

**Key Maps**:

**FEAT_PREREQUISITE_TYPES**: Complete map of all feat prerequisite types
- **Purpose**: Provides complete map of all available feat prerequisite types
- **Usage**: Used for feat prerequisite type selection and display

**FEAT_PREREQ_BY_ID**: ID to name mapping for feat prerequisite types
- **Purpose**: Provides ID to name mapping for feat prerequisite types
- **Usage**: Used for feat prerequisite type lookup and display

**FEAT_PREREQUISITE_TYPE_LIST**: Complete list of all feat prerequisite types
- **Purpose**: Provides complete list of all available feat prerequisite types
- **Usage**: Used for feat prerequisite type selection and iteration

**FEAT_PREREQUISITE_TYPE_SELECT_LIST**: Feat prerequisite type list for selection components
- **Purpose**: Provides feat prerequisite type list formatted for selection components
- **Usage**: Used in feat prerequisite type selection dropdowns and lists

**Source File**: `packages/shared/static-data/src/FeatData.ts` (Feat prerequisite type definitions)

## 🎯 **Feat Calculations**

### **Feat Type Integration**

The feat type integration system for determining feat categories and behavior.

**Purpose**: Calculate and validate feat types for feat categorization and behavior.

**Calculation Pattern**:
- **Feat Lookup**: Look up feat by ID in feat data
- **Type Reference**: Extract type ID from feat definition
- **Type Validation**: Validate type ID against feat type system
- **Type Calculation**: Use feat type for categorization and behavior

**Example**: Feat ID 1 has type ID 1 (General), so it's categorized as a general feat

**Source File**: `packages/shared/static-data/src/FeatData.ts` (Feat type integration)

### **Feat Benefit Integration**

The feat benefit integration system for determining feat benefits and effects.

**Purpose**: Calculate and validate feat benefits for character ability modifications.

**Calculation Pattern**:
- **Benefit Lookup**: Look up benefit by type ID in benefit type system
- **Benefit Reference**: Extract benefit type from benefit definition
- **Benefit Validation**: Validate benefit type against benefit type system
- **Benefit Calculation**: Use benefit type for benefit calculations

**Example**: Benefit type ID 1 (Skill) provides skill bonuses to characters

**Source File**: `packages/shared/static-data/src/FeatData.ts` (Feat benefit integration)

### **Feat Prerequisite Integration**

The feat prerequisite integration system for determining feat requirements and validation.

**Purpose**: Calculate and validate feat prerequisites for character feat access.

**Calculation Pattern**:
- **Prerequisite Lookup**: Look up prerequisite by type ID in prerequisite type system
- **Prerequisite Reference**: Extract prerequisite type from prerequisite definition
- **Prerequisite Validation**: Validate prerequisite type against prerequisite type system
- **Prerequisite Calculation**: Use prerequisite type for requirement validation

**Example**: Prerequisite type ID 1 (Ability) requires minimum ability scores

**Source File**: `packages/shared/static-data/src/FeatData.ts` (Feat prerequisite integration)

## 🔗 **Integration with Other Systems**

### **Character System Integration**

The feat system integrates with the character system through feat selection and prerequisites:

**Feat Selection**: Characters can select and acquire feats
**Prerequisite Validation**: Character abilities and skills are validated against feat prerequisites
**Feat Benefits**: Character abilities are modified by feat benefits
**Feat Progression**: Character feat progression follows level and class rules

**Integration Pattern**: The feat system provides the framework for character feat management, with character abilities and skills determining feat access and progression.

**Related Documentation**: [Character Management Static Data](../character-management/static-data.md)


### **Feature System Integration**

The feat system integrates with the feature system for feat-related features:

**Feat Prerequisites**: Features can require specific feats
**Feat Benefits**: Features can provide feat-related bonuses
**Feat Progression**: Features can grant additional feats
**Feat Specializations**: Features can provide feat specializations

**Integration Pattern**: The feat system integrates with the feature system to handle feat-related features, ensuring proper feat prerequisite and benefit calculations.

**Related Documentation**: [Feature System Static Data](../feature-system/static-data.md)

## 🔧 **Performance Considerations**

### **Data Access Patterns**

The feat system static data is optimized for efficient access:

**Map-based Access**: Direct access to feat data by ID
**Cached Lookups**: Frequently accessed data is cached for performance
**Lazy Loading**: Data is loaded only when needed
**Memory Management**: Efficient memory usage for large datasets

### **Calculation Optimization**

Feat calculations are optimized for performance:

**Pre-calculated Values**: Common calculations are pre-computed
**Formula Caching**: Formula results are cached to avoid recalculation
**Efficient Algorithms**: Optimized algorithms for feat calculations
**Batch Processing**: Multiple calculations are processed in batches

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Feat system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Feat system validation rules and schemas
- **[Backend Implementation](backend-implementation.md)** - Feat system backend implementation
- **[Frontend Components](frontend-components.md)** - Feat system frontend implementation
- **[Character Management Static Data](../character-management/static-data.md)** - Character system enums and types
- **[Ability System Static Data](../ability-system/static-data.md)** - Ability system enums and types
- **[Skill System Static Data](../skill-system/static-data.md)** - Skill system enums and types
- **[Feature System Static Data](../feature-system/static-data.md)** - Feature system enums and types
- **[Static Data Patterns](../application-overview/static-data.md)** - Shared static data patterns and conventions

# Class System Static Data

*Complete documentation for the class system static data, including enums, types, and reference data structures.*

## 📋 **Overview**

The class system static data provides enums, types, and utility functions that define the behavior and capabilities of the class system. This includes progression types, casting types, class classifications, and various utility functions for class calculations and management.

The static data layer serves as the foundation for type safety, validation, and consistent behavior across the class system. It defines the vocabulary and rules that govern how classes interact with characters and other game systems.

**Source File**: `packages/shared/static-data/src/ClassData.ts`

## 🏗️ **Core Enums and Types**

### **ProgressionType**

Defines the progression patterns for base attack bonus and saving throws, determining how these values scale with class level.

**Purpose**: Identifies the progression pattern for combat and defensive statistics, affecting how they are calculated as characters advance in level.

**Values**:
- **`Poor` (0)**: +1/3 per level (e.g., 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10)
- **`Average` (1)**: +1/2 per level (e.g., 0, 1, 2, 3, 3, 4, 5, 6, 6, 7, 8, 9, 9, 10, 11, 12, 12, 13, 14, 15)
- **`Good` (2)**: +1 per level (e.g., 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19)

**Usage**: Used in the `babProgression`, `fortProgression`, `refProgression`, and `willProgression` fields of class models to determine progression calculations.

**Source File**: `packages/shared/static-data/src/ClassData.ts` (ProgressionType definition)

### **CastingType**

Defines the types of spellcasting that classes can perform, affecting how spells are prepared and cast.

**Purpose**: Identifies the spellcasting method used by a class, affecting spell preparation, casting mechanics, and progression patterns.

**Values**:
- **`Prepared` (1)**: Spells must be prepared in advance (Wizard, Cleric)
- **`Spontaneous` (2)**: Spells are cast spontaneously from known spells (Sorcerer, Bard)

**Usage**: Used in the `castingType` field of class models to determine spellcasting mechanics and progression.

**Source File**: `packages/shared/static-data/src/CommonData.ts` (CastingType definition)

### **Class Classification**

Defines the classification system for classes, including base classes, prestige classes, and NPC classes.

**Purpose**: Categorizes classes by their role and availability in character creation and advancement.

**Classifications**:

**Base Classes**: Standard character classes available to all characters
- **Core Classes**: Fighter, Wizard, Cleric, Rogue, etc.
- **Base Class Features**: Standard progression, full hit die, standard skill points
- **Availability**: Available to all characters at 1st level

**Prestige Classes**: Specialized classes with specific requirements
- **Prestige Class Features**: Specialized abilities, requirements for entry
- **Availability**: Available after meeting prerequisites
- **Progression**: Often have unique progression patterns

**NPC Classes**: Classes primarily used for non-player characters
- **NPC Class Features**: Simplified abilities, limited progression
- **Availability**: Generally not available to player characters
- **Purpose**: Provide structure for NPCs and background characters

**Source File**: `packages/shared/static-data/src/ClassData.ts` (Class classification system)

## 🔧 **Class Data Structures**

### **ClassMap**

The primary data structure containing all class definitions with their core attributes.

**Purpose**: Provides a comprehensive map of all available classes with their defining characteristics.

**Structure**:
- **Class ID**: Unique identifier for each class
- **Name**: Human-readable class name
- **Abbreviation**: Short abbreviation for display
- **Edition ID**: Reference to the edition this class belongs to
- **Visibility**: Whether the class is visible in lists
- **Spellcasting**: Whether the class can cast spells
- **Prestige**: Whether this is a prestige class

**Usage**: Primary reference for class data throughout the application.

**Source File**: `packages/shared/static-data/src/ClassData.ts` (CLASS_MAP definition)

### **Class Utility Functions**

Utility functions for working with class data and calculations.

**Purpose**: Provide helper functions for class-related operations and calculations.

**Key Functions**:

**getClassById**: Retrieves class data by ID
- **Parameters**: Class ID
- **Returns**: Class data object or null
- **Usage**: Look up class information by ID

**getAllClasses**: Retrieves all available classes
- **Parameters**: Optional filters
- **Returns**: Array of all classes
- **Usage**: Get complete list of available classes

**getClassesByEdition**: Retrieves classes for a specific edition
- **Parameters**: Edition ID
- **Returns**: Array of classes for that edition
- **Usage**: Filter classes by edition

**getPrestigeClasses**: Retrieves all prestige classes
- **Parameters**: None
- **Returns**: Array of prestige classes
- **Usage**: Get list of prestige classes for character advancement

**Source File**: `packages/shared/static-data/src/ClassData.ts` (Utility functions)

## 🎯 **Progression Calculations**

### **Base Attack Bonus Calculation**

The base attack bonus calculation system for determining combat effectiveness.

**Purpose**: Calculate base attack bonus based on class level and progression type.

**Calculation Patterns**:

**Poor Progression**: +1/3 per level
- **Formula**: Math.floor(level / 3)
- **Examples**: Level 1 = 0, Level 3 = 1, Level 6 = 2, Level 9 = 3
- **Usage**: Typically used for spellcasting classes

**Average Progression**: +1/2 per level
- **Formula**: Math.floor(level / 2)
- **Examples**: Level 1 = 0, Level 2 = 1, Level 4 = 2, Level 6 = 3
- **Usage**: Typically used for moderate combat classes

**Good Progression**: +1 per level
- **Formula**: level - 1
- **Examples**: Level 1 = 0, Level 2 = 1, Level 3 = 2, Level 4 = 3
- **Usage**: Typically used for full combat classes

**Source File**: `packages/shared/static-data/src/ClassData.ts` (Progression calculations)

### **Saving Throw Calculation**

The saving throw calculation system for determining defensive capabilities.

**Purpose**: Calculate saving throw bonuses based on class level and progression type.

**Calculation Patterns**:

**Poor Progression**: +1/3 per level
- **Formula**: Math.floor(level / 3)
- **Examples**: Level 1 = 0, Level 3 = 1, Level 6 = 2, Level 9 = 3
- **Usage**: Typically used for weak saves

**Average Progression**: +1/2 per level
- **Formula**: Math.floor(level / 2)
- **Examples**: Level 1 = 0, Level 2 = 1, Level 4 = 2, Level 6 = 3
- **Usage**: Typically used for moderate saves

**Good Progression**: +1 per level
- **Formula**: level - 1
- **Examples**: Level 1 = 0, Level 2 = 1, Level 3 = 2, Level 4 = 3
- **Usage**: Typically used for strong saves

**Source File**: `packages/shared/static-data/src/ClassData.ts` (Saving throw calculations)

## 🔗 **Integration with Other Systems**

### **Feature System Integration**

The class system integrates with the feature system through class features:

**Feature Progression**: Classes define feature progression through the feature system
**Feature Types**: Classes can have modifiers, choices, and special effects
**Feature Scaling**: Features can scale with class level
**Feature Integration**: Seamless integration with the feature system

**Integration Pattern**: Classes use the feature system to define their abilities, ensuring consistent feature mechanics across all systems.

**Related Documentation**: [Feature System Static Data](../feature-system/static-data.md#integration-with-other-systems)

### **Spellcasting System Integration**

The class system integrates with the spellcasting system through casting types:

**Casting Types**: Classes define their spellcasting method through casting types
**Spell Progression**: Classes define spell slot progression
**Spells Known**: Classes define spells known for spontaneous casters
**Spellcasting Integration**: Seamless integration with the spellcasting system

**Integration Pattern**: Classes use the spellcasting system to define their magical capabilities, ensuring consistent spellcasting mechanics.

**Related Documentation**: [Spellcasting System Static Data](../spell-system/static-data.md#casting-types-and-progression)

### **Character System Integration**

The class system provides the foundation for character advancement:

**Character Classes**: Characters take levels in classes
**Class Progression**: Character progression is calculated based on class levels
**Class Features**: Characters gain class features through the feature system
**Class Spellcasting**: Characters gain spellcasting through the spellcasting system

**Integration Pattern**: The class system provides the framework for character advancement, with other systems providing the specific mechanics.

**Related Documentation**: [Character Management Static Data](../character-management/static-data.md#class-integration-and-progression)

## 🔧 **Performance Considerations**

### **Data Access Patterns**

The class system static data is optimized for efficient access:

**Map-based Access**: Direct access to class data by ID
**Cached Lookups**: Frequently accessed data is cached for performance
**Lazy Loading**: Data is loaded only when needed
**Memory Management**: Efficient memory usage for large datasets

### **Calculation Optimization**

Progression calculations are optimized for performance:

**Pre-calculated Values**: Common calculations are pre-computed
**Formula Caching**: Formula results are cached to avoid recalculation
**Efficient Algorithms**: Optimized algorithms for progression calculations
**Batch Processing**: Multiple calculations are processed in batches

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Class system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Class system validation rules and schemas
- **[Backend Implementation](backend-implementation.md)** - Class system backend implementation
- **[Frontend Components](frontend-components.md)** - Class system frontend implementation
- **[Feature System Static Data](../feature-system/static-data.md#integration-with-other-systems)** - Feature system enums and integration patterns
- **[Spellcasting System Static Data](../spell-system/static-data.md#casting-types-and-progression)** - Spellcasting system enums and progression patterns
- **[Static Data Patterns](../application-overview/static-data.md#enum-and-reference-data)** - Shared static data patterns and conventions

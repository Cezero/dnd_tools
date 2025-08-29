# Race System Static Data

*Complete documentation for the race system static data, including enums, types, and reference data structures.*

## 📋 **Overview**

The race system static data provides enums, types, and utility functions that define the behavior and capabilities of the race system. This includes size categories, ability adjustments, racial traits, and various utility functions for race calculations and management.

The static data layer serves as the foundation for type safety, validation, and consistent behavior across the race system. It defines the vocabulary and rules that govern how races interact with characters and other game systems.

**Source File**: `packages/shared/static-data/src/CommonData.ts` (Size-related enums and types)

## 🏗️ **Core Enums and Types**

### **SizeId**

Defines the size categories for races and creatures, affecting combat mechanics, equipment usage, and movement capabilities.

**Purpose**: Identifies the physical size category of a race, affecting combat modifiers, equipment restrictions, and movement capabilities.

**Values**:
- **`Fine` (1)**: Tiny creatures like fairies and sprites
- **`Diminutive` (2)**: Very small creatures like mice and small birds
- **`Tiny` (3)**: Small creatures like cats and small dogs
- **`Small` (4)**: Small humanoids like halflings and gnomes
- **`Medium` (5)**: Standard humanoids like humans, elves, and dwarves
- **`Large` (6)**: Large creatures like ogres and horses
- **`Huge` (7)**: Very large creatures like giants and dragons
- **`Gargantuan` (8)**: Massive creatures like ancient dragons
- **`Colossal` (9)**: Enormous creatures like titans and elder dragons

**Usage**: Used in the `sizeId` field of race models to determine size category and related mechanics.

**Source File**: `packages/shared/static-data/src/CommonData.ts` (SizeId definition)

### **Size Classification**

Defines the classification system for creature sizes, including combat and movement implications.

**Purpose**: Categorizes creatures by their physical size and determines related game mechanics.

**Classifications**:

**Small and Smaller**: Fine, Diminutive, Tiny, Small
- **Combat Modifiers**: +1 to attack rolls, +1 to Armor Class
- **Equipment Restrictions**: Limited weapon and armor options
- **Movement**: May have reduced movement speed
- **Examples**: Halflings, Gnomes, Fairies

**Medium**: Standard humanoid size
- **Combat Modifiers**: No size modifiers
- **Equipment**: Standard weapon and armor options
- **Movement**: Standard movement speed
- **Examples**: Humans, Elves, Dwarves

**Large and Larger**: Large, Huge, Gargantuan, Colossal
- **Combat Modifiers**: -1 to attack rolls, -1 to Armor Class
- **Equipment**: Limited weapon and armor options
- **Movement**: May have increased movement speed
- **Examples**: Ogres, Giants, Dragons

**Source File**: `packages/shared/static-data/src/CommonData.ts` (Size classification system)

### **Racial Ability Adjustments**

Defines the system for racial ability score adjustments and bonuses.

**Purpose**: Identifies how races modify character ability scores, affecting character creation and advancement.

**Adjustment Types**:

**Positive Adjustments**: Races can provide bonuses to specific abilities
- **Strength Bonuses**: Common for physically strong races
- **Dexterity Bonuses**: Common for agile and nimble races
- **Constitution Bonuses**: Common for hardy and resilient races
- **Intelligence Bonuses**: Common for scholarly and magical races
- **Wisdom Bonuses**: Common for spiritual and nature-oriented races
- **Charisma Bonuses**: Common for charismatic and social races

**Negative Adjustments**: Races can have penalties to specific abilities
- **Balancing Penalties**: Used to balance powerful racial bonuses
- **Flavor Penalties**: Used to reflect racial characteristics
- **Game Balance**: Ensures no race is universally superior

**Source File**: `packages/shared/static-data/src/CommonData.ts` (Ability adjustment system)

## 🔧 **Race Data Structures**

### **SizeMap**

The primary data structure containing all size category definitions with their characteristics.

**Purpose**: Provides a comprehensive map of all available size categories with their defining characteristics.

**Structure**:
- **Size ID**: Unique identifier for each size category
- **Name**: Human-readable size name
- **Abbreviation**: Short abbreviation for display
- **Combat Modifiers**: Attack and Armor Class modifiers
- **Equipment Restrictions**: Weapon and armor restrictions
- **Movement Implications**: Movement speed and capability implications

**Usage**: Primary reference for size data throughout the application.

**Source File**: `packages/shared/static-data/src/CommonData.ts` (SIZE_MAP definition)

### **Race Utility Functions**

Utility functions for working with race data and calculations.

**Purpose**: Provide helper functions for race-related operations and calculations.

**Key Functions**:

**getSizeById**: Retrieves size data by ID
- **Parameters**: Size ID
- **Returns**: Size data object or null
- **Usage**: Look up size information by ID

**getAllSizes**: Retrieves all available size categories
- **Parameters**: None
- **Returns**: Array of all size categories
- **Usage**: Get complete list of available size categories

**getSizeModifiers**: Retrieves combat modifiers for a size
- **Parameters**: Size ID
- **Returns**: Attack and Armor Class modifiers
- **Usage**: Calculate combat modifiers for size-based mechanics

**Source File**: `packages/shared/static-data/src/CommonData.ts` (Utility functions)

## 🎯 **Race Calculations**

### **Size-Based Combat Modifiers**

The size-based combat modifier calculation system for determining combat effectiveness.

**Purpose**: Calculate combat modifiers based on creature size category.

**Calculation Patterns**:

**Small and Smaller Sizes**: Fine, Diminutive, Tiny, Small
- **Attack Modifier**: +1 to attack rolls
- **Armor Class Modifier**: +1 to Armor Class
- **Grapple Modifier**: -4 to grapple checks
- **Hide Modifier**: +8 to Hide checks

**Medium Size**: Standard humanoid size
- **Attack Modifier**: No modifier
- **Armor Class Modifier**: No modifier
- **Grapple Modifier**: No modifier
- **Hide Modifier**: No modifier

**Large and Larger Sizes**: Large, Huge, Gargantuan, Colossal
- **Attack Modifier**: -1 to attack rolls
- **Armor Class Modifier**: -1 to Armor Class
- **Grapple Modifier**: +4 to grapple checks
- **Hide Modifier**: -8 to Hide checks

**Source File**: `packages/shared/static-data/src/CommonData.ts` (Size-based calculations)

### **Racial Ability Score Calculations**

The racial ability score calculation system for determining character ability scores.

**Purpose**: Calculate final ability scores based on racial adjustments and base scores.

**Calculation Patterns**:

**Base Score**: Starting ability score from character generation
**Racial Adjustment**: Modifier from racial traits
**Final Score**: Base score + racial adjustment

**Examples**:
- **Human**: No racial adjustments, final scores equal base scores
- **Elf**: +2 Dexterity, -2 Constitution, other scores unchanged
- **Dwarf**: +2 Constitution, -2 Charisma, other scores unchanged
- **Half-Orc**: +2 Strength, -2 Intelligence, -2 Charisma, other scores unchanged

**Source File**: `packages/shared/static-data/src/CommonData.ts` (Ability score calculations)

## 🔗 **Integration with Other Systems**

### **Feature System Integration**

The race system integrates with the feature system through racial features:

**Racial Features**: Races define features through the feature system
**Feature Types**: Races can have modifiers, choices, and special effects
**Feature Scaling**: Features can scale with character level
**Feature Integration**: Seamless integration with the feature system

**Integration Pattern**: Races use the feature system to define their abilities, ensuring consistent feature mechanics across all systems.

**Related Documentation**: [Feature System Static Data](../feature-system/static-data.md)

### **Character System Integration**

The race system provides the foundation for character creation:

**Character Races**: Characters select races during creation
**Racial Features**: Characters gain racial features through the feature system
**Racial Bonuses**: Characters gain racial bonuses through ability adjustments
**Racial Traits**: Characters gain racial traits and abilities

**Integration Pattern**: The race system provides the framework for character racial traits, with other systems providing the specific mechanics.

**Related Documentation**: [Character Management Static Data](../character-management/static-data.md)

### **Ability System Integration**

The race system integrates with the ability system for racial bonuses:

**Ability Adjustments**: Races can modify character ability scores
**Ability Bonuses**: Races can provide bonuses to specific abilities
**Ability Penalties**: Races can have penalties to specific abilities
**Ability Integration**: Seamless integration with the ability system

**Integration Pattern**: The race system integrates with the ability system to handle racial ability adjustments, ensuring proper calculation and validation of racial bonuses.

**Related Documentation**: [Ability System Static Data](../ability-system/static-data.md)

## 🔧 **Performance Considerations**

### **Data Access Patterns**

The race system static data is optimized for efficient access:

**Map-based Access**: Direct access to size data by ID
**Cached Lookups**: Frequently accessed data is cached for performance
**Lazy Loading**: Data is loaded only when needed
**Memory Management**: Efficient memory usage for large datasets

### **Calculation Optimization**

Race calculations are optimized for performance:

**Pre-calculated Values**: Common calculations are pre-computed
**Formula Caching**: Formula results are cached to avoid recalculation
**Efficient Algorithms**: Optimized algorithms for race calculations
**Batch Processing**: Multiple calculations are processed in batches

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Race system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Race system validation rules and schemas
- **[Backend Implementation](backend-implementation.md)** - Race system backend implementation
- **[Frontend Components](frontend-components.md)** - Race system frontend implementation
- **[Feature System Static Data](../feature-system/static-data.md)** - Feature system enums and types
- **[Ability System Static Data](../ability-system/static-data.md)** - Ability system enums and types
- **[Character Management Static Data](../character-management/static-data.md)** - Character system enums and types
- **[Static Data Patterns](../application-overview/static-data.md)** - Shared static data patterns and conventions

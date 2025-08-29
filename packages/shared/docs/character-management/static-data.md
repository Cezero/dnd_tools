# Character Management Static Data

*Complete documentation for the character management static data, including enums, types, and reference data structures.*

## 📋 **Overview**

The character management static data provides enums, types, and utility functions that define the behavior and capabilities of the character management system. This includes alignment definitions, ability score types, and various utility functions for character calculations and management.

The static data layer serves as the foundation for type safety, validation, and consistent behavior across the character management system. It defines the vocabulary and rules that govern how characters interact with other game systems.

**Source File**: `shared/static-data/src/CommonData.ts`

## 🏗️ **Core Enums and Types**

### **Alignment System**

Defines the different alignments available for characters in the game system.

**Purpose**: Identifies the different character alignments, providing categorization and organizational structure for character moral and ethical positioning.

**Values**:
- **`LAWFUL_GOOD` (1)**: Lawful Good alignment - follows laws and promotes good
- **`NEUTRAL_GOOD` (2)**: Neutral Good alignment - promotes good without strict adherence to laws
- **`CHAOTIC_GOOD` (3)**: Chaotic Good alignment - promotes good while challenging authority
- **`LAWFUL_NEUTRAL` (4)**: Lawful Neutral alignment - follows laws and order above all
- **`TRUE_NEUTRAL` (5)**: True Neutral alignment - balanced between law and chaos, good and evil
- **`CHAOTIC_NEUTRAL` (6)**: Chaotic Neutral alignment - values freedom and spontaneity
- **`LAWFUL_EVIL` (7)**: Lawful Evil alignment - uses laws and order to promote evil
- **`NEUTRAL_EVIL` (8)**: Neutral Evil alignment - promotes evil without strict adherence to laws
- **`CHAOTIC_EVIL` (9)**: Chaotic Evil alignment - promotes evil while destroying order

**Usage**: Used throughout the application for character alignment categorization, filtering, and display.

**Source File**: `shared/static-data/src/CommonData.ts` (AlignmentId enum and ALIGNMENT_MAP)

### **Ability Score System**

Defines the different ability scores that characters possess.

**Purpose**: Identifies the different character ability scores, enabling proper ability score classification and usage rules.

**Values**:
- **`STRENGTH` (1)**: Physical power and athletic training
- **`DEXTERITY` (2)**: Agility, reflexes, balance, and coordination
- **`CONSTITUTION` (3)**: Health, stamina, and force of personality
- **`INTELLIGENCE` (4)**: Mental acuity, accuracy of recall, and ability to reason
- **`WISDOM` (5)**: Awareness of surroundings and intuition
- **`CHARISMA` (6)**: Ability to interact effectively with others

**Usage**: Used in character ability score definitions to specify the type of ability and its usage rules.

**Source File**: `shared/static-data/src/CommonData.ts` (AbilityId enum and ABILITY_MAP)

## 🔧 **Character Data Structures**

### **Alignment Maps**

The primary data structures containing alignment definitions with their characteristics.

**Purpose**: Provides comprehensive maps of all alignments with their defining characteristics.

**Key Maps**:

**ALIGNMENT_MAP**: Complete map of all alignments
- **Purpose**: Provides complete map of all available alignments
- **Usage**: Used for alignment selection and display

**ALIGNMENT_BY_ID**: ID to name mapping for alignments
- **Purpose**: Provides ID to name mapping for alignments
- **Usage**: Used for alignment lookup and display

**ALIGNMENT_LIST**: Complete list of all alignments
- **Purpose**: Provides complete list of all available alignments
- **Usage**: Used for alignment selection and iteration

**ALIGNMENT_SELECT_LIST**: Alignment list for selection components
- **Purpose**: Provides alignment list formatted for selection components
- **Usage**: Used in alignment selection dropdowns and lists

**Source File**: `shared/static-data/src/CommonData.ts` (Alignment definitions)

### **Ability Score Maps**

The primary data structures containing ability score definitions with their characteristics.

**Purpose**: Provides comprehensive maps of all ability scores with their defining characteristics.

**Key Maps**:

**ABILITY_MAP**: Complete map of all ability scores
- **Purpose**: Provides complete map of all available ability scores
- **Usage**: Used for ability score selection and display

**ABILITY_BY_ID**: ID to name mapping for ability scores
- **Purpose**: Provides ID to name mapping for ability scores
- **Usage**: Used for ability score lookup and display

**ABILITY_LIST**: Complete list of all ability scores
- **Purpose**: Provides complete list of all available ability scores
- **Usage**: Used for ability score selection and iteration

**ABILITY_SELECT_LIST**: Ability score list for selection components
- **Purpose**: Provides ability score list formatted for selection components
- **Usage**: Used in ability score selection dropdowns and lists

**Source File**: `shared/static-data/src/CommonData.ts` (Ability score definitions)

## 🎯 **Character Calculations**

### **Alignment Integration**

The alignment integration system for determining character moral and ethical positioning.

**Purpose**: Calculate and validate alignments for character moral and ethical positioning.

**Calculation Pattern**:
- **Alignment Lookup**: Look up alignment by ID in alignment data
- **Alignment Reference**: Extract alignment ID from character definition
- **Alignment Validation**: Validate alignment ID against alignment system
- **Alignment Calculation**: Use alignment for character moral and ethical positioning

**Example**: Character alignment ID 1 (Lawful Good) indicates a character who follows laws and promotes good

**Source File**: `shared/static-data/src/CommonData.ts` (Alignment integration)

### **Ability Score Integration**

The ability score integration system for determining character capabilities and derived statistics.

**Purpose**: Calculate and validate ability scores for character capabilities and derived statistics.

**Calculation Pattern**:
- **Ability Lookup**: Look up ability by ID in ability data
- **Score Reference**: Extract ability score from character definition
- **Score Validation**: Validate ability score against ability system
- **Score Calculation**: Use ability score for capability and derived statistic calculations

**Example**: Ability score ID 1 (Strength) with value 16 provides a +3 modifier for strength-based activities

**Source File**: `shared/static-data/src/CommonData.ts` (Ability score integration)

## 🔗 **Integration with Other Systems**

### **Class System Integration**

The character management system integrates with the class system through character advancement:

**Class Progression**: Characters advance in classes through the advancement system
**Class Features**: Character feature choices integrate with class feature systems
**Spellcasting**: Character spell preparation integrates with class spellcasting
**Proficiency Management**: Character proficiencies integrate with class proficiency systems

**Integration Pattern**: The character system provides the framework for character class progression, with class features and abilities determining character capabilities.

**Related Documentation**: [Class System Static Data](../class-system/static-data.md)

### **Race System Integration**

The character management system integrates with the race system through character creation:

**Race Selection**: Characters are created with specific races
**Race Features**: Character features integrate with race feature systems
**Ability Modifiers**: Race ability modifiers integrate with character ability scores
**Proficiency Grants**: Race proficiency grants integrate with character proficiencies

**Integration Pattern**: The character system provides the framework for character race integration, with race features and abilities determining character capabilities.

**Related Documentation**: [Race System Static Data](../race-system/static-data.md)

### **Feature System Integration**

The character management system integrates with the feature system through character advancement:

**Feature Progression**: Character feature choices integrate with feature progression systems
**Feature Selection**: Character feature choices integrate with feature choice systems
**Feature Effects**: Character feature effects integrate with feature effect systems

**Integration Pattern**: The character system provides the framework for character feature integration, with feature choices and effects determining character capabilities.

**Related Documentation**: [Feature System Static Data](../feature-system/static-data.md)

### **Spell System Integration**

The character management system integrates with the spell system through character spell preparation:

**Spell Selection**: Character spell preparation integrates with spell selection systems
**Spell Casting**: Character spell casting integrates with spell casting systems
**Metamagic Integration**: Character metamagic integrates with spell metamagic systems

**Integration Pattern**: The character system provides the framework for character spell integration, with spell preparation and casting determining character capabilities.

**Related Documentation**: [Spell System Static Data](../spell-system/static-data.md)

### **Equipment System Integration**

The character management system integrates with the equipment system through character equipment:

**Equipment Selection**: Character equipment integrates with equipment selection systems
**Equipment Usage**: Character equipment usage integrates with equipment usage systems
**Equipment Effects**: Character equipment effects integrate with equipment effect systems

**Integration Pattern**: The character system provides the framework for character equipment integration, with equipment selection and usage determining character capabilities.

**Related Documentation**: [Equipment System Static Data](../equipment-system/static-data.md)

## 🔧 **Performance Considerations**

### **Data Access Patterns**

The character management static data is optimized for efficient access:

**Map-based Access**: Direct access to character data by ID
**Cached Lookups**: Frequently accessed data is cached for performance
**Lazy Loading**: Data is loaded only when needed
**Memory Management**: Efficient memory usage for large datasets

### **Calculation Optimization**

Character calculations are optimized for performance:

**Pre-calculated Values**: Common calculations are pre-computed
**Formula Caching**: Formula results are cached to avoid recalculation
**Efficient Algorithms**: Optimized algorithms for character calculations
**Batch Processing**: Multiple calculations are processed in batches

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Character management database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Character management validation rules and schemas
- **[Backend Implementation](backend-implementation.md)** - Character management backend implementation
- **[Frontend Components](frontend-components.md)** - Character management frontend implementation
- **[Class System Static Data](../class-system/static-data.md)** - Class system enums and types
- **[Race System Static Data](../race-system/static-data.md)** - Race system enums and types
- **[Feature System Static Data](../feature-system/static-data.md)** - Feature system enums and types
- **[Spell System Static Data](../spell-system/static-data.md)** - Spell system enums and types
- **[Equipment System Static Data](../equipment-system/static-data.md)** - Equipment system enums and types
- **[Static Data Patterns](../application-overview/static-data.md)** - Shared static data patterns and conventions

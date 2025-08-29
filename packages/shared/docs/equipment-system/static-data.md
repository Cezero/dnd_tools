# Equipment System Static Data

*Complete documentation for the equipment system static data, including enums, types, and reference data structures.*

## 📋 **Overview**

The equipment system static data provides enums, types, and utility functions that define the behavior and capabilities of the equipment system. This includes weapon categories, weapon types, damage types, armor categories, and various utility functions for equipment calculations and management.

The static data layer serves as the foundation for type safety, validation, and consistent behavior across the equipment system. It defines the vocabulary and rules that govern how equipment interacts with characters and other game systems.

**Source File**: `shared/static-data/src/ItemData.ts`

## 🏗️ **Core Enums and Types**

### **Weapon Categories**

Defines the different categories of weapons available in the game system.

**Purpose**: Identifies the different categories of weapons, providing categorization and organizational structure for weapon management.

**Values**:
- **`SIMPLE` (1)**: Simple weapons available to all characters
- **`MARTIAL` (2)**: Martial weapons requiring martial weapon proficiency
- **`EXOTIC` (3)**: Exotic weapons requiring exotic weapon proficiency

**Usage**: Used throughout the application for weapon categorization, filtering, and display.

**Source File**: `shared/static-data/src/ItemData.ts` (WEAPON_CATEGORY_ENUM)

### **Weapon Types**

Defines the different types of weapons based on their usage and characteristics.

**Purpose**: Identifies the different types of weapons, enabling proper weapon classification and usage rules.

**Values**:
- **`UNARMED_ATTACK` (1)**: Unarmed attacks and natural weapons
- **`LIGHT_MELEE_WEAPON` (2)**: Light melee weapons for off-hand use
- **`ONE_HANDED_MELEE_WEAPON` (3)**: One-handed melee weapons
- **`TWO_HANDED_MELEE_WEAPON` (4)**: Two-handed melee weapons
- **`RANGED_WEAPON` (5)**: Ranged weapons for distance combat

**Usage**: Used in weapon definitions to specify the type of weapon and its usage rules.

**Source File**: `shared/static-data/src/ItemData.ts` (WEAPON_TYPE_ENUM)

### **Damage Types**

Defines the different types of damage that weapons and effects can deal.

**Purpose**: Identifies the different types of damage, enabling proper damage calculation and resistance handling.

**Values**:
- **`ALL` (0)**: All damage types (generic)
- **`BLUDGEONING` (1)**: Bludgeoning damage from crushing weapons
- **`PIERCING` (2)**: Piercing damage from pointed weapons
- **`SLASHING` (3)**: Slashing damage from edged weapons
- **`FIRE` (4)**: Fire damage from fire-based effects
- **`COLD` (5)**: Cold damage from cold-based effects
- **`ACID` (6)**: Acid damage from acid-based effects
- **`LIGHTNING` (7)**: Lightning damage from electrical effects
- **`NECROTIC` (8)**: Necrotic damage from death magic
- **`POISON` (9)**: Poison damage from poison effects
- **`RADIANT` (10)**: Radiant damage from holy magic
- **`FORCE` (11)**: Force damage from pure magic
- **`MAGIC` (12)**: Magic damage from magical weapons
- **`LAWFUL` (13)**: Lawful damage from lawful-aligned effects
- **`CHAOTIC` (14)**: Chaotic damage from chaotic-aligned effects
- **`GOOD` (15)**: Good damage from good-aligned effects
- **`EVIL` (16)**: Evil damage from evil-aligned effects
- **`SILVER` (17)**: Silver damage from silver weapons
- **`ADAMANTINE` (18)**: Adamantine damage from adamantine weapons
- **`COLDIRON` (19)**: Cold iron damage from cold iron weapons
- **`EPIC` (20)**: Epic damage from epic-level effects

**Usage**: Used in weapon definitions to specify the type of damage dealt and for damage resistance calculations.

**Source File**: `shared/static-data/src/ItemData.ts` (DAMAGE_TYPE_ENUM)

### **Armor Categories**

Defines the different categories of armor available in the game system.

**Purpose**: Identifies the different categories of armor, providing categorization and organizational structure for armor management.

**Values**:
- **`LIGHT` (1)**: Light armor with minimal restrictions
- **`MEDIUM` (2)**: Medium armor with moderate restrictions
- **`HEAVY` (3)**: Heavy armor with significant restrictions
- **`SHIELD` (4)**: Shields for additional protection
- **`EXTRA` (5)**: Extra armor types for special cases

**Usage**: Used throughout the application for armor categorization, filtering, and display.

**Source File**: `shared/static-data/src/ItemData.ts` (ARMOR_CATEGORY_ENUM)

## 🔧 **Equipment Data Structures**

### **Weapon Category Maps**

The primary data structures containing weapon category definitions with their characteristics.

**Purpose**: Provides comprehensive maps of all weapon categories with their defining characteristics.

**Key Maps**:

**WEAPON_CATEGORIES**: Complete map of all weapon categories
- **Purpose**: Provides complete map of all available weapon categories
- **Usage**: Used for weapon category selection and display

**WEAPON_CATEGORY_BY_ID**: ID to name mapping for weapon categories
- **Purpose**: Provides ID to name mapping for weapon categories
- **Usage**: Used for weapon category lookup and display

**WEAPON_CATEGORY_LIST**: Complete list of all weapon categories
- **Purpose**: Provides complete list of all available weapon categories
- **Usage**: Used for weapon category selection and iteration

**WEAPON_CATEGORY_SELECT_LIST**: Weapon category list for selection components
- **Purpose**: Provides weapon category list formatted for selection components
- **Usage**: Used in weapon category selection dropdowns and lists

**Source File**: `shared/static-data/src/ItemData.ts` (Weapon category definitions)

### **Weapon Type Maps**

The primary data structures containing weapon type definitions with their characteristics.

**Purpose**: Provides comprehensive maps of all weapon types with their defining characteristics.

**Key Maps**:

**WEAPON_TYPES**: Complete map of all weapon types
- **Purpose**: Provides complete map of all available weapon types
- **Usage**: Used for weapon type selection and display

**WEAPON_TYPE_BY_ID**: ID to name mapping for weapon types
- **Purpose**: Provides ID to name mapping for weapon types
- **Usage**: Used for weapon type lookup and display

**WEAPON_TYPE_LIST**: Complete list of all weapon types
- **Purpose**: Provides complete list of all available weapon types
- **Usage**: Used for weapon type selection and iteration

**WEAPON_TYPE_SELECT_LIST**: Weapon type list for selection components
- **Purpose**: Provides weapon type list formatted for selection components
- **Usage**: Used in weapon type selection dropdowns and lists

**Source File**: `shared/static-data/src/ItemData.ts` (Weapon type definitions)

### **Damage Type Maps**

The primary data structures containing damage type definitions with their characteristics.

**Purpose**: Provides comprehensive maps of all damage types with their defining characteristics.

**Key Maps**:

**DAMAGE_TYPES**: Complete map of all damage types
- **Purpose**: Provides complete map of all available damage types
- **Usage**: Used for damage type selection and display

**DAMAGE_TYPE_BY_ID**: ID to name mapping for damage types
- **Purpose**: Provides ID to name mapping for damage types
- **Usage**: Used for damage type lookup and display

**DAMAGE_TYPE_LIST**: Complete list of all damage types
- **Purpose**: Provides complete list of all available damage types
- **Usage**: Used for damage type selection and iteration

**DAMAGE_TYPE_SELECT_LIST**: Damage type list for selection components
- **Purpose**: Provides damage type list formatted for selection components
- **Usage**: Used in damage type selection dropdowns and lists

**Source File**: `shared/static-data/src/ItemData.ts` (Damage type definitions)

### **Armor Category Maps**

The primary data structures containing armor category definitions with their characteristics.

**Purpose**: Provides comprehensive maps of all armor categories with their defining characteristics.

**Key Maps**:

**ARMOR_CATEGORIES**: Complete map of all armor categories
- **Purpose**: Provides complete map of all available armor categories
- **Usage**: Used for armor category selection and display

**ARMOR_CATEGORY_BY_ID**: ID to name mapping for armor categories
- **Purpose**: Provides ID to name mapping for armor categories
- **Usage**: Used for armor category lookup and display

**ARMOR_CATEGORY_LIST**: Complete list of all armor categories
- **Purpose**: Provides complete list of all available armor categories
- **Usage**: Used for armor category selection and iteration

**ARMOR_CATEGORY_SELECT_LIST**: Armor category list for selection components
- **Purpose**: Provides armor category list formatted for selection components
- **Usage**: Used in armor category selection dropdowns and lists

**Source File**: `shared/static-data/src/ItemData.ts` (Armor category definitions)

## 🎯 **Equipment Calculations**

### **Weapon Category Integration**

The weapon category integration system for determining weapon proficiency requirements and usage.

**Purpose**: Calculate and validate weapon categories for weapon proficiency and usage rules.

**Calculation Pattern**:
- **Weapon Lookup**: Look up weapon by ID in weapon data
- **Category Reference**: Extract category ID from weapon definition
- **Category Validation**: Validate category ID against weapon category system
- **Category Calculation**: Use weapon category for proficiency requirements

**Example**: Weapon ID 1 has category ID 2 (Martial), so it requires martial weapon proficiency

**Source File**: `shared/static-data/src/ItemData.ts` (Weapon category integration)

### **Weapon Type Integration**

The weapon type integration system for determining weapon usage and combat mechanics.

**Purpose**: Calculate and validate weapon types for weapon usage rules and combat mechanics.

**Calculation Pattern**:
- **Weapon Lookup**: Look up weapon by ID in weapon data
- **Type Reference**: Extract type ID from weapon definition
- **Type Validation**: Validate type ID against weapon type system
- **Type Calculation**: Use weapon type for usage rules and mechanics

**Example**: Weapon type ID 3 (One-Handed Melee Weapon) can be used in one hand

**Source File**: `shared/static-data/src/ItemData.ts` (Weapon type integration)

### **Damage Type Integration**

The damage type integration system for determining damage calculation and resistance handling.

**Purpose**: Calculate and validate damage types for damage calculation and resistance mechanics.

**Calculation Pattern**:
- **Damage Lookup**: Look up damage by type ID in damage type system
- **Type Reference**: Extract damage type from damage definition
- **Type Validation**: Validate damage type against damage type system
- **Type Calculation**: Use damage type for resistance and vulnerability calculations

**Example**: Damage type ID 3 (Slashing) is resisted by creatures with slashing resistance

**Source File**: `shared/static-data/src/ItemData.ts` (Damage type integration)

### **Armor Category Integration**

The armor category integration system for determining armor proficiency requirements and restrictions.

**Purpose**: Calculate and validate armor categories for armor proficiency and restriction rules.

**Calculation Pattern**:
- **Armor Lookup**: Look up armor by ID in armor data
- **Category Reference**: Extract category ID from armor definition
- **Category Validation**: Validate category ID against armor category system
- **Category Calculation**: Use armor category for proficiency requirements and restrictions

**Example**: Armor ID 1 has category ID 3 (Heavy), so it requires heavy armor proficiency

**Source File**: `shared/static-data/src/ItemData.ts` (Armor category integration)

## 🔗 **Integration with Other Systems**

### **Character System Integration**

The equipment system integrates with the character system through equipment selection and usage:

**Equipment Selection**: Characters can select and acquire equipment
**Equipment Usage**: Characters can use equipment for combat and other activities
**Equipment Benefits**: Character abilities are modified by equipment
**Equipment Restrictions**: Equipment restrictions based on character capabilities

**Integration Pattern**: The equipment system provides the framework for character equipment management, with character abilities and proficiencies determining equipment access and usage.

**Related Documentation**: [Character Management Static Data](../character-management/static-data.md)

## 🔧 **Performance Considerations**

### **Data Access Patterns**

The equipment system static data is optimized for efficient access:

**Map-based Access**: Direct access to equipment data by ID
**Cached Lookups**: Frequently accessed data is cached for performance
**Lazy Loading**: Data is loaded only when needed
**Memory Management**: Efficient memory usage for large datasets

### **Calculation Optimization**

Equipment calculations are optimized for performance:

**Pre-calculated Values**: Common calculations are pre-computed
**Formula Caching**: Formula results are cached to avoid recalculation
**Efficient Algorithms**: Optimized algorithms for equipment calculations
**Batch Processing**: Multiple calculations are processed in batches

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Equipment system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Equipment system validation rules and schemas
- **[Backend Implementation](backend-implementation.md)** - Equipment system backend implementation
- **[Frontend Components](frontend-components.md)** - Equipment system frontend implementation
- **[Character Management Static Data](../character-management/static-data.md)** - Character system enums and types
- **[Static Data Patterns](../application-overview/static-data.md)** - Shared static data patterns and conventions

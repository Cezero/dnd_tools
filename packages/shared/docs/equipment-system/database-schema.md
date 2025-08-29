# Equipment System Database Schema

*Complete documentation for the equipment system database schema, including all models, relationships, and constraints.*

## 📋 **Overview**

The equipment system database schema provides a comprehensive framework for defining equipment, their characteristics, and relationships. The schema supports complex equipment interactions while maintaining data integrity through proper relationships and constraints.

The schema is designed to handle the complexity of D&D equipment, including weapons, armor, descriptions, and mechanical details.

**Source File**: `prisma/schema.prisma` (Equipment-related models)

## 🏗️ **Core Models**

### **Item Model**

The core equipment definition containing basic information about equipment, their characteristics, and mechanical properties.

**Purpose**: Defines the fundamental characteristics of equipment, including its name, type, descriptions, cost, weight, and relationships to weapon and armor data.

**Key Fields**:
- **`id`**: Unique identifier for the equipment
- **`name`**: Human-readable equipment name
- **`typeId`**: Reference to the equipment type
- **`description`**: Detailed equipment description
- **`cost`**: Equipment cost in decimal format
- **`weight`**: Equipment weight in decimal format
- **`quantity`**: Equipment quantity for stackable items

**Relationships**:
- **`type`**: Links to the equipment type
- **`weapon`**: Links to weapon-specific data
- **`armor`**: Links to armor-specific data

**Usage**: Core equipment definitions that are referenced by characters and other systems.

**Source File**: `prisma/schema.prisma` (Item model)

## 🔧 **Integration Models**

### **Weapon Model**

Defines weapon-specific data and properties for equipment that are weapons.

**Purpose**: Links equipment to weapon-specific data and properties for weapon management.

**Key Fields**:
- **`id`**: Reference to the equipment item
- **`category`**: Reference to the weapon category
- **`type`**: Reference to the weapon type
- **`attackBonus`**: Numeric value for attack bonus
- **`damageSmall`**: Damage string for small creatures
- **`damageMedium`**: Damage string for medium creatures
- **`critical`**: Critical hit information string
- **`range`**: Weapon range string
- **`damageType`**: Damage type string
- **`reach`**: Boolean flag for reach weapons
- **`double`**: Boolean flag for double weapons
- **`nonlethal`**: Boolean flag for nonlethal weapons

**Relationships**:
- **`item`**: Links to the equipment item

**Usage**: Provides weapon-specific data and properties for weapon equipment.

**Source File**: `prisma/schema.prisma` (Weapon model)

### **Armor Model**

Defines armor-specific data and properties for equipment that are armor.

**Purpose**: Links equipment to armor-specific data and properties for armor management.

**Key Fields**:
- **`id`**: Reference to the equipment item
- **`category`**: Reference to the armor category
- **`bonus`**: Numeric value for armor bonus
- **`dexterityCap`**: Maximum dexterity bonus allowed
- **`checkPenalty`**: Armor check penalty
- **`arcaneSpellFailure`**: Arcane spell failure chance
- **`speedCapThirty`**: Speed cap for 30-foot base speed
- **`speedCapTwenty`**: Speed cap for 20-foot base speed

**Relationships**:
- **`item`**: Links to the equipment item

**Usage**: Provides armor-specific data and properties for armor equipment.

**Source File**: `prisma/schema.prisma` (Armor model)

## 🔗 **Cross-System Relationships**

### **Character System Integration**

The equipment system integrates with the character system through equipment selection and usage:

**Equipment Selection**: Characters can select and acquire equipment
**Equipment Usage**: Characters can use equipment for combat and other activities
**Equipment Benefits**: Character abilities are modified by equipment
**Equipment Restrictions**: Equipment restrictions based on character capabilities

**Integration Pattern**: The equipment system provides the framework for character equipment management, with character abilities and proficiencies determining equipment access and usage.

**Related Documentation**: [Character Management Database Schema](../character-management/database-schema.md)

## 📊 **Data Integrity Constraints**

### **Primary Key Constraints**

**Item Model**: `id` field is the primary key with auto-increment
**Weapon Model**: `id` field is the primary key and foreign key to Item
**Armor Model**: `id` field is the primary key and foreign key to Item

### **Foreign Key Constraints**

**Equipment Relationships**: All foreign key relationships are properly defined with cascade options
**Type Integration**: Equipment type relationships maintain referential integrity
**Weapon Integration**: Weapon relationships maintain proper data consistency
**Armor Integration**: Armor relationships maintain proper data consistency

### **Validation Constraints**

**Numeric Ranges**: Type ID values are constrained to valid ranges
**Type ID Validation**: Type IDs must reference valid types
**Category Validation**: Category values must reference valid categories
**String Lengths**: Name and description fields have appropriate length constraints

## 🔧 **Performance Considerations**

### **Indexing Strategy**

**Primary Keys**: All primary keys are automatically indexed
**Foreign Keys**: All foreign key fields are indexed for efficient joins
**Lookup Fields**: Frequently queried fields like `name` and `typeId` are indexed
**Composite Indexes**: Composite indexes on frequently queried combinations

### **Query Optimization**

**Eager Loading**: Related data is loaded efficiently using Prisma includes
**Selective Loading**: Only required fields are loaded for performance
**Pagination**: Large result sets are properly paginated
**Caching**: Frequently accessed data is cached appropriately

## 🔗 **Related Documentation**

- **[Validation Schemas](validation-schemas.md)** - Equipment system validation rules and schemas
- **[Static Data](static-data.md)** - Equipment system enums and types
- **[Backend Implementation](backend-implementation.md)** - Equipment system backend implementation
- **[Frontend Components](frontend-components.md)** - Equipment system frontend implementation
- **[Character Management Database Schema](../character-management/database-schema.md)** - Character system database models
- **[Database Schema Patterns](../application-overview/database-schema.md)** - Shared database patterns and conventions

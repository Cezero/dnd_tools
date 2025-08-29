# Class System Database Schema

*Complete documentation for the class system database schema, including all models, relationships, and constraints.*

## 📋 **Overview**

The class system database schema provides a comprehensive framework for defining character classes, their progression, spellcasting capabilities, and related data. The schema supports complex class interactions while maintaining data integrity through proper relationships and constraints.

The schema is designed to handle the complexity of D&D character classes, including level-based progression, spellcasting systems, feature integration, and source attribution.

**Source File**: `prisma/schema.prisma` (Class-related models)

## 🏗️ **Core Models**

### **Class Model**

The core class definition containing basic information about character classes, their capabilities, and progression patterns.

**Purpose**: Defines the fundamental characteristics of a class, including its name, progression values, spellcasting capabilities, and classification.

**Key Fields**:
- **`id`**: Unique identifier for the class
- **`name`**: Human-readable class name
- **`abbreviation`**: Short abbreviation for display
- **`editionId`**: Reference to the edition this class belongs to
- **`isPrestige`**: Boolean flag indicating if this is a prestige class
- **`isVisible`**: Boolean flag for visibility in lists
- **`canCastSpells`**: Boolean flag for spellcasting capability
- **`spellsKnown`**: Boolean flag for spontaneous casting
- **`hitDie`**: Hit die value for the class
- **`skillPoints`**: Skill points per level
- **`castingAbilityId`**: Reference to primary casting ability
- **`castingType`**: Type of spellcasting (prepared, spontaneous, etc.)
- **`babProgression`**: Base attack bonus progression type
- **`fortProgression`**: Fortitude save progression type
- **`refProgression`**: Reflex save progression type
- **`willProgression`**: Will save progression type
- **`description`**: Detailed class description

**Relationships**:
- **`sourceBookInfo`**: Links to source book references
- **`features`**: Links to class features through feature progression
- **`spellcastingProgression`**: Links to spellcasting progression
- **`spellsKnownProgression`**: Links to spells known progression
- **`spellLevelMap`**: Links to class-specific spell lists
- **`userCharacter`**: Links to characters taking levels in this class

**Usage**: Core class definitions that are referenced by characters, features, and spellcasting systems.

**Source File**: `prisma/schema.prisma` (Class model)

### **SpellcastingProgression Model**

Defines spellcasting progression for classes, including spell slots and progression patterns.

**Purpose**: Tracks how spellcasting capabilities develop with class level, including spell slots and progression patterns.

**Key Fields**:
- **`id`**: Unique identifier for the progression
- **`classId`**: Reference to the class
- **`level`**: Class level for this progression
- **`spellLevel`**: Spell level (0-9)
- **`slots`**: Number of spell slots at this level

**Relationships**:
- **`class`**: Links to the class that has this progression
- **`slots`**: Links to individual spell slot definitions
- **`spellcastingLink`**: Links to feature-based spellcasting

**Usage**: Defines spell slot progression for classes with spellcasting capabilities.

**Source File**: `prisma/schema.prisma` (SpellcastingProgression model)

### **SpellcastingSlot Model**

Defines individual spell slots within spellcasting progression.

**Purpose**: Provides detailed information about individual spell slots, including their type and restrictions.

**Key Fields**:
- **`id`**: Unique identifier for the slot
- **`spellcastingProgressionId`**: Reference to the progression
- **`slotType`**: Type of spell slot (standard, domain, etc.)
- **`restrictions`**: Any restrictions on the slot

**Relationships**:
- **`spellcastingProgression`**: Links to the progression containing this slot

**Usage**: Provides detailed spell slot information for complex spellcasting systems.

**Source File**: `prisma/schema.prisma` (SpellcastingSlot model)

## 🔧 **Integration Models**

### **ClassSourceMap Model**

Defines source book references for classes, providing proper attribution and page references.

**Purpose**: Links classes to their source books and provides page references for quick lookup.

**Key Fields**:
- **`classId`**: Reference to the class
- **`sourceBookId`**: Reference to the source book
- **`pageNumber`**: Page number in the source book

**Relationships**:
- **`class`**: Links to the class
- **`sourceBook`**: Links to the source book

**Usage**: Provides proper attribution for class content and enables quick reference lookup.

**Source File**: `prisma/schema.prisma` (ClassSourceMap model)

### **SpellLevelMap Model**

Defines which spells are available to each class at each spell level.

**Purpose**: Links classes to their available spells and defines spell level availability.

**Key Fields**:
- **`classId`**: Reference to the class
- **`spellId`**: Reference to the spell
- **`level`**: Spell level for this class
- **`isVisible`**: Whether the spell is visible in class spell lists

**Relationships**:
- **`class`**: Links to the class
- **`spell`**: Links to the spell

**Usage**: Defines class spell lists and spell level availability.

**Source File**: `prisma/schema.prisma` (SpellLevelMap model)

### **SpellcastingLink Model**

Links feature-based spellcasting to spellcasting progression.

**Purpose**: Connects feature-based spellcasting abilities to standard spellcasting progression.

**Key Fields**:
- **`id`**: Unique identifier for the link
- **`featureProgressionId`**: Reference to the feature progression
- **`progressionId`**: Reference to the spellcasting progression
- **`inheritedFrom`**: Source of inherited spellcasting
- **`levelOffset`**: Level offset for inherited spellcasting

**Relationships**:
- **`feature`**: Links to the feature progression
- **`progression`**: Links to the spellcasting progression

**Usage**: Enables complex spellcasting inheritance and feature-based spellcasting.

**Source File**: `prisma/schema.prisma` (SpellcastingLink model)

## 🔗 **Cross-System Relationships**

### **Feature System Integration**

The class system integrates with the feature system through feature progression:

**FeatureProgression**: Links classes to features with level requirements
**Feature Components**: Classes can have modifiers, choices, and special effects
**Feature Scaling**: Features can scale with class level
**Feature Inheritance**: Features can be inherited from other classes

**Integration Pattern**: Classes use the feature system to define their abilities, ensuring consistent feature mechanics across all systems.

**Related Documentation**: [Feature System Database Schema](../feature-system/database-schema.md)

### **Spellcasting System Integration**

The class system integrates with the spellcasting system through spellcasting progression:

**SpellcastingProgression**: Defines spell slot progression for classes
**SpellcastingSlot**: Provides detailed spell slot information
**SpellLevelMap**: Links classes to their available spells
**SpellcastingLink**: Connects feature-based spellcasting to progression

**Integration Pattern**: Classes use the spellcasting system to define their magical capabilities, ensuring consistent spellcasting mechanics.

**Related Documentation**: [Spellcasting System Database Schema](../spell-system/database-schema.md)

### **Character System Integration**

The class system provides the foundation for character advancement:

**UserCharacter**: Characters take levels in classes
**CharacterAdvancement**: Tracks character progression in classes
**Class Features**: Characters gain class features through the feature system
**Class Spellcasting**: Characters gain spellcasting through the spellcasting system

**Integration Pattern**: The class system provides the framework for character advancement, with other systems providing the specific mechanics.

**Related Documentation**: [Character Management Database Schema](../character-management/database-schema.md)

## 📊 **Data Integrity Constraints**

### **Primary Key Constraints**

**Class Model**: `id` field is the primary key with auto-increment
**SpellcastingProgression Model**: `id` field is the primary key with auto-increment
**SpellcastingSlot Model**: `id` field is the primary key with auto-increment
**ClassSourceMap Model**: Composite primary key on `classId` and `sourceBookId`
**SpellLevelMap Model**: Composite primary key on `classId` and `spellId`

### **Foreign Key Constraints**

**Class Relationships**: All foreign key relationships are properly defined with cascade options
**Feature Integration**: Feature progression relationships maintain referential integrity
**Spellcasting Integration**: Spellcasting relationships maintain referential integrity
**Source Attribution**: Source book relationships maintain proper attribution

### **Validation Constraints**

**Numeric Ranges**: Hit die values are constrained to valid ranges
**Progression Types**: Progression values must be valid enum values
**Casting Types**: Casting type values must be valid enum values
**String Lengths**: Name and abbreviation fields have appropriate length constraints

## 🔧 **Performance Considerations**

### **Indexing Strategy**

**Primary Keys**: All primary keys are automatically indexed
**Foreign Keys**: All foreign key fields are indexed for efficient joins
**Lookup Fields**: Frequently queried fields like `name` and `isVisible` are indexed
**Composite Indexes**: Composite indexes on frequently queried combinations

### **Query Optimization**

**Eager Loading**: Related data is loaded efficiently using Prisma includes
**Selective Loading**: Only required fields are loaded for performance
**Pagination**: Large result sets are properly paginated
**Caching**: Frequently accessed data is cached appropriately

## 🔗 **Related Documentation**

- **[Validation Schemas](validation-schemas.md)** - Class system validation rules and schemas
- **[Static Data](static-data.md)** - Class system enums and types
- **[Backend Implementation](backend-implementation.md)** - Class system backend implementation
- **[Frontend Components](frontend-components.md)** - Class system frontend implementation
- **[Feature System Database Schema](../feature-system/database-schema.md)** - Feature system database models
- **[Spellcasting System Database Schema](../spell-system/database-schema.md)** - Spellcasting system database models
- **[Database Schema Patterns](../application-overview/database-schema.md)** - Shared database patterns and conventions

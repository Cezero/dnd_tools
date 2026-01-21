# Race System Database Schema

*Complete documentation for the race system database schema, including all models, relationships, and constraints.*

## 📋 **Overview**

The race system database schema provides a comprehensive framework for defining character races, their traits, abilities, and related data. The schema supports complex race interactions while maintaining data integrity through proper relationships and constraints.

The schema is designed to handle the complexity of D&D character races, including racial traits, ability adjustments, feature integration, and source attribution.

**Source File**: `prisma/schema.prisma` (Race-related models)

## 🏗️ **Core Models**

### **Race Model**

The core race definition containing basic information about character races, their traits, and characteristics.

**Purpose**: Defines the fundamental characteristics of a race, including its name, size, speed, and related data.

**Key Fields**:
- **`id`**: Unique identifier for the race
- **`name`**: Human-readable race name
- **`description`**: Detailed race description
- **`sizeId`**: Reference to the size category
- **`speed`**: Movement speed in feet
- **`favoredClassId`**: Reference to favored class for experience bonuses
- **`editionId`**: Reference to the edition this race belongs to
- **`isVisible`**: Boolean flag for visibility in lists

**Relationships**:
- **`sources`**: Links to source book references
- **`features`**: Links to racial features through feature progression
- **`userCharacter`**: Links to characters using this race

**Usage**: Core race definitions that are referenced by characters and features.

**Source File**: `prisma/schema.prisma` (Race model)

## 🔧 **Integration Models**

### **RaceSourceMap Model**

Defines source book references for races, providing proper attribution and page references.

**Purpose**: Links races to their source books and provides page references for quick lookup.

**Key Fields**:
- **`raceId`**: Reference to the race
- **`sourceBookId`**: Reference to the source book
- **`pageNumber`**: Page number in the source book

**Relationships**:
- **`race`**: Links to the race
- **`sourceBook`**: Links to the source book

**Usage**: Provides proper attribution for race content and enables quick reference lookup.

**Source File**: `prisma/schema.prisma` (RaceSourceMap model)

## 🔗 **Cross-System Relationships**

### **Feature System Integration**

The race system integrates with the feature system through feature progression:

**Feature**: Links races to features with level requirements (via `FeatureRaceMap` many-to-many relationship)
**Feature Components**: Races can have modifiers, choices, and special effects
**Feature Scaling**: Features can scale with character level
**Feature Inheritance**: Features can be inherited from other races

**Integration Pattern**: Races use the feature system to define their abilities, ensuring consistent feature mechanics across all systems.

**Related Documentation**: [Feature System Database Schema](../feature-system/database-schema.md)

### **Character System Integration**

The race system provides the foundation for character creation:

**UserCharacter**: Characters select races during creation
**CharacterAdvancement**: Tracks character progression with racial traits
**Racial Features**: Characters gain racial features through the feature system
**Racial Bonuses**: Characters gain racial bonuses through ability adjustments

**Integration Pattern**: The race system provides the framework for character racial traits, with other systems providing the specific mechanics.

**Related Documentation**: [Character Management Database Schema](../character-management/database-schema.md)

### **Ability System Integration**

The race system integrates with the ability system for racial bonuses:

**Ability Adjustments**: Races can modify character ability scores
**Ability Bonuses**: Races can provide bonuses to specific abilities
**Ability Penalties**: Races can have penalties to specific abilities
**Ability Integration**: Seamless integration with the ability system

**Integration Pattern**: The race system integrates with the ability system to handle racial ability adjustments, ensuring proper calculation and validation of racial bonuses.

**Related Documentation**: [Ability System Database Schema](../ability-system/database-schema.md)

## 📊 **Data Integrity Constraints**

### **Primary Key Constraints**

**Race Model**: `id` field is the primary key with auto-increment
**RaceSourceMap Model**: Composite primary key on `raceId` and `sourceBookId`

### **Foreign Key Constraints**

**Race Relationships**: All foreign key relationships are properly defined with cascade options
**Feature Integration**: Feature progression relationships maintain referential integrity
**Source Attribution**: Source book relationships maintain proper attribution
**Character Integration**: Character relationships maintain proper data consistency

### **Validation Constraints**

**Numeric Ranges**: Speed values are constrained to valid ranges
**Size ID Validation**: Size ID must reference valid size categories
**Favored Class Validation**: Favored class ID must reference valid classes or -1 for none
**String Lengths**: Name and description fields have appropriate length constraints

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

- **[Validation Schemas](validation-schemas.md)** - Race system validation rules and schemas
- **[Static Data](static-data.md)** - Race system enums and types
- **[Backend Implementation](backend-implementation.md)** - Race system backend implementation
- **[Frontend Components](frontend-components.md)** - Race system frontend implementation
- **[Feature System Database Schema](../feature-system/database-schema.md)** - Feature system database models
- **[Ability System Database Schema](../ability-system/database-schema.md)** - Ability system database models
- **[Character Management Database Schema](../character-management/database-schema.md)** - Character system database models
- **[Database Schema Patterns](../application-overview/database-schema.md)** - Shared database patterns and conventions

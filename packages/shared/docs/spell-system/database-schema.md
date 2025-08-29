# Spell System Database Schema

*Complete documentation for the spell system database schema, including all models, relationships, and constraints.*

## 📋 **Overview**

The spell system database schema provides a comprehensive framework for defining spells, their characteristics, relationships, and class access. The schema supports complex spell interactions while maintaining data integrity through proper relationships and constraints.

The schema is designed to handle the complexity of D&D spells, including schools, subschools, descriptors, components, and class spell level mapping.

**Source File**: `prisma/schema.prisma` (Spell-related models)

## 🏗️ **Core Models**

### **Spell Model**

The core spell definition containing basic information about spells, their characteristics, and mechanical properties.

**Purpose**: Defines the fundamental characteristics of a spell, including its name, level, schools, descriptors, and related data.

**Key Fields**:
- **`id`**: Unique identifier for the spell
- **`name`**: Human-readable spell name
- **`editionId`**: Reference to the edition this spell belongs to
- **`baseLevel`**: Base spell level
- **`summary`**: Brief spell summary
- **`description`**: Detailed spell description
- **`castingTime`**: Spell casting time
- **`range`**: Spell range description
- **`rangeTypeId`**: Reference to range type
- **`rangeValue`**: Numeric range value
- **`area`**: Area of effect description
- **`duration`**: Spell duration
- **`savingThrow`**: Saving throw information
- **`spellResistance`**: Spell resistance information
- **`effect`**: Spell effect description
- **`target`**: Spell target description

**Relationships**:
- **`levelMapping`**: Links to class spell level mappings
- **`schoolIds`**: Links to spell schools
- **`subSchoolIds`**: Links to spell subschools
- **`descriptorIds`**: Links to spell descriptors
- **`componentIds`**: Links to spell components
- **`sourceBookInfo`**: Links to source book references

**Usage**: Core spell definitions that are referenced by classes and characters.

**Source File**: `prisma/schema.prisma` (Spell model)

## 🔧 **Integration Models**

### **SpellSchoolMap Model**

Defines spell school relationships, linking spells to their schools of magic.

**Purpose**: Links spells to their schools of magic for categorization and filtering.

**Key Fields**:
- **`spellId`**: Reference to the spell
- **`schoolId`**: Reference to the spell school

**Relationships**:
- **`spell`**: Links to the spell
- **`school`**: Links to the spell school

**Usage**: Provides spell school categorization and enables school-based filtering.

**Source File**: `prisma/schema.prisma` (SpellSchoolMap model)

### **SpellSubschoolMap Model**

Defines spell subschool relationships, linking spells to their subschools within schools.

**Purpose**: Links spells to their subschools for detailed categorization.

**Key Fields**:
- **`spellId`**: Reference to the spell
- **`subSchoolId`**: Reference to the spell subschool

**Relationships**:
- **`spell`**: Links to the spell
- **`subschool`**: Links to the spell subschool

**Usage**: Provides detailed spell categorization within schools.

**Source File**: `prisma/schema.prisma` (SpellSubschoolMap model)

### **SpellDescriptorMap Model**

Defines spell descriptor relationships, linking spells to their descriptors.

**Purpose**: Links spells to their descriptors for effect categorization.

**Key Fields**:
- **`spellId`**: Reference to the spell
- **`descriptorId`**: Reference to the spell descriptor

**Relationships**:
- **`spell`**: Links to the spell
- **`descriptor`**: Links to the spell descriptor

**Usage**: Provides spell effect categorization and enables descriptor-based filtering.

**Source File**: `prisma/schema.prisma` (SpellDescriptorMap model)

### **SpellComponentMap Model**

Defines spell component relationships, linking spells to their required components.

**Purpose**: Links spells to their required components for casting requirements.

**Key Fields**:
- **`spellId`**: Reference to the spell
- **`componentId`**: Reference to the spell component

**Relationships**:
- **`spell`**: Links to the spell
- **`component`**: Links to the spell component

**Usage**: Defines spell casting requirements and enables component-based filtering.

**Source File**: `prisma/schema.prisma` (SpellComponentMap model)

### **SpellLevelMap Model**

Defines class spell level mappings, linking spells to classes with specific levels.

**Purpose**: Links spells to classes with specific level requirements for spell access.

**Key Fields**:
- **`spellId`**: Reference to the spell
- **`classId`**: Reference to the class
- **`level`**: Spell level for the class
- **`isVisible`**: Visibility flag for the mapping

**Relationships**:
- **`spell`**: Links to the spell
- **`class`**: Links to the class

**Usage**: Defines class spell access and enables class-based spell filtering.

**Source File**: `prisma/schema.prisma` (SpellLevelMap model)

### **SpellSourceMap Model**

Defines source book references for spells, providing proper attribution and page references.

**Purpose**: Links spells to their source books and provides page references for quick lookup.

**Key Fields**:
- **`spellId`**: Reference to the spell
- **`sourceBookId`**: Reference to the source book
- **`pageNumber`**: Page number in the source book

**Relationships**:
- **`spell`**: Links to the spell
- **`sourceBook`**: Links to the source book

**Usage**: Provides proper attribution for spell content and enables quick reference lookup.

**Source File**: `prisma/schema.prisma` (SpellSourceMap model)

## 🔗 **Cross-System Relationships**

### **Class System Integration**

The spell system integrates with the class system through spell level mapping:

**SpellLevelMap**: Links spells to classes with specific levels
**Class Spell Lists**: Classes have access to specific spell lists
**Level Visibility**: Controls which spells are visible to which classes
**Spell Progression**: Enables class spell progression systems

**Integration Pattern**: The spell system provides the foundation for class spellcasting, with classes defining which spells they can access and at what levels.

**Related Documentation**: [Class System Database Schema](../class-system/database-schema.md)

### **Character System Integration**

The spell system provides the foundation for character spellcasting:

**Character Spells**: Characters can learn and cast spells
**Spell Lists**: Characters have access to class spell lists
**Spell Progression**: Character spellcasting follows class progression
**Spell Management**: Characters can manage their known spells

**Integration Pattern**: The spell system provides the framework for character spellcasting, with character classes determining spell access and progression.

**Related Documentation**: [Character Management Database Schema](../character-management/database-schema.md)

### **Source Book System Integration**

The spell system integrates with the source book system for content attribution:

**SpellSourceMap**: Links spells to source books with page references
**Source Attribution**: Spells are properly attributed to source books
**Page References**: Page numbers for quick lookup
**Content Validation**: Source attribution enables content validation

**Integration Pattern**: The spell system maintains proper source attribution, ensuring all spell content is properly credited and traceable.

**Related Documentation**: [Source Book System Database Schema](../source-book-system/database-schema.md)

## 📊 **Data Integrity Constraints**

### **Primary Key Constraints**

**Spell Model**: `id` field is the primary key with auto-increment
**SpellSchoolMap Model**: Composite primary key on `spellId` and `schoolId`
**SpellSubschoolMap Model**: Composite primary key on `spellId` and `subSchoolId`
**SpellDescriptorMap Model**: Composite primary key on `spellId` and `descriptorId`
**SpellComponentMap Model**: Composite primary key on `spellId` and `componentId`
**SpellLevelMap Model**: Composite primary key on `spellId` and `classId`
**SpellSourceMap Model**: Composite primary key on `spellId` and `sourceBookId`

### **Foreign Key Constraints**

**Spell Relationships**: All foreign key relationships are properly defined with cascade options
**Class Integration**: Spell level mapping relationships maintain referential integrity
**Source Attribution**: Source book relationships maintain proper attribution
**Character Integration**: Character relationships maintain proper data consistency

### **Validation Constraints**

**Numeric Ranges**: Base level values are constrained to valid ranges
**School ID Validation**: School IDs must reference valid spell schools
**Subschool ID Validation**: Subschool IDs must reference valid spell subschools
**Descriptor ID Validation**: Descriptor IDs must reference valid spell descriptors
**Component ID Validation**: Component IDs must reference valid spell components
**Class ID Validation**: Class IDs must reference valid classes
**String Lengths**: Name and description fields have appropriate length constraints

## 🔧 **Performance Considerations**

### **Indexing Strategy**

**Primary Keys**: All primary keys are automatically indexed
**Foreign Keys**: All foreign key fields are indexed for efficient joins
**Lookup Fields**: Frequently queried fields like `name` and `editionId` are indexed
**Composite Indexes**: Composite indexes on frequently queried combinations

### **Query Optimization**

**Eager Loading**: Related data is loaded efficiently using Prisma includes
**Selective Loading**: Only required fields are loaded for performance
**Pagination**: Large result sets are properly paginated
**Caching**: Frequently accessed data is cached appropriately

## 🔗 **Related Documentation**

- **[Validation Schemas](validation-schemas.md)** - Spell system validation rules and schemas
- **[Static Data](static-data.md)** - Spell system enums and types
- **[Backend Implementation](backend-implementation.md)** - Spell system backend implementation
- **[Frontend Components](frontend-components.md)** - Spell system frontend implementation
- **[Class System Database Schema](../class-system/database-schema.md)** - Class system database models
- **[Character Management Database Schema](../character-management/database-schema.md)** - Character system database models
- **[Source Book System Database Schema](../source-book-system/database-schema.md)** - Source book system database models
- **[Database Schema Patterns](../application-overview/database-schema.md)** - Shared database patterns and conventions

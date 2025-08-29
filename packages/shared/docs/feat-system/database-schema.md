# Feat System Database Schema

*Complete documentation for the feat system database schema, including all models, relationships, and constraints.*

## 📋 **Overview**

The feat system database schema provides a comprehensive framework for defining feats, their characteristics, and relationships. The schema supports complex feat interactions while maintaining data integrity through proper relationships and constraints.

The schema is designed to handle the complexity of D&D feats, including benefits, prerequisites, descriptions, and mechanical details.

**Source File**: `prisma/schema.prisma` (Feat-related models)

## 🏗️ **Core Models**

### **Feat Model**

The core feat definition containing basic information about feats, their characteristics, and mechanical properties.

**Purpose**: Defines the fundamental characteristics of a feat, including its name, type, descriptions, benefits, and prerequisites.

**Key Fields**:
- **`id`**: Unique identifier for the feat
- **`name`**: Human-readable feat name
- **`typeId`**: Reference to the feat type
- **`description`**: Detailed feat description
- **`benefit`**: Benefit description
- **`normalEffect`**: Normal effect description
- **`specialEffect`**: Special effect description
- **`prerequisites`**: Prerequisite description
- **`repeatable`**: Boolean flag for repeatable feats
- **`fighterBonus`**: Boolean flag for fighter bonus feats

**Relationships**:
- **`type`**: Links to the feat type
- **`benefits`**: Links to feat benefit mappings
- **`prereqs`**: Links to feat prerequisite mappings

**Usage**: Core feat definitions that are referenced by characters and other systems.

**Source File**: `prisma/schema.prisma` (Feat model)

## 🔧 **Integration Models**

### **FeatBenefitMap Model**

Defines feat benefit relationships, linking feats to their benefits and effects.

**Purpose**: Links feats to their benefits and effects for feat benefit management.

**Key Fields**:
- **`featId`**: Reference to the feat
- **`typeId`**: Reference to the benefit type
- **`referenceId`**: Reference to the specific entity (skill, save, etc.)
- **`amount`**: Numeric value for the benefit
- **`index`**: Ordering index for multiple benefits

**Relationships**:
- **`feat`**: Links to the feat
- **`type`**: Links to the benefit type

**Usage**: Provides feat benefit relationships and calculations.

**Source File**: `prisma/schema.prisma` (FeatBenefitMap model)

### **FeatPrerequisiteMap Model**

Defines feat prerequisite relationships, linking feats to their requirements.

**Purpose**: Links feats to their prerequisites and requirements for feat access management.

**Key Fields**:
- **`featId`**: Reference to the feat
- **`typeId`**: Reference to the prerequisite type
- **`referenceId`**: Reference to the specific entity (ability, skill, feat, etc.)
- **`amount`**: Numeric value for the requirement
- **`index`**: Ordering index for multiple prerequisites

**Relationships**:
- **`feat`**: Links to the feat
- **`type`**: Links to the prerequisite type

**Usage**: Provides feat prerequisite relationships and validation.

**Source File**: `prisma/schema.prisma` (FeatPrerequisiteMap model)

### **Feat Source Map Model**

Defines source book references for feats, providing proper attribution and page references.

**Purpose**: Links feats to their source books and provides page references for quick lookup.

**Key Fields**:
- **`featId`**: Reference to the feat
- **`sourceBookId`**: Reference to the source book
- **`pageNumber`**: Page number in the source book

**Relationships**:
- **`feat`**: Links to the feat
- **`sourceBook`**: Links to the source book

**Usage**: Provides proper attribution for feat content and enables quick reference lookup.

**Source File**: `prisma/schema.prisma` (FeatSourceMap model)

## 🔗 **Cross-System Relationships**

### **Character System Integration**

The feat system integrates with the character system through feat selection and prerequisites:

**Feat Selection**: Characters can select and acquire feats
**Prerequisite Validation**: Character abilities and skills are validated against feat prerequisites
**Feat Benefits**: Character abilities are modified by feat benefits
**Feat Progression**: Character feat progression follows level and class rules

**Integration Pattern**: The feat system provides the framework for character feat management, with character abilities and skills determining feat access and progression.

**Related Documentation**: [Character Management Database Schema](../character-management/database-schema.md)

### **Ability System Integration**

The feat system integrates with the ability system through prerequisites and benefits:

**Ability Prerequisites**: Feats can require minimum ability scores
**Ability Benefits**: Feats can provide ability score bonuses
**Ability Validation**: Ability scores are validated against feat prerequisites
**Ability Calculation**: Ability modifiers are used in feat calculations

**Integration Pattern**: The feat system integrates with the ability system to determine feat prerequisites and benefits, ensuring proper ability score usage in feat mechanics.

**Related Documentation**: [Ability System Database Schema](../ability-system/database-schema.md)

### **Skill System Integration**

The feat system integrates with the skill system through prerequisites and benefits:

**Skill Prerequisites**: Feats can require minimum skill ranks
**Skill Benefits**: Feats can provide skill bonuses and proficiencies
**Skill Validation**: Skill ranks are validated against feat prerequisites
**Skill Calculation**: Skill bonuses are calculated from feat benefits

**Integration Pattern**: The feat system integrates with the skill system to determine feat prerequisites and benefits, ensuring proper skill usage in feat mechanics.

**Related Documentation**: [Skill System Database Schema](../skill-system/database-schema.md)

### **Feature System Integration**

The feat system integrates with the feature system for feat-related features:

**Feat Prerequisites**: Features can require specific feats
**Feat Benefits**: Features can provide feat-related bonuses
**Feat Progression**: Features can grant additional feats
**Feat Specializations**: Features can provide feat specializations

**Integration Pattern**: The feat system integrates with the feature system to handle feat-related features, ensuring proper feat prerequisite and benefit calculations.

**Related Documentation**: [Feature System Database Schema](../feature-system/database-schema.md)

### **Source Book System Integration**

The feat system integrates with the source book system for content attribution:

**FeatSourceMap**: Links feats to source books with page references
**Source Attribution**: Feats are properly attributed to source books
**Page References**: Page numbers for quick lookup
**Content Validation**: Source attribution enables content validation

**Integration Pattern**: The feat system maintains proper source attribution, ensuring all feat content is properly credited and traceable.

**Related Documentation**: [Source Book System Database Schema](../source-book-system/database-schema.md)

## 📊 **Data Integrity Constraints**

### **Primary Key Constraints**

**Feat Model**: `id` field is the primary key with auto-increment
**FeatBenefitMap Model**: Composite primary key on `featId` and `index`
**FeatPrerequisiteMap Model**: Composite primary key on `featId` and `index`
**FeatSourceMap Model**: Composite primary key on `featId` and `sourceBookId`

### **Foreign Key Constraints**

**Feat Relationships**: All foreign key relationships are properly defined with cascade options
**Type Integration**: Feat type relationships maintain referential integrity
**Benefit Integration**: Feat benefit relationships maintain proper data consistency
**Prerequisite Integration**: Feat prerequisite relationships maintain proper data consistency
**Source Attribution**: Source book relationships maintain proper attribution

### **Validation Constraints**

**Numeric Ranges**: Type ID values are constrained to valid ranges
**Type ID Validation**: Type IDs must reference valid types
**Reference ID Validation**: Reference IDs must reference valid entities
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

- **[Validation Schemas](validation-schemas.md)** - Feat system validation rules and schemas
- **[Static Data](static-data.md)** - Feat system enums and types
- **[Backend Implementation](backend-implementation.md)** - Feat system backend implementation
- **[Frontend Components](frontend-components.md)** - Feat system frontend implementation
- **[Character Management Database Schema](../character-management/database-schema.md)** - Character system database models
- **[Ability System Database Schema](../ability-system/database-schema.md)** - Ability system database models
- **[Skill System Database Schema](../skill-system/database-schema.md)** - Skill system database models
- **[Feature System Database Schema](../feature-system/database-schema.md)** - Feature system database models
- **[Source Book System Database Schema](../source-book-system/database-schema.md)** - Source book system database models
- **[Database Schema Patterns](../application-overview/database-schema.md)** - Shared database patterns and conventions

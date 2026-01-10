# Skill System Database Schema

*Complete documentation for the skill system database schema, including all models, relationships, and constraints.*

## 📋 **Overview**

The skill system database schema provides a comprehensive framework for defining skills, their characteristics, and relationships. The schema supports complex skill interactions while maintaining data integrity through proper relationships and constraints.

The schema is designed to handle the complexity of D&D skills, including key abilities, training requirements, descriptions, and mechanical details.

**Source File**: `prisma/schema.prisma` (Skill-related models)

## 🏗️ **Core Models**

### **Skill Model**

The core skill definition containing basic information about skills, their characteristics, and mechanical properties.

**Purpose**: Defines the fundamental characteristics of a skill, including its name, key ability, training requirements, and related data.

**Key Fields**:
- **`id`**: Unique identifier for the skill
- **`name`**: Human-readable skill name
- **`abilityId`**: Reference to the key ability for the skill
- **`trainedOnly`**: Boolean flag for training requirement
- **`affectedByArmor`**: Boolean flag for armor check penalty
- **`isAnalog`**: Boolean flag for analog skill type
- **`hasSubtypes`**: Boolean flag indicating if skill uses predefined subtypes (e.g., Craft, Knowledge)
- **`usesCustomSubtype`**: Boolean flag indicating if skill uses custom subtypes (e.g., Perform, Profession)
- **`hasNoMaxRanks`**: Boolean flag indicating if skill has no maximum rank limit (e.g., Speak Language)
- **`doubleArmorPenalty`**: Boolean flag indicating if skill has double armor check penalty (e.g., Swim)
- **`description`**: Detailed skill description
- **`checkDescription`**: Skill check mechanics description
- **`actionDescription`**: Action requirements description
- **`retryTypeId`**: Reference to retry type
- **`retryDescription`**: Retry rules description
- **`specialNotes`**: Special rules and notes
- **`synergyNotes`**: Synergy bonus information
- **`untrainedNotes`**: Untrained use rules
- **`restrictionNotes`**: Special restrictions and limitations

**Relationships**:
- **`ability`**: Links to the key ability for the skill
- **`retryType`**: Links to the retry type for the skill
- **`subtypes`**: Links to skill subtypes (for skills with predefined subtypes like Craft and Knowledge)

**Usage**: Core skill definitions that are referenced by characters and other systems.

**Source File**: `prisma/schema.prisma` (Skill model)

## 🔧 **Integration Models**

### **Character Skill Model**

Defines character skill relationships, linking characters to their skill ranks and bonuses.

**Purpose**: Links characters to their skill ranks and bonuses for skill management.

**Key Fields**:
- **`characterId`**: Reference to the character
- **`skillId`**: Reference to the skill
- **`ranks`**: Number of skill ranks invested
- **`bonus`**: Additional skill bonuses
- **`isClassSkill`**: Boolean flag for class skill bonus

**Relationships**:
- **`character`**: Links to the character
- **`skill`**: Links to the skill

**Usage**: Provides character skill advancement and management.

**Source File**: `prisma/schema.prisma` (CharacterSkill model)

### **Skill Source Map Model**

Defines source book references for skills, providing proper attribution and page references.

**Purpose**: Links skills to their source books and provides page references for quick lookup.

**Key Fields**:
- **`skillId`**: Reference to the skill
- **`sourceBookId`**: Reference to the source book
- **`pageNumber`**: Page number in the source book

**Relationships**:
- **`skill`**: Links to the skill
- **`sourceBook`**: Links to the source book

**Usage**: Provides proper attribution for skill content and enables quick reference lookup.

**Source File**: `prisma/schema.prisma` (SkillSourceMap model)

### **SkillSubtype Model**

Defines predefined subtypes for skills that support subtypes (Craft and Knowledge skills).

**Purpose**: Provides structured subtype data for skills that have multiple predefined variants, enabling proper skill selection and management.

**Key Fields**:
- **`id`**: Unique identifier for the skill subtype
- **`skillId`**: Reference to the parent skill (e.g., Craft or Knowledge)
- **`name`**: Human-readable subtype name (e.g., "alchemy", "arcana")
- **`editionId`**: Reference to the edition this subtype belongs to
- **`isVisible`**: Boolean flag for visibility in UI

**Relationships**:
- **`skill`**: Links to the parent skill

**Usage**: Used to provide structured subtype selection for Craft and Knowledge skills, replacing hardcoded static data with database-driven lookups.

**Special Cases**:
- **Craft Skills**: 24 predefined subtypes (alchemy, armorsmithing, basketweaving, etc.)
- **Knowledge Skills**: 10 predefined subtypes (arcana, architecture and engineering, dungeoneering, etc.)
- **Perform/Profession**: Use custom subtypes (stored as strings in character data, not in this table)

**Source File**: `prisma/schema.prisma` (SkillSubtype model)

## 🔗 **Cross-System Relationships**

### **Ability System Integration**

The skill system integrates with the ability system through key abilities:

**Key Ability**: Each skill has a key ability that determines the ability modifier used
**Ability Validation**: Skill ability IDs are validated against ability system
**Ability Display**: Skills display their key ability information
**Ability Calculation**: Skill checks use ability modifiers for calculations

**Integration Pattern**: The skill system integrates with the ability system to determine skill key abilities, ensuring proper ability modifier usage in skill calculations.

**Related Documentation**: [Ability System Database Schema](../ability-system/database-schema.md)

### **Character System Integration**

The skill system provides the foundation for character skill management:

**Character Skills**: Characters can have skill ranks and bonuses
**Skill Progression**: Character skill progression follows class and level rules
**Skill Checks**: Characters make skill checks using their skill ranks and ability modifiers
**Skill Synergies**: Skills can provide bonuses to other skills

**Integration Pattern**: The skill system provides the framework for character skill management, with character classes and levels determining skill access and progression.

**Related Documentation**: [Character Management Database Schema](../character-management/database-schema.md)

### **Feature System Integration**

The skill system integrates with the feature system for skill-related features:

**Skill Bonuses**: Features can provide skill bonuses and modifiers
**Skill Synergies**: Features can provide skill synergy bonuses
**Skill Proficiencies**: Features can grant skill proficiencies
**Skill Specializations**: Features can provide skill specializations

**Integration Pattern**: The skill system integrates with the feature system to handle skill-related features, ensuring proper skill bonus and modifier calculations.

**Related Documentation**: [Feature System Database Schema](../feature-system/database-schema.md)

### **Source Book System Integration**

The skill system integrates with the source book system for content attribution:

**SkillSourceMap**: Links skills to source books with page references
**Source Attribution**: Skills are properly attributed to source books
**Page References**: Page numbers for quick lookup
**Content Validation**: Source attribution enables content validation

**Integration Pattern**: The skill system maintains proper source attribution, ensuring all skill content is properly credited and traceable.

**Related Documentation**: [Source Book System Database Schema](../source-book-system/database-schema.md)

## 📊 **Data Integrity Constraints**

### **Primary Key Constraints**

**Skill Model**: `id` field is the primary key with auto-increment
**CharacterSkill Model**: Composite primary key on `characterId` and `skillId`
**SkillSourceMap Model**: Composite primary key on `skillId` and `sourceBookId`
**SkillSubtype Model**: `id` field is the primary key with auto-increment

### **Foreign Key Constraints**

**Skill Relationships**: All foreign key relationships are properly defined with cascade options
**Ability Integration**: Skill ability relationships maintain referential integrity
**Character Integration**: Character skill relationships maintain proper data consistency
**Source Attribution**: Source book relationships maintain proper attribution
**Subtype Relationships**: SkillSubtype relationships maintain referential integrity with parent skills

### **Validation Constraints**

**Numeric Ranges**: Ability ID values are constrained to valid ranges
**Ability ID Validation**: Ability IDs must reference valid abilities
**Retry Type ID Validation**: Retry type IDs must reference valid retry types
**String Lengths**: Name and description fields have appropriate length constraints

## 🔧 **Performance Considerations**

### **Indexing Strategy**

**Primary Keys**: All primary keys are automatically indexed
**Foreign Keys**: All foreign key fields are indexed for efficient joins
**Lookup Fields**: Frequently queried fields like `name` and `abilityId` are indexed
**Composite Indexes**: Composite indexes on frequently queried combinations
**SkillSubtype Indexes**: Indexed on `skillId` for efficient subtype lookups by parent skill

### **Query Optimization**

**Eager Loading**: Related data is loaded efficiently using Prisma includes
**Selective Loading**: Only required fields are loaded for performance
**Pagination**: Large result sets are properly paginated
**Caching**: Frequently accessed data is cached appropriately

## 🔗 **Related Documentation**

- **[Validation Schemas](validation-schemas.md)** - Skill system validation rules and schemas
- **[Static Data](static-data.md)** - Skill system enums and types
- **[Backend Implementation](backend-implementation.md)** - Skill system backend implementation
- **[Frontend Components](frontend-components.md)** - Skill system frontend implementation
- **[Ability System Database Schema](../ability-system/database-schema.md)** - Ability system database models
- **[Character Management Database Schema](../character-management/database-schema.md)** - Character system database models
- **[Feature System Database Schema](../feature-system/database-schema.md)** - Feature system database models
- **[Source Book System Database Schema](../source-book-system/database-schema.md)** - Source book system database models
- **[Database Schema Patterns](../application-overview/database-schema.md)** - Shared database patterns and conventions

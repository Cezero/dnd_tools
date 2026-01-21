# Feat System Database Schema

*Complete documentation for the feat system database schema, including all models, relationships, and constraints.*

## 📋 **Overview**

The feat system database schema provides a comprehensive framework for defining feats, their characteristics, and relationships. The schema supports complex feat interactions while maintaining data integrity through proper relationships and constraints.

The schema is designed to handle the complexity of D&D feats. All feat benefits, prerequisites, descriptions, and summaries are handled through the unified Feature system (Feature, FeatureEntity, FeaturePrerequisite). The Feat model contains only metadata fields (name, type, flags). Note: FeatureProgression is a type alias for FeatureWithRelationsSchema.

**Source File**: `prisma/schema.prisma` (Feat-related models)

## 🏗️ **Core Models**

### **Feat Model**

The core feat definition containing basic information about feats, their characteristics, and mechanical properties.

**Purpose**: Defines the fundamental characteristics of a feat, including its name, type, and metadata. Benefits, prerequisites, descriptions, and summaries are handled through the Feature system.

**Key Fields**:
- **`id`**: Unique identifier for the feat
- **`name`**: Human-readable feat name
- **`typeId`**: Reference to the feat type
- **`repeatable`**: Boolean flag for repeatable feats
- **`fighterBonus`**: Boolean flag for fighter bonus feats
- **`useSubId`**: Boolean flag indicating if the feat allows player choice (e.g., Skill Focus)
- **`isVisible`**: Boolean flag for feat visibility
- **`editionId`**: Reference to the edition

**Relationships**:
- **`features`**: Links to Feature entries that define the feat's benefits and prerequisites through the Feature system (via `featId` foreign key)

**Usage**: Core feat definitions that are referenced by characters and other systems. Benefits and prerequisites are managed through Feature entries (with featId reference).

**Source File**: `prisma/schema.prisma` (Feat model)

## 🔗 **Cross-System Relationships**

### **Character System Integration**

The feat system integrates with the character system through feat selection and prerequisites:

**Feat Selection**: Characters can select and acquire feats
**Prerequisite Validation**: Character abilities and skills are validated against feat prerequisites
**Feat Benefits**: Character abilities are modified by feat benefits
**Feat Progression**: Character feat progression follows level and class rules

**Integration Pattern**: The feat system provides the framework for character feat management, with character abilities and skills determining feat access and progression.

**Related Documentation**: [Character Management Database Schema](../character-management/database-schema.md)



### **Feature System Integration**

The feat system is fully integrated with the Feature system for managing benefits and prerequisites:

**Feat Benefits**: All feat benefits are defined through Feature entries (with featId reference) with FeatureEntity entries. Each FeatureEntity specifies:
- **`appliesTo`**: The type of benefit (Attack, SavingThrow, Skill, etc.)
- **`appliesToId`**: The specific entity ID (skill ID, ability ID, etc.)
- **`appliesToSubId`**: Optional sub-identifier for special contexts (e.g., AttackBonusAppliesTo for two-weapon fighting)
- **`value`**: The numeric bonus value
- **`type`**: The entity type (Bonus, Other, etc.)

**Feat Prerequisites**: All feat prerequisites are defined through Feature entries (with featId reference) with FeaturePrerequisite entries. Each FeaturePrerequisite specifies:
- **`type`**: The prerequisite type (AbilityScore, SkillRanks, Feat, etc.)
- **`appliesToId`**: The specific entity ID (ability ID, skill ID, feat ID, etc.)
- **`minValue`**: The minimum required value

**Integration Pattern**: Each feat has one or more Feature entries (sourceType: Feat, featId references the Feat) that define its benefits and prerequisites. This unified approach allows feats to use the same powerful Feature system as races, classes, and other sources.

**Example: Two-Weapon Fighting**
The Two-Weapon Fighting feat provides different attack bonuses to main hand and off-hand attacks. This is handled using `appliesToSubId` with the `AttackBonusAppliesTo` enum:
- Main hand entity: `appliesTo: EntityAppliesToType.Attack`, `appliesToSubId: AttackBonusAppliesTo.MainHand`, `value: 2`
- Off hand entity: `appliesTo: EntityAppliesToType.Attack`, `appliesToSubId: AttackBonusAppliesTo.OffHand`, `value: 6`

The calculation system uses context flags (`isDualWield`, `isOffHand`) to determine which bonus applies.

**Related Documentation**: [Feature System Database Schema](../feature-system/database-schema.md)


## 📊 **Data Integrity Constraints**

### **Primary Key Constraints**

**Feat Model**: `id` field is the primary key with auto-increment

### **Foreign Key Constraints**

**Feat Relationships**: All foreign key relationships are properly defined with cascade options
**Type Integration**: Feat type relationships maintain referential integrity
**Feature System Integration**: Feature relationships (via featId) maintain proper data consistency for benefits and prerequisites
**Source Attribution**: Source book relationships maintain proper attribution

### **Validation Constraints**

**Numeric Ranges**: Type ID values are constrained to valid ranges
**Type ID Validation**: Type IDs must reference valid types
**Reference ID Validation**: Reference IDs must reference valid entities
**String Lengths**: Name field has appropriate length constraints (descriptions and summaries are stored in the Feature model)

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

## 🎯 **Player Choice Mechanics**

### **UseSubId Property**
The `useSubId` property enables player choice mechanics for feats that allow flexible benefit selection.

**Implementation Pattern**:
- **`useSubId: false`**: Predefined feats with fixed benefits (e.g., Alertness)
- **`useSubId: true`**: Player choice feats requiring selection (e.g., Skill Focus)

**Examples**:

**Predefined Feat (Alertness)**:
```sql
-- Fixed benefits, no player choice required
INSERT INTO Feat (name, useSubId, ...) VALUES ('Alertness', false, ...);
-- Benefits defined via Feature (with featId reference) with FeatureEntity entries:
-- Entity 1: appliesTo: Skill, appliesToId: 15 (Listen), value: 2
-- Entity 2: appliesTo: Skill, appliesToId: 16 (Spot), value: 2
```

**Player Choice Feat (Skill Focus)**:
```sql
-- Player must choose skill, appliesToId is null in FeatureEntity
INSERT INTO Feat (name, useSubId, ...) VALUES ('Skill Focus', true, ...);
-- Benefit defined via FeatureProgression with FeatureEntity:
-- Entity: appliesTo: Skill, appliesToId: NULL, value: 3
-- Player's choice stored in CharacterFeatureChoice.appliesToSubId
```

### **Character Implementation**
When a character selects a feat with `useSubId: true`:
1. **Player Choice Required**: Character must specify which skill/weapon/etc.
2. **Choice Storage**: Selection stored in CharacterFeatureChoice with `appliesToSubId` set to the chosen entity ID
3. **Benefit Application**: Benefits applied to the chosen entity via FeatureEntity resolution
4. **Validation**: System validates that the choice is valid for the benefit type

### **Database Patterns**
- **Predefined Feats**: FeatureEntity `appliesToId` contains specific entity ID
- **Player Choice Feats**: FeatureEntity `appliesToId` is `NULL`, choice stored in CharacterFeatureChoice
- **Character Feats**: Character's choices stored in CharacterFeatureChoice entries

## 🔗 **Related Documentation**

- **[Validation Schemas](validation-schemas.md)** - Feat system validation rules and schemas
- **[Static Data](static-data.md)** - Feat system enums and types
- **[Backend Implementation](backend-implementation.md)** - Feat system backend implementation
- **[Frontend Components](frontend-components.md)** - Feat system frontend implementation
- **[Character Management Database Schema](../character-management/database-schema.md)** - Character system database models
- **[Feature System Database Schema](../feature-system/database-schema.md)** - Feature system database models
- **[Database Schema Patterns](../application-overview/database-schema.md)** - Shared database patterns and conventions

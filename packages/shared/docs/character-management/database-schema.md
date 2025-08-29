# Character Management Database Schema

*Complete database schema documentation for the character management system, including all Prisma models, relationships, and constraints.*

## 📋 **Overview**

The character management database schema defines the foundation for character creation, advancement, and data persistence. This schema provides the data layer that supports all character-related functionality in the application, including character definitions, advancement tracking, and integration with other game systems.

**Source File**: `prisma/schema.prisma` (Character-related models)

## 🏗️ **Core Models**

### **UserCharacter Model**
**Database Table**: `UserCharacter`

The primary model for character definitions, containing complete character information including basic attributes, relationships, and user ownership.

#### **Core Attributes**

The UserCharacter model follows the standard **Identity and Audit Fields** pattern documented in the [Database Schema Patterns](../application-overview/database-schema.md#identity-and-audit-fields):

- **Identity Fields**: `name` provides the human-readable identifier for the character
- **User Ownership**: `userId` links characters to specific users
- **Classification**: `raceId` and `alignmentId` define character categorization
- **Descriptive Content**: `age`, `height`, `weight`, `eyes`, `hair`, `gender`, `notes` provide character details
- **Progression Tracking**: `xp` tracks character experience points

#### **Character Properties Fields**

**Basic Information**:
- **`name`**: String providing the character's name
- **`userId`**: Integer reference to the character's owner
- **`raceId`**: Integer reference to the character's race
- **`alignmentId`**: Integer reference to the character's alignment

**Physical Attributes**:
- **`age`**: Optional integer for character age
- **`height`**: Optional integer for character height
- **`weight`**: Optional integer for character weight
- **`eyes`**: Optional string for eye color
- **`hair`**: Optional string for hair color
- **`gender`**: Optional string for character gender

**Progression and Notes**:
- **`xp`**: Integer tracking experience points (default: 0)
- **`notes`**: Optional text for character notes and descriptions

#### **Relationships**

**One-to-Many Relationships**:
- **`abilityScores`**: Links to `UserCharacterAbilityScore` entries defining character ability scores
- **`characterItems`**: Links to `CharacterItem` entries defining character equipment
- **`advancements`**: Links to `CharacterAdvancement` entries defining character progression
- **`preparedSpells`**: Links to `CharacterSpellPreparation` entries defining prepared spells

**Many-to-One Relationships**:
- **`race`**: Links to the character's race via `Race` model
- **`user`**: Links to the character's owner via `User` model

**Source File**: `prisma/schema.prisma` (UserCharacter model)

### **UserCharacterAbilityScore Model**
**Database Table**: `UserCharacterAbilityScore`

Defines character ability scores, enabling ability score tracking and calculation of derived statistics.

#### **Core Attributes**

**Ability Score Definition**:
- **`id`**: Auto-incrementing primary key
- **`characterId`**: Foreign key reference to the parent character
- **`abilityId`**: Integer reference to the specific ability (Strength, Dexterity, etc.)
- **`value`**: Integer value of the ability score

#### **Relationships**

**Many-to-One Relationships**:
- **`character`**: Links to the parent `UserCharacter` model

**Source File**: `prisma/schema.prisma` (UserCharacterAbilityScore model)

### **CharacterAdvancement Model**
**Database Table**: `CharacterAdvancement`

Defines character level progression and advancement choices, enabling level-by-level character development.

#### **Core Attributes**

**Advancement Definition**:
- **`id`**: Auto-incrementing primary key
- **`characterId`**: Foreign key reference to the parent character
- **`level`**: Integer indicating the character level
- **`version`**: Integer for versioning multiple advancement records per level
- **`classId`**: Integer reference to the primary class
- **`secondaryClassId`**: Optional integer reference to the secondary class (multiclassing)
- **`hitPoints`**: Integer for hit points gained at this level
- **`abilityId`**: Optional integer reference to ability score improved at this level
- **`notes`**: Optional text for advancement notes
- **`createdAt`**: Timestamp for when the advancement was created

#### **Composite Unique Constraint**

The model uses a composite unique constraint combining `characterId`, `level`, and `version`:
```prisma
@@unique([characterId, level, version])
```

This ensures that each character can have multiple advancement records per level with proper versioning.

#### **Relationships**

**Many-to-One Relationships**:
- **`character`**: Links to the parent `UserCharacter` model
- **`class`**: Links to the primary class via `Class` model
- **`secondaryClass`**: Links to the secondary class via `Class` model (multiclassing)

**One-to-Many Relationships**:
- **`skills`**: Links to `AdvancementSkill` entries defining skill point allocation
- **`feats`**: Links to `AdvancementFeat` entries defining feat selections
- **`spellsKnown`**: Links to `AdvancementSpell` entries defining spells known
- **`featureChoices`**: Links to `CharacterFeatureChoice` entries defining feature choices

**Source File**: `prisma/schema.prisma` (CharacterAdvancement model)

### **AdvancementSkill Model**
**Database Table**: `AdvancementSkill`

Defines skill point allocation for character advancement, enabling skill progression tracking.

#### **Core Attributes**

**Skill Advancement Definition**:
- **`advancementId`**: Foreign key reference to the parent advancement
- **`skillId`**: Integer reference to the specific skill
- **`pointsSpent`**: Integer indicating skill points spent on this skill

#### **Composite Primary Key**

The model uses a composite primary key combining `advancementId` and `skillId`:
```prisma
@@id([advancementId, skillId])
```

This ensures that each advancement can have one skill point allocation per skill.

#### **Relationships**

**Many-to-One Relationships**:
- **`advancement`**: Links to the parent `CharacterAdvancement` model
- **`skill`**: Links to the specific skill via `Skill` model

**Source File**: `prisma/schema.prisma` (AdvancementSkill model)

### **AdvancementFeat Model**
**Database Table**: `AdvancementFeat`

Defines feat selections for character advancement, enabling feat progression tracking.

#### **Core Attributes**

**Feat Advancement Definition**:
- **`advancementId`**: Foreign key reference to the parent advancement
- **`featId`**: Integer reference to the selected feat

#### **Composite Primary Key**

The model uses a composite primary key combining `advancementId` and `featId`:
```prisma
@@id([advancementId, featId])
```

This ensures that each advancement can have one feat selection per feat.

#### **Relationships**

**Many-to-One Relationships**:
- **`advancement`**: Links to the parent `CharacterAdvancement` model
- **`feat`**: Links to the selected feat via `Feat` model

**Source File**: `prisma/schema.prisma` (AdvancementFeat model)

### **AdvancementSpell Model**
**Database Table**: `AdvancementSpell`

Defines spells known for character advancement, enabling spell progression tracking.

#### **Core Attributes**

**Spell Advancement Definition**:
- **`advancementId`**: Foreign key reference to the parent advancement
- **`spellId`**: Integer reference to the known spell

#### **Composite Primary Key**

The model uses a composite primary key combining `advancementId` and `spellId`:
```prisma
@@id([advancementId, spellId])
```

This ensures that each advancement can have one spell known per spell.

#### **Relationships**

**Many-to-One Relationships**:
- **`advancement`**: Links to the parent `CharacterAdvancement` model
- **`spell`**: Links to the known spell via `Spell` model

**Source File**: `prisma/schema.prisma` (AdvancementSpell model)

### **CharacterFeatureChoice Model**
**Database Table**: `CharacterFeatureChoice`

Defines player choices for feature options, enabling feature choice tracking and persistence.

#### **Core Attributes**

**Feature Choice Definition**:
- **`id`**: Auto-incrementing primary key
- **`characterId`**: Foreign key reference to the parent character
- **`featureChoiceId`**: Integer reference to the specific feature choice
- **`progressionId`**: Integer reference to the feature progression
- **`advancementId`**: Integer reference to the character advancement
- **`key`**: Optional string for choice key/identifier
- **`value`**: String containing the choice value
- **`choiceIndex`**: Optional integer for choice ordering

#### **Composite Unique Constraint**

The model uses a composite unique constraint combining `advancementId`, `progressionId`, and `key`:
```prisma
@@unique([advancementId, progressionId, key])
```

This ensures that each advancement can have one choice per feature progression and key.

#### **Relationships**

**Many-to-One Relationships**:
- **`featureProgression`**: Links to the feature progression via `FeatureProgression` model
- **`featureChoice`**: Links to the feature choice via `FeatureChoice` model
- **`advancement`**: Links to the character advancement via `CharacterAdvancement` model

**Source File**: `prisma/schema.prisma` (CharacterFeatureChoice model)

### **CharacterSpellPreparation Model**
**Database Table**: `CharacterSpellPreparation`

Defines character spell preparation, enabling spell preparation tracking and metamagic integration.

#### **Core Attributes**

**Spell Preparation Definition**:
- **`characterId`**: Foreign key reference to the parent character
- **`prepKey`**: String key for spell preparation identification
- **`spellId`**: Integer reference to the prepared spell
- **`level`**: Integer indicating the spell level
- **`notes`**: Optional text for preparation notes

#### **Composite Primary Key**

The model uses a composite primary key combining `characterId` and `prepKey`:
```prisma
@@id([characterId, prepKey])
```

This ensures that each character can have one spell preparation per preparation key.

#### **Relationships**

**Many-to-One Relationships**:
- **`character`**: Links to the parent `UserCharacter` model
- **`spell`**: Links to the prepared spell via `Spell` model

**One-to-Many Relationships**:
- **`metamagics`**: Links to `SpellPreparationMetamagic` entries defining applied metamagic

**Source File**: `prisma/schema.prisma` (CharacterSpellPreparation model)

## 🔗 **Cross-System Integration Models**

### **CharacterItem Model Integration**
**Database Table**: `CharacterItem`

Enables characters to own customized instances of items with applied properties.

#### **Character-Related Fields**

**Character Item Ownership**:
- **`characterId`**: Foreign key reference to the character owner
- **`name`**: Custom name for the character's item instance
- **`quantity`**: Optional integer for item quantity
- **`baseItemId`**: Foreign key reference to the base item template

#### **Relationships**

**Many-to-One Relationships**:
- **`character`**: Links to the character owner via `UserCharacter` model
- **`baseItem`**: Links to the base item template via `Item` model

**One-to-Many Relationships**:
- **`characterItemProperties`**: Links to `CharacterItemProperty` entries defining applied properties

**Source File**: `prisma/schema.prisma` (CharacterItem model)

### **CharacterItemProperty Model Integration**
**Database Table**: `CharacterItemProperty`

Enables properties to be applied to character equipment, integrating the character system with the equipment system.

#### **Character-Related Fields**

**Property Application**:
- **`characterItemId`**: Foreign key reference to the character item
- **`propertyId`**: Foreign key reference to the applied property

#### **Relationships**

**Many-to-One Relationships**:
- **`characterItem`**: Links to the character item via `CharacterItem` model
- **`property`**: Links to the applied property via `ItemProperty` model

**Source File**: `prisma/schema.prisma` (CharacterItemProperty model)

## 📊 **Data Relationships**

### **Character System Relationships**

**Core Character Relationships**:
```
UserCharacter (1) ←→ (N) UserCharacterAbilityScore
UserCharacter (1) ←→ (N) CharacterAdvancement
UserCharacter (1) ←→ (N) CharacterItem
UserCharacter (1) ←→ (N) CharacterSpellPreparation
```

**Advancement Relationships**:
```
CharacterAdvancement (1) ←→ (N) AdvancementSkill
CharacterAdvancement (1) ←→ (N) AdvancementFeat
CharacterAdvancement (1) ←→ (N) AdvancementSpell
CharacterAdvancement (1) ←→ (N) CharacterFeatureChoice
```

**Equipment Relationships**:
```
CharacterItem (1) ←→ (N) CharacterItemProperty
```

### **Cross-System Integration Relationships**

**Race System Integration**:
```
UserCharacter (N) ←→ (1) Race
```

**Class System Integration**:
```
CharacterAdvancement (N) ←→ (1) Class
CharacterAdvancement (N) ←→ (1) Class (SecondaryClass)
```

**Feat System Integration**:
```
AdvancementFeat (N) ←→ (1) Feat
```

**Feature System Integration**:
```
CharacterFeatureChoice (N) ←→ (1) FeatureProgression
CharacterFeatureChoice (N) ←→ (1) FeatureChoice
```

**Spell System Integration**:
```
AdvancementSpell (N) ←→ (1) Spell
CharacterSpellPreparation (N) ←→ (1) Spell
```

**Equipment System Integration**:
```
CharacterItem (N) ←→ (1) Item
CharacterItemProperty (N) ←→ (1) ItemProperty
```

**User System Integration**:
```
UserCharacter (N) ←→ (1) User
```

## 🔒 **Database Constraints**

### **Primary Key Constraints**

**UserCharacter Model**:
- **`id`**: Auto-incrementing primary key

**UserCharacterAbilityScore Model**:
- **`id`**: Auto-incrementing primary key

**CharacterAdvancement Model**:
- **`id`**: Auto-incrementing primary key

**CharacterFeatureChoice Model**:
- **`id`**: Auto-incrementing primary key

### **Composite Primary Key Constraints**

**AdvancementSkill Model**:
- **Composite Primary Key**: `[advancementId, skillId]` ensures unique skill allocation per advancement

**AdvancementFeat Model**:
- **Composite Primary Key**: `[advancementId, featId]` ensures unique feat selection per advancement

**AdvancementSpell Model**:
- **Composite Primary Key**: `[advancementId, spellId]` ensures unique spell known per advancement

**CharacterSpellPreparation Model**:
- **Composite Primary Key**: `[characterId, prepKey]` ensures unique spell preparation per character

### **Unique Constraints**

**CharacterAdvancement Model**:
- **Composite Unique**: `[characterId, level, version]` ensures proper versioning of advancement records

**CharacterFeatureChoice Model**:
- **Composite Unique**: `[advancementId, progressionId, key]` ensures unique choices per advancement and progression

### **Foreign Key Constraints**

**UserCharacter**:
- **`userId`**: References `User.id` with cascade delete
- **`raceId`**: References `Race.id` with cascade delete

**UserCharacterAbilityScore**:
- **`characterId`**: References `UserCharacter.id` with cascade delete

**CharacterAdvancement**:
- **`characterId`**: References `UserCharacter.id` with cascade delete
- **`classId`**: References `Class.id` with cascade delete
- **`secondaryClassId`**: References `Class.id` with cascade delete (SET NULL on delete)

**AdvancementSkill**:
- **`advancementId`**: References `CharacterAdvancement.id` with cascade delete
- **`skillId`**: References `Skill.id` with cascade delete

**AdvancementFeat**:
- **`advancementId`**: References `CharacterAdvancement.id` with cascade delete
- **`featId`**: References `Feat.id` with cascade delete

**AdvancementSpell**:
- **`advancementId`**: References `CharacterAdvancement.id` with cascade delete
- **`spellId`**: References `Spell.id` with cascade delete

**CharacterFeatureChoice**:
- **`characterId`**: References `UserCharacter.id` with cascade delete
- **`featureChoiceId`**: References `FeatureChoice.id` with cascade delete
- **`progressionId`**: References `FeatureProgression.id` with cascade delete
- **`advancementId`**: References `CharacterAdvancement.id` with cascade delete

**CharacterSpellPreparation**:
- **`characterId`**: References `UserCharacter.id` with cascade delete
- **`spellId`**: References `Spell.id` with cascade delete

### **Data Integrity Constraints**

**Character Ownership**:
- **User Ownership**: Characters must belong to valid users
- **Access Control**: Character access is controlled through user ownership

**Advancement Integrity**:
- **Level Progression**: Advancement levels must be sequential
- **Version Control**: Multiple advancement records per level are properly versioned
- **Choice Uniqueness**: Feature choices must be unique per advancement and progression

**Equipment Integrity**:
- **Item Ownership**: Character items must belong to valid characters
- **Property Application**: Item properties must be applied to valid character items

## 📋 **Data Access Patterns**

### **Common Query Patterns**

**Character Retrieval**:
```sql
-- Get character with all details
SELECT uc.*, uca.*, ca.*, as.*, af.*, asp.*, cfc.*
FROM UserCharacter uc
LEFT JOIN UserCharacterAbilityScore uca ON uc.id = uca.characterId
LEFT JOIN CharacterAdvancement ca ON uc.id = ca.characterId
LEFT JOIN AdvancementSkill as ON ca.id = as.advancementId
LEFT JOIN AdvancementFeat af ON ca.id = af.advancementId
LEFT JOIN AdvancementSpell asp ON ca.id = asp.advancementId
LEFT JOIN CharacterFeatureChoice cfc ON ca.id = cfc.advancementId
WHERE uc.id = ?
ORDER BY ca.level, ca.version;
```

**Character List**:
```sql
-- Get all characters for a user
SELECT uc.*, r.name as raceName
FROM UserCharacter uc
JOIN Race r ON uc.raceId = r.id
WHERE uc.userId = ?
ORDER BY uc.name;
```

**Advancement Tracking**:
```sql
-- Get character advancement by level
SELECT ca.*, c.name as className
FROM CharacterAdvancement ca
JOIN Class c ON ca.classId = c.id
WHERE ca.characterId = ?
ORDER BY ca.level, ca.version;
```

### **Performance Considerations**

**Indexing Strategy**:
- **Primary Keys**: All primary keys are automatically indexed
- **Foreign Keys**: All foreign key relationships are indexed for efficient joins
- **Composite Indexes**: Composite primary keys provide efficient ordering queries
- **User Queries**: Indexed on `userId` for efficient character list queries

**Query Optimization**:
- **Eager Loading**: Relationships loaded with characters for efficient display
- **Ordering**: Index-based ordering for consistent advancement display
- **Filtering**: Efficient filtering by user ownership and character attributes

## 🔗 **Cross-System Integration**

### **Race System Integration**

The character system integrates with the race system through character creation:

**Integration Points**:
- **Race Selection**: Characters select races during creation
- **Racial Abilities**: Race features are applied through the feature system
- **Racial Bonuses**: Ability score bonuses and other racial traits are calculated

**Source Files**:
- Database: `prisma/schema.prisma` (UserCharacter.raceId relationship)
- Backend: `backend/src/features/character/` (race integration services)
- Frontend: `frontend/src/features/character/tabs/` (race selection UI)

### **Class System Integration**

The character system integrates with the class system through character advancement:

**Integration Points**:
- **Class Selection**: Characters select classes during advancement
- **Class Features**: Class features are applied through the feature system
- **Multiclassing**: Support for multiple classes per character

**Source Files**:
- Database: `prisma/schema.prisma` (CharacterAdvancement.classId relationship)
- Backend: `backend/src/features/character/` (class integration services)
- Frontend: `frontend/src/features/character/tabs/` (class selection UI)

### **Feat System Integration**

The character system integrates with the feat system through character advancement:

**Integration Points**:
- **Feat Selection**: Characters select feats during advancement
- **Prerequisite Validation**: Automatic validation of feat prerequisites
- **Feat Benefits**: Feat benefits are applied to character statistics

**Source Files**:
- Database: `prisma/schema.prisma` (AdvancementFeat relationship)
- Backend: `backend/src/features/character/` (feat integration services)
- Frontend: `frontend/src/features/character/tabs/` (feat selection UI)

### **Feature System Integration**

The character system integrates with the feature system through character choices:

**Integration Points**:
- **Feature Choices**: Characters make choices for features during advancement
- **Feature Application**: Features are applied to characters through the feature system
- **Choice Tracking**: All player choices are persisted and tracked

**Source Files**:
- Database: `prisma/schema.prisma` (CharacterFeatureChoice relationship)
- Backend: `backend/src/features/character/` (feature integration services)
- Frontend: `frontend/src/features/character/tabs/` (feature choice UI)

### **Equipment System Integration**

The character system integrates with the equipment system through character items:

**Integration Points**:
- **Equipment Ownership**: Characters own customized instances of items
- **Property Application**: Item properties are applied to character equipment
- **Equipment Management**: Character equipment is tracked and managed

**Source Files**:
- Database: `prisma/schema.prisma` (CharacterItem relationship)
- Backend: `backend/src/features/character/` (equipment integration services)
- Frontend: `frontend/src/features/character/tabs/` (equipment management UI)

### **Spell System Integration**

The character system integrates with the spell system through spell preparation:

**Integration Points**:
- **Spell Preparation**: Characters prepare spells for casting
- **Metamagic Integration**: Metamagic feats are applied to prepared spells
- **Spellcasting Progression**: Class spellcasting progression is tracked

**Source Files**:
- Database: `prisma/schema.prisma` (CharacterSpellPreparation relationship)
- Backend: `backend/src/features/character/` (spell integration services)
- Frontend: `frontend/src/features/character/tabs/` (spell management UI)

## 📚 **Related Documentation**

### **System Documentation**
- **[Validation Schemas](validation-schemas.md)** — Zod validation rules
- **[Backend Implementation](backend-implementation.md)** — Backend services and API
- **[Frontend Components](frontend-components.md)** — Frontend React components

### **Application Overview**
- **[Database Schema Patterns](../application-overview/database-schema.md)** — Shared database patterns
- **[Identity and Audit Fields](../application-overview/database-schema.md#identity-and-audit-fields)** — Standard field patterns
- **[Source Attribution Pattern](../application-overview/database-schema.md#source-attribution-pattern)** — Source tracking patterns

### **Cross-System Integration**
- **[Race System Database](../race-system/database-schema.md)** — Race system database integration
- **[Class System Database](../class-system/database-schema.md)** — Class system database integration
- **[Feat System Database](../feat-system/database-schema.md)** — Feat system database integration
- **[Feature System Database](../feature-system/database-schema.md)** — Feature system database integration
- **[Equipment System Database](../equipment-system/database-schema.md)** — Equipment system database integration
- **[Spell System Database](../spell-system/database-schema.md)** — Spell system database integration

## Summary

The character management database schema provides a comprehensive foundation for character creation, advancement, and data persistence. The schema supports complex character progression, multiclassing, choice tracking, and seamless integration with all other game systems.

The implementation follows established database patterns and provides efficient data access patterns for all character-related operations, ensuring data integrity and performance across the application.

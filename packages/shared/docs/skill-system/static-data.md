# Skill System Static Data

*Complete documentation for the skill system static data, including types and reference data structures.*

## 📋 **Overview**

The skill system static data provides types and utility functions that define the behavior and capabilities of the skill system. This includes skill retry types and various utility functions for skill calculations and management.

The static data layer serves as the foundation for type safety, validation, and consistent behavior across the skill system. It defines the vocabulary and rules that govern how skills interact with characters and other game systems.

**Note**: Skill definitions and identification are now fully database-driven. The `Skill` enum has been removed, and all skill lookups are performed through the database and skills-cache API.

**Migration to Database-Driven Approach**: The skill system has been fully migrated from static data maps to a database-driven approach. Skill subtypes (Craft and Knowledge) are now stored in the database via the `SkillSubtype` model, and special skill behaviors (subtypes, custom subtypes, no max ranks, double armor penalty) are now indicated via database flags rather than hardcoded comparisons. All skill identification and lookups are performed through the database and skills-cache API.

**Source File**: `packages/shared/static-data/src/SkillData.ts`

## 🏗️ **Core Types and Data Structures**

### **Skill Definitions**

Skills are now fully database-driven. This section describes the skill categories and their characteristics as stored in the database.

**Purpose**: Documents the available skills in the game system, including their key abilities, training requirements, and special characteristics. All skill data is accessed through the database and skills-cache API.

**Skill Categories**:

**Physical Skills**: Skills based on physical abilities
- **`Climb`**: Strength-based climbing skill
- **`Jump`**: Strength-based jumping skill
- **`Swim`**: Strength-based swimming skill (has double armor check penalty, indicated by `doubleArmorPenalty` database flag)
- **`Balance`**: Dexterity-based balance skill
- **`Escape Artist`**: Dexterity-based escape skill
- **`Hide`**: Dexterity-based hiding skill
- **`Move Silently`**: Dexterity-based stealth skill
- **`Open Lock`**: Dexterity-based lockpicking skill
- **`Ride`**: Dexterity-based riding skill
- **`Sleight of Hand`**: Dexterity-based sleight of hand skill
- **`Tumble`**: Dexterity-based tumbling skill
- **`Use Rope`**: Dexterity-based rope use skill

**Mental Skills**: Skills based on mental abilities
- **`Appraise`**: Intelligence-based appraisal skill
- **`Craft`**: Intelligence-based crafting skill (has predefined subtypes, indicated by `hasSubtypes` database flag)
- **`Decipher Script`**: Intelligence-based script deciphering skill
- **`Disable Device`**: Intelligence-based device disabling skill
- **`Forgery`**: Intelligence-based forgery skill
- **`Search`**: Intelligence-based search skill
- **`Spellcraft`**: Intelligence-based spellcraft skill
- **`Concentration`**: Constitution-based concentration skill
- **`Heal`**: Wisdom-based healing skill
- **`Listen`**: Wisdom-based listening skill
- **`Profession`**: Wisdom-based profession skill (uses custom subtypes, indicated by `usesCustomSubtype` database flag)
- **`Sense Motive`**: Wisdom-based sense motive skill
- **`Spot`**: Wisdom-based spot skill
- **`Survival`**: Wisdom-based survival skill

**Social Skills**: Skills based on social abilities
- **`Bluff`**: Charisma-based bluffing skill
- **`Diplomacy`**: Charisma-based diplomacy skill
- **`Disguise`**: Charisma-based disguise skill
- **`Gather Information`**: Charisma-based information gathering skill
- **`Handle Animal`**: Charisma-based animal handling skill
- **`Intimidate`**: Charisma-based intimidation skill
- **`Perform`**: Charisma-based performance skill (uses custom subtypes, indicated by `usesCustomSubtype` database flag)
- **`Use Magic Device`**: Charisma-based magic device use skill

**Knowledge Skills**: Intelligence-based knowledge skills
- **`Knowledge`**: Intelligence-based knowledge skill (has predefined subtypes, indicated by `hasSubtypes` database flag)
  - Knowledge subtypes include: Arcana, Architecture and Engineering, Dungeoneering, Geography, History, Local, Nature, Nobility and Royalty, Religion, The Planes

**Special Skills**: Unique skills with special characteristics
- **`Speak Language`**: Special skill for learning languages (has no maximum rank limit, indicated by `hasNoMaxRanks` database flag)
- **`Wild Empathy`**: Special analog skill for wild empathy (indicated by `isAnalog` database flag)

**Usage**: Skills are identified by their database IDs and accessed through the skills-cache API. All skill lookups, subtype identification, and special behavior checks use database flags (`hasSubtypes`, `usesCustomSubtype`, `hasNoMaxRanks`, `doubleArmorPenalty`) accessed via the skills-cache and frontend utility functions.

**Source File**: `packages/shared/static-data/src/SkillData.ts` (SKILL_RETRY_TYPE_MAP definition)

### **Skill Retry Types**

Defines the retry types for skills, affecting how skills can be retried after failure.

**Purpose**: Identifies the retry types for skills, affecting skill check mechanics and retry rules.

**Values**:
- **`No` (0)**: Skill cannot be retried
- **`Yes` (1)**: Skill can be retried normally
- **`Special` (2)**: Skill has special retry rules

**Usage**: Used in skill definitions to determine retry mechanics.

**Source File**: `packages/shared/static-data/src/SkillData.ts` (SKILL_RETRY_TYPE_MAP definition)

## 🔧 **Skill Data Structures**

### **Database-Driven Skill Data**

Skill data is now primarily accessed through the database and cached via the skills-cache API endpoint.

**Purpose**: Provides dynamic, database-driven skill data including subtypes and special behavior flags.

**Key Data Sources**:

**Skills-Cache API**: Lightweight skill data endpoint
- **Purpose**: Provides skill data optimized for frontend use
- **Includes**: Skill flags (`hasSubtypes`, `usesCustomSubtype`, `hasNoMaxRanks`, `doubleArmorPenalty`) and subtype arrays
- **Usage**: Used by frontend utility functions in `frontend/src/lib/skill-utils.ts`

**Frontend Utility Functions**: Helper functions for skill type checks
- **Purpose**: Provides type-safe functions for checking skill characteristics
- **Functions**: `hasSubtypes()`, `usesCustomSubtype()`, `hasNoMaxRanks()`, `hasDoubleArmorPenalty()`, `getSkillSubtypes()`
- **Usage**: Replaces hardcoded skill ID comparisons throughout the frontend

**Source Files**: 
- Backend: `apps/backend/src/features/skill/skillService.ts` (getSkillCache method)
- Frontend: `apps/frontend/src/lib/skill-utils.ts` (utility functions)

## 🎯 **Skill Calculations**

### **Skill Ability Integration**

The skill ability integration system for determining skill key abilities.

**Purpose**: Calculate and validate skill key abilities for skill checks and calculations.

**Calculation Pattern**:
- **Skill Lookup**: Look up skill by ID from skills-cache
- **Ability Reference**: Extract key ability ID from skill definition
- **Ability Validation**: Validate ability ID against ability system
- **Ability Calculation**: Use ability modifier in skill calculations

**Example**: Climb skill has ability ID 1 (Strength), so climb checks use Strength modifier

**Source File**: Skills are accessed via the skills-cache API (`apps/backend/src/features/skill/skillService.ts`)

### **Skill Training Requirements**

The skill training requirement system for determining skill access.

**Purpose**: Calculate and validate skill training requirements for character skill access.

**Calculation Pattern**:
- **Skill Lookup**: Look up skill by ID from skills-cache
- **Training Check**: Check trained only flag from skill definition
- **Access Validation**: Validate character access based on training requirement
- **Rank Calculation**: Calculate skill ranks based on training requirement

**Example**: Decipher Script skill has trained only true, so untrained characters cannot use it

**Source File**: Skills are accessed via the skills-cache API (`apps/backend/src/features/skill/skillService.ts`)

## 🔗 **Integration with Other Systems**

### **Ability System Integration**

The skill system integrates with the ability system through key abilities:

**Key Ability**: Each skill has a key ability that determines the ability modifier used
**Ability Validation**: Skill ability IDs are validated against ability system
**Ability Display**: Skills display their key ability information
**Ability Calculation**: Skill checks use ability modifiers for calculations

**Integration Pattern**: The skill system integrates with the ability system to determine skill key abilities, ensuring proper ability modifier usage in skill calculations.

**Related Documentation**: [Ability System Static Data](../ability-system/static-data.md)

### **Character System Integration**

The skill system provides the foundation for character skill management:

**Character Skills**: Characters can have skill ranks and bonuses
**Skill Progression**: Character skill progression follows class and level rules
**Skill Checks**: Characters make skill checks using their skill ranks and ability modifiers
**Skill Synergies**: Skills can provide bonuses to other skills

**Integration Pattern**: The skill system provides the framework for character skill management, with character classes and levels determining skill access and progression.

**Related Documentation**: [Character Management Static Data](../character-management/static-data.md)

### **Feature System Integration**

The skill system integrates with the feature system for skill-related features:

**Skill Bonuses**: Features can provide skill bonuses and modifiers
**Skill Synergies**: Features can provide skill synergy bonuses
**Skill Proficiencies**: Features can grant skill proficiencies
**Skill Specializations**: Features can provide skill specializations

**Integration Pattern**: The skill system integrates with the feature system to handle skill-related features, ensuring proper skill bonus and modifier calculations.

**Related Documentation**: [Feature System Static Data](../feature-system/static-data.md)

## 🔧 **Performance Considerations**

### **Data Access Patterns**

The skill system uses a database-driven approach with frontend caching:

**Database Storage**: Skill subtypes and flags are stored in the database
**Frontend Caching**: Skills-cache API provides lightweight, cached skill data
**React Query**: Frontend uses React Query for efficient cache management
**Utility Functions**: Centralized utility functions minimize redundant lookups

### **Migration Benefits**

The migration from static data to database-driven approach provides:

**Dynamic Updates**: Skill subtypes can be updated without code changes
**Consistency**: Single source of truth in the database
**Extensibility**: Easy to add new subtypes or special behaviors
**Maintainability**: Reduced hardcoded logic and improved code clarity

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Skill system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Skill system validation rules and schemas
- **[Backend Implementation](backend-implementation.md)** - Skill system backend implementation
- **[Frontend Components](frontend-components.md)** - Skill system frontend implementation
- **[Ability System Static Data](../ability-system/static-data.md)** - Ability system enums and types
- **[Character Management Static Data](../character-management/static-data.md)** - Character system enums and types
- **[Feature System Static Data](../feature-system/static-data.md)** - Feature system enums and types
- **[Static Data Patterns](../application-overview/static-data.md)** - Shared static data patterns and conventions

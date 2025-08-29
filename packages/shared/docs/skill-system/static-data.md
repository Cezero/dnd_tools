# Skill System Static Data

*Complete documentation for the skill system static data, including enums, types, and reference data structures.*

## 📋 **Overview**

The skill system static data provides enums, types, and utility functions that define the behavior and capabilities of the skill system. This includes skill definitions, retry types, and various utility functions for skill calculations and management.

The static data layer serves as the foundation for type safety, validation, and consistent behavior across the skill system. It defines the vocabulary and rules that govern how skills interact with characters and other game systems.

**Source File**: `packages/shared/static-data/src/SkillData.ts`

## 🏗️ **Core Enums and Types**

### **Skill Definitions**

Defines all available skills with their key abilities, training requirements, and characteristics.

**Purpose**: Identifies all available skills in the game system, including their key abilities, training requirements, and special characteristics.

**Skill Categories**:

**Physical Skills**: Skills based on physical abilities
- **`Climb` (4)**: Strength-based climbing skill
- **`Jump` (18)**: Strength-based jumping skill
- **`Swim` (42)**: Strength-based swimming skill
- **`Balance` (2)**: Dexterity-based balance skill
- **`Escape Artist` (11)**: Dexterity-based escape skill
- **`Hide` (16)**: Dexterity-based hiding skill
- **`Move Silently` (30)**: Dexterity-based stealth skill
- **`Open Lock` (31)**: Dexterity-based lockpicking skill
- **`Ride` (34)**: Dexterity-based riding skill
- **`Sleight of Hand` (37)**: Dexterity-based sleight of hand skill
- **`Tumble` (43)**: Dexterity-based tumbling skill
- **`Use Rope` (45)**: Dexterity-based rope use skill

**Mental Skills**: Skills based on mental abilities
- **`Appraise` (1)**: Intelligence-based appraisal skill
- **`Craft` (6)**: Intelligence-based crafting skill
- **`Decipher Script` (7)**: Intelligence-based script deciphering skill
- **`Disable Device` (9)**: Intelligence-based device disabling skill
- **`Forgery` (12)**: Intelligence-based forgery skill
- **`Search` (35)**: Intelligence-based search skill
- **`Spellcraft` (39)**: Intelligence-based spellcraft skill
- **`Concentration` (5)**: Constitution-based concentration skill
- **`Heal` (15)**: Wisdom-based healing skill
- **`Listen` (29)**: Wisdom-based listening skill
- **`Profession` (33)**: Wisdom-based profession skill
- **`Sense Motive` (36)**: Wisdom-based sense motive skill
- **`Spot` (40)**: Wisdom-based spot skill
- **`Survival` (41)**: Wisdom-based survival skill

**Social Skills**: Skills based on social abilities
- **`Bluff` (3)**: Charisma-based bluffing skill
- **`Diplomacy` (8)**: Charisma-based diplomacy skill
- **`Disguise` (10)**: Charisma-based disguise skill
- **`Gather Information` (13)**: Charisma-based information gathering skill
- **`Handle Animal` (14)**: Charisma-based animal handling skill
- **`Intimidate` (17)**: Charisma-based intimidation skill
- **`Perform` (32)**: Charisma-based performance skill
- **`Use Magic Device` (44)**: Charisma-based magic device use skill

**Knowledge Skills**: Intelligence-based knowledge skills
- **`Knowledge (arcana)` (19)**: Knowledge of magic and arcane lore
- **`Knowledge (architecture and engineering)` (20)**: Knowledge of architecture and engineering
- **`Knowledge (dungeoneering)` (21)**: Knowledge of dungeons and underground environments
- **`Knowledge (geography)` (22)**: Knowledge of geography and lands
- **`Knowledge (history)` (23)**: Knowledge of history and past events
- **`Knowledge (local)` (24)**: Knowledge of local areas and customs
- **`Knowledge (nature)` (25)**: Knowledge of nature and natural environments
- **`Knowledge (nobility and royalty)` (26)**: Knowledge of nobility and royal customs
- **`Knowledge (religion)` (27)**: Knowledge of religion and divine lore
- **`Knowledge (the planes)` (28)**: Knowledge of other planes of existence

**Special Skills**: Unique skills with special characteristics
- **`Speak Language` (38)**: Special skill for learning languages
- **`Wild Empathy` (46)**: Special analog skill for wild empathy

**Usage**: Used throughout the application for skill references, calculations, and display.

**Source File**: `packages/shared/static-data/src/SkillData.ts` (SKILL_MAP definition)

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

### **SkillMap**

The primary data structure containing all skill definitions with their characteristics.

**Purpose**: Provides a comprehensive map of all available skills with their defining characteristics.

**Structure**:
- **Skill ID**: Unique identifier for each skill
- **Name**: Human-readable skill name
- **Ability ID**: Reference to the key ability for the skill
- **Trained Only**: Boolean flag for training requirement
- **Is Analog**: Boolean flag for analog skill type

**Usage**: Primary reference for skill data throughout the application.

**Source File**: `packages/shared/static-data/src/SkillData.ts` (SKILL_MAP definition)

### **Skill Lists**

Utility lists derived from the skill map for different use cases.

**Purpose**: Provides filtered and formatted skill lists for different application needs.

**Key Lists**:

**SKILL_LIST**: Complete list of all skills
- **Purpose**: Provides complete list of all available skills
- **Usage**: Used for skill selection and display

**FULL_SKILL_SELECT_LIST**: Complete skill list for selection components
- **Purpose**: Provides skill list formatted for selection components
- **Usage**: Used in skill selection dropdowns and lists

**SKILL_SELECT_LIST**: Standard skill list (excluding analog skills)
- **Purpose**: Provides skill list excluding analog skills
- **Usage**: Used in standard skill selection interfaces

**Source File**: `packages/shared/static-data/src/SkillData.ts` (Skill list definitions)

## 🎯 **Skill Calculations**

### **Skill Ability Integration**

The skill ability integration system for determining skill key abilities.

**Purpose**: Calculate and validate skill key abilities for skill checks and calculations.

**Calculation Pattern**:
- **Skill Lookup**: Look up skill by ID in skill map
- **Ability Reference**: Extract key ability ID from skill definition
- **Ability Validation**: Validate ability ID against ability system
- **Ability Calculation**: Use ability modifier in skill calculations

**Example**: Skill ID 4 (Climb) has ability ID 1 (Strength), so climb checks use Strength modifier

**Source File**: `packages/shared/static-data/src/SkillData.ts` (Skill ability integration)

### **Skill Training Requirements**

The skill training requirement system for determining skill access.

**Purpose**: Calculate and validate skill training requirements for character skill access.

**Calculation Pattern**:
- **Skill Lookup**: Look up skill by ID in skill map
- **Training Check**: Check trained only flag from skill definition
- **Access Validation**: Validate character access based on training requirement
- **Rank Calculation**: Calculate skill ranks based on training requirement

**Example**: Skill ID 7 (Decipher Script) has trained only true, so untrained characters cannot use it

**Source File**: `packages/shared/static-data/src/SkillData.ts` (Skill training requirements)

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

The skill system static data is optimized for efficient access:

**Map-based Access**: Direct access to skill data by ID
**Cached Lookups**: Frequently accessed data is cached for performance
**Lazy Loading**: Data is loaded only when needed
**Memory Management**: Efficient memory usage for large datasets

### **Calculation Optimization**

Skill calculations are optimized for performance:

**Pre-calculated Values**: Common calculations are pre-computed
**Formula Caching**: Formula results are cached to avoid recalculation
**Efficient Algorithms**: Optimized algorithms for skill calculations
**Batch Processing**: Multiple calculations are processed in batches

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Skill system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Skill system validation rules and schemas
- **[Backend Implementation](backend-implementation.md)** - Skill system backend implementation
- **[Frontend Components](frontend-components.md)** - Skill system frontend implementation
- **[Ability System Static Data](../ability-system/static-data.md)** - Ability system enums and types
- **[Character Management Static Data](../character-management/static-data.md)** - Character system enums and types
- **[Feature System Static Data](../feature-system/static-data.md)** - Feature system enums and types
- **[Static Data Patterns](../application-overview/static-data.md)** - Shared static data patterns and conventions

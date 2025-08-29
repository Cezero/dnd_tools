# Character Management Static Data

*Complete documentation for the character management static data, including enums, maps, and reference data structures.*

## 📋 **Overview**

The character management static data provides essential reference data structures, enums, and constants that support character creation, advancement, and management throughout the application. This data defines the foundational elements that characters are built upon.

**Source Files**:
- **Ability Scores**: `shared/static-data/src/AbilityScoreData.ts`
- **Alignments**: `shared/static-data/src/AlignmentData.ts`
- **Character Types**: `shared/static-data/src/CharacterTypeData.ts`
- **Progression Types**: `shared/static-data/src/ProgressionTypeData.ts`

## 🏗️ **Static Data Architecture**

The character management static data follows the shared **Static Data Patterns** documented in [Static Data Overview](../application-overview/static-data.md).

### **Data Structure**

**Enums**: Type-safe enumeration values for character attributes
**Maps**: Key-value mappings for complex data relationships
**Constants**: Fixed values used throughout the character system
**Reference Data**: Lookup tables for character creation and validation

### **Data Patterns**

**Type Safety**: Comprehensive TypeScript type definitions
**Immutability**: All static data is read-only and immutable
**Validation**: Data structures include validation rules
**Cross-Reference**: Data references other system static data

## 🔧 **Core Static Data Structures**

### **AbilityScoreType**

Defines the six core ability scores used in character creation and advancement.

**Purpose**: Provides the foundational ability score types that all characters possess.

**Values**:
- **`STRENGTH`**: Physical power and athletic training
- **`DEXTERITY`**: Agility, reflexes, balance, and grace
- **`CONSTITUTION`**: Health, stamina, and vital force
- **`INTELLIGENCE`**: Mental acuity, accuracy of recall, and analytical skill
- **`WISDOM`**: Awareness of surroundings and insight
- **`CHARISMA`**: Ability to interact effectively with others

**Source File**: `shared/static-data/src/AbilityScoreData.ts`

```typescript
export enum AbilityScoreType {
    STRENGTH = 1,
    DEXTERITY = 2,
    CONSTITUTION = 3,
    INTELLIGENCE = 4,
    WISDOM = 5,
    CHARISMA = 6,
}
```

**Usage Examples**:
```typescript
// Character ability score assignment
const characterAbilityScores = {
    [AbilityScoreType.STRENGTH]: 16,
    [AbilityScoreType.DEXTERITY]: 14,
    [AbilityScoreType.CONSTITUTION]: 12,
    [AbilityScoreType.INTELLIGENCE]: 10,
    [AbilityScoreType.WISDOM]: 8,
    [AbilityScoreType.CHARISMA]: 6,
};

// Ability modifier calculation
const getAbilityModifier = (score: number): number => Math.floor((score - 10) / 2);
```

### **AlignmentType**

Defines the nine alignment types used for character moral and ethical orientation.

**Purpose**: Provides the alignment system that defines character personality and behavior.

**Values**:
- **`LAWFUL_GOOD`**: Order and good, structured altruism
- **`NEUTRAL_GOOD`**: Good without strong commitment to order
- **`CHAOTIC_GOOD`**: Good with personal freedom emphasis
- **`LAWFUL_NEUTRAL`**: Order and structure without moral bias
- **`TRUE_NEUTRAL`**: Balance between order and chaos, good and evil
- **`CHAOTIC_NEUTRAL`**: Personal freedom without moral bias
- **`LAWFUL_EVIL`**: Order and structure for selfish ends
- **`NEUTRAL_EVIL`**: Selfishness without commitment to order
- **`CHAOTIC_EVIL`**: Personal freedom for destructive ends

**Source File**: `shared/static-data/src/AlignmentData.ts`

```typescript
export enum AlignmentType {
    LAWFUL_GOOD = 1,
    NEUTRAL_GOOD = 2,
    CHAOTIC_GOOD = 3,
    LAWFUL_NEUTRAL = 4,
    TRUE_NEUTRAL = 5,
    CHAOTIC_NEUTRAL = 6,
    LAWFUL_EVIL = 7,
    NEUTRAL_EVIL = 8,
    CHAOTIC_EVIL = 9,
}
```

**Usage Examples**:
```typescript
// Character alignment assignment
const characterAlignment = AlignmentType.LAWFUL_GOOD;

// Alignment-based feature restrictions
const canUsePaladinFeatures = (alignment: AlignmentType): boolean => {
    return alignment === AlignmentType.LAWFUL_GOOD;
};
```

### **CharacterType**

Defines the types of characters that can be created in the system.

**Purpose**: Provides character type classifications for different character categories.

**Values**:
- **`PLAYER_CHARACTER`**: Characters controlled by players
- **`NON_PLAYER_CHARACTER`**: Characters controlled by the game master
- **`COMPANION`**: Animal companions, familiars, or mounts
- **`MONSTER`**: Hostile creatures and enemies

**Source File**: `shared/static-data/src/CharacterTypeData.ts`

```typescript
export enum CharacterType {
    PLAYER_CHARACTER = 1,
    NON_PLAYER_CHARACTER = 2,
    COMPANION = 3,
    MONSTER = 4,
}
```

**Usage Examples**:
```typescript
// Character type validation
const isValidPlayerCharacter = (characterType: CharacterType): boolean => {
    return characterType === CharacterType.PLAYER_CHARACTER;
};

// Type-specific feature access
const canUsePlayerFeatures = (characterType: CharacterType): boolean => {
    return characterType === CharacterType.PLAYER_CHARACTER;
};
```

### **ProgressionType**

Defines the types of character progression and advancement.

**Purpose**: Provides progression type classifications for different advancement methods.

**Values**:
- **`STANDARD`**: Standard character progression
- **`GESTALT`**: Gestalt character progression (dual class advancement)
- **`EPIC`**: Epic level progression (beyond level 20)
- **`MYTHIC`**: Mythic character progression

**Source File**: `shared/static-data/src/ProgressionTypeData.ts`

```typescript
export enum ProgressionType {
    STANDARD = 1,
    GESTALT = 2,
    EPIC = 3,
    MYTHIC = 4,
}
```

**Usage Examples**:
```typescript
// Progression type validation
const isValidProgressionType = (progressionType: ProgressionType): boolean => {
    return Object.values(ProgressionType).includes(progressionType);
};

// Type-specific advancement rules
const getAdvancementRules = (progressionType: ProgressionType) => {
    switch (progressionType) {
        case ProgressionType.STANDARD:
            return standardAdvancementRules;
        case ProgressionType.GESTALT:
            return gestaltAdvancementRules;
        case ProgressionType.EPIC:
            return epicAdvancementRules;
        case ProgressionType.MYTHIC:
            return mythicAdvancementRules;
        default:
            return standardAdvancementRules;
    }
};
```

## 📊 **Reference Data Maps**

### **AbilityScoreMap**

Provides comprehensive information about each ability score type.

**Purpose**: Maps ability score types to their detailed information and characteristics.

**Structure**:
```typescript
interface AbilityScoreInfo {
    id: AbilityScoreType;
    name: string;
    abbreviation: string;
    description: string;
    keySkills: string[];
    commonUses: string[];
}
```

**Source File**: `shared/static-data/src/AbilityScoreData.ts`

```typescript
export const AbilityScoreMap: Record<AbilityScoreType, AbilityScoreInfo> = {
    [AbilityScoreType.STRENGTH]: {
        id: AbilityScoreType.STRENGTH,
        name: 'Strength',
        abbreviation: 'Str',
        description: 'Physical power and athletic training',
        keySkills: ['Climb', 'Jump', 'Swim'],
        commonUses: ['Melee attack rolls', 'Damage rolls', 'Carrying capacity'],
    },
    [AbilityScoreType.DEXTERITY]: {
        id: AbilityScoreType.DEXTERITY,
        name: 'Dexterity',
        abbreviation: 'Dex',
        description: 'Agility, reflexes, balance, and grace',
        keySkills: ['Balance', 'Escape Artist', 'Hide', 'Move Silently', 'Open Lock', 'Ride', 'Sleight of Hand', 'Tumble', 'Use Rope'],
        commonUses: ['Ranged attack rolls', 'Armor Class', 'Reflex saves', 'Initiative'],
    },
    // ... additional ability scores
};
```

**Usage Examples**:
```typescript
// Get ability score information
const strengthInfo = AbilityScoreMap[AbilityScoreType.STRENGTH];

// Get all ability score names
const abilityScoreNames = Object.values(AbilityScoreMap).map(info => info.name);

// Get skills for an ability score
const dexteritySkills = AbilityScoreMap[AbilityScoreType.DEXTERITY].keySkills;
```

### **AlignmentMap**

Provides comprehensive information about each alignment type.

**Purpose**: Maps alignment types to their detailed descriptions and characteristics.

**Structure**:
```typescript
interface AlignmentInfo {
    id: AlignmentType;
    name: string;
    description: string;
    characteristics: string[];
    restrictions: string[];
}
```

**Source File**: `shared/static-data/src/AlignmentData.ts`

```typescript
export const AlignmentMap: Record<AlignmentType, AlignmentInfo> = {
    [AlignmentType.LAWFUL_GOOD]: {
        id: AlignmentType.LAWFUL_GOOD,
        name: 'Lawful Good',
        description: 'Order and good, structured altruism',
        characteristics: ['Honorable', 'Compassionate', 'Reliable', 'Organized'],
        restrictions: ['Cannot commit evil acts', 'Must follow lawful authority'],
    },
    [AlignmentType.NEUTRAL_GOOD]: {
        id: AlignmentType.NEUTRAL_GOOD,
        name: 'Neutral Good',
        description: 'Good without strong commitment to order',
        characteristics: ['Kind', 'Generous', 'Helpful', 'Unpredictable'],
        restrictions: ['Cannot commit evil acts'],
    },
    // ... additional alignments
};
```

**Usage Examples**:
```typescript
// Get alignment information
const lawfulGoodInfo = AlignmentMap[AlignmentType.LAWFUL_GOOD];

// Get all alignment names
const alignmentNames = Object.values(AlignmentMap).map(info => info.name);

// Check alignment restrictions
const canCommitEvilAct = (alignment: AlignmentType): boolean => {
    return !AlignmentMap[alignment].restrictions.includes('Cannot commit evil acts');
};
```

## 🎯 **Character Creation Constants**

### **Character Creation Limits**

Defines the limits and constraints for character creation.

**Purpose**: Provides validation constants for character creation processes.

**Source File**: `shared/static-data/src/CharacterConstants.ts`

```typescript
export const CHARACTER_CREATION_LIMITS = {
    // Name constraints
    MIN_NAME_LENGTH: 1,
    MAX_NAME_LENGTH: 100,
    
    // Age constraints
    MIN_AGE: 0,
    MAX_AGE: 1000,
    
    // Physical constraints
    MIN_HEIGHT: 1,
    MAX_HEIGHT: 1000,
    MIN_WEIGHT: 1,
    MAX_WEIGHT: 10000,
    
    // Text field constraints
    MAX_EYES_LENGTH: 50,
    MAX_HAIR_LENGTH: 50,
    MAX_GENDER_LENGTH: 20,
    MAX_NOTES_LENGTH: 1000,
    
    // Ability score constraints
    MIN_ABILITY_SCORE: 1,
    MAX_ABILITY_SCORE: 50,
    
    // Experience constraints
    MIN_XP: 0,
    MAX_XP: 999999999,
} as const;
```

**Usage Examples**:
```typescript
// Validate character name
const isValidCharacterName = (name: string): boolean => {
    return name.length >= CHARACTER_CREATION_LIMITS.MIN_NAME_LENGTH &&
           name.length <= CHARACTER_CREATION_LIMITS.MAX_NAME_LENGTH;
};

// Validate ability score
const isValidAbilityScore = (score: number): boolean => {
    return score >= CHARACTER_CREATION_LIMITS.MIN_ABILITY_SCORE &&
           score <= CHARACTER_CREATION_LIMITS.MAX_ABILITY_SCORE;
};
```

### **Character Advancement Constants**

Defines the constants for character advancement and leveling.

**Purpose**: Provides progression constants for character advancement processes.

**Source File**: `shared/static-data/src/CharacterConstants.ts`

```typescript
export const CHARACTER_ADVANCEMENT_CONSTANTS = {
    // Level constraints
    MIN_LEVEL: 1,
    MAX_LEVEL: 20,
    EPIC_LEVEL_START: 21,
    MAX_EPIC_LEVEL: 100,
    
    // Hit point constraints
    MIN_HIT_POINTS: 0,
    MAX_HIT_POINTS: 9999,
    
    // Advancement constraints
    MIN_VERSION: 1,
    MAX_VERSION: 999,
    
    // Experience point requirements (simplified)
    XP_REQUIREMENTS: {
        1: 0,
        2: 1000,
        3: 3000,
        4: 6000,
        5: 10000,
        // ... additional levels
    },
} as const;
```

**Usage Examples**:
```typescript
// Check if level is valid
const isValidLevel = (level: number): boolean => {
    return level >= CHARACTER_ADVANCEMENT_CONSTANTS.MIN_LEVEL &&
           level <= CHARACTER_ADVANCEMENT_CONSTANTS.MAX_LEVEL;
};

// Get XP required for level
const getXPRequired = (level: number): number => {
    return CHARACTER_ADVANCEMENT_CONSTANTS.XP_REQUIREMENTS[level] || 0;
};
```

## 🔗 **Cross-System Integration**

### **Race System Integration**

The character management static data integrates with the race system for character creation.

**Integration Points**:
- **Race Types**: References race types from race system static data
- **Race Bonuses**: Integrates with race ability score bonuses
- **Race Features**: References race-specific features and traits

**Source Files**:
- **Character Data**: `shared/static-data/src/CharacterTypeData.ts`
- **Race Data**: `shared/static-data/src/RaceData.ts`

### **Class System Integration**

The character management static data integrates with the class system for character advancement.

**Integration Points**:
- **Class Types**: References class types from class system static data
- **Class Features**: Integrates with class-specific features and abilities
- **Multiclassing**: Supports multiclassing rules and restrictions

**Source Files**:
- **Character Data**: `shared/static-data/src/ProgressionTypeData.ts`
- **Class Data**: `shared/static-data/src/ClassData.ts`

### **Feat System Integration**

The character management static data integrates with the feat system for character customization.

**Integration Points**:
- **Feat Types**: References feat types from feat system static data
- **Feat Prerequisites**: Integrates with feat prerequisite checking
- **Feat Benefits**: References feat benefit types and effects

**Source Files**:
- **Character Data**: `shared/static-data/src/CharacterTypeData.ts`
- **Feat Data**: `shared/static-data/src/FeatData.ts`

### **Spell System Integration**

The character management static data integrates with the spell system for spellcasting characters.

**Integration Points**:
- **Spell Schools**: References spell schools from spell system static data
- **Spell Components**: Integrates with spell component types
- **Spell Descriptors**: References spell descriptor types

**Source Files**:
- **Character Data**: `shared/static-data/src/CharacterTypeData.ts`
- **Spell Data**: `shared/static-data/src/SpellData.ts`

## 📊 **Data Validation and Business Rules**

### **Ability Score Validation**

Validates that ability scores follow proper rules and constraints.

**Business Rules**:
- **Score Range**: Ability scores must be between 1-50
- **Modifier Calculation**: Ability modifiers are calculated as (score - 10) / 2
- **Score Distribution**: Character creation may have specific score distribution rules

**Validation Implementation**:
```typescript
// Validate ability score range
const validateAbilityScore = (score: number): boolean => {
    return score >= CHARACTER_CREATION_LIMITS.MIN_ABILITY_SCORE &&
           score <= CHARACTER_CREATION_LIMITS.MAX_ABILITY_SCORE;
};

// Calculate ability modifier
const calculateAbilityModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
};
```

### **Alignment Validation**

Validates that alignments follow proper rules and restrictions.

**Business Rules**:
- **Alignment Restrictions**: Certain classes have alignment restrictions
- **Alignment Changes**: Characters may have restrictions on alignment changes
- **Alignment Effects**: Alignment affects certain game mechanics

**Validation Implementation**:
```typescript
// Validate alignment for class
const validateAlignmentForClass = (alignment: AlignmentType, classId: number): boolean => {
    const classInfo = ClassMap[classId];
    return classInfo.allowedAlignments.includes(alignment);
};

// Check alignment change restrictions
const canChangeAlignment = (currentAlignment: AlignmentType, newAlignment: AlignmentType): boolean => {
    // Implementation depends on game rules
    return true; // Simplified for example
};
```

### **Character Type Validation**

Validates that character types follow proper rules and restrictions.

**Business Rules**:
- **Type Restrictions**: Certain features are restricted by character type
- **Type Transitions**: Characters may have restrictions on type changes
- **Type Effects**: Character type affects available features and abilities

**Validation Implementation**:
```typescript
// Validate character type for feature
const validateCharacterTypeForFeature = (characterType: CharacterType, featureId: number): boolean => {
    const featureInfo = FeatureMap[featureId];
    return featureInfo.allowedCharacterTypes.includes(characterType);
};

// Check if character can use player features
const canUsePlayerFeatures = (characterType: CharacterType): boolean => {
    return characterType === CharacterType.PLAYER_CHARACTER;
};
```

## 🎯 **Data Access Patterns**

### **Lookup Patterns**

The static data provides efficient lookup patterns for character management.

**Direct Enum Access**:
```typescript
// Direct enum value access
const strengthScore = AbilityScoreType.STRENGTH;
const lawfulGood = AlignmentType.LAWFUL_GOOD;
```

**Map Lookup Access**:
```typescript
// Map-based information lookup
const strengthInfo = AbilityScoreMap[AbilityScoreType.STRENGTH];
const alignmentInfo = AlignmentMap[AlignmentType.LAWFUL_GOOD];
```

**Array-Based Access**:
```typescript
// Array-based iteration
const allAbilityScores = Object.values(AbilityScoreMap);
const allAlignments = Object.values(AlignmentMap);
```

### **Validation Patterns**

The static data provides validation patterns for character data.

**Type Validation**:
```typescript
// Validate enum values
const isValidAbilityScore = (value: number): boolean => {
    return Object.values(AbilityScoreType).includes(value);
};

const isValidAlignment = (value: number): boolean => {
    return Object.values(AlignmentType).includes(value);
};
```

**Range Validation**:
```typescript
// Validate ranges using constants
const isValidCharacterName = (name: string): boolean => {
    return name.length >= CHARACTER_CREATION_LIMITS.MIN_NAME_LENGTH &&
           name.length <= CHARACTER_CREATION_LIMITS.MAX_NAME_LENGTH;
};
```

## 📚 **Related Documentation**

### **System Documentation**
- **[Database Schema](database-schema.md)** — Prisma models and relationships
- **[Validation Schemas](validation-schemas.md)** — Zod validation schemas
- **[Backend Implementation](backend-implementation.md)** — Backend services and API
- **[Frontend Components](frontend-components.md)** — Frontend React components

### **Application Overview**
- **[Static Data Overview](../application-overview/static-data.md)** — Shared static data patterns
- **[Data Validation Patterns](../application-overview/validation-schemas.md)** — Shared validation patterns
- **[Type Safety Patterns](../application-overview/validation-schemas.md#type-safety)** — Shared type safety patterns

### **Cross-System Integration**
- **[Race System Static Data](../race-system/static-data.md)** — Race system static data integration
- **[Class System Static Data](../class-system/static-data.md)** — Class system static data integration
- **[Feat System Static Data](../feat-system/static-data.md)** — Feat system static data integration
- **[Spell System Static Data](../spell-system/static-data.md)** — Spell system static data integration

## Summary

The character management static data provides essential reference data structures, enums, and constants that support character creation, advancement, and management throughout the application. The data defines the foundational elements that characters are built upon and ensures consistency across the character management system.

The implementation follows established static data patterns and provides comprehensive validation, ensuring reliable and consistent character management throughout the application.

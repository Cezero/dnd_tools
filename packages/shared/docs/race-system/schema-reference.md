# Race System Schema Reference

*Database schema and enum definitions for race definitions, racial features, and racial trait management.*

## Core Race Models

### **Race Schema**
**Source**: `packages/shared/schema/src/race.ts`

The race schema defines the core structure for race definitions, including basic properties like name, size, speed, and favored class. It also includes relationships to source books and racial features through the feature system.

**Key Fields**:
- `name`: Race name (required, max 100 characters)
- `editionId`: Edition reference (optional)
- `isVisible`: Display flag (defaults to true)
- `description`: Race description (optional, max 10000 characters)
- `sizeId`: Size category (defaults to 5 - Medium)
- `speed`: Base movement speed (defaults to 30 feet)
- `favoredClassId`: Favored class reference (defaults to -1 for no favored class)
- `sources`: Array of source book references
- `features`: Array of racial features through feature progression

### **RaceSourceMap Schema**
**Source**: `packages/shared/schema/src/sourcebook.ts`

The race source map schema defines the relationship between races and their source books, including optional page number references for easy lookup.

**Key Fields**:
- `raceId`: Reference to the race
- `sourceBookId`: Reference to the source book
- `pageNumber`: Optional page number for quick reference

## Key Relationships

### **Race Definition Flow**
```
Race (Race Definition)
├── RaceSourceMap (Source Book References)
└── FeatureProgression (Racial Features)
    ├── FeatureModifier (Racial Bonuses)
    ├── FeatureChoice (Racial Choices)
    └── FeatureSpecialEffect (Racial Abilities)
```

### **Character Integration**
```
UserCharacter → Race
├── Base race statistics (size, speed, favored class)
└── Racial features through FeatureProgression
```

### **Feature System Integration**
```
Race → FeatureProgression (Racial Features)
├── FeatureModifier (Attribute bonuses, skill bonuses)
├── FeatureChoice (Racial feat choices, skill choices)
└── FeatureSpecialEffect (Special racial abilities)
```

## Database Constraints

### **Unique Constraints**
- `RaceSourceMap`: `[raceId, sourceBookId]` - Ensures unique source book references per race

### **Foreign Key Relationships**
- `Race.editionId` references edition information
- `Race.sizeId` references size categories
- `Race.favoredClassId` references class definitions
- `RaceSourceMap.raceId` references `Race.id`
- `RaceSourceMap.sourceBookId` references `SourceBook.id`

## Data Validation Rules

### **Race Creation**
- Race must have valid `name`
- `sizeId` must be a valid size category (typically 1-9)
- `speed` must be positive
- `favoredClassId` must reference a valid class or be 0 for no favored class

### **Racial Features**
- Racial features use the same validation as class features
- Feature progressions must reference valid race IDs
- Racial choices must be appropriate for the race

### **Source Attribution**
- Each race should have at least one source book reference
- Page numbers are optional but recommended for primary sources

## Common Race Patterns

### **Standard Race Definition**
```typescript
const standardRace = {
    name: "Elf",
    editionId: 1,
    isVisible: true,
    description: "Elves are known for their grace and long lives...",
    sizeId: 5, // Medium
    speed: 30, // 30 feet
    favoredClassId: CLASS_MAP.WIZARD // Favored class: Wizard
};
```

### **Racial Attribute Bonus**
```typescript
const elvenDexBonus = {
    level: 1,
    featureId: FEATURE_MAP.ELVEN_DEXTERITY,
    raceId: RACE_MAP.ELF,
    modifiers: [
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Attribute,
            appliesToId: ABILITY_MAP.DEX,
            value: 2,
            bonusType: FeatureBonusType.Racial
        }
    ]
};
```

### **Racial Skill Bonus**
```typescript
const elvenSkillBonus = {
    level: 1,
    featureId: FEATURE_MAP.ELVEN_SKILL_BONUS,
    raceId: RACE_MAP.ELF,
    modifiers: [
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Skill,
            appliesToId: SKILL_MAP.LISTEN,
            value: 2,
            bonusType: FeatureBonusType.Racial
        },
        {
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Skill,
            appliesToId: SKILL_MAP.SEARCH,
            value: 2,
            bonusType: FeatureBonusType.Racial
        }
    ]
};
```

### **Racial Special Ability**
```typescript
const elvenImmunity = {
    level: 1,
    featureId: FEATURE_MAP.ELVEN_IMMUNITY,
    raceId: RACE_MAP.ELF,
    effects: [
        {
            effectType: FeatureSpecialEffectType.Other,
            key: "sleep_immunity",
            value: "Immune to sleep spells and effects"
        }
    ]
};
```

## Size Categories

### **Standard Size Categories**
- **1**: Fine (1/8 inch or less)
- **2**: Diminutive (1/8 to 1/4 inch)
- **3**: Tiny (1/4 to 1/2 inch)
- **4**: Small (1/2 to 1 foot)
- **5**: Medium (1 to 2 feet) - Default for most races
- **6**: Large (2 to 4 feet)
- **7**: Huge (4 to 8 feet)
- **8**: Gargantuan (8 to 16 feet)
- **9**: Colossal (16 feet or larger)

### **Size Impact on Game Mechanics**
- **Combat**: Size affects attack bonuses, AC modifiers, and reach
- **Movement**: Size can affect base movement speed
- **Equipment**: Size affects weapon and armor availability
- **Skills**: Size can affect certain skill checks (Hide, Move Silently)

## Speed and Movement

### **Base Movement Speeds**
- **20 feet**: Dwarves, Halflings (Small races)
- **30 feet**: Humans, Elves, Half-elves, Half-orcs (Medium races)
- **40 feet**: Some Large races
- **50+ feet**: Very Large or magical races

### **Movement Modifiers**
- Racial features can modify base movement speed
- Equipment (armor, encumbrance) can reduce movement
- Class features can enhance movement capabilities

## Favored Class System

### **Favored Class Benefits**
- **Experience Bonus**: No multiclassing penalty for favored class
- **Skill Points**: Bonus skill points when taking favored class levels
- **Class Features**: Some races get bonuses with their favored class

### **Common Favored Class Patterns**
- **Humans**: No favored class (favoredClassId: 0)
- **Elves**: Wizard
- **Dwarves**: Fighter
- **Halflings**: Rogue
- **Half-orcs**: Barbarian

## Integration with Character Creation

### **Race Selection Process**
1. **Race Definition**: Load race base statistics
2. **Racial Features**: Apply all racial features automatically
3. **Size Effects**: Apply size-based modifiers to character
4. **Speed Calculation**: Set base movement speed
5. **Favored Class**: Record favored class for multiclassing

### **Validation Rules**
- Character must have a valid race
- Racial features must be applied correctly
- Size and speed must be consistent
- Favored class must be recorded for experience calculations

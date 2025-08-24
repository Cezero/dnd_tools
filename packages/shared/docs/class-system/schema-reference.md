# Class System Schema Reference

*Database schema and enum definitions for class definitions, spellcasting, and progression systems.*

## Core Class Models

### **Class Schema**
**Source**: `packages/shared/schema/src/class.ts`

The `Class` model defines character classes with their core attributes, spellcasting capabilities, and progression values. Key fields include:

- **Core Attributes**: `name`, `abbreviation`, `hitDie`, `skillPoints`
- **Spellcasting**: `canCastSpells`, `spellsKnown`, `castingAbilityId`, `castingType`
- **Progression Values**: `babProgression`, `fortProgression`, `refProgression`, `willProgression`
- **Relationships**: Features, source books, spell lists, character advancements

### **CastingTypeEnum**
**Source**: `packages/shared/schema/src/class.ts`

Defines the two primary spellcasting methods:
- `Prepared` - Spells must be prepared in advance (Wizard, Cleric)
- `Spontaneous` - Spells can be cast spontaneously (Sorcerer, Bard)

## Spellcasting Models

### **SpellcastingProgression Schema**
**Source**: `packages/shared/schema/src/spellcasting.ts`

Tracks spellcasting progression by class level, including:
- **Class Level**: The character level for this progression
- **Spell Slots**: Available spell slots per level
- **Feature Integration**: Links to class features that grant spellcasting

### **SpellcastingSlot Schema**
**Source**: `packages/shared/schema/src/spellcasting.ts`

Defines individual spell slots for each spell level:
- **Spell Level**: 0-9 spell levels
- **Slots Per Day**: Number of slots available
- **Progression Link**: Links to the parent spellcasting progression

### **SpellcastingLink Schema**
**Source**: `packages/shared/schema/src/spellcasting.ts`

Connects class features to spellcasting progression:
- **Feature Integration**: Links features to spellcasting
- **Inheritance**: Supports inherited spellcasting from other classes
- **Level Offset**: Allows for level-based spellcasting progression

## Spell List Models

### **SpellLevelMap Schema**
**Source**: `packages/shared/schema/src/spell-level-map.ts`

Maps spells to classes and their levels:
- **Class Access**: Which classes can cast each spell
- **Spell Level**: What level the spell is for each class
- **Visibility**: Controls spell visibility per class

### **ClassSourceMap Schema**
**Source**: `packages/shared/schema/src/class-source-map.ts`

Links classes to their source books:
- **Source References**: Which books contain class information
- **Page Numbers**: Specific page references
- **Edition Support**: Multiple edition support

## Key Relationships

### **Class Definition Flow**
```
Class (Class Definition)
├── ClassSourceMap (Source Book References)
├── SpellLevelMap (Class Spell Lists)
├── SpellcastingProgression (Spellcasting by Level)
│   ├── SpellcastingSlot (Spells per Day)
│   └── SpellcastingLink (Feature Integration)
└── FeatureProgression (Class Features)
    ├── FeatureModifier (Class Bonuses)
    ├── FeatureChoice (Class Choices)
    └── FeatureSpecialEffect (Class Abilities)
```

### **Spellcasting Integration**
```
Class → SpellcastingProgression → SpellcastingSlot
├── Class Level (1-20)
├── Spell Level (0-9)
└── Slots Per Day (0-4+)
```

### **Feature Integration**
```
Class → FeatureProgression → SpellcastingLink
└── SpellcastingProgression (Inherited Spellcasting)
```

## Database Constraints

### **Unique Constraints**
- `SpellLevelMap`: `[spellId, classId]` - Ensures unique spell-class combinations
- `ClassSourceMap`: `[classId, sourceBookId]` - Ensures unique source book references per class
- `SpellcastingLink`: `[featureProgressionId]` - Ensures unique feature-spellcasting links

### **Foreign Key Relationships**
- `Class.editionId` references edition information
- `Class.castingAbilityId` references ability definitions
- `SpellcastingProgression.classId` references `Class.id`
- `SpellcastingSlot.progressionId` references `SpellcastingProgression.id`
- `SpellLevelMap.classId` references `Class.id`
- `SpellLevelMap.spellId` references `Spell.id`

## Data Validation Rules

### **Class Creation**
- Class must have valid `name` and `abbreviation`
- `hitDie` must be a valid die size (4, 6, 8, 10, 12, 20)
- `skillPoints` must be positive
- Progression values must be valid (0, 1, 2 for poor/average/good)

### **Spellcasting Configuration**
- `canCastSpells` and `spellsKnown` must be consistent
- `castingAbilityId` required if `canCastSpells` is true
- `castingType` required if `canCastSpells` is true
- Spellcasting progression must have valid class levels

### **Spell Lists**
- Spell levels must be valid (0-9)
- Spell-class combinations must be unique
- Spell visibility can be controlled per class

## Common Class Patterns

### **Standard Class Definition**
```typescript
const fighterClass = {
    name: "Fighter",
    abbreviation: "Ftr",
    editionId: 1,
    isPrestige: false,
    isVisible: true,
    canCastSpells: false,
    spellsKnown: false,
    hitDie: 10,
    skillPoints: 2,
    babProgression: 1, // Full BAB
    fortProgression: 2, // Good Fortitude
    refProgression: 0,  // Poor Reflex
    willProgression: 0  // Poor Will
};
```

### **Spellcasting Class**
```typescript
const wizardClass = {
    name: "Wizard",
    abbreviation: "Wiz",
    editionId: 1,
    isPrestige: false,
    isVisible: true,
    canCastSpells: true,
    spellsKnown: false, // Prepared caster
    hitDie: 4,
    skillPoints: 2,
    castingAbilityId: ABILITY_MAP.INT,
    castingType: CastingTypeEnum.Prepared,
    babProgression: 0, // Poor BAB
    fortProgression: 0, // Poor Fortitude
    refProgression: 0,  // Poor Reflex
    willProgression: 2  // Good Will
};
```

### **Spellcasting Progression**
```typescript
const wizardSpellcasting = {
    classId: CLASS_MAP.WIZARD,
    classLevel: 1,
    slots: [
        { spellLevel: 0, slotsPerDay: 3 },
        { spellLevel: 1, slotsPerDay: 1 }
    ]
};
```

### **Class Spell List**
```typescript
const wizardFireball = {
    classId: CLASS_MAP.WIZARD,
    spellId: SPELL_MAP.FIREBALL,
    level: 3,
    isVisible: true
};
```

## Progression System

### **Base Attack Bonus (BAB) Progression**
- **0**: Poor BAB (1/2 level)
- **1**: Average BAB (3/4 level)
- **2**: Good BAB (level)

### **Saving Throw Progression**
- **0**: Poor save (1/3 level)
- **1**: Average save (1/2 level)
- **2**: Good save (2/3 level + 2)

### **Skill Points**
- **2**: Fighter, Paladin, Ranger
- **4**: Barbarian, Cleric, Druid, Monk
- **6**: Bard, Rogue
- **8**: Wizard, Sorcerer

## Spellcasting Integration

### **Prepared Casting**
- Spells must be prepared in advance
- Uses spell slots per day
- Can prepare different spells each day
- Examples: Wizard, Cleric, Druid

### **Spontaneous Casting**
- Spells known are fixed
- Uses spell slots per day
- Can cast any known spell
- Examples: Sorcerer, Bard

### **Spells Known**
- Some classes have spells known progression
- Separate from spell slots
- Examples: Bard, Sorcerer

## Feature Integration

### **Class Features**
- Features are granted through FeatureProgression
- Can include spellcasting through SpellcastingLink
- Features can modify spellcasting capabilities
- Examples: Domain spells, bonus spells

### **Inherited Spellcasting**
- Features can inherit spellcasting from other classes
- Uses SpellcastingLink to connect features to spellcasting
- Allows for prestige classes and multiclassing
- Examples: Mystic Theurge, Eldritch Knight

## Integration with Character System

### **Character Advancement**
- Characters gain levels in classes
- Each level grants class features
- Spellcasting progresses with class levels
- BAB and saves calculated from class progressions

### **Multiclassing**
- Characters can have multiple classes
- Each class contributes to total character abilities
- Spellcasting from different classes tracked separately
- Experience penalties for non-favored classes

### **Validation Rules**
- Character must have at least one class
- Class levels must be sequential
- Spellcasting must be valid for character level
- Features must meet prerequisites

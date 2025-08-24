# Spell System Schema Reference

*Database schema and enum definitions for spell definitions, spellcasting, and magical effects.*

## Core Spell Models

### **Spell Schema**
**Source**: `packages/shared/schema/src/spell.ts`

The spell schema defines the core structure for spell definitions, including all spell properties, components, schools, and relationships. This is the central schema for all spell-related functionality.

**Key Fields**:
- `name`: Spell name (required, max 200 characters)
- `editionId`: Edition reference (required)
- `baseLevel`: Base spell level (0-20)
- `summary`: Brief spell description (optional, max 1000 characters)
- `description`: Full spell description (optional, max 10000 characters)
- `castingTime`: Time required to cast (optional, max 200 characters)
- `range`: Spell range description (optional, max 200 characters)
- `area`: Area of effect (optional, max 200 characters)
- `duration`: Spell duration (optional, max 200 characters)
- `savingThrow`: Saving throw information (optional, max 200 characters)
- `spellResistance`: Spell resistance information (optional, max 200 characters)
- `effect`: Spell effect description (optional, max 500 characters)
- `target`: Target information (optional, max 200 characters)
- `schoolIds`: Array of spell schools
- `subSchoolIds`: Array of spell subschools
- `descriptorIds`: Array of spell descriptors
- `componentIds`: Array of spell components
- `levelMapping`: Array of class spell level mappings
- `sourceBookInfo`: Array of source book references

## Spell Classification Models

### **SpellDescriptorMap Schema**
**Source**: `packages/shared/schema/src/spell.ts`

Defines the relationship between spells and their descriptors (e.g., Fire, Cold, Acid, etc.).

**Key Fields**:
- `spellId`: Reference to the spell
- `descriptorId`: Reference to the spell descriptor

### **SpellSchoolMap Schema**
**Source**: `packages/shared/schema/src/spell.ts`

Defines the relationship between spells and their schools of magic (e.g., Evocation, Conjuration, etc.).

**Key Fields**:
- `spellId`: Reference to the spell
- `schoolId`: Reference to the spell school

### **SpellSubschoolMap Schema**
**Source**: `packages/shared/schema/src/spell.ts`

Defines the relationship between spells and their subschools (e.g., Calling, Creation, etc.).

**Key Fields**:
- `spellId`: Reference to the spell
- `subSchoolId`: Reference to the spell subschool

### **SpellComponentMap Schema**
**Source**: `packages/shared/schema/src/spell.ts`

Defines the relationship between spells and their components (e.g., Verbal, Somatic, Material, etc.).

**Key Fields**:
- `spellId`: Reference to the spell
- `componentId`: Reference to the spell component

## Spell Source and Level Models

### **SpellSourceMap Schema**
**Source**: `packages/shared/schema/src/sourcebook.ts`

Defines the relationship between spells and their source books, including optional page number references.

**Key Fields**:
- `spellId`: Reference to the spell
- `sourceBookId`: Reference to the source book
- `pageNumber`: Optional page number for quick reference

### **SpellLevelMap Schema**
**Source**: `packages/shared/schema/src/spell.ts`

Defines the relationship between spells and classes, specifying at what level each class can cast the spell.

**Key Fields**:
- `classId`: Reference to the class
- `spellId`: Reference to the spell
- `level`: Spell level for that class (0-9)
- `isVisible`: Whether this spell level mapping is visible

## Key Relationships

### **Spell Definition Flow**
```
Spell (Spell Definition)
├── SpellDescriptorMap (Spell Descriptors)
├── SpellSchoolMap (Spell Schools)
├── SpellSubschoolMap (Spell Subschools)
├── SpellComponentMap (Spell Components)
├── SpellSourceMap (Source Book References)
├── SpellLevelMap (Class Spell Lists)
└── CharacterSpellPreparation (Prepared Spells)
    └── SpellPreparationMetamagic (Applied Metamagic)
```

### **Spell Classification**
```
Spell → SpellSchoolMap → SpellSchool
├── Abjuration, Conjuration, Divination, Enchantment
├── Evocation, Illusion, Necromancy, Transmutation
└── Universal
```

### **Spell Components**
```
Spell → SpellComponentMap → SpellComponent
├── Verbal (V)
├── Somatic (S)
├── Material (M)
├── Focus (F)
└── Divine Focus (DF)
```

### **Class Integration**
```
Spell → SpellLevelMap → Class
├── Spell Level (0-9)
├── Class Access
└── Visibility Control
```

## Database Constraints

### **Unique Constraints**
- `SpellDescriptorMap`: `[spellId, descriptorId]` - Ensures unique spell-descriptor combinations
- `SpellSchoolMap`: `[spellId, schoolId]` - Ensures unique spell-school combinations
- `SpellSubschoolMap`: `[spellId, subSchoolId]` - Ensures unique spell-subschool combinations
- `SpellComponentMap`: `[spellId, componentId]` - Ensures unique spell-component combinations
- `SpellSourceMap`: `[spellId, sourceBookId]` - Ensures unique spell-source combinations
- `SpellLevelMap`: `[spellId, classId]` - Ensures unique spell-class combinations

### **Foreign Key Relationships**
- `Spell.editionId` references edition information
- `Spell.rangeTypeId` references range type definitions
- All spell classification maps reference `Spell.id`
- `SpellSourceMap.sourceBookId` references `SourceBook.id`
- `SpellLevelMap.classId` references `Class.id`

## Data Validation Rules

### **Spell Creation**
- Spell must have valid `name`
- `editionId` must reference valid edition
- `baseLevel` must be valid (0-9)
- Range, duration, and other fields must be consistent

### **Spell Classification**
- Spell can have multiple descriptors
- Spell must have at least one school
- Spell can have multiple subschools
- Spell can have multiple components

### **Class Spell Lists**
- Spell levels must be valid (0-9)
- Spell-class combinations must be unique
- Spell visibility can be controlled per class

## Common Spell Patterns

### **Standard Spell Definition**
```typescript
const fireballSpell = {
    name: "Fireball",
    summary: "A bright streak flashes from your pointing finger...",
    description: "A bright streak flashes from your pointing finger...",
    castingTime: "1 standard action",
    range: "Long (400 ft. + 40 ft./level)",
    area: "20-ft.-radius spread",
    duration: "Instantaneous",
    savingThrow: "Reflex half",
    spellResistance: "Yes",
    editionId: 1,
    baseLevel: 3,
    effect: "Explosion of flame",
    target: "20-ft.-radius spread"
};
```

### **Spell with Components**
```typescript
const fireballComponents = [
    { spellId: SPELL_MAP.FIREBALL, componentId: COMPONENT_MAP.VERBAL },
    { spellId: SPELL_MAP.FIREBALL, componentId: COMPONENT_MAP.SOMATIC },
    { spellId: SPELL_MAP.FIREBALL, componentId: COMPONENT_MAP.MATERIAL }
];
```

### **Spell Classification**
```typescript
const fireballClassification = {
    schools: [
        { spellId: SPELL_MAP.FIREBALL, schoolId: SCHOOL_MAP.EVOCATION }
    ],
    descriptors: [
        { spellId: SPELL_MAP.FIREBALL, descriptorId: DESCRIPTOR_MAP.FIRE }
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

## Spell Schools and Subschools

### **Spell Schools**
- **Abjuration**: Protection and banishment spells
- **Conjuration**: Summoning and teleportation spells
- **Divination**: Information-gathering spells
- **Enchantment**: Mind-affecting spells
- **Evocation**: Energy and force spells
- **Illusion**: Deceptive and illusory spells
- **Necromancy**: Death and undead spells
- **Transmutation**: Transformation spells
- **Universal**: Spells available to all schools

### **Spell Subschools**
- **Calling**: Summoning creatures
- **Creation**: Creating objects or creatures
- **Healing**: Restoring hit points and conditions
- **Summoning**: Bringing creatures to you
- **Teleportation**: Moving between locations
- **Charm**: Making targets friendly
- **Compulsion**: Forcing actions or behavior
- **Phantasm**: Mental illusions
- **Pattern**: Visual illusions
- **Figment**: Sensory illusions
- **Glamer**: Changing appearance
- **Shadow**: Partially real illusions

## Spell Components

### **Component Types**
- **Verbal (V)**: Spoken words and sounds
- **Somatic (S)**: Hand gestures and movements
- **Material (M)**: Physical components consumed
- **Focus (F)**: Physical components not consumed
- **Divine Focus (DF)**: Holy symbol or divine item

### **Component Requirements**
- **Arcane Spells**: Usually require V, S, and sometimes M
- **Divine Spells**: Usually require V, S, and DF
- **Silent Spells**: Can be cast without verbal components
- **Still Spells**: Can be cast without somatic components

## Spell Descriptors

### **Common Descriptors**
- **Acid**: Acid-based damage and effects
- **Air**: Air-based effects and movement
- **Chaotic**: Chaos-aligned effects
- **Cold**: Cold-based damage and effects
- **Darkness**: Shadow and darkness effects
- **Death**: Death and negative energy effects
- **Earth**: Earth-based effects and movement
- **Electricity**: Electrical damage and effects
- **Evil**: Evil-aligned effects
- **Fear**: Fear-inducing effects
- **Fire**: Fire-based damage and effects
- **Force**: Pure magical force effects
- **Good**: Good-aligned effects
- **Language-Dependent**: Requires understanding
- **Lawful**: Law-aligned effects
- **Light**: Light-based effects
- **Mind-Affecting**: Affects minds and thoughts
- **Sonic**: Sound-based damage and effects
- **Water**: Water-based effects and movement

## Integration with Character System

### **Spell Preparation**
- Characters prepare spells in advance
- Uses spell slots from class progression
- Can apply metamagic feats
- Tracks prepared spells per class

### **Spell Casting**
- Characters cast prepared spells
- Consumes spell slots
- May require components
- Can be interrupted or failed

### **Spell Knowledge**
- Characters learn spells through class features
- Some classes have spells known lists
- Spells can be learned from scrolls or other sources
- Spell books track known spells

### **Validation Rules**
- Character must have appropriate class levels
- Spell level must not exceed available slots
- Components must be available
- Prerequisites must be met

# Character Management Schema Reference

*Database schema and enum definitions for character creation, advancement, and management.*

## Core Character Models

### **UserCharacter Schema**
```typescript
const UserCharacterSchema = z.object({
    id: z.number().int().positive(),
    userId: z.number().int().positive(),
    name: z.string().min(1),
    raceId: z.number().int().positive(),
    alignmentId: z.number().int().positive(),
    xp: z.number().int().default(0),
    age: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    weight: z.number().int().positive().optional(),
    eyes: z.string().optional(),
    hair: z.string().optional(),
    gender: z.string().optional(),
    notes: z.string().optional(),
    
    // Relationships
    attributes: z.array(UserCharacterAttributeSchema).optional(),
    characterItems: z.array(CharacterItemSchema).optional(),
    advancements: z.array(CharacterAdvancementSchema).optional(),
    preparedSpells: z.array(CharacterSpellPreparationSchema).optional(),
    race: RaceSchema.optional(),
    user: UserSchema.optional(),
});
```

### **UserCharacterAttribute Schema**
```typescript
const UserCharacterAttributeSchema = z.object({
    id: z.number().int().positive(),
    characterId: z.number().int().positive(),
    attributeId: z.number().int().positive(),
    value: z.number().int().positive(),
    
    // Relationships
    character: UserCharacterSchema.optional(),
});
```

### **CharacterAdvancement Schema**
```typescript
const CharacterAdvancementSchema = z.object({
    id: z.number().int().positive(),
    characterId: z.number().int().positive(),
    level: z.number().int().positive(),
    version: z.number().int().positive(), // Incrementing number per (characterId, level)
    classId: z.number().int().positive(),
    secondaryClassId: z.number().int().positive().optional(), // For gestalt/variant multiclassing
    hitPoints: z.number().int().positive(),
    attributeId: z.number().int().positive().optional(),
    notes: z.string().optional(),
    createdAt: z.date(),
    
    // Relationships
    character: UserCharacterSchema.optional(),
    class: ClassSchema.optional(),
    secondaryClass: ClassSchema.optional(),
    skills: z.array(AdvancementSkillSchema).optional(),
    feats: z.array(AdvancementFeatSchema).optional(),
    spellsKnown: z.array(AdvancementSpellSchema).optional(),
    featureChoices: z.array(CharacterFeatureChoiceSchema).optional(),
});
```

## Advancement Tracking Models

### **AdvancementSkill Schema**
```typescript
const AdvancementSkillSchema = z.object({
    advancementId: z.number().int().positive(),
    skillId: z.number().int().positive(),
    pointsSpent: z.number().int().positive(),
    
    // Relationships
    advancement: CharacterAdvancementSchema.optional(),
    skill: SkillSchema.optional(),
});
```

### **AdvancementFeat Schema**
```typescript
const AdvancementFeatSchema = z.object({
    advancementId: z.number().int().positive(),
    featId: z.number().int().positive(),
    
    // Relationships
    advancement: CharacterAdvancementSchema.optional(),
    feat: FeatSchema.optional(),
});
```

### **AdvancementSpell Schema**
```typescript
const AdvancementSpellSchema = z.object({
    advancementId: z.number().int().positive(),
    spellId: z.number().int().positive(),
    
    // Relationships
    advancement: CharacterAdvancementSchema.optional(),
    spell: SpellSchema.optional(),
});
```

### **CharacterFeatureChoice Schema**
```typescript
const CharacterFeatureChoiceSchema = z.object({
    id: z.number().int().positive(),
    characterId: z.number().int().positive(),
    featureChoiceId: z.number().int().positive(),
    progressionId: z.number().int().positive(),
    advancementId: z.number().int().positive(),
    key: z.string().optional(), // For choice identification
    value: z.string(), // The actual choice made
    choiceIndex: z.number().int().positive().optional(), // For multiple choices
    
    // Relationships
    featureProgression: FeatureProgressionSchema.optional(),
    featureChoice: FeatureChoiceSchema.optional(),
    advancement: CharacterAdvancementSchema.optional(),
});
```

## Equipment Models

### **CharacterItem Schema**
```typescript
const CharacterItemSchema = z.object({
    id: z.number().int().positive(),
    name: z.string(), // e.g. "Vorpal Dragonbane Longsword"
    quantity: z.number().int().positive().optional(),
    characterId: z.number().int().positive(),
    baseItemId: z.number().int().positive(),
    
    // Relationships
    character: UserCharacterSchema.optional(),
    baseItem: ItemSchema.optional(),
    characterItemProperties: z.array(CharacterItemPropertySchema).optional(),
});
```

### **CharacterItemProperty Schema**
```typescript
const CharacterItemPropertySchema = z.object({
    id: z.number().int().positive(),
    characterItemId: z.number().int().positive(),
    propertyId: z.number().int().positive(),
    
    // Relationships
    characterItem: CharacterItemSchema.optional(),
    property: ItemPropertySchema.optional(),
});
```

## Spell Preparation Models

### **CharacterSpellPreparation Schema**
```typescript
const CharacterSpellPreparationSchema = z.object({
    characterId: z.number().int().positive(),
    classId: z.number().int().positive(), // The class whose slot was used
    spellId: z.number().int().positive(),
    spellLevel: z.number().int().positive(), // Actual slot level used (post-metamagic)
    quantity: z.number().int().positive(),
    prepKey: z.string(), // Unique identifier for this exact combination
    slotType: z.number().int().positive().default(1),
    
    // Relationships
    character: UserCharacterSchema.optional(),
    class: ClassSchema.optional(),
    spell: SpellSchema.optional(),
    metamagics: z.array(SpellPreparationMetamagicSchema).optional(),
});
```

### **SpellPreparationMetamagic Schema**
```typescript
const SpellPreparationMetamagicSchema = z.object({
    characterId: z.number().int().positive(),
    prepKey: z.string(),
    featId: z.number().int().positive(),
    
    // Relationships
    feat: FeatSchema.optional(),
    preparation: CharacterSpellPreparationSchema.optional(),
});
```

## Key Relationships

### **Character Creation Flow**
```
User → UserCharacter → CharacterAdvancement (Level 1)
├── UserCharacterAttribute (Ability Scores)
├── AdvancementSkill (Skill Points)
├── AdvancementFeat (Feat Selections)
└── CharacterFeatureChoice (Feature Choices)
```

### **Character Advancement Flow**
```
CharacterAdvancement (Level N)
├── AdvancementSkill (Additional Skill Points)
├── AdvancementFeat (New Feat Selections)
├── AdvancementSpell (New Spells Known)
└── CharacterFeatureChoice (New Feature Choices)
```

### **Equipment Integration**
```
UserCharacter → CharacterItem → CharacterItemProperty
└── Item (Base Item Definition)
    └── ItemProperty (Available Properties)
```

### **Spell Preparation**
```
UserCharacter → CharacterSpellPreparation → SpellPreparationMetamagic
├── Class (Spellcasting Class)
└── Spell (Prepared Spell)
    └── Feat (Applied Metamagic)
```

## Database Constraints

### **Unique Constraints**
- `CharacterAdvancement`: `[characterId, level, version]` - Ensures unique advancement records
- `CharacterFeatureChoice`: `[advancementId, progressionId, key]` - Ensures unique choice tracking
- `CharacterSpellPreparation`: `[characterId, prepKey]` - Ensures unique spell preparation
- `SpellPreparationMetamagic`: `[characterId, prepKey, featId]` - Ensures unique metamagic application

### **Foreign Key Relationships**
- All character models reference `UserCharacter.id`
- All advancement models reference `CharacterAdvancement.id`
- Equipment models reference both character and base item definitions
- Spell preparation references character, class, and spell definitions

## Data Validation Rules

### **Character Creation**
- Character must have valid `userId`, `name`, `raceId`, and `alignmentId`
- All six ability scores must be provided (STR, DEX, CON, INT, WIS, CHA)
- Character name must be unique per user

### **Character Advancement**
- Advancement level must be sequential (no gaps)
- Hit points must be positive
- Skill points must not exceed class maximum
- Feat selections must meet prerequisites

### **Equipment**
- Character items must reference valid base items
- Item properties must be compatible with item type
- Quantity must be positive

### **Spell Preparation**
- Prepared spells must be known by the character
- Spell level must not exceed available slots
- Metamagic feats must be applicable to the spell

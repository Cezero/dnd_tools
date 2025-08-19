# Schema Reference

*Database schema and enum definitions for the feature system.*

## Core Schemas

### **Feature Schema**
```typescript
const FeatureSchema = z.object({
    id: z.number().int().positive(),
    slug: z.string().min(1),
    name: z.string().min(1),
    description: z.string(),
    prerequisites: z.array(FeaturePrerequisiteSchema).optional(),
});
```

### **FeatureProgression Schema**
```typescript
const FeatureProgressionSchema = z.object({
    id: z.number().int().positive(),
    featureId: z.number().int().positive(),
    sourceType: z.nativeEnum(FeatureSourceType),
    level: z.number().int().positive(),
    classId: z.number().int().positive().nullable(),
    raceId: z.number().int().positive().nullable(),
    templateId: z.number().int().positive().nullable(),
    modifiers: z.array(FeatureModifierSchema).optional(),
    choices: z.array(FeatureChoiceSchema).optional(),
    effects: z.array(FeatureSpecialEffectSchema).optional(),
    spellcasting: z.object({
        progressionId: z.number().int().positive(),
        inheritedFrom: z.number().int().positive().nullable(),
        levelOffset: z.number().int(),
    }).optional(),
});
```

### **FeatureModifier Schema**
```typescript
const FeatureModifierSchema = z.object({
    id: z.number().int().positive(),
    featureProgressionId: z.number().int().positive(),
    type: z.nativeEnum(ModifierType),
    value: z.number().int(),
    valueFormula: z.string().nullable(),
    bonusType: z.nativeEnum(FeatureBonusType).nullable(),
    appliesTo: z.nativeEnum(ModifierAppliesToType).nullable(),
    appliesToId: z.number().int().nullable(),
    appliesIfChoiceKey: z.string().nullable(),
    appliesIfChoiceValue: z.string().nullable(),
    conditions: z.array(FeatureModifierConditionSchema).optional(),
});
```

## Key Enums

### **ModifierType**
```typescript
enum ModifierType {
    Bonus = 'bonus',           // +2 to attack
    Penalty = 'penalty',       // -2 to AC
    Quantity = 'quantity',     // +1d6 damage
    Uses = 'uses'              // 3/day
}
```

### **ModifierAppliesToType**
```typescript
enum ModifierAppliesToType {
    Attribute = 'attribute',           // STR, DEX, CON, etc.
    Skill = 'skill',                   // Climb, Jump, etc.
    SavingThrow = 'saving_throw',      // Fort, Ref, Will
    AC = 'ac',                         // Armor Class
    Attack = 'attack',                 // Attack rolls
    Damage = 'damage',                 // Damage rolls
    DamageReduction = 'damage_reduction', // DR
    Initiative = 'initiative',         // Initiative
    MovementSpeed = 'movement_speed',  // Speed in feet
    HitDice = 'hit_dice',              // Hit dice
    Uses = 'uses',                     // Uses per day/week
    Targets = 'targets',               // Number of targets
    Distance = 'distance',             // Range, reach, etc.
    Other = 'other'                    // Special cases
}
```

### **FeatureBonusType**
```typescript
enum FeatureBonusType {
    Circumstance = 'circumstance',   // Stack with everything
    Competence = 'competence',       // Don't stack with other competence
    Dodge = 'dodge',                 // Don't stack with other dodge
    Enhancement = 'enhancement',     // Don't stack with other enhancement
    Insight = 'insight',             // Don't stack with other insight
    Luck = 'luck',                   // Don't stack with other luck
    Morale = 'morale',               // Don't stack with other morale
    Profane = 'profane',             // Don't stack with other profane
    Racial = 'racial',               // Don't stack with other racial
    Sacred = 'sacred',               // Don't stack with other sacred
    Size = 'size',                   // Don't stack with other size
    Other = 'other'                  // Custom stacking rules
}
```

### **FeatureSourceType**
```typescript
enum FeatureSourceType {
    Class = 1,
    Race = 2,
    Template = 3
}
```

### **ChoiceBehavior**
```typescript
enum ChoiceBehavior {
    Single = 'single',         // Choose one option
    Multiple = 'multiple',     // Choose several options
    Allocation = 'allocation'  // Distribute points/bonuses
}
```

### **FeatureSpecialEffectType**
```typescript
enum FeatureSpecialEffectType {
    Proficiency = 'proficiency',     // Weapon/armor proficiency
    Immunity = 'immunity',           // Immunity to effects
    Vision = 'vision',               // Special vision modes
    Other = 'other'                  // Custom effects
}
```

## Type Compatibility Rules

### **ModifierType Compatibility**
- **Bonus** modifiers can only apply to bonus-compatible types (Attribute, Skill, SavingThrow, AC, Attack, Damage, DamageReduction, Initiative)
- **Quantity** modifiers can only apply to quantity-compatible types (MovementSpeed, HitDice, Uses, Targets, Distance)
- **Replacement** modifiers can only apply to replacement-compatible types
- **Other** modifiers can only apply to Other

### **Bonus Type Stacking**
- **Same type bonuses don't stack** (highest applies)
- **Different type bonuses stack** (add together)
- **Circumstance bonuses stack** with everything
- **Dodge bonuses stack** with other dodge bonuses
- **Untyped bonuses stack** unless specified otherwise

## API Usage Notes

### **Bulk Operations Only**
- **No Individual CRUD**: No endpoints for individual modifier/choice/effect operations
- **Complete Data**: Send full nested feature data in single requests
- **Backend Cleanup**: Backend handles deletion of old data during updates

### **Required Fields**
- `Feature`: slug, name, description
- `FeatureProgression`: featureId, sourceType, level, sourceId (classId/raceId/templateId)
- `FeatureModifier`: featureProgressionId, type, value, appliesTo

### **Optional Fields**
- `valueFormula`: For complex calculations
- `appliesIfChoiceKey/Value`: For choice-dependent modifiers
- `conditions`: For runtime conditional application
- `spellcasting`: For spellcasting progression integration

## Schema Simplifications

### **Removed Components**
- Individual CRUD schemas (CreateFeatureModifierSchema, UpdateFeatureModifierSchema, etc.)
- Base/Full patterns (BaseFeatureModifierSchema, FeatureModifierWithConditionsSchema, etc.)
- "ForBulk" schemas (CreateFeatureModifierForBulkSchema, etc.)
- Unused response schemas (GetFeatureModifiersResponseSchema, etc.)

### **Kept Components**
- Core schemas (FeatureSchema, FeatureProgressionSchema, FeatureModifierSchema, etc.)
- Bulk operation schemas (CreateFeatureProgressionSchema for class/race creation)
- Essential routes (only routes that are actually used)
- Core service methods (only methods that are actually called)

### **Benefits**
- **Reduced Maintenance**: ~50% less schema code to maintain
- **Clearer Intent**: Schema clearly reflects actual usage patterns
- **Better Performance**: Fewer unused endpoints and methods
- **Simplified Development**: Developers only need to understand used schemas

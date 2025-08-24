# Equipment System Schema Reference

*Database schema and enum definitions for items, weapons, armor, and equipment management.*

## Core Item Models

### **Item Schema**
```typescript
const ItemSchema = z.object({
    id: z.number().int().positive(),
    name: z.string().min(1),
    description: z.string().optional(),
    typeId: z.number().int().positive().default(1),
    cost: z.number().decimal().optional(),
    weight: z.number().decimal().optional(),
    quantity: z.number().int().positive().optional(),
    
    // Relationships
    armor: ArmorSchema.optional(),
    weapon: WeaponSchema.optional(),
    itemType: ItemTypeSchema.optional(),
    characterItems: z.array(CharacterItemSchema).optional(),
    itemTemplate: z.array(ItemTemplateSchema).optional(),
    featureSpecialEffect: z.array(FeatureSpecialEffectSchema).optional(),
});
```

### **ItemType Schema**
```typescript
const ItemTypeSchema = z.object({
    id: z.number().int().positive(),
    name: z.string().min(1),
    
    // Relationships
    itemLinks: z.array(ItemSchema).optional(),
});
```

## Weapon and Armor Models

### **Weapon Schema**
```typescript
const WeaponSchema = z.object({
    id: z.number().int().positive(),
    category: z.number().int().positive(),
    type: z.number().int().positive(),
    attackBonus: z.number().int().optional(),
    damageSmall: z.string().optional(),
    damageMedium: z.string().optional(),
    critical: z.string().optional(),
    range: z.string().optional(),
    damageType: z.string().optional(),
    reach: z.boolean().default(false),
    double: z.boolean().default(false),
    nonlethal: z.boolean().default(false),
    
    // Relationships
    item: ItemSchema.optional(),
});
```

### **Armor Schema**
```typescript
const ArmorSchema = z.object({
    id: z.number().int().positive(),
    category: z.number().int().positive(),
    bonus: z.number().int().optional(),
    dexterityCap: z.number().int().optional(),
    checkPenalty: z.number().int().optional(),
    arcaneSpellFailure: z.number().int().optional(),
    speedCapThirty: z.number().int().optional(),
    speedCapTwenty: z.number().int().optional(),
    
    // Relationships
    item: ItemSchema.optional(),
});
```

## Item Property System

### **ItemProperty Schema**
```typescript
const ItemPropertySchema = z.object({
    id: z.number().int().positive(),
    name: z.string().min(1),
    type: z.nativeEnum(ItemPropertyType),
    flatCostModifier: z.number().int().optional(),
    costMultiplier: z.number().float().optional(),
    costFormula: z.string().optional(),
    enhancementBonusValue: z.number().int().optional(),
    bonusEquivalentModifier: z.number().int().optional(),
    exclusiveMaterial: z.boolean().default(false),
    
    // Relationships
    appliesTo: z.array(ItemPropertyAppliesToSchema).optional(),
    incompatibilitiesA: z.array(ItemPropertyIncompatibilitySchema).optional(),
    incompatibilitiesB: z.array(ItemPropertyIncompatibilitySchema).optional(),
    templateProperties: z.array(ItemTemplatePropertySchema).optional(),
    characterItemProperties: z.array(CharacterItemPropertySchema).optional(),
});
```

### **ItemPropertyType Enum**
```typescript
enum ItemPropertyType {
    Material = 'Material',
    Enhancement = 'Enhancement',
    SpecialAbility = 'SpecialAbility',
    Structural = 'Structural'
}
```

### **ItemPropertyAppliesTo Schema**
```typescript
const ItemPropertyAppliesToSchema = z.object({
    id: z.number().int().positive(),
    propertyId: z.number().int().positive(),
    itemType: z.nativeEnum(ItemApplicableTypeEnum),
    
    // Relationships
    property: ItemPropertySchema.optional(),
});
```

### **ItemApplicableTypeEnum**
```typescript
enum ItemApplicableTypeEnum {
    Weapon = 'Weapon',
    Armor = 'Armor',
    Shield = 'Shield',
    MountArmor = 'MountArmor',
    Ammunition = 'Ammunition'
}
```

### **ItemPropertyIncompatibility Schema**
```typescript
const ItemPropertyIncompatibilitySchema = z.object({
    id: z.number().int().positive(),
    propertyAId: z.number().int().positive(),
    propertyBId: z.number().int().positive(),
    
    // Relationships
    propertyA: ItemPropertySchema.optional(),
    propertyB: ItemPropertySchema.optional(),
});
```

## Item Templates

### **ItemTemplate Schema**
```typescript
const ItemTemplateSchema = z.object({
    id: z.number().int().positive(),
    name: z.string().min(1),
    itemId: z.number().int().positive(),
    
    // Relationships
    item: ItemSchema.optional(),
    templateProperties: z.array(ItemTemplatePropertySchema).optional(),
});
```

### **ItemTemplateProperty Schema**
```typescript
const ItemTemplatePropertySchema = z.object({
    id: z.number().int().positive(),
    templateId: z.number().int().positive(),
    propertyId: z.number().int().positive(),
    
    // Relationships
    template: ItemTemplateSchema.optional(),
    property: ItemPropertySchema.optional(),
});
```

## Character Equipment

### **CharacterItem Schema**
```typescript
const CharacterItemSchema = z.object({
    id: z.number().int().positive(),
    name: z.string().min(1),
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

## Key Relationships

### **Item Definition Flow**
```
Item (Base Item Definition)
├── ItemType (Item Categories)
├── Weapon (Weapon Properties)
├── Armor (Armor Properties)
├── ItemProperty (Item Enhancements)
│   ├── ItemPropertyAppliesTo (Property Compatibility)
│   └── ItemPropertyIncompatibility (Property Conflicts)
├── ItemTemplate (Item Templates)
└── CharacterItem (Character Equipment)
    └── CharacterItemProperty (Applied Properties)
```

### **Property System**
```
ItemProperty → ItemPropertyAppliesTo → ItemApplicableType
├── Weapon Properties
├── Armor Properties
├── Shield Properties
└── Ammunition Properties
```

### **Template System**
```
ItemTemplate → ItemTemplateProperty → ItemProperty
├── Pre-configured Item Combinations
├── Property Sets
└── Cost Calculations
```

### **Character Integration**
```
UserCharacter → CharacterItem → CharacterItemProperty
└── Item (Base Item Definition)
    └── ItemProperty (Available Properties)
```

## Database Constraints

### **Unique Constraints**
- `ItemPropertyIncompatibility`: `[propertyAId, propertyBId]` - Ensures unique incompatibility pairs
- `ItemTemplateProperty`: `[templateId, propertyId]` - Ensures unique template-property combinations
- `CharacterItemProperty`: `[characterItemId, propertyId]` - Ensures unique character item properties

### **Foreign Key Relationships**
- `Item.typeId` references `ItemType.id`
- `Weapon.id` references `Item.id` (1:1 relationship)
- `Armor.id` references `Item.id` (1:1 relationship)
- `ItemPropertyAppliesTo.propertyId` references `ItemProperty.id`
- `ItemTemplate.itemId` references `Item.id`
- `CharacterItem.characterId` references `UserCharacter.id`
- `CharacterItem.baseItemId` references `Item.id`

## Data Validation Rules

### **Item Creation**
- Item must have valid `name`
- `typeId` must reference valid item type
- Cost and weight must be positive if provided
- Quantity must be positive if provided

### **Weapon Properties**
- Weapon category must be valid
- Weapon type must be valid
- Damage values must be valid dice notation
- Critical values must be valid format

### **Armor Properties**
- Armor category must be valid
- Armor bonus must be positive
- Dexterity cap must be reasonable
- Check penalty must be reasonable

### **Property Compatibility**
- Properties must be compatible with item types
- Incompatible properties cannot be applied together
- Enhancement bonuses must be valid
- Cost modifiers must be reasonable

## Common Item Patterns

### **Base Item Definition**
```typescript
const longswordItem = {
    name: "Longsword",
    description: "A well-balanced steel sword...",
    typeId: ITEM_TYPE_MAP.WEAPON,
    cost: 15.00, // 15 gold pieces
    weight: 4.0  // 4 pounds
};
```

### **Weapon with Properties**
```typescript
const vorpalLongsword = {
    name: "Vorpal Longsword",
    quantity: 1,
    characterId: 1,
    baseItemId: ITEM_MAP.LONGSWORD,
    characterItemProperties: [
        { propertyId: ITEM_PROPERTY_MAP.VORPAL },
        { propertyId: ITEM_PROPERTY_MAP.PLUS_5 }
    ]
};
```

### **Armor with Properties**
```typescript
const mithralChainmail = {
    name: "Mithral Chainmail",
    quantity: 1,
    characterId: 1,
    baseItemId: ITEM_MAP.CHAINMAIL,
    characterItemProperties: [
        { propertyId: ITEM_PROPERTY_MAP.MITHRAL },
        { propertyId: ITEM_PROPERTY_MAP.PLUS_2 }
    ]
};
```

### **Item Template**
```typescript
const vorpalSwordTemplate = {
    name: "Vorpal Sword Template",
    itemId: ITEM_MAP.LONGSWORD,
    templateProperties: [
        { propertyId: ITEM_PROPERTY_MAP.VORPAL },
        { propertyId: ITEM_PROPERTY_MAP.PLUS_5 }
    ]
};
```

## Item Categories

### **Weapon Categories**
- **Simple Weapons**: Basic weapons for all characters
- **Martial Weapons**: Weapons requiring training
- **Exotic Weapons**: Specialized weapons requiring feats
- **Ranged Weapons**: Weapons that can be thrown or fired
- **Melee Weapons**: Close combat weapons

### **Armor Categories**
- **Light Armor**: Minimal protection, no skill penalty
- **Medium Armor**: Moderate protection, some skill penalty
- **Heavy Armor**: Maximum protection, significant skill penalty
- **Shields**: Additional protection, can be used with any armor

### **Item Types**
- **Weapons**: Combat implements
- **Armor**: Protective equipment
- **Tools**: Utility items
- **Containers**: Storage items
- **Clothing**: Non-protective wear
- **Adventuring Gear**: Miscellaneous equipment

## Property System

### **Property Types**
- **Material**: Special materials (mithral, adamantine)
- **Enhancement**: Magical bonuses (+1, +2, etc.)
- **Special Ability**: Unique magical properties (vorpal, flaming)
- **Structural**: Physical modifications (masterwork, composite)

### **Property Compatibility**
- **Weapon Properties**: Apply to weapons only
- **Armor Properties**: Apply to armor and shields
- **Material Properties**: Can combine with other properties
- **Enhancement Properties**: Stack with other enhancements

### **Property Conflicts**
- **Exclusive Materials**: Cannot combine with other materials
- **Incompatible Abilities**: Cannot be applied together
- **Maximum Bonuses**: Cannot exceed enhancement limits
- **Special Restrictions**: Some properties have unique requirements

## Cost Calculation

### **Base Cost**
- **Item Cost**: Base cost of the item
- **Material Cost**: Additional cost for special materials
- **Enhancement Cost**: Cost for magical bonuses
- **Special Ability Cost**: Cost for unique properties

### **Cost Modifiers**
- **Flat Modifiers**: Fixed cost additions
- **Multipliers**: Percentage-based cost increases
- **Formulas**: Complex cost calculations
- **Equivalent Bonuses**: Cost based on bonus value

## Integration with Character System

### **Character Inventory**
- Characters own specific instances of items
- Items can have multiple properties
- Properties affect item functionality
- Cost and weight tracked for encumbrance

### **Equipment Slots**
- Characters have limited equipment slots
- Some items require specific slots
- Slots can be empty or occupied
- Equipment affects character abilities

### **Property Effects**
- Properties modify item statistics
- Properties can grant special abilities
- Properties affect combat calculations
- Properties may have prerequisites

### **Validation Rules**
- Character must have appropriate proficiencies
- Properties must be compatible
- Cost must be affordable
- Weight must not exceed carrying capacity

# Equipment System

*Complete documentation for items, weapons, armor, and equipment management in D&D Tools.*

## 📋 **Quick Navigation**

### **Getting Started**
- **[item-definitions.md](item-definitions.md)** — Item creation and management
- **[weapon-system.md](weapon-system.md)** — Weapons, damage, and combat properties
- **[armor-system.md](armor-system.md)** — Armor, shields, and protection
- **[item-properties.md](item-properties.md)** — Item enhancements and special abilities
- **[character-equipment.md](character-equipment.md)** — Character inventory and equipment

### **Database Schema**
- **[schema-reference.md](schema-reference.md)** — Equipment-related database models and relationships

## 🎯 **System Overview**

The equipment system manages all aspects of items, weapons, armor, and character equipment in D&D Tools. This includes base item definitions, item properties and enhancements, character inventory management, and equipment templates.

> **💡 See [System Overview](../system-overview.md) for how the Equipment System integrates with Character Management and the Feature System.**

### **Core Architecture**
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

### **Key Principles**
- **Base Item System**: All items start as base definitions with type categorization
- **Property System**: Items can have multiple properties and enhancements
- **Template System**: Pre-configured item combinations for common equipment
- **Character Integration**: Characters own specific instances of items with properties
- **Validation System**: Property compatibility and conflict checking

## 🚀 **Getting Started**

### **For New Team Members**
1. Start with **[item-definitions.md](item-definitions.md)** for item creation
2. Review **[schema-reference.md](schema-reference.md)** for database structure
3. Study **[weapon-system.md](weapon-system.md)** for weapon mechanics
4. Use **[armor-system.md](armor-system.md)** for armor and protection

### **For Equipment Implementation**
1. **Create base items** following **[item-definitions.md](item-definitions.md)**
2. **Configure weapons** using **[weapon-system.md](weapon-system.md)**
3. **Set up armor** as shown in **[armor-system.md](armor-system.md)**
4. **Implement properties** using **[item-properties.md](item-properties.md)**

## 📚 **Documentation Structure**

### **Functional Guides** (~200-300 lines each)
| Document | Purpose | Lines |
|----------|---------|-------|
| **[item-definitions.md](item-definitions.md)** | Item creation and management | ~250 |
| **[weapon-system.md](weapon-system.md)** | Weapons and combat properties | ~300 |
| **[armor-system.md](armor-system.md)** | Armor and protection | ~250 |
| **[item-properties.md](item-properties.md)** | Item enhancements and abilities | ~300 |
| **[character-equipment.md](character-equipment.md)** | Character inventory management | ~200 |

### **Schema Reference** (~150-200 lines each)
| Document | Purpose | Lines |
|----------|---------|-------|
| **[schema-reference.md](schema-reference.md)** | Equipment-related database models and relationships | ~200 |

## 🎯 **Key Capabilities**

- ✅ **Complete item definitions** with all mechanical properties
- ✅ **Weapon system** with damage, critical hits, and special properties
- ✅ **Armor system** with AC bonuses, penalties, and restrictions
- ✅ **Item property system** with enhancements and special abilities
- ✅ **Template system** for pre-configured item combinations
- ✅ **Character inventory** with property tracking
- ✅ **Property compatibility** and conflict validation

## 📈 **System Status**

- **Current Coverage**: 85% of equipment system features
- **Target Coverage**: 95%+ with planned enhancements
- **Schema Status**: Complete and optimized
- **API Status**: Full CRUD operations implemented
- **Documentation Status**: Comprehensive and AI-friendly

## 🔧 **Quick Examples**

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

### **Weapon Properties**
```typescript
const longswordWeapon = {
    id: ITEM_MAP.LONGSWORD,
    category: WEAPON_CATEGORY_MAP.SWORD,
    type: WEAPON_TYPE_MAP.MARTIAL,
    attackBonus: 0,
    damageSmall: "1d6",
    damageMedium: "1d8",
    critical: "19-20/x2",
    range: null,
    damageType: "slashing",
    reach: false,
    double: false,
    nonlethal: false
};
```

### **Item with Properties**
```typescript
const vorpalLongsword = {
    name: "Vorpal Dragonbane Longsword",
    quantity: 1,
    characterId: 1,
    baseItemId: ITEM_MAP.LONGSWORD,
    characterItemProperties: [
        { propertyId: ITEM_PROPERTY_MAP.VORPAL },
        { propertyId: ITEM_PROPERTY_MAP.DRAGONBANE }
    ]
};
```

For complete examples, see **[item-definitions.md](item-definitions.md)** and **[weapon-system.md](weapon-system.md)**.

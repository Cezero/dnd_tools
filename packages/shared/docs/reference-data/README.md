# Reference Data System

*Complete documentation for skills, feats, source books, and reference tables in D&D Tools.*

## 📋 **Quick Navigation**

### **Getting Started**
- **[skill-system.md](skill-system.md)** — Skills, skill checks, and skill mechanics
- **[feat-system.md](feat-system.md)** — Feats, prerequisites, and feat mechanics
- **[source-books.md](source-books.md)** — Source book management and attribution
- **[reference-tables.md](reference-tables.md)** — Reference tables and lookup data

### **Database Schema**
- **[schema-reference.md](schema-reference.md)** — Reference data database models and relationships

## 🎯 **System Overview**

The reference data system manages all the foundational game data in D&D Tools, including skills, feats, source books, and reference tables. This system provides the building blocks that other systems reference for game mechanics and content attribution.

> **💡 See [System Overview](../system-overview.md) for how the Reference Data System provides foundational data for all other game systems.**

### **Core Architecture**
```
Skill (Skill Definitions)
├── AdvancementSkill (Character Skill Points)
└── FeaturePrerequisite (Skill Prerequisites)

Feat (Feat Definitions)
├── FeatBenefitMap (Feat Benefits)
├── FeatPrerequisiteMap (Feat Prerequisites)
├── AdvancementFeat (Character Feats)
└── FeatureChoice (Feat Choices)

SourceBook (Source Book Information)
├── ClassSourceMap (Class Sources)
├── RaceSourceMap (Race Sources)
├── SpellSourceMap (Spell Sources)
└── ReferenceTable (Reference Data)

ReferenceTable (Reference Tables)
├── ReferenceTableColumn (Table Columns)
├── ReferenceTableRow (Table Rows)
└── ReferenceTableCell (Table Data)
```

### **Key Principles**
- **Foundation Data**: Provides core game mechanics and definitions
- **Content Attribution**: All game content is properly attributed to sources
- **Flexible Tables**: Reference tables support dynamic game data
- **System Integration**: All other systems reference this foundational data

## 🚀 **Getting Started**

### **For New Team Members**
1. Start with **[skill-system.md](skill-system.md)** for skill mechanics
2. Review **[schema-reference.md](schema-reference.md)** for database structure
3. Study **[feat-system.md](feat-system.md)** for feat implementation
4. Use **[source-books.md](source-books.md)** for content attribution

### **For Reference Data Implementation**
1. **Create skills** following **[skill-system.md](skill-system.md)**
2. **Implement feats** using **[feat-system.md](feat-system.md)**
3. **Set up source books** as shown in **[source-books.md](source-books.md)**
4. **Configure reference tables** using **[reference-tables.md](reference-tables.md)**

## 📚 **Documentation Structure**

### **Functional Guides** (~200-300 lines each)
| Document | Purpose | Lines |
|----------|---------|-------|
| **[skill-system.md](skill-system.md)** | Skills and skill mechanics | ~250 |
| **[feat-system.md](feat-system.md)** | Feats and feat mechanics | ~300 |
| **[source-books.md](source-books.md)** | Source book management | ~200 |
| **[reference-tables.md](reference-tables.md)** | Reference tables and data | ~250 |

### **Schema Reference** (~150-200 lines each)
| Document | Purpose | Lines |
|----------|---------|-------|
| **[schema-reference.md](schema-reference.md)** | Reference data database models and relationships | ~200 |

## 🎯 **Key Capabilities**

- ✅ **Complete skill system** with all skill definitions and mechanics
- ✅ **Comprehensive feat system** with benefits and prerequisites
- ✅ **Source book attribution** for all game content
- ✅ **Flexible reference tables** for dynamic game data
- ✅ **System integration** with all other game systems
- ✅ **Content validation** and prerequisite checking

## 📈 **System Status**

- **Current Coverage**: 95% of reference data features
- **Target Coverage**: 98%+ with planned enhancements
- **Schema Status**: Complete and optimized
- **API Status**: Full CRUD operations implemented
- **Documentation Status**: Comprehensive and AI-friendly

## 🔧 **Quick Examples**

### **Skill Definition**
```typescript
const climbSkill = {
    name: "Climb",
    abilityId: ABILITY_MAP.STR,
    checkDescription: "Use this skill to climb walls, cliffs, and other steep surfaces...",
    actionDescription: "Climbing is part of movement, so it's generally a move action...",
    retryTypeId: RETRY_TYPE_MAP.ALLOWED,
    retryDescription: "You can try again if you fail...",
    affectedByArmor: true,
    trainedOnly: false,
    isAnalog: false
};
```

### **Feat Definition**
```typescript
const powerAttackFeat = {
    name: "Power Attack",
    typeId: FEAT_TYPE_MAP.COMBAT,
    description: "You can make exceptionally powerful melee attacks...",
    benefit: "On your action, before making attack rolls for a round...",
    prerequisites: "Str 13, base attack bonus +1",
    repeatable: false,
    fighterBonus: true
};
```

### **Source Book**
```typescript
const playerHandbook = {
    name: "Player's Handbook",
    abbreviation: "PHB",
    releaseDate: "2000-08-01",
    editionId: 1,
    description: "The core rulebook for D&D 3.5...",
    isVisible: true
};
```

For complete examples, see **[skill-system.md](skill-system.md)** and **[feat-system.md](feat-system.md)**.

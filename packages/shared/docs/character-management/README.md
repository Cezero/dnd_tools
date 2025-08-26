# Character Management System

*Complete documentation for character creation, advancement, and management in D&D Tools.*

## 📋 **Quick Navigation**

### **Getting Started**
- **[character-creation.md](character-creation.md)** — Character creation workflow and validation
- **[character-advancement.md](character-advancement.md)** — Leveling up and multiclassing
- **[character-sheet.md](character-sheet.md)** — Character sheet display and calculations

### **Database Schema**
- **[schema-reference.md](schema-reference.md)** — Character-related database models and relationships
- **[multiclassing.md](multiclassing.md)** — Multiclassing implementation and restrictions

## 🎯 **System Overview**

The character management system handles all aspects of character creation, advancement, and data persistence. Characters are the central entity that connects all other game systems.

> **💡 See [System Overview](../system-overview.md) for how Character Management integrates with the Feature System and other game systems.**

### **Core Architecture**
```
UserCharacter (Character Definition)
├── UserCharacterAttribute (Ability Scores)
├── CharacterAdvancement (Level Progression)
│   ├── AdvancementSkill (Skill Points)
│   ├── AdvancementFeat (Feat Selections)
│   ├── AdvancementSpell (Spells Known)
│   └── CharacterFeatureChoice (Feature Choices)
├── CharacterItem (Equipment)
└── CharacterSpellPreparation (Prepared Spells)
```

### **Key Principles**
- **User Ownership**: Characters belong to specific users
- **Progressive Advancement**: Level-by-level character development
- **Multiclassing Support**: Multiple classes per character
- **Choice Tracking**: All player choices are persisted
- **Equipment Integration**: Full item and property system

## 🚀 **Getting Started**

### **For New Team Members**
1. Start with **[character-creation.md](character-creation.md)** for the creation workflow
2. Review **[schema-reference.md](schema-reference.md)** for database structure
3. Study **[character-advancement.md](character-advancement.md)** for leveling mechanics
4. Use **[character-sheet.md](character-sheet.md)** for display patterns

### **For Character Implementation**
1. **Follow creation workflow** from **[character-creation.md](character-creation.md)**
2. **Implement advancement logic** from **[character-advancement.md](character-advancement.md)**
3. **Use schema patterns** from **[schema-reference.md](schema-reference.md)**
4. **Handle multiclassing** as shown in **[multiclassing.md](multiclassing.md)**

## 📚 **Documentation Structure**

### **Functional Guides** (~200-300 lines each)
| Document | Purpose | Lines |
|----------|---------|-------|
| **[character-creation.md](character-creation.md)** | Character creation workflow and validation | ~250 |
| **[character-advancement.md](character-advancement.md)** | Leveling up and multiclassing mechanics | ~300 |
| **[character-sheet.md](character-sheet.md)** | Character sheet display and calculations | ~200 |
| **[multiclassing.md](multiclassing.md)** | Multiclassing implementation and restrictions | ~180 |

### **Schema Reference** (~150-200 lines each)
| Document | Purpose | Lines |
|----------|---------|-------|
| **[schema-reference.md](schema-reference.md)** | Character-related database models and relationships | ~200 |

## 🎯 **Key Capabilities**

- ✅ **Complete character creation** with validation and prerequisites
- ✅ **Progressive advancement** with level-by-level tracking
- ✅ **Multiclassing support** with secondary class tracking
- ✅ **Choice persistence** for all player decisions
- ✅ **Equipment integration** with full item and property system
- ✅ **Spell preparation** with metamagic support

## 📈 **System Status**

- **Current Coverage**: 90% of character management features
- **Target Coverage**: 95%+ with planned enhancements
- **Schema Status**: Complete and optimized
- **API Status**: Full CRUD operations implemented
- **Documentation Status**: Comprehensive and AI-friendly

## 🔧 **Quick Examples**

### **Character Creation**
```typescript
const character = {
    userId: 1,
    name: "Aragorn",
    raceId: RACE_MAP.HUMAN,
    alignmentId: ALIGNMENT_MAP.LAWFUL_GOOD,
    attributes: [
        { abilityId: ABILITY_MAP.STR, value: 16 },
{ abilityId: ABILITY_MAP.DEX, value: 14 },
        // ... other attributes
    ]
};
```

### **Character Advancement**
```typescript
const advancement = {
    characterId: 1,
    level: 2,
    classId: CLASS_MAP.FIGHTER,
    hitPoints: 8,
    skills: [
        { skillId: SKILL_MAP.CLIMB, pointsSpent: 2 },
        { skillId: SKILL_MAP.JUMP, pointsSpent: 2 }
    ],
    feats: [
        { featId: FEAT_MAP.POWER_ATTACK }
    ]
};
```

For complete examples, see **[character-creation.md](character-creation.md)** and **[character-advancement.md](character-advancement.md)**.

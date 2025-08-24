# Spell System

*Complete documentation for spell definitions, spellcasting, and magical effects in D&D Tools.*

## 📋 **Quick Navigation**

### **Getting Started**
- **[spell-definitions.md](spell-definitions.md)** — Spell creation and management
- **[spellcasting-mechanics.md](spellcasting-mechanics.md)** — Spellcasting rules and mechanics
- **[spell-preparation.md](spell-preparation.md)** — Spell preparation and metamagic
- **[spell-lists.md](spell-lists.md)** — Class spell lists and spell access

### **Database Schema**
- **[schema-reference.md](schema-reference.md)** — Spell-related database models and relationships

## 🎯 **System Overview**

The spell system manages all aspects of magic in D&D Tools, including spell definitions, spellcasting mechanics, spell preparation, and class spell lists. This system integrates with the class system for spellcasting progression and the character system for spell preparation.

> **💡 See [System Overview](../system-overview.md) for how the Spell System integrates with the Class System and Character Management.**

### **Core Architecture**
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

### **Key Principles**
- **Comprehensive Spell Data**: Complete spell information including components, schools, and descriptors
- **Class Integration**: Spells are tied to specific classes through spell lists
- **Preparation System**: Characters can prepare spells with metamagic modifications
- **Source Attribution**: All spell content is properly attributed to source books

## 🚀 **Getting Started**

### **For New Team Members**
1. Start with **[spell-definitions.md](spell-definitions.md)** for spell creation
2. Review **[schema-reference.md](schema-reference.md)** for database structure
3. Study **[spellcasting-mechanics.md](spellcasting-mechanics.md)** for magic rules
4. Use **[spell-preparation.md](spell-preparation.md)** for character spell management

### **For Spell Implementation**
1. **Create spell definition** following **[spell-definitions.md](spell-definitions.md)**
2. **Set up class spell lists** using **[spell-lists.md](spell-lists.md)**
3. **Implement spellcasting mechanics** as shown in **[spellcasting-mechanics.md](spellcasting-mechanics.md)**
4. **Configure spell preparation** using **[spell-preparation.md](spell-preparation.md)**

## 📚 **Documentation Structure**

### **Functional Guides** (~200-300 lines each)
| Document | Purpose | Lines |
|----------|---------|-------|
| **[spell-definitions.md](spell-definitions.md)** | Spell creation and management | ~250 |
| **[spellcasting-mechanics.md](spellcasting-mechanics.md)** | Spellcasting rules and mechanics | ~300 |
| **[spell-preparation.md](spell-preparation.md)** | Spell preparation and metamagic | ~250 |
| **[spell-lists.md](spell-lists.md)** | Class spell lists and access | ~200 |

### **Schema Reference** (~150-200 lines each)
| Document | Purpose | Lines |
|----------|---------|-------|
| **[schema-reference.md](schema-reference.md)** | Spell-related database models and relationships | ~200 |

## 🎯 **Key Capabilities**

- ✅ **Complete spell definitions** with all mechanical properties
- ✅ **Spell school and subschool system** for spell categorization
- ✅ **Spell component tracking** (verbal, somatic, material, focus)
- ✅ **Spell descriptor system** for special properties
- ✅ **Class spell list management** with level restrictions
- ✅ **Spell preparation system** with metamagic support
- ✅ **Source book attribution** for all content

## 📊 **Implementation Status**

### **✅ Well-Implemented Infrastructure**
- **Backend Services**: Complete CRUD operations with full API endpoints (except creation)
- **Database Schema**: Complete with all relationships and constraints
- **Frontend UI**: Complete spell management interface with all functionality
- **Spell Data**: Extensive spell database with 2,800+ spells
- **Documentation**: Comprehensive documentation and examples

### **⚠️ Spell System Status**
- ✅ **Extensive Spell Data**: 2,800+ spells modeled in `SpellData.ts`
- ✅ **Complete Spell Components**: All component types (V, S, M, F, DF, X)
- ✅ **Complete Spell Schools**: All 8 schools + Universal + Invocation
- ✅ **Complete Spell Descriptors**: 22 descriptors including Fire, Cold, Acid, etc.
- ✅ **Complete Spell Subschools**: All subschools with school relationships
- ✅ **Complete Spell Ranges**: All range types with abbreviations
- ❌ **Missing Creation Endpoint**: No POST endpoint for creating new spells

### **Implementation Quality**
- **Code Quality**: High - Well-structured, type-safe, comprehensive
- **Feature Completeness**: 75% - Infrastructure complete, extensive spell data, missing creation endpoint
- **Documentation**: Good - Well-documented with examples
- **UI Completeness**: Complete - Full interface with all functionality

## 🔧 **Quick Examples**

### **Spell Definition**
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

### **Class Spell List**
```typescript
const wizardFireball = {
    classId: CLASS_MAP.WIZARD,
    spellId: SPELL_MAP.FIREBALL,
    level: 3,
    isVisible: true
};
```

### **Spell Preparation**
```typescript
const preparedFireball = {
    characterId: 1,
    classId: CLASS_MAP.WIZARD,
    spellId: SPELL_MAP.FIREBALL,
    spellLevel: 5, // Enhanced with metamagic
    quantity: 1,
    prepKey: "wizard_fireball_1",
    slotType: 1,
    metamagics: [
        { featId: FEAT_MAP.EMPOWER_SPELL }
    ]
};
```

For complete examples, see **[spell-definitions.md](spell-definitions.md)** and **[spell-preparation.md](spell-preparation.md)**.

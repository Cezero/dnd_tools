# Feature System Documentation

*Complete documentation for the D&D Tools feature system, covering implementation, usage, and best practices.*

## 📋 **Quick Navigation**

### **Getting Started**
- **[overview.md](overview.md)** — Core concepts and design principles (~125 lines)
- **[schema-reference.md](schema-reference.md)** — Database schema and enum definitions (~185 lines)
- **[quick-start.md](quick-start.md)** — First steps for implementing features (~180 lines)

### **Implementation Guides**
- **[class-features.md](class-features.md)** — Complete examples for class features (~195 lines)
- **[class-skills.md](class-skills.md)** — How class skills are modeled in the feature system (~400 lines)
- **[languages.md](languages.md)** — How automatic and bonus languages are modeled (~350 lines)
- **[racial-features.md](racial-features.md)** — Complete examples for racial traits (~235 lines)
- **[direct-feat-grants.md](direct-feat-grants.md)** — How direct feat grants are modeled (~200 lines)
- **[weapon-familiarity-system.md](weapon-familiarity-system.md)** — Weapon familiarity system implementation (~300 lines)
- **[component-selection.md](component-selection.md)** — When to use modifiers, choices, effects (~225 lines)
- **[bulk-operations.md](bulk-operations.md)** — Creating and updating classes/races (~270 lines)
- **[feature-progression-management.md](feature-progression-management.md)** — FeatureProgression management and backend consolidation (~300 lines)
- **[choice-system-guide.md](choice-system-guide.md)** — Complex choice system implementation including Ranger fighting styles (~250 lines)

### **Advanced Topics**
- **[formula-system-analysis.md](formula-system-analysis.md)** — Pre-defined formulas for D&D 3.5 scaling (~320 lines)
- **[runtime-calculation.md](runtime-calculation.md)** — Character sheet calculation patterns (~285 lines)
- **[common-pitfalls.md](common-pitfalls.md)** — Common mistakes and solutions (~210 lines)
- **[testing-patterns.md](testing-patterns.md)** — Testing feature implementations (~280 lines)
- **[formatter-utilities.md](formatter-utilities.md)** — Formatter and utility functions reference (~600 lines)

### **Formatting System**
- **[formatting/README.md](formatting/README.md)** — Feature formatting system overview and architecture
- **[formatting/usage-guidelines.md](formatting/usage-guidelines.md)** — Comprehensive guidelines for using the formatting system
- **[formatting/final-implementation-summary.md](formatting/final-implementation-summary.md)** — Complete implementation overview
- **[formatting/refactoring-strategy.md](formatting/refactoring-strategy.md)** — Architecture design decisions and patterns

### **Reference**
- **[schema-simplifications.md](schema-simplifications.md)** — Recent schema changes and migration (~210 lines)

## 🎯 **System Overview**

The D&D Tools feature system provides a comprehensive framework for modeling all D&D 3.x class features, racial traits, and character abilities.

> **💡 See [System Overview](../system-overview.md) for how the Feature System serves as the core engine for all other game systems.**

### **Core Architecture**
```
Feature (Definition)
├── FeatureProgression (Level-based grants)
│   ├── FeatureModifier (Numeric bonuses/penalties)
│   │   └── FeatureModifierCondition (Runtime conditions)
│   ├── FeatureChoice (Player selections)
│   └── FeatureSpecialEffect (Non-numeric effects)
└── FeaturePrerequisite (Requirements - at feature level)
```

### **Key Principles**
- **Bulk Operations Only**: Features are only modified as part of class/race creation/update
- **No Individual CRUD**: No individual endpoints for modifiers, choices, or effects
- **Static System**: Features are only manipulated when adding new game content
- **Single API Call**: Complete feature data sent in one request
- **Consolidated Backend**: Single source of truth for FeatureProgression management across all services

### **Backend Architecture**
The feature system provides a consolidated backend architecture that eliminates duplicate logic:

- **FeatureSystemService**: Central service containing all FeatureProgression management logic
- **ClassService & RaceService**: Consumer services that call consolidated methods
- **Single Source of Truth**: All FeatureProgression creation/deletion goes through FeatureSystemService
- **Transaction Safety**: Consistent transaction patterns across all services

**Related Documentation:**
- [Class System Documentation](../class-system/README.md) - How classes integrate with the feature system
- [Race System Documentation](../race-system/README.md) - How races integrate with the feature system
- [FeatureProgression Management](feature-progression-management.md) - Detailed backend consolidation documentation

### **Simplified Schema**
- **Removed Redundancy**: Eliminated base/full schema patterns for internal entities
- **Focused Schemas**: Only schemas that are actually used in API calls are maintained
- **Clear Intent**: Schema structure now clearly reflects actual usage patterns

## 🚀 **Getting Started**

### **For New Team Members**
1. Start with **[overview.md](overview.md)** for core concepts
2. Review **[schema-reference.md](schema-reference.md)** for database structure
3. Study **[class-features.md](class-features.md)** for practical implementations
4. Use **[component-selection.md](component-selection.md)** for decision making

### **For Feature Implementation**
1. **Identify feature type** using the decision tree in **[component-selection.md](component-selection.md)**
2. **Follow implementation patterns** from **[class-features.md](class-features.md)** or **[racial-features.md](racial-features.md)**
3. **For class skills** see **[class-skills.md](class-skills.md)** for the special container pattern
4. **For languages** see **[languages.md](languages.md)** for automatic and bonus language patterns
5. **Use bulk operations** as shown in **[bulk-operations.md](bulk-operations.md)**
6. **Test thoroughly** using patterns from **[testing-patterns.md](testing-patterns.md)**

## 📚 **Documentation Structure**

### **Foundation Documents** (~150-200 lines each)
| Document | Purpose | Lines |
|----------|---------|-------|
| **[overview.md](overview.md)** | Core concepts and design principles | ~125 |
| **[schema-reference.md](schema-reference.md)** | Database schema and enum definitions | ~185 |
| **[quick-start.md](quick-start.md)** | First steps and basic examples | ~180 |

### **Implementation Guides** (~200-400 lines each)
| Document | Purpose | Lines |
|----------|---------|-------|
| **[class-features.md](class-features.md)** | Complete class feature examples | ~195 |
| **[class-skills.md](class-skills.md)** | Class skills implementation patterns | ~400 |
| **[languages.md](languages.md)** | Automatic and bonus language patterns | ~350 |
| **[racial-features.md](racial-features.md)** | Complete racial trait examples | ~235 |
| **[component-selection.md](component-selection.md)** | Decision making and component usage | ~225 |
| **[bulk-operations.md](bulk-operations.md)** | API usage for creating/updating | ~270 |

### **Advanced Topics** (~200-600 lines each)
| Document | Purpose | Lines |
|----------|---------|-------|
| **[formula-system-analysis.md](formula-system-analysis.md)** | Pre-defined formulas for D&D 3.5 scaling | ~320 |
| **[runtime-calculation.md](runtime-calculation.md)** | Character sheet calculation patterns | ~285 |
| **[common-pitfalls.md](common-pitfalls.md)** | Common mistakes and solutions | ~210 |
| **[testing-patterns.md](testing-patterns.md)** | Testing feature implementations | ~280 |
| **[formatter-utilities.md](formatter-utilities.md)** | Formatter and utility functions reference | ~600 |

### **Reference Documents** (~200-210 lines each)
| Document | Purpose | Lines |
|----------|---------|-------|
| **[schema-simplifications.md](schema-simplifications.md)** | Recent schema changes and migration | ~210 |

## 🎯 **Key Capabilities**

- ✅ **Complete bonus type system** matching D&D 3.x stacking rules
- ✅ **Conditional modifiers** with runtime token evaluation
- ✅ **Flexible choice system** (single/multiple/allocation)
- ✅ **Level-based progression** with automatic upgrades
- ✅ **Spellcasting integration** with slot management
- ✅ **Prerequisite validation** with extensible types

## 📈 **System Status**

- **Current Coverage**: 85% of D&D 3.x features
- **Target Coverage**: 95%+ with planned enhancements
- **Schema Status**: Simplified and optimized
- **API Status**: Bulk operations only, no individual CRUD
- **Documentation Status**: Focused and AI-friendly (~2,500 total lines)

## 🔧 **Quick Examples**

### **Simple Ability Bonus**
```typescript
{
    type: ModifierType.Bonus,
    appliesTo: ModifierAppliesToType.Attribute,
    appliesToId: ABILITY_MAP.STR,
    value: 2,
    bonusType: FeatureBonusType.Racial
}
```

### **Conditional Bonus**
```typescript
{
    type: ModifierType.Bonus,
    appliesTo: ModifierAppliesToType.Attack,
    value: 2,
    bonusType: FeatureBonusType.Other,
    conditions: [{ type: 'other', value: 'target_is_favored_enemy' }]
}
```

### **Player Choice**
```typescript
{
    choiceType: ChoiceType.Feat,
    choiceBehavior: ChoiceBehavior.Single,
    appliesToType: FeatureAppliesToType.Feat,
    label: "Choose a fighter bonus feat"
}
```

For complete examples, see **[class-features.md](class-features.md)** and **[racial-features.md](racial-features.md)**.

## 📊 **Documentation Improvements**

### **Before (Disaster)**
- **30+ files** with overlapping content
- **Inconsistent naming** (01-, 02-, 14-, 15-, etc.)
- **Massive files** (up to 839 lines)
- **No clear structure** or navigation
- **Redundant content** across multiple files

### **After (Clean & Focused)**
- **12 focused documents** with clear purposes
- **Consistent naming** (no numbered prefixes)
- **AI-friendly sizes** (~150-285 lines each)
- **Clear navigation** and cross-references
- **No redundancy** - each document has a unique purpose

### **Benefits**
- **Easier to maintain** and update
- **Better for AI consumption** (focused, digestible)
- **Clearer for developers** (logical organization)
- **Reduced cognitive load** (no overlapping content)
- **Future-proof structure** (easy to add new documents)

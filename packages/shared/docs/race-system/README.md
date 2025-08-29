# Race System

*Complete documentation for race definitions, racial features, and racial trait management in D&D Tools.*

## 📋 **Quick Navigation**

### **Getting Started**
- **[race-definitions.md](race-definitions.md)** — Race creation and management
- **[racial-features.md](racial-features.md)** — Racial traits and abilities
- **[race-integration.md](race-integration.md)** — Integration with character creation

### **Database Schema**
- **[database-schema.md](database-schema.md)** — Race-related database models and relationships
- **[validation-schemas.md](validation-schemas.md)** — Zod validation schemas and type safety
- **[static-data.md](static-data.md)** — Race-related static data and reference tables

### **Implementation**
- **[backend-implementation.md](backend-implementation.md)** — Backend services, controllers, and API endpoints
- **[frontend-components.md](frontend-components.md)** — Frontend React components and user interfaces
- **[architecture-principles.md](architecture-principles.md)** — System architecture and design principles

## 🎯 **System Overview**

The race system manages all aspects of character races, including base race definitions, racial features, and integration with the character creation process. Races provide the foundation for character identity and often grant unique abilities.

> **💡 See [System Overview](../system-overview.md) for how the Race System integrates with the Feature System and Character Management.**

### **Core Architecture**
```
Race (Race Definition)
├── RaceSourceMap (Source Book References)
└── FeatureProgression (Racial Features)
    ├── FeatureModifier (Racial Bonuses)
    ├── FeatureChoice (Racial Choices)
    └── FeatureSpecialEffect (Racial Abilities)
```

### **Key Principles**
- **Base Statistics**: Races provide size, speed, and favored class information
- **Racial Features**: Races grant unique abilities through the feature system
- **Source Attribution**: All racial content is properly attributed to source books
- **Character Integration**: Races integrate seamlessly with character creation
- **Consolidated Backend**: Uses FeatureSystemService for all FeatureProgression management

### **Backend FeatureProgression Integration**
The race system integrates with the feature system through a consolidated backend architecture:

- **FeatureSystemService**: Central service handling all FeatureProgression creation, deletion, and management
- **RaceService**: Consumer service that calls consolidated methods instead of duplicating logic
- **Single Source of Truth**: All FeatureProgression operations go through FeatureSystemService
- **Transaction Safety**: Consistent transaction patterns across all services

**Related Documentation:**
- [Feature System Documentation](../feature-system/README.md) - Complete feature system overview
- [FeatureProgression Management](../feature-system/feature-progression-management.md) - Detailed FeatureProgression management
- [Schema Reference](../feature-system/schema-reference.md) - Feature system schema definitions

## 🚀 **Getting Started**

### **For New Team Members**
1. Start with **[race-definitions.md](race-definitions.md)** for race creation
2. Review **[schema-reference.md](schema-reference.md)** for database structure
3. Study **[racial-features.md](racial-features.md)** for trait implementation
4. Use **[race-integration.md](race-integration.md)** for character integration

### **For Race Implementation**
1. **Create race definition** following **[race-definitions.md](race-definitions.md)**
2. **Implement racial features** using **[racial-features.md](racial-features.md)**
3. **Set up character integration** as shown in **[race-integration.md](race-integration.md)**
4. **Use the feature system** for all racial abilities

## 📚 **Documentation Structure**

### **Architecture and Design** (~200-400 lines each)
| Document | Purpose | Lines |
|----------|---------|-------|
| **[architecture-principles.md](architecture-principles.md)** | System architecture and design principles | ~350 |
| **[database-schema.md](database-schema.md)** | Database models and relationships | ~200 |
| **[validation-schemas.md](validation-schemas.md)** | Zod validation schemas and type safety | ~150 |
| **[static-data.md](static-data.md)** | Static data and reference tables | ~180 |

### **Implementation Documentation** (~200-400 lines each)
| Document | Purpose | Lines |
|----------|---------|-------|
| **[backend-implementation.md](backend-implementation.md)** | Backend services, controllers, and API | ~250 |
| **[frontend-components.md](frontend-components.md)** | Frontend React components and UI | ~400 |

### **Functional Guides** (~200-300 lines each)
| Document | Purpose | Lines |
|----------|---------|-------|
| **[race-definitions.md](race-definitions.md)** | Race creation and management | ~250 |
| **[racial-features.md](racial-features.md)** | Racial traits and abilities | ~300 |
| **[race-integration.md](race-integration.md)** | Character creation integration | ~200 |

## 🎯 **Key Capabilities**

- ✅ **Complete race definitions** with all mechanical properties
- ✅ **Racial feature system** with bonuses, choices, and special abilities
- ✅ **Size and speed management** for movement and combat
- ✅ **Favored class tracking** for experience bonuses
- ✅ **Source book attribution** for all content
- ✅ **Character creation integration** with validation

## 📊 **Implementation Status**

### **✅ Well-Implemented Infrastructure**
- **Backend Services**: Complete CRUD operations with full API endpoints
- **Database Schema**: Complete with all relationships and constraints
- **Frontend UI**: Complete race management interface with all functionality
- **Feature Integration**: Full integration with the feature system
- **Documentation**: Comprehensive documentation and examples

### **⚠️ Race Modeling Status**
- ✅ **Core Races Exist**: All 7 core races (Dwarf, Elf, Gnome, Half-Elf, Half-Orc, Halfling, Human) modeled in database
- ✅ **Dwarf Updated**: Dwarf race re-modeled using new feature system for languages and ability adjustments
- ⚠️ **Other Races Need Update**: Elf, Gnome, Half-Elf, Half-Orc, Halfling, Human need feature system migration
- ⚠️ **Conditional Features**: Conditional racial features exist but lack conditional logic implementation
- ❌ **No Race Data File**: Missing `RaceData.ts` file in static-data for reference

### **Implementation Quality**
- **Code Quality**: High - Well-structured, type-safe, comprehensive
- **Feature Completeness**: 60% - Infrastructure complete, races exist but need feature system migration
- **Documentation**: Good - Well-documented with examples
- **UI Completeness**: Complete - Full interface with all functionality

## 🔧 **Quick Examples**

### **Race Definition**
```typescript
const humanRace = {
    name: "Human",
    editionId: 1,
    isVisible: true,
    description: "Humans are the most adaptable and ambitious people...",
    sizeId: 5, // Medium
    speed: 30, // 30 feet
    favoredClassId: 0 // No favored class
};
```

### **Racial Feature**
```typescript
const humanBonusFeat = {
    level: 1,
    featureId: FEATURE_MAP.HUMAN_BONUS_FEAT,
    raceId: RACE_MAP.HUMAN,
    choices: [
        {
            choiceType: ChoiceType.Feat,
            choiceBehavior: ChoiceBehavior.Single,
            label: "Choose any feat for which you meet the prerequisites"
        }
    ]
};
```

For complete examples, see **[race-definitions.md](race-definitions.md)** and **[racial-features.md](racial-features.md)**.

## 🚀 **Future Enhancements**

### **Immediate Priorities**
- **Migrate Race Features**: Update 6 races to new feature system (Elf, Gnome, Half-Elf, Half-Orc, Halfling, Human)
- **Implement Conditional Logic**: Add conditional logic for racial features (e.g., Dwarf stone/metal appraisal)
- **Create Race Data File**: Create `RaceData.ts` file with core race definitions for reference
- **Implement Language System**: Add ModifierAppliesToType.Language support for all races

### **Planned Features**
- **Advanced Racial Features**: More complex racial abilities
- **Race Variants**: Race variant and subrace support
- **Monster Races**: Monster race support with level adjustments
- **Advanced Language System**: Complex language acquisition rules

### **Performance Improvements**
- **Caching**: Enhanced caching strategies
- **Optimization**: Query and component optimization
- **Scalability**: Improved scalability for large datasets

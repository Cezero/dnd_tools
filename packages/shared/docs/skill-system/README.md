# Skill System

*Complete documentation for skill definitions, skill checks, and skill mechanics in D&D Tools.*

## 📋 **Quick Navigation**

### **Getting Started**
- **[skill-definitions.md](skill-definitions.md)** — Skill creation and management
- **[skill-mechanics.md](skill-mechanics.md)** — Skill check rules and mechanics
- **[class-skills.md](class-skills.md)** — Class skill integration and management
- **[character-skills.md](character-skills.md)** — Character skill advancement and ranks

### **Database Schema**
- **[schema-reference.md](schema-reference.md)** — Skill-related database models and relationships

## 🎯 **System Overview**

The skill system manages all aspects of skills in D&D Tools, including skill definitions, skill checks, class skills, and character skill advancement. This system integrates with the class system for class skills and the character system for skill ranks and points.

### **Core Architecture**
```
Skill (Skill Definition)
├── Skill Properties (Ability, Trained Only, Armor Check Penalty)
├── Skill Descriptions (Check, Action, Retry, Special Notes)
├── Class Skills (Feature System Integration)
└── Character Skills (Skill Ranks and Points)
```

### **Key Principles**
- **Comprehensive Skill Data**: Complete skill information including descriptions and mechanics
- **Class Integration**: Skills are tied to specific classes through the feature system
- **Character Advancement**: Characters can invest skill points and track skill ranks
- **Flexible Skill Types**: Support for standard, trained-only, and analog skills

## 📊 **Implementation Status**

### **✅ Well-Implemented Infrastructure**
- **Backend Services**: Complete CRUD operations with full API endpoints
- **Database Schema**: Complete with all relationships and constraints
- **Frontend UI**: Complete skill management interface with all functionality
- **Skill Data**: Complete skill database with 46 core skills
- **Documentation**: Comprehensive documentation and examples

### **✅ Skill System Status**
- ✅ **Complete Skill Data**: 46 core skills modeled in `SkillData.ts`
- ✅ **All Skill Types**: Standard skills, trained-only skills, analog skills
- ✅ **Complete Skill Properties**: Ability associations, armor check penalties, retry types
- ✅ **Class Skills Integration**: Class skills implemented through feature system
- ✅ **Character Skill Management**: Skill ranks, points, and calculations

### **Implementation Quality**
- **Code Quality**: High - Well-structured, type-safe, comprehensive
- **Feature Completeness**: 95% - All major features implemented
- **Documentation**: Good - Well-documented with examples
- **UI Completeness**: Complete - Full interface with all functionality

## 🚀 **Getting Started**

### **For New Team Members**
1. Start with **[skill-definitions.md](skill-definitions.md)** for skill creation
2. Review **[schema-reference.md](schema-reference.md)** for database structure
3. Study **[skill-mechanics.md](skill-mechanics.md)** for skill check rules
4. Use **[class-skills.md](class-skills.md)** for class skill management

### **For Skill Implementation**
1. **Create skill definition** following **[skill-definitions.md](skill-definitions.md)**
2. **Set up class skills** using **[class-skills.md](class-skills.md)**
3. **Implement skill mechanics** as shown in **[skill-mechanics.md](skill-mechanics.md)**
4. **Configure character skills** using **[character-skills.md](character-skills.md)**

## 📚 **Documentation Structure**

### **Functional Guides** (~200-300 lines each)
| Document | Purpose | Lines |
|----------|---------|-------|
| **[skill-definitions.md](skill-definitions.md)** | Skill creation and management | ~250 |
| **[skill-mechanics.md](skill-mechanics.md)** | Skill check rules and mechanics | ~300 |
| **[class-skills.md](class-skills.md)** | Class skill integration | ~200 |
| **[character-skills.md](character-skills.md)** | Character skill advancement | ~250 |

### **Schema Reference** (~150-200 lines each)
| Document | Purpose | Lines |
|----------|---------|-------|
| **[schema-reference.md](schema-reference.md)** | Skill-related database models and relationships | ~200 |

## 🎯 **Key Capabilities**

- ✅ **Complete skill definitions** with all mechanical properties
- ✅ **Skill type system** (standard, trained-only, analog)
- ✅ **Ability score associations** for all skills
- ✅ **Class skill management** through feature system
- ✅ **Character skill advancement** with ranks and points
- ✅ **Skill point calculation** with intelligence modifiers
- ✅ **Armor check penalty** tracking and application

## 🔧 **Quick Examples**

### **Skill Definition**
```typescript
const climbSkill = {
    name: "Climb",
    abilityId: 1, // Strength
    trainedOnly: false,
    affectedByArmor: true,
    isAnalog: false,
    description: "Use this skill to climb walls, cliffs, and other steep surfaces...",
    checkDescription: "Check: Climb checks are made against the DC of the surface...",
    actionDescription: "Action: Climbing at one-half your speed is a move action...",
    retryTypeId: 1, // Yes
    retryDescription: "You can retry a failed check...",
    specialNotes: "A successful Climb check lets you move at one-half your speed...",
    synergyNotes: "If you have 5 or more ranks in Jump, you get a +2 bonus on Climb checks...",
    untrainedNotes: "An untrained Climb check is simply a Strength check...",
    restrictionNotes: "You cannot use this skill if you are carrying a heavy load..."
};
```

### **Class Skills Integration**
```typescript
// FeatureProgression for class skills
{
    id: 123,
    featureId: SpecialFeatureId.ClassSkill, // 1
    classId: 5, // Fighter class
    level: 1,
    appliesToType: FeatureAppliesToType.Skill, // 0
    appliesTo: null,
    modifiers: [
        {
            id: 456,
            type: ModifierType.Other, // 3
            appliesTo: ModifierAppliesToType.Skill, // 1
            appliesToId: 1, // Climb skill
            value: 0,
            bonusType: null
        },
        {
            id: 457,
            type: ModifierType.Other,
            appliesTo: ModifierAppliesToType.Skill,
            appliesToId: 2, // Jump skill
            value: 0,
            bonusType: null
        }
    ]
}
```

### **Character Skill Management**
```typescript
const characterSkill = {
    characterId: 1,
    classId: 5, // Fighter
    skillId: 1, // Climb
    pointsSpent: 4, // 4 skill points invested
    ranks: 4, // 4 ranks in Climb
    isClassSkill: true, // Fighter class skill
    totalBonus: 8 // 4 ranks + 3 Str + 1 class skill bonus
};
```

For complete examples, see **[skill-definitions.md](skill-definitions.md)** and **[class-skills.md](class-skills.md)**.

## 🔗 **System Integration**

### **Class System Integration**
- **Class Skills**: Skills are assigned to classes through the feature system
- **Skill Points**: Classes provide skill points per level
- **Class Skill Bonuses**: Class skills get +3 bonus when invested in

### **Character System Integration**
- **Skill Ranks**: Characters invest skill points to gain ranks
- **Skill Calculations**: Total skill bonus = ranks + ability modifier + class skill bonus
- **Skill Point Tracking**: Intelligence modifier affects skill points per level

### **Feature System Integration**
- **Class Skills**: Implemented as feature progressions with modifiers
- **Skill Analog Features**: Special skills like Wild Empathy use feature formulas
- **Skill Bonuses**: Feats and features can provide skill bonuses

## 🎯 **Technical Implementation**

### **Backend Services**
- **`skillService`**: Complete CRUD operations for skill management
- **API Routes**: `/skills` endpoints with full validation
- **Database Integration**: Full Prisma integration with relationships

### **Frontend Components**
- **`SkillEdit.tsx`**: Comprehensive skill creation and editing interface
- **`SkillDetail.tsx`**: Complete skill information display
- **`SkillList.tsx`**: Skill listing with admin controls
- **`SkillsTab.tsx`**: Character skill management interface

### **Data Management**
- **`SkillData.ts`**: Complete skill definitions with 46 core skills
- **Skill Types**: Support for standard, trained-only, and analog skills
- **Skill Properties**: Ability associations, armor penalties, retry types

## 🚀 **Future Enhancements**

### **Planned Features**
- **Skill Synergy System**: Automated synergy bonus calculations
- **Skill Specialization**: Support for skill focus and specialization
- **Skill Prerequisites**: Skill-based feat and class prerequisites
- **Skill Challenges**: Complex skill challenge resolution

### **Performance Optimizations**
- **Skill Calculation Caching**: Cache skill totals for performance
- **Bulk Skill Operations**: Efficient bulk skill updates
- **Skill Search**: Advanced skill filtering and search

This system provides a solid foundation for all skill-related functionality in D&D Tools, with excellent integration across the character, class, and feature systems.

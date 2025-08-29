# Class System Architecture Principles

## Overview

The Class System serves as the primary mechanism for defining a game character's role and abilities in D&D Tools. It acts as a **container and coordinator** for feature assignments, providing the foundation for character progression through level-based advancement, spellcasting capabilities, and mechanical benefits.

Unlike the feature system's complex business logic modeling, the class system focuses on **standardized, formula-driven progression** for fundamental character mechanics while delegating complex abilities to the feature system.

## Core Architectural Principles

### **1. Container-Coordinator Pattern**

The class system follows a **container-coordinator pattern** where classes act as containers for feature assignments and coordinate the relationship between different character aspects.

#### **Primary Responsibilities**
- **Feature Container**: Classes hold collections of features that define character capabilities
- **Progression Coordinator**: Classes coordinate level-based progression across multiple systems
- **Spellcasting Foundation**: Classes provide the foundation for spellcasting capabilities
- **Mechanical Baseline**: Classes establish baseline character mechanics (BAB, saves, hit points)

#### **Delegation Pattern**
```
Class (Container/Coordinator)
├── Feature System (Complex Abilities)
├── Spellcasting System (Magic Capabilities)  
├── Progression System (Level-based Mechanics)
└── Static Data (Formula-driven Calculations)
```

### **2. Formula-Driven Baseline Mechanics**

The system distinguishes between **formula-driven baseline mechanics** (handled by the class system) and **complex feature modeling** (handled by the feature system).

#### **Baseline Mechanics (Class System)**
- **Base Attack Bonus (BAB)**: Three progression types (Good, Average, Poor)
- **Saving Throws**: Two progression types (Good, Poor)
- **Hit Point Progression**: Dice-based random generation
- **Skill Points**: Level-based calculation formulas

#### **Complex Features (Feature System)**
- **Class Features**: Abilities that scale with level
- **Modifiers**: Numeric bonuses and penalties
- **Choices**: Player selections and options
- **Special Effects**: Unique abilities and capabilities

**Architectural Rationale**: Baseline mechanics follow predictable, mathematical patterns that can be efficiently calculated using formulas. Complex features require flexible modeling that benefits from the feature system's sophisticated capabilities.

### **3. Spellcasting System Architecture**

The spellcasting system is built around three core concepts that work together to define magical capabilities.

#### **Core Spellcasting Components**

**SpellcastingProgression**:
- **Purpose**: Models spells per day for each spell level at each class level
- **Usage**: All spellcasting classes have this progression
- **Flexibility**: Also used for "spells known" for spontaneous casters

**ClassSpellsKnown**:
- **Purpose**: Models how many spells a character knows
- **Usage**: Primarily used by spontaneous casters, but may apply to other casting types
- **Relationship**: Complementary to SpellcastingProgression

**SpellLevelMap**:
- **Purpose**: Defines which spells are available to each class and at what level
- **Architecture**: Extension of the spell system, not the class system
- **Usage**: Determines class spell lists and spell level variations

#### **Spellcasting Architecture Pattern**
```
Class (canCastSpells: true)
├── SpellcastingProgression (spells per day)
├── ClassSpellsKnown (spells known - optional)
└── SpellLevelMap (spell availability)
```

### **4. Class Type Distinction**

The system distinguishes between **base classes** and **prestige classes** with different architectural implications.

#### **Base Classes**
- **Progression**: Full 20-level advancement
- **Availability**: Available at character creation
- **Purpose**: Primary character foundation
- **Examples**: Fighter, Wizard, Cleric

#### **Prestige Classes**
- **Progression**: Limited advancement (typically 4-10 levels)
- **Availability**: Requires prerequisites to be met
- **Purpose**: Specialized advancement or class deviation
- **Examples**: Arcane Archer, Duelist, Assassin

**Architectural Impact**: Both types use the same data models but have different business logic for availability, progression limits, and prerequisite checking.

### **5. Feature Integration Architecture**

The class system integrates with the feature system through a **consumer-coordinator relationship**.

#### **Integration Pattern**
```
Class (Coordinator)
├── FeatureProgression (Feature Assignments)
│   ├── FeatureModifier (Numeric Effects)
│   ├── FeatureChoice (Player Selections)
│   └── FeatureSpecialEffect (Unique Abilities)
└── Feature System (Business Logic Engine)
```

#### **Service Layer Abstraction**
**ClassSkillService** and **ClassProficiencyService** provide abstraction layers that:
- **Enforce Modeling Patterns**: Ensure class skills and proficiencies are modeled correctly
- **Streamline User Experience**: Provide simplified interfaces for common operations
- **Maintain Consistency**: Ensure consistent feature system usage across the application

### **6. Static Data vs Database Architecture**

The class system follows the project-wide **static data philosophy** for performance and consistency.

#### **Static Data Strategy**
- **CLASS_MAP**: Frontend-optimized lookup table for basic class information
- **Progression Functions**: Client-side calculation functions for baseline mechanics
- **Performance Benefits**: Reduces API calls and enables efficient frontend operations

#### **Database Strategy**
- **Rich Data**: Complete class definitions with relationships and complex data
- **Feature Integration**: Full feature progression data and spellcasting information
- **Source Attribution**: Source book references and page numbers

**Architectural Rationale**: This dual approach balances performance (static data) with completeness (database) while maintaining consistency across the application.

## Component Architecture

### **Core Components and Relationships**

```mermaid
erDiagram
    Class ||--o{ FeatureProgression : "has many"
    Class ||--o{ SpellcastingProgression : "has many"
    Class ||--o{ ClassSpellsKnown : "has optional"
    Class ||--o{ ClassSourceMap : "has many"
    Class ||--o{ SpellLevelMap : "has many"
    
    SpellcastingProgression ||--o{ SpellcastingSlot : "has many"
    ClassSpellsKnown ||--o{ SpellcastingSlot : "has many"
    
    FeatureProgression ||--o{ FeatureModifier : "has many"
    FeatureProgression ||--o{ FeatureChoice : "has many"
    FeatureProgression ||--o{ FeatureSpecialEffect : "has many"
    
    Class {
        int id PK
        string name
        string abbreviation
        int editionId
        boolean isVisible
        boolean canCastSpells
        boolean isPrestige
        int hitDie
        int skillPoints
        int babProgression
        int fortSaveProgression
        int refSaveProgression
        int willSaveProgression
    }
    
    FeatureProgression {
        int id PK
        int featureId FK
        int sourceType
        int level
        int classId FK
    }
    
    SpellcastingProgression {
        int id PK
        int classId FK
        int level
        int spellcastingAbilityId
        boolean isPreparedCaster
    }
    
    SpellcastingSlot {
        int id PK
        int progressionId FK
        int spellLevel
        int slotsPerDay
        int spellsKnown
    }
    
    ClassSpellsKnown {
        int id PK
        int classId FK
        int level
    }
    
    SpellLevelMap {
        int id PK
        int classId FK
        int spellId FK
        int spellLevel
    }
```

### **Component Responsibilities**

#### **Class (Primary Container)**
- **Dependencies**: None (foundation component)
- **Responsibilities**: 
  - Define core class characteristics
  - Coordinate feature assignments
  - Establish baseline mechanics
  - Provide spellcasting foundation
- **Examples**: Fighter (combat-focused), Wizard (spellcasting-focused)

#### **FeatureProgression (Feature Integration)**
- **Dependencies**: References Class and Feature
- **Responsibilities**:
  - Link features to classes with level requirements
  - Coordinate feature system integration
  - Manage feature scaling and progression
- **Examples**: "Fighter Bonus Feats" at levels 1, 2, 4, 6, etc.

#### **SpellcastingProgression (Magic Foundation)**
- **Dependencies**: References Class
- **Responsibilities**:
  - Define spellcasting capabilities by level
  - Manage spells per day progression
  - Establish casting ability and preparation type
- **Examples**: Wizard spell progression, Sorcerer spell progression

#### **SpellcastingSlot (Spell Level Management)**
- **Dependencies**: References SpellcastingProgression or ClassSpellsKnown
- **Responsibilities**:
  - Track spells per day for each spell level
  - Manage spells known for spontaneous casters
  - Enable precise spellcasting progression
- **Examples**: 4 1st-level spells per day, 2 2nd-level spells known

#### **SpellLevelMap (Spell Availability)**
- **Dependencies**: References Class and Spell
- **Responsibilities**:
  - Define class spell lists
  - Establish spell level variations
  - Enable spell access control
- **Examples**: Magic Missile as 1st-level Wizard spell, 2nd-level Druid spell

## Integration Architecture

### **Feature System Integration**

The class system acts as a **coordinator** for the feature system:

#### **Integration Pattern**
```
Character (Consumer)
├── Class (Coordinator)
│   └── FeatureProgression (Feature Assignments)
└── Feature System (Business Logic Engine)
    ├── FeatureModifier (Calculations)
    ├── FeatureChoice (Selections)
    └── FeatureSpecialEffect (Effects)
```

#### **Data Flow**
1. **Class Definition**: Classes define feature assignments through FeatureProgression
2. **Character Creation**: Characters select classes and levels
3. **Feature Calculation**: Feature system calculates applicable features based on class data
4. **Result Application**: Calculated features are applied to character statistics

### **Spell System Integration**

The class system provides the foundation for spellcasting capabilities:

#### **Integration Pattern**
```
Class (Spellcasting Foundation)
├── SpellcastingProgression (Capability Definition)
├── ClassSpellsKnown (Knowledge Definition)
└── SpellLevelMap (Availability Definition)
    └── Spell System (Spell Definitions)
```

#### **Data Flow**
1. **Class Selection**: Character selects a spellcasting class
2. **Capability Determination**: Class defines spellcasting capabilities
3. **Spell Access**: SpellLevelMap determines available spells
4. **Spell Usage**: Character can cast spells based on class capabilities

## Design Decisions and Rationale

### **1. Formula-Driven Baseline Mechanics**

**Decision**: Keep BAB, saving throws, and hit points as formula-driven calculations in the class system rather than modeling them through the feature system.

**Rationale**:
- **Performance**: Formula calculations are faster than complex feature lookups
- **Simplicity**: Baseline mechanics follow predictable mathematical patterns
- **Foundation**: These mechanics form the foundation that features can modify
- **Consistency**: Ensures consistent baseline across all characters of the same class

### **2. Spellcasting System Separation**

**Decision**: Separate spellcasting progression from general feature progression.

**Rationale**:
- **Complexity**: Spellcasting has unique progression patterns and requirements
- **Flexibility**: Different classes have different spellcasting capabilities
- **Performance**: Spellcasting calculations are frequent and benefit from optimization
- **Clarity**: Keeps spellcasting logic separate from general feature logic

### **3. Service Layer Abstraction**

**Decision**: Create ClassSkillService and ClassProficiencyService as abstraction layers.

**Rationale**:
- **User Experience**: Simplifies common operations for administrators
- **Consistency**: Ensures consistent modeling patterns across the application
- **Maintainability**: Centralizes logic for specific feature types
- **Validation**: Provides opportunity for validation and error checking

### **4. Edition Support Strategy**

**Decision**: Use data separation for different D&D editions.

**Rationale**:
- **Clarity**: Clear separation between edition-specific content
- **Flexibility**: Allows for edition-specific rules and mechanics
- **Maintainability**: Easier to manage and update edition-specific content
- **User Choice**: Enables users to choose their preferred edition

## Extension Points and Future Considerations

### **1. Multi-Edition Support**

The system is designed to support multiple D&D editions:
- **Current Focus**: D&D 3.x (3.0 and 3.5)
- **Future Editions**: 4e will require substantially different data models
- **Extension Strategy**: Edition-specific data separation with shared core models

### **2. Advanced Class Types**

The system can be extended to support:
- **Template Classes**: Character templates that modify existing classes
- **Monster Classes**: Classes designed for monster advancement
- **NPC Classes**: Specialized classes for non-player characters

### **3. Character System Integration**

The class system is designed to integrate with the future character system:
- **Feature Calculation**: Character system will consume class feature data
- **Progression Tracking**: Character system will track class levels and progression
- **Multi-classing**: Character system will handle multiple class combinations

### **4. Performance Optimization**

Future optimizations may include:
- **Caching Strategies**: Enhanced caching for frequently accessed class data
- **Query Optimization**: Optimized database queries for complex class relationships
- **Calculation Caching**: Caching of progression calculations for performance

## Error Handling and Validation

### **Current Approach**

The class system currently has **minimal error handling** for game logic:
- **Configuration Errors**: No validation of conflicting feature configurations
- **Prerequisite Validation**: No validation of class prerequisites
- **Data Integrity**: Basic database constraints and validation

### **Future Considerations**

Error handling will be implemented in the character system:
- **Feature Conflicts**: Character system will detect and report feature conflicts
- **Prerequisite Checking**: Character system will validate class prerequisites
- **User Feedback**: Appropriate error messages for configuration issues

## Performance Considerations

### **Current Performance Strategy**

- **Static Data Caching**: Frontend caching of basic class information
- **Formula Calculations**: Client-side calculation of baseline mechanics
- **Efficient Queries**: Optimized database queries for class relationships

### **Scalability Considerations**

- **Large Class Collections**: System designed to handle hundreds of classes
- **Complex Relationships**: Efficient handling of class-feature-spell relationships
- **Frequent Access**: Optimized for frequent class data access during character creation and leveling

## Summary

The Class System follows a **container-coordinator pattern** that emphasizes:
- **Formula-driven baseline mechanics** for performance and consistency
- **Clear separation of concerns** between class system and feature system
- **Flexible spellcasting architecture** for different casting types
- **Service layer abstraction** for common operations
- **Multi-edition support** through data separation

The system is designed to be **performant**, **maintainable**, and **extensible** while providing a solid foundation for character creation and progression in the D&D Tools application.

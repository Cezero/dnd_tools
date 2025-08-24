# Class System

*Complete documentation for class definitions, spellcasting, and progression systems in D&D Tools.*

## 📋 **Quick Navigation**

### **Getting Started**
- **[class-definitions.md](class-definitions.md)** — Class creation and management
- **[spellcasting-system.md](spellcasting-system.md)** — Spellcasting progression and slot management
- **[progression-calculations.md](progression-calculations.md)** — BAB, saves, and skill point calculations

### **Database Schema**
- **[schema-reference.md](schema-reference.md)** — Class-related database models and relationships

## 🎯 **System Overview**

The class system manages all aspects of character classes, including base class definitions, spellcasting progression, and mechanical calculations like Base Attack Bonus (BAB) and saving throws. This system is **fully implemented** with comprehensive frontend and backend support.

> **💡 See [System Overview](../system-overview.md) for how the Class System integrates with the Feature System and Character Management.**

### **Core Architecture**
```
Class (Class Definition)
├── SpellcastingProgression (Spellcasting by Level)
│   ├── SpellcastingSlot (Spells per Day)
│   └── SpellcastingLink (Feature Integration)
├── SpellLevelMap (Class Spell Lists)
├── ClassSourceMap (Source Book References)
└── FeatureProgression (Class Features)
    ├── FeatureModifier (Numeric Bonuses)
    ├── FeatureChoice (Player Selections)
    └── FeatureSpecialEffect (Non-numeric Effects)
```

### **Key Principles**
- **Progressive Scaling**: BAB, saves, and spellcasting scale with level
- **Spellcasting Integration**: Classes can have different spellcasting types
- **Source Attribution**: All content is properly attributed to source books
- **Feature Integration**: Classes integrate with the feature system
- **Formula Support**: Advanced formula-based progression calculations

## 🚀 **Getting Started**

### **For New Team Members**
1. Start with **[class-definitions.md](class-definitions.md)** for class creation
2. Review **[schema-reference.md](schema-reference.md)** for database structure
3. Study **[spellcasting-system.md](spellcasting-system.md)** for magic mechanics
4. Use **[progression-calculations.md](progression-calculations.md)** for BAB/saves

### **For Class Implementation**
1. **Create class definition** following **[class-definitions.md](class-definitions.md)**
2. **Configure spellcasting** using **[spellcasting-system.md](spellcasting-system.md)**
3. **Add class features** through the feature system
4. **Set progression values** for BAB and saves
5. **Configure skill points** and other class attributes

## 📊 **Implementation Status**

### **✅ Well-Implemented Components**

#### **Backend Services**
- **Complete CRUD Operations**: `classService` with full create, read, update, delete
- **API Routes**: `/classes` endpoints with proper validation
- **Database Integration**: Full Prisma integration with relationships
- **Spellcasting Support**: Spellcasting progression and slot management
- **Feature Integration**: Class features through feature system
- **Formula Support**: Advanced formula-based progression calculations

#### **Frontend Components**
- **Class Management UI**: `ClassEdit.tsx` with comprehensive tab-based interface
- **Class Display**: `ClassDisplay.tsx` with formula expansion and progression tables
- **Class List**: `ClassList.tsx` with generic list integration
- **Service Integration**: `ClassService.ts` with typed API calls
- **Tab Components**: Complete set of tab components for different aspects

#### **Tab System Components**
- **BasicInfoTab**: Core class information with progression preview
- **SkillsTab**: Class skill management with feature integration
- **ProficienciesTab**: Weapon and armor proficiency management
- **FeaturesTab**: Class feature management with formula support
- **SpellcastingTab**: Spellcasting progression management
- **DescriptionTab**: Class description with markdown support

#### **Supporting Components**
- **ClassFeatureAssoc**: Feature association management
- **ClassProficiencyService**: Proficiency management service
- **ClassSkillService**: Skill management service
- **ClassColumns**: List column configuration
- **ClassConfig**: Routing configuration

### **🎯 Key Features**

#### **Class Definition**
- **Core Attributes**: Name, abbreviation, hit die, skill points
- **Spellcasting**: Casting ability, casting type, spell progression
- **Progression Values**: BAB, Fortitude, Reflex, Will save progressions
- **Source Attribution**: Source book references with page numbers
- **Visibility Control**: Public/private class visibility

#### **Spellcasting System**
- **Progression Tracking**: Spell slots by level and spell level
- **Casting Types**: Prepared and spontaneous casting support
- **Feature Integration**: Spellcasting through class features
- **Slot Management**: Individual spell slot configuration

#### **Feature Integration**
- **Formula Support**: Advanced formula-based progression calculations
- **Modifier System**: Numeric bonuses and penalties
- **Choice System**: Player selections and options
- **Special Effects**: Non-numeric effects and abilities
- **Prerequisites**: Feature requirements and conditions
- **Consolidated Backend**: Uses FeatureSystemService for all FeatureProgression management

### **Backend FeatureProgression Integration**
The class system integrates with the feature system through a consolidated backend architecture:

- **FeatureSystemService**: Central service handling all FeatureProgression creation, deletion, and management
- **ClassService**: Consumer service that calls consolidated methods instead of duplicating logic
- **Single Source of Truth**: All FeatureProgression operations go through FeatureSystemService
- **Transaction Safety**: Consistent transaction patterns across all services

**Related Documentation:**
- [Feature System Documentation](../feature-system/README.md) - Complete feature system overview
- [FeatureProgression Management](../feature-system/feature-progression-management.md) - Detailed FeatureProgression management
- [Schema Reference](../feature-system/schema-reference.md) - Feature system schema definitions

#### **Progression Calculations**
- **BAB Progression**: Good (full), Average (3/4), Poor (1/2)
- **Save Progression**: Good (2/3 + 2), Poor (1/3)
- **Skill Points**: Class skill point calculation
- **Formula Integration**: Dynamic progression calculations

### **⚠️ Class Modeling Status**

#### **✅ Completed Classes (7/11)**
- **Barbarian**: Complete modeling with all features (Rage, Uncanny Dodge, Damage Reduction)
- **Bard**: Complete modeling with all features (Bardic Music, Bardic Knowledge)
- **Cleric**: Complete modeling with all features (Turn Undead, Domain Abilities)
- **Druid**: Complete modeling with all features (Wild Empathy, Wild Shape, Nature Sense) - **EXCEPT Animal Companion**
- **Fighter**: Complete modeling with all features (Bonus Feats, Weapon Specialization)
- **Monk**: Complete modeling with all features (Flurry of Blows, Unarmed Strike, Diamond Soul, Wholeness of Body, Bonus Feats)
- **Paladin**: Complete modeling with all features (Divine Grace, Lay on Hands, Turn Undead, Smite Evil, Divine Health) - **EXCEPT Special Mount**

#### **❌ Missing Classes (4/11)**
- **Ranger**: **NOT MODELED** - Missing Combat Style choices, Animal Companion, Favored Enemy
- **Rogue**: **NOT MODELED** - Missing Sneak Attack, Trap Sense, Special Abilities
- **Sorcerer**: **NOT MODELED** - Missing Familiar, Metamagic
- **Wizard**: **NOT MODELED** - Missing School Specialization, Familiar, Metamagic

#### **🔴 Missing Feature Systems**
- **Animal Companion System**: Required for Druid and Ranger (depends on monster/NPC system)
- **Familiar System**: Required for Sorcerer and Wizard
- **Companion System**: Required for Paladin Special Mount
- **Language System**: Missing ModifierAppliesToType.Language support
- **Feature-Based Choice System**: Missing for Ranger Combat Styles and Rogue Special Abilities

## 🔧 **Technical Implementation**

### **Frontend Architecture**
```
ClassEdit (Main Container)
├── BasicInfoTab (Core Information)
├── SkillsTab (Skill Management)
├── ProficienciesTab (Proficiency Management)
├── FeaturesTab (Feature Management)
├── SpellcastingTab (Spellcasting Management)
└── DescriptionTab (Description Management)
```

### **Backend Architecture**
```
classController (API Endpoints)
├── classService (Business Logic)
├── classRoutes (Route Definitions)
└── types.ts (Service Interfaces)
```

### **Data Flow**
1. **Class Creation**: Frontend form → API → Database
2. **Class Display**: Database → API → Frontend display
3. **Feature Management**: Feature system integration
4. **Spellcasting**: Spell system integration
5. **Progression**: Formula calculation system

## 📚 **Schema Integration**

### **Core Schemas**
- **Class Schema**: Main class definition with all attributes
- **Spellcasting Schema**: Spellcasting progression and slots
- **Feature Schema**: Feature system integration
- **Source Book Schema**: Source attribution

### **Validation Rules**
- **Required Fields**: Name, abbreviation, hit die, skill points
- **Progression Values**: Valid BAB and save progression types
- **Spellcasting**: Consistent casting ability and type
- **Feature Integration**: Valid feature relationships

## 🎮 **User Interface**

### **Class List View**
- **Generic List Integration**: Advanced filtering and sorting
- **Admin Controls**: Create, edit, delete operations
- **Feature Management**: Integrated feature list for admins
- **Navigation**: Seamless navigation between views

### **Class Edit Interface**
- **Tab-Based Layout**: Organized by functional areas
- **Real-Time Validation**: Form validation with error display
- **Progression Preview**: Live preview of class progression
- **Feature Integration**: Seamless feature management
- **Formula Support**: Advanced formula input and preview

### **Class Display Interface**
- **Comprehensive View**: All class information displayed
- **Progression Tables**: Detailed progression by level
- **Feature Display**: Feature descriptions with formulas
- **Spellcasting Info**: Spell progression and slot information
- **Source Attribution**: Source book references

## 🔗 **System Integration**

### **Feature System Integration**
- **Feature Progression**: Level-based feature grants
- **Formula Support**: Advanced progression calculations
- **Modifier System**: Numeric bonuses and penalties
- **Choice System**: Player selections and options
- **Special Effects**: Non-numeric effects

### **Spell System Integration**
- **Spell Lists**: Class spell access and levels
- **Spellcasting Progression**: Spell slots by level
- **Casting Types**: Prepared vs spontaneous casting
- **Feature Integration**: Spellcasting through features

### **Character System Integration**
- **Character Advancement**: Class level progression
- **Multiclassing**: Multiple class support
- **Feature Application**: Character feature grants
- **Spell Preparation**: Character spell management

## 📈 **Performance Considerations**

### **Database Optimization**
- **Efficient Queries**: Optimized Prisma queries with includes
- **Relationship Loading**: Proper relationship loading strategies
- **Indexing**: Database indexes for performance
- **Caching**: Appropriate caching strategies

### **Frontend Performance**
- **Component Optimization**: Efficient React components
- **State Management**: Proper state management patterns
- **Lazy Loading**: Lazy loading of heavy components
- **Memoization**: Appropriate memoization strategies

## 🔒 **Security and Validation**

### **Input Validation**
- **Schema Validation**: Zod schema validation
- **Business Rules**: Class-specific validation rules
- **Type Safety**: Full TypeScript type safety
- **Error Handling**: Comprehensive error handling

### **Access Control**
- **Admin Requirements**: Admin-only operations
- **Authentication**: Proper authentication checks
- **Authorization**: Role-based access control
- **Data Integrity**: Database constraint enforcement

## 🚀 **Future Enhancements**

### **Immediate Priorities**
- **Complete Class Modeling**: Model remaining 4 core classes (Ranger, Rogue, Sorcerer, Wizard)
- **Animal Companion System**: Implement companion system for Druid and Ranger
- **Familiar System**: Implement familiar system for Sorcerer and Wizard
- **Language System**: Implement language support for race/class features
- **Feature-Based Choice System**: Implement choice system for Ranger Combat Styles and Rogue Special Abilities

### **Planned Features**
- **Advanced Spellcasting**: More complex spellcasting patterns
- **Prestige Classes**: Prestige class support
- **Class Variants**: Class variant and archetype support
- **Advanced Formulas**: More complex progression formulas

### **Performance Improvements**
- **Caching**: Enhanced caching strategies
- **Optimization**: Query and component optimization
- **Scalability**: Improved scalability for large datasets

## 📖 **Related Documentation**

- **[Feature System](../feature-system/README.md)** — Feature system integration
- **[Spell System](../spell-system/README.md)** — Spell system integration
- **[Character System](../character-management/README.md)** — Character system integration
- **[Frontend Components](../frontend-components/README.md)** — Frontend component patterns

# Character Management System

*Complete documentation for character creation, advancement, and management in D&D Tools.*

## 📋 **Quick Navigation**

### **Core Documentation**
- **[architecture-principles.md](architecture-principles.md)** — System architecture and design rationale
- **[database-schema.md](database-schema.md)** — Prisma models and relationships
- **[validation-schemas.md](validation-schemas.md)** — Zod validation schemas
- **[backend-implementation.md](backend-implementation.md)** — Backend services and API
- **[frontend-components.md](frontend-components.md)** — Frontend React components

### **Specialized Documentation**
- **[character-creation.md](character-creation.md)** — Character creation workflow and validation
- **[character-advancement.md](character-advancement.md)** — Leveling up and multiclassing
- **[character-sheet.md](character-sheet.md)** — Character sheet display and calculations
- **[character-integration.md](character-integration.md)** — Integration with other game systems

## 🎯 **System Overview**

The character management system handles all aspects of character creation, advancement, and data persistence. Characters are the central entity that connects all other game systems, serving as the foundation for player progression and game mechanics.

> **💡 See [Character System Integration](character-integration.md) for how the Character Management System integrates with other game systems.**

### **Core Architecture**
```
UserCharacter (Character Definition)
├── UserCharacterAbilityScore (Ability Scores)
├── CharacterAdvancement (Level Progression)
│   ├── AdvancementSkill (Skill Points)
│   ├── AdvancementFeat (Feat Selections)
│   ├── AdvancementSpell (Spells Known)
│   └── CharacterFeatureChoice (Feature Choices)
├── CharacterItem (Equipment)
└── CharacterSpellPreparation (Prepared Spells)
```

### **Key Principles**
- **User Ownership**: Characters belong to specific users with proper access control
- **Progressive Advancement**: Level-by-level character development with choice tracking
- **Multiclassing Support**: Multiple classes per character with secondary class support
- **Choice Persistence**: All player choices are persisted and tracked
- **Equipment Integration**: Full item and property system integration
- **Spell Management**: Complete spell preparation and metamagic system

## 🚀 **Getting Started**

### **For New Team Members**
1. Start with **[architecture-principles.md](architecture-principles.md)** for system design understanding
2. Review **[database-schema.md](database-schema.md)** for data structure overview
3. Study **[backend-implementation.md](backend-implementation.md)** for API usage
4. Explore **[frontend-components.md](frontend-components.md)** for UI patterns
5. Examine **[character-creation.md](character-creation.md)** for creation workflows

### **For Developers**
- **Backend**: Review `backend/src/features/character/` for service and controller patterns
- **Frontend**: Review `frontend/src/features/character/` for component implementation
- **Schema**: Review `shared/schema/src/character.ts` for validation rules
- **Calculation**: Review `backend/src/features/characterCalculation/` for stat calculations

### **For System Integration**
- **Race System**: See **[Race System Integration](../race-system/character-integration.md)**
- **Class System**: See **[Class System Integration](../class-system/character-integration.md)**
- **Feat System**: See **[Feat System Integration](../feat-system/character-integration.md)**
- **Feature System**: See **[Feature System Integration](../feature-system/character-integration.md)**

## 🏗️ **System Architecture**

The character management system follows a layered architecture that separates concerns and enables efficient data management:

### **Data Layer**
- **Database Models**: Prisma models for character persistence and relationships
- **Validation Schemas**: Zod schemas for type safety and data validation
- **Calculation Services**: Character stat calculation and derived values

### **Business Logic Layer**
- **Backend Services**: Business logic for character operations and data management
- **API Controllers**: HTTP request handling and response formatting
- **Integration Services**: Cross-system integration with races, classes, feats, and features

### **Presentation Layer**
- **Frontend Components**: React components for character management and display
- **API Client**: Type-safe API client for frontend-backend communication
- **UI Patterns**: Consistent user interface patterns and interactions

## 📊 **Implementation Status**

### **✅ Complete Infrastructure**
- **Database Schema**: Complete with all relationships and constraints
- **Validation Schemas**: Comprehensive Zod validation for all character data
- **Backend Services**: Complete CRUD operations with full API endpoints
- **Frontend UI**: Complete character management interface with tab-based editing
- **API Integration**: Type-safe API client with comprehensive error handling

### **✅ Character System Features**
- **Complete Character Structure**: Characters with ability scores, advancement, and relationships
- **Ability Score Management**: Complete ability score tracking and calculation
- **Advancement System**: Level-by-level character progression with choice tracking
- **Multiclassing Support**: Primary and secondary class support
- **Skill Management**: Skill point allocation and advancement tracking
- **Feat Integration**: Character feat selection and prerequisite validation
- **Spell Management**: Spell preparation and metamagic integration
- **Equipment System**: Character equipment with property application

### **Implementation Quality**
- **Code Quality**: High - Well-structured, type-safe, comprehensive
- **Feature Completeness**: 90% - All major features implemented
- **Documentation**: Good - Well-documented with examples
- **UI Completeness**: Complete - Full interface with tab-based editing

## 🔗 **Cross-System Integration**

### **Race System Integration**
The character system integrates with the race system through character creation and racial abilities:

- **Race Selection**: Characters select races during creation
- **Racial Abilities**: Race features are applied to characters through the feature system
- **Racial Bonuses**: Ability score bonuses and other racial traits are calculated
- **Race Validation**: Race-specific requirements and restrictions are enforced

**Source Files**:
- Database: `prisma/schema.prisma` (UserCharacter.raceId relationship)
- Backend: `backend/src/features/character/` (race integration services)
- Frontend: `frontend/src/features/character/tabs/` (race selection UI)

### **Class System Integration**
The character system integrates with the class system through character advancement:

- **Class Selection**: Characters select classes during advancement
- **Class Features**: Class features are applied through the feature system
- **Spellcasting**: Class spellcasting progression is tracked
- **Multiclassing**: Support for multiple classes per character

**Source Files**:
- Database: `prisma/schema.prisma` (CharacterAdvancement.classId relationship)
- Backend: `backend/src/features/character/` (class integration services)
- Frontend: `frontend/src/features/character/tabs/` (class selection UI)

### **Feat System Integration**
The character system integrates with the feat system through character advancement:

- **Feat Selection**: Characters select feats during advancement
- **Prerequisite Validation**: Automatic validation of feat prerequisites
- **Feat Benefits**: Feat benefits are applied to character statistics
- **Fighter Bonus Feats**: Special handling for fighter bonus feats

**Source Files**:
- Database: `prisma/schema.prisma` (AdvancementFeat relationship)
- Backend: `backend/src/features/character/` (feat integration services)
- Frontend: `frontend/src/features/character/tabs/` (feat selection UI)

### **Feature System Integration**
The character system integrates with the feature system through character choices:

- **Feature Choices**: Characters make choices for features during advancement
- **Feature Application**: Features are applied to characters through the feature system
- **Choice Tracking**: All player choices are persisted and tracked
- **Feature Benefits**: Feature benefits are calculated and applied

**Source Files**:
- Database: `prisma/schema.prisma` (CharacterFeatureChoice relationship)
- Backend: `backend/src/features/character/` (feature integration services)
- Frontend: `frontend/src/features/character/tabs/` (feature choice UI)

### **Equipment System Integration**
The character system integrates with the equipment system through character items:

- **Equipment Ownership**: Characters own customized instances of items
- **Property Application**: Item properties are applied to character equipment
- **Equipment Management**: Character equipment is tracked and managed
- **Cost Calculations**: Equipment costs and property costs are calculated

**Source Files**:
- Database: `prisma/schema.prisma` (CharacterItem relationship)
- Backend: `backend/src/features/character/` (equipment integration services)
- Frontend: `frontend/src/features/character/tabs/` (equipment management UI)

### **Spell System Integration**
The character system integrates with the spell system through spell preparation:

- **Spell Preparation**: Characters prepare spells for casting
- **Metamagic Integration**: Metamagic feats are applied to prepared spells
- **Spellcasting Progression**: Class spellcasting progression is tracked
- **Spell Management**: Character spell lists and preparation are managed

**Source Files**:
- Database: `prisma/schema.prisma` (CharacterSpellPreparation relationship)
- Backend: `backend/src/features/character/` (spell integration services)
- Frontend: `frontend/src/features/character/tabs/` (spell management UI)

## 📋 **Development Guidelines**

### **Adding New Character Features**
1. **Database**: Add character-related models and relationships
2. **Validation**: Create Zod validation schemas for new data
3. **Backend**: Implement services and controllers for new functionality
4. **Frontend**: Create UI components for new features
5. **Testing**: Test new functionality across all systems

### **Modifying Character Data**
1. **Validation**: Ensure changes comply with D&D 3.5 rules
2. **Relationships**: Update all related data consistently
3. **Calculations**: Update character calculation services
4. **Testing**: Verify character functionality across all systems
5. **Documentation**: Update documentation for significant changes

### **Performance Considerations**
- **Large Character Data**: System handles complex character data efficiently
- **Calculation Optimization**: Character stat calculations are optimized
- **Relationship Loading**: Efficient loading of character relationships
- **UI Performance**: Frontend components optimized for complex character data

## 🔧 **Quick Reference**

### **Key Source Files**
- **Database Schema**: `prisma/schema.prisma` (Character-related models)
- **Validation Schemas**: `shared/schema/src/character.ts`
- **Backend Services**: `backend/src/features/character/`
- **Frontend Components**: `frontend/src/features/character/`
- **API Client**: `frontend/src/features/character/CharacterApi.ts`
- **Calculation Services**: `backend/src/features/characterCalculation/`

### **Key Data Structures**
- **Character**: UserCharacter with ability scores, advancement, and relationships
- **Advancement**: CharacterAdvancement with skills, feats, spells, and feature choices
- **Ability Scores**: UserCharacterAbilityScore with calculated modifiers
- **Equipment**: CharacterItem with applied properties
- **Spell Preparation**: CharacterSpellPreparation with metamagic integration

### **API Endpoints**
- **GET /characters**: Retrieve all characters for current user
- **GET /characters/:id**: Retrieve specific character by ID
- **GET /characters/:id/details**: Retrieve character with all details
- **POST /characters**: Create new character
- **PUT /characters/:id**: Update existing character
- **DELETE /characters/:id**: Delete character

## 📚 **Related Documentation**

### **System Documentation**
- **[Race System](../race-system/README.md)** — Race system and character integration
- **[Class System](../class-system/README.md)** — Class system and character integration
- **[Feat System](../feat-system/README.md)** — Feat system and character integration
- **[Feature System](../feature-system/README.md)** — Feature system and character integration
- **[Equipment System](../equipment-system/README.md)** — Equipment system and character integration
- **[Spell System](../spell-system/README.md)** — Spell system and character integration

### **Application Overview**
- **[Database Schema Patterns](../application-overview/database-schema.md)** — Shared database patterns
- **[Validation Schemas Overview](../application-overview/validation-schemas.md)** — Shared validation patterns
- **[Backend Implementation Patterns](../application-overview/backend-implementation.md)** — Shared backend patterns
- **[Frontend Components Overview](../application-overview/frontend-components.md)** — Shared frontend patterns

## Summary

The character management system provides comprehensive character creation, advancement, and management functionality. The system serves as the central hub that connects all other game systems, enabling complex character progression and customization.

The implementation demonstrates excellent integration with race, class, feat, feature, equipment, and spell systems, providing a robust and flexible foundation for character management in the D&D Tools application.

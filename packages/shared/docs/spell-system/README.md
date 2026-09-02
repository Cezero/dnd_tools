# Spell System

*Complete documentation for spell definitions, spellcasting, and magical effects in D&D Tools.*

## 📋 **Quick Navigation**

### **Core Documentation**
- **[architecture-principles.md](architecture-principles.md)** — System architecture and design rationale
- **[database-schema.md](database-schema.md)** — Prisma models and relationships
- **[validation-schemas.md](validation-schemas.md)** — Zod validation schemas
- **[static-data.md](static-data.md)** — Spell data structures and enums
- **[backend-implementation.md](backend-implementation.md)** — Backend services and API
- **[frontend-components.md](frontend-components.md)** — Frontend React components

### **Specialized Documentation**
- **[spell-mechanics.md](spell-mechanics.md)** — Spell casting mechanics and rules
- **[spell-preparation.md](spell-preparation.md)** — Spell preparation and metamagic
- **[spell-lists.md](spell-lists.md)** — Class spell lists and spell access
- **[spell-integration.md](spell-integration.md)** — Integration with class and character systems
- **[Variant Class System](../variant-class-system/README.md)** — Variant class spell override integration

## 🎯 **System Overview**

The spell system manages all aspects of magic in D&D Tools, including spell definitions, spellcasting mechanics, spell preparation, and class spell lists. This system integrates with the class system for spellcasting progression and the character system for spell preparation.

> **💡 See [Class System Spellcasting](../class-system/spellcasting-system.md) for how the Spell System integrates with the Class System.**

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
- **D&D 3.5 Compliance**: Complete adherence to D&D 3.5 spell rules and mechanics
- **Variant Class Support**: Spell lists can be modified for variant classes through overrides

### **Variant Class Integration**

The Spell System integrates with the [Variant Class System](../variant-class-system/README.md) to support spell list modifications for variant classes. The integration uses an override-based approach that allows variant classes to add or remove spells from their base class spell lists.

**Integration Points**:
- **Spell Override System**: Variant classes can add or remove spells from their spell lists
- **Level-Based Organization**: Spells are organized by level with support for additions and removals
- **Unified Resolution**: The `getSpellsForClass()` endpoint automatically resolves variant spell lists
- **Override Management**: Frontend components provide intuitive spell list management for variants
- **Display Integration**: Variant spell modifications are displayed in class detail views

**Related Documentation**:
- [Variant Class System](../variant-class-system/README.md) - Complete variant class system overview
- [Variant Class Spell Overrides](../variant-class-system/frontend-implementation.md) - Frontend spell override management
- [Variant Class Backend Implementation](../variant-class-system/backend-implementation.md) - Backend spell resolution

## 🚀 **Getting Started**

### **For New Team Members**
1. Start with **[architecture-principles.md](architecture-principles.md)** for system design understanding
2. Review **[database-schema.md](database-schema.md)** for data structure overview
3. Examine **[static-data.md](static-data.md)** for spell data organization
4. Study **[backend-implementation.md](backend-implementation.md)** for API usage
5. Explore **[frontend-components.md](frontend-components.md)** for UI patterns

### **For Developers**
- **Backend**: Review `backend/src/features/spell/` for service and controller patterns
- **Frontend**: Review `frontend/src/features/spell/` for component implementation
- **Schema**: Review `shared/schema/src/spell.ts` for validation rules
- **Static Data**: Review `shared/static-data/src/SpellData.ts` for spell data structures

### **For System Integration**
- **Class System**: See **[Class System Spellcasting](../class-system/spellcasting-system.md)**
- **Character System**: See **[Character Spell Preparation](../character-system/spell-preparation.md)**
- **Feature System**: See **[Feature System Integration](../feature-system/spell-integration.md)**

## 🏗️ **System Architecture**

The spell system follows a layered architecture that separates concerns and enables efficient data management:

### **Data Layer**
- **Database Models**: Prisma models for spell persistence and relationships
- **Validation Schemas**: Zod schemas for type safety and data validation
- **Static Data**: Enums and reference data for spell categorization

### **Business Logic Layer**
- **Backend Services**: Business logic for spell operations and data management
- **API Controllers**: HTTP request handling and response formatting
- **Integration Services**: Cross-system integration with classes and characters

### **Presentation Layer**
- **Frontend Components**: React components for spell management and display
- **API Client**: Type-safe API client for frontend-backend communication
- **UI Patterns**: Consistent user interface patterns and interactions

## 📊 **Implementation Status**

### **✅ Complete Infrastructure**
- **Database Schema**: Complete with all relationships and constraints
- **Validation Schemas**: Comprehensive Zod validation for all spell data
- **Static Data**: Extensive spell database with 2,800+ spells and complete categorization
- **Backend Services**: Complete CRUD operations with full API endpoints (except creation)
- **Frontend UI**: Complete spell management interface with all functionality
- **API Integration**: Type-safe API client with comprehensive error handling

### **⚠️ Implementation Gaps**
- **Missing Creation Endpoint**: No POST endpoint for creating new spells
- **Limited Documentation**: Comprehensive documentation needed
- **Integration Testing**: Cross-system integration testing needed

### **Implementation Quality**
- **Code Quality**: High - Well-structured, type-safe, comprehensive
- **Feature Completeness**: 95% - Infrastructure complete, extensive spell data, missing creation endpoint
- **Documentation**: In Progress - Basic structure exists, needs comprehensive expansion
- **UI Completeness**: Complete - Full interface with all functionality

## 🔗 **Cross-System Integration**

### **Class System Integration**
The spell system integrates with the class system through spell lists and spellcasting progression:

- **SpellLevelMap**: Links spells to classes with level requirements
- **SpellcastingProgression**: Manages spellcasting capabilities by class level
- **Class Spell Lists**: Determines which spells are available to each class

**Source Files**:
- Database: `prisma/schema.prisma` (SpellLevelMap model)
- Backend: `backend/src/features/class/` (spellcasting services)
- Frontend preview: `frontend/src/features/class/tabs/BasicInfoTab.tsx` (Class Features Preview)
- Feature configuration: class Features tab / Feature Edit Form

### **Character System Integration**
The spell system integrates with the character system through spell preparation:

- **CharacterSpellPreparation**: Tracks prepared spells for characters
- **SpellPreparationMetamagic**: Manages metamagic modifications to prepared spells
- **Spell Access**: Determines which spells characters can prepare based on class

**Source Files**:
- Database: `prisma/schema.prisma` (CharacterSpellPreparation, SpellPreparationMetamagic models)
- Backend: `backend/src/features/character/` (spell preparation services)
- Frontend: `frontend/src/features/character/tabs/` (spell preparation UI)

### **Feature System Integration**
The spell system integrates with the feature system through spell-related features:

- **Spellcasting Features**: Features that grant spellcasting abilities
- **Spell-Related Modifiers**: Features that modify spellcasting capabilities
- **Spell Access Features**: Features that grant access to specific spells

**Source Files**:
- Database: `prisma/schema.prisma` (FeatureProgression, FeatureModifier models)
- Backend: `backend/src/features/featureSystem/` (feature services)
- Frontend: `frontend/src/components/feature-system/` (feature UI components)

## 📋 **Development Guidelines**

### **Adding New Spells**
1. **Database**: Add spell record with all required fields
2. **Relationships**: Create appropriate school, descriptor, and component mappings
3. **Class Access**: Add SpellLevelMap entries for class access
4. **Source Attribution**: Add SpellSourceMap entries for proper attribution
5. **Validation**: Ensure all data passes Zod validation
6. **Testing**: Test spell display and functionality

### **Modifying Spell Data**
1. **Validation**: Ensure changes comply with D&D 3.5 rules
2. **Relationships**: Update all related mappings consistently
3. **Source Attribution**: Maintain proper source book references
4. **Testing**: Verify spell functionality across all systems
5. **Documentation**: Update documentation for significant changes

### **Performance Considerations**
- **Large Dataset**: System handles 2,800+ spells efficiently
- **Caching**: Static data provides frontend performance optimization
- **Query Optimization**: Backend queries optimized for complex relationships
- **UI Performance**: Frontend components optimized for large spell lists

## 🔧 **Quick Reference**

### **Key Source Files**
- **Database Schema**: `prisma/schema.prisma` (Spell-related models)
- **Validation Schemas**: `shared/schema/src/spell.ts`
- **Static Data**: `shared/static-data/src/SpellData.ts`
- **Backend Services**: `backend/src/features/spell/`
- **Frontend Components**: `frontend/src/features/spell/`
- **API Client**: `frontend/src/features/spell/SpellQueryHooks.ts`

### **Key Data Structures**
- **Spell Components**: V (Verbal), S (Somatic), M (Material), F (Focus), DF (Divine Focus), X (XP)
- **Spell Schools**: Abjuration, Conjuration, Divination, Enchantment, Evocation, Illusion, Necromancy, Transmutation
- **Spell Descriptors**: Acid, Cold, Fire, Electricity, Sonic, Force, and 16+ others
- **Spell Ranges**: Touch, Close, Medium, Long, and various special ranges

### **API Endpoints**
- **GET /spells**: Retrieve all spells with filtering and pagination
- **GET /spells/:id**: Retrieve specific spell by ID
- **PUT /spells/:id**: Update existing spell
- **DELETE /spells/:id**: Delete spell (admin only)
- **POST /spells**: Create new spell (not implemented)

## 📚 **Related Documentation**

### **System Documentation**
- **[Class System](../class-system/README.md)** — Character classes and spellcasting progression
- **[Character System](../character-system/README.md)** — Character management and spell preparation
- **[Feature System](../feature-system/README.md)** — Feature system and spell-related abilities

### **Shared Documentation**
- **[Database Schema Patterns](../application-overview/database-schema.md)** — Common database patterns
- **[Validation Schema Patterns](../application-overview/validation-schemas.md)** — Common validation patterns
- **[Backend Implementation Patterns](../application-overview/backend-implementation.md)** — Common backend patterns
- **[Frontend Component Patterns](../application-overview/frontend-components.md)** — Common frontend patterns

### **D&D Rules Documentation**
- **[Spell Mechanics](../dnd-rules/v3.x/magic/spell-mechanics/)** — D&D 3.5 spell rules
- **[Spell Format](../dnd-rules/v3.x/magic/spell-mechanics/spell-format.md)** — Standard spell description format
- **[Magic System](../dnd-rules/v3.x/magic/)** — Complete D&D 3.5 magic system

## Summary

The spell system provides comprehensive support for D&D 3.5 spellcasting, including complete spell definitions, class integration, character preparation, and metamagic support. The system is well-implemented with extensive data coverage and follows established architectural patterns for maintainability and extensibility.

For detailed implementation information, refer to the specific documentation files listed above, and always consult the actual source code for the most current implementation details.

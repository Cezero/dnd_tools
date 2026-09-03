# Class System Documentation

*Complete documentation for character classes, spellcasting progression, and class mechanics in D&D Tools.*

## 📋 **Documentation Structure**

This documentation follows a layered approach, building from the database foundation up to the user interface:

### **Core Documentation**
- **[Database Schema](database-schema.md)** — Database structure and relationships for classes
- **[Validation Schemas](validation-schemas.md)** — Data validation rules and type safety
- **[Static Data](static-data.md)** — Reference data, enums, and configuration options
- **[Backend Implementation](backend-implementation.md)** — API services and business logic
- **[Frontend Components](frontend-components.md)** — User interface and interaction patterns

### **Specialized Documentation**
- **[Spellcasting System](spellcasting-system.md)** — Magic system mechanics and progression
- **[Class Progression](class-progression.md)** — Combat and saving throw calculations
- **[Feature Integration](feature-integration.md)** — Class feature system integration
- **[Feature Extraction Patterns](feature-extraction-patterns.md)** — Extracting mechanics from feature progressions
- **[Migration Guide](migration-guide.md)** — Step-by-step migration from direct fields to feature system
- **[Variant Class System](../variant-class-system/README.md)** — Variant class system integration

## 🎯 **System Overview**

The Class System serves as the foundation for character classes in D&D Tools, managing everything from basic class definitions to complex spellcasting progression and feature integration. The system follows a layered architecture that ensures type safety, data integrity, and comprehensive user interface support.

### **Core Architecture**

The class system is built around a central `Class` entity that defines the fundamental characteristics of a character class. Each class can have multiple associated systems:

- **Spellcasting Progression**: Tracks how spellcasting abilities develop with class level
- **Feature Progression**: Manages class features that scale with level
- **Source Attribution**: Links classes to their source books and page references
- **Spell Lists**: Defines which spells are available to each class

### **Feature Formatting Integration**

The Class System integrates with the [Feature Formatting System](../feature-system/formatting/README.md) to display class feature progressions consistently across all user interfaces. Class features with multiple levels and complex progression patterns are formatted using the 6-phase formatting process.

**Integration Points**:
- **Class Feature Display**: Uses `DisplayType.Detail` for class feature progression displays
- **Feature Progression Formatting**: Leverages the formatting system's registry pattern for consistent display
- **Cross-System Consistency**: Ensures class features are formatted the same way as race features and standalone features
- **Entity Precaching**: Uses `usePrecacheFeatureEntities` hook to ensure entity names are available before formatting

**Precaching Requirements**:
Class display components must precache entities (feats, features, spells, domains, classes, skills, races) referenced in class features before formatting. This prevents "name not found" errors when displaying feature progressions.

**Related Documentation**:
- [Feature Formatting System](../formatting-system/README.md) - Complete formatting system overview
- [Entity Precaching System](../formatting-system/entity-precaching.md) - Entity precaching architecture and usage
- [Feature System Documentation](../feature-system/README.md) - Main feature system documentation

### **Variant Class Integration**

The Class System supports variant classes through reusable feature progressions. Variants are modeled as first-order classes that share progressions with their base class.

**New Approach (Post-Refactoring):**
- **First-Order Classes**: Variants are regular `Class` entries, not separate `ClassVariant` entries
- **Reusable Progressions**: Variants share feature progressions with base class via many-to-many relationship
- **Clone Workflow**: Use "Clone from Base Class" feature to copy progression references
- **Fork When Needed**: Create class-specific copies of progressions when variants need different values
- **No Resolution Logic**: Variants resolve exactly like regular classes through feature system

**Integration Points**:
- **FeatureClassMap**: Many-to-many relationship for shared features
- **Clone Feature**: Backend API endpoint for cloning class features
- **Fork Feature**: Backend API endpoint for forking shared features
- **Unified Resolution**: Variants resolve through standard feature resolution

**Migration Status**:
- ✅ **Complete**: All migrations to feature-based system are complete
- ✅ All application code uses feature-based resolution
- ✅ Backward compatibility code has been removed
- See [Migration History](migration-guide.md) for details of the migration process

**Legacy Approach (Deprecated):**
The old variant class system using `ClassVariant` model is being phased out. See [Variant Class System](../variant-class-system/README.md) for legacy documentation.

**Related Documentation**:
- [Class and Race Feature Refactoring](../application-overview/class-race-feature-refactoring.md) - Complete refactoring overview
- [Feature System - Reusable Progressions](../feature-system/README.md#reusable-feature-progressions) - Reusable progression documentation
- [Variant Class System](../variant-class-system/README.md) - Legacy variant system (being migrated)

### **Layered Implementation**

The system follows a five-layer architecture:

1. **Database Layer** — Prisma models with relationships and constraints
2. **Validation Layer** — Zod schemas for type safety and validation
3. **Static Data Layer** — Reference data, enums, and lookup tables
4. **Backend Layer** — Services, controllers, and API endpoints
5. **Frontend Layer** — React components and user interface

## 🚀 **Getting Started**

### **For Developers**
1. **Database Layer**: Start with **[Database Schema](database-schema.md)** to understand the data model
   - **Source Files**: `apps/backend/prisma/schema.prisma` (Class-related models)
   - **Key Models**: `Class`, `ClassFeature`, `ClassSpellcasting`, `ClassProgression`
   - **Command**: `npx prisma studio` to explore the database schema

2. **Validation Layer**: Review **[Validation Schemas](validation-schemas.md)** for type safety requirements
   - **Source Files**: `packages/shared/schema/src/class.ts`
   - **Key Schemas**: `CreateClassSchema`, `UpdateClassSchema`, `ClassQuerySchema`
   - **Usage**: All API requests are validated using these Zod schemas

3. **Backend Layer**: Study **[Backend Implementation](backend-implementation.md)** for API usage patterns
   - **Source Files**: `apps/backend/src/features/class/` (classService.ts, classController.ts, classRoutes.ts)
   - **API Endpoints**: `GET /classes`, `POST /classes`, `PUT /classes/:id`, `DELETE /classes/:id`
   - **Example**: `GET /classes?editionId=5&isPrestige=false` to get base classes for 3.5E

4. **Frontend Layer**: Explore **[Frontend Components](frontend-components.md)** for UI implementation
   - **Source Files**: `apps/frontend/src/features/class/` (ClassList.tsx, ClassEdit.tsx, ClassDetail.tsx)
   - **API Client**: `apps/frontend/src/features/class/ClassQueryHooks.ts` for canonical query hooks + imperative methods
   - **Example**: `<ClassList editionId={5} onClassSelect={handleSelect} />`

### **For Content Creators**
1. **Mechanical Calculations**: Use **[Class Progression](class-progression.md)** for mechanical calculations
   - **Source Files**: `packages/shared/static-data/src/ClassData.ts` (ProgressionType enum)
   - **Key Functions**: `calculateBAB()`, `calculateSave()`, `calculateSpellSlots()`
   - **Example**: BAB calculation for Fighter 10: `calculateBAB(10, ProgressionType.Good)` returns 9

2. **Magic Mechanics**: Reference **[Spellcasting System](spellcasting-system.md)** for magic mechanics
   - **Source Files**: `packages/shared/static-data/src/CommonData.ts` (CastingType enum)
   - **Casting Types**: `Prepared` (1), `Spontaneous` (2)
   - **Example**: Wizard uses `CastingType.Prepared`, Sorcerer uses `CastingType.Spontaneous`

3. **Class Features**: Review **[Feature Integration](feature-integration.md)** for class features
   - **Source Files**: `apps/backend/prisma/schema.prisma` (Feature, FeatureClassMap models)
   - **Integration**: Classes link to features through `FeatureClassMap` many-to-many relationship
   - **Example**: Fighter's "Weapon Specialization" is a class feature with level-based progression

### **For System Administrators**
1. **API Management**: Check **[Backend Implementation](backend-implementation.md)** for API endpoints
   - **Source Files**: `apps/backend/src/features/class/classRoutes.ts`
   - **Endpoints**: `GET /api/classes`, `POST /api/classes`, `PUT /api/classes/:id`
   - **Authentication**: All endpoints require valid JWT token
   - **Rate Limiting**: 100 requests per minute per IP

2. **Database Management**: Review **[Database Schema](database-schema.md)** for data structure
   - **Source Files**: `apps/backend/prisma/schema.prisma`
   - **Key Tables**: `Class`, `ClassFeature`, `ClassSpellcasting`, `ClassProgression`
   - **Backup**: Daily automated backups with 30-day retention
   - **Migration**: Use `npx prisma migrate dev` for schema changes

3. **Configuration**: Examine **[Static Data](static-data.md)** for configuration options
   - **Source Files**: `packages/shared/static-data/src/ClassData.ts`
   - **Key Data**: `CLASS_MAP`, `ProgressionType`, `CastingType`
   - **Updates**: Static data changes require application restart

## 📊 **Implementation Status**

### **✅ Complete Implementation**

#### **Database Layer**
- **Prisma Models**: Complete class-related models with relationships
- **Data Integrity**: Foreign key constraints and validation
- **Performance**: Optimized queries and indexing

#### **Validation Layer**
- **Zod Schemas**: Type-safe validation for all class operations
- **Error Handling**: Comprehensive validation error messages
- **Type Safety**: Full TypeScript integration

#### **Static Data Layer**
- **Reference Data**: Class-related enums and lookup tables
- **Configuration**: System-wide class settings and defaults
- **Caching**: Frontend-optimized data structures

#### **Backend Layer**
- **CRUD Operations**: Complete create, read, update, delete functionality
- **API Endpoints**: RESTful API with proper HTTP methods
- **Service Layer**: Business logic and data processing
- **Error Handling**: Comprehensive error responses

#### **Frontend Layer**
- **Component Library**: Complete set of React components
- **User Interface**: Tab-based class management interface
- **State Management**: React hooks and context providers
- **Form Validation**: Real-time validation with user feedback

## 🎯 **Key Features**

### **Class Definition**
Classes are defined by their core attributes including name, abbreviation, hit die size, and skill points per level. Each class can be configured as a base class or prestige class, with visibility controls for public or private access.

**Core Attributes**:
- **Name and Abbreviation**: Human-readable identifiers for the class
- **Hit Die**: Determines hit point calculations for characters of this class
- **Skill Points**: Number of skill points gained per level
- **Progression Values**: Base Attack Bonus and saving throw progressions
- **Spellcasting**: Whether the class can cast spells and how

### **Spellcasting System**
The spellcasting system tracks how magical abilities develop as characters gain levels in spellcasting classes. It supports both "spells per day" and "spells known" systems, with flexible progression tracking.

**Key Features**:
- **Level-based Progression**: Spellcasting abilities that scale with class level
- **Slot Management**: Tracking spells per day for each spell level via `SpellcastingProgression` FeatureEntities
- **Spells Known**: Max known per spell level via `SpellsKnownProgression` FeatureEntities (enforced as `maxSpellsKnownByLevel` in character resolution)
- **Feature Integration**: Spellcasting through class features
- **Inheritance**: Spellcasting abilities from other classes
- **Spell Lists**: Class-specific spell availability

**Related**: [Spellcasting System](spellcasting-system.md), [Spell Scribing](../character-management/spell-scribing.md)

### **Feature Integration**
Classes integrate deeply with the feature system, allowing for complex class abilities that scale with level and provide various mechanical benefits.

**Integration Points**:
- **Class Features**: Features that scale with class level
- **Modifier System**: Numeric bonuses and penalties
- **Choice System**: Player selections and options
- **Special Effects**: Non-numeric class abilities
- **Formula Support**: Advanced progression calculations

### **Progression Calculations**
The system automatically calculates character progression based on class level, including combat bonuses, saving throws, and skill points.

**Calculation Types**:
- **Base Attack Bonus**: Combat progression calculations
- **Saving Throws**: Fortitude, Reflex, and Will progressions
- **Skill Points**: Class skill point calculations
- **Formula Engine**: Advanced mathematical progression
- **Level Scaling**: Automatic progression with character level

## 🔗 **System Integration**

### **Feature System**
Classes integrate deeply with the feature system, allowing for complex class abilities that scale with level and provide various mechanical benefits. This integration enables features like "Fighter's Bonus Feats" or "Wizard's Arcane School" abilities.

### **Character Management**
Classes are the foundation for character advancement, providing the framework for level progression and mechanical development. Character advancement tracks levels in each class and calculates derived statistics.

### **Spell System**
Classes define spellcasting capabilities and spell lists, determining what spells are available to characters of each class. This includes both prepared and spontaneous casting systems.

### **Race System**
Classes work with races to provide the complete character foundation, with racial features complementing class abilities. This integration supports multi-classing and prestige class requirements.

## 📝 **Documentation Standards**

### **Layered Approach**
Each layer builds upon the previous layers, ensuring that:
- **Database schema** provides the foundation
- **Validation schemas** ensure type safety
- **Static data** provides reference information
- **Backend implementation** provides business logic
- **Frontend components** provide user interface

### **Completeness**
Documentation covers:
- **Schema definitions** with field descriptions
- **Validation rules** with error messages
- **API endpoints** with request/response examples
- **Component usage** with props and examples
- **Integration patterns** with other systems

### **Maintenance**
- **Version tracking** for schema changes
- **Migration guides** for database updates
- **Breaking changes** documentation
- **Deprecation notices** for old features

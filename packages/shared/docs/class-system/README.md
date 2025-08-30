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

**Related Documentation**:
- [Feature Formatting System](../feature-system/formatting/README.md) - Complete formatting system overview
- [Feature System Documentation](../feature-system/README.md) - Main feature system documentation

### **Layered Implementation**

The system follows a five-layer architecture:

1. **Database Layer** — Prisma models with relationships and constraints
2. **Validation Layer** — Zod schemas for type safety and validation
3. **Static Data Layer** — Reference data, enums, and lookup tables
4. **Backend Layer** — Services, controllers, and API endpoints
5. **Frontend Layer** — React components and user interface

## 🚀 **Getting Started**

### **For Developers**
1. Start with **[Database Schema](database-schema.md)** to understand the data model
2. Review **[Validation Schemas](validation-schemas.md)** for type safety requirements
3. Study **[Backend Implementation](backend-implementation.md)** for API usage patterns
4. Explore **[Frontend Components](frontend-components.md)** for UI implementation

### **For Content Creators**
1. Use **[Class Progression](class-progression.md)** for mechanical calculations
2. Reference **[Spellcasting System](spellcasting-system.md)** for magic mechanics
3. Review **[Feature Integration](feature-integration.md)** for class features

### **For System Administrators**
1. Check **[Backend Implementation](backend-implementation.md)** for API endpoints
2. Review **[Database Schema](database-schema.md)** for data structure
3. Examine **[Static Data](static-data.md)** for configuration options

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
- **Slot Management**: Tracking spells per day for each spell level
- **Feature Integration**: Spellcasting through class features
- **Inheritance**: Spellcasting abilities from other classes
- **Spell Lists**: Class-specific spell availability

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

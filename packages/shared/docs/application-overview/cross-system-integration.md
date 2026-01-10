# Cross-System Integration

*Documentation of how different systems in the D&D Tools application integrate and communicate with each other.*

## 📋 **Overview**

The D&D Tools application consists of multiple interconnected systems that work together to provide comprehensive character management and game mechanics. This document describes the integration patterns, communication mechanisms, and dependencies between systems.

## 🏗️ **Integration Architecture**

### **Core Integration Patterns**

**Service-to-Service Communication**:
- Systems communicate through well-defined service interfaces
- Direct service calls for synchronous operations
- Shared types and schemas ensure type safety across system boundaries
- Error propagation through standard error handling patterns

**Database Integration**:
- Shared Prisma client for database access
- Foreign key relationships enforce referential integrity
- Transaction sharing for multi-system operations
- Consistent data models across systems

**Feature System as Integration Hub**:
- Feature system serves as the core engine for all game mechanics
- Other systems (class, race, domain) integrate through feature progressions
- Consistent feature resolution across all systems
- Single source of truth for feature logic

## 🔗 **System Relationships**

### **Character System Integration**

**Integrates With**:
- **Class System**: Character advancements reference classes
- **Race System**: Characters have race relationships
- **Feature System**: Character resolution uses feature system for all features
- **Spell System**: Character spell preparation and known spells
- **Equipment System**: Character equipment and items
- **Character Resolution System**: Feature resolution and session management

**Integration Points**:
- Character advancements link to classes
- Character race links to race definitions
- Character resolution resolves all features through feature system
- Spell operations integrate with character spell data

### **Class System Integration**

**Integrates With**:
- **Feature System**: All class features managed through feature progressions
- **Spell System**: Class spell lists and spellcasting progression
- **Character System**: Characters advance in classes
- **Variant Class System**: Variant classes modify base classes

**Integration Points**:
- Class features created through feature system service
- Spellcasting progressions link to spell system
- Character advancements reference classes
- Variant classes reference base classes

### **Race System Integration**

**Integrates With**:
- **Feature System**: All racial features managed through feature progressions
- **Character System**: Characters have race relationships
- **Static Data**: Race size, speed, and other attributes reference static data

**Integration Points**:
- Racial features created through feature system service
- Character race selection links to race definitions
- Race attributes use static data enums and maps

### **Feature System Integration**

**Integrates With**:
- **All Systems**: Feature system is used by class, race, domain, and other systems
- **Character Resolution**: Resolves all features for characters
- **Formula System**: Handles feature formulas and calculations

**Integration Points**:
- Feature progressions created by consuming systems
- Feature resolution processes all progressions
- Formula parameters support complex calculations

### **Spell System Integration**

**Integrates With**:
- **Class System**: Class spell lists and spellcasting
- **Domain System**: Domain spell lists
- **Character System**: Character spell preparation and known spells
- **Monster System**: Monster spell-like abilities

**Integration Points**:
- Spell lists linked to classes and domains
- Character spell operations manage spell data
- Monster spells stored in monster definitions

### **Equipment System Integration**

**Integrates With**:
- **Character System**: Character equipment and items
- **Monster System**: Monster equipment
- **Static Data**: Equipment categories and properties reference static data

**Integration Points**:
- Character equipment links to item definitions
- Monster equipment stored in monster data
- Equipment properties use static data enums

## 🔄 **Data Flow Patterns**

### **Character Creation Flow**

1. **Character Creation**: Character service creates base character
2. **Race Selection**: Character links to race definition
3. **Class Advancement**: Character advancement links to class
4. **Feature Resolution**: Character resolution system resolves all features
5. **Feature Processing**: Feature system processes class and race features
6. **Result Assembly**: Complete character with all resolved features

### **Feature Resolution Flow**

1. **Character Data Loading**: Character service loads complete character data
2. **Base Features**: Feature system loads race and class features
3. **User Choices**: Choice resolver processes user selections
4. **Cascading Resolution**: Cascading resolver processes granted features
5. **Final Assembly**: Resolved features compiled into final result

### **Spell Operation Flow**

1. **Character Loading**: Character service loads character with spells
2. **Feature Resolution**: Character resolution resolves features for spell validation
3. **Spell Validation**: Spell service validates spell operations
4. **Character Update**: Character service updates character spell data
5. **Re-resolution**: Character resolution re-resolves features if needed

## 🎯 **Integration Patterns**

### **Service Delegation Pattern**

**Pattern**: Systems delegate operations to specialized services rather than duplicating logic.

**Example**: Class service delegates feature operations to feature system service.

**Benefits**:
- **Consistency**: All systems use same underlying logic
- **Maintainability**: Changes in one place affect all systems
- **Testability**: Services can be tested independently

### **Shared Transaction Pattern**

**Pattern**: Multiple systems participate in single database transactions for data consistency.

**Example**: Character creation with race, class, and ability scores in one transaction.

**Benefits**:
- **Data Consistency**: All related data created together
- **Atomicity**: Operations succeed or fail together
- **Integrity**: Referential integrity maintained

### **Event-Driven Pattern**

**Pattern**: Systems react to changes in other systems through events or callbacks.

**Example**: Character resolution re-runs when character data changes.

**Benefits**:
- **Loose Coupling**: Systems don't need direct dependencies
- **Flexibility**: Easy to add new listeners
- **Scalability**: Events can be processed asynchronously

### **Caching Pattern**

**Pattern**: Systems cache frequently accessed data to improve performance.

**Example**: Monster cache, deity cache, domain cache for list views.

**Benefits**:
- **Performance**: Reduced database queries
- **Scalability**: Better handling of high load
- **User Experience**: Faster response times

## 📊 **Dependency Graph**

```
Character System
  ├── Class System
  │     └── Feature System
  ├── Race System
  │     └── Feature System
  ├── Feature System (core)
  ├── Spell System
  ├── Equipment System
  └── Character Resolution System
        └── Feature System

Domain System
  └── Feature System

Monster System
  ├── Equipment System
  └── Spell System
```

## 🔧 **Integration Best Practices**

### **Service Interface Design**

- **Clear Contracts**: Well-defined interfaces for service communication
- **Type Safety**: Shared types ensure compile-time safety
- **Error Handling**: Consistent error handling across services
- **Documentation**: Clear documentation of service methods

### **Data Consistency**

- **Transactions**: Use transactions for multi-system operations
- **Validation**: Validate data at system boundaries
- **Referential Integrity**: Use foreign keys to enforce relationships
- **Error Recovery**: Proper rollback on errors

### **Performance Optimization**

- **Efficient Queries**: Optimize database queries across systems
- **Caching**: Cache frequently accessed data
- **Lazy Loading**: Load related data only when needed
- **Batch Operations**: Group operations when possible

## 📚 **Related Documentation**

- **[Backend Implementation Patterns](backend-implementation.md)** - Backend integration patterns
- **[Feature System Backend Implementation](../feature-system/backend-implementation.md)** - Feature system integration
- **[Character Management Backend Implementation](../character-management/backend-implementation.md)** - Character system integration
- **[System Architecture Overview](system-architecture.md)** - Overall system architecture

## Summary

Cross-system integration in the D&D Tools application follows established patterns that ensure consistency, maintainability, and performance. The feature system serves as the core integration hub, while other systems integrate through well-defined service interfaces and shared data models.

Key integration principles:
- **Service-Oriented**: Systems communicate through service interfaces
- **Feature System Core**: Feature system is the central integration point
- **Type Safety**: Shared types ensure compile-time safety
- **Transaction Safety**: Multi-system operations use transactions
- **Performance**: Caching and optimization patterns improve performance

The integration architecture supports the complex relationships between game systems while maintaining clear boundaries and separation of concerns.

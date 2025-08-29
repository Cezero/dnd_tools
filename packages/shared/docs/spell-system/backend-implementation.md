# Spell System Backend Implementation

*Complete documentation for the spell system backend implementation, including API services, controllers, and business logic.*

## 📋 **Overview**

The spell system backend implementation provides the API layer for spell management, including CRUD operations, business logic, and data validation. The implementation follows a layered architecture pattern with clear separation of concerns.

The backend implementation follows the shared [Backend Implementation Patterns](../application-overview/backend-implementation.md) with spell-specific business logic and integration patterns.

**Source Files**: 
- Service: `src/features/spell/spellService.ts`
- Controller: `src/features/spell/spellController.ts`
- Routes: `src/features/spell/spellRoutes.ts`
- Types: `src/features/spell/types.ts`

## 🏗️ **Architecture Overview**

The spell system backend follows the shared [Layered Architecture Pattern](../application-overview/backend-implementation.md#layered-architecture-pattern) with spell-specific implementations:

**Routes Layer**: API endpoints for spell management and related operations
**Controller Layer**: Request handling and response formatting for spell operations
**Service Layer**: Spell-specific business logic and data operations
**Database Layer**: Prisma ORM with spell system models

### **Service Architecture**

The spell system uses a service-oriented architecture following the shared [Service-Oriented Architecture](../application-overview/backend-implementation.md#service-oriented-architecture) patterns:

**SpellService**: Central service containing all spell management logic
**Transaction Safety**: Consistent transaction patterns for data integrity
**Relationship Management**: Complex spell relationship handling
**Validation**: Comprehensive validation at all levels using Zod schemas

### **Key Design Principles**

**Spell Management**: Complete CRUD operations for spell definitions
**Relationship Integration**: Integration with schools, subschools, descriptors, and components
**Source Attribution**: Proper source book attribution and page references
**Validation**: Comprehensive validation at all levels using Zod schemas
**Level Mapping**: Integration with class spell level mapping

## 🔧 **Core Service Layer**

### **SpellService**

The central service for all spell management operations, providing comprehensive spell CRUD operations and integration with related systems.

**Purpose**: Provides comprehensive spell management capabilities, from basic spell CRUD to complex integrations with schools, subschools, descriptors, and components.

**Key Responsibilities**:
- **Spell CRUD**: Create, read, update, and delete spell definitions
- **Relationship Management**: Manage spell relationships with schools, subschools, descriptors, and components
- **Source Attribution**: Handle source book references and page numbers
- **Transaction Safety**: Ensure data consistency through proper transaction handling
- **Validation**: Validate spell data and relationships
- **Level Mapping**: Handle class spell level mapping

**Core Methods**:

**getAllSpells**: Retrieves all spells with comprehensive relationship data
- **Parameters**: None
- **Business Logic**: Loads all spells with level mapping, descriptors, schools, subschools, components, and source book information, orders by name
- **Returns**: Array of spells with total count and relationship data

**getSpellById**: Retrieves a specific spell by ID with full related data
- **Parameters**: Spell ID
- **Business Logic**: Loads spell with level mapping, descriptors, schools, subschools, components, and source book information
- **Returns**: Complete spell object with all related data or null

**updateSpell**: Updates an existing spell with complex relationship management
- **Parameters**: Spell ID and updated data
- **Business Logic**: Updates spell data and manages all relationships through transactions
- **Returns**: Success message

**deleteSpell**: Deletes a spell
- **Parameters**: Spell ID
- **Business Logic**: Deletes spell (cascades to relationships)
- **Returns**: Success message

**Source File**: `src/features/spell/spellService.ts`

## 🎯 **Controller Layer**

The spell system controllers follow the shared [Controller Layer Pattern](../application-overview/backend-implementation.md#controller-layer) with spell-specific request handling:

### **SpellController**

**Purpose**: Handles HTTP requests and responses for spell system operations, delegating business logic to the service layer.

**Key Responsibilities**:
- **Request Processing**: Handle incoming HTTP requests with proper validation
- **Response Formatting**: Format responses according to API standards
- **Error Handling**: Provide appropriate error responses and status codes
- **Authentication**: Enforce admin authentication for write operations

**Core Methods**:

**GetAllSpells**: Retrieves all spells
- **Route**: `GET /api/spells`
- **Response**: Array of spells with relationship and source book information

**GetSpellById**: Retrieves a specific spell by ID
- **Route**: `GET /api/spells/:id`
- **Parameters**: Spell ID in URL path
- **Response**: Complete spell with relationships and source book information or 404 error

**UpdateSpell**: Updates an existing spell
- **Route**: `PUT /api/spells/:id`
- **Authentication**: Admin required
- **Body**: Spell update data
- **Response**: Success message

**DeleteSpell**: Deletes a spell
- **Route**: `DELETE /api/spells/:id`
- **Authentication**: Admin required
- **Response**: Success message

**Source File**: `src/features/spell/spellController.ts`

## 🔗 **Routes Layer**

The spell system routes follow the shared [RESTful API Structure](../application-overview/backend-implementation.md#restful-api-structure) with spell-specific endpoints:

### **SpellRoutes**

**Purpose**: Defines API endpoints and request validation for spell system operations.

**Route Structure**:
- **Core Spell Routes**: Standard CRUD operations for spells
- **Spell Integration Routes**: Integration with class spell level mapping

**Route Definitions**:

**Core Spell Routes**:
- `GET /api/spells` - Retrieve all spells
- `GET /api/spells/:id` - Retrieve specific spell by ID
- `PUT /api/spells/:id` - Update existing spell (admin required)
- `DELETE /api/spells/:id` - Delete spell (admin required)

**Authentication**: Admin authentication required for all write operations
**Validation**: All routes use Zod schemas for request validation

**Source File**: `src/features/spell/spellRoutes.ts`

## 🔧 **Business Logic Patterns**

### **Relationship Management**

The spell system manages complex relationships with multiple entities:

**Schools**: Spell schools (Abjuration, Conjuration, etc.)
**Subschools**: Spell subschools (Calling, Creation, etc.)
**Descriptors**: Spell descriptors (Acid, Fire, etc.)
**Components**: Spell components (Verbal, Somatic, Material, etc.)
**Level Mapping**: Class spell level mapping

**Integration Pattern**: The spell service manages complex relationships through database transactions, ensuring data consistency and proper relationship handling.

**Related Documentation**: [Spell System Static Data](static-data.md)

### **Source Attribution**

The spell system handles source book attribution for proper content credit:

**Source Book References**: Spells are linked to their source books
**Page Numbers**: Page references for quick lookup in source material
**Multiple Sources**: Support for spells appearing in multiple sources

**Implementation Pattern**: The system maintains source book references through source map entities, allowing proper attribution and easy lookup of spell origins in published material.

### **Level Mapping Integration**

The spell system integrates with class spell level mapping:

**Class Integration**: Spells are mapped to classes with specific levels
**Level Visibility**: Level mapping includes visibility controls
**Class Spell Lists**: Enables class-specific spell lists

**Integration Pattern**: The spell system manages class spell level mapping, ensuring proper spell availability for different classes and levels.

## 🔗 **Integration Points**

### **Class System Integration**

The spell system integrates with the class system through spell level mapping:

**Level Mapping**: Spells are mapped to classes with specific levels
**Class Spell Lists**: Classes have access to specific spell lists
**Level Visibility**: Controls which spells are visible to which classes
**Spell Progression**: Enables class spell progression systems

**Integration Pattern**: The spell system provides the foundation for class spellcasting, with classes defining which spells they can access and at what levels.

**Related Documentation**: [Class System Backend Implementation](../class-system/backend-implementation.md)

### **Character System Integration**

The spell system provides the foundation for character spellcasting:

**Character Spells**: Characters can learn and cast spells
**Spell Lists**: Characters have access to class spell lists
**Spell Progression**: Character spellcasting follows class progression
**Spell Management**: Characters can manage their known spells

**Integration Pattern**: The spell system provides the framework for character spellcasting, with character classes determining spell access and progression.

**Related Documentation**: [Character Management](../character-management/character-spellcasting.md)

### **Source Book System Integration**

The spell system integrates with the source book system for content attribution:

**Source Attribution**: Spells are properly attributed to source books
**Page References**: Page numbers for quick lookup
**Content Validation**: Source attribution enables content validation
**Multiple Sources**: Support for spells appearing in multiple sources

**Integration Pattern**: The spell system maintains proper source attribution, ensuring all spell content is properly credited and traceable.

**Related Documentation**: [Source Book System](../source-book-system/source-book-system.md)

## 📊 **Error Handling**

The spell system follows the shared [Error Handling Patterns](../application-overview/backend-implementation.md#error-handling) with spell-specific error scenarios:

**Validation Errors**: Zod schema validation errors with detailed field information
**Business Logic Errors**: Spell-specific business rule violations
**Database Errors**: Prisma ORM errors with proper error messages
**Relationship Errors**: Errors from complex relationship management

## 🔧 **Performance Considerations**

The spell system implements performance optimizations following the shared [Performance Optimization](../application-overview/performance-optimization.md) patterns:

**Efficient Queries**: Optimized Prisma queries with proper includes and where clauses
**Relationship Loading**: Efficient loading of complex spell relationships
**Caching**: Appropriate caching for frequently accessed spell data
**Pagination**: Proper pagination for large spell collections

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Spell system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Spell system validation rules and schemas
- **[Static Data](static-data.md)** - Spell system enums and types
- **[Frontend Components](frontend-components.md)** - Spell system frontend implementation
- **[Class System Backend Implementation](../class-system/backend-implementation.md)** - Class system integration
- **[Character Management](../character-management/character-spellcasting.md)** - Character spellcasting integration
- **[Source Book System](../source-book-system/source-book-system.md)** - Source book system integration
- **[Backend Implementation Patterns](../application-overview/backend-implementation.md)** - Shared backend patterns and conventions
- **[Performance Optimization](../application-overview/performance-optimization.md)** - Shared performance optimization strategies

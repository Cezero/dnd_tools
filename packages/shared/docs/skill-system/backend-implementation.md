# Skill System Backend Implementation

*Complete documentation for the skill system backend implementation, including API services, controllers, and business logic.*

## 📋 **Overview**

The skill system backend implementation provides the API layer for skill management, including CRUD operations, business logic, and data validation. The implementation follows a layered architecture pattern with clear separation of concerns.

The backend implementation follows the shared [Backend Implementation Patterns](../application-overview/backend-implementation.md) with skill-specific business logic and integration patterns.

**Source Files**: 
- Service: `src/features/skill/skillService.ts`
- Subtype Service: `src/features/skill/skillSubtypeService.ts`
- Controller: `src/features/skill/skillController.ts`
- Routes: `src/features/skill/skillRoutes.ts`
- Types: `src/features/skill/types.ts`

## 🏗️ **Architecture Overview**

The skill system backend follows the shared [Layered Architecture Pattern](../application-overview/backend-implementation.md#layered-architecture-pattern) with skill-specific implementations:

**Routes Layer**: API endpoints for skill management and related operations
**Controller Layer**: Request handling and response formatting for skill operations
**Service Layer**: Skill-specific business logic and data operations
**Database Layer**: Prisma ORM with skill system models

### **Service Architecture**

The skill system uses a service-oriented architecture following the shared [Service-Oriented Architecture](../application-overview/backend-implementation.md#service-oriented-architecture) patterns:

**SkillService**: Central service containing all skill management logic
**Transaction Safety**: Consistent transaction patterns for data integrity
**Validation**: Comprehensive validation at all levels using Zod schemas
**Error Handling**: Proper error handling and user feedback

### **Key Design Principles**

**Skill Management**: Complete CRUD operations for skill definitions
**Ability Integration**: Integration with the ability system for skill key abilities
**Validation**: Comprehensive validation at all levels using Zod schemas
**Source Attribution**: Proper source book attribution and page references

## 🔧 **Core Service Layer**

### **SkillService**

The central service for all skill management operations, providing comprehensive skill CRUD operations and integration with related systems.

**Purpose**: Provides comprehensive skill management capabilities, from basic skill CRUD to complex integrations with ability and character systems.

**Key Responsibilities**:
- **Skill CRUD**: Create, read, update, and delete skill definitions
- **Ability Integration**: Manage skill key ability relationships
- **Source Attribution**: Handle source book references and page numbers
- **Transaction Safety**: Ensure data consistency through proper transaction handling
- **Validation**: Validate skill data and relationships

**Core Methods**:

**getAllSkills**: Retrieves all skills with ordering and count information
- **Parameters**: None
- **Business Logic**: Loads all skills ordered by name, provides total count
- **Returns**: Array of skills with total count

**getSkillById**: Retrieves a specific skill by ID with full data
- **Parameters**: Skill ID
- **Business Logic**: Loads skill by unique ID, returns null if not found
- **Returns**: Complete skill object or null

**createSkill**: Creates a new skill with validation
- **Parameters**: Complete skill creation data
- **Business Logic**: Creates skill in database, validates all data
- **Returns**: Created skill ID and success message

**updateSkill**: Updates an existing skill
- **Parameters**: Skill ID and updated data
- **Business Logic**: Updates skill data with validation
- **Returns**: Success message

**deleteSkill**: Deletes a skill
- **Parameters**: Skill ID
- **Business Logic**: Deletes skill (cascades to relationships)
- **Returns**: Success message

**getSkillCache**: Retrieves lightweight skill data for frontend caching
- **Parameters**: None
- **Business Logic**: Loads skill data including subtypes and special behavior flags, optimized for frontend use
- **Returns**: Skill cache response with subtypes and flags
- **Includes**: `hasSubtypes`, `usesCustomSubtype`, `hasNoMaxRanks`, `doubleArmorPenalty` flags and subtype arrays

**Source File**: `src/features/skill/skillService.ts`

### **SkillSubtypeService**

Service for managing skill subtypes (Craft and Knowledge subtypes).

**Purpose**: Provides access to skill subtype data stored in the database, replacing hardcoded static data maps.

**Key Responsibilities**:
- **Subtype Retrieval**: Get subtypes for specific skills
- **Subtype Lookup**: Find specific subtypes by ID
- **Database Access**: Direct database queries for subtype data

**Core Methods**:

**getSkillSubtypes**: Retrieves all subtypes for a specific skill
- **Parameters**: Skill ID
- **Business Logic**: Loads all subtypes for the given skill, ordered by name
- **Returns**: Array of skill subtypes

**getSkillSubtypeById**: Retrieves a specific skill subtype
- **Parameters**: Skill ID and subtype ID
- **Business Logic**: Loads specific subtype with validation
- **Returns**: Skill subtype or null if not found

**Source File**: `src/features/skill/skillSubtypeService.ts`

## 🎯 **Controller Layer**

The skill system controllers follow the shared [Controller Layer Pattern](../application-overview/backend-implementation.md#controller-layer) with skill-specific request handling:

### **SkillController**

**Purpose**: Handles HTTP requests and responses for skill system operations, delegating business logic to the service layer.

**Key Responsibilities**:
- **Request Processing**: Handle incoming HTTP requests with proper validation
- **Response Formatting**: Format responses according to API standards
- **Error Handling**: Provide appropriate error responses and status codes
- **Authentication**: Enforce admin authentication for write operations

**Core Methods**:

**GetAllSkills**: Retrieves all skills
- **Route**: `GET /api/skills`
- **Response**: Array of skills with total count

**GetSkillById**: Retrieves a specific skill by ID
- **Route**: `GET /api/skills/:id`
- **Parameters**: Skill ID in URL path
- **Response**: Complete skill or 404 error

**CreateSkill**: Creates a new skill
- **Route**: `POST /api/skills`
- **Authentication**: Admin required
- **Body**: Complete skill creation data
- **Response**: Created skill ID and success message

**UpdateSkill**: Updates an existing skill
- **Route**: `PUT /api/skills/:id`
- **Authentication**: Admin required
- **Body**: Skill update data
- **Response**: Success message

**DeleteSkill**: Deletes a skill
- **Route**: `DELETE /api/skills/:id`
- **Authentication**: Admin required
- **Response**: Success message

**Source File**: `src/features/skill/skillController.ts`

## 🔗 **Routes Layer**

The skill system routes follow the shared [RESTful API Structure](../application-overview/backend-implementation.md#restful-api-structure) with skill-specific endpoints:

### **SkillRoutes**

**Purpose**: Defines API endpoints and request validation for skill system operations.

**Route Structure**:
- **Core Skill Routes**: Standard CRUD operations for skills
- **Skill Integration Routes**: Integration with ability and character systems

**Route Definitions**:

**Core Skill Routes**:
- `GET /api/skills` - Retrieve all skills
- `GET /api/skills/:id` - Retrieve specific skill by ID
- `GET /api/skills-cache` - Retrieve lightweight skill cache data (includes subtypes and flags)
- `POST /api/skills` - Create new skill (admin required)
- `PUT /api/skills/:id` - Update existing skill (admin required)
- `DELETE /api/skills/:id` - Delete skill (admin required)

**Authentication**: Admin authentication required for all write operations
**Validation**: All routes use Zod schemas for request validation

**Source File**: `src/features/skill/skillRoutes.ts`

## 🔧 **Business Logic Patterns**

### **Ability Integration**

The skill system integrates with the ability system for skill key abilities:

**Key Ability**: Each skill has a key ability that determines the ability modifier used
**Ability Validation**: Skill ability IDs are validated against ability system
**Ability Display**: Skills display their key ability information
**Ability Calculation**: Skill checks use ability modifiers for calculations

**Integration Pattern**: The skill system integrates with the ability system to determine skill key abilities, ensuring proper ability modifier usage in skill calculations.

**Related Documentation**: [Ability System Backend Implementation](../ability-system/backend-implementation.md)

### **Character Integration**

The skill system provides the foundation for character skill management:

**Character Skills**: Characters can have skill ranks and bonuses
**Skill Progression**: Character skill progression follows class and level rules
**Skill Checks**: Characters make skill checks using their skill ranks and ability modifiers
**Skill Synergies**: Skills can provide bonuses to other skills

**Integration Pattern**: The skill system provides the framework for character skill management, with character classes and levels determining skill access and progression.

**Related Documentation**: [Character Management Backend Implementation](../character-management/backend-implementation.md)

### **Source Attribution**

The skill system handles source book attribution for proper content credit:

**Source Book References**: Skills are linked to their source books
**Page Numbers**: Page references for quick lookup in source material
**Multiple Sources**: Support for skills appearing in multiple sources

**Implementation Pattern**: The system maintains source book references through source map entities, allowing proper attribution and easy lookup of skill origins in published material.

## 🔗 **Integration Points**

### **Ability System Integration**

The skill system integrates with the ability system through skill key abilities:

**Key Ability**: Each skill has a key ability that determines the ability modifier used
**Ability Validation**: Skill ability IDs are validated against ability system
**Ability Display**: Skills display their key ability information
**Ability Calculation**: Skill checks use ability modifiers for calculations

**Integration Pattern**: The skill system integrates with the ability system to determine skill key abilities, ensuring proper ability modifier usage in skill calculations.

**Related Documentation**: [Ability System Backend Implementation](../ability-system/backend-implementation.md)

### **Character System Integration**

The skill system provides the foundation for character skill management:

**Character Skills**: Characters can have skill ranks and bonuses
**Skill Progression**: Character skill progression follows class and level rules
**Skill Checks**: Characters make skill checks using their skill ranks and ability modifiers
**Skill Synergies**: Skills can provide bonuses to other skills

**Integration Pattern**: The skill system provides the framework for character skill management, with character classes and levels determining skill access and progression.

**Related Documentation**: [Character Management Backend Implementation](../character-management/backend-implementation.md)

### **Feature System Integration**

The skill system integrates with the feature system for skill-related features:

**Skill Bonuses**: Features can provide skill bonuses and modifiers
**Skill Synergies**: Features can provide skill synergy bonuses
**Skill Proficiencies**: Features can grant skill proficiencies
**Skill Specializations**: Features can provide skill specializations

**Integration Pattern**: The skill system integrates with the feature system to handle skill-related features, ensuring proper skill bonus and modifier calculations.

**Related Documentation**: [Feature System Backend Implementation](../feature-system/backend-implementation.md)

## 📊 **Error Handling**

The skill system follows the shared [Error Handling Patterns](../application-overview/backend-implementation.md#error-handling) with skill-specific error scenarios:

**Validation Errors**: Zod schema validation errors with detailed field information
**Business Logic Errors**: Skill-specific business rule violations
**Database Errors**: Prisma ORM errors with proper error messages
**Integration Errors**: Errors from ability and character system integrations

## 🔧 **Performance Considerations**

The skill system implements performance optimizations following the shared [Performance Optimization](../application-overview/performance-optimization.md) patterns:

**Efficient Queries**: Optimized Prisma queries with proper ordering and filtering
**Caching**: Skills-cache endpoint provides lightweight, optimized data for frontend caching
**Pagination**: Proper pagination for large skill collections
**Relationship Loading**: Efficient loading of skill relationships including subtypes
**Selective Fields**: Skills-cache uses selective field loading to minimize data transfer

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Skill system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Skill system validation rules and schemas
- **[Static Data](static-data.md)** - Skill system enums and types
- **[Frontend Components](frontend-components.md)** - Skill system frontend implementation
- **[Ability System Backend Implementation](../ability-system/backend-implementation.md)** - Ability system integration
- **[Character Management Backend Implementation](../character-management/backend-implementation.md)** - Character skill management integration
- **[Feature System Backend Implementation](../feature-system/backend-implementation.md)** - Feature system integration
- **[Backend Implementation Patterns](../application-overview/backend-implementation.md)** - Shared backend patterns and conventions
- **[Performance Optimization](../application-overview/performance-optimization.md)** - Shared performance optimization strategies

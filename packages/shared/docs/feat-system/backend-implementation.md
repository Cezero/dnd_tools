# Feat System Backend Implementation

*Complete documentation for the feat system backend implementation, including API services, controllers, and business logic.*

## 📋 **Overview**

The feat system backend implementation provides the API layer for feat management, including CRUD operations, business logic, and data validation. The implementation follows a layered architecture pattern with clear separation of concerns.

The backend implementation follows the shared [Backend Implementation Patterns](../application-overview/backend-implementation.md) with feat-specific business logic and integration patterns.

**Source Files**: 
- Service: `src/features/feat/featService.ts`
- Controller: `src/features/feat/featController.ts`
- Routes: `src/features/feat/featRoutes.ts`
- Types: `src/features/feat/types.ts`

## 🏗️ **Architecture Overview**

The feat system backend follows the shared [Layered Architecture Pattern](../application-overview/backend-implementation.md#layered-architecture-pattern) with feat-specific implementations:

**Routes Layer**: API endpoints for feat management and related operations
**Controller Layer**: Request handling and response formatting for feat operations
**Service Layer**: Feat-specific business logic and data operations
**Database Layer**: Prisma ORM with feat system models

### **Service Architecture**

The feat system uses a service-oriented architecture following the shared [Service-Oriented Architecture](../application-overview/backend-implementation.md#service-oriented-architecture) patterns:

**FeatService**: Central service containing all feat management logic
**Transaction Safety**: Consistent transaction patterns for data integrity
**Relationship Management**: Complex feat relationship handling
**Validation**: Comprehensive validation at all levels using Zod schemas

### **Key Design Principles**

**Feat Management**: Complete CRUD operations for feat definitions
**Benefit Integration**: Integration with the benefit system for feat effects
**Prerequisite Integration**: Integration with the prerequisite system for feat requirements
**Validation**: Comprehensive validation at all levels using Zod schemas
**Source Attribution**: Proper source book attribution and page references

## 🔧 **Core Service Layer**

### **FeatService**

The central service for all feat management operations, providing comprehensive feat CRUD operations and integration with related systems.

**Purpose**: Provides comprehensive feat management capabilities, from basic feat CRUD to complex integrations with benefits, prerequisites, and character systems.

**Key Responsibilities**:
- **Feat CRUD**: Create, read, update, and delete feat definitions
- **Benefit Management**: Manage feat benefit relationships
- **Prerequisite Management**: Manage feat prerequisite relationships
- **Transaction Safety**: Ensure data consistency through proper transaction handling
- **Validation**: Validate feat data and relationships

**Core Methods**:

**getAllFeats**: Retrieves all feats with ordering and count information
- **Parameters**: None
- **Business Logic**: Loads all feats ordered by name, provides total count
- **Returns**: Array of feats with total count

**featQuery**: Retrieves feats with advanced filtering and relationship loading
- **Parameters**: Query request with query type (proficiency, all)
- **Business Logic**: Loads feats with filtering, includes benefits and prerequisites
- **Returns**: Array of feats with relationships and total count

**getFeatById**: Retrieves a specific feat by ID with full related data
- **Parameters**: Feat ID
- **Business Logic**: Loads feat by unique ID with benefits and prerequisites, returns null if not found
- **Returns**: Complete feat object with relationships or null

**createFeat**: Creates a new feat with validation and relationship management
- **Parameters**: Complete feat creation data including benefits and prerequisites
- **Business Logic**: Creates feat in database with relationships through transactions
- **Returns**: Created feat ID and success message

**updateFeat**: Updates an existing feat with relationship management
- **Parameters**: Feat ID and updated data including benefits and prerequisites
- **Business Logic**: Updates feat data and manages relationships through transactions
- **Returns**: Success message

**deleteFeat**: Deletes a feat
- **Parameters**: Feat ID
- **Business Logic**: Deletes feat (cascades to relationships)
- **Returns**: Success message

**Source File**: `src/features/feat/featService.ts`

## 🎯 **Controller Layer**

The feat system controllers follow the shared [Controller Layer Pattern](../application-overview/backend-implementation.md#controller-layer) with feat-specific request handling:

### **FeatController**

**Purpose**: Handles HTTP requests and responses for feat system operations, delegating business logic to the service layer.

**Key Responsibilities**:
- **Request Processing**: Handle incoming HTTP requests with proper validation
- **Response Formatting**: Format responses according to API standards
- **Error Handling**: Provide appropriate error responses and status codes
- **Authentication**: Enforce admin authentication for write operations

**Core Methods**:

**GetAllFeats**: Retrieves all feats
- **Route**: `GET /api/feats`
- **Response**: Array of feats with total count

**FeatQuery**: Retrieves feats with advanced filtering
- **Route**: `GET /api/feats/query`
- **Parameters**: Query type (proficiency, all)
- **Response**: Array of feats with relationships and total count

**GetFeatById**: Retrieves a specific feat by ID
- **Route**: `GET /api/feats/:id`
- **Parameters**: Feat ID in URL path
- **Response**: Complete feat with relationships or 404 error

**CreateFeat**: Creates a new feat
- **Route**: `POST /api/feats`
- **Authentication**: Admin required
- **Body**: Complete feat creation data
- **Response**: Created feat ID and success message

**UpdateFeat**: Updates an existing feat
- **Route**: `PUT /api/feats/:id`
- **Authentication**: Admin required
- **Body**: Feat update data
- **Response**: Success message

**DeleteFeat**: Deletes a feat
- **Route**: `DELETE /api/feats/:id`
- **Authentication**: Admin required
- **Response**: Success message

**Source File**: `src/features/feat/featController.ts`

## 🔗 **Routes Layer**

The feat system routes follow the shared [RESTful API Structure](../application-overview/backend-implementation.md#restful-api-structure) with feat-specific endpoints:

### **FeatRoutes**

**Purpose**: Defines API endpoints and request validation for feat system operations.

**Route Structure**:
- **Core Feat Routes**: Standard CRUD operations for feats
- **Feat Query Routes**: Advanced querying with filtering
- **Feat Integration Routes**: Integration with benefit and prerequisite systems

**Route Definitions**:

**Core Feat Routes**:
- `GET /api/feats` - Retrieve all feats
- `GET /api/feats/:id` - Retrieve specific feat by ID
- `POST /api/feats` - Create new feat (admin required)
- `PUT /api/feats/:id` - Update existing feat (admin required)
- `DELETE /api/feats/:id` - Delete feat (admin required)

**Feat Query Routes**:
- `GET /api/feats/query` - Query feats with filtering

**Authentication**: Admin authentication required for all write operations
**Validation**: All routes use Zod schemas for request validation

**Source File**: `src/features/feat/featRoutes.ts`

## 🔧 **Business Logic Patterns**

### **Benefit Management**

The feat system manages feat benefits through complex relationship handling:

**Benefit Types**: Skills, saves, proficiencies, and other benefits
**Benefit References**: Links to specific skills, saves, or other entities
**Benefit Amounts**: Numeric values for benefit calculations
**Benefit Indexing**: Ordering of multiple benefits

**Integration Pattern**: The feat service manages complex benefit relationships through database transactions, ensuring data consistency and proper relationship handling.

**Related Documentation**: [Feat System Static Data](static-data.md)

### **Prerequisite Management**

The feat system manages feat prerequisites through complex relationship handling:

**Prerequisite Types**: Abilities, skills, feats, BAB, spellcasting, and more
**Prerequisite References**: Links to specific abilities, skills, feats, or other entities
**Prerequisite Amounts**: Numeric values for prerequisite calculations
**Prerequisite Indexing**: Ordering of multiple prerequisites

**Integration Pattern**: The feat service manages complex prerequisite relationships through database transactions, ensuring data consistency and proper relationship handling.

**Related Documentation**: [Feat System Static Data](static-data.md)

### **Source Attribution**

The feat system handles source book attribution for proper content credit:

**Source Book References**: Feats are linked to their source books
**Page Numbers**: Page references for quick lookup in source material
**Multiple Sources**: Support for feats appearing in multiple sources

**Implementation Pattern**: The system maintains source book references through source map entities, allowing proper attribution and easy lookup of feat origins in published material.

## 🔗 **Integration Points**

### **Character System Integration**

The feat system integrates with the character system through feat selection and prerequisites:

**Feat Selection**: Characters can select and acquire feats
**Prerequisite Validation**: Character abilities and skills are validated against feat prerequisites
**Feat Benefits**: Character abilities are modified by feat benefits
**Feat Progression**: Character feat progression follows level and class rules

**Integration Pattern**: The feat system provides the framework for character feat management, with character abilities and skills determining feat access and progression.

**Related Documentation**: [Character Management Backend Implementation](../character-management/backend-implementation.md)

### **Ability System Integration**

The feat system integrates with the ability system through prerequisites and benefits:

**Ability Prerequisites**: Feats can require minimum ability scores
**Ability Benefits**: Feats can provide ability score bonuses
**Ability Validation**: Ability scores are validated against feat prerequisites
**Ability Calculation**: Ability modifiers are used in feat calculations

**Integration Pattern**: The feat system integrates with the ability system to validate prerequisites and calculate benefits, ensuring proper ability score usage in feat mechanics.

**Related Documentation**: [Ability System Backend Implementation](../ability-system/backend-implementation.md)

### **Skill System Integration**

The feat system integrates with the skill system through prerequisites and benefits:

**Skill Prerequisites**: Feats can require minimum skill ranks
**Skill Benefits**: Feats can provide skill bonuses and proficiencies
**Skill Validation**: Skill ranks are validated against feat prerequisites
**Skill Calculation**: Skill bonuses are calculated from feat benefits

**Integration Pattern**: The feat system integrates with the skill system to validate prerequisites and calculate benefits, ensuring proper skill usage in feat mechanics.

**Related Documentation**: [Skill System Backend Implementation](../skill-system/backend-implementation.md)

### **Feature System Integration**

The feat system integrates with the feature system for feat-related features:

**Feat Prerequisites**: Features can require specific feats
**Feat Benefits**: Features can provide feat-related bonuses
**Feat Progression**: Features can grant additional feats
**Feat Specializations**: Features can provide feat specializations

**Integration Pattern**: The feat system integrates with the feature system to handle feat-related features, ensuring proper feat prerequisite and benefit calculations.

**Related Documentation**: [Feature System Backend Implementation](../feature-system/backend-implementation.md)

## 📊 **Error Handling**

The feat system follows the shared [Error Handling Patterns](../application-overview/backend-implementation.md#error-handling) with feat-specific error scenarios:

**Validation Errors**: Zod schema validation errors with detailed field information
**Business Logic Errors**: Feat-specific business rule violations
**Database Errors**: Prisma ORM errors with proper error messages
**Relationship Errors**: Errors from complex benefit and prerequisite management

## 🔧 **Performance Considerations**

The feat system implements performance optimizations following the shared [Performance Optimization](../application-overview/performance-optimization.md) patterns:

**Efficient Queries**: Optimized Prisma queries with proper includes and where clauses
**Relationship Loading**: Efficient loading of complex feat relationships
**Caching**: Appropriate caching for frequently accessed feat data
**Pagination**: Proper pagination for large feat collections

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Feat system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Feat system validation rules and schemas
- **[Static Data](static-data.md)** - Feat system enums and types
- **[Frontend Components](frontend-components.md)** - Feat system frontend implementation
- **[Character Management Backend Implementation](../character-management/backend-implementation.md)** - Character system integration
- **[Ability System Backend Implementation](../ability-system/backend-implementation.md)** - Ability system integration
- **[Skill System Backend Implementation](../skill-system/backend-implementation.md)** - Skill system integration
- **[Feature System Backend Implementation](../feature-system/backend-implementation.md)** - Feature system integration
- **[Backend Implementation Patterns](../application-overview/backend-implementation.md)** - Shared backend patterns and conventions
- **[Performance Optimization](../application-overview/performance-optimization.md)** - Shared performance optimization strategies

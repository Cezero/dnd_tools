# Class System Backend Implementation

*Complete documentation for the class system backend implementation, including API services, controllers, and business logic.*

## 📋 **Overview**

The class system backend implementation provides the API layer for class management, including CRUD operations, business logic, and data validation. The implementation follows a layered architecture pattern with clear separation of concerns.

The backend implementation follows the shared [Backend Implementation Patterns](../application-overview/backend-implementation.md) with class-specific business logic and integration patterns.

**Source Files**: 
- Service: `src/features/class/classService.ts`
- Controller: `src/features/class/classController.ts`
- Routes: `src/features/class/classRoutes.ts`
- Types: `src/features/class/types.ts`
- Formula Utilities: `src/utils/formulaParamTransformers.ts`

## 🏗️ **Architecture Overview**

The class system backend follows the shared [Layered Architecture Pattern](../application-overview/backend-implementation.md#layered-architecture-pattern) with class-specific implementations:

**Routes Layer**: API endpoints for class management and related operations
**Controller Layer**: Request handling and response formatting for class operations
**Service Layer**: Class-specific business logic and data operations
**Database Layer**: Prisma ORM with class system models

### **Service Architecture**

The class system uses a service-oriented architecture following the shared [Service-Oriented Architecture](../application-overview/backend-implementation.md#service-oriented-architecture) patterns:

**ClassService**: Central service containing all class management logic
**Feature System Integration**: Integration with the feature system for class features
**Spellcasting Integration**: Integration with the spellcasting system for class spellcasting
**Transaction Safety**: Consistent transaction patterns for data integrity

### **Key Design Principles**

**Class Management**: Complete CRUD operations for class definitions
**Feature Integration**: Integration with the feature system for class features
**Spellcasting Integration**: Integration with the spellcasting system for class spellcasting
**Source Attribution**: Proper source book attribution and page references
**Validation**: Comprehensive validation at all levels using Zod schemas

## 🔧 **Core Service Layer**

### **ClassService**

The central service for all class management operations, providing comprehensive class CRUD operations and integration with related systems.

**Purpose**: Provides comprehensive class management capabilities, from basic class CRUD to complex integrations with feature and spellcasting systems.

**Key Responsibilities**:
- **Class CRUD**: Create, read, update, and delete class definitions
- **Feature Integration**: Manage class features through feature system integration
- **Spellcasting Integration**: Manage class spellcasting through spellcasting system integration
- **Source Attribution**: Handle source book references and page numbers
- **Transaction Safety**: Ensure data consistency through proper transaction handling
- **Validation**: Validate class data and relationships

**Core Methods**:

**getAllClasses**: Retrieves all classes with source book information
- **Method Signature**: `async getAllClasses(): Promise<{ classes: ClassWithSource[]; total: number }>`
- **Parameters**: None
- **Business Logic**: Loads all classes with source book information, orders by name
- **Returns**: Array of classes with total count and source book data
- **Example**: `const result = await classService.getAllClasses(); // Returns { classes: [...], total: 95 }`

**getClassById**: Retrieves a specific class by ID with full related data
- **Method Signature**: `async getClassById(id: number): Promise<ClassWithDetails | null>`
- **Parameters**: `id: number` - Class ID
- **Business Logic**: Loads class with features, spellcasting progression, and source book information
- **Returns**: Complete class object with all related data or null
- **Example**: `const fighter = await classService.getClassById(5); // Returns Fighter class with all details`

**createClass**: Creates a new class with features and spellcasting
- **Method Signature**: `async createClass(data: CreateClassRequest): Promise<{ id: number; message: string }>`
- **Parameters**: `data: CreateClassRequest` - Complete class data including features and spellcasting
- **Business Logic**: Creates class in transaction, then creates features and spellcasting through integrated services
- **Returns**: Created class ID and success message
- **Example**: `const result = await classService.createClass({ name: 'Paladin', editionId: 5, ... });`

**updateClass**: Updates an existing class
- **Method Signature**: `async updateClass(id: number, data: UpdateClassRequest): Promise<{ message: string }>`
- **Parameters**: `id: number` - Class ID, `data: UpdateClassRequest` - Updated data
- **Business Logic**: Updates class data, handles feature and spellcasting updates through integrated services
- **Returns**: Success message
- **Example**: `await classService.updateClass(5, { name: 'Fighter', description: 'Updated description' });`

**deleteClass**: Deletes a class
- **Method Signature**: `async deleteClass(id: number): Promise<{ message: string }>`
- **Parameters**: `id: number` - Class ID
- **Business Logic**: Deletes class (cascades to features, spellcasting, etc.)
- **Returns**: Success message
- **Example**: `await classService.deleteClass(5); // Deletes Fighter class and all related data`

**Source File**: `src/features/class/classService.ts`

## 🎯 **Controller Layer**

The class system controllers follow the shared [Controller Layer Pattern](../application-overview/backend-implementation.md#controller-layer) with class-specific request handling:

### **ClassController**

**Purpose**: Handles HTTP requests and responses for class system operations, delegating business logic to the service layer.

**Key Responsibilities**:
- **Request Processing**: Handle incoming HTTP requests with proper validation
- **Response Formatting**: Format responses according to API standards
- **Error Handling**: Provide appropriate error responses and status codes
- **Authentication**: Enforce admin authentication for write operations

**Core Methods**:

**GetAllClasses**: Retrieves all classes
- **Route**: `GET /api/classes`
- **Response**: Array of classes with source book information

**GetClassById**: Retrieves a specific class by ID
- **Route**: `GET /api/classes/:id`
- **Parameters**: Class ID in URL path
- **Response**: Complete class with features and spellcasting or 404 error

**CreateClass**: Creates a new class
- **Route**: `POST /api/classes`
- **Authentication**: Admin required
- **Body**: Complete class creation data
- **Response**: Created class ID and success message

**UpdateClass**: Updates an existing class
- **Route**: `PUT /api/classes/:id`
- **Authentication**: Admin required
- **Body**: Class update data
- **Response**: Success message

**DeleteClass**: Deletes a class
- **Route**: `DELETE /api/classes/:id`
- **Authentication**: Admin required
- **Response**: Success message

**Source File**: `src/features/class/classController.ts`

## 🗄️ **Entity State Management**

The class system uses **user sessions with entity state management** for editing classes, following the shared [Entity State Management Architecture](../application-overview/entity-state-management.md). This architecture separates user session tracking from entity state storage.

### **Overview**

The entity state management system provides:
- **User Sessions**: Single session per user tracking viewing/editing entities
- **Entity States**: Independent state storage in Redis (`state:class:{classId}`)
- **Entity Locks**: Separate lock management (`lock:class:{classId} -> userId`)
- **Real-time Updates**: Redis pub/sub for propagating state changes
- **Save Transformation**: Transforms Redis state → MySQL on save

### **Architecture Components**

**UserSessionService**: Manages user sessions tracking viewing/editing entities
- **Source File**: `src/features/shared/session/UserSessionService.ts`
- **Storage**: Redis key `session:user:{userId}` with `viewing` and `editing` arrays
- **Purpose**: Single source of truth for what entities a user is viewing/editing

**EntityStateService**: Manages independent entity states in Redis
- **Source File**: `src/features/shared/entityState/EntityStateService.ts`
- **Storage**: Redis key `state:class:{classId}` with class edit state
- **Purpose**: Shared state storage accessible by all viewing users
- **Pub/Sub**: Automatically publishes updates when state changes

**EntityLockService**: Manages per-entity locks for editing
- **Source File**: `src/features/shared/entityState/EntityLockService.ts`
- **Storage**: Redis key `lock:class:{classId} -> userId`
- **Purpose**: Prevents concurrent editing conflicts

### **ClassResolutionController**

Controller for managing class editing using user sessions and entity state.

**Purpose**: Handles HTTP requests for class editing lifecycle and state updates.

**Source File**: `src/features/classResolution/classResolutionController.ts`

**API Endpoints**:

**POST /api/classes/:classId/start-editing** - Start editing a class
- **Purpose**: Acquires lock, adds to user's editing list, initializes/loads state
- **Authentication**: User authentication required
- **Response**: `{ classState: ClassEditState }`
- **Business Logic**: 
  1. Acquires lock via `EntityLockService.acquireLock('class', classId, userId)`
  2. Adds to user session via `UserSessionService.setEditingEntity(userId, 'class', classId)`
  3. Gets or initializes state via `EntityStateService.getState('class', classId)`
  4. Returns state (no sessionId)

**GET /api/classes/:classId/state** - Get current class state
- **Purpose**: Retrieves current class state from Redis
- **Authentication**: User authentication required
- **Response**: `{ classState: ClassEditState }`
- **Business Logic**: Loads state from Redis via `EntityStateService.getState()`

**PUT /api/classes/:classId/update** - Apply update
- **Purpose**: Applies action-based update to class state
- **Authentication**: User authentication required
- **Body**: `{ update: ClassUpdate }` (discriminated union of update actions)
- **Response**: `{ classState: ClassEditState }`
- **Business Logic**: 
  1. Verifies lock via `EntityLockService.checkLock('class', classId)`
  2. Applies update via `GenericUpdateApplier.applyUpdateToState()`
  3. Updates state via `EntityStateService.setState()` (auto-publishes)

**POST /api/classes/:classId/save** - Save class state to database
- **Purpose**: Transforms Redis state → MySQL and saves class
- **Authentication**: Admin authentication required
- **Response**: `{ class: ClassSummary }`
- **Business Logic**: 
  1. Verifies lock
  2. Uses `ClassSaveService` to transform and persist state
  3. Releases lock via `EntityLockService.releaseLock()`
  4. Removes from editing via `UserSessionService.clearEditingEntity()`

**POST /api/classes/:classId/cancel** - Cancel editing
- **Purpose**: Releases lock and removes from editing list without saving
- **Authentication**: User authentication required
- **Response**: `{ success: boolean }`
- **Business Logic**: 
  1. Releases lock via `EntityLockService.releaseLock()`
  2. Removes from editing via `UserSessionService.clearEditingEntity()`
  3. State remains in Redis (may be viewed by other users)

### **Update Actions**

The system uses action-based updates (discriminated union) for state modifications:

**Update Types**:
- `UPDATE_CLASS_FIELD`: Update individual class field (name, abbreviation, etc.)
- `ADD_PROGRESSION`: Add new feature progression to session
- `UPDATE_PROGRESSION`: Update existing feature progression
- `REMOVE_PROGRESSION`: Remove feature progression from session
- `SET_SPELLCASTING_PROGRESSION`: Update spellcasting progression
- `SET_SPELLS_KNOWN_PROGRESSION`: Update spells known progression

**Source File**: `src/features/classResolution/types.ts`

### **ClassUpdateApplier**

Service for applying action-based updates to session state.

**Purpose**: Immutably applies updates to session state based on action type.

**Source File**: `src/features/classResolution/classUpdateApplier.ts`

**Key Features**:
- **Immutable Updates**: All updates create new state objects
- **Type Safety**: Discriminated union ensures type-safe updates
- **Validation**: Validates updates before applying
- **ID Management**: Handles temporary ID generation for new entities

### **ClassSaveService**

Service for transforming Redis session state → MySQL.

**Purpose**: Transforms session state to MySQL format and persists class data.

**Source File**: `src/features/classResolution/classSaveService.ts`

**Transform Process**:
1. **Load Session**: Load session state from Redis
2. **Transform State**: Convert `ClassEditState` to `UpdateClassRequest`
3. **Handle Features**: 
   - Features are managed independently via the feature state system
   - Only featureIds are sent to `classService.updateClass`
   - Class service only syncs FeatureClassMap links (no feature manipulation)
4. **Persist Class**: Save class to MySQL via `classService.updateClass`
5. **Cleanup**: Delete session from Redis

**Note**: Features are no longer created/updated by the class service. Features must be saved via the feature state system before class update. The class service only manages FeatureClassMap relationship links.

**Key Features**:
- **Deterministic Tracking**: Uses temporary IDs from session, no signature matching
- **Update in Place**: Existing entities updated, not deleted & recreated
- **ID Mapping**: Maps temporary IDs to real MySQL IDs
- **Transaction Safety**: All operations in single transaction

**Source Files**:
- Entity State Service: `src/features/shared/entityState/EntityStateService.ts`
- Entity Lock Service: `src/features/shared/entityState/EntityLockService.ts`
- User Session Service: `src/features/shared/session/UserSessionService.ts`
- Resolution Controller: `src/features/classResolution/classResolutionController.ts`
- Update Applier: `src/features/classResolution/classUpdateApplier.ts`
- Save Service: `src/features/classResolution/classSaveService.ts`
- Types: `src/features/classResolution/types.ts`, `packages/shared/schema/src/class.ts`

**Related Documentation**: 
- [Frontend State-Based Pattern](frontend-components.md#state-based-pattern-architecture) - Frontend implementation
- [Entity State Management Architecture](../application-overview/entity-state-management.md) - Architecture overview

## 🔗 **Routes Layer**

The class system routes follow the shared [RESTful API Structure](../application-overview/backend-implementation.md#restful-api-structure) with class-specific endpoints:

### **ClassRoutes**

**Purpose**: Defines API endpoints and request validation for class system operations.

**Route Structure**:
- **Core Class Routes**: Standard CRUD operations for classes
- **Class Integration Routes**: Integration with feature and spellcasting systems

**Route Definitions**:

**Core Class Routes**:
- `GET /api/classes` - Retrieve all classes
- `GET /api/classes/:id` - Retrieve specific class by ID
- `POST /api/classes` - Create new class (admin required)
- `PUT /api/classes/:id` - Update existing class (admin required)
- `DELETE /api/classes/:id` - Delete class (admin required)

**Authentication**: Admin authentication required for all write operations
**Validation**: All routes use Zod schemas for request validation

**Source File**: `src/features/class/classRoutes.ts`

## 🔧 **Business Logic Patterns**

### **Feature System Integration**

The class system integrates with the feature system through consolidated service methods:

**Consolidated Methods**: Class service calls feature system methods for feature management
**Bulk Operations**: Efficient bulk creation and deletion of class features
**Transaction Safety**: Shared transactions ensure data consistency

**Integration Pattern**: The class service calls feature system methods to manage class features, passing the class context and feature data. This ensures that all feature operations for classes go through the centralized feature system service, maintaining consistency and reducing code duplication.

**Related Documentation**: [Feature System Backend Implementation](../feature-system/backend-implementation.md)

### **Spellcasting Integration**

The class system integrates with the spellcasting system for class spellcasting capabilities:

**Spellcasting Progression**: Classes can have spellcasting progression with slots
**Spells Known**: Classes can have spells known progression for spontaneous casters
**Casting Ability**: Classes specify their primary casting ability
**Casting Type**: Classes specify their casting type (prepared, spontaneous, etc.)

**Integration Pattern**: The class service manages spellcasting progression data through the spellcasting system, ensuring proper spell slot progression and spells known calculations for different casting types.

**Related Documentation**: [Spellcasting System](../spell-system/spellcasting-system.md)

### **Source Attribution**

The class system handles source book attribution for proper content credit:

**Source Book References**: Classes are linked to their source books
**Page Numbers**: Page references for quick lookup in source material
**Multiple Sources**: Support for classes appearing in multiple sources

**Implementation Pattern**: The system maintains source book references through source map entities, allowing proper attribution and easy lookup of class origins in published material.

## 🔗 **Integration Points**

### **Feature System Integration**

The class system integrates with the feature system through consolidated service methods:

**Consolidated Methods**: Class service calls feature system methods for feature management
**Bulk Operations**: Efficient bulk creation and deletion of class features
**Transaction Safety**: Shared transactions ensure data consistency

**Integration Pattern**: The class service calls feature system methods to manage class features, passing the class context and feature data. This ensures that all feature operations for classes go through the centralized feature system service, maintaining consistency and reducing code duplication.

**Related Documentation**: [Feature System Backend Implementation](../feature-system/backend-implementation.md)

### **Spellcasting System Integration**

The class system integrates with the spellcasting system for class spellcasting capabilities:

**Spellcasting Progression**: Classes can have spellcasting progression with slots
**Spells Known**: Classes can have spells known progression for spontaneous casters
**Casting Ability**: Classes specify their primary casting ability
**Casting Type**: Classes specify their casting type (prepared, spontaneous, etc.)

**Integration Pattern**: The class service manages spellcasting progression data through the spellcasting system, ensuring proper spell slot progression and spells known calculations for different casting types.

**Related Documentation**: [Spellcasting System](../spell-system/spellcasting-system.md)

### **Character System Integration**

The class system provides the foundation for character advancement:

**Character Classes**: Characters take levels in classes
**Class Features**: Characters gain class features through feature system
**Spellcasting**: Characters gain spellcasting abilities through spellcasting system
**Progression**: Character progression is calculated based on class levels

**Related Documentation**: [Character Management](../character-management/character-advancement.md)

## 📊 **Error Handling**

The class system follows the shared [Error Handling Patterns](../application-overview/backend-implementation.md#error-handling) with class-specific error scenarios:

**Validation Errors**: Zod schema validation errors with detailed field information
**Business Logic Errors**: Class-specific business rule violations
**Database Errors**: Prisma ORM errors with proper error messages
**Integration Errors**: Errors from feature and spellcasting system integrations

## 🔧 **Performance Considerations**

The class system implements performance optimizations following the shared [Performance Optimization](../application-overview/performance-optimization.md) patterns:

**Efficient Queries**: Optimized Prisma queries with proper includes and where clauses
**Bulk Operations**: Efficient bulk creation and deletion for feature integration
**Caching**: Appropriate caching for frequently accessed class data
**Pagination**: Proper pagination for large class collections

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Class system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Class system validation rules and schemas
- **[Static Data](static-data.md)** - Class system enums and types
- **[Frontend Components](frontend-components.md)** - Class system frontend implementation
- **[Feature Integration](feature-integration.md)** - Class feature system integration
- **[Spellcasting System](spellcasting-system.md)** - Class spellcasting system integration
- **[Backend Implementation Patterns](../application-overview/backend-implementation.md)** - Shared backend patterns and conventions
- **[Performance Optimization](../application-overview/performance-optimization.md)** - Shared performance optimization strategies

# Race System Backend Implementation

*Complete documentation for the race system backend implementation, including API services, controllers, and business logic.*

## 📋 **Overview**

The race system backend implementation provides the API layer for race management, including CRUD operations, business logic, and data validation. The implementation follows a layered architecture pattern with clear separation of concerns.

The backend implementation follows the shared [Backend Implementation Patterns](../application-overview/backend-implementation.md) with race-specific business logic and integration patterns.

**Source Files**: 
- Service: `src/features/race/raceService.ts`
- Controller: `src/features/race/raceController.ts`
- Routes: `src/features/race/raceRoutes.ts`
- Types: `src/features/race/types.ts`
- Formula Utilities: `src/utils/formulaParamTransformers.ts`

## 🏗️ **Architecture Overview**

The race system backend follows the shared [Layered Architecture Pattern](../application-overview/backend-implementation.md#layered-architecture-pattern) with race-specific implementations:

**Routes Layer**: API endpoints for race management and related operations
**Controller Layer**: Request handling and response formatting for race operations
**Service Layer**: Race-specific business logic and data operations
**Database Layer**: Prisma ORM with race system models

### **Service Architecture**

The race system uses a service-oriented architecture following the shared [Service-Oriented Architecture](../application-overview/backend-implementation.md#service-oriented-architecture) patterns:

**RaceService**: Central service containing all race management logic
**Feature System Integration**: Integration with the feature system for racial features
**Transaction Safety**: Consistent transaction patterns for data integrity
**Formula Integration**: Integration with formula system for racial bonuses

### **Key Design Principles**

**Race Management**: Complete CRUD operations for race definitions
**Feature Integration**: Integration with the feature system for racial features
**Source Attribution**: Proper source book attribution and page references
**Validation**: Comprehensive validation at all levels using Zod schemas
**Formula Integration**: Integration with formula system for racial bonuses and penalties

## 🔧 **Core Service Layer**

### **RaceService**

The central service for all race management operations, providing comprehensive race CRUD operations and integration with related systems.

**Purpose**: Provides comprehensive race management capabilities, from basic race CRUD to complex integrations with feature and formula systems.

**Key Responsibilities**:
- **Race CRUD**: Create, read, update, and delete race definitions
- **Feature Integration**: Manage racial features through feature system integration
- **Source Attribution**: Handle source book references and page numbers
- **Transaction Safety**: Ensure data consistency through proper transaction handling
- **Validation**: Validate race data and relationships
- **Formula Integration**: Handle formula-based racial bonuses and penalties

**Core Methods**:

**getAllRaces**: Retrieves all races with feature and source book information
- **Parameters**: None
- **Business Logic**: Loads all races with feature progression and source book information, orders by name
- **Returns**: Array of races with total count and feature data

**getRaceById**: Retrieves a specific race by ID with full related data
- **Parameters**: Race ID
- **Business Logic**: Loads race with features, source book information, and formula parameters
- **Returns**: Complete race object with all related data or null

**createRace**: Creates a new race with features
- **Parameters**: Complete race data including features
- **Business Logic**: Creates race in transaction, then creates features through integrated services
- **Returns**: Created race ID and success message

**updateRace**: Updates an existing race
- **Parameters**: Race ID and updated data
- **Business Logic**: Updates race data, handles feature updates through integrated services
- **Returns**: Success message

**deleteRace**: Deletes a race
- **Parameters**: Race ID
- **Business Logic**: Deletes race (cascades to features, etc.)
- **Returns**: Success message

**Source File**: `src/features/race/raceService.ts`

## 🎯 **Controller Layer**

The race system controllers follow the shared [Controller Layer Pattern](../application-overview/backend-implementation.md#controller-layer) with race-specific request handling:

### **RaceController**

**Purpose**: Handles HTTP requests and responses for race system operations, delegating business logic to the service layer.

**Key Responsibilities**:
- **Request Processing**: Handle incoming HTTP requests with proper validation
- **Response Formatting**: Format responses according to API standards
- **Error Handling**: Provide appropriate error responses and status codes
- **Authentication**: Enforce admin authentication for write operations

**Core Methods**:

**GetAllRaces**: Retrieves all races
- **Route**: `GET /api/races`
- **Response**: Array of races with feature and source book information

**GetRaceById**: Retrieves a specific race by ID
- **Route**: `GET /api/races/:id`
- **Parameters**: Race ID in URL path
- **Response**: Complete race with features and source book information or 404 error

**CreateRace**: Creates a new race
- **Route**: `POST /api/races`
- **Authentication**: Admin required
- **Body**: Complete race creation data
- **Response**: Created race ID and success message

**UpdateRace**: Updates an existing race
- **Route**: `PUT /api/races/:id`
- **Authentication**: Admin required
- **Body**: Race update data
- **Response**: Success message

**DeleteRace**: Deletes a race
- **Route**: `DELETE /api/races/:id`
- **Authentication**: Admin required
- **Response**: Success message

**Source File**: `src/features/race/raceController.ts`

## 🗄️ **Session Management**

The race system uses **SQLite session storage** for persistent editing sessions, providing reliable state management and deterministic ID handling. This pattern mirrors the `CharacterEdit` and `ClassEdit` session management implementations.

### **Overview**

The session management system provides:
- **Persistent Sessions**: SQLite database stores editing sessions that survive backend restarts
- **Automatic Expiration**: Sessions automatically expire after configurable period of inactivity
- **Per-User Isolation**: Each user has separate sessions for each race
- **Temporary ID Generation**: SQLite auto-increment generates temporary IDs for new entities
- **Save Transformation**: Transforms SQLite session state → MySQL on save

### **Session Database**

**Purpose**: Lightweight SQLite database for storing race editing session state.

**Source File**: `src/features/raceResolution/sessionDatabase.ts`

**Tables**:
- **`race_edit_sessions`**: Stores session metadata and race state (JSON)
- **`race_session_progressions`**: Temporary progressions in session (with auto-increment IDs)
- **`race_session_entities`**: Temporary entities in session (with auto-increment IDs)

**Key Features**:
- **WAL Mode**: Write-Ahead Logging for concurrent access
- **Auto-Increment IDs**: SQLite generates temporary IDs for new entities
- **Session Expiration**: Automatic cleanup of expired sessions
- **Per-User Isolation**: Sessions keyed by `raceId:userId`

### **RaceSessionService**

Service for managing race editing sessions in SQLite.

**Purpose**: Provides persistent session storage with automatic cleanup and state management.

**Source File**: `src/features/raceResolution/raceSessionService.ts`

**Key Methods**: Similar to `ClassSessionService` but for race sessions:
- **createSession**: Creates a new editing session
- **getSession**: Retrieves an active session
- **updateSession**: Updates session state
- **deleteSession**: Deletes a session
- **cleanupExpiredSessions**: Removes expired sessions

### **RaceResolutionController**

Controller for managing race editing sessions and applying updates.

**Purpose**: Handles HTTP requests for session lifecycle and state updates.

**Source File**: `src/features/raceResolution/raceResolutionController.ts`

**API Endpoints**:

**POST /api/races/:id/session** - Initialize or resume session
- **Purpose**: Creates new session or returns existing active session
- **Authentication**: User authentication required
- **Response**: `{ sessionId: string, raceState: RaceEditState }`
- **Business Logic**: Loads race from MySQL, creates or resumes SQLite session

**GET /api/races/:id/session/:sessionId** - Get session state
- **Purpose**: Retrieves current session state
- **Authentication**: User authentication required
- **Response**: `{ raceState: RaceEditState }`
- **Business Logic**: Loads session state from SQLite

**PATCH /api/races/:id/session/:sessionId** - Apply update
- **Purpose**: Applies action-based update to session state
- **Authentication**: User authentication required
- **Body**: `RaceUpdate` (discriminated union of update actions)
- **Response**: `{ raceState: RaceEditState }`
- **Business Logic**: Applies update to session state using `raceUpdateApplier`

**POST /api/races/:id/session/:sessionId/save** - Save session to MySQL
- **Purpose**: Transforms SQLite session → MySQL and saves race
- **Authentication**: Admin authentication required
- **Response**: `{ race: Race }`
- **Business Logic**: Uses `RaceSaveService` to transform and persist session

**DELETE /api/races/:id/session/:sessionId** - Cancel session
- **Purpose**: Deletes session without saving
- **Authentication**: User authentication required
- **Response**: `{ message: string }`
- **Business Logic**: Deletes session from SQLite

### **Update Actions**

The system uses action-based updates (discriminated union) for state modifications:

**Update Types**:
- `UPDATE_RACE_FIELD`: Update individual race field (name, editionId, etc.)
- `ADD_PROGRESSION`: Add new feature progression to session
- `UPDATE_PROGRESSION`: Update existing feature progression
- `REMOVE_PROGRESSION`: Remove feature progression from session

**Source File**: `src/features/raceResolution/types.ts`

### **RaceUpdateApplier**

Service for applying action-based updates to session state.

**Purpose**: Immutably applies updates to session state based on action type.

**Source File**: `src/features/raceResolution/raceUpdateApplier.ts`

**Key Features**:
- **Immutable Updates**: All updates create new state objects
- **Type Safety**: Discriminated union ensures type-safe updates
- **Validation**: Validates updates before applying
- **ID Management**: Handles temporary ID generation for new entities

### **RaceSaveService**

Service for transforming SQLite session state → MySQL.

**Purpose**: Transforms session state to MySQL format and persists race data.

**Source File**: `src/features/raceResolution/raceSaveService.ts`

**Transform Process**:
1. **Load Session**: Load session state from SQLite
2. **Transform State**: Convert `RaceEditState` to `UpdateRaceRequest`
3. **Handle Progressions**: 
   - Existing progressions (with real IDs): Update in MySQL
   - New progressions (with temporary IDs): Create in MySQL, get real IDs
4. **Persist Race**: Save race to MySQL via `raceService.updateRace`
5. **Cleanup**: Delete session from SQLite

**Key Features**:
- **Deterministic Tracking**: Uses temporary IDs from session, no signature matching
- **Update in Place**: Existing entities updated, not deleted & recreated
- **ID Mapping**: Maps temporary IDs to real MySQL IDs
- **Transaction Safety**: All operations in single transaction

**Source Files**:
- Session Database: `src/features/raceResolution/sessionDatabase.ts`
- Session Service: `src/features/raceResolution/raceSessionService.ts`
- Resolution Controller: `src/features/raceResolution/raceResolutionController.ts`
- Update Applier: `src/features/raceResolution/raceUpdateApplier.ts`
- Save Service: `src/features/raceResolution/raceSaveService.ts`
- Types: `src/features/raceResolution/types.ts`, `packages/shared/schema/src/classResolution.ts`

**Related Documentation**: 
- [Frontend State-Based Pattern](frontend-components.md#state-based-pattern-architecture) - Frontend implementation
- [Class System Session Management](../class-system/backend-implementation.md#session-management) - Reference implementation

## 🔗 **Routes Layer**

The race system routes follow the shared [RESTful API Structure](../application-overview/backend-implementation.md#restful-api-structure) with race-specific endpoints:

### **RaceRoutes**

**Purpose**: Defines API endpoints and request validation for race system operations.

**Route Structure**:
- **Core Race Routes**: Standard CRUD operations for races
- **Race Integration Routes**: Integration with feature system

**Route Definitions**:

**Core Race Routes**:
- `GET /api/races` - Retrieve all races
- `GET /api/races/:id` - Retrieve specific race by ID
- `POST /api/races` - Create new race (admin required)
- `PUT /api/races/:id` - Update existing race (admin required)
- `DELETE /api/races/:id` - Delete race (admin required)

**Authentication**: Admin authentication required for all write operations
**Validation**: All routes use Zod schemas for request validation

**Source File**: `src/features/race/raceRoutes.ts`

## 🔧 **Business Logic Patterns**

### **Feature System Integration**

The race system integrates with the feature system through consolidated service methods:

**Consolidated Methods**: Race service calls feature system methods for feature management
**Bulk Operations**: Efficient bulk creation and deletion of racial features
**Transaction Safety**: Shared transactions ensure data consistency

**Integration Pattern**: The race service calls feature system methods to manage racial features, passing the race context and feature data. This ensures that all feature operations for races go through the centralized feature system service, maintaining consistency and reducing code duplication.

**Related Documentation**: [Feature System Backend Implementation](../feature-system/backend-implementation.md)

### **Formula Integration**

The race system integrates with the formula system for racial bonuses and penalties:

**Formula Parameters**: Races can have formula-based bonuses and penalties
**Formula Transformation**: Formula parameters are transformed from database format
**Formula Validation**: Formula parameters are validated against formula definitions
**Formula Calculation**: Formula results are calculated for character generation

**Integration Pattern**: The race service integrates with the formula system to handle complex racial bonuses and penalties, ensuring proper calculation and validation of formula-based racial traits.

**Related Documentation**: [Formula System](../formula-system/formula-system.md)

### **Source Attribution**

The race system handles source book attribution for proper content credit:

**Source Book References**: Races are linked to their source books
**Page Numbers**: Page references for quick lookup in source material
**Multiple Sources**: Support for races appearing in multiple sources

**Implementation Pattern**: The system maintains source book references through source map entities, allowing proper attribution and easy lookup of race origins in published material.

## 🔗 **Integration Points**

### **Feature System Integration**

The race system integrates with the feature system through consolidated service methods:

**Consolidated Methods**: Race service calls feature system methods for feature management
**Bulk Operations**: Efficient bulk creation and deletion of racial features
**Transaction Safety**: Shared transactions ensure data consistency

**Integration Pattern**: The race service calls feature system methods to manage racial features, passing the race context and feature data. This ensures that all feature operations for races go through the centralized feature system service, maintaining consistency and reducing code duplication.

**Related Documentation**: [Feature System Backend Implementation](../feature-system/backend-implementation.md)

### **Character System Integration**

The race system provides the foundation for character creation:

**Character Races**: Characters select races during creation
**Racial Features**: Characters gain racial features through feature system
**Racial Bonuses**: Characters gain racial bonuses through formula system
**Racial Traits**: Characters gain racial traits and abilities

**Integration Pattern**: The race system provides the framework for character racial traits, with other systems providing the specific mechanics.

**Related Documentation**: [Character Management](../character-management/character-creation.md)

### **Formula System Integration**

The race system integrates with the formula system for racial calculations:

**Formula Parameters**: Races can have formula-based bonuses and penalties
**Formula Transformation**: Formula parameters are transformed from database format
**Formula Validation**: Formula parameters are validated against formula definitions
**Formula Calculation**: Formula results are calculated for character generation

**Integration Pattern**: The race service integrates with the formula system to handle complex racial bonuses and penalties, ensuring proper calculation and validation of formula-based racial traits.

**Related Documentation**: [Formula System](../formula-system/formula-system.md)

## 📊 **Error Handling**

The race system follows the shared [Error Handling Patterns](../application-overview/backend-implementation.md#error-handling) with race-specific error scenarios:

**Validation Errors**: Zod schema validation errors with detailed field information
**Business Logic Errors**: Race-specific business rule violations
**Database Errors**: Prisma ORM errors with proper error messages
**Integration Errors**: Errors from feature and formula system integrations

## 🔧 **Performance Considerations**

The race system implements performance optimizations following the shared [Performance Optimization](../application-overview/performance-optimization.md) patterns:

**Efficient Queries**: Optimized Prisma queries with proper includes and where clauses
**Bulk Operations**: Efficient bulk creation and deletion for feature integration
**Caching**: Appropriate caching for frequently accessed race data
**Pagination**: Proper pagination for large race collections

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Race system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Race system validation rules and schemas
- **[Static Data](static-data.md)** - Race system enums and types
- **[Frontend Components](frontend-components.md)** - Race system frontend implementation
- **[Feature System Backend Implementation](../feature-system/backend-implementation.md)** - Feature system integration
- **[Formula System](../formula-system/formula-system.md)** - Formula system integration
- **[Backend Implementation Patterns](../application-overview/backend-implementation.md)** - Shared backend patterns and conventions
- **[Performance Optimization](../application-overview/performance-optimization.md)** - Shared performance optimization strategies

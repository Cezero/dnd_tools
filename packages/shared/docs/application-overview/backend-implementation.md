# Backend Implementation Patterns

*Common backend implementation patterns, conventions, and strategies used across all systems in the D&D Tools application.*

## 📋 **Overview**

The backend implementation patterns document outlines the common architectural principles, conventions, and strategies used across all backend implementations in the D&D Tools application. These patterns ensure consistency, maintainability, and scalability across all systems while providing a solid foundation for API development and business logic implementation.

**Source Files**: `apps/backend/src/features/`

## 🏗️ **Core Architectural Principles**

### **Layered Architecture Pattern**

The backend follows a standard layered architecture with clear separation of concerns:

**Routes Layer** (`*Routes.ts`):
- **Purpose**: Define API endpoints and request validation
- **Responsibilities**: URL routing, parameter validation, authentication
- **Pattern**: Uses validated router with Zod schemas
- **Integration**: Connects to controller layer

**Controller Layer** (`*Controller.ts`):
- **Purpose**: Handle HTTP requests and responses
- **Responsibilities**: Request processing, response formatting, error handling
- **Pattern**: Thin controllers that delegate to services
- **Integration**: Connects to service layer

**Service Layer** (`*Service.ts`):
- **Purpose**: Implement business logic and data operations
- **Responsibilities**: Data validation, business rules, database operations
- **Pattern**: Stateless services with clear interfaces
- **Integration**: Connects to database layer

**Database Layer** (Prisma Client):
- **Purpose**: Data persistence and retrieval
- **Responsibilities**: Database queries, relationship management, transactions
- **Pattern**: Prisma ORM with type-safe queries
- **Integration**: Direct database access

**Session Storage Layer** (SQLite with better-sqlite3):
- **Purpose**: Lightweight, file-based session storage
- **Responsibilities**: Session state persistence, expiration management
- **Pattern**: Direct SQL with better-sqlite3 (no ORM)
- **Integration**: Separate from main database for session-specific data
- **Use Cases**: Temporary editing sessions, state that survives restarts

**Benefits**:
- **Separation of Concerns**: Clear boundaries between layers
- **Testability**: Each layer can be tested independently
- **Maintainability**: Changes in one layer don't affect others
- **Scalability**: Layers can be optimized independently

### **Service-Oriented Architecture**

The backend uses a service-oriented approach for business logic:

**Service Responsibilities**:
- **Business Logic**: Implement domain-specific business rules
- **Data Operations**: Handle database operations and transactions
- **Validation**: Validate data and business rules
- **Integration**: Coordinate with other services and systems

**Service Patterns**:
- **Stateless Services**: Services maintain no state between requests
- **Clear Interfaces**: Well-defined interfaces for service methods
- **Dependency Injection**: Services receive dependencies through injection
- **Error Handling**: Consistent error handling across all services

**Benefits**:
- **Reusability**: Services can be reused across different controllers
- **Testability**: Services can be easily unit tested
- **Maintainability**: Business logic is centralized and organized
- **Scalability**: Services can be optimized independently

### **Consolidated Service Pattern**

The backend uses a consolidated service pattern to eliminate code duplication and ensure consistency across related systems:

**Consolidated Service**: A central service that provides shared functionality for multiple related systems
**Consumer Services**: Services that use the consolidated service instead of duplicating logic
**Single Source of Truth**: All operations for a specific domain go through the consolidated service
**Transaction Safety**: Shared transactions ensure data consistency across systems

**Benefits**:
- **Eliminates Duplication**: Shared logic is implemented once in the consolidated service
- **Ensures Consistency**: All systems use the same patterns and business logic
- **Reduces Maintenance**: Changes to shared logic only need to be made in one place
- **Improves Reliability**: Centralized logic reduces the chance of inconsistencies

**Implementation Pattern**: The consolidated service provides methods that consumer services call, passing context and data. The consolidated service handles all the complex business logic, database operations, and transaction management, while consumer services focus on their specific domain concerns.

### **Bulk Operations Pattern**

The backend supports bulk operations for efficient handling of complex, multi-entity operations:

**Bulk Creation**: Create multiple related entities in a single operation
**Bulk Updates**: Update multiple entities with complete replacement of related data
**Bulk Deletion**: Delete multiple entities and all related data
**Transaction Safety**: All bulk operations use database transactions for consistency

**Benefits**:
- **Efficiency**: Reduces the number of database operations and API calls
- **Consistency**: All related data is created, updated, or deleted together
- **Performance**: Optimized for complex operations involving multiple entities
- **Reliability**: Transaction safety ensures data integrity

**Implementation Pattern**: Bulk operations accept complete data structures that include all related entities. The system deletes existing related data and creates new data in a single transaction, ensuring that the operation either completes entirely or rolls back completely.

## 🔧 **API Design Patterns**

### **RESTful API Structure**

The backend follows RESTful API design principles:

**Standard CRUD Operations**:
- `GET /api/{resource}` - Retrieve all resources with pagination and filtering
- `GET /api/{resource}/:id` - Retrieve specific resource by ID
- `POST /api/{resource}` - Create new resource
- `PUT /api/{resource}/:id` - Update existing resource
- `DELETE /api/{resource}/:id` - Delete resource

**Specialized Operations**:
- `GET /api/{resource}/:id/{related}` - Retrieve related resources
- `POST /api/{resource}/bulk` - Bulk operations for multiple resources
- `PUT /api/{resource}/:id/{related}` - Update related resources

**URL Patterns**:
- **Resource Names**: Use plural nouns for resource collections
- **Nested Resources**: Use nested URLs for related resources
- **Query Parameters**: Use query parameters for filtering, pagination, and sorting
- **Path Parameters**: Use path parameters for resource identification

### **Resource Naming Conventions**

**URL Structure Standards**:
- **Plural nouns**: Use plural nouns for resource collections
- **Lowercase with hyphens**: Use kebab-case for multi-word resources
- **Hierarchical structure**: Use nested paths for related resources

**Example URL Patterns**:
- `/api/features` - Feature collection
- `/api/features/:id` - Specific feature
- `/api/features/:id/progressions` - Feature progressions
- `/api/classes` - Class collection
- `/api/classes/:id/features` - Class features

### **Request/Response Format**

**Standard Request Format**:
- **Content-Type**: `application/json`
- **Body**: JSON object with request data
- **Headers**: Authorization, content-type, accept headers

**Standard Response Format**:
- **Success Response**: JSON object with data and metadata
- **Error Response**: JSON object with error details
- **Status Codes**: Appropriate HTTP status codes

**Response Structure**:
- **Data**: The actual response data
- **Metadata**: Pagination, timing, and filter information
- **Error Details**: Field-specific error information for validation errors

### **Content Negotiation**

**Content-Type Specifications**:
- **Request**: `application/json` for all POST/PUT requests
- **Response**: `application/json` for all responses
- **Character encoding**: UTF-8

**Standard Headers**:
- **Content-Type**: `application/json`
- **Accept**: `application/json`
- **Authorization**: `Bearer <token>` for authenticated requests

### **Response Optimization**

**Field Selection**:
- **Basic List Response**: Minimal fields for list views
- **Detailed Response**: All fields for detail views
- **Related Data**: Include related entities as needed
- **Computed Fields**: Include calculated values and metadata

**Pagination Support**:
- **Page-based Pagination**: Standard page/limit pagination
- **Metadata**: Total count, current page, total pages
- **Consistent Format**: Same pagination structure across all endpoints

### **Rate Limiting and Throttling**

**Rate Limit Headers**:
- **X-RateLimit-Limit**: Maximum requests per time window
- **X-RateLimit-Remaining**: Remaining requests in current window
- **X-RateLimit-Reset**: Time when the rate limit resets

## 🎯 **Service Layer Patterns**

### **Service Interface Pattern**

All services follow a consistent interface pattern:

**Interface Structure**:
- **CRUD Operations**: Standard create, read, update, delete methods
- **Specialized Operations**: Domain-specific operations
- **Bulk Operations**: Methods for handling multiple entities
- **Related Operations**: Methods for managing related data

**Interface Benefits**:
- **Consistency**: Standard interface across all services
- **Type Safety**: TypeScript interfaces for compile-time checking
- **Documentation**: Clear contract for service methods
- **Testing**: Easy to mock and test services

### **Business Logic Patterns**

**Data Validation Pattern**:
- **Schema Validation**: All data validated using Zod schemas
- **Business Rules**: Enforce domain-specific business logic
- **Relationship Validation**: Ensure data consistency across related entities
- **Constraint Checking**: Validate database constraints before operations

**Transaction Management Pattern**:
- **Atomic Operations**: Use transactions for multi-table operations
- **Rollback Handling**: Proper error handling with transaction rollback
- **Data Consistency**: Ensure data consistency across related tables
- **Performance Optimization**: Optimize transaction scope and duration

**Error Handling Pattern**:
- **Custom Errors**: Use domain-specific error classes
- **Error Mapping**: Map database errors to user-friendly messages
- **Logging**: Comprehensive error logging for debugging
- **Client Communication**: Return appropriate HTTP status codes

### **Service Method Patterns**

**CRUD Method Pattern**:
- **Validation**: Validate input parameters and data
- **Business Logic**: Execute domain-specific business rules
- **Database Operations**: Perform database operations
- **Response Formatting**: Format response data
- **Error Handling**: Handle and log errors appropriately

**Bulk Operation Pattern**:
- **Transaction Management**: Use database transactions for consistency
- **Data Processing**: Process multiple items in sequence
- **Error Handling**: Handle errors for individual items
- **Response Formatting**: Format bulk operation results

## 🔧 **Controller Layer Patterns**

### **Controller Interface Pattern**

All controllers follow a consistent interface pattern:

**Controller Structure**:
- **Standard CRUD Handlers**: Consistent handlers for create, read, update, delete
- **Specialized Handlers**: Domain-specific request handlers
- **Dependency Injection**: Services injected through constructor
- **Error Handling**: Consistent error handling across all controllers

**Controller Benefits**:
- **Consistency**: Standard controller structure across all resources
- **Dependency Injection**: Services injected through constructor
- **Error Handling**: Consistent error handling across all controllers
- **Response Formatting**: Standardized response formatting

### **Standard CRUD Controller Patterns**

Controllers handle HTTP requests and delegate business logic to services:

**Get All Resources**:
- **Query Parameters**: Handle filtering, pagination, and sorting
- **Service Delegation**: Delegate to service layer for business logic
- **Response Formatting**: Format response with metadata
- **Error Handling**: Handle service errors appropriately

**Get Single Resource**:
- **Parameter Validation**: Validate path parameters
- **Service Delegation**: Delegate to service layer
- **Response Formatting**: Format single resource response
- **Error Handling**: Handle not found and validation errors

**Create Resource**:
- **Request Validation**: Validate request body using Zod schemas
- **Service Delegation**: Delegate creation to service layer
- **Response Formatting**: Format creation response
- **Error Handling**: Handle validation and business logic errors

**Update Resource**:
- **Parameter Validation**: Validate path parameters and request body
- **Service Delegation**: Delegate update to service layer
- **Response Formatting**: Format update response
- **Error Handling**: Handle validation and business logic errors

**Delete Resource**:
- **Parameter Validation**: Validate path parameters
- **Service Delegation**: Delegate deletion to service layer
- **Response Formatting**: Format deletion response
- **Error Handling**: Handle not found and constraint errors

### **Session Management Controller Patterns**

Controllers for session-based resources follow a RESTful session pattern:

**Initialize Session** (`POST /resource/:id/session`):
- **Purpose**: Create new editing session
- **Request**: No body required (uses resource ID from path)
- **Response**: Session data with unique session ID
- **Pattern**: Load resource, initialize state, create session, return session ID

**Resume Session** (`GET /resource/:id/session`):
- **Purpose**: Retrieve active session for resource
- **Request**: No body required
- **Response**: Session data or null if no active session
- **Pattern**: Look up session by resource ID and user ID, return if exists and not expired

**Update Session** (`PATCH /resource/:id/session/:sessionId`):
- **Purpose**: Apply update to session state
- **Request**: Update payload (discriminated union for different update types)
- **Response**: Updated session data
- **Pattern**: Load session, apply update, re-compute derived data, update session, return result

**Get Session State** (`GET /resource/:id/session/:sessionId`):
- **Purpose**: Get current session state without re-computation
- **Request**: No body required
- **Response**: Current session data
- **Pattern**: Load session, return stored state

**Save Session** (`POST /resource/:id/session/:sessionId/save`):
- **Purpose**: Persist session state to main database
- **Request**: No body required
- **Response**: Success message
- **Pattern**: Load session, persist to main database, delete session

**Cancel Session** (`DELETE /resource/:id/session/:sessionId`):
- **Purpose**: Discard session without saving
- **Request**: No body required
- **Response**: Success message
- **Pattern**: Delete session from storage

**Benefits**:
- **RESTful Design**: Follows REST conventions for session management
- **Clear Lifecycle**: Explicit session lifecycle operations
- **State Persistence**: Sessions survive backend restarts
- **User Experience**: Users can resume editing after page refresh or restart

**Source File**: `apps/backend/src/features/characterResolution/characterResolutionController.ts`

## 💾 **Session Management Patterns**

### **SQLite Session Storage Pattern**

For temporary, session-based data that needs to persist across backend restarts, the application uses SQLite with better-sqlite3 instead of the main Prisma database.

**When to Use**:
- Temporary editing sessions
- State that should survive backend restarts
- Data that doesn't need complex relationships
- Lightweight, file-based storage requirements

**Implementation Pattern**:
- **Direct SQL**: Use raw SQL queries with better-sqlite3 (no ORM)
- **WAL Mode**: Enable Write-Ahead Logging for better concurrency
- **Automatic Cleanup**: Implement periodic cleanup of expired sessions
- **Singleton Database**: Use singleton pattern for database connection
- **File-Based**: Store database file in `data/` directory (configurable)

**Example Structure**:
```typescript
// Initialize database with direct SQL
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_expires_at ON sessions(expires_at);
`);

// Enable WAL mode
db.pragma('journal_mode = WAL');
```

**Benefits**:
- **Lightweight**: No additional database server required
- **Fast**: File-based storage with excellent read performance
- **Persistent**: Survives backend restarts
- **Simple**: Direct SQL without ORM overhead
- **Configurable**: Database location configurable via environment variables

**Source File**: `apps/backend/src/features/characterResolution/sessionDatabase.ts`

**Related Documentation**: [Character Resolution System](../character-management/character-resolution-system.md#session-database-schema)

### **Session Lifecycle Management**

Sessions follow a standard lifecycle pattern:

**Initialization**:
- Create session with unique ID
- Store initial state
- Set expiration time
- Return session ID to client

**Update**:
- Load session by ID
- Apply updates to state
- Re-compute derived data
- Update expiration time
- Save updated session

**Resume**:
- Look up session by key (e.g., `characterId:userId`)
- Return stored state if session exists and not expired
- Return null if session expired or not found

**Save**:
- Load session state
- Persist to main database
- Delete session from storage
- Return success

**Cancel**:
- Delete session from storage
- Discard all changes
- Return success

**Cleanup**:
- Periodic background job (every 5 minutes)
- Delete all sessions where `expires_at < now()`
- Log cleanup statistics

**Source File**: `apps/backend/src/features/characterResolution/characterSessionService.ts`

### **Session Expiration Pattern**

Sessions automatically expire after a configurable period of inactivity:

**Expiration Strategy**:
- **Time-Based**: Sessions expire after fixed time period (default: 30 minutes)
- **Activity-Based**: Expiration time extended on each update
- **Configurable**: Expiration time configurable via environment variable
- **Automatic Cleanup**: Background job removes expired sessions

**Implementation**:
- Store `expires_at` timestamp in session record
- Update `expires_at` on each session update
- Filter expired sessions in queries (`WHERE expires_at > now()`)
- Background cleanup job removes expired sessions

**Benefits**:
- **Prevents Stale Data**: Ensures sessions don't accumulate indefinitely
- **Resource Management**: Frees up storage space automatically
- **Data Freshness**: Ensures users get fresh data after inactivity
- **Configurable**: Expiration time can be adjusted per environment

## 🔗 **Integration Patterns**

### **Cross-Service Integration**

Services integrate with each other through well-defined interfaces:

**Service Communication**:
- **Direct Service Calls**: Services call other services directly
- **Interface Contracts**: Well-defined interfaces for service communication
- **Error Propagation**: Proper error handling and propagation
- **Transaction Sharing**: Share transactions when needed

**Integration Benefits**:
- **Loose Coupling**: Services are loosely coupled through interfaces
- **Testability**: Services can be easily mocked for testing
- **Maintainability**: Changes to one service don't affect others
- **Scalability**: Services can be optimized independently

### **Database Integration**

Services integrate with the database through Prisma ORM:

**Prisma Integration**:
- **Type-Safe Queries**: Use Prisma's type-safe query builder
- **Relationship Management**: Handle complex relationships efficiently
- **Transaction Support**: Use Prisma transactions for consistency
- **Performance Optimization**: Optimize queries for performance

**Database Benefits**:
- **Type Safety**: Compile-time type checking for database operations
- **Performance**: Optimized queries and connection management
- **Maintainability**: Database schema changes are handled automatically
- **Reliability**: Proper error handling and transaction management

## 📊 **Error Handling**

### **Error Classification**

**Validation Errors**:
- **Schema Validation**: Zod schema validation errors
- **Business Logic**: Domain-specific business rule violations
- **Constraint Errors**: Database constraint violations
- **Authentication Errors**: Authentication and authorization failures

**System Errors**:
- **Database Errors**: Database connection and query errors
- **Network Errors**: Network connectivity issues
- **Service Errors**: Errors from external services
- **Unexpected Errors**: Unhandled exceptions and errors

### **Error Response Format**

**Standard Error Response**:
- **Error Type**: Classification of the error
- **Message**: Human-readable error message
- **Details**: Additional error information
- **Timestamp**: When the error occurred

**Validation Error Response**:
- **Field Errors**: Field-specific validation errors
- **Global Errors**: Global validation errors
- **Error Path**: Path to the field with the error
- **Error Code**: Machine-readable error code

### **Error Handling Strategy**

**Client Communication**:
- **Appropriate Status Codes**: Return appropriate HTTP status codes
- **Clear Error Messages**: Provide clear, actionable error messages
- **Error Details**: Include relevant error details for debugging
- **Consistent Format**: Use consistent error response format

**Server-Side Handling**:
- **Error Logging**: Log all errors for debugging and monitoring
- **Error Monitoring**: Monitor error rates and patterns
- **Error Recovery**: Implement error recovery strategies
- **Error Prevention**: Prevent errors through validation and testing

## 🔧 **Performance Considerations**

### **Database Optimization**

**Query Optimization**:
- **Efficient Queries**: Use optimized database queries
- **Indexing Strategy**: Proper database indexing for performance
- **Connection Pooling**: Use connection pooling for efficiency
- **Query Caching**: Cache frequently used queries

**Bulk Operations**:
- **Batch Processing**: Process multiple items in batches
- **Transaction Optimization**: Optimize transaction scope and duration
- **Memory Management**: Manage memory usage for large operations
- **Progress Tracking**: Track progress for long-running operations

### **Caching Strategy**

**Application Caching**:
- **In-Memory Caching**: Cache frequently accessed data in memory
- **Cache Invalidation**: Proper cache invalidation strategies
- **Cache Warming**: Pre-populate cache with frequently used data
- **Cache Monitoring**: Monitor cache hit rates and performance

**Response Caching**:
- **HTTP Caching**: Use HTTP caching headers appropriately
- **Conditional Requests**: Support conditional requests for efficiency
- **Cache Control**: Proper cache control headers
- **Cache Busting**: Cache busting strategies for updates

### **Memory Management**

**Memory Optimization**:
- **Streaming**: Stream large datasets instead of loading into memory
- **Garbage Collection**: Proper garbage collection management
- **Memory Monitoring**: Monitor memory usage and patterns
- **Memory Leaks**: Prevent memory leaks through proper cleanup

**Resource Management**:
- **Connection Pooling**: Use connection pooling for database connections
- **Resource Cleanup**: Proper cleanup of resources and connections
- **Resource Limits**: Set appropriate resource limits
- **Resource Monitoring**: Monitor resource usage and patterns

## 🔗 **Security Considerations**

### **Authentication and Authorization**

**Authentication**:
- **Token-Based Authentication**: Use JWT tokens for authentication
- **Token Validation**: Proper token validation and verification
- **Token Refresh**: Implement token refresh mechanisms
- **Session Management**: Proper session management and cleanup

**Authorization**:
- **Role-Based Access Control**: Implement role-based access control
- **Permission Checking**: Check permissions for all operations
- **Resource-Level Authorization**: Authorize access to specific resources
- **Audit Logging**: Log all authorization decisions

### **Input Validation**

**Request Validation**:
- **Schema Validation**: Validate all input using Zod schemas
- **Type Checking**: Ensure proper data types for all inputs
- **Length Limits**: Set appropriate length limits for inputs
- **Format Validation**: Validate input formats and patterns

**Security Validation**:
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Prevention**: Sanitize user inputs to prevent XSS
- **CSRF Protection**: Implement CSRF protection mechanisms
- **Input Sanitization**: Sanitize all user inputs

## 📚 **Related Documentation**

- **[Database Schema Patterns](../database-schema.md)** - Database design patterns and conventions
- **[Validation Schema Patterns](../validation-schemas.md)** - Validation patterns and strategies
- **[Frontend Component Patterns](../frontend-components.md)** - Frontend component patterns
- **[Performance Optimization](../performance-optimization.md)** - Performance optimization strategies
- **[Error Handling](../error-handling.md)** - Error handling patterns and strategies

# Trick System Backend Implementation

*Complete documentation for the trick system backend implementation, including API services, controllers, and business logic for managing companion tricks.*

## 📋 **Overview**

The trick system backend implementation provides the API layer for managing tricks, which are abilities that can be taught to animal companions. The system supports edition-based filtering, visibility management, and source book attribution through transaction-based source book mapping.

The backend implementation follows the shared [Backend Implementation Patterns](../application-overview/backend-implementation.md) with trick-specific business logic and integration patterns.

**Source Files**: 
- Service: `apps/backend/src/features/trick/trickService.ts`
- Controller: `apps/backend/src/features/trick/trickController.ts`
- Routes: `apps/backend/src/features/trick/trickRoutes.ts`
- Types: `apps/backend/src/features/trick/types.ts`

## 🏗️ **Architecture Overview**

The trick system backend follows the shared [Layered Architecture Pattern](../application-overview/backend-implementation.md#layered-architecture-pattern) with trick-specific implementations:

**Routes Layer**: API endpoints for trick management
**Controller Layer**: Request handling and response formatting
**Service Layer**: Trick-specific business logic and data operations
**Database Layer**: Prisma ORM with Trick and TrickSourceMap models

### **Service Architecture**

The trick system uses a service-oriented architecture following the shared [Service-Oriented Architecture](../application-overview/backend-implementation.md#service-oriented-architecture) patterns:

**TrickService**: Central service containing all trick management logic
**Source Book Management**: Transaction-based source book mapping with delete/recreate pattern
**Edition Filtering**: Support for edition-based trick filtering
**Visibility Management**: Support for visibility flag filtering

### **Key Design Principles**

**Trick Definitions**: Admin-managed trick templates for animal companions
**Source Attribution**: Source book mapping for trick attribution
**Edition Support**: Edition-based filtering for multi-edition support
**Visibility Control**: Visibility flag for hiding/showing tricks
**Transaction Safety**: Atomic source book mapping operations

## 🔧 **Core Service Layer**

### **TrickService**

The central service for all trick management operations.

**Purpose**: Provides comprehensive trick management capabilities, from basic CRUD operations to source book mapping management with transaction safety.

**Key Responsibilities**:
- **Trick CRUD**: Create, read, update, and delete trick definitions
- **Source Book Mapping**: Manage trick-to-source book relationships
- **Edition Filtering**: Support for edition-based trick filtering
- **Visibility Filtering**: Support for visibility flag filtering
- **Transaction Safety**: Ensure data consistency through proper transaction handling

**Core Methods**:

#### **getAllTricks**

**Purpose**: Retrieves all tricks with optional edition filtering and visibility filtering.

**Architecture Decision**: Supports optional editionId parameter for filtering tricks by edition, and always filters by isVisible flag to hide unpublished tricks.

**Parameters**: editionId (number, optional) - Edition ID to filter by

**Returns**: GetAllTricksResponse with total count and results array

**Business Logic**:
1. Builds where clause based on editionId parameter:
   - If editionId provided: filters by editionId and isVisible = true
   - If editionId not provided: filters by isVisible = true only
2. Queries tricks with source book information
3. Orders by name (ascending)
4. Returns paginated results with total count

**Source File**: `apps/backend/src/features/trick/trickService.ts`

#### **getTrickById**

**Purpose**: Retrieves a specific trick by ID with source book information.

**Parameters**: TrickIdParamRequest with trick ID

**Returns**: GetTrickResponse with complete trick data including source book information, or null if not found

**Business Logic**:
1. Queries trick by ID
2. Includes related source book information (sourceBookId, pageNumber)
3. Returns complete trick object or null if not found

**Source File**: `apps/backend/src/features/trick/trickService.ts`

#### **createTrick**

**Purpose**: Creates a new trick with source book mapping (admin only).

**Architecture Decision**: Uses transaction to ensure atomic creation of trick and source book mappings. Uses delete/recreate pattern for source book mappings to ensure data consistency.

**Parameters**: CreateTrickRequest with trick data and optional sourceBookInfo array

**Returns**: CreateResponse with created trick ID

**Business Logic**:
1. Extracts sourceBookInfo array from request data
2. Creates trick in transaction:
   - Creates trick record first
   - Creates source book mappings if sourceBookInfo array provided and non-empty
3. Returns created trick ID

**Transaction Pattern**: Uses Prisma transaction to ensure atomic creation of trick and source book mappings.

**Source File**: `apps/backend/src/features/trick/trickService.ts`

#### **updateTrick**

**Purpose**: Updates an existing trick with source book mapping management (admin only).

**Architecture Decision**: Uses delete/recreate pattern for source book mappings to ensure data consistency. Only updates source book mappings if sourceBookInfo array is explicitly provided (undefined means no change).

**Parameters**:
- Query: TrickIdParamRequest with trick ID
- Body: UpdateTrickRequest with updated data and optional sourceBookInfo array

**Returns**: UpdateResponse with success message

**Business Logic**:
1. Extracts sourceBookInfo array from request data
2. Updates trick in transaction:
   - Updates trick record
   - If sourceBookInfo array provided (not undefined):
     - Deletes all existing source book mappings
     - Creates new source book mappings if array is non-empty
3. Returns success response

**Transaction Pattern**: Uses Prisma transaction with delete/recreate pattern for source book mappings.

**Source File**: `apps/backend/src/features/trick/trickService.ts`

#### **deleteTrick**

**Purpose**: Deletes a trick and all related data (admin only).

**Parameters**: TrickIdParamRequest with trick ID

**Returns**: UpdateResponse with success message

**Business Logic**:
1. Deletes trick record (cascades to source book mappings)
2. Returns success response

**Source File**: `apps/backend/src/features/trick/trickService.ts`

## 🎯 **Controller Layer**

The trick controllers follow the shared [Controller Layer Pattern](../application-overview/backend-implementation.md#controller-layer) with trick-specific request handling:

### **TrickController**

**Purpose**: Handles HTTP requests for trick operations, delegating to the trick service and formatting responses.

**Controller Methods**:

#### **GetAllTricks**

**Purpose**: Handles requests for all tricks with optional edition filtering.

**Request**: Optional query parameter editionId

**Response**: GetAllTricksResponse with total and results

**Authentication**: Public (no authentication required)

**Business Logic**:
1. Extracts editionId from query parameters if present
2. Parses editionId to number if provided
3. Calls service with optional editionId parameter

#### **GetTrickById**

**Purpose**: Handles requests for specific trick by ID.

**Request**: Path parameter with trick ID

**Response**: GetTrickResponse with complete trick data, or 404 if not found

**Authentication**: Public (no authentication required)

#### **CreateTrick**

**Purpose**: Handles trick creation requests (admin only).

**Request**: Body with trick data and optional source book information

**Response**: CreateResponse with created trick ID

**Authentication**: Requires admin access

#### **UpdateTrick**

**Purpose**: Handles trick update requests (admin only).

**Request**: Path parameter with trick ID, body with update data

**Response**: UpdateResponse with success message

**Authentication**: Requires admin access

#### **DeleteTrick**

**Purpose**: Handles trick deletion requests (admin only).

**Request**: Path parameter with trick ID

**Response**: 204 No Content

**Authentication**: Requires admin access

**Source File**: `apps/backend/src/features/trick/trickController.ts`

## 🔗 **Routes Layer**

The trick routes follow the shared [RESTful API Structure](../application-overview/backend-implementation.md#restful-api-structure) pattern:

### **TrickRoutes**

**Purpose**: Defines API endpoints for trick operations with proper validation and authentication.

**Route Definitions**:

**Read Routes**:
- **`GET /api/tricks`**: Get all tricks with optional edition filtering (public)
- **`GET /api/tricks/:id`**: Get specific trick by ID (public)

**Write Routes**:
- **`POST /api/tricks`**: Create trick (admin only)
- **`PUT /api/tricks/:id`**: Update trick (admin only)
- **`DELETE /api/tricks/:id`**: Delete trick (admin only)

**Validation Schemas**:
- TrickIdParamSchema for trick ID parameters
- CreateTrickSchema for trick creation
- UpdateTrickSchema for trick updates

**Source File**: `apps/backend/src/features/trick/trickRoutes.ts`

## 🔗 **Integration Points**

### **Companion System Integration**

The trick system integrates with the companion system:

**Integration Pattern**:
- Tricks are associated with character companions through CharacterCompanionTrick junction table
- Character companions can have multiple tricks
- Tricks are managed through companion service transaction patterns

**Benefits**:
- **Flexibility**: Companions can learn multiple tricks
- **Data Integrity**: Transaction-based management prevents orphaned records
- **Consistency**: Delete/recreate pattern ensures clean state

**Related Documentation**: [Companion System Backend Implementation](../companion-system/backend-implementation.md)

### **Source Book System Integration**

Tricks integrate with the source book system:

**Integration Pattern**:
- Tricks have many-to-many relationship with source books through TrickSourceMap
- Source book mappings include page numbers for reference
- Transaction-based management ensures data consistency

**Benefits**:
- **Attribution**: Proper source attribution for all tricks
- **Reference**: Page numbers provide quick reference
- **Data Integrity**: Transaction-based management prevents orphaned records

**Related Documentation**: [Source Book System Backend Implementation](../reference-data/sourcebook-backend-implementation.md)

## 🎯 **Architecture Decisions**

### **Why Delete/Recreate Pattern for Source Book Mappings**

**Decision**: Source book mappings use delete/recreate pattern on updates.

**Rationale**:
- **Data Consistency**: Ensures clean state without orphaned records
- **Simplicity**: Easier to manage than individual add/remove operations
- **Atomic Operations**: Transaction ensures all-or-nothing updates

**Alternatives Considered**:
- Individual source book add/remove operations
- Update-in-place pattern

**Trade-offs**:
- **Benefits**: Atomic operations, data consistency, simpler state management
- **Limitations**: Requires full source book list on update

### **Why Edition-Based Filtering**

**Decision**: Tricks support edition-based filtering through optional editionId parameter.

**Rationale**:
- **Multi-Edition Support**: Supports multiple D&D editions
- **Content Organization**: Allows filtering tricks by edition
- **User Experience**: Users can see only relevant tricks for their edition

**Alternatives Considered**:
- Single edition only
- Complex edition calculation

**Trade-offs**:
- **Benefits**: Multi-edition support, better organization
- **Limitations**: Requires edition assignment for all tricks

### **Why Visibility Flag**

**Decision**: Tricks include isVisible flag for hiding unpublished content.

**Rationale**:
- **Content Management**: Allows hiding incomplete or unpublished tricks
- **User Experience**: Users only see published tricks
- **Workflow Support**: Supports content creation workflow

**Alternatives Considered**:
- No visibility control
- Status-based visibility

**Trade-offs**:
- **Benefits**: Simple, effective content management
- **Limitations**: Binary visibility only

## 📚 **Related Documentation**

- **[Companion System Backend Implementation](../companion-system/backend-implementation.md)** - Companion system integration
- **[Source Book System Backend Implementation](../reference-data/sourcebook-backend-implementation.md)** - Source book integration
- **[Backend Implementation Patterns](../application-overview/backend-implementation.md)** - Shared backend patterns

## Summary

The trick system backend implementation provides a robust, flexible, and efficient foundation for trick management. The implementation follows established patterns, provides comprehensive error handling, and ensures data integrity through proper validation, transaction management, and source book attribution.

Key strengths include:
- **Source Book Attribution**: Proper source attribution with page numbers
- **Edition Filtering**: Multi-edition support with filtering
- **Visibility Management**: Content management through visibility flag
- **Transaction Safety**: Atomic operations for source book mappings
- **Type Safety**: Full TypeScript integration with proper interfaces
- **Error Handling**: Comprehensive error handling with proper logging

The implementation is designed to support animal companion trick management while maintaining simplicity, efficiency, and data integrity.

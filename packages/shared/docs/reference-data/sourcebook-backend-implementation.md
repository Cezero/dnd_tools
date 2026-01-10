# Sourcebook System Backend Implementation

*Complete documentation for the sourcebook system backend implementation, including API services, controllers, and business logic for managing source book cache endpoints.*

## 📋 **Overview**

The sourcebook system backend implementation provides a lightweight cache endpoint for source book data, optimized for frontend performance. The system provides selective field loading with content flags (hasClasses, hasSpells, hasRaces, etc.) to enable efficient filtering and display in the frontend.

The backend implementation follows the shared [Backend Implementation Patterns](../application-overview/backend-implementation.md) with sourcebook-specific business logic and integration patterns.

**Source Files**: 
- Service: `apps/backend/src/features/sourcebook/sourcebookService.ts`
- Controller: `apps/backend/src/features/sourcebook/sourcebookController.ts`
- Routes: `apps/backend/src/features/sourcebook/sourcebookRoutes.ts`
- Types: `apps/backend/src/features/sourcebook/types.ts`

## 🏗️ **Architecture Overview**

The sourcebook system backend follows the shared [Layered Architecture Pattern](../application-overview/backend-implementation.md#layered-architecture-pattern) with sourcebook-specific implementations:

**Routes Layer**: API endpoint for source book cache
**Controller Layer**: Request handling and response formatting
**Service Layer**: Sourcebook-specific business logic and data operations
**Database Layer**: Prisma ORM with SourceBook model

### **Service Architecture**

The sourcebook system uses a service-oriented architecture following the shared [Service-Oriented Architecture](../application-overview/backend-implementation.md#service-oriented-architecture) patterns:

**SourceBookService**: Central service containing source book cache logic
**Selective Field Loading**: Loads only essential fields for cache performance
**Content Flags**: Provides content flags for filtering and display
**Read-Only Operations**: Simple read-only cache endpoint

### **Key Design Principles**

**Cache Optimization**: Selective field loading for performance
**Content Flags**: Boolean flags indicating content types (hasClasses, hasSpells, etc.)
**Lightweight Response**: Minimal data for efficient frontend usage
**Read-Only**: Simple read-only endpoint for cache population

## 🔧 **Core Service Layer**

### **SourceBookService**

The central service for all source book cache operations.

**Purpose**: Provides lightweight source book cache data optimized for frontend performance, including content flags for filtering and display.

**Key Responsibilities**:
- **Cache Data Retrieval**: Retrieves lightweight source book summaries
- **Selective Field Loading**: Loads only essential fields for performance
- **Content Flag Provision**: Provides content flags for filtering
- **Ordered Results**: Returns results ordered by name

**Core Methods**:

#### **getSourceBookCache**

**Purpose**: Retrieves lightweight source book summaries with content flags for frontend cache population.

**Architecture Decision**: Uses selective field loading to include only essential fields and content flags, reducing payload size and improving performance.

**Returns**: SourceBookCacheResponse with total count and results array

**Business Logic**:
1. Queries all source books from database
2. Selects only essential fields:
   - Basic identification: id, name, abbreviation
   - Metadata: editionId, isVisible, settingId
   - Content flags: hasClasses, hasSpells, hasRaces, hasDomains, hasDeities, hasItems
3. Orders by name (ascending)
4. Returns cache response with total count and results

**Content Flags**:
- **hasClasses**: Indicates book contains class options
- **hasSpells**: Indicates book contains spells
- **hasRaces**: Indicates book contains race options
- **hasDomains**: Indicates book contains domain options
- **hasDeities**: Indicates book contains deity options
- **hasItems**: Indicates book contains item options

**Use Case**: Used by frontend to populate source book cache for dropdowns, filtering, and source attribution UI.

**Source File**: `apps/backend/src/features/sourcebook/sourcebookService.ts`

## 🎯 **Controller Layer**

The sourcebook controllers follow the shared [Controller Layer Pattern](../application-overview/backend-implementation.md#controller-layer) with sourcebook-specific request handling:

### **SourceBookController**

**Purpose**: Handles HTTP requests for source book cache operations, delegating to the source book service and formatting responses.

**Controller Methods**:

#### **GetSourceBookCache**

**Purpose**: Handles requests for source book cache data.

**Request**: No parameters

**Response**: SourceBookCacheResponse with total and results

**Authentication**: Public (no authentication required)

**Use Case**: Used by frontend CacheProvider to pre-populate source book cache on app startup.

**Source File**: `apps/backend/src/features/sourcebook/sourcebookController.ts`

## 🔗 **Routes Layer**

The sourcebook routes follow the shared [RESTful API Structure](../application-overview/backend-implementation.md#restful-api-structure) pattern:

### **SourceBookRoutes**

**Purpose**: Defines API endpoint for source book cache with proper validation.

**Route Definitions**:

**Read Routes**:
- **`GET /api/sourcebooks/cache`**: Get source book cache data (public)

**Validation**: No validation schemas required (no input parameters)

**Source File**: `apps/backend/src/features/sourcebook/sourcebookRoutes.ts`

## 🔗 **Integration Points**

### **Frontend Cache System Integration**

The sourcebook system integrates with the frontend cache system:

**Integration Pattern**:
- Source book cache is pre-populated on app startup via CacheProvider
- Cache uses TanStack Query with infinite stale time and garbage collection time
- Cache is used throughout frontend for source book selection and filtering
- Content flags enable efficient filtering by content type

**Process Flow**:
1. Frontend CacheProvider calls `/api/sourcebooks/cache` on app startup
2. Cache is stored in TanStack Query with key `['sourcebooks-cache']`
3. Components use `CacheQueryHooks.useSourcebooksCache()` to access cache
4. Content flags enable filtering (e.g., only show books with classes)

**Benefits**:
- **Performance**: Single cache population on startup
- **Efficiency**: Lightweight payload with only essential fields
- **Filtering**: Content flags enable efficient client-side filtering
- **Consistency**: Single source of truth for source book data

**Related Documentation**: [Cache-Based ID Maps](../application-overview/cache-based-id-maps.md)

### **Source Attribution Integration**

Source books are used throughout the system for source attribution:

**Integration Pattern**:
- All game content (classes, races, spells, feats, etc.) has source book attribution
- Source book cache provides data for source selection UI
- SourceEditor component uses cache for source book dropdowns
- Content flags help filter source books by content type

**Use Cases**:
- **Source Selection**: SourceEditor component uses cache for dropdowns
- **Source Display**: Source attribution displayed throughout UI
- **Content Filtering**: Content flags enable filtering by content type
- **Source Validation**: Cache used for source book validation

**Related Documentation**: Frontend SourceEditor component (see `frontend/src/components/forms/SourceEditor.tsx`)

## 🎯 **Architecture Decisions**

### **Why Selective Field Loading**

**Decision**: Cache endpoint loads only essential fields, excluding large text fields and relationships.

**Rationale**:
- **Performance**: Reduces payload size and improves response time
- **Efficiency**: Frontend only needs basic data for dropdowns and filtering
- **Scalability**: Smaller payloads scale better with many source books

**Alternatives Considered**:
- Loading all fields including description and relationships
- Multiple cache endpoints for different use cases

**Trade-offs**:
- **Benefits**: Better performance, smaller payloads, faster responses
- **Limitations**: Full source book data requires separate endpoint

### **Why Content Flags**

**Decision**: Source books include boolean flags indicating content types (hasClasses, hasSpells, etc.).

**Rationale**:
- **Filtering**: Enables efficient client-side filtering by content type
- **User Experience**: Users can filter source books by content they're looking for
- **Performance**: Avoids need for complex server-side queries

**Alternatives Considered**:
- Querying relationships to determine content types
- Separate endpoints for each content type

**Trade-offs**:
- **Benefits**: Efficient filtering, better UX, simpler queries
- **Limitations**: Requires flag maintenance when content is added/removed

### **Why Read-Only Cache Endpoint**

**Decision**: Source book system provides only read-only cache endpoint, no CRUD operations.

**Rationale**:
- **Separation of Concerns**: Source book management handled elsewhere (admin tools)
- **Simplicity**: Cache endpoint focused on performance and efficiency
- **Security**: Read-only endpoint reduces attack surface

**Alternatives Considered**:
- Full CRUD operations in source book service
- Separate cache and management endpoints

**Trade-offs**:
- **Benefits**: Simpler implementation, focused on performance
- **Limitations**: Source book management requires separate system

## 📚 **Related Documentation**

- **[Reference Data System README](./README.md)** - Reference data system overview
- **[Cache-Based ID Maps](../application-overview/cache-based-id-maps.md)** - Frontend cache system
- **[Backend Implementation Patterns](../application-overview/backend-implementation.md)** - Shared backend patterns

## Summary

The sourcebook system backend implementation provides a simple, efficient, and performant foundation for source book cache management. The implementation follows established patterns, provides selective field loading for performance, and includes content flags for efficient filtering.

Key strengths include:
- **Cache Optimization**: Selective field loading reduces payload size
- **Content Flags**: Boolean flags enable efficient filtering by content type
- **Performance**: Lightweight response optimized for frontend cache
- **Simplicity**: Read-only endpoint focused on cache population
- **Integration**: Seamless integration with frontend cache system
- **Type Safety**: Full TypeScript integration with proper interfaces
- **Error Handling**: Comprehensive error handling with proper logging

The implementation is designed to support source book cache population for frontend dropdowns, filtering, and source attribution while maintaining simplicity, efficiency, and performance.

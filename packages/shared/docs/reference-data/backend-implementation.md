# Reference Tables System Backend Implementation

*Complete documentation for the reference tables system backend implementation, including API services, controllers, and business logic for managing dynamic reference tables with complex nested structures.*

## 📋 **Overview**

The reference tables system backend implementation provides the API layer for managing dynamic reference tables, which contain structured game data such as random encounter tables, treasure tables, and other lookup data. The system supports complex nested structures (Table → Columns → Rows → Cells) with index-based ordering and transaction-based management.

The backend implementation follows the shared [Backend Implementation Patterns](../application-overview/backend-implementation.md) with reference table-specific business logic and integration patterns.

**Source Files**: 
- Service: `apps/backend/src/features/referencetables/referenceTableService.ts`
- Controller: `apps/backend/src/features/referencetables/referenceTableController.ts`
- Routes: `apps/backend/src/features/referencetables/referenceTableRoutes.ts`
- Types: `apps/backend/src/features/referencetables/types.ts`

## 🏗️ **Architecture Overview**

The reference tables system backend follows the shared [Layered Architecture Pattern](../application-overview/backend-implementation.md#layered-architecture-pattern) with reference table-specific implementations:

**Routes Layer**: API endpoints for reference table management
**Controller Layer**: Request handling and response formatting
**Service Layer**: Reference table-specific business logic and data operations
**Database Layer**: Prisma ORM with ReferenceTable, ReferenceTableColumn, ReferenceTableRow, and ReferenceTableCell models

### **Service Architecture**

The reference tables system uses a service-oriented architecture following the shared [Service-Oriented Architecture](../application-overview/backend-implementation.md#service-oriented-architecture) patterns:

**ReferenceTableService**: Central service containing all reference table management logic
**Complex Nested Structure**: Manages four-level hierarchy (Table → Columns → Rows → Cells)
**Index-Based Ordering**: Uses index fields for maintaining column and row order
**Transaction Safety**: Ensures data consistency through proper transaction handling
**Delete/Recreate Pattern**: Uses delete/recreate pattern for updates to ensure data consistency

### **Key Design Principles**

**Nested Structure**: Four-level hierarchy supporting complex table structures
**Index-Based Ordering**: Index fields maintain column and row order
**Slug-Based Identification**: Tables identified by slug for URL-friendly references
**Transaction Management**: Atomic operations for nested data creation and updates
**Delete/Recreate Pattern**: Ensures clean state on updates

## 🔧 **Core Service Layer**

### **ReferenceTableService**

The central service for all reference table management operations.

**Purpose**: Provides comprehensive reference table management capabilities, from basic CRUD operations to complex nested structure management with transaction safety.

**Key Responsibilities**:
- **Reference Table CRUD**: Create, read, update, and delete reference tables
- **Nested Structure Management**: Manage columns, rows, and cells within transactions
- **Index-Based Ordering**: Maintain column and row order through index fields
- **Data Loading**: Efficient loading of complete table structures with all nested data
- **Summary Queries**: Provide lightweight table summaries with row/column counts

**Core Methods**:

#### **getAllReferenceTables**

**Purpose**: Retrieves all reference tables with row and column counts.

**Architecture Decision**: Uses Prisma `_count` to efficiently calculate row and column counts without loading full table data.

**Returns**: GetAllReferenceTablesResponse with total count and results array including row/column counts

**Business Logic**:
1. Queries all reference tables from database
2. Includes `_count` for rows and columns
3. Maps results to include row and column counts in response
4. Returns paginated results with total count

**Source File**: `apps/backend/src/features/referencetables/referenceTableService.ts`

#### **getReferenceTableData**

**Purpose**: Retrieves complete reference table structure with all columns, rows, and cells.

**Architecture Decision**: Orders columns and rows by index to ensure proper display order. Orders cells by column index within each row.

**Parameters**: ReferenceTableSlugParamRequest with table slug

**Returns**: ReferenceTableDataResponse with complete table structure including all nested data, or null if not found

**Business Logic**:
1. Queries reference table by slug
2. Includes columns ordered by index (ascending)
3. Includes rows ordered by index (ascending)
4. For each row, includes cells ordered by column index (ascending)
5. Returns complete table structure or null if not found

**Use Case**: Used by frontend markdown rendering system to retrieve complete table data for rendering.

**Source File**: `apps/backend/src/features/referencetables/referenceTableService.ts`

#### **getReferenceTableSummary**

**Purpose**: Retrieves lightweight table summary with row and column counts.

**Architecture Decision**: Uses Prisma `_count` to provide metadata without loading full table data.

**Parameters**: ReferenceTableSlugParamRequest with table slug

**Returns**: ReferenceTableSummary with table metadata and row/column counts, or null if not found

**Business Logic**:
1. Queries reference table by slug
2. Includes `_count` for rows and columns
3. Maps result to include row and column counts
4. Returns summary or null if not found

**Use Case**: Used for table list views and quick metadata queries.

**Source File**: `apps/backend/src/features/referencetables/referenceTableService.ts`

#### **createReferenceTable**

**Purpose**: Creates a new reference table with columns, rows, and cells in a single transaction.

**Architecture Decision**: Uses nested create operations within a transaction to ensure atomic creation of all table components.

**Parameters**: ReferenceTableUpdate with table data including columns, rows, and cells

**Returns**: CreateResponse with created table slug

**Business Logic**:
1. Creates reference table in transaction:
   - Creates table record with slug, name, description
   - Creates columns if provided
   - Creates rows if provided
   - For each row, creates cells if provided
2. Returns created table slug

**Transaction Pattern**: Uses Prisma transaction with nested create operations to ensure atomic creation of all table components.

**Source File**: `apps/backend/src/features/referencetables/referenceTableService.ts`

#### **updateReferenceTable**

**Purpose**: Updates a reference table using delete/recreate pattern for all nested data.

**Architecture Decision**: Uses delete/recreate pattern to ensure data consistency. Deletes all nested data (cells, rows, columns) before recreating, ensuring clean state.

**Parameters**:
- Query: ReferenceTableSlugParamRequest with table slug
- Body: ReferenceTableUpdate with updated table data

**Returns**: UpdateResponse with success message

**Business Logic**:
1. Updates table main fields (name, description) in transaction
2. Deletes all existing nested data:
   - Deletes all cells for the table
   - Deletes all rows for the table
   - Deletes all columns for the table
3. Recreates columns if provided
4. Recreates rows and cells if provided:
   - Creates each row individually
   - Creates cells for each row with proper tableSlug and rowIndex references
5. Returns success response

**Transaction Pattern**: Uses Prisma transaction with delete/recreate pattern to ensure atomic updates of all table components.

**Rationale for Delete/Recreate**: 
- Ensures clean state without orphaned records
- Simplifies update logic compared to individual add/remove operations
- Guarantees data consistency

**Source File**: `apps/backend/src/features/referencetables/referenceTableService.ts`

#### **deleteReferenceTable**

**Purpose**: Deletes a reference table and all related data (cascade).

**Parameters**: ReferenceTableSlugParamRequest with table slug

**Returns**: UpdateResponse with success message

**Business Logic**:
1. Deletes reference table record (cascades to columns, rows, and cells)
2. Returns success response

**Source File**: `apps/backend/src/features/referencetables/referenceTableService.ts`

## 🎯 **Controller Layer**

The reference table controllers follow the shared [Controller Layer Pattern](../application-overview/backend-implementation.md#controller-layer) with reference table-specific request handling:

### **ReferenceTableController**

**Purpose**: Handles HTTP requests for reference table operations, delegating to the reference table service and formatting responses.

**Controller Methods**:

#### **GetAllReferenceTables**

**Purpose**: Handles requests for all reference tables with metadata.

**Request**: No parameters

**Response**: GetAllReferenceTablesResponse with total and results including row/column counts

**Authentication**: Public (no authentication required)

#### **GetReferenceTable**

**Purpose**: Handles requests for complete reference table data by slug.

**Request**: Path parameter with table slug

**Response**: ReferenceTableDataResponse with complete table structure, or 404 if not found

**Authentication**: Public (no authentication required)

**Use Case**: Used by frontend markdown rendering system to retrieve table data for rendering.

#### **GetReferenceTableSummary**

**Purpose**: Handles requests for lightweight table summary by slug.

**Request**: Path parameter with table slug

**Response**: ReferenceTableSummary with table metadata and counts

**Authentication**: Public (no authentication required)

#### **CreateReferenceTable**

**Purpose**: Handles reference table creation requests (admin only).

**Request**: Body with complete table data including columns, rows, and cells

**Response**: CreateResponse with created table slug

**Authentication**: Requires admin access

#### **UpdateReferenceTable**

**Purpose**: Handles reference table update requests (admin only).

**Request**: Path parameter with table slug, body with updated table data

**Response**: UpdateResponse with success message

**Authentication**: Requires admin access

#### **DeleteReferenceTable**

**Purpose**: Handles reference table deletion requests (admin only).

**Request**: Path parameter with table slug

**Response**: UpdateResponse with success message

**Authentication**: Requires admin access

**Source File**: `apps/backend/src/features/referencetables/referenceTableController.ts`

## 🔗 **Routes Layer**

The reference table routes follow the shared [RESTful API Structure](../application-overview/backend-implementation.md#restful-api-structure) pattern:

### **ReferenceTableRoutes**

**Purpose**: Defines API endpoints for reference table operations with proper validation and authentication.

**Route Definitions**:

**Read Routes**:
- **`GET /api/referencetables`**: Get all reference tables with metadata (public)
- **`GET /api/referencetables/:slug`**: Get complete reference table data by slug (public)
- **`GET /api/referencetables/:slug/summary`**: Get reference table summary by slug (public)

**Write Routes**:
- **`POST /api/referencetables`**: Create reference table (admin only)
- **`PUT /api/referencetables/:slug`**: Update reference table (admin only)
- **`DELETE /api/referencetables/:slug`**: Delete reference table (admin only)

**Validation Schemas**:
- ReferenceTableSlugParamSchema for table slug parameters
- ReferenceTableUpdateSchema for table creation and updates

**Source File**: `apps/backend/src/features/referencetables/referenceTableRoutes.ts`

## 🔗 **Integration Points**

### **Frontend Markdown Rendering Integration**

The reference tables system integrates with the frontend markdown rendering system:

**Integration Pattern**:
- Tables are embedded in markdown via `{table: slug}` or `[table: slug]` syntax
- Frontend preloads tables from markdown content using regex matching
- Tables are rendered as HTML table elements with proper formatting
- Pre-rendered tables are cached for performance

**Process Flow**:
1. Markdown content is scanned for table references using regex: `/[[{]table:\s([\w-]+)[\]}]/gi`
2. Unique table slugs are extracted
3. Tables are preloaded from backend API
4. Tables are rendered to HAST (HTML Abstract Syntax Tree) elements
5. Pre-rendered tables are cached by markdown component ID
6. Tables are inserted into markdown during rendering

**Benefits**:
- **Dynamic Content**: Tables can be updated without modifying markdown
- **Reusability**: Tables can be referenced from multiple markdown files
- **Performance**: Preloading and caching improve rendering performance
- **Consistency**: Single source of truth for table data

**Related Documentation**: Frontend markdown rendering system (see `frontend/src/lib/TableResolution.ts`)

## 🎯 **Architecture Decisions**

### **Why Delete/Recreate Pattern for Updates**

**Decision**: Reference table updates use delete/recreate pattern for all nested data (columns, rows, cells).

**Rationale**:
- **Data Consistency**: Ensures clean state without orphaned records
- **Simplicity**: Easier to manage than individual add/remove/update operations
- **Atomic Operations**: Transaction ensures all-or-nothing updates
- **Complex Relationships**: Nested structure makes incremental updates complex

**Alternatives Considered**:
- Individual add/remove/update operations for each component
- Update-in-place pattern with change detection

**Trade-offs**:
- **Benefits**: Atomic operations, data consistency, simpler state management
- **Limitations**: Requires full table data on update, may be slower for large tables

### **Why Index-Based Ordering**

**Decision**: Columns and rows use index fields for ordering rather than relying on creation order or IDs.

**Rationale**:
- **Explicit Control**: Index provides explicit control over display order
- **Flexibility**: Allows reordering without changing data
- **Performance**: Index-based ordering is efficient in queries
- **Consistency**: Ensures consistent ordering across queries

**Alternatives Considered**:
- Creation order (timestamp-based)
- ID-based ordering
- Name-based ordering

**Trade-offs**:
- **Benefits**: Explicit control, flexible reordering, efficient queries
- **Limitations**: Requires index management

### **Why Slug-Based Identification**

**Decision**: Tables are identified by slug rather than numeric ID.

**Rationale**:
- **URL-Friendly**: Slugs are URL-friendly and readable
- **Markdown Integration**: Slugs work well in markdown syntax
- **Human-Readable**: Slugs are easier to remember and reference
- **Stability**: Slugs provide stable references even if table is recreated

**Alternatives Considered**:
- Numeric ID-based identification
- UUID-based identification

**Trade-offs**:
- **Benefits**: URL-friendly, human-readable, stable references
- **Limitations**: Requires slug uniqueness validation

### **Why Complex Nested Structure**

**Decision**: Reference tables use four-level hierarchy (Table → Columns → Rows → Cells).

**Rationale**:
- **Flexibility**: Supports complex table structures with merged cells
- **D&D 3.5 Compliance**: Supports complex reference tables from rulebooks
- **Extensibility**: Structure supports future enhancements
- **Data Integrity**: Proper relationships ensure data consistency

**Alternatives Considered**:
- Flat structure with JSON data
- Three-level hierarchy (Table → Rows → Cells)

**Trade-offs**:
- **Benefits**: Flexible, supports complex structures, proper relationships
- **Limitations**: More complex to manage, requires transaction handling

## 📚 **Related Documentation**

- **[Reference Data System README](./README.md)** - Reference data system overview
- **[Backend Implementation Patterns](../application-overview/backend-implementation.md)** - Shared backend patterns

## Summary

The reference tables system backend implementation provides a robust, flexible, and efficient foundation for managing dynamic reference tables with complex nested structures. The implementation follows established patterns, provides comprehensive error handling, and ensures data integrity through proper validation, transaction management, and index-based ordering.

Key strengths include:
- **Complex Nested Structure**: Four-level hierarchy supports complex table structures
- **Index-Based Ordering**: Explicit control over column and row order
- **Transaction Safety**: Atomic operations for nested data creation and updates
- **Delete/Recreate Pattern**: Ensures clean state on updates
- **Slug-Based Identification**: URL-friendly and human-readable references
- **Markdown Integration**: Seamless integration with frontend markdown rendering
- **Type Safety**: Full TypeScript integration with proper interfaces
- **Error Handling**: Comprehensive error handling with proper logging

The implementation is designed to support dynamic reference tables for game rules, encounter tables, treasure tables, and other structured data while maintaining simplicity, efficiency, and data integrity.

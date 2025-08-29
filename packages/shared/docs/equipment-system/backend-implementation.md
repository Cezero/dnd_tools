# Equipment System Backend Implementation

*Complete documentation for the equipment system backend implementation, including API services, controllers, and business logic.*

## 📋 **Overview**

The equipment system backend implementation provides the API layer for equipment management, including CRUD operations, business logic, and data validation. The implementation follows a layered architecture pattern with clear separation of concerns.

The backend implementation follows the shared [Backend Implementation Patterns](../application-overview/backend-implementation.md) with equipment-specific business logic and integration patterns.

**Source Files**: 
- Service: `src/features/item/itemService.ts`
- Controller: `src/features/item/itemController.ts`
- Routes: `src/features/item/itemRoutes.ts`
- Types: `src/features/item/types.ts`

## 🏗️ **Architecture Overview**

The equipment system backend follows the shared [Layered Architecture Pattern](../application-overview/backend-implementation.md#layered-architecture-pattern) with equipment-specific implementations:

**Routes Layer**: API endpoints for equipment management and related operations
**Controller Layer**: Request handling and response formatting for equipment operations
**Service Layer**: Equipment-specific business logic and data operations
**Database Layer**: Prisma ORM with equipment system models

### **Service Architecture**

The equipment system uses a service-oriented architecture following the shared [Service-Oriented Architecture](../application-overview/backend-implementation.md#service-oriented-architecture) patterns:

**ItemService**: Central service containing all equipment management logic
**Transaction Safety**: Consistent transaction patterns for data integrity
**Relationship Management**: Complex equipment relationship handling with weapon and armor extensions
**Validation**: Comprehensive validation at all levels using Zod schemas

### **Key Design Principles**

**Equipment Management**: Complete CRUD operations for equipment definitions
**Weapon Integration**: Integration with weapon-specific data through one-to-one relationships
**Armor Integration**: Integration with armor-specific data through one-to-one relationships
**Validation**: Comprehensive validation at all levels using Zod schemas
**Character Integration**: Support for character equipment management

## 🔧 **Core Service Layer**

### **ItemService**

The central service for all equipment management operations, providing comprehensive equipment CRUD operations and integration with weapon and armor extensions.

**Purpose**: Provides comprehensive equipment management capabilities, from basic equipment CRUD to complex integrations with weapon and armor extensions.

**Key Responsibilities**:
- **Equipment CRUD**: Create, read, update, and delete equipment definitions
- **Weapon Management**: Manage weapon-specific data through one-to-one relationships
- **Armor Management**: Manage armor-specific data through one-to-one relationships
- **Transaction Safety**: Ensure data consistency through proper transaction handling
- **Validation**: Validate equipment data and relationships

**Core Methods**:

**getAllItems**: Retrieves all equipment with weapon and armor details
- **Parameters**: None
- **Business Logic**: Loads all equipment with weapon and armor relationships, provides total count
- **Returns**: Array of equipment with relationships and total count

**itemQuery**: Retrieves equipment with advanced filtering and relationship loading
- **Parameters**: Query request with query type (byType, byCategory, byName)
- **Business Logic**: Loads equipment with filtering, includes weapon and armor relationships
- **Returns**: Array of equipment with relationships and total count

**getItemById**: Retrieves a specific equipment item by ID with full related data
- **Parameters**: Equipment ID
- **Business Logic**: Loads equipment by unique ID with weapon and armor relationships, returns null if not found
- **Returns**: Complete equipment object with relationships or null

**createItem**: Creates a new equipment item with validation and relationship management
- **Parameters**: Complete equipment creation data including weapon and armor data
- **Business Logic**: Creates equipment in database with weapon and armor relationships through transactions
- **Returns**: Created equipment ID and success message

**updateItem**: Updates an existing equipment item with relationship management
- **Parameters**: Equipment ID and updated data including weapon and armor data
- **Business Logic**: Updates equipment data and manages weapon and armor relationships through transactions
- **Returns**: Success message

**deleteItem**: Deletes an equipment item
- **Parameters**: Equipment ID
- **Business Logic**: Deletes equipment (cascades to relationships)
- **Returns**: Success message

**Source File**: `src/features/item/itemService.ts`

## 🎯 **Controller Layer**

The equipment system controllers follow the shared [Controller Layer Pattern](../application-overview/backend-implementation.md#controller-layer) with equipment-specific request handling:

### **ItemController**

**Purpose**: Handles HTTP requests and responses for equipment system operations, delegating business logic to the service layer.

**Key Responsibilities**:
- **Request Processing**: Handle incoming HTTP requests with proper validation
- **Response Formatting**: Format responses according to API standards
- **Error Handling**: Provide appropriate error responses and status codes
- **Authentication**: Enforce admin authentication for write operations

**Core Methods**:

**GetAllItems**: Retrieves all equipment
- **Route**: `GET /api/items`
- **Response**: Array of equipment with total count

**ItemQuery**: Retrieves equipment with advanced filtering
- **Route**: `GET /api/items/query`
- **Parameters**: Query type (byType, byCategory, byName)
- **Response**: Array of equipment with relationships and total count

**GetItemById**: Retrieves a specific equipment item by ID
- **Route**: `GET /api/items/:id`
- **Parameters**: Equipment ID in URL path
- **Response**: Complete equipment with relationships or 404 error

**CreateItem**: Creates a new equipment item
- **Route**: `POST /api/items`
- **Authentication**: Admin required
- **Body**: Complete equipment creation data
- **Response**: Created equipment ID and success message

**UpdateItem**: Updates an existing equipment item
- **Route**: `PUT /api/items/:id`
- **Authentication**: Admin required
- **Body**: Equipment update data
- **Response**: Success message

**DeleteItem**: Deletes an equipment item
- **Route**: `DELETE /api/items/:id`
- **Authentication**: Admin required
- **Response**: Success message

**Source File**: `src/features/item/itemController.ts`

## 🔗 **Routes Layer**

The equipment system routes follow the shared [RESTful API Structure](../application-overview/backend-implementation.md#restful-api-structure) with equipment-specific endpoints:

### **ItemRoutes**

**Purpose**: Defines API endpoints and request validation for equipment system operations.

**Route Structure**:
- **Core Equipment Routes**: Standard CRUD operations for equipment
- **Equipment Query Routes**: Advanced querying with filtering
- **Equipment Integration Routes**: Integration with weapon and armor extensions

**Route Definitions**:

**Core Equipment Routes**:
- `GET /api/items` - Retrieve all equipment
- `GET /api/items/:id` - Retrieve specific equipment by ID
- `POST /api/items` - Create new equipment (admin required)
- `PUT /api/items/:id` - Update existing equipment (admin required)
- `DELETE /api/items/:id` - Delete equipment (admin required)

**Equipment Query Routes**:
- `GET /api/items/query` - Query equipment with filtering

**Authentication**: Admin authentication required for all write operations
**Validation**: All routes use Zod schemas for request validation

**Source File**: `src/features/item/itemRoutes.ts`

## 🔧 **Business Logic Patterns**

### **Weapon Extension Management**

The equipment system manages weapon-specific data through one-to-one relationships:

**Weapon Categories**: Simple, martial, and exotic weapons
**Weapon Types**: Unarmed, light melee, one-handed melee, two-handed melee, and ranged weapons
**Weapon Properties**: Damage, critical, range, damage type, and special properties
**Weapon Relationships**: One-to-one relationship with equipment items

**Integration Pattern**: The equipment service manages weapon relationships through database transactions, ensuring data consistency and proper relationship handling.

**Related Documentation**: [Equipment System Static Data](static-data.md)

### **Armor Extension Management**

The equipment system manages armor-specific data through one-to-one relationships:

**Armor Categories**: Light, medium, heavy, shield, and extra armor
**Armor Properties**: Bonus, dexterity cap, check penalty, arcane spell failure, and speed caps
**Armor Relationships**: One-to-one relationship with equipment items
**Armor Calculations**: Armor bonus calculations and restrictions

**Integration Pattern**: The equipment service manages armor relationships through database transactions, ensuring data consistency and proper relationship handling.

**Related Documentation**: [Equipment System Static Data](static-data.md)

## 🔗 **Integration Points**

### **Character System Integration**

The equipment system integrates with the character system through equipment selection and usage:

**Equipment Selection**: Characters can select and acquire equipment
**Equipment Usage**: Characters can use equipment for combat and other activities
**Equipment Benefits**: Character abilities are modified by equipment
**Equipment Restrictions**: Equipment restrictions based on character capabilities

**Integration Pattern**: The equipment system provides the framework for character equipment management, with character abilities and proficiencies determining equipment access and usage.

**Related Documentation**: [Character Management Backend Implementation](../character-management/backend-implementation.md)

## 📊 **Error Handling**

The equipment system follows the shared [Error Handling Patterns](../application-overview/backend-implementation.md#error-handling) with equipment-specific error scenarios:

**Validation Errors**: Zod schema validation errors with detailed field information
**Business Logic Errors**: Equipment-specific business rule violations
**Database Errors**: Prisma ORM errors with proper error messages
**Relationship Errors**: Errors from complex weapon and armor relationship management

## 🔧 **Performance Considerations**

The equipment system implements performance optimizations following the shared [Performance Optimization](../application-overview/performance-optimization.md) patterns:

**Efficient Queries**: Optimized Prisma queries with proper includes and where clauses
**Relationship Loading**: Efficient loading of complex equipment relationships
**Caching**: Appropriate caching for frequently accessed equipment data
**Pagination**: Proper pagination for large equipment collections

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Equipment system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Equipment system validation rules and schemas
- **[Static Data](static-data.md)** - Equipment system enums and types
- **[Frontend Components](frontend-components.md)** - Equipment system frontend implementation
- **[Character Management Backend Implementation](../character-management/backend-implementation.md)** - Character system integration
- **[Backend Implementation Patterns](../application-overview/backend-implementation.md)** - Shared backend patterns and conventions
- **[Performance Optimization](../application-overview/performance-optimization.md)** - Shared performance optimization strategies

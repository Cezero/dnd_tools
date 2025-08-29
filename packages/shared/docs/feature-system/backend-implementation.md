# Feature System Backend Implementation

*Comprehensive documentation of the backend implementation for the feature system, including services, controllers, routes, and business logic.*

## 📋 **Overview**

The feature system backend provides a comprehensive API for managing features and their progressions. It includes individual CRUD operations for features, bulk operations for feature progressions, and comprehensive business logic for feature calculations and validations.

The backend implementation follows the shared [Backend Implementation Patterns](../application-overview/backend-implementation.md) with feature-specific business logic and integration patterns.

**Source Files**: 
- Service: `src/features/featureSystem/featureSystemService.ts`
- Controller: `src/features/featureSystem/featureSystemController.ts`
- Routes: `src/features/featureSystem/featureSystemRoutes.ts`
- Types: `src/features/featureSystem/types.ts`
- Formula Utilities: `src/utils/formulaParamTransformers.ts`

## 🏗️ **Architecture Overview**

The feature system backend follows the shared [Layered Architecture Pattern](../application-overview/backend-implementation.md#layered-architecture-pattern) with feature-specific implementations:

**Routes Layer**: API endpoints for feature and feature progression management
**Controller Layer**: Request handling and response formatting for feature operations
**Service Layer**: Feature-specific business logic and data operations
**Database Layer**: Prisma ORM with feature system models

### **Service Architecture**

The feature system uses a service-oriented architecture following the shared [Service-Oriented Architecture](../application-overview/backend-implementation.md#service-oriented-architecture) patterns:

**FeatureSystemService**: Central service containing all feature and feature progression management logic
**Individual CRUD Operations**: Complete CRUD operations for standalone features
**Bulk Operations**: Efficient bulk operations for feature progressions with relationships
**Transaction Safety**: Consistent transaction patterns for data integrity
**Formula Integration**: Full integration with the formula system for dynamic calculations

### **Key Design Principles**

**Individual Feature Management**: Complete CRUD operations for standalone features
**Bulk Progression Operations**: Efficient bulk operations for class/race feature progressions
**Relationship Management**: Proper handling of nested modifiers, choices, and effects
**Formula Support**: Full support for mathematical formulas and dynamic calculations
**Validation**: Comprehensive validation at all levels using Zod schemas

## 🔧 **Core Service Layer**

### **FeatureSystemService**

The central service for all feature and feature progression management, providing both individual CRUD operations and bulk operations.

**Purpose**: Provides comprehensive feature management capabilities, from individual feature CRUD to bulk progression operations with full relationship support.

**Key Responsibilities**:
- **Feature CRUD**: Create, read, update, and delete individual features
- **Feature Progression Management**: Create, update, and delete feature progressions with relationships
- **Relationship Management**: Handle nested modifiers, choices, and effects
- **Transaction Safety**: Ensure data consistency through proper transaction handling
- **Validation**: Validate feature data and relationships
- **Formula Integration**: Handle formula parameters and calculations

**Core Methods**:

**getAllFeatures**: Retrieves features with optional source type filtering
- **Parameters**: Optional sourceType for filtering (0=class, 1=race)
- **Business Logic**: Filters out special features (IDs 1-5), applies source type filtering, excludes features already associated with classes/races when no source type specified
- **Returns**: Array of features with total count

**getFeatureById**: Retrieves a specific feature by ID
- **Parameters**: Feature ID
- **Business Logic**: Loads feature with prerequisites included
- **Returns**: Feature with prerequisites or null

**createFeature**: Creates a new feature with prerequisites
- **Parameters**: Feature data including optional prerequisites
- **Business Logic**: Creates feature in transaction, then creates prerequisites if provided
- **Returns**: Created feature ID and success message

**updateFeature**: Updates an existing feature
- **Parameters**: Feature ID and updated data
- **Business Logic**: Updates feature data, handles prerequisite updates
- **Returns**: Success message

**deleteFeature**: Deletes a feature
- **Parameters**: Feature ID
- **Business Logic**: Deletes feature (cascades to progressions, modifiers, etc.)
- **Returns**: Success message

**createFeatureProgressionWithRelations**: Creates a feature progression with all related data
- **Parameters**: Complete feature progression data including modifiers, choices, effects
- **Business Logic**: Creates progression in transaction, then creates all related data (modifiers with conditions and formula params, choices with formula params, effects)
- **Returns**: Created progression ID and success message

**createMultipleFeatureProgressions**: Creates multiple feature progressions for a class or race
- **Parameters**: Array of progression data, context (classId/raceId), optional transaction
- **Business Logic**: Creates multiple progressions with full relationship data, handles formula parameter transformations
- **Returns**: Void (creates all progressions)

**deleteFeatureProgressionsForContext**: Deletes all feature progressions for a class or race
- **Parameters**: Context (classId/raceId), optional transaction
- **Business Logic**: Cascades deletion to all related data (modifiers, choices, effects)
- **Returns**: Void (deletion confirmation)

**updateFeatureProgressions**: Updates feature progressions for a specific feature
- **Parameters**: Feature ID and array of updated progression data
- **Business Logic**: Deletes existing progressions and creates new ones with updated data
- **Returns**: Success message

**getFeatureProgressions**: Retrieves feature progressions for a specific feature
- **Parameters**: Feature ID
- **Business Logic**: Loads all progressions for the feature with relationships
- **Returns**: Array of feature progressions

**Source File**: `src/features/featureSystem/featureSystemService.ts`

## 🎯 **Controller Layer**

The feature system controllers follow the shared [Controller Layer Pattern](../application-overview/backend-implementation.md#controller-layer) with feature-specific request handling:

### **FeatureSystemController**

**Purpose**: Handles HTTP requests and responses for feature system operations, delegating business logic to the service layer.

**Key Responsibilities**:
- **Request Processing**: Handle incoming HTTP requests with proper validation
- **Response Formatting**: Format responses according to API standards
- **Error Handling**: Provide appropriate error responses and status codes
- **Authentication**: Enforce admin authentication for write operations

**Core Methods**:

**GetAllFeatures**: Retrieves all features with optional filtering
- **Route**: `GET /api/features`
- **Query Parameters**: Optional sourceType for filtering
- **Response**: Array of features with total count

**GetFeatureById**: Retrieves a specific feature by ID
- **Route**: `GET /api/features/:id`
- **Parameters**: Feature ID in URL path
- **Response**: Feature with prerequisites or 404 error

**CreateFeature**: Creates a new feature
- **Route**: `POST /api/features`
- **Authentication**: Admin required
- **Body**: Feature creation data with prerequisites
- **Response**: Created feature ID and success message

**UpdateFeatureById**: Updates an existing feature
- **Route**: `PUT /api/features/:id`
- **Authentication**: Admin required
- **Body**: Feature update data
- **Response**: Success message

**DeleteFeatureById**: Deletes a feature
- **Route**: `DELETE /api/features/:id`
- **Authentication**: Admin required
- **Response**: Success message

**CreateFeatureProgressionWithRelations**: Creates feature progression with relationships
- **Route**: `POST /api/features/progressions/bulk`
- **Authentication**: Admin required
- **Body**: Complete feature progression data
- **Response**: Created progression ID and success message

**UpdateFeatureProgressions**: Updates feature progressions for a feature
- **Route**: `PUT /api/features/:id/progressions`
- **Authentication**: Admin required
- **Body**: Array of updated progression data
- **Response**: Success message

**GetFeatureProgressions**: Retrieves progressions for a feature
- **Route**: `GET /api/features/:id/progressions`
- **Response**: Array of feature progressions

**Source File**: `src/features/featureSystem/featureSystemController.ts`

## 🔗 **Routes Layer**

The feature system routes follow the shared [RESTful API Structure](../application-overview/backend-implementation.md#restful-api-structure) with feature-specific endpoints:

### **FeatureSystemRoutes**

**Purpose**: Defines API endpoints and request validation for feature system operations.

**Route Structure**:
- **Core Feature Routes**: Standard CRUD operations for features
- **Feature Progression Routes**: Individual feature progression management
- **Bulk Feature Progression Routes**: Bulk operations for class/race integration

**Route Definitions**:

**Core Feature Routes**:
- `GET /api/features` - Retrieve all features with optional filtering
- `GET /api/features/:id` - Retrieve specific feature by ID
- `POST /api/features` - Create new feature (admin required)
- `PUT /api/features/:id` - Update existing feature (admin required)
- `DELETE /api/features/:id` - Delete feature (admin required)

**Feature Progression Routes**:
- `GET /api/features/:id/progressions` - Retrieve progressions for feature
- `PUT /api/features/:id/progressions` - Update progressions for feature (admin required)

**Bulk Feature Progression Routes**:
- `POST /api/features/progressions/bulk` - Create feature progression with relationships (admin required)

**Authentication**: Admin authentication required for all write operations
**Validation**: All routes use Zod schemas for request validation

**Source File**: `src/features/featureSystem/featureSystemRoutes.ts`

## 🔧 **Business Logic Patterns**

### **Feature Filtering Logic**

The feature system implements sophisticated filtering logic for different use cases:

**Standalone Features**: Features not associated with classes or races
**Class Features**: Features associated with specific classes
**Race Features**: Features associated with specific races
**Special Features**: System features (IDs 1-5) excluded from general operations

**Filtering Implementation**: The system applies different filtering strategies based on the source type parameter. When no source type is specified, it excludes features already associated with classes or races to show only standalone features. When a source type is specified, it filters to show only features associated with that source type. Special features with IDs 1-5 are always excluded from general operations as they represent system-level features.

### **Transaction Safety**

The feature system uses transactions for complex operations involving multiple related entities:

**Feature Creation**: Creates feature and prerequisites in single transaction
**Progression Creation**: Creates progression with all related data in single transaction
**Bulk Operations**: Creates multiple progressions with relationships in single transaction
**Update Operations**: Deletes old data and creates new data in single transaction

**Transaction Pattern**: The system uses database transactions to ensure data consistency when creating or updating complex feature structures. Each transaction creates the main entity first, then creates all related entities with proper foreign key references. This ensures that if any part of the operation fails, the entire operation is rolled back, maintaining data integrity.

### **Formula Integration**

The feature system integrates with the formula system for dynamic calculations:

**Formula Parameter Transformation**: Converts frontend formula data to database format
**Formula Validation**: Validates formula parameters against formula definitions
**Formula Calculation**: Provides real-time formula calculation for UI preview

**Formula Integration Pattern**: The system transforms formula parameters from the frontend format to the database storage format, creates formula parameter records in the database, and links them to modifiers or choices. This enables dynamic calculations based on character level, ability scores, and other factors.

**Source File**: `src/utils/formulaParamTransformers.ts`

## 🔗 **Integration Points**

### **Class System Integration**

The feature system integrates with the class system through consolidated service methods:

**Consolidated Methods**: Class service calls feature system methods for progression management
**Bulk Operations**: Efficient bulk creation and deletion of class feature progressions
**Transaction Safety**: Shared transactions ensure data consistency

**Integration Pattern**: The class service calls feature system methods to manage feature progressions, passing the class context and progression data. This ensures that all feature operations for classes go through the centralized feature system service, maintaining consistency and reducing code duplication.

**Related Documentation**: [Class System Feature Integration](../class-system/feature-integration.md)

### **Race System Integration**

The feature system integrates with the race system through similar consolidated patterns:

**Consolidated Methods**: Race service calls feature system methods for progression management
**Bulk Operations**: Efficient bulk creation and deletion of race feature progressions
**Transaction Safety**: Shared transactions ensure data consistency

**Integration Pattern**: The race service calls feature system methods to manage feature progressions, passing the race context and progression data. This follows the same pattern as class integration, ensuring consistent feature management across all source types.

**Related Documentation**: [Race System Feature Integration](../race-system/race-integration.md)

### **Spellcasting Integration**

The feature system integrates with the spellcasting system through special effects:

**Spellcasting Links**: Feature progressions can link to spellcasting progressions
**Spellcasting Effects**: Special effects can grant spellcasting abilities
**Formula Integration**: Spellcasting can use formulas for progression calculations

**Related Documentation**: [Spellcasting System](../spell-system/spellcasting-system.md)

## 📊 **Error Handling**

The feature system follows the shared [Error Handling Patterns](../application-overview/backend-implementation.md#error-handling) with feature-specific error scenarios:

**Validation Errors**: Zod schema validation errors with detailed field information
**Business Logic Errors**: Feature-specific business rule violations
**Database Errors**: Prisma ORM errors with proper error messages
**Integration Errors**: Errors from related system integrations

## 🔧 **Performance Considerations**

The feature system implements performance optimizations following the shared [Performance Optimization](../application-overview/performance-optimization.md) patterns:

**Efficient Queries**: Optimized Prisma queries with proper includes and where clauses
**Bulk Operations**: Efficient bulk creation and deletion for class/race integration
**Caching**: Appropriate caching for frequently accessed data
**Pagination**: Proper pagination for large feature collections

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Feature system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Feature system validation rules and schemas
- **[Static Data](static-data.md)** - Feature system enums and types
- **[Frontend Components](frontend-components.md)** - Feature system frontend implementation
- **[Backend Implementation Patterns](../application-overview/backend-implementation.md)** - Shared backend patterns and conventions
- **[Performance Optimization](../application-overview/performance-optimization.md)** - Shared performance optimization strategies

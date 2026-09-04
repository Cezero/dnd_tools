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
- **Entity Management**: Handle unified feature entities with type-based differentiation
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
- **Business Logic**: Persists all Feature scalar columns (name, slug, description, summary, `displayInCharacterSheet`, sourceType, level, and progression FKs), then handles prerequisite and entity updates. Entity updates match by entity `id` so existing `CharacterFeatureChoice` rows stay attached; entities without an `id` are created.
- **Returns**: Success message

**deleteFeature**: Deletes a feature
- **Parameters**: Feature ID
- **Business Logic**: Deletes feature (cascades to progressions, modifiers, etc.)
- **Returns**: Success message

**createFeatureProgressionWithRelations**: Creates a feature progression with all related data
- **Parameters**: Complete feature progression data including entities with conditions and formula params
- **Business Logic**: Creates progression in transaction, then creates all related data (entities with conditions and formula params)
- **Returns**: Created progression ID and success message

**createMultipleFeatureProgressions**: Creates multiple feature progressions for a class or race
- **Parameters**: Array of progression data, context (classId/raceId), optional transaction
- **Business Logic**: Creates multiple progressions with full relationship data, handles formula parameter transformations
- **Returns**: Void (creates all progressions)

**deleteFeatureProgressionsForContext**: Deletes all feature progressions for a class or race
- **Parameters**: Context (classId/raceId), optional transaction
- **Business Logic**: Cascades deletion to all related data (entities with conditions)
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

**Transaction Pattern**: The system uses database transactions to ensure data consistency when creating or updating complex feature structures. Each transaction creates the main entity first, then creates all related entities (feature entities with conditions and formula params) with proper foreign key references. This ensures that if any part of the operation fails, the entire operation is rolled back, maintaining data integrity.

### **Formula Integration**

The feature system integrates with the formula system for dynamic calculations:

**Formula Parameter Transformation**: Converts frontend formula data to database format
**Formula Validation**: Validates formula parameters against formula definitions
**Formula Calculation**: Provides real-time formula calculation for UI preview

**Formula Integration Pattern**: The system transforms formula parameters from the frontend format to the database storage format, creates formula parameter records in the database, and links them to feature entities. This enables dynamic calculations based on character level, ability scores, and other factors.

**Source File**: `src/utils/formulaParamTransformers.ts`

## 🔗 **Integration Points**

### **Class System Integration**

The feature system integrates with the class system through link table management:

**Feature State System**: Features are managed independently via the feature state system
**Link Table Management**: Class service only manages FeatureClassMap relationship links via `syncClassFeatures`
**No Feature Manipulation**: Class service does NOT create, update, or delete features
**Feature IDs Only**: Class service receives featureIds and syncs FeatureClassMap links

**Integration Pattern**: 
- Features are edited and saved via the feature state system before class update
- When a feature is saved, its ID is added to the class's featureIds array in state
- When the class is saved, only featureIds are sent to the backend
- The class service extracts featureIds and syncs FeatureClassMap links using `syncClassFeatures`
- Features are never manipulated by the class service - they are managed separately

**Orphaned Features**: The `cleanupOrphanedFeatures` method exists but should NOT be called automatically by class/race services. An admin UI should be created to review and manually delete orphaned features.

**Stale Feature-choice IDs**: After feature remaps, `FeatureEntity.appliesToId` can still point at deleted Feature rows (Ranger Combat Style, Rogue Special Abilities). Recreate missing choice targets and rewrite pointers with `apps/backend/scripts/remap-stale-feature-choice-ids.ts`.

**Related Documentation**: [Class System Backend Implementation](../class-system/backend-implementation.md#feature-system-integration)

### **Race System Integration**

The feature system integrates with the race system through link table management:

**Feature State System**: Features are managed independently via the feature state system
**Link Table Management**: Race service only manages FeatureRaceMap relationship links via `syncRaceFeatures`
**No Feature Manipulation**: Race service does NOT create, update, or delete features
**Feature IDs Only**: Race service receives featureIds and syncs FeatureRaceMap links

**Integration Pattern**: 
- Features are edited and saved via the feature state system before race update
- When a feature is saved, its ID is added to the race's featureIds array in state
- When the race is saved, only featureIds are sent to the backend
- The race service extracts featureIds and syncs FeatureRaceMap links using `syncRaceFeatures`
- Features are never manipulated by the race service - they are managed separately

**Orphaned Features**: The `cleanupOrphanedFeatures` method exists but should NOT be called automatically by class/race services. An admin UI should be created to review and manually delete orphaned features.

**Related Documentation**: [Race System Backend Implementation](../race-system/backend-implementation.md#feature-system-integration)

### **Spellcasting Integration**

The feature system integrates with the spellcasting system through feature entities:

**Spellcasting Links**: Feature progressions can link to spellcasting progressions
**Spellcasting Effects**: Feature entities can grant spellcasting abilities
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

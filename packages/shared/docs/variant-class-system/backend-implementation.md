# Variant Class System - Backend Implementation

*Comprehensive documentation of the backend implementation for the variant class system, including services, controllers, routes, and business logic.*

## 📋 **Overview**

The variant class backend provides a comprehensive API for managing variant classes and their overrides. It includes CRUD operations for variant classes, variant resolution with override application, and integration with the feature and spell systems.

The backend implementation follows the shared [Backend Implementation Patterns](../application-overview/backend-implementation.md) with variant-specific business logic and integration patterns.

**Source Files**: 
- Service: `apps/backend/src/features/class/variantClassService.ts`
- Controller: `apps/backend/src/features/class/variantClassController.ts`
- Routes: `apps/backend/src/features/class/variantClassRoutes.ts`
- Types: `apps/backend/src/features/class/types.ts`

## 🏗️ **Architecture Overview**

The variant class backend follows the shared [Layered Architecture Pattern](../application-overview/backend-implementation.md#layered-architecture-pattern) with variant-specific implementations:

**Routes Layer**: API endpoints for variant class management
**Controller Layer**: Request handling and response formatting for variant operations
**Service Layer**: Variant-specific business logic and data operations
**Database Layer**: Prisma ORM with variant class models

### **Service Architecture**

The variant class system uses a service-oriented architecture following the shared [Service-Oriented Architecture](../application-overview/backend-implementation.md#service-oriented-architecture) patterns:

**VariantClassService**: Central service containing all variant class management logic
**Variant Resolution**: Complete variant resolution with override application
**CRUD Operations**: Complete CRUD operations for variant classes
**Transaction Safety**: Consistent transaction patterns for data integrity
**Integration**: Full integration with class, feature, and spell systems

### **Key Design Principles**

**Override-Based Architecture**: Stores only differences from base classes, not complete class data
**Custom ID Generation**: Uses `baseClassId * 100000 + variantId` for unique identification
**Feature System Integration**: Leverages feature system service for feature override management
**Spell System Integration**: Integrates with spell system for spell list modifications
**Unified Resolution**: Resolves variants to complete DnDClass objects

## 🔧 **Core Service Layer**

### **VariantClassService**

The central service for all variant class management, providing variant resolution, CRUD operations, and integration with other systems.

**Purpose**: Provides comprehensive variant class management capabilities, from variant resolution to CRUD operations with full integration support.

**Key Responsibilities**:
- **Variant Resolution**: Resolve variants to complete DnDClass objects with overrides applied
- **CRUD Operations**: Create, read, update, and delete variant classes
- **Override Management**: Handle feature and spell overrides through established patterns
- **Transaction Safety**: Ensure data consistency through proper transaction handling
- **Integration**: Integrate with class, feature, and spell systems

**Core Methods**:

**resolveClassWithVariantById**: Resolves a variant class to a complete DnDClass object
- **Parameters**: `customVariantId: number` - The custom variant ID
- **Business Logic**: Fetches variant with related data, retrieves base class, applies feature overrides using feature system service, integrates with spell system, constructs final DnDClass object
- **Returns**: `Promise<DnDClass>` - Complete DnDClass object with overrides applied
- **Integration**: Uses `classService.getClassById()` for base class retrieval, `featureSystemService.getFeatureProgressionsByIds()` for feature population, `applyFeatureProgressionOverrides()` for override application

**createVariant**: Creates a new variant class with all related data
- **Parameters**: `data: CreateClassVariantRequest` - Complete variant creation data
- **Business Logic**: Validates base class exists, checks for duplicate variant names, calculates next available variant ID, creates variant with feature overrides and spell overrides in transaction
- **Returns**: `Promise<CreateResponse>` - Created variant ID and success message
- **Integration**: Uses `featureSystemService.createMultipleFeatureProgressions()` for feature override creation, `calculateVariantId()` for custom ID generation

**updateVariant**: Updates an existing variant class with all related data
- **Parameters**: `variantId: number, data: UpdateClassVariantRequest` - Variant ID and update data
- **Business Logic**: Validates variant exists, checks for duplicate names, deletes existing overrides, creates new overrides in transaction
- **Returns**: `Promise<UpdateResponse>` - Success message
- **Integration**: Uses `featureSystemService.deleteFeatureProgressionsForContext()` and `createMultipleFeatureProgressions()` for feature override management

**deleteVariant**: Deletes a variant class
- **Parameters**: `variantId: number` - The variant ID to delete
- **Business Logic**: Deletes variant (cascades to all related data)
- **Returns**: `Promise<UpdateResponse>` - Success message

**getVariant**: Retrieves a variant class with all related data
- **Parameters**: `variantId: number` - The variant ID to retrieve
- **Business Logic**: Fetches variant with base class, feature overrides, spell overrides, and source book info, enriches feature progressions using feature system service
- **Returns**: `Promise<ClassVariant | null>` - Complete variant data or null if not found
- **Integration**: Uses `featureSystemService.getFeatureProgressionsByIds()` for feature population

**Source File**: `apps/backend/src/features/class/variantClassService.ts`

## 🎯 **Controller Layer**

The variant class controllers follow the shared [Controller Layer Pattern](../application-overview/backend-implementation.md#controller-layer) with variant-specific request handling:

### **VariantClassController**

**Purpose**: Handles HTTP requests and responses for variant class operations, delegating business logic to the service layer.

**Key Responsibilities**:
- **Request Processing**: Handle incoming HTTP requests with proper validation
- **Response Formatting**: Format responses according to API standards
- **Error Handling**: Provide appropriate error responses and status codes
- **Authentication**: Enforce admin authentication for write operations

**Core Methods**:

**CreateVariant**: Creates a new variant class
- **Route**: `POST /api/variants`
- **Authentication**: Admin required
- **Body**: `CreateClassVariantRequest` - Complete variant creation data
- **Response**: 201 with success message or 400/500 with error
- **Error Handling**: 400 for validation errors, 500 for server errors

**UpdateVariant**: Updates an existing variant class
- **Route**: `PUT /api/variants/:id`
- **Authentication**: Admin required
- **Parameters**: `VariantIdParamRequest` - Variant ID in URL path
- **Body**: `UpdateClassVariantRequest` - Variant update data
- **Response**: 200 with success message or 400/404/500 with error
- **Error Handling**: 404 for not found, 400 for validation errors, 500 for server errors

**DeleteVariant**: Deletes a variant class
- **Route**: `DELETE /api/variants/:id`
- **Authentication**: Admin required
- **Parameters**: `VariantIdParamRequest` - Variant ID in URL path
- **Response**: 200 with success message or 400/404/500 with error
- **Error Handling**: 404 for not found, 400 for validation errors, 500 for server errors

**GetVariant**: Retrieves a variant class by ID
- **Route**: `GET /api/variants/:id`
- **Parameters**: `VariantIdParamRequest` - Variant ID in URL path
- **Response**: 200 with variant data or 404/400/500 with error
- **Error Handling**: 404 for not found, 400 for validation errors, 500 for server errors

**Source File**: `apps/backend/src/features/class/variantClassController.ts`

## 🔗 **Routes Layer**

The variant class routes follow the shared [RESTful API Structure](../application-overview/backend-implementation.md#restful-api-structure) with variant-specific endpoints:

### **VariantClassRoutes**

**Purpose**: Defines API endpoints and request validation for variant class operations.

**Route Structure**:
- **Variant Management Routes**: CRUD operations for variant classes
- **Admin Authentication**: All write operations require admin authentication
- **Parameter Validation**: All routes use Zod schemas for request validation

**Route Definitions**:

**Variant Management Routes**:
- `POST /api/variants` - Create new variant class (admin required)
- `PUT /api/variants/:id` - Update existing variant class (admin required)
- `DELETE /api/variants/:id` - Delete variant class (admin required)
- `GET /api/variants/:id` - Retrieve variant class by ID

**Authentication**: Admin authentication required for all write operations
**Validation**: All routes use Zod schemas for request validation
- `CreateClassVariantSchema` for POST requests
- `UpdateClassVariantSchema` for PUT requests
- `VariantIdParamSchema` for ID parameters

**Source File**: `apps/backend/src/features/class/variantClassRoutes.ts`

## 🔧 **Business Logic Patterns**

### **Variant Resolution Logic**

The variant system implements sophisticated resolution logic for applying overrides to base classes:

**Base Class Retrieval**: Uses `classService.getClassById()` to retrieve the base class
**Feature Override Application**: Uses `applyFeatureProgressionOverrides()` to apply feature modifications
**Spell Override Integration**: Integrates with spell system for spell list modifications
**Property Override Application**: Applies variant-specific property overrides (name, abbreviation, hit die, etc.)

**Resolution Implementation**: The system fetches the variant with all related data, retrieves the base class through the class service, applies feature overrides using the feature system service, and constructs a complete DnDClass object with all overrides applied.

### **Custom ID Generation**

The variant system uses custom ID generation to ensure unique identification:

**ID Formula**: Uses `baseClassId * 100000 + variantId` for unique identification
**Variant ID Calculation**: Finds the next available variant ID for each base class
**Duplicate Prevention**: Checks for existing variants to prevent duplicates
**Base Class Derivation**: Easy extraction of base class ID from custom ID

**ID Generation Pattern**: The system calculates the next available variant ID for the base class, then generates a custom ID using the formula. This ensures unique identification while maintaining relationships to base classes.

### **Transaction Safety**

The variant system uses transactions for complex operations involving multiple related entities:

**Variant Creation**: Creates variant with feature overrides and spell overrides in single transaction
**Variant Updates**: Deletes existing overrides and creates new ones in single transaction
**Feature Override Management**: Uses feature system service for feature progression management
**Spell Override Management**: Creates and manages spell overrides within transactions

**Transaction Pattern**: The system uses database transactions to ensure data consistency when creating or updating variant classes. Each transaction creates the main variant first, then creates all related entities (feature overrides, spell overrides) with proper foreign key references.

### **Feature System Integration**

The variant system integrates with the feature system for feature override management:

**Context Objects**: Uses `FeatureProgressionContext` with `variantOverrideId` for proper foreign key relationships
**Feature Creation**: Uses `featureSystemService.createMultipleFeatureProgressions()` for feature override creation
**Feature Deletion**: Uses `featureSystemService.deleteFeatureProgressionsForContext()` for feature override deletion
**Feature Population**: Uses `featureSystemService.getFeatureProgressionsByIds()` for proper feature population

**Integration Pattern**: The system passes context objects to the feature system service, ensuring that variant features are properly linked to their override records. This maintains referential integrity and enables proper feature management.

## 🔗 **Integration Points**

### **Class System Integration**

The variant system integrates with the class system through unified resolution:

**Unified Resolution**: Variants resolve to complete DnDClass objects through the class service
**Base Class Retrieval**: Uses `classService.getClassById()` for base class retrieval
**API Consistency**: Provides consistent API patterns for both base classes and variants
**Response Consistency**: All endpoints return consistent DnDClass objects

**Integration Pattern**: The variant system leverages the class service for base class retrieval and provides unified resolution that ensures frontend components work with variants without special handling.

**Related Documentation**: [Class System Backend](../class-system/backend-implementation.md)

### **Feature System Integration**

The variant system integrates with the feature system through context management:

**Context Management**: Uses `FeatureProgressionContext` with `variantOverrideId` for proper relationships
**Feature Creation**: Uses feature system service for feature override creation
**Feature Deletion**: Uses feature system service for feature override deletion
**Feature Population**: Uses feature system service for proper feature population

**Integration Pattern**: The variant system passes context objects to the feature system service, ensuring that variant features are properly linked to their override records. This follows the same pattern as class and race integration.

**Related Documentation**: [Feature System Backend](../feature-system/backend-implementation.md)

### **Spell System Integration**

The variant system integrates with the spell system for spell list management:

**Spell Override Management**: Creates and manages spell overrides for variant classes
**Spell List Resolution**: Integrates with spell system for spell list resolution
**Override Application**: Applies spell overrides to base class spell lists

**Related Documentation**: [Spell System Backend](../spell-system/backend-implementation.md)

## 📊 **Error Handling**

The variant system follows the shared [Error Handling Patterns](../application-overview/backend-implementation.md#error-handling) with variant-specific error scenarios:

**Validation Errors**: Zod schema validation errors with detailed field information
**Business Logic Errors**: Variant-specific business rule violations (duplicate names, missing base classes)
**Database Errors**: Prisma ORM errors with proper error messages
**Integration Errors**: Errors from related system integrations (class, feature, spell systems)

## 🔧 **Performance Considerations**

The variant system implements performance optimizations following the shared [Performance Optimization](../application-overview/performance-optimization.md) patterns:

**Efficient Queries**: Optimized Prisma queries with proper includes and where clauses
**Feature System Integration**: Leverages feature system service for efficient feature management
**Transaction Optimization**: Efficient transaction patterns for complex operations
**Caching Strategy**: Appropriate caching for frequently accessed data

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Variant class system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Variant class system validation rules and schemas
- **[Static Data](static-data.md)** - Variant class system enums and types
- **[Frontend Implementation](frontend-implementation.md)** - Variant class system frontend implementation
- **[Backend Implementation Patterns](../application-overview/backend-implementation.md)** - Shared backend patterns and conventions
- **[Performance Optimization](../application-overview/performance-optimization.md)** - Shared performance optimization strategies

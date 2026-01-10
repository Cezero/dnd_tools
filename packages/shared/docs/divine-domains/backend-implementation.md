# Divine Domains Backend Implementation

*Complete documentation for the deity and domain system backend implementation, including API services, controllers, and business logic.*

## 📋 **Overview**

The divine domains backend implementation provides the API layer for deity and domain management, including CRUD operations, business logic, and data validation. The implementation follows a layered architecture pattern with clear separation of concerns.

The backend implementation follows the shared [Backend Implementation Patterns](../application-overview/backend-implementation.md) with deity and domain-specific business logic and integration patterns.

**Source Files**: 
- Deity Service: `src/features/deity/deityService.ts`
- Deity Controller: `src/features/deity/deityController.ts`
- Deity Routes: `src/features/deity/deityRoutes.ts`
- Domain Service: `src/features/domain/domainService.ts`
- Domain Controller: `src/features/domain/domainController.ts`
- Domain Routes: `src/features/domain/domainRoutes.ts`

## 🏗️ **Architecture Overview**

The divine domains backend follows the shared [Layered Architecture Pattern](../application-overview/backend-implementation.md#layered-architecture-pattern) with deity and domain-specific implementations:

**Routes Layer**: API endpoints for deity and domain management
**Controller Layer**: Request handling and response formatting
**Service Layer**: Business logic and data operations
**Database Layer**: Prisma ORM with deity and domain models

### **Service Architecture**

The divine domains system uses a service-oriented architecture following the shared [Service-Oriented Architecture](../application-overview/backend-implementation.md#service-oriented-architecture) patterns:

**DeityService**: Central service for deity management
**DomainService**: Central service for domain management
**Feature System Integration**: Integration with feature system for domain features
**Transaction Safety**: Consistent transaction patterns for data integrity

## 🔧 **Deity System**

### **DeityService**

The central service for all deity management operations.

**Purpose**: Provides comprehensive deity management capabilities including CRUD operations, domain relationship management, and validation.

**Key Responsibilities**:
- **Deity CRUD**: Create, read, update, and delete deity definitions
- **Domain Relationships**: Manage deity-domain relationships
- **Validation**: Validate deity data and relationships
- **Cache Management**: Provide cached deity data for performance

**Core Methods**:

#### **getAllDeities**

**Purpose**: Retrieves all deities with source book information.

**Returns**: GetAllDeitiesResponse with total count and results array

#### **getDeityById**

**Purpose**: Retrieves a specific deity by ID with complete details including all relationships and transformed data.

**Architecture Decision**: Transforms Prisma results to match schema expectations, converting relationship arrays to simple ID arrays and formatting nested data structures.

**Parameters**: DeityIdParamRequest with deity ID

**Returns**: Deity object with complete data including domain relationships, class IDs, race IDs, favored weapons, and source book information, or null if not found

**Business Logic**:
1. Queries deity with all related data:
   - Domains through deityDomains relationship
   - Classes through deityClasses relationship
   - Races through deityRaces relationship
   - Favored weapons through favoredWeapons relationship
   - Source book information through sourceBookInfo relationship
2. Transforms relationship data:
   - Maps `deityClasses` array to `classIds` array
   - Maps `deityRaces` array to `raceIds` array
   - Maps `domains` array to simple domain objects
   - Maps `favoredWeapons` array to simplified weapon objects with id and name
   - Removes raw relationship fields (deityClasses, deityRaces, favoredWeaponIds)
3. Returns transformed deity object matching schema format

**Transformation Pattern**: Converts Prisma relationship arrays to schema-expected format, ensuring frontend receives data in expected structure.

**Source File**: `apps/backend/src/features/deity/deityService.ts`

#### **createDeity**

**Purpose**: Creates a new deity with all relationships in a single transaction.

**Architecture Decision**: Uses transaction to ensure atomic creation of deity and all relationship mappings. Separates relationship IDs from main deity data for clean transaction management.

**Parameters**: CreateDeityRequest with deity data including optional relationship arrays (classIds, raceIds, domainIds, favoredWeaponIds, sourceBookInfo)

**Returns**: CreateResponse with created deity ID

**Business Logic**:
1. Extracts relationship arrays from request data (classIds, raceIds, domainIds, favoredWeaponIds, sourceBookInfo)
2. Creates deity in transaction:
   - Creates deity record with main fields
   - Creates source book mappings if sourceBookInfo provided
3. Creates relationship mappings in transaction:
   - Creates deity-domain relationships (DeityDomain) if domainIds provided
   - Creates deity-class relationships (DeityClassMap) if classIds provided
   - Creates deity-race relationships (DeityRaceMap) if raceIds provided
   - Creates deity-favored weapon relationships (DeityFavoredWeaponMap) if favoredWeaponIds provided
4. Returns created deity ID

**Transaction Pattern**: Uses Prisma transaction to ensure atomic creation of deity and all relationship mappings. All operations succeed or fail together.

**Relationship Management**: Each relationship type is managed through separate junction tables (DeityDomain, DeityClassMap, DeityRaceMap, DeityFavoredWeaponMap) supporting many-to-many relationships.

**Source File**: `apps/backend/src/features/deity/deityService.ts`

#### **updateDeity**

**Purpose**: Updates an existing deity with delete/recreate pattern for all relationships.

**Architecture Decision**: Uses delete/recreate pattern for all relationship mappings to ensure data consistency. Deletes all existing mappings before creating new ones, ensuring clean state.

**Parameters**:
- Query: DeityIdParamRequest with deity ID
- Body: UpdateDeityRequest with updated data including optional relationship arrays

**Returns**: UpdateResponse with success message

**Business Logic**:
1. Extracts relationship arrays from request data
2. Updates deity in transaction:
   - Deletes all existing relationship mappings:
     - Deletes deity source mappings (DeitySourceMap)
     - Deletes deity-domain relationships (DeityDomain)
     - Deletes deity-class relationships (DeityClassMap)
     - Deletes deity-race relationships (DeityRaceMap)
     - Deletes deity-favored weapon relationships (DeityFavoredWeaponMap)
   - Updates deity record with main fields
   - Creates new source book mappings if sourceBookInfo provided
3. Creates new relationship mappings if provided:
   - Creates deity-domain relationships if domainIds provided
   - Creates deity-class relationships if classIds provided
   - Creates deity-race relationships if raceIds provided
   - Creates deity-favored weapon relationships if favoredWeaponIds provided
4. Returns success response

**Transaction Pattern**: Uses Prisma transaction with delete/recreate pattern to ensure atomic updates of all relationship mappings.

**Delete/Recreate Rationale**: 
- Ensures clean state without orphaned records
- Simplifies update logic compared to individual add/remove operations
- Guarantees data consistency across all relationship types

**Source File**: `apps/backend/src/features/deity/deityService.ts`

#### **deleteDeity**

**Purpose**: Deletes a deity and all related data.

**Parameters**: DeityIdParamRequest with deity ID

**Returns**: UpdateResponse with success message

#### **validateDeity**

**Purpose**: Validates deity data and relationships.

**Returns**: ValidationResult with validation status and errors

#### **getDeityCache**

**Purpose**: Retrieves cached deity data for frontend performance.

**Returns**: DeityCacheResponse with cached deity summaries

**Source File**: `src/features/deity/deityService.ts`

### **DeityController**

Handles HTTP requests for deity operations.

**Controller Methods**:
- **GetAllDeities**: Get all deities
- **GetDeityById**: Get specific deity by ID
- **CreateDeity**: Create new deity (admin)
- **UpdateDeity**: Update deity (admin)
- **DeleteDeity**: Delete deity (admin)
- **GetDeityCache**: Get cached deity data

**Source File**: `src/features/deity/deityController.ts`

### **DeityRoutes**

Defines API endpoints for deity operations.

**API Endpoints**:
- **`GET /api/deities`**: Get all deities
- **`GET /api/deities/cache`**: Get cached deity data
- **`GET /api/deities/:id`**: Get specific deity
- **`POST /api/deities`**: Create deity (admin)
- **`PUT /api/deities/:id`**: Update deity (admin)
- **`DELETE /api/deities/:id`**: Delete deity (admin)

**Source File**: `src/features/deity/deityRoutes.ts`

## 🔧 **Domain System**

### **DomainService**

The central service for all domain management operations.

**Purpose**: Provides comprehensive domain management capabilities including CRUD operations, feature progression management, and spell relationship handling.

**Key Responsibilities**:
- **Domain CRUD**: Create, read, update, and delete domain definitions
- **Feature Progression Management**: Manage domain feature progressions through feature system
- **Spell Relationships**: Manage domain spell lists
- **Cache Management**: Provide cached domain data for performance

**Core Methods**:

#### **getAllDomains**

**Purpose**: Retrieves all domains with source book information.

**Returns**: GetAllDomainsResponse with total count and results array

#### **getDomainById**

**Purpose**: Retrieves a specific domain by ID with complete details including spells and features.

**Parameters**: DomainIdParamRequest with domain ID

**Returns**: Domain object with complete data including spell lists and feature progressions, or null if not found

#### **createDomain**

**Purpose**: Creates a new domain with feature progressions and spell relationships in a single transaction.

**Architecture Decision**: Uses feature system service to create feature progressions for domain features, ensuring consistency with other feature sources. Uses context-based feature progression management.

**Parameters**: CreateDomainRequest with domain data including optional domainSpells array and optional features array

**Returns**: CreateResponse with created domain ID

**Business Logic**:
1. Extracts domainSpells and features arrays from request data
2. Creates domain in transaction:
   - Creates domain record with main fields
   - Creates source book mappings if sourceBookInfo provided
3. Creates domain spells if provided:
   - Creates DomainSpell records linking domain to spells with spell levels
4. Creates feature progressions if provided:
   - Uses feature system service `createMultipleFeatureProgressions()`
   - Provides context: `{ domainId: domainResult.id, sourceType: FeatureSourceType.Domain }`
   - Feature progressions are created with domainId reference
5. Returns created domain ID

**Transaction Pattern**: Uses Prisma transaction to ensure atomic creation of domain, spells, and feature progressions.

**Feature System Integration**: 
- Uses `featureSystemService.createMultipleFeatureProgressions()` for bulk feature creation
- Context object identifies domain as feature source
- Feature progressions are linked to domain via domainId field

**Source File**: `apps/backend/src/features/domain/domainService.ts`

#### **updateDomain**

**Purpose**: Updates an existing domain with delete/recreate pattern for feature progressions and spell relationships.

**Architecture Decision**: Uses delete/recreate pattern for feature progressions and domain spells to ensure data consistency. Only updates if arrays are explicitly provided (undefined means no change).

**Parameters**:
- Query: DomainIdParamRequest with domain ID
- Body: UpdateDomainRequest with updated data including optional domainSpells and features arrays

**Returns**: UpdateResponse with success message

**Business Logic**:
1. Extracts domainSpells and features arrays from request data
2. Updates domain in transaction:
   - Deletes existing source book mappings
   - Updates domain record with main fields
   - Creates new source book mappings if sourceBookInfo provided
3. Updates domain spells if domainSpells array provided (not undefined):
   - Deletes all existing domain spells
   - Creates new domain spells if array is non-empty
4. Updates feature progressions if features array provided (not undefined):
   - Deletes existing feature progressions using `deleteFeatureProgressionsForContext()`
   - Provides delete context: `{ domainId: query.id, sourceType: FeatureSourceType.Domain }`
   - Creates new feature progressions if array is non-empty using `createMultipleFeatureProgressions()`
   - Provides create context: `{ domainId: query.id, sourceType: FeatureSourceType.Domain }`
5. Returns success response

**Transaction Pattern**: Uses Prisma transaction with delete/recreate pattern for feature progressions and domain spells.

**Delete/Recreate Pattern for Features**:
- Uses `featureSystemService.deleteFeatureProgressionsForContext()` to delete all domain features
- Uses `featureSystemService.createMultipleFeatureProgressions()` to create new features
- Context-based deletion ensures only domain features are removed
- Ensures clean state without orphaned feature progressions

**Conditional Updates**: 
- domainSpells: Only updates if array is explicitly provided (undefined means no change)
- features: Only updates if array is explicitly provided (undefined means no change, null means clear all)

**Source File**: `apps/backend/src/features/domain/domainService.ts`

#### **deleteDomain**

**Purpose**: Deletes a domain and all related data including feature progressions.

**Parameters**: DomainIdParamRequest with domain ID

**Returns**: UpdateResponse with success message

#### **getDomainCache**

**Purpose**: Retrieves cached domain data for frontend performance.

**Returns**: DomainCacheResponse with cached domain summaries

**Source File**: `src/features/domain/domainService.ts`

### **DomainController**

Handles HTTP requests for domain operations.

**Controller Methods**:
- **GetAllDomains**: Get all domains
- **GetDomainById**: Get specific domain by ID
- **CreateDomain**: Create new domain (admin)
- **UpdateDomain**: Update domain (admin)
- **DeleteDomain**: Delete domain (admin)
- **GetDomainCache**: Get cached domain data

**Source File**: `src/features/domain/domainController.ts`

### **DomainRoutes**

Defines API endpoints for domain operations.

**API Endpoints**:
- **`GET /api/domains`**: Get all domains
- **`GET /api/domains/cache`**: Get cached domain data
- **`GET /api/domains/:id`**: Get specific domain
- **`POST /api/domains`**: Create domain (admin)
- **`PUT /api/domains/:id`**: Update domain (admin)
- **`DELETE /api/domains/:id`**: Delete domain (admin)

**Source File**: `src/features/domain/domainRoutes.ts`

## 🔗 **Integration Points**

### **Feature System Integration**

The domain service integrates with the feature system for domain feature management:

**Integration Pattern**:
- Domain features are managed through feature progressions
- Uses FeatureSourceType.Domain to identify domain features
- Feature progressions are created/updated/deleted through feature system service
- Ensures consistency with other feature sources (classes, races)

**Benefits**:
- **Consistency**: Domain features use same system as class and race features
- **Flexibility**: Domain features can use all feature system capabilities
- **Maintainability**: Single feature system for all feature types

### **Database Integration**

Both services integrate with the database through Prisma ORM:

**Prisma Integration**:
- **Type-Safe Queries**: Uses Prisma's type-safe query builder
- **Relationship Loading**: Efficiently loads related data (domains, spells, features)
- **Performance**: Optimized queries with proper indexing
- **Many-to-Many Relationships**: Handles deity-domain, deity-class, deity-race, deity-favored weapon, and domain-spell relationships

**Transaction Management**:
- **Atomic Operations**: All relationship updates use transactions
- **Delete/Recreate Pattern**: Ensures clean state for relationship mappings
- **Context-Based Feature Management**: Feature progressions managed through context objects

**Data Transformation**:
- **Relationship Mapping**: Converts Prisma relationship arrays to schema-expected format
- **ID Extraction**: Extracts IDs from relationship objects for simple arrays
- **Nested Data Formatting**: Formats nested relationship data for frontend consumption

## 🎯 **Architecture Decisions**

### **Why Feature System Integration for Domain Features**

**Decision**: Domain features are managed through the feature system rather than separate domain feature tables.

**Rationale**:
- **Consistency**: All features (class, race, domain) use the same system
- **Flexibility**: Domain features can use all feature system capabilities
- **Maintainability**: Single feature system reduces code duplication
- **D&D 3.5 Compliance**: Supports complex domain feature mechanics

**Alternatives Considered**:
- Separate domain feature tables
- Hardcoded domain features
- Domain features in domain definitions

**Trade-offs**:
- **Benefits**: Consistent, flexible, maintainable
- **Limitations**: Requires feature system integration, slightly more complex

## 📚 **Related Documentation**

- **[Feature System Backend Implementation](../feature-system/backend-implementation.md)** - Feature system integration
- **[Backend Implementation Patterns](../application-overview/backend-implementation.md)** - Shared backend patterns

## Summary

The divine domains backend implementation provides a robust, flexible, and scalable foundation for deity and domain management. The implementation follows established patterns, provides comprehensive error handling, and ensures data integrity through proper validation and type safety.

Key strengths include:
- **Feature Integration**: Domain features use feature system for consistency
- **Relationship Management**: Proper handling of deity-domain and domain-spell relationships
- **Type Safety**: Full TypeScript integration with proper interfaces
- **Error Handling**: Comprehensive error handling with proper logging
- **Performance**: Cached data endpoints for improved performance

The implementation is designed to scale with the application and provides the necessary functionality for deity and domain management operations.

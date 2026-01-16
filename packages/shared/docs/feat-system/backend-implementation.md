# Feat System Backend Implementation

*Complete documentation for the feat system backend implementation, including API services, controllers, and business logic.*

## 📋 **Overview**

The feat system backend implementation provides the API layer for feat management, including CRUD operations, business logic, and data validation. The implementation follows a layered architecture pattern with clear separation of concerns.

The backend implementation follows the shared [Backend Implementation Patterns](../application-overview/backend-implementation.md) with feat-specific business logic and integration patterns.

**Source Files**: 
- Service: `src/features/feat/featService.ts`
- Controller: `src/features/feat/featController.ts`
- Routes: `src/features/feat/featRoutes.ts`
- Types: `src/features/feat/types.ts`

## 🏗️ **Architecture Overview**

The feat system backend follows the shared [Layered Architecture Pattern](../application-overview/backend-implementation.md#layered-architecture-pattern) with feat-specific implementations:

**Routes Layer**: API endpoints for feat management and related operations
**Controller Layer**: Request handling and response formatting for feat operations
**Service Layer**: Feat-specific business logic and data operations
**Database Layer**: Prisma ORM with feat system models

### **Service Architecture**

The feat system uses a service-oriented architecture following the shared [Service-Oriented Architecture](../application-overview/backend-implementation.md#service-oriented-architecture) patterns:

**FeatService**: Central service containing all feat management logic
**Transaction Safety**: Consistent transaction patterns for data integrity
**Relationship Management**: Complex feat relationship handling
**Validation**: Comprehensive validation at all levels using Zod schemas

### **Key Design Principles**

**Feat Management**: Complete CRUD operations for feat definitions
**Benefit Integration**: Integration with the benefit system for feat effects
**Prerequisite Integration**: Integration with the prerequisite system for feat requirements
**Validation**: Comprehensive validation at all levels using Zod schemas
**Source Attribution**: Proper source book attribution and page references

## 🔧 **Core Service Layer**

### **FeatService**

The central service for all feat management operations, providing comprehensive feat CRUD operations and integration with related systems.

**Purpose**: Provides comprehensive feat management capabilities, from basic feat CRUD to complex integrations with benefits, prerequisites, and character systems.

**Key Responsibilities**:
- **Feat CRUD**: Create, read, update, and delete feat definitions
- **Feature System Integration**: Manage feat relationships with Feature system (FeatureProgression, FeatureEntity, FeaturePrerequisite)
- **Transaction Safety**: Ensure data consistency through proper transaction handling
- **Validation**: Validate feat data and relationships

**Core Methods**:

**getAllFeats**: Retrieves all feats with ordering and count information
- **Parameters**: None
- **Business Logic**: Loads all feats ordered by name, provides total count
- **Returns**: Array of feats with total count (without feature progressions)

**getAllFeatsWithFeatureInfo**: Retrieves all feats with feature information (description and summary)
- **Parameters**: None
- **Business Logic**: 
  - Loads all feats (id and name only)
  - Fetches associated feature progressions for all feats
  - Combines feat data with feature description and summary
  - If a feat has multiple progressions, uses the first one's feature
  - If a feat has no associated feature, description and summary are null
- **Returns**: Array of `FeatWithFeatureInfo` objects with total count
- **IMPORTANT**: This is a composite schema where:
  - `id` and `name` come from the `Feat` table
  - `description` and `summary` come from the associated `Feature` table (via `FeatureProgression`)
- **Usage**: Optimized for list views that need to display feat descriptions and summaries without loading full feat data or progressions

**featQuery**: Retrieves feats with advanced filtering
- **Parameters**: Query request with query type (currently only 'all' is supported)
- **Business Logic**: Loads all feats ordered by name (proficiency identification is handled via FeatureProgressions, not query filtering)
- **Returns**: Array of feats with total count

**getFeatById**: Retrieves a specific feat by ID with full related data
- **Parameters**: Feat ID
- **Business Logic**: Loads feat by unique ID with feature progressions (which contain benefits and prerequisites), returns null if not found
- **Returns**: Complete feat object with feature progressions or null

**createFeat**: Creates a new feat with validation and feature progression management
- **Parameters**: Complete feat creation data including optional `featureProgressions` array
- **Business Logic**: Creates feat in database, then creates FeatureProgression entries if provided (via `featureSystemService.createMultipleFeatureProgressions`)
- **Returns**: Created feat ID and success message

**updateFeat**: Updates an existing feat
- **Parameters**: Feat ID and updated data (feature progressions are managed separately via Feature system)
- **Business Logic**: Updates feat metadata (name, typeId, flags, etc.) - feature progressions are managed through Feature system endpoints
- **Returns**: Success message

**deleteFeat**: Deletes a feat
- **Parameters**: Feat ID
- **Business Logic**: Deletes feat (cascades to relationships)
- **Returns**: Success message

**Source File**: `src/features/feat/featService.ts`

## 🎯 **Controller Layer**

The feat system controllers follow the shared [Controller Layer Pattern](../application-overview/backend-implementation.md#controller-layer) with feat-specific request handling:

### **FeatController**

**Purpose**: Handles HTTP requests and responses for feat system operations, delegating business logic to the service layer.

**Key Responsibilities**:
- **Request Processing**: Handle incoming HTTP requests with proper validation
- **Response Formatting**: Format responses according to API standards
- **Error Handling**: Provide appropriate error responses and status codes
- **Authentication**: Enforce admin authentication for write operations

**Core Methods**:

**GetAllFeats**: Retrieves all feats
- **Route**: `GET /api/feats`
- **Response**: Array of feats with total count (without feature progressions)

**GetAllFeatsWithFeatureInfo**: Retrieves all feats with feature information (description and summary)
- **Route**: `GET /api/feats/with-feature-info`
- **Response**: Array of `FeatWithFeatureInfo` objects with total count
- **IMPORTANT**: This endpoint returns a composite schema where:
  - `id` and `name` come from the `Feat` table
  - `description` and `summary` come from the associated `Feature` table (via `FeatureProgression`)
- **Usage**: Optimized for list views that need to display feat descriptions and summaries without loading full feat data or progressions

**FeatQuery**: Retrieves feats with advanced filtering
- **Route**: `GET /api/feats/query`
- **Parameters**: Query type (proficiency, all)
- **Response**: Array of feats with relationships and total count

**GetFeatById**: Retrieves a specific feat by ID
- **Route**: `GET /api/feats/:id`
- **Parameters**: Feat ID in URL path
- **Response**: Complete feat with relationships or 404 error

**CreateFeat**: Creates a new feat
- **Route**: `POST /api/feats`
- **Authentication**: Admin required
- **Body**: Complete feat creation data
- **Response**: Created feat ID and success message

**UpdateFeat**: Updates an existing feat
- **Route**: `PUT /api/feats/:id`
- **Authentication**: Admin required
- **Body**: Feat update data
- **Response**: Success message

**DeleteFeat**: Deletes a feat
- **Route**: `DELETE /api/feats/:id`
- **Authentication**: Admin required
- **Response**: Success message

**Source File**: `src/features/feat/featController.ts`

### **CharacterResolutionController**

**Purpose**: Handles HTTP requests for character resolution operations, including available feat filtering.

**Key Methods**:

**GetAvailableFeats**: Retrieves filtered available feats for a character
- **Route**: `GET /api/characters/:characterId/resolution/available-feats`
- **Authentication**: User authentication required (must own character)
- **Parameters**: Character ID in URL path
- **Response**: Array of available feats (filtered by prerequisites, owned feats, and proficiency conflicts)
- **Business Logic**: Uses `AvailableFeatService.getQualifiedFeats()` to filter feats based on character state
- **Usage**: Called by frontend character feat selection UI to display only eligible feats

**Source File**: `src/features/characterResolution/characterResolutionController.ts`

## 🔗 **Routes Layer**

The feat system routes follow the shared [RESTful API Structure](../application-overview/backend-implementation.md#restful-api-structure) with feat-specific endpoints:

### **FeatRoutes**

**Purpose**: Defines API endpoints and request validation for feat system operations.

**Route Structure**:
- **Core Feat Routes**: Standard CRUD operations for feats
- **Feat Query Routes**: Advanced querying with filtering
- **Character Resolution Routes**: Character-specific feat filtering (in character resolution routes)

**Route Definitions**:

**Core Feat Routes**:
- `GET /api/feats` - Retrieve all feats (without feature progressions)
- `GET /api/feats/with-feature-info` - Retrieve all feats with feature description and summary (composite schema)
- `GET /api/feats/:id` - Retrieve specific feat by ID
- `POST /api/feats` - Create new feat (admin required)
- `PUT /api/feats/:id` - Update existing feat (admin required)
- `DELETE /api/feats/:id` - Delete feat (admin required)

**Feat Query Routes**:
- `GET /api/feats/query` - Query feats with filtering

**Character Resolution Routes** (in character resolution router):
- `GET /api/characters/:characterId/resolution/available-feats` - Get filtered available feats for a character

**Authentication**: Admin authentication required for all write operations. User authentication required for character resolution routes.
**Validation**: All routes use Zod schemas for request validation

**Source Files**: 
- `src/features/feat/featRoutes.ts` - Feat CRUD routes
- `src/features/characterResolution/characterResolutionRoutes.ts` - Character resolution routes including available feats

## 🔧 **Business Logic Patterns**

### **Feature System Integration**

All feat benefits and prerequisites are managed through the Feature system:

**Benefits**: Defined via FeatureEntity entries within FeatureProgression entries
- **EntityAppliesToType**: Specifies what the benefit applies to (Attack, SavingThrow, Skill, Proficiency, etc.)
- **appliesToId**: The specific entity ID (skill ID, ability ID, etc.)
- **appliesToSubId**: Optional sub-identifier for special contexts (e.g., AttackBonusAppliesTo for two-weapon fighting)
- **value**: The numeric bonus value

**Prerequisites**: Defined via FeaturePrerequisite entries within Feature entries
- **FeaturePrerequisiteType**: Specifies the prerequisite type (AbilityScore, SkillRanks, Feat, BaseAttackBonus, etc.)
- **appliesToId**: The specific entity ID (ability ID, skill ID, feat ID, etc.)
- **minValue**: The minimum required value

**Integration Pattern**: Benefits and prerequisites are managed through the Feature system service (`featureSystemService`), not directly by the feat service. The feat service creates FeatureProgression entries when creating feats, but all benefit/prerequisite management is handled by the Feature system.

**Related Documentation**: [Feature System Backend Implementation](../feature-system/backend-implementation.md)

### **AvailableFeatService**

A service for filtering available feats for character selection based on prerequisites, owned feats, and proficiency conflicts.

**Purpose**: Provides backend filtering of available feats to ensure only eligible feats are shown to users during character feat selection.

**Key Responsibilities**:
- **Prerequisite Checking**: Validates character meets all feat prerequisites
- **Owned Feat Filtering**: Filters out feats the character already has (unless repeatable)
- **Proficiency Conflict Detection**: Filters out feats that provide proficiencies the character already has as "all" proficiencies

**Core Methods**:

**getAvailableFeats**: Filters available feats for a character
- **Parameters**: 
  - `character`: CharacterWithAllDetailsResponse
  - `resolvedProgressions`: FeatureProgression[] (resolved character features)
  - `classDetails`: DnDClass | null
  - `raceDetails`: Race | null
  - `allFeats`: FeatInQueryResponse[] (all feats to filter)
- **Business Logic**: 
  - Fetches all feats with their feature progressions
  - Extracts character's "all" proficiencies (category-based proficiencies)
  - Identifies owned feats (selected and granted)
  - Filters feats by:
    1. Already owned (unless repeatable and not all iterations owned)
    2. Proficiency conflicts (feats providing proficiencies character already has as "all")
    3. Prerequisites (character must meet all FeaturePrerequisite requirements)
- **Returns**: Filtered array of available feats

**Source File**: `src/features/characterResolution/availableFeatService.ts`

**Usage**: Called by character resolution system to provide filtered feat lists for character feat selection UI.


## 🔗 **Integration Points**

### **Character System Integration**

The feat system integrates with the character system through feat selection and prerequisites:

**Feat Selection**: Characters can select and acquire feats
**Prerequisite Validation**: Character abilities and skills are validated against feat prerequisites
**Feat Benefits**: Character abilities are modified by feat benefits
**Feat Progression**: Character feat progression follows level and class rules

**Integration Pattern**: The feat system provides the framework for character feat management, with character abilities and skills determining feat access and progression.

**Related Documentation**: [Character Management Backend Implementation](../character-management/backend-implementation.md)


### **Feature System Integration**

The feat system is fully integrated with the Feature system:

**Feat Benefits and Prerequisites**: All feat benefits and prerequisites are defined through FeatureProgression entries:
- **FeatureProgression**: Links feats to Features (sourceType: Feat)
- **FeatureEntity**: Defines feat benefits (skill bonuses, attack bonuses, proficiencies, etc.)
- **FeaturePrerequisite**: Defines feat prerequisites (ability scores, skills, feats, BAB, etc.)

**Feature Descriptions**: Feat descriptions and summaries come from associated Features, not the Feat model itself.

**Integration Pattern**: When creating a feat, `featureProgressions` can be included in the request. The feat service creates the feat, then calls `featureSystemService.createMultipleFeatureProgressions()` to create the FeatureProgression entries. All benefit and prerequisite management is handled through the Feature system service.

**Related Documentation**: [Feature System Backend Implementation](../feature-system/backend-implementation.md)

## 📊 **Error Handling**

The feat system follows the shared [Error Handling Patterns](../application-overview/backend-implementation.md#error-handling) with feat-specific error scenarios:

**Validation Errors**: Zod schema validation errors with detailed field information
**Business Logic Errors**: Feat-specific business rule violations
**Database Errors**: Prisma ORM errors with proper error messages
**Feature System Errors**: Errors from Feature system operations (benefit and prerequisite management)

## 🔧 **Performance Considerations**

The feat system implements performance optimizations following the shared [Performance Optimization](../application-overview/performance-optimization.md) patterns:

**Efficient Queries**: Optimized Prisma queries with proper includes and where clauses
**Relationship Loading**: Efficient loading of complex feat relationships
**Caching**: Appropriate caching for frequently accessed feat data
**Pagination**: Proper pagination for large feat collections

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Feat system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Feat system validation rules and schemas
- **[Static Data](static-data.md)** - Feat system enums and types
- **[Frontend Components](frontend-components.md)** - Feat system frontend implementation
- **[Character Management Backend Implementation](../character-management/backend-implementation.md)** - Character system integration
- **[Ability System Backend Implementation](../ability-system/backend-implementation.md)** - Ability system integration
- **[Skill System Backend Implementation](../skill-system/backend-implementation.md)** - Skill system integration
- **[Feature System Backend Implementation](../feature-system/backend-implementation.md)** - Feature system integration
- **[Backend Implementation Patterns](../application-overview/backend-implementation.md)** - Shared backend patterns and conventions
- **[Performance Optimization](../application-overview/performance-optimization.md)** - Shared performance optimization strategies

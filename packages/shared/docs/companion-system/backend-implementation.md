# Companion System Backend Implementation

*Complete documentation for the companion system backend implementation, including API services, controllers, and business logic for companion definitions and character companions.*

## 📋 **Overview**

The companion system backend implementation provides the API layer for managing companion definitions (familiar, animal companion, etc.) and character-specific companion instances. The system supports dual CRUD operations: companion definitions (admin-managed) and character companions (user-managed with ownership validation).

The backend implementation follows the shared [Backend Implementation Patterns](../application-overview/backend-implementation.md) with companion-specific business logic and integration patterns.

**Source Files**: 
- Service: `apps/backend/src/features/companion/companionService.ts`
- Advancement: `apps/backend/src/features/companion/companionAdvancementService.ts`
- Controller: `apps/backend/src/features/companion/companionController.ts`
- Routes: `apps/backend/src/features/companion/companionRoutes.ts`
- Types: `apps/backend/src/features/companion/types.ts`
- Seed repair: `apps/backend/prisma/seeds/companion-entity-type.sql`
- Seed cleanup: `apps/backend/prisma/seeds/companion-benefit-clone-cleanup.sql`

## 🏗️ **Architecture Overview**

The companion system backend follows the shared [Layered Architecture Pattern](../application-overview/backend-implementation.md#layered-architecture-pattern) with companion-specific implementations:

**Routes Layer**: API endpoints for companion definition and character companion management
**Controller Layer**: Request handling and response formatting with ownership validation
**Service Layer**: Companion-specific business logic and data operations
**Database Layer**: Prisma ORM with companion system models

### **Service Architecture**

The companion system uses a service-oriented architecture following the shared [Service-Oriented Architecture](../application-overview/backend-implementation.md#service-oriented-architecture) patterns:

**CompanionService**: Central service containing all companion management logic
**Dual CRUD Operations**: Separate operations for companion definitions and character companions
**Feature System Integration**: Integration with feature system for companion benefits
**Transaction Safety**: Consistent transaction patterns for trick association management
**Automatic HP Calculation**: Business logic for deriving hit points from monster data

### **Key Design Principles**

**Companion Definitions**: Admin-managed companion templates (familiar types, animal companion types)
**Character Companions**: User-managed companion instances linked to specific characters
**Feature Integration**: Companion benefits managed through feature progressions
**Trick Management**: Transaction-based trick association for character companions
**Ownership Validation**: Character ownership checks in controller layer

## 🔧 **Core Service Layer**

### **CompanionService**

The central service for all companion management operations, providing comprehensive companion CRUD operations and character companion management.

**Purpose**: Provides comprehensive companion management capabilities, from basic companion definition CRUD to complex character companion management with trick associations and automatic HP calculation.

**Key Responsibilities**:
- **Companion Definition CRUD**: Create, read, update, and delete companion definitions
- **Character Companion Management**: Create, read, update, and delete character-specific companions
- **Feature Integration**: Retrieve companion feature progressions through feature system
- **Trick Association**: Manage trick associations for character companions
- **HP Calculation**: Automatic hit point calculation from monster data
- **Transaction Safety**: Ensure data consistency through proper transaction handling

**Core Methods**:

#### **getAllCompanions**

**Purpose**: Retrieves all companion definitions with monster information.

**Architecture Decision**: Orders results by companion type and monster ID for consistent presentation.

**Returns**: GetAllCompanionsResponse with total count and results array

**Business Logic**:
1. Queries all companion definitions from database
2. Includes related monster data (id, name) for display
3. Orders by type (ascending) then monsterId (ascending)
4. Returns paginated results with total count

**Source File**: `apps/backend/src/features/companion/companionService.ts`

#### **getCompanionCache**

**Purpose**: Retrieves companion cache data with monster names for frontend use.

**Architecture Decision**: Cache Endpoint Pattern - Returns lightweight companion data optimized for dropdowns and select components, including monster name directly in response to reduce frontend complexity.

**Returns**: CompanionCacheResponse with total count and results array containing companion cache entries with id, monsterId, name (from monster), type, and minLevel

**Business Logic**:
1. Queries all companion definitions with monster join to get monster names
2. Transforms results to include monster name directly in companion cache entry
3. Orders by type (ascending) then monster name (ascending) for consistent presentation
4. Returns cache response with total count and transformed results

**Design Decision**: Cache Endpoint Pattern
- Includes monster name directly in response (populated from monster join)
- Reduces frontend complexity by eliminating need for separate monster cache lookup
- Optimized for dropdowns and select components

**Source File**: `apps/backend/src/features/companion/companionService.ts`

**Related Documentation**:
- [Query Hooks and Caching Architecture](../application-overview/query-hooks-and-caching.md)
- [Cache-Based ID Maps](../application-overview/cache-based-id-maps.md)

#### **getCompanionById**

**Purpose**: Retrieves a specific companion definition by ID with complete details including feature progressions.

**Architecture Decision**: Integrates with feature system service to retrieve companion benefit feature progressions, ensuring companion benefits are properly loaded.

**Parameters**: CompanionIdParamRequest with companion ID

**Returns**: GetCompanionResponse with complete companion data including feature progressions, or null if not found

**Business Logic**:
1. Loads companion with related monster data
2. Retrieves features using `featureSystemService.getFeatureProgressionsByCompanionId()` (method name maintained for backward compatibility, operates on unified Feature model)
3. Combines companion data with features
4. Returns complete companion object with features

**Integration Points**:
- **Feature System**: Uses `featureSystemService.getFeatureProgressionsByCompanionId()` to retrieve companion benefit features (sourceType: Companion, companionId set) - operates on unified Feature model
- **Monster System**: Includes monster data for companion display

**Source File**: `apps/backend/src/features/companion/companionService.ts`

#### **createCompanion**

**Purpose**: Creates a new companion definition (admin only).

**Parameters**: CreateCompanionRequest with companion data

**Returns**: CreateResponse with created companion ID

**Business Logic**:
1. Creates companion record in database
2. Returns created companion ID

**Source File**: `apps/backend/src/features/companion/companionService.ts`

#### **updateCompanion**

**Purpose**: Updates an existing companion definition (admin only).

**Parameters**:
- Query: CompanionIdParamRequest with companion ID
- Body: UpdateCompanionRequest with updated data

**Returns**: UpdateResponse with success message

**Business Logic**:
1. Updates companion record in database
2. Returns success response

**Source File**: `apps/backend/src/features/companion/companionService.ts`

#### **deleteCompanion**

**Purpose**: Deletes a companion definition and all related data (admin only).

**Parameters**: CompanionIdParamRequest with companion ID

**Returns**: UpdateResponse with success message

**Business Logic**:
1. Deletes companion record (cascades to related data)
2. Returns success response

**Source File**: `apps/backend/src/features/companion/companionService.ts`

#### **getCharacterCompanions**

**Purpose**: Retrieves all companions for a specific character.

**Architecture Decision**: Includes complete companion data with monster information, companion definition details, and trick associations for comprehensive character companion display.

**Parameters**: characterId (number) - The character ID to retrieve companions for

**Returns**: GetAllCharacterCompanionsResponse with total count and results array

**Business Logic**:
1. Queries character companions filtered by characterId
2. Includes related data:
   - Monster data (id, name)
   - Companion definition data (id, type, monsterId, minLevel)
   - Trick associations with trick details
3. Orders by levelAcquired (ascending)
4. Returns paginated results with total count

**Source File**: `apps/backend/src/features/companion/companionService.ts`

#### **createCharacterCompanion**

**Purpose**: Creates a new character companion with trick associations and automatic HP calculation.

**Architecture Decision**: Uses transaction to ensure atomic creation of companion and trick associations. Automatically calculates hit points from monster averageHP if not provided.

**Parameters**: CreateCharacterCompanionRequest with character companion data and optional tricks array

**Returns**: CreateResponse with created character companion ID

**Business Logic**:
1. Extracts tricks array from request data
2. Calculates hit points:
   - If hitPoints provided, uses provided value
   - If not provided, queries monster for averageHP
   - Falls back to null if monster not found
3. Creates character companion in transaction:
   - Creates characterCompanion record
   - Creates trick associations if tricks array provided
4. Returns created companion ID

**Integration Points**:
- **Monster System**: Queries monster.averageHP for automatic HP calculation
- **Trick System**: Creates CharacterCompanionTrick associations

**Transaction Pattern**: Uses Prisma transaction to ensure atomic creation of companion and trick associations.

**Source File**: `apps/backend/src/features/companion/companionService.ts`

#### **updateCharacterCompanion**

**Purpose**: Updates an existing character companion with trick management.

**Architecture Decision**: Uses delete/recreate pattern for trick associations to ensure data consistency. Only updates tricks if tricks array is explicitly provided (undefined means no change).

**Parameters**:
- Query: { id: number } with character companion ID
- Body: UpdateCharacterCompanionRequest with updated data and optional tricks array

**Returns**: UpdateResponse with success message

**Business Logic**:
1. Extracts tricks array from request data
2. Updates character companion in transaction:
   - Updates characterCompanion record
   - If tricks array provided (not undefined):
     - Deletes all existing trick associations
     - Creates new trick associations if array is non-empty
3. Returns success response

**Transaction Pattern**: Uses Prisma transaction with delete/recreate pattern for trick associations.

**Source File**: `apps/backend/src/features/companion/companionService.ts`

#### **deleteCharacterCompanion**

**Purpose**: Deletes a character companion and all related data.

**Parameters**: { id: number } with character companion ID

**Returns**: UpdateResponse with success message

**Business Logic**:
1. Deletes character companion record (cascades to trick associations)
2. Returns success response

**Source File**: `apps/backend/src/features/companion/companionService.ts`

## 🎯 **Controller Layer**

The companion controllers follow the shared [Controller Layer Pattern](../application-overview/backend-implementation.md#controller-layer) with companion-specific request handling and ownership validation:

### **CompanionController**

**Purpose**: Handles HTTP requests for companion operations, delegating to the companion service and formatting responses.

**Controller Methods**:

#### **GetAllCompanions**

**Purpose**: Handles requests for all companion definitions.

**Request**: No parameters

**Response**: GetAllCompanionsResponse with total and results

**Authentication**: Public (no authentication required)

#### **GetCompanionCache**

**Purpose**: Handles requests for cached companion data.

**Request**: No parameters

**Response**: CompanionCacheResponse with cached companion data including monster names

**Authentication**: Public (no authentication required)

**Source File**: `apps/backend/src/features/companion/companionController.ts`

#### **GetCompanionById**

**Purpose**: Handles requests for specific companion definition by ID.

**Request**: Path parameter with companion ID

**Response**: GetCompanionResponse with complete companion data, or 404 if not found

**Authentication**: Public (no authentication required)

#### **CreateCompanion**

**Purpose**: Handles companion definition creation requests (admin only).

**Request**: Body with companion definition data

**Response**: CreateResponse with created companion ID

**Authentication**: Requires admin access

#### **UpdateCompanion**

**Purpose**: Handles companion definition update requests (admin only).

**Request**: Path parameter with companion ID, body with update data

**Response**: UpdateResponse with success message

**Authentication**: Requires admin access

#### **DeleteCompanion**

**Purpose**: Handles companion definition deletion requests (admin only).

**Request**: Path parameter with companion ID

**Response**: 204 No Content

**Authentication**: Requires admin access

#### **GetCharacterCompanions**

**Purpose**: Handles requests for all companions for a specific character.

**Request**: Path parameter with characterId

**Response**: GetAllCharacterCompanionsResponse with total and results

**Authentication**: Public (no authentication required)

#### **CreateCharacterCompanion**

**Purpose**: Handles character companion creation requests with ownership validation.

**Request**: Body with character companion data

**Response**: CreateResponse with created companion ID

**Authentication**: Requires authentication

**Ownership Validation**:
1. Verifies user is authenticated
2. Queries character to verify ownership
3. Returns 401 if not authenticated
4. Returns 404 if character not found
5. Returns 403 if character does not belong to user
6. Proceeds with creation if ownership verified

**Source File**: `apps/backend/src/features/companion/companionController.ts`

#### **UpdateCharacterCompanion**

**Purpose**: Handles character companion update requests with ownership validation.

**Request**: Path parameter with character companion ID, body with update data

**Response**: UpdateResponse with success message

**Authentication**: Requires authentication

**Ownership Validation**:
1. Verifies user is authenticated
2. Queries character companion with character relationship
3. Verifies character ownership through relationship
4. Returns 401 if not authenticated
5. Returns 404 if companion not found
6. Returns 403 if character does not belong to user
7. Proceeds with update if ownership verified

**Source File**: `apps/backend/src/features/companion/companionController.ts`

#### **DeleteCharacterCompanion**

**Purpose**: Handles character companion deletion requests with ownership validation.

**Request**: Path parameter with character companion ID

**Response**: 204 No Content

**Authentication**: Requires authentication

**Ownership Validation**: Same pattern as UpdateCharacterCompanion

**Source File**: `apps/backend/src/features/companion/companionController.ts`

## 🔗 **Routes Layer**

The companion routes follow the shared [RESTful API Structure](../application-overview/backend-implementation.md#restful-api-structure) pattern:

### **CompanionRoutes**

**Purpose**: Defines API endpoints for companion operations with proper validation and authentication.

**Route Definitions**:

**Companion Definition Routes**:
- **`GET /api/companions`**: Get all companion definitions (public)
- **`GET /api/companions/cache`**: Get cached companion data with monster names (public)
- **`GET /api/companions/:id`**: Get specific companion definition (public)
- **`POST /api/companions`**: Create companion definition (admin only)
- **`PUT /api/companions/:id`**: Update companion definition (admin only)
- **`DELETE /api/companions/:id`**: Delete companion definition (admin only)

**Character Companion Routes**:
- **`GET /api/companions/character/:characterId`**: Get all companions for a character (public)
- **`POST /api/companions/character`**: Create character companion (authenticated, ownership validated)
- **`PUT /api/companions/character/:id`**: Update character companion (authenticated, ownership validated)
- **`DELETE /api/companions/character/:id`**: Delete character companion (authenticated, ownership validated)

**Validation Schemas**:
- CompanionIdParamSchema for companion ID parameters
- CreateCompanionSchema for companion creation
- UpdateCompanionSchema for companion updates
- CreateCharacterCompanionSchema for character companion creation
- UpdateCharacterCompanionSchema for character companion updates
- CharacterCompanionIdParamSchema for character companion ID parameters

**Source File**: `apps/backend/src/features/companion/companionRoutes.ts`

## 🔗 **Integration Points**

### **Feature System Integration**

The companion service integrates with the feature system for companion benefit management:

**Integration Pattern**:
- Companion benefits are managed through features (unified Feature model)
- Uses FeatureSourceType.Companion to identify companion-granted features
- Features are retrieved through `featureSystemService.getFeatureProgressionsByCompanionId()` (method name maintained for backward compatibility)
- Companion benefits use distinct named features (e.g., "Cat Familiar Benefit", "Owl Familiar Benefit")
- All progressions with `sourceType: FeatureSourceType.Companion` are automatically included with characters

**Benefits**:
- **Consistency**: Companion benefits use same system as class and race features
- **Flexibility**: Companion benefits can use all feature system capabilities
- **Maintainability**: Single feature system for all feature types

**Companion-targeted features (`EntityType.Companion`)**:
- Choice features (`AppliesTo=AnimalCompanion` or `Familiar`) still determine contributing classes and effective level (`levelDivisor`)
- `companionAdvancementService` loads class features mapped to those classes that have at least one `Type=Companion` entity, then includes rows whose `Feature.level` is at or below effective level
- Chassis overlay uses `Type=Companion` with `AppliesTo` in HitDice, AC, Ability, CompanionBonusTricks, SpellResistance, and HitPoints
- Named creature specials are remaining `Type=Companion` entities with `displayInDetail`; the animal sheet shows `Name: summary`
- Devotion overlays its Will bonus onto the computed companion Will save and remains a named special (enchantment condition)
- Multiattack is a `Type=Companion` feat grant on the creature, not a character-sheet feat
- Type benefits (Cat +3 Move Silently) stay `sourceType=Companion` + `Type=Bonus` on the master. Character resolution loads them from persisted `companionId` and from Familiar/Animal Companion choices. Duplicate `companion-benefit-*` merge clones are removed by `apps/backend/prisma/seeds/companion-benefit-clone-cleanup.sql`

**Related Documentation**: [Feature System Backend Implementation](../feature-system/backend-implementation.md) and [Feature System Static Data](../feature-system/static-data.md#entitytype)

### **Monster System Integration**

Companions integrate with the monster system:

**Integration Pattern**:
- Companion definitions link to monsters via monsterId
- Character companions link to monsters via monsterId
- Monster averageHP is used for automatic hit point calculation
- Monster data is included in companion responses for display

**Benefits**:
- **Data Reuse**: Companions leverage existing monster statblocks
- **Consistency**: Companion stats match monster definitions
- **Efficiency**: Single source of truth for monster data

**Related Documentation**: [Monster System Backend Implementation](../monster-system/backend-implementation.md)

### **Trick System Integration**

Character companions integrate with the trick system:

**Integration Pattern**:
- Character companions have many-to-many relationship with tricks
- Trick associations are managed through CharacterCompanionTrick junction table
- Transaction-based management ensures data consistency
- Delete/recreate pattern used for updates

**Benefits**:
- **Flexibility**: Companions can learn multiple tricks
- **Data Integrity**: Transaction-based management prevents orphaned records
- **Consistency**: Delete/recreate pattern ensures clean state

**Related Documentation**: [Trick System Backend Implementation](../trick-system/backend-implementation.md)

### **Character System Integration**

Character companions integrate with the character system:

**Integration Pattern**:
- Character companions belong to specific characters via characterId
- Ownership validation ensures users can only manage their own companions
- Character ownership checked in controller layer before operations

**Benefits**:
- **Security**: Ownership validation prevents unauthorized access
- **Data Isolation**: Users can only see and manage their own companions
- **Consistency**: Follows same ownership pattern as other character data

**Related Documentation**: [Character Management Backend Implementation](../character-management/backend-implementation.md)

## 🎯 **Architecture Decisions**

### **Why Dual CRUD Operations**

**Decision**: Separate operations for companion definitions and character companions.

**Rationale**:
- **Separation of Concerns**: Companion definitions are admin-managed templates, character companions are user-managed instances
- **Security**: Different authentication requirements (admin vs. user)
- **Data Model**: Different data structures (definition vs. instance with character linkage)
- **Ownership**: Character companions require ownership validation

**Alternatives Considered**:
- Single unified CRUD interface
- Character companions as sub-resource of characters

**Trade-offs**:
- **Benefits**: Clear separation, appropriate security, proper ownership validation
- **Limitations**: Slightly more complex API structure

### **Why Transaction-Based Trick Management**

**Decision**: Trick associations managed within transactions with delete/recreate pattern.

**Rationale**:
- **Data Integrity**: Ensures atomic updates of companion and tricks
- **Consistency**: Delete/recreate pattern ensures clean state
- **Error Handling**: Transaction rollback prevents partial updates

**Alternatives Considered**:
- Individual trick add/remove operations
- Update-in-place pattern

**Trade-offs**:
- **Benefits**: Atomic operations, data consistency, simpler state management
- **Limitations**: Requires full trick list on update

### **Why Automatic HP Calculation**

**Decision**: Automatically calculate hit points from monster averageHP if not provided.

**Rationale**:
- **User Experience**: Reduces manual data entry
- **Consistency**: Ensures companions match monster statblocks
- **Default Behavior**: Provides sensible defaults

**Alternatives Considered**:
- Require explicit HP input
- Use monster HP directly without override

**Trade-offs**:
- **Benefits**: Better UX, consistency with monster data
- **Limitations**: May not match all use cases (damaged companions, etc.)

## 📚 **Related Documentation**

- **[Feature System Backend Implementation](../feature-system/backend-implementation.md)** - Feature system integration
- **[Monster System Backend Implementation](../monster-system/backend-implementation.md)** - Monster system integration
- **[Trick System Backend Implementation](../trick-system/backend-implementation.md)** - Trick system integration
- **[Character Management Backend Implementation](../character-management/backend-implementation.md)** - Character system integration
- **[Backend Implementation Patterns](../application-overview/backend-implementation.md)** - Shared backend patterns

## Summary

The companion system backend implementation provides a robust, flexible, and secure foundation for companion definition and character companion management. The implementation follows established patterns, provides comprehensive error handling, and ensures data integrity through proper validation, ownership checks, and transaction management.

Key strengths include:
- **Dual CRUD Operations**: Clear separation between definitions and instances
- **Feature Integration**: Companion benefits use feature system for consistency
- **Ownership Validation**: Secure character companion management
- **Transaction Safety**: Atomic operations for trick associations
- **Automatic HP Calculation**: Improved user experience with sensible defaults
- **Type Safety**: Full TypeScript integration with proper interfaces
- **Error Handling**: Comprehensive error handling with proper logging

The implementation is designed to scale with the application and provides the necessary functionality for companion management operations while maintaining security and data integrity.

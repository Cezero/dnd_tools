# Character Resolution System

*Complete documentation for the character feature resolution system, including backend resolution services, session management, and API endpoints.*

## 📋 **Overview**

The character resolution system is a centralized backend service that handles all character feature resolution logic. It processes base features (race, class), resolves user choices, handles cascading feature grants, and manages persistent editing sessions using Redis.

**Key Features**:
- Centralized feature resolution logic on the backend
- Persistent session management with Redis (survives backend restarts)
- RESTful API for session lifecycle management
- Support for gestalt multiclassing
- Cascading feature resolution with depth limits
- Level-based feature filtering

**Source Files**:
- Backend Services: `apps/backend/src/features/characterResolution/`
- Frontend API Client: `apps/frontend/src/services/api/CharacterResolutionApi.ts`
- Frontend Hook: `apps/frontend/src/features/character/useCharacterResolution.ts`
- Session Service: `apps/backend/src/features/shared/session/GenericSessionService.ts`

## 🏗️ **Core Components**

### **CharacterResolutionService**

Main service orchestrating the complete feature resolution process.

**Purpose**: Resolves all character features at a given level, handling base features, gestalt merging, user choices, and cascading grants.

**Key Methods**:
- `resolveCharacterFeatures()` - Main entry point for feature resolution

**Resolution Phases**:
1. **Base Features**: Resolves racial and class features
2. **Gestalt Merging**: Merges primary and secondary classes if applicable
3. **Pending Choice Identification**: Scans for choices requiring user input
4. **User Choice Resolution**: Processes user selections
5. **Granted Feature Resolution**: Handles cascading feature grants
6. **Final Compilation**: Assembles complete resolution result

**Source File**: `apps/backend/src/features/characterResolution/characterResolutionService.ts`

### **CharacterSessionService**

Service for managing character editing sessions in Redis.

**Purpose**: Provides persistent session storage using Redis. Sessions survive backend restarts and automatically expire after inactivity via Redis TTL.

**Key Features**:
- Automatic cleanup of expired sessions (every 5 minutes)
- Session state persistence (character edits, resolved features)
- Per-user, per-character session isolation
- WAL mode for concurrent access

**Key Methods**:
- `getSession()` - Retrieves active session by character ID and user ID
- `getSessionById()` - Retrieves session by unique session ID
- `createSession()` - Creates new editing session
- `updateSession()` - Updates session with new state
- `deleteSession()` - Deletes session by session key
- `deleteSessionById()` - Deletes session by session ID
- `cleanupExpiredSessions()` - Removes expired sessions

**Session Storage**:
- Database: Redis
- Key Pattern: `session:character:{characterId}:{userId}`
- Storage: JSON serialization with Redis TTL
- Expiration: Configurable via `SESSION_EXPIRATION_MINUTES` (default: 30 minutes)

**Source File**: `apps/backend/src/features/characterResolution/characterSessionService.ts`

### **ChoiceResolver**

Backend service for resolving character choices.

**Purpose**: Handles identification of pending choices and resolution of selected choices. Uses backend services instead of frontend fetch calls.

**Key Methods**:
- `identifyPendingChoices()` - Identifies choices requiring user input
- `resolveChoiceByType()` - Centralized method that resolves choices by appliesTo type
- `resolveDomainChoice()` - Resolves domain selection
- `resolveFeatChoice()` - Resolves feat selection
- `resolveFamiliarChoice()` - Resolves familiar selection and converts benefits to progressions
- `resolveAnimalCompanionChoice()` - Resolves animal companion selection
- `resolveSkillChoice()` - Resolves skill selection
- `resolveSpellChoice()` - Resolves spell selection
- `resolveFeatureChoice()` - Resolves feature selection
- `addResolvedProgressions()` - Utility function for adding progressions with duplicate checking and optional entity processing

**Utility Function: `addResolvedProgressions()`**

Adds feature progressions to a target array, avoiding duplicates. Optionally processes entities in new progressions before adding them, which is useful for cascading feature resolution.

**Parameters**:
- `targetProgressions` - Array to add progressions to (modified in place)
- `newProgressions` - New progressions to add (checked for duplicates)
- `options` (optional) - Configuration options:
  - `processEntities` - If true, processes entities in new progressions using FeatureEntityHandlers
  - `onEntityProcessed` - Optional callback when an entity is processed (for warnings/errors)

**Usage Patterns**:
- **Simple add without entity processing**: Used in cascading resolution when entities will be processed in the next iteration
- **Add with entity processing**: Used when progressions need immediate entity processing (e.g., in CharacterResolutionService)

**Source File**: `apps/backend/src/features/characterResolution/choiceResolver.ts`

### **CascadingResolver**

Service for handling cascading feature resolution.

**Purpose**: Processes features that grant other features recursively, handling circular dependencies and depth limits.

**Key Features**:
- Iterative resolution until no new features are granted
- Maximum depth limit (default: 10) to prevent infinite loops
- Circular dependency detection
- User choice integration during resolution

**Key Methods**:
- `resolveCascadingFeatures()` - Main entry point for cascading resolution
- `processGrantedFeatures()` - Processes features granted by other features (enables cascading resolution)
- `resolveUserChoices()` - Resolves user-selected choices and their cascading effects

**Method: `processGrantedFeatures()`**

Processes features granted by other features, enabling multi-level cascading resolution. When a feature entity grants another feature (e.g., a feat granting domain features, or a Ranger feature granting the Track feat), this method resolves the granted feature and adds it to the progressions array.

**Examples**:
- **Ranger features** that grant feats (e.g., Track feat)
- **Fighting Style choices** that determine other features
- **Features that grant feats** which in turn grant more features (multi-level cascading)
- **Ranger fighting style features** that grant feats which grant features

**How It Works**:
1. Iterates through granted entities from `EntityProcessingResult`
2. For each entity with `appliesTo` and `appliesToId`, uses `ChoiceResolver.resolveChoiceByType()` to resolve the granted feature
3. Adds resolved progressions using `ChoiceResolver.addResolvedProgressions()` utility
4. Entities in granted progressions are processed in the next iteration of the cascading loop

**Source File**: `apps/backend/src/features/characterResolution/cascadingResolver.ts`

## 💾 **Session Storage**

The session storage uses Redis (not Prisma). Sessions are stored as JSON strings with Redis TTL for automatic expiration.

### **Redis Session Storage**

Stores character editing session state in Redis.

**Key Pattern**: `session:character:{characterId}:{userId}`

**Data Structure**:
- `id` (string) - Unique session identifier (UUID)
- `characterId` (number) - Reference to character
- `userId` (number) - Reference to user
- `sessionKey` (string) - Composite key: `characterId:userId`
- `characterState` (object) - CharacterEditState (JSON serialized)
- `resolvedResult` (object) - ResolvedCharacterResult (JSON serialized)
- `createdAt` (number) - Unix timestamp (milliseconds)
- `updatedAt` (number) - Unix timestamp (milliseconds)
- `expiresAt` (number) - Unix timestamp (milliseconds)

**Storage Features**:
- **TTL-Based Expiration**: Redis TTL automatically expires sessions
- **JSON Serialization**: Session data stored as JSON strings
- **High Performance**: In-memory Redis storage for fast access
- **Automatic Cleanup**: Redis automatically removes expired sessions

**Redis Configuration**:
- Connection: Configured via `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` environment variables
- TTL: Configurable via `SESSION_EXPIRATION_MINUTES` (default: 30 minutes)
- Initialization: Automatic on first access

**Source File**: `apps/backend/src/features/shared/session/GenericSessionService.ts`

## 🔌 **API Endpoints**

All endpoints are prefixed with `/api/characters/:characterId/resolution/`

## 📋 **Validation Schemas**

The character resolution system uses Zod schemas for request and response validation. All schemas are defined in `packages/shared/schema/src/characterResolution.ts` and exported through the main schema package.

### **Response Schemas**

**`SaveSessionResponseSchema`**:
- Validates the response when saving a resolution session to the database
- Structure: `{ character: CharacterWithAllDetailsSchema }`
- The character field contains the updated character with all details after the session is saved
- Source: `packages/shared/schema/src/characterResolution.ts`

**`CancelSessionResponseSchema`**:
- Validates the response when cancelling a resolution session
- Structure: `{ success: boolean }` transformed to `void`
- The transform pattern is used because the backend returns a success indicator but the frontend API client expects `Promise<void>`
- Source: `packages/shared/schema/src/characterResolution.ts`

**`GetAvailableFeatsResponseSchema`**:
- Validates the response when fetching available feats for a character
- Structure: `{ results: FeatInQueryResponse[], total: number }`
- The results array contains feats filtered by prerequisites, proficiencies, and character-specific requirements
- The total field indicates the total count of available feats
- Uses `FeatInQueryResponseSchema` for type-safe feat data
- Source: `packages/shared/schema/src/characterResolution.ts`

**Related Documentation**: [Validation Schema Patterns](../application-overview/validation-schemas.md) for common validation patterns

### **POST /session**

Initialize a new resolution session.

**Purpose**: Creates a new editing session for a character, resolving all features and returning the complete resolution result.

**Request**: No body required

**Response**: `ResolvedCharacterResult` with:
- `resolvedProgressions` - All resolved feature progressions
- `pendingChoices` - Choices requiring user input
- `classSkills` - Array of class skills
- `skillBonuses` - Array of skill bonuses with sources
- `grantedFeats` - Array of granted feat IDs
- `availableFeatsCount` - Count of available feat slots (number)
- `availableFighterBonusFeats` - Count of available fighter bonus feat slots
- `qualifiedFeats` - List of feats the character qualifies for (array of `FeatInQueryResponse`)
- `formattedCharacter` - Formatted character data for display
- `warnings` - Array of warning messages
- `errors` - Array of error messages
- `sessionId` - Unique session identifier

**Source File**: `apps/backend/src/features/characterResolution/characterResolutionController.ts` (InitializeSession)

### **GET /session**

Resume an existing resolution session or create a new one if none exists.

**Purpose**: Retrieves an active session for a character, or automatically creates a new session if none exists. This always returns a session, eliminating the need for the frontend to make two API calls (resume + initialize) when no session exists.

**Request**: No body required

**Response**: `ResolvedCharacterResult` (always returns a session - creates one if none exists)

**Behavior**:
- If an active session exists: returns the stored resolution result
- If no session exists: automatically creates a new session using the same logic as `POST /session` and returns it

**Source File**: `apps/backend/src/features/characterResolution/characterResolutionController.ts` (ResumeSession)

### **PATCH /session/:sessionId**

Apply an update to the resolution session.

**Purpose**: Updates the character state and re-resolves features, returning the updated resolution result.

**Request Body**: `CharacterUpdate` (discriminated union):
- `SET_ABILITY_SCORE` - Update ability score
- `SET_SKILL_RANK` - Update skill rank
- `SET_RACE` - Change race
- `SET_CLASS` - Change primary class
- `SET_SECONDARY_CLASS` - Change secondary class (gestalt)
- `SET_LEVEL` - Change character level
- `MAKE_CHOICE` - Make a feature choice
- `SET_FEAT` - Add a feat
- `REMOVE_FEAT` - Remove a feat
- `SET_DISALLOWED_SOURCE` - Disallow a feature source
- `REMOVE_DISALLOWED_SOURCE` - Remove disallowed source

**Response**: `ResolvedCharacterResult` with updated resolution

**Source File**: `apps/backend/src/features/characterResolution/characterResolutionController.ts` (ApplyUpdate)

### **GET /session/:sessionId**

Get current session state.

**Purpose**: Retrieves the current character state and resolution result without re-resolving.

**Request**: No body required

**Response**: `ResolvedCharacterResult`

**Source File**: `apps/backend/src/features/characterResolution/characterResolutionController.ts` (GetCurrentState)

### **POST /session/:sessionId/save**

Save session to character.

**Purpose**: Persists the current session state to the character record in the main database.

**Request**: No body required

**Response**: Success message

**Source File**: `apps/backend/src/features/characterResolution/characterResolutionController.ts` (SaveSession)

### **DELETE /session/:sessionId**

Cancel/delete a session.

**Purpose**: Deletes the session without saving changes.

**Request**: No body required

**Response**: Success message

**Source File**: `apps/backend/src/features/characterResolution/characterResolutionController.ts` (CancelSession)

**Source File**: `apps/backend/src/features/characterResolution/characterResolutionRoutes.ts`

### **Spell Operations Integration**

Spell add/remove operations (`addSpellKnown`/`removeSpellKnown`) integrate with the resolution session system to maintain consistency between spell state and resolved features.

**Backend Integration**:
- `characterService.addSpellKnown()` and `characterService.removeSpellKnown()` check for active resolution sessions
- If a session exists, these methods:
  - Rebuild the complete `CharacterEditState` from the updated character (including new/removed spells)
  - Re-resolve character features with the updated character state
  - Update the session with the new resolved result
  - Include the updated `ResolvedCharacterResult` in the response
- If no session exists, the methods still perform validation but do not update session state
- The resolved progressions from the session (or on-demand resolution) are used for validation:
  - Free grant quantity limits for spellbook classes
  - Spell level validation (max castable at advancement level)
  - 0th level spell grant detection

**Frontend Integration**:
- `SpellSelectionTab` uses `useCharacterResolution` hook's `updateResolvedCharacter()` method
- Spell operations no longer manually manipulate TanStack Query caches for character details
- The resolved character data from the response is used to keep the resolution session in sync
- Frontend performs optimistic cache updates for spell data and character advancements
- The resolution hook state is updated directly from the backend response

**Response Format**:
- `AddSpellKnownResponse` and `RemoveSpellKnownResponse` include:
  - `freeSpellsUsed` - Count of free grants used (for spellbook classes)
  - `availableFreeSpells` - Total free spells available at the advancement level
  - `remainingFreeSpells` - Remaining free spells that can be granted
  - `resolvedCharacter` (optional) - Complete resolution result after the spell operation
- The `resolvedCharacter` field is only included when an active session exists
- Frontend uses this data to update the resolution hook state via `updateResolvedCharacter()`

**Free Grant vs Ad-Hoc Scribing**:
- **Free Grants** (`isFreeGrant: true`): Spells granted for free during level-up, subject to quantity limits calculated from resolved progressions
- **Ad-Hoc Scribing** (`isFreeGrant: false`): Spells scribed from scrolls or found spellbooks, no quantity limits but still subject to spell level validation
- Both types are stored in `AdvancementSpell` with the `isFreeGrant` flag to distinguish them
- Free grant validation only applies during level-up mode; ad-hoc scribing has no quantity restrictions

**Spell Level Validation**:
- Both free grants and ad-hoc scribing are subject to spell level restrictions
- A character can only scribe spells up to the maximum castable spell level at their advancement level
- For example, a 1st-level wizard can only scribe 1st-level spells, even if they find a scroll of a 3rd-level spell
- Validation uses `getMaxCastableSpellLevel()` to determine the maximum spell level for a class at a given character level

**0th Level Spell Grants**:
- For spellbook classes, 0th level spells are granted via feature system (no database records)
- Detected by checking for `EntityType.Other` + `EntityAppliesToType.SpellbookSpell` with `appliesToId: 0` and `appliesToSubId: -1`
- This feature-based approach means 0th level spells are "known" if the grant feature exists in resolved progressions
- No `AdvancementSpell` records are created for 0th level spells in spellbook classes
- Non-spellbook classes (Sorcerer, Bard) continue to select and store 0th level spells in `AdvancementSpell` records

**Source Files**:
- Backend: `apps/backend/src/features/character/characterService.ts` (`addSpellKnown`, `removeSpellKnown` methods)
- Frontend: `apps/frontend/src/features/character/tabs/SpellSelectionTab.tsx`
- Frontend Hook: `apps/frontend/src/features/character/useCharacterResolution.ts`
- Related Documentation: [Spell Scribing Feature](./spell-scribing.md) - Comprehensive spell scribing documentation

## 🔗 **Integration Points**

### **Character System Integration**

The resolution system integrates with the character management system:

- **Character Data**: Loads character data via `characterService.getCharacterWithAllDetails()`
- **Character Updates**: Saves character state via `characterService` methods
- **Character Ownership**: Verifies user ownership before allowing session access

**Related Documentation**: [Character Management Backend Implementation](./backend-implementation.md)

### **Race System Integration**

The resolution system uses race data for feature resolution:

- **Race Features**: Loads race details via `raceService.getRaceById()`
- **Racial Progressions**: Processes racial feature progressions

**Related Documentation**: [Race System Documentation](../race-system/)

### **Class System Integration**

The resolution system uses class data for feature resolution:

- **Class Features**: Loads class details via `classService.getClassById()`
- **Class Progressions**: Processes class feature progressions
- **Gestalt Merging**: Uses `GestaltClassService` for multiclass merging

**Related Documentation**: [Class System Documentation](../class-system/)

### **Feature System Integration**

The resolution system processes features:

- **Features**: Works with `Feature` objects from the feature system (FeatureProgression is a type alias for FeatureWithRelationsSchema)
- **Feature Entities**: Processes `FeatureEntity` objects for choices and grants
- **Feature Resolution**: Uses `FeatureEntityHandlers` for entity processing

**Related Documentation**: [Feature System Documentation](../feature-system/)

### **Domain System Integration**

The resolution system resolves domain choices:

- **Domain Features**: Loads domain data via `domainService.getDomainById()`
- **Domain Progressions**: Processes domain feature progressions

**Related Documentation**: [Divine Domains Documentation](../divine-domains/)

### **Companion System Integration**

The resolution system resolves familiar and animal companion choices:

- **Companion Data**: Loads companion data via `companionService.getCompanionById()`
- **Companion Benefits**: Converts companion benefits to feature progressions

**Related Documentation**: [Monster System Documentation](../monster-system/) (companions are linked to monsters)

### **Frontend Integration**

The frontend uses the resolution API through:

- **API Client**: `CharacterResolutionApi` provides typed API methods
- **React Hook**: `useCharacterResolution` manages session lifecycle
- **Character Edit**: `CharacterEdit.tsx` uses the hook for all resolution
- **Character Explorer**: Uses API directly for read-only resolution
- **PDF Service**: Uses resolved progressions from API
- **Spell Selection Tab**: Uses `updateResolvedCharacter()` method to sync state after spell operations

**Session Initialization**:
- The `useCharacterResolution` hook calls `resumeSession` on mount
- Since `resumeSession` always returns a session (creates one if needed), the hook no longer needs to check for null or make a second API call to `initializeSession`
- This simplifies the frontend code and reduces API calls from two to one when no session exists

**State Synchronization Pattern**:
- All tabs follow the standardized **state → useEffect → applyUpdate** pattern
- Tabs update state via `updateState()` - CharacterEdit automatically syncs via useEffect hooks
- Tabs should NOT call `resolution.applyUpdate()` directly
- This pattern ensures consistency, maintainability, and automatic sync

**Spell Operations Integration**:
- `SpellSelectionTab` uses `resolution.refreshState()` after spell operations
- Spell operations (`addSpellKnown`/`removeSpellKnown`) update the database directly
- Backend automatically updates resolution session if one exists
- Frontend refreshes resolution state separately using `refreshState()`
- Response schemas do NOT include `resolvedCharacter` - follows standardized pattern

**Source Files**:
- `apps/frontend/src/services/api/CharacterResolutionApi.ts`
- `apps/frontend/src/features/character/useCharacterResolution.ts`
- `apps/frontend/src/features/character/tabs/SpellSelectionTab.tsx`

## 📊 **Data Flow**

### **Session Initialization Flow**

1. Frontend calls `POST /session` with character ID
2. Backend loads character, race, and class data
3. Backend performs initial resolution (base features only)
4. Backend extracts user choices from character feature choices
5. Backend performs full resolution with user choices
6. Backend creates session in Redis
7. Backend returns `ResolvedCharacterResult` with `sessionId`

### **Session Update Flow**

1. Frontend calls `PATCH /session/:sessionId` with `CharacterUpdate`
2. Backend loads session from Redis
3. Backend applies update to `CharacterEditState`
4. Backend re-resolves features with updated state
5. Backend updates session in Redis
6. Backend returns updated `ResolvedCharacterResult`

### **Spell Operation Flow**

Spell add/remove operations integrate with the resolution session system to maintain consistency:

**Add Spell Flow**:
1. Frontend calls `POST /characters/spell-selection/add` with spell details and `isFreeGrant` flag
2. Backend validates the request:
   - Verifies advancement belongs to character and class
   - Validates spell is available for the class via `SpellLevelMap`
   - Validates spell level is castable at advancement level (for both free grants and ad-hoc)
   - If `isFreeGrant: true`, validates quantity limit using resolved progressions:
     - Fetches character and resolved progressions (from session if available, otherwise resolves on-demand)
     - Calculates available free spells using `ResolvedFeatureService.getAvailableSpellbookSpells()`
     - Counts existing free grants for the advancement
     - Throws error if limit reached
3. Backend updates database (adds spell to `AdvancementSpell` with `isFreeGrant` flag)
4. Backend checks for active resolution session
5. If session exists:
   - Backend rebuilds complete `CharacterEditState` from updated character
   - Backend re-resolves character features with updated character state
   - Backend updates session with new resolved result and character state
   - Backend does NOT return `ResolvedCharacterResult` in response (follows standardized pattern)
6. Backend calculates and includes spell counts in response:
   - `freeSpellsUsed` - Total free grants used (if spellbook class)
   - `availableFreeSpells` - Total available free spells
   - `remainingFreeSpells` - Remaining free spells
7. Frontend receives response with spell counts (no `resolvedCharacter` field)
8. Frontend performs optimistic cache updates:
   - Updates spell data cache (`isKnown: true`)
   - Updates character cache (`advancements[].spellsKnown` array)
9. Frontend calls `resolution.refreshState()` to refresh resolution state from server
10. CharacterEdit re-renders with fresh resolved data

**Remove Spell Flow**:
1. Frontend calls `POST /characters/spell-selection/remove` with spell ID and advancement ID
2. Backend validates the request:
   - Verifies spell exists in `AdvancementSpell` for the character
   - Verifies advancement belongs to character
   - Checks if removed spell was a free grant (for count updates)
3. Backend updates database (removes spell from `AdvancementSpell`)
4. Backend checks for active resolution session
5. If session exists:
   - Backend rebuilds complete `CharacterEditState` from updated character
   - Backend re-resolves character features with updated character state
   - Backend updates session with new resolved result and character state
   - Backend does NOT return `ResolvedCharacterResult` in response (follows standardized pattern)
6. Backend calculates and includes updated spell counts in response (if removed spell was a free grant)
7. Frontend receives response with updated spell counts (no `resolvedCharacter` field)
8. Frontend performs optimistic cache updates:
   - Updates spell data cache (`isKnown: false`)
   - Updates character cache (`advancements[].spellsKnown` array)
9. Frontend calls `resolution.refreshState()` to refresh resolution state from server
10. CharacterEdit re-renders with fresh resolved data

**Key Points**:
- Spell operations are direct database operations that also update the resolution session
- Backend validation uses resolved progressions from session when available, otherwise resolves on-demand
- Backend automatically updates resolution session but does NOT return `resolvedCharacter` in response
- Frontend uses `resolution.refreshState()` to refresh resolution state after operations
- Frontend performs optimistic cache updates for immediate UI feedback
- This follows the standardized pattern: database operations update session, frontend refreshes state separately
- No manual TanStack Query cache manipulation for character details is needed

**Source Files**:
- Backend: `apps/backend/src/features/character/characterService.ts` (`addSpellKnown`, `removeSpellKnown` methods)
- Frontend: `apps/frontend/src/features/character/tabs/SpellSelectionTab.tsx`
- Frontend Hook: `apps/frontend/src/features/character/useCharacterResolution.ts`
- Related Documentation: [Spell Scribing Feature](./spell-scribing.md) - Comprehensive spell scribing documentation

### **Session Resume Flow**

1. Frontend calls `GET /session` with character ID
2. Backend looks up session by character ID and user ID
3. If session exists: Backend returns stored `ResolvedCharacterResult`
4. If no session exists: Backend automatically creates a new session using the same logic as `POST /session` and returns it
5. Frontend always receives a `ResolvedCharacterResult` (never null)

### **Session Save Flow**

1. Frontend calls `POST /session/:sessionId/save`
2. Backend loads session from Redis
3. Backend persists `CharacterEditState` to character record
4. Backend deletes session from Redis
5. Backend returns success

## 🎯 **Design Decisions**

### **Backend-First Resolution**

All complex feature resolution logic is centralized on the backend to ensure:
- Consistency across all clients (web, mobile, etc.)
- Single source of truth for game rules
- Easier testing and validation
- Reduced frontend complexity

### **Redis Session Storage**

Sessions are stored in Redis (not Prisma) for:
- High-performance in-memory storage
- Automatic expiration via Redis TTL
- Scalable across multiple backend instances
- Fast access for session operations
- Sessions survive backend restarts

### **Session Expiration**

Sessions automatically expire after inactivity via Redis TTL to:
- Prevent stale session accumulation
- Free up memory space automatically
- Ensure data freshness
- Configurable expiration time (default: 30 minutes)
- No manual cleanup needed (Redis handles it automatically)

### **Redis TTL**

Redis TTL (Time To Live) is used for:
- Automatic session expiration
- No manual cleanup intervals needed
- Efficient memory management
- Consistent expiration behavior

### **Resolution Phases**

Resolution is performed in phases to:
- Handle dependencies correctly
- Support incremental resolution
- Enable choice identification before user input
- Support cascading feature grants

### **Cascading Resolution**

Cascading resolution uses iterative processing with depth limits to:
- Handle features that grant other features
- Prevent infinite loops
- Detect circular dependencies
- Process all granted features

**Resolution Flow**:

The cascading resolution process follows an iterative pattern:

1. **Entity Processing**: For each feature progression, process all entities using `FeatureEntityHandlers.processFeatureEntity()`
2. **Grant Detection**: Check if entities grant other features (via `EntityProcessingResult.grants`)
3. **Feature Resolution**: For each granted entity, use `ChoiceResolver.resolveChoiceByType()` to resolve the granted feature
4. **Progression Addition**: Add resolved progressions using `ChoiceResolver.addResolvedProgressions()` utility
5. **Iteration**: Process entities in newly added progressions in the next iteration
6. **Termination**: Continue until no new features are granted or maximum depth is reached

**Example Flow**:
- Ranger feature at level 1 grants Track feat (via `EntityType.Other` + `EntityAppliesToType.Feat`)
- Track feat is resolved and added to progressions
- Track feat's entities are processed in the next iteration
- If Track feat grants other features, they are resolved and added
- Process continues until no new features are found

**Depth Limits**:
- Default maximum depth: 10 iterations
- Prevents infinite loops from circular dependencies
- Warning is added if maximum depth is reached

## 🔧 **Extension Points**

### **Adding New Choice Types**

To add support for new choice types:

1. Add case to `ChoiceResolver.resolveGenericChoiceWithResolver()`
2. Implement resolver method in `ChoiceResolver` (e.g., `resolveNewTypeChoice()`)
3. Update `EntityAppliesToType` enum in static data
4. Update frontend choice handling in `ChoicesTab.tsx`

### **Adding New Update Types**

To add new character update types:

1. Add case to `CharacterUpdateSchema` in `packages/shared/schema/src/characterResolution.ts`
2. Add update handler in `characterResolutionController.ts` (`applyUpdateToState()`)
3. Update frontend `CharacterUpdate` type
4. Update `useCharacterResolution` hook if needed

### **Custom Resolution Logic**

To add custom resolution logic:

1. Extend `CharacterResolutionService` with new resolution phase
2. Add phase to `resolveCharacterFeatures()` method
3. Update `ResolutionContext` type if needed
4. Document new resolution phase

### **Session Storage Backend**

To change session storage backend:

1. Implement new storage interface matching `CharacterSessionService` methods
2. Update `CharacterSessionService` to use new backend
3. Update `sessionDatabase.ts` initialization
4. Update documentation

## 📚 **Related Documentation**

- **[Character Management Database Schema](./database-schema.md)** - Character data models
- **[Character Management Backend Implementation](./backend-implementation.md)** - Character service patterns
- **[Spell Scribing Feature](./spell-scribing.md)** - Comprehensive spell scribing documentation
- **[Feature System Documentation](../feature-system/)** - Feature progression models and `EntityAppliesToType.SpellbookSpell`
- **[Class System Documentation](../class-system/)** - Class feature models
- **[Race System Documentation](../race-system/)** - Race feature models
- **[Database Schema Patterns](../application-overview/database-schema.md)** - Common database patterns
- **[Backend Implementation Patterns](../application-overview/backend-implementation.md)** - Common backend patterns

## 🔍 **Implementation Details**

### **Resolution Context**

The `ResolutionContext` type contains all data needed for resolution:

- `character` - Character data with all details
- `targetLevel` - Level to resolve features for
- `advancement` - Advancement data for target level
- `raceDetails` - Race data with features
- `classDetails` - Primary class data with features
- `secondaryClassDetails` - Secondary class data (for gestalt)
- `isGestalt` - Whether character is gestalt multiclass
- `userChoices` - User's feature choices
- `includePendingChoices` - Whether to identify pending choices
- `resolveCascading` - Whether to resolve cascading features
- `maxResolutionDepth` - Maximum cascading resolution depth

**Source File**: `apps/backend/src/features/characterResolution/types.ts`

### **Character Edit State**

The `CharacterEditState` type represents the editable character state:

- `characterId` - Character identifier
- `raceId` - Selected race
- `classId` - Primary class
- `secondaryClassId` - Secondary class (gestalt)
- `isGestalt` - Whether gestalt multiclass
- `level` - Character level
- `abilityScores` - Array of ability scores
- `skillRanks` - Array of skill ranks
- `selectedFeats` - Array of selected feat IDs
- `disallowedSources` - Array of disallowed feature sources
- `featureChoices` - Array of made feature choices

**Source File**: `apps/backend/src/features/characterResolution/types.ts`

### **Resolved Character Result**

The `ResolvedCharacterResult` extends `ResolutionResult` with derived data:

- `resolvedProgressions` - All resolved feature progressions
- `pendingChoices` - Choices requiring user input
- `classSkills` - Array of class skills (for formatter)
- `skillBonuses` - Array of skill bonuses with sources (for formatter)
- `grantedFeats` - Array of granted feat IDs
- `availableFeatsCount` - Count of available feat slots (number)
- `availableFighterBonusFeats` - Count of available fighter bonus feat slots
- `qualifiedFeats` - List of feats the character qualifies for (array of `FeatInQueryResponse`)
- `formattedCharacter` - Formatted character data for display
- `warnings` - Array of warning messages
- `errors` - Array of error messages
- `sessionId` - Unique session identifier

**Feat Data Distinction**:
- `availableFeatsCount` (number): Count of feat slots/choices available to the character. Answers "How many feats can you select?"
- `qualifiedFeats` (array): List of feats the character qualifies for, filtered by prerequisites, proficiencies, owned feats, etc. Answers "Which feats can you select from?"

The `qualifiedFeats` field is computed during resolution using `AvailableFeatService.getQualifiedFeats()`, which filters all feats based on:
- Prerequisites (ability scores, skill ranks, feats, class levels, etc.)
- Already-owned feats (excludes feats the character already has, unless repeatable)
- "All" proficiencies (excludes feats that provide proficiencies the character already has as "all" category)
- Character level and class levels

**Source File**: `apps/backend/src/features/characterResolution/characterSessionService.ts`


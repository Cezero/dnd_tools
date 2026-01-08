# Character Resolution System

*Complete documentation for the character feature resolution system, including backend resolution services, session management, and API endpoints.*

## 📋 **Overview**

The character resolution system is a centralized backend service that handles all character feature resolution logic. It processes base features (race, class), resolves user choices, handles cascading feature grants, and manages persistent editing sessions using SQLite.

**Key Features**:
- Centralized feature resolution logic on the backend
- Persistent session management with SQLite (survives backend restarts)
- RESTful API for session lifecycle management
- Support for gestalt multiclassing
- Cascading feature resolution with depth limits
- Level-based feature filtering

**Source Files**:
- Backend Services: `apps/backend/src/features/characterResolution/`
- Frontend API Client: `apps/frontend/src/services/api/CharacterResolutionApi.ts`
- Frontend Hook: `apps/frontend/src/features/character/useCharacterResolution.ts`
- Session Database: `apps/backend/src/features/characterResolution/sessionDatabase.ts`

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

Service for managing character editing sessions in SQLite.

**Purpose**: Provides persistent session storage using better-sqlite3. Sessions survive backend restarts and automatically expire after inactivity.

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
- Database: SQLite (better-sqlite3)
- Table: `character_edit_sessions`
- Location: `data/sessions.db` (configurable via `SESSION_DATABASE_URL`)
- Expiration: Configurable via `SESSION_EXPIRATION_MINUTES` (default: 30 minutes)

**Source File**: `apps/backend/src/features/characterResolution/characterSessionService.ts`

### **ChoiceResolver**

Backend service for resolving character choices.

**Purpose**: Handles identification of pending choices and resolution of selected choices. Uses backend services instead of frontend fetch calls.

**Key Methods**:
- `identifyPendingChoices()` - Identifies choices requiring user input
- `resolveDomainChoice()` - Resolves domain selection
- `resolveFeatChoice()` - Resolves feat selection
- `resolveFamiliarChoice()` - Resolves familiar selection and converts benefits to progressions
- `resolveAnimalCompanionChoice()` - Resolves animal companion selection
- `resolveSkillChoice()` - Resolves skill selection
- `resolveSpellChoice()` - Resolves spell selection
- `resolveFeatureChoice()` - Resolves feature selection

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

**Source File**: `apps/backend/src/features/characterResolution/cascadingResolver.ts`

## 💾 **Session Database Schema**

The session database uses SQLite with better-sqlite3 (not Prisma). The schema is defined directly in SQL.

### **character_edit_sessions Table**

Stores character editing session state.

**Fields**:
- `id` (TEXT PRIMARY KEY) - Unique session identifier (UUID)
- `character_id` (INTEGER NOT NULL) - Reference to character
- `user_id` (INTEGER NOT NULL) - Reference to user
- `session_key` (TEXT UNIQUE NOT NULL) - Composite key: `characterId:userId`
- `character_state` (TEXT NOT NULL) - JSON-encoded CharacterEditState
- `resolved_result` (TEXT NOT NULL) - JSON-encoded ResolvedCharacterResult
- `created_at` (INTEGER NOT NULL) - Unix timestamp (milliseconds)
- `updated_at` (INTEGER NOT NULL) - Unix timestamp (milliseconds)
- `expires_at` (INTEGER NOT NULL) - Unix timestamp (milliseconds)

**Indexes**:
- `idx_session_key` - Index on `session_key` for fast lookups
- `idx_expires_at` - Index on `expires_at` for cleanup queries
- `idx_character_user` - Composite index on `character_id, user_id`

**Constraints**:
- Unique: `session_key` must be unique (one session per character/user)
- Foreign Keys: None (character_id and user_id are not enforced as foreign keys)

**Database Configuration**:
- WAL Mode: Enabled for better concurrency
- Location: `data/sessions.db` (configurable via `SESSION_DATABASE_URL` environment variable)
- Initialization: Automatic on first access

**Source File**: `apps/backend/src/features/characterResolution/sessionDatabase.ts`

## 🔌 **API Endpoints**

All endpoints are prefixed with `/api/characters/:characterId/resolution/`

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
- `availableFeats` - Count of available feat slots
- `availableFighterBonusFeats` - Count of available fighter bonus feat slots
- `formattedCharacter` - Formatted character data for display
- `warnings` - Array of warning messages
- `errors` - Array of error messages
- `sessionId` - Unique session identifier

**Source File**: `apps/backend/src/features/characterResolution/characterResolutionController.ts` (InitializeSession)

### **GET /session**

Resume an existing resolution session.

**Purpose**: Retrieves an active session for a character, returning the stored resolution result.

**Request**: No body required

**Response**: `ResolvedCharacterResult | null` (null if no active session exists)

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

The resolution system processes feature progressions:

- **Feature Progressions**: Works with `FeatureProgression` objects from the feature system
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

**Source Files**:
- `apps/frontend/src/services/api/CharacterResolutionApi.ts`
- `apps/frontend/src/features/character/useCharacterResolution.ts`

## 📊 **Data Flow**

### **Session Initialization Flow**

1. Frontend calls `POST /session` with character ID
2. Backend loads character, race, and class data
3. Backend performs initial resolution (base features only)
4. Backend extracts user choices from character feature choices
5. Backend performs full resolution with user choices
6. Backend creates session in SQLite
7. Backend returns `ResolvedCharacterResult` with `sessionId`

### **Session Update Flow**

1. Frontend calls `PATCH /session/:sessionId` with `CharacterUpdate`
2. Backend loads session from SQLite
3. Backend applies update to `CharacterEditState`
4. Backend re-resolves features with updated state
5. Backend updates session in SQLite
6. Backend returns updated `ResolvedCharacterResult`

### **Session Resume Flow**

1. Frontend calls `GET /session` with character ID
2. Backend looks up session by character ID and user ID
3. Backend returns stored `ResolvedCharacterResult` or null

### **Session Save Flow**

1. Frontend calls `POST /session/:sessionId/save`
2. Backend loads session from SQLite
3. Backend persists `CharacterEditState` to character record
4. Backend deletes session from SQLite
5. Backend returns success

## 🎯 **Design Decisions**

### **Backend-First Resolution**

All complex feature resolution logic is centralized on the backend to ensure:
- Consistency across all clients (web, mobile, etc.)
- Single source of truth for game rules
- Easier testing and validation
- Reduced frontend complexity

### **SQLite Session Storage**

Sessions are stored in SQLite (not Prisma) for:
- Lightweight, file-based storage
- No additional database dependencies
- Fast local access
- Automatic cleanup capabilities
- Sessions survive backend restarts

### **Session Expiration**

Sessions automatically expire after inactivity to:
- Prevent stale session accumulation
- Free up storage space
- Ensure data freshness
- Configurable expiration time (default: 30 minutes)

### **WAL Mode**

SQLite WAL (Write-Ahead Logging) mode is enabled for:
- Better concurrent read performance
- Non-blocking reads during writes
- Improved multi-user scenarios

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
- **[Feature System Documentation](../feature-system/)** - Feature progression models
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
- `availableFeats` - Count of available feat slots
- `availableFighterBonusFeats` - Count of available fighter bonus feat slots
- `formattedCharacter` - Formatted character data for display
- `warnings` - Array of warning messages
- `errors` - Array of error messages
- `sessionId` - Unique session identifier

**Source File**: `apps/backend/src/features/characterResolution/characterSessionService.ts`


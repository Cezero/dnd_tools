# Race System Frontend Components

*Complete documentation for the race system frontend components, including React components, user interfaces, and interaction patterns.*

## 📋 **Overview**

The race system frontend components provide the user interface for race management, including list views, detailed displays, editing forms, and specialized interfaces for race-specific functionality. The components follow React patterns with TypeScript for type safety.

The frontend implementation follows the shared [Frontend Component Architecture](../application-overview/frontend-components.md) with race-specific business logic and user interface patterns.

**Source Files**: 
- Core Components: `frontend/src/features/race/RaceEdit.tsx`, `frontend/src/features/race/RaceList.tsx`, `frontend/src/features/race/RaceDisplay.tsx`
- Detail Components: `frontend/src/features/race/RaceDetail.tsx`
- API Layer: `frontend/src/features/race/RaceQueryHooks.ts`
- Configuration: `frontend/src/features/race/RaceConfig.ts`
- Tab Components: `frontend/src/features/race/tabs/` (BasicInfoTab.tsx, FeaturesTab.tsx, AbilitiesTab.tsx, LanguagesTab.tsx, DescriptionTab.tsx)
- Tab Types: `frontend/src/features/race/tabs/types.ts`
- Tab Index: `frontend/src/features/race/tabs/index.ts`

## 🏗️ **Component Architecture**

The race system frontend follows the shared [Component Architecture](../application-overview/frontend-components.md#shared-component-architecture) with race-specific implementations:

**Component Structure**: Hierarchical component organization with clear responsibilities
**State Management**: Proper state management using React hooks and context
**Form Handling**: Comprehensive form validation using Zod schemas
**API Integration**: Type-safe API integration with error handling
**User Experience**: Intuitive user interfaces with proper feedback

### **Race-Specific Component Structure**

**RaceList**: Primary component for displaying and managing race collections
**RaceDetail**: Container component for race detail views with navigation (uses TanStack Query for database data)
**RaceDisplay**: Comprehensive race information display component (shows lock status, disables edit when locked)
**RaceEdit**: Main race creation and editing interface with tab-based layout (uses isolated entity state)
**Tab Components**: Specialized components for different aspects of race editing
**RaceQueryHooks**: Canonical API interface for race endpoints (createQueryHooks-based; uses typedApi under the hood)

## 🔧 **Core Components**

### **RaceDetail Component**

Container component for race detail views. Uses TanStack Query to fetch race data from the database, ensuring viewers always see persisted state, not editing state.

**Key Features**:
- **Database Fetching**: Uses `RaceQueryHooks.getRaceById` with TanStack Query
- **Lock Status**: Checks lock status to disable edit button when another user is editing
- **Cache Management**: Automatically benefits from TanStack Query caching and refetching

**Source File**: `frontend/src/features/race/RaceDetail.tsx`

### **RaceDisplay Component**

Comprehensive display component for viewing complete race information. Shows lock status and disables edit button when race is locked by another user.

**Key Features**:
- **Lock Status Display**: Shows "Currently locked by User {userId}" when locked by another user
- **Edit Button Disabled**: Edit button is disabled when locked by another user
- **Database Data**: Always displays data from database (via TanStack Query cache)

**Source File**: `frontend/src/features/race/RaceDisplay.tsx`

### **RaceList Component**

The primary component for displaying and managing race collections. This component follows the shared [List Components](../application-overview/frontend-components.md#list-components) pattern.

**Race-Specific Features**:
- **Race Attributes**: Sortable columns for race attributes (name, size, speed, etc.)
- **Race Filtering**: Filter by race type, edition, size category
- **Race Selection**: Select races for bulk operations or detailed viewing

**User Workflow**:
1. **Browse Races**: View paginated list of available races
2. **Search and Filter**: Use search and filter controls to find specific races
3. **Select Race**: Click on race row to view detailed information
4. **Navigate**: Use pagination to browse through all available races
5. **Bulk Operations**: Select multiple races for comparison or bulk actions

**Source File**: `frontend/src/features/race/RaceList.tsx`

### **RaceDisplay Component**

Comprehensive display component for viewing complete race information. This component follows the shared [Display Components](../application-overview/frontend-components.md#display-components) pattern.

**Race-Specific Features**:
- **Race Information**: Race name, size, and basic characteristics
- **Race Tabs**: Organize data into logical sections (Basic Info, Features, Abilities, etc.)
- **Race Data**: Clear, readable presentation of all race attributes
- **Race Relationships**: Display related features, source information, and character data

**User Workflow**:
1. **View Overview**: See race name, size, and basic information
2. **Navigate Tabs**: Switch between different aspects of race data
3. **Review Details**: Examine specific race attributes and capabilities
4. **Access Related Data**: View features, source information, and character data
5. **Take Actions**: Edit, delete, or navigate to related content

**Source File**: `frontend/src/features/race/RaceDisplay.tsx`

### **RaceEdit Component**

Comprehensive editing interface for creating and modifying races. This component follows the shared [Edit Components](../application-overview/frontend-components.md#edit-components) pattern and uses a **state-based pattern with Redis session storage** for reliable data management.

**Architecture**: The component uses a centralized state management pattern that mirrors the `CharacterEdit` and `ClassEdit` implementations, providing:
- **Single Source of Truth**: All race data managed through `useRaceEditState` hook
- **Backend Session Storage**: Redis session storage for persistent editing sessions
- **Automatic Synchronization**: Frontend state automatically syncs with backend session
- **Context Preservation**: Race ID and context preserved throughout navigation and feature creation
- **Deterministic ID Management**: Backend generates temporary IDs for new entities, eliminating signature matching

**State Management**:
```typescript
// Centralized state hook
const { state, updateState } = useRaceEditState();

// Session management hook
const resolution = useRaceResolution(state.raceId || null);

// State structure
interface RaceEditState {
  // Core race identity
  raceId: number | null;
  name: string;
  editionId: number;
  isVisible: boolean;
  description: string | null;
  sourceBookInfo: SourceMap[] | null;
  
  // Features (id: number for existing, null for new)
  // Note: FeatureProgression is a type alias for FeatureWithRelationsSchema
  featureProgressions: FeatureProgression[];
  
  // UI state
  activeTab: string;
  isFeatureAssocOpen: boolean;
  isProgressionDialogOpen: boolean;
  editingProgression: FeatureProgression | null;
  preSelectedFeature: FeatureProgression | undefined;
}
```

**State Update Pattern**:
All state updates use action-based updates through `updateState`:
```typescript
// Update race name
updateState({ 
  type: RaceEditStateUpdateType.SET_NAME, 
  payload: { name: 'Human' } 
});

// Add feature progression
updateState({ 
  type: RaceEditStateUpdateType.ADD_FEATURE_PROGRESSION, 
  payload: { progression: newProgression } 
});
```

**Session Synchronization**:
The component automatically synchronizes state changes with the backend Redis session:
- **Field Changes**: Individual field changes (name, editionId, etc.) sync via `UPDATE_RACE_FIELD` actions
- **Progression Changes**: Feature progression changes sync via diff-based detection
- **Automatic Sync**: `useEffect` hooks watch state changes and send updates to backend session

**Race-Specific Features**:
- **Race Data Entry**: Forms for entering and modifying race data
- **Race Validation**: Real-time validation with user-friendly error messages
- **Race Complex Data**: Handle complex nested data like features and abilities
- **Race User Guidance**: Guide users through the race creation/editing process
- **Mechanics Management**: All mechanics (size, speed, favored class, level adjustment) managed via feature workflow (no convenience forms)
- **Shared Progressions**: Support for shared feature progressions across multiple races

**User Workflow**:
1. **Enter Basic Info**: Fill in race name, edition, and basic attributes
2. **Add Features**: Configure racial features and their progression via FeaturesTab
3. **Configure Abilities**: Set ability score adjustments and racial bonuses
4. **Set Languages**: Configure racial languages and language options
5. **Add Sources**: Link to source books and page references
6. **Review and Save**: Review all data and save the race (transforms Redis session → MySQL)

**Source Files**: 
- Component: `frontend/src/features/race/RaceEdit.tsx`
- State Hook: `frontend/src/features/race/useRaceEditState.ts`
- Session Hook: `frontend/src/features/race/useRaceResolution.ts`
- Types: `frontend/src/features/race/types.ts`

**Related Documentation**: 
- [State-Based Pattern Architecture](#state-based-pattern-architecture) - Detailed architecture documentation
- [Backend Session Management](../backend-implementation.md#session-management) - Backend session infrastructure

## 📋 **Tab Components**

### **BasicInfoTab Component**

Tab for managing core race attributes and basic information.

**Purpose and Function**:
- **Core Attributes**: Manage fundamental race characteristics
- **Classification**: Set race type, visibility, and edition information
- **Physical Properties**: Configure size, speed, and movement capabilities
- **Validation**: Ensure all required fields are properly filled

**Form Fields** (see [Database Schema](database-schema.md) for field descriptions):
- **Identity Fields**: Name, description with validation
- **Classification**: Edition, visibility settings
- **Physical Properties**: Size, speed, movement capabilities
- **Favored Class**: Set favored class for experience bonuses
- **Description**: Rich text description with markdown support

**Source File**: `frontend/src/features/race/tabs/BasicInfoTab.tsx`

### **FeaturesTab Component**

Tab for managing racial features and feature progression.

**Purpose and Function**:
- **Feature Management**: Add, edit, and remove racial features
- **Feature Progression**: Configure feature progression and scaling
- **Feature Integration**: Integrate with the feature system for complex features
- **Feature Validation**: Ensure feature data is properly configured

**Race-Specific Features**:
- **Feature Selection**: Choose features to add to the race
- **Progression Configuration**: Set level requirements for features
- **Feature Details**: Configure feature modifiers, choices, and effects
- **Feature Integration**: Seamless integration with feature system

**Source File**: `frontend/src/features/race/tabs/FeaturesTab.tsx`

### **AbilitiesTab Component**

Convenience editor for racial ability score adjustments. It does not store adjustments on the race row. It reads and writes `EntityType.Base` + `EntityAppliesToType.Ability` entities on the linked race feature that already holds those entities. Leftover Bonus-type ability rows are ignored. The first non-zero value creates that container feature and links it; setting a value back to zero removes that entity.

**Source File**: `frontend/src/features/race/tabs/AbilitiesTab.tsx`

Write helpers live in `frontend/src/features/race/raceConvenienceFeatures.ts`.

### **LanguagesTab Component**

Convenience editor for automatic and bonus languages. It extracts IDs through `LanguageService`, which only counts `EntityType.Base` language entities. Add/remove updates that same Base container (creating and linking it if the race has none). Leftover Other-type language features remain visible on the Features tab until cleanup, but this tab does not read or write them.

**Source File**: `frontend/src/features/race/tabs/LanguagesTab.tsx`

### **DescriptionTab Component**

Tab for managing race descriptions and lore.

**Purpose and Function**:
- **Description Editing**: Provide markdown editor for race descriptions
- **Preview Support**: Real-time preview of markdown content
- **Validation**: Ensure proper description formatting

**Race-Specific Features**:
- **Markdown Editor**: Rich text editing with markdown support
- **Preview Mode**: Real-time preview of formatted content
- **Validation**: Ensure proper markdown syntax

**Source File**: `frontend/src/features/race/tabs/DescriptionTab.tsx`

## 🔌 **API Integration**

### **RaceQueryHooks**

Query hooks + imperative methods for race system backend communication.

**Purpose**: Provides type-safe API communication for all race operations.

**Key Features**:
- **Type Safety**: Full TypeScript integration with Zod validation
- **Error Handling**: Comprehensive error handling and validation
- **CRUD Operations**: Complete CRUD operations for races
- **Response Validation**: Automatic response validation

**API Endpoints**:
- **GET /api/races**: Retrieve all races
- **GET /api/races/:id**: Retrieve specific race by ID
- **POST /api/races**: Create new race
- **PUT /api/races/:id**: Update existing race
- **DELETE /api/races/:id**: Delete race

**Source File**: `frontend/src/features/race/RaceQueryHooks.ts`

## 🎨 **User Interface Patterns**

### **Tab-Based Organization**

The race editing interface uses tab-based organization to separate concerns:

**Basic Info**: Core race properties and metadata
**Features**: Racial features and abilities
**Abilities**: Ability score adjustments and bonuses
**Languages**: Racial languages and language options
**Description**: Race description and lore

### **Form Validation**

Comprehensive form validation using Zod schemas:

**Real-time Validation**: Validate fields as users type
**Error Display**: Clear, user-friendly error messages
**Field-specific Validation**: Specific validation rules for each field type
**Cross-field Validation**: Validation that depends on multiple fields

### **State Management**

Proper state management for complex race data:

**Form State**: Manage form data and validation state
**Loading States**: Handle loading states for API operations
**Error States**: Manage error states and error messages
**Navigation State**: Handle navigation between tabs and views

## 🏛️ **State-Based Pattern Architecture**

The race editing system uses a **state-based pattern with Redis session storage** that provides reliable data management, context preservation, and deterministic ID handling. This pattern mirrors the `CharacterEdit` and `ClassEdit` implementations.

### **Overview**

The state-based pattern provides:
- **Single Source of Truth**: Centralized state management eliminates prop drilling
- **Context Preservation**: Race ID and context preserved throughout navigation
- **No Orphaned Data**: Automatic linking of new features/progressions to race
- **Deterministic IDs**: Backend generates temporary IDs, eliminating signature matching
- **Persistent Sessions**: Redis session storage for reliable editing sessions
- **Automatic Synchronization**: Frontend state automatically syncs with backend

### **State Management Hooks**

#### **useRaceEditState Hook**

Centralized state management hook that provides a single source of truth for all race editing data.

**Purpose**: Eliminates per-tab state management and provides immutable state updates through action-based updates.

**Source File**: `frontend/src/features/race/useRaceEditState.ts`

**Usage**:
```typescript
const { state, updateState } = useRaceEditState(initialState);

// Update race name
updateState({ 
  type: RaceEditStateUpdateType.SET_NAME, 
  payload: { name: 'Human' } 
});

// Add feature progression
updateState({ 
  type: RaceEditStateUpdateType.ADD_FEATURE_PROGRESSION, 
  payload: { progression: newProgression } 
});
```

**Update Actions**: All state updates use discriminated union pattern with specific action types:
- `SET_RACE_ID`, `SET_NAME`, `SET_EDITION_ID`, `SET_IS_VISIBLE`
- `SET_DESCRIPTION`, `SET_SOURCE_BOOK_INFO`
- `SET_FEATURE_PROGRESSIONS`, `ADD_FEATURE_PROGRESSION`, `UPDATE_FEATURE_PROGRESSION`, `REMOVE_FEATURE_PROGRESSION`
- `SET_ACTIVE_TAB`, `SET_IS_FEATURE_ASSOC_OPEN`, `SET_IS_PROGRESSION_DIALOG_OPEN`
- `SET_EDITING_PROGRESSION`, `SET_PRE_SELECTED_FEATURE`

#### **useRaceResolution Hook**

Hook for managing race editing with user sessions and entity locks.

**Purpose**: Manages race editing lifecycle: start editing, apply updates, save, and cancel.

**Source File**: `frontend/src/features/race/useRaceResolution.ts`

**Usage**:
```typescript
const resolution = useRaceResolution(raceId);

// Start editing (acquires lock, adds to user session)
// Automatically called on mount if raceId is provided

// Apply update to race state
await resolution.applyUpdate({
  type: 'UPDATE_RACE_FIELD',
  payload: { field: 'name', value: 'Human' }
});

// Save race state to database
await resolution.save();

// Cancel editing (releases lock, removes from user session)
await resolution.cancel();
```

**Key Features**:
- **Automatic Initialization**: Starts editing on mount if raceId is provided
- **State Synchronization**: Syncs frontend state changes to backend entity state
- **Lock Management**: Handles lock acquisition and release automatically
- **User Session Integration**: Updates user session editing list automatically
- **Error Handling**: Comprehensive error handling and loading states
- **State Isolation**: Editing state is isolated per user. Changes are NOT shared via WebSocket.
- **Cache Invalidation**: After saving, invalidates TanStack Query cache so viewers see updated data.

**Return Value**:
```typescript
{
  raceState: RaceEditState | null;  // Current race state
  isLoading: boolean;               // Loading state
  error: string | null;              // Error state
  applyUpdate: (update: RaceUpdate) => Promise<void>;
  save: () => Promise<void>;
  cancel: () => Promise<void>;
  refreshState: () => Promise<void>;
}
```

### **Session Synchronization**

The component automatically synchronizes state changes with the backend Redis session through `useEffect` hooks, similar to the class system. See [Class System State-Based Pattern](../class-system/frontend-components.md#state-based-pattern-architecture) for detailed synchronization patterns.

### **ID Management**

The system uses backend-managed IDs for all new entities, identical to the class system. See [Class System ID Management](../class-system/frontend-components.md#id-management) for details.

### **Mechanics Management**

All race mechanics (size, speed, favored class, level adjustment) are managed through the feature management workflow:

**No Convenience Forms**: Removed convenience form fields for mechanics
**Feature-Based**: All mechanics are `FeatureEntity` records with `EntityType.Base`
**Shared Progressions**: Progressions can be shared across multiple races
**Workflow**: Admins manage mechanics through FeaturesTab, same as other features

**Rationale**:
- Simplifies the model (no need to determine if progression exists vs. creating new)
- Enables shared progressions (e.g., "Medium size" shared across races)
- Admins are already familiar with feature management workflow
- Consistent with overall architecture (all mechanics flow through feature system)

### **Context Preservation**

The state-based pattern ensures context is preserved throughout the editing session:

**Race ID**: Always available in `state.raceId`
**Feature Creation**: When creating new features, race ID is automatically linked
**Modal Navigation**: FeatureEditForm uses modal mode, keeping user in RaceEdit context
**No Orphaned Data**: New progressions automatically linked to race from state

**Source Files**:
- State Hook: `frontend/src/features/race/useRaceEditState.ts`
- Session Hook: `frontend/src/features/race/useRaceResolution.ts`
- API Client: `frontend/src/services/api/RaceResolutionApi.ts`
- Types: `frontend/src/features/race/types.ts`, `packages/shared/schema/src/race.ts`

**Related Documentation**: 
- [Backend Session Management](../backend-implementation.md#session-management) - Backend session infrastructure
- [Class System State-Based Pattern](../class-system/frontend-components.md#state-based-pattern-architecture) - Reference implementation

## 🔗 **Integration Patterns**

### **Feature System Integration**

The race system integrates with the feature system through the FeaturesTab:

**Feature Selection**: Choose features to add to races
**Feature Configuration**: Configure feature progression and details
**Feature Validation**: Ensure proper feature configuration
**Feature Display**: Show feature information and requirements

**Related Documentation**: [Feature System Frontend Components](../feature-system/frontend-components.md)

### **Ability System Integration**

The race system integrates with the ability system through the AbilitiesTab:

**Ability Adjustments**: The Abilities tab edits `EntityType.Base` ability entities on the race-linked container feature. See [Ability Adjustment System](architecture-principles.md#6-ability-adjustment-system).

### **Language System Integration**

The Languages tab and `LanguageService` treat only `EntityType.Base` automatic/bonus language entities as canonical. Character language selection uses the same service. See [Language Implementation](../feature-system/languages.md).

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Race system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Race system validation rules and schemas
- **[Static Data](static-data.md)** - Race system enums and types
- **[Backend Implementation](backend-implementation.md)** - Race system backend implementation
- **[Feature System Frontend Components](../feature-system/frontend-components.md)** - Feature system integration
- **[Language Implementation](../feature-system/languages.md)** - Automatic and bonus languages as feature entities
- **[Frontend Component Patterns](../application-overview/frontend-components.md)** - Shared frontend patterns and conventions

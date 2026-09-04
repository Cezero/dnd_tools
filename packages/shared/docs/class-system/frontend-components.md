# Class System Frontend Components

*Complete documentation for the class system frontend components, including React components, user interfaces, and interaction patterns.*

## 📋 **Overview**

The class system frontend components provide the user interface for class management, including list views, detailed displays, editing forms, and specialized interfaces for class-specific functionality. The components follow React patterns with TypeScript for type safety.

The frontend implementation follows the shared [Frontend Component Architecture](../application-overview/frontend-components.md#shared-component-architecture) with class-specific business logic and user interface patterns.

**Viewing vs Editing Architecture**:
- **Viewing**: Components use TanStack Query to fetch class data from the database. This ensures viewers always see persisted database state, not editing state.
- **Editing**: Components use isolated entity state (Redis) that is flushed to the database on save. Editing state is NOT shared between users via WebSocket.
- **Lock Status**: Viewing components check lock status to disable edit buttons when another user is editing.
- **Cache Invalidation**: After saving, TanStack Query cache is invalidated so viewers see updated data.

**Source Files**: 
- Core Components: `frontend/src/features/class/ClassEdit.tsx`, `frontend/src/features/class/ClassList.tsx`, `frontend/src/features/class/ClassDisplay.tsx`
- Detail Components: `frontend/src/features/class/ClassDetail.tsx`
- API Layer: `frontend/src/features/class/ClassQueryHooks.ts`
- Configuration: `frontend/src/features/class/ClassConfig.ts`
- Tab Components: `frontend/src/features/class/tabs/` (BasicInfoTab.tsx, FeaturesTab.tsx, SkillsTab.tsx, ProficienciesTab.tsx, DescriptionTab.tsx)
- Tab Types: `frontend/src/features/class/tabs/types.ts`
- Tab Index: `frontend/src/features/class/tabs/index.ts`

## 🏗️ **Component Architecture**

The class system frontend follows the shared [Component Architecture](../application-overview/frontend-components.md#shared-component-architecture) with class-specific implementations:

**Component Structure**: Hierarchical component organization with clear responsibilities
**State Management**: Proper state management using React hooks and context
**Form Handling**: Comprehensive form validation using Zod schemas
**API Integration**: Type-safe API integration with error handling
**User Experience**: Intuitive user interfaces with proper feedback

### **Class-Specific Component Structure**

**ClassList**: Primary component for displaying and managing class collections
**ClassDetail**: Container component for class detail views with navigation (uses TanStack Query for database data)
**ClassDisplay**: Comprehensive class information display component (shows lock status, disables edit when locked)
**ClassEdit**: Main class creation and editing interface with tab-based layout (uses isolated entity state)
**Tab Components**: Specialized components for different aspects of class editing
**ClassQueryHooks**: Canonical API interface for class endpoints (createQueryHooks-based; uses typedApi under the hood)

## 🔧 **Core Components**

### **ClassDetail Component**

Container component for class detail views. Uses TanStack Query to fetch class data from the database, ensuring viewers always see persisted state, not editing state.

**Key Features**:
- **Database Fetching**: Uses `ClassQueryHooks.getClassById` and `getClassFeatures` with TanStack Query
- **Lock Status**: Checks lock status to disable edit button when another user is editing
- **Cache Management**: Automatically benefits from TanStack Query caching and refetching
- **Loading gate**: Waits only for the class and features queries. Entity-name precache runs in the background and does not block the page.

**Source File**: `frontend/src/features/class/ClassDetail.tsx`

### **ClassDisplay Component**

Comprehensive display component for viewing complete class information. Shows lock status and disables edit button when class is locked by another user.

**Key Features**:
- **Lock Status Display**: Shows "Currently locked by User {userId}" when locked by another user
- **Edit Button Disabled**: Edit button is disabled when locked by another user
- **Database Data**: Always displays data from database (via TanStack Query cache)
- **Class progression grid**: BAB, saves, spells per day, and spells known come from feature formulas via `buildClassProgressionFromDetail(features, classId)`. See [Class Progression](class-progression.md#display-strategy-and-formatters).

**Source File**: `frontend/src/features/class/ClassDisplay.tsx`

### **ClassList Component**

The primary component for displaying and managing class collections. This component follows the shared [List Components](../application-overview/frontend-components.md#list-components) pattern.

**Props Interface**:
```typescript
interface ClassListProps {
  editionId?: number;
  isPrestige?: boolean;
  canCastSpells?: boolean;
  onClassSelect?: (classId: number) => void;
  onClassEdit?: (classId: number) => void;
  onClassDelete?: (classId: number) => void;
  selectionMode?: 'single' | 'multiple' | 'none';
  showFilters?: boolean;
  showActions?: boolean;
}
```

**State Management**:
```typescript
const [classes, setClasses] = useState<ClassWithSource[]>([]);
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);
const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
const [filters, setFilters] = useState<ClassFilters>({});
```

**Class-Specific Features**:
- **Class Attributes**: Sortable columns for class attributes (name, abbreviation, type, etc.) using [GenericList component](../application-overview/generic-list.md)
- **Class Filtering**: Filter by class type, edition, spellcasting capability through GenericList filter system
- **Class Selection**: Select classes for bulk operations or detailed viewing with GenericList selection mode
- **Column Configuration**: Custom column definitions defined in [ClassColumns.ts](../../../apps/frontend/src/features/class/ClassColumns.ts)

**Usage Example**:
```tsx
<ClassList 
  editionId={5}
  isPrestige={false}
  onClassSelect={(id) => navigate(`/classes/${id}`)}
  onClassEdit={(id) => navigate(`/classes/${id}/edit`)}
  selectionMode="single"
  showFilters={true}
/>
```

**User Workflow**:
1. **Browse Classes**: View paginated list of available classes
2. **Search and Filter**: Use search and filter controls to find specific classes
3. **Select Class**: Click on class row to view detailed information
4. **Navigate**: Use pagination to browse through all available classes
5. **Bulk Operations**: Select multiple classes for comparison or bulk actions

**Why ClassList uses getClasses, not classes-cache**: ClassList uses `getClasses` (`/classes/query`), which returns ClassSummary (including `description`, `sourceBookInfo`). The classes-cache (ClassCacheSchema) intentionally omits `description` and `sourceBookInfo` to keep the cache small; ClassList's Description and Source columns require those fields. Using classes-cache would require either dropping those columns or expanding the cache; we do not expand the cache by design.

**Source File**: [ClassList.tsx](../../../apps/frontend/src/features/class/ClassList.tsx) - Uses GenericList for both class and feature list management

### **ClassDisplay Component**

Comprehensive display component for viewing complete class information. This component follows the shared [Display Components](../application-overview/frontend-components.md#display-components) pattern.

**Class-Specific Features**:
- **Class Information**: Class name, abbreviation, and basic classification
- **Class Tabs**: Organize data into logical sections (Basic Info, Skills, Features, etc.)
- **Class Data**: Clear, readable presentation of all class attributes
- **Class Relationships**: Display related features, spellcasting, and source information
- **Mechanics vs. Features Separation**: Pure mechanics containers (features whose entities are exclusively `EntityType.Base`, such as shared BAB/save/skill-point progressions and spellcasting progression holders) are used to drive the header summary and progression grid but are intentionally **excluded** from the **Class Features** list. The features list focuses on narrative/ability text and any feature that has no entities or at least one non-Base entity.

**User Workflow**:
1. **View Overview**: See class name, type, and basic information
2. **Navigate Tabs**: Switch between different aspects of class data
3. **Review Details**: Examine specific class attributes and capabilities
4. **Access Related Data**: View features, spellcasting, and source information
5. **Take Actions**: Edit, delete, or navigate to related content

**Source File**: `frontend/src/features/class/ClassDisplay.tsx`

### **ClassEdit Component**

Comprehensive editing interface for creating and modifying classes. This component follows the shared [Edit Components](../application-overview/frontend-components.md#edit-components) pattern and uses a **state-based pattern with Redis session storage** for reliable data management.

**Architecture**: The component uses a centralized state management pattern that mirrors the `CharacterEdit` implementation, providing:
- **Single Source of Truth**: All class data managed through `useClassEditState` hook
- **Backend Session Storage**: Redis session storage for persistent editing sessions
- **Automatic Synchronization**: Frontend state automatically syncs with backend session
- **Context Preservation**: Class ID and context preserved throughout navigation and feature creation
- **Deterministic ID Management**: Backend generates temporary IDs for new entities, eliminating signature matching

**State Management**:
```typescript
// Centralized state hook
const { state, updateState } = useClassEditState();

// Session management hook
const resolution = useClassResolution(state.classId || null);

// State structure
interface ClassEditState {
  // Core class identity
  classId: number | null;
  name: string;
  abbreviation: string;
  editionId: number;
  isPrestige: boolean;
  isVisible: boolean;
  canCastSpells: boolean;
  spellsKnown: boolean;
  isDivine: boolean;
  description: string | null;
  
  // Features (id: number for existing, null for new)
  // Note: FeatureProgression is a type alias for FeatureWithRelationsSchema
  featureProgressions: FeatureProgression[];
  
  // Spellcasting progressions
  spellcastingProgression: SpellcastingProgressionWithSlots[];
  spellsKnownProgression: SpellcastingProgressionWithSlots[];
  
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
// Update class name
updateState({ 
  type: ClassEditStateUpdateType.SET_NAME, 
  payload: { name: 'Fighter' } 
});

// Add feature progression
updateState({ 
  type: ClassEditStateUpdateType.ADD_FEATURE_PROGRESSION, 
  payload: { progression: newProgression } 
});

// Update feature progression
updateState({ 
  type: ClassEditStateUpdateType.UPDATE_FEATURE_PROGRESSION, 
  payload: { featureId: 123, progression: { level: 5 } } 
});
```

**Session Synchronization**:
The component automatically synchronizes state changes with the backend Redis session:
- **Field Changes**: Individual field changes (name, abbreviation, etc.) sync via `UPDATE_CLASS_FIELD` actions
- **Progression Changes**: Feature progression changes sync via diff-based detection
- **Spellcasting Changes**: Spellcasting progression changes sync automatically
- **Automatic Sync**: `useEffect` hooks watch state changes and send updates to backend session

**Class-Specific Features**:
- **Class Data Entry**: Forms for entering and modifying class data
- **Class Validation**: Real-time validation with user-friendly error messages
- **Class Complex Data**: Handle complex nested data like features and spellcasting
- **Class User Guidance**: Guide users through the class creation/editing process
- **Mechanics Management**: All mechanics (BAB, saves, hit die, skill points) managed via feature workflow (no convenience forms)
- **Shared Progressions**: Support for shared feature progressions across multiple classes

**User Workflow**:
1. **Enter Basic Info**: Fill in class name, abbreviation, and basic attributes
2. **Add Features**: Configure class features and their progression via FeaturesTab
3. **Set Spellcasting**: Configure spellcasting capabilities and progression
4. **Add Sources**: Link to source books and page references
5. **Review and Save**: Review all data and save the class (transforms Redis session → MySQL)

**Source Files**: 
- Component: `frontend/src/features/class/ClassEdit.tsx`
- State Hook: `frontend/src/features/class/useClassEditState.ts`
- Session Hook: `frontend/src/features/class/useClassResolution.ts`
- Types: `frontend/src/features/class/types.ts`

**Related Documentation**: 
- [State-Based Pattern Architecture](#state-based-pattern-architecture) - Detailed architecture documentation
- [Backend Session Management](../backend-implementation.md#session-management) - Backend session infrastructure

## 📋 **Tab Components**

### **BasicInfoTab Component**

Tab for managing core class attributes and basic information.

**Props Interface**:
```typescript
interface BasicInfoTabProps {
  classData: ClassWithDetails;
  onChange: (field: string, value: any) => void;
  errors: ValidationErrors;
  readonly?: boolean;
}
```

**State Management**:
```typescript
const [formData, setFormData] = useState<BasicClassInfo>(classData);
const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
const [isDirty, setIsDirty] = useState<boolean>(false);
```

**Purpose and Function**:
- **Core Attributes**: Manage fundamental class characteristics
- **Classification**: Set class type, visibility, and edition information
- **Spellcasting Flag**: Toggle `canCastSpells` (and related divine caster flag)
- **Class Features Preview**: Show a read-only PHB-style progression table (BAB, saves, spells) above Source References
- **Source References**: Edit source book attributions
- **Validation**: Ensure all required fields are properly filled

**Form Fields** (see [Database Schema](database-schema.md) for field descriptions):
- **Identity Fields**: Name, abbreviation with validation
- **Classification**: Edition, prestige status, visibility settings
- **Spellcasting Configuration**: High-level `canCastSpells` / divine caster flags (casting ability, casting type, and progressions live on Features)
- **Class Features Preview**: Shared progression table with Class Detail (see below)
- **Source References**: Source book info via `SourceEditor`

**Source File**: `frontend/src/features/class/tabs/BasicInfoTab.tsx`

### **FeaturesTab Component**

Tab for managing class features and feature progression.

**Purpose and Function**:
- **Feature Management**: Add, edit, and remove class features
- **Feature Progression**: Configure feature progression and scaling
- **Feature Integration**: Integrate with the feature system for complex features
- **Feature Validation**: Ensure feature data is properly configured

**Class-Specific Features**:
- **Feature Selection**: Choose features to add to the class
- **Progression Configuration**: Set level requirements for features
- **Feature Details**: Configure feature modifiers, choices, and effects
- **Feature Integration**: Seamless integration with feature system

**Source File**: `frontend/src/features/class/tabs/FeaturesTab.tsx`

### **SkillsTab Component**

Tab for managing class skills and skill point allocation.

**Purpose and Function**:
- **Class Skills**: Configure which skills are class skills
- **Skill Points**: Set skill points per level
- **Skill Integration**: Integrate with the skill system
- **Skill Validation**: Ensure proper skill configuration

**Class-Specific Features**:
- **Class Skill Selection**: Choose which skills are class skills
- **Skill Point Configuration**: Set skill points per level
- **Skill Integration**: Integrate with skill system for validation
- **Skill Display**: Show skill information and requirements

**Source File**: `frontend/src/features/class/tabs/SkillsTab.tsx`

### **ProficienciesTab Component**

Tab for managing class weapon and armor proficiencies.

**Purpose and Function**:
- **Weapon Proficiencies**: Configure weapon proficiencies
- **Armor Proficiencies**: Configure armor and shield proficiencies
- **Proficiency Integration**: Integrate with the proficiency system
- **Proficiency Validation**: Ensure proper proficiency configuration

**Class-Specific Features**:
- **Weapon Proficiency Selection**: Choose weapon proficiencies
- **Armor Proficiency Selection**: Choose armor and shield proficiencies
- **Proficiency Integration**: Integrate with proficiency system for validation
- **Proficiency Display**: Show proficiency information and requirements

**Source File**: `frontend/src/features/class/tabs/ProficienciesTab.tsx`

### **Class Features Preview in BasicInfoTab**

Class mechanics (BAB, saves, and spellcasting) are surfaced in the **Basic Info** tab via a read-only **Class Features Preview**, placed above the Source References block.

**Purpose and Function**:
- **Class Features Preview**: Show the final PHB-style progression table (Level, BAB, Fort/Ref/Will, Spells per Day, Spells Known) while editing a class.
- **Unified Formatting**: Reuse the same progression builder and table as the detail view so authors see exactly what the Class Detail page will render.
- **Feature Integration**: Progressions are configured on Features; Basic Info only previews them.

**Class-Specific Features**:
- **Visibility**: Shown when `canCastSpells` is true or the class has spellcasting FeatureEntities (`EntityAppliesToType.SpellcastingProgression` or `SpellsKnownProgression` with formula params).
- **Spellcasting Flags**: `canCastSpells` remains the high-level casting flag. `Class.spellsKnown` still distinguishes SpellsKnown UI (Learn/Forget) from spellbook/prepared flows; per-level known caps come from `SpellsKnownProgression` FeatureEntities, not from legacy table fields at runtime.
- **Casting Ability & Type via Features**: The primary casting ability and casting type are derived from the class's spellcasting feature using `FeatureEntity` records:
  - `EntityAppliesToType.CastingAbility` → `appliesToId` points to the ability (e.g., Intelligence, Wisdom, Charisma).
  - `EntityAppliesToType.CastingType` → `appliesToId` points to the casting chassis (prepared, spontaneous, etc.).
  - The `ClassDisplay` header scans all class-linked features for these entities and shows the first configured values.
- **Spell Progression**: Spells-per-day uses `SpellcastingProgression` entities; spells-known uses `SpellsKnownProgression` entities (see [Feature System Frontend Components](../feature-system/frontend-components.md#spellcasting-features)).
- **Progression Table**: Read-only PHB-style table (levels 1–20, BAB/saves, **Spells per Day**, **Spells Known**) built from feature formulas via `buildClassProgressionFromDetail(features, classId)` and rendered with `ClassProgressionTable`; see [Class Progression](class-progression.md#display-strategy-and-formatters).

**Source File**: `frontend/src/features/class/tabs/BasicInfoTab.tsx`

### **DescriptionTab Component**

Tab for managing class descriptions and lore.

**Purpose and Function**:
- **Description Editing**: Provide markdown editor for class descriptions
- **Preview Support**: Real-time preview of markdown content
- **Validation**: Ensure proper description formatting

**Class-Specific Features**:
- **Markdown Editor**: Rich text editing with markdown support
- **Preview Mode**: Real-time preview of formatted content
- **Validation**: Ensure proper markdown syntax

**Source File**: `frontend/src/features/class/tabs/DescriptionTab.tsx`

## 🔌 **API Integration**

### **ClassQueryHooks**

Query hooks + imperative methods for class system backend communication.

**Purpose**: Provides type-safe API communication for all class operations.

**Key Features**:
- **Type Safety**: Full TypeScript integration with Zod validation
- **Error Handling**: Comprehensive error handling and validation
- **CRUD Operations**: Complete CRUD operations for classes
- **Response Validation**: Automatic response validation

**API Endpoints**:
- **GET /api/classes**: Retrieve all classes
- **GET /api/classes/:id**: Retrieve specific class by ID
- **POST /api/classes**: Create new class
- **PUT /api/classes/:id**: Update existing class
- **DELETE /api/classes/:id**: Delete class

**Source File**: `frontend/src/features/class/ClassQueryHooks.ts`

## 🎨 **User Interface Patterns**

### **Tab-Based Organization**

The class editing interface uses tab-based organization to separate concerns:

**Basic Info**: Core class properties, metadata, Class Features Preview, and source references
**Features**: Class features and abilities
**Skills**: Class skills and skill point allocation
**Proficiencies**: Weapon and armor proficiencies
**Description**: Class description and lore

### **Form Validation**

Comprehensive form validation using Zod schemas:

**Real-time Validation**: Validate fields as users type
**Error Display**: Clear, user-friendly error messages
**Field-specific Validation**: Specific validation rules for each field type
**Cross-field Validation**: Validation that depends on multiple fields

### **State Management**

Proper state management for complex class data:

**Form State**: Manage form data and validation state
**Loading States**: Handle loading states for API operations
**Error States**: Manage error states and error messages
**Navigation State**: Handle navigation between tabs and views

## 🏛️ **State-Based Pattern Architecture**

The class editing system uses a **state-based pattern with Redis session storage** that provides reliable data management, context preservation, and deterministic ID handling. This pattern mirrors the `CharacterEdit` implementation and solves several architectural challenges.

### **Overview**

The state-based pattern provides:
- **Single Source of Truth**: Centralized state management eliminates prop drilling
- **Context Preservation**: Class ID and context preserved throughout navigation
- **No Orphaned Data**: Automatic linking of new features/progressions to class
- **Deterministic IDs**: Backend generates temporary IDs, eliminating signature matching
- **Persistent Sessions**: Redis session storage for reliable editing sessions
- **Automatic Synchronization**: Frontend state automatically syncs with backend

### **State Management Hooks**

#### **useClassEditState Hook**

Centralized state management hook that provides a single source of truth for all class editing data.

**Purpose**: Eliminates per-tab state management and provides immutable state updates through action-based updates.

**Source File**: `frontend/src/features/class/useClassEditState.ts`

**Usage**:
```typescript
const { state, updateState } = useClassEditState(initialState);

// Update class name
updateState({ 
  type: ClassEditStateUpdateType.SET_NAME, 
  payload: { name: 'Fighter' } 
});

// Add feature progression
updateState({ 
  type: ClassEditStateUpdateType.ADD_FEATURE_PROGRESSION, 
  payload: { progression: newProgression } 
});
```

**State Structure**: See [ClassEditState Type Definition](#classeditstate-type-definition)

**Update Actions**: All state updates use discriminated union pattern with specific action types:
- `SET_CLASS_ID`, `SET_NAME`, `SET_ABBREVIATION`, `SET_EDITION_ID`
- `SET_FEATURE_PROGRESSIONS`, `ADD_FEATURE_PROGRESSION`, `UPDATE_FEATURE_PROGRESSION`, `REMOVE_FEATURE_PROGRESSION`
- `SET_SPELLCASTING_PROGRESSION`, `SET_SPELLS_KNOWN_PROGRESSION`
- `SET_ACTIVE_TAB`, `SET_IS_FEATURE_ASSOC_OPEN`, `SET_IS_PROGRESSION_DIALOG_OPEN`
- `SET_EDITING_PROGRESSION`, `SET_PRE_SELECTED_FEATURE`

#### **useClassResolution Hook**

Hook for managing class editing using user sessions and entity state.

**Purpose**: Manages class editing lifecycle: start editing, apply updates, save, and cancel.

**Source File**: `frontend/src/features/class/useClassResolution.ts`

**Usage**:
```typescript
const resolution = useClassResolution(classId);

// Start editing (acquires lock, adds to user session)
// Automatically called on mount when classId is available

// Apply update to class state
await resolution.applyUpdate({
  type: 'UPDATE_CLASS_FIELD',
  payload: { field: 'name', value: 'Fighter' }
});

// Save class state to database
await resolution.save();

// Cancel editing (releases lock, removes from user session)
await resolution.cancel();
```

**Key Features**:
- **Automatic Initialization**: Starts editing on mount when classId is available
- **State Synchronization**: Syncs frontend state changes to backend entity state
- **Save Transformation**: Transforms Redis state → MySQL on save
- **Error Handling**: Comprehensive error handling and loading states
- **No SessionId**: Uses user sessions instead of entity-specific session IDs

**Return Value**:
```typescript
{
  classState: ClassEditState | null;  // Current class state
  isLoading: boolean;                  // Loading state
  error: string | null;                // Error state
  applyUpdate: (update: ClassUpdate) => Promise<void>;
  save: () => Promise<void>;
  cancel: () => Promise<void>;
  refreshState: () => Promise<void>;
}
```

### **State Synchronization**

The component automatically synchronizes state changes with the backend entity state through `useEffect` hooks:

**Field Synchronization**:
```typescript
// Sync individual field changes
useEffect(() => {
  if (!resolution.classState || !hasInitializedRef.current) return;
  
  // Only sync changed fields
  if (prevClassFieldsRef.current.name !== state.name) {
    resolution.applyUpdate({
      type: 'UPDATE_CLASS_FIELD',
      payload: { field: 'name', value: state.name }
    });
  }
}, [state.name, resolution.classState]);
```

**Progression Synchronization**:
```typescript
// Sync feature progression changes (diff-based)
useEffect(() => {
  if (!resolution.classState || !hasInitializedRef.current) return;
  
  // Detect added/removed/updated progressions
  const prevIds = new Set(prevProgressionsRef.current.map(p => p.id));
  const currIds = new Set(state.featureProgressions.map(p => p.id));
  
  // Handle removed progressions
  prevProgressionsRef.current.forEach(prev => {
    if (!currIds.has(prev.id)) {
      resolution.applyUpdate({
        type: 'REMOVE_PROGRESSION',
        payload: { featureId: prev.id }
      });
    }
  });
  
  // Handle added/updated progressions
  state.featureProgressions.forEach(curr => {
    if (!prevIds.has(curr.id)) {
      resolution.applyUpdate({
        type: 'ADD_PROGRESSION',
        payload: { progression: curr }
      });
    } else {
      // Check if progression was updated
      const prev = prevProgressionsRef.current.find(p => p.id === curr.id);
      if (JSON.stringify(prev) !== JSON.stringify(curr)) {
        resolution.applyUpdate({
          type: 'UPDATE_PROGRESSION',
          payload: { featureId: curr.id, progression: curr }
        });
      }
    }
  });
}, [state.featureProgressions, resolution.classState]);
```

### **ID Management**

The system uses backend-managed IDs for all new entities:

**Frontend**: New items have `id: null`, existing items have real database IDs
**Backend**: Redis session generates temporary IDs for new entities
**On Save**: Backend transforms new entities (create in MySQL) and existing entities (update in MySQL)
**After Save**: Frontend receives updated state with real IDs from backend

**Benefits**:
- **No Signature Matching**: Deterministic tracking via temporary IDs
- **No Heuristic Logic**: Backend handles all ID generation
- **Reliable Updates**: Updates happen in place, not delete & recreate

### **Mechanics Management**

All class mechanics (BAB, saves, hit die, skill points) are managed through the feature management workflow:

**No Convenience Forms**: Removed convenience form fields for mechanics
**Feature-Based**: All mechanics are `FeatureEntity` records with `EntityType.Base`
**Shared Progressions**: Progressions can be shared across multiple classes
**Workflow**: Admins manage mechanics through FeaturesTab, same as other features

**Rationale**:
- Simplifies the model (no need to determine if progression exists vs. creating new)
- Enables shared progressions (e.g., "good BAB progression" shared across classes)
- Admins are already familiar with feature management workflow
- Consistent with overall architecture (all mechanics flow through feature system)

### **Context Preservation**

The state-based pattern ensures context is preserved throughout the editing session:

**Class ID**: Always available in `state.classId`
**Feature Creation**: When creating new features, class ID is automatically linked
**Modal Navigation**: FeatureEditForm uses modal mode, keeping user in ClassEdit context
**No Orphaned Data**: New progressions automatically linked to class from state

**Source Files**:
- State Hook: `frontend/src/features/class/useClassEditState.ts`
- Session Hook: `frontend/src/features/class/useClassResolution.ts`
- API Client: `frontend/src/services/api/ClassResolutionApi.ts`
- Types: `frontend/src/features/class/types.ts`, `packages/shared/schema/src/class.ts`

**Related Documentation**: 
- [Backend Session Management](../backend-implementation.md#session-management) - Backend session infrastructure
- [CharacterEdit Pattern](../character-management/frontend-components.md#state-based-pattern) - Reference implementation

## 🔗 **Integration Patterns**

### **Feature System Integration**

The class system integrates with the feature system through the FeaturesTab:

**Feature Selection**: Choose features to add to classes
**Feature Configuration**: Configure feature progression and details
**Feature Validation**: Ensure proper feature configuration
**Feature Display**: Show feature information and requirements

**Related Documentation**: [Feature System Frontend Components](../feature-system/frontend-components.md#integration-patterns)

### **Spellcasting System Integration**

The class system integrates with the spellcasting system through Features and a Basic Info preview:

**Spellcasting Configuration**: High-level `canCastSpells` on Basic Info; casting ability, casting type, and progressions on Features
**Spell Progression**: Spell slot / spells-known FeatureEntities (see Feature System docs)
**Class Features Preview**: Read-only `ClassProgressionTable` on Basic Info, shared with Class Detail
**Spells Known**: Implied by spellcasting FeatureEntities (no separate UI toggle)

**Related Documentation**: [Spellcasting System](spellcasting-system.md), [Feature System Frontend Components](../feature-system/frontend-components.md#spellcasting-features)

### **Skill System Integration**

The class system integrates with the skill system through the SkillsTab:

**Class Skills**: Configure which skills are class skills
**Skill Points**: Set skill points per level
**Skill Validation**: Ensure proper skill configuration
**Skill Display**: Show skill information and requirements

**Related Documentation**: [Skill System Frontend Components](../skill-system/frontend-components.md)

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Class system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Class system validation rules and schemas
- **[Static Data](static-data.md)** - Class system enums and types
- **[Backend Implementation](backend-implementation.md)** - Class system backend implementation
- **[Feature Integration](feature-integration.md)** - Class feature system integration
- **[Spellcasting System](spellcasting-system.md)** - Class spellcasting system integration
- **[Frontend Component Patterns](../application-overview/frontend-components.md#shared-component-architecture)** - Shared frontend patterns and conventions

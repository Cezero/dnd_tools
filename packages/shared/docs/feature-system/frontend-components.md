# Feature System Frontend Components

*Comprehensive documentation of the frontend React components for the feature system, including feature management, progression editing, and user interface components.*

## 📋 **Overview**

The feature system frontend provides a comprehensive set of React components for managing features, feature progressions, and related data. The components support both standalone feature management and integration with class/race/domain/feat editing systems through a reusable component architecture.

The frontend implementation follows the shared [Frontend Component Architecture](../application-overview/frontend-components.md) with feature-specific business logic and user interface patterns. The core architecture centers around **FeatureEditForm**, a reusable component that supports both modal and embedded modes, eliminating the need for page navigation when editing features from different contexts.

**Key Architectural Principles**:
- **Reusable Components**: FeatureEditForm can be used as a modal or embedded component
- **Context Preservation**: Automatic context handling (sourceType, parent IDs) for all parent types
- **Consistent UI**: FeaturesManager provides consistent feature management across all contexts
- **No Page Navigation**: Modal-based editing eliminates unnecessary page navigation
- **Prerequisite Resolution**: Automatic prefetching of prerequisite names for proper display

**Source Files**: 
- Core Components: `frontend/src/components/feature-system/FeatureEdit.tsx`, `frontend/src/components/feature-system/FeatureEditForm/FeatureEditForm.tsx`, `frontend/src/components/feature-system/FeatureDetail.tsx`
- Display Components: `frontend/src/components/feature-system/FeatureDisplay/FeatureDisplay.tsx`
- Management Components: `frontend/src/components/feature-system/FeaturesManager.tsx`
- Utility Components: `frontend/src/components/feature-system/ArrayPairEditor.tsx`
- API Layer: `frontend/src/components/feature-system/FeatureQueryHooks.ts`
- Types: `frontend/src/components/feature-system/types.ts`, `frontend/src/components/feature-system/FeatureEditForm/types.ts`, `frontend/src/components/feature-system/FeatureConfig.ts`
- Index: `frontend/src/components/feature-system/index.ts`

## 🏗️ **Component Architecture**

The feature system frontend follows the shared [Component Architecture](../application-overview/frontend-components.md#shared-component-architecture) with feature-specific implementations:

**Component Structure**: Hierarchical component organization with clear responsibilities
**State Management**: Proper state management using React hooks and context
**Form Handling**: Comprehensive form validation using Zod schemas
**API Integration**: Type-safe API integration with error handling
**User Experience**: Intuitive user interfaces with proper feedback

### **Feature-Specific Component Structure**

**FeatureEditForm**: Reusable feature creation and editing component supporting both modal and embedded modes (uses isolated entity state)
**FeatureEdit**: Full-page feature editor that uses FeatureEditForm in embedded mode
**FeatureDetail**: Feature display and detail view (uses TanStack Query for database data, shows lock status)
**FeatureDisplay**: Component for displaying features with prerequisites and progressions
**FeaturesManager**: Embeddable feature management component for class/race/domain/feat editing contexts
**Feature Entity Editor Components**: `FeatureDetailEdit/*` components used by FeatureEditForm for editing entities, formulas, and conditions
**ArrayPairEditor**: Utility component for editing array-based data
**FeatureQueryHooks**: Canonical API interface for features (createQueryHooks-based, cached via TanStack Query, uses typedApi under the hood)

## 🔧 **Core Components**

### **FeatureEditForm**

The reusable core component for creating and editing features, supporting both modal and embedded modes.

**Purpose**: Provides a comprehensive interface for feature creation and editing that can be used as a modal dialog or embedded component, eliminating the need for page navigation when editing features from different contexts.

**Key Features**:
- **Dual Mode Support**: Operates in both modal and embedded modes via props
- **Context Preservation**: Automatically sets sourceType and parent IDs based on provided context
- **Feature CRUD**: Create, read, update, and delete features
- **Prerequisite Management**: Add and edit feature prerequisites
- **Entity Management**: Add/edit feature entities (including formulas and conditions) via the `FeatureDetailEdit/*` editor components
- **Form Validation**: Comprehensive form validation using Zod schemas
- **Callback-Based**: Uses callbacks instead of navigation for save/cancel operations

**Component Structure**:
- **Modal Mode**: Uses Dialog component for modal display with open/close state management
- **Embedded Mode**: Renders directly in parent component without dialog wrapper
- **Form Sections**: Feature details, prerequisites, progressions
- **Validation**: Real-time validation with error display
- **State Management**: Proper state management for form data and UI state with initialization tracking
- **API Integration**: Feature CRUD and related operations via `FeatureQueryHooks` + `useFeatureResolution`

**Key Props**:
- **featureId**: Feature ID to edit or 'new' for creation
- **isOpen**: Boolean for modal mode open state
- **onClose**: Callback for modal mode close
- **onSave**: Callback when feature is saved with feature and progressions
- **onCancel**: Callback for cancel operation
- **mode**: 'modal' or 'embedded' mode
- **context**: Context object with sourceType, parentId, and parentType
- **initialProgressions**: Initial progressions to display

**Context Handling**:
- Automatically sets FeatureProgression.sourceType from context
- Sets appropriate parent ID (classId, raceId, domainId, or featId) based on parentType
- Preserves context when creating new progressions

**Source File**: `frontend/src/components/feature-system/FeatureEditForm/FeatureEditForm.tsx`

### **FeatureEdit**

Full-page component for feature editing that uses FeatureEditForm in embedded mode.

**Purpose**: Provides a route-based page for direct feature editing, maintaining backward compatibility for direct navigation to feature edit URLs.

**Key Features**:
- **Route-Based**: Accessible via direct URL navigation
- **Embedded Mode**: Uses FeatureEditForm in embedded mode
- **Navigation Handling**: Manages navigation logic for back/cancel buttons
- **Context Passing**: Passes context from location.state when available

**Component Structure**:
- **Wrapper Component**: Wraps FeatureEditForm with page-level navigation logic
- **Context Extraction**: Extracts context from React Router location state
- **Back Navigation**: Handles navigation back to source page or feature list

**Source File**: `frontend/src/components/feature-system/FeatureEdit.tsx`

### **Shared modifier formatting**

To keep numeric modifier display consistent across the frontend (character sheet, class progression tables, PDF views), sign formatting is centralized in the formatter layer:

- **Helper**: `formatSignedModifier(value: number)` in `frontend/src/lib/formatters/modifier-utils.ts`
  - Formats modifiers as `+N` for non-negative values and `-N` for negatives (e.g. `0 → "+0"`, `2 → "+2"`, `-1 → "-1"`).
  - Used by `CharacterSheetDisplayStrategy`, `ClassProgression` helpers, and the PDF renderer instead of hand-written `+`/`-` logic.
- **Pure formatters** (e.g. `LevelAdjustmentFormatter` in `frontend/src/lib/formatters/pure-formatters.ts`) delegate their sign formatting to the same helper so that changing how modifiers are rendered only requires updating it in one place.

### **Base-only mechanics containers**

Some display components (notably `ClassDisplay` and `RaceDisplay`) treat **base-mechanics containers** differently from user-facing feature text. A base-mechanics container is a feature whose entities are **exclusively** `EntityType.Base` (e.g. shared BAB/save/skill-point progressions, racial size/speed/level-adjustment mechanics, spellcasting progression holders). These features:

- Still participate fully in mechanics extraction and progression grids (via `extractClassMechanics` / `extractRaceMechanics` and the display strategy pipeline).
- Are intentionally **omitted** from the **Class Features** and **Racial Features** sections, which focus on descriptive and player-facing abilities.

The helper `isBaseOnlyFeature(feature: FeatureWithRelations)` in `frontend/src/lib/formatters/modifier-utils.ts` centralizes this detection so that UI components can consistently distinguish pure mechanics containers from narrative features.

### **FeatureDetail**

Component for displaying feature details and information.

**Purpose**: Provides a read-only view of feature information, including details, prerequisites, and progressions.

**Key Features**:
- **Feature Display**: Display feature name, description, and metadata
- **Prerequisite Display**: Show feature prerequisites in readable format
- **Progression Display**: Display feature progressions and their effects
- **Navigation**: Links to edit mode and related features

**Component Structure**:
- **Information Display**: Structured display of feature information
- **Prerequisite List**: Formatted list of feature prerequisites
- **Progression List**: List of feature progressions with details
- **Action Buttons**: Edit, delete, and navigation buttons

**Source File**: `frontend/src/components/feature-system/FeatureDetail.tsx`

### **Feature Entity Editor Components (`FeatureDetailEdit/*`)**

FeatureEditForm uses a set of co-located components under `frontend/src/components/feature-system/FeatureDetailEdit/` to edit feature entities.

These components cover:
- entity rows (`EntityDetailForm.tsx`)
- grouping controls (`EntitySectionRenderer.tsx`, `GroupingControls.tsx`, grouping helpers)
- formula editing (`FormulaManager.tsx`, `FormulaPreview.tsx`, `ArrayPairEditor.tsx`)
- conditional requirements (`ConditionEditor.tsx`)

The legacy `FeatureDetailEdit` component entrypoint was removed; these editor components remain as implementation details used by FeatureEditForm. EntityDetailForm exposes **Show in Detail View** (displayInDetail) and **Show Full Progression** (showFullProgression); the latter controls whether progression previews show every level from formula start to 20 or only transition levels.

<a id="spellcasting-features"></a>

**Entities tab – Spellcasting and Spells Known Progression**:

For `EntityType.Base` entities with `EntityAppliesToType.SpellcastingProgression` **or** `EntityAppliesToType.SpellsKnownProgression`, the Entities tab shows the Formula selector and an **Applies To** field. In both cases `appliesToId` is the **spell level** (0–9), not a feature ID; the UI labels it "Spell Level" and provides a dropdown (0th through 9th). The raw Value field is hidden for these combinations (formulas own the scaling).

| Applies-to | Meaning | Class progression column |
|---|---|---|
| `SpellcastingProgression` (38) | Spells per day (slots) at that spell level | Spells per Day |
| `SpellsKnownProgression` (46) | Maximum spells known at that spell level | Spells Known |

Slot and known columns use `CONDITIONAL_SCALING` (thresholds/values = PHB breakpoints). Authoring sources: `AppliesToSelector.tsx`, `FeatureDetailEdit/utils.ts` (formula-required sets for both applies-to values).

### **FeatureDisplay**

Component for displaying features with prerequisites and progressions in a consistent format.

**Purpose**: Provides a standardized display format for features, showing feature information, prerequisites, and progressions with edit capabilities.

**Key Features**:
- **Feature Information**: Displays feature name, slug, and description
- **Prerequisite Display**: Shows formatted prerequisites with proper feat/class name resolution
- **Progression Display**: Displays feature progressions with edit/remove capabilities
- **Edit Integration**: Integrates with FeatureEditForm for editing features
- **Context Awareness**: Supports different parent types (class, race, domain, feat)

**Component Structure**:
- **Feature Header**: Feature name and edit button
- **Prerequisites Section**: Formatted prerequisite display using display strategy system
- **Progressions Section**: List of progressions with edit/remove buttons
- **Add Progression**: Button to add new progressions

**Source File**: `frontend/src/components/feature-system/FeatureDisplay/FeatureDisplay.tsx`

### **FeaturesManager**

Embeddable feature management component for class/race/domain/feat editing contexts.

**Purpose**: Provides a reusable feature management interface that can be embedded in any editing context (class, race, domain, or feat), eliminating the need for page navigation and providing consistent feature management UI.

**Key Features**:
- **Universal Embedding**: Can be embedded in class, race, domain, or feat editing pages
- **Feature List**: Display features associated with parent entity
- **Feature Addition**: Add new features via ListSelectionDialog
- **Feature Editing**: Edit existing features using FeatureEditForm modal
- **Progression Management**: Edit and remove feature progressions
- **Prerequisite Prefetching**: Automatically prefetches prerequisite feat and class names for proper display
- **Context Support**: Supports all parent types (class, race, domain, feat) with proper context handling

**Component Structure**:
- **Feature List**: Grouped and sorted features with FeatureDisplay components
- **Add Feature Button**: Opens ListSelectionDialog for feature selection
- **Feature Display**: Uses FeatureDisplay for each feature with prerequisites and progressions
- **Edit Modal**: FeatureEditForm modal for editing features
- **Entity Editing**: FeatureEditForm uses `FeatureDetailEdit/*` editor components for entities/formulas/conditions

**Key Props**:
- **featureProgressions**: Array of feature progressions to display
- **contextType**: FeatureSourceType for the context
- **contextId**: ID of the parent entity
- **parentType**: Type of parent ('class', 'race', 'domain', 'feat')
- **title**: Title for the feature section
- **emptyMessage**: Message to display when no features exist
- **excludeSpecialFeatures**: Array of feature IDs to exclude from display
- **onEditProgression**: Callback for editing progressions
- **onRemoveProgression**: Callback for removing progressions
- **onAddFeature**: Callback for adding features

**Prerequisite Handling**:
- Automatically prefetches prerequisite feat names into query cache
- Prefetches prerequisite class names for ClassLevel prerequisites
- Forces component re-render after prefetching to ensure proper display
- Uses display strategy system for consistent prerequisite formatting

**Integration Points**:
- **Class System**: Used in class editing tabs via FeaturesTab wrapper
- **Race System**: Used in race editing tabs via FeaturesTab wrapper
- **Domain System**: Embedded directly in DomainEdit page
- **Feat System**: Embedded directly in FeatEdit page

**Source File**: `frontend/src/components/feature-system/FeaturesManager.tsx`

## 🔧 **Utility Components**

### **ArrayPairEditor**

Utility component for editing array-based data with key-value pairs.

**Purpose**: Provides a reusable interface for editing array-based data structures used in feature components.

**Key Features**:
- **Array Management**: Add, edit, and remove array items
- **Key-Value Editing**: Edit key-value pairs with validation
- **Dynamic Sizing**: Dynamic array sizing based on content
- **Validation**: Real-time validation of array items

**Usage**: Used in feature components for editing arrays of feature entities and conditions.

**Source File**: `apps/frontend/src/components/feature-system/ArrayPairEditor.tsx`

### **FeatureQueryHooks**

React Query hooks for fetching and caching feature data from the database.

**Purpose**: Provides imperative and declarative methods for fetching feature data with automatic caching via React Query.

**Key Features**:
- **React Query Integration**: Uses TanStack Query for automatic caching, refetching, and cache invalidation
- **Imperative Usage**: `FeatureQueryHooks.getFeatureById(featureId)` for programmatic fetching
- **Declarative Usage**: Use with `useQuery` hook for reactive data fetching
- **Automatic Cache Management**: React Query handles cache invalidation on mutations
- **Viewing Only**: Use `getFeatureById` for viewing features (fetches from database)
- **Editing**: Use `useFeatureResolution` hook for editing (uses isolated entity state)
  - For **new features**, pass `0` as the feature id; the backend will mint a **negative draft id** during `startEditing`, and the resolution hook will adopt it for all draft operations.
  - See [Entity State Management](../application-overview/entity-state-management.md#new-drafts-minted-negative-ids) for the draft id lifecycle.
  - **Draft update-value API**: When syncing form data to the draft (e.g. in `FeatureEditForm`), the update-value API accepts only **scalar** values (`string | number | boolean | null`). Do not send objects or arrays. For nested data (e.g. `formulaParams`), send **one update per leaf field** (e.g. `entities.byId.<id>.formulaParams.maxValue` with value `4`). See [Session State Management - Backend](../application-overview/session-state-management-backend.md#path-based-updates-update-value-api).

**Canonical Rule (No Duplication)**:
- Do **not** add a separate `typedApi` wrapper for feature endpoints if the same endpoint exists in `FeatureQueryHooks`.\n+- `createQueryHooks` already uses `typedApi` internally, and centralizing on QueryHooks prevents duplicated query key/invalidation logic.

**Source File**: `apps/frontend/src/components/feature-system/FeatureQueryHooks.ts`

## 🎯 **Form Handling**

The feature system follows the shared [Form Handling Patterns](../application-overview/frontend-components.md#form-handling) with feature-specific implementations:

### **Validation Integration**

**Zod Schemas**: All forms use Zod schemas for validation
**Real-time Validation**: Real-time validation with immediate feedback
**Error Display**: Clear error messages with field-specific information
**Form State**: Proper form state management with validation state

### **Complex Form Management**

**Nested Forms**: Complex nested forms for feature progressions
**Dynamic Forms**: Dynamic form generation based on entity types
**Array Forms**: Array-based forms for feature entities and conditions
**Conditional Forms**: Conditional form sections based on user selections

## 🔧 **State Management**

The feature system follows the shared [State Management Patterns](../application-overview/frontend-components.md#state-management) with feature-specific implementations:

### **Component State**

**Local State**: React useState for component-specific state
**Form State**: Form state management with validation
**Loading State**: Loading states for API operations
**Error State**: Error state management and display

### **Complex State Patterns**

**Nested State**: Complex nested state for feature progressions
**Array State**: Array state management for feature entities and conditions
**Conditional State**: Conditional state based on user interactions
**Shared State**: Shared state between related components

## 🎨 **User Experience**

The feature system follows the shared [User Experience Patterns](../application-overview/frontend-components.md#user-experience) with feature-specific implementations:

### **Navigation Patterns**

**Breadcrumb Navigation**: Clear navigation paths through feature management
**Tab Navigation**: Tab-based navigation for complex feature editing
**Modal Navigation**: Modal-based navigation for feature operations
**Context Navigation**: Context-aware navigation based on user location

### **Feedback Patterns**

**Loading Feedback**: Clear loading indicators for API operations
**Success Feedback**: Success messages for completed operations
**Error Feedback**: Clear error messages with actionable information
**Validation Feedback**: Real-time validation feedback

### **Interaction Patterns**

**Progressive Disclosure**: Progressive disclosure of complex feature options
**Inline Editing**: Inline editing for simple feature properties
**Bulk Operations**: Bulk operations for multiple features
**Drag and Drop**: Drag and drop for feature reordering

## 🔗 **Integration Points**

### **Class System Integration**

The feature system integrates with the class system through shared components:

**FeaturesManager**: Embeddable feature management component used in class editing
**FeaturesTab Wrapper**: Tab-specific wrapper component that uses FeaturesManager with class context
**FeatureEditForm Modal**: Modal component for editing features from class context
**Feature Selection**: Feature selection for class features via ListSelectionDialog
**Progression Management**: Feature progression management for classes
**Bulk Operations**: Bulk feature operations for class creation

**Integration Pattern**: Class editing uses a FeaturesTab wrapper component that configures FeaturesManager with class-specific context (FeatureSourceType.Class, classId, 'class').

### **Race System Integration**

The feature system integrates with the race system through similar patterns:

**FeaturesManager**: Embeddable feature management component used in race editing
**FeaturesTab Wrapper**: Tab-specific wrapper component that uses FeaturesManager with race context
**FeatureEditForm Modal**: Modal component for editing features from race context
**Feature Selection**: Feature selection for race features via ListSelectionDialog
**Progression Management**: Feature progression management for races
**Bulk Operations**: Bulk feature operations for race creation

**Integration Pattern**: Race editing uses a FeaturesTab wrapper component that configures FeaturesManager with race-specific context (FeatureSourceType.Race, raceId, 'race').

### **Domain System Integration**

The feature system integrates with the domain system through direct embedding:

**FeaturesManager**: Directly embedded in DomainEdit page for domain feature management
**FeatureEditForm Modal**: Modal component for editing features from domain context
**Feature Selection**: Feature selection for domain features via ListSelectionDialog
**Progression Management**: Feature progression management for domains

**Integration Pattern**: Domain editing directly embeds FeaturesManager with domain-specific context (FeatureSourceType.Domain, domainId, 'domain').

### **Feat System Integration**

The feature system integrates with the feat system through direct embedding:

**FeaturesManager**: Directly embedded in FeatEdit page for feat feature management
**FeatureEditForm Modal**: Modal component for editing features from feat context
**Feature Selection**: Feature selection for feat features via ListSelectionDialog
**Progression Management**: Feature progression management for feats

**Integration Pattern**: Feat editing directly embeds FeaturesManager with feat-specific context (FeatureSourceType.Feat, featId, 'feat').

### **Formula System Integration**

The feature system integrates with the formula system through specialized components:

**FormulaInput**: Formula parameter input component  
**FormulaPreview**: Real-time formula calculation preview  
**FormulaValidation**: Formula validation and error handling  
**FormulaCalculation**: Dynamic formula calculation display  

#### Conditional Scaling & Draft Sync

For `@FormulaId.CONDITIONAL_SCALING`, the UI uses `ArrayPairEditor` to edit `thresholds`/`values` as **level–value pairs** on each `FeatureEntity`:

- `thresholds[i]`: the level where a new value takes effect (e.g., 18, 19, 20)
- `values[i]`: the corresponding value or `appliesToId` at/after that level

On the **frontend form state**, these are stored as normal arrays on `feature.entities[index].formulaParams.thresholds` and `.values`.

For the **feature draft state** (Redis), the system uses the scalar-only `DraftApi.updateValue` to synchronize these arrays **per index**:

- Each change produces updates like:
  - `entities.byId.{entityId}.formulaParams.thresholds.0 = 18`
  - `entities.byId.{entityId}.formulaParams.values.0 = 3`
- When pairs are removed or shortened, higher indexes are rewritten to `null`, and the backend normalizes the final arrays when saving.

This design guarantees:

- **Draft API contract is respected** (each `value` is `string | number | boolean | null`)
- **Incremental edits** (only changed indices are sent)
- **Consistent semantics** between the React form and the persisted feature formula parameters.

## 📊 **Error Handling**

The feature system follows the shared [Error Handling Patterns](../application-overview/frontend-components.md#error-handling) with feature-specific implementations:

**API Errors**: Proper handling of API errors with user feedback
**Validation Errors**: Field-specific validation error display
**Business Logic Errors**: Business rule violation error handling
**Network Errors**: Network error handling and retry logic

## 🔧 **Performance Considerations**

The feature system implements performance optimizations following the shared [Performance Optimization](../application-overview/performance-optimization.md) patterns:

**Component Optimization**: React.memo and useMemo for expensive components
**Lazy Loading**: Lazy loading for complex feature components
**Debounced Validation**: Debounced validation for real-time feedback
**Efficient Rendering**: Efficient rendering for large feature lists

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Feature system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Feature system validation rules and schemas
- **[Static Data](static-data.md)** - Feature system enums and types
- **[Backend Implementation](backend-implementation.md)** - Feature system backend implementation
- **[Frontend Component Architecture](../application-overview/frontend-components.md)** - Shared frontend patterns and conventions
- **[Performance Optimization](../application-overview/performance-optimization.md)** - Shared performance optimization strategies

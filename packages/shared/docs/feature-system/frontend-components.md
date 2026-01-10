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
- Progression Components: `frontend/src/components/feature-system/FeatureProgressionDetailEdit/FeatureProgressionDetailEdit.tsx`
- Utility Components: `frontend/src/components/feature-system/ArrayPairEditor.tsx`
- API Layer: `frontend/src/components/feature-system/FeatureSystemApi.ts`, `frontend/src/components/feature-system/FeatureSystemService.ts`
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

**FeatureEditForm**: Reusable feature creation and editing component supporting both modal and embedded modes
**FeatureEdit**: Full-page feature editor that uses FeatureEditForm in embedded mode
**FeatureDetail**: Feature display and detail view
**FeatureDisplay**: Component for displaying features with prerequisites and progressions
**FeaturesManager**: Embeddable feature management component for class/race/domain/feat editing contexts
**FeatureProgressionDetailEdit**: Complex progression editing with unified feature entities
**ArrayPairEditor**: Utility component for editing array-based data
**FeatureSystemApi**: API client for backend communication
**FeatureSystemService**: Service layer for feature operations

## 🔧 **Core Components**

### **FeatureEditForm**

The reusable core component for creating and editing features, supporting both modal and embedded modes.

**Purpose**: Provides a comprehensive interface for feature creation and editing that can be used as a modal dialog or embedded component, eliminating the need for page navigation when editing features from different contexts.

**Key Features**:
- **Dual Mode Support**: Operates in both modal and embedded modes via props
- **Context Preservation**: Automatically sets sourceType and parent IDs based on provided context
- **Feature CRUD**: Create, read, update, and delete features
- **Prerequisite Management**: Add and edit feature prerequisites
- **Progression Management**: Manage feature progressions through embedded FeatureProgressionDetailEdit
- **Form Validation**: Comprehensive form validation using Zod schemas
- **Callback-Based**: Uses callbacks instead of navigation for save/cancel operations

**Component Structure**:
- **Modal Mode**: Uses Dialog component for modal display with open/close state management
- **Embedded Mode**: Renders directly in parent component without dialog wrapper
- **Form Sections**: Feature details, prerequisites, progressions
- **Validation**: Real-time validation with error display
- **State Management**: Proper state management for form data and UI state with initialization tracking
- **API Integration**: Full integration with FeatureSystemApi

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

### **FeatureProgressionDetailEdit**

Complex component for editing feature progressions with full relationship support.

**Purpose**: Provides a comprehensive interface for editing feature progressions, including unified feature entities with type-based differentiation and formula parameters.

**Key Features**:
- **Progression Editing**: Edit progression details and parameters
- **Entity Management**: Add, edit, and remove feature entities with type-based differentiation
- **Entity Type Support**: Support for Bonus, Quantity, Replacement, Other, Proficiency, Choice, and Allocation entity types
- **Formula Integration**: Full integration with the formula system
- **Condition Management**: Configure conditional requirements for feature entities
- **Real-time Preview**: Dynamic preview of formula calculations and effects

**Component Structure**:
- **Form Sections**: Progression details, feature entities with conditions
- **Dynamic Forms**: Dynamic form generation based on entity types
- **Formula Calculator**: Integrated formula calculator and preview
- **Validation**: Comprehensive validation for all form sections
- **State Management**: Complex state management for nested data

**Key Sub-components**:
- **EntityEdit**: Individual feature entity editing interface with type-based forms
- **ConditionEdit**: Individual condition editing interface
- **FormulaInput**: Formula parameter input and preview

**Source File**: `apps/frontend/src/components/feature-system/FeatureProgressionDetailEdit.tsx`

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
- **Progression Dialog**: FeatureProgressionDetailEdit for progression editing

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

## 🔗 **API Layer**

### **FeatureSystemApi**

Type-safe API client for backend communication.

**Purpose**: Provides type-safe API methods for all feature system operations.

**Key Features**:
- **Type Safety**: Full TypeScript type safety for API operations
- **Error Handling**: Comprehensive error handling and user feedback
- **Request/Response Validation**: Zod schema validation for all requests and responses
- **Authentication**: Proper authentication handling for admin operations

**Core Methods**:
- **getAllFeatures**: Retrieve all features with optional filtering
- **getFeatureById**: Retrieve specific feature by ID
- **createFeature**: Create new feature
- **updateFeature**: Update existing feature
- **deleteFeature**: Delete feature
- **getFeatureProgressions**: Retrieve feature progressions
- **updateFeatureProgressions**: Update feature progressions

**Source File**: `apps/frontend/src/components/feature-system/FeatureSystemApi.ts`

### **FeatureSystemService**

Service layer for feature operations and business logic.

**Purpose**: Provides business logic and data processing for feature operations.

**Key Features**:
- **Data Processing**: Process and transform feature data
- **Business Logic**: Implement feature-specific business rules
- **Validation**: Additional client-side validation
- **State Management**: Manage complex feature state

**Source File**: `apps/frontend/src/components/feature-system/FeatureSystemService.ts`

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

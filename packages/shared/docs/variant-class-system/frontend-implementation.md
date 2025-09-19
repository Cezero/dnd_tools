# Variant Class System - Frontend Implementation

*Comprehensive documentation of the frontend implementation for the variant class system, including components, state management, and user interactions.*

## 📋 **Overview**

The variant class frontend provides seamless integration with the existing ClassEdit component, enabling variant class creation and management through a unified interface. The implementation follows established frontend patterns and provides intuitive user experiences for variant class management.

The frontend implementation follows the shared [Frontend Implementation Patterns](../application-overview/frontend-implementation.md) with variant-specific business logic and integration patterns.

**Source Files**: 
- Components: `apps/frontend/src/features/class/ClassEdit.tsx`, `apps/frontend/src/features/class/SpellOverrideTab.tsx`
- API: `apps/frontend/src/features/class/VariantClassApi.ts`
- Types: `apps/frontend/src/features/class/types.ts`

## 🏗️ **Architecture Overview**

The variant class frontend follows the shared [Layered Architecture Pattern](../application-overview/frontend-implementation.md#layered-architecture-pattern) with variant-specific implementations:

**Component Layer**: React components for variant class management
**State Management Layer**: React hooks and context for state management
**API Layer**: Type-safe API calls for variant operations
**Integration Layer**: Seamless integration with existing class system

### **Component Architecture**

The variant class system uses a component-oriented architecture following the shared [Component Architecture](../application-overview/frontend-implementation.md#component-architecture) patterns:

**ClassEdit Integration**: Seamless integration with existing ClassEdit component
**Variant-Specific Components**: Specialized components for variant functionality
**State Management**: Layered state management with base class and variant data
**User Experience**: Intuitive workflows for variant creation and management

### **Key Design Principles**

**Unified Interface**: Variants work through the same ClassEdit interface as base classes
**Mode Detection**: Automatic detection of variant mode through ID analysis
**Override Management**: Specialized components for feature and spell overrides
**State Separation**: Clear separation between base class and variant data

## 🔧 **Core Component Layer**

### **ClassEdit Integration**

The variant system integrates seamlessly with the existing ClassEdit component through mode detection and tab configuration.

**Purpose**: Provides unified class editing experience for both base classes and variants through the same interface.

**Key Responsibilities**:
- **Mode Detection**: Automatically detect variant mode through ID analysis or user selection
- **Tab Configuration**: Dynamically configure tabs based on variant requirements
- **State Management**: Manage both base class and variant data in unified state
- **Form Handling**: Handle variant-specific form validation and submission

**Core Implementation**:

**Mode Detection Logic**: Uses `isVariantId()` to detect variant classes from custom IDs
- **Parameters**: `id: string` - The class/variant ID from URL parameters
- **Business Logic**: Checks if ID is a variant ID using `isVariantId(parseInt(id))`, falls back to user selection for new classes
- **State Management**: Sets `isVariant` state and `baseClassId` for variant classes
- **Integration**: Uses `extractBaseClassId()` to get base class ID from variant ID

**Base Class Data Management**: Loads and manages base class data for variants
- **Data Loading**: Fetches base class data when `baseClassId` changes
- **State Structure**: Maintains separate state for base class data and variant overrides
- **Data Caching**: Caches base class data to avoid repeated API calls
- **Integration**: Uses `ClassApi.getClassById()` for base class retrieval

**Feature Progression Creation**: Creates feature progressions with correct source types
- **Parameters**: `baseProgression: Partial<FeatureProgression>` - Base progression data
- **Business Logic**: Sets `sourceType` to `FeatureSourceType.ClassVariant` for variants, generates temporary IDs, sets `variantOverrideId` to null for backend assignment
- **Returns**: `FeatureProgression` - Complete progression with variant-specific fields
- **Integration**: Uses `FeatureSourceType.ClassVariant` for variant features

**Source File**: `apps/frontend/src/features/class/ClassEdit.tsx`

### **SpellOverrideTab Component**

Specialized component for managing spell overrides in variant classes.

**Purpose**: Provides intuitive spell list management for variant classes with addition and removal capabilities.

**Key Responsibilities**:
- **Spell Override Management**: Handle spell additions and removals for variant classes
- **Base Class Integration**: Load and display base class spell lists
- **User Interface**: Provide intuitive interfaces for spell management
- **State Management**: Manage spell override state and updates

**Core Implementation**:

**Base Class Spell Loading**: Loads base class spells when base class changes
- **Parameters**: `baseClassId: number` - The base class ID for spell loading
- **Business Logic**: Calls `SpellApi.getSpellsForClass()` to load base class spells, filters available spells for adding/removing
- **State Management**: Updates `baseClassSpells` state with loaded spell data
- **Error Handling**: Handles loading errors and provides fallback empty arrays

**Spell Addition Interface**: Provides interface for adding spells to variant classes
- **Auto-Add Logic**: Automatically adds spells when both level and spell are selected
- **Level Selection**: Uses `CustomSelect` for spell level selection (1-9)
- **Spell Search**: Uses `SpellSearchInput` with filtered spell list (excludes base class spells)
- **State Management**: Manages `newSpellLevel` and `newSpellId` state for auto-add functionality

**Spell Removal Interface**: Provides interface for removing spells from variant classes
- **Removal Logic**: Sets spell level to -1 for removal overrides
- **Spell Filtering**: Only shows base class spells for removal
- **User Interface**: Provides clear visual distinction between additions and removals
- **State Management**: Updates spell overrides state with removal entries

**Spell Override Display**: Displays current spell overrides with management options
- **Addition Display**: Shows added spells with their levels and remove buttons
- **Removal Display**: Shows removed spells with restore options
- **Summary Display**: Provides summary of spell modifications
- **Management**: Handles deletion of individual overrides

**Source File**: `apps/frontend/src/features/class/SpellOverrideTab.tsx`

## 🎯 **API Integration Layer**

### **VariantClassApi Service**

Type-safe API service for variant class operations with comprehensive error handling.

**Purpose**: Provides type-safe access to variant class operations through established patterns and comprehensive functionality.

**Key Responsibilities**:
- **Type Safety**: Ensure type safety through Zod schemas and TypeScript types
- **API Operations**: Provide CRUD operations for variant classes
- **Error Handling**: Handle API errors with appropriate error messages
- **Validation**: Validate requests and responses through Zod schemas

**Core Methods**:

**getVariantById**: Retrieves a variant class by ID
- **Route**: `GET /classes/variants/:id`
- **Parameters**: `VariantIdParamSchema` - Variant ID in URL path
- **Response**: `BaseClassVariantSchema` - Complete variant data
- **Usage**: `await VariantClassApi.getVariantById(undefined, { id: 123 })`

**createVariant**: Creates a new variant class
- **Route**: `POST /classes/variants`
- **Request**: `CreateClassVariantSchema` - Complete variant creation data
- **Response**: `CreateResponseSchema` - Created variant ID and success message
- **Usage**: `await VariantClassApi.createVariant({ name: "Cloistered Cleric", baseClassId: 1 })`

**updateVariant**: Updates an existing variant class
- **Route**: `PUT /classes/variants/:id`
- **Request**: `UpdateClassVariantSchema` - Variant update data
- **Parameters**: `VariantIdParamSchema` - Variant ID in URL path
- **Response**: `UpdateResponseSchema` - Success message
- **Usage**: `await VariantClassApi.updateVariant({ name: "Updated Cloistered Cleric" }, { id: 123 })`

**deleteVariant**: Deletes a variant class
- **Route**: `DELETE /classes/variants/:id`
- **Parameters**: `VariantIdParamSchema` - Variant ID in URL path
- **Response**: `UpdateResponseSchema` - Success message
- **Usage**: `await VariantClassApi.deleteVariant(undefined, { id: 123 })`

**Source File**: `apps/frontend/src/features/class/VariantClassApi.ts`

## 🎨 **State Management Patterns**

### **Variant State Management**

The variant system uses a layered state management approach with base class state, variant override state, and display state.

**State Structure**: The system maintains separate state for base class data, variant overrides, and display data, ensuring efficient state management and preventing circular dependencies.

**State Updates**: The system updates state through established patterns, ensuring efficient state management and preventing circular dependencies.

### **Base Class Data Management**

The system manages base class data through established patterns and efficient data loading.

**Base Class Loading**: The system loads base class data when needed, ensuring efficient resource usage and responsive user experiences.

**Data Caching**: The system caches base class data to ensure responsive user experiences and efficient resource usage.

## 🎨 **User Experience Design**

### **Variant Creation Workflow**

The system provides a clear workflow for variant creation and management, ensuring that users can easily create and modify variant classes.

**Step-by-Step Process**: The system provides a clear step-by-step process for variant creation, including base class selection, variant configuration, feature modifications, and spell modifications.

**Visual Feedback**: The system provides clear visual feedback throughout the variant creation process, ensuring that users understand the current state of their variant class.

### **Visual Design Patterns**

The system uses visual design patterns to indicate overridden fields and provide clear feedback about variant modifications.

**Override Indicators**: The system provides visual indicators for overridden fields, ensuring that users can easily identify which fields have been modified.

**Spell Override Display**: The system provides clear visual distinction between added and removed spells, ensuring that users can easily understand the current state of their variant class.

## 🔧 **Error Handling and Validation**

### **Form Validation**

The system provides comprehensive form validation through real-time validation and clear error messages.

**Real-time Validation**: The system validates form data in real-time, ensuring that users receive immediate feedback about validation errors.

**Error Messages**: The system provides clear error messages for validation errors, ensuring that users understand what needs to be corrected.

### **Error Display**

The system provides comprehensive error display with clear error messages and proper error recovery.

**Error Messages**: The system displays error messages through established patterns, ensuring that users understand what went wrong and how to fix it.

**Success Messages**: The system displays success messages through established patterns, ensuring that users understand when operations succeed.

## 📊 **Performance Optimization**

### **Component Optimization**

The system optimizes component performance through memoization, callback optimization, and efficient state management.

**Memoization**: The system uses React.memo for expensive components, ensuring efficient rendering and state updates.

**Callback Optimization**: The system optimizes callback functions through established patterns, ensuring efficient state management and preventing unnecessary re-renders.

### **State Management Optimization**

The system optimizes state management through efficient state updates and circular dependency prevention.

**Efficient State Updates**: The system updates state through established patterns, ensuring efficient state management and preventing circular dependencies.

**Circular Dependency Prevention**: The system prevents circular dependencies through established patterns, ensuring efficient state management and preventing infinite loops.

## 🔗 **Integration with ClassDetail**

### **Variant Display**

The system integrates with ClassDetail to display variant-specific information and modifications.

**Variant Detection**: The system automatically detects variant classes and fetches variant-specific data, ensuring that users can view variant information.

**Spell Override Display**: The system displays spell overrides in ClassDetail, ensuring that users can view variant-specific spell modifications.

### **Feature Override Display**

The system displays feature overrides in ClassDetail, ensuring that users can view variant-specific feature modifications.

**Override Information**: The system displays override information through established patterns, ensuring that users can understand the current state of their variant class.

## 📋 **Testing Strategy**

### **Component Testing**

The system provides comprehensive component testing for all variant-specific components and functionality.

**SpellOverrideTab Testing**: The system tests the SpellOverrideTab component through established patterns, ensuring proper functionality and user experience.

**Feature Override Testing**: The system tests feature override functionality through established patterns, ensuring proper functionality and user experience.

### **Integration Testing**

The system provides comprehensive integration testing for end-to-end workflows and system integration.

**End-to-End Testing**: The system tests complete variant creation workflows through established patterns, ensuring proper functionality and user experience.

**System Integration**: The system tests integration with other systems through established patterns, ensuring proper functionality and user experience.

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Variant class system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Variant class system validation rules and schemas
- **[Static Data](static-data.md)** - Variant class system enums and types
- **[Backend Implementation](backend-implementation.md)** - Variant class system backend implementation
- **[Frontend Implementation Patterns](../application-overview/frontend-implementation.md)** - Shared frontend patterns and conventions
- **[Component Architecture](../application-overview/component-architecture.md)** - Component design patterns

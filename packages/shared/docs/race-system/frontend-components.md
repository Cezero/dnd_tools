# Race System Frontend Components

*Complete documentation for the race system frontend components, including React components, user interfaces, and interaction patterns.*

## 📋 **Overview**

The race system frontend components provide the user interface for race management, including list views, detailed displays, editing forms, and specialized interfaces for race-specific functionality. The components follow React patterns with TypeScript for type safety.

The frontend implementation follows the shared [Frontend Component Architecture](../application-overview/frontend-components.md) with race-specific business logic and user interface patterns.

**Source Files**: 
- Core Components: `frontend/src/features/race/RaceEdit.tsx`, `frontend/src/features/race/RaceList.tsx`, `frontend/src/features/race/RaceDisplay.tsx`
- Detail Components: `frontend/src/features/race/RaceDetail.tsx`
- API Layer: `frontend/src/features/race/RaceApi.ts`
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
**RaceDetail**: Container component for race detail views with navigation
**RaceDisplay**: Comprehensive race information display component
**RaceEdit**: Main race creation and editing interface with tab-based layout
**Tab Components**: Specialized components for different aspects of race editing
**RaceApi**: API client for backend communication

## 🔧 **Core Components**

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

Comprehensive editing interface for creating and modifying races. This component follows the shared [Edit Components](../application-overview/frontend-components.md#edit-components) pattern.

**Race-Specific Features**:
- **Race Data Entry**: Forms for entering and modifying race data
- **Race Validation**: Real-time validation with user-friendly error messages
- **Race Complex Data**: Handle complex nested data like features and abilities
- **Race User Guidance**: Guide users through the race creation/editing process

**User Workflow**:
1. **Enter Basic Info**: Fill in race name, size, speed, and basic attributes
2. **Configure Abilities**: Set ability score adjustments and racial bonuses
3. **Add Features**: Configure racial features and their effects
4. **Set Languages**: Configure racial languages and language options
5. **Add Sources**: Link to source books and page references
6. **Review and Save**: Review all data and save the race

**Source File**: `frontend/src/features/race/RaceEdit.tsx`

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

Tab for managing racial ability score adjustments and bonuses.

**Purpose and Function**:
- **Ability Adjustments**: Configure racial ability score modifications
- **Ability Bonuses**: Set racial bonuses to specific abilities
- **Ability Integration**: Integrate with the ability system
- **Ability Validation**: Ensure proper ability configuration

**Race-Specific Features**:
- **Ability Score Adjustments**: Set racial ability score modifications
- **Ability Bonuses**: Configure racial bonuses to specific abilities
- **Ability Integration**: Integrate with ability system for validation
- **Ability Display**: Show ability information and requirements

**Source File**: `frontend/src/features/race/tabs/AbilitiesTab.tsx`

### **LanguagesTab Component**

Tab for managing racial languages and language options.

**Purpose and Function**:
- **Racial Languages**: Configure automatic languages for the race
- **Language Options**: Set additional language choices
- **Language Integration**: Integrate with the language system
- **Language Validation**: Ensure proper language configuration

**Race-Specific Features**:
- **Automatic Languages**: Choose languages automatically known by the race
- **Language Choices**: Configure additional language options
- **Language Integration**: Integrate with language system for validation
- **Language Display**: Show language information and requirements

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

### **RaceApi Service**

API client for race system backend communication.

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

**Source File**: `frontend/src/features/race/RaceApi.ts`

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

**Ability Adjustments**: Configure racial ability score modifications
**Ability Bonuses**: Set racial bonuses to specific abilities
**Ability Validation**: Ensure proper ability configuration
**Ability Display**: Show ability information and requirements

**Related Documentation**: [Ability System Frontend Components](../ability-system/frontend-components.md)

### **Language System Integration**

The race system integrates with the language system through the LanguagesTab:

**Racial Languages**: Configure automatic languages for races
**Language Options**: Set additional language choices
**Language Validation**: Ensure proper language configuration
**Language Display**: Show language information and requirements

**Related Documentation**: [Language System Frontend Components](../language-system/frontend-components.md)

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Race system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Race system validation rules and schemas
- **[Static Data](static-data.md)** - Race system enums and types
- **[Backend Implementation](backend-implementation.md)** - Race system backend implementation
- **[Feature System Frontend Components](../feature-system/frontend-components.md)** - Feature system integration
- **[Ability System Frontend Components](../ability-system/frontend-components.md)** - Ability system integration
- **[Language System Frontend Components](../language-system/frontend-components.md)** - Language system integration
- **[Frontend Component Patterns](../application-overview/frontend-components.md)** - Shared frontend patterns and conventions

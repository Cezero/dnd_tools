# Feat System Frontend Components

*Complete documentation for the feat system frontend components, including React components, user interfaces, and interaction patterns.*

## 📋 **Overview**

The feat system frontend components provide the user interface for feat management, including list views, detailed displays, editing forms, and specialized interfaces for feat-specific functionality. The components follow React patterns with TypeScript for type safety.

The frontend implementation follows the shared [Frontend Component Architecture](../application-overview/frontend-components.md) with feat-specific business logic and user interface patterns.

**Source Files**: 
- Core Components: `frontend/src/features/feat/FeatEdit.tsx`, `frontend/src/features/feat/FeatList.tsx`, `frontend/src/features/feat/FeatDetail.tsx`
- Character Components: `frontend/src/features/character/tabs/FeatsTab.tsx` (character feat selection)
- Class Components: `frontend/src/features/class/tabs/ProficienciesTab.tsx` (class proficiency management)
- API Layer: `frontend/src/features/feat/FeatApi.ts`
- Configuration: `frontend/src/features/feat/FeatConfig.ts`
- Columns: `frontend/src/features/feat/FeatColumns.ts`
- Utilities: `frontend/src/features/feat/FeatUtil.ts`

## 🏗️ **Component Architecture**

The feat system frontend follows the shared [Component Architecture](../application-overview/frontend-components.md#shared-component-architecture) with feat-specific implementations:

**Component Structure**: Hierarchical component organization with clear responsibilities
**State Management**: Proper state management using React hooks and context
**Form Handling**: Comprehensive form validation using Zod schemas
**API Integration**: Type-safe API integration with error handling
**User Experience**: Intuitive user interfaces with proper feedback

### **Feat-Specific Component Structure**

**FeatList**: Primary component for displaying and managing feat collections
**FeatDetail**: Container component for feat detail views with navigation
**FeatEdit**: Main feat creation and editing interface with comprehensive form handling
**FeaturesManager**: Shared component for managing FeatureProgression entries (benefits and prerequisites)
**FeatApi**: API client for backend communication

## 🔧 **Core Components**

### **FeatList Component**

The primary component for displaying and managing feat collections. This component follows the shared [List Components](../application-overview/frontend-components.md#list-components) pattern.

**Feat-Specific Features**:
- **Feat Attributes**: Sortable columns for feat attributes (name, description, summary)
- **Feat Filtering**: Filter by feat name, description, or summary
- **Description Display**: Descriptions are truncated at the first newline character for list view
- **Feature Information**: Uses `FeatWithFeatureInfo` type which includes description and summary from associated Features

**Data Source**: Uses `getAllFeatsWithFeatureInfo()` endpoint which returns a composite schema:
- `id` and `name` from Feat table
- `description` and `summary` from associated Feature table (via FeatureProgression)

**User Workflow**:
1. **Browse Feats**: View paginated list of available feats with descriptions and summaries
2. **Search and Filter**: Use search and filter controls to find specific feats
3. **Select Feat**: Click on feat row to view detailed information
4. **Navigate**: Use pagination to browse through all available feats
5. **Bulk Operations**: Select multiple feats for comparison or bulk actions

**Source File**: `frontend/src/features/feat/FeatList.tsx`

### **FeatDetail Component**

Comprehensive display component for viewing complete feat information. This component follows the shared [Display Components](../application-overview/frontend-components.md#display-components) pattern.

**Feat-Specific Features**:
- **Feat Information**: Feat name, type, and basic characteristics
- **Feat Details**: Clear, readable presentation of all feat attributes
- **Feature Progressions**: Display feat benefits and prerequisites via FeatureProgression entries
- **Feature Descriptions**: Display feat descriptions and summaries from associated Features

**User Workflow**:
1. **View Overview**: See feat name, type, and basic information
2. **Review Details**: Examine specific feat attributes and capabilities
3. **Access Related Data**: View feat benefits, prerequisites, and descriptions
4. **Take Actions**: Edit, delete, or navigate to related content

**Source File**: `frontend/src/features/feat/FeatDetail.tsx`

### **FeatsTab Component**

Component for character feat selection and management. This component is part of the character management system.

**Feat-Specific Features**:
- **Backend Filtering**: Uses `/characters/:characterId/resolution/available-feats` endpoint for filtered feat lists
- **Prerequisite Checking**: Backend filters feats based on prerequisites, owned feats, and proficiency conflicts
- **Owned Feats Display**: Displays character's owned feats from complete feat list (not filtered list)
- **Feature Information**: Displays feat descriptions and summaries from associated Features
- **Search Functionality**: Search includes feat name, description, and summary

**Filtering Logic** (handled by backend):
- **Prerequisites**: Only shows feats the character meets prerequisites for
- **Owned Feats**: Filters out feats the character already has (unless repeatable)
- **Proficiency Conflicts**: Filters out feats that provide proficiencies the character already has as "all" proficiencies (e.g., Cleric with all heavy armor won't see Heavy Armor Proficiency feat)

**User Workflow**:
1. **View Owned Feats**: See all feats the character currently has
2. **Browse Available Feats**: View filtered list of feats the character can select
3. **Search and Filter**: Use search to find specific feats
4. **Select Feat**: Click to add feat to character
5. **View Details**: See feat descriptions and summaries from associated Features

**Source File**: `frontend/src/features/character/tabs/FeatsTab.tsx`

### **ProficienciesTab Component**

Component for managing class proficiencies. This component uses the Feature system for proficiency display.

**Feat-Specific Features**:
- **Feature Formatting**: Proficiencies are displayed using the feature formatting system (CharacterSheetDisplayStrategy)
- **Proficiency Selection**: Uses `PROFICIENCY_TYPE_ENUM` directly for selecting proficiency types
- **No Proficiency Feats**: No longer uses "proficiency feats" - proficiencies are identified via FeatureEntity entries with `appliesTo: EntityAppliesToType.Proficiency`

**User Workflow**:
1. **View Current Proficiencies**: See all proficiencies granted to the class via FeatureProgressions
2. **Add Proficiency**: Select proficiency type and items using Feature system
3. **Format Display**: Proficiencies are formatted using feature display strategies

**Source File**: `frontend/src/features/class/tabs/ProficienciesTab.tsx`

### **FeatEdit Component**

Comprehensive editing interface for creating and modifying feats. This component follows the shared [Edit Components](../application-overview/frontend-components.md#edit-components) pattern.

**Feat-Specific Features**:
- **Feat Data Entry**: Forms for entering and modifying feat metadata (name, type, flags)
- **Feat Validation**: Real-time validation with user-friendly error messages
- **FeatureProgression Management**: Manage benefits and prerequisites through FeaturesManager component
- **New Feat Support**: Supports creating new feats with unsaved feature progressions (stored in `unsavedProgressions` state)
- **Feature Creation**: When creating a new feat, feature progressions can be added before saving and are included in the create request

**User Workflow**:
1. **Enter Basic Info**: Fill in feat name, type, and basic attributes (repeatable, fighter bonus, useSubId)
2. **Add Feature Progressions**: Use FeaturesManager to add/edit FeatureProgression entries for benefits and prerequisites
   - For new feats: Progressions are stored in local state until feat is saved
   - For existing feats: Progressions are saved immediately via Feature system API
3. **Review and Save**: Review all data and save the feat (with feature progressions if creating new feat)

**Source File**: `frontend/src/features/feat/FeatEdit.tsx`

**Note**: 
- Benefits and prerequisites are managed through the FeaturesManager component, which provides a unified interface for managing FeatureProgression entries
- Descriptions and summaries come from associated Features, not the Feat model
- When creating a new feat, `featureProgressions` can be included in the create request and will be created along with the feat

## 🔌 **API Integration**

### **FeatApi Service**

API client for feat system backend communication.

**Purpose**: Provides type-safe API communication for all feat operations.

**Key Features**:
- **Type Safety**: Full TypeScript integration with Zod validation
- **Error Handling**: Comprehensive error handling and validation
- **CRUD Operations**: Complete CRUD operations for feats
- **Query Operations**: Advanced querying with filtering
- **Response Validation**: Automatic response validation

**API Endpoints**:
- **GET /api/feats**: Retrieve all feats
- **GET /api/feats/query**: Query feats with filtering
- **GET /api/feats/:id**: Retrieve specific feat by ID
- **POST /api/feats**: Create new feat
- **PUT /api/feats/:id**: Update existing feat
- **DELETE /api/feats/:id**: Delete feat

**Source File**: `frontend/src/features/feat/FeatApi.ts`

## 🎨 **User Interface Patterns**

### **Form-Based Organization**

The feat editing interface uses form-based organization to handle complex feat data:

**Basic Information**: Feat name, type, and core attributes
**Descriptions**: Feat descriptions, benefits, and effects
**Benefits**: Feat benefit relationships and effects
**Prerequisites**: Feat prerequisite relationships and requirements

### **Form Validation**

Comprehensive form validation using Zod schemas:

**Real-time Validation**: Validate fields as users type
**Error Display**: Clear, user-friendly error messages
**Field-specific Validation**: Specific validation rules for each field type
**Cross-field Validation**: Validation that depends on multiple fields

### **State Management**

Proper state management for complex feat data:

**Form State**: Manage form data and validation state
**Loading States**: Handle loading states for API operations
**Error States**: Manage error states and error messages
**Navigation State**: Handle navigation between views

## 🔗 **Integration Patterns**

### **Character System Integration**

The feat system integrates with the character system through feat selection and filtering:

**Feat Selection**: Characters can select and acquire feats through FeatsTab component
**Backend Filtering**: Available feats are filtered by backend service (`AvailableFeatService`) based on:
- Prerequisites (character must meet all FeaturePrerequisite requirements)
- Owned feats (filters out feats character already has, unless repeatable)
- Proficiency conflicts (filters out feats providing proficiencies character already has as "all")
**Feat Benefits**: Character abilities are modified by feat benefits via FeatureEntity entries
**Feat Display**: Feat descriptions and summaries come from associated Features, displayed in character feat selection UI

**Related Documentation**: [Character Management Frontend Components](../character-management/frontend-components.md)


### **Feature System Integration**

The feat system is fully integrated with the Feature system:

**FeatureProgression Management**: Feats use FeaturesManager component to manage FeatureProgression entries
**Benefit Definition**: All feat benefits are defined via FeatureEntity entries within FeatureProgressions
**Prerequisite Definition**: All feat prerequisites are defined via FeaturePrerequisite entries within Features
**Description and Summary**: Feat descriptions and summaries come from associated Features, not the Feat model
**Unified System**: Feats use the same Feature system as races, classes, and other sources

**Related Documentation**: [Feature System Frontend Components](../feature-system/frontend-components.md)

## 🔧 **Utility Functions**

### **Feat Columns**

Column definitions for feat list displays.

**Purpose**: Define column configurations for feat list displays.

**Key Features**:
- **Sortable Columns**: All columns are sortable
- **Filterable Columns**: Most columns support filtering
- **Custom Rendering**: Custom cell rendering for description column (truncates at first newline, renders markdown)
- **Responsive Design**: Columns adapt to different screen sizes
- **FeatWithFeatureInfo Type**: Uses composite schema type for list views

**Source File**: `frontend/src/features/feat/FeatColumns.ts`

### **Feat Utilities**

Utility functions for feat-specific operations.

**Purpose**: Provide utility functions for feat calculations, formatting, and data manipulation.

**Key Features**:
- **Data Formatting**: Format feat data for display
- **Validation Helpers**: Helper functions for feat validation
- **Data Transformation**: Transform feat data between formats

**Note**: Feat benefit and prerequisite calculations are now handled by the Feature system and character calculation services.

**Source File**: `frontend/src/features/feat/FeatUtil.ts`

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Feat system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Feat system validation rules and schemas
- **[Static Data](static-data.md)** - Feat system enums and types
- **[Backend Implementation](backend-implementation.md)** - Feat system backend implementation
- **[Character Management Frontend Components](../character-management/frontend-components.md)** - Character system integration
- **[Ability System Frontend Components](../ability-system/frontend-components.md)** - Ability system integration
- **[Skill System Frontend Components](../skill-system/frontend-components.md)** - Skill system integration
- **[Feature System Frontend Components](../feature-system/frontend-components.md)** - Feature system integration
- **[Frontend Component Patterns](../application-overview/frontend-components.md)** - Shared frontend patterns and conventions

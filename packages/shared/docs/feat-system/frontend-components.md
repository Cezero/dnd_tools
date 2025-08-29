# Feat System Frontend Components

*Complete documentation for the feat system frontend components, including React components, user interfaces, and interaction patterns.*

## 📋 **Overview**

The feat system frontend components provide the user interface for feat management, including list views, detailed displays, editing forms, and specialized interfaces for feat-specific functionality. The components follow React patterns with TypeScript for type safety.

The frontend implementation follows the shared [Frontend Component Architecture](../application-overview/frontend-components.md) with feat-specific business logic and user interface patterns.

**Source Files**: 
- Core Components: `frontend/src/features/feat/FeatEdit.tsx`, `frontend/src/features/feat/FeatList.tsx`, `frontend/src/features/feat/FeatDetail.tsx`
- Specialized Components: `frontend/src/features/feat/FeatBenefitEdit.tsx`, `frontend/src/features/feat/FeatPrereqEdit.tsx`
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
**FeatBenefitEdit**: Specialized component for managing feat benefits
**FeatPrereqEdit**: Specialized component for managing feat prerequisites
**FeatApi**: API client for backend communication

## 🔧 **Core Components**

### **FeatList Component**

The primary component for displaying and managing feat collections. This component follows the shared [List Components](../application-overview/frontend-components.md#list-components) pattern.

**Feat-Specific Features**:
- **Feat Attributes**: Sortable columns for feat attributes (name, type, repeatable, fighter bonus, etc.)
- **Feat Filtering**: Filter by feat type, repeatable status, fighter bonus status
- **Feat Selection**: Select feats for bulk operations or detailed viewing

**User Workflow**:
1. **Browse Feats**: View paginated list of available feats
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
- **Feat Benefits**: Display feat benefits and their effects
- **Feat Prerequisites**: Display feat prerequisites and requirements
- **Feat Descriptions**: Display feat descriptions, effects, and special rules

**User Workflow**:
1. **View Overview**: See feat name, type, and basic information
2. **Review Details**: Examine specific feat attributes and capabilities
3. **Access Related Data**: View feat benefits, prerequisites, and descriptions
4. **Take Actions**: Edit, delete, or navigate to related content

**Source File**: `frontend/src/features/feat/FeatDetail.tsx`

### **FeatEdit Component**

Comprehensive editing interface for creating and modifying feats. This component follows the shared [Edit Components](../application-overview/frontend-components.md#edit-components) pattern.

**Feat-Specific Features**:
- **Feat Data Entry**: Forms for entering and modifying feat data
- **Feat Validation**: Real-time validation with user-friendly error messages
- **Feat Complex Data**: Handle complex nested data like benefits and prerequisites
- **Feat User Guidance**: Guide users through the feat creation/editing process

**User Workflow**:
1. **Enter Basic Info**: Fill in feat name, type, and basic attributes
2. **Configure Descriptions**: Set feat descriptions, benefits, and effects
3. **Add Benefits**: Configure feat benefits and their effects
4. **Set Prerequisites**: Add feat prerequisites and requirements
5. **Review and Save**: Review all data and save the feat

**Source File**: `frontend/src/features/feat/FeatEdit.tsx`

## 🔧 **Specialized Components**

### **FeatBenefitEdit Component**

Specialized component for managing feat benefits with complex relationship handling.

**Purpose**: Provides a dedicated interface for managing feat benefits, including benefit types, references, amounts, and ordering.

**Key Features**:
- **Benefit Type Selection**: Choose from available benefit types (skill, save, proficiency)
- **Reference Management**: Link benefits to specific entities (skills, saves, etc.)
- **Amount Configuration**: Set numeric values for benefit calculations
- **Ordering Management**: Manage the order of multiple benefits

**User Workflow**:
1. **Select Benefit Type**: Choose the type of benefit (skill, save, proficiency)
2. **Configure Reference**: Link to specific entity if required
3. **Set Amount**: Configure numeric value for the benefit
4. **Set Order**: Determine the order of this benefit relative to others

**Source File**: `frontend/src/features/feat/FeatBenefitEdit.tsx`

### **FeatPrereqEdit Component**

Specialized component for managing feat prerequisites with complex relationship handling.

**Purpose**: Provides a dedicated interface for managing feat prerequisites, including prerequisite types, references, amounts, and ordering.

**Key Features**:
- **Prerequisite Type Selection**: Choose from available prerequisite types (ability, skill, feat, BAB, etc.)
- **Reference Management**: Link prerequisites to specific entities (abilities, skills, feats, etc.)
- **Amount Configuration**: Set numeric values for prerequisite requirements
- **Ordering Management**: Manage the order of multiple prerequisites

**User Workflow**:
1. **Select Prerequisite Type**: Choose the type of prerequisite (ability, skill, feat, etc.)
2. **Configure Reference**: Link to specific entity if required
3. **Set Amount**: Configure numeric value for the requirement
4. **Set Order**: Determine the order of this prerequisite relative to others

**Source File**: `frontend/src/features/feat/FeatPrereqEdit.tsx`

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

The feat system integrates with the character system through feat selection and prerequisites:

**Feat Selection**: Characters can select and acquire feats
**Prerequisite Validation**: Character abilities and skills are validated against feat prerequisites
**Feat Benefits**: Character abilities are modified by feat benefits
**Feat Progression**: Character feat progression follows level and class rules

**Related Documentation**: [Character Management Frontend Components](../character-management/frontend-components.md)

### **Ability System Integration**

The feat system integrates with the ability system through prerequisites and benefits:

**Ability Prerequisites**: Feats can require minimum ability scores
**Ability Benefits**: Feats can provide ability score bonuses
**Ability Validation**: Ensure proper ability selection
**Ability Calculation**: Use ability modifiers in feat calculations

**Related Documentation**: [Ability System Frontend Components](../ability-system/frontend-components.md)

### **Skill System Integration**

The feat system integrates with the skill system through prerequisites and benefits:

**Skill Prerequisites**: Feats can require minimum skill ranks
**Skill Benefits**: Feats can provide skill bonuses and proficiencies
**Skill Validation**: Ensure proper skill selection
**Skill Calculation**: Use skill bonuses in feat calculations

**Related Documentation**: [Skill System Frontend Components](../skill-system/frontend-components.md)

### **Feature System Integration**

The feat system integrates with the feature system for feat-related features:

**Feat Prerequisites**: Features can require specific feats
**Feat Benefits**: Features can provide feat-related bonuses
**Feat Progression**: Features can grant additional feats
**Feat Specializations**: Features can provide feat specializations

**Related Documentation**: [Feature System Frontend Components](../feature-system/frontend-components.md)

## 🔧 **Utility Functions**

### **Feat Columns**

Column definitions for feat list displays.

**Purpose**: Define column configurations for feat list displays.

**Key Features**:
- **Sortable Columns**: All columns are sortable
- **Filterable Columns**: Most columns support filtering
- **Custom Rendering**: Custom cell rendering for complex data
- **Responsive Design**: Columns adapt to different screen sizes

**Source File**: `frontend/src/features/feat/FeatColumns.ts`

### **Feat Utilities**

Utility functions for feat-specific operations.

**Purpose**: Provide utility functions for feat calculations, formatting, and data manipulation.

**Key Features**:
- **Feat Calculations**: Calculate feat benefits and prerequisites
- **Data Formatting**: Format feat data for display
- **Validation Helpers**: Helper functions for feat validation
- **Data Transformation**: Transform feat data between formats

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

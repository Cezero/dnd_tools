# Equipment System Frontend Components

*Complete documentation for the equipment system frontend components, including React components, user interfaces, and interaction patterns.*

## 📋 **Overview**

The equipment system frontend components provide the user interface for equipment management, including list views, detailed displays, editing forms, and specialized interfaces for equipment-specific functionality. The components follow React patterns with TypeScript for type safety.

The frontend implementation follows the shared [Frontend Component Architecture](../application-overview/frontend-components.md) with equipment-specific business logic and user interface patterns.

**Source Files**: 
- Core Components: `frontend/src/features/item/ItemEdit.tsx`, `frontend/src/features/item/ItemList.tsx`, `frontend/src/features/item/ItemDetail.tsx`
- API Layer: `frontend/src/features/item/ItemApi.ts`
- Configuration: `frontend/src/features/item/ItemConfig.ts`
- Columns: `frontend/src/features/item/ItemColumns.ts`
- Utilities: `frontend/src/features/item/utils.ts`

## 🏗️ **Component Architecture**

The equipment system frontend follows the shared [Component Architecture](../application-overview/frontend-components.md#shared-component-architecture) with equipment-specific implementations:

**Component Structure**: Hierarchical component organization with clear responsibilities
**State Management**: Proper state management using React hooks and context
**Form Handling**: Comprehensive form validation using Zod schemas
**API Integration**: Type-safe API integration with error handling
**User Experience**: Intuitive user interfaces with proper feedback

### **Equipment-Specific Component Structure**

**ItemList**: Primary component for displaying and managing equipment collections
**ItemDetail**: Container component for equipment detail views with navigation
**ItemEdit**: Main equipment creation and editing interface with comprehensive form handling
**ItemApi**: API client for backend communication

## 🔧 **Core Components**

### **ItemList Component**

The primary component for displaying and managing equipment collections. This component follows the shared [List Components](../application-overview/frontend-components.md#list-components) pattern.

**Equipment-Specific Features**:
- **Equipment Attributes**: Sortable columns for equipment attributes (name, type, cost, weight, etc.)
- **Equipment Filtering**: Filter by equipment type, weapon category, armor category
- **Equipment Selection**: Select equipment for bulk operations or detailed viewing

**User Workflow**:
1. **Browse Equipment**: View paginated list of available equipment
2. **Search and Filter**: Use search and filter controls to find specific equipment
3. **Select Equipment**: Click on equipment row to view detailed information
4. **Navigate**: Use pagination to browse through all available equipment
5. **Bulk Operations**: Select multiple equipment for comparison or bulk actions

**Source File**: `frontend/src/features/item/ItemList.tsx`

### **ItemDetail Component**

Comprehensive display component for viewing complete equipment information. This component follows the shared [Display Components](../application-overview/frontend-components.md#display-components) pattern.

**Equipment-Specific Features**:
- **Equipment Information**: Equipment name, type, and basic characteristics
- **Equipment Details**: Clear, readable presentation of all equipment attributes
- **Weapon Details**: Display weapon-specific data and properties
- **Armor Details**: Display armor-specific data and properties
- **Equipment Descriptions**: Display equipment descriptions and special rules

**User Workflow**:
1. **View Overview**: See equipment name, type, and basic information
2. **Review Details**: Examine specific equipment attributes and capabilities
3. **Access Related Data**: View weapon or armor details, descriptions
4. **Take Actions**: Edit, delete, or navigate to related content

**Source File**: `frontend/src/features/item/ItemDetail.tsx`

### **ItemEdit Component**

Comprehensive editing interface for creating and modifying equipment. This component follows the shared [Edit Components](../application-overview/frontend-components.md#edit-components) pattern.

**Equipment-Specific Features**:
- **Equipment Data Entry**: Forms for entering and modifying equipment data
- **Equipment Validation**: Real-time validation with user-friendly error messages
- **Equipment Complex Data**: Handle complex nested data like weapon and armor properties
- **Equipment User Guidance**: Guide users through the equipment creation/editing process

**User Workflow**:
1. **Enter Basic Info**: Fill in equipment name, type, and basic attributes
2. **Configure Details**: Set equipment descriptions, cost, weight, and quantity
3. **Add Weapon Data**: Configure weapon-specific properties if applicable
4. **Add Armor Data**: Configure armor-specific properties if applicable
5. **Review and Save**: Review all data and save the equipment

**Source File**: `frontend/src/features/item/ItemEdit.tsx`

## 🔌 **API Integration**

### **ItemApi Service**

API client for equipment system backend communication.

**Purpose**: Provides type-safe API communication for all equipment operations.

**Key Features**:
- **Type Safety**: Full TypeScript integration with Zod validation
- **Error Handling**: Comprehensive error handling and validation
- **CRUD Operations**: Complete CRUD operations for equipment
- **Query Operations**: Advanced querying with filtering
- **Response Validation**: Automatic response validation

**API Endpoints**:
- **GET /api/items**: Retrieve all equipment
- **GET /api/items/query**: Query equipment with filtering
- **GET /api/items/:id**: Retrieve specific equipment by ID
- **POST /api/items**: Create new equipment
- **PUT /api/items/:id**: Update existing equipment
- **DELETE /api/items/:id**: Delete equipment

**Source File**: `frontend/src/features/item/ItemApi.ts`

## 🎨 **User Interface Patterns**

### **Form-Based Organization**

The equipment editing interface uses form-based organization to handle complex equipment data:

**Basic Information**: Equipment name, type, and core attributes
**Details**: Equipment descriptions, cost, weight, and quantity
**Weapon Properties**: Weapon-specific data and properties
**Armor Properties**: Armor-specific data and properties

### **Form Validation**

Comprehensive form validation using Zod schemas:

**Real-time Validation**: Validate fields as users type
**Error Display**: Clear, user-friendly error messages
**Field-specific Validation**: Specific validation rules for each field type
**Cross-field Validation**: Validation that depends on multiple fields

### **State Management**

Proper state management for complex equipment data:

**Form State**: Manage form data and validation state
**Loading States**: Handle loading states for API operations
**Error States**: Manage error states and error messages
**Navigation State**: Handle navigation between views

## 🔗 **Integration Patterns**

### **Character System Integration**

The equipment system integrates with the character system through equipment selection and usage:

**Equipment Selection**: Characters can select and acquire equipment
**Equipment Usage**: Characters can use equipment for combat and other activities
**Equipment Benefits**: Character abilities are modified by equipment
**Equipment Restrictions**: Equipment restrictions based on character capabilities

**Related Documentation**: [Character Management Frontend Components](../character-management/frontend-components.md)

## 🔧 **Utility Functions**

### **Item Columns**

Column definitions for equipment list displays.

**Purpose**: Define column configurations for equipment list displays.

**Key Features**:
- **Sortable Columns**: All columns are sortable
- **Filterable Columns**: Most columns support filtering
- **Custom Rendering**: Custom cell rendering for complex data
- **Responsive Design**: Columns adapt to different screen sizes

**Source File**: `frontend/src/features/item/ItemColumns.ts`

### **Item Utilities**

Utility functions for equipment-specific operations.

**Purpose**: Provide utility functions for equipment calculations, formatting, and data manipulation.

**Key Features**:
- **Equipment Calculations**: Calculate equipment properties and effects
- **Data Formatting**: Format equipment data for display
- **Validation Helpers**: Helper functions for equipment validation
- **Data Transformation**: Transform equipment data between formats

**Source File**: `frontend/src/features/item/utils.ts`

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Equipment system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Equipment system validation rules and schemas
- **[Static Data](static-data.md)** - Equipment system enums and types
- **[Backend Implementation](backend-implementation.md)** - Equipment system backend implementation
- **[Character Management Frontend Components](../character-management/frontend-components.md)** - Character system integration
- **[Frontend Component Patterns](../application-overview/frontend-components.md)** - Shared frontend patterns and conventions

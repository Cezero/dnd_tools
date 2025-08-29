# Spell System Frontend Components

*Complete documentation for the spell system frontend components, including React components, user interfaces, and interaction patterns.*

## 📋 **Overview**

The spell system frontend components provide the user interface for spell management, including list views, detailed displays, editing forms, and specialized interfaces for spell-specific functionality. The components follow React patterns with TypeScript for type safety.

The frontend implementation follows the shared [Frontend Component Architecture](../application-overview/frontend-components.md) with spell-specific business logic and user interface patterns.

**Source Files**: 
- Core Components: `frontend/src/features/spell/SpellEdit.tsx`, `frontend/src/features/spell/SpellList.tsx`, `frontend/src/features/spell/SpellDetail.tsx`
- API Layer: `frontend/src/features/spell/SpellApi.ts`
- Configuration: `frontend/src/features/spell/SpellConfig.ts`
- Utilities: `frontend/src/features/spell/spellUtil.ts`, `frontend/src/features/spell/spellFilterFns.ts`
- Columns: `frontend/src/features/spell/SpellColumns.ts`

## 🏗️ **Component Architecture**

The spell system frontend follows the shared [Component Architecture](../application-overview/frontend-components.md#shared-component-architecture) with spell-specific implementations:

**Component Structure**: Hierarchical component organization with clear responsibilities
**State Management**: Proper state management using React hooks and context
**Form Handling**: Comprehensive form validation using Zod schemas
**API Integration**: Type-safe API integration with error handling
**User Experience**: Intuitive user interfaces with proper feedback

### **Spell-Specific Component Structure**

**SpellList**: Primary component for displaying and managing spell collections
**SpellDetail**: Container component for spell detail views with navigation
**SpellEdit**: Main spell creation and editing interface with comprehensive form handling
**SpellApi**: API client for backend communication

## 🔧 **Core Components**

### **SpellList Component**

The primary component for displaying and managing spell collections. This component follows the shared [List Components](../application-overview/frontend-components.md#list-components) pattern.

**Spell-Specific Features**:
- **Spell Attributes**: Sortable columns for spell attributes (name, level, school, etc.)
- **Spell Filtering**: Filter by school, level, components, descriptors
- **Spell Selection**: Select spells for bulk operations or detailed viewing

**User Workflow**:
1. **Browse Spells**: View paginated list of available spells
2. **Search and Filter**: Use search and filter controls to find specific spells
3. **Select Spell**: Click on spell row to view detailed information
4. **Navigate**: Use pagination to browse through all available spells
5. **Bulk Operations**: Select multiple spells for comparison or bulk actions

**Source File**: `frontend/src/features/spell/SpellList.tsx`

### **SpellDetail Component**

Comprehensive display component for viewing complete spell information. This component follows the shared [Display Components](../application-overview/frontend-components.md#display-components) pattern.

**Spell-Specific Features**:
- **Spell Information**: Spell name, level, and basic characteristics
- **Spell Details**: Clear, readable presentation of all spell attributes
- **Spell Relationships**: Display related schools, subschools, descriptors, and components
- **Class Integration**: Display class spell level mappings

**User Workflow**:
1. **View Overview**: See spell name, level, and basic information
2. **Review Details**: Examine specific spell attributes and capabilities
3. **Access Related Data**: View schools, subschools, descriptors, and components
4. **Take Actions**: Edit, delete, or navigate to related content

**Source File**: `frontend/src/features/spell/SpellDetail.tsx`

### **SpellEdit Component**

Comprehensive editing interface for creating and modifying spells. This component follows the shared [Edit Components](../application-overview/frontend-components.md#edit-components) pattern.

**Spell-Specific Features**:
- **Spell Data Entry**: Forms for entering and modifying spell data
- **Spell Validation**: Real-time validation with user-friendly error messages
- **Spell Complex Data**: Handle complex nested data like schools, subschools, and descriptors
- **Spell User Guidance**: Guide users through the spell creation/editing process

**User Workflow**:
1. **Enter Basic Info**: Fill in spell name, level, and basic attributes
2. **Configure Schools**: Set spell schools and subschools
3. **Add Descriptors**: Configure spell descriptors and effects
4. **Set Components**: Configure spell components (verbal, somatic, material, etc.)
5. **Add Class Mappings**: Configure class spell level mappings
6. **Add Sources**: Link to source books and page references
7. **Review and Save**: Review all data and save the spell

**Source File**: `frontend/src/features/spell/SpellEdit.tsx`

## 🔌 **API Integration**

### **SpellApi Service**

API client for spell system backend communication.

**Purpose**: Provides type-safe API communication for all spell operations.

**Key Features**:
- **Type Safety**: Full TypeScript integration with Zod validation
- **Error Handling**: Comprehensive error handling and validation
- **CRUD Operations**: Complete CRUD operations for spells
- **Response Validation**: Automatic response validation

**API Endpoints**:
- **GET /api/spells**: Retrieve all spells
- **GET /api/spells/:id**: Retrieve specific spell by ID
- **PUT /api/spells/:id**: Update existing spell
- **DELETE /api/spells/:id**: Delete spell

**Source File**: `frontend/src/features/spell/SpellApi.ts`

## 🎨 **User Interface Patterns**

### **Form-Based Organization**

The spell editing interface uses form-based organization to handle complex spell data:

**Basic Information**: Spell name, level, and core attributes
**Schools and Subschools**: Spell school classification
**Descriptors**: Spell descriptors and effects
**Components**: Spell components and requirements
**Class Mappings**: Class spell level mappings
**Source Attribution**: Source book references

### **Form Validation**

Comprehensive form validation using Zod schemas:

**Real-time Validation**: Validate fields as users type
**Error Display**: Clear, user-friendly error messages
**Field-specific Validation**: Specific validation rules for each field type
**Cross-field Validation**: Validation that depends on multiple fields

### **State Management**

Proper state management for complex spell data:

**Form State**: Manage form data and validation state
**Loading States**: Handle loading states for API operations
**Error States**: Manage error states and error messages
**Relationship State**: Handle complex spell relationships

## 🔗 **Integration Patterns**

### **Class System Integration**

The spell system integrates with the class system through spell level mapping:

**Level Mapping**: Configure class spell level mappings
**Class Spell Lists**: Display class spell lists
**Level Validation**: Ensure proper spell level assignments
**Class Display**: Show class information and requirements

**Related Documentation**: [Class System Frontend Components](../class-system/frontend-components.md)

### **Source Book System Integration**

The spell system integrates with the source book system through source attribution:

**Source Attribution**: Link spells to source books
**Page References**: Display page numbers for quick lookup
**Source Validation**: Ensure proper source attribution
**Source Display**: Show source book information

**Related Documentation**: [Source Book System Frontend Components](../source-book-system/frontend-components.md)

### **Character System Integration**

The spell system provides the foundation for character spellcasting:

**Character Spells**: Characters can learn and cast spells
**Spell Lists**: Characters have access to class spell lists
**Spell Progression**: Character spellcasting follows class progression
**Spell Management**: Characters can manage their known spells

**Related Documentation**: [Character Management Frontend Components](../character-management/frontend-components.md)

## 🔧 **Utility Functions**

### **Spell Utilities**

Utility functions for spell-related operations and calculations.

**Purpose**: Provide helper functions for spell-related operations and data processing.

**Key Functions**:

**spellUtil**: Core spell utility functions
- **Spell Formatting**: Format spell data for display
- **Spell Calculations**: Calculate spell-related values
- **Spell Validation**: Validate spell data and relationships

**spellFilterFns**: Spell filtering functions
- **School Filtering**: Filter spells by school
- **Level Filtering**: Filter spells by level
- **Component Filtering**: Filter spells by components
- **Descriptor Filtering**: Filter spells by descriptors

**Source File**: `frontend/src/features/spell/spellUtil.ts`, `frontend/src/features/spell/spellFilterFns.ts`

### **Spell Columns**

Column definitions for spell list displays.

**Purpose**: Define column configurations for spell list displays.

**Key Features**:
- **Sortable Columns**: All columns are sortable
- **Filterable Columns**: Most columns support filtering
- **Custom Rendering**: Custom cell rendering for complex data
- **Responsive Design**: Columns adapt to different screen sizes

**Source File**: `frontend/src/features/spell/SpellColumns.ts`

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Spell system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Spell system validation rules and schemas
- **[Static Data](static-data.md)** - Spell system enums and types
- **[Backend Implementation](backend-implementation.md)** - Spell system backend implementation
- **[Class System Frontend Components](../class-system/frontend-components.md)** - Class system integration
- **[Source Book System Frontend Components](../source-book-system/frontend-components.md)** - Source book system integration
- **[Character Management Frontend Components](../character-management/frontend-components.md)** - Character spellcasting integration
- **[Frontend Component Patterns](../application-overview/frontend-components.md)** - Shared frontend patterns and conventions

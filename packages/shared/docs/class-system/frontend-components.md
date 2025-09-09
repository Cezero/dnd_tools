# Class System Frontend Components

*Complete documentation for the class system frontend components, including React components, user interfaces, and interaction patterns.*

## 📋 **Overview**

The class system frontend components provide the user interface for class management, including list views, detailed displays, editing forms, and specialized interfaces for class-specific functionality. The components follow React patterns with TypeScript for type safety.

The frontend implementation follows the shared [Frontend Component Architecture](../application-overview/frontend-components.md#shared-component-architecture) with class-specific business logic and user interface patterns.

**Source Files**: 
- Core Components: `frontend/src/features/class/ClassEdit.tsx`, `frontend/src/features/class/ClassList.tsx`, `frontend/src/features/class/ClassDisplay.tsx`
- Detail Components: `frontend/src/features/class/ClassDetail.tsx`
- API Layer: `frontend/src/features/class/ClassApi.ts`
- Configuration: `frontend/src/features/class/ClassConfig.ts`
- Tab Components: `frontend/src/features/class/tabs/` (BasicInfoTab.tsx, FeaturesTab.tsx, SkillsTab.tsx, ProficienciesTab.tsx, SpellcastingTab.tsx, DescriptionTab.tsx)
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
**ClassDetail**: Container component for class detail views with navigation
**ClassDisplay**: Comprehensive class information display component
**ClassEdit**: Main class creation and editing interface with tab-based layout
**Tab Components**: Specialized components for different aspects of class editing
**ClassApi**: API client for backend communication

## 🔧 **Core Components**

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

**Source File**: [ClassList.tsx](../../../apps/frontend/src/features/class/ClassList.tsx) - Uses GenericList for both class and feature list management

### **ClassDisplay Component**

Comprehensive display component for viewing complete class information. This component follows the shared [Display Components](../application-overview/frontend-components.md#display-components) pattern.

**Class-Specific Features**:
- **Class Information**: Class name, abbreviation, and basic classification
- **Class Tabs**: Organize data into logical sections (Basic Info, Skills, Features, etc.)
- **Class Data**: Clear, readable presentation of all class attributes
- **Class Relationships**: Display related features, spellcasting, and source information

**User Workflow**:
1. **View Overview**: See class name, type, and basic information
2. **Navigate Tabs**: Switch between different aspects of class data
3. **Review Details**: Examine specific class attributes and capabilities
4. **Access Related Data**: View features, spellcasting, and source information
5. **Take Actions**: Edit, delete, or navigate to related content

**Source File**: `frontend/src/features/class/ClassDisplay.tsx`

### **ClassEdit Component**

Comprehensive editing interface for creating and modifying classes. This component follows the shared [Edit Components](../application-overview/frontend-components.md#edit-components) pattern.

**Props Interface**:
```typescript
interface ClassEditProps {
  classId?: number;
  mode: 'create' | 'edit';
  onSave?: (classData: ClassWithDetails) => void;
  onCancel?: () => void;
  initialData?: Partial<ClassWithDetails>;
  readonly?: boolean;
}
```

**State Management**:
```typescript
const [classData, setClassData] = useState<ClassWithDetails>(initialData);
const [activeTab, setActiveTab] = useState<string>('basic');
const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
const [isDirty, setIsDirty] = useState<boolean>(false);
const [isSaving, setIsSaving] = useState<boolean>(false);
```

**Class-Specific Features**:
- **Class Data Entry**: Forms for entering and modifying class data
- **Class Validation**: Real-time validation with user-friendly error messages
- **Class Complex Data**: Handle complex nested data like features and spellcasting
- **Class User Guidance**: Guide users through the class creation/editing process

**Usage Example**:
```tsx
<ClassEdit 
  mode="create"
  onSave={(classData) => {
    console.log('Saving class:', classData);
    navigate('/classes');
  }}
  onCancel={() => navigate('/classes')}
  initialData={{
    name: '',
    abbreviation: '',
    editionId: 5,
    isPrestige: false
  }}
/>
```

**User Workflow**:
1. **Enter Basic Info**: Fill in class name, abbreviation, and basic attributes
2. **Configure Progression**: Set BAB and saving throw progression values
3. **Add Features**: Configure class features and their progression
4. **Set Spellcasting**: Configure spellcasting capabilities and progression
5. **Add Sources**: Link to source books and page references
6. **Review and Save**: Review all data and save the class

**Source File**: `frontend/src/features/class/ClassEdit.tsx`

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
- **Mechanical Properties**: Configure hit die, skill points, and progression values
- **Validation**: Ensure all required fields are properly filled

**Form Fields** (see [Database Schema](database-schema.md) for field descriptions):
- **Identity Fields**: Name, abbreviation with validation
- **Classification**: Edition, prestige status, visibility settings
- **Mechanical Properties**: Hit die, skill points, progression values
- **Spellcasting Configuration**: Spellcasting flags and casting type
- **Description**: Rich text description with markdown support

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

### **SpellcastingTab Component**

Tab for managing class spellcasting capabilities and progression.

**Purpose and Function**:
- **Spellcasting Configuration**: Configure spellcasting capabilities
- **Spell Progression**: Set spell slot progression
- **Spells Known**: Configure spells known for spontaneous casters
- **Spellcasting Integration**: Integrate with the spellcasting system

**Class-Specific Features**:
- **Spellcasting Flags**: Set spellcasting capability flags
- **Casting Ability**: Choose primary casting ability
- **Casting Type**: Set casting type (prepared, spontaneous, etc.)
- **Spell Progression**: Configure spell slot progression
- **Spells Known**: Configure spells known progression for spontaneous casters

**Source File**: `frontend/src/features/class/tabs/SpellcastingTab.tsx`

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

### **ClassApi Service**

API client for class system backend communication.

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

**Source File**: `frontend/src/features/class/ClassApi.ts`

## 🎨 **User Interface Patterns**

### **Tab-Based Organization**

The class editing interface uses tab-based organization to separate concerns:

**Basic Info**: Core class properties and metadata
**Features**: Class features and abilities
**Skills**: Class skills and skill point allocation
**Proficiencies**: Weapon and armor proficiencies
**Spellcasting**: Spellcasting capabilities and progression
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

## 🔗 **Integration Patterns**

### **Feature System Integration**

The class system integrates with the feature system through the FeaturesTab:

**Feature Selection**: Choose features to add to classes
**Feature Configuration**: Configure feature progression and details
**Feature Validation**: Ensure proper feature configuration
**Feature Display**: Show feature information and requirements

**Related Documentation**: [Feature System Frontend Components](../feature-system/frontend-components.md#integration-patterns)

### **Spellcasting System Integration**

The class system integrates with the spellcasting system through the SpellcastingTab:

**Spellcasting Configuration**: Configure spellcasting capabilities
**Spell Progression**: Set spell slot progression
**Spells Known**: Configure spells known for spontaneous casters
**Spellcasting Validation**: Ensure proper spellcasting configuration

**Related Documentation**: [Spellcasting System Frontend Components](../spell-system/frontend-components.md#spellcasting-progression-components)

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

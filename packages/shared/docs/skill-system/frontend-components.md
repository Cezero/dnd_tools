# Skill System Frontend Components

*Complete documentation for the skill system frontend components, including React components, user interfaces, and interaction patterns.*

## 📋 **Overview**

The skill system frontend components provide the user interface for skill management, including list views, detailed displays, editing forms, and specialized interfaces for skill-specific functionality. The components follow React patterns with TypeScript for type safety.

The frontend implementation follows the shared [Frontend Component Architecture](../application-overview/frontend-components.md) with skill-specific business logic and user interface patterns.

**Source Files**: 
- Core Components: `frontend/src/features/skill/SkillEdit.tsx`, `frontend/src/features/skill/SkillList.tsx`, `frontend/src/features/skill/SkillDetail.tsx`
- API Layer: `frontend/src/services/query/SkillQueryHooks.ts`
- Configuration: `frontend/src/features/skill/SkillConfig.ts`
- Columns: `frontend/src/features/skill/SkillColumns.ts`
- Utility Functions: `frontend/src/lib/skill-utils.ts`

## 🏗️ **Component Architecture**

The skill system frontend follows the shared [Component Architecture](../application-overview/frontend-components.md#shared-component-architecture) with skill-specific implementations:

**Component Structure**: Hierarchical component organization with clear responsibilities
**State Management**: Proper state management using React hooks and context
**Form Handling**: Comprehensive form validation using Zod schemas
**API Integration**: Type-safe API integration with error handling
**User Experience**: Intuitive user interfaces with proper feedback

### **Skill-Specific Component Structure**

**SkillList**: Primary component for displaying and managing skill collections
**SkillDetail**: Container component for skill detail views with navigation
**SkillEdit**: Main skill creation and editing interface with comprehensive form handling
**SkillQueryHooks**: Canonical API interface for skill endpoints (createQueryHooks-based; uses typedApi under the hood)

## 🔧 **Core Components**

### **SkillList Component**

The primary component for displaying and managing skill collections. This component follows the shared [List Components](../application-overview/frontend-components.md#list-components) pattern.

**Skill-Specific Features**:
- **Skill Attributes**: Sortable columns for skill attributes (name, key ability, trained only, etc.)
- **Skill Filtering**: Filter by key ability, training requirement, armor penalty
- **Skill Selection**: Select skills for bulk operations or detailed viewing

**User Workflow**:
1. **Browse Skills**: View paginated list of available skills
2. **Search and Filter**: Use search and filter controls to find specific skills
3. **Select Skill**: Click on skill row to view detailed information
4. **Navigate**: Use pagination to browse through all available skills
5. **Bulk Operations**: Select multiple skills for comparison or bulk actions

**Source File**: `frontend/src/features/skill/SkillList.tsx`

### **SkillDetail Component**

Comprehensive display component for viewing complete skill information. This component follows the shared [Display Components](../application-overview/frontend-components.md#display-components) pattern.

**Skill-Specific Features**:
- **Skill Information**: Skill name, key ability, and basic characteristics
- **Skill Details**: Clear, readable presentation of all skill attributes
- **Skill Mechanics**: Display skill check mechanics, action requirements, and retry rules
- **Skill Notes**: Display special notes, synergy bonuses, and restrictions

**User Workflow**:
1. **View Overview**: See skill name, key ability, and basic information
2. **Review Details**: Examine specific skill attributes and capabilities
3. **Access Related Data**: View skill mechanics, notes, and restrictions
4. **Take Actions**: Edit, delete, or navigate to related content

**Source File**: `frontend/src/features/skill/SkillDetail.tsx`

### **SkillEdit Component**

Comprehensive editing interface for creating and modifying skills. This component follows the shared [Edit Components](../application-overview/frontend-components.md#edit-components) pattern.

**Skill-Specific Features**:
- **Skill Data Entry**: Forms for entering and modifying skill data
- **Skill Validation**: Real-time validation with user-friendly error messages
- **Skill Complex Data**: Handle complex nested data like descriptions and notes
- **Skill User Guidance**: Guide users through the skill creation/editing process

**User Workflow**:
1. **Enter Basic Info**: Fill in skill name, key ability, and basic attributes
2. **Configure Requirements**: Set training requirements and armor penalties
3. **Add Descriptions**: Configure skill descriptions and mechanics
4. **Set Notes**: Add special notes, synergy bonuses, and restrictions
5. **Review and Save**: Review all data and save the skill

**Source File**: `frontend/src/features/skill/SkillEdit.tsx`

## 🔌 **API Integration**

### **SkillQueryHooks**

Query hooks + imperative methods for skill system backend communication.

**Purpose**: Provides type-safe API communication for all skill operations.

**Key Features**:
- **Type Safety**: Full TypeScript integration with Zod validation
- **Error Handling**: Comprehensive error handling and validation
- **CRUD Operations**: Complete CRUD operations for skills
- **Response Validation**: Automatic response validation

**API Endpoints**:
- **GET /api/skills**: Retrieve all skills
- **GET /api/skills/:id**: Retrieve specific skill by ID
- **POST /api/skills**: Create new skill
- **PUT /api/skills/:id**: Update existing skill
- **DELETE /api/skills/:id**: Delete skill

**Source File**: `frontend/src/services/query/SkillQueryHooks.ts`

## 🎨 **User Interface Patterns**

### **Form-Based Organization**

The skill editing interface uses form-based organization to handle complex skill data:

**Basic Information**: Skill name, key ability, and core attributes
**Requirements**: Training requirements and armor penalties
**Descriptions**: Skill descriptions and mechanics
**Notes**: Special notes, synergy bonuses, and restrictions

### **Form Validation**

Comprehensive form validation using Zod schemas:

**Real-time Validation**: Validate fields as users type
**Error Display**: Clear, user-friendly error messages
**Field-specific Validation**: Specific validation rules for each field type
**Cross-field Validation**: Validation that depends on multiple fields

### **State Management**

Proper state management for complex skill data:

**Form State**: Manage form data and validation state
**Loading States**: Handle loading states for API operations
**Error States**: Manage error states and error messages
**Navigation State**: Handle navigation between views

## 🔗 **Integration Patterns**

### **Ability System Integration**

The skill system integrates with the ability system through key abilities:

**Key Ability Selection**: Choose key ability for the skill
**Ability Display**: Display key ability information
**Ability Validation**: Ensure proper ability selection
**Ability Calculation**: Use ability modifiers in skill calculations

**Related Documentation**: [Ability System Frontend Components](../ability-system/frontend-components.md)

### **Character System Integration**

The skill system provides the foundation for character skill management:

**Character Skills**: Characters can have skill ranks and bonuses
**Skill Progression**: Character skill progression follows class and level rules
**Skill Checks**: Characters make skill checks using their skill ranks and ability modifiers
**Skill Synergies**: Skills can provide bonuses to other skills
**Subtype Management**: Character skills with subtypes (Craft, Knowledge) use database-driven subtype lookups
**Special Behaviors**: Special skill behaviors (no max ranks, double armor penalty) are determined via database flags

**Refactored Components**: Character skill components have been refactored to use utility functions instead of hardcoded skill ID comparisons:
- **SkillsTab**: Uses `hasSubtypes()`, `usesCustomSubtype()`, `hasNoMaxRanks()`, `getSkillSubtypes()` for dynamic subtype handling
- **CharacterEdit**: Uses `hasNoMaxRanks()` for filtering language skills
- **CharacterPdfService**: Uses `hasDoubleArmorPenalty()` and `getSkillSubtypes()` for PDF generation
- **DescriptionTab**: Uses `hasNoMaxRanks()` for language display

**Related Documentation**: [Character Management Frontend Components](../character-management/frontend-components.md)

### **Feature System Integration**

The skill system integrates with the feature system for skill-related features:

**Skill Bonuses**: Features can provide skill bonuses and modifiers
**Skill Synergies**: Features can provide skill synergy bonuses
**Skill Proficiencies**: Features can grant skill proficiencies
**Skill Specializations**: Features can provide skill specializations
**Subtype Selection**: Feature progression detail edit uses `getSkillSubtypes()` for dynamic subtype options
**Analog Skills**: AnalogSkillService has been refactored to use resolved feature progressions instead of hardcoded class checks

**Refactored Components**: Feature system components have been updated to use database-driven subtype lookups:
- **FeatureProgressionDetailEdit**: Uses `getSkillSubtypes()` and `hasSubtypes()` for dynamic subtype selection
- **AnalogSkillService**: Uses resolved feature progressions to determine which classes grant analog skills

**Related Documentation**: [Feature System Frontend Components](../feature-system/frontend-components.md)

## 🔧 **Utility Functions**

### **Skill Utility Functions**

Centralized utility functions for skill type checks and subtype lookups, replacing hardcoded skill ID comparisons.

**Purpose**: Provides type-safe functions for checking skill characteristics and accessing subtype data from the skills-cache.

**Key Functions**:

**hasSubtypes**: Check if a skill uses predefined subtypes (Craft, Knowledge)
- **Parameters**: Skill ID
- **Returns**: Boolean indicating if skill has subtypes
- **Usage**: Replaces hardcoded checks like `skillId === 6 || skillId === 19`

**usesCustomSubtype**: Check if a skill uses custom subtypes (Perform, Profession)
- **Parameters**: Skill ID
- **Returns**: Boolean indicating if skill uses custom subtypes
- **Usage**: Replaces hardcoded checks like `skillId === 32 || skillId === 33`

**hasNoMaxRanks**: Check if a skill has no maximum rank limit (Speak Language)
- **Parameters**: Skill ID
- **Returns**: Boolean indicating if skill has no max ranks
- **Usage**: Replaces hardcoded checks like `skillId === 38`

**hasDoubleArmorPenalty**: Check if a skill has double armor check penalty (Swim)
- **Parameters**: Skill ID
- **Returns**: Boolean indicating if skill has double armor penalty
- **Usage**: Replaces hardcoded checks like `skillId === 42`

**getSkillSubtypes**: Get all subtypes for a skill from the cache
- **Parameters**: Skill ID
- **Returns**: Array of skill subtype cache entries
- **Usage**: Replaces static map lookups like `CRAFT_SKILL_MAP` and `KNOWLEDGE_SKILL_MAP`

**skillRankIdentityKey / resolveCustomSubtypeCasing**: Match Profession / Perform text case-insensitively (`sailor` → existing `Sailor`)
**formatBonusSkillRankTitle**: Features & Feats label, e.g. `Profession (Sailor) Bonus Ranks: 2`

### **Character Editor Bonus Ranks**

The character Skills tab (`apps/frontend/src/features/character/tabs/SkillsTab.tsx`) has an **Add bonus ranks** dialog (`BonusSkillRanksDialog`) below the skill table. Craft / Knowledge pick a subtype dropdown; Profession / Perform use a text field. Grants persist on the character draft as `bonusSkillRanks` and appear on Features & Feats plus the PDF special-abilities column.

The editor ranks **input** stays this-level spent ranks so incrementing does not write bonus ranks into `pointsSpent`. The sheet / detail **Ranks** column and **Total** include bonus ranks via `characterSheetDisplayStrategy.formatSkills`.

**Key Features**:
- **Database-Driven**: All data comes from the skills-cache API
- **Type-Safe**: Full TypeScript type safety
- **Centralized Logic**: Single source of truth for skill type checks
- **Performance**: Uses cached data for efficient lookups

**Source File**: `frontend/src/lib/skill-utils.ts`

### **Skill Columns**

Column definitions for skill list displays.

**Purpose**: Define column configurations for skill list displays.

**Key Features**:
- **Sortable Columns**: All columns are sortable
- **Filterable Columns**: Most columns support filtering
- **Custom Rendering**: Custom cell rendering for complex data
- **Responsive Design**: Columns adapt to different screen sizes

**Source File**: `frontend/src/features/skill/SkillColumns.ts`

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Skill system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Skill system validation rules and schemas
- **[Static Data](static-data.md)** - Skill system enums and types
- **[Backend Implementation](backend-implementation.md)** - Skill system backend implementation
- **[Ability System Frontend Components](../ability-system/frontend-components.md)** - Ability system integration
- **[Character Management Frontend Components](../character-management/frontend-components.md)** - Character skill management integration
- **[Feature System Frontend Components](../feature-system/frontend-components.md)** - Feature system integration
- **[Frontend Component Patterns](../application-overview/frontend-components.md)** - Shared frontend patterns and conventions

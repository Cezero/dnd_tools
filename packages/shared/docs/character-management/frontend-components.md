# Character Management Frontend Components

*Complete documentation for the character management frontend components, including React components, user interfaces, and interaction patterns.*

## 📋 **Overview**

The character management frontend components provide the user interface for character creation, editing, advancement, and management. The components follow React patterns with TypeScript for type safety and provide comprehensive character management capabilities.

The frontend implementation follows the shared [Frontend Component Architecture](../application-overview/frontend-components.md) with character-specific business logic and user interface patterns.

**Source Files**: 
- Core Components: `frontend/src/features/character/CharacterEdit.tsx`, `frontend/src/features/character/CharacterList.tsx`, `frontend/src/features/character/CharacterPage.tsx`
- API Layer: `frontend/src/features/character/CharacterQueryHooks.ts`, `frontend/src/features/character/CharacterDetailQueryHooks.ts`
- Configuration: `frontend/src/features/character/CharacterConfig.ts`
- Columns: `frontend/src/features/character/CharacterColumns.ts`
- Utilities: `frontend/src/features/character/AnalogSkillService.ts`
- Tab Components: `frontend/src/features/character/tabs/`

## 🏗️ **Component Architecture**

The character management frontend follows the shared [Component Architecture](../application-overview/frontend-components.md#shared-component-architecture) with character-specific implementations:

**Component Structure**: Hierarchical component organization with clear responsibilities
**State Management**: Proper state management using React hooks and context
**Form Handling**: Comprehensive form validation using Zod schemas
**API Integration**: Type-safe API integration with error handling
**User Experience**: Intuitive user interfaces with proper feedback

### **Character-Specific Component Structure**

**CharacterList**: Primary component for displaying and managing character collections
**CharacterEdit**: Main character creation and editing interface with comprehensive form handling
**CharacterPage**: Container component for character detail views with tab navigation
**CharacterQueryHooks**: Canonical API interface for character CRUD + editing-related endpoints (createQueryHooks-based; uses typedApi under the hood)
**CharacterDetailQueryHooks**: Canonical API interface for view-mode character detail endpoints (wounds, money, items, spell preparations, uses)
**Tab Components**: Specialized components for different character aspects (abilities, skills, feats, equipment, etc.)

## 🔧 **Core Components**

### **CharacterList Component**

The primary component for displaying and managing character collections. This component follows the shared [List Components](../application-overview/frontend-components.md#list-components) pattern.

**Character-Specific Features**:
- **Character Attributes**: Sortable columns for character attributes (name, race, alignment, level, etc.)
- **Character Filtering**: Filter by character name, race, alignment, and other attributes
- **Character Selection**: Select characters for detailed viewing or management
- **User Ownership**: Display only characters owned by the authenticated user

**User Workflow**:
1. **Browse Characters**: View paginated list of user's characters
2. **Search and Filter**: Use search and filter controls to find specific characters
3. **Select Character**: Click on character row to view detailed information
4. **Navigate**: Use pagination to browse through all available characters
5. **Create Character**: Access character creation functionality

**Source File**: `frontend/src/features/character/CharacterList.tsx`

### **CharacterEdit Component**

Comprehensive editing interface for creating and modifying characters. This component follows the shared [Edit Components](../application-overview/frontend-components.md#edit-components) pattern.

**Character-Specific Features**:
- **Character Data Entry**: Forms for entering and modifying character data
- **Character Validation**: Real-time validation with user-friendly error messages
- **Character Complex Data**: Handle complex nested data like ability scores, race selection, and alignment
- **Character User Guidance**: Guide users through the character creation/editing process
- **Draft-only resume**: `/characters/new/create` mints Character + Advancement drafts and redirects to `/characters/<negativeId>/edit`. Opening that edit URL (including refresh) calls `ensureDraftOnlyEditSession` so Redis/session exist even after TTL expiry; expired field values are not recovered.

**User Workflow**:
1. **Enter Basic Info**: Fill in character name, race, alignment, and basic attributes
2. **Configure Details**: Set character age, height, weight, and physical description
3. **Add Notes**: Add character notes and background information
4. **Review and Save**: Review all data and save the character

**Source File**: `frontend/src/features/character/CharacterEdit.tsx`

### **CharacterDetail Component**

Main component for displaying and editing character details in view mode. Does **not** use `useCharacterResolution` or `startEditing`; resolved data for display comes from `GET /characters/:id/resolve` (getResolved). No edit locks or drafts when viewing.

**Character-Specific Features**:
- **Character Display**: Comprehensive display of character information
- **Tab Navigation**: Tab-based interface for different character aspects (overview, skills, spells, features, equipment, description)
- **Editable Fields**: Some fields are editable (wounds, money, notes, items, spell preparations) via discrete endpoints; these persist to DB on each call and do not require resolved character in (draft) state.
- **Resolved Data**: Fetches resolved character from `GET /characters/:id/resolve` for display (formatting, export).

**View vs Edit**:
- **CharacterDetail** (view at `/characters/:id`): getResolved for display; no locks/drafts. View-mode edits use discrete endpoints.
- **CharacterEdit** (edit at `/characters/:id/edit`): Uses `useCharacterResolution` and `startEditing`; acquires locks and creates drafts.

**View-Mode Edits (target; future work)**: Target is `updateValue`+WebSocket with DB persist on each call when viewing; future game session uses Redis and persists only when DM saves. Current implementation uses discrete endpoints.

**User Workflow**:
1. **View Character**: Navigate to character detail page
2. **Browse Tabs**: Switch between different tabs to view character information
3. **Edit Details**: Modify editable fields (wounds, money, notes, items, spell preparations)
4. **View Resolved Data**: See resolved features, skills, and other calculated values

**Source File**: `frontend/src/features/character/CharacterDetail.tsx`

#### **Character Edit Tab Architecture**

The CharacterEdit component uses a standardized state synchronization pattern for all tab components:

**State → useEffect → applyUpdate Pattern**:

All character edit tabs follow a consistent pattern for synchronizing state changes with the resolution session:

1. **Tabs update state**: Tab components call `updateState()` to modify character state (e.g., `state.skillRanks`, `state.featureChoices`)
2. **CharacterEdit syncs automatically**: useEffect hooks in CharacterEdit watch state changes and automatically call `resolution.applyUpdate()` to sync changes to the resolution session
3. **Resolution session updates**: Backend resolution session is updated, and resolved data flows back to tabs via `resolvedData` prop

**Benefits**:
- **Centralized sync logic**: All sync happens in CharacterEdit, easier to maintain
- **Tabs are simpler**: Tabs don't need to know about resolution API
- **Automatic sync**: No risk of forgetting to sync - it's automatic
- **React-idiomatic**: Uses effects to react to state changes
- **Consistent**: All tabs work the same way

**State Fields with Automatic Sync**:
- `state.classId` and `state.secondaryClassId` → `SET_CLASS` / `SET_SECONDARY_CLASS` updates
- `state.raceId` → `SET_RACE` updates
- `state.isGestalt`, `state.allowVariantClasses`, `state.ignoreLevelAdjustment`, `state.maxHpAtFirstLevel`, `state.editionId` → character draft config fields (required for save; Redis defaults are `false` / 3.5)
- `state.disallowedSources` → loaded from the character on edit; written on first sync after `characterId` is set; save awaits each source write so setting exclusions (Eberron/FR) are not a partial Redis list
- `state.level` → `SET_LEVEL` updates
- `state.skillRanks` → `SET_SKILL_RANK` updates (for each skill rank)
- `state.featureChoices` → sequential `featureChoices.byId` writes (queued) into the Redis advancement draft. The backend applies each `updateValue` with Redis compare-and-set so parallel docks cannot last-write-wins an empty `featureChoices` array. Save persists Redis to MySQL only. Advancement save errors are no longer swallowed.
- `state.spellsKnown` → sequential `spellsKnown.byId` writes to the same Redis draft, then save reads Redis
- `state.equipment` → sequential `characterItems.byId` writes into the Redis character draft. Combat attack options and `formatCharacter` read this list, not the last GET. New rows use negative temp IDs. Save remaps those IDs to MySQL and preserves existing positive IDs.
- `state.attackDefinitions` → sequential `attackDefinitions.byId` writes. Attacks that reference unsaved items stay local (and in the draft) until Save; attacks that only reference persisted items still call the REST endpoints.

**Redis is the session source of truth**: Editor changes must land in Redis as they happen so a reload or dropped client can restore from `state:{draftType}:{id}`. Save does not accept React collections as an overlay. Opening an existing character for edit starts the character and advancement drafts, then GET `/characters/:id` overlays locked Redis drafts onto the MySQL snapshot.

**Save and cache**: Persisted-character save used to navigate to the view immediately and skip query invalidation. The details query uses a 5-minute `staleTime`, so the view and the next edit showed pre-save HP, edition, and config flags even though MySQL was updated. Save now invalidates and removes the details/resolve cache, then navigates. The editor hydrates with `staleTime: 0`. User preferred edition is applied only when `editionId` is unset.

**Adding a New Tab**:
1. Create tab component that receives `state` and `updateState` props
2. Update state via `updateState()` when user makes changes
3. Add useEffect hook in CharacterEdit if new state field needs sync
4. Do NOT call `resolution.applyUpdate()` directly from tab

**Common Pitfalls to Avoid**:
- ❌ Calling `resolution.applyUpdate()` directly from tabs
- ❌ Expecting `resolvedCharacter` in response schemas for direct database operations
- ❌ Forgetting to add useEffect hook in CharacterEdit for new state fields
- ❌ Not using refs to track previous values (causes initial sync on mount)

**Source Files**:
- CharacterEdit: `frontend/src/features/character/CharacterEdit.tsx`
- useCharacterResolution: `frontend/src/features/character/useCharacterResolution.ts`
- Tab Components: `frontend/src/features/character/tabs/*Tab.tsx`

**Related Documentation**:
- [Character Resolution System](character-resolution-system.md) - Backend resolution system
- [Frontend Patterns](../application-overview/frontend-patterns.md) - General frontend patterns

#### **Character Detail Tab Architecture**

The CharacterDetail component uses the same standardized state synchronization pattern as CharacterEdit, but for direct database operations:

**State → useEffect → API + refreshState Pattern**:

All character detail tabs follow a consistent pattern for synchronizing state changes with the backend:

1. **Tabs update state**: Tab components call `updateState()` to modify character detail state (e.g., `state.wounds`, `state.money`, `state.items`, `state.spellPreparations`)
2. **CharacterDetail syncs automatically**: useEffect hooks in CharacterDetail watch state changes and automatically call backend APIs (e.g., `updateWounds()`, `updateMoney()`, `syncItems()`, `syncSpellPreparations()`) and then `resolution.refreshState()` to sync changes
3. **Backend handles diffing**: For array fields (items, spell preparations), backend receives full arrays and determines what operations to perform (create/update/delete)
4. **Resolution state updates**: Backend resolution session is updated, and resolved data flows back to tabs via `resolvedCharacter` prop

**Benefits**:
- **Centralized sync logic**: All sync happens in CharacterDetail, easier to maintain
- **Tabs are simpler**: Tabs don't need to know about APIs or resolution
- **Automatic sync**: No risk of forgetting to sync - it's automatic
- **React-idiomatic**: Uses effects to react to state changes
- **Consistent**: All tabs work the same way
- **Backend is source of truth**: Backend handles diffing and determines operations

**State Fields with Automatic Sync**:
- `state.wounds` → `SET_WOUNDS` updates → calls `updateWounds()` API + `refreshState()`
- `state.money` → `SET_MONEY` updates → calls `updateMoney()` API + `refreshState()`
- `state.notes` → `SET_NOTES` updates → calls `updateNotes()` API + `refreshState()`
- `state.items` → `SET_ITEMS` / `ADD_ITEM` / `REMOVE_ITEM` / `UPDATE_ITEM` updates → calls `syncItems()` API + `refreshState()`
- `state.spellPreparations` → `SET_SPELL_PREPARATIONS` / `ADD_SPELL_PREPARATION` / `UPDATE_SPELL_PREPARATION` / `REMOVE_SPELL_PREPARATION` / `CAST_SPELL` / `UNCAST_SPELL` updates → calls `syncSpellPreparations()` API + `refreshState()`

**Backend Sync Pattern**:
- Frontend sends entire state array to backend (no diffing on frontend)
- Backend receives full array and diffs against current database state
- Backend determines what operations to perform:
  - Items: Compare by `id` (database ID) or `baseItemId` + `location` (for new items)
  - Spell preparations: Compare by `id` (database ID) or composite key `classId-spellId-spellLevel-slotType-featId` (for new preparations)
- Backend performs all necessary database operations atomically in a transaction
- Single API call per array field (simpler, more reliable, less error-prone)
- Backend is source of truth for what operations are needed

**Adding a New Detail Tab**:
1. Create tab component that receives `state` and `updateState` props
2. Update state via `updateState()` when user makes changes
3. Add useEffect hook in CharacterDetail if new state field needs sync
4. Do NOT call APIs directly from tab
5. For array fields, use sync endpoints that accept full arrays

**Common Pitfalls to Avoid**:
- ❌ Calling APIs directly from tabs
- ❌ Forgetting to add useEffect hook in CharacterDetail for new state fields
- ❌ Not using refs to track previous values (causes initial sync on mount)
- ❌ Frontend diffing arrays instead of sending full arrays to backend

The Features & Feats viewer tab (`detail-tabs/FeaturesTab.tsx`) appends saved player choices to feature and feat titles via `choiceDisplayName.ts` (for example `Animal Companion: Dog`). It omits chassis features (BAB, class skills, proficiency wrappers) and shows a de-duplicated proficiency union. DM bonus skill ranks appear after Feats as `Skillname Bonus Ranks: X` with the grant justification.

The editor Skills tab (`tabs/SkillsTab.tsx`) can add those grants via **Add bonus ranks**. They persist on the character draft (`bonusSkillRanks`) and count as real ranks on the sheet.

**Source Files**:
- CharacterDetail: `frontend/src/features/character/CharacterDetail.tsx`
- useCharacterDetailState: `frontend/src/features/character/useCharacterDetailState.ts`
- Detail Tab Components: `frontend/src/features/character/detail-tabs/*Tab.tsx`

**Related Documentation**:
- [Character Resolution System](character-resolution-system.md) - Backend resolution system
- [Frontend Patterns](../application-overview/frontend-patterns.md) - General frontend patterns

### **CharacterPage Component**

Container component for character detail views with tab navigation. This component follows the shared [Display Components](../application-overview/frontend-components.md#display-components) pattern.

**Character-Specific Features**:
- **Tab Navigation**: Navigate between different character aspects
- **Character Information**: Display character basic information and attributes
- **Tab Integration**: Integrate with specialized tab components for different character aspects
- **Character Actions**: Provide actions for character management

**User Workflow**:
1. **View Character**: See character basic information and navigation
2. **Navigate Tabs**: Switch between different character aspects
3. **Access Details**: View detailed information in each tab
4. **Take Actions**: Edit, delete, or manage character data

**Source File**: `frontend/src/features/character/CharacterPage.tsx`

## 🔧 **Tab Components**

### **AbilitiesRaceTab Component**

Comprehensive component for managing character abilities and race information.

**Character-Specific Features**:
- **Ability Score Management**: Display and edit character ability scores
- **Race Information**: Display character race information and features
- **Ability Calculations**: Show calculated ability modifiers and derived statistics
- **Race Features**: Display race-specific features and abilities

**User Workflow**:
1. **View Abilities**: See current ability scores and modifiers
2. **Edit Abilities**: Modify ability scores with validation
3. **View Race Info**: See race information and features
4. **Calculate Stats**: View calculated statistics and modifiers

**Source File**: `frontend/src/features/character/tabs/AbilitiesRaceTab.tsx`

### **SkillsTab Component**

Comprehensive component for managing character skills and skill points.

**Character-Specific Features**:
- **Skill Display**: Show all available skills with character ranks
- **Skill Point Management**: Manage skill point allocation and advancement
- **Class Skills**: Highlight class skills and cross-class skills
- **Skill Calculations**: Show calculated skill bonuses and modifiers

**User Workflow**:
1. **View Skills**: See all skills with current ranks and bonuses
2. **Allocate Points**: Spend skill points on skill advancement
3. **View Class Skills**: Identify class skills and cross-class skills
4. **Calculate Bonuses**: View calculated skill bonuses and modifiers

**Source File**: `frontend/src/features/character/tabs/SkillsTab.tsx`

### **FeatsTab Component**

Component for managing character feats and feat selection.

**Character-Specific Features**:
- **Feat Display**: Show character feats and available feats
- **Feat Selection**: Select and manage character feats
- **Feat Requirements**: Display feat prerequisites and requirements
- **Feat Effects**: Show feat effects and benefits

**User Workflow**:
1. **View Feats**: See current character feats
2. **Select Feats**: Choose new feats for the character
3. **Check Requirements**: Verify feat prerequisites are met
4. **View Effects**: See feat effects and benefits

**Source File**: `frontend/src/features/character/tabs/FeatsTab.tsx`

### **EquipmentTab Component**

Component for managing character equipment and items.

**Character-Specific Features**:
- **Equipment Display**: Show character equipment and items
- **Equipment Management**: Add, remove, and modify character equipment
- **Add for free**: Session-only checkbox on Available Items. Defaults on when `state.level > 1` (loot, import, or between-session updates) and off at level 1 (creation shopping). The tab remounts when selected, so the default follows the current level. The user can flip either way. Free adds skip gold and store `costInGp` 0; purchase mode deducts gold and stores the catalog cost. Return refunds only when this session stored `costInGp > 0`; otherwise it only removes the item (including items reloaded from the database, whose cost is null).
- **Currency**: Coins (cp/sp/gp/pp) and **Generate Starting Gold** on the first row; Gem, Art Object, and Other on the second. Generate only rolls starting coin. Valuable counts live on `state.money` and persist as quantity-only `CharacterWealth` rows (value and description null).
- **Pending — individual treasure**: Quantity buckets are a stopgap. Players are often awarded a mix of gems and art objects and must Appraise or sell them before learning a value, so the editor will need distinct rows such as “pearl 50 gp” vs “pearl 100 gp” using `CharacterWealth.description` and `CharacterWealth.value`. Do not treat two pearls of different values as the same stack.
- **Equipment Properties**: Manage equipment properties and enhancements
- **Equipment Effects**: Show equipment effects on character statistics

**User Workflow**:
1. **View Equipment**: See current character equipment
2. **Add Equipment**: Buy from the catalog (level 1 default) or add for free (level greater than 1 default)
3. **Modify Equipment**: Change equipment properties and enhancements
4. **View Effects**: See equipment effects on character

**Source File**: `frontend/src/features/character/tabs/EquipmentTab.tsx`

### **CombatTab Component**

Attack setup for the character sheet. Weapon options come from `state.equipment` (mapped to `CharacterItem` via `mapEquipmentToCharacterItems`), not `characterData.characterItems`. Adding a weapon in Equipment makes it available under Combat without Save.

Creating an attack that references an unsaved (negative-ID) item updates editor state and the character draft only. Attacks that reference persisted items still use the attack-definition REST endpoints. Character Save persists both collections and remaps temp item IDs so attack FKs stay valid.

An empty off-hand is a standard-action single attack. For one-handed melee, the modal offers **Wield two-handed** (`wieldTwoHanded`) to take 1.5× Strength damage. That flag is cleared when the off-hand is a weapon (full-attack two-weapon fighting).

**Source Files**:
- `frontend/src/features/character/tabs/CombatTab.tsx`
- `frontend/src/features/character/components/AttackDefinitionModal.tsx`
- `frontend/src/features/character/utils/equipmentUtils.ts`
- `frontend/src/features/character/utils/characterItemDraftSync.ts`

### **ClassTab Component**

Component for managing character class progression and advancement.

**Character-Specific Features**:
- **Class Display**: Show character classes and levels
- **Class Progression**: Manage character level advancement
- **Class Features**: Display class features and abilities
- **Multiclass Support**: Handle multiclass character progression
- **Gestalt Display**: When both primary and secondary classes are selected, renders `GestaltProgressionDisplay`. The combined table shows the better BAB and saves only. Each class that has spell slots or spells known gets its own spell table (formula entities or legacy `spellcastingProgression` / `spellsKnownProgression`). Non-casters (for example Fighter) have null progressions; those fields are treated as optional.

**User Workflow**:
1. **View Classes**: See current character classes and levels
2. **Advance Levels**: Progress character levels and gain class features
3. **View Features**: See class features and abilities
4. **Manage Multiclass**: Handle multiclass character progression

**Source Files**:
- `frontend/src/features/character/tabs/ClassTab.tsx`
- `frontend/src/features/character/GestaltProgressionDisplay.tsx`

### **ConfigurationTab Component**

Edition, advanced options, and source exclusions for the character being edited.

**Character-Specific Features**:
- **Edition**: Selects the ruleset. Advanced options come from `ADVANCED_OPTIONS_EDITION_MAP` in `shared/static-data/src/CommonData.ts`.
- **Max HP at 1st Level**: Shown for D&D 3.0, 3.5, and 3.0/3.5 combined. Default off. Synced to the character draft; when checked, save applies max HD + CON to the level-1 advancement (gestalt uses the better hit die). Unchecked leaves 1st-level HP as entered. Companions, familiars, and pets have a separate per-animal checkbox on the Animals & Pets editor (`CompanionEditorCard`) that maxes printed starting HD only.

**Source File**: `frontend/src/features/character/tabs/ConfigurationTab.tsx`

### **DescriptionTab Component**

Component for managing character description and background information.

**Character-Specific Features**:
- **Character Description**: Display and edit character description
- **Background Information**: Manage character background and history
- **Physical Description**: Edit character physical attributes
- **Notes Management**: Manage character notes and additional information

**User Workflow**:
1. **View Description**: See current character description
2. **Edit Description**: Modify character description and background
3. **Update Physical**: Change character physical attributes
4. **Manage Notes**: Add and edit character notes

**Source File**: `frontend/src/features/character/tabs/DescriptionTab.tsx`

### **SpellSelectionTab Component**

Component for managing character spell selection (known spells, spellbook spells, etc.).

**Character-Specific Features**:
- **Spell Display**: Show available spells for character's spellcasting classes
- **Spell Selection**: Add and remove spells from character's known spells or spellbook
- **Spellbook Management**: Manage spellbook spells for spellbook classes (Wizard, etc.)
- **Free Spell Grants**: Track and manage free spell grants for spellbook classes during level-up (not used for SpellsKnown classes)
- **Spells-Known Limits**: For `Class.spellsKnown` classes, enforce per-level caps from `resolvedData.spellSelection[classId].maxSpellsKnownByLevel` (derived from `SpellsKnownProgression` FeatureEntities)
- **Spell Validation**: Validate spell level and availability based on character advancement

**State Management Pattern**:
- Follows the standardized state → useEffect → API + refreshState pattern
- Updates `state.spellsKnown` via `updateState()` when spells are added/removed (stores which spells are known)
- CharacterEdit component automatically syncs state changes to backend using `syncSpellsKnown()` API
- Uses lodash/isEqual for deep comparison of spellsKnown array (same pattern as spellPreparations in CharacterDetail)
- Backend handles diffing and determines create/update/delete operations

**User Workflow**:
1. **View Spells**: See available spells for selected spellcasting class
2. **Select Spells**: Add spells to character's known spells or spellbook (SpellsKnown: Learn until per-level max; spellbook: free-grant / scribing flows)
3. **Remove Spells**: Remove spells from character's known spells or spellbook
4. **Track Free Grants**: View and manage free spell grants for spellbook classes only
5. **Validate Selection**: System validates spell level, availability, and (for SpellsKnown) max known per level

**Source File**: `frontend/src/features/character/tabs/SpellSelectionTab.tsx`
**Related Documentation**: [Spell Scribing Feature](./spell-scribing.md)

## 🔌 **API Integration**

### **CharacterQueryHooks**

Query hooks + imperative methods for character management backend communication.

**Purpose**: Provides type-safe API communication for all character operations.

**Key Features**:
- **Type Safety**: Full TypeScript integration with Zod validation
- **Error Handling**: Comprehensive error handling and validation
- **CRUD Operations**: Complete CRUD operations for characters
- **Detail Operations**: Advanced character data retrieval
- **Response Validation**: Automatic response validation

**API Endpoints**:
- **GET /api/characters**: Retrieve all characters for user
- **GET /api/characters/:id**: Retrieve specific character by ID
- **GET /api/characters/:id/details**: Retrieve character with all details
- **POST /api/characters**: Create new character
- **PUT /api/characters/:id**: Update existing character
- **DELETE /api/characters/:id**: Delete character

**Source Files**: `frontend/src/features/character/CharacterQueryHooks.ts`, `frontend/src/features/character/CharacterDetailQueryHooks.ts`

## 🎨 **User Interface Patterns**

### **Tab-Based Organization**

The character editing interface uses tab-based organization to handle complex character data:

**Basic Information**: Character name, race, alignment, and core attributes
**Abilities and Race**: Character ability scores and race information
**Skills**: Character skills and skill point allocation
**Feats**: Character feats and feat selection
**Equipment**: Character equipment and items
**Class Progression**: Character class advancement and features
**Description**: Character description and background

### **Form Validation**

Comprehensive form validation using Zod schemas:

**Real-time Validation**: Validate fields as users type
**Error Display**: Clear, user-friendly error messages
**Field-specific Validation**: Specific validation rules for each field type
**Cross-field Validation**: Validation that depends on multiple fields

### **State Management**

Proper state management for complex character data:

**Form State**: Manage form data and validation state
**Loading States**: Handle loading states for API operations
**Error States**: Manage error states and error messages
**Navigation State**: Handle navigation between tabs and views

## 🔗 **Integration Patterns**

### **Class System Integration**

The character management system integrates with the class system through character advancement:

**Class Progression**: Characters advance in classes through the advancement system
**Class Features**: Character feature choices integrate with class feature systems
**Spellcasting**: Character spell preparation integrates with class spellcasting
**Proficiency Management**: Character proficiencies integrate with class proficiency systems

**Related Documentation**: [Class System Frontend Components](../class-system/frontend-components.md)

### **Race System Integration**

The character management system integrates with the race system through character creation:

**Race Selection**: Characters are created with specific races
**Race Features**: Character features integrate with race feature systems
**Ability Modifiers**: Race ability modifiers integrate with character ability scores
**Proficiency Grants**: Race proficiency grants integrate with character proficiencies

**Related Documentation**: [Race System Frontend Components](../race-system/frontend-components.md)

### **Feature System Integration**

The character management system integrates with the feature system through character advancement:

**Feature Progression**: Character feature choices integrate with feature progression systems
**Feature Selection**: Character feature choices integrate with feature choice systems
**Feature Effects**: Character feature effects integrate with feature effect systems

**Related Documentation**: [Feature System Frontend Components](../feature-system/frontend-components.md)

### **Spell System Integration**

The character management system integrates with the spell system through character spell preparation:

**Spell Selection**: Character spell preparation integrates with spell selection systems
**Spell Casting**: Character spell casting integrates with spell casting systems
**Metamagic Integration**: Character metamagic integrates with spell metamagic systems

**Related Documentation**: [Spell System Frontend Components](../spell-system/frontend-components.md)

### **Equipment System Integration**

The character management system integrates with the equipment system through character equipment:

**Equipment Selection**: Character equipment integrates with equipment selection systems
**Equipment Usage**: Character equipment usage integrates with equipment usage systems
**Equipment Effects**: Character equipment effects integrate with equipment effect systems

**Related Documentation**: [Equipment System Frontend Components](../equipment-system/frontend-components.md)

## 🔧 **Utility Functions**

### **Character Columns**

Column definitions for character list displays.

**Purpose**: Define column configurations for character list displays.

**Key Features**:
- **Sortable Columns**: All columns are sortable
- **Filterable Columns**: Most columns support filtering
- **Custom Rendering**: Custom cell rendering for complex data
- **Responsive Design**: Columns adapt to different screen sizes

**Source File**: `frontend/src/features/character/CharacterColumns.ts`

### **Analog Skill Service**

Service for calculating character analog skills and derived statistics.

**Purpose**: Provide utility functions for character skill calculations, formatting, and data manipulation.

**Key Features**:
- **Skill Calculations**: Calculate character skill bonuses and modifiers
- **Ability Calculations**: Calculate ability score modifiers and derived statistics
- **Validation Helpers**: Helper functions for character validation
- **Data Transformation**: Transform character data between formats

**Source File**: `frontend/src/features/character/AnalogSkillService.ts`

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Character management database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Character management validation rules and schemas
- **[Static Data](static-data.md)** - Character management enums and types
- **[Backend Implementation](backend-implementation.md)** - Character management backend implementation
- **[Class System Frontend Components](../class-system/frontend-components.md)** - Class system integration
- **[Race System Frontend Components](../race-system/frontend-components.md)** - Race system integration
- **[Feature System Frontend Components](../feature-system/frontend-components.md)** - Feature system integration
- **[Spell System Frontend Components](../spell-system/frontend-components.md)** - Spell system integration
- **[Equipment System Frontend Components](../equipment-system/frontend-components.md)** - Equipment system integration
- **[Frontend Component Patterns](../application-overview/frontend-components.md)** - Shared frontend patterns and conventions

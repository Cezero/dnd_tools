# CharacterDetail Component

*Complete documentation for the CharacterDetail component, an in-game character interaction page for viewing and tracking character state during gameplay.*

## 📋 **Overview**

The CharacterDetail component provides an in-game character interaction interface where players can view calculated character values, track resource usage (spells, feature uses, wounds), and manage equipment during gameplay. Unlike the CharacterEdit component which is used for character creation and advancement, CharacterDetail is designed for active gameplay tracking.

**Source Files**:
- Frontend: `apps/frontend/src/features/character/CharacterDetail.tsx`
- Tabs: `apps/frontend/src/features/character/detail-tabs/`

## 🎯 **Purpose and Architecture**

### **Purpose**
- **Read-Only Values**: Display calculated character statistics (abilities, saves, AC, attacks, etc.)
- **Editable Tracking**: Allow players to track mutable game state (wounds, spell casts, feature uses, equipment)
- **Gameplay Interface**: Provide quick access to character information during gameplay
- **Dice Integration**: Enable quick dice rolls for abilities, saves, attacks, and skills

### **Architecture**
The component uses a tabbed interface with shared character data:

```
CharacterDetail
├── OverviewTab (Character stats, abilities, saves, HP, AC, attacks)
├── SkillsTab (Skill list with modifiers and dice buttons)
├── SpellsTab (Spell lists, preparation, cast tracking)
├── FeaturesTab (Features, feats, proficiencies)
├── EquipmentTab (Money, items, equipped items by slot)
└── NotesTab (Editable character notes)
```

### **Key Features**
- **Tooltips**: Breakdown tooltips showing calculation details for all values
- **Dice Rolling**: Integrated dice buttons for ability checks, saves, attacks, and skills
- **Spell Preparation**: Interactive spell preparation and cast tracking
- **Equipment Management**: Money editing, item management, equipped items by slot
- **Uses Tracking**: Feature uses tracking with reset functionality
- **Wounds Tracking**: HP and wounds management with visual indicators

## 📊 **Component Structure**

### **Main Component**
The `CharacterDetail` component (`apps/frontend/src/features/character/CharacterDetail.tsx`) serves as the container for all tabs:

- **Character Data Loading**: Uses `CharacterQueryHooks.useGetCharacterWithAllDetails` to load character data
- **Resolved Data (display only)**: Uses `CharacterQueryHooks.useGetCharacterResolved` (GET /characters/:id/resolve) for display (formatting, export). Does **not** use `useCharacterResolution` or `startEditing`; no edit locks or drafts are created when viewing.
- **Class Details**: Loads class details for spellcasting and other class-specific features
- **Tab Navigation**: Manages active tab state and renders appropriate tab component
- **Reset Functionality**: Provides "Reset Daily Uses" menu option that resets both feature uses and spell cast status

### **View vs Edit**
- **CharacterDetail** (view at `/characters/:id`): Uses read-only `GET /characters/:id/resolve` for display. Does **not** acquire edit locks or create drafts. View-mode edits (wounds, spell preparation) use discrete endpoints (`CharacterDetailApi.updateWounds`, `syncSpellPreparations`, etc.) that persist to the database on each call.
- **CharacterEdit** (edit at `/characters/:id/edit`): Uses `useCharacterResolution` and `startEditing`; acquires locks and creates drafts for structured editing.

### **View-Mode Edits (target architecture; future work)**
View has limited edit capability (wounds, spell preparation) with **no locks** and **no resolved character in (draft) state**. Target: frontend subscribes to WebSocket pub/sub for the character; calls `updateValue(path, value)` (e.g. `'wounds'`, `'spellPreparations.0.timesCast'`). Backend: in a viewing context (no draft), persist to DB on **every** `updateValue` and publish via WebSocket to subscribers (solo viewer today; in a game session, all players and DM). **Future game session:** changes go to **shared state in Redis**; persisted to DB only when the **DM saves the game session**. Current implementation uses discrete endpoints; migration to `updateValue`+WebSocket is planned.

### **Query Hooks and Path Parameters**
For `createQueryHooks` with `paramsSchema` and no `requestSchema`, callers pass `{ pathParams }` and the factory forwards `pathParams` as the single argument to `typedApi`. See [Query Hooks and Caching](../../application-overview/query-hooks-and-caching.md#path-parameters-when-no-requestschema).

### **Tab Components**
Each tab is a separate component in `apps/frontend/src/features/character/detail-tabs/`:

- **OverviewTab**: Character overview with abilities, saves, HP, AC, attacks
- **SkillsTab**: Skill list with modifiers, conditional modifiers, and dice buttons
- **SpellsTab**: Spell lists with preparation interface and cast tracking
- **FeaturesTab**: Features, feats, and proficiencies grouped by level
- **EquipmentTab**: Money editing, item lists, and equipped items by slot
- **NotesTab**: Editable notes field with character counter

## 🎨 **Tab Details**

### **Overview Tab**

**Purpose**: Display comprehensive character overview including core statistics and combat values.

**Features**:
- **Character Information**: Name, race, class, level, alignment, deity, physical description
- **Ability Scores**: All 6 abilities with scores, modifiers, and dice buttons
- **Saving Throws**: Fortitude, Reflex, Will with breakdown tooltips and dice buttons
- **HP and Wounds**: Maximum HP, editable wounds input, current HP with color coding
- **Armor Class**: Total AC with breakdown tooltip
- **Speed**: Movement speed display
- **Initiative**: Initiative modifier with breakdown tooltip and dice button
- **Grapple, Melee, Ranged**: Base attack bonuses for different attack types
- **Attacks**: List of all attacks with:
  - Attack bonus with breakdown tooltip
  - Damage with breakdown tooltip
  - Critical threat range
  - Range, weight, type, size
  - Dice buttons for attack rolls and damage

**Source File**: `apps/frontend/src/features/character/detail-tabs/OverviewTab.tsx`

**Key Implementation Details**:
- Uses `FormattedCharacterResult` from `CharacterSheetDisplayStrategy` for all calculated values
- `ValueTooltip` components display breakdown information for all values
- `DiceButton` components enable quick dice rolls
- Wounds are editable and sync with backend via `CharacterDetailApi.updateWounds`
- HP color coding: red (dying/disabled), orange (≤25%), yellow (≤50%), green (>50%)

### **Skills Tab**

**Purpose**: Display all character skills with modifiers, conditional modifiers, and dice rolling capability.

**Features**:
- **Skill List**: All skills with:
  - Total modifier with breakdown tooltip
  - Ability modifier
  - Ranks
  - Misc bonuses
  - Class skill indicator
  - Dice button for skill checks
- **Conditional Modifiers**: Display conditional modifiers when applicable
- **Scrollable List**: Uses `ScrollableCategorizedList` for efficient display of many skills

**Source File**: `apps/frontend/src/features/character/detail-tabs/SkillsTab.tsx`

**Key Implementation Details**:
- Skills are formatted using `CharacterSheetDisplayStrategy`
- Each skill has a `CalculationBreakdown` for tooltip display
- Conditional modifiers are shown when they apply
- Dice buttons use skill check notation (e.g., "1d20+5")

### **Spells Tab**

**Purpose**: Display spell lists with preparation interface and cast tracking for both prepared and known casters.

**Features**:
- **Class Selection**: Dropdown to select spellcasting class (if character has multiple)
- **Caster Information**: 
  - Caster level
  - Spell save DC (base + spell level)
  - Casting ability modifier
  - Spells per day grid (0-9th level)
  - Spell ranges (Close, Medium, Long)
- **Spell Lists**: 
  - Regular spells grouped by level
  - Domain spells grouped by domain and level
  - Spell information: name, school, range, save DC, description, reference
- **Preparation Interface** (Prepared Casters Only):
  - "Prep" column with number input to set preparation quantity
  - Only shown for classes where `spellsKnown === false`
- **Cast Tracking** (All Casters):
  - "Cast" column showing `timesCast / quantity` (prepared) or `timesCast / maxSlotsPerLevel` (known)
  - Increment/decrement buttons to track spell casts
  - Visual indicator (red text) when all spells are cast
  - For prepared casters: buttons disabled when `quantity === 0`
  - For known casters: creates `CharacterSpellPreparation` entries on-the-fly when casting

**Source File**: `apps/frontend/src/features/character/detail-tabs/SpellsTab.tsx`

**Key Implementation Details**:
- Fetches spell preparations using `CharacterDetailApi.getSpellPreparations`
- Stores preparations in a `Map` keyed by `${classId}-${spellId}-${spellLevel}` for efficient lookup
- Uses mutations for create/update/delete spell preparations with 500ms debouncing
- Uses mutations for cast/uncast with immediate invalidation
- For known casters: `quantity` is set to `maxSlotsPerLevel` when creating preparations
- Spell ranges are calculated based on caster level
- Spell save DC is calculated as `baseSpellSaveDC + spell level`

**Caster Type Distinction**:
- **Prepared Casters** (`spellsKnown === false`): Must prepare spells in advance, track both `quantity` (prepared) and `timesCast` (cast)
- **Known Casters** (`spellsKnown === true`): Can cast any spell they know, only track `timesCast` per spell level per day

### **Features & Feats Tab**

**Purpose**: Display character features, feats, and proficiencies grouped by level.

**Features**:
- **Features**: All character features with breakdown tooltips
- **Feats**: All character feats with breakdown tooltips
- **Proficiencies**: All character proficiencies with breakdown tooltips
- **Uses Tracking**: Feature uses displayed with current/max and increment/decrement buttons
- **Grouping**: Features grouped by character level
- **Scrollable List**: Uses `ScrollableCategorizedList` for efficient display

**Source File**: `apps/frontend/src/features/character/detail-tabs/FeaturesTab.tsx`

**Key Implementation Details**:
- Fetches feature uses using `CharacterDetailApi.getCharacterUses`
- Uses mutations for updating feature uses
- Features are formatted using `CharacterSheetDisplayStrategy`
- Uses are displayed with frequency information (PER_DAY, PER_WEEK, etc.)

### **Equipment Tab**

**Purpose**: Manage character money, items, and equipped items by slot.

**Features**:
- **Money Editing**: Editable money fields (platinum, gold, silver, copper)
- **Item Lists**: 
  - All character items with quantity, location, and actions
  - Add item functionality
  - Remove item functionality
- **Equipped Items**: Items organized by equipment slot
- **Location Management**: Track item locations (backpack, belt, etc.)

**Source File**: `apps/frontend/src/features/character/detail-tabs/EquipmentTab.tsx`

**Key Implementation Details**:
- Money is editable and syncs with backend via `CharacterDetailApi.updateMoney`
- Items can be added via `CharacterDetailApi.addItem`
- Items can be removed via `CharacterDetailApi.removeItem`
- Equipment slots are displayed with equipped items

### **Notes Tab**

**Purpose**: Editable character notes field for player annotations.

**Features**:
- **Notes Field**: Large textarea for character notes
- **Character Counter**: Displays character count (10,000 character limit)
- **Auto-Save**: Notes are saved automatically on change

**Source File**: `apps/frontend/src/features/character/detail-tabs/NotesTab.tsx`

**Key Implementation Details**:
- Notes are editable and sync with backend via `CharacterDetailApi.updateNotes`
- Character limit is enforced (10,000 characters)
- Notes are stored in `UserCharacter.notes` field (Text field in database)

## 🔧 **API Integration**

### **CharacterDetailApi**

The `CharacterDetailApi` (`apps/frontend/src/features/character/CharacterDetailApi.ts`) provides type-safe API methods for all CharacterDetail operations:

**Uses Tracking**:
- `getCharacterUses(characterId)`: Get all feature uses for character
- `updateFeatureUses(characterId, featureId, entityId, delta)`: Update feature uses
- `resetDailyUses(characterId)`: Reset daily uses (PER_DAY frequency)
- `resetAllUses(characterId)`: Reset all uses

**Money**:
- `updateMoney(characterId, money)`: Update character money

**Items**:
- `addItem(characterId, item)`: Add item to character
- `removeItem(characterId, itemId)`: Remove item from character

**Wounds**:
- `updateWounds(characterId, wounds)`: Update wounds/nonlethal damage

**Notes**:
- `updateNotes(characterId, notes)`: Update character notes

**Spell Preparations**:
- `getSpellPreparations(characterId)`: Get all spell preparations
- `createSpellPreparation(data)`: Create new spell preparation
- `updateSpellPreparation(characterId, prepKey, data)`: Update spell preparation
- `deleteSpellPreparation(characterId, prepKey)`: Delete spell preparation
- `castSpell(characterId, prepKey)`: Increment spell cast count
- `uncastSpell(characterId, prepKey)`: Decrement spell cast count
- `resetDailySpellPreparations(characterId)`: Reset all spell cast counts to 0

## 🎲 **Dice Integration**

All tabs that display numeric values include dice buttons for quick rolling:

- **Ability Checks**: `1d20+modifier` (e.g., "1d20+3")
- **Saving Throws**: `1d20+total` (e.g., "1d20+5")
- **Attacks**: `1d20+attackBonus` (e.g., "1d20+8")
- **Damage**: Dice notation from damage string (e.g., "1d8+3")
- **Skills**: `1d20+total` (e.g., "1d20+7")
- **Initiative**: `1d20+modifier` (e.g., "1d20+2")

Dice buttons use the `DiceButton` component which integrates with the dice box system.

## 📝 **Spell Preparation System**

### **Prepared Casters**

For classes that prepare spells (Wizard, Cleric, Druid, etc.):

1. **Preparation**: Players set the `quantity` of spells to prepare using the "Prep" column
2. **Cast Tracking**: Players track casts using the "Cast" column showing `timesCast / quantity`
3. **Constraints**: 
   - Cast buttons are disabled when `quantity === 0`
   - Users can only cast spells that have been prepared
   - Cast count cannot exceed preparation quantity

### **Known Casters**

For classes that know spells (Sorcerer, Bard, etc.):

1. **No Preparation**: No "Prep" column is shown
2. **Cast Tracking**: Players track casts using the "Cast" column showing `timesCast / maxSlotsPerLevel`
3. **On-the-Fly Creation**: `CharacterSpellPreparation` entries are created automatically when casting
4. **Shared Limit**: All spells at the same level share the same daily limit (`maxSlotsPerLevel`)

### **Reset Daily Uses**

The "Reset Daily Uses" menu option in CharacterDetail:
1. Calls `resetDailySpellPreparations` to set all `timesCast = 0`
2. Calls `resetDailyUses` to reset feature uses with PER_DAY frequency
3. Invalidates queries to refresh all displayed data

## 🔍 **Tooltip System**

All calculated values in CharacterDetail display breakdown tooltips using the `ValueTooltip` component:

- **Attack Breakdown**: Shows BAB, ability modifier, proficiency, penalties, feat bonuses, feature bonuses, item bonuses
- **Damage Breakdown**: Shows base damage dice, ability modifier, feat bonuses
- **Saving Throw Breakdown**: Shows base save, ability modifier, misc bonuses
- **Skill Breakdown**: Shows ability modifier, ranks, misc bonuses, conditional modifiers
- **AC Breakdown**: Shows base AC, armor, shield, DEX, size, natural, deflection, misc
- **Ability Modifier Breakdown**: Shows base score, racial bonuses, item bonuses

Breakdowns are generated by `CharacterSheetDisplayStrategy` and converted from calculation breakdowns to `CalculationBreakdown` format for display.

## 🎨 **UI Patterns**

### **Color Coding**
- **HP**: Color-coded based on current HP percentage (red for dying/disabled, orange for ≤25%, yellow for ≤50%, green for >50%)
- **Spell Casts**: Red text when all spells are cast (`timesCast === quantity` or `timesCast === maxSlotsPerLevel`)

### **Loading States**
- All mutations show loading states during API calls
- Buttons are disabled during mutations to prevent duplicate requests

### **Error Handling**
- Toast notifications for all API errors
- Error messages are user-friendly and descriptive
- Failed mutations revert to previous state when possible

## 📚 **Related Documentation**

- **[Character Management System](README.md)** — Overall character management system
- **[Database Schema](database-schema.md)** — Character database models
- **[Backend Implementation](backend-implementation.md)** — Character API endpoints
- **[Frontend Components](frontend-components.md)** — Character UI components
- **[Spell Scribing](spell-scribing.md)** — Spell management system
- **[Attack Calculation](attack-calculation.md)** — Attack calculation system

## Summary

The CharacterDetail component provides a comprehensive in-game character interaction interface for viewing calculated character statistics and tracking mutable game state. The component supports both prepared and known spellcasters, provides detailed breakdown tooltips for all calculated values, and integrates dice rolling for quick gameplay actions.

The implementation demonstrates excellent separation of concerns with tab-based architecture, type-safe API integration, and comprehensive error handling.

# Spell Scribing Feature

*Complete documentation for the spell scribing feature, including spellbook classes, free grants, ad-hoc scribing, and integration with the character resolution system.*

## 📋 **Overview**

The spell scribing feature provides comprehensive spell management for spellbook-using classes (e.g., Wizard) and spellsKnown classes (e.g., Sorcerer, Bard). It supports free spell grants during level-up, ad-hoc scribing from scrolls or found spellbooks, and feature-based 0th level spell grants.

**Key Features**:
- Free spell grant calculation from resolved progressions
- Formula-based spell grants (ability-based, static per level)
- Feature-based 0th level spell grants for spellbook classes
- Ad-hoc scribing with spell level validation
- Integration with character resolution sessions
- Frontend-backend state synchronization

**Source Files**:
- Backend Service: `apps/backend/src/features/character/characterService.ts`
- Backend Resolution: `apps/backend/src/features/characterResolution/resolvedFeatureService.ts`
- Frontend Component: `apps/frontend/src/features/character/tabs/SpellSelectionTab.tsx`
- Frontend Utilities: `apps/frontend/src/features/character/utils/spellbookUtils.ts`
- Frontend Hook: `apps/frontend/src/features/character/useCharacterResolution.ts`

## 🏗️ **Spellbook Classes vs SpellsKnown Classes**

### **Spellbook Classes** (e.g., Wizard)

**Characteristics**:
- Use `EntityAppliesToType.SpellbookSpell` in resolved progressions
- Spells are tracked in `AdvancementSpell` with `isFreeGrant` flag
- Free grants are calculated from resolved progressions using formulas
- Can scribe additional spells ad-hoc (from scrolls, found spellbooks)
- 0th level spells are granted via feature system (no database records)
- No hard limit on total spells in spellbook (only free grant limits during level-up)

**Detection**:
- Backend: Checks for `EntityType.Choice` + `EntityAppliesToType.SpellbookSpell` in resolved progressions
- Frontend: Uses `hasSpellbook()` utility function

**Source Files**:
- Backend: `apps/backend/src/features/character/characterService.ts` (`getAvailableSpellsForClass`)
- Frontend: `apps/frontend/src/features/character/utils/spellbookUtils.ts` (`hasSpellbook`)

### **SpellsKnown Classes** (e.g., Sorcerer, Bard)

**Characteristics**:
- Caps come from `EntityType.Base` + `EntityAppliesToType.SpellsKnownProgression` FeatureEntities (formula per spell level)
- Resolution exposes `ClassSpellSelection.maxSpellsKnownByLevel` (`spellLevel` string keys → max known)
- `SpellSelectionTab` enforces Learn/Forget against those resolved limits
- Spells are tracked in `AdvancementSpell` / `state.spellsKnown` (which spells are known—not the max table)
- **No free-grant concept**: free grants (`SpellbookSpell` / `isFreeGrant`) apply only to spellbook/prepared casters
- 0th level spells are selected and stored in `AdvancementSpell` records (unlike spellbook cantrips)

**Detection / UI mode**:
- Backend and frontend still use `Class.spellsKnown === true` to choose SpellsKnown vs spellbook UI
- Runtime max-known enforcement uses `maxSpellsKnownByLevel`, not legacy `spellsKnownProgression` tables
- Authoring may still persist progression tables on class edit drafts; display and character limits are feature-entity-driven

**Source Files**:
- Backend: `apps/backend/src/features/characterResolution/resolvedFeatureService.ts` (`getSpellsKnownByLevelFromFeaturesForClass`)
- Backend: `apps/backend/src/features/characterResolution/characterResolutionController.ts` (`calculateSpellSelection`)
- Schema: `packages/shared/schema/src/character.ts` (`ClassSpellSelectionSchema.maxSpellsKnownByLevel`)
- Frontend: `apps/frontend/src/features/character/tabs/SpellSelectionTab.tsx`

## 💰 **Free Grant System**

### **Calculation from Resolved Progressions**

Free spell grants for spellbook classes are calculated from resolved feature progressions using `ResolvedFeatureService.getAvailableSpellbookSpells()`.

**Process**:
1. Iterate through all resolved progressions
2. Filter by classId if progression is class-specific
3. Filter by level (only progressions active at or before character level)
4. Find entities with `EntityType.Choice` and `EntityAppliesToType.SpellbookSpell`
5. Calculate value for each entity using formulas or static values
6. Sum all entity values to get total available free spells

**Source Files**:
- Backend: `apps/backend/src/features/characterResolution/resolvedFeatureService.ts` (`getAvailableSpellbookSpells`)
- Frontend: `apps/frontend/src/features/character/utils/spellbookUtils.ts` (`getAvailableSpellbookSpells`)

### **Formula Types**

#### **ABILITY_BASED Formula**

**Purpose**: Base value + ability modifier (e.g., "3 + INT" for 1st level wizard)

**Example**:
- Wizard 1st level: Base 3 + INT modifier (+3) = 6 free spells
- Collegiate Wizard feat: Additional 3 + INT modifier = 6 additional spells
- Total at 1st level: 12 free spells

**Parameters**:
- `baseValue`: Base number of spells (e.g., 3)
- `abilityId`: Ability to use for modifier (e.g., Intelligence)
- `formulaStartLevel`: Level at which formula starts applying (default: progression level)

**Source Files**:
- Formula Definition: `packages/shared/static-data/src/FeatureData.ts` (`FORMULA_MAP`)
- Calculation: `apps/backend/src/features/characterResolution/resolvedFeatureService.ts`

#### **STATIC_EVERY_N_LEVELS Formula**

**Purpose**: Fixed value every N levels (e.g., "2 spells per level" from 2nd level onward)

**Example**:
- Wizard 2nd level: 2 spells
- Wizard 3rd level: 2 spells (total: 4 from 2nd-3rd)
- Collegiate Wizard feat: Additional 2 spells per level
- Total at 3rd level: 6 (1st) + 4 (2nd-3rd) + 4 (feat 2nd-3rd) = 14 free spells

**Parameters**:
- `scalingValue`: Value to grant (e.g., 2)
- `interval`: Every N levels (e.g., 1 for every level)
- `formulaStartLevel`: Level at which formula starts applying (e.g., 2)

**Source Files**:
- Formula Definition: `packages/shared/static-data/src/FeatureData.ts` (`FORMULA_MAP`)
- Calculation: `apps/backend/src/features/characterResolution/resolvedFeatureService.ts`

### **Per-Level Grant Tracking**

**Important**: Free grants from a specific level can only be used for spells castable at that level.

**Example**:
- 1st level wizard: Can only use 1st-level free grants for 1st-level spells
- 3rd level wizard: Can use 1st-level grants for 1st-level spells, 2nd-3rd level grants for 1st or 2nd-level spells
- Cannot "save" 1st-level grants to use for 2nd-level spells at 3rd level

**Validation**:
- Backend: `characterService.validateSpellLevelForAdvancement()` checks spell level against advancement level
- Frontend: `canScribeSpellAtLevel()` utility function

**Source Files**:
- Backend: `apps/backend/src/features/character/characterService.ts` (`validateSpellLevelForAdvancement`)
- Frontend: `apps/frontend/src/features/character/utils/spellbookUtils.ts` (`canScribeSpellAtLevel`)

## 🎯 **0th Level Spell Grants**

### **Feature-Based Approach**

For spellbook classes, 0th level spells are granted via the feature system, similar to how proficiencies are handled. No `AdvancementSpell` records are created for 0th level spells.

**Detection**:
- Entity: `EntityType.Other` + `EntityAppliesToType.SpellbookSpell`
- Parameters: `appliesToId: 0` (0th level) and `appliesToSubId: -1` (all spells)
- Class-specific or general: Can be class-specific or general (applies to all spellbook classes)

**Usage**:
- Backend: `ResolvedFeatureService.hasZeroLevelSpellbookSpellsGrant()` checks for grant feature
- Frontend: `hasZeroLevelSpellbookSpellsGrant()` utility function
- Display: 0th level spells are marked as "known" if grant feature exists

**Sourcebook Restrictions**:
- 0th level spells are subject to sourcebook restrictions (like other spell selections)
- Filtered by character's disallowed sourcebooks

**Source Files**:
- Backend: `apps/backend/src/features/characterResolution/resolvedFeatureService.ts` (`hasZeroLevelSpellbookSpellsGrant`)
- Frontend: `apps/frontend/src/features/character/utils/spellbookUtils.ts` (`hasZeroLevelSpellbookSpellsGrant`)

### **Non-Spellbook Classes**

For spellsKnown classes (Sorcerer, Bard), 0th level spells are selected and stored in `AdvancementSpell` records, just like other spell levels. The feature-based approach only applies to spellbook classes.

## 📝 **Ad-Hoc Scribing**

### **No Quantity Limits**

Ad-hoc scribing (`isFreeGrant: false`) has no quantity restrictions. A character can scribe as many spells as they find, subject to:
- Spell level validation (must be castable at advancement level)
- Sourcebook restrictions
- Gold and time costs (future enhancement)

### **Spell Level Validation**

Even for ad-hoc scribing, spell level validation applies:
- A 1st-level wizard cannot scribe a 3rd-level spell, even if they find a scroll
- Validation uses `getMaxCastableSpellLevel()` to determine maximum castable level
- A character must wait until they can cast a spell level before scribing it

**Source Files**:
- Backend: `apps/backend/src/features/character/characterService.ts` (`getMaxCastableSpellLevel`, `validateSpellLevelForAdvancement`)
- Frontend: `apps/frontend/src/features/character/utils/spellbookUtils.ts` (`getMaxCastableSpellLevel`)

### **isFreeGrant Flag**

The `isFreeGrant` flag in `AdvancementSpell` distinguishes between:
- **Free grants** (`isFreeGrant: true`): Spells granted for free during level-up, subject to quantity limits
- **Ad-hoc scribing** (`isFreeGrant: false`): Spells scribed from scrolls or found spellbooks, no quantity limits

**Database Schema**:
- Field: `AdvancementSpell.isFreeGrant` (Boolean, default: false)
- Relationship: Links to `CharacterAdvancement` via `advancementId`

**Source Files**:
- Schema: `apps/backend/prisma/schema.prisma` (`AdvancementSpell` model)
- Validation: `apps/backend/src/features/character/characterService.ts` (`addSpellKnown`)

## ✅ **Validation Rules**

### **Spell Level Restrictions**

**Applies to**: Both free grants and ad-hoc scribing

**Rule**: A character can only scribe spells up to the maximum castable spell level at their advancement level.

**Example**:
- 1st-level wizard: Can only scribe 1st-level spells
- 3rd-level wizard: Can scribe 1st or 2nd-level spells
- 5th-level wizard: Can scribe 1st, 2nd, or 3rd-level spells

**Validation**:
- Backend: `characterService.validateSpellLevelForAdvancement()` checks spell level against advancement level
- Frontend: `canScribeSpellAtLevel()` utility function

**Source Files**:
- Backend: `apps/backend/src/features/character/characterService.ts` (`validateSpellLevelForAdvancement`)
- Frontend: `apps/frontend/src/features/character/utils/spellbookUtils.ts` (`canScribeSpellAtLevel`)

### **Free Grant Quantity Limits**

**Applies to**: Free grants only (`isFreeGrant: true`), during level-up mode

**Rule**: A character cannot exceed their available free spell grants when adding spells during level-up.

**Calculation**:
- Total available: `ResolvedFeatureService.getAvailableSpellbookSpells()` (from resolved progressions)
- Used: Count of `AdvancementSpell` records with `isFreeGrant: true` for the advancement
- Remaining: Available - Used

**Validation**:
- Backend: `characterService.addSpellKnown()` validates quantity limit when `isFreeGrant: true`
- Frontend: `SpellSelectionTab` disables spell selection when `remainingFreeSpells <= 0`

**Source Files**:
- Backend: `apps/backend/src/features/character/characterService.ts` (`addSpellKnown`, `countFreeGrantsForAdvancement`)
- Frontend: `apps/frontend/src/features/character/tabs/SpellSelectionTab.tsx`

### **Sourcebook Restrictions**

**Applies to**: All spell selections (free grants and ad-hoc)

**Rule**: Spells from disallowed sourcebooks cannot be selected or scribed.

**Implementation**:
- Character's disallowed sourcebooks are stored in `CharacterEditState.disallowedSources`
- Spells are filtered by `SpellSourceMap` relationships
- Applied in `characterService.getAvailableSpellsForClass()`

**Source Files**:
- Backend: `apps/backend/src/features/character/characterService.ts` (`getAvailableSpellsForClass`)

## 💾 **Database Schema**

### **AdvancementSpell Model**

**Fields**:
- `id` (Int, Primary Key) - Unique identifier
- `advancementId` (Int, Foreign Key) - Reference to `CharacterAdvancement`
- `spellId` (Int, Foreign Key) - Reference to `Spell`
- `isFreeGrant` (Boolean, default: false) - Whether this is a free grant or ad-hoc scribing

**Relationships**:
- `advancement` - Many-to-one with `CharacterAdvancement`
- `spell` - Many-to-one with `Spell`

**Constraints**:
- Unique: `@@unique([advancementId, spellId])` - A spell can only be added once per advancement
- Foreign Keys: Cascade delete when advancement or spell is deleted

**Source File**: `apps/backend/prisma/schema.prisma` (`AdvancementSpell` model)

**Related Documentation**: [Character Management Database Schema](./database-schema.md)

## 🔗 **Integration with Character Resolution**

### **Session Updates**

When a spell is added or removed, the character resolution session is automatically updated:

1. **Backend Process**:
   - Spell is added/removed from database
   - Active resolution session is checked
   - If session exists:
     - Character state is rebuilt from updated character
     - Features are re-resolved using `CharacterResolutionService.resolveCharacterFeatures()`
     - Session is updated with new character state and resolved result
     - Updated `ResolvedCharacterResult` is included in response

2. **Frontend Process**:
   - Receives response with `resolvedCharacter` field
   - Updates resolution hook state using `useCharacterResolution.updateResolvedCharacter()`
   - CharacterEdit re-renders with fresh resolved data

**Source Files**:
- Backend: `apps/backend/src/features/character/characterService.ts` (`addSpellKnown`, `removeSpellKnown`)
- Backend: `apps/backend/src/features/characterResolution/characterSessionService.ts` (`updateSession`)
- Frontend: `apps/frontend/src/features/character/tabs/SpellSelectionTab.tsx` (`handleLearnSpell`, `handleRemoveSpell`)
- Frontend: `apps/frontend/src/features/character/useCharacterResolution.ts` (`updateResolvedCharacter`)

**Related Documentation**: [Character Resolution System](./character-resolution-system.md)

### **Response Data Synchronization**

**AddSpellKnownResponse** and **RemoveSpellKnownResponse** include:
- `freeSpellsUsed` - Count of free grants used (for spellbook classes)
- `availableFreeSpells` - Total free spells available at the advancement level
- `remainingFreeSpells` - Remaining free spells that can be granted
- `resolvedCharacter` (optional) - Complete resolution result after the spell operation

The `resolvedCharacter` field is only included when an active resolution session exists.

**Source Files**:
- Schema: `packages/shared/schema/src/spell.ts` (`AddSpellKnownResponseSchema`, `RemoveSpellKnownResponseSchema`)
- Backend: `apps/backend/src/features/character/characterService.ts` (`addSpellKnown`, `removeSpellKnown`)

## 🎨 **Frontend Patterns**

### **SpellSelectionTab Component Modes**

The `SpellSelectionTab` component supports two modes:

**Level-Up Mode** (`spellbookMode: 'level-up'`):
- Enforces free grant quantity limits
- Disables spell selection when `remainingFreeSpells <= 0`
- Used during character creation and level-up

**Scribing Mode** (`spellbookMode: 'scribing'`):
- Does not enforce free grant limits
- Still enforces spell level validation
- Used for ad-hoc scribing from scrolls or found spellbooks (future enhancement)

**Source Files**:
- Frontend: `apps/frontend/src/features/character/tabs/SpellSelectionTab.tsx`

### **Cache-Based State Management**

The frontend uses TanStack Query cache for state management:

**Optimistic Updates**:
- Spell data cache: `isKnown: true/false` updated immediately
- Character cache: `advancements[].spellsKnown` array updated immediately
- `cacheUpdateTrigger` incremented to force memo recalculation

**Cache Reading**:
- `freeSpellsUsed` memo reads from cached character data
- `knownFreeGrantSpells` memo reads from cached character data
- Ensures immediate UI updates without waiting for server refetch

**Source Files**:
- Frontend: `apps/frontend/src/features/character/tabs/SpellSelectionTab.tsx`

### **Resolution State Synchronization**

The frontend uses `useCharacterResolution.updateResolvedCharacter()` to sync resolution state:

**Process**:
1. Spell operation completes on backend
2. Backend returns `resolvedCharacter` in response
3. Frontend calls `updateResolvedCharacter(response.resolvedCharacter)`
4. Resolution hook state updates
5. CharacterEdit re-renders with fresh resolved data

**Benefits**:
- No manual TanStack Query cache manipulation for character details
- Resolution state always in sync with backend
- Automatic re-rendering of dependent components

**Source Files**:
- Frontend: `apps/frontend/src/features/character/useCharacterResolution.ts` (`updateResolvedCharacter`)
- Frontend: `apps/frontend/src/features/character/tabs/SpellSelectionTab.tsx` (`handleLearnSpell`, `handleRemoveSpell`)

### **Spell Selection Data Display**

The `SpellSelectionTab` component displays spell information using data from the spell selection API endpoint, with cache lookups for sourcebook abbreviations.

**API Endpoint**: `/characters/:id/spell-selection/:classId`

**Response Structure**:
- Returns `CharacterSpellSelectionResponse` with full `SpellSchema` objects
- Each spell entry includes:
  - `schoolIds`: Array of `{ schoolId: number }` - Spell school IDs
  - `subSchoolIds`: Array of `{ subSchoolId: number }` - Spell subschool IDs
  - `sourceBookInfo`: Array of `{ sourceBookId: number, pageNumber: number | null }` - Source references (no nested `sourceBook` object)
  - `summary`: Spell description/summary text
  - `classSpellLevel`: Spell level for the selected class
  - `isKnown`: Whether the spell is already known
  - `isFreeGrant`: Whether the spell was granted for free (if known)

**Table Column Data Sources**:
- **Spell Name**: Uses `spell.name` from API response
- **School/Subschool**: Uses `schoolIds` and `subSchoolIds` from API response, with static maps (`SPELL_SCHOOL_MAP`, `SPELL_SUBSCHOOL_MAP`) for ID-to-name conversion
- **Description**: Uses `spell.summary` from API response
- **Source**: Uses `sourceBookInfo[].sourceBookId` from API response, with `getSourceBookFromCache()` for abbreviation lookup

**Important**: Table columns use API data directly - **no individual `getSpellById` calls are made for table display**. All spell information needed for the table is included in the single API response.

**Tooltip Fetching**:
- `EntityLink` components use `SpellTooltip` for detailed spell previews
- Tooltip fetching is **lazy-loaded** (`enabled: isOpen`) - only fetches when tooltip opens on hover
- Tooltips are separate from table display and use `getSpellById` for full spell details
- This is acceptable behavior as tooltips are for detailed previews, not table rendering

**Cache Lookup Patterns**:
- Sourcebook abbreviations are resolved using `getSourceBookFromCache(sourceBookId)` from the sourcebooks-cache
- Cache is pre-populated on app startup via `CacheProvider`
- Memoized helper functions (`getSourceDisplay`, `formatSchoolSubschool`) optimize cache lookups and formatting

**Memoization Strategy**:
- `getSourceDisplay`: Memoized function for sourcebook abbreviation lookup and formatting
- `formatSchoolSubschool`: Memoized function for school/subschool name formatting
- Both functions are dependencies of the `spellColumns` memo to ensure proper recalculation

**Source Files**:
- API Endpoint: `apps/backend/src/features/character/characterController.ts` (`GetCharacterSpellSelection`)
- Backend Service: `apps/backend/src/features/character/characterService.ts` (`getAvailableSpellsForClass`)
- Frontend Component: `apps/frontend/src/features/character/tabs/SpellSelectionTab.tsx`
- Cache Functions: `apps/frontend/src/services/cache/CacheFunctions.ts` (`getSourceBookFromCache`)
- Tooltip Component: `apps/frontend/src/components/entity-tooltip/SpellTooltip.tsx`

## 📊 **Data Flow**

### **Add Spell Flow**

1. Frontend: User clicks "Add to Spellbook" in `SpellSelectionTab`
2. Frontend: `handleLearnSpell()` calls `CharacterQueryHooks.addSpellKnown()`
3. Backend: `characterService.addSpellKnown()` validates request:
   - Verifies advancement belongs to character and class
   - Validates spell is available for class
   - Validates spell level is castable at advancement level
   - If `isFreeGrant: true`, validates quantity limit using resolved progressions
4. Backend: Updates database (adds spell to `AdvancementSpell`)
5. Backend: Checks for active resolution session
6. Backend: If session exists:
   - Rebuilds `CharacterEditState` from updated character
   - Re-resolves features using `CharacterResolutionService.resolveCharacterFeatures()`
   - Updates session with new state and resolved result
7. Backend: Returns response with spell counts and optional `resolvedCharacter`
8. Frontend: Receives response
9. Frontend: Performs optimistic cache updates:
   - Updates spell data cache (`isKnown: true`)
   - Updates character cache (`advancements[].spellsKnown` array)
   - Increments `cacheUpdateTrigger`
10. Frontend: If `resolvedCharacter` present, calls `updateResolvedCharacter()`
11. Frontend: CharacterEdit re-renders with fresh data

### **Remove Spell Flow**

1. Frontend: User clicks "Remove from Spellbook" in `SpellSelectionTab`
2. Frontend: `handleRemoveSpell()` calls `CharacterQueryHooks.removeSpellKnown()`
3. Backend: `characterService.removeSpellKnown()` validates request:
   - Verifies spell exists in `AdvancementSpell` for character
   - Verifies advancement belongs to character
4. Backend: Updates database (removes spell from `AdvancementSpell`)
5. Backend: Checks for active resolution session
6. Backend: If session exists:
   - Rebuilds `CharacterEditState` from updated character
   - Re-resolves features using `CharacterResolutionService.resolveCharacterFeatures()`
   - Updates session with new state and resolved result
7. Backend: Returns response with updated spell counts and optional `resolvedCharacter`
8. Frontend: Receives response
9. Frontend: Performs optimistic cache updates:
   - Updates spell data cache (`isKnown: false`)
   - Updates character cache (`advancements[].spellsKnown` array)
   - Increments `cacheUpdateTrigger`
10. Frontend: If `resolvedCharacter` present, calls `updateResolvedCharacter()`
11. Frontend: CharacterEdit re-renders with fresh data

## 📚 **Related Documentation**

- **[Character Resolution System](./character-resolution-system.md)** - Resolution session management and spell operation integration
- **[Character Management Database Schema](./database-schema.md)** - `AdvancementSpell` model and relationships
- **[Character Management Backend Implementation](./backend-implementation.md)** - Character service patterns and spell operation methods
- **[Feature System Documentation](../feature-system/)** - `EntityAppliesToType.SpellbookSpell` and feature progression models
- **[Database Schema Patterns](../application-overview/database-schema.md)** - Common database patterns and conventions
- **[Backend Implementation Patterns](../application-overview/backend-implementation.md)** - Common backend patterns

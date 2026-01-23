# Character System Architecture

*Complete documentation for the character system architecture, including state management patterns, resolution session management, and spell operation patterns.*

## Overview

The character system provides comprehensive character creation, editing, and management capabilities. The architecture follows a clear separation between state management, resolution sessions, and data synchronization patterns.

**Source Files**:
- Frontend: `apps/frontend/src/features/character/`
- Backend: `apps/backend/src/features/character/`
- Resolution: `apps/backend/src/features/characterResolution/`
- Schema: `packages/shared/schema/src/character.ts`

## State Management Patterns

### CharacterEdit/CharacterDetail Pattern

The character editing system uses a standardized state → useEffect → API + refreshState pattern:

1. **Tabs update state**: Tab components call `updateState()` to modify character state
2. **Parent syncs automatically**: useEffect hooks in CharacterEdit/CharacterDetail watch state changes and automatically sync to backend
3. **Tabs should NOT call backend APIs directly** for state management operations

**Benefits**:
- Centralized sync logic: All sync happens in CharacterEdit/CharacterDetail, easier to maintain
- Tabs are simpler: Tabs don't need to know about resolution API
- Automatic sync: No risk of forgetting to sync - it's automatic
- React-idiomatic: Uses effects to react to state changes
- Consistent: All tabs work the same way

**useEffect Hooks**:
- Class changes: Watches `state.classId` and `state.secondaryClassId`
- Race changes: Watches `state.raceId`
- Level changes: Watches `state.level`
- Skill ranks: Watches `state.skillRanks` array
- Feature choices: Watches `state.featureChoices` array
- Spells known: Watches `state.spellsKnown` array (uses lodash/isEqual for comparison, same pattern as spellPreparations in CharacterDetail)

**Why refs are used**: Refs track previous values to avoid syncing on initial mount and to detect actual changes vs. initial state loading.

### SpellSelectionTab Pattern

SpellSelectionTab follows the standard state management pattern with one important architectural detail:

- **Uses state management**: Calls `updateState()` with `SET_SPELLS_KNOWN` to modify `state.spellsKnown`
- **CharacterEdit syncs**: useEffect in CharacterEdit watches `state.spellsKnown` and calls `CharacterApi.syncSpellsKnown()` automatically
- **Uses resolved character data**: Uses spell selection data from resolved character response (architecturally correct)
- **Backend validation**: Spell level validation is handled by the backend in `syncSpellsKnown()`. The UI allows optimistic selection and the backend validates and rejects invalid spells.

## Resolution Session Management

Character resolution is managed through backend sessions that track the character's resolved state:

1. **Session Creation**: When a character is loaded for editing, a resolution session is created
2. **Session Updates**: As the character is modified, the session is updated with new resolved data
3. **Resolved Data**: The resolved character includes:
   - Resolved feature progressions
   - Pending choices
   - Class skills and skill bonuses
   - Available and granted feats
   - **Spell selection data** (by class ID) - calculated during resolution using resolved progressions

**Spell Selection Data**: Spell selection data (spells list, domain spells, availableFreeSpells) is calculated during character resolution and included in the resolved character response. This is architecturally correct since spell selection data depends on:
- Resolved progressions (for spellbook grants, domain spells, feat-granted spells)
- Class choices (which classes the character has)
- Domain choices (which domains were selected)
- Feat choices (which feats grant spells)

All of this data is already part of the resolved character, making it the correct source for spell selection data.

## Spell Operation Patterns

### State Management via updateState → CharacterEdit Syncs

Spell operations follow the standard state management pattern:

1. **Tab updates state**: SpellSelectionTab calls `updateState()` with `SET_SPELLS_KNOWN` to modify `state.spellsKnown`
2. **CharacterEdit syncs**: useEffect in CharacterEdit watches `state.spellsKnown` and calls `CharacterApi.syncSpellsKnown()` automatically
3. **Backend validates**: Backend validates spell level and other constraints in `syncSpellsKnown()`
4. **Resolution refreshes**: After sync, resolution state is refreshed to get updated resolved data

### Spell Selection Data Source

Spell selection data comes from the resolved character response:

- **Source**: `resolvedData.spellSelection?.[classId]`
- **Structure**: Each class entry includes:
  - `spells`: Array of CharacterSpellSelectionEntry
  - `domainSpells`: Array of domain spells (optional)
  - `availableFreeSpells`: number (optional, for spellbook classes)
- **Calculation**: Calculated during character resolution using resolved progressions
- **Architectural Correctness**: This is the correct source since the data depends on resolved progressions

## Money/Currency System

The money/currency system is frontend-only:

- **Storage**: Backend stores money as separate fields (platinum, gold, silver, copper) in the database
- **Frontend Utilities**: Frontend utilities (`moneyUtils.ts`) provide conversion and calculation functions for UI state management
- **No Backend Sharing**: Money utilities are not shared with backend - they're purely for UI calculations

See [Money Utilities](./money-utilities.md) for detailed documentation.

## Spellcasting System Architecture

The spellcasting system uses a combination of backend APIs and frontend utilities:

- **Backend APIs**: 
  - `syncSpellsKnown()` - Synchronizes spells known to backend (validates and updates database)
  - Spell selection data is calculated during resolution and included in resolved character response
- **Frontend Utilities**: 
  - Display logic utilities (e.g., `hasZeroLevelSpellbookSpellsGrant()`) use resolved progressions from state
  - UI state management utilities (e.g., `getFreeSpellsUsed()`) read from state
- **Validation**: Backend handles all validation - frontend allows optimistic selection

See [Spellcasting Utilities](./spellcasting-utilities.md) for detailed documentation.

## Integration Points

### Character Resolution Integration

Character resolution provides:
- Resolved feature progressions
- Pending choices
- Class skills and skill bonuses
- Available and granted feats
- **Spell selection data** (by class ID)

All tabs receive resolved data via the `resolvedData` prop, which is computed from the resolution session's resolved character result.

### State Synchronization

State synchronization happens automatically:
- Tabs update state via `updateState()`
- CharacterEdit/CharacterDetail watch state changes via useEffect
- Backend APIs are called automatically
- Resolution state is refreshed after database operations

## Extension Points

The character system is designed for extensibility:

- **New Tabs**: Add new tab components following the TabComponentProps interface
- **New State Fields**: Add new fields to CharacterEditState and corresponding update types
- **New Resolved Data**: Add new fields to ResolvedCharacterResultSchema
- **New Utilities**: Add frontend-only utilities for UI-specific logic

## Related Documentation

- [Character Management Frontend Components](../character-management/frontend-components.md)
- [Character Management Backend Implementation](../character-management/backend-implementation.md)
- [Character Resolution System](../character-management/character-resolution-system.md)
- [Money Utilities](./money-utilities.md)
- [Spellcasting Utilities](./spellcasting-utilities.md)
- [Starting Gold](./starting-gold.md)
- [Character Types](./character-types.md)

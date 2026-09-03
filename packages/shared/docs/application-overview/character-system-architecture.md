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

The character editing system uses a standardized **state → useEffect → draft update** pattern:

1. **Tabs update state**: Tab components call `updateState()` to modify character state
2. **Parent syncs automatically**: `CharacterEdit` watches state changes and applies **scalar-only** draft updates (`PUT /drafts/update-value`)
3. **Tabs should NOT call backend APIs directly** for edit-mode draft synchronization

**Benefits**:
- Centralized sync logic: All sync happens in CharacterEdit/CharacterDetail, easier to maintain
- Tabs are simpler: Tabs don't need to know about resolution API
- Automatic sync: No risk of forgetting to sync - it's automatic
- React-idiomatic: Uses effects to react to state changes
- Consistent: All tabs work the same way

**useEffect Hooks**:
- Class changes: Watches `state.classId` and `state.secondaryClassId`
- Race changes: Watches `state.raceId`
- Skill ranks: Watches `state.skillRanks` array
- Feature choices: Watches `state.featureChoices` array
- Feats: Watches `state.selectedFeats` and `state.featSubIds`
- Spells known: Watches `state.spellsKnown`

**Why refs are used**: Refs track previous values to avoid syncing on initial mount and to detect actual changes vs. initial state loading.

**Important**: When the underlying state field is nullable (e.g. `raceId: number | null`), do **not** use `null` as an "uninitialized" sentinel for a previous-value ref. Use a separate boolean "hasInitialized" ref instead, otherwise the first user change from `null → value` will be swallowed.

### Draft-only Character Creation (id = 0 → negative draft id)

When creating a new character, the frontend uses the generic draft API to mint a **temporary negative** draft-only ID:

- `POST /drafts/start-editing` with `{ draftType: DraftType.Character, id: 0 }` returns `{ id: <negative> }`
- The UI adopts this negative `characterId` until the user saves
- Subsequent character-resolution hook initialization with a negative id does **not** need to call `startEditing` again (the original mint call already acquired the draft lock/session)

**Reload durability**:
- The create route (`/characters/new/create`) is a launcher that redirects to `/characters/<draftId>/edit`.
- Opening `/characters/:id/edit` with a **negative** id calls `startEditing` for that character id (and the paired advancement draft) before loading the form. If Redis expired (30‑minute TTL, unused after deploy), the backend re-writes empty create state under the **same** minted id so the URL stays stable.
- Backend overload: `GET /characters/:id/details`
  - `id > 0`: loads persisted character data from MySQL
  - `id < 0`: loads draft state from Redis (requires lock ownership) and returns the same response shape (`CharacterWithAllDetailsResponse`)
- Unsaved field values that already expired from Redis cannot be recovered; the form starts empty but further edits sync again.

### SpellSelectionTab Pattern

SpellSelectionTab follows the standard state management pattern with one important architectural detail:

- **Uses state management**: Calls `updateState()` with `SET_SPELLS_KNOWN` to modify `state.spellsKnown`
- **CharacterEdit syncs**: useEffect in `CharacterEdit` watches `state.spellsKnown` and updates the **Advancement draft** (`DraftType.Advancement`) using scalar-only paths
- **Uses resolved character data**: Uses spell selection data from resolved character response (architecturally correct)
- **Backend validation**: Validation occurs when saving the draft; resolution still provides the authoritative spell selection list and constraints.

## Resolution Session Management

Character resolution is managed through backend **projection publishing** that tracks the character’s resolved state:

1. **Draft updates**: Character/Advancement drafts are updated in Redis
2. **Debounced resolution**: backend computes `ResolvedCharacterResult` from the effective character + effective advancements (plus draft overlays)
3. **Publish-on-change**: the backend hashes results and publishes only when the resolved output changes
4. **Resolved Data**: The resolved character includes:
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
2. **CharacterEdit syncs**: useEffect in CharacterEdit watches `state.spellsKnown` and applies scalar-only updates to the `DraftType.Advancement` draft
3. **Backend validates**: Validation happens at draft save time (Zod + domain logic)
4. **Resolution updates**: Resolved character updates are pushed via `topicUpdate` (`topic: 'characterResolved'`)

### Spell Selection Data Source

Spell selection data comes from the resolved character response:

- **Source**: `resolvedData.spellSelection?.[classId]`
- **Structure**: Each class entry includes:
  - `spells`: Array of CharacterSpellSelectionEntry
  - `domainSpells`: Array of domain spells (optional)
  - `availableFreeSpells`: number (optional, for spellbook classes)
  - `maxSpellsKnownByLevel`: optional map of spell level → max known (SpellsKnown classes only; from `SpellsKnownProgression` FeatureEntities)
- **Calculation**: Calculated during character resolution using resolved progressions
- **Architectural Correctness**: This is the correct source since the data depends on resolved progressions

## Money/Currency System

The money/currency system is **persisted** and shared:

- **Storage**: Backend stores money/valuables as `CharacterWealth` rows keyed by `currencyId` (@CurrencyId) with optional `value`/`description`
- **Frontend Utilities**: Frontend utilities (`moneyUtils.ts`) are still used for UI calculations, but persistence is through `CharacterWealth`

See `packages/shared/schema/src/character.ts` (`CharacterWealthSchema`) for the canonical shape.

## Spellcasting System Architecture

The spellcasting system uses a combination of backend APIs and frontend utilities:

- **Backend APIs**: 
  - `syncSpellsKnown()` - Synchronizes spells known to backend (validates and updates database)
  - Spell selection data is calculated during resolution and included in resolved character response
  - During **draft-only character creation** (negative `characterId`), spell selection is calculated from the effective draft snapshot (character + advancement drafts) rather than querying the `Character` row in MySQL.
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

# Spellcasting Utilities

*Documentation for backend APIs vs. frontend utilities, state management patterns, and spell selection data architecture.*

## Overview

The spellcasting system uses a combination of backend APIs and frontend utilities, with spell selection data now included in the resolved character response (architecturally correct).

**Source Files**:
- Frontend Utilities: `apps/frontend/src/features/character/utils/spellbookUtils.ts`, `apps/frontend/src/features/character/utils/spellcastingUtils.ts`
- Backend APIs: `apps/backend/src/features/character/characterService.ts`
- Schema: `packages/shared/schema/src/spell.ts`, `packages/shared/schema/src/character.ts`

## Architecture

### Spell Selection Data in Resolved Character

Spell selection data (spells list, domain spells, availableFreeSpells) is calculated during character resolution and included in the resolved character response. This is architecturally correct because spell selection data depends on:

- Resolved progressions (for spellbook grants, domain spells, feat-granted spells)
- Class choices (which classes the character has)
- Domain choices (which domains were selected)
- Feat choices (which feats grant spells)

All of this data is already part of the resolved character, making it the correct source for spell selection data.

**Schema**: `ResolvedCharacterResultSchema.spellSelection` - Record mapping classId (as string) to `ClassSpellSelection`

**Structure**:
```typescript
interface ClassSpellSelection {
    spells: CharacterSpellSelectionEntry[];
    domainSpells?: CharacterSpellSelectionEntry[];
    availableFreeSpells?: number; // For spellbook classes
}
```

### Backend APIs

#### `syncSpellsKnown(characterId, advancementId, spellsKnown)`

Synchronizes spells known to the backend. This is the primary API for spell state management.

**Pattern**: State → useEffect → API + refreshState
- Tab updates `state.spellsKnown` via `updateState()`
- CharacterEdit detects change and calls `syncSpellsKnown()` automatically
- Backend validates spell level and other constraints
- Resolution state is refreshed after sync

**Validation**: Backend handles all validation - frontend allows optimistic selection

#### Deprecated: `getCharacterSpellSelection(characterId, classId)`

**DEPRECATED**: This endpoint is deprecated. Spell selection data is now included in the resolved character response.

Use `resolvedData.spellSelection?.[classId]` instead.

### Frontend Utilities

#### Display Logic Utilities

**`hasSpellbook(resolvedProgressions, classId): boolean`**

Check if a class has a spellbook (uses spellbook spell management).

**Frontend-only utility**: Determines if a class uses the spellbook system by checking for `EntityAppliesToType.SpellbookSpell` entities in the resolved progressions.

**Uses**: Resolved progressions from state (correct source)

**`hasZeroLevelSpellbookSpellsGrant(resolvedProgressions, classId): boolean`**

Check if a class has a feature grant for all 0th level spellbook spells.

**Frontend-only utility**: Detects the feature-based 0th level spell grant for spellbook classes. Used for display filtering.

**Uses**: Resolved progressions from state (correct source)

**`getSpellcastingClasses(advancements, classDetailsMap): SpellcastingClassInfo[]`**

Get all spellcasting classes from character advancements.

**Frontend-only utility**: UI utility for displaying classes in spell selection UI.

#### State Management Utilities

**`getFreeSpellsUsed(advancement): number`**

Count free grants (isFreeGrant: true) for a specific advancement.

**Frontend-only utility**: Counts the number of spells that were granted for free during level-up. Note: For counting from state, use `state.spellsKnown` directly in components.

## State Management Patterns

### SpellSelectionTab Pattern

SpellSelectionTab follows the standard state management pattern:

1. **Uses state management**: Calls `updateState()` with `SET_SPELLS_KNOWN` to modify `state.spellsKnown`
2. **CharacterEdit syncs**: useEffect in CharacterEdit watches `state.spellsKnown` and calls `CharacterApi.syncSpellsKnown()` automatically
3. **Uses resolved character data**: Uses spell selection data from resolved character response
4. **Backend validation**: Spell level validation is handled by the backend in `syncSpellsKnown()`. The UI allows optimistic selection and the backend validates and rejects invalid spells.

### Data Sources

- **Spell Selection Data**: From `resolvedData.spellSelection?.[classId]` (calculated during resolution)
- **Available Free Spells**: From `resolvedData.spellSelection?.[classId].availableFreeSpells` (for spellbook classes)
- **Spells Known State**: From `state.spellsKnown` (managed via updateState)
- **Resolved Progressions**: From `resolvedData.progressions` (for display logic)

## Validation

### Backend Validation

All spell validation is handled by the backend:

- **Spell Level Validation**: Backend validates in `syncSpellsKnown()` that spells don't exceed maximum castable level
- **Free Spell Limits**: Backend validates that free spell grants don't exceed available free spells
- **Spell Availability**: Backend validates that spells are available for the character's class and level

### Frontend Behavior

The frontend allows optimistic selection:

- UI allows spell selection without pre-validation
- Backend validates and rejects invalid spells
- UI shows appropriate feedback based on backend response

## Migration from Separate API

Previously, spell selection data was fetched via a separate API call (`getCharacterSpellSelection`). This has been migrated to the resolved character response:

- **Old Pattern**: Separate API call for each class's spell selection data
- **New Pattern**: Spell selection data included in resolved character response
- **Benefits**: 
  - Architecturally correct (data depends on resolved progressions)
  - Single source of truth (resolved character)
  - Reduced API calls
  - Consistent with other resolved data

## Related Documentation

- [Character System Architecture](./character-system-architecture.md)
- [Character Resolution System](../character-management/character-resolution-system.md)

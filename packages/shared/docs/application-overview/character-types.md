# Character Type Usage Patterns

*Documentation for character type usage patterns, including which types are shared vs. frontend/backend specific.*

## Overview

The character system uses a variety of TypeScript types across frontend and backend. This document categorizes types and explains when to use which types.

**Source Files**:
- Frontend Types: `apps/frontend/src/features/character/types.ts`
- Backend Types: `apps/backend/src/features/character/types.ts`
- Shared Schema: `packages/shared/schema/src/character.ts`, `packages/shared/schema/src/characterResolution.ts`

## Type Categories

### Shared Types (from @shared/schema)

These types are defined in the shared schema package and used by both frontend and backend:

- **Character Types**: `Character`, `CharacterWithAllDetailsResponse`, `CharacterAdvancementWithDetailsResponse`
- **Resolution Types**: `ResolvedCharacterResult`, `FeatureProgression`, `PendingChoice`, `ClassSpellSelection`
- **Spell Types**: `CharacterSpellSelectionEntry`, `CharacterSpellSelectionResponse`
- **Request/Response Types**: All API request and response types

**Usage**: Import from `@shared/schema` in both frontend and backend.

### Frontend-Only Types

These types are used only in the frontend for UI state management:

#### UI State Management Types

- **`CharacterEditState`**: Complete character edit state including all tab-specific UI state
- **`SkillRank`**: Skill rank data for skills tab UI
- **`EquipmentItem`**: Equipment item data for equipment tab UI
- **`AttackDefinition`**: Attack definition data for combat tab UI
- **Tab State Types**: Various types for managing tab-specific UI state

#### Component Props Types

- **`TabComponentProps`**: Props interface for tab components
- **`CharacterEditStateUpdate`**: Update actions for character edit state

**Location**: `apps/frontend/src/features/character/types.ts`

**Usage**: Used only in frontend components and hooks.

### Backend-Only Types

These types are used only in the backend for service interfaces:

- **Service Interface Types**: Types for character service method signatures
- **Internal Types**: Types used only within backend services

**Location**: `apps/backend/src/features/character/types.ts`

**Usage**: Used only in backend services and controllers.

## Type Relationships

### Character Data Flow

```
Database (Prisma) 
  → CharacterWithAllDetailsResponse (shared)
    → CharacterEditState (frontend-only)
      → Tab Components (frontend-only types)
```

### Resolution Data Flow

```
ResolvedCharacterResult (shared)
  → resolvedData (frontend computed)
    → Tab Components (via TabComponentProps)
```

### Spell Selection Data Flow

```
ResolvedCharacterResult.spellSelection (shared)
  → resolvedData.spellSelection (frontend computed)
    → SpellSelectionTab (via TabComponentProps)
```

## Type Conversions

### Character to Edit State

Character data from the backend (`CharacterWithAllDetailsResponse`) is converted to frontend edit state (`CharacterEditState`) in `CharacterEdit.tsx`:

- Basic fields map directly
- Arrays are transformed to frontend state format
- UI-specific fields are initialized

### Edit State to API Requests

Frontend edit state is converted to API request types when syncing:

- `state.spellsKnown` → `SyncSpellsKnownRequest`
- `state.skillRanks` → Resolution update
- `state.featureChoices` → Resolution update

## When to Use Which Types

### Use Shared Types When:

- Defining API request/response types
- Working with data that flows between frontend and backend
- Defining database model types (via Prisma)
- Working with resolved character data

### Use Frontend-Only Types When:

- Managing UI state in React components
- Defining component props
- Working with tab-specific UI state
- Managing form state

### Use Backend-Only Types When:

- Defining service method signatures
- Working with internal backend logic
- Defining types used only within backend services

## Best Practices

1. **Prefer Shared Types**: Use shared types from `@shared/schema` whenever possible
2. **Minimize Frontend-Only Types**: Only create frontend-only types for UI-specific state management
3. **Type Safety**: Use TypeScript's type system to ensure type safety across layers
4. **Documentation**: Document type relationships and conversions in JSDoc

## Related Documentation

- [Character System Architecture](./character-system-architecture.md)
- [Character Management Backend Implementation](../character-management/backend-implementation.md)
- [Character Management Frontend Components](../character-management/frontend-components.md)

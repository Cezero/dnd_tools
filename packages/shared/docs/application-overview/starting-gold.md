# Starting Gold System

*Documentation for the starting gold system, including the starting gold table and frontend hook.*

## Overview

The starting gold system generates random starting gold for characters based on their class, using dice notation from the D&D 3.5e Player's Handbook.

**Source Files**:
- Static Data: `packages/shared/static-data/src/ClassData.ts` (STARTING_GOLD_TABLE)
- Frontend Hook: `apps/frontend/src/features/character/utils/startingGold.ts`

## Architecture

### Static Data Location

The starting gold table is stored in `@shared/static-data` because it's class-specific static data:

- **Location**: `packages/shared/static-data/src/ClassData.ts`
- **Export**: Exported from `packages/shared/static-data/src/index.ts`
- **Rationale**: This is reference data that could potentially be used by other parts of the system

### Frontend Hook

The `useStartingGold()` hook is frontend-only:

- **Location**: `apps/frontend/src/features/character/utils/startingGold.ts`
- **Purpose**: React hook that uses dice box utilities to roll starting gold
- **Helper Functions**: `normalizeClassName()` and `parseDiceNotation()` are kept in frontend since they're only used by the React hook

## Starting Gold Table

The starting gold table maps normalized class names (lowercase) to dice notation strings:

```typescript
const STARTING_GOLD_TABLE: Record<string, string> = {
    'barbarian': '4d4 × 10',
    'paladin': '6d4 × 10',
    'bard': '4d4 × 10',
    'ranger': '6d4 × 10',
    'cleric': '5d4 × 10',
    'rogue': '5d4 × 10',
    'druid': '2d4 × 10',
    'sorcerer': '3d4 × 10',
    'fighter': '6d4 × 10',
    'wizard': '3d4 × 10',
    'monk': '5d4', // Note: no × 10 multiplier
};
```

**Format**: "XdY × Z" where XdY is the dice roll and Z is the multiplier (optional).

**Special Case**: "monk" has no multiplier (just "5d4").

**Source**: Based on D&D 3.5e Player's Handbook Table 4-1: Starting Gold

## useStartingGold Hook

The `useStartingGold()` hook provides:

- `generateRandomGold(classId: number): Promise<number>` - Generates random starting gold for a class
- `convertGpToMoney` - Helper to convert gold pieces to Money object (from moneyUtils)
- `isReady` - Boolean indicating if dice box is ready

**Usage**:
```typescript
const { generateRandomGold, convertGpToMoney, isReady } = useStartingGold();

const gold = await generateRandomGold(classId);
const money = convertGpToMoney(gold);
```

**Implementation Details**:
- Uses dice box utilities to roll the dice
- Parses dice notation with optional multiplier
- Applies multiplier to dice result
- Returns final value in gold pieces

## Helper Functions

### `normalizeClassName(name: string): string`

Normalize class name for lookup (lowercase, trim).

**Frontend-only**: Used by the useStartingGold hook to match class names against the STARTING_GOLD_TABLE keys.

### `parseDiceNotation(notation: string): { dice: string; multiplier: number }`

Parse dice notation strings from STARTING_GOLD_TABLE into dice and multiplier components.

**Frontend-only**: Parses dice notation strings like "4d4 × 10" into `{ dice: "4d4", multiplier: 10 }`.

**Examples**:
- "4d4 × 10" → `{ dice: "4d4", multiplier: 10 }`
- "5d4" → `{ dice: "5d4", multiplier: 1 }`

## Related Documentation

- [Character System Architecture](./character-system-architecture.md)
- [Money Utilities](./money-utilities.md)

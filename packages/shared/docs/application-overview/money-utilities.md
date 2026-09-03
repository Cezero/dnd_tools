# Money Utilities

*Documentation for frontend-only money utilities used for UI state management.*

## Overview

Money utilities provide conversion and calculation functions for handling currency in the frontend UI. These utilities are frontend-only and are not shared with the backend.

**Source File**: `apps/frontend/src/features/character/utils/moneyUtils.ts`

## Architecture

### Frontend-Only Design

Money utilities are designed as frontend-only utilities:

- **Backend Storage**: Backend stores money as separate fields (platinum, gold, silver, copper) in the database
- **Frontend Calculations**: Frontend utilities provide conversion and calculation functions for UI state management
- **No Backend Sharing**: Money utilities are not shared with backend - they're purely for UI calculations

### Money Interface

```typescript
interface Money {
    platinum: number;
    gold: number;
    silver: number;
    copper: number;
    gem: number;
    artObject: number;
    other: number;
}
```

Coin fields convert to gp for purchase and starting-gold math. `gem`, `artObject`, and `other` are counts only (no gp until appraised). `convertGpToMoney` and `addGpToMoney` preserve those counts. `buildWealthFromMoney` writes quantity-only `CharacterWealth` rows and keeps any existing described rows.

**Pending**: replace valuable counts with individual treasure rows (`description` + `value`) so awards such as “pearl 50 gp” and “pearl 100 gp” stay distinct and can be Appraised or sold before a value is known.

## Functions

### `getTotalGoldInGp(money: Money): number`

Convert Money object to total gold pieces.

**Frontend-only utility**: Used for calculations and comparisons in the UI.

**Parameters**:
- `money`: The money object to convert

**Returns**: Total value in gold pieces

**Example**:
```typescript
const total = getTotalGoldInGp({ platinum: 1, gold: 5, silver: 10, copper: 50 });
// Returns: 15.1 (1 * 10 + 5 + 10 * 0.1 + 50 * 0.01)
```

### `convertGpToMoney(gp: number): Money`

Convert gold pieces to Money object, keeping gold as gold (no upconversion to platinum).

**Frontend-only utility**: Used for converting calculated gold values back to Money objects. This version keeps gold as gold and does not convert to platinum (unlike some other implementations).

**Parameters**:
- `gp`: The amount in gold pieces

**Returns**: Money object with the equivalent value

**Example**:
```typescript
const money = convertGpToMoney(15.5);
// Returns: { platinum: 0, gold: 15, silver: 5, copper: 0 }
```

### `addGpToMoney(money: Money, gp: number): Money`

Add gold pieces to existing money.

**Frontend-only utility**: Used for adding gold to existing money in the UI.

**Parameters**:
- `money`: The existing money object
- `gp`: The gold pieces to add

**Returns**: New money object with the added value

### `getItemCostInGp(item: ItemWithDetails): number`

Get item cost in gold pieces.

**Frontend-only utility**: Used for calculating item costs in the equipment purchase dialog.

**Parameters**:
- `item`: The item to get the cost for

**Returns**: Cost in gold pieces, or 0 if no cost

## Usage Patterns

### Equipment Purchase Dialog

The equipment purchase dialog uses money utilities for:
- Calculating available gold from money object
- Converting item costs to gold pieces
- Calculating remaining money after purchase

**Example**:
```typescript
const availableGold = getTotalGoldInGp(money);
const itemCost = getItemCostInGp(item);
const canAfford = itemCost <= availableGold;
```

### Starting Gold

Starting gold generation uses `convertGpToMoney()` to convert rolled gold values to Money objects for state updates.

## Related Documentation

- [Character System Architecture](./character-system-architecture.md)
- [Starting Gold](./starting-gold.md)

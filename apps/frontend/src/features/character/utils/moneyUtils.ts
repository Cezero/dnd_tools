import type { ItemWithDetails } from '@shared/schema';
import { CurrencyId } from '@shared/static-data';

import type { Money, WealthDraftEntry, WealthRowInput } from '../types';

/**
 * Maps `@CurrencyId` to the matching `Money` property.
 */
export const CURRENCY_TO_MONEY_KEY: Record<number, keyof Money> = {
    [CurrencyId.Copper]: 'copper',
    [CurrencyId.Silver]: 'silver',
    [CurrencyId.Gold]: 'gold',
    [CurrencyId.Platinum]: 'platinum',
    [CurrencyId.Gem]: 'gem',
    [CurrencyId.ArtObject]: 'artObject',
    [CurrencyId.Other]: 'other',
};

const QUANTITY_CURRENCIES: Array<{ currencyId: number; key: keyof Money }> = [
    { currencyId: CurrencyId.Platinum, key: 'platinum' },
    { currencyId: CurrencyId.Gold, key: 'gold' },
    { currencyId: CurrencyId.Silver, key: 'silver' },
    { currencyId: CurrencyId.Copper, key: 'copper' },
    { currencyId: CurrencyId.Gem, key: 'gem' },
    { currencyId: CurrencyId.ArtObject, key: 'artObject' },
    { currencyId: CurrencyId.Other, key: 'other' },
];

/**
 * Convert Money object to total gold pieces.
 *
 * Valuables (gem, art object, other) have no gp value until they are appraised,
 * so they are excluded.
 *
 * **Frontend-only utility**: Used for calculations and comparisons in the UI.
 *
 * @param money - The money object to convert
 * @returns Total coin value in gold pieces
 */
export function getTotalGoldInGp(money: Money): number {
    const { platinum, gold, silver, copper } = money;
    return platinum * 10 + gold + silver * 0.1 + copper * 0.01;
}

/**
 * Convert gold pieces to a Money object, keeping gold as gold (no upconversion to platinum).
 *
 * Valuables are copied from `existing` when provided so generate/purchase do not clear them.
 *
 * **Frontend-only utility**: Used for converting calculated gold values back to Money objects.
 *
 * @param gp - The amount in gold pieces
 * @param existing - Optional current money; valuables are preserved
 * @returns Money object with the equivalent coin value
 */
export function convertGpToMoney(gp: number, existing?: Money): Money {
    const gold = Math.floor(gp);
    const goldDecimal = gp - gold;
    const silver = Math.floor(goldDecimal * 10);
    const copper = Math.round((goldDecimal * 10 - silver) * 10);
    return {
        platinum: 0,
        gold,
        silver,
        copper,
        gem: existing?.gem ?? 0,
        artObject: existing?.artObject ?? 0,
        other: existing?.other ?? 0,
    };
}

/**
 * Add gold pieces to existing money.
 *
 * **Frontend-only utility**: Used for adding gold to existing money in the UI.
 *
 * @param money - The existing money object
 * @param gp - The gold pieces to add
 * @returns New money object with the added coin value and the same valuables
 */
export function addGpToMoney(money: Money, gp: number): Money {
    const totalGp = getTotalGoldInGp(money) + gp;
    return convertGpToMoney(totalGp, money);
}

/**
 * Get item cost in gold pieces.
 *
 * **Frontend-only utility**: Used for calculating item costs in the equipment purchase dialog.
 *
 * @param item - The item to get the cost for
 * @returns Cost in gold pieces, or 0 if no cost
 */
export function getItemCostInGp(item: ItemWithDetails): number {
    if (!item.cost) {
        return 0;
    }
    const costStr = typeof item.cost === 'string' ? item.cost : item.cost.toString();
    return parseFloat(costStr) || 0;
}

/**
 * Normalize API or draft wealth rows so `value` and `description` are always null, not omitted.
 */
export function normalizeWealthRows(wealth: WealthRowInput[]): WealthDraftEntry[] {
    return wealth.map((entry) => ({
        id: entry.id,
        characterId: entry.characterId,
        currencyId: entry.currencyId,
        quantity: entry.quantity,
        value: entry.value ?? null,
        description: entry.description ?? null,
    }));
}

/**
 * True when a wealth row is an unappraised quantity bucket (editor money fields).
 */
export function isQuantityOnlyWealth(entry: WealthDraftEntry): boolean {
    return entry.value === null && entry.description === null;
}

/**
 * Build draft `wealth` from editor money, keeping any described/appraised rows.
 *
 * Quantity-only rows (one per `@CurrencyId`) are created or updated from `money`.
 * Rows with value or description are preserved for the pending individual-treasure feature.
 *
 * @param characterId - Character or draft id written onto each row
 * @param money - Editor coin and valuable counts
 * @param existingWealth - Current draft or loaded wealth rows
 * @returns Wealth rows to write to the character draft
 */
export function buildWealthFromMoney(
    characterId: number,
    money: Money,
    existingWealth: WealthDraftEntry[] = []
): WealthDraftEntry[] {
    const describedRows = existingWealth.filter((entry) => !isQuantityOnlyWealth(entry));
    const quantityRows = QUANTITY_CURRENCIES.map(({ currencyId, key }) => {
        const existing = existingWealth.find(
            (entry) => entry.currencyId === currencyId && isQuantityOnlyWealth(entry)
        );
        return {
            id: existing?.id ?? -currencyId,
            characterId,
            currencyId,
            quantity: money[key],
            value: null,
            description: null,
        };
    });
    return [...quantityRows, ...describedRows];
}

/**
 * Read quantity-only wealth for one currency. Returns 0 when no matching row exists.
 */
export function getQuantityOnlyAmount(wealth: WealthDraftEntry[], currencyId: number): number {
    return wealth.find((entry) => entry.currencyId === currencyId && isQuantityOnlyWealth(entry))
        ?.quantity ?? 0;
}

/**
 * Flatten quantity-only wealth rows into editor `Money`.
 */
export function wealthToMoney(wealth: WealthDraftEntry[]): Money {
    return {
        platinum: getQuantityOnlyAmount(wealth, CurrencyId.Platinum),
        gold: getQuantityOnlyAmount(wealth, CurrencyId.Gold),
        silver: getQuantityOnlyAmount(wealth, CurrencyId.Silver),
        copper: getQuantityOnlyAmount(wealth, CurrencyId.Copper),
        gem: getQuantityOnlyAmount(wealth, CurrencyId.Gem),
        artObject: getQuantityOnlyAmount(wealth, CurrencyId.ArtObject),
        other: getQuantityOnlyAmount(wealth, CurrencyId.Other),
    };
}

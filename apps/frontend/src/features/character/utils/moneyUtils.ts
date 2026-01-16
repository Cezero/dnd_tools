import type { ItemWithDetails } from '@shared/schema';

import type { Money } from '../types';

/**
 * Convert Money object to total gold pieces
 * 
 * **Frontend-only utility**: Used for calculations and comparisons in the UI.
 * 
 * @param money - The money object to convert
 * @returns Total value in gold pieces
 */
export function getTotalGoldInGp(money: Money): number {
    const { platinum, gold, silver, copper } = money;
    return platinum * 10 + gold + silver * 0.1 + copper * 0.01;
}

/**
 * Convert gold pieces to Money object, keeping gold as gold (no upconversion to platinum)
 * 
 * **Frontend-only utility**: Used for converting calculated gold values back to Money objects.
 * This version keeps gold as gold and does not convert to platinum (unlike some other implementations).
 * 
 * @param gp - The amount in gold pieces
 * @returns Money object with the equivalent value
 */
export function convertGpToMoney(gp: number): Money {
    const gold = Math.floor(gp);
    const goldDecimal = gp - gold;
    const silver = Math.floor(goldDecimal * 10);
    const copper = Math.round((goldDecimal * 10 - silver) * 10);
    return { platinum: 0, gold, silver, copper };
}

/**
 * Add gold pieces to existing money
 * 
 * **Frontend-only utility**: Used for adding gold to existing money in the UI.
 * 
 * @param money - The existing money object
 * @param gp - The gold pieces to add
 * @returns New money object with the added value
 */
export function addGpToMoney(money: Money, gp: number): Money {
    const totalGp = getTotalGoldInGp(money) + gp;
    return convertGpToMoney(totalGp);
}

/**
 * Get item cost in gold pieces
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

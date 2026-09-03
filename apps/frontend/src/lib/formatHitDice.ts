import { RPG_DICE } from '@shared/static-data';

/**
 * Resolves an `@RpgDice` enum id to its display name (`d8`).
 * `0` is D4 — callers must not treat the id as a face count or as falsy.
 */
export function getHitDiceName(typeId: number | null | undefined): string {
    if (typeId === null || typeId === undefined) {
        return '';
    }
    return RPG_DICE[typeId]?.name ?? '';
}

/**
 * Compact HD notation from quantity and RpgDice id (`1d8`, `0.5d8`).
 */
export function formatHitDiceNotation(
    qty: number | null | undefined,
    typeId: number | null | undefined,
): string {
    if (qty === null || qty === undefined) {
        return '';
    }
    return `${qty}${getHitDiceName(typeId)}`;
}

/**
 * Full monster HD line: `1d8+2 (6 hp)`, `0.5d8 (2 hp)`.
 */
export function formatHitDice(
    qty: number | null | undefined,
    typeId: number | null | undefined,
    bonusHP?: number | null,
    averageHP?: number | null,
): string {
    const notation = formatHitDiceNotation(qty, typeId);
    if (!notation) {
        return '';
    }
    let result = notation;
    if (bonusHP) {
        result += bonusHP > 0 ? `+${bonusHP}` : `${bonusHP}`;
    }
    if (averageHP !== null && averageHP !== undefined) {
        result += ` (${averageHP} hp)`;
    }
    return result;
}

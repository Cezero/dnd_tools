import type { ItemWithDetails, CharacterItem } from '@shared/schema';
import { WEAPON_TYPE_ENUM } from '@shared/static-data';

/**
 * Type guard to check if item has weapon property
 */
function hasWeapon(item: ItemWithDetails | CharacterItem | undefined | null): item is ItemWithDetails {
    return item !== null && item !== undefined && 'weapon' in item && item.weapon !== null && item.weapon !== undefined;
}

/**
 * Check if off-hand item is a weapon (indicating dual-wield)
 */
export function isOffHandWeapon(offHandItem: ItemWithDetails | CharacterItem | undefined | null): boolean {
    return hasWeapon(offHandItem);
}

/**
 * Check if item is an unarmed strike weapon
 */
export function isUnarmedWeapon(item: ItemWithDetails | CharacterItem | undefined | null): boolean {
    if (!hasWeapon(item)) {
        return false;
    }
    return item.weapon.type === WEAPON_TYPE_ENUM.UnarmedAttack;
}

/**
 * Check if item is a ranged weapon
 */
export function isRangedWeapon(item: ItemWithDetails | CharacterItem | undefined | null): boolean {
    if (!hasWeapon(item)) {
        return false;
    }
    return item.weapon.type === WEAPON_TYPE_ENUM.RangedWeapon;
}

/**
 * Check if item is a two-handed weapon
 */
export function isTwoHandedWeapon(item: ItemWithDetails | CharacterItem | undefined | null): boolean {
    if (!hasWeapon(item)) {
        return false;
    }
    return item.weapon.type === WEAPON_TYPE_ENUM.TwoHandedMeleeWeapon;
}

/**
 * Check if item is a one-handed melee weapon (not light)
 */
export function isOneHandedMeleeWeapon(item: ItemWithDetails | CharacterItem | undefined | null): boolean {
    if (!hasWeapon(item)) {
        return false;
    }
    return item.weapon.type === WEAPON_TYPE_ENUM.OneHandedMeleeWeapon;
}

/**
 * Check if weapon can be used two-handed
 * Returns true if offHandItem is null/undefined AND
 * (mainHandItem is two-handed OR mainHandItem is one-handed melee weapon that isn't light)
 */
export function canUseTwoHanded(
    mainHandItem: ItemWithDetails | CharacterItem | undefined | null,
    offHandItem: ItemWithDetails | CharacterItem | undefined | null
): boolean {
    // If off-hand item exists, cannot use two-handed
    if (offHandItem !== null && offHandItem !== undefined) {
        return false;
    }

    // If no main-hand item, cannot use two-handed
    if (!hasWeapon(mainHandItem)) {
        return false;
    }

    // Two-handed weapons can always be used two-handed
    if (isTwoHandedWeapon(mainHandItem)) {
        return true;
    }

    // One-handed melee weapons (not light) can be used two-handed
    if (isOneHandedMeleeWeapon(mainHandItem)) {
        return true;
    }

    return false;
}


import type { ItemWithDetails, CharacterItem } from '@shared/schema';
import { WEAPON_TYPE_ENUM, ARMOR_CATEGORY_ENUM } from '@shared/static-data';

/**
 * Type guard to check if item has weapon property
 */
function hasWeapon(item: ItemWithDetails | CharacterItem | undefined | null): item is ItemWithDetails {
    return item !== null && item !== undefined && 'weapon' in item && item.weapon !== null && item.weapon !== undefined;
}

/**
 * Type guard to check if item has armor property
 */
function hasArmor(item: ItemWithDetails | CharacterItem | undefined | null): item is ItemWithDetails {
    return item !== null && item !== undefined && 'armor' in item && item.armor !== null && item.armor !== undefined;
}

/**
 * Check if item is a shield (has armor.category === Shield)
 */
export function isShield(item: ItemWithDetails | CharacterItem | undefined | null): boolean {
    if (!hasArmor(item)) {
        return false;
    }
    return item.armor.category === ARMOR_CATEGORY_ENUM.Shield;
}

/**
 * Check if off-hand item is a weapon (indicating dual-wield)
 * Excludes shields - shields in offhand do not count as dual-wield
 */
export function isOffHandWeapon(offHandItem: ItemWithDetails | CharacterItem | undefined | null): boolean {
    // If it's a shield, it's not a weapon for dual-wield purposes
    if (isShield(offHandItem)) {
        return false;
    }
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
 * Returns true if offHandItem is null/undefined OR is a shield AND
 * (mainHandItem is two-handed OR mainHandItem is one-handed melee weapon that isn't light)
 * Shields in offhand do not prevent two-handed usage
 */
export function canUseTwoHanded(
    mainHandItem: ItemWithDetails | CharacterItem | undefined | null,
    offHandItem: ItemWithDetails | CharacterItem | undefined | null
): boolean {
    // If off-hand item exists and is not a shield, cannot use two-handed
    if (offHandItem !== null && offHandItem !== undefined && !isShield(offHandItem)) {
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


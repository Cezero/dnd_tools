import type { CharacterItem, FeatureWithRelations, ItemWithDetails } from '@shared/schema';
import { ARMOR_CATEGORY_ENUM, EntityAppliesToType, WEAPON_TYPE_ENUM } from '@shared/static-data';

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
 * Whether an off-hand weapon uses the light two-weapon-fighting penalty row.
 * Light melee and unarmed always qualify. Features with
 * TwoWeaponFightingOffHandTreatAsLight also qualify when appliesToId matches
 * the off-hand weapon type, or when appliesToId is null (any off-hand).
 */
export function isLightForTwfPenalties(
    offHandItem: ItemWithDetails | CharacterItem | undefined | null,
    resolvedProgressions: FeatureWithRelations[]
): boolean {
    if (!hasWeapon(offHandItem)) {
        return false;
    }

    const weaponType = offHandItem.weapon.type;
    if (
        weaponType === WEAPON_TYPE_ENUM.LightMeleeWeapon ||
        weaponType === WEAPON_TYPE_ENUM.UnarmedAttack
    ) {
        return true;
    }

    for (const feature of resolvedProgressions) {
        for (const entity of feature.entities ?? []) {
            if (entity.appliesTo !== EntityAppliesToType.TwoWeaponFightingOffHandTreatAsLight) {
                continue;
            }
            if (entity.appliesToId === null || entity.appliesToId === weaponType) {
                return true;
            }
        }
    }

    return false;
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
 * Whether this attack uses a two-handed grip (1.5x STR, "(both hands)" label).
 *
 * Empty off-hand is a standard-action single attack unless `wieldTwoHanded` is
 * set. One-handed melee can opt into two hands that way. Inherent two-handed
 * weapons always qualify. Dual-wield (off-hand is a weapon) never qualifies.
 * Light weapons cannot be used two-handed.
 */
export function canUseTwoHanded(
    mainHandItem: ItemWithDetails | CharacterItem | undefined | null,
    offHandItem: ItemWithDetails | CharacterItem | undefined | null,
    wieldTwoHanded = false
): boolean {
    if (offHandItem !== null && offHandItem !== undefined && !isShield(offHandItem)) {
        return false;
    }

    if (isTwoHandedWeapon(mainHandItem)) {
        return true;
    }

    return wieldTwoHanded && isOneHandedMeleeWeapon(mainHandItem);
}


import type { ItemWithDetails, CharacterItem } from '@shared/schema';
import { WEAPON_TYPE_ENUM } from '@shared/static-data';

import type { ItemBonus } from '../types';

/**
 * Resolve bonuses from item objects
 */
export function resolveItemBonuses(
    item: ItemWithDetails | CharacterItem | undefined
): ItemBonus {
    const bonuses: ItemBonus = {
        attack: 0,
        damage: 0,
        critical: item?.weapon?.critical ?? undefined,
    };

    if (!item?.weapon) {
        return bonuses;
    }

    // Masterwork bonus
    if (item.weapon.attackBonus) {
        bonuses.attack += item.weapon.attackBonus; // Typically +1
    }

    // Enhancement bonuses (from magic weapon properties)
    // TODO: Implement enhancement bonus extraction from item properties
    // These would come from item properties or character item enhancements
    // For now, we'll need to check item properties if they exist

    return bonuses;
}

/**
 * Extract weapon properties from item
 */
export function extractWeaponProperties(
    item: ItemWithDetails | CharacterItem | undefined
): {
    itemId: number | undefined;
    weaponType: number | undefined;
    isLightWeapon: boolean;
    isTwoHanded: boolean;
    damage: string | null;
    critical: string | null;
    range: string | null;
} {
    if (!item?.weapon) {
        return {
            itemId: item?.id,
            weaponType: undefined,
            isLightWeapon: false,
            isTwoHanded: false,
            damage: null,
            critical: null,
            range: null,
        };
    }

    return {
        itemId: item.id,
        weaponType: item.weapon.type,
        isLightWeapon: item.weapon.type === WEAPON_TYPE_ENUM.LightMeleeWeapon,
        isTwoHanded: item.weapon.type === WEAPON_TYPE_ENUM.TwoHandedMeleeWeapon,
        damage: item.weapon.damageMedium ?? null,
        critical: item.weapon.critical ?? null,
        range: item.weapon.range ?? null,
    };
}


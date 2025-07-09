import type { CoreComponent, BaseMap } from './types';
import { NameSelectOptionList } from './Util';

export const WEAPON_CATEGORIES: BaseMap<CoreComponent> = {
    1: { id: 1, name: 'Simple' },
    2: { id: 2, name: 'Martial' },
    3: { id: 3, name: 'Exotic' }
};

export const WEAPON_CATEGORY_LIST = Object.values(WEAPON_CATEGORIES);
export const WEAPON_CATEGORY_SELECT_LIST = NameSelectOptionList(WEAPON_CATEGORY_LIST);

export const WEAPON_TYPES: BaseMap<CoreComponent> = {
    1: { id: 1, name: 'Unarmed Attacks' },
    2: { id: 2, name: 'Light Melee' },
    3: { id: 3, name: 'One-Handed Melee' },
    4: { id: 4, name: 'Two-Handed Melee' },
    5: { id: 5, name: 'Ranged' }
};

export const WEAPON_TYPE_LIST = Object.values(WEAPON_TYPES);
export const WEAPON_TYPE_SELECT_LIST = NameSelectOptionList(WEAPON_TYPE_LIST);

export const DAMAGE_TYPES: BaseMap<CoreComponent> = {
    1: { id: 1, name: 'Bludgeoning' },
    2: { id: 2, name: 'Piercing' },
    3: { id: 3, name: 'Slashing' }
};

export const DAMAGE_TYPE_LIST = Object.values(DAMAGE_TYPES);
export const DAMAGE_TYPE_SELECT_LIST = NameSelectOptionList(DAMAGE_TYPE_LIST);

export const ARMOR_CATEGORIES: BaseMap<CoreComponent> = {
    1: { id: 1, name: 'Light' },
    2: { id: 2, name: 'Medium' },
    3: { id: 3, name: 'Heavy' },
    4: { id: 4, name: 'Shield' },
    5: { id: 5, name: 'Extra' },
};

export const ARMOR_CATEGORY_LIST = Object.values(ARMOR_CATEGORIES);
export const ARMOR_CATEGORY_SELECT_LIST = NameSelectOptionList(ARMOR_CATEGORY_LIST);

export const PROFICIENCY_TYPES: BaseMap<CoreComponent> = {
    1: { id: 1, name: 'Simple Weapon' },
    2: { id: 2, name: 'Martial Weapon' },
    3: { id: 3, name: 'Exotic Weapon' },
    4: { id: 4, name: 'Light Armor' },
    5: { id: 5, name: 'Medium Armor' },
    6: { id: 6, name: 'Heavy Armor' },
    7: { id: 7, name: 'Shield' },
    8: { id: 8, name: 'Tower Shield' },
};

export const PROFICIENCY_TYPE_LIST = Object.values(PROFICIENCY_TYPES);
export const PROFICIENCY_TYPE_SELECT_LIST = NameSelectOptionList(PROFICIENCY_TYPE_LIST);

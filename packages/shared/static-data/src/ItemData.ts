import type { CoreComponent, BaseMap, ProficiencyMap } from './types';
import { NameSelectOptionList } from './Util';

export const WEAPON_CATEGORY_ENUM = {
    SIMPLE: 1,
    MARTIAL: 2,
    EXOTIC: 3
};

export const WEAPON_CATEGORIES: BaseMap<CoreComponent> = {
    [WEAPON_CATEGORY_ENUM.SIMPLE]: { id: WEAPON_CATEGORY_ENUM.SIMPLE, name: 'Simple' },
    [WEAPON_CATEGORY_ENUM.MARTIAL]: { id: WEAPON_CATEGORY_ENUM.MARTIAL, name: 'Martial' },
    [WEAPON_CATEGORY_ENUM.EXOTIC]: { id: WEAPON_CATEGORY_ENUM.EXOTIC, name: 'Exotic' }
};

export const WEAPON_CATEGORY_LIST = Object.values(WEAPON_CATEGORIES);
export const WEAPON_CATEGORY_SELECT_LIST = NameSelectOptionList(WEAPON_CATEGORY_LIST);

export const WEAPON_TYPE_ENUM = {
    UNARMED_ATTACK: 1,
    LIGHT_MELEE_WEAPON: 2,
    ONE_HANDED_MELEE_WEAPON: 3,
    TWO_HANDED_MELEE_WEAPON: 4,
    RANGED_WEAPON: 5
};

export const WEAPON_TYPES: BaseMap<CoreComponent> = {
    [WEAPON_TYPE_ENUM.UNARMED_ATTACK]: { id: WEAPON_TYPE_ENUM.UNARMED_ATTACK, name: 'Unarmed Attack' },
    [WEAPON_TYPE_ENUM.LIGHT_MELEE_WEAPON]: { id: WEAPON_TYPE_ENUM.LIGHT_MELEE_WEAPON, name: 'Light Melee Weapon' },
    [WEAPON_TYPE_ENUM.ONE_HANDED_MELEE_WEAPON]: { id: WEAPON_TYPE_ENUM.ONE_HANDED_MELEE_WEAPON, name: 'One-Handed Melee Weapon' },
    [WEAPON_TYPE_ENUM.TWO_HANDED_MELEE_WEAPON]: { id: WEAPON_TYPE_ENUM.TWO_HANDED_MELEE_WEAPON, name: 'Two-Handed Melee Weapon' },
    [WEAPON_TYPE_ENUM.RANGED_WEAPON]: { id: WEAPON_TYPE_ENUM.RANGED_WEAPON, name: 'Ranged Weapon' }
};

export const WEAPON_TYPE_LIST = Object.values(WEAPON_TYPES);
export const WEAPON_TYPE_SELECT_LIST = NameSelectOptionList(WEAPON_TYPE_LIST);

export const DAMAGE_TYPE_ENUM = {
    BLUDGEONING: 1,
    PIERCING: 2,
    SLASHING: 3
};

export const DAMAGE_TYPES: BaseMap<CoreComponent> = {
    [DAMAGE_TYPE_ENUM.BLUDGEONING]: { id: DAMAGE_TYPE_ENUM.BLUDGEONING, name: 'Bludgeoning' },
    [DAMAGE_TYPE_ENUM.PIERCING]: { id: DAMAGE_TYPE_ENUM.PIERCING, name: 'Piercing' },
    [DAMAGE_TYPE_ENUM.SLASHING]: { id: DAMAGE_TYPE_ENUM.SLASHING, name: 'Slashing' }
};

export const DAMAGE_TYPE_LIST = Object.values(DAMAGE_TYPES);
export const DAMAGE_TYPE_SELECT_LIST = NameSelectOptionList(DAMAGE_TYPE_LIST);

export const ARMOR_CATEGORY_ENUM = {
    LIGHT: 1,
    MEDIUM: 2,
    HEAVY: 3,
    SHIELD: 4,
    EXTRA: 5
};

export const ARMOR_CATEGORIES: BaseMap<CoreComponent> = {
    [ARMOR_CATEGORY_ENUM.LIGHT]: { id: ARMOR_CATEGORY_ENUM.LIGHT, name: 'Light Armor' },
    [ARMOR_CATEGORY_ENUM.MEDIUM]: { id: ARMOR_CATEGORY_ENUM.MEDIUM, name: 'Medium Armor' },
    [ARMOR_CATEGORY_ENUM.HEAVY]: { id: ARMOR_CATEGORY_ENUM.HEAVY, name: 'Heavy Armor' },
    [ARMOR_CATEGORY_ENUM.SHIELD]: { id: ARMOR_CATEGORY_ENUM.SHIELD, name: 'Shield' },
    [ARMOR_CATEGORY_ENUM.EXTRA]: { id: ARMOR_CATEGORY_ENUM.EXTRA, name: 'Extra' },
};

export const ARMOR_CATEGORY_LIST = Object.values(ARMOR_CATEGORIES);
export const ARMOR_CATEGORY_SELECT_LIST = NameSelectOptionList(ARMOR_CATEGORY_LIST);

export const ITEM_TYPE_ENUM = {
    ARMOR: 1,
    WEAPON: 2,
    GEAR: 3,
    AMMO: 4,
    TOOL: 5,
    TRANSPORT: 6,
    CLOTHING: 7,
    FOOD_DRINK: 8,
    MOUNTS_ANIMALS: 9,
    OTHER: 10,
    SERVICE: 11
};

export const PROFICIENCY_TYPE_ENUM = {
    SIMPLE_WEAPON: 1,
    MARTIAL_WEAPON: 2,
    EXOTIC_WEAPON: 3,
    LIGHT_ARMOR: 4,
    MEDIUM_ARMOR: 5,
    HEAVY_ARMOR: 6,
    SHIELD: 7,
    TOWER_SHIELD: 8,
};

export const PROFICIENCY_TYPES: ProficiencyMap = {
    [PROFICIENCY_TYPE_ENUM.SIMPLE_WEAPON]: {
        id: PROFICIENCY_TYPE_ENUM.SIMPLE_WEAPON,
        name: 'Simple Weapon',
        itemTypeId: ITEM_TYPE_ENUM.WEAPON,
        category: WEAPON_CATEGORY_ENUM.SIMPLE
    },
    [PROFICIENCY_TYPE_ENUM.MARTIAL_WEAPON]: {
        id: PROFICIENCY_TYPE_ENUM.MARTIAL_WEAPON,
        name: 'Martial Weapon',
        itemTypeId: ITEM_TYPE_ENUM.WEAPON,
        category: WEAPON_CATEGORY_ENUM.MARTIAL
    },
    [PROFICIENCY_TYPE_ENUM.EXOTIC_WEAPON]: {
        id: PROFICIENCY_TYPE_ENUM.EXOTIC_WEAPON,
        name: 'Exotic Weapon',
        itemTypeId: ITEM_TYPE_ENUM.WEAPON,
        category: WEAPON_CATEGORY_ENUM.EXOTIC
    },
    [PROFICIENCY_TYPE_ENUM.LIGHT_ARMOR]: {
        id: PROFICIENCY_TYPE_ENUM.LIGHT_ARMOR,
        name: 'Light Armor',
        itemTypeId: ITEM_TYPE_ENUM.ARMOR,
        category: ARMOR_CATEGORY_ENUM.LIGHT
    },
    [PROFICIENCY_TYPE_ENUM.MEDIUM_ARMOR]: {
        id: PROFICIENCY_TYPE_ENUM.MEDIUM_ARMOR,
        name: 'Medium Armor',
        itemTypeId: ITEM_TYPE_ENUM.ARMOR,
        category: ARMOR_CATEGORY_ENUM.MEDIUM
    },
    [PROFICIENCY_TYPE_ENUM.HEAVY_ARMOR]: {
        id: PROFICIENCY_TYPE_ENUM.HEAVY_ARMOR,
        name: 'Heavy Armor',
        itemTypeId: ITEM_TYPE_ENUM.ARMOR,
        category: ARMOR_CATEGORY_ENUM.HEAVY
    },
    [PROFICIENCY_TYPE_ENUM.SHIELD]: {
        id: PROFICIENCY_TYPE_ENUM.SHIELD,
        name: 'Shield',
        itemTypeId: ITEM_TYPE_ENUM.ARMOR,
        category: ARMOR_CATEGORY_ENUM.SHIELD
    },
    [PROFICIENCY_TYPE_ENUM.TOWER_SHIELD]: {
        id: PROFICIENCY_TYPE_ENUM.TOWER_SHIELD,
        name: 'Tower Shield',
        itemTypeId: ITEM_TYPE_ENUM.ARMOR,
        category: ARMOR_CATEGORY_ENUM.SHIELD
    },
};

export const PROFICIENCY_TYPE_LIST = Object.values(PROFICIENCY_TYPES);
export const PROFICIENCY_TYPE_SELECT_LIST = NameSelectOptionList(PROFICIENCY_TYPE_LIST);



export const ITEM_TYPES: BaseMap<CoreComponent> = {
    [ITEM_TYPE_ENUM.ARMOR]: { id: ITEM_TYPE_ENUM.ARMOR, name: 'Armor' },
    [ITEM_TYPE_ENUM.WEAPON]: { id: ITEM_TYPE_ENUM.WEAPON, name: 'Weapon' },
    [ITEM_TYPE_ENUM.GEAR]: { id: ITEM_TYPE_ENUM.GEAR, name: 'Gear' },
    [ITEM_TYPE_ENUM.AMMO]: { id: ITEM_TYPE_ENUM.AMMO, name: 'Ammo' },
    [ITEM_TYPE_ENUM.TOOL]: { id: ITEM_TYPE_ENUM.TOOL, name: 'Tool' },
    [ITEM_TYPE_ENUM.TRANSPORT]: { id: ITEM_TYPE_ENUM.TRANSPORT, name: 'Transport' },
    [ITEM_TYPE_ENUM.CLOTHING]: { id: ITEM_TYPE_ENUM.CLOTHING, name: 'Clothing' },
    [ITEM_TYPE_ENUM.FOOD_DRINK]: { id: ITEM_TYPE_ENUM.FOOD_DRINK, name: 'Food & Drink' },
    [ITEM_TYPE_ENUM.MOUNTS_ANIMALS]: { id: ITEM_TYPE_ENUM.MOUNTS_ANIMALS, name: 'Mounts & Animals' },
    [ITEM_TYPE_ENUM.OTHER]: { id: ITEM_TYPE_ENUM.OTHER, name: 'Other' },
    [ITEM_TYPE_ENUM.SERVICE]: { id: ITEM_TYPE_ENUM.SERVICE, name: 'Service' }
};

export const ITEM_TYPE_LIST = Object.values(ITEM_TYPES);
export const ITEM_TYPE_SELECT_LIST = NameSelectOptionList(ITEM_TYPE_LIST);

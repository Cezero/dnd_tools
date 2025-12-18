import type { CoreComponent, BaseMap, ProficiencyMap } from './types';

export const WEAPON_CATEGORY_ENUM = {
    Simple: 1,
    Martial: 2,
    Exotic: 3
};

export const WEAPON_CATEGORIES: BaseMap<CoreComponent> = {
    [WEAPON_CATEGORY_ENUM.Simple]: { id: WEAPON_CATEGORY_ENUM.Simple, name: 'Simple' },
    [WEAPON_CATEGORY_ENUM.Martial]: { id: WEAPON_CATEGORY_ENUM.Martial, name: 'Martial' },
    [WEAPON_CATEGORY_ENUM.Exotic]: { id: WEAPON_CATEGORY_ENUM.Exotic, name: 'Exotic' }
};

export const WEAPON_CATEGORY_LIST = Object.values(WEAPON_CATEGORIES);

export const WEAPON_TYPE_ENUM = {
    UnarmedAttack: 1,
    LightMeleeWeapon: 2,
    OneHandedMeleeWeapon: 3,
    TwoHandedMeleeWeapon: 4,
    RangedWeapon: 5
};

export const WEAPON_TYPES: BaseMap<CoreComponent> = {
    [WEAPON_TYPE_ENUM.UnarmedAttack]: { id: WEAPON_TYPE_ENUM.UnarmedAttack, name: 'Unarmed Attack' },
    [WEAPON_TYPE_ENUM.LightMeleeWeapon]: { id: WEAPON_TYPE_ENUM.LightMeleeWeapon, name: 'Light Melee Weapon' },
    [WEAPON_TYPE_ENUM.OneHandedMeleeWeapon]: { id: WEAPON_TYPE_ENUM.OneHandedMeleeWeapon, name: 'One-Handed Melee Weapon' },
    [WEAPON_TYPE_ENUM.TwoHandedMeleeWeapon]: { id: WEAPON_TYPE_ENUM.TwoHandedMeleeWeapon, name: 'Two-Handed Melee Weapon' },
    [WEAPON_TYPE_ENUM.RangedWeapon]: { id: WEAPON_TYPE_ENUM.RangedWeapon, name: 'Ranged Weapon' }
};

export const WEAPON_TYPE_LIST = Object.values(WEAPON_TYPES);

export const DamageSourceType = {
    Physical: 1,
    Energy: 2,
};

export const DAMAGE_SOURCES: BaseMap<CoreComponent> = {
    [DamageSourceType.Physical]: { id: DamageSourceType.Physical, name: 'Physical' },
    [DamageSourceType.Energy]: { id: DamageSourceType.Energy, name: 'Energy' },
};

export const DAMAGE_SOURCE_LIST = Object.values(DAMAGE_SOURCES);

export const DAMAGE_TYPE_ENUM = {
    All: 0,
    Bludgeoning: 1,
    Piercing: 2,
    Slashing: 3,
    Fire: 4,
    Cold: 5,
    Acid: 6,
    Electricity: 7,
    Necrotic: 8,
    Poison: 9,
    Radiant: 10,
    Force: 11,
    Magic: 12,
    Lawful: 13,
    Chaotic: 14,
    Good: 15,
    Evil: 16,
    Silver: 17,
    Adamantine: 18,
    ColdIron: 19,
    Epic: 20,
    Sonic: 21,
};

export const DAMAGE_TYPES: BaseMap<CoreComponent> = {
    [DAMAGE_TYPE_ENUM.All]: { id: DAMAGE_TYPE_ENUM.All, name: '-' },
    [DAMAGE_TYPE_ENUM.Bludgeoning]: { id: DAMAGE_TYPE_ENUM.Bludgeoning, name: 'Bludgeoning' },
    [DAMAGE_TYPE_ENUM.Piercing]: { id: DAMAGE_TYPE_ENUM.Piercing, name: 'Piercing' },
    [DAMAGE_TYPE_ENUM.Slashing]: { id: DAMAGE_TYPE_ENUM.Slashing, name: 'Slashing' },
    [DAMAGE_TYPE_ENUM.Fire]: { id: DAMAGE_TYPE_ENUM.Fire, name: 'Fire' },
    [DAMAGE_TYPE_ENUM.Cold]: { id: DAMAGE_TYPE_ENUM.Cold, name: 'Cold' },
    [DAMAGE_TYPE_ENUM.Acid]: { id: DAMAGE_TYPE_ENUM.Acid, name: 'Acid' },
    [DAMAGE_TYPE_ENUM.Electricity]: { id: DAMAGE_TYPE_ENUM.Electricity, name: 'Electricity' },
    [DAMAGE_TYPE_ENUM.Necrotic]: { id: DAMAGE_TYPE_ENUM.Necrotic, name: 'Necrotic' },
    [DAMAGE_TYPE_ENUM.Poison]: { id: DAMAGE_TYPE_ENUM.Poison, name: 'Poison' },
    [DAMAGE_TYPE_ENUM.Radiant]: { id: DAMAGE_TYPE_ENUM.Radiant, name: 'Radiant' },
    [DAMAGE_TYPE_ENUM.Force]: { id: DAMAGE_TYPE_ENUM.Force, name: 'Force' },
    [DAMAGE_TYPE_ENUM.Magic]: { id: DAMAGE_TYPE_ENUM.Magic, name: 'Magic' },
    [DAMAGE_TYPE_ENUM.Lawful]: { id: DAMAGE_TYPE_ENUM.Lawful, name: 'Lawful' },
    [DAMAGE_TYPE_ENUM.Chaotic]: { id: DAMAGE_TYPE_ENUM.Chaotic, name: 'Chaotic' },
    [DAMAGE_TYPE_ENUM.Good]: { id: DAMAGE_TYPE_ENUM.Good, name: 'Good' },
    [DAMAGE_TYPE_ENUM.Evil]: { id: DAMAGE_TYPE_ENUM.Evil, name: 'Evil' },
    [DAMAGE_TYPE_ENUM.Silver]: { id: DAMAGE_TYPE_ENUM.Silver, name: 'Silver' },
    [DAMAGE_TYPE_ENUM.Adamantine]: { id: DAMAGE_TYPE_ENUM.Adamantine, name: 'Adamantine' },
    [DAMAGE_TYPE_ENUM.ColdIron]: { id: DAMAGE_TYPE_ENUM.ColdIron, name: 'Cold Iron' },
    [DAMAGE_TYPE_ENUM.Epic]: { id: DAMAGE_TYPE_ENUM.Epic, name: 'Epic' },
    [DAMAGE_TYPE_ENUM.Sonic]: { id: DAMAGE_TYPE_ENUM.Sonic, name: 'Sonic' },
};

export const DAMAGE_TYPE_LIST = Object.values(DAMAGE_TYPES);

export const DAMAGE_TYPE_COMPATIBILITY = {
    [DamageSourceType.Physical]: [
        DAMAGE_TYPE_ENUM.Bludgeoning,
        DAMAGE_TYPE_ENUM.Piercing,
        DAMAGE_TYPE_ENUM.Slashing,
    ],
    [DamageSourceType.Energy]: [
        DAMAGE_TYPE_ENUM.Acid,
        DAMAGE_TYPE_ENUM.Cold,
        DAMAGE_TYPE_ENUM.Electricity,
        DAMAGE_TYPE_ENUM.Fire,
        DAMAGE_TYPE_ENUM.Sonic,
    ],
};

export const ENERGY_DAMAGE_TYPE_LIST = Object.values(DAMAGE_TYPE_COMPATIBILITY[DamageSourceType.Energy].map(type => DAMAGE_TYPES[type]));
export const PHYSICAL_DAMAGE_TYPE_LIST = Object.values(DAMAGE_TYPE_COMPATIBILITY[DamageSourceType.Physical].map(type => DAMAGE_TYPES[type]));

export const ARMOR_CATEGORY_ENUM = {
    Light: 1,
    Medium: 2,
    Heavy: 3,
    Shield: 4,
    Extra: 5
};

export const ARMOR_CATEGORIES: BaseMap<CoreComponent> = {
    [ARMOR_CATEGORY_ENUM.Light]: { id: ARMOR_CATEGORY_ENUM.Light, name: 'Light Armor' },
    [ARMOR_CATEGORY_ENUM.Medium]: { id: ARMOR_CATEGORY_ENUM.Medium, name: 'Medium Armor' },
    [ARMOR_CATEGORY_ENUM.Heavy]: { id: ARMOR_CATEGORY_ENUM.Heavy, name: 'Heavy Armor' },
    [ARMOR_CATEGORY_ENUM.Shield]: { id: ARMOR_CATEGORY_ENUM.Shield, name: 'Shield' },
    [ARMOR_CATEGORY_ENUM.Extra]: { id: ARMOR_CATEGORY_ENUM.Extra, name: 'Extra' },
};

export const ARMOR_CATEGORY_LIST = Object.values(ARMOR_CATEGORIES);

export const ITEM_TYPE_ENUM = {
    Armor: 1,
    Weapon: 2,
    Gear: 3,
    Ammo: 4,
    Tool: 5,
    Transport: 6,
    Clothing: 7,
    FoodDrink: 8,
    MountsAnimals: 9,
    Other: 10,
    Service: 11
};

export const PROFICIENCY_TYPE_ENUM = {
    SimpleWeapon: 1,
    MartialWeapon: 2,
    ExoticWeapon: 3,
    LightArmor: 4,
    MediumArmor: 5,
    HeavyArmor: 6,
    Shield: 7,
    TowerShield: 8,
};

export const PROFICIENCY_TYPES: ProficiencyMap = {
    [PROFICIENCY_TYPE_ENUM.SimpleWeapon]: {
        id: PROFICIENCY_TYPE_ENUM.SimpleWeapon,
        name: 'Simple Weapon',
        itemTypeId: ITEM_TYPE_ENUM.Weapon,
        category: WEAPON_CATEGORY_ENUM.Simple,
        allName: 'all simple weapons'
    },
    [PROFICIENCY_TYPE_ENUM.MartialWeapon]: {
        id: PROFICIENCY_TYPE_ENUM.MartialWeapon,
        name: 'Martial Weapon',
        itemTypeId: ITEM_TYPE_ENUM.Weapon,
        category: WEAPON_CATEGORY_ENUM.Martial,
        allName: 'all martial weapons'
    },
    [PROFICIENCY_TYPE_ENUM.ExoticWeapon]: {
        id: PROFICIENCY_TYPE_ENUM.ExoticWeapon,
        name: 'Exotic Weapon',
        itemTypeId: ITEM_TYPE_ENUM.Weapon,
        category: WEAPON_CATEGORY_ENUM.Exotic,
        allName: 'all exotic weapons'
    },
    [PROFICIENCY_TYPE_ENUM.LightArmor]: {
        id: PROFICIENCY_TYPE_ENUM.LightArmor,
        name: 'Light Armor',
        itemTypeId: ITEM_TYPE_ENUM.Armor,
        category: ARMOR_CATEGORY_ENUM.Light,
        allName: 'all light armor'
    },
    [PROFICIENCY_TYPE_ENUM.MediumArmor]: {
        id: PROFICIENCY_TYPE_ENUM.MediumArmor,
        name: 'Medium Armor',
        itemTypeId: ITEM_TYPE_ENUM.Armor,
        category: ARMOR_CATEGORY_ENUM.Medium,
        allName: 'all medium armor'
    },
    [PROFICIENCY_TYPE_ENUM.HeavyArmor]: {
        id: PROFICIENCY_TYPE_ENUM.HeavyArmor,
        name: 'Heavy Armor',
        itemTypeId: ITEM_TYPE_ENUM.Armor,
        category: ARMOR_CATEGORY_ENUM.Heavy,
        allName: 'all heavy armor'
    },
    [PROFICIENCY_TYPE_ENUM.Shield]: {
        id: PROFICIENCY_TYPE_ENUM.Shield,
        name: 'Shield',
        itemTypeId: ITEM_TYPE_ENUM.Armor,
        category: ARMOR_CATEGORY_ENUM.Shield,
        allName: 'all shields'
    },
    [PROFICIENCY_TYPE_ENUM.TowerShield]: {
        id: PROFICIENCY_TYPE_ENUM.TowerShield,
        name: 'Tower Shield',
        itemTypeId: ITEM_TYPE_ENUM.Armor,
        category: ARMOR_CATEGORY_ENUM.Shield,
        allName: 'all tower shields'
    },
};

export const PROFICIENCY_TYPE_LIST = Object.values(PROFICIENCY_TYPES);

export const ITEM_TYPES: BaseMap<CoreComponent> = {
    [ITEM_TYPE_ENUM.Armor]: { id: ITEM_TYPE_ENUM.Armor, name: 'Armor' },
    [ITEM_TYPE_ENUM.Weapon]: { id: ITEM_TYPE_ENUM.Weapon, name: 'Weapon' },
    [ITEM_TYPE_ENUM.Gear]: { id: ITEM_TYPE_ENUM.Gear, name: 'Gear' },
    [ITEM_TYPE_ENUM.Ammo]: { id: ITEM_TYPE_ENUM.Ammo, name: 'Ammo' },
    [ITEM_TYPE_ENUM.Tool]: { id: ITEM_TYPE_ENUM.Tool, name: 'Tool' },
    [ITEM_TYPE_ENUM.Transport]: { id: ITEM_TYPE_ENUM.Transport, name: 'Transport' },
    [ITEM_TYPE_ENUM.Clothing]: { id: ITEM_TYPE_ENUM.Clothing, name: 'Clothing' },
    [ITEM_TYPE_ENUM.FoodDrink]: { id: ITEM_TYPE_ENUM.FoodDrink, name: 'Food & Drink' },
    [ITEM_TYPE_ENUM.MountsAnimals]: { id: ITEM_TYPE_ENUM.MountsAnimals, name: 'Mounts & Animals' },
    [ITEM_TYPE_ENUM.Other]: { id: ITEM_TYPE_ENUM.Other, name: 'Other' },
    [ITEM_TYPE_ENUM.Service]: { id: ITEM_TYPE_ENUM.Service, name: 'Service' }
};

export const ITEM_TYPE_LIST = Object.values(ITEM_TYPES);

export const LOCATION_ENUM = {
    Owned: 0,
    Carried: 1,
    MainHand: 2,
    OffHand: 3,
    RightRing: 4,
    LeftRing: 5,
    Hands: 6,
    Arms: 7,
    Head: 8,
    Face: 9,
    Shoulders: 10,
    Neck: 11,
    Body: 12,
    Torso: 13,
    Waist: 14,
    Feet: 15,
};

export const LOCATIONS: BaseMap<CoreComponent> = {
    [LOCATION_ENUM.Owned]: { id: LOCATION_ENUM.Owned, name: 'Owned' },
    [LOCATION_ENUM.Carried]: { id: LOCATION_ENUM.Carried, name: 'Carried' },
    [LOCATION_ENUM.MainHand]: { id: LOCATION_ENUM.MainHand, name: 'Main Hand' },
    [LOCATION_ENUM.OffHand]: { id: LOCATION_ENUM.OffHand, name: 'Off Hand' },
    [LOCATION_ENUM.RightRing]: { id: LOCATION_ENUM.RightRing, name: 'Right Ring' },
    [LOCATION_ENUM.LeftRing]: { id: LOCATION_ENUM.LeftRing, name: 'Left Ring' },
    [LOCATION_ENUM.Hands]: { id: LOCATION_ENUM.Hands, name: 'Hands' },
    [LOCATION_ENUM.Arms]: { id: LOCATION_ENUM.Arms, name: 'Arms' },
    [LOCATION_ENUM.Head]: { id: LOCATION_ENUM.Head, name: 'Head' },
    [LOCATION_ENUM.Face]: { id: LOCATION_ENUM.Face, name: 'Face' },
    [LOCATION_ENUM.Shoulders]: { id: LOCATION_ENUM.Shoulders, name: 'Shoulders' },
    [LOCATION_ENUM.Neck]: { id: LOCATION_ENUM.Neck, name: 'Neck' },
    [LOCATION_ENUM.Body]: { id: LOCATION_ENUM.Body, name: 'Body' },
    [LOCATION_ENUM.Torso]: { id: LOCATION_ENUM.Torso, name: 'Torso' },
    [LOCATION_ENUM.Waist]: { id: LOCATION_ENUM.Waist, name: 'Waist' },
    [LOCATION_ENUM.Feet]: { id: LOCATION_ENUM.Feet, name: 'Feet' },
};

export const LOCATION_LIST = Object.values(LOCATIONS);

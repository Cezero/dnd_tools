import { RpgDieMap, CurrencyMap, AlignmentMap, SizeMap, LanguageMap, EditionMap, CastingTypeMap, SettingMap, AbilityGenerationMethodMap, PointBuyOptionsMap, BooleanFilterMap, MonsterTypeMap, MonsterSubtypeMap, MonsterSpecialAbilityTypeMap, MonsterArmorComponentTypeMap, MonsterSpellTypeMap, MonsterSpellUsesPerDayMap, MovementTypeMap, ManeuverabilityMap, MonsterExtraDescriptionTypeMap } from './types';

export const RpgDice = {
    D4: 0,
    D6: 1,
    D8: 2,
    D10: 3,
    D12: 4,
    D20: 5,
    D100: 6,
    D2: 7,
    D3: 8,
} as const;

export type RpgDice = typeof RpgDice[keyof typeof RpgDice];

export const RPG_DICE: RpgDieMap = {
    [RpgDice.D4]: { id: RpgDice.D4, name: 'd4', sides: 4 },
    [RpgDice.D6]: { id: RpgDice.D6, name: 'd6', sides: 6 },
    [RpgDice.D8]: { id: RpgDice.D8, name: 'd8', sides: 8 },
    [RpgDice.D10]: { id: RpgDice.D10, name: 'd10', sides: 10 },
    [RpgDice.D12]: { id: RpgDice.D12, name: 'd12', sides: 12 },
    [RpgDice.D20]: { id: RpgDice.D20, name: 'd20', sides: 20 },
    [RpgDice.D100]: { id: RpgDice.D100, name: 'd100', sides: 100 },
    [RpgDice.D2]: { id: RpgDice.D2, name: 'd2', sides: 2 },
    [RpgDice.D3]: { id: RpgDice.D3, name: 'd3', sides: 3 },
}

export const RPG_DICE_LIST = Object.values(RPG_DICE);

export const CurrencyId = {
    Copper: 1,
    Silver: 2,
    Gold: 3,
    Platinum: 4,
    Gem: 5,
    ArtObject: 6,
    Other: 8
} as const;

export type CurrencyId = typeof CurrencyId[keyof typeof CurrencyId];

export const CURRENCY: CurrencyMap = {
    [CurrencyId.Copper]: { id: CurrencyId.Copper, name: 'Copper', abbreviation: 'cp', gpValue: .01 },
    [CurrencyId.Silver]: { id: CurrencyId.Silver, name: 'Silver', abbreviation: 'sp', gpValue: .1 },
    [CurrencyId.Gold]: { id: CurrencyId.Gold, name: 'Gold', abbreviation: 'gp', gpValue: 1 },
    [CurrencyId.Platinum]: { id: CurrencyId.Platinum, name: 'Platinum', abbreviation: 'pp', gpValue: 10 },
    [CurrencyId.Gem]: { id: CurrencyId.Gem, name: 'Gem', abbreviation: 'gem', gpValue: 0 },
    [CurrencyId.ArtObject]: { id: CurrencyId.ArtObject, name: 'Art Object', abbreviation: 'art', gpValue: 0 },
    [CurrencyId.Other]: { id: CurrencyId.Other, name: 'Other', abbreviation: 'other', gpValue: 0 },
}

export const CURRENCY_LIST = Object.values(CURRENCY);

export const AlignmentId = {
    LawfulGood: 0,
    NeutralGood: 1,
    ChaoticGood: 2,
    LawfulNeutral: 3,
    TrueNeutral: 4,
    ChaoticNeutral: 5,
    LawfulEvil: 6,
    NeutralEvil: 7,
    ChaoticEvil: 8,
} as const;

export type AlignmentId = typeof AlignmentId[keyof typeof AlignmentId];

export const ALIGNMENT_MAP: AlignmentMap = {
    [AlignmentId.LawfulGood]: { id: AlignmentId.LawfulGood, name: 'Lawful Good', abbreviation: 'LG' },
    [AlignmentId.NeutralGood]: { id: AlignmentId.NeutralGood, name: 'Neutral Good', abbreviation: 'NG' },
    [AlignmentId.ChaoticGood]: { id: AlignmentId.ChaoticGood, name: 'Chaotic Good', abbreviation: 'CG' },
    [AlignmentId.LawfulNeutral]: { id: AlignmentId.LawfulNeutral, name: 'Lawful Neutral', abbreviation: 'LN' },
    [AlignmentId.TrueNeutral]: { id: AlignmentId.TrueNeutral, name: 'True Neutral', abbreviation: 'N' },
    [AlignmentId.ChaoticNeutral]: { id: AlignmentId.ChaoticNeutral, name: 'Chaotic Neutral', abbreviation: 'CN' },
    [AlignmentId.LawfulEvil]: { id: AlignmentId.LawfulEvil, name: 'Lawful Evil', abbreviation: 'LE' },
    [AlignmentId.NeutralEvil]: { id: AlignmentId.NeutralEvil, name: 'Neutral Evil', abbreviation: 'NE' },
    [AlignmentId.ChaoticEvil]: { id: AlignmentId.ChaoticEvil, name: 'Chaotic Evil', abbreviation: 'CE' },
}

export const ALIGNMENT_LIST = Object.values(ALIGNMENT_MAP);

// Size ID enum for type safety
export const SizeId = {
    Fine: 1,
    Diminutive: 2,
    Tiny: 3,
    Small: 4,
    Medium: 5,
    Large: 6,
    Huge: 7,
    Gargantuan: 8,
    Colossal: 9,
} as const;

export type SizeId = typeof SizeId[keyof typeof SizeId];

export const SIZE_MAP: SizeMap = {
    [SizeId.Fine]: {
        id: SizeId.Fine,
        name: 'Fine',
        abbreviation: 'F',
        sizeModifier: +8,
        grappleModifier: -16,
        hideModifier: -16,
        heightOrLength: "6 in. or less",
        weight: "1/8 lb. or less",
        space: "1/2 ft.",
        naturalReachTall: 0,
        naturalReachLong: 0
    },
    [SizeId.Diminutive]: {
        id: SizeId.Diminutive,
        name: 'Diminutive',
        abbreviation: 'D',
        sizeModifier: +4,
        grappleModifier: -12,
        hideModifier: -12,
        heightOrLength: "6 in. - 1 ft.",
        weight: "1/8 lb. - 1 lb.",
        space: "1 ft.",
        naturalReachTall: 0,
        naturalReachLong: 0
    },
    [SizeId.Tiny]: {
        id: SizeId.Tiny,
        name: 'Tiny',
        abbreviation: 'T',
        sizeModifier: +2,
        grappleModifier: -8,
        hideModifier: -8,
        heightOrLength: "1 ft. - 2 ft.",
        weight: "1 lb. - 8 lbs.",
        space: "2 1/2 ft.",
        naturalReachTall: 0,
        naturalReachLong: 0
    },
    [SizeId.Small]: {
        id: SizeId.Small,
        name: 'Small',
        abbreviation: 'S',
        sizeModifier: +1,
        grappleModifier: -4,
        hideModifier: -4,
        heightOrLength: "2 ft. - 4 ft.",
        weight: "8 lbs. - 60 lbs.",
        space: "5 ft.",
        naturalReachTall: 5,
        naturalReachLong: 5
    },
    [SizeId.Medium]: {
        id: SizeId.Medium,
        name: 'Medium',
        abbreviation: 'M',
        sizeModifier: 0,
        grappleModifier: 0,
        hideModifier: 0,
        heightOrLength: "4 ft. - 8 ft.",
        weight: "60 lbs. - 500 lbs.",
        space: "5 ft.",
        naturalReachTall: 5,
        naturalReachLong: 5
    },
    [SizeId.Large]: {
        id: SizeId.Large,
        name: 'Large',
        abbreviation: 'L',
        sizeModifier: -1,
        grappleModifier: 4,
        hideModifier: 4,
        heightOrLength: "8 ft. - 16 ft.",
        weight: "500 lbs. - 2 tons",
        space: "10 ft.",
        naturalReachTall: 10,
        naturalReachLong: 5
    },
    [SizeId.Huge]: {
        id: SizeId.Huge,
        name: 'Huge',
        abbreviation: 'H',
        sizeModifier: -2,
        grappleModifier: 8,
        hideModifier: 8,
        heightOrLength: "16 ft. - 32 ft.",
        weight: "2 tons - 16 tons",
        space: "15 ft.",
        naturalReachTall: 15,
        naturalReachLong: 10
    },
    [SizeId.Gargantuan]: {
        id: SizeId.Gargantuan,
        name: 'Gargantuan',
        abbreviation: 'G',
        sizeModifier: -3,
        grappleModifier: 12,
        hideModifier: 12,
        heightOrLength: "32 ft. - 64 ft.",
        weight: "16 tons - 125 tons",
        space: "20 ft.",
        naturalReachTall: 20,
        naturalReachLong: 15
    },
    [SizeId.Colossal]: {
        id: SizeId.Colossal,
        name: 'Colossal',
        abbreviation: 'C',
        sizeModifier: -4,
        grappleModifier: 16,
        hideModifier: 16,
        heightOrLength: "64 ft. - 128 ft.",
        weight: "125 tons or more",
        space: "30 ft.",
        naturalReachTall: 30,
        naturalReachLong: 20
    },
}

export const SIZE_LIST = Object.values(SIZE_MAP);

// Carrying Capacity Table (for Medium bipedal creatures)
export interface CarryingCapacityEntry {
    light: number;
    medium: number;
    heavy: number;
}

export const CARRYING_CAPACITY_TABLE: Record<number, CarryingCapacityEntry> = {
    1: { light: 3, medium: 6, heavy: 10 },
    2: { light: 6, medium: 13, heavy: 20 },
    3: { light: 10, medium: 20, heavy: 30 },
    4: { light: 13, medium: 26, heavy: 40 },
    5: { light: 16, medium: 33, heavy: 50 },
    6: { light: 20, medium: 40, heavy: 60 },
    7: { light: 23, medium: 46, heavy: 70 },
    8: { light: 26, medium: 53, heavy: 80 },
    9: { light: 30, medium: 60, heavy: 90 },
    10: { light: 33, medium: 66, heavy: 100 },
    11: { light: 38, medium: 76, heavy: 115 },
    12: { light: 43, medium: 86, heavy: 130 },
    13: { light: 50, medium: 100, heavy: 150 },
    14: { light: 58, medium: 116, heavy: 175 },
    15: { light: 66, medium: 133, heavy: 200 },
    16: { light: 76, medium: 153, heavy: 230 },
    17: { light: 86, medium: 173, heavy: 260 },
    18: { light: 100, medium: 200, heavy: 300 },
    19: { light: 116, medium: 233, heavy: 350 },
    20: { light: 133, medium: 266, heavy: 400 },
    21: { light: 153, medium: 306, heavy: 460 },
    22: { light: 173, medium: 346, heavy: 520 },
    23: { light: 200, medium: 400, heavy: 600 },
    24: { light: 233, medium: 466, heavy: 700 },
    25: { light: 266, medium: 533, heavy: 800 },
    26: { light: 306, medium: 613, heavy: 920 },
    27: { light: 346, medium: 693, heavy: 1040 },
    28: { light: 400, medium: 800, heavy: 1200 },
    29: { light: 466, medium: 933, heavy: 1400 },
};

// Size multipliers for carrying capacity (bipedal creatures)
export const CARRYING_CAPACITY_SIZE_MULTIPLIERS: Record<number, number> = {
    1: 0.125, // Fine
    2: 0.25,  // Diminutive
    3: 0.5,   // Tiny
    4: 0.75,  // Small
    5: 1,     // Medium (default)
    6: 2,     // Large
    7: 4,     // Huge
    8: 8,     // Gargantuan
    9: 16,    // Colossal
};

export const LANGUAGE_MAP: LanguageMap = {
    1: { id: 1, name: 'Abyssal', typicalSpeakers: 'Demons, chaotic evil outsiders', alphabet: 'Infernal' },
    2: { id: 2, name: 'Aquan', typicalSpeakers: 'Water-based creatures', alphabet: 'Elven' },
    3: { id: 3, name: 'Auran', typicalSpeakers: 'Air-based creatures', alphabet: 'Draconic' },
    4: { id: 4, name: 'Celestial', typicalSpeakers: 'Good outsiders', alphabet: 'Celestial' },
    5: { id: 5, name: 'Common', typicalSpeakers: 'Humans, halflings, half-elves, half-orcs', alphabet: 'Common' },
    6: { id: 6, name: 'Draconic', typicalSpeakers: 'Kobolds, troglodytes, lizardfolk, dragons', alphabet: 'Draconic' },
    7: { id: 7, name: 'Druidic', typicalSpeakers: 'Druids (only)', alphabet: 'Druidic' },
    8: { id: 8, name: 'Dwarven', typicalSpeakers: 'Dwarves', alphabet: 'Dwarven' },
    9: { id: 9, name: 'Elven', typicalSpeakers: 'Elves', alphabet: 'Elven' },
    10: { id: 10, name: 'Giant', typicalSpeakers: 'Ogres, giants', alphabet: 'Dwarven' },
    11: { id: 11, name: 'Gnome', typicalSpeakers: 'Gnomes', alphabet: 'Dwarven' },
    12: { id: 12, name: 'Goblin', typicalSpeakers: 'Goblins, hobgoblins, bugbears', alphabet: 'Dwarven' },
    13: { id: 13, name: 'Gnoll', typicalSpeakers: 'Gnolls', alphabet: 'Common' },
    14: { id: 14, name: 'Halfling', typicalSpeakers: 'Halflings', alphabet: 'Common' },
    15: { id: 15, name: 'Ignan', typicalSpeakers: 'Fire-based creatures', alphabet: 'Draconic' },
    16: { id: 16, name: 'Infernal', typicalSpeakers: 'Devils, lawful evil outsiders', alphabet: 'Infernal' },
    17: { id: 17, name: 'Orc', typicalSpeakers: 'Orcs', alphabet: 'Dwarven' },
    18: { id: 18, name: 'Sylvan', typicalSpeakers: 'Dryads, brownies, leprechauns', alphabet: 'Elven' },
    19: { id: 19, name: 'Terran', typicalSpeakers: 'Xorns and other earth-based creatures', alphabet: 'Dwarven' },
    20: { id: 20, name: 'Undercommon', typicalSpeakers: 'Drow', alphabet: 'Elven' },
    21: { id: 21, name: 'Feline', typicalSpeakers: 'Catfolk', alphabet: 'Common' },
}

export const LANGUAGE_LIST = Object.values(LANGUAGE_MAP);

export const EditionId = {
    ODND: 1,
    ADND: 2,
    ADND_2E: 3,
    DND_3E: 4,
    DND_3_5E: 5,
    DND_4E: 6,
    DND_5E: 7,
    DND_3x: 8,
} as const;

export type EditionId = typeof EditionId[keyof typeof EditionId];

export const EDITION_MAP: EditionMap = {
    [EditionId.ODND]: { id: EditionId.ODND, name: 'Original Dungeons & Dragons', abbreviation: 'OD&D' },
    [EditionId.ADND]: { id: EditionId.ADND, name: 'Advanced Dungeons & Dragons', abbreviation: 'AD&D' },
    [EditionId.ADND_2E]: { id: EditionId.ADND_2E, name: 'Advanced Dungeons & Dragon 2nd Edition', abbreviation: 'AD&D 2E' },
    [EditionId.DND_3E]: { id: EditionId.DND_3E, name: 'Dungeons & Dragons 3rd Edition', abbreviation: 'D&D 3E' },
    [EditionId.DND_3_5E]: { id: EditionId.DND_3_5E, name: 'Dungeons & Dragons 3.5 Edition', abbreviation: 'D&D 3.5E' },
    [EditionId.DND_4E]: { id: EditionId.DND_4E, name: 'Dungeons & Dragons 4th Edition', abbreviation: 'D&D 4E' },
    [EditionId.DND_5E]: { id: EditionId.DND_5E, name: 'Dungeons & Dragons 5th Edition', abbreviation: 'D&D 5E' },
    [EditionId.DND_3x]: { id: EditionId.DND_3x, name: 'Dungeons & Dragons 3.0/3.5 Combined', abbreviation: 'D&D 3x' },
}

export const EDITION_LIST = Object.values(EDITION_MAP);

// NEW: Advanced options mapping by edition
export const ADVANCED_OPTIONS_EDITION_MAP = {
    [EditionId.DND_3E]: ['allowVariantClasses', 'isGestalt', 'ignoreLevelAdjustment', 'maxHpAtFirstLevel'],
    [EditionId.DND_3_5E]: ['allowVariantClasses', 'isGestalt', 'ignoreLevelAdjustment', 'maxHpAtFirstLevel'],
    [EditionId.DND_3x]: ['allowVariantClasses', 'isGestalt', 'ignoreLevelAdjustment', 'maxHpAtFirstLevel'],
    // Future editions can have their own advanced options
    // [EditionId.DND_4E]: ['some4EOption'],
    // [EditionId.DND_5E]: ['some5EOption'],
} as const;

// Helper function to get advanced options for an edition
export const getAdvancedOptionsForEdition = (editionId: number): string[] => {
    const options = ADVANCED_OPTIONS_EDITION_MAP[editionId as keyof typeof ADVANCED_OPTIONS_EDITION_MAP];
    return options ? [...options] : [];
};

// Helper function to check if an edition has any advanced options
export const hasAdvancedOptions = (editionId: number): boolean => {
    return getAdvancedOptionsForEdition(editionId).length > 0;
};

// Helper function to check if a specific advanced option is available for an edition
export const isAdvancedOptionAvailable = (editionId: number, optionName: string): boolean => {
    return getAdvancedOptionsForEdition(editionId).includes(optionName);
};

export const CastingType = {
    Prepared: 1,
    Spontaneous: 2,
} as const;

export type CastingType = typeof CastingType[keyof typeof CastingType];

export const CASTING_TYPE_MAP: CastingTypeMap = {
    [CastingType.Prepared]: { id: CastingType.Prepared, name: 'Prepared' },
    [CastingType.Spontaneous]: { id: CastingType.Spontaneous, name: 'Spontaneous' },
}

export const CASTING_TYPE_LIST = Object.values(CASTING_TYPE_MAP);

export const Setting = {
    Greyhawk: 1,
    ForgottenRealms: 2,
    Eberron: 3,
    Planescape: 4,
    Ravenloft: 5,
    Spelljammer: 6,
    DarkSun: 7,
    Dragonlance: 8,
} as const;

export type Setting = typeof Setting[keyof typeof Setting];

export const SETTING_MAP: SettingMap = {
    [Setting.Greyhawk]: { id: Setting.Greyhawk, name: 'Greyhawk' },
    [Setting.ForgottenRealms]: { id: Setting.ForgottenRealms, name: 'Forgotten Realms' },
    [Setting.Eberron]: { id: Setting.Eberron, name: 'Eberron' },
    [Setting.Planescape]: { id: Setting.Planescape, name: 'Planescape' },
    [Setting.Ravenloft]: { id: Setting.Ravenloft, name: 'Ravenloft' },
    [Setting.Spelljammer]: { id: Setting.Spelljammer, name: 'Spelljammer' },
    [Setting.DarkSun]: { id: Setting.DarkSun, name: 'Dark Sun' },
    [Setting.Dragonlance]: { id: Setting.Dragonlance, name: 'Dragonlance' },
}

export const SETTING_LIST = Object.values(SETTING_MAP);

export const AbilityGenerationMethod = {
    inorder: 1,
    arrange: 2,
    drop: 3,
    pointBuy: 4,
    manual: 5,
} as const;

export type AbilityGenerationMethod = typeof AbilityGenerationMethod[keyof typeof AbilityGenerationMethod];

export const ABILITY_GENERATION_METHOD_MAP: AbilityGenerationMethodMap = {
    [AbilityGenerationMethod.inorder]: { id: AbilityGenerationMethod.inorder, name: '3d6 Order' },
    [AbilityGenerationMethod.arrange]: { id: AbilityGenerationMethod.arrange, name: '3d6 Arrange' },
    [AbilityGenerationMethod.drop]: { id: AbilityGenerationMethod.drop, name: '4d6 Drop' },
    [AbilityGenerationMethod.pointBuy]: { id: AbilityGenerationMethod.pointBuy, name: 'Point Buy' },
    [AbilityGenerationMethod.manual]: { id: AbilityGenerationMethod.manual, name: 'Manual' },
}

export const ABILITY_GENERATION_METHOD_LIST = Object.values(ABILITY_GENERATION_METHOD_MAP);

export const PointBuyOptions = {
    LowPowered: 1,
    Challenging: 2,
    Tougher: 3,
    HighPowered: 4,
    Custom: 5,
} as const;

export type PointBuyOptions = typeof PointBuyOptions[keyof typeof PointBuyOptions];

export const POINT_BUY_OPTIONS_MAP: PointBuyOptionsMap = {
    [PointBuyOptions.LowPowered]: { id: PointBuyOptions.LowPowered, name: 'Low Powered' },
    [PointBuyOptions.Challenging]: { id: PointBuyOptions.Challenging, name: 'Challenging' },
    [PointBuyOptions.Tougher]: { id: PointBuyOptions.Tougher, name: 'Tougher' },
    [PointBuyOptions.HighPowered]: { id: PointBuyOptions.HighPowered, name: 'High Powered' },
    [PointBuyOptions.Custom]: { id: PointBuyOptions.Custom, name: 'Custom' },
}

export const POINT_BUY_OPTIONS_LIST = Object.values(POINT_BUY_OPTIONS_MAP);

export const ProgressionType = {
    good: 0,
    average: 1,
    poor: 2,
} as const;

export type ProgressionType = typeof ProgressionType[keyof typeof ProgressionType];


// Select lists for progression types
export const BAB_PROGRESSION_LIST = [
    { id: ProgressionType.good, name: 'Good' },
    { id: ProgressionType.average, name: 'Average' },
    { id: ProgressionType.poor, name: 'Poor' },
];

export const SAVE_PROGRESSION_LIST = [
    { id: ProgressionType.good, name: 'Good' },
    { id: ProgressionType.poor, name: 'Poor' },
];

export const BooleanFilter = {
    TRUE: 1,
    FALSE: 0,
} as const;

export type BooleanFilter = typeof BooleanFilter[keyof typeof BooleanFilter];

export const BOOLEAN_FILTER_MAP: BooleanFilterMap = {
    [BooleanFilter.TRUE]: { id: BooleanFilter.TRUE, name: 'Yes' },
    [BooleanFilter.FALSE]: { id: BooleanFilter.FALSE, name: 'No' },
}

export const BOOLEAN_FILTER_LIST = Object.values(BOOLEAN_FILTER_MAP);

// Resolution Step Type enum for feature resolution
export const ResolutionStepType = {
    Feature: 0,
    Choice: 1,
    Grant: 2,
    Cascade: 3,
} as const;

export type ResolutionStepType = typeof ResolutionStepType[keyof typeof ResolutionStepType];

// Monster Type ID enum for D&D 3.5 creature types
export const MonsterTypeId = {
    Aberration: 1,
    Animal: 2,
    Construct: 3,
    Dragon: 4,
    Elemental: 5,
    Fey: 6,
    Giant: 7,
    Humanoid: 8,
    MagicalBeast: 9,
    MonstrousHumanoid: 10,
    Ooze: 11,
    Outsider: 12,
    Plant: 13,
    Undead: 14,
    Vermin: 15,
} as const;

export type MonsterTypeId = typeof MonsterTypeId[keyof typeof MonsterTypeId];

export const MONSTER_TYPE_MAP: MonsterTypeMap = {
    [MonsterTypeId.Aberration]: { id: MonsterTypeId.Aberration, name: 'Aberration' },
    [MonsterTypeId.Animal]: { id: MonsterTypeId.Animal, name: 'Animal' },
    [MonsterTypeId.Construct]: { id: MonsterTypeId.Construct, name: 'Construct' },
    [MonsterTypeId.Dragon]: { id: MonsterTypeId.Dragon, name: 'Dragon' },
    [MonsterTypeId.Elemental]: { id: MonsterTypeId.Elemental, name: 'Elemental' },
    [MonsterTypeId.Fey]: { id: MonsterTypeId.Fey, name: 'Fey' },
    [MonsterTypeId.Giant]: { id: MonsterTypeId.Giant, name: 'Giant' },
    [MonsterTypeId.Humanoid]: { id: MonsterTypeId.Humanoid, name: 'Humanoid' },
    [MonsterTypeId.MagicalBeast]: { id: MonsterTypeId.MagicalBeast, name: 'Magical Beast' },
    [MonsterTypeId.MonstrousHumanoid]: { id: MonsterTypeId.MonstrousHumanoid, name: 'Monstrous Humanoid' },
    [MonsterTypeId.Ooze]: { id: MonsterTypeId.Ooze, name: 'Ooze' },
    [MonsterTypeId.Outsider]: { id: MonsterTypeId.Outsider, name: 'Outsider' },
    [MonsterTypeId.Plant]: { id: MonsterTypeId.Plant, name: 'Plant' },
    [MonsterTypeId.Undead]: { id: MonsterTypeId.Undead, name: 'Undead' },
    [MonsterTypeId.Vermin]: { id: MonsterTypeId.Vermin, name: 'Vermin' },
};

export const MONSTER_TYPE_LIST = Object.values(MONSTER_TYPE_MAP);

// Monster Subtype ID enum for creature subtypes (D&D 3.5 terminology)
export const MonsterSubtypeId = {
    Aquatic: 1,
    Air: 2,
    Earth: 3,
    Fire: 4,
    Water: 5,
    Cold: 6,
    Evil: 7,
    Good: 8,
    Lawful: 9,
    Chaotic: 10,
    Extraplanar: 11,
    Angel: 12,
    Archon: 13,
    Incorporeal: 14,
    Swarm: 15,
    Shapechanger: 16,
    Augmented: 17,
    Baatezu: 18,
    Eladrin: 19,
    Goblinoid: 20,
    Guardinal: 21,
    Native: 22,
    Reptilian: 23,
    Tanarri: 24,
    // Humanoid race subtypes
    Dwarf: 25,
    Elf: 26,
    Gnoll: 27,
    Gnome: 28,
    Halfling: 29,
    Human: 30,
    Orc: 31,
} as const;

export type MonsterSubtypeId = typeof MonsterSubtypeId[keyof typeof MonsterSubtypeId];

export const MONSTER_SUBTYPE_MAP: MonsterSubtypeMap = {
    [MonsterSubtypeId.Aquatic]: { id: MonsterSubtypeId.Aquatic, name: 'Aquatic' },
    [MonsterSubtypeId.Air]: { id: MonsterSubtypeId.Air, name: 'Air' },
    [MonsterSubtypeId.Earth]: { id: MonsterSubtypeId.Earth, name: 'Earth' },
    [MonsterSubtypeId.Fire]: { id: MonsterSubtypeId.Fire, name: 'Fire' },
    [MonsterSubtypeId.Water]: { id: MonsterSubtypeId.Water, name: 'Water' },
    [MonsterSubtypeId.Cold]: { id: MonsterSubtypeId.Cold, name: 'Cold' },
    [MonsterSubtypeId.Evil]: { id: MonsterSubtypeId.Evil, name: 'Evil' },
    [MonsterSubtypeId.Good]: { id: MonsterSubtypeId.Good, name: 'Good' },
    [MonsterSubtypeId.Lawful]: { id: MonsterSubtypeId.Lawful, name: 'Lawful' },
    [MonsterSubtypeId.Chaotic]: { id: MonsterSubtypeId.Chaotic, name: 'Chaotic' },
    [MonsterSubtypeId.Extraplanar]: { id: MonsterSubtypeId.Extraplanar, name: 'Extraplanar' },
    [MonsterSubtypeId.Angel]: { id: MonsterSubtypeId.Angel, name: 'Angel' },
    [MonsterSubtypeId.Archon]: { id: MonsterSubtypeId.Archon, name: 'Archon' },
    [MonsterSubtypeId.Incorporeal]: { id: MonsterSubtypeId.Incorporeal, name: 'Incorporeal' },
    [MonsterSubtypeId.Swarm]: { id: MonsterSubtypeId.Swarm, name: 'Swarm' },
    [MonsterSubtypeId.Shapechanger]: { id: MonsterSubtypeId.Shapechanger, name: 'Shapechanger' },
    [MonsterSubtypeId.Augmented]: { id: MonsterSubtypeId.Augmented, name: 'Augmented' },
    [MonsterSubtypeId.Baatezu]: { id: MonsterSubtypeId.Baatezu, name: 'Baatezu' },
    [MonsterSubtypeId.Eladrin]: { id: MonsterSubtypeId.Eladrin, name: 'Eladrin' },
    [MonsterSubtypeId.Goblinoid]: { id: MonsterSubtypeId.Goblinoid, name: 'Goblinoid' },
    [MonsterSubtypeId.Guardinal]: { id: MonsterSubtypeId.Guardinal, name: 'Guardinal' },
    [MonsterSubtypeId.Native]: { id: MonsterSubtypeId.Native, name: 'Native' },
    [MonsterSubtypeId.Reptilian]: { id: MonsterSubtypeId.Reptilian, name: 'Reptilian' },
    [MonsterSubtypeId.Tanarri]: { id: MonsterSubtypeId.Tanarri, name: 'Tanar\'ri' },
    // Humanoid race subtypes
    [MonsterSubtypeId.Dwarf]: { id: MonsterSubtypeId.Dwarf, name: 'Dwarf' },
    [MonsterSubtypeId.Elf]: { id: MonsterSubtypeId.Elf, name: 'Elf' },
    [MonsterSubtypeId.Gnoll]: { id: MonsterSubtypeId.Gnoll, name: 'Gnoll' },
    [MonsterSubtypeId.Gnome]: { id: MonsterSubtypeId.Gnome, name: 'Gnome' },
    [MonsterSubtypeId.Halfling]: { id: MonsterSubtypeId.Halfling, name: 'Halfling' },
    [MonsterSubtypeId.Human]: { id: MonsterSubtypeId.Human, name: 'Human' },
    [MonsterSubtypeId.Orc]: { id: MonsterSubtypeId.Orc, name: 'Orc' },
};

export const MONSTER_SUBTYPE_LIST = Object.values(MONSTER_SUBTYPE_MAP);

// Monster Special Ability Type ID enum
export const MonsterSpecialAbilityTypeId = {
    SpellLike: 1,      // (Sp) - Spell-like ability
    Supernatural: 2,   // (Su) - Supernatural ability
    Extraordinary: 3, // (Ex) - Extraordinary ability
} as const;

export type MonsterSpecialAbilityTypeId = typeof MonsterSpecialAbilityTypeId[keyof typeof MonsterSpecialAbilityTypeId];

export const MONSTER_SPECIAL_ABILITY_TYPE_MAP: MonsterSpecialAbilityTypeMap = {
    [MonsterSpecialAbilityTypeId.SpellLike]: { id: MonsterSpecialAbilityTypeId.SpellLike, name: 'Spell-Like (Sp)' },
    [MonsterSpecialAbilityTypeId.Supernatural]: { id: MonsterSpecialAbilityTypeId.Supernatural, name: 'Supernatural (Su)' },
    [MonsterSpecialAbilityTypeId.Extraordinary]: { id: MonsterSpecialAbilityTypeId.Extraordinary, name: 'Extraordinary (Ex)' },
};

export const MONSTER_SPECIAL_ABILITY_TYPE_LIST = Object.values(MONSTER_SPECIAL_ABILITY_TYPE_MAP);

// Monster Armor Component Type ID enum (only non-derivable components)
export const MonsterArmorComponentTypeId = {
    NaturalArmor: 1,
    Equipment: 2,
    Other: 3,
} as const;

export type MonsterArmorComponentTypeId = typeof MonsterArmorComponentTypeId[keyof typeof MonsterArmorComponentTypeId];

export const MONSTER_ARMOR_COMPONENT_TYPE_MAP: MonsterArmorComponentTypeMap = {
    [MonsterArmorComponentTypeId.NaturalArmor]: { id: MonsterArmorComponentTypeId.NaturalArmor, name: 'Natural Armor' },
    [MonsterArmorComponentTypeId.Equipment]: { id: MonsterArmorComponentTypeId.Equipment, name: 'Equipment' },
    [MonsterArmorComponentTypeId.Other]: { id: MonsterArmorComponentTypeId.Other, name: 'Other' },
};

export const MONSTER_ARMOR_COMPONENT_TYPE_LIST = Object.values(MONSTER_ARMOR_COMPONENT_TYPE_MAP);

// Monster Spell Type ID enum
export const MonsterSpellTypeId = {
    SpellLike: 1,
    Prepared: 2,
} as const;

export type MonsterSpellTypeId = typeof MonsterSpellTypeId[keyof typeof MonsterSpellTypeId];

export const MONSTER_SPELL_TYPE_MAP: MonsterSpellTypeMap = {
    [MonsterSpellTypeId.SpellLike]: { id: MonsterSpellTypeId.SpellLike, name: 'Spell-Like Ability' },
    [MonsterSpellTypeId.Prepared]: { id: MonsterSpellTypeId.Prepared, name: 'Prepared Spell' },
};

export const MONSTER_SPELL_TYPE_LIST = Object.values(MONSTER_SPELL_TYPE_MAP);

// Monster Spell Uses Per Day ID enum
export const MonsterSpellUsesPerDayId = {
    AtWill: 1,
    OnePerDay: 2,
    TwoPerDay: 3,
    ThreePerDay: 4,
    FourPerDay: 5,
    FivePerDay: 6,
    SixPerDay: 7,
    SevenPerDay: 8,
    OnePerRound: 9,
} as const;

export type MonsterSpellUsesPerDayId = typeof MonsterSpellUsesPerDayId[keyof typeof MonsterSpellUsesPerDayId];

export const MONSTER_SPELL_USES_PER_DAY_MAP: MonsterSpellUsesPerDayMap = {
    [MonsterSpellUsesPerDayId.AtWill]: { id: MonsterSpellUsesPerDayId.AtWill, name: 'At Will' },
    [MonsterSpellUsesPerDayId.OnePerDay]: { id: MonsterSpellUsesPerDayId.OnePerDay, name: '1/Day' },
    [MonsterSpellUsesPerDayId.TwoPerDay]: { id: MonsterSpellUsesPerDayId.TwoPerDay, name: '2/Day' },
    [MonsterSpellUsesPerDayId.ThreePerDay]: { id: MonsterSpellUsesPerDayId.ThreePerDay, name: '3/Day' },
    [MonsterSpellUsesPerDayId.FourPerDay]: { id: MonsterSpellUsesPerDayId.FourPerDay, name: '4/Day' },
    [MonsterSpellUsesPerDayId.FivePerDay]: { id: MonsterSpellUsesPerDayId.FivePerDay, name: '5/Day' },
    [MonsterSpellUsesPerDayId.SixPerDay]: { id: MonsterSpellUsesPerDayId.SixPerDay, name: '6/Day' },
    [MonsterSpellUsesPerDayId.SevenPerDay]: { id: MonsterSpellUsesPerDayId.SevenPerDay, name: '7/Day' },
    [MonsterSpellUsesPerDayId.OnePerRound]: { id: MonsterSpellUsesPerDayId.OnePerRound, name: '1/Round' },
};

export const MONSTER_SPELL_USES_PER_DAY_LIST = Object.values(MONSTER_SPELL_USES_PER_DAY_MAP);

export const MovementTypeId = {
    Land: 1,
    Fly: 2,
    Swim: 3,
    Climb: 4,
    Burrow: 5,
} as const;

export type MovementTypeId = typeof MovementTypeId[keyof typeof MovementTypeId];

export const MOVEMENT_TYPE_MAP: MovementTypeMap = {
    [MovementTypeId.Land]: { id: MovementTypeId.Land, name: 'Land' },
    [MovementTypeId.Fly]: { id: MovementTypeId.Fly, name: 'Fly' },
    [MovementTypeId.Swim]: { id: MovementTypeId.Swim, name: 'Swim' },
    [MovementTypeId.Climb]: { id: MovementTypeId.Climb, name: 'Climb' },
    [MovementTypeId.Burrow]: { id: MovementTypeId.Burrow, name: 'Burrow' },
};

export const MOVEMENT_TYPE_LIST = Object.values(MOVEMENT_TYPE_MAP);

export const ManeuverabilityId = {
    Perfect: 1,
    Good: 2,
    Average: 3,
    Poor: 4,
    Clumsy: 5,
} as const;

export type ManeuverabilityId = typeof ManeuverabilityId[keyof typeof ManeuverabilityId];

export const MANEUVERABILITY_MAP: ManeuverabilityMap = {
    [ManeuverabilityId.Perfect]: { id: ManeuverabilityId.Perfect, name: 'Perfect' },
    [ManeuverabilityId.Good]: { id: ManeuverabilityId.Good, name: 'Good' },
    [ManeuverabilityId.Average]: { id: ManeuverabilityId.Average, name: 'Average' },
    [ManeuverabilityId.Poor]: { id: ManeuverabilityId.Poor, name: 'Poor' },
    [ManeuverabilityId.Clumsy]: { id: ManeuverabilityId.Clumsy, name: 'Clumsy' },
};

export const MANEUVERABILITY_LIST = Object.values(MANEUVERABILITY_MAP);

// Monster Extra Description Type ID enum
export const MonsterExtraDescriptionTypeId = {
    Mount: 1,
    Society: 2,
    Character: 3,  // For {CHARACTERS} blocks (brief character info)
    Creating: 4,
    Tactics: 5,
    Sidebar: 6,
    Training: 7,
    AsCharacters: 8,  // For {ASCHARACTERS} blocks (detailed racial traits for player characters)
} as const;

export type MonsterExtraDescriptionTypeId = typeof MonsterExtraDescriptionTypeId[keyof typeof MonsterExtraDescriptionTypeId];

export const MONSTER_EXTRA_DESCRIPTION_TYPE_MAP: MonsterExtraDescriptionTypeMap = {
    [MonsterExtraDescriptionTypeId.Mount]: { id: MonsterExtraDescriptionTypeId.Mount, name: 'Mount' },
    [MonsterExtraDescriptionTypeId.Society]: { id: MonsterExtraDescriptionTypeId.Society, name: 'Society' },
    [MonsterExtraDescriptionTypeId.Character]: { id: MonsterExtraDescriptionTypeId.Character, name: 'Character' },
    [MonsterExtraDescriptionTypeId.Creating]: { id: MonsterExtraDescriptionTypeId.Creating, name: 'Creating' },
    [MonsterExtraDescriptionTypeId.Tactics]: { id: MonsterExtraDescriptionTypeId.Tactics, name: 'Tactics' },
    [MonsterExtraDescriptionTypeId.Sidebar]: { id: MonsterExtraDescriptionTypeId.Sidebar, name: 'Sidebar' },
    [MonsterExtraDescriptionTypeId.Training]: { id: MonsterExtraDescriptionTypeId.Training, name: 'Training' },
    [MonsterExtraDescriptionTypeId.AsCharacters]: { id: MonsterExtraDescriptionTypeId.AsCharacters, name: 'AsCharacters' },
};

export const MONSTER_EXTRA_DESCRIPTION_TYPE_LIST = Object.values(MONSTER_EXTRA_DESCRIPTION_TYPE_MAP);

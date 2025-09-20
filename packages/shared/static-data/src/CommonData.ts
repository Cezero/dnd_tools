import { RpgDieMap, CurrencyMap, AlignmentMap, SizeMap, LanguageMap, EditionMap, CastingTypeMap, SettingMap, AbilityGenerationMethodMap, PointBuyOptionsMap, BooleanFilterMap } from './types';

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
} as const;

export type CurrencyId = typeof CurrencyId[keyof typeof CurrencyId];

export const CURRENCY: CurrencyMap = {
    [CurrencyId.Copper]: { id: CurrencyId.Copper, name: 'Copper', abbreviation: 'cp', gpValue: .01 },
    [CurrencyId.Silver]: { id: CurrencyId.Silver, name: 'Silver', abbreviation: 'sp', gpValue: .1 },
    [CurrencyId.Gold]: { id: CurrencyId.Gold, name: 'Gold', abbreviation: 'gp', gpValue: 1 },
    [CurrencyId.Platinum]: { id: CurrencyId.Platinum, name: 'Platinum', abbreviation: 'pp', gpValue: 10 },
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
}

export const EDITION_LIST_FULL = Object.values(EDITION_MAP);

// Combine 3E and 3.5E into one option and filter out 3.5E
export const EDITION_LIST = EDITION_LIST_FULL.map(edition => ({
    id: edition.id,
    name: (edition.id === EditionId.DND_3E ? '3E/3.5E Combined' : edition.abbreviation),
})).filter(e => e.id !== EditionId.DND_3_5E);

// NEW: Advanced options mapping by edition
export const ADVANCED_OPTIONS_EDITION_MAP = {
    [EditionId.DND_3E]: ['allowVariantClasses', 'isGestalt', 'ignoreLevelAdjustment'],
    [EditionId.DND_3_5E]: ['allowVariantClasses', 'isGestalt', 'ignoreLevelAdjustment'],
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

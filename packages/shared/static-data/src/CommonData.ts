import { RpgDieMap, CurrencyMap, AlignmentMap, SizeMap, LanguageMap, EditionMap } from './types';

export const RPG_DICE: RpgDieMap = {
    0: { id: 0, name: 'd4', sides: 4, min: 1, max: 4 },
    1: { id: 1, name: 'd6', sides: 6, min: 1, max: 6 },
    2: { id: 2, name: 'd8', sides: 8, min: 1, max: 8 },
    3: { id: 3, name: 'd10', sides: 10, min: 1, max: 10 },
    4: { id: 4, name: 'd12', sides: 12, min: 1, max: 12 },
    5: { id: 5, name: 'd20', sides: 20, min: 1, max: 20 },
    6: { id: 6, name: 'd100', sides: 100, min: 1, max: 100 },
    7: { id: 7, name: 'd2', sides: 2, min: 1, max: 2 },
    8: { id: 8, name: 'd3', sides: 3, min: 1, max: 3 },
}

export const RPG_DICE_LIST = Object.values(RPG_DICE);
export const RPG_DICE_SELECT_LIST = RPG_DICE_LIST.map(die => ({
    value: die.id,
    label: die.name
}));

export const CURRENCY: CurrencyMap = {
    1: { id: 1, name: 'Copper', abbreviation: 'cp', gpValue: .01 },
    2: { id: 2, name: 'Silver', abbreviation: 'sp', gpValue: .1 },
    3: { id: 3, name: 'Gold', abbreviation: 'gp', gpValue: 1 },
    4: { id: 4, name: 'Platinum', abbreviation: 'pp', gpValue: 10 },
}

export const CURRENCY_LIST = Object.values(CURRENCY);
export const CURRENCY_SELECT_LIST = CURRENCY_LIST.map(currency => ({
    value: currency.id,
    label: currency.abbreviation.toUpperCase()
}));

export const ALIGNMENT_MAP: AlignmentMap = {
    0: { id: 0, name: 'Lawful Good', abbreviation: 'LG' },
    1: { id: 1, name: 'Neutral Good', abbreviation: 'NG' },
    2: { id: 2, name: 'Chaotic Good', abbreviation: 'CG' },
    3: { id: 3, name: 'Lawful Neutral', abbreviation: 'LN' },
    4: { id: 4, name: 'True Neutral', abbreviation: 'N' },
    5: { id: 5, name: 'Chaotic Neutral', abbreviation: 'CN' },
    6: { id: 6, name: 'Lawful Evil', abbreviation: 'LE' },
    7: { id: 7, name: 'Neutral Evil', abbreviation: 'NE' },
    8: { id: 8, name: 'Chaotic Evil', abbreviation: 'CE' },
}

export const ALIGNMENT_LIST = Object.values(ALIGNMENT_MAP);
export const ALIGNMENT_SELECT_LIST = ALIGNMENT_LIST.map(alignment => ({
    value: alignment.id,
    label: alignment.abbreviation
}));

export const SIZE_MAP: SizeMap = {
    1: {
        id: 1,
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
    2: {
        id: 2,
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
    3: {
        id: 3,
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
    4: {
        id: 4,
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
    5: {
        id: 5,
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
    6: {
        id: 6,
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
    7: {
        id: 7,
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
    8: {
        id: 8,
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
    9: {
        id: 9,
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
export const SIZE_SELECT_LIST = SIZE_LIST.map(size => ({
    value: size.id,
    label: size.name
}));

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
}

export const LANGUAGE_LIST = Object.values(LANGUAGE_MAP);
export const LANGUAGE_SELECT_LIST = LANGUAGE_LIST.map(language => ({
    value: language.id,
    label: language.name
}));

export const EDITION_MAP: EditionMap = {
    1: { id: 1, name: 'Original Dungeons & Dragons', abbreviation: 'OD&D' },
    2: { id: 2, name: 'Advanced Dungeons & Dragons', abbreviation: 'AD&D' },
    3: { id: 3, name: 'Advanced Dungeons & Dragon 2nd Edition', abbreviation: 'AD&D 2E' },
    4: { id: 4, name: 'Dungeons & Dragons 3rd Edition', abbreviation: 'D&D 3E' },
    5: { id: 5, name: 'Dungeons & Dragons 3.5 Edition', abbreviation: 'D&D 3.5E' },
    6: { id: 6, name: 'Dungeons & Dragons 4th Edition', abbreviation: 'D&D 4E' },
    7: { id: 7, name: 'Dungeons & Dragons 5th Edition', abbreviation: 'D&D 5E' },
}

export const EDITION_LIST = Object.values(EDITION_MAP);

// Combine 3E and 3.5E into one option and filter out 3.5E
export const EDITION_SELECT_LIST = EDITION_LIST.map(edition => ({
    value: edition.id,
    label: (edition.id === 4 ? '3E/3.5E Combined' : edition.abbreviation)
})).filter(e => e.value !== 5);

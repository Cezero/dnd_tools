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

export const CURRENCY: CurrencyMap = {
    1: { id: 1, name: 'Copper', abbr: 'cp', gp_value: .01 },
    2: { id: 2, name: 'Silver', abbr: 'sp', gp_value: .1 },
    3: { id: 3, name: 'Gold', abbr: 'gp', gp_value: 1 },
    4: { id: 4, name: 'Platinum', abbr: 'pp', gp_value: 10 },
}

export const CURRENCY_LIST = Object.values(CURRENCY);

export const ALIGNMENT_MAP: AlignmentMap = {
    0: { id: 0, name: 'Lawful Good', abbr: 'LG' },
    1: { id: 1, name: 'Neutral Good', abbr: 'NG' },
    2: { id: 2, name: 'Chaotic Good', abbr: 'CG' },
    3: { id: 3, name: 'Lawful Neutral', abbr: 'LN' },
    4: { id: 4, name: 'True Neutral', abbr: 'N' },
    5: { id: 5, name: 'Chaotic Neutral', abbr: 'CN' },
    6: { id: 6, name: 'Lawful Evil', abbr: 'LE' },
    7: { id: 7, name: 'Neutral Evil', abbr: 'NE' },
    8: { id: 8, name: 'Chaotic Evil', abbr: 'CE' },
}

export const ALIGNMENT_LIST = Object.values(ALIGNMENT_MAP);

export const SIZE_MAP: SizeMap = {
    1: {
        id: 1,
        name: 'Fine',
        abbr: 'F',
        size_modifier: +8,
        grapple_modifier: -16,
        hide_modifier: -16,
        heaight_or_length: "6 in. or less",
        weight: "1/8 lb. or less",
        space: "1/2 ft.",
        natural_reach_tall: 0,
        natural_reach_long: 0
    },
    2: {
        id: 2,
        name: 'Diminutive',
        abbr: 'D',
        size_modifier: +4,
        grapple_modifier: -12,
        hide_modifier: -12,
        heaight_or_length: "6 in. - 1 ft.",
        weight: "1/8 lb. - 1 lb.",
        space: "1 ft.",
        natural_reach_tall: 0,
        natural_reach_long: 0
    },
    3: {
        id: 3,
        name: 'Tiny',
        abbr: 'T',
        size_modifier: +2,
        grapple_modifier: -8,
        hide_modifier: -8,
        heaight_or_length: "1 ft. - 2 ft.",
        weight: "1 lb. - 8 lbs.",
        space: "2 1/2 ft.",
        natural_reach_tall: 0,
        natural_reach_long: 0
    },
    4: {
        id: 4,
        name: 'Small',
        abbr: 'S',
        size_modifier: +1,
        grapple_modifier: -4,
        hide_modifier: -4,
        heaight_or_length: "2 ft. - 4 ft.",
        weight: "8 lbs. - 60 lbs.",
        space: "5 ft.",
        natural_reach_tall: 5,
        natural_reach_long: 5
    },
    5: {
        id: 5,
        name: 'Medium',
        abbr: 'M',
        size_modifier: 0,
        grapple_modifier: 0,
        hide_modifier: 0,
        heaight_or_length: "4 ft. - 8 ft.",
        weight: "60 lbs. - 500 lbs.",
        space: "5 ft.",
        natural_reach_tall: 5,
        natural_reach_long: 5
    },
    6: {
        id: 6,
        name: 'Large',
        abbr: 'L',
        size_modifier: -1,
        grapple_modifier: 4,
        hide_modifier: 4,
        heaight_or_length: "8 ft. - 16 ft.",
        weight: "500 lbs. - 2 tons",
        space: "10 ft.",
        natural_reach_tall: 10,
        natural_reach_long: 5
    },
    7: {
        id: 7,
        name: 'Huge',
        abbr: 'H',
        size_modifier: -2,
        grapple_modifier: 8,
        hide_modifier: 8,
        heaight_or_length: "16 ft. - 32 ft.",
        weight: "2 tons - 16 tons",
        space: "15 ft.",
        natural_reach_tall: 15,
        natural_reach_long: 10
    },
    8: {
        id: 8,
        name: 'Gargantuan',
        abbr: 'G',
        size_modifier: -3,
        grapple_modifier: 12,
        hide_modifier: 12,
        heaight_or_length: "32 ft. - 64 ft.",
        weight: "16 tons - 125 tons",
        space: "20 ft.",
        natural_reach_tall: 20,
        natural_reach_long: 15
    },
    9: {
        id: 9,
        name: 'Colossal',
        abbr: 'C',
        size_modifier: -4,
        grapple_modifier: 16,
        hide_modifier: 16,
        heaight_or_length: "64 ft. - 128 ft.",
        weight: "125 tons or more",
        space: "30 ft.",
        natural_reach_tall: 30,
        natural_reach_long: 20
    },
}

export const SIZE_LIST = Object.values(SIZE_MAP);

export const LANGUAGE_MAP: LanguageMap = {
    1: { id: 1, name: 'Abyssal', typical_speakers: 'Demons, chaotic evil outsiders', alphabet: 'Infernal' },
    2: { id: 2, name: 'Aquan', typical_speakers: 'Water-based creatures', alphabet: 'Elven' },
    3: { id: 3, name: 'Auran', typical_speakers: 'Air-based creatures', alphabet: 'Draconic' },
    4: { id: 4, name: 'Celestial', typical_speakers: 'Good outsiders', alphabet: 'Celestial' },
    5: { id: 5, name: 'Common', typical_speakers: 'Humans, halflings, half-elves, half-orcs', alphabet: 'Common' },
    6: { id: 6, name: 'Draconic', typical_speakers: 'Kobolds, troglodytes, lizardfolk, dragons', alphabet: 'Draconic' },
    7: { id: 7, name: 'Druidic', typical_speakers: 'Druids (only)', alphabet: 'Druidic' },
    8: { id: 8, name: 'Dwarven', typical_speakers: 'Dwarves', alphabet: 'Dwarven' },
    9: { id: 9, name: 'Elven', typical_speakers: 'Elves', alphabet: 'Elven' },
    10: { id: 10, name: 'Giant', typical_speakers: 'Ogres, giants', alphabet: 'Dwarven' },
    11: { id: 11, name: 'Gnome', typical_speakers: 'Gnomes', alphabet: 'Dwarven' },
    12: { id: 12, name: 'Goblin', typical_speakers: 'Goblins, hobgoblins, bugbears', alphabet: 'Dwarven' },
    13: { id: 13, name: 'Gnoll', typical_speakers: 'Gnolls', alphabet: 'Common' },
    14: { id: 14, name: 'Halfling', typical_speakers: 'Halflings', alphabet: 'Common' },
    15: { id: 15, name: 'Ignan', typical_speakers: 'Fire-based creatures', alphabet: 'Draconic' },
    16: { id: 16, name: 'Infernal', typical_speakers: 'Devils, lawful evil outsiders', alphabet: 'Infernal' },
    17: { id: 17, name: 'Orc', typical_speakers: 'Orcs', alphabet: 'Dwarven' },
    18: { id: 18, name: 'Sylvan', typical_speakers: 'Dryads, brownies, leprechauns', alphabet: 'Elven' },
    19: { id: 19, name: 'Terran', typical_speakers: 'Xorns and other earth-based creatures', alphabet: 'Dwarven' },
    20: { id: 20, name: 'Undercommon', typical_speakers: 'Drow', alphabet: 'Elven' },
}

export const LANGUAGE_LIST = Object.values(LANGUAGE_MAP);

export const EDITION_MAP: EditionMap = {
    1: { id: 1, name: 'Original Dungeons & Dragons', abbr: 'OD&D' },
    2: { id: 2, name: 'Advanced Dungeons & Dragons', abbr: 'AD&D' },
    3: { id: 3, name: 'Advanced Dungeons & Dragon 2nd Edition', abbr: 'AD&D 2E' },
    4: { id: 4, name: 'Dungeons & Dragons 3rd Edition', abbr: 'D&D 3E' },
    5: { id: 5, name: 'Dungeons & Dragons 3.5 Edition', abbr: 'D&D 3.5E' },
    6: { id: 6, name: 'Dungeons & Dragons 4th Edition', abbr: 'D&D 4E' },
    7: { id: 7, name: 'Dungeons & Dragons 5th Edition', abbr: 'D&D 5E' },
}

export const EDITION_LIST = Object.values(EDITION_MAP); 
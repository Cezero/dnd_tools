import type { ClassMap, NameToIdMap, SelectOption, SpellTable } from './types';
import { NameSelectOptionList } from './Util';

export const CLASS_MAP: ClassMap = {
    1: { id: 1, name: 'Barbarian', abbreviation: 'Bbn', editionId: 4, isVisible: false, canCastSpells: false, isPrestige: false },
    2: { id: 2, name: 'Bard', abbreviation: 'Brd', editionId: 4, isVisible: false, canCastSpells: true, isPrestige: false },
    3: { id: 3, name: 'Cleric', abbreviation: 'Clr', editionId: 4, isVisible: false, canCastSpells: true, isPrestige: false },
    4: { id: 4, name: 'Druid', abbreviation: 'Drd', editionId: 4, isVisible: false, canCastSpells: true, isPrestige: false },
    5: { id: 5, name: 'Fighter', abbreviation: 'Ftr', editionId: 4, isVisible: false, canCastSpells: false, isPrestige: false },
    6: { id: 6, name: 'Monk', abbreviation: 'Mnk', editionId: 4, isVisible: false, canCastSpells: false, isPrestige: false },
    7: { id: 7, name: 'Paladin', abbreviation: 'Pal', editionId: 4, isVisible: false, canCastSpells: true, isPrestige: false },
    8: { id: 8, name: 'Ranger', abbreviation: 'Rgr', editionId: 4, isVisible: false, canCastSpells: true, isPrestige: false },
    9: { id: 9, name: 'Rogue', abbreviation: 'Rog', editionId: 4, isVisible: false, canCastSpells: false, isPrestige: false },
    10: { id: 10, name: 'Sorcerer', abbreviation: 'Sor', editionId: 4, isVisible: false, canCastSpells: true, isPrestige: false },
    11: { id: 11, name: 'Wizard', abbreviation: 'Wiz', editionId: 4, isVisible: false, canCastSpells: true, isPrestige: false },
    12: { id: 12, name: 'Adept', abbreviation: 'Adpt', editionId: 4, isVisible: true, canCastSpells: true, isPrestige: false },
    13: { id: 13, name: 'Aristocrat', abbreviation: 'Arist', editionId: 4, isVisible: true, canCastSpells: false, isPrestige: false },
    14: { id: 14, name: 'Commoner', abbreviation: 'Cmn', editionId: 4, isVisible: true, canCastSpells: false, isPrestige: false },
    15: { id: 15, name: 'Expert', abbreviation: 'Exp', editionId: 4, isVisible: true, canCastSpells: false, isPrestige: false },
    16: { id: 16, name: 'Warrior', abbreviation: 'War', editionId: 4, isVisible: true, canCastSpells: false, isPrestige: false },
    17: { id: 17, name: 'Barbarian', abbreviation: 'Bbn', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: false },
    18: { id: 18, name: 'Bard', abbreviation: 'Brd', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: false },
    19: { id: 19, name: 'Cleric', abbreviation: 'Clr', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: false },
    20: { id: 20, name: 'Druid', abbreviation: 'Drd', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: false },
    21: { id: 21, name: 'Fighter', abbreviation: 'Ftr', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: false },
    22: { id: 22, name: 'Monk', abbreviation: 'Mnk', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: false },
    23: { id: 23, name: 'Paladin', abbreviation: 'Pal', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: false },
    24: { id: 24, name: 'Ranger', abbreviation: 'Rgr', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: false },
    25: { id: 25, name: 'Rogue', abbreviation: 'Rog', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: false },
    26: { id: 26, name: 'Sorcerer', abbreviation: 'Sor', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: false },
    27: { id: 27, name: 'Wizard', abbreviation: 'Wiz', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: false },
    28: { id: 28, name: 'Hexblade', abbreviation: 'Hex', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: false },
    29: { id: 29, name: 'Samurai', abbreviation: 'Sam', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: false },
    30: { id: 30, name: 'Swashbuckler', abbreviation: 'Swb', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: false },
    31: { id: 31, name: 'Scout', abbreviation: 'Sct', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: false },
    32: { id: 32, name: 'Ninja', abbreviation: 'Nin', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: false },
    33: { id: 33, name: 'Spellthief', abbreviation: 'Sth', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: false },
    34: { id: 34, name: 'Warlock', abbreviation: 'Wlk', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: false },
    35: { id: 35, name: 'Warmage', abbreviation: 'Wmg', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: false },
    36: { id: 36, name: 'Wu Jen', abbreviation: 'Wuj', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: false },
    37: { id: 37, name: 'Favored Soul', abbreviation: 'Fvs', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: false },
    38: { id: 38, name: 'Shugenja', abbreviation: 'Shug', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: false },
    39: { id: 39, name: 'Spirit Shaman', abbreviation: 'Ssh', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: false },
    40: { id: 40, name: 'Psion', abbreviation: 'Psi', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: false },
    41: { id: 41, name: 'Psychic Warrior', abbreviation: 'PsyW', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: false },
    42: { id: 42, name: 'Soulknife', abbreviation: 'Skn', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: false },
    43: { id: 43, name: 'Wilder', abbreviation: 'Wld', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: false },
    44: { id: 44, name: 'Arcane Archer', abbreviation: 'AA', editionId: 4, isVisible: true, canCastSpells: false, isPrestige: true },
    45: { id: 45, name: 'Arcane Trickster', abbreviation: 'AT', editionId: 4, isVisible: true, canCastSpells: false, isPrestige: true },
    46: { id: 46, name: 'Archmage', abbreviation: 'Arch', editionId: 4, isVisible: true, canCastSpells: false, isPrestige: true },
    47: { id: 47, name: 'Assassin', abbreviation: 'Asn', editionId: 4, isVisible: true, canCastSpells: true, isPrestige: true },
    48: { id: 48, name: 'Blackguard', abbreviation: 'Bg', editionId: 4, isVisible: true, canCastSpells: true, isPrestige: true },
    49: { id: 49, name: 'Dragon Disciple', abbreviation: 'DD', editionId: 4, isVisible: true, canCastSpells: false, isPrestige: true },
    50: { id: 50, name: 'Duelist', abbreviation: 'Duel', editionId: 4, isVisible: true, canCastSpells: false, isPrestige: true },
    51: { id: 51, name: 'Dwarven Defender', abbreviation: 'DDf', editionId: 4, isVisible: true, canCastSpells: false, isPrestige: true },
    52: { id: 52, name: 'Eldritch Knight', abbreviation: 'EK', editionId: 4, isVisible: true, canCastSpells: false, isPrestige: true },
    53: { id: 53, name: 'Loremaster', abbreviation: 'LM', editionId: 4, isVisible: true, canCastSpells: false, isPrestige: true },
    54: { id: 54, name: 'Mystic Theurge', abbreviation: 'MT', editionId: 4, isVisible: true, canCastSpells: false, isPrestige: true },
    55: { id: 55, name: 'Shadowdancer', abbreviation: 'SD', editionId: 4, isVisible: true, canCastSpells: false, isPrestige: true },
    56: { id: 56, name: 'Arcane Archer', abbreviation: 'AA', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    57: { id: 57, name: 'Arcane Trickster', abbreviation: 'AT', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    58: { id: 58, name: 'Archmage', abbreviation: 'Arch', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    59: { id: 59, name: 'Assassin', abbreviation: 'Asn', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: true },
    60: { id: 60, name: 'Blackguard', abbreviation: 'Bg', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: true },
    61: { id: 61, name: 'Dragon Disciple', abbreviation: 'DD', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    62: { id: 62, name: 'Duelist', abbreviation: 'Duel', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    63: { id: 63, name: 'Dwarven Defender', abbreviation: 'DDf', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    64: { id: 64, name: 'Eldritch Knight', abbreviation: 'EK', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    65: { id: 65, name: 'Loremaster', abbreviation: 'LM', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    66: { id: 66, name: 'Mystic Theurge', abbreviation: 'MT', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    67: { id: 67, name: 'Shadowdancer', abbreviation: 'SD', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    68: { id: 68, name: 'Bladesinger', abbreviation: 'Bls', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    69: { id: 69, name: 'Spellsword', abbreviation: 'Ssw', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    70: { id: 70, name: 'Weapon Master', abbreviation: 'WM', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    71: { id: 71, name: 'Arcane Hierophant', abbreviation: 'AH', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    72: { id: 72, name: 'Fochlucan Lyrist', abbreviation: 'FL', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    73: { id: 73, name: 'Daggerspell Mage', abbreviation: 'DM', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    74: { id: 74, name: 'Daggerspell Shaper', abbreviation: 'DS', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    75: { id: 75, name: 'Nightsong Enforcer', abbreviation: 'NE', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    76: { id: 76, name: 'Nightsong Infiltrator', abbreviation: 'NI', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    77: { id: 77, name: 'Beastmaster', abbreviation: 'BM', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    78: { id: 78, name: 'Exemplar', abbreviation: 'Ex', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    79: { id: 79, name: 'Ollam', abbreviation: 'Ol', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    80: { id: 80, name: 'Maester', abbreviation: 'Ma', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    81: { id: 81, name: 'Tempest', abbreviation: 'Tp', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    82: { id: 82, name: 'Wild Plains Outrider', abbreviation: 'WPO', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    83: { id: 83, name: 'Bloodhound', abbreviation: 'Bh', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    84: { id: 84, name: 'Vigilante', abbreviation: 'Vig', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: true },
    85: { id: 85, name: 'Acolyte of the Skin', abbreviation: 'ASk', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    86: { id: 86, name: 'Alienist', abbreviation: 'Aln', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    87: { id: 87, name: 'Argent Savant', abbreviation: 'ASv', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    88: { id: 88, name: 'Geomancer', abbreviation: 'Geo', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    89: { id: 89, name: 'Contemplative', abbreviation: 'Cmp', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    90: { id: 90, name: 'Divine Oracle', abbreviation: 'DO', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    91: { id: 91, name: 'Sacred Fist', abbreviation: 'SF', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    92: { id: 92, name: 'Seeker of the Misty Isle', abbreviation: 'SMI', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    93: { id: 93, name: 'Thaumaturgist', abbreviation: 'Thm', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    94: { id: 94, name: 'Anointed Knight', abbreviation: 'AK', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    95: { id: 95, name: 'Exalted Arcanist', abbreviation: 'EA', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    96: { id: 96, name: 'Fist of Raziel', abbreviation: 'FR', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    97: { id: 97, name: 'Justiciar of Tyr', abbreviation: 'JT', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    98: { id: 98, name: 'Lion of Talisid', abbreviation: 'LT', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    99: { id: 99, name: 'Slayer of Domiel', abbreviation: 'SDm', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: true },
    100: { id: 100, name: 'Stalker of Kharash', abbreviation: 'SK', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    101: { id: 101, name: 'Vassal of Bahamut', abbreviation: 'VB', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: true },
    102: { id: 102, name: 'Apostle of Peace', abbreviation: 'AoP', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: true },
    103: { id: 103, name: 'Archivist', abbreviation: 'Archv', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: false },
    104: { id: 104, name: 'Artificer', abbreviation: 'Arti', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: false },
    105: { id: 105, name: 'Beguiler', abbreviation: 'Begl', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: false },
    106: { id: 106, name: 'Beloved of Valarian', abbreviation: 'BoV', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: true },
    107: { id: 107, name: 'Blighter', abbreviation: 'Blght', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: true },
    108: { id: 108, name: 'Champion of Gwynharwyf', abbreviation: 'CoG', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: true },
    109: { id: 109, name: 'Consecrated Harrier', abbreviation: 'ConHar', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: true },
    110: { id: 110, name: 'Corrupt Avenger', abbreviation: 'CorAv', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: true },
    111: { id: 111, name: 'Death Delver', abbreviation: 'DthDel', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: true },
    112: { id: 112, name: 'Demonologist', abbreviation: 'Dmn', editionId: 4, isVisible: true, canCastSpells: true, isPrestige: true },
    113: { id: 113, name: 'Disciple of Thrym', abbreviation: 'DoT', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: false },
    114: { id: 114, name: 'Divine Crusader', abbreviation: 'DivCru', editionId: 5, isVisible: true, canCastSpells: false, isPrestige: true },
    115: { id: 115, name: 'Dread Necromancer', abbreviation: 'DrdNec', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: false },
    116: { id: 116, name: 'Duskblade', abbreviation: 'DskBl', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: false },
    117: { id: 117, name: 'Emissary of Barachiel', abbreviation: 'EoB', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: true },
    118: { id: 118, name: 'Fatemaker', abbreviation: 'Ftmk', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: true },
    119: { id: 119, name: 'Gnome Artificer', abbreviation: 'GnArt', editionId: 4, isVisible: true, canCastSpells: true, isPrestige: true },
    120: { id: 120, name: 'Healer', abbreviation: 'Heal', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: false },
    121: { id: 121, name: 'Hoardstealer', abbreviation: 'HrdStl', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: true },
    122: { id: 122, name: 'Holy Liberator', abbreviation: 'HoLib', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: true },
    123: { id: 123, name: 'Hunter of the Dead', abbreviation: 'HotD', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: true },
    124: { id: 124, name: 'Knight of the Chalice', abbreviation: 'KotC', editionId: 4, isVisible: true, canCastSpells: true, isPrestige: true },
    125: { id: 125, name: 'Mortal Hunter', abbreviation: 'MrtHnt', editionId: 4, isVisible: true, canCastSpells: true, isPrestige: true },
    126: { id: 126, name: 'Ocular Adept', abbreviation: 'OcAdp', editionId: 4, isVisible: true, canCastSpells: true, isPrestige: true },
    127: { id: 127, name: 'Pious Templar', abbreviation: 'PiTem', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: true },
    128: { id: 128, name: 'Sublime Chord', abbreviation: 'SubCh', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: true },
    129: { id: 129, name: 'Suel Arcanamach', abbreviation: 'SlArcan', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: true },
    130: { id: 130, name: 'Temple Raider of Olidammara', abbreviation: 'TRoO', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: true },
    131: { id: 131, name: 'Ur-Priest', abbreviation: 'UrPrst', editionId: 5, isVisible: true, canCastSpells: true, isPrestige: true },
};

export const CLASS_NAME_MAP: NameToIdMap = Object.fromEntries(
    Object.entries(CLASS_MAP).map(([key, value]) => [value.name, parseInt(key)])
);

export const CLASS_LIST = Object.values(CLASS_MAP);
export const CLASS_SELECT_LIST = NameSelectOptionList(CLASS_LIST);
export const CLASS_VISIBLE_LIST = CLASS_LIST.filter(cls => cls.isVisible);
export const CLASS_VISIBLE_SELECT_LIST = NameSelectOptionList(CLASS_VISIBLE_LIST);
export const CLASS_WITH_SPELLS_SELECT_LIST = NameSelectOptionList(CLASS_VISIBLE_LIST.filter(cls => cls.canCastSpells));

export function GetBaseClassesByEdition(editionId: number): SelectOption[] {
    return NameSelectOptionList(CLASS_LIST.filter(cl => cl.editionId === editionId && !cl.isPrestige));
}

// Good Save Progression: floor(level / 2) + 2
export function getGoodSave(level: number): number {
    return Math.floor(level / 2) + 2;
}

// Poor Save Progression: floor(level / 3)
export function getPoorSave(level: number): number {
    return Math.floor(level / 3);
}

// Good Base Attack Bonus: Level (full progression)
export function getGoodBAB(level: number): string {
    return formatIterativeBAB(level);
}

// Average Base Attack Bonus: floor(3 * level / 4)
export function getAverageBAB(level: number): string {
    const bab = Math.floor((3 * level) / 4);
    return formatIterativeBAB(bab);
}

// Poor Base Attack Bonus: floor(level / 2)
export function getPoorBAB(level: number): string {
    const bab = Math.floor(level / 2);
    return formatIterativeBAB(bab);
}

// Format iterative BAB like +11/+6/+1 etc.
function formatIterativeBAB(bab: number): string {
    if (bab <= 0) return "+0";

    const attacks: number[] = [];
    let current = bab;

    while (current > 0) {
        attacks.push(current);
        current -= 5;
    }

    return attacks.map(a => `+${a}`).join('/');
}

export const ProgressionType = {
    good: 0,
    average: 1,
    poor: 2,
} as const;

export type ProgressionType = typeof ProgressionType[keyof typeof ProgressionType];

export function getSaveProgression(level: number, progressionType: typeof ProgressionType.good | typeof ProgressionType.poor): number {
    if (progressionType === ProgressionType.good) return getGoodSave(level);
    if (progressionType === ProgressionType.poor) return getPoorSave(level);
    throw new Error('Invalid progression type');
}

export function getBABProgression(level: number, progressionType: typeof ProgressionType.good | typeof ProgressionType.average | typeof ProgressionType.poor): string {
    if (progressionType === ProgressionType.good) return getGoodBAB(level);
    if (progressionType === ProgressionType.average) return getAverageBAB(level);
    if (progressionType === ProgressionType.poor) return getPoorBAB(level);
    throw new Error('Invalid progression type');
}

const _XP_TABLE: number[] = [
    0,     // Level 1
    1000,  // Level 2
    3000,  // Level 3
    6000,  // Level 4
    10000, // Level 5
    15000, // Level 6
    21000, // Level 7
    28000, // Level 8
    36000, // Level 9
    45000, // Level 10
    55000, // Level 11
    66000, // Level 12
    78000, // Level 13
    91000, // Level 14
    105000,// Level 15
    120000,// Level 16
    136000,// Level 17
    153000,// Level 18
    171000,// Level 19
    190000 // Level 20
];

export function getXPTotalForLevel(level: number): number {
    if (level < 21) return _XP_TABLE[level];

    // XP at level 20 is 190,000
    // XP increase from level 21 onward is: ∑(i * 1000) for i = 21 to level
    const baseXP = 190000;
    const n = level;
    const m = 20;

    // Sum from m+1 to n: S = 1000 * (n(n+1)/2 - m(m+1)/2)
    const xp = baseXP + 1000 * ((n * (n + 1) - m * (m + 1)) / 2);
    return xp;
}


export function getClassSkillMaxRanks(level: number): number {
    return level + 3;
}

export function getCrossClassSkillMaxRanks(level: number): number {
    return (level + 3) / 2;
}

export function formatHalfRank(ranks: number): string {
    const whole = Math.floor(ranks);
    return ranks === whole
        ? `${whole}`
        : `${whole}-1/2`;
}

export function getFeatCount(level: number): number {
    return 1 + Math.floor((level - 1) / 3);
}

export function getAbilityScoreIncreases(level: number): number {
    return Math.floor(level / 4);
}

export const BARD_SPELL_TABLE: SpellTable = {
    1: { 0: 2 },
    2: { 0: 3, 1: 0 },
    3: { 0: 3, 1: 1 },
    4: { 0: 3, 1: 2, 2: 0 },
    5: { 0: 3, 1: 3, 2: 1 },
    6: { 0: 3, 1: 3, 2: 2 },
    7: { 0: 3, 1: 3, 2: 2, 3: 0 },
    8: { 0: 3, 1: 3, 2: 3, 3: 1 },
    9: { 0: 3, 1: 3, 2: 3, 3: 2 },
    10: { 0: 3, 1: 3, 2: 3, 3: 2, 4: 0 },
    11: { 0: 3, 1: 3, 2: 3, 3: 3, 4: 1 },
    12: { 0: 3, 1: 3, 2: 3, 3: 3, 4: 2 },
    13: { 0: 3, 1: 3, 2: 3, 3: 3, 4: 2, 5: 0 },
    14: { 0: 4, 1: 3, 2: 3, 3: 3, 4: 3, 5: 1 },
    15: { 0: 4, 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
    16: { 0: 4, 1: 4, 2: 4, 3: 3, 4: 3, 5: 2, 6: 0 },
    17: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 3, 5: 3, 6: 1 },
    18: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 3, 6: 2 },
    19: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 3 },
    20: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4 },
};

export const DIVINE_SPELL_TABLE: SpellTable = {
    1: { 0: 3, 1: 1 },
    2: { 0: 4, 1: 2 },
    3: { 0: 4, 1: 2, 2: 1 },
    4: { 0: 5, 1: 3, 2: 2 },
    5: { 0: 5, 1: 3, 2: 2, 3: 1 },
    6: { 0: 5, 1: 3, 2: 3, 3: 2 },
    7: { 0: 6, 1: 4, 2: 3, 3: 2, 4: 1 },
    8: { 0: 6, 1: 4, 2: 3, 3: 3, 4: 2 },
    9: { 0: 6, 1: 4, 2: 4, 3: 3, 4: 2, 5: 1 },
    10: { 0: 6, 1: 4, 2: 4, 3: 3, 4: 3, 5: 2 },
    11: { 0: 6, 1: 5, 2: 4, 3: 4, 4: 3, 5: 2, 6: 1 },
    12: { 0: 6, 1: 5, 2: 4, 3: 4, 4: 3, 5: 3, 6: 2 },
    13: { 0: 6, 1: 5, 2: 5, 3: 4, 4: 4, 5: 3, 6: 2, 7: 1 },
    14: { 0: 6, 1: 5, 2: 5, 3: 4, 4: 4, 5: 3, 6: 3, 7: 2 },
    15: { 0: 6, 1: 5, 2: 5, 3: 5, 4: 4, 5: 4, 6: 3, 7: 2, 8: 1 },
    16: { 0: 6, 1: 5, 2: 5, 3: 5, 4: 4, 5: 4, 6: 3, 7: 3, 8: 2 },
    17: { 0: 6, 1: 5, 2: 5, 3: 5, 4: 5, 5: 4, 6: 4, 7: 3, 8: 2, 9: 1 },
    18: { 0: 6, 1: 5, 2: 5, 3: 5, 4: 5, 5: 4, 6: 4, 7: 3, 8: 3, 9: 2 },
    19: { 0: 6, 1: 5, 2: 5, 3: 5, 4: 5, 5: 5, 6: 4, 7: 4, 8: 3, 9: 3 },
    20: { 0: 6, 1: 5, 2: 5, 3: 5, 4: 5, 5: 5, 6: 4, 7: 4, 8: 4, 9: 4 },
};

export const HYBRID_SPELL_TABLE: SpellTable = {
    4: { 1: 0 },
    5: { 1: 0 },
    6: { 1: 1 },
    7: { 1: 1 },
    8: { 1: 1, 2: 0 },
    9: { 1: 1, 2: 0 },
    10: { 1: 1, 2: 1 },
    11: { 1: 1, 2: 1, 3: 0 },
    12: { 1: 1, 2: 1, 3: 1 },
    13: { 1: 1, 2: 1, 3: 1 },
    14: { 1: 2, 2: 1, 3: 1, 4: 0 },
    15: { 1: 2, 2: 1, 3: 1, 4: 1 },
    16: { 1: 2, 2: 2, 3: 1, 4: 1 },
    17: { 1: 2, 2: 2, 3: 2, 4: 1 },
    18: { 1: 3, 2: 2, 3: 2, 4: 1 },
    19: { 1: 3, 2: 3, 3: 3, 4: 2 },
    20: { 1: 3, 2: 3, 3: 3, 4: 3 },
};

export const SORCERER_SPELL_TABLE: SpellTable = {
    1: { 0: 5, 1: 3 },
    2: { 0: 6, 1: 4 },
    3: { 0: 6, 1: 5 },
    4: { 0: 6, 1: 6, 2: 3 },
    5: { 0: 6, 1: 6, 2: 4 },
    6: { 0: 6, 1: 6, 2: 5, 3: 3 },
    7: { 0: 6, 1: 6, 2: 6, 3: 4 },
    8: { 0: 6, 1: 6, 2: 6, 3: 5, 4: 3 },
    9: { 0: 6, 1: 6, 2: 6, 3: 6, 4: 4 },
    10: { 0: 6, 1: 6, 2: 6, 3: 6, 4: 5, 5: 3 },
    11: { 0: 6, 1: 6, 2: 6, 3: 6, 4: 6, 5: 4 },
    12: { 0: 6, 1: 6, 2: 6, 3: 6, 4: 6, 5: 5, 6: 3 },
    13: { 0: 6, 1: 6, 2: 6, 3: 6, 4: 6, 5: 6, 6: 4 },
    14: { 0: 6, 1: 6, 2: 6, 3: 6, 4: 6, 5: 6, 6: 5, 7: 3 },
    15: { 0: 6, 1: 6, 2: 6, 3: 6, 4: 6, 5: 6, 6: 6, 7: 4 },
    16: { 0: 6, 1: 6, 2: 6, 3: 6, 4: 6, 5: 6, 6: 6, 7: 5, 8: 3 },
    17: { 0: 6, 1: 6, 2: 6, 3: 6, 4: 6, 5: 6, 6: 6, 7: 6, 8: 4 },
    18: { 0: 6, 1: 6, 2: 6, 3: 6, 4: 6, 5: 6, 6: 6, 7: 6, 8: 5, 9: 3 },
    19: { 0: 6, 1: 6, 2: 6, 3: 6, 4: 6, 5: 6, 6: 6, 7: 6, 8: 6, 9: 4 },
    20: { 0: 6, 1: 6, 2: 6, 3: 6, 4: 6, 5: 6, 6: 6, 7: 6, 8: 6, 9: 6 },
};

export const WIZARD_SPELL_TABLE: SpellTable = {
    1: { 0: 3, 1: 1 },
    2: { 0: 4, 1: 2 },
    3: { 0: 4, 1: 2, 2: 1 },
    4: { 0: 4, 1: 3, 2: 2 },
    5: { 0: 4, 1: 3, 2: 2, 3: 1 },
    6: { 0: 4, 1: 3, 2: 3, 3: 2 },
    7: { 0: 4, 1: 4, 2: 3, 3: 2, 4: 1 },
    8: { 0: 4, 1: 4, 2: 3, 3: 3, 4: 2 },
    9: { 0: 4, 1: 4, 2: 4, 3: 3, 4: 2, 5: 1 },
    10: { 0: 4, 1: 4, 2: 4, 3: 3, 4: 3, 5: 2 },
    11: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 3, 5: 2, 6: 1 },
    12: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 3, 5: 3, 6: 2 },
    13: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 3, 6: 2, 7: 1 },
    14: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 3, 6: 3, 7: 2 },
    15: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 3, 7: 2, 8: 1 },
    16: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 3, 7: 3, 8: 2 },
    17: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4, 7: 3, 8: 2, 9: 1 },
    18: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4, 7: 3, 8: 3, 9: 2 },
    19: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4, 7: 4, 8: 3, 9: 3 },
    20: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4 },
};

export const SpellProgressionType = {
    bard: 0,
    devine: 1,
    hybrid: 2,
    sorcerer: 3,
    wizard: 4,
} as const;

export type SpellProgressionType = typeof SpellProgressionType[keyof typeof SpellProgressionType];

export const SPELL_TABLE_MAP: { [key in SpellProgressionType]: SpellTable } = {
    [SpellProgressionType.bard]: BARD_SPELL_TABLE,
    [SpellProgressionType.devine]: DIVINE_SPELL_TABLE,
    [SpellProgressionType.hybrid]: HYBRID_SPELL_TABLE,
    [SpellProgressionType.sorcerer]: SORCERER_SPELL_TABLE,
    [SpellProgressionType.wizard]: WIZARD_SPELL_TABLE,
};

// Select lists for progression types
export const BAB_PROGRESSION_SELECT_LIST = [
    { value: ProgressionType.good, label: 'Good' },
    { value: ProgressionType.average, label: 'Average' },
    { value: ProgressionType.poor, label: 'Poor' },
];

export const SAVE_PROGRESSION_SELECT_LIST = [
    { value: ProgressionType.good, label: 'Good' },
    { value: ProgressionType.poor, label: 'Poor' },
];

export const SPELL_PROGRESSION_SELECT_LIST = [
    { value: SpellProgressionType.bard, label: 'Bard' },
    { value: SpellProgressionType.devine, label: 'Divine' },
    { value: SpellProgressionType.hybrid, label: 'Hybrid' },
    { value: SpellProgressionType.sorcerer, label: 'Sorcerer' },
    { value: SpellProgressionType.wizard, label: 'Wizard' },
];

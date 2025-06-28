interface SpellComponent {
    id: number;
    abbr: string;
    name: string;
}

interface SpellDescriptor {
    id: number;
    name: string;
}

interface SpellRange {
    id: number;
    name: string;
    abbr: string;
}

interface SpellSchool {
    id: number;
    name: string;
    abbr: string;
}

interface SpellSubschool {
    id: number;
    name: string;
    school_id: number;
}

interface SpellId {
    id: number;
    name: string;
    edition_id: number;
}

export const SPELL_COMPONENT_MAP: { [key: number]: SpellComponent } = {
    0: { id: 0, abbr: 'V', name: 'Verbal' },
    1: { id: 1, abbr: 'S', name: 'Somatic' },
    2: { id: 2, abbr: 'M', name: 'Material' },
    3: { id: 3, abbr: 'F', name: 'Focus' },
    4: { id: 4, abbr: 'DF', name: 'Divine Focus' },
    5: { id: 5, abbr: 'X', name: 'XP' }
}

export const SPELL_COMPONENT_LIST = Object.values(SPELL_COMPONENT_MAP);

export const SpellComponentAbbrList = (components: number[]): string => {
    return components.map(component => SPELL_COMPONENT_MAP[component].abbr).join(', ');
}

export const SPELL_DESCRIPTOR_MAP: { [key: number]: SpellDescriptor } = {
    1: { id: 1, name: 'Acid' },
    2: { id: 2, name: 'Air' },
    3: { id: 3, name: 'Chaotic' },
    4: { id: 4, name: 'Cold' },
    5: { id: 5, name: 'Darkness' },
    6: { id: 6, name: 'Death' },
    7: { id: 7, name: 'Earth' },
    8: { id: 8, name: 'Electricity' },
    9: { id: 9, name: 'Evil' },
    10: { id: 10, name: 'Fear' },
    11: { id: 11, name: 'Fire' },
    12: { id: 12, name: 'Force' },
    13: { id: 13, name: 'Good' },
    14: { id: 14, name: 'Language-dependent' },
    15: { id: 15, name: 'Lawful' },
    16: { id: 16, name: 'Light' },
    17: { id: 17, name: 'Mind-affecting' },
    18: { id: 18, name: 'Sonic' },
    19: { id: 19, name: 'Water' },
    20: { id: 20, name: 'See text' },
    21: { id: 21, name: 'Eldritch essence' },
    22: { id: 22, name: 'Blast shape' }
}

export const SPELL_DESCRIPTOR_LIST = Object.values(SPELL_DESCRIPTOR_MAP);

export const SpellDescriptorNameList = (descriptors: number[]): string => {
    return descriptors.map(descriptor => SPELL_DESCRIPTOR_MAP[descriptor].name).join(', ');
}

export const SPELL_RANGE_MAP: { [key: number]: SpellRange } = {
    1: { id: 1, name: 'Touch', abbr: 'tch' },
    2: { id: 2, name: 'Personal', abbr: 'per' },
    3: { id: 3, name: 'Close', abbr: 'cls' },
    4: { id: 4, name: 'Medium', abbr: 'med' },
    5: { id: 5, name: 'Long', abbr: 'lng' },
    6: { id: 6, name: 'Unlimited', abbr: 'unl' },
    7: { id: 7, name: 'Foot', abbr: 'ft.' },
    8: { id: 8, name: 'Mile', abbr: 'mi.' },
    9: { id: 9, name: 'Special', abbr: 'spc' }
}

export const SPELL_RANGE_LIST = Object.values(SPELL_RANGE_MAP);

export const SPELL_SCHOOL_MAP: { [key: number]: SpellSchool } = {
    1: { id: 1, name: 'Abjuration', abbr: 'abj' },
    2: { id: 2, name: 'Conjuration', abbr: 'conj' },
    3: { id: 3, name: 'Divination', abbr: 'div' },
    4: { id: 4, name: 'Enchantment', abbr: 'ench' },
    5: { id: 5, name: 'Evocation', abbr: 'evoc' },
    6: { id: 6, name: 'Illusion', abbr: 'illu' },
    7: { id: 7, name: 'Necromancy', abbr: 'nec' },
    8: { id: 8, name: 'Transmutation', abbr: 'tran' },
    9: { id: 9, name: 'Universal', abbr: 'univ' },
    10: { id: 10, name: 'Invocation', abbr: 'inv' }
}

export const SPELL_SCHOOL_LIST = Object.values(SPELL_SCHOOL_MAP);

export const SpellSchoolNameList = (schools: number[]): string => {
    return schools.map(school => SPELL_SCHOOL_MAP[school].name).join(', ');
}

export const SPELL_SUBSCHOOL_MAP: { [key: number]: SpellSubschool } = {
    1: { id: 1, name: 'Calling', school_id: 2 },
    2: { id: 2, name: 'Creation', school_id: 2 },
    3: { id: 3, name: 'Healing', school_id: 2 },
    4: { id: 4, name: 'Summoning', school_id: 2 },
    5: { id: 5, name: 'Teleportation', school_id: 2 },
    6: { id: 6, name: 'Scrying', school_id: 3 },
    7: { id: 7, name: 'Charm', school_id: 4 },
    8: { id: 8, name: 'Compulsion', school_id: 4 },
    9: { id: 9, name: 'Figment', school_id: 6 },
    10: { id: 10, name: 'Glamer', school_id: 6 },
    11: { id: 11, name: 'Pattern', school_id: 6 },
    12: { id: 12, name: 'Phantasm', school_id: 6 },
    13: { id: 13, name: 'Shadow', school_id: 6 },
    14: { id: 14, name: 'Least', school_id: 10 },
    15: { id: 15, name: 'Lesser', school_id: 10 },
    16: { id: 16, name: 'Greater', school_id: 10 },
    17: { id: 17, name: 'Dark', school_id: 10 }
}

export const SPELL_SUBSCHOOL_LIST = Object.values(SPELL_SUBSCHOOL_MAP);

export const SPELL_SUBSCHOOL_LIST_BY_SCHOOL_ID: { [key: number]: SpellSubschool[] } = Object.values(SPELL_SUBSCHOOL_MAP).reduce((acc, school) => {
    acc[school.id] = Object.values(SPELL_SUBSCHOOL_MAP).filter(subschool => subschool.school_id === school.id);
    return acc;
}, {} as { [key: number]: SpellSubschool[] });

export const SpellSubschoolNameList = (subschools: number[]): string => {
    return subschools.map(subschool => SPELL_SUBSCHOOL_MAP[subschool].name).join(', ');
}

export const SPELL_ID_MAP: { [key: number]: SpellId } = {
    1: { id: 1, name: 'Aberate', edition_id: 4 },
    2: { id: 2, name: 'Aboleth Curse', edition_id: 5 },
    3: { id: 3, name: 'Absorb Mind', edition_id: 4 },
    4: { id: 4, name: 'Absorb Strength', edition_id: 4 },
    5: { id: 5, name: 'Absorb Weapon', edition_id: 5 },
    6: { id: 6, name: 'Absorption', edition_id: 5 },
    7: { id: 7, name: 'Abyssal Army', edition_id: 5 },
    8: { id: 8, name: 'Abyssal Might', edition_id: 4 },
    9: { id: 9, name: 'Accelerated Movement', edition_id: 5 },
    10: { id: 10, name: 'Accuracy', edition_id: 5 },
    11: { id: 11, name: 'Acid Breath', edition_id: 5 },
    12: { id: 12, name: 'Acid Fog', edition_id: 5 },
    13: { id: 13, name: 'Acid Rain', edition_id: 5 },
    14: { id: 14, name: 'Acid Sheath', edition_id: 5 },
    15: { id: 15, name: 'Acid Splash', edition_id: 5 },
    16: { id: 16, name: 'Acid Storm', edition_id: 5 },
    17: { id: 17, name: 'Adamantine Wings', edition_id: 5 },
    18: { id: 18, name: 'Addiction', edition_id: 4 },
    19: { id: 19, name: 'Aerial Alacrity', edition_id: 5 },
    20: { id: 20, name: 'Aerial Alarm', edition_id: 5 },
    21: { id: 21, name: 'Aerial Summoning Dance', edition_id: 4 },
    22: { id: 22, name: 'Affliction', edition_id: 5 },
    23: { id: 23, name: 'Aid', edition_id: 5 },
    24: { id: 24, name: 'Aid, Mass', edition_id: 5 },
    25: { id: 25, name: 'Aiming at the Target', edition_id: 5 },
    26: { id: 26, name: 'Air Breathing', edition_id: 5 },
    27: { id: 27, name: 'Air Walk', edition_id: 5 },
    28: { id: 28, name: 'Airy Water', edition_id: 5 },
    29: { id: 29, name: 'Alarm', edition_id: 5 },
    30: { id: 30, name: 'Alarm, Greater', edition_id: 5 },
    31: { id: 32, name: 'Alert Bebilith', edition_id: 4 },
    32: { id: 33, name: 'Algid Enhancement', edition_id: 5 },
    33: { id: 34, name: 'Align Fang', edition_id: 5 },
    34: { id: 35, name: 'Align Fang, Mass', edition_id: 5 },
    35: { id: 36, name: 'Align Weapon', edition_id: 5 },
    36: { id: 37, name: 'Align Weapon, Mass', edition_id: 5 },
    37: { id: 38, name: 'Aligned Aura', edition_id: 5 },
    38: { id: 39, name: 'Allegro', edition_id: 5 },
    39: { id: 40, name: 'Allied Footsteps', edition_id: 5 },
    40: { id: 41, name: 'Alter Fortune', edition_id: 5 },
    41: { id: 42, name: 'Alter Self', edition_id: 5 },
    42: { id: 43, name: 'Amanuensis', edition_id: 5 },
    43: { id: 44, name: 'Amber Sarcophagus', edition_id: 5 },
    44: { id: 45, name: 'Amorphous Form', edition_id: 5 },
    45: { id: 46, name: 'Amplify', edition_id: 5 },
    46: { id: 47, name: 'Analyze Dweomer', edition_id: 5 },
    47: { id: 48, name: 'Analyze Portal', edition_id: 5 },
    48: { id: 49, name: 'Analyze Touchstone', edition_id: 5 },
    49: { id: 50, name: 'Anarchic Storm', edition_id: 5 },
    50: { id: 51, name: 'Anarchic Water', edition_id: 5 },
    51: { id: 52, name: 'Angelskin', edition_id: 5 },
    52: { id: 53, name: 'Anger of the Noonday Sun', edition_id: 5 },
    53: { id: 54, name: 'Angry Ache', edition_id: 4 },
    54: { id: 55, name: 'Animal Growth', edition_id: 5 },
    55: { id: 56, name: 'Animal Messenger', edition_id: 5 },
    56: { id: 57, name: 'Animal Shapes', edition_id: 5 },
    57: { id: 58, name: 'Animal Trance', edition_id: 5 },
    58: { id: 59, name: 'Animalistic Power', edition_id: 5 },
    59: { id: 60, name: 'Animalistic Power, Mass', edition_id: 5 },
    60: { id: 61, name: 'Animate Breath', edition_id: 5 },
    61: { id: 62, name: 'Animate City', edition_id: 5 },
    62: { id: 63, name: 'Animate Dead', edition_id: 5 },
    63: { id: 64, name: 'Animate Fire', edition_id: 5 },
    64: { id: 65, name: 'Animate Legion', edition_id: 5 },
    65: { id: 67, name: 'Animate Objects', edition_id: 5 },
    66: { id: 68, name: 'Animate Plants', edition_id: 5 },
    67: { id: 69, name: 'Animate Rope', edition_id: 5 },
    68: { id: 70, name: 'Animate Siege Weapon', edition_id: 5 },
    69: { id: 71, name: 'Animate Snow', edition_id: 5 },
    70: { id: 72, name: 'Animate Water', edition_id: 5 },
    71: { id: 73, name: 'Animate Weapon', edition_id: 5 },
    72: { id: 74, name: 'Animate Wood', edition_id: 5 },
    73: { id: 75, name: 'Anticipate Teleportation', edition_id: 5 },
    74: { id: 76, name: 'Anticipate Teleportation, Greater', edition_id: 5 },
    75: { id: 77, name: 'Anticold Sphere', edition_id: 5 },
    76: { id: 78, name: 'Antidragon Aura', edition_id: 5 },
    77: { id: 79, name: 'Antifire Sphere', edition_id: 5 },
    78: { id: 80, name: 'Antilife Shell', edition_id: 5 },
    79: { id: 81, name: 'Antimagic Aura', edition_id: 4 },
    80: { id: 82, name: 'Antimagic Field', edition_id: 5 },
    81: { id: 83, name: 'Antimagic Ray', edition_id: 5 },
    82: { id: 84, name: 'Antipathy', edition_id: 5 },
    83: { id: 85, name: 'Antiplant Shell', edition_id: 5 },
    84: { id: 86, name: 'Anyspell', edition_id: 5 },
    85: { id: 87, name: 'Anyspell, Greater', edition_id: 5 },
    86: { id: 88, name: 'Apocalypse from the Sky', edition_id: 4 },
    87: { id: 89, name: 'Apparition', edition_id: 5 },
    88: { id: 90, name: 'Appraising Touch', edition_id: 5 },
    89: { id: 91, name: 'Arboreal Transformation', edition_id: 5 },
    // ... rest of the spell data would continue here
}

export const SPELL_ID_LIST = Object.values(SPELL_ID_MAP); 
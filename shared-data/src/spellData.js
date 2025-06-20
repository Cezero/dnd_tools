export const SPELL_COMPONENT_MAP = {
    0: { id: 0, abbr: 'V', name: 'Verbal' },
    1: { id: 1, abbr: 'S', name: 'Somatic' },
    2: { id: 2, abbr: 'M', name: 'Material' },
    3: { id: 3, abbr: 'F', name: 'Focus' },
    4: { id: 4, abbr: 'DF', name: 'Divine Focus' },
    5: { id: 5, abbr: 'X', name: 'XP' }
}

export const SPELL_COMPONENT_LIST = Object.values(SPELL_COMPONENT_MAP);

export const COMPONENT_ABBREVIATION_LIST = (components) => {
    return components.map(component => SPELL_COMPONENT_MAP[component].abbr).join(', ');
}

export const SPELL_DESCRIPTOR_MAP = {
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

export const DESCRIPTOR_NAME_LIST = (descriptors) => {
    return descriptors.map(descriptor => SPELL_DESCRIPTOR_MAP[descriptor].name).join(', ');
}

export const SPELL_RANGE_MAP = {
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

export const SPELL_SCHOOL_MAP = {
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

export const SCHOOL_NAME_LIST = (schools) => {
    return schools.map(school => SPELL_SCHOOL_MAP[school].name).join(', ');
}

export const SPELL_SUBSCHOOL_MAP = {
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

export const SPELL_SUBSCHOOL_LIST_BY_SCHOOL_ID = Object.values(SPELL_SUBSCHOOL_MAP).reduce((acc, school) => {
    acc[school.id] = Object.values(SPELL_SUBSCHOOL_MAP).filter(subschool => subschool.school_id === school.id);
    return acc;
}, {});

export const SUBSCHOOL_NAME_LIST = (subschools) => {
    return subschools.map(subschool => SPELL_SUBSCHOOL_MAP[subschool].name).join(', ');
}

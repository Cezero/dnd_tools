import type { SpellComponentMap, SpellDescriptorMap, SpellRangeMap, SpellSchoolMap, SpellSubschoolMap, Spell, NameToIdMap, CoreComponent } from './types';

export const SpellComponent = {
    Verbal: 0,
    Somatic: 1,
    Material: 2,
    Focus: 3,
    DivineFocus: 4,
    XP: 5
} as const;

export type SpellComponent = (typeof SpellComponent)[keyof typeof SpellComponent];

export const SPELL_COMPONENT_MAP: SpellComponentMap = {
    [SpellComponent.Verbal]: { id: SpellComponent.Verbal, abbreviation: 'V', name: 'Verbal' },
    [SpellComponent.Somatic]: { id: SpellComponent.Somatic, abbreviation: 'S', name: 'Somatic' },
    [SpellComponent.Material]: { id: SpellComponent.Material, abbreviation: 'M', name: 'Material' },
    [SpellComponent.Focus]: { id: SpellComponent.Focus, abbreviation: 'F', name: 'Focus' },
    [SpellComponent.DivineFocus]: { id: SpellComponent.DivineFocus, abbreviation: 'DF', name: 'Divine Focus' },
    [SpellComponent.XP]: { id: SpellComponent.XP, abbreviation: 'X', name: 'XP' }
}

export const SPELL_COMPONENT_LIST = Object.values(SPELL_COMPONENT_MAP);

export const SpellComponentAbbrList = (components: number[]): string => {
    return components
        .map(component => SPELL_COMPONENT_MAP[component]?.abbreviation)
        .filter((abbr): abbr is string => abbr !== undefined)
        .join(', ');
}

export const SPELL_DESCRIPTOR_MAP: SpellDescriptorMap = {
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
    return descriptors
        .map(descriptor => SPELL_DESCRIPTOR_MAP[descriptor]?.name)
        .filter((name): name is string => name !== undefined)
        .join(', ');
}

export const SPELL_RANGE_MAP: SpellRangeMap = {
    1: { id: 1, name: 'Touch', abbreviation: 'tch' },
    2: { id: 2, name: 'Personal', abbreviation: 'per' },
    3: { id: 3, name: 'Close', abbreviation: 'cls' },
    4: { id: 4, name: 'Medium', abbreviation: 'med' },
    5: { id: 5, name: 'Long', abbreviation: 'lng' },
    6: { id: 6, name: 'Unlimited', abbreviation: 'unl' },
    7: { id: 7, name: 'Foot', abbreviation: 'ft.' },
    8: { id: 8, name: 'Mile', abbreviation: 'mi.' },
    9: { id: 9, name: 'Special', abbreviation: 'spc' }
}

export const SPELL_RANGE_LIST = Object.values(SPELL_RANGE_MAP);

export const SpellSchool = {
    Abjuration: 1,
    Conjuration: 2,
    Divination: 3,
    Enchantment: 4,
    Evocation: 5,
    Illusion: 6,
    Necromancy: 7,
    Transmutation: 8,
    Universal: 9,
    Invocation: 10
} as const;

export type SpellSchool = (typeof SpellSchool)[keyof typeof SpellSchool];

export const SPELL_SCHOOL_MAP: SpellSchoolMap = {
    [SpellSchool.Abjuration]: { id: SpellSchool.Abjuration, name: 'Abjuration', abbreviation: 'abj' },
    [SpellSchool.Conjuration]: { id: SpellSchool.Conjuration, name: 'Conjuration', abbreviation: 'conj' },
    [SpellSchool.Divination]: { id: SpellSchool.Divination, name: 'Divination', abbreviation: 'div' },
    [SpellSchool.Enchantment]: { id: SpellSchool.Enchantment, name: 'Enchantment', abbreviation: 'ench' },
    [SpellSchool.Evocation]: { id: SpellSchool.Evocation, name: 'Evocation', abbreviation: 'evoc' },
    [SpellSchool.Illusion]: { id: SpellSchool.Illusion, name: 'Illusion', abbreviation: 'illu' },
    [SpellSchool.Necromancy]: { id: SpellSchool.Necromancy, name: 'Necromancy', abbreviation: 'nec' },
    [SpellSchool.Transmutation]: { id: SpellSchool.Transmutation, name: 'Transmutation', abbreviation: 'tran' },
    [SpellSchool.Universal]: { id: SpellSchool.Universal, name: 'Universal', abbreviation: 'univ' },
    [SpellSchool.Invocation]: { id: SpellSchool.Invocation, name: 'Invocation', abbreviation: 'inv' }
}

export const SPELL_SCHOOL_LIST = Object.values(SPELL_SCHOOL_MAP);

export const SpellSchoolNameList = (schools: number[]): string => {
    return schools
        .map(school => SPELL_SCHOOL_MAP[school]?.name)
        .filter((name): name is string => name !== undefined)
        .join(', ');
}

export const SpellSubschool = {
    Calling: 1,
    Creation: 2,
    Healing: 3,
    Summoning: 4,
    Teleportation: 5,
    Scrying: 6,
    Charm: 7,
    Compulsion: 8,
    Figment: 9,
    Glamer: 10,
    Pattern: 11,
    Phantasm: 12,
    Shadow: 13,
    Least: 14,
    Lesser: 15,
    Greater: 16,
    Dark: 17
} as const;

export type SpellSubschool = (typeof SpellSubschool)[keyof typeof SpellSubschool];

export const SPELL_SUBSCHOOL_MAP: SpellSubschoolMap = {
    [SpellSubschool.Calling]: { id: SpellSubschool.Calling, name: 'Calling', abbreviation: 'call' },
    [SpellSubschool.Creation]: { id: SpellSubschool.Creation, name: 'Creation', abbreviation: 'cre' },
    [SpellSubschool.Healing]: { id: SpellSubschool.Healing, name: 'Healing', abbreviation: 'heal' },
    [SpellSubschool.Summoning]: { id: SpellSubschool.Summoning, name: 'Summoning', abbreviation: 'summon' },
    [SpellSubschool.Teleportation]: { id: SpellSubschool.Teleportation, name: 'Teleportation', abbreviation: 'tele' },
    [SpellSubschool.Scrying]: { id: SpellSubschool.Scrying, name: 'Scrying', abbreviation: 'scry' },
    [SpellSubschool.Charm]: { id: SpellSubschool.Charm, name: 'Charm', abbreviation: 'charm' },
    [SpellSubschool.Compulsion]: { id: SpellSubschool.Compulsion, name: 'Compulsion', abbreviation: 'comp' },
    [SpellSubschool.Figment]: { id: SpellSubschool.Figment, name: 'Figment', abbreviation: 'fig' },
    [SpellSubschool.Glamer]: { id: SpellSubschool.Glamer, name: 'Glamer', abbreviation: 'glam' },
    [SpellSubschool.Pattern]: { id: SpellSubschool.Pattern, name: 'Pattern', abbreviation: 'pattern' },
    [SpellSubschool.Phantasm]: { id: SpellSubschool.Phantasm, name: 'Phantasm', abbreviation: 'phant' },
    [SpellSubschool.Shadow]: { id: SpellSubschool.Shadow, name: 'Shadow', abbreviation: 'shadow' },
    [SpellSubschool.Least]: { id: SpellSubschool.Least, name: 'Least', abbreviation: 'least' },
    [SpellSubschool.Lesser]: { id: SpellSubschool.Lesser, name: 'Lesser', abbreviation: 'less' },
    [SpellSubschool.Greater]: { id: SpellSubschool.Greater, name: 'Greater', abbreviation: 'greater' },
    [SpellSubschool.Dark]: { id: SpellSubschool.Dark, name: 'Dark', abbreviation: 'dark' }
}

export const SPELL_SUBSCHOOL_LIST = Object.values(SPELL_SUBSCHOOL_MAP);

export const SPELL_SUBSCHOOL_BY_SCHOOL_ID_MAP: { [K in SpellSchool]: SpellSubschool[] } = {
    [SpellSchool.Abjuration]: [],
    [SpellSchool.Conjuration]: [SpellSubschool.Calling, SpellSubschool.Creation, SpellSubschool.Healing, SpellSubschool.Summoning, SpellSubschool.Teleportation],
    [SpellSchool.Divination]: [SpellSubschool.Scrying],
    [SpellSchool.Enchantment]: [SpellSubschool.Charm, SpellSubschool.Compulsion],
    [SpellSchool.Evocation]: [],
    [SpellSchool.Illusion]: [SpellSubschool.Figment, SpellSubschool.Glamer, SpellSubschool.Pattern, SpellSubschool.Phantasm, SpellSubschool.Shadow],
    [SpellSchool.Necromancy]: [],
    [SpellSchool.Transmutation]: [],
    [SpellSchool.Universal]: [],
    [SpellSchool.Invocation]: [SpellSubschool.Least, SpellSubschool.Lesser, SpellSubschool.Greater, SpellSubschool.Dark]
} as const;


export const SpellSubschoolNameList = (subschools: number[]): string => {
    return subschools
        .map(subschool => SPELL_SUBSCHOOL_MAP[subschool]?.name)
        .filter((name): name is string => name !== undefined)
        .join(', ');
}

// SPELL_ID_MAP has been removed - use cache-based lookups instead
// This large object (2778+ lines) is no longer needed as all spell data is now in the database
// Use @/services/cache/IdMapHelpers for lookups
/*
// SPELL_ID_MAP has been removed - use cache-based lookups instead
// This large object (2778+ lines) is no longer needed as all spell data is now in the database
// Use @/services/cache/IdMapHelpers for lookups
*/
/*
// SPELL_ID_LIST, SPELL_NAME_MAP, and SPELL_ID_MAP have been removed.
// Use cache-based lookups via @/services/cache/IdMapHelpers instead:
// - getSpellIdByName(queryClient, name) for name-to-ID lookups
// - getSpellNameFromCache(queryClient, id) for ID-to-name lookups
// - CacheQueryHooks.useSpellsCache() for full spell cache access
*/

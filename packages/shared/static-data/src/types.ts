// Type definitions for static data

export interface Ability {
    id: number;
    name: string;
    abbr: string;
}

export interface SavingThrow {
    id: number;
    name: string;
    abbr: string;
}

export interface Skill {
    id: number;
    name: string;
    abbr: string;
    ability_id: number;
    armor_check_penalty: boolean;
    trained_only: boolean;
    description: string;
}

export interface RpgDie {
    id: number;
    name: string;
    sides: number;
    min: number;
    max: number;
}

export interface Currency {
    id: number;
    name: string;
    abbr: string;
    gp_value: number;
}

export interface Alignment {
    id: number;
    name: string;
    abbr: string;
}

export interface Size {
    id: number;
    name: string;
    abbr: string;
    size_modifier: number;
    grapple_modifier: number;
    hide_modifier: number;
    heaight_or_length: string;
    weight: string;
    space: string;
    natural_reach_tall: number;
    natural_reach_long: number;
}

export interface Language {
    id: number;
    name: string;
    typical_speakers: string;
    alphabet: string;
}

export interface Edition {
    id: number;
    name: string;
    abbr: string;
}

export interface Class {
    id: number;
    name: string;
    abbr: string;
    edition_id: number;
    display: number;
    can_cast: number;
    is_prestige: number;
}

export interface Source {
    id: number;
    name: string;
    abbr: string;
    edition_id: number;
    has_spells: number;
}

export interface Spell {
    id: number;
    name: string;
    school_id: number;
    subschool_id: number | null;
    descriptor_ids: number[];
    spell_levels: { [classId: number]: number };
    casting_time: string;
    components: string[];
    range: string;
    target: string;
    duration: string;
    saving_throw: string;
    spell_resistance: string;
    description: string;
    source_id: number;
}

export interface Feat {
    id: number;
    name: string;
    type: string;
    description: string;
    prerequisites: string;
    benefit: string;
    special: string;
    source_id: number;
}

export interface Item {
    id: number;
    name: string;
    type: string;
    cost: number;
    weight: number;
    description: string;
    source_id: number;
}

// Map types
export type AbilityMap = { [key: number]: Ability };
export type SavingThrowMap = { [key: number]: SavingThrow };
export type SkillMap = { [key: number]: Skill };
export type RpgDieMap = { [key: number]: RpgDie };
export type CurrencyMap = { [key: number]: Currency };
export type AlignmentMap = { [key: number]: Alignment };
export type SizeMap = { [key: number]: Size };
export type LanguageMap = { [key: number]: Language };
export type EditionMap = { [key: number]: Edition };
export type ClassMap = { [key: number]: Class };
export type SourceMap = { [key: number]: Source };
export type SpellMap = { [key: number]: Spell };
export type FeatMap = { [key: number]: Feat };
export type ItemMap = { [key: number]: Item }; 
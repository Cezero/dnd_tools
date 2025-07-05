import { ClassResponse, SkillResponse, SpellInQueryResponse, SourceBookWithSpellsResponse } from '@shared/schema';

export interface Ability {
    id: number;
    name: string;
    abbreviation: string;
}

export interface SavingThrow {
    id: number;
    name: string;
    abbreviation: string;
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
    abbreviation: string;
    gpValue: number;
}

export interface Alignment {
    id: number;
    name: string;
    abbreviation: string;
}

export interface Size {
    id: number;
    name: string;
    abbreviation: string;
    sizeModifier: number;
    grappleModifier: number;
    hideModifier: number;
    heightOrLength: string;
    weight: string;
    space: string;
    naturalReachTall: number;
    naturalReachLong: number;
}

export interface Language {
    id: number;
    name: string;
    typicalSpeakers: string;
    alphabet: string;
}

export interface Edition {
    id: number;
    name: string;
    abbreviation: string;
}

export interface Feat {
    id: number;
    name: string;
    type: string;
    description: string;
    prerequisites: string;
    benefit: string;
    special: string;
    sourceId: number;
}

export interface Item {
    id: number;
    name: string;
    type: string;
    cost: number;
    weight: number;
    description: string;
    sourceId: number;
}

export interface Spell {
    id: number;
    name: string;
    editionId: number;
}

export interface SpellComponent {
    id:  number;
    abbreviation: string;
    name: string;
}

export interface SpellDescriptor {
    id:  number;
    name: string;
}

export interface SpellRange {
    id:  number;
    name: string;
    abbreviation: string;
}

export interface SpellSchool {
    id:  number;
    name: string;
    abbreviation: string;
}

export interface SpellSubschool {
    id:  number;
    name: string;
    schoolId:  number;
}

export interface FeatType {
    id: number;
    name: string;
}

export interface FeatBenefitType {
    id: number;
    name: string;
}

export interface FeatPrerequisiteType {
    id: number;
    name: string;
}

export interface WeaponCategory {
    id: number;
    name: string;
}

export interface WeaponType {
    id: number;
    name: string;
}

export interface DamageType {
    id: number;
    name: string;
}

export interface ArmorCategory {
    id: number;
    name: string;
}

export interface ProficiencyType {
    id: number;
    name: string;
}

export interface ClassNameMap {
    [key: string]: string;
}

export interface Skill {
    id: number;
    name: string;
    abilityId: number;
    trainedOnly: boolean;
}

export interface SourceBook {
    id: number;
    name: string;
    abbreviation: string;
    editionId: number;
    hasSpells: boolean;
    hasClasses: boolean;
}

export interface Class {
    id: number;
    name: string;
    abbreviation: string;
    editionId: number;
    isPrestige: boolean;
    isVisible: boolean;
    canCastSpells: boolean;
}

// Map types
export type AbilityMap = { [key: number]: Ability };
export type SavingThrowMap = { [key: number]: SavingThrow };
export type RpgDieMap = { [key: number]: RpgDie };
export type CurrencyMap = { [key: number]: Currency };
export type AlignmentMap = { [key: number]: Alignment };
export type SizeMap = { [key: number]: Size };
export type LanguageMap = { [key: number]: Language };
export type EditionMap = { [key: number]: Edition };
export type FeatMap = { [key: number]: Feat };
export type ItemMap = { [key: number]: Item };
export type SpellMap = { [key: number]: Spell };
export type SpellNameMap = { [key: string]: number };
export type SpellComponentMap = { [key: number]: SpellComponent };
export type SpellDescriptorMap = { [key: number]: SpellDescriptor };
export type SpellRangeMap = { [key: number]: SpellRange };
export type SpellSchoolMap = { [key: number]: SpellSchool };
export type SpellSubschoolMap = { [key: number]: SpellSubschool };
export type SkillMap = { [key: number]: Skill };
export type SourceBookMap = { [key: number]: SourceBook };
export type ClassMap = { [key: number]: Class };

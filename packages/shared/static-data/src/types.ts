import { ClassResponse, SkillResponse, SpellResponse, SourceBookWithSpellsResponse } from '@shared/schema';

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


export type StaticClassData = Pick<ClassResponse, 'id' | 'name' | 'abbreviation' | 'editionId' | 'isPrestige' | 'isVisible' | 'canCastSpells'> & {
    // Optional fields with defaults that will be applied when converting to full Class type
    hitDie?: number;
    description?: string | null;
    skillPoints?: number;
    castingAbilityId?: number | null;
};

export type StaticSkillData = Pick<SkillResponse, 'id' | 'name' | 'abilityId' | 'trainedOnly'> & {
    // Optional fields with defaults that will be applied when converting to full Skill type
    checkDescription?: string | null;
    actionDescription?: string | null;
    retryTypeId?: number | null;
    retryDescription?: string | null;
    specialNotes?: string | null;
    synergyNotes?: string | null;
    untrainedNotes?: string | null;
    affectedByArmor?: boolean;
    description?: string | null;
};

// Type for our static data that includes only the fields we have
export type StaticSourceBookData = Pick<SourceBookWithSpellsResponse, 'id' | 'name' | 'abbreviation' | 'editionId' | 'hasSpells'> & {
    // Optional fields with defaults that will be applied when converting to full Class type
    isVisible?: boolean;
    description?: string | null;
    releaseDate?: Date | null;
};

export type StaticSpellData = Pick<SpellResponse, 'id' | 'name' | 'editionId'> & {
    // Optional fields with defaults that will be applied when converting to full Class type
    description?: string | null;
    summary?: string | null;
    castingTime?: string | null;
    range?: string | null;
    rangeTypeId?: number | null;
    rangeValue?: string | null;
    area?: string | null;
    duration?: string | null;
    savingThrow?: string | null;
    spellResistance?: string | null;
    effect?: string | null;
    target?: string | null;
    baseLevel?: number;
};

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
export type SpellMap = { [key: number]: StaticSpellData };
export type SpellComponentMap = { [key: number]: SpellComponent };
export type SpellDescriptorMap = { [key: number]: SpellDescriptor };
export type SpellRangeMap = { [key: number]: SpellRange };
export type SpellSchoolMap = { [key: number]: SpellSchool };
export type SpellSubschoolMap = { [key: number]: SpellSubschool };
export type SkillMap = { [key: number]: StaticSkillData };
export type SourceBookMap = { [key: number]: StaticSourceBookData };
export type ClassMap = { [key: number]: StaticClassData };

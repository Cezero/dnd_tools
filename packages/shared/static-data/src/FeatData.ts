interface FeatType {
    id: number;
    name: string;
}

interface FeatBenefitType {
    id: number;
    name: string;
}

interface FeatPrerequisiteType {
    id: number;
    name: string;
}

export const FEAT_TYPES: { [key: string]: FeatType } = {
    GENERAL: { id: 1, name: 'General' },
    ITEM_CREATION: { id: 2, name: 'Item Creation' },
    METAMAGIC: { id: 3, name: 'Metamagic' },
}

export const FEAT_TYPE_BY_ID: { [key: number]: FeatType } = Object.fromEntries(
    Object.values(FEAT_TYPES).map(obj => [obj.id, obj])
);

export const FEAT_TYPE_LIST = Object.values(FEAT_TYPES);

export const FEAT_BENEFIT_TYPES: { [key: string]: FeatBenefitType } = {
    SKILL: { id: 1, name: 'Skill' },
    SAVE: { id: 2, name: 'Save' },
    PROFICIENCY: { id: 3, name: 'Proficiency' },
}

export const FEAT_BENEFIT_TYPE_BY_ID: { [key: number]: FeatBenefitType } = Object.fromEntries(
    Object.values(FEAT_BENEFIT_TYPES).map(obj => [obj.id, obj])
);

export const FEAT_BENEFIT_TYPE_LIST = Object.values(FEAT_BENEFIT_TYPES);

export const FEAT_PREREQUISITE_TYPES: { [key: string]: FeatPrerequisiteType } = {
    ABILITY: { id: 1, name: 'Ability' },
    SKILL: { id: 2, name: 'Skill' },
    FEAT: { id: 3, name: 'Feat' },
    BAB: { id: 4, name: 'Base Attack Bonus' },
    SPELLCASTING: { id: 5, name: 'Spellcasting' },
    SPECIAL: { id: 6, name: 'Special' },
}

export const FEAT_PREREQ_BY_ID: { [key: number]: FeatPrerequisiteType } = Object.fromEntries(
    Object.values(FEAT_PREREQUISITE_TYPES).map(obj => [obj.id, obj])
);

export const FEAT_PREREQUISITE_TYPE_LIST = Object.values(FEAT_PREREQUISITE_TYPES); 
import type { CoreComponent, BaseMap, IdToNameMap } from './types';
import { NameSelectOptionList, ObjectIdToNameMap } from './Util';

export const enum FeatType {
    GENERAL = 1,
    ITEM_CREATION = 2,
    METAMAGIC = 3,
}

export const FEAT_TYPES: BaseMap<CoreComponent> = {
    [FeatType.GENERAL]: { id: FeatType.GENERAL, name: 'General' },
    [FeatType.ITEM_CREATION]: { id: FeatType.ITEM_CREATION, name: 'Item Creation' },
    [FeatType.METAMAGIC]: { id: FeatType.METAMAGIC, name: 'Metamagic' },
}

export const FEAT_TYPE_BY_ID: IdToNameMap = ObjectIdToNameMap(FEAT_TYPES);
export const FEAT_TYPE_LIST = Object.values(FEAT_TYPES);
export const FEAT_TYPE_SELECT_LIST = NameSelectOptionList(FEAT_TYPE_LIST);

export const enum FeatBenefitType {
    SKILL = 1,
    SAVE = 2,
    PROFICIENCY = 3,
}

export const FEAT_BENEFIT_TYPES: BaseMap<CoreComponent> = {
    [FeatBenefitType.SKILL]: { id: FeatBenefitType.SKILL, name: 'Skill' },
    [FeatBenefitType.SAVE]: { id: FeatBenefitType.SAVE, name: 'Save' },
    [FeatBenefitType.PROFICIENCY]: { id: FeatBenefitType.PROFICIENCY, name: 'Proficiency' },
}

export const FEAT_BENEFIT_TYPE_BY_ID: IdToNameMap = ObjectIdToNameMap(FEAT_BENEFIT_TYPES);
export const FEAT_BENEFIT_TYPE_LIST = Object.values(FEAT_BENEFIT_TYPES);
export const FEAT_BENEFIT_TYPE_SELECT_LIST = NameSelectOptionList(FEAT_BENEFIT_TYPE_LIST);

export const enum FeatPrerequisiteType {
    ABILITY = 1,
    SKILL = 2,
    FEAT = 3,
    BAB = 4,
    SPELLCASTING = 5,
    SPECIAL = 6,
}

export const FEAT_PREREQUISITE_TYPES: BaseMap<CoreComponent> = {
    [FeatPrerequisiteType.ABILITY]: { id: FeatPrerequisiteType.ABILITY, name: 'Ability' },
    [FeatPrerequisiteType.SKILL]: { id: FeatPrerequisiteType.SKILL, name: 'Skill' },
    [FeatPrerequisiteType.FEAT]: { id: FeatPrerequisiteType.FEAT, name: 'Feat' },
    [FeatPrerequisiteType.BAB]: { id: FeatPrerequisiteType.BAB, name: 'Base Attack Bonus' },
    [FeatPrerequisiteType.SPELLCASTING]: { id: FeatPrerequisiteType.SPELLCASTING, name: 'Caster Level' },
    [FeatPrerequisiteType.SPECIAL]: { id: FeatPrerequisiteType.SPECIAL, name: 'Special' },
}

export const FEAT_PREREQ_BY_ID: IdToNameMap = ObjectIdToNameMap(FEAT_PREREQUISITE_TYPES);
export const FEAT_PREREQUISITE_TYPE_LIST = Object.values(FEAT_PREREQUISITE_TYPES);
export const FEAT_PREREQUISITE_TYPE_SELECT_LIST = NameSelectOptionList(FEAT_PREREQUISITE_TYPE_LIST);

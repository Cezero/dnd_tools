import type { CoreComponent, BaseMap, IdToNameMap, FeatBenefitTypeMap } from './types';
import { ObjectIdToNameMap } from './Util';

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

export const enum FeatBenefitType {
    SKILL = 1,
    SAVE = 2,
    PROFICIENCY = 3,
    TURN_ATTEMPTS = 4,
    SPELLS_LEARNED = 5,
    RANGE_INCREMENT = 6,
    DIFFICULTY_CLASS = 7,
    CASTER_LEVEL = 8,
    ATTACK_BONUS = 9,
    DAMAGE_BONUS = 10,
    THREAT_RANGE = 11,
    INITIATIVE = 12,
}

export const FEAT_BENEFIT_TYPES: FeatBenefitTypeMap = {
    [FeatBenefitType.SKILL]: { id: FeatBenefitType.SKILL, name: 'Skill', hasSubId: true },
    [FeatBenefitType.SAVE]: { id: FeatBenefitType.SAVE, name: 'Save', hasSubId: true },
    [FeatBenefitType.PROFICIENCY]: { id: FeatBenefitType.PROFICIENCY, name: 'Proficiency', hasSubId: true },
    [FeatBenefitType.TURN_ATTEMPTS]: { id: FeatBenefitType.TURN_ATTEMPTS, name: 'Turn Attempts', hasSubId: false },
    [FeatBenefitType.SPELLS_LEARNED]: { id: FeatBenefitType.SPELLS_LEARNED, name: 'Spells Learned', hasSubId: false },
    [FeatBenefitType.RANGE_INCREMENT]: { id: FeatBenefitType.RANGE_INCREMENT, name: 'Range Increment', hasSubId: false },
    [FeatBenefitType.DIFFICULTY_CLASS]: { id: FeatBenefitType.DIFFICULTY_CLASS, name: 'Difficulty Class', hasSubId: false },
    [FeatBenefitType.CASTER_LEVEL]: { id: FeatBenefitType.CASTER_LEVEL, name: 'Caster Level', hasSubId: false },
    [FeatBenefitType.ATTACK_BONUS]: { id: FeatBenefitType.ATTACK_BONUS, name: 'Attack Bonus', hasSubId: false },
    [FeatBenefitType.DAMAGE_BONUS]: { id: FeatBenefitType.DAMAGE_BONUS, name: 'Damage Bonus', hasSubId: false },
    [FeatBenefitType.THREAT_RANGE]: { id: FeatBenefitType.THREAT_RANGE, name: 'Threat Range', hasSubId: false },
    [FeatBenefitType.INITIATIVE]: { id: FeatBenefitType.INITIATIVE, name: 'Initiative', hasSubId: false },
}

export const FEAT_BENEFIT_TYPE_BY_ID: IdToNameMap = ObjectIdToNameMap(FEAT_BENEFIT_TYPES);
export const FEAT_BENEFIT_TYPE_LIST = Object.values(FEAT_BENEFIT_TYPES);

export const enum FeatPrerequisiteType {
    ABILITY = 1,
    SKILL = 2,
    FEAT = 3,
    BAB = 4,
    SPELLCASTING = 5,
    SPECIAL = 6,
    CLASSLEVEL = 7,
    PROFICIENCY = 8,
    CLASSFEATURE = 9,
    SIZE = 10,
}

export const FEAT_PREREQUISITE_TYPES: BaseMap<CoreComponent> = {
    [FeatPrerequisiteType.ABILITY]: { id: FeatPrerequisiteType.ABILITY, name: 'Ability' },
    [FeatPrerequisiteType.SKILL]: { id: FeatPrerequisiteType.SKILL, name: 'Skill' },
    [FeatPrerequisiteType.FEAT]: { id: FeatPrerequisiteType.FEAT, name: 'Feat' },
    [FeatPrerequisiteType.BAB]: { id: FeatPrerequisiteType.BAB, name: 'Base Attack Bonus' },
    [FeatPrerequisiteType.SPELLCASTING]: { id: FeatPrerequisiteType.SPELLCASTING, name: 'Caster Level' },
    [FeatPrerequisiteType.CLASSLEVEL]: { id: FeatPrerequisiteType.CLASSLEVEL, name: 'Class Level' },
    [FeatPrerequisiteType.SPECIAL]: { id: FeatPrerequisiteType.SPECIAL, name: 'Special' },
    [FeatPrerequisiteType.PROFICIENCY]: { id: FeatPrerequisiteType.PROFICIENCY, name: 'Proficiency' },
    [FeatPrerequisiteType.CLASSFEATURE]: { id: FeatPrerequisiteType.CLASSFEATURE, name: 'Class Feature' },
    [FeatPrerequisiteType.SIZE]: { id: FeatPrerequisiteType.SIZE, name: 'Size' },
};

export const FEAT_PREREQ_BY_ID: IdToNameMap = ObjectIdToNameMap(FEAT_PREREQUISITE_TYPES);
export const FEAT_PREREQUISITE_TYPE_LIST = Object.values(FEAT_PREREQUISITE_TYPES);

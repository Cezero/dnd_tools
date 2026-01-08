import type { CoreComponent, BaseMap, IdToNameMap } from './types';
import { ObjectIdToNameMap } from './Util';
import { FeatureEntityConditionType } from './FeatureData';

export const enum CompanionBenefitType {
    Skill = 1,
    SavingThrow = 2,
    HitPoints = 3,
}

export type CompanionBenefitTypeInfo = CoreComponent & {
    hasSubId: boolean;
};

export type CompanionBenefitTypeMap = Record<number, CompanionBenefitTypeInfo>;

export const COMPANION_BENEFIT_TYPES: CompanionBenefitTypeMap = {
    [CompanionBenefitType.Skill]: { id: CompanionBenefitType.Skill, name: 'Skill', hasSubId: true },
    [CompanionBenefitType.SavingThrow]: { id: CompanionBenefitType.SavingThrow, name: 'Saving Throw', hasSubId: true },
    [CompanionBenefitType.HitPoints]: { id: CompanionBenefitType.HitPoints, name: 'Hit Points', hasSubId: false },
};

export const COMPANION_BENEFIT_TYPE_BY_ID: IdToNameMap = ObjectIdToNameMap(COMPANION_BENEFIT_TYPES);
export const COMPANION_BENEFIT_TYPE_LIST = Object.values(COMPANION_BENEFIT_TYPES);

// CompanionBenefitConditionType extends FeatureEntityConditionType
// Reuse existing types and add lighting condition type
export const CompanionBenefitConditionType = {
    material: FeatureEntityConditionType.material,
    attack_type: FeatureEntityConditionType.attack_type,
    character_size: FeatureEntityConditionType.character_size,
    target: FeatureEntityConditionType.target,
    environment: FeatureEntityConditionType.environment,
    spell_school: FeatureEntityConditionType.spell_school,
    creature_type: FeatureEntityConditionType.creature_type,
    source: FeatureEntityConditionType.source,
    lighting: 8,
} as const;

export type CompanionBenefitConditionType = typeof CompanionBenefitConditionType[keyof typeof CompanionBenefitConditionType];

export const COMPANION_BENEFIT_CONDITION_TYPES: BaseMap<CoreComponent> = {
    [CompanionBenefitConditionType.material]: { id: CompanionBenefitConditionType.material, name: 'Material' },
    [CompanionBenefitConditionType.attack_type]: { id: CompanionBenefitConditionType.attack_type, name: 'Attack Type' },
    [CompanionBenefitConditionType.character_size]: { id: CompanionBenefitConditionType.character_size, name: 'Character Size' },
    [CompanionBenefitConditionType.target]: { id: CompanionBenefitConditionType.target, name: 'Target' },
    [CompanionBenefitConditionType.environment]: { id: CompanionBenefitConditionType.environment, name: 'Environment' },
    [CompanionBenefitConditionType.spell_school]: { id: CompanionBenefitConditionType.spell_school, name: 'Spell School' },
    [CompanionBenefitConditionType.creature_type]: { id: CompanionBenefitConditionType.creature_type, name: 'Creature Type' },
    [CompanionBenefitConditionType.source]: { id: CompanionBenefitConditionType.source, name: 'Source' },
    [CompanionBenefitConditionType.lighting]: { id: CompanionBenefitConditionType.lighting, name: 'Lighting' },
};

export const COMPANION_BENEFIT_CONDITION_LIST = Object.values(COMPANION_BENEFIT_CONDITION_TYPES);

// Lighting condition values
export const LightingConditionType = {
    bright_light: 0,
    shadows: 1,
    dim_light: 2,
    darkness: 3,
} as const;

export type LightingConditionType = typeof LightingConditionType[keyof typeof LightingConditionType];

export const LIGHTING_CONDITION_TYPES: BaseMap<CoreComponent> = {
    [LightingConditionType.bright_light]: { id: LightingConditionType.bright_light, name: 'Bright Light' },
    [LightingConditionType.shadows]: { id: LightingConditionType.shadows, name: 'Shadows' },
    [LightingConditionType.dim_light]: { id: LightingConditionType.dim_light, name: 'Dim Light' },
    [LightingConditionType.darkness]: { id: LightingConditionType.darkness, name: 'Darkness' },
};

export const LIGHTING_CONDITION_LIST = Object.values(LIGHTING_CONDITION_TYPES);


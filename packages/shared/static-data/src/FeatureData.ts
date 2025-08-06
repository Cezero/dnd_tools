import { BaseMap, CoreComponent } from "./types";
import { NameSelectOptionList } from "./Util";

export const SpecialFeatureId = {
    ClassSkill: 1,
    ClassProficiency: 2,
} as const;

export type SpecialFeatureId = typeof SpecialFeatureId[keyof typeof SpecialFeatureId];

export const FeatureSourceType = {
    Race: 0,
    Class: 1,
    Template: 2,
} as const;

export type FeatureSourceType = typeof FeatureSourceType[keyof typeof FeatureSourceType];

export const FeatureModifierType = {
    FlatBonus: 0,
    DamageDice: 1,
    MovementSpeed: 2,
    Distance: 3,
    EnergyResistance: 4,
    AC: 5,
    DR: 6,
    SaveBonus: 7,
    SkillBonus: 8,
    AttackBonus: 9,
    SpellDC: 10,
    UsesPerDay: 11,
    Other: 12,
    ClassSkill: 13,
} as const;

export type FeatureModifierType = typeof FeatureModifierType[keyof typeof FeatureModifierType];

export const FEATURE_MODIFIER_TYPES: BaseMap<CoreComponent> = {
    [FeatureModifierType.FlatBonus]: { id: FeatureModifierType.FlatBonus, name: 'Flat Bonus' },
    [FeatureModifierType.DamageDice]: { id: FeatureModifierType.DamageDice, name: 'Damage Dice' },
    [FeatureModifierType.MovementSpeed]: { id: FeatureModifierType.MovementSpeed, name: 'Movement Speed' },
    [FeatureModifierType.Distance]: { id: FeatureModifierType.Distance, name: 'Distance' },
    [FeatureModifierType.EnergyResistance]: { id: FeatureModifierType.EnergyResistance, name: 'Energy Resistance' },
    [FeatureModifierType.AC]: { id: FeatureModifierType.AC, name: 'AC' },
    [FeatureModifierType.DR]: { id: FeatureModifierType.DR, name: 'DR' },
    [FeatureModifierType.SaveBonus]: { id: FeatureModifierType.SaveBonus, name: 'Save Bonus' },
    [FeatureModifierType.SkillBonus]: { id: FeatureModifierType.SkillBonus, name: 'Skill Bonus' },
    [FeatureModifierType.AttackBonus]: { id: FeatureModifierType.AttackBonus, name: 'Attack Bonus' },
    [FeatureModifierType.SpellDC]: { id: FeatureModifierType.SpellDC, name: 'Spell DC' },
    [FeatureModifierType.UsesPerDay]: { id: FeatureModifierType.UsesPerDay, name: 'Uses Per Day' },
    [FeatureModifierType.Other]: { id: FeatureModifierType.Other, name: 'Other' },
    [FeatureModifierType.ClassSkill]: { id: FeatureModifierType.ClassSkill, name: 'Class Skill' },
}

export const FEATURE_MODIFIER_LIST = Object.values(FEATURE_MODIFIER_TYPES);
export const FEATURE_MODIFIER_SELECT_LIST = NameSelectOptionList(FEATURE_MODIFIER_LIST);

export const FeatureSpecialEffectType = {
    FavoredEnemy: 0,
    ConditionalUpgrade: 1,
    TurnUndead: 2,
    WildShapeForm: 3,
    WildShapeSize: 4,
    Other: 5,
} as const;

export type FeatureSpecialEffectType = typeof FeatureSpecialEffectType[keyof typeof FeatureSpecialEffectType];

export const FeatureAppliesToType = {
    Skill: 0,
    Item: 1,
    Language: 2,
    Dice: 3,
    Feat: 4,
    Other: 5,
} as const;

export type FeatureAppliesToType = typeof FeatureAppliesToType[keyof typeof FeatureAppliesToType];

export const FeatureFeatChoiceFilter = {
    Any: 0,
    FighterBonus: 1,
    MetamagicOrItemCreation: 2,
}

export type FeatureFeatChoiceFilter = typeof FeatureFeatChoiceFilter[keyof typeof FeatureFeatChoiceFilter];

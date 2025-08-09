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

export const ModifierType = {
    Bonus: 0,
    Quantity: 1,
    Uses: 2,
    Targets: 3,
    Distance: 4,
    Other: 5,
} as const;

export type ModifierType = typeof ModifierType[keyof typeof ModifierType];

export const MODIFIER_TYPES: BaseMap<CoreComponent> = {
    [ModifierType.Bonus]: { id: ModifierType.Bonus, name: 'Bonus' },
    [ModifierType.Quantity]: { id: ModifierType.Quantity, name: 'Quantity' },
    [ModifierType.Uses]: { id: ModifierType.Uses, name: 'Uses' },
    [ModifierType.Targets]: { id: ModifierType.Targets, name: 'Targets' },
    [ModifierType.Distance]: { id: ModifierType.Distance, name: 'Distance' },
    [ModifierType.Other]: { id: ModifierType.Other, name: 'Other' },
}

export const MODIFIER_LIST = Object.values(MODIFIER_TYPES);
export const MODIFIER_SELECT_LIST = NameSelectOptionList(MODIFIER_LIST);

export const ModifierAppliesToType = {
    Attribute: 0,
    Skill: 1,
    SavingThrow: 2,
    AC: 3,
    MovementSpeed: 4,
    HitDice: 5,
    Attack: 6,
    Damage: 7,
    Initiative: 8,
    Other: 9,
} as const;

export type ModifierAppliesToType = typeof ModifierAppliesToType[keyof typeof ModifierAppliesToType];

export const MODIFIER_APPLIES_TO_TYPES: BaseMap<CoreComponent> = {
    [ModifierAppliesToType.Attribute]: { id: ModifierAppliesToType.Attribute, name: 'Attribute' },
    [ModifierAppliesToType.Skill]: { id: ModifierAppliesToType.Skill, name: 'Skill' },
    [ModifierAppliesToType.SavingThrow]: { id: ModifierAppliesToType.SavingThrow, name: 'Saving Throw' },
    [ModifierAppliesToType.AC]: { id: ModifierAppliesToType.AC, name: 'Armor Class' },
    [ModifierAppliesToType.MovementSpeed]: { id: ModifierAppliesToType.MovementSpeed, name: 'Movement Speed' },
    [ModifierAppliesToType.HitDice]: { id: ModifierAppliesToType.HitDice, name: 'Hit Dice' },
    [ModifierAppliesToType.Attack]: { id: ModifierAppliesToType.Attack, name: 'Attack' },
    [ModifierAppliesToType.Damage]: { id: ModifierAppliesToType.Damage, name: 'Damage' },
    [ModifierAppliesToType.Initiative]: { id: ModifierAppliesToType.Initiative, name: 'Initiative' },
    [ModifierAppliesToType.Other]: { id: ModifierAppliesToType.Other, name: 'Other' },
}

export const MODIFIER_APPLIES_TO_LIST = Object.values(MODIFIER_APPLIES_TO_TYPES);
export const MODIFIER_APPLIES_TO_SELECT_LIST = NameSelectOptionList(MODIFIER_APPLIES_TO_LIST);

export const FeatureBonusType = {
    // Always stacking types
    Dodge: 0,
    Circumstance: 1,

    // Non-stacking types (highest applies)
    Enhancement: 2,
    Morale: 3,
    Competence: 4,
    Alchemical: 5,
    Armor: 6,
    Deflection: 7,
    Insight: 8,
    Luck: 9,
    NaturalArmor: 10,
    Profane: 11,
    Racial: 12,
    Resistance: 13,
    Sacred: 14,
    Shield: 15,
    Size: 16,

    // Special case
    Other: 17,
} as const;

export type FeatureBonusType = typeof FeatureBonusType[keyof typeof FeatureBonusType];

export const FEATURE_BONUS_TYPES: BaseMap<CoreComponent> = {
    // Always stacking
    [FeatureBonusType.Dodge]: { id: FeatureBonusType.Dodge, name: 'Dodge' },
    [FeatureBonusType.Circumstance]: { id: FeatureBonusType.Circumstance, name: 'Circumstance' },

    // Non-stacking (highest applies)
    [FeatureBonusType.Enhancement]: { id: FeatureBonusType.Enhancement, name: 'Enhancement' },
    [FeatureBonusType.Morale]: { id: FeatureBonusType.Morale, name: 'Morale' },
    [FeatureBonusType.Competence]: { id: FeatureBonusType.Competence, name: 'Competence' },
    [FeatureBonusType.Alchemical]: { id: FeatureBonusType.Alchemical, name: 'Alchemical' },
    [FeatureBonusType.Armor]: { id: FeatureBonusType.Armor, name: 'Armor' },
    [FeatureBonusType.Deflection]: { id: FeatureBonusType.Deflection, name: 'Deflection' },
    [FeatureBonusType.Insight]: { id: FeatureBonusType.Insight, name: 'Insight' },
    [FeatureBonusType.Luck]: { id: FeatureBonusType.Luck, name: 'Luck' },
    [FeatureBonusType.NaturalArmor]: { id: FeatureBonusType.NaturalArmor, name: 'Natural Armor' },
    [FeatureBonusType.Profane]: { id: FeatureBonusType.Profane, name: 'Profane' },
    [FeatureBonusType.Racial]: { id: FeatureBonusType.Racial, name: 'Racial' },
    [FeatureBonusType.Resistance]: { id: FeatureBonusType.Resistance, name: 'Resistance' },
    [FeatureBonusType.Sacred]: { id: FeatureBonusType.Sacred, name: 'Sacred' },
    [FeatureBonusType.Shield]: { id: FeatureBonusType.Shield, name: 'Shield' },
    [FeatureBonusType.Size]: { id: FeatureBonusType.Size, name: 'Size' },

    // Special case
    [FeatureBonusType.Other]: { id: FeatureBonusType.Other, name: 'Other' },
}

export const FEATURE_BONUS_LIST = Object.values(FEATURE_BONUS_TYPES);
export const FEATURE_BONUS_SELECT_LIST = NameSelectOptionList(FEATURE_BONUS_LIST);

export const FeatureSpecialEffectType = {
    Proficiency: 0,
    FavoredEnemy: 1,
    ConditionalUpgrade: 2,
    TurnUndead: 3,
    WildShapeForm: 4,
    WildShapeSize: 5,
    Other: 6,
} as const;

export type FeatureSpecialEffectType = typeof FeatureSpecialEffectType[keyof typeof FeatureSpecialEffectType];

export const FEATURE_SPECIAL_EFFECT_TYPES: BaseMap<CoreComponent> = {
    [FeatureSpecialEffectType.Proficiency]: { id: FeatureSpecialEffectType.Proficiency, name: 'Proficiency' },
    [FeatureSpecialEffectType.FavoredEnemy]: { id: FeatureSpecialEffectType.FavoredEnemy, name: 'Favored Enemy' },
    [FeatureSpecialEffectType.ConditionalUpgrade]: { id: FeatureSpecialEffectType.ConditionalUpgrade, name: 'Conditional Upgrade' },
    [FeatureSpecialEffectType.TurnUndead]: { id: FeatureSpecialEffectType.TurnUndead, name: 'Turn Undead' },
    [FeatureSpecialEffectType.WildShapeForm]: { id: FeatureSpecialEffectType.WildShapeForm, name: 'Wild Shape Form' },
    [FeatureSpecialEffectType.WildShapeSize]: { id: FeatureSpecialEffectType.WildShapeSize, name: 'Wild Shape Size' },
    [FeatureSpecialEffectType.Other]: { id: FeatureSpecialEffectType.Other, name: 'Other' },
}

export const FEATURE_SPECIAL_EFFECT_LIST = Object.values(FEATURE_SPECIAL_EFFECT_TYPES);
export const FEATURE_SPECIAL_EFFECT_SELECT_LIST = NameSelectOptionList(FEATURE_SPECIAL_EFFECT_LIST);

export const FeatureAppliesToType = {
    Skill: 0,
    Item: 1,
    Language: 2,
    Feat: 3,
    Other: 4,
} as const;

export type FeatureAppliesToType = typeof FeatureAppliesToType[keyof typeof FeatureAppliesToType];

export const FEATURE_APPLIES_TO_TYPES: BaseMap<CoreComponent> = {
    [FeatureAppliesToType.Skill]: { id: FeatureAppliesToType.Skill, name: 'Skill' },
    [FeatureAppliesToType.Item]: { id: FeatureAppliesToType.Item, name: 'Item' },
    [FeatureAppliesToType.Language]: { id: FeatureAppliesToType.Language, name: 'Language' },
    [FeatureAppliesToType.Feat]: { id: FeatureAppliesToType.Feat, name: 'Feat' },
    [FeatureAppliesToType.Other]: { id: FeatureAppliesToType.Other, name: 'Other' },
}

export const FEATURE_APPLIES_TO_LIST = Object.values(FEATURE_APPLIES_TO_TYPES);
export const FEATURE_APPLIES_TO_SELECT_LIST = NameSelectOptionList(FEATURE_APPLIES_TO_LIST);

export const FeatureFeatChoiceFilter = {
    Any: 0,
    FighterBonus: 1,
    MetamagicOrItemCreation: 2,
}

export type FeatureFeatChoiceFilter = typeof FeatureFeatChoiceFilter[keyof typeof FeatureFeatChoiceFilter];

export const FEATURE_FEAT_CHOICE_FILTER_TYPES: BaseMap<CoreComponent> = {
    [FeatureFeatChoiceFilter.Any]: { id: FeatureFeatChoiceFilter.Any, name: 'Any' },
    [FeatureFeatChoiceFilter.FighterBonus]: { id: FeatureFeatChoiceFilter.FighterBonus, name: 'Fighter Bonus' },
    [FeatureFeatChoiceFilter.MetamagicOrItemCreation]: { id: FeatureFeatChoiceFilter.MetamagicOrItemCreation, name: 'Metamagic or Item Creation' },
}

export const FEATURE_FEAT_CHOICE_FILTER_LIST = Object.values(FEATURE_FEAT_CHOICE_FILTER_TYPES);
export const FEATURE_FEAT_CHOICE_FILTER_SELECT_LIST = NameSelectOptionList(FEATURE_FEAT_CHOICE_FILTER_LIST);

export const FeaturePrerequisiteType = {
    SkillRanks: 0,
    Other: 1,
} as const;

export type FeaturePrerequisiteType = typeof FeaturePrerequisiteType[keyof typeof FeaturePrerequisiteType];

export const FEATURE_PRE_REQ_TYPES: BaseMap<CoreComponent> = {
    [FeaturePrerequisiteType.SkillRanks]: { id: FeaturePrerequisiteType.SkillRanks, name: 'Skill Ranks' },
    [FeaturePrerequisiteType.Other]: { id: FeaturePrerequisiteType.Other, name: 'Other' },
}

export const FEATURE_PRE_REQ_LIST = Object.values(FEATURE_PRE_REQ_TYPES);
export const FEATURE_PRE_REQ_SELECT_LIST = NameSelectOptionList(FEATURE_PRE_REQ_LIST);

export const FeatureModifierConditionType = {
    trigger: 0,
    attack_type: 1,
    other: 2,
} as const;

export type FeatureModifierConditionType = typeof FeatureModifierConditionType[keyof typeof FeatureModifierConditionType];

export const FEATURE_MODIFIER_CONDITION_TYPES: BaseMap<CoreComponent> = {
    [FeatureModifierConditionType.trigger]: { id: FeatureModifierConditionType.trigger, name: 'Trigger' },
    [FeatureModifierConditionType.attack_type]: { id: FeatureModifierConditionType.attack_type, name: 'Attack Type' },
}

export const FEATURE_MODIFIER_CONDITION_LIST = Object.values(FEATURE_MODIFIER_CONDITION_TYPES);
export const FEATURE_MODIFIER_CONDITION_SELECT_LIST = NameSelectOptionList(FEATURE_MODIFIER_CONDITION_LIST);

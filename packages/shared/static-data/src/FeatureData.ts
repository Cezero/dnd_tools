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

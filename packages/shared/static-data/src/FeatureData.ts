import { AppliesToType, BaseMap, CoreComponent, ConditionType } from "./types";
import { NameSelectOptionList } from "./Util";

export const FeatureType = {
    Modifier: 0,
    Choice: 2,
} as const;

export type FeatureType = typeof FeatureType[keyof typeof FeatureType];

export const FEATURE_TYPES: BaseMap<CoreComponent> = {
    [FeatureType.Modifier]: { id: FeatureType.Modifier, name: 'modifiers' },
    [FeatureType.Choice]: { id: FeatureType.Choice, name: 'choices' },
}

export const SpecialFeatureId = {
    ClassSkill: 1,
    ClassProficiency: 2,
    AutomaticLanguage: 3,
    BonusLanguage: 4,
    AbilityAdjustment: 5,
} as const;

export type SpecialFeatureId = typeof SpecialFeatureId[keyof typeof SpecialFeatureId];

export const FeatureSourceType = {
    Race: 0,
    Class: 1,
    Template: 2,
} as const;

export type FeatureSourceType = typeof FeatureSourceType[keyof typeof FeatureSourceType];

export const ModifierType = {
    Bonus: 0,        // Numeric bonuses/penalties (STR+4, AC+2, etc.)
    Quantity: 1,     // Counts, amounts, resources (3d6 damage, 2 targets, 30ft speed)
    Replacement: 2,  // Replace existing values (unarmed damage, base speed)
    Other: 3,        // Special cases, complex effects
    Proficiency: 4,  // Proficiency bonus
} as const;

export type ModifierType = typeof ModifierType[keyof typeof ModifierType];

export const MODIFIER_TYPES: BaseMap<CoreComponent> = {
    [ModifierType.Bonus]: { id: ModifierType.Bonus, name: 'Bonus' },
    [ModifierType.Quantity]: { id: ModifierType.Quantity, name: 'Quantity' },
    [ModifierType.Replacement]: { id: ModifierType.Replacement, name: 'Replacement' },
    [ModifierType.Other]: { id: ModifierType.Other, name: 'Other' },
    [ModifierType.Proficiency]: { id: ModifierType.Proficiency, name: 'Proficiency' },
}

export const MODIFIER_LIST = Object.values(MODIFIER_TYPES);
export const MODIFIER_SELECT_LIST = NameSelectOptionList(MODIFIER_LIST);

export const ModifierAppliesToType = {
    // Bonus-compatible types
    Ability: 0,        // STR, DEX, CON, etc.
    Skill: 1,           // Climb, Jump, etc.
    SavingThrow: 2,     // Fort, Ref, Will
    AC: 3,              // Armor Class
    Attack: 4,          // Attack rolls
    Damage: 5,          // Damage rolls
    DamageReduction: 6, // DR
    Initiative: 7,      // Initiative

    // Quantity-compatible types
    MovementSpeed: 8,   // Speed in feet
    HitDice: 9,         // Hit dice (temporary HP, etc.)
    Uses: 10,           // Uses per day/week
    Targets: 11,        // Number of targets
    Distance: 12,       // Range, reach, etc.
    ExtraAttacks: 17,   // Extra attacks per round/action
    Healing: 18,        // Healing hit points per day
    SpellResistance: 19, // Spell Resistance (SR)
    UnarmedDamage: 20,  // Unarmed strike damage dice
    Feat: 21,           // Direct feat grants (e.g., Ranger Track, Endurance)

    // New types for complex abilities
    SizeCategory: 22,
    CreatureType: 23,
    DamageType: 24,

    // Other
    Other: 13,          // Special cases
    BonusLanguage: 14,  // Languages that require INT modifier
    AutomaticLanguage: 15, // Languages granted automatically
} as const;

export type ModifierAppliesToType = typeof ModifierAppliesToType[keyof typeof ModifierAppliesToType];

export const MODIFIER_APPLIES_TO_TYPES: BaseMap<AppliesToType> = {
    // Bonus-compatible types
    [ModifierAppliesToType.Ability]: { id: ModifierAppliesToType.Ability, name: 'Ability', displayName: null },
    [ModifierAppliesToType.Skill]: { id: ModifierAppliesToType.Skill, name: 'Skill', displayName: '' },
    [ModifierAppliesToType.SavingThrow]: { id: ModifierAppliesToType.SavingThrow, name: 'Saving Throw', displayName: '' },
    [ModifierAppliesToType.AC]: { id: ModifierAppliesToType.AC, name: 'Armor Class', displayName: 'AC' },
    [ModifierAppliesToType.Attack]: { id: ModifierAppliesToType.Attack, name: 'Attack', displayName: 'Atk' },
    [ModifierAppliesToType.Damage]: { id: ModifierAppliesToType.Damage, name: 'Damage', displayName: 'Dmg' },
    [ModifierAppliesToType.DamageReduction]: { id: ModifierAppliesToType.DamageReduction, name: 'Damage Reduction', displayName: 'DR' },
    [ModifierAppliesToType.Initiative]: { id: ModifierAppliesToType.Initiative, name: 'Initiative', displayName: 'Init' },

    // Quantity-compatible types
    [ModifierAppliesToType.MovementSpeed]: { id: ModifierAppliesToType.MovementSpeed, name: 'Movement Speed', displayName: 'Move Speed' },
    [ModifierAppliesToType.HitDice]: { id: ModifierAppliesToType.HitDice, name: 'Hit Dice', displayName: 'HD' },
    [ModifierAppliesToType.Uses]: { id: ModifierAppliesToType.Uses, name: 'Uses', displayName: 'Uses' },
    [ModifierAppliesToType.Targets]: { id: ModifierAppliesToType.Targets, name: 'Targets', displayName: '' },
    [ModifierAppliesToType.Distance]: { id: ModifierAppliesToType.Distance, name: 'Distance', displayName: 'Distance' },
    [ModifierAppliesToType.ExtraAttacks]: { id: ModifierAppliesToType.ExtraAttacks, name: 'Extra Attacks', displayName: 'Extra Attacks' },
    [ModifierAppliesToType.Healing]: { id: ModifierAppliesToType.Healing, name: 'Healing', displayName: 'Healing' },
    [ModifierAppliesToType.SpellResistance]: { id: ModifierAppliesToType.SpellResistance, name: 'Spell Resistance', displayName: 'SR' },
    [ModifierAppliesToType.UnarmedDamage]: { id: ModifierAppliesToType.UnarmedDamage, name: 'Unarmed Damage', displayName: 'Unarmed Dmg' },
    [ModifierAppliesToType.Feat]: { id: ModifierAppliesToType.Feat, name: 'Feat', displayName: 'Feat' },

    // New types for complex abilities
    [ModifierAppliesToType.SizeCategory]: { id: ModifierAppliesToType.SizeCategory, name: 'Size Category', displayName: 'Size Category' },
    [ModifierAppliesToType.CreatureType]: { id: ModifierAppliesToType.CreatureType, name: 'Creature Type', displayName: 'Creature Type' },
    [ModifierAppliesToType.DamageType]: { id: ModifierAppliesToType.DamageType, name: 'Damage Type', displayName: 'Damage Type' },

    // Other
    [ModifierAppliesToType.Other]: { id: ModifierAppliesToType.Other, name: 'Other', displayName: 'Other' },
    [ModifierAppliesToType.BonusLanguage]: { id: ModifierAppliesToType.BonusLanguage, name: 'Bonus Language', displayName: 'Bonus Language' },
    [ModifierAppliesToType.AutomaticLanguage]: { id: ModifierAppliesToType.AutomaticLanguage, name: 'Automatic Language', displayName: 'Automatic Language' },
}

export const MODIFIER_APPLIES_TO_LIST = Object.values(MODIFIER_APPLIES_TO_TYPES);
export const MODIFIER_APPLIES_TO_SELECT_LIST = NameSelectOptionList(MODIFIER_APPLIES_TO_LIST);

// Type compatibility matrix - defines which ModifierAppliesToType values are valid for each ModifierType
export const MODIFIER_TYPE_COMPATIBILITY = {
    [ModifierType.Bonus]: [
        ModifierAppliesToType.Ability,
        ModifierAppliesToType.Skill,
        ModifierAppliesToType.SavingThrow,
        ModifierAppliesToType.AC,
        ModifierAppliesToType.Attack,
        ModifierAppliesToType.Damage,
        ModifierAppliesToType.DamageReduction,
        ModifierAppliesToType.Initiative,
    ],
    [ModifierType.Quantity]: [
        ModifierAppliesToType.MovementSpeed,
        ModifierAppliesToType.HitDice,
        ModifierAppliesToType.Uses,
        ModifierAppliesToType.Targets,
        ModifierAppliesToType.Distance,
        ModifierAppliesToType.ExtraAttacks, // Extra attacks per round/action
        ModifierAppliesToType.Damage, // For dice quantities
        ModifierAppliesToType.Healing, // Healing per day
        ModifierAppliesToType.SpellResistance, // Spell Resistance (SR)
    ],
    [ModifierType.Replacement]: [
        ModifierAppliesToType.Damage,
        ModifierAppliesToType.UnarmedDamage,
        ModifierAppliesToType.MovementSpeed,
        ModifierAppliesToType.Ability, // For ability score replacement
    ],
    [ModifierType.Other]: [
        ModifierAppliesToType.Other,
        ModifierAppliesToType.BonusLanguage, // Bonus languages are Other type modifiers
        ModifierAppliesToType.AutomaticLanguage, // Automatic languages are Other type modifiers

        ModifierAppliesToType.Feat, // Direct feat grants are Other type modifiers

        // New complex ability types
        ModifierAppliesToType.SizeCategory,
        ModifierAppliesToType.CreatureType,
        ModifierAppliesToType.DamageType,
    ],
    [ModifierType.Proficiency]: [
        ModifierAppliesToType.Feat, // Feats used as proficiencies
    ],
} as const;

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

export const FeatureChoiceType = {
    Feat: 0,
    Feature: 1,
    CreatureType: 2,
} as const;

export type FeatureChoiceType = typeof FeatureChoiceType[keyof typeof FeatureChoiceType];

export const FEATURE_CHOICE_TYPES: BaseMap<CoreComponent> = {
    [FeatureChoiceType.Feat]: { id: FeatureChoiceType.Feat, name: 'Feat' },
    [FeatureChoiceType.Feature]: { id: FeatureChoiceType.Feature, name: 'Feature' },
    [FeatureChoiceType.CreatureType]: { id: FeatureChoiceType.CreatureType, name: 'Creature Type' },
}

export const FEATURE_CHOICE_LIST = Object.values(FEATURE_CHOICE_TYPES);
export const FEATURE_CHOICE_SELECT_LIST = NameSelectOptionList(FEATURE_CHOICE_LIST);

export const FeatureChoiceBehavior = {
    Single: 0,
    Multiple: 1,
    Allocation: 2,
} as const;

export type FeatureChoiceBehavior = typeof FeatureChoiceBehavior[keyof typeof FeatureChoiceBehavior];

export const FEATURE_CHOICE_BEHAVIOR_TYPES: BaseMap<CoreComponent> = {
    [FeatureChoiceBehavior.Single]: { id: FeatureChoiceBehavior.Single, name: 'Single' },
    [FeatureChoiceBehavior.Multiple]: { id: FeatureChoiceBehavior.Multiple, name: 'Multiple' },
    [FeatureChoiceBehavior.Allocation]: { id: FeatureChoiceBehavior.Allocation, name: 'Allocation' },
}

export const FEATURE_CHOICE_BEHAVIOR_LIST = Object.values(FEATURE_CHOICE_BEHAVIOR_TYPES);
export const FEATURE_CHOICE_BEHAVIOR_SELECT_LIST = NameSelectOptionList(FEATURE_CHOICE_BEHAVIOR_LIST);

export const FeaturePrerequisiteType = {
    SkillRanks: 0,
    AbilityScore: 1,
    CharacterLevel: 2,
    ClassLevel: 3,
    BaseAttackBonus: 4,
    Other: 5,
} as const;

export type FeaturePrerequisiteType = typeof FeaturePrerequisiteType[keyof typeof FeaturePrerequisiteType];

export const FEATURE_PRE_REQ_TYPES: BaseMap<CoreComponent> = {
    [FeaturePrerequisiteType.SkillRanks]: { id: FeaturePrerequisiteType.SkillRanks, name: 'Skill Ranks' },
    [FeaturePrerequisiteType.AbilityScore]: { id: FeaturePrerequisiteType.AbilityScore, name: 'Ability Score' },
    [FeaturePrerequisiteType.CharacterLevel]: { id: FeaturePrerequisiteType.CharacterLevel, name: 'Character Level' },
    [FeaturePrerequisiteType.ClassLevel]: { id: FeaturePrerequisiteType.ClassLevel, name: 'Class Level' },
    [FeaturePrerequisiteType.BaseAttackBonus]: { id: FeaturePrerequisiteType.BaseAttackBonus, name: 'Base Attack Bonus' },
    [FeaturePrerequisiteType.Other]: { id: FeaturePrerequisiteType.Other, name: 'Other' },
}

export const FEATURE_PRE_REQ_LIST = Object.values(FEATURE_PRE_REQ_TYPES);
export const FEATURE_PRE_REQ_SELECT_LIST = NameSelectOptionList(FEATURE_PRE_REQ_LIST);

export const FeatureModifierConditionType = {
    trigger: 0,
    attack_type: 1,
    character_size: 2,
    target: 3,
    feature: 4,
    spell_school: 5,
    creature_type: 6,
    source: 7,
} as const;

export type FeatureModifierConditionType = typeof FeatureModifierConditionType[keyof typeof FeatureModifierConditionType];

export const FEATURE_MODIFIER_CONDITION_TYPES: BaseMap<ConditionType> = {
    [FeatureModifierConditionType.trigger]: { id: FeatureModifierConditionType.trigger, name: 'Trigger', displayName: 'Trigger' },
    [FeatureModifierConditionType.attack_type]: { id: FeatureModifierConditionType.attack_type, name: 'Attack Type', displayName: '' },
    [FeatureModifierConditionType.character_size]: { id: FeatureModifierConditionType.character_size, name: 'Character Size', displayName: '' },
    [FeatureModifierConditionType.target]: { id: FeatureModifierConditionType.target, name: 'Target', displayName: 'Target' },
    [FeatureModifierConditionType.feature]: { id: FeatureModifierConditionType.feature, name: 'Feature', displayName: 'Feature' },
    [FeatureModifierConditionType.spell_school]: { id: FeatureModifierConditionType.spell_school, name: 'Spell School', displayName: '' },
    [FeatureModifierConditionType.creature_type]: { id: FeatureModifierConditionType.creature_type, name: 'Creature Type', displayName: '' },
    [FeatureModifierConditionType.source]: { id: FeatureModifierConditionType.source, name: 'Source', displayName: 'Source' },
}

export const FEATURE_MODIFIER_CONDITION_LIST = Object.values(FEATURE_MODIFIER_CONDITION_TYPES);
export const FEATURE_MODIFIER_CONDITION_SELECT_LIST = NameSelectOptionList(FEATURE_MODIFIER_CONDITION_LIST);

// Source values for FeatureModifierConditionType.source
export const SourceType = {
    traps: 0,
    fear: 1,
} as const;

export type SourceType = typeof SourceType[keyof typeof SourceType];

export const SOURCE_TYPES: BaseMap<CoreComponent> = {
    [SourceType.traps]: { id: SourceType.traps, name: 'Traps' },
    [SourceType.fear]: { id: SourceType.fear, name: 'Fear' },
};

export const SOURCE_TYPE_LIST = Object.values(SOURCE_TYPES);
export const SOURCE_TYPE_SELECT_LIST = NameSelectOptionList(SOURCE_TYPE_LIST);

// Target values for FeatureModifierConditionType.target
export const TargetType = {
    nearby_allies: 0,          // Affects allies within range (e.g., Aura of Courage)
    nearby_enemies: 1,         // Affects enemies within range
    touched_creature: 2,       // Affects a creature you touch
    line_of_sight: 3,          // Affects creatures you can see
} as const;

export type TargetType = typeof TargetType[keyof typeof TargetType];

export const TARGET_TYPES: BaseMap<CoreComponent> = {
    [TargetType.nearby_allies]: { id: TargetType.nearby_allies, name: 'Nearby Allies' },
    [TargetType.nearby_enemies]: { id: TargetType.nearby_enemies, name: 'Nearby Enemies' },
    [TargetType.touched_creature]: { id: TargetType.touched_creature, name: 'Touched Creature' },
    [TargetType.line_of_sight]: { id: TargetType.line_of_sight, name: 'Line of Sight' },
};

export const TARGET_TYPE_LIST = Object.values(TARGET_TYPES);
export const TARGET_TYPE_SELECT_LIST = NameSelectOptionList(TARGET_TYPE_LIST);

// Attack Type Enum for conditions
export const ATTACK_TYPE_ENUM = {
    MELEE: 1,
    RANGED: 2,
    SNEAK_ATTACK: 3,
    CHARGE: 4,
    FLURRY_OF_BLOWS: 5,
    POWER_ATTACK: 6,
    TWO_WEAPON_FIGHTING: 7,
    GRAPPLE: 8,
    TRIP: 9,
    DISARM: 10,
    SUNDER: 11,
    BULL_RUSH: 12,
    OVERRUN: 13,
    AID_ANOTHER: 14,
    FEINT: 15,
    UNARMED_ATTACK: 16,
} as const;

export type AttackType = typeof ATTACK_TYPE_ENUM[keyof typeof ATTACK_TYPE_ENUM];

export const ATTACK_TYPES: BaseMap<CoreComponent> = {
    [ATTACK_TYPE_ENUM.MELEE]: { id: ATTACK_TYPE_ENUM.MELEE, name: 'Melee' },
    [ATTACK_TYPE_ENUM.RANGED]: { id: ATTACK_TYPE_ENUM.RANGED, name: 'Ranged' },
    [ATTACK_TYPE_ENUM.SNEAK_ATTACK]: { id: ATTACK_TYPE_ENUM.SNEAK_ATTACK, name: 'Sneak Attack' },
    [ATTACK_TYPE_ENUM.CHARGE]: { id: ATTACK_TYPE_ENUM.CHARGE, name: 'Charge' },
    [ATTACK_TYPE_ENUM.FLURRY_OF_BLOWS]: { id: ATTACK_TYPE_ENUM.FLURRY_OF_BLOWS, name: 'Flurry of Blows' },
    [ATTACK_TYPE_ENUM.POWER_ATTACK]: { id: ATTACK_TYPE_ENUM.POWER_ATTACK, name: 'Power Attack' },
    [ATTACK_TYPE_ENUM.TWO_WEAPON_FIGHTING]: { id: ATTACK_TYPE_ENUM.TWO_WEAPON_FIGHTING, name: 'Two-Weapon Fighting' },
    [ATTACK_TYPE_ENUM.GRAPPLE]: { id: ATTACK_TYPE_ENUM.GRAPPLE, name: 'Grapple' },
    [ATTACK_TYPE_ENUM.TRIP]: { id: ATTACK_TYPE_ENUM.TRIP, name: 'Trip' },
    [ATTACK_TYPE_ENUM.DISARM]: { id: ATTACK_TYPE_ENUM.DISARM, name: 'Disarm' },
    [ATTACK_TYPE_ENUM.SUNDER]: { id: ATTACK_TYPE_ENUM.SUNDER, name: 'Sunder' },
    [ATTACK_TYPE_ENUM.BULL_RUSH]: { id: ATTACK_TYPE_ENUM.BULL_RUSH, name: 'Bull Rush' },
    [ATTACK_TYPE_ENUM.OVERRUN]: { id: ATTACK_TYPE_ENUM.OVERRUN, name: 'Overrun' },
    [ATTACK_TYPE_ENUM.AID_ANOTHER]: { id: ATTACK_TYPE_ENUM.AID_ANOTHER, name: 'Aid Another' },
    [ATTACK_TYPE_ENUM.FEINT]: { id: ATTACK_TYPE_ENUM.FEINT, name: 'Feint' },
    [ATTACK_TYPE_ENUM.UNARMED_ATTACK]: { id: ATTACK_TYPE_ENUM.UNARMED_ATTACK, name: 'Unarmed Attack' },
};

export const ATTACK_TYPE_LIST = Object.values(ATTACK_TYPES);
export const ATTACK_TYPE_SELECT_LIST = NameSelectOptionList(ATTACK_TYPE_LIST);

// Creature Types for Favored Enemy and similar features
export const CreatureType = {
    Aberration: 1,
    Animal: 2,
    Construct: 3,
    Dragon: 4,
    Elemental: 5,
    Fey: 6,
    Giant: 7,
    Humanoid_aquatic: 8,
    Humanoid_dwarf: 9,
    Humanoid_elf: 10,
    Humanoid_goblinoid: 11,
    Humanoid_gnoll: 12,
    Humanoid_gnome: 13,
    Humanoid_halfling: 14,
    Humanoid_human: 15,
    Humanoid_orc: 16,
    Humanoid_reptilian: 17,
    MagicalBeast: 18,
    MonstrousHumanoid: 19,
    Ooze: 20,
    Outsider_air: 21,
    Outsider_chaotic: 22,
    Outsider_earth: 23,
    Outsider_evil: 24,
    Outsider_fire: 25,
    Outsider_good: 26,
    Outsider_lawful: 27,
    Outsider_native: 28,
    Outsider_water: 29,
    Plant: 30,
    Undead: 31,
    Vermin: 32,
} as const;

export type CreatureType = typeof CreatureType[keyof typeof CreatureType];

export const CREATURE_TYPES: BaseMap<CoreComponent> = {
    [CreatureType.Aberration]: { id: CreatureType.Aberration, name: 'Aberration' },
    [CreatureType.Animal]: { id: CreatureType.Animal, name: 'Animal' },
    [CreatureType.Construct]: { id: CreatureType.Construct, name: 'Construct' },
    [CreatureType.Dragon]: { id: CreatureType.Dragon, name: 'Dragon' },
    [CreatureType.Elemental]: { id: CreatureType.Elemental, name: 'Elemental' },
    [CreatureType.Fey]: { id: CreatureType.Fey, name: 'Fey' },
    [CreatureType.Giant]: { id: CreatureType.Giant, name: 'Giant' },
    [CreatureType.Humanoid_aquatic]: { id: CreatureType.Humanoid_aquatic, name: 'Humanoid (aquatic)' },
    [CreatureType.Humanoid_dwarf]: { id: CreatureType.Humanoid_dwarf, name: 'Humanoid (dwarf)' },
    [CreatureType.Humanoid_elf]: { id: CreatureType.Humanoid_elf, name: 'Humanoid (elf)' },
    [CreatureType.Humanoid_goblinoid]: { id: CreatureType.Humanoid_goblinoid, name: 'Humanoid (goblinoid)' },
    [CreatureType.Humanoid_gnoll]: { id: CreatureType.Humanoid_gnoll, name: 'Humanoid (gnoll)' },
    [CreatureType.Humanoid_gnome]: { id: CreatureType.Humanoid_gnome, name: 'Humanoid (gnome)' },
    [CreatureType.Humanoid_halfling]: { id: CreatureType.Humanoid_halfling, name: 'Humanoid (halfling)' },
    [CreatureType.Humanoid_human]: { id: CreatureType.Humanoid_human, name: 'Humanoid (human)' },
    [CreatureType.Humanoid_orc]: { id: CreatureType.Humanoid_orc, name: 'Humanoid (orc)' },
    [CreatureType.Humanoid_reptilian]: { id: CreatureType.Humanoid_reptilian, name: 'Humanoid (reptilian)' },
    [CreatureType.MagicalBeast]: { id: CreatureType.MagicalBeast, name: 'Magical Beast' },
    [CreatureType.MonstrousHumanoid]: { id: CreatureType.MonstrousHumanoid, name: 'Monstrous Humanoid' },
    [CreatureType.Ooze]: { id: CreatureType.Ooze, name: 'Ooze' },
    [CreatureType.Outsider_air]: { id: CreatureType.Outsider_air, name: 'Outsider (air)' },
    [CreatureType.Outsider_chaotic]: { id: CreatureType.Outsider_chaotic, name: 'Outsider (chaotic)' },
    [CreatureType.Outsider_earth]: { id: CreatureType.Outsider_earth, name: 'Outsider (earth)' },
    [CreatureType.Outsider_evil]: { id: CreatureType.Outsider_evil, name: 'Outsider (evil)' },
    [CreatureType.Outsider_fire]: { id: CreatureType.Outsider_fire, name: 'Outsider (fire)' },
    [CreatureType.Outsider_good]: { id: CreatureType.Outsider_good, name: 'Outsider (good)' },
    [CreatureType.Outsider_lawful]: { id: CreatureType.Outsider_lawful, name: 'Outsider (lawful)' },
    [CreatureType.Outsider_native]: { id: CreatureType.Outsider_native, name: 'Outsider (native)' },
    [CreatureType.Outsider_water]: { id: CreatureType.Outsider_water, name: 'Outsider (water)' },
    [CreatureType.Plant]: { id: CreatureType.Plant, name: 'Plant' },
    [CreatureType.Undead]: { id: CreatureType.Undead, name: 'Undead' },
    [CreatureType.Vermin]: { id: CreatureType.Vermin, name: 'Vermin' },
};

export const CREATURE_TYPE_LIST = Object.values(CREATURE_TYPES);
export const CREATURE_TYPE_SELECT_LIST = NameSelectOptionList(CREATURE_TYPE_LIST);

// Cumulative Value Type for enhanced formula parameters
export const CumulativeValueType = {
    Value: 0,        // Default: values represent numeric values (current behavior)
    AppliesToId: 1,  // Values represent appliesToId lookups
    // Future: Could add other types like "ItemId", "SpellId", etc.
} as const;

export type CumulativeValueType = typeof CumulativeValueType[keyof typeof CumulativeValueType];

export const CUMULATIVE_VALUE_TYPES: BaseMap<CoreComponent> = {
    [CumulativeValueType.Value]: { id: CumulativeValueType.Value, name: 'Value' },
    [CumulativeValueType.AppliesToId]: { id: CumulativeValueType.AppliesToId, name: 'Applies To ID' },
};

export const CUMULATIVE_VALUE_TYPE_LIST = Object.values(CUMULATIVE_VALUE_TYPES);
export const CUMULATIVE_VALUE_TYPE_SELECT_LIST = NameSelectOptionList(CUMULATIVE_VALUE_TYPE_LIST);

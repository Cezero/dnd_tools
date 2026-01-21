import { AppliesToType, BaseMap, CoreComponent } from "./types";

export const FeatureSourceType = {
    Race: 0,
    Class: 1,
    Template: 2,
    None: 3,
    Domain: 4, // Domain-granted features
    Feat: 5, // Feat-granted features
    Companion: 6, // Companion-granted features
    Edition: 7, // Edition-granted features (feat progression, ability score increases, etc.)
} as const;

export type FeatureSourceType = typeof FeatureSourceType[keyof typeof FeatureSourceType];

export const CompanionType = {
    Familiar: 1,
    AnimalCompanion: 2,
    AlternativeAnimalCompanion: 3,
    ImprovedFamiliar: 4,
} as const;

export type CompanionType = typeof CompanionType[keyof typeof CompanionType];

export const COMPANION_TYPES: BaseMap<CoreComponent> = {
    [CompanionType.Familiar]: { id: CompanionType.Familiar, name: 'Familiar' },
    [CompanionType.AnimalCompanion]: { id: CompanionType.AnimalCompanion, name: 'Animal Companion' },
    [CompanionType.AlternativeAnimalCompanion]: { id: CompanionType.AlternativeAnimalCompanion, name: 'Alternative Animal Companion' },
    [CompanionType.ImprovedFamiliar]: { id: CompanionType.ImprovedFamiliar, name: 'Improved Familiar' },
};

export const COMPANION_TYPE_LIST = Object.values(COMPANION_TYPES);
export const COMPANION_TYPE_MAP: Record<number, CoreComponent> = COMPANION_TYPES;

export const FEATURE_SOURCE_TYPES: BaseMap<CoreComponent> = {
    [FeatureSourceType.Race]: { id: FeatureSourceType.Race, name: 'Race' },
    [FeatureSourceType.Class]: { id: FeatureSourceType.Class, name: 'Class' },
    [FeatureSourceType.Template]: { id: FeatureSourceType.Template, name: 'Template' },
    [FeatureSourceType.None]: { id: FeatureSourceType.None, name: 'None' },
    [FeatureSourceType.Domain]: { id: FeatureSourceType.Domain, name: 'Domain' },
    [FeatureSourceType.Feat]: { id: FeatureSourceType.Feat, name: 'Feat' },
    [FeatureSourceType.Companion]: { id: FeatureSourceType.Companion, name: 'Companion' },
    [FeatureSourceType.Edition]: { id: FeatureSourceType.Edition, name: 'Edition' },
}

export const FEATURE_SOURCE_LIST = Object.values(FEATURE_SOURCE_TYPES);

export const EntityType = {
    Bonus: 0,        // Numeric bonuses/penalties (STR+4, AC+2, etc.)
    Quantity: 1,     // Counts, amounts, resources (3d6 damage, 2 targets, 30ft speed)
    Replacement: 2,  // Replace existing values (unarmed damage, base speed)
    Other: 3,        // Special cases, complex effects
    Base: 4,         // Base value entities (BAB, saves, hit dice, skill points, size, speed, etc.)
    Choice: 5,      // Choice-based features
    Allocation: 6,  // Allocation-based features
} as const;

export type EntityType = typeof EntityType[keyof typeof EntityType];

export const ENTITY_TYPES: BaseMap<CoreComponent> = {
    [EntityType.Bonus]: { id: EntityType.Bonus, name: 'Bonus' },
    [EntityType.Quantity]: { id: EntityType.Quantity, name: 'Quantity' },
    [EntityType.Replacement]: { id: EntityType.Replacement, name: 'Replacement' },
    [EntityType.Other]: { id: EntityType.Other, name: 'Other' },
    [EntityType.Base]: { id: EntityType.Base, name: 'Base' },
    [EntityType.Choice]: { id: EntityType.Choice, name: 'Choice' },
    [EntityType.Allocation]: { id: EntityType.Allocation, name: 'Allocation' },
}

export const ENTITY_LIST = Object.values(ENTITY_TYPES);

export const EntityAppliesToType = {
    // Bonus-compatible types
    Ability: 0,        // STR, DEX, CON, etc.
    Skill: 1,           // Climb, Jump, etc.
    SavingThrow: 2,     // Fort, Ref, Will
    AC: 3,              // Armor Class
    Attack: 4,          // Attack rolls
    Damage: 5,          // Damage rolls
    DamageReduction: 6, // DR
    Initiative: 7,      // Initiative
    SpellSvDC: 26,      // Spell Save DC
    Resistance: 28,     // Resistance
    CasterLevel: 30,    // Caster Level

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

    // New types for complex abilities
    SizeCategory: 22,
    CreatureType: 23,
    DamageType: 24,

    // Other
    Other: 13,          // Special cases
    BonusLanguage: 14,  // Languages that can be chosen
    AutomaticLanguage: 15, // Languages that are granted automatically
    WeaponFamiliarity: 16, // Weapon familiarity
    Feat: 21,           // Direct feat grants (e.g., Ranger Track, Endurance)
    Spell: 27,          // Direct spell grants (e.g., Domain spells, bonus spells)
    Feature: 25,        // Direct feature grants (e.g., Ranger Endurance)
    Domain: 29,         // NEW: Domain grants by other systems (loose coupling)
    SkillPoints: 31,    // Skill points (e.g., Human bonus skill points)
    AnimalCompanion: 32, // Animal companion choice
    HitPoints: 33,      // Hit points (e.g., Toughness feat, companion benefits)
    Familiar: 34,       // Familiar choice
    Prerequisite: 35,   // Prerequisites for features
    Proficiency: 36,     // Proficiency (weapon, armor, etc.)
    SpellbookSpell: 37,  // Spellbook spell selection (wizard, etc.)

    // NEW: Class/Race refactoring types
    SpellcastingProgression: 38, // Reference to SpellcastingProgression
    CastingAbility: 39,          // Casting ability (Intelligence, Wisdom, Charisma)
    CastingType: 40,             // Casting type (Prepared, Spontaneous)
    BaseAttackBonus: 41,         // Base Attack Bonus progression type
    Size: 42,                    // Creature size (for race)
    // 43 was Speed - removed, use MovementSpeed (8) instead
    FavoredClass: 44,            // Favored class (for race)
    LevelAdjustment: 45,         // Level adjustment (for race)
} as const;

export type EntityAppliesToType = typeof EntityAppliesToType[keyof typeof EntityAppliesToType];

export const ENTITY_APPLIES_TO_TYPES: BaseMap<AppliesToType> = {
    // Bonus-compatible types
    [EntityAppliesToType.Ability]: { id: EntityAppliesToType.Ability, name: 'Ability', displayName: null },
    [EntityAppliesToType.Skill]: { id: EntityAppliesToType.Skill, name: 'Skill', displayName: '' },
    [EntityAppliesToType.SavingThrow]: { id: EntityAppliesToType.SavingThrow, name: 'Saving Throw', displayName: '' },
    [EntityAppliesToType.AC]: { id: EntityAppliesToType.AC, name: 'Armor Class', displayName: 'AC' },
    [EntityAppliesToType.Attack]: { id: EntityAppliesToType.Attack, name: 'Attack', displayName: 'Atk' },
    [EntityAppliesToType.Damage]: { id: EntityAppliesToType.Damage, name: 'Damage', displayName: 'Dmg' },
    [EntityAppliesToType.DamageReduction]: { id: EntityAppliesToType.DamageReduction, name: 'Damage Reduction', displayName: 'DR' },
    [EntityAppliesToType.Initiative]: { id: EntityAppliesToType.Initiative, name: 'Initiative', displayName: 'Init' },
    [EntityAppliesToType.SpellSvDC]: { id: EntityAppliesToType.SpellSvDC, name: 'Spell Save DC', displayName: 'Spell Save DC' },
    [EntityAppliesToType.Resistance]: { id: EntityAppliesToType.Resistance, name: 'Resistance', displayName: 'Resistance' },
    [EntityAppliesToType.CasterLevel]: { id: EntityAppliesToType.CasterLevel, name: 'Caster Level', displayName: 'Caster Level' },
    [EntityAppliesToType.HitPoints]: { id: EntityAppliesToType.HitPoints, name: 'Hit Points', displayName: 'HP' },
    // Quantity-compatible types
    [EntityAppliesToType.MovementSpeed]: { id: EntityAppliesToType.MovementSpeed, name: 'Movement Speed', displayName: 'Move Speed' },
    [EntityAppliesToType.HitDice]: { id: EntityAppliesToType.HitDice, name: 'Hit Dice', displayName: 'HD' },
    [EntityAppliesToType.Uses]: { id: EntityAppliesToType.Uses, name: 'Uses', displayName: 'Uses' },
    [EntityAppliesToType.Targets]: { id: EntityAppliesToType.Targets, name: 'Targets', displayName: '' },
    [EntityAppliesToType.Distance]: { id: EntityAppliesToType.Distance, name: 'Distance', displayName: 'Distance' },
    [EntityAppliesToType.ExtraAttacks]: { id: EntityAppliesToType.ExtraAttacks, name: 'Extra Attacks', displayName: 'Extra Attacks' },
    [EntityAppliesToType.Healing]: { id: EntityAppliesToType.Healing, name: 'Healing', displayName: 'Healing' },
    [EntityAppliesToType.SpellResistance]: { id: EntityAppliesToType.SpellResistance, name: 'Spell Resistance', displayName: 'SR' },
    [EntityAppliesToType.UnarmedDamage]: { id: EntityAppliesToType.UnarmedDamage, name: 'Unarmed Damage', displayName: 'Unarmed Dmg' },

    // New types for complex abilities
    [EntityAppliesToType.SizeCategory]: { id: EntityAppliesToType.SizeCategory, name: 'Size Category', displayName: 'Size Category' },
    [EntityAppliesToType.CreatureType]: { id: EntityAppliesToType.CreatureType, name: 'Creature Type', displayName: 'Creature Type' },
    [EntityAppliesToType.DamageType]: { id: EntityAppliesToType.DamageType, name: 'Damage Type', displayName: 'Damage Type' },

    // Other
    [EntityAppliesToType.Other]: { id: EntityAppliesToType.Other, name: 'Other', displayName: 'Other' },
    [EntityAppliesToType.BonusLanguage]: { id: EntityAppliesToType.BonusLanguage, name: 'Bonus Language', displayName: 'Bonus Language' },
    [EntityAppliesToType.AutomaticLanguage]: { id: EntityAppliesToType.AutomaticLanguage, name: 'Automatic Language', displayName: 'Automatic Language' },
    [EntityAppliesToType.WeaponFamiliarity]: { id: EntityAppliesToType.WeaponFamiliarity, name: 'Weapon Familiarity', displayName: 'Weapon Familiarity' },
    [EntityAppliesToType.Feat]: { id: EntityAppliesToType.Feat, name: 'Feat', displayName: 'Feat' },
    [EntityAppliesToType.Spell]: { id: EntityAppliesToType.Spell, name: 'Spell', displayName: 'Spell' },
    [EntityAppliesToType.Feature]: { id: EntityAppliesToType.Feature, name: 'Feature', displayName: 'Feature' },
    [EntityAppliesToType.Domain]: { id: EntityAppliesToType.Domain, name: 'Domain', displayName: 'Domain' },
    [EntityAppliesToType.SkillPoints]: { id: EntityAppliesToType.SkillPoints, name: 'Skill Points', displayName: 'Skill Points' },
    [EntityAppliesToType.AnimalCompanion]: { id: EntityAppliesToType.AnimalCompanion, name: 'Animal Companion', displayName: 'Animal Companion' },
    [EntityAppliesToType.Familiar]: { id: EntityAppliesToType.Familiar, name: 'Familiar', displayName: 'Familiar' },
    [EntityAppliesToType.Prerequisite]: { id: EntityAppliesToType.Prerequisite, name: 'Prerequisite', displayName: 'Prerequisite' },
    [EntityAppliesToType.Proficiency]: { id: EntityAppliesToType.Proficiency, name: 'Proficiency', displayName: 'Proficiency' },
    [EntityAppliesToType.SpellbookSpell]: { id: EntityAppliesToType.SpellbookSpell, name: 'Spellbook Spell', displayName: 'Spellbook Spell' },

    // NEW: Class/Race refactoring types
    [EntityAppliesToType.SpellcastingProgression]: { id: EntityAppliesToType.SpellcastingProgression, name: 'Spellcasting Progression', displayName: 'Spellcasting' },
    [EntityAppliesToType.CastingAbility]: { id: EntityAppliesToType.CastingAbility, name: 'Casting Ability', displayName: 'Casting Ability' },
    [EntityAppliesToType.CastingType]: { id: EntityAppliesToType.CastingType, name: 'Casting Type', displayName: 'Casting Type' },
    [EntityAppliesToType.BaseAttackBonus]: { id: EntityAppliesToType.BaseAttackBonus, name: 'Base Attack Bonus', displayName: 'BAB' },
    [EntityAppliesToType.Size]: { id: EntityAppliesToType.Size, name: 'Size', displayName: 'Size' },
    // Speed (43) removed - use MovementSpeed (8) instead
    [EntityAppliesToType.FavoredClass]: { id: EntityAppliesToType.FavoredClass, name: 'Favored Class', displayName: 'Favored Class' },
    [EntityAppliesToType.LevelAdjustment]: { id: EntityAppliesToType.LevelAdjustment, name: 'Level Adjustment', displayName: 'LA' },
}

export const ENTITY_APPLIES_TO_LIST = Object.values(ENTITY_APPLIES_TO_TYPES);

// Type compatibility matrix - defines which ModifierAppliesToType values are valid for each ModifierType
export const ENTITY_TYPE_COMPATIBILITY = {
    [EntityType.Bonus]: [
        EntityAppliesToType.Ability,
        EntityAppliesToType.Skill,
        EntityAppliesToType.SavingThrow,
        EntityAppliesToType.AC,
        EntityAppliesToType.Attack,
        EntityAppliesToType.Damage,
        EntityAppliesToType.DamageReduction,
        EntityAppliesToType.Initiative,
        EntityAppliesToType.SpellSvDC,
        EntityAppliesToType.Resistance,
        EntityAppliesToType.CasterLevel,
        EntityAppliesToType.HitPoints,
    ],
    [EntityType.Quantity]: [
        EntityAppliesToType.MovementSpeed,
        EntityAppliesToType.HitDice,
        EntityAppliesToType.Uses,
        EntityAppliesToType.Targets,
        EntityAppliesToType.Distance,
        EntityAppliesToType.ExtraAttacks, // Extra attacks per round/action
        EntityAppliesToType.Damage, // For dice quantities
        EntityAppliesToType.Healing, // Healing per day
        EntityAppliesToType.SpellResistance, // Spell Resistance (SR)
    ],
    [EntityType.Replacement]: [
        EntityAppliesToType.Damage,
        EntityAppliesToType.UnarmedDamage,
        EntityAppliesToType.MovementSpeed,
        EntityAppliesToType.Ability, // For ability score replacement
    ],
    [EntityType.Base]: [
        // Base value entities for class and race mechanics
        EntityAppliesToType.BaseAttackBonus, // BAB progression
        EntityAppliesToType.SavingThrow, // Saving throw progression (for class mechanics)
        EntityAppliesToType.HitDice, // Hit dice (for class mechanics)
        EntityAppliesToType.SkillPoints, // Skill points (for class mechanics)
        EntityAppliesToType.Size, // Creature size
        EntityAppliesToType.MovementSpeed, // Base movement speed (for race mechanics)
        EntityAppliesToType.FavoredClass, // Favored class
        EntityAppliesToType.LevelAdjustment, // Level adjustment
        EntityAppliesToType.SpellcastingProgression, // Spellcasting progression reference
        EntityAppliesToType.CastingAbility, // Casting ability
        EntityAppliesToType.CastingType, // Casting type
        EntityAppliesToType.Proficiency, // Class proficiencies (Base type for class proficiency features)
        EntityAppliesToType.Skill, // Class skills (Base type for class skill features)
    ],
    [EntityType.Other]: [
        EntityAppliesToType.Other,
        EntityAppliesToType.BonusLanguage, // Bonus languages are Other type modifiers
        EntityAppliesToType.AutomaticLanguage, // Automatic languages are Other type modifiers
        EntityAppliesToType.WeaponFamiliarity, // Weapon familiarity are Other type modifiers
        EntityAppliesToType.Skill, // Skill grants are Other type modifiers
        EntityAppliesToType.Feat, // Direct feat grants are Other type modifiers
        EntityAppliesToType.Spell, // Direct spell grants are Other type modifiers
        EntityAppliesToType.Domain, // Direct domain grants are Other type modifiers
        EntityAppliesToType.Proficiency, // Proficiencies are Other type modifiers
        EntityAppliesToType.SpellbookSpell, // Spellbook spell grants (e.g., 0th level spells for wizards)

        // New complex ability types
        EntityAppliesToType.SizeCategory,
        EntityAppliesToType.CreatureType,
        EntityAppliesToType.DamageType,
    ],
    [EntityType.Choice]: [
        EntityAppliesToType.Feat, // Choice between feats
        EntityAppliesToType.Feature, // Choice between features
        EntityAppliesToType.CreatureType, // Choice between creature types (e.g., Ranger favored enemy)
        EntityAppliesToType.Domain, // Choice between domains
        EntityAppliesToType.SkillPoints, // Choice for skill points (e.g., Human bonus skill points)
        EntityAppliesToType.AnimalCompanion, // Choice between animal companions
        EntityAppliesToType.Familiar, // Choice between familiars
        EntityAppliesToType.SpellbookSpell, // Choice for spellbook spells (wizard, etc.)
        EntityAppliesToType.Ability, // Choice for ability score increases (e.g., every 4th level)
    ],
    [EntityType.Allocation]: [
        EntityAppliesToType.Feat, // Allocation to feats
        EntityAppliesToType.Feature, // Allocation to features
        EntityAppliesToType.CreatureType, // Allocation to creature types (e.g., Ranger favored enemy)
    ],
} as const;

// Entity types that should use grouped labelers when entities are grouped
export const USES_GROUPED_LABEL: EntityAppliesToType[] = [
    EntityAppliesToType.WeaponFamiliarity,
    EntityAppliesToType.Uses,
    EntityAppliesToType.Resistance,
    EntityAppliesToType.BonusLanguage,
    EntityAppliesToType.AutomaticLanguage,
] as const;

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

export const FeaturePrerequisiteType = {
    SkillRanks: 0,
    AbilityScore: 1,
    CharacterLevel: 2,
    ClassLevel: 3,
    BaseAttackBonus: 4,
    Other: 5,
    Feat: 6,
    Spellcasting: 7,
    ClassFeature: 8,
    Size: 9,
    Proficiency: 10,
} as const;

export type FeaturePrerequisiteType = typeof FeaturePrerequisiteType[keyof typeof FeaturePrerequisiteType];

export const FEATURE_PRE_REQ_TYPES: BaseMap<CoreComponent> = {
    [FeaturePrerequisiteType.SkillRanks]: { id: FeaturePrerequisiteType.SkillRanks, name: 'Skill Ranks' },
    [FeaturePrerequisiteType.AbilityScore]: { id: FeaturePrerequisiteType.AbilityScore, name: 'Ability Score' },
    [FeaturePrerequisiteType.CharacterLevel]: { id: FeaturePrerequisiteType.CharacterLevel, name: 'Character Level' },
    [FeaturePrerequisiteType.ClassLevel]: { id: FeaturePrerequisiteType.ClassLevel, name: 'Class Level' },
    [FeaturePrerequisiteType.BaseAttackBonus]: { id: FeaturePrerequisiteType.BaseAttackBonus, name: 'Base Attack Bonus' },
    [FeaturePrerequisiteType.Other]: { id: FeaturePrerequisiteType.Other, name: 'Other' },
    [FeaturePrerequisiteType.Feat]: { id: FeaturePrerequisiteType.Feat, name: 'Feat' },
    [FeaturePrerequisiteType.Spellcasting]: { id: FeaturePrerequisiteType.Spellcasting, name: 'Spellcasting' },
    [FeaturePrerequisiteType.ClassFeature]: { id: FeaturePrerequisiteType.ClassFeature, name: 'Class Feature' },
    [FeaturePrerequisiteType.Size]: { id: FeaturePrerequisiteType.Size, name: 'Size' },
    [FeaturePrerequisiteType.Proficiency]: { id: FeaturePrerequisiteType.Proficiency, name: 'Proficiency' },
}

export const FEATURE_PRE_REQ_LIST = Object.values(FEATURE_PRE_REQ_TYPES);

export const FeatureEntityConditionType = {
    material: 0,
    attack_type: 1,
    character_size: 2,
    target: 3,
    environment: 4,
    spell_school: 5,
    creature_type: 6,
    source: 7,
    lighting: 8,
    special: 9,
} as const;

export type FeatureEntityConditionType = typeof FeatureEntityConditionType[keyof typeof FeatureEntityConditionType];

export const FEATURE_ENTITY_CONDITION_TYPES: BaseMap<CoreComponent> = {
    [FeatureEntityConditionType.attack_type]: { id: FeatureEntityConditionType.attack_type, name: 'Attack Type' },
    [FeatureEntityConditionType.character_size]: { id: FeatureEntityConditionType.character_size, name: 'Character Size' },
    [FeatureEntityConditionType.target]: { id: FeatureEntityConditionType.target, name: 'Target' },
    [FeatureEntityConditionType.spell_school]: { id: FeatureEntityConditionType.spell_school, name: 'Spell School' },
    [FeatureEntityConditionType.creature_type]: { id: FeatureEntityConditionType.creature_type, name: 'Creature Type' },
    [FeatureEntityConditionType.source]: { id: FeatureEntityConditionType.source, name: 'Source' },
    [FeatureEntityConditionType.material]: { id: FeatureEntityConditionType.material, name: 'Material' },
    [FeatureEntityConditionType.environment]: { id: FeatureEntityConditionType.environment, name: 'Environment' },
    [FeatureEntityConditionType.lighting]: { id: FeatureEntityConditionType.lighting, name: 'Lighting' },
    [FeatureEntityConditionType.special]: { id: FeatureEntityConditionType.special, name: 'Special' },
}

export const FEATURE_ENTITY_CONDITION_LIST = Object.values(FEATURE_ENTITY_CONDITION_TYPES);

// AttackBonusAppliesTo enum for special attack bonus contexts
export const AttackBonusAppliesTo = {
    MainHand: 1,
    OffHand: 2,
    Thrown: 3,
} as const;

export type AttackBonusAppliesTo = typeof AttackBonusAppliesTo[keyof typeof AttackBonusAppliesTo];

export const ATTACK_BONUS_APPLIES_TO_TYPES: BaseMap<CoreComponent> = {
    [AttackBonusAppliesTo.MainHand]: { id: AttackBonusAppliesTo.MainHand, name: 'Main Hand' },
    [AttackBonusAppliesTo.OffHand]: { id: AttackBonusAppliesTo.OffHand, name: 'Off Hand' },
    [AttackBonusAppliesTo.Thrown]: { id: AttackBonusAppliesTo.Thrown, name: 'Thrown' },
};

export const ATTACK_BONUS_APPLIES_TO_LIST = Object.values(ATTACK_BONUS_APPLIES_TO_TYPES);

// Material values for FeatureEntityConditionType.material
export const MaterialType = {
    metal: 0,
    stone: 1,
} as const;

export type MaterialType = typeof MaterialType[keyof typeof MaterialType];

export const MATERIAL_TYPES: BaseMap<CoreComponent> = {
    [MaterialType.metal]: { id: MaterialType.metal, name: 'Metal' },
    [MaterialType.stone]: { id: MaterialType.stone, name: 'Stone' },
}

export const MATERIAL_TYPE_LIST = Object.values(MATERIAL_TYPES);

// Environment values for FeatureEntityConditionType.environment
export const EnvironmentType = {
    forest: 0,
    grassland: 1,
    mountains: 2,
    ocean: 3,
    plains: 4,
    swamp: 5,
    underground: 6,
    urban: 7,
} as const;

export type EnvironmentType = typeof EnvironmentType[keyof typeof EnvironmentType];

export const ENVIRONMENT_TYPES: BaseMap<CoreComponent> = {
    [EnvironmentType.forest]: { id: EnvironmentType.forest, name: 'Forest' },
    [EnvironmentType.grassland]: { id: EnvironmentType.grassland, name: 'Grassland' },
    [EnvironmentType.mountains]: { id: EnvironmentType.mountains, name: 'Mountains' },
    [EnvironmentType.ocean]: { id: EnvironmentType.ocean, name: 'Ocean' },
    [EnvironmentType.plains]: { id: EnvironmentType.plains, name: 'Plains' },
    [EnvironmentType.swamp]: { id: EnvironmentType.swamp, name: 'Swamp' },
    [EnvironmentType.underground]: { id: EnvironmentType.underground, name: 'Underground' },
    [EnvironmentType.urban]: { id: EnvironmentType.urban, name: 'Urban' },
}

export const ENVIRONMENT_TYPE_LIST = Object.values(ENVIRONMENT_TYPES);

// Source values for FeatureEntityConditionType.source
export const ConditionSourceType = {
    traps: 0,
    fear: 1,
    spells: 2,
    poison: 3,
} as const;

export type ConditionSourceType = typeof ConditionSourceType[keyof typeof ConditionSourceType];

export const CONDITION_SOURCE_TYPES: BaseMap<CoreComponent> = {
    [ConditionSourceType.traps]: { id: ConditionSourceType.traps, name: 'Traps' },
    [ConditionSourceType.fear]: { id: ConditionSourceType.fear, name: 'Fear' },
    [ConditionSourceType.spells]: { id: ConditionSourceType.spells, name: 'Spells' },
    [ConditionSourceType.poison]: { id: ConditionSourceType.poison, name: 'Poison' },
};

export const CONDITION_SOURCE_TYPE_LIST = Object.values(CONDITION_SOURCE_TYPES);

// Target values for FeatureEntityConditionType.target
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

// Special values for FeatureEntityConditionType.special
export const SpecialType = {
    casting_defensively: 0,
} as const;

export type SpecialType = typeof SpecialType[keyof typeof SpecialType];

export const SPECIAL_TYPES: BaseMap<CoreComponent> = {
    [SpecialType.casting_defensively]: { id: SpecialType.casting_defensively, name: 'Casting Defensively' },
};

export const SPECIAL_TYPE_LIST = Object.values(SPECIAL_TYPES);

// Attack Type Enum for FeatureEntityConditionType.attack_type
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
    THROWN: 17,
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
    [ATTACK_TYPE_ENUM.THROWN]: { id: ATTACK_TYPE_ENUM.THROWN, name: 'Thrown' },
};

export const ATTACK_TYPE_LIST = Object.values(ATTACK_TYPES);

// Creature Types for FeatureEntityConditionType.creature_type
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
    Kobold: 33,
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
    [CreatureType.Kobold]: { id: CreatureType.Kobold, name: 'Kobold' },
};

export const CREATURE_TYPE_LIST = Object.values(CREATURE_TYPES);

// Cumulative Value Type for enhanced formula parameters
export const ConditionalScalingValueType = {
    Value: 0,        // Default: values represent numeric values (current behavior)
    AppliesToId: 1,  // Values represent appliesToId lookups
    // Future: Could add other types like "ItemId", "SpellId", etc.
} as const;

export type ConditionalScalingValueType = typeof ConditionalScalingValueType[keyof typeof ConditionalScalingValueType];

export const CONDITIONAL_SCALING_VALUE_TYPES: BaseMap<CoreComponent> = {
    [ConditionalScalingValueType.Value]: { id: ConditionalScalingValueType.Value, name: 'Value' },
    [ConditionalScalingValueType.AppliesToId]: { id: ConditionalScalingValueType.AppliesToId, name: 'Applies To ID' },
};

export const CONDITIONAL_SCALING_VALUE_TYPE_LIST = Object.values(CONDITIONAL_SCALING_VALUE_TYPES);

// Uses Frequency Types for feature modifiers
export const USES_FREQUENCY_ENUM = {
    PER_DAY: 1,
    PER_WEEK: 2,
    PER_LEVEL: 3,
    PER_ENCOUNTER: 4,
} as const;

export const USES_FREQUENCIES: BaseMap<CoreComponent> = {
    [USES_FREQUENCY_ENUM.PER_DAY]: { id: USES_FREQUENCY_ENUM.PER_DAY, name: 'day' },
    [USES_FREQUENCY_ENUM.PER_WEEK]: { id: USES_FREQUENCY_ENUM.PER_WEEK, name: 'week' },
    [USES_FREQUENCY_ENUM.PER_LEVEL]: { id: USES_FREQUENCY_ENUM.PER_LEVEL, name: 'level' },
    [USES_FREQUENCY_ENUM.PER_ENCOUNTER]: { id: USES_FREQUENCY_ENUM.PER_ENCOUNTER, name: 'encounter' },
};

export const USES_FREQUENCY_LIST = Object.values(USES_FREQUENCIES);

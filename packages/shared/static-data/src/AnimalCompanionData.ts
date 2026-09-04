import { GetAbilityModifier } from './AbilityData';
import { SizeId } from './CommonData';
import { EntityAppliesToType, EntityType } from './FeatureData';

/**
 * Existing class-specific Animal Companion *choice* features (`AppliesTo=AnimalCompanion`).
 */
export const ANIMAL_COMPANION_CHOICE_SLUGS = {
    Druid: 'druidanimalcompanion',
    Ranger: 'rangeranimalcompanion',
} as const;

/**
 * Existing Familiar *choice* features (`AppliesTo=Familiar`).
 */
export const FAMILIAR_CHOICE_SLUGS = {
    Wizard: 'summonfamiliar',
} as const;

/**
 * Parenthetical shown on the granted Alertness feat. The sheet assumes the familiar is in reach.
 */
export const FAMILIAR_ALERTNESS_FEATURE_SLUG = 'familiar-alertness';
export const FAMILIAR_ALERTNESS_REACH_REMINDER = 'familiar within reach';

/**
 * AppliesTo values that overlay companion/familiar numeric chassis rather than named specials.
 */
export const COMPANION_CHASSIS_APPLIES_TO: readonly number[] = [
    EntityAppliesToType.HitDice,
    EntityAppliesToType.AC,
    EntityAppliesToType.Ability,
    EntityAppliesToType.CompanionBonusTricks,
    EntityAppliesToType.SpellResistance,
    EntityAppliesToType.HitPoints,
];

/**
 * True when the entity’s beneficiary is the companion creature, not the character.
 */
export function isCompanionBeneficiaryEntity(entity: { type: number }): boolean {
    return entity.type === EntityType.Companion;
}

/**
 * True when a companion-beneficiary entity is chassis math rather than a named special.
 */
export function isCompanionChassisAppliesTo(appliesTo: number): boolean {
    return COMPANION_CHASSIS_APPLIES_TO.includes(appliesTo);
}

export const WILD_SHAPE_FEATURE_SLUG = 'druidwildshape';
export const ELEMENTAL_WILD_SHAPE_FEATURE_SLUG = 'druidelementalwildshape';

export const MULTIATTACK_FEAT_NAME = 'Multiattack';
export const SCENT_ABILITY_NAME = 'Scent';

/** Default Wild Shape sizes before size-unlock formulas apply. */
export const WILD_SHAPE_DEFAULT_SIZE_IDS: readonly SizeId[] = [SizeId.Small, SizeId.Medium];

/** Skill points per bonus HD: max(1, 2 + Int mod). */
export function getCompanionSkillPointsPerHd(intelligence: number | null | undefined): number {
    const intScore = intelligence ?? 2;
    return Math.max(1, 2 + GetAbilityModifier(intScore));
}

/** Creature feats from Hit Dice: 1 + floor(HD / 3). */
export function getCreatureFeatCount(hitDice: number): number {
    const hd = Math.max(0, Math.floor(hitDice));
    return 1 + Math.floor(hd / 3);
}

/**
 * Extra feat slots from HD advancement (does not include the Multiattack bonus feat).
 */
export function getBonusFeatSlots(baseHitDice: number, totalHitDice: number): number {
    return Math.max(0, getCreatureFeatCount(totalHitDice) - getCreatureFeatCount(baseHitDice));
}

/**
 * Extra skill points from bonus HD only.
 */
export function getBonusSkillPoints(bonusHd: number, intelligence: number | null | undefined): number {
    return Math.max(0, bonusHd) * getCompanionSkillPointsPerHd(intelligence);
}

/** Medium BAB as a druid of `hitDice` levels: floor(HD × 3/4). */
export function getDruidBabForHitDice(hitDice: number): number {
    return Math.floor(Math.max(0, hitDice) * 0.75);
}

/** Good save: 2 + floor(HD / 2). */
export function getGoodSaveForHitDice(hitDice: number): number {
    return 2 + Math.floor(Math.max(0, hitDice) / 2);
}

/** Poor save: floor(HD / 3). */
export function getPoorSaveForHitDice(hitDice: number): number {
    return Math.floor(Math.max(0, hitDice) / 3);
}

/**
 * Average HP from N d8 companion bonus HD: floor(N × (4.5 + Con mod)).
 */
export function getBonusHdAverageHp(bonusHd: number, constitution: number | null | undefined): number {
    if (bonusHd <= 0) {
        return 0;
    }
    const conMod = GetAbilityModifier(constitution ?? 10);
    return Math.floor(bonusHd * (4.5 + conMod));
}

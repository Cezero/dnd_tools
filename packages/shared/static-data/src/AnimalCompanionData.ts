import { GetAbilityModifier } from './AbilityData';
import { SizeId } from './CommonData';

/**
 * Shared animal-companion progression is stored as Feature rows (not a TS table).
 * Runtime loads these slugs; if they are missing, companions use base monster stats only.
 */
export const ANIMAL_COMPANION_PROGRESSION_SLUG = 'animal-companion-progression';

export const AnimalCompanionSpecialSlug = {
    Link: 'animal-companion-link',
    ShareSpells: 'share-spells',
    Evasion: 'evasion',
    Devotion: 'devotion',
    Multiattack: 'multiattack',
    ImprovedEvasion: 'improved-evasion',
} as const;

export type AnimalCompanionSpecialSlug = typeof AnimalCompanionSpecialSlug[keyof typeof AnimalCompanionSpecialSlug];

export const ANIMAL_COMPANION_SPECIAL_SLUGS: readonly AnimalCompanionSpecialSlug[] = [
    AnimalCompanionSpecialSlug.Link,
    AnimalCompanionSpecialSlug.ShareSpells,
    AnimalCompanionSpecialSlug.Evasion,
    AnimalCompanionSpecialSlug.Devotion,
    AnimalCompanionSpecialSlug.Multiattack,
    AnimalCompanionSpecialSlug.ImprovedEvasion,
];

/** Existing class-specific Animal Companion *choice* features. */
export const ANIMAL_COMPANION_CHOICE_SLUGS = {
    Druid: 'druidanimalcompanion',
    Ranger: 'rangeranimalcompanion',
} as const;

/**
 * Shared familiar progression is stored as Feature rows (not a TS table).
 * Runtime loads these slugs; if they are missing, familiars use base monster stats
 * plus any Companion-source type benefits (e.g. Cat +3 Move Silently).
 */
export const FAMILIAR_PROGRESSION_SLUG = 'familiar-progression';

export const FamiliarSpecialSlug = {
    Alertness: 'familiar-alertness',
    ImprovedEvasion: 'familiar-improved-evasion',
    ShareSpells: 'familiar-share-spells',
    EmpathicLink: 'familiar-empathic-link',
    DeliverTouchSpells: 'familiar-deliver-touch-spells',
    SpeakWithMaster: 'familiar-speak-with-master',
    SpeakWithAnimals: 'familiar-speak-with-animals',
    SpellResistance: 'familiar-spell-resistance',
    Scry: 'familiar-scry',
} as const;

export type FamiliarSpecialSlug = typeof FamiliarSpecialSlug[keyof typeof FamiliarSpecialSlug];

export const FAMILIAR_SPECIAL_SLUGS: readonly FamiliarSpecialSlug[] = [
    FamiliarSpecialSlug.Alertness,
    FamiliarSpecialSlug.ImprovedEvasion,
    FamiliarSpecialSlug.ShareSpells,
    FamiliarSpecialSlug.EmpathicLink,
    FamiliarSpecialSlug.DeliverTouchSpells,
    FamiliarSpecialSlug.SpeakWithMaster,
    FamiliarSpecialSlug.SpeakWithAnimals,
    FamiliarSpecialSlug.SpellResistance,
    FamiliarSpecialSlug.Scry,
];

export const FAMILIAR_CHOICE_SLUGS = {
    Wizard: 'summonfamiliar',
} as const;

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

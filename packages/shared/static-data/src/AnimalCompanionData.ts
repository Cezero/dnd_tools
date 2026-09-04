import { GetAbilityModifier } from './AbilityData';
import { RPG_DICE, RpgDice, SizeId } from './CommonData';
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

/**
 * Sides for an `@RpgDice` id. Unknown ids default to d8 (animal HD).
 */
export function getCreatureHitDieSides(diceId: number | null | undefined): number {
    if (diceId === null || diceId === undefined) {
        return RPG_DICE[RpgDice.D8].sides;
    }
    return RPG_DICE[diceId as keyof typeof RPG_DICE]?.sides ?? RPG_DICE[RpgDice.D8].sides;
}

/**
 * Maps a monster stat block onto the starting-HD input for HP helpers.
 */
export function startingHitDiceFromMonster(monster: {
    hitDiceQty?: number | null;
    hitDiceType?: number | null;
    bonusHP?: number | null;
    averageHP?: number | null;
    extraHitDice?: Array<{
        hitDiceQty: number;
        hitDiceType: number;
        bonusHP?: number | null;
    }> | null;
}): CreatureStartingHitDice {
    return {
        hitDiceQty: monster.hitDiceQty,
        hitDiceType: monster.hitDiceType,
        bonusHP: monster.bonusHP,
        averageHP: monster.averageHP,
        extraHitDice: monster.extraHitDice ?? undefined,
    };
}

export interface CreatureStartingHitDice {
    hitDiceQty: number | null | undefined;
    hitDiceType: number | null | undefined;
    bonusHP: number | null | undefined;
    averageHP: number | null | undefined;
    extraHitDice?: Array<{
        hitDiceQty: number;
        hitDiceType: number;
        bonusHP?: number | null;
    }>;
}

/**
 * Max HP for all printed/starting HD (and extra HD sets): qty × sides + bonusHP.
 */
export function computeMaxStartingHitPoints(starting: CreatureStartingHitDice): number {
    const primaryQty = starting.hitDiceQty ?? 0;
    const primary = Math.round(primaryQty * getCreatureHitDieSides(starting.hitDiceType))
        + (starting.bonusHP ?? 0);
    const extra = (starting.extraHitDice ?? []).reduce((sum, row) => {
        return sum
            + Math.round(row.hitDiceQty * getCreatureHitDieSides(row.hitDiceType))
            + (row.bonusHP ?? 0);
    }, 0);
    return Math.max(1, primary + extra);
}

/**
 * Sequence-1 HP: max starting HD when the flag is on, otherwise stored average.
 */
export function computeStartingHitPoints(
    starting: CreatureStartingHitDice,
    maxHpAtFirstLevel: boolean
): number {
    if (maxHpAtFirstLevel) {
        return computeMaxStartingHitPoints(starting);
    }
    return Math.max(1, starting.averageHP ?? 1);
}

/**
 * Feat slots granted by the Nth added HD (1-based). 0 or 1.
 * Wolf base 2 HD: first bonus HD → total 3 → 1 feat.
 */
export function getFeatSlotsForAddedHitDie(baseHd: number, addedIndex: number): number {
    if (addedIndex <= 0) {
        return 0;
    }
    const after = baseHd + addedIndex;
    const before = baseHd + addedIndex - 1;
    return Math.max(0, getCreatureFeatCount(after) - getCreatureFeatCount(before));
}

export interface CreatureAdvancementSeed {
    id: number;
    sequence: number;
    hitDiceQty: number;
    hitDiceType: number;
    hitPoints: number;
    classId?: number | null;
    notes?: string | null;
    skills?: Array<{
        id: number;
        skillId: number;
        skillSubId?: number | null;
        ranks: number;
    }>;
    feats?: Array<{
        id: number;
        featId: number;
        featSubId?: number | null;
        notes?: string | null;
    }>;
}

/**
 * Ensures sequence 1 (printed HD) plus one row per bonus HD.
 * Preserves player HP/skills/feats on existing sequences. New bonus rows start at 0 HP.
 */
export function ensureCreatureAdvancements(args: {
    existing: CreatureAdvancementSeed[];
    starting: CreatureStartingHitDice;
    bonusHd: number;
    maxHpAtFirstLevel: boolean;
    createId: (sequence: number) => number;
}): CreatureAdvancementSeed[] {
    const existingBySequence = new Map(args.existing.map((row) => [row.sequence, row]));
    const bonusHd = Math.max(0, Math.floor(args.bonusHd));
    const baseQty = args.starting.hitDiceQty && args.starting.hitDiceQty > 0
        ? args.starting.hitDiceQty
        : 1;
    const baseType = args.starting.hitDiceType ?? RpgDice.D8;
    const startingHp = computeStartingHitPoints(args.starting, args.maxHpAtFirstLevel);

    const rows: CreatureAdvancementSeed[] = [];
    const existingBase = existingBySequence.get(1);
    const baseHitPoints = args.maxHpAtFirstLevel
        ? startingHp
        : (existingBase && existingBase.hitPoints > 0 ? existingBase.hitPoints : startingHp);

    rows.push({
        id: existingBase?.id ?? args.createId(1),
        sequence: 1,
        hitDiceQty: existingBase?.hitDiceQty ?? baseQty,
        hitDiceType: existingBase?.hitDiceType ?? baseType,
        hitPoints: baseHitPoints,
        classId: existingBase?.classId ?? null,
        notes: existingBase?.notes ?? null,
        skills: existingBase?.skills ?? [],
        feats: existingBase?.feats ?? [],
    });

    for (let addedIndex = 1; addedIndex <= bonusHd; addedIndex += 1) {
        const sequence = 1 + addedIndex;
        const existing = existingBySequence.get(sequence);
        rows.push({
            id: existing?.id ?? args.createId(sequence),
            sequence,
            hitDiceQty: existing?.hitDiceQty ?? 1,
            hitDiceType: existing?.hitDiceType ?? RpgDice.D8,
            hitPoints: existing?.hitPoints ?? 0,
            classId: existing?.classId ?? null,
            notes: existing?.notes ?? null,
            skills: existing?.skills ?? [],
            feats: existing?.feats ?? [],
        });
    }

    return rows;
}

/**
 * Total HP from advancement rows. Empty list is 0.
 */
export function sumAdvancementHitPoints(
    advancements: Array<{ hitPoints: number }>
): number {
    return advancements.reduce((sum, row) => sum + row.hitPoints, 0);
}

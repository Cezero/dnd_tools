import { classService } from '@/features/class/classService';
import type { FeatureWithRelations } from '@shared/schema';
import { AbilityId, RPG_DICE } from '@shared/static-data';

import { extractHitDie } from './classMechanicsExtractor';
import type { ResolveMaxFirstLevelHitPointsArgs } from './types';

/**
 * Ability modifier from a raw score (3.x).
 */
export function getAbilityModifier(score: number): number {
    return Math.floor((score - 10) / 2);
}

/**
 * Sides for an `@RpgDice` id. Unknown ids return null.
 */
export function getHitDieSides(diceId: number | null | undefined): number | null {
    if (diceId === null || diceId === undefined) {
        return null;
    }
    const die = RPG_DICE[diceId as keyof typeof RPG_DICE];
    return die?.sides ?? null;
}

/**
 * Better (more sides) hit die for gestalt. Compares sides, not dice ids.
 */
export function pickBetterHitDieSides(
    primaryDiceId: number | null,
    secondaryDiceId: number | null
): number | null {
    const primary = getHitDieSides(primaryDiceId);
    const secondary = getHitDieSides(secondaryDiceId);
    if (primary === null && secondary === null) {
        return null;
    }
    return Math.max(primary ?? 0, secondary ?? 0);
}

/**
 * Official 3.x 1st-level HP: max HD + CON modifier, minimum 1.
 */
export function computeMaxFirstLevelHitPoints(
    hitDieSides: number,
    constitutionScore: number
): number {
    return Math.max(1, hitDieSides + getAbilityModifier(constitutionScore));
}

/**
 * Constitution score from stored ability rows. Missing CON is treated as 10.
 */
export function constitutionScoreFromAbilities(
    abilityScores: Array<{ abilityId: number; value: number }>
): number {
    const constitution = abilityScores.find((score) => score.abilityId === AbilityId.Constitution);
    return constitution?.value ?? 10;
}

/**
 * Resolve 1st-level max HP from class features and ability scores.
 * Gestalt uses the better hit die. Returns null when no hit die is found.
 */
export function resolveMaxFirstLevelHitPointsFromFeatures(args: {
    primaryFeatures: FeatureWithRelations[];
    secondaryFeatures?: FeatureWithRelations[] | null;
    primaryClassId: number;
    secondaryClassId?: number | null;
    abilityScores: Array<{ abilityId: number; value: number }>;
}): number | null {
    const primaryDie = extractHitDie(args.primaryFeatures, args.primaryClassId);
    const secondaryDie =
        args.secondaryClassId && args.secondaryFeatures
            ? extractHitDie(args.secondaryFeatures, args.secondaryClassId)
            : null;
    const sides = pickBetterHitDieSides(primaryDie, secondaryDie);
    if (sides === null) {
        return null;
    }
    return computeMaxFirstLevelHitPoints(sides, constitutionScoreFromAbilities(args.abilityScores));
}

/**
 * Load class features and compute max 1st-level HP when the option is on.
 */
export async function resolveMaxFirstLevelHitPointsForClasses(
    args: ResolveMaxFirstLevelHitPointsArgs
): Promise<number | null> {
    if (args.primaryClassId < 1) {
        return null;
    }

    const primaryFeatures = await classService.getClassFeatures({ id: args.primaryClassId });
    const secondaryFeatures =
        args.secondaryClassId !== null && args.secondaryClassId > 0
            ? await classService.getClassFeatures({ id: args.secondaryClassId })
            : null;

    return resolveMaxFirstLevelHitPointsFromFeatures({
        primaryFeatures,
        secondaryFeatures,
        primaryClassId: args.primaryClassId,
        secondaryClassId: args.secondaryClassId,
        abilityScores: args.abilityScores,
    });
}

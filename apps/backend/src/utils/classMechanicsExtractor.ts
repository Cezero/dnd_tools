import type { FeatureProgression } from '@shared/schema';
import { EntityAppliesToType, SavingThrowId, ProgressionType } from '@shared/static-data';

/**
 * Extracted class mechanics from feature progressions
 */
export interface ClassMechanics {
    hitDie: number | null;
    skillPoints: number | null;
    babProgression: ProgressionType | null;
    fortProgression: ProgressionType | null;
    refProgression: ProgressionType | null;
    willProgression: ProgressionType | null;
}

/**
 * Find the "class-mechanics" feature progression from a list of progressions.
 * Handles both direct classId links and shared progressions via many-to-many relationship.
 */
function findClassMechanicsProgression(
    progressions: FeatureProgression[],
    classId?: number
): FeatureProgression | null {
    return progressions.find(p => {
        // Check if this is a class-mechanics progression
        const isClassMechanics = p.feature?.slug === 'class-mechanics';
        if (!isClassMechanics) return false;

        // If classId provided, check if progression is linked to this class via many-to-many relationship
        if (classId !== undefined) {
            if (p.classes?.some(c => c.classId === classId)) return true;
        }

        // If no classId provided, return first class-mechanics progression found
        return true;
    }) || null;
}

/**
 * Extract hit die value from class mechanics progression
 */
export function extractHitDie(progressions: FeatureProgression[], classId?: number): number | null {
    const mechanicsProgression = findClassMechanicsProgression(progressions, classId);
    if (!mechanicsProgression?.entities) return null;

    const hitDieEntity = mechanicsProgression.entities.find(
        e => e.appliesTo === EntityAppliesToType.HitDice && e.appliesToId !== null
    );

    return hitDieEntity?.appliesToId ?? null;
}

/**
 * Extract skill points value from class mechanics progression
 * SkillPoints uses value field (not appliesToId) and may have an ABILITY_BASED formula
 */
export function extractSkillPoints(progressions: FeatureProgression[], classId?: number): number | null {
    const mechanicsProgression = findClassMechanicsProgression(progressions, classId);
    if (!mechanicsProgression?.entities) return null;

    const skillPointsEntity = mechanicsProgression.entities.find(
        e => e.appliesTo === EntityAppliesToType.SkillPoints && e.value !== null
    );

    return skillPointsEntity?.value ?? null;
}

/**
 * Extract BAB progression type from class mechanics progression
 */
export function extractBABProgression(progressions: FeatureProgression[], classId?: number): ProgressionType | null {
    const mechanicsProgression = findClassMechanicsProgression(progressions, classId);
    if (!mechanicsProgression?.entities) return null;

    const babEntity = mechanicsProgression.entities.find(
        e => e.appliesTo === EntityAppliesToType.BaseAttackBonus && e.appliesToId !== null
    );

    return (babEntity?.appliesToId as ProgressionType) ?? null;
}

/**
 * Extract saving throw progression type from class mechanics progression
 */
export function extractSaveProgression(
    progressions: FeatureProgression[],
    saveType: SavingThrowId,
    classId?: number
): ProgressionType | null {
    const mechanicsProgression = findClassMechanicsProgression(progressions, classId);
    if (!mechanicsProgression?.entities) return null;

    const saveEntity = mechanicsProgression.entities.find(
        e =>
            e.appliesTo === EntityAppliesToType.SavingThrow &&
            e.appliesToId === saveType &&
            e.appliesToSubId !== null
    );

    // For saving throws, appliesToId is the save type (Fortitude/Reflex/Will)
    // and appliesToSubId is the progression type (good/poor)
    return (saveEntity?.appliesToSubId as ProgressionType) ?? null;
}

/**
 * Extract all class mechanics from feature progressions in one call
 */
export function extractClassMechanicsFromProgressions(
    progressions: FeatureProgression[],
    classId?: number
): ClassMechanics {
    const mechanicsProgression = findClassMechanicsProgression(progressions, classId);
    if (!mechanicsProgression?.entities) {
        return {
            hitDie: null,
            skillPoints: null,
            babProgression: null,
            fortProgression: null,
            refProgression: null,
            willProgression: null,
        };
    }

    const entities = mechanicsProgression.entities;

    // Extract hit die (stored in appliesToId)
    const hitDieEntity = entities.find(e => e.appliesTo === EntityAppliesToType.HitDice && e.appliesToId !== null);
    const hitDie = hitDieEntity?.appliesToId ?? null;

    // Extract skill points (stored in value, may have ABILITY_BASED formula)
    const skillPointsEntity = entities.find(e => e.appliesTo === EntityAppliesToType.SkillPoints && e.value !== null);
    const skillPoints = skillPointsEntity?.value ?? null;

    // Extract BAB progression (stored in appliesToId)
    const babEntity = entities.find(e => e.appliesTo === EntityAppliesToType.BaseAttackBonus && e.appliesToId !== null);
    const babProgression = (babEntity?.appliesToId as ProgressionType) ?? null;

    // Extract saving throw progressions
    // For saving throws, appliesToId is the save type (Fortitude/Reflex/Will)
    // and appliesToSubId is the progression type (good/poor)
    const fortEntity = entities.find(
        e =>
            e.appliesTo === EntityAppliesToType.SavingThrow &&
            e.appliesToId === SavingThrowId.Fortitude &&
            e.appliesToSubId !== null
    );
    const fortProgression = (fortEntity?.appliesToSubId as ProgressionType) ?? null;

    const refEntity = entities.find(
        e =>
            e.appliesTo === EntityAppliesToType.SavingThrow &&
            e.appliesToId === SavingThrowId.Reflex &&
            e.appliesToSubId !== null
    );
    const refProgression = (refEntity?.appliesToSubId as ProgressionType) ?? null;

    const willEntity = entities.find(
        e =>
            e.appliesTo === EntityAppliesToType.SavingThrow &&
            e.appliesToId === SavingThrowId.Will &&
            e.appliesToSubId !== null
    );
    const willProgression = (willEntity?.appliesToSubId as ProgressionType) ?? null;

    return {
        hitDie,
        skillPoints,
        babProgression,
        fortProgression,
        refProgression,
        willProgression,
    };
}

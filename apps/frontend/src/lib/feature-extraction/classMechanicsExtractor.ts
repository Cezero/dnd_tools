import type { FeatureProgression } from '@shared/schema';
import { EntityAppliesToType, EntityType, FeatureSourceType, SavingThrowId, ProgressionType } from '@shared/static-data';

import { getBABProgressionTypeFromFormula, getSaveProgressionTypeFromFormula } from './formulaToProgressionType';

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
 * Find entities by EntityType and EntityAppliesToType across class progressions.
 * Filters by sourceType === FeatureSourceType.Class and optionally by classId.
 */
function findClassMechanicsEntities(
    progressions: FeatureProgression[],
    appliesTo: EntityAppliesToType,
    classId?: number
) {
    return progressions
        .filter(p =>
            p.sourceType === FeatureSourceType.Class &&
            (classId === undefined || p.classes?.some(c => c.classId === classId))
        )
        .flatMap(p => p.entities || [])
        .filter(e => e.type === EntityType.Base && e.appliesTo === appliesTo);
}

/**
 * Extract hit die value from class mechanics progressions
 */
export function extractHitDie(progressions: FeatureProgression[], classId?: number): number | null {
    const hitDieEntities = findClassMechanicsEntities(progressions, EntityAppliesToType.HitDice, classId);
    const hitDieEntity = hitDieEntities.find(e => e.appliesToId !== null);
    return hitDieEntity?.appliesToId ?? null;
}

/**
 * Extract skill points value from class mechanics progressions
 * SkillPoints uses value field (not appliesToId) and may have an ABILITY_BASED formula
 */
export function extractSkillPoints(progressions: FeatureProgression[], classId?: number): number | null {
    const skillPointsEntities = findClassMechanicsEntities(progressions, EntityAppliesToType.SkillPoints, classId);
    const skillPointsEntity = skillPointsEntities.find(e => e.value !== null);
    return skillPointsEntity?.value ?? null;
}

/**
 * Extract BAB progression type from class mechanics progressions
 * Supports both old format (ProgressionType in appliesToId) and new format (formula-based)
 */
export function extractBABProgression(progressions: FeatureProgression[], classId?: number): ProgressionType | null {
    const babEntities = findClassMechanicsEntities(progressions, EntityAppliesToType.BaseAttackBonus, classId);
    const babEntity = babEntities[0];

    if (!babEntity) return null;

    // New format: Check if entity has formula params
    if (babEntity.formulaParams) {
        const progressionType = getBABProgressionTypeFromFormula(babEntity.formulaParams, babEntity.value);
        if (progressionType !== null) {
            return progressionType;
        }
    }

    // Old format: Fall back to appliesToId (for backward compatibility)
    if (babEntity.appliesToId !== null) {
        return babEntity.appliesToId as ProgressionType;
    }

    return null;
}

/**
 * Extract saving throw progression type from class mechanics progressions
 * Supports both old format (ProgressionType in appliesToSubId) and new format (formula-based)
 */
export function extractSaveProgression(
    progressions: FeatureProgression[],
    saveType: SavingThrowId,
    classId?: number
): ProgressionType | null {
    const saveEntities = findClassMechanicsEntities(progressions, EntityAppliesToType.SavingThrow, classId);
    const saveEntity = saveEntities.find(e => e.appliesToId === saveType);

    if (!saveEntity) return null;

    // New format: Check if entity has formula params
    if (saveEntity.formulaParams) {
        const progressionType = getSaveProgressionTypeFromFormula(saveEntity.formulaParams);
        if (progressionType !== null) {
            return progressionType;
        }
    }

    // Old format: Fall back to appliesToSubId (for backward compatibility)
    if (saveEntity.appliesToSubId !== null) {
        return saveEntity.appliesToSubId as ProgressionType;
    }

    return null;
}

/**
 * Extract all class mechanics from feature progressions in one call
 */
export function extractClassMechanics(progressions: FeatureProgression[], classId?: number): ClassMechanics {
    // Extract hit die (stored in appliesToId)
    const hitDieEntities = findClassMechanicsEntities(progressions, EntityAppliesToType.HitDice, classId);
    const hitDieEntity = hitDieEntities.find(e => e.appliesToId !== null);
    const hitDie = hitDieEntity?.appliesToId ?? null;

    // Extract skill points (stored in value, may have ABILITY_BASED formula)
    const skillPointsEntities = findClassMechanicsEntities(progressions, EntityAppliesToType.SkillPoints, classId);
    const skillPointsEntity = skillPointsEntities.find(e => e.value !== null);
    const skillPoints = skillPointsEntity?.value ?? null;

    // Extract BAB progression (supports both old and new format)
    const babEntities = findClassMechanicsEntities(progressions, EntityAppliesToType.BaseAttackBonus, classId);
    const babEntity = babEntities[0];
    const babProgression = babEntity
        ? (babEntity.formulaParams
            ? getBABProgressionTypeFromFormula(babEntity.formulaParams, babEntity.value)
            : (babEntity.appliesToId !== null ? (babEntity.appliesToId as ProgressionType) : null))
        : null;

    // Extract saving throw progressions (supports both old and new format)
    const saveEntities = findClassMechanicsEntities(progressions, EntityAppliesToType.SavingThrow, classId);
    const fortEntity = saveEntities.find(e => e.appliesToId === SavingThrowId.Fortitude);
    const fortProgression = fortEntity
        ? (fortEntity.formulaParams
            ? getSaveProgressionTypeFromFormula(fortEntity.formulaParams)
            : (fortEntity.appliesToSubId !== null ? (fortEntity.appliesToSubId as ProgressionType) : null))
        : null;

    const refEntity = saveEntities.find(e => e.appliesToId === SavingThrowId.Reflex);
    const refProgression = refEntity
        ? (refEntity.formulaParams
            ? getSaveProgressionTypeFromFormula(refEntity.formulaParams)
            : (refEntity.appliesToSubId !== null ? (refEntity.appliesToSubId as ProgressionType) : null))
        : null;

    const willEntity = saveEntities.find(e => e.appliesToId === SavingThrowId.Will);
    const willProgression = willEntity
        ? (willEntity.formulaParams
            ? getSaveProgressionTypeFromFormula(willEntity.formulaParams)
            : (willEntity.appliesToSubId !== null ? (willEntity.appliesToSubId as ProgressionType) : null))
        : null;

    return {
        hitDie,
        skillPoints,
        babProgression,
        fortProgression,
        refProgression,
        willProgression,
    };
}

import type { FeatureWithRelations } from '@shared/schema';
import { EntityAppliesToType, EntityType, FeatureSourceType, SavingThrowId, ProgressionType } from '@shared/static-data';

import { getBABProgressionTypeFromFormula, getSaveProgressionTypeFromFormula } from './formulaToProgressionType';
import type { ClassMechanics } from './types';

/**
 * Find entities by EntityType and EntityAppliesToType across class features.
 * Filters by sourceType === FeatureSourceType.Class and optionally by classId.
 */
function findClassMechanicsEntities(
    features: FeatureWithRelations[],
    appliesTo: EntityAppliesToType,
    classId?: number
) {
    return features
        .filter(p =>
            p.sourceType === FeatureSourceType.Class &&
            (classId === undefined || p.classes?.some(c => c.classId === classId))
        )
        .flatMap(p => p.entities || [])
        .filter(e => e.type === EntityType.Base && e.appliesTo === appliesTo);
}

/**
 * Extract hit die value from class mechanics features
 */
export function extractHitDie(features: FeatureWithRelations[], classId?: number): number | null {
    const hitDieEntities = findClassMechanicsEntities(features, EntityAppliesToType.HitDice, classId);
    const hitDieEntity = hitDieEntities.find(e => e.appliesToId !== null);
    return hitDieEntity?.appliesToId ?? null;
}

/**
 * Extract skill points value from class mechanics features
 * SkillPoints uses value field (not appliesToId) and may have an ABILITY_BASED formula
 */
export function extractSkillPoints(features: FeatureWithRelations[], classId?: number): number | null {
    const skillPointsEntities = findClassMechanicsEntities(features, EntityAppliesToType.SkillPoints, classId);
    const skillPointsEntity = skillPointsEntities.find(e => e.value !== null);
    return skillPointsEntity?.value ?? null;
}

/**
 * Extract BAB feature type from class mechanics features
 * Extracts from formula params, with fallback to appliesToId
 */
export function extractBABProgression(features: FeatureWithRelations[], classId?: number): ProgressionType | null {
    const babEntities = findClassMechanicsEntities(features, EntityAppliesToType.BaseAttackBonus, classId);
    const babEntity = babEntities[0];

    if (!babEntity) return null;

    // Check if entity has formula params
    if (babEntity.formulaParams) {
        const progressionType = getBABProgressionTypeFromFormula(babEntity.formulaParams, babEntity.value);
        if (progressionType !== null) {
            return progressionType;
        }
    }

    // Fall back to appliesToId if no formula params
    if (babEntity.appliesToId !== null) {
        return babEntity.appliesToId as ProgressionType;
    }

    return null;
}

/**
 * Extract saving throw feature type from class mechanics features
 * Extracts from formula params, with fallback to appliesToSubId
 */
export function extractSaveProgression(
    features: FeatureWithRelations[],
    saveType: SavingThrowId,
    classId?: number
): ProgressionType | null {
    const saveEntities = findClassMechanicsEntities(features, EntityAppliesToType.SavingThrow, classId);
    const saveEntity = saveEntities.find(e => e.appliesToId === saveType);

    if (!saveEntity) return null;

    // Check if entity has formula params
    if (saveEntity.formulaParams) {
        const progressionType = getSaveProgressionTypeFromFormula(saveEntity.formulaParams);
        if (progressionType !== null) {
            return progressionType;
        }
    }

    // Fall back to appliesToSubId if no formula params
    if (saveEntity.appliesToSubId !== null) {
        return saveEntity.appliesToSubId as ProgressionType;
    }

    return null;
}

/**
 * Extract all class mechanics from feature features in one call
 */
export function extractClassMechanicsFromProgressions(
    features: FeatureWithRelations[],
    classId?: number
): ClassMechanics {
    // Extract hit die (stored in appliesToId)
    const hitDieEntities = findClassMechanicsEntities(features, EntityAppliesToType.HitDice, classId);
    const hitDieEntity = hitDieEntities.find(e => e.appliesToId !== null);
    const hitDie = hitDieEntity?.appliesToId ?? null;

    // Extract skill points (stored in value, may have ABILITY_BASED formula)
    const skillPointsEntities = findClassMechanicsEntities(features, EntityAppliesToType.SkillPoints, classId);
    const skillPointsEntity = skillPointsEntities.find(e => e.value !== null);
    const skillPoints = skillPointsEntity?.value ?? null;

    // Extract BAB feature
    const babEntities = findClassMechanicsEntities(features, EntityAppliesToType.BaseAttackBonus, classId);
    const babEntity = babEntities[0];
    const babProgression = babEntity
        ? (babEntity.formulaParams
            ? getBABProgressionTypeFromFormula(babEntity.formulaParams, babEntity.value)
            : (babEntity.appliesToId !== null ? (babEntity.appliesToId as ProgressionType) : null))
        : null;

    // Extract saving throw features
    const saveEntities = findClassMechanicsEntities(features, EntityAppliesToType.SavingThrow, classId);
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

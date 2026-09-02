import type { FeatureEntity, FeatureWithRelations } from '@shared/schema';
import { EntityAppliesToType, EntityType, FeatureSourceType, SavingThrowId, ProgressionType } from '@shared/static-data';

import { getBABProgressionTypeFromFormula, getSaveProgressionTypeFromFormula } from './formulaToProgressionType';

/**
 * Extracted class mechanics from feature features
 */
export interface ClassMechanics {
    hitDie: number | null;
    skillPoints: number | null;
    babProgression: ProgressionType | null;
    fortProgression: ProgressionType | null;
    refProgression: ProgressionType | null;
    willProgression: ProgressionType | null;
}

const DUMMY_CLASS_MECHANICS_SLUG = 'class-mechanics';

/**
 * Find Base entities of a given appliesTo across class features.
 * Prefers non-template features when the dummy `class-mechanics` container is also linked.
 */
function findClassMechanicsEntities(
    features: FeatureWithRelations[],
    appliesTo: EntityAppliesToType,
    classId?: number
): FeatureEntity[] {
    const matchingFeatures = features.filter(p =>
        p.sourceType === FeatureSourceType.Class &&
        (classId === undefined || p.classes?.some(c => c.classId === classId))
    );
    const nonTemplate = matchingFeatures.filter(p => p.slug !== DUMMY_CLASS_MECHANICS_SLUG);
    const source = nonTemplate.length > 0 ? nonTemplate : matchingFeatures;

    return source
        .flatMap(p => p.entities || [])
        .filter(e => e.type === EntityType.Base && e.appliesTo === appliesTo);
}

/**
 * Prefer an entity that has formula params over a placeholder ID-only entity.
 */
function preferFormulaEntity(entities: FeatureEntity[]): FeatureEntity | undefined {
    return entities.find(e => e.formulaParams) ?? entities[0];
}

/**
 * Extract hit die value from class mechanics features.
 * appliesToId 0 is valid (RpgDice.D4).
 */
export function extractHitDie(features: FeatureWithRelations[], classId?: number): number | null {
    const hitDieEntities = findClassMechanicsEntities(features, EntityAppliesToType.HitDice, classId);
    const hitDieEntity = hitDieEntities.find(e => e.appliesToId !== null && e.appliesToId !== undefined);
    return hitDieEntity?.appliesToId ?? null;
}

/**
 * Extract skill points value from class mechanics features.
 * Prefers a non-zero value over the dummy template's 0 placeholder.
 */
export function extractSkillPoints(features: FeatureWithRelations[], classId?: number): number | null {
    const skillPointsEntities = findClassMechanicsEntities(features, EntityAppliesToType.SkillPoints, classId);
    const nonPlaceholder = skillPointsEntities.find(e => e.value !== null && e.value !== undefined && e.value !== 0);
    const skillPointsEntity = nonPlaceholder ?? skillPointsEntities.find(e => e.value !== null && e.value !== undefined);
    return skillPointsEntity?.value ?? null;
}

/**
 * Extract BAB feature type from class mechanics features.
 * Extracts from formula params, with fallback to appliesToId.
 */
export function extractBABProgression(features: FeatureWithRelations[], classId?: number): ProgressionType | null {
    const babEntities = findClassMechanicsEntities(features, EntityAppliesToType.BaseAttackBonus, classId);
    const babEntity = preferFormulaEntity(babEntities);

    if (!babEntity) return null;

    if (babEntity.formulaParams) {
        const progressionType = getBABProgressionTypeFromFormula(babEntity.formulaParams, babEntity.value);
        if (progressionType !== null) {
            return progressionType;
        }
    }

    if (babEntity.appliesToId !== null && babEntity.appliesToId !== undefined) {
        return babEntity.appliesToId as ProgressionType;
    }

    return null;
}

/**
 * Extract saving throw feature type from class mechanics features.
 * Extracts from formula params, with fallback to appliesToSubId.
 */
export function extractSaveProgression(
    features: FeatureWithRelations[],
    saveType: SavingThrowId,
    classId?: number
): ProgressionType | null {
    const saveEntities = findClassMechanicsEntities(features, EntityAppliesToType.SavingThrow, classId)
        .filter(e => e.appliesToId === saveType);
    const saveEntity = preferFormulaEntity(saveEntities);

    if (!saveEntity) return null;

    if (saveEntity.formulaParams) {
        const progressionType = getSaveProgressionTypeFromFormula(saveEntity.formulaParams);
        if (progressionType !== null) {
            return progressionType;
        }
    }

    if (saveEntity.appliesToSubId !== null && saveEntity.appliesToSubId !== undefined) {
        return saveEntity.appliesToSubId as ProgressionType;
    }

    return null;
}

/**
 * Extract all class mechanics from feature features in one call
 */
export function extractClassMechanics(features: FeatureWithRelations[], classId?: number): ClassMechanics {
    return {
        hitDie: extractHitDie(features, classId),
        skillPoints: extractSkillPoints(features, classId),
        babProgression: extractBABProgression(features, classId),
        fortProgression: extractSaveProgression(features, SavingThrowId.Fortitude, classId),
        refProgression: extractSaveProgression(features, SavingThrowId.Reflex, classId),
        willProgression: extractSaveProgression(features, SavingThrowId.Will, classId),
    };
}

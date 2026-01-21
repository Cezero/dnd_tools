import type { FeatureWithRelations } from '@shared/schema';
import { EntityAppliesToType, EntityType, FeatureSourceType } from '@shared/static-data';

/**
 * Extracted race mechanics from feature features
 */
export interface RaceMechanics {
    sizeId: number | null;
    speed: number | null;
    favoredClassId: number | null;
    levelAdjustment: number | null;
}

/**
 * Find entities by EntityType and EntityAppliesToType across race features.
 * Filters by sourceType === FeatureSourceType.Race and optionally by raceId.
 */
function findRaceMechanicsEntities(
    features: FeatureWithRelations[],
    appliesTo: EntityAppliesToType,
    raceId?: number
) {
    return features
        .filter(p =>
            p.sourceType === FeatureSourceType.Race &&
            (raceId === undefined || p.races?.some(r => r.raceId === raceId))
        )
        .flatMap(p => p.entities || [])
        .filter(e => e.type === EntityType.Base && e.appliesTo === appliesTo);
}

/**
 * Extract size ID from race mechanics features
 */
export function extractSizeId(features: FeatureWithRelations[], raceId?: number): number | null {
    const sizeEntities = findRaceMechanicsEntities(features, EntityAppliesToType.Size, raceId);
    const sizeEntity = sizeEntities.find(e => e.appliesToId !== null);
    return sizeEntity?.appliesToId ?? null;
}

/**
 * Extract speed from race mechanics features
 * Speed uses value field (not appliesToId) as it's a literal numeric value
 */
export function extractSpeed(features: FeatureWithRelations[], raceId?: number): number | null {
    const speedEntities = findRaceMechanicsEntities(features, EntityAppliesToType.MovementSpeed, raceId);
    const speedEntity = speedEntities.find(e => e.value !== null);
    return speedEntity?.value ?? null;
}

/**
 * Extract favored class ID from race mechanics features
 */
export function extractFavoredClassId(features: FeatureWithRelations[], raceId?: number): number | null {
    const favoredClassEntities = findRaceMechanicsEntities(features, EntityAppliesToType.FavoredClass, raceId);
    const favoredClassEntity = favoredClassEntities.find(e => e.appliesToId !== null);
    return favoredClassEntity?.appliesToId ?? null;
}

/**
 * Extract level adjustment from race mechanics features
 * LevelAdjustment uses value field (not appliesToId) as it's a literal numeric value
 */
export function extractLevelAdjustment(features: FeatureWithRelations[], raceId?: number): number | null {
    const levelAdjustmentEntities = findRaceMechanicsEntities(features, EntityAppliesToType.LevelAdjustment, raceId);
    const levelAdjustmentEntity = levelAdjustmentEntities.find(e => e.value !== null);
    return levelAdjustmentEntity?.value ?? null;
}

/**
 * Extract all race mechanics from feature features in one call
 */
export function extractRaceMechanics(features: FeatureWithRelations[], raceId?: number): RaceMechanics {
    // Extract size ID (stored in appliesToId)
    const sizeEntities = findRaceMechanicsEntities(features, EntityAppliesToType.Size, raceId);
    const sizeEntity = sizeEntities.find(e => e.appliesToId !== null);
    const sizeId = sizeEntity?.appliesToId ?? null;

    // Extract speed (stored in value, literal numeric value)
    const speedEntities = findRaceMechanicsEntities(features, EntityAppliesToType.MovementSpeed, raceId);
    const speedEntity = speedEntities.find(e => e.value !== null);
    const speed = speedEntity?.value ?? null;

    // Extract favored class ID (stored in appliesToId)
    const favoredClassEntities = findRaceMechanicsEntities(features, EntityAppliesToType.FavoredClass, raceId);
    const favoredClassEntity = favoredClassEntities.find(e => e.appliesToId !== null);
    const favoredClassId = favoredClassEntity?.appliesToId ?? null;

    // Extract level adjustment (stored in value, literal numeric value)
    const levelAdjustmentEntities = findRaceMechanicsEntities(features, EntityAppliesToType.LevelAdjustment, raceId);
    const levelAdjustmentEntity = levelAdjustmentEntities.find(e => e.value !== null);
    const levelAdjustment = levelAdjustmentEntity?.value ?? null;

    return {
        sizeId,
        speed,
        favoredClassId,
        levelAdjustment,
    };
}

/**
 * Extract race mechanics from resolved features (filters by sourceType)
 * Useful for character calculations where we have resolved features
 */
export function extractRaceMechanicsFromResolved(
    resolvedProgressions: FeatureWithRelations[]
): RaceMechanics {
    // Filter to race features only
    const raceProgressions = resolvedProgressions.filter(
        p => p.sourceType === FeatureSourceType.Race
    );

    return extractRaceMechanics(raceProgressions);
}

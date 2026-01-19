import type { FeatureProgression } from '@shared/schema';
import { EntityAppliesToType, EntityType, FeatureSourceType } from '@shared/static-data';

import type { RaceMechanics } from './types';

/**
 * Find entities by EntityType and EntityAppliesToType across race progressions.
 * Filters by sourceType === FeatureSourceType.Race and optionally by raceId.
 */
function findRaceMechanicsEntities(
    progressions: FeatureProgression[],
    appliesTo: EntityAppliesToType,
    raceId?: number
) {
    return progressions
        .filter(p => {
            // Filter by sourceType
            if (p.sourceType !== FeatureSourceType.Race) {
                return false;
            }
            // Filter by raceId if provided
            // Note: If p.races is undefined, it means the progressions were already filtered by raceId
            // (e.g., from getFeatureProgressionsByRaceId), so we can skip the raceId check
            if (raceId === undefined) {
                return true;
            }
            // If races relationship is not populated, assume progressions are already filtered by raceId
            if (p.races === undefined || p.races === null) {
                return true;
            }
            // If races array exists, check if it contains the raceId
            return p.races.some(r => r.raceId === raceId);
        })
        .flatMap(p => p.entities || [])
        .filter(e => e.type === EntityType.Base && e.appliesTo === appliesTo);
}

/**
 * Extract size ID from race mechanics progressions
 */
export function extractSizeId(progressions: FeatureProgression[], raceId?: number): number | null {
    const sizeEntities = findRaceMechanicsEntities(progressions, EntityAppliesToType.Size, raceId);
    const sizeEntity = sizeEntities.find(e => e.appliesToId !== null);
    return sizeEntity?.appliesToId ?? null;
}

/**
 * Extract speed from race mechanics progressions
 * Speed uses value field (not appliesToId) as it's a literal numeric value
 */
export function extractSpeed(progressions: FeatureProgression[], raceId?: number): number | null {
    const speedEntities = findRaceMechanicsEntities(progressions, EntityAppliesToType.MovementSpeed, raceId);
    const speedEntity = speedEntities.find(e => e.value !== null);
    return speedEntity?.value ?? null;
}

/**
 * Extract favored class ID from race mechanics progressions
 */
export function extractFavoredClassId(progressions: FeatureProgression[], raceId?: number): number | null {
    const favoredClassEntities = findRaceMechanicsEntities(progressions, EntityAppliesToType.FavoredClass, raceId);
    const favoredClassEntity = favoredClassEntities.find(e => e.appliesToId !== null);
    return favoredClassEntity?.appliesToId ?? null;
}

/**
 * Extract level adjustment from race mechanics progressions
 * LevelAdjustment uses value field (not appliesToId) as it's a literal numeric value
 */
export function extractLevelAdjustment(progressions: FeatureProgression[], raceId?: number): number | null {
    const levelAdjustmentEntities = findRaceMechanicsEntities(progressions, EntityAppliesToType.LevelAdjustment, raceId);
    const levelAdjustmentEntity = levelAdjustmentEntities.find(e => e.value !== null);
    return levelAdjustmentEntity?.value ?? null;
}

/**
 * Extract all race mechanics from feature progressions in one call
 */
export function extractRaceMechanicsFromProgressions(
    progressions: FeatureProgression[],
    raceId?: number
): RaceMechanics {
    return {
        sizeId: extractSizeId(progressions, raceId),
        speed: extractSpeed(progressions, raceId),
        favoredClassId: extractFavoredClassId(progressions, raceId),
        levelAdjustment: extractLevelAdjustment(progressions, raceId),
    };
}

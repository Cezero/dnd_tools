import type { FeatureWithRelations } from '@shared/schema';
import { EntityAppliesToType, EntityType, FeatureSourceType } from '@shared/static-data';

import type { RaceMechanics } from './types';

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
        .filter(p => {
            // Filter by sourceType
            if (p.sourceType !== FeatureSourceType.Race) {
                return false;
            }
            // Filter by raceId if provided
            // Note: If p.races is undefined, it means the features were already filtered by raceId
            // (e.g., from getFeaturesByRaceId), so we can skip the raceId check
            if (raceId === undefined) {
                return true;
            }
            // If races relationship is not populated, assume features are already filtered by raceId
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
export function extractRaceMechanicsFromProgressions(
    features: FeatureWithRelations[],
    raceId?: number
): RaceMechanics {
    return {
        sizeId: extractSizeId(features, raceId),
        speed: extractSpeed(features, raceId),
        favoredClassId: extractFavoredClassId(features, raceId),
        levelAdjustment: extractLevelAdjustment(features, raceId),
    };
}

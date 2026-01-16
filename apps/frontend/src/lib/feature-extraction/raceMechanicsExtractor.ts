import type { FeatureProgression } from '@shared/schema';
import { EntityAppliesToType, FeatureSourceType } from '@shared/static-data';

/**
 * Extracted race mechanics from feature progressions
 */
export interface RaceMechanics {
    sizeId: number | null;
    speed: number | null;
    favoredClassId: number | null;
    levelAdjustment: number | null;
}

/**
 * Find the "race-mechanics" feature progression from a list of progressions.
 * Handles both direct raceId links and shared progressions via many-to-many relationship.
 */
function findRaceMechanicsProgression(
    progressions: FeatureProgression[],
    raceId?: number
): FeatureProgression | null {
    return progressions.find(p => {
        // Check if this is a race-mechanics progression
        const isRaceMechanics = p.feature?.slug === 'race-mechanics';
        if (!isRaceMechanics) return false;

        // If raceId provided, check if progression is linked to this race via many-to-many relationship
        if (raceId !== undefined) {
            if (p.races?.some(r => r.raceId === raceId)) return true;
        }

        // If no raceId provided, return first race-mechanics progression found
        return true;
    }) || null;
}

/**
 * Extract size ID from race mechanics progression
 */
export function extractSizeId(progressions: FeatureProgression[], raceId?: number): number | null {
    const mechanicsProgression = findRaceMechanicsProgression(progressions, raceId);
    if (!mechanicsProgression?.entities) return null;

    const sizeEntity = mechanicsProgression.entities.find(
        e => e.appliesTo === EntityAppliesToType.Size && e.appliesToId !== null
    );

    return sizeEntity?.appliesToId ?? null;
}

/**
 * Extract speed from race mechanics progression
 * Speed uses value field (not appliesToId) as it's a literal numeric value
 */
export function extractSpeed(progressions: FeatureProgression[], raceId?: number): number | null {
    const mechanicsProgression = findRaceMechanicsProgression(progressions, raceId);
    if (!mechanicsProgression?.entities) return null;

    const speedEntity = mechanicsProgression.entities.find(
        e => e.appliesTo === EntityAppliesToType.MovementSpeed && e.value !== null
    );

    return speedEntity?.value ?? null;
}

/**
 * Extract favored class ID from race mechanics progression
 */
export function extractFavoredClassId(progressions: FeatureProgression[], raceId?: number): number | null {
    const mechanicsProgression = findRaceMechanicsProgression(progressions, raceId);
    if (!mechanicsProgression?.entities) return null;

    const favoredClassEntity = mechanicsProgression.entities.find(
        e => e.appliesTo === EntityAppliesToType.FavoredClass && e.appliesToId !== null
    );

    return favoredClassEntity?.appliesToId ?? null;
}

/**
 * Extract level adjustment from race mechanics progression
 * LevelAdjustment uses value field (not appliesToId) as it's a literal numeric value
 */
export function extractLevelAdjustment(progressions: FeatureProgression[], raceId?: number): number | null {
    const mechanicsProgression = findRaceMechanicsProgression(progressions, raceId);
    if (!mechanicsProgression?.entities) return null;

    const levelAdjustmentEntity = mechanicsProgression.entities.find(
        e => e.appliesTo === EntityAppliesToType.LevelAdjustment && e.value !== null
    );

    return levelAdjustmentEntity?.value ?? null;
}

/**
 * Extract all race mechanics from feature progressions in one call
 */
export function extractRaceMechanics(progressions: FeatureProgression[], raceId?: number): RaceMechanics {
    const mechanicsProgression = findRaceMechanicsProgression(progressions, raceId);
    if (!mechanicsProgression?.entities) {
        return {
            sizeId: null,
            speed: null,
            favoredClassId: null,
            levelAdjustment: null,
        };
    }

    const entities = mechanicsProgression.entities;

    // Extract size ID (stored in appliesToId)
    const sizeEntity = entities.find(e => e.appliesTo === EntityAppliesToType.Size && e.appliesToId !== null);
    const sizeId = sizeEntity?.appliesToId ?? null;

    // Extract speed (stored in value, literal numeric value)
    const speedEntity = entities.find(e => e.appliesTo === EntityAppliesToType.Speed && e.value !== null);
    const speed = speedEntity?.value ?? null;

    // Extract favored class ID (stored in appliesToId)
    const favoredClassEntity = entities.find(
        e => e.appliesTo === EntityAppliesToType.FavoredClass && e.appliesToId !== null
    );
    const favoredClassId = favoredClassEntity?.appliesToId ?? null;

    // Extract level adjustment (stored in value, literal numeric value)
    const levelAdjustmentEntity = entities.find(
        e => e.appliesTo === EntityAppliesToType.LevelAdjustment && e.value !== null
    );
    const levelAdjustment = levelAdjustmentEntity?.value ?? null;

    return {
        sizeId,
        speed,
        favoredClassId,
        levelAdjustment,
    };
}

/**
 * Extract race mechanics from resolved progressions (filters by sourceType)
 * Useful for character calculations where we have resolved progressions
 */
export function extractRaceMechanicsFromResolved(
    resolvedProgressions: FeatureProgression[]
): RaceMechanics {
    // Filter to race progressions only
    const raceProgressions = resolvedProgressions.filter(
        p => p.sourceType === FeatureSourceType.Race
    );

    return extractRaceMechanics(raceProgressions);
}

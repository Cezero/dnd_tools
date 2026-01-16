import type { RaceMechanics } from '@/lib/feature-extraction/raceMechanicsExtractor';
import type { FeatureProgression } from '@shared/schema';
import { EntityAppliesToType, EntityType } from '@shared/static-data';

/**
 * Find the "race-mechanics" feature progression for a race
 */
export function findRaceMechanicsProgression(
    progressions: FeatureProgression[],
    raceId: number
): FeatureProgression | null {
    return progressions.find(p => {
        const isRaceMechanics = p.feature?.slug === 'race-mechanics';
        if (!isRaceMechanics) return false;

        // Check many-to-many relationship
        if (p.races?.some(r => r.raceId === raceId)) return true;

        return false;
    }) || null;
}

/**
 * Update a specific entity in a race mechanics progression
 * Creates the entity if it doesn't exist
 */
export function updateRaceMechanicsEntity(
    progression: FeatureProgression,
    field: 'sizeId' | 'speed' | 'favoredClassId' | 'levelAdjustment',
    value: number,
    progressions: FeatureProgression[],
    setProgressions: (p: FeatureProgression[]) => void
): void {
    const fieldToEntityType: Record<string, { appliesTo: EntityAppliesToType; useValue?: boolean; entityType?: EntityType }> = {
        sizeId: { appliesTo: EntityAppliesToType.Size },
        speed: { appliesTo: EntityAppliesToType.MovementSpeed, useValue: true, entityType: EntityType.Quantity },
        favoredClassId: { appliesTo: EntityAppliesToType.FavoredClass },
        levelAdjustment: { appliesTo: EntityAppliesToType.LevelAdjustment, useValue: true },
    };

    const entityConfig = fieldToEntityType[field];
    if (!entityConfig) return;

    // For value-based mechanics (speed, levelAdjustment): value is the actual value, appliesToId is null
    // For reference-based mechanics (sizeId, favoredClassId): appliesToId is the actual value, value is 0
    const isValueBased = entityConfig.useValue === true;

    // Find or create the entity
    const existingEntity = progression.entities?.find(e => e.appliesTo === entityConfig.appliesTo);

    const updatedProgressions = progressions.map(p => {
        if (p.id !== progression.id) return p;

        const updatedEntities = p.entities ? [...p.entities] : [];

        if (existingEntity) {
            // Update existing entity
            const entityIndex = updatedEntities.findIndex(e => e.id === existingEntity.id);
            if (entityIndex >= 0) {
                updatedEntities[entityIndex] = {
                    ...updatedEntities[entityIndex],
                    appliesToId: isValueBased ? null : value,
                    value: isValueBased ? value : 0,
                };
            }
        } else {
            // Create new entity
            // Speed uses EntityType.Quantity, others use EntityType.Other
            const entityType = entityConfig.entityType ?? EntityType.Other;
            updatedEntities.push({
                id: Date.now() + Math.random(), // Temporary ID
                progressionId: progression.id,
                type: entityType,
                appliesTo: entityConfig.appliesTo,
                appliesToId: isValueBased ? null : value,
                appliesToSubId: null,
                value: isValueBased ? value : 0,
                bonusType: null,
                groupingId: 0,
                displayInDetail: false,
                filterType: null,
                formulaParamsId: null,
            });
        }

        return {
            ...p,
            entities: updatedEntities,
        };
    });

    setProgressions(updatedProgressions);
}

/**
 * Sync mechanics to feature progressions
 * Creates or updates the "race-mechanics" progression with entities matching mechanics
 */
export function syncRaceMechanicsToProgressions(
    mechanics: Partial<RaceMechanics>,
    progressions: FeatureProgression[],
    raceId: number,
    setProgressions: (p: FeatureProgression[]) => void
): void {
    // Find or create race-mechanics progression
    let mechanicsProgression = findRaceMechanicsProgression(progressions, raceId);

    if (!mechanicsProgression) {
        // Create a placeholder progression (will be created on save)
        // For now, we'll need to handle this in the save handler
        return;
    }

    // Update each field that is provided
    if (mechanics.sizeId !== undefined && mechanics.sizeId !== null) {
        updateRaceMechanicsEntity(mechanicsProgression, 'sizeId', mechanics.sizeId, progressions, setProgressions);
        mechanicsProgression = findRaceMechanicsProgression(progressions, raceId);
        if (!mechanicsProgression) return;
    }

    if (mechanics.speed !== undefined && mechanics.speed !== null) {
        updateRaceMechanicsEntity(mechanicsProgression, 'speed', mechanics.speed, progressions, setProgressions);
        mechanicsProgression = findRaceMechanicsProgression(progressions, raceId);
        if (!mechanicsProgression) return;
    }

    if (mechanics.favoredClassId !== undefined && mechanics.favoredClassId !== null) {
        updateRaceMechanicsEntity(mechanicsProgression, 'favoredClassId', mechanics.favoredClassId, progressions, setProgressions);
        mechanicsProgression = findRaceMechanicsProgression(progressions, raceId);
        if (!mechanicsProgression) return;
    }

    if (mechanics.levelAdjustment !== undefined && mechanics.levelAdjustment !== null) {
        updateRaceMechanicsEntity(mechanicsProgression, 'levelAdjustment', mechanics.levelAdjustment, progressions, setProgressions);
    }
}

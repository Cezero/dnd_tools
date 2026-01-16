import type { ClassMechanics } from '@/lib/feature-extraction/classMechanicsExtractor';
import type { FeatureProgression } from '@shared/schema';
import { EntityAppliesToType, EntityType, SavingThrowId } from '@shared/static-data';

/**
 * Find the "class-mechanics" feature progression for a class
 */
export function findClassMechanicsProgression(
    progressions: FeatureProgression[],
    classId: number
): FeatureProgression | null {
    return progressions.find(p => {
        const isClassMechanics = p.feature?.slug === 'class-mechanics';
        if (!isClassMechanics) return false;

        // Check many-to-many relationship
        if (p.classes?.some(c => c.classId === classId)) return true;

        return false;
    }) || null;
}

/**
 * Update a specific entity in a class mechanics progression
 * Creates the entity if it doesn't exist
 */
export function updateClassMechanicsEntity(
    progression: FeatureProgression,
    field: 'hitDie' | 'skillPoints' | 'babProgression' | 'fortProgression' | 'refProgression' | 'willProgression',
    value: number,
    progressions: FeatureProgression[],
    setProgressions: (p: FeatureProgression[]) => void
): void {
    const fieldToEntityType: Record<string, { appliesTo: EntityAppliesToType; appliesToId?: number; useValue?: boolean }> = {
        hitDie: { appliesTo: EntityAppliesToType.HitDice },
        skillPoints: { appliesTo: EntityAppliesToType.SkillPoints, useValue: true },
        babProgression: { appliesTo: EntityAppliesToType.BaseAttackBonus },
        fortProgression: { appliesTo: EntityAppliesToType.SavingThrow, appliesToId: SavingThrowId.Fortitude },
        refProgression: { appliesTo: EntityAppliesToType.SavingThrow, appliesToId: SavingThrowId.Reflex },
        willProgression: { appliesTo: EntityAppliesToType.SavingThrow, appliesToId: SavingThrowId.Will },
    };

    const entityConfig = fieldToEntityType[field];
    if (!entityConfig) return;

    // For saving throws: appliesToId is the save type (Fortitude/Reflex/Will), appliesToSubId is the progression type
    // For value-based mechanics (skillPoints): value is the actual value, appliesToId is null
    // For reference-based mechanics (hitDie, babProgression): appliesToId is the actual value, value is 0
    const isSavingThrow = entityConfig.appliesToId !== undefined && !entityConfig.useValue;
    const isValueBased = entityConfig.useValue === true;
    const appliesToIdValue = isSavingThrow ? entityConfig.appliesToId : (isValueBased ? null : value);
    const appliesToSubIdValue = isSavingThrow ? value : null;
    const entityValue = isSavingThrow ? 0 : (isValueBased ? value : 0);

    // Find or create the entity
    const existingEntity = progression.entities?.find(
        e =>
            e.appliesTo === entityConfig.appliesTo &&
            (isSavingThrow ? e.appliesToId === entityConfig.appliesToId : true)
    );

    const updatedProgressions = progressions.map(p => {
        if (p.id !== progression.id) return p;

        const updatedEntities = p.entities ? [...p.entities] : [];

        if (existingEntity) {
            // Update existing entity
            const entityIndex = updatedEntities.findIndex(e => e.id === existingEntity.id);
            if (entityIndex >= 0) {
                updatedEntities[entityIndex] = {
                    ...updatedEntities[entityIndex],
                    appliesToId: appliesToIdValue,
                    appliesToSubId: appliesToSubIdValue,
                    value: entityValue,
                };
            }
        } else {
            // Create new entity
            updatedEntities.push({
                id: Date.now() + Math.random(), // Temporary ID
                progressionId: progression.id,
                type: EntityType.Other,
                appliesTo: entityConfig.appliesTo,
                appliesToId: appliesToIdValue,
                appliesToSubId: appliesToSubIdValue,
                value: entityValue,
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
 * Creates or updates the "class-mechanics" progression with entities matching mechanics
 */
export function syncClassMechanicsToProgressions(
    mechanics: Partial<ClassMechanics>,
    progressions: FeatureProgression[],
    classId: number,
    setProgressions: (p: FeatureProgression[]) => void
): void {
    // Find or create class-mechanics progression
    let mechanicsProgression = findClassMechanicsProgression(progressions, classId);

    if (!mechanicsProgression) {
        // Create a placeholder progression (will be created on save)
        // For now, we'll need to handle this in the save handler
        return;
    }

    // Update each field that is provided
    if (mechanics.hitDie !== undefined && mechanics.hitDie !== null) {
        updateClassMechanicsEntity(mechanicsProgression, 'hitDie', mechanics.hitDie, progressions, setProgressions);
        // Refresh mechanicsProgression reference
        mechanicsProgression = findClassMechanicsProgression(progressions, classId);
        if (!mechanicsProgression) return;
    }

    if (mechanics.skillPoints !== undefined && mechanics.skillPoints !== null) {
        updateClassMechanicsEntity(mechanicsProgression, 'skillPoints', mechanics.skillPoints, progressions, setProgressions);
        mechanicsProgression = findClassMechanicsProgression(progressions, classId);
        if (!mechanicsProgression) return;
    }

    if (mechanics.babProgression !== undefined && mechanics.babProgression !== null) {
        updateClassMechanicsEntity(mechanicsProgression, 'babProgression', mechanics.babProgression, progressions, setProgressions);
        mechanicsProgression = findClassMechanicsProgression(progressions, classId);
        if (!mechanicsProgression) return;
    }

    if (mechanics.fortProgression !== undefined && mechanics.fortProgression !== null) {
        updateClassMechanicsEntity(mechanicsProgression, 'fortProgression', mechanics.fortProgression, progressions, setProgressions);
        mechanicsProgression = findClassMechanicsProgression(progressions, classId);
        if (!mechanicsProgression) return;
    }

    if (mechanics.refProgression !== undefined && mechanics.refProgression !== null) {
        updateClassMechanicsEntity(mechanicsProgression, 'refProgression', mechanics.refProgression, progressions, setProgressions);
        mechanicsProgression = findClassMechanicsProgression(progressions, classId);
        if (!mechanicsProgression) return;
    }

    if (mechanics.willProgression !== undefined && mechanics.willProgression !== null) {
        updateClassMechanicsEntity(mechanicsProgression, 'willProgression', mechanics.willProgression, progressions, setProgressions);
    }
}

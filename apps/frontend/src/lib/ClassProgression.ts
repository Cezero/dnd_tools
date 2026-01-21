import { applyFeatureFormula } from '@/lib/character-calculation/utils/formulaApplier';
import type { CharacterWithAllDetailsResponse, FeatureWithRelations } from '@shared/schema';
import { EntityAppliesToType, EntityType, FeatureSourceType, SavingThrowId } from '@shared/static-data';

import type { ClassProgressionConfig, MinimalCharacterForFormula, ProgressionRow } from './types';

/**
 * Find BAB entity from feature features for a specific class level
 */
function findBABEntity(
    features: FeatureWithRelations[],
    level: number,
    classId?: number
) {
    for (const feature of features) {
        if (feature.sourceType !== FeatureSourceType.Class) continue;
        if (classId && !feature.classes?.some(c => c.classId === classId)) continue;
        if (feature.level > level) continue;

        const babEntity = feature.entities?.find(
            e => e.type === EntityType.Base && e.appliesTo === EntityAppliesToType.BaseAttackBonus
        );
        if (babEntity) {
            return { entity: babEntity, feature };
        }
    }
    return null;
}

/**
 * Find saving throw entity from feature features for a specific class level
 */
function findSaveEntity(
    features: FeatureWithRelations[],
    level: number,
    saveType: SavingThrowId,
    classId?: number
) {
    for (const feature of features) {
        if (feature.sourceType !== FeatureSourceType.Class) continue;
        if (classId && !feature.classes?.some(c => c.classId === classId)) continue;
        if (feature.level > level) continue;

        const saveEntity = feature.entities?.find(
            e => e.type === EntityType.Base &&
                e.appliesTo === EntityAppliesToType.SavingThrow &&
                e.appliesToId === saveType
        );
        if (saveEntity) {
            return { entity: saveEntity, feature };
        }
    }
    return null;
}

/**
 * Calculate BAB value for a level using feature features
 * For gestalt (multiple classes), finds the best BAB from all classes
 */
function calculateBABForLevel(
    features: FeatureWithRelations[],
    level: number,
    classId?: number
): string {
    // Create a minimal character object for formula calculation
    const mockCharacter = {
        abilityScores: [],
        advancements: [],
    } as MinimalCharacterForFormula as CharacterWithAllDetailsResponse;

    let maxBAB = 0;

    // If classId is specified, only use that class
    // Otherwise (gestalt), find the best BAB from all classes
    if (classId !== undefined) {
        const babData = findBABEntity(features, level, classId);
        if (babData) {
            const babValue = applyFeatureFormula(babData.entity, mockCharacter, level);
            if (babValue !== null && babValue !== undefined) {
                maxBAB = babValue;
            }
        }
    } else {
        // Gestalt: find all BAB entities and take the best
        for (const feature of features) {
            if (feature.sourceType !== FeatureSourceType.Class) continue;
            if (feature.level > level) continue;

            const babEntity = feature.entities?.find(
                e => e.type === EntityType.Base && e.appliesTo === EntityAppliesToType.BaseAttackBonus
            );
            if (babEntity) {
                const babValue = applyFeatureFormula(babEntity, mockCharacter, level);
                if (babValue !== null && babValue !== undefined) {
                    maxBAB = Math.max(maxBAB, babValue);
                }
            }
        }
    }

    // Format iterative BAB like +11/+6/+1 etc.
    if (maxBAB <= 0) return '+0';
    const attacks: number[] = [];
    let current = maxBAB;
    while (current > 0) {
        attacks.push(current);
        current -= 5;
    }
    return attacks.map(a => `+${a}`).join('/');
}

/**
 * Calculate saving throw value for a level using feature features
 * For gestalt (multiple classes), finds the best save from all classes
 */
function calculateSaveForLevel(
    features: FeatureWithRelations[],
    level: number,
    saveType: SavingThrowId,
    classId?: number
): number {
    // Create a minimal character object for formula calculation
    const mockCharacter = {
        abilityScores: [],
        advancements: [],
    } as MinimalCharacterForFormula as CharacterWithAllDetailsResponse;

    let maxSave = 0;

    // If classId is specified, only use that class
    // Otherwise (gestalt), find the best save from all classes
    if (classId !== undefined) {
        const saveData = findSaveEntity(features, level, saveType, classId);
        if (saveData) {
            const saveValue = applyFeatureFormula(saveData.entity, mockCharacter, level);
            if (saveValue !== null && saveValue !== undefined) {
                maxSave = saveValue;
            }
        }
    } else {
        // Gestalt: find all save entities and take the best
        for (const feature of features) {
            if (feature.sourceType !== FeatureSourceType.Class) continue;
            if (feature.level > level) continue;

            const saveEntity = feature.entities?.find(
                e => e.type === EntityType.Base &&
                    e.appliesTo === EntityAppliesToType.SavingThrow &&
                    e.appliesToId === saveType
            );
            if (saveEntity) {
                const saveValue = applyFeatureFormula(saveEntity, mockCharacter, level);
                if (saveValue !== null && saveValue !== undefined) {
                    maxSave = Math.max(maxSave, saveValue);
                }
            }
        }
    }

    return maxSave;
}

/**
 * Generates feature data for a class from level 1 to 20 using feature features
 */
export function generateClassProgression(config: ClassProgressionConfig): ProgressionRow[] {
    const feature: ProgressionRow[] = [];

    for (let level = 1; level <= 20; level++) {
        const row: ProgressionRow = {
            level,
            bab: calculateBABForLevel(config.features, level, config.classId),
            fort: calculateSaveForLevel(config.features, level, SavingThrowId.Fortitude, config.classId),
            ref: calculateSaveForLevel(config.features, level, SavingThrowId.Reflex, config.classId),
            will: calculateSaveForLevel(config.features, level, SavingThrowId.Will, config.classId),
        };

        // Add spellcasting data if available
        if (config.spellcastingProgression) {
            const spellProgression = config.spellcastingProgression.find(p => p.classLevel === level);
            if (spellProgression && spellProgression.slots) {
                const spells: { [spellLevel: number]: number } = {};
                spellProgression.slots.forEach(slot => {
                    spells[slot.spellLevel] = slot.slotsPerDay;
                });
                row.spells = spells;
            }
        }

        // Add spells known data if available
        if (config.spellsKnownProgression) {
            const spellsKnownProgression = config.spellsKnownProgression.find(p => p.classLevel === level);
            if (spellsKnownProgression && spellsKnownProgression.slots) {
                const spellsKnown: { [spellLevel: number]: number } = {};
                spellsKnownProgression.slots.forEach(slot => {
                    spellsKnown[slot.spellLevel] = slot.slotsPerDay;
                });
                row.spellsKnown = spellsKnown;
            }
        }

        feature.push(row);
    }

    return feature;
}

import { applyFeatureFormula } from '@/lib/character-calculation/utils/formulaApplier';
import { displayStrategyFactory } from '@/lib/formatters';
import type { CharacterWithAllDetailsResponse, FeatureWithRelations } from '@shared/schema';
import { DisplayType, EntityAppliesToType, EntityType, FeatureSourceType, SavingThrowId } from '@shared/static-data';

import { formatSignedModifier } from './formatters/modifier-utils';
import type { ClassProgressionConfig, MinimalCharacterForFormula, ProgressionRow } from './types';

/**
 * True when the feature is linked to classId, or has no class map (already fetched for this class).
 */
function featureMatchesClass(feature: FeatureWithRelations, classId?: number): boolean {
    if (classId === undefined) {
        return true;
    }
    if (!feature.classes || feature.classes.length === 0) {
        return true;
    }
    return feature.classes.some(c => c.classId === classId);
}

/**
 * Find BAB entity from class features for a specific class level.
 * Prefers a formula-backed entity over a placeholder.
 */
function findBABEntity(
    features: FeatureWithRelations[],
    level: number,
    classId?: number
) {
    const matches: Array<{ entity: NonNullable<FeatureWithRelations['entities']>[number]; feature: FeatureWithRelations }> = [];

    for (const feature of features) {
        if (feature.sourceType !== FeatureSourceType.Class) continue;
        if (!featureMatchesClass(feature, classId)) continue;
        if (feature.level > level) continue;
        if (feature.slug === 'class-mechanics') continue;

        const babEntity = feature.entities?.find(
            e => e.type === EntityType.Base && e.appliesTo === EntityAppliesToType.BaseAttackBonus
        );
        if (babEntity) {
            matches.push({ entity: babEntity, feature });
        }
    }

    return matches.find(m => m.entity.formulaParams) ?? matches[0] ?? null;
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
    const matches: Array<{ entity: NonNullable<FeatureWithRelations['entities']>[number]; feature: FeatureWithRelations }> = [];

    for (const feature of features) {
        if (feature.sourceType !== FeatureSourceType.Class) continue;
        if (!featureMatchesClass(feature, classId)) continue;
        if (feature.level > level) continue;
        if (feature.slug === 'class-mechanics') continue;

        const saveEntity = feature.entities?.find(
            e => e.type === EntityType.Base &&
                e.appliesTo === EntityAppliesToType.SavingThrow &&
                e.appliesToId === saveType
        );
        if (saveEntity) {
            matches.push({ entity: saveEntity, feature });
        }
    }

    return matches.find(m => m.entity.formulaParams) ?? matches[0] ?? null;
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
            fort: String(calculateSaveForLevel(config.features, level, SavingThrowId.Fortitude, config.classId)),
            ref: String(calculateSaveForLevel(config.features, level, SavingThrowId.Reflex, config.classId)),
            will: String(calculateSaveForLevel(config.features, level, SavingThrowId.Will, config.classId)),
        };

        // Add spellcasting data if available
        if (config.spellcastingProgression) {
            const spellProgression = config.spellcastingProgression.find(p => p.classLevel === level);
            if (spellProgression && spellProgression.slots) {
                const spells: { [spellLevel: number]: string } = {};
                spellProgression.slots.forEach(slot => {
                    spells[slot.spellLevel] = String(slot.slotsPerDay);
                });
                row.spells = spells;
            }
        }

        // Add spells known data if available
        if (config.spellsKnownProgression) {
            const spellsKnownProgression = config.spellsKnownProgression.find(p => p.classLevel === level);
            if (spellsKnownProgression && spellsKnownProgression.slots) {
                const spellsKnown: { [spellLevel: number]: string } = {};
                spellsKnownProgression.slots.forEach(slot => {
                    spellsKnown[slot.spellLevel] = String(slot.slotsPerDay);
                });
                row.spellsKnown = spellsKnown;
            }
        }

        feature.push(row);
    }

    return feature;
}

/** One row per class level 1..20; each row maps spell level 0..9 to formatted cell string (formatter owns placeholders e.g. '—'). */
export interface SpellSlotsGridFromDetail {
    rows: Array<Record<number, string>>;
}

// Deprecated: legacy helper used by the old SpellcastingTab. The unified class
// progression flow now uses buildClassProgressionFromDetail + ClassProgressionTable
// for both display and editing previews. This type is retained only for
// documentation references and should not be used in new code.

/**
 * Build a class progression table from feature formulas.
 *
 * BAB and saves come from generateClassProgression (applyFeatureFormula).
 * The Detail display strategy hides displayInDetail=false mechanics entities,
 * so it cannot drive those columns. Spell columns still overlay from Detail
 * until spellcasting is migrated the same way.
 */
export function buildClassProgressionFromDetail(
    features: FeatureWithRelations[],
    classId?: number
): ProgressionRow[] {
    const mechanicsRows = generateClassProgression({ features, classId });

    const strategy = displayStrategyFactory.createStrategy(DisplayType.Detail);
    const result = strategy.format(
        features,
        { includeNonTransitionLevels: true },
        false
    );

    return mechanicsRows.map((row) => {
        const levelEntry = result.levelEntries?.find(entry => entry.level === row.level);
        const components = (levelEntry?.items ?? []).flatMap(item => item.breakdown?.components ?? []);

        const getTotalBySourceType = (sourceType: EntityAppliesToType, sourceId?: number): number | null => {
            const matching = components.filter(component => {
                if (component.sourceType !== sourceType) {
                    return false;
                }
                if (sourceId !== undefined && component.sourceId !== sourceId) {
                    return false;
                }
                return true;
            });

            if (matching.length === 0) {
                return null;
            }

            const first = matching[0];
            if (typeof first.value === 'number') {
                return first.value;
            }
            const numeric = Number(first.value);
            return Number.isNaN(numeric) ? null : numeric;
        };

        const spells: { [spellLevel: number]: string } = {};
        for (let spellLevel = 0; spellLevel <= 9; spellLevel++) {
            const total = getTotalBySourceType(EntityAppliesToType.SpellcastingProgression, spellLevel);
            if (total !== null) {
                spells[spellLevel] = total > 0 ? String(total) : '—';
            }
        }

        const spellsKnown: { [spellLevel: number]: string } = {};
        for (let spellLevel = 0; spellLevel <= 9; spellLevel++) {
            const total = getTotalBySourceType(EntityAppliesToType.SpellsKnownProgression, spellLevel);
            if (total !== null) {
                spellsKnown[spellLevel] = total > 0 ? String(total) : '—';
            }
        }

        const built: ProgressionRow = {
            level: row.level,
            bab: row.bab,
            fort: formatSignedModifier(Number(row.fort)),
            ref: formatSignedModifier(Number(row.ref)),
            will: formatSignedModifier(Number(row.will)),
        };

        if (Object.keys(spells).length > 0) {
            built.spells = spells;
        }
        if (Object.keys(spellsKnown).length > 0) {
            built.spellsKnown = spellsKnown;
        }

        return built;
    });
}


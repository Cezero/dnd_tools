import { applyFeatureFormula } from '@/lib/character-calculation/utils/formulaApplier';
import type { CharacterWithAllDetailsResponse, FeatureWithRelations } from '@shared/schema';
import { EntityAppliesToType, EntityType, FeatureSourceType, SavingThrowId } from '@shared/static-data';

import { formatSignedModifier } from './formatters/modifier-utils';
import type { ClassProgressionConfig, MinimalCharacterForFormula, ProgressionRow } from './types';

const SPELL_LEVEL_MIN = 0;
const SPELL_LEVEL_MAX = 9;

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
 * True when appliesToId is a spell level (0–9), not a leftover SpellcastingProgression row id.
 */
function isSpellLevelId(appliesToId: number | null | undefined): appliesToId is number {
    return appliesToId !== null && appliesToId !== undefined
        && appliesToId >= SPELL_LEVEL_MIN && appliesToId <= SPELL_LEVEL_MAX;
}

/**
 * Find a spells-per-day or spells-known entity for one spell level.
 * Prefers a formula-backed entity; skips leftover table-FK entities (appliesToId outside 0–9).
 */
function findSpellTableEntity(
    features: FeatureWithRelations[],
    level: number,
    appliesTo: EntityAppliesToType,
    spellLevel: number,
    classId?: number
) {
    const matches: Array<{ entity: NonNullable<FeatureWithRelations['entities']>[number]; feature: FeatureWithRelations }> = [];

    for (const feature of features) {
        if (feature.sourceType !== FeatureSourceType.Class) continue;
        if (!featureMatchesClass(feature, classId)) continue;
        if (feature.level > level) continue;
        if (feature.slug === 'class-mechanics') continue;

        const spellEntity = feature.entities?.find(
            e => e.type === EntityType.Base &&
                e.appliesTo === appliesTo &&
                e.appliesToId === spellLevel &&
                isSpellLevelId(e.appliesToId)
        );
        if (spellEntity) {
            matches.push({ entity: spellEntity, feature });
        }
    }

    return matches.find(m => m.entity.formulaParams) ?? matches[0] ?? null;
}

/**
 * Evaluate spells-per-day or spells-known cells for one class level via feature formulas.
 */
function calculateSpellColumnsForLevel(
    features: FeatureWithRelations[],
    level: number,
    appliesTo: EntityAppliesToType,
    classId?: number
): { [spellLevel: number]: string } {
    const mockCharacter = {
        abilityScores: [],
        advancements: [],
    } as MinimalCharacterForFormula as CharacterWithAllDetailsResponse;

    const columns: { [spellLevel: number]: string } = {};

    for (let spellLevel = SPELL_LEVEL_MIN; spellLevel <= SPELL_LEVEL_MAX; spellLevel++) {
        const spellData = findSpellTableEntity(features, level, appliesTo, spellLevel, classId);
        if (!spellData) {
            continue;
        }

        const spellValue = applyFeatureFormula(spellData.entity, mockCharacter, level);
        if (spellValue === null || spellValue === undefined) {
            continue;
        }

        columns[spellLevel] = spellValue > 0 ? String(spellValue) : '—';
    }

    return columns;
}

/**
 * Slots per day for one class at one class level, from FeatureEntity formulas.
 * Used by the character view Spells tab (`getClassById` no longer returns table progression).
 */
export function getSpellsPerDayMap(
    features: FeatureWithRelations[],
    classLevel: number,
    classId: number
): Map<number, number> {
    const mockCharacter = {
        abilityScores: [],
        advancements: [],
    } as MinimalCharacterForFormula as CharacterWithAllDetailsResponse;

    const slots = new Map<number, number>();

    for (let spellLevel = SPELL_LEVEL_MIN; spellLevel <= SPELL_LEVEL_MAX; spellLevel += 1) {
        const spellData = findSpellTableEntity(
            features,
            classLevel,
            EntityAppliesToType.SpellcastingProgression,
            spellLevel,
            classId
        );
        if (!spellData) {
            continue;
        }

        const spellValue = applyFeatureFormula(spellData.entity, mockCharacter, classLevel);
        if (spellValue === null || spellValue === undefined || spellValue <= 0) {
            continue;
        }

        slots.set(spellLevel, spellValue);
    }

    return slots;
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
 * Generates class progression rows for levels 1–20.
 * BAB, saves, spells per day, and spells known come from feature formulas
 * (`applyFeatureFormula`). Legacy SpellcastingProgression tables are used only
 * when no formula-backed slot/known entities exist.
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

        const formulaSpells = calculateSpellColumnsForLevel(
            config.features,
            level,
            EntityAppliesToType.SpellcastingProgression,
            config.classId
        );
        if (Object.keys(formulaSpells).length > 0) {
            row.spells = formulaSpells;
        } else if (config.spellcastingProgression) {
            const spellProgression = config.spellcastingProgression.find(p => p.classLevel === level);
            if (spellProgression && spellProgression.slots) {
                const spells: { [spellLevel: number]: string } = {};
                spellProgression.slots.forEach(slot => {
                    spells[slot.spellLevel] = String(slot.slotsPerDay);
                });
                row.spells = spells;
            }
        }

        const formulaSpellsKnown = calculateSpellColumnsForLevel(
            config.features,
            level,
            EntityAppliesToType.SpellsKnownProgression,
            config.classId
        );
        if (Object.keys(formulaSpellsKnown).length > 0) {
            row.spellsKnown = formulaSpellsKnown;
        } else if (config.spellsKnownProgression) {
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
 * BAB, saves, spells per day, and spells known all come from
 * generateClassProgression (applyFeatureFormula). Shared table features use
 * displayInDetail = false so they stay out of the narrative feature list.
 */
export function buildClassProgressionFromDetail(
    features: FeatureWithRelations[],
    classId?: number
): ProgressionRow[] {
    const mechanicsRows = generateClassProgression({ features, classId });

    return mechanicsRows.map((row) => {
        const built: ProgressionRow = {
            level: row.level,
            bab: row.bab,
            fort: formatSignedModifier(Number(row.fort)),
            ref: formatSignedModifier(Number(row.ref)),
            will: formatSignedModifier(Number(row.will)),
        };

        if (row.spells && Object.keys(row.spells).length > 0) {
            built.spells = row.spells;
        }
        if (row.spellsKnown && Object.keys(row.spellsKnown).length > 0) {
            built.spellsKnown = row.spellsKnown;
        }

        return built;
    });
}


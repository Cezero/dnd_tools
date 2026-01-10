import type { FeatureProgression, CharacterWithAllDetailsResponse, CharacterAdvancementWithDetailsResponse } from '@shared/schema';
import { EntityType, EntityAppliesToType, FormulaId, GetAbilityModifier, FORMULA_MAP } from '@shared/static-data';

/**
 * Utility functions for spellbook-related logic on the frontend
 */

/**
 * Check if a class has a spellbook (uses spellbook spell management).
 * 
 * Determines if a class uses the spellbook system by checking for `EntityAppliesToType.SpellbookSpell`
 * entities in the resolved progressions. Spellbook classes (e.g., Wizard) track spells differently
 * from spellsKnown classes (e.g., Sorcerer, Bard).
 * 
 * @param resolvedProgressions - All resolved feature progressions for the character
 * @param classId - The class to check
 * @returns True if the class has spellbook spell entities, false otherwise
 */
export function hasSpellbook(
    resolvedProgressions: FeatureProgression[],
    classId: number
): boolean {
    for (const progression of resolvedProgressions) {
        if (progression.classId === classId && progression.entities) {
            for (const entity of progression.entities) {
                if (entity.type === EntityType.Choice &&
                    entity.appliesTo === EntityAppliesToType.SpellbookSpell) {
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * Check if a class has a feature grant for all 0th level spellbook spells.
 * 
 * Detects the feature-based 0th level spell grant for spellbook classes. This grant is represented
 * by an `EntityType.Other` + `EntityAppliesToType.SpellbookSpell` entity with `appliesToId: 0`
 * (0th level) and `appliesToSubId: -1` (all spells).
 * 
 * **Feature-Based Approach**:
 * Unlike other spell levels, 0th level spells for spellbook classes are not stored in `AdvancementSpell`
 * records. Instead, they are considered "known" if this grant feature exists. This is similar to how
 * proficiencies are handled.
 * 
 * @param resolvedProgressions - All resolved feature progressions for the character
 * @param classId - The class to check (filters class-specific progressions)
 * @returns True if the class has the 0th level spell grant feature, false otherwise
 */
export function hasZeroLevelSpellbookSpellsGrant(
    resolvedProgressions: FeatureProgression[],
    classId: number
): boolean {
    for (const progression of resolvedProgressions) {
        // Filter by classId if progression is class-specific
        if (progression.classId !== null && progression.classId !== classId) {
            continue;
        }

        if (!progression.entities) {
            continue;
        }

        for (const entity of progression.entities) {
            // Check if this entity grants all 0th level spellbook spells
            if (
                entity.type === EntityType.Other &&
                entity.appliesTo === EntityAppliesToType.SpellbookSpell &&
                entity.appliesToId === 0 &&
                (entity.appliesToSubId === -1 || entity.appliesToSubId === null)
            ) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Calculate total free spellbook spells available at a given character level.
 * 
 * Sums quantities from all spellbook spell progressions (class features and feats) that are active
 * at or before the specified level. Supports formula-based calculations for dynamic spell grants.
 * 
 * **Formula Support**:
 * - `ABILITY_BASED`: Base value + ability modifier (e.g., "3 + INT" for 1st level wizard)
 * - `STATIC_EVERY_N_LEVELS`: Fixed value every N levels (e.g., "2 spells per level" from 2nd level)
 * 
 * **Filtering**:
 * - Only includes progressions active at or before the specified level
 * - Filters by classId if progression is class-specific
 * - Only processes entities with `EntityType.Choice` and `EntityAppliesToType.SpellbookSpell`
 * 
 * TODO this shouldn't be duplicating formula, check if the information is available from the backend
 * or by using the formatting system (which resolves formulas)
 * 
 * @param resolvedProgressions - All resolved feature progressions for the character
 * @param characterLevel - The character level to calculate available spells for
 * @param classId - The class to calculate spells for (filters class-specific progressions)
 * @param character - Character data with ability scores (needed for ABILITY_BASED formulas)
 * @returns Total number of free spellbook spells available at the specified level
 */
export function getAvailableSpellbookSpells(
    resolvedProgressions: FeatureProgression[],
    characterLevel: number,
    classId: number,
    character: CharacterWithAllDetailsResponse
): number {
    let totalSpells = 0;

    for (const progression of resolvedProgressions) {
        // Only check progressions that are active at or before this level
        if (progression.level > characterLevel) {
            continue;
        }

        // Filter by classId if progression is class-specific
        if (progression.classId !== null && progression.classId !== classId) {
            continue;
        }

        if (!progression.entities) {
            continue;
        }

        for (const entity of progression.entities) {
            // Check if this entity is a spellbook spell choice
            if (entity.type !== EntityType.Choice ||
                entity.appliesTo !== EntityAppliesToType.SpellbookSpell) {
                continue;
            }

            // Calculate the value for this entity at the given level
            let entityValue = 0;

            if (entity.formulaParams) {
                // Calculate using formula
                const formulaDef = FORMULA_MAP[entity.formulaParams.formulaId];
                if (formulaDef) {
                    const formulaStartLevel = entity.formulaParams.formulaStartLevel ?? progression.level;

                    // Only calculate if level is at or after the formula start level
                    if (characterLevel >= formulaStartLevel) {
                        const params: Record<string, unknown> = {
                            level: characterLevel,
                            startLevel: progression.level,
                            scalingValue: entity.value ?? 0,
                            interval: entity.formulaParams.interval ?? 1,
                            formulaStartLevel: entity.formulaParams.formulaStartLevel,
                            context: {
                                character: {
                                    abilityScores: Object.fromEntries(
                                        character.abilityScores.map(a => [a.abilityId, a.value])
                                    )
                                }
                            }
                        };

                        // Add ability-specific params for ABILITY_BASED formula
                        if (entity.formulaParams.formulaId === FormulaId.ABILITY_BASED && entity.formulaParams.abilityId) {
                            params.abilityId = entity.formulaParams.abilityId;
                            params.baseValue = entity.value ?? 0;
                        }

                        try {
                            const calculatedValue = formulaDef.calculate(params);
                            if (typeof calculatedValue === 'number' && calculatedValue > 0) {
                                entityValue = calculatedValue;
                            }
                        } catch (error) {
                            console.error('Error calculating formula value:', error);
                        }
                    }
                }
            } else if (entity.value !== null && entity.value !== undefined) {
                // Static value - only count if level is at or after progression level
                if (characterLevel >= progression.level) {
                    entityValue = entity.value;
                }
            }

            totalSpells += entityValue;
        }
    }

    return totalSpells;
}

/**
 * Count spells in spellbook by spell level for a given class
 */
export function getSpellbookSpellsByLevel(
    advancements: CharacterAdvancementWithDetailsResponse[],
    classId: number
): Map<number, number> {
    const spellsByLevel = new Map<number, number>();

    // This would need to be called with actual spell data from the character
    // For now, return empty map - this is a placeholder
    // The actual implementation would query AdvancementSpell and group by spell level
    return spellsByLevel;
}

/**
 * Get the highest spell level a class can cast at a given class level.
 * 
 * Determines the maximum spell level that has spell slots available at the specified class level.
 * This is used for validation when scribing spells to ensure a character cannot scribe spells
 * beyond their casting capability.
 * 
 * @param spellcastingProgression - The class's spellcasting progression with slots per level
 * @param classLevel - The class level to check maximum castable spell level at
 * @returns The highest spell level with available slots at the given level, or 0 if no slots
 */
export function getMaxCastableSpellLevel(
    spellcastingProgression: Array<{
        classLevel: number;
        slots?: Array<{ spellLevel: number }>;
    }>,
    classLevel: number
): number {
    // Find the progression entry for this class level or the highest one below it
    let maxSpellLevel = 0;

    for (const progression of spellcastingProgression) {
        if (progression.classLevel <= classLevel && progression.slots) {
            for (const slot of progression.slots) {
                if (slot.spellLevel > maxSpellLevel) {
                    maxSpellLevel = slot.spellLevel;
                }
            }
        }
    }

    return maxSpellLevel;
}

/**
 * Count free grants (isFreeGrant: true) for a specific advancement.
 * 
 * Counts the number of spells that were granted for free during level-up for a specific
 * advancement. This is used to validate that a character hasn't exceeded their free
 * spell grant limit when adding spells during level-up.
 * 
 * @param advancement - The advancement to count free grants for (must include spellsKnown array)
 * @returns The number of free grant spells (isFreeGrant: true) for this advancement
 */
export function getFreeSpellsUsed(advancement: CharacterAdvancementWithDetailsResponse & {
    spellsKnown?: Array<{ isFreeGrant?: boolean }>;
}): number {
    if (!advancement.spellsKnown) {
        return 0;
    }
    return advancement.spellsKnown.filter(spell => spell.isFreeGrant === true).length;
}

/**
 * Calculate remaining free spells for an advancement.
 * 
 * Calculates how many free spell grants are still available for an advancement by subtracting
 * the number of free grants used from the total available free spells.
 * 
 * @param advancement - The advancement to calculate remaining spells for (must include spellsKnown array)
 * @param availableFreeSpells - Total available free spells at the advancement level
 * @returns The number of remaining free spells (never negative, minimum 0)
 */
export function getRemainingFreeSpells(
    advancement: CharacterAdvancementWithDetailsResponse & {
        spellsKnown?: Array<{ isFreeGrant?: boolean }>;
    },
    availableFreeSpells: number
): number {
    const used = getFreeSpellsUsed(advancement);
    return Math.max(0, availableFreeSpells - used);
}

/**
 * Get the highest spell level castable at a given character level
 */
export function getMaxCastableSpellLevelAtLevel(
    spellcastingProgression: Array<{
        classLevel: number;
        slots?: Array<{ spellLevel: number }>;
    }>,
    characterLevel: number
): number {
    return getMaxCastableSpellLevel(spellcastingProgression, characterLevel);
}

/**
 * Validate if a spell level can be scribed at a given advancement level.
 * 
 * Ensures that a character can only scribe spells up to the maximum castable spell level
 * at their advancement level. This validation applies to both free grants and ad-hoc
 * scribing - a 1st-level wizard cannot scribe a 3rd-level spell, regardless of source.
 * 
 * @param advancement - The advancement to validate against (provides the character level)
 * @param spellLevel - The spell level to validate
 * @param spellcastingProgression - The class's spellcasting progression with slots per level
 * @returns True if the spell level is castable at the advancement level, false otherwise
 */
export function canScribeSpellAtLevel(
    advancement: CharacterAdvancementWithDetailsResponse,
    spellLevel: number,
    spellcastingProgression: Array<{
        classLevel: number;
        slots?: Array<{ spellLevel: number }>;
    }>
): boolean {
    const maxCastableLevel = getMaxCastableSpellLevel(spellcastingProgression, advancement.level);
    return spellLevel <= maxCastableLevel;
}

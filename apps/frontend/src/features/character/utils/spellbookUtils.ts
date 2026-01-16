import type { FeatureProgression, CharacterAdvancementWithDetailsResponse } from '@shared/schema';
import { EntityType, EntityAppliesToType } from '@shared/static-data';

/**
 * Utility functions for spellbook-related logic on the frontend.
 * 
 * **Frontend-only utilities**: These functions are used for display logic and UI state management.
 * Spell selection data (spells list, availableFreeSpells) now comes from the resolved character
 * response (architecturally correct - data depends on resolved progressions).
 * 
 * **Backend validation**: Spell level validation is handled by the backend in syncSpellsKnown().
 * The frontend allows optimistic selection and the backend validates and rejects invalid spells.
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
        // Check if this progression applies to the class via many-to-many relationship
        const appliesToClass = progression.classes && progression.classes.some(c => c.classId === classId);
        if (appliesToClass && progression.entities) {
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
        // Filter by classId if progression is class-specific (check many-to-many relationship)
        if (progression.classes && progression.classes.length > 0) {
            const appliesToClass = progression.classes.some(c => c.classId === classId);
            if (!appliesToClass) {
                continue;
            }
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
 * Count free grants (isFreeGrant: true) for a specific advancement.
 * 
 * **Frontend-only utility**: Counts the number of spells that were granted for free during
 * level-up for a specific advancement. This is used for display purposes in the UI.
 * 
 * Note: This reads from the advancement's spellsKnown array. For counting from state,
 * use state.spellsKnown directly in components.
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

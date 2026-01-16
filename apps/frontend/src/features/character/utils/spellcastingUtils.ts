import type { CharacterAdvancementWithDetailsResponse, DnDClass } from '@shared/schema';

import type { SpellcastingClassInfo } from '../types';

/**
 * Utility functions for spellcasting-related logic on the frontend.
 * 
 * **Frontend-only utilities**: These functions are used for UI display and state management.
 * They operate on character data and class details to provide UI-specific information.
 */

/**
 * Get all spellcasting classes from character advancements.
 * 
 * **Frontend-only utility**: Used for displaying spellcasting classes in the UI.
 * 
 * @param advancements - Character advancement records
 * @param classDetailsMap - Map of class IDs to class details
 * @returns Array of spellcasting class info objects
 */
export function getSpellcastingClasses(
    advancements: CharacterAdvancementWithDetailsResponse[] | undefined,
    classDetailsMap: Map<number, DnDClass> | undefined
): SpellcastingClassInfo[] {
    if (!advancements || !classDetailsMap || classDetailsMap.size === 0) {
        return [];
    }

    const classMap = new Map<number, SpellcastingClassInfo>();

    for (const advancement of advancements) {
        const classData = classDetailsMap.get(advancement.classId);

        if (classData?.canCastSpells) {
            const existing = classMap.get(advancement.classId);
            if (existing) {
                existing.level += 1;
            } else {
                classMap.set(advancement.classId, {
                    classId: advancement.classId,
                    class: classData,
                    level: 1
                });
            }
        }

        if (advancement.secondaryClassId) {
            const secondaryClassData = classDetailsMap.get(advancement.secondaryClassId);

            if (secondaryClassData?.canCastSpells) {
                const existing = classMap.get(advancement.secondaryClassId);
                if (existing) {
                    existing.level += 1;
                } else {
                    classMap.set(advancement.secondaryClassId, {
                        classId: advancement.secondaryClassId,
                        class: secondaryClassData,
                        level: 1
                    });
                }
            }
        }
    }

    return Array.from(classMap.values());
}

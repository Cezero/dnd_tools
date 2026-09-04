import type { CharacterAdvancementWithDetailsResponse, DnDClass, FeatureWithRelations } from '@shared/schema';
import { EntityAppliesToType, FeatureSourceType } from '@shared/static-data';

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

/**
 * Divine prepared casters (Cleric, Druid, Paladin, Ranger, and similar) know
 * every spell on their class list up to their current maximum spell level.
 * `isDivine` is the class-authoring flag; `spellsKnown` excludes divine
 * spontaneous classes (e.g. Favored Soul).
 */
export function knowsFullClassSpellList(spellClass: Pick<DnDClass, 'isDivine' | 'spellsKnown'>): boolean {
    return (spellClass.isDivine ?? false) && !spellClass.spellsKnown;
}

/**
 * Whether a spell row belongs on the character spell sheet / Spells tab.
 *
 * Divine prepared casters include the full class list (optionally capped to
 * castable levels). Spontaneous casters include all API results (already known).
 * Spellbook casters include `isKnown` spells plus 0-level feature grants.
 */
export function shouldIncludeSpellOnSheet(
    spellClass: Pick<DnDClass, 'isDivine' | 'spellsKnown'>,
    options: {
        isKnown: boolean;
        classSpellLevel: number | null;
        hasZeroLevelGrant: boolean;
        castableLevels?: Map<number, number> | Set<number>;
    }
): boolean {
    if (knowsFullClassSpellList(spellClass)) {
        if (options.classSpellLevel === null) {
            return false;
        }
        if (options.castableLevels && !options.castableLevels.has(options.classSpellLevel)) {
            return false;
        }
        return true;
    }

    if (spellClass.spellsKnown) {
        return true;
    }

    if (options.isKnown) {
        return true;
    }

    return options.classSpellLevel === 0 && options.hasZeroLevelGrant;
}

/**
 * Casting ability for a class from resolved features.
 * Typically lives on the class Spells feature, not the first level-1 feature
 * (Druid has many L1 features; CastingAbility is on "Spells").
 */
export function getCastingAbilityId(
    resolvedProgressions: FeatureWithRelations[] | undefined,
    classId: number
): number | null {
    if (!resolvedProgressions) {
        return null;
    }

    const classProgressions = resolvedProgressions
        .filter(
            p => p.sourceType === FeatureSourceType.Class &&
                p.classes?.some(c => c.classId === classId)
        )
        .sort((a, b) => a.level - b.level);

    for (const feature of classProgressions) {
        const castingAbilityEntity = feature.entities?.find(
            e => e.appliesTo === EntityAppliesToType.CastingAbility
        );
        if (castingAbilityEntity?.appliesToId) {
            return castingAbilityEntity.appliesToId;
        }
    }

    return null;
}

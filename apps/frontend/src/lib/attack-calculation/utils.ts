import { extractBABProgression } from '@/lib/feature-extraction/classMechanicsExtractor';
import type { CharacterWithAllDetailsResponse, DnDClass, FeatureProgression } from '@shared/schema';
import {
    WEAPON_TYPE_ENUM,
    SizeId,
    GetAbilityModifier,
    FeatureSourceType,
    ProgressionType,
    EntityAppliesToType,
    EntityType,
} from '@shared/static-data';
import { getBABProgression } from '@shared/utils';

import { extractProficiencies } from './proficiencies';

/**
 * Check if character is proficient with a weapon
 * Uses resolved progressions - no backend calls needed
 */
export function isProficientWithWeapon(
    resolvedProgressions: FeatureProgression[],
    weapon: { category: number },
    baseItemId: number
): boolean {
    // Use public extractProficiencies function
    const proficiencies = extractProficiencies(resolvedProgressions);

    // Check weapon category proficiency
    if (proficiencies.weaponCategories.includes(weapon.category)) {
        return true;
    }

    // Check specific item proficiency
    if (proficiencies.itemIds.includes(baseItemId)) {
        return true;
    }

    return false;
}

/**
 * Check if character is a monk
 */
export function isMonk(character: CharacterWithAllDetailsResponse): boolean {
    // Check if any advancement has a class with "monk" in the name
    // Advancements don't include class details, so we check by classId
    // This is a simplified check - in practice you'd want to check the actual class name from classDetailsMap
    // For now, we'll rely on the monk unarmed damage check in the calculation itself
    return false; // Will be determined by presence of monk unarmed damage replacement entities
}

/**
 * Check if weapon is light
 */
export function isLightWeapon(weapon: { type: number }): boolean {
    return weapon.type === WEAPON_TYPE_ENUM.LightMeleeWeapon;
}

/**
 * Check if weapon is two-handed
 */
export function isTwoHandedWeapon(weapon: { type: number }): boolean {
    return weapon.type === WEAPON_TYPE_ENUM.TwoHandedMeleeWeapon;
}

/**
 * Get character's base attack bonus (first value only)
 * 
 * Uses pre-resolved formula values from backend when available (resolvedFormulaValues map).
 * Falls back to extracting ProgressionType and using getBABProgression for backward compatibility.
 * 
 * For gestalt characters, the backend filters progressions to include only the best BAB,
 * so we should use the character's total level with the single best progression.
 * For non-gestalt multiclass characters, we sum BAB from all classes.
 */
export function getCharacterBAB(
    character: CharacterWithAllDetailsResponse,
    classDetailsMap: Map<number, DnDClass>,
    resolvedProgressions?: FeatureProgression[],
    resolvedFormulaValues?: Record<string, number>
): number {
    // Try to use pre-resolved values first
    if (resolvedFormulaValues) {
        const bab = resolvedFormulaValues['bab'];
        if (bab !== undefined) {
            return bab;
        }
    }

    // Fallback to old method for backward compatibility
    // Check if character is gestalt
    const isGestalt = character.isGestalt || character.advancements.some(adv => adv.secondaryClassId !== null && adv.secondaryClassId !== 0);

    if (isGestalt) {
        // For gestalt, backend has already filtered to include only the best BAB progression
        // Use total character level with the best progression from resolved progressions
        const totalLevel = character.advancements.length;

        if (resolvedProgressions && resolvedProgressions.length > 0) {
            // Find the best BAB progression from resolved progressions
            // For gestalt, filter by sourceType and EntityType instead of feature slug
            const classProgressions = resolvedProgressions.filter(p =>
                p.sourceType === FeatureSourceType.Class &&
                p.entities?.some(e =>
                    e.type === EntityType.Base &&
                    e.appliesTo === EntityAppliesToType.BaseAttackBonus
                )
            );

            if (classProgressions.length > 0) {
                // Extract BAB from class progressions (should be the merged/best one)
                const babProgression = extractBABProgression(classProgressions);
                if (babProgression !== null && babProgression !== undefined) {
                    const babString = getBABProgression(totalLevel, babProgression as ProgressionType);
                    const match = babString.match(/\+(\d+)/);
                    if (match) {
                        return parseInt(match[1], 10);
                    }
                }
            }
        }

        // Fallback: return 0 if no progression found
        return 0;
    }

    // Non-gestalt multiclass: sum BAB from all classes
    const classLevelCounts = new Map<number, number>();
    for (const advancement of character.advancements) {
        const currentLevel = classLevelCounts.get(advancement.classId) ?? 0;
        classLevelCounts.set(advancement.classId, currentLevel + 1);
    }

    // Calculate total BAB by summing contributions from each class
    let totalBAB = 0;
    for (const [classId, level] of classLevelCounts.entries()) {
        const classDetails = classDetailsMap.get(classId);
        if (!classDetails) continue;

        // Extract BAB progression from resolved progressions (filter by sourceType and EntityType)
        let babProgression: number | null | undefined;
        if (resolvedProgressions) {
            const classProgressions = resolvedProgressions.filter(p =>
                p.sourceType === FeatureSourceType.Class &&
                p.classes?.some(c => c.classId === classId) &&
                p.entities?.some(e =>
                    e.type === EntityType.Base &&
                    e.appliesTo === EntityAppliesToType.BaseAttackBonus
                )
            );
            babProgression = extractBABProgression(classProgressions, classId);
        }

        if (babProgression !== undefined && babProgression !== null) {
            const babString = getBABProgression(level, babProgression as ProgressionType);
            const match = babString.match(/\+(\d+)/);
            if (match) {
                totalBAB += parseInt(match[1], 10);
            }
        }
    }

    return totalBAB;
}

/**
 * Get ability modifier from character
 */
export function getAbilityModifier(
    character: CharacterWithAllDetailsResponse,
    abilityId: number
): number {
    const abilityScore = character.abilityScores.find(a => a.abilityId === abilityId);
    const score = abilityScore?.value ?? 10;
    return GetAbilityModifier(score);
}

/**
 * Get character size ID
 */
export function getCharacterSizeId(character: CharacterWithAllDetailsResponse): number {
    // CharacterWithAllDetailsResponse includes race with id and name, but sizeId might not be included
    // We'll need to get it from the race data or use a default
    // For now, default to Medium - this should be passed in or looked up from race data
    return SizeId.Medium; // TODO: Get actual size from race data if available
}

/**
 * Format damage type string
 * Returns abbreviations: B (Bludgeoning), P (Piercing), S (Slashing)
 */
export function formatDamageType(damageType: string | null): string {
    if (!damageType) return '';

    // Damage type can be "2", "2|3", "1&2", etc.
    // Parse and format
    const parts = damageType.split(/[|&]/);
    const typeAbbrevs: string[] = [];

    for (const part of parts) {
        const typeId = parseInt(part.trim(), 10);
        // Map type IDs to abbreviations
        switch (typeId) {
            case 1: typeAbbrevs.push('B'); break; // Bludgeoning
            case 2: typeAbbrevs.push('P'); break; // Piercing
            case 3: typeAbbrevs.push('S'); break; // Slashing
            default: typeAbbrevs.push(`T${typeId}`);
        }
    }

    if (damageType.includes('&')) {
        return typeAbbrevs.join('&');
    } else if (damageType.includes('|')) {
        return typeAbbrevs.join('/');
    }

    return typeAbbrevs[0] || '';
}

/**
 * Format weapon range string
 * Adds " ft." suffix if not already present
 */
export function formatRange(range: string | null): string | null {
    if (!range) return null;

    // Check if range already includes "ft." or "ft"
    if (range.includes('ft.') || range.includes('ft')) {
        return range;
    }

    return `${range} ft.`;
}


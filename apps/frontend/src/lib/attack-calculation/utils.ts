import type { CharacterWithAllDetailsResponse, DnDClass } from '@shared/schema';
import type { FeatureProgression } from '@shared/schema';
import {
    WEAPON_TYPE_ENUM,
    SizeId,
    GetAbilityModifier,
    AbilityId,
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
 */
export function getCharacterBAB(
    character: CharacterWithAllDetailsResponse,
    classDetailsMap: Map<number, DnDClass>
): number {
    // Calculate class levels
    const classLevelCounts = new Map<number, number>();
    for (const advancement of character.advancements) {
        const currentLevel = classLevelCounts.get(advancement.classId) ?? 0;
        classLevelCounts.set(advancement.classId, currentLevel + 1);
        
        if (advancement.secondaryClassId) {
            const secondaryLevel = classLevelCounts.get(advancement.secondaryClassId) ?? 0;
            classLevelCounts.set(advancement.secondaryClassId, secondaryLevel + 1);
        }
    }

    // Calculate total BAB
    let totalBAB = 0;
    for (const [classId, level] of classLevelCounts.entries()) {
        const classDetails = classDetailsMap.get(classId);
        if (classDetails?.babProgression !== undefined) {
            const babString = getBABProgression(level, classDetails.babProgression);
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


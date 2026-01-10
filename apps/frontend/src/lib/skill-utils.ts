import { getSkillSelectFull } from '@/services/cache';
import type { SkillCacheEntry, SkillSubtypeCacheEntry } from '@shared/schema';

/**
 * Check if a skill uses predefined subtypes (skillSubId)
 * Skills with subtypes include Craft and Knowledge
 * @param skillId - The skill ID to check
 * @returns true if the skill uses predefined subtypes
 */
export function hasSubtypes(skillId: number): boolean {
    const skills = getSkillSelectFull();
    const skill = skills.find(s => s.id === skillId);
    return skill?.hasSubtypes ?? false;
}

/**
 * Check if a skill uses custom subtypes (customSubtype string)
 * Skills with custom subtypes include Perform and Profession
 * @param skillId - The skill ID to check
 * @returns true if the skill uses custom subtypes
 */
export function usesCustomSubtype(skillId: number): boolean {
    const skills = getSkillSelectFull();
    const skill = skills.find(s => s.id === skillId);
    return skill?.usesCustomSubtype ?? false;
}

/**
 * Check if a skill has no maximum rank limit
 * Skills with no max ranks include Speak Language
 * @param skillId - The skill ID to check
 * @returns true if the skill has no maximum rank limit
 */
export function hasNoMaxRanks(skillId: number): boolean {
    const skills = getSkillSelectFull();
    const skill = skills.find(s => s.id === skillId);
    return skill?.hasNoMaxRanks ?? false;
}

/**
 * Check if a skill has double armor check penalty
 * Skills with double armor penalty include Swim
 * @param skillId - The skill ID to check
 * @returns true if the skill has double armor check penalty
 */
export function hasDoubleArmorPenalty(skillId: number): boolean {
    const skills = getSkillSelectFull();
    const skill = skills.find(s => s.id === skillId);
    return skill?.doubleArmorPenalty ?? false;
}

/**
 * Get all subtypes for a skill from the cache
 * Returns subtypes for skills that use predefined subtypes (Craft, Knowledge)
 * @param skillId - The skill ID to get subtypes for
 * @returns Array of skill subtypes, or empty array if skill has no subtypes
 */
export function getSkillSubtypes(skillId: number): SkillSubtypeCacheEntry[] {
    const skills = getSkillSelectFull();
    const skill = skills.find(s => s.id === skillId);
    return (skill?.subtypes ?? []) as SkillSubtypeCacheEntry[];
}

/**
 * Get the name of a skill subtype from the cache
 * @param skillId - The ID of the parent skill
 * @param subtypeId - The ID of the skill subtype
 * @returns The name of the subtype, or an empty string if not found
 */
export function getSkillSubtypeName(skillId: number, subtypeId: number): string {
    const subtypes = getSkillSubtypes(skillId);
    return subtypes.find(st => st.id === subtypeId)?.name || '';
}

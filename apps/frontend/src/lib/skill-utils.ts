import { getSkillSelectFull } from '@/services/cache';
import type { SkillCacheEntry, SkillSubtypeCacheEntry } from '@shared/schema';

/**
 * Check if a skill is a feature-linked analog (class level + ability, no skill points).
 * Examples: Wild Empathy, Bardic Knowledge.
 * @param skillId - The skill ID to check
 * @returns true if the skill is analog
 */
export function isAnalogSkill(skillId: number): boolean {
    const skills = getSkillSelectFull();
    const skill = skills.find(s => s.id === skillId);
    return skill?.isAnalog ?? false;
}

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

/**
 * Normalize a custom subtype for identity matching (trim + case-insensitive).
 */
export function normalizeCustomSubtypeKey(customSubtype: string | null | undefined): string {
    if (customSubtype == null || customSubtype.trim() === '') {
        return 'null';
    }
    return customSubtype.trim().toLowerCase();
}

/**
 * Identity key for a skill entry: skill + subtype ID + case-insensitive custom subtype.
 */
export function skillRankIdentityKey(
    skillId: number,
    skillSubId: number | null | undefined,
    customSubtype: string | null | undefined
): string {
    return `${skillId}|${skillSubId ?? 'null'}|${normalizeCustomSubtypeKey(customSubtype)}`;
}

/**
 * Prefer an existing custom-subtype casing when the typed value matches case-insensitively.
 */
export function resolveCustomSubtypeCasing(
    input: string,
    existing: Array<string | null | undefined>
): string {
    const trimmed = input.trim();
    const match = existing.find((value) => (
        value != null && value.trim().toLowerCase() === trimmed.toLowerCase()
    ));
    return match && match.trim() !== '' ? match : trimmed;
}

/**
 * Display name for a skill including Craft/Knowledge or Profession/Perform subtype.
 */
export function formatSkillDisplayName(
    skillId: number,
    skillSubId: number | null | undefined,
    customSubtype: string | null | undefined
): string {
    const skills = getSkillSelectFull();
    const skill = skills.find((entry) => entry.id === skillId);
    const baseName = skill?.name ?? `Skill ${skillId}`;
    if (hasSubtypes(skillId) && skillSubId) {
        const subtypeName = getSkillSubtypeName(skillId, skillSubId);
        if (subtypeName) {
            return `${baseName} (${subtypeName})`;
        }
    }
    if (usesCustomSubtype(skillId) && customSubtype && customSubtype !== '__placeholder__') {
        return `${baseName} (${customSubtype})`;
    }
    return baseName;
}

/**
 * Features & Feats title for a bonus-rank grant, e.g. `Profession (Sailor) Bonus Ranks: 2`.
 */
export function formatBonusSkillRankTitle(
    skillId: number,
    skillSubId: number | null | undefined,
    customSubtype: string | null | undefined,
    ranks: number
): string {
    return `${formatSkillDisplayName(skillId, skillSubId, customSubtype)} Bonus Ranks: ${ranks}`;
}

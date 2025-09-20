/**
 * Numeric ID mapping system for composite string keys
 * This allows us to use numeric values for SelectOption while maintaining
 * the ability to represent complex hierarchical data structures.
 */

export const NumericIdMapping = {
    // Regular skills: 1000 + skillId
    getSkillId: (skillId: number): number => 1000 + skillId,

    // Skill subtypes: 10000 + skillId * 1000 + subtypeId  
    getSubtypeId: (skillId: number, subtypeId: number): number => 10000 + skillId * 1000 + subtypeId,

    // Group headers (non-selectable): 20000 + skillId
    getGroupId: (skillId: number): number => 20000 + skillId,

    // Parse numeric ID back to original components
    parseId: (numericId: number): { skillId: number; subtypeId: number | null; isSubtype: boolean; isGroup: boolean } | null => {
        if (numericId >= 20000) {
            // Group header
            return {
                skillId: numericId - 20000,
                subtypeId: null,
                isSubtype: false,
                isGroup: true
            };
        } else if (numericId >= 10000) {
            // Subtype
            const skillId = Math.floor((numericId - 10000) / 1000);
            const subtypeId = (numericId - 10000) % 1000;
            return {
                skillId,
                subtypeId,
                isSubtype: true,
                isGroup: false
            };
        } else if (numericId >= 1000) {
            // Regular skill
            return {
                skillId: numericId - 1000,
                subtypeId: null,
                isSubtype: false,
                isGroup: false
            };
        }
        return null;
    }
};

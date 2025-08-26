import type { CharacterWithAllDetailsResponse, CharacterAdvancementWithDetailsResponse } from '@shared/schema';
import { SKILL_MAP, ABILITY_MAP, GetAbilityModifier } from '@shared/static-data';

export interface AnalogSkillInfo {
    skillId: number;
    skillName: string;
    abilityId: number;
    abilityName: string;
    classLevels: number; // Total levels in classes that grant this skill
    abilityModifier: number;
    total: number;
    grantedByClasses: string[]; // Names of classes that grant this skill
}

export const AnalogSkillService = {
    /**
     * Get all analog skills that the character has access to
     */
    getCharacterAnalogSkills(character: CharacterWithAllDetailsResponse): AnalogSkillInfo[] {
        const analogSkills: AnalogSkillInfo[] = [];

        // Get all analog skills from the skill map
        const analogSkillIds = Object.values(SKILL_MAP)
            .filter(skill => skill.isAnalog)
            .map(skill => skill.id);

        // For each analog skill, check if the character has access to it
        for (const skillId of analogSkillIds) {
            const skill = SKILL_MAP[skillId];
            if (!skill) continue;

            // Check if any of the character's classes grant this skill
            const grantedByClasses: string[] = [];
            let totalClassLevels = 0;

            for (const advancement of character.advancements) {
                if (!advancement.classId) continue;

                // Check if this class grants the analog skill
                // This would typically be done by checking feature progressions
                // For now, we'll hardcode the Wild Empathy check
                if (skillId === 46) { // Wild Empathy
                    const className = this.getClassNameById(advancement.classId);
                    if (className === 'Druid' || className === 'Ranger') {
                        grantedByClasses.push(className);
                        totalClassLevels += advancement.level;
                    }
                }
            }

            // If the character has access to this analog skill, add it to the list
            if (grantedByClasses.length > 0) {
                const abilityScore = this.getCharacterAbilityScore(character, skill.abilityId);
                const abilityModifier = GetAbilityModifier(abilityScore);
                const total = totalClassLevels + abilityModifier;

                analogSkills.push({
                    skillId: skill.id,
                    skillName: skill.name,
                    abilityId: skill.abilityId,
                    abilityName: ABILITY_MAP[skill.abilityId]?.name || 'Unknown',
                    classLevels: totalClassLevels,
                    abilityModifier,
                    total,
                    grantedByClasses,
                });
            }
        }

        return analogSkills;
    },

    /**
     * Check if a skill is an analog skill
     */
    isAnalogSkill(skillId: number): boolean {
        const skill = SKILL_MAP[skillId];
        return skill?.isAnalog || false;
    },

    /**
     * Get analog skill info for a specific skill
     */
    getAnalogSkillInfo(character: CharacterWithAllDetailsResponse, skillId: number): AnalogSkillInfo | null {
        const analogSkills = this.getCharacterAnalogSkills(character);
        return analogSkills.find(skill => skill.skillId === skillId) || null;
    },

    /**
     * Get character's ability score for a given ability ID
     */
    getCharacterAbilityScore(character: CharacterWithAllDetailsResponse, abilityId: number): number {
        const abilityScore = character.abilityScores.find(abilityScore => abilityScore.abilityId === abilityId);
        return abilityScore?.value ?? 10; // Default to 10 if not set
    },

    /**
     * Get class name by ID (this would need to be implemented based on your class data structure)
     */
    getClassNameById(classId: number): string {
        // This is a simplified implementation
        // In a real implementation, you'd look this up from your class data
        const classMap: Record<number, string> = {
            4: 'Druid',
            8: 'Ranger',
            // Add other class mappings as needed
        };
        return classMap[classId] || 'Unknown';
    },

    /**
     * Calculate analog skill total for a specific skill
     */
    calculateAnalogSkillTotal(character: CharacterWithAllDetailsResponse, skillId: number): number | null {
        const analogSkillInfo = this.getAnalogSkillInfo(character, skillId);
        return analogSkillInfo ? analogSkillInfo.total : null;
    },
};

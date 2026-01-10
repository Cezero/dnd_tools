import type { QueryClient } from '@tanstack/react-query';

import { getSkillNameFromCache, getClassNameFromCache } from '@/services/cache/IdMapHelpers';
import type { SkillCacheResponse } from '@shared/schema';
import { ABILITY_MAP, GetAbilityModifier, Skill } from '@shared/static-data';

import type { AnalogSkillState, AnalogSkillInfo } from './types';

export const AnalogSkillService = {
    /**
     * Get all analog skills that the character has access to
     */
    getCharacterAnalogSkills(character: AnalogSkillState, queryClient?: QueryClient): AnalogSkillInfo[] {
        const analogSkills: AnalogSkillInfo[] = [];

        // Get all analog skills from the cache
        if (!queryClient) {
            console.warn('AnalogSkillService.getCharacterAnalogSkills: queryClient not provided');
            return [];
        }

        const skillsCache = queryClient.getQueryData<SkillCacheResponse>(['skills-cache']);
        if (!skillsCache?.results) {
            return [];
        }

        const allSkills = skillsCache.results;
        const analogSkillIds = allSkills
            .filter(skill => skill.isAnalog)
            .map(skill => skill.id);

        // For each analog skill, check if the character has access to it
        for (const skillId of analogSkillIds) {
            const skill = allSkills.find(s => s.id === skillId);
            if (!skill) continue;

            // Check if the character's class grants this skill
            const grantedByClasses: string[] = [];
            let totalClassLevels = 0;

            // Check primary class
            if (character.classId) {
                const className = getClassNameFromCache(queryClient, character.classId);
                if (className && skillId === Skill.WildEmpathy && (className === 'Druid' || className === 'Ranger')) {
                    grantedByClasses.push(className);
                    totalClassLevels += character.level;
                }
            }

            // Check secondary class for gestalt characters
            if (character.isGestalt && character.secondaryClassId) {
                const className = getClassNameFromCache(queryClient, character.secondaryClassId);
                if (className && skillId === Skill.WildEmpathy && (className === 'Druid' || className === 'Ranger')) {
                    grantedByClasses.push(className);
                    // For gestalt, we don't add levels twice since they're merged
                }
            }

            // If the character has access to this analog skill, add it to the list
            if (grantedByClasses.length > 0) {
                const abilityScore = this.getCharacterAbilityScore(character, skill.abilityId);
                const abilityModifier = GetAbilityModifier(abilityScore);
                const total = totalClassLevels + abilityModifier;
                const skillName = getSkillNameFromCache(queryClient, skill.id) || 'Unknown Skill';

                analogSkills.push({
                    skillId: skill.id,
                    skillName,
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
    isAnalogSkill(skillId: number, queryClient?: QueryClient): boolean {
        if (!queryClient) {
            console.warn('AnalogSkillService.isAnalogSkill: queryClient not provided');
            return false;
        }

        const skillsCache = queryClient.getQueryData<SkillCacheResponse>(['skills-cache']);
        if (!skillsCache?.results) {
            return false;
        }

        const allSkills = skillsCache.results;
        const skill = allSkills.find(s => s.id === skillId);
        return skill?.isAnalog || false;
    },

    /**
     * Get analog skill info for a specific skill
     */
    getAnalogSkillInfo(character: AnalogSkillState, skillId: number, queryClient?: QueryClient): AnalogSkillInfo | null {
        const analogSkills = this.getCharacterAnalogSkills(character, queryClient);
        return analogSkills.find(skill => skill.skillId === skillId) || null;
    },

    /**
     * Get character's ability score for a given ability ID
     */
    getCharacterAbilityScore(character: AnalogSkillState, abilityId: number): number {
        const abilityScore = character.abilityScores.find(abilityScore => abilityScore.abilityId === abilityId);
        return abilityScore?.value ?? 10; // Default to 10 if not set
    },

    /**
     * Calculate analog skill total for a specific skill
     */
    calculateAnalogSkillTotal(character: AnalogSkillState, skillId: number, queryClient?: QueryClient): number | null {
        const analogSkillInfo = this.getAnalogSkillInfo(character, skillId, queryClient);
        return analogSkillInfo ? analogSkillInfo.total : null;
    },
};

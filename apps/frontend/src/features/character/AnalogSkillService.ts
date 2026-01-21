import type { QueryClient } from '@tanstack/react-query';

import { getSkillNameFromCache, getClassNameFromCache } from '@/services/cache';
import type { SkillCacheResponse, FeatureWithRelations } from '@shared/schema';
import { ABILITY_MAP, GetAbilityModifier, EntityType, EntityAppliesToType } from '@shared/static-data';

import type { AnalogSkillState, AnalogSkillInfo } from './types';

export const AnalogSkillService = {
    /**
     * Get all analog skills that the character has access to
     * Uses resolved feature features to determine which analog skills are granted
     * @param character - Character state with class and ability information
     * @param resolvedProgressions - Resolved feature features from backend API
     * @param queryClient - Query client for cache access
     * @returns Array of analog skills the character has access to
     */
    getCharacterAnalogSkills(
        character: AnalogSkillState,
        resolvedProgressions: FeatureWithRelations[],
        queryClient?: QueryClient
    ): AnalogSkillInfo[] {
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

        // For each analog skill, check if the character has access to it through resolved features
        for (const skillId of analogSkillIds) {
            const skill = allSkills.find(s => s.id === skillId);
            if (!skill) continue;

            // Check if any resolved feature grants this analog skill
            // Analog skills are granted through entities with EntityType.Other and EntityAppliesToType.Skill
            const grantedByClasses: string[] = [];
            let totalClassLevels = 0;

            // Track which classes grant this skill and their levels
            const classLevelsMap = new Map<number, number>();

            for (const feature of resolvedProgressions) {
                if (!feature.entities) continue;

                for (const entity of feature.entities) {
                    // Check if this entity grants the analog skill
                    // Analog skills use EntityType.Other with EntityAppliesToType.Skill
                    if (
                        entity.type === EntityType.Other &&
                        entity.appliesTo === EntityAppliesToType.Skill &&
                        entity.appliesToId === skillId
                    ) {
                        // This feature grants the analog skill
                        // Get the class IDs from the feature (many-to-many relationship)
                        if (feature.classes && feature.classes.length > 0) {
                            for (const classLink of feature.classes) {
                                const classId = classLink.classId;
                                const currentLevel = classLevelsMap.get(classId) || 0;
                                classLevelsMap.set(classId, currentLevel + 1);

                                const className = getClassNameFromCache(classId);
                                if (className && !grantedByClasses.includes(className)) {
                                    grantedByClasses.push(className);
                                }
                            }
                        }
                    }
                }
            }

            // Calculate total class levels
            totalClassLevels = Array.from(classLevelsMap.values()).reduce((sum, level) => sum + level, 0);

            // If the character has access to this analog skill, add it to the list
            if (grantedByClasses.length > 0) {
                const abilityScore = this.getCharacterAbilityScore(character, skill.abilityId);
                const abilityModifier = GetAbilityModifier(abilityScore);
                const total = totalClassLevels + abilityModifier;
                const skillName = getSkillNameFromCache(skill.id) || 'Unknown Skill';

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
    getAnalogSkillInfo(
        character: AnalogSkillState,
        skillId: number,
        resolvedProgressions: FeatureWithRelations[],
        queryClient?: QueryClient
    ): AnalogSkillInfo | null {
        const analogSkills = this.getCharacterAnalogSkills(character, resolvedProgressions, queryClient);
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
    calculateAnalogSkillTotal(
        character: AnalogSkillState,
        skillId: number,
        resolvedProgressions: FeatureWithRelations[],
        queryClient?: QueryClient
    ): number | null {
        const analogSkillInfo = this.getAnalogSkillInfo(character, skillId, resolvedProgressions, queryClient);
        return analogSkillInfo ? analogSkillInfo.total : null;
    },
};

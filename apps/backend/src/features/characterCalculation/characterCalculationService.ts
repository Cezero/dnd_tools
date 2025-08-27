import { PrismaClient } from '@shared/prisma-client';
import type { CharacterWithAllDetailsResponse } from '@shared/schema';
import { ModifierAppliesToType } from '@shared/static-data';

const prisma = new PrismaClient();

export interface AnalogSkillCalculation {
    skillId: number;
    skillName: string;
    abilityId: number;
    abilityName: string;
    classLevels: number;
    abilityModifier: number;
    total: number;
    grantedByClasses: string[];
}

export interface CharacterCalculatedStats {
    analogSkills: AnalogSkillCalculation[];
    // Add other calculated stats as needed
}

export const characterCalculationService = {
    /**
     * Calculate all analog skills for a character
     */
    async getCharacterAnalogSkills(character: CharacterWithAllDetailsResponse): Promise<AnalogSkillCalculation[]> {
        const analogSkills: AnalogSkillCalculation[] = [];

        // Get all analog skills from the database
        const analogSkillIds = await prisma.skill.findMany({
            where: { isAnalog: true },
            select: { id: true }
        });

        // For each analog skill, check if the character has access to it
        for (const { id: skillId } of analogSkillIds) {
            const skill = await prisma.skill.findUnique({
                where: { id: skillId }
            });

            if (!skill) continue;

            // Check if any of the character's classes grant this skill
            const grantedByClasses: string[] = [];
            let totalClassLevels = 0;

            for (const advancement of character.advancements) {
                if (!advancement.classId) continue;

                // Check if this class grants the analog skill by looking at feature progressions
                const hasFeature = await this.classGrantsAnalogSkill(advancement.classId, skillId);

                if (hasFeature) {
                    const className = await this.getClassNameById(advancement.classId);
                    if (className) {
                        grantedByClasses.push(className);
                        totalClassLevels += advancement.level;
                    }
                }
            }

            // If the character has access to this analog skill, add it to the list
            if (grantedByClasses.length > 0) {
                const abilityScore = this.getCharacterAbilityScore(character, skill.abilityId);
                const abilityModifier = Math.floor((abilityScore - 10) / 2);
                const total = totalClassLevels + abilityModifier;

                analogSkills.push({
                    skillId: skill.id,
                    skillName: skill.name,
                    abilityId: skill.abilityId,
                    abilityName: await this.getAbilityNameById(skill.abilityId),
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
     * Check if a class grants a specific analog skill
     */
    async classGrantsAnalogSkill(classId: number, skillId: number): Promise<boolean> {
        const progression = await prisma.featureProgression.findFirst({
            where: {
                classId: classId,
                modifiers: {
                    some: {
                        appliesTo: ModifierAppliesToType.Skill,
                        appliesToId: skillId,
                    }
                }
            }
        });

        return !!progression;
    },

    /**
     * Get character's ability score for a given ability ID
     */
    getCharacterAbilityScore(character: CharacterWithAllDetailsResponse, abilityId: number): number {
        const abilityScore = character.abilityScores.find(attr => attr.abilityId === abilityId);
        return abilityScore?.value ?? 10; // Default to 10 if not set
    },

    /**
     * Get class name by ID
     */
    async getClassNameById(classId: number): Promise<string | null> {
        const classData = await prisma.class.findUnique({
            where: { id: classId },
            select: { name: true }
        });
        return classData?.name || null;
    },

    /**
     * Get ability name by ID
     */
    async getAbilityNameById(abilityId: number): Promise<string> {
        // This would typically come from a static data map
        // For now, we'll use a simple mapping
        const abilityMap: Record<number, string> = {
            1: 'Strength',
            2: 'Dexterity',
            3: 'Constitution',
            4: 'Intelligence',
            5: 'Wisdom',
            6: 'Charisma',
        };
        return abilityMap[abilityId] || 'Unknown';
    },

    /**
     * Calculate all character stats including analog skills
     */
    async calculateCharacterStats(character: CharacterWithAllDetailsResponse): Promise<CharacterCalculatedStats> {
        const analogSkills = await this.getCharacterAnalogSkills(character);

        return {
            analogSkills,
        };
    },

    /**
     * Get analog skill calculation for a specific skill
     */
    async getAnalogSkillCalculation(character: CharacterWithAllDetailsResponse, skillId: number): Promise<AnalogSkillCalculation | null> {
        const analogSkills = await this.getCharacterAnalogSkills(character);
        return analogSkills.find(skill => skill.skillId === skillId) || null;
    },
};

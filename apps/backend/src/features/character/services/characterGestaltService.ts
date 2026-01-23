import type { CharacterWithAllDetailsResponse } from '@shared/schema';
import {
    isGestaltCharacter,
    calculateGestaltCharacterStats,
    calculateGestaltStats,
    getGestaltClassesForLevel,
    validateGestaltClasses,
    type GestaltStats
} from '@shared/utils';

/**
 * Service for calculating gestalt character statistics.
 * 
 * Handles gestalt character validation and stat calculations for both
 * full character stats and individual advancement level stats.
 */
export const characterGestaltService = {
    async calculateCharacterStats(character: CharacterWithAllDetailsResponse): Promise<{
        isGestalt: boolean;
        totalLevel: number;
        stats: GestaltStats | null;
        errors: string[];
    }> {
        const errors: string[] = [];

        try {
            const isGestalt = isGestaltCharacter(character);
            const totalLevel = character.advancements.length;

            if (isGestalt) {
                // Validate all gestalt advancements
                for (const advancement of character.advancements) {
                    const { primary, secondary } = getGestaltClassesForLevel(advancement);
                    if (primary && secondary) {
                        const validation = validateGestaltClasses(primary, secondary);
                        if (!validation.isValid) {
                            errors.push(...validation.errors);
                        }
                    }
                }

                if (errors.length === 0) {
                    const stats = calculateGestaltCharacterStats(character);
                    return { isGestalt, totalLevel, stats, errors };
                }
            }

            return { isGestalt, totalLevel, stats: null, errors };
        } catch (error) {
            errors.push(`Failed to calculate character stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { isGestalt: false, totalLevel: 0, stats: null, errors };
        }
    },

    async calculateAdvancementStats(character: CharacterWithAllDetailsResponse, advancementLevel: number): Promise<{
        stats: GestaltStats | null;
        errors: string[];
    }> {
        const errors: string[] = [];

        try {
            const advancement = character.advancements.find(adv => adv.level === advancementLevel);
            if (!advancement) {
                errors.push(`No advancement found for level ${advancementLevel}`);
                return { stats: null, errors };
            }

            const isGestalt = isGestaltCharacter(character);
            if (isGestalt) {
                const { primary, secondary } = getGestaltClassesForLevel(advancement);
                if (primary && secondary) {
                    const validation = validateGestaltClasses(primary, secondary);
                    if (!validation.isValid) {
                        errors.push(...validation.errors);
                        return { stats: null, errors };
                    }

                    // Get ability scores for calculations
                    const conMod = character.abilityScores.find(score => score.abilityId === 1)?.value || 10; // Constitution
                    const intMod = character.abilityScores.find(score => score.abilityId === 2)?.value || 10; // Intelligence

                    const stats = calculateGestaltStats(advancement, primary, secondary, conMod, intMod);
                    return { stats, errors };
                }
            }

            return { stats: null, errors };
        } catch (error) {
            errors.push(`Failed to calculate advancement stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { stats: null, errors };
        }
    },
};

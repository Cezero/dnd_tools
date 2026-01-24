/**
 * Result row for an analog skill calculation.
 *
 * Returned by `characterCalculationService.getCharacterAnalogSkills()` and included
 * in `CharacterCalculatedStats`.
 */
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

/**
 * Aggregate calculated stats returned by `characterCalculationService.calculateCharacterStats()`.
 */
export interface CharacterCalculatedStats {
    analogSkills: AnalogSkillCalculation[];
    // Add other calculated stats as needed
}


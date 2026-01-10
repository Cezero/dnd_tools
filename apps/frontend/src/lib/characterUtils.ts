import type {
    CharacterWithAllDetailsResponse,
    DnDClass,
    Race,
    Feat,
    GetAllFeatsResponse,
    FeaturePrerequisite
} from '@shared/schema';
import { FeaturePrerequisiteType } from '@shared/static-data';
import { getBABProgression } from '@shared/utils';

export function meetsPrerequisites(
    feat: Feat,
    character: CharacterWithAllDetailsResponse,
    selectedClassDetails: DnDClass | null,
    selectedRaceDetails: Race | null,
    _allFeats: GetAllFeatsResponse,
    featurePrerequisites: FeaturePrerequisite[]
): boolean {
    // Use FeaturePrerequisite - required parameter
    const prerequisites = featurePrerequisites || [];

    if (!prerequisites || prerequisites.length === 0) {
        return true;
    }

    // Ensure character has the required data structures
    if (!character.advancements || character.advancements.length === 0) {
        return false;
    }

    return prerequisites.every(prereq => {
        switch (prereq.type) {
            case FeaturePrerequisiteType.AbilityScore: {
                if (!prereq.appliesToId || !prereq.minValue) return true;
                const abilityScore = character.abilityScores.find(ability => ability.abilityId === prereq.appliesToId);
                const abilityScoreValue = abilityScore?.value ?? 0;
                return abilityScoreValue >= prereq.minValue;
            }

            case FeaturePrerequisiteType.SkillRanks: {
                if (!prereq.appliesToId || !prereq.minValue) return true;
                const skillEntry = character.advancements[0]?.skills?.find(skill => skill.skillId === prereq.appliesToId);
                const skillRanks = skillEntry?.pointsSpent ?? 0;
                return skillRanks >= prereq.minValue;
            }

            case FeaturePrerequisiteType.Feat: {
                if (!prereq.appliesToId) return true;
                return character.advancements[0]?.feats?.some(feat => feat.featId === prereq.appliesToId) ?? false;
            }

            case FeaturePrerequisiteType.BaseAttackBonus: {
                if (!prereq.minValue) return true;
                const characterBAB = getCharacterBAB(character, selectedClassDetails);
                return characterBAB >= prereq.minValue;
            }

            case FeaturePrerequisiteType.Spellcasting: {
                if (!selectedClassDetails) return false;
                return selectedClassDetails.canCastSpells;
            }

            case FeaturePrerequisiteType.ClassLevel: {
                if (!prereq.minValue) return true;
                if (prereq.appliesToId === -1 || prereq.appliesToId === null) {
                    // Total character level
                    return character.advancements.length >= prereq.minValue;
                } else {
                    // Class-specific level
                    const classLevel = character.advancements
                        .filter(adv => adv.classId === prereq.appliesToId)
                        .length;
                    return classLevel >= prereq.minValue;
                }
            }

            case FeaturePrerequisiteType.Proficiency: {
                // This is a post-selection check, so we don't filter based on this
                return true;
            }

            case FeaturePrerequisiteType.Size: {
                if (!prereq.appliesToId || !selectedRaceDetails?.sizeId) return true;
                const characterSizeId = selectedRaceDetails.sizeId;
                const requiredSizeId = prereq.appliesToId;
                
                // minValue: 0 = exact, 1 = or larger, 2 = or smaller
                if (prereq.minValue === 0) {
                    return characterSizeId === requiredSizeId;
                } else if (prereq.minValue === 1) {
                    // or larger: character size must be >= required size (higher IDs = larger)
                    return characterSizeId >= requiredSizeId;
                } else if (prereq.minValue === 2) {
                    // or smaller: character size must be <= required size (lower IDs = smaller)
                    return characterSizeId <= requiredSizeId;
                }
                return true;
            }

            default:
                return true;
        }
    });
}

export function getCharacterBAB(
    character: CharacterWithAllDetailsResponse,
    selectedClassDetails: DnDClass | null
): number {
    if (!selectedClassDetails || selectedClassDetails.babProgression === undefined) return 0;

    try {
        const level = character.advancements.length;

        // Use the existing BAB calculation utility
        const babString = getBABProgression(level, selectedClassDetails.babProgression);

        // Extract the first BAB value from the string (e.g., "+1" -> 1, "+0" -> 0)
        const match = babString.match(/\+(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    } catch (error) {
        console.warn('Error calculating BAB for class:', selectedClassDetails.name, 'with progression:', selectedClassDetails.babProgression, error);
        return 0;
    }
}

export function getAbilityScore(
    character: CharacterWithAllDetailsResponse,
    abilityId: number
): number {
    const abilityScore = character.abilityScores.find(ability => ability.abilityId === abilityId);
    return abilityScore?.value ?? 0;
}

export function getSkillRanks(
    character: CharacterWithAllDetailsResponse,
    skillId: number
): number {
    const skillEntry = character.advancements[0]?.skills?.find(skill => skill.skillId === skillId);
    return skillEntry?.pointsSpent ?? 0;
} 

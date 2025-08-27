import type {
    CharacterWithAllDetailsResponse,
    DnDClass,
    Race,
    Feat,
    GetAllFeatsResponse
} from '@shared/schema';
import { FeatPrerequisiteType } from '@shared/static-data';

export function meetsPrerequisites(
    feat: Feat,
    character: CharacterWithAllDetailsResponse,
    selectedClassDetails: DnDClass | null,
    _selectedRaceDetails: Race | null,
    _allFeats: GetAllFeatsResponse
): boolean {
    if (!feat.prereqs || feat.prereqs.length === 0) {
        return true;
    }

    // Ensure character has the required data structures
    if (!character.advancements || character.advancements.length === 0) {
        return false;
    }

    return feat.prereqs.every(prereq => {
        switch (prereq.typeId) {
            case FeatPrerequisiteType.ABILITY: {
                if (!prereq.referenceId || !prereq.amount) return true;
                const abilityScore = character.abilityScores.find(ability => ability.abilityId === prereq.referenceId);
                const abilityScoreValue = abilityScore?.value ?? 0;
                return abilityScoreValue >= prereq.amount;
            }

            case FeatPrerequisiteType.SKILL: {
                if (!prereq.referenceId || !prereq.amount) return true;
                const skillEntry = character.advancements[0]?.skills?.find(skill => skill.skillId === prereq.referenceId);
                const skillRanks = skillEntry?.pointsSpent ?? 0;
                return skillRanks >= prereq.amount;
            }

            case FeatPrerequisiteType.FEAT: {
                if (!prereq.referenceId) return true;
                return character.advancements[0]?.feats?.some(feat => feat.featId === prereq.referenceId) ?? false;
            }

            case FeatPrerequisiteType.BAB: {
                if (!prereq.amount) return true;
                const characterBAB = getCharacterBAB(character, selectedClassDetails);
                return characterBAB >= prereq.amount;
            }

            case FeatPrerequisiteType.SPELLCASTING: {
                if (!selectedClassDetails) return false;
                return selectedClassDetails.canCastSpells;
            }

            case FeatPrerequisiteType.CLASSLEVEL: {
                if (!prereq.amount) return true;
                if (prereq.referenceId === -1) {
                    // Total character level
                    return character.advancements.length >= prereq.amount;
                } else {
                    // Class-specific level
                    const classLevel = character.advancements
                        .filter(adv => adv.classId === prereq.referenceId)
                        .length;
                    return classLevel >= prereq.amount;
                }
            }

            case FeatPrerequisiteType.PROFICIENCY: {
                // This is a post-selection check, so we don't filter based on this
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
    if (!selectedClassDetails || !selectedClassDetails.babProgression) return 0;

    try {
        // TODO: Fix BAB progression calculation when proper types are available
        return character.advancements.length;
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

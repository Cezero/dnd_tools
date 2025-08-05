import { FeatPrerequisiteType, getBABProgression, ProgressionType } from '@shared/static-data';
import type {
    CharacterWithAllDetailsResponse,
    GetClassResponse,
    GetRaceResponse,
    GetFeatResponse,
    GetAllFeatsResponse
} from '@shared/schema';



export function meetsPrerequisites(
    feat: GetFeatResponse,
    character: CharacterWithAllDetailsResponse,
    selectedClassDetails: GetClassResponse | null,
    selectedRaceDetails: GetRaceResponse | null,
    allFeats: GetAllFeatsResponse
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
            case FeatPrerequisiteType.ABILITY:
                if (!prereq.referenceId || !prereq.amount) return true;
                const abilityAttribute = character.attributes.find(attr => attr.attributeId === prereq.referenceId);
                const abilityScore = abilityAttribute?.value ?? 0;
                return abilityScore >= prereq.amount;

            case FeatPrerequisiteType.SKILL:
                if (!prereq.referenceId || !prereq.amount) return true;
                const skillEntry = character.advancements[0]?.skills?.find(skill => skill.skillId === prereq.referenceId);
                const skillRanks = skillEntry?.pointsSpent ?? 0;
                return skillRanks >= prereq.amount;

            case FeatPrerequisiteType.FEAT:
                if (!prereq.referenceId) return true;
                return character.advancements[0]?.feats?.some(feat => feat.featId === prereq.referenceId) ?? false;

            case FeatPrerequisiteType.BAB:
                if (!prereq.amount) return true;
                const characterBAB = getCharacterBAB(character, selectedClassDetails);
                return characterBAB >= prereq.amount;

            case FeatPrerequisiteType.SPELLCASTING:
                if (!selectedClassDetails) return false;
                return selectedClassDetails.spellcastingLevel > 0;

            case FeatPrerequisiteType.CLASSLEVEL:
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

            case FeatPrerequisiteType.CLASSFEATURE:
                if (!prereq.featureSlug) return true;
                return character.advancements.some(adv =>
                    adv.features.some(feature => feature.featureSlug === prereq.featureSlug)
                );

            case FeatPrerequisiteType.PROFICIENCY:
                // This is a post-selection check, so we don't filter based on this
                return true;

            default:
                return true;
        }
    });
}

export function getCharacterBAB(
    character: CharacterWithAllDetailsResponse,
    selectedClassDetails: GetClassResponse | null
): number {
    if (!selectedClassDetails || !selectedClassDetails.babProgression) return 0;

    try {
        const babProgression = getBABProgression(selectedClassDetails.babProgression);

        if (babProgression.type === ProgressionType.FULL) {
            return character.advancements.length;
        } else if (babProgression.type === ProgressionType.THREE_QUARTERS) {
            return Math.floor(character.advancements.length * 0.75);
        } else if (babProgression.type === ProgressionType.HALF) {
            return Math.floor(character.advancements.length * 0.5);
        }

        return 0;
    } catch (error) {
        console.warn('Error calculating BAB for class:', selectedClassDetails.name, 'with progression:', selectedClassDetails.babProgression, error);
        return 0;
    }
}

export function getAbilityScore(
    character: CharacterWithAllDetailsResponse,
    abilityId: number
): number {
    const attribute = character.attributes.find(attr => attr.attributeId === abilityId);
    return attribute?.value ?? 0;
}

export function getSkillRanks(
    character: CharacterWithAllDetailsResponse,
    skillId: number
): number {
    const skillEntry = character.advancements[0]?.skills?.find(skill => skill.skillId === skillId);
    return skillEntry?.pointsSpent ?? 0;
} 

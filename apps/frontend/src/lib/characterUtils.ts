import type {
    CharacterWithAllDetailsResponse,
    DnDClass,
    Race,
    Feat,
    GetAllFeatsResponse,
    FeaturePrerequisite
} from '@shared/schema';
import { FeaturePrerequisiteType, FeatPrerequisiteType } from '@shared/static-data';
import { getBABProgression } from '@shared/utils';

export function meetsPrerequisites(
    feat: Feat,
    character: CharacterWithAllDetailsResponse,
    selectedClassDetails: DnDClass | null,
    selectedRaceDetails: Race | null,
    _allFeats: GetAllFeatsResponse,
    featurePrerequisites?: FeaturePrerequisite[]
): boolean {
    // Use FeaturePrerequisite if provided, otherwise fall back to feat.prereqs for backward compatibility
    const prerequisites = featurePrerequisites || (feat.prereqs ? mapFeatPrereqsToFeaturePrereqs(feat.prereqs) : []);

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

/**
 * Helper function to map FeatPrerequisiteMap to FeaturePrerequisite for backward compatibility
 * This will be removed once all code is updated to use FeaturePrerequisite directly
 */
function mapFeatPrereqsToFeaturePrereqs(featPrereqs: Array<{ typeId: number; referenceId: number | null; amount: number | null }>): FeaturePrerequisite[] {
    return featPrereqs.map(prereq => {
        let featurePrereqType: FeaturePrerequisiteType;
        switch (prereq.typeId) {
            case FeatPrerequisiteType.ABILITY:
                featurePrereqType = FeaturePrerequisiteType.AbilityScore;
                break;
            case FeatPrerequisiteType.SKILL:
                featurePrereqType = FeaturePrerequisiteType.SkillRanks;
                break;
            case FeatPrerequisiteType.BAB:
                featurePrereqType = FeaturePrerequisiteType.BaseAttackBonus;
                break;
            case FeatPrerequisiteType.CLASSLEVEL:
                featurePrereqType = FeaturePrerequisiteType.ClassLevel;
                break;
            case FeatPrerequisiteType.FEAT:
                featurePrereqType = FeaturePrerequisiteType.Feat;
                break;
            case FeatPrerequisiteType.SPELLCASTING:
                featurePrereqType = FeaturePrerequisiteType.Spellcasting;
                break;
            case FeatPrerequisiteType.CLASSFEATURE:
                featurePrereqType = FeaturePrerequisiteType.ClassFeature;
                break;
            case FeatPrerequisiteType.SIZE:
                featurePrereqType = FeaturePrerequisiteType.Size;
                break;
            case FeatPrerequisiteType.SPECIAL:
                featurePrereqType = FeaturePrerequisiteType.Other;
                break;
            case FeatPrerequisiteType.PROFICIENCY:
                featurePrereqType = FeaturePrerequisiteType.Proficiency;
                break;
            default:
                featurePrereqType = FeaturePrerequisiteType.Other;
        }

        return {
            id: 0, // Temporary ID for mapping
            featureId: 0, // Will be set by caller if needed
            type: featurePrereqType,
            appliesToId: prereq.referenceId,
            minValue: prereq.amount || 0,
        };
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

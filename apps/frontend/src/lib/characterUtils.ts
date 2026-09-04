import { applyFeatureFormula } from '@/lib/character-calculation/utils/formulaApplier';
import { extractBABProgression } from '@/lib/feature-extraction/classMechanicsExtractor';
import { extractRaceMechanics } from '@/lib/feature-extraction/raceMechanicsExtractor';
import type {
    CharacterWithAllDetailsResponse,
    DnDClass,
    Race,
    Feat,
    GetAllFeatsResponse,
    FeaturePrerequisite,
    FeatureWithRelations
} from '@shared/schema';
import { FeaturePrerequisiteType, EntityType, EntityAppliesToType, FeatureSourceType } from '@shared/static-data';

export function meetsPrerequisites(
    feat: Feat,
    character: CharacterWithAllDetailsResponse,
    selectedClassDetails: DnDClass | null,
    selectedRaceDetails: Race | null,
    _allFeats: GetAllFeatsResponse,
    featurePrerequisites: FeaturePrerequisite[],
    resolvedProgressions?: FeatureWithRelations[]
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
                const spentRanks = skillEntry?.pointsSpent ?? 0;
                const bonusRanks = (character.bonusSkillRanks ?? [])
                    .filter((grant) => grant.skillId === prereq.appliesToId)
                    .reduce((sum, grant) => sum + grant.ranks, 0);
                return (spentRanks + bonusRanks) >= prereq.minValue;
            }

            case FeaturePrerequisiteType.Feat: {
                if (!prereq.appliesToId) return true;
                return character.advancements[0]?.feats?.some(feat => feat.featId === prereq.appliesToId) ?? false;
            }

            case FeaturePrerequisiteType.BaseAttackBonus: {
                if (!prereq.minValue) return true;
                const characterBAB = getCharacterBAB(character, selectedClassDetails, resolvedProgressions);
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
                if (!prereq.appliesToId) return true;
                // Extract sizeId from resolved features
                const raceMechanics = resolvedProgressions && character.raceId
                    ? extractRaceMechanics(resolvedProgressions, character.raceId)
                    : null;
                const characterSizeId = raceMechanics?.sizeId;
                if (!characterSizeId) return false;
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
    selectedClassDetails: DnDClass | null,
    resolvedProgressions?: FeatureWithRelations[]
): number {
    if (!selectedClassDetails) return 0;

    try {
        const level = character.advancements.length;

        // Calculate BAB directly from formula entities
        const classId = (selectedClassDetails as { id?: number }).id;
        if (!resolvedProgressions || !classId) {
            return 0;
        }

        const classProgressions = resolvedProgressions.filter(p =>
            p.sourceType === FeatureSourceType.Class &&
            p.classes?.some(c => c.classId === classId) &&
            p.entities?.some(e =>
                e.type === EntityType.Base &&
                e.appliesTo === EntityAppliesToType.BaseAttackBonus
            )
        );

        for (const feature of classProgressions) {
            if (feature.entities) {
                for (const entity of feature.entities) {
                    if (entity.type === EntityType.Base &&
                        entity.appliesTo === EntityAppliesToType.BaseAttackBonus &&
                        entity.formulaParams) {
                        const babValue = applyFeatureFormula(entity, character, level);
                        if (babValue !== null && babValue !== undefined) {
                            return babValue;
                        }
                    }
                }
            }
        }

        return 0;
    } catch (error) {
        console.warn('Error calculating BAB for class:', selectedClassDetails.name, error);
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

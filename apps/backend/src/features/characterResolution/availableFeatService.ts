import type { 
    Feat, 
    FeatInQueryResponse, 
    FeatureProgression, 
    CharacterWithAllDetailsResponse,
    FeaturePrerequisite,
    DnDClass,
    Race
} from '@shared/schema';
import { 
    EntityType, 
    EntityAppliesToType, 
    FeatureSourceType,
    FeaturePrerequisiteType,
    GetAbilityModifier,
    AbilityId
} from '@shared/static-data';
import { featService } from '../feat/featService';
import { getBABProgression } from '@shared/utils';

/**
 * Service for filtering available feats based on character qualifications
 */
export class AvailableFeatService {
    /**
     * Get all available feats for a character, filtered by:
     * - Prerequisites
     * - Already-owned feats
     * - "All" proficiencies (feats that provide proficiencies the character already has)
     */
    static async getAvailableFeats(
        character: CharacterWithAllDetailsResponse,
        resolvedProgressions: FeatureProgression[],
        classDetails: DnDClass | null,
        raceDetails: Race | null,
        allFeats: FeatInQueryResponse[]
    ): Promise<FeatInQueryResponse[]> {
        // Get all feats with full data for prerequisite checking
        // We need to fetch featureProgressions for each feat to check prerequisites
        const allFeatsResponse = await featService.getAllFeatsFull();
        const allFeatIds = allFeatsResponse.results.map(f => f.id);
        
        // Fetch featureProgressions for all feats
        const { featureSystemService } = await import('../featureSystem/featureSystemService');
        const allProgressions = await featureSystemService.getFeatureProgressionsByFeatIds(allFeatIds);
        
        // Create a map of feat ID to progressions
        const progressionsByFeatId = new Map<number, typeof allProgressions>();
        for (const progression of allProgressions) {
            if (progression.featId) {
                if (!progressionsByFeatId.has(progression.featId)) {
                    progressionsByFeatId.set(progression.featId, []);
                }
                progressionsByFeatId.get(progression.featId)!.push(progression);
            }
        }
        
        // Create full feat map with featureProgressions
        const fullFeatMap = new Map<number, Feat>();
        for (const feat of allFeatsResponse.results) {
            fullFeatMap.set(feat.id, {
                ...feat,
                featureProgressions: progressionsByFeatId.get(feat.id) || []
            });
        }

        // Extract character's "all" proficiencies (category-based proficiencies where appliesToSubId === -1 or null)
        const characterAllProficiencies = new Set<number>();
        for (const progression of resolvedProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    // Check if this is a proficiency entity with "all" category proficiency
                    if (
                        entity.type === EntityType.Other &&
                        entity.appliesTo === EntityAppliesToType.Proficiency &&
                        entity.appliesToId &&
                        (entity.appliesToSubId === -1 || entity.appliesToSubId === null)
                    ) {
                        // Character has "all" proficiency for this proficiency type
                        characterAllProficiencies.add(entity.appliesToId);
                    }
                }
            }
        }

        // Get granted feats from resolved progressions
        const grantedFeats = new Set<number>();
        for (const progression of resolvedProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    if (
                        entity.type === EntityType.Other &&
                        entity.appliesTo === EntityAppliesToType.Feat &&
                        entity.appliesToId
                    ) {
                        grantedFeats.add(entity.appliesToId);
                    }
                }
            }
        }

        // Get selected feats from character advancements
        const selectedFeats = new Set<number>();
        if (character.advancements) {
            for (const advancement of character.advancements) {
                if (advancement.feats) {
                    for (const featSelection of advancement.feats) {
                        selectedFeats.add(featSelection.featId);
                    }
                }
            }
        }

        // Combine all owned feats
        const allOwnedFeats = new Set([...selectedFeats, ...grantedFeats]);

        // Filter feats
        const filteredFeats: FeatInQueryResponse[] = [];

        for (const feat of allFeats) {
            // Check if character already has this feat
            if (allOwnedFeats.has(feat.id)) {
                // If it's repeatable, check if they have the "all" version (appliesToSubId: -1)
                if (feat.repeatable === true) {
                    // Check if this feat was granted with appliesToSubId: -1 (all iterations)
                    let hasAllIterations = false;
                    for (const progression of resolvedProgressions) {
                        if (progression.entities) {
                            for (const entity of progression.entities) {
                                if (
                                    entity.type === EntityType.Other &&
                                    entity.appliesTo === EntityAppliesToType.Feat &&
                                    entity.appliesToId === feat.id &&
                                    entity.appliesToSubId === -1
                                ) {
                                    hasAllIterations = true;
                                    break;
                                }
                            }
                        }
                        if (hasAllIterations) break;
                    }

                    // If they have all iterations, filter it out
                    if (hasAllIterations) {
                        continue;
                    }
                    // Otherwise, allow it (they can take more iterations)
                } else {
                    // Non-repeatable feat - filter it out
                    continue;
                }
            }

            // Get full feat data to check prerequisites and proficiencies
            const fullFeat = fullFeatMap.get(feat.id);
            if (!fullFeat) {
                continue;
            }

            // Check if this feat provides a proficiency that the character already has as "all"
            // If so, filter it out (e.g., Cleric already has "all heavy armor", so filter out Heavy Armor Proficiency feat)
            if (fullFeat.featureProgressions) {
                let shouldFilterFeat = false;
                for (const progression of fullFeat.featureProgressions) {
                    if (progression.entities) {
                        for (const entity of progression.entities) {
                            // Check if this entity provides a proficiency
                            if (
                                entity.type === EntityType.Other &&
                                entity.appliesTo === EntityAppliesToType.Proficiency &&
                                entity.appliesToId
                            ) {
                                // If character already has "all" proficiency for this type, filter out the feat
                                if (characterAllProficiencies.has(entity.appliesToId)) {
                                    shouldFilterFeat = true;
                                    break;
                                }
                            }
                        }
                    }
                    if (shouldFilterFeat) break;
                }
                if (shouldFilterFeat) {
                    continue;
                }
            }

            // Get prerequisites from featureProgressions
            const featurePrerequisites: FeaturePrerequisite[] = [];
            if (fullFeat.featureProgressions) {
                for (const progression of fullFeat.featureProgressions) {
                    if (progression.feature?.prerequisites) {
                        featurePrerequisites.push(...progression.feature.prerequisites);
                    }
                }
            }

            // If feat has no prerequisites, it's available
            if (featurePrerequisites.length === 0) {
                filteredFeats.push(feat);
                continue;
            }

            // Feat has prerequisites - check them
            const meetsPrereqs = this.meetsPrerequisites(
                character,
                classDetails,
                raceDetails,
                featurePrerequisites,
                resolvedProgressions
            );

            if (meetsPrereqs) {
                filteredFeats.push(feat);
            }
        }

        return filteredFeats;
    }

    /**
     * Check if character meets feat prerequisites
     */
    private static meetsPrerequisites(
        character: CharacterWithAllDetailsResponse,
        classDetails: DnDClass | null,
        raceDetails: Race | null,
        prerequisites: FeaturePrerequisite[],
        resolvedProgressions: FeatureProgression[]
    ): boolean {
        if (!prerequisites || prerequisites.length === 0) {
            return true;
        }

        if (!character.abilityScores || character.abilityScores.length === 0) {
            return false;
        }

        return prerequisites.every(prereq => {
            switch (prereq.type) {
                case FeaturePrerequisiteType.AbilityScore: {
                    if (!prereq.appliesToId || !prereq.minValue) return true;
                    const abilityScore = character.abilityScores?.find(as => as.abilityId === prereq.appliesToId);
                    if (!abilityScore) return false;
                    return abilityScore.value >= prereq.minValue;
                }

                case FeaturePrerequisiteType.BaseAttackBonus: {
                    if (!prereq.minValue) return true;
                    const bab = this.getCharacterBAB(character, classDetails);
                    return bab >= prereq.minValue;
                }

                case FeaturePrerequisiteType.Feat: {
                    if (!prereq.appliesToId) return true;
                    // Check if character has this feat in their advancements
                    if (character.advancements) {
                        for (const advancement of character.advancements) {
                            if (advancement.feats) {
                                for (const featSelection of advancement.feats) {
                                    if (featSelection.featId === prereq.appliesToId) {
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                    // Also check granted feats from resolved progressions
                    for (const progression of resolvedProgressions) {
                        if (progression.entities) {
                            for (const entity of progression.entities) {
                                if (
                                    entity.type === EntityType.Other &&
                                    entity.appliesTo === EntityAppliesToType.Feat &&
                                    entity.appliesToId === prereq.appliesToId
                                ) {
                                    return true;
                                }
                            }
                        }
                    }
                    return false;
                }

                case FeaturePrerequisiteType.SkillRanks: {
                    if (!prereq.appliesToId || !prereq.minValue) return true;
                    // Check if character has enough skill ranks
                    if (character.advancements) {
                        for (const advancement of character.advancements) {
                            if (advancement.skillRanks) {
                                for (const skillRank of advancement.skillRanks) {
                                    if (skillRank.skillId === prereq.appliesToId) {
                                        const totalRanks = advancement.skillRanks
                                            .filter(sr => sr.skillId === prereq.appliesToId)
                                            .reduce((sum, sr) => sum + (sr.pointsSpent || 0), 0);
                                        return totalRanks >= prereq.minValue;
                                    }
                                }
                            }
                        }
                    }
                    return false;
                }

                case FeaturePrerequisiteType.CharacterLevel: {
                    if (!prereq.minValue) return true;
                    return (character.level || character.advancements?.length || 0) >= prereq.minValue;
                }

                case FeaturePrerequisiteType.ClassLevel: {
                    if (!prereq.minValue) return true;
                    if (prereq.appliesToId === -1 || prereq.appliesToId === null) {
                        // Total character level
                        return (character.level || character.advancements?.length || 0) >= prereq.minValue;
                    } else {
                        // Class-specific level
                        const classLevel = character.advancements
                            ?.filter(adv => adv.classId === prereq.appliesToId)
                            .length || 0;
                        return classLevel >= prereq.minValue;
                    }
                }

                case FeaturePrerequisiteType.Proficiency: {
                    // This is a post-selection check, so we don't filter based on this
                    return true;
                }

                case FeaturePrerequisiteType.Size: {
                    if (!prereq.appliesToId || !raceDetails?.sizeId) return true;
                    const characterSizeId = raceDetails.sizeId;
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
     * Get character's base attack bonus
     */
    private static getCharacterBAB(
        character: CharacterWithAllDetailsResponse,
        classDetails: DnDClass | null
    ): number {
        if (!classDetails) {
            return 0;
        }

        const level = character.level || character.advancements?.length || 1;
        return getBABProgression(classDetails.babProgression, level);
    }
}

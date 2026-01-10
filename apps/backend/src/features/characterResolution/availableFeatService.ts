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
    FeaturePrerequisiteType
} from '@shared/static-data';
import { getBABProgression } from '@shared/utils';

import { classService } from '../class/classService';
import { featService } from '../feat/featService';

type FeatWithProgressions = Feat & {
    featureProgressions: FeatureProgression[];
};

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
        const fullFeatMap = new Map<number, FeatWithProgressions>();
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
            const meetsPrereqs = await this.meetsPrerequisites(
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
    private static async meetsPrerequisites(
        character: CharacterWithAllDetailsResponse,
        classDetails: DnDClass | null,
        raceDetails: Race | null,
        prerequisites: FeaturePrerequisite[],
        resolvedProgressions: FeatureProgression[]
    ): Promise<boolean> {
        if (!prerequisites || prerequisites.length === 0) {
            return true;
        }

        if (!character.abilityScores || character.abilityScores.length === 0) {
            return false;
        }

        for (const prereq of prerequisites) {
            let meetsPrereq = false;
            switch (prereq.type) {
                case FeaturePrerequisiteType.AbilityScore: {
                    if (!prereq.appliesToId || !prereq.minValue) {
                        meetsPrereq = true;
                        break;
                    }
                    const abilityScore = character.abilityScores?.find(as => as.abilityId === prereq.appliesToId);
                    if (!abilityScore) {
                        meetsPrereq = false;
                        break;
                    }
                    meetsPrereq = abilityScore.value >= prereq.minValue;
                    break;
                }

                case FeaturePrerequisiteType.BaseAttackBonus: {
                    if (!prereq.minValue) {
                        meetsPrereq = true;
                        break;
                    }
                    const bab = await this.getCharacterBAB(character);
                    meetsPrereq = bab >= prereq.minValue;
                    break;
                }

                case FeaturePrerequisiteType.Feat: {
                    if (!prereq.appliesToId) {
                        meetsPrereq = true;
                        break;
                    }
                    // Check if character has this feat in their advancements
                    if (character.advancements) {
                        for (const advancement of character.advancements) {
                            if (advancement.feats) {
                                for (const featSelection of advancement.feats) {
                                    if (featSelection.featId === prereq.appliesToId) {
                                        meetsPrereq = true;
                                        break;
                                    }
                                }
                            }
                            if (meetsPrereq) break;
                        }
                    }
                    // Also check granted feats from resolved progressions
                    if (!meetsPrereq) {
                        for (const progression of resolvedProgressions) {
                            if (progression.entities) {
                                for (const entity of progression.entities) {
                                    if (
                                        entity.type === EntityType.Other &&
                                        entity.appliesTo === EntityAppliesToType.Feat &&
                                        entity.appliesToId === prereq.appliesToId
                                    ) {
                                        meetsPrereq = true;
                                        break;
                                    }
                                }
                            }
                            if (meetsPrereq) break;
                        }
                    }
                    break;
                }

                case FeaturePrerequisiteType.SkillRanks: {
                    if (!prereq.appliesToId || !prereq.minValue) {
                        meetsPrereq = true;
                        break;
                    }
                    // Check if character has enough skill ranks
                    if (character.advancements) {
                        let totalRanks = 0;
                        for (const advancement of character.advancements) {
                            if (advancement.skills) {
                                for (const skill of advancement.skills) {
                                    if (skill.skillId === prereq.appliesToId) {
                                        totalRanks += skill.pointsSpent || 0;
                                    }
                                }
                            }
                        }
                        meetsPrereq = totalRanks >= prereq.minValue;
                    } else {
                        meetsPrereq = false;
                    }
                    break;
                }

                case FeaturePrerequisiteType.CharacterLevel: {
                    if (!prereq.minValue) {
                        meetsPrereq = true;
                        break;
                    }
                    meetsPrereq = (character.characterLevel || character.advancements?.length || 0) >= prereq.minValue;
                    break;
                }

                case FeaturePrerequisiteType.ClassLevel: {
                    if (!prereq.minValue) {
                        meetsPrereq = true;
                        break;
                    }
                    if (prereq.appliesToId === -1 || prereq.appliesToId === null) {
                        // Total character level
                        meetsPrereq = (character.characterLevel || character.advancements?.length || 0) >= prereq.minValue;
                    } else {
                        // Class-specific level
                        const classLevel = character.advancements
                            ?.filter(adv => adv.classId === prereq.appliesToId)
                            .length || 0;
                        meetsPrereq = classLevel >= prereq.minValue;
                    }
                    break;
                }

                case FeaturePrerequisiteType.Proficiency: {
                    // This is a post-selection check, so we don't filter based on this
                    meetsPrereq = true;
                    break;
                }

                case FeaturePrerequisiteType.Size: {
                    if (!prereq.appliesToId || !raceDetails?.sizeId) {
                        meetsPrereq = true;
                        break;
                    }
                    const characterSizeId = raceDetails.sizeId;
                    const requiredSizeId = prereq.appliesToId;

                    // minValue: 0 = exact, 1 = or larger, 2 = or smaller
                    if (prereq.minValue === 0) {
                        meetsPrereq = characterSizeId === requiredSizeId;
                    } else if (prereq.minValue === 1) {
                        // or larger: character size must be >= required size (higher IDs = larger)
                        meetsPrereq = characterSizeId >= requiredSizeId;
                    } else if (prereq.minValue === 2) {
                        // or smaller: character size must be <= required size (lower IDs = smaller)
                        meetsPrereq = characterSizeId <= requiredSizeId;
                    } else {
                        meetsPrereq = true;
                    }
                    break;
                }

                default:
                    meetsPrereq = true;
                    break;
            }

            if (!meetsPrereq) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get character's base attack bonus
     * For multiclass characters, calculates BAB for each class separately and returns the highest
     */
    private static async getCharacterBAB(
        character: CharacterWithAllDetailsResponse
    ): Promise<number> {
        if (!character.advancements || character.advancements.length === 0) {
            return 0;
        }

        // Group advancements by classId to count levels per class
        const classLevels = new Map<number, number>();
        for (const advancement of character.advancements) {
            const currentLevel = classLevels.get(advancement.classId) || 0;
            classLevels.set(advancement.classId, currentLevel + 1);
        }

        // Calculate BAB for each class and find the highest
        let maxBAB = 0;
        for (const [classId, level] of classLevels) {
            const classDetails = await classService.getClassById({ id: classId });
            if (!classDetails) {
                continue;
            }

            const babString = getBABProgression(level, classDetails.babProgression);
            // Extract the first BAB value from the string (e.g., "+1" -> 1, "+0" -> 0)
            const match = babString.match(/\+(\d+)/);
            const bab = match ? parseInt(match[1], 10) : 0;
            maxBAB = Math.max(maxBAB, bab);
        }

        return maxBAB;
    }
}

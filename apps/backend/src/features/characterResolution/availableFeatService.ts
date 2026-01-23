import type {
    Feat,
    FeatInQueryResponse,
    FeatureWithRelations,
    FeatureEntity,
    CharacterWithAllDetailsResponse,
    FeaturePrerequisite,
    DnDClass,
    Race,
    FormulaCalculationParams
} from '@shared/schema';
import {
    EntityType,
    EntityAppliesToType,
    FeaturePrerequisiteType,
    FeatureSourceType,
    FORMULA_MAP,
    FormulaId
} from '@shared/static-data';

import { extractBABProgression } from '../../utils/classMechanicsExtractor';
import { extractSizeId } from '../../utils/raceMechanicsExtractor';
import { featService } from '../feat/featService';
import { featureSystemService } from '../featureSystem/featureSystemService';

type FeatWithProgressions = Feat & {
    features: FeatureWithRelations[];
};

/**
 * Service for filtering available feats based on character qualifications
 */
export class AvailableFeatService {
    /**
     * Get all qualified feats for a character, filtered by:
     * - Prerequisites
     * - Already-owned feats
     * - "All" proficiencies (feats that provide proficiencies the character already has)
     * 
     * Returns the list of feats the character qualifies for based on all prerequisites and restrictions.
     */
    static async getQualifiedFeats(
        character: CharacterWithAllDetailsResponse,
        resolvedProgressions: FeatureWithRelations[],
        classDetails: DnDClass | null,
        raceDetails: Race | null,
        allFeats: FeatInQueryResponse[]
    ): Promise<FeatInQueryResponse[]> {
        // Get all feats with full data for prerequisite checking
        // We need to fetch features for each feat to check prerequisites
        const allFeatsResponse = await featService.getAllFeatsFull();
        const allFeatIds = allFeatsResponse.results.map(f => f.id);

        // Fetch features for all feats
        const allProgressions = await featureSystemService.getFeaturesByFeatIds(allFeatIds);

        // Create a map of feat ID to features
        const progressionsByFeatId = new Map<number, typeof allProgressions>();
        for (const feature of allProgressions) {
            if (feature.featId) {
                if (!progressionsByFeatId.has(feature.featId)) {
                    progressionsByFeatId.set(feature.featId, []);
                }
                progressionsByFeatId.get(feature.featId)!.push(feature);
            }
        }

        // Create full feat map with features
        const fullFeatMap = new Map<number, FeatWithProgressions>();
        for (const feat of allFeatsResponse.results) {
            fullFeatMap.set(feat.id, {
                ...feat,
                features: progressionsByFeatId.get(feat.id) || []
            });
        }

        // Extract character's "all" proficiencies (category-based proficiencies where appliesToSubId === -1 or null)
        const characterAllProficiencies = new Set<number>();
        for (const feature of resolvedProgressions) {
            if (feature.entities) {
                for (const entity of feature.entities) {
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

        // Get granted feats from resolved features
        const grantedFeats = new Set<number>();
        for (const feature of resolvedProgressions) {
            if (feature.entities) {
                for (const entity of feature.entities) {
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
                    for (const feature of resolvedProgressions) {
                        if (feature.entities) {
                            for (const entity of feature.entities) {
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
            if (fullFeat.features) {
                let shouldFilterFeat = false;
                for (const feature of fullFeat.features) {
                    if (feature.entities) {
                        for (const entity of feature.entities) {
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

            // Get prerequisites from features
            const featurePrerequisites: FeaturePrerequisite[] = [];
            if (fullFeat.features) {
                for (const feature of fullFeat.features) {
                    if (feature.prerequisites) {
                        featurePrerequisites.push(...feature.prerequisites);
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
        resolvedProgressions: FeatureWithRelations[]
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
                    const bab = await this.getCharacterBAB(character, resolvedProgressions);
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
                    // Also check granted feats from resolved features
                    if (!meetsPrereq) {
                        for (const feature of resolvedProgressions) {
                            if (feature.entities) {
                                for (const entity of feature.entities) {
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
                    if (!prereq.appliesToId) {
                        meetsPrereq = true;
                        break;
                    }
                    // Extract sizeId from resolved features
                    const raceId = character.raceId ?? undefined;
                    const characterSizeId = extractSizeId(resolvedProgressions, raceId);
                    if (!characterSizeId) {
                        meetsPrereq = false;
                        break;
                    }
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
        character: CharacterWithAllDetailsResponse,
        resolvedProgressions: FeatureWithRelations[]
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
            // Calculate BAB directly from formula entities
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
                            const babValue = this.calculateFormulaValueForEntity(entity, feature, level, character);
                            if (babValue !== null && babValue !== undefined) {
                                maxBAB = Math.max(maxBAB, babValue);
                                break; // Only use first matching entity per feature
                            }
                        }
                    }
                }
            }
        }

        return maxBAB;
    }

    /**
     * Calculate formula value for an entity at a specific class level.
     */
    private static calculateFormulaValueForEntity(
        entity: FeatureEntity,
        feature: FeatureWithRelations,
        classLevel: number,
        character: CharacterWithAllDetailsResponse
    ): number | null {
        if (!entity.formulaParams) return null;

        const formulaDef = FORMULA_MAP[entity.formulaParams.formulaId];
        if (!formulaDef) return null;

        const formulaStartLevel = entity.formulaParams.formulaStartLevel ?? feature.level;

        // Only calculate if level is at or after the formula start level, unless featureLevelZero is enabled
        // (featureLevelZero allows formula to return 0 for levels below formulaStartLevel)
        if (classLevel < formulaStartLevel && entity.formulaParams.featureLevelZero !== true) {
            return null;
        }

        // Build formula params
        const abilityScores: Record<number, number> = {};
        if (character.abilityScores) {
            for (const score of character.abilityScores) {
                abilityScores[score.abilityId] = score.value;
            }
        }

        // Use entity.value for scalingValue if available (for formulas like LEVEL_TIMES_VALUE)
        // Otherwise default to 1
        const scalingValue = entity.value !== null && entity.value !== undefined
            ? entity.value
            : 1;

        const params: FormulaCalculationParams = {
            ...entity.formulaParams,
            level: classLevel,
            startLevel: feature.level,
            scalingValue,
            context: {
                character: {
                    abilityScores,
                },
            },
            // Convert null to undefined for baseValue, divisor, and startingValue
            baseValue: entity.formulaParams.baseValue != null ? entity.formulaParams.baseValue : undefined,
            divisor: entity.formulaParams.divisor != null ? entity.formulaParams.divisor : undefined,
            startingValue: entity.formulaParams.startingValue != null ? entity.formulaParams.startingValue : undefined,
        };

        // Add ability-specific params for ABILITY_BASED formula
        if (entity.formulaParams.formulaId === FormulaId.ABILITY_BASED && entity.formulaParams.abilityId) {
            params.baseValue = entity.value ?? 0;
        }

        // Calculate formula value
        try {
            const value = formulaDef.calculate(params);
            if (value !== null && value !== undefined && typeof value === 'number') {
                // Allow 0 values when featureLevelZero is enabled
                if (value === 0 && entity.formulaParams.featureLevelZero === true) {
                    return 0;
                }
                if (value > 0) {
                    return value;
                }
            }
        } catch (error) {
            console.error('Error calculating formula value:', error);
        }

        return null;
    }
}

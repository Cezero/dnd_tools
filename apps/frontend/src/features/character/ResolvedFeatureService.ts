import { FeatureProgression, FeatureEntity, CharacterWithAllDetailsResponse, CharacterAdvancementWithDetailsResponse, Race, DnDClass } from '@shared/schema';
import { EntityType, EntityAppliesToType, CoreComponent, FeatureFeatChoiceFilter, FeatureSourceType } from '@shared/static-data';
import { getFeatCount } from '@shared/utils';

import { CharacterFeatureResolutionService } from './CharacterFeatureResolutionService';
import { ChoiceResolver } from './ChoiceResolver';
import type { ResolutionContext, PendingChoice } from './types';

/**
 * Service for working with resolved character features
 */
export class ResolvedFeatureService {
    /**
     * Get all resolved feature progressions for a character
     */
    static async getResolvedFeatures(
        character: CharacterWithAllDetailsResponse,
        targetLevel: number,
        advancement: CharacterAdvancementWithDetailsResponse,
        raceDetails?: Race | null,
        classDetails?: DnDClass | null,
        secondaryClassDetails?: DnDClass | null,
        userChoices?: {
            domains?: number[];
            feats?: number[];
            skills?: number[];
            spells?: number[];
            features?: number[];
        }
    ): Promise<FeatureProgression[]> {
        const context: ResolutionContext = {
            character,
            targetLevel,
            advancement,
            raceDetails,
            classDetails,
            secondaryClassDetails,
            isGestalt: !!secondaryClassDetails,
            userChoices,
            includePendingChoices: false,
            resolveCascading: true,
            maxResolutionDepth: 10,
        };

        const result = await CharacterFeatureResolutionService.resolveCharacterFeatures(character, targetLevel, context);
        return result.resolvedProgressions;
    }

    /**
     * Get class skills from resolved features
     */
    static getClassSkills(resolvedProgressions: FeatureProgression[]): Array<{ skillId: number; skillSubId: number | null }> {
        const classSkills: Array<{ skillId: number; skillSubId: number | null }> = [];

        for (const progression of resolvedProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    if (this.isClassSkillEntity(entity)) {
                        if (entity.appliesToId) {
                            if (entity.appliesToSubId === -1) {
                                // All subtypes are class skills (like Knowledge domain)
                                classSkills.push({ skillId: entity.appliesToId, skillSubId: null });
                            } else if (entity.appliesToSubId) {
                                // Specific subtype is a class skill
                                classSkills.push({ skillId: entity.appliesToId, skillSubId: entity.appliesToSubId });
                            } else {
                                // Regular skill is a class skill
                                classSkills.push({ skillId: entity.appliesToId, skillSubId: null });
                            }
                        }
                    }
                }
            }
        }
        return classSkills;
    }

    /**
     * Check if a specific skill is a class skill
     */
    static isClassSkill(
        skillId: number,
        skillSubId: number | null,
        resolvedProgressions: FeatureProgression[]
    ): boolean {
        for (const progression of resolvedProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    if (this.isClassSkillEntity(entity)) {
                        // Check if this entity makes all Knowledge skills class skills
                        if (entity.appliesToId === 19 && entity.appliesToSubId === -1) {
                            // If the skill is a Knowledge skill (base or subtype), it's a class skill
                            if (skillId === 19 || (skillSubId && skillSubId >= 1901 && skillSubId <= 1999)) {
                                return true;
                            }
                        }
                        // Check if this entity directly makes this skill a class skill
                        if (entity.appliesToId === skillId) {
                            if (entity.appliesToSubId === -1) {
                                // All subtypes are class skills
                                return true;
                            } else if (entity.appliesToSubId === skillSubId) {
                                // Specific subtype is a class skill
                                return true;
                            } else if (!entity.appliesToSubId && !skillSubId) {
                                // Regular skill is a class skill
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    /**
     * Get granted feats from resolved features (both direct feats and proficiency feats)
     */
    static getGrantedFeats(resolvedProgressions: FeatureProgression[]): FeatureEntity[] {
        const grantedFeats: FeatureEntity[] = [];

        for (const progression of resolvedProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    if ((entity.type === EntityType.Other || entity.type === EntityType.Proficiency) &&
                        entity.appliesTo === EntityAppliesToType.Feat) {
                        if (entity.appliesToId) {
                            grantedFeats.push(entity);
                        }
                    }
                }
            }
        }

        return grantedFeats;
    }

    /**
     * Get skill bonuses from resolved features
     */
    static getSkillBonuses(resolvedProgressions: FeatureProgression[]): Array<{ skillId: number; skillSubId: number | null; bonus: number; source: string }> {
        const skillBonuses: Array<{ skillId: number; skillSubId: number | null; bonus: number; source: string }> = [];

        for (const progression of resolvedProgressions) {
            if (!progression.entities) continue;

            for (const entity of progression.entities) {
                if (entity.type === EntityType.Bonus &&
                    entity.appliesTo === EntityAppliesToType.Skill &&
                    entity.appliesToId &&
                    entity.value) {
                    skillBonuses.push({
                        skillId: entity.appliesToId,
                        skillSubId: entity.appliesToSubId,
                        bonus: entity.value,
                        source: this.getSourceName(progression)
                    });
                }
            }
        }

        return skillBonuses;
    }

    /**
     * Get pending choices from resolved features
     * Filters out choices that have already been made
     */
    static async getPendingChoices(
        resolvedProgressions: FeatureProgression[],
        cacheService: {
            getClassNameById: (id: number) => Promise<CoreComponent | undefined> | CoreComponent | undefined;
            getDomainSelectByEdition: (editionId: number) => Promise<CoreComponent[]> | CoreComponent[];
        },
        editionId?: number,
        existingChoices?: Array<{ progressionId: number; featureEntityId: number }>,
        allFeats?: import('@shared/schema').FeatInQueryResponse[]
    ): Promise<PendingChoice[]> {
        // Use the ChoiceResolver to identify pending choices
        // Create an adapter to normalize return types (cacheService may return sync or async)
        const normalizedCacheService = {
            getClassNameById: async (id: number): Promise<CoreComponent | undefined> => {
                const result = cacheService.getClassNameById(id);
                return result instanceof Promise ? await result : result;
            },
            getDomainSelectByEdition: async (editionId: number): Promise<CoreComponent[]> => {
                const result = cacheService.getDomainSelectByEdition(editionId);
                const resolved = result instanceof Promise ? await result : result;
                return Array.isArray(resolved) ? resolved : [];
            }
        };

        return await ChoiceResolver.identifyPendingChoices(
            resolvedProgressions,
            normalizedCacheService,
            editionId,
            existingChoices,
            allFeats
        );
    }

    /**
     * Count available feat slots from resolved progressions
     * Counts pending choices of type Feat, but EXCLUDES racial/class bonus feats
     * (those are handled in ChoicesTab, not FeatsTab)
     * Only counts advancement-level feat choices (sourceType should indicate advancement-level)
     * Also adds base feat count (1 at 1st level, +1 every 3 levels)
     * 
     * @param resolvedProgressions - All resolved feature progressions
     * @param characterLevel - Overall character level (for base feat calculation)
     * @param classLevels - Map of classId -> class level (for filtering by class level)
     */
    static getAvailableFeats(resolvedProgressions: FeatureProgression[], characterLevel: number, classLevels?: Map<number, number>): number {
        // Base feat count: 1 at 1st level, +1 every 3 levels (4th, 7th, 10th, etc.)
        const baseFeatCount = getFeatCount(characterLevel);
        let count = baseFeatCount;

        for (const progression of resolvedProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    if (entity.type === EntityType.Choice &&
                        entity.appliesTo === EntityAppliesToType.Feat) {
                        // Only count feat choices from progressions at or below the class level for that class
                        if (progression.classId && classLevels) {
                            const classLevel = classLevels.get(progression.classId) ?? 0;
                            if (progression.level > classLevel) {
                                continue;
                            }
                        } else if (!progression.classId && progression.level > characterLevel) {
                            // For non-class progressions, use character level
                            continue;
                        }

                        // Exclude ALL class bonus feats (feat choices from class progressions)
                        // Class bonus feats are handled by the choice system, not the Feats tab
                        if (progression.sourceType === FeatureSourceType.Class) {
                            continue;
                        }

                        // Exclude racial feats (sourceType 0 = Race)
                        if (progression.raceId !== null && progression.raceId !== undefined) {
                            // This is a racial feat choice - don't count it in availableFeats
                            continue;
                        }

                        // Exclude Fighter bonus feats and Metamagic/Item Creation feats (handled in ChoicesTab)
                        if (entity.filterType === FeatureFeatChoiceFilter.FighterBonus ||
                            entity.filterType === FeatureFeatChoiceFilter.MetamagicOrItemCreation) {
                            continue;
                        }

                        // Count each feat choice (value is usually 1, but could be more for multiple selections)
                        const selections = entity.value || 1;
                        count += selections;
                    }
                }
            }
        }

        return count;
    }

    /**
     * Count available fighter bonus feat slots from resolved progressions
     * Counts pending choices of type Feat with filterType === FighterBonus
     */
    static getAvailableFighterBonusFeats(resolvedProgressions: FeatureProgression[]): number {
        let count = 0;

        for (const progression of resolvedProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    if (entity.type === EntityType.Choice &&
                        entity.appliesTo === EntityAppliesToType.Feat &&
                        entity.filterType === FeatureFeatChoiceFilter.FighterBonus) {
                        // Count each fighter bonus feat choice
                        const selections = entity.value || 1;
                        count += selections;
                    }
                }
            }
        }

        return count;
    }

    /**
     * Calculate total skill bonus including all bonuses from resolved features
     */
    static calculateSkillTotal(
        skillId: number,
        skillSubId: number | null,
        baseTotal: number, // The base total from ClassSkillService (ranks + ability modifier)
        resolvedProgressions: FeatureProgression[]
    ): number {
        let totalBonus = baseTotal;

        // Add bonuses from resolved features
        for (const progression of resolvedProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    if (this.isSkillBonusEntity(entity, skillId, skillSubId)) {
                        totalBonus += entity.value || 0;
                    }
                }
            }
        }

        return totalBonus;
    }

    // Private helper methods

    private static isClassSkillEntity(entity: FeatureEntity): boolean {
        // Class skill grants are Other entities that apply to skills with value 0
        // They are part of progressions with featureId 1 (Class Skill feature)
        return entity.type === EntityType.Other &&
            entity.appliesTo === EntityAppliesToType.Skill &&
            entity.value === 0; // Class skill grants have value 0
    }

    private static isSkillBonusEntity(entity: FeatureEntity, skillId: number, skillSubId: number | null): boolean {
        return entity.type === EntityType.Bonus &&
            entity.appliesTo === EntityAppliesToType.Skill &&
            entity.appliesToId === skillId &&
            (entity.appliesToSubId === skillSubId || entity.appliesToSubId === -1 || (!entity.appliesToSubId && !skillSubId));
    }

    private static getSourceName(progression: FeatureProgression): string {
        if (progression.class?.name) {
            return progression.class.name;
        }
        // TODO: Add race and domain name resolution
        return 'Unknown Source';
    }
}

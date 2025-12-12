import { FeatureProgression, FeatureEntity, CharacterWithAllDetailsResponse, CharacterAdvancementWithDetailsResponse, Race, DnDClass } from '@shared/schema';
import { EntityType, EntityAppliesToType, CoreComponent } from '@shared/static-data';

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
     */
    static async getPendingChoices(resolvedProgressions: FeatureProgression[], cacheService: { getClassNameById: (id: number) => CoreComponent | undefined; getDomainSelectByEdition: (editionId: number) => CoreComponent[] }, editionId?: number): Promise<PendingChoice[]> {
        // Use the ChoiceResolver to identify pending choices
        return await ChoiceResolver.identifyPendingChoices(resolvedProgressions, cacheService, editionId);
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

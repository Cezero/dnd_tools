import { useCallback } from 'react';

import { useChoiceResolver, useCharacterFeatureResolution } from '@/features/character';
import type { ResolutionContext } from '@/features/character/types';
import { FeatureProgression, FeatureEntity, CharacterWithAllDetailsResponse, CharacterAdvancementWithDetailsResponse, Race, DnDClass } from '@shared/schema';
import { EntityType, EntityAppliesToType, PROFICIENCY_TYPE_ENUM } from '@shared/static-data';

/**
 * React hook for working with resolved character features
 */
export function useResolvedFeatureService() {
    const { resolveCharacterFeatures } = useCharacterFeatureResolution();
    const { identifyPendingChoices } = useChoiceResolver();

    /**
     * Get all resolved feature progressions for a character
     */
    const getResolvedFeatures = useCallback(async (
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
    ): Promise<FeatureProgression[]> => {
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

        const result = await resolveCharacterFeatures(character, targetLevel, context);
        return result.resolvedProgressions;
    }, [resolveCharacterFeatures]);

    /**
     * Get class skills from resolved features
     */
    const getClassSkills = useCallback((resolvedProgressions: FeatureProgression[]): Array<{ skillId: number; skillSubId: number | null }> => {
        const classSkills: Array<{ skillId: number; skillSubId: number | null }> = [];

        for (const progression of resolvedProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    if (isClassSkillEntity(entity)) {
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
    }, []);

    /**
     * Check if a specific skill is a class skill
     */
    const isClassSkill = useCallback((
        skillId: number,
        skillSubId: number | null,
        resolvedProgressions: FeatureProgression[]
    ): boolean => {
        for (const progression of resolvedProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    if (isClassSkillEntity(entity)) {
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
    }, []);

    /**
     * Get granted feats from resolved features
     */
    const getGrantedFeats = useCallback((resolvedProgressions: FeatureProgression[]): number[] => {
        const grantedFeats = new Set<number>();

        for (const progression of resolvedProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    if (isFeatGrantEntity(entity)) {
                        if (entity.appliesToId) {
                            grantedFeats.add(entity.appliesToId);
                        }
                    }
                }
            }
        }

        return Array.from(grantedFeats);
    }, []);

    /**
     * Get granted proficiencies from resolved features
     */
    const getGrantedProficiencies = useCallback((resolvedProgressions: FeatureProgression[]): Array<{
        type: keyof typeof PROFICIENCY_TYPE_ENUM;
        id: number;
        source: string;
    }> => {
        const proficiencies: Array<{
            type: keyof typeof PROFICIENCY_TYPE_ENUM;
            id: number;
            source: string;
        }> = [];

        for (const progression of resolvedProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    if (isProficiencyEntity(entity)) {
                        if (entity.appliesToId && entity.item) {
                            const source = getSourceName(progression);
                            proficiencies.push({
                                type: getProficiencyType(entity),
                                id: entity.appliesToId,
                                source,
                            });
                        }
                    }
                }
            }
        }

        return proficiencies;
    }, []);

    /**
     * Get skill bonuses from resolved features
     */
    const getSkillBonuses = useCallback((resolvedProgressions: FeatureProgression[]): Array<{ skillId: number; skillSubId: number | null; bonus: number; source: string }> => {
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
                        source: getSourceName(progression)
                    });
                }
            }
        }

        return skillBonuses;
    }, []);

    /**
     * Get pending choices from resolved features
     */
    const getPendingChoices = useCallback(async (resolvedProgressions: FeatureProgression[], editionId?: number) => {
        // Use the ChoiceResolver to identify pending choices
        return await identifyPendingChoices(resolvedProgressions, editionId);
    }, [identifyPendingChoices]);

    /**
     * Calculate total skill bonus including all bonuses from resolved features
     */
    const calculateSkillTotal = useCallback((
        skillId: number,
        skillSubId: number | null,
        baseTotal: number, // The base total from ClassSkillService (ranks + ability modifier)
        resolvedProgressions: FeatureProgression[]
    ): number => {
        let totalBonus = baseTotal;

        // Add bonuses from resolved features
        for (const progression of resolvedProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    if (isSkillBonusEntity(entity, skillId, skillSubId)) {
                        totalBonus += entity.value || 0;
                    }
                }
            }
        }

        return totalBonus;
    }, []);

    return {
        getResolvedFeatures,
        getClassSkills,
        isClassSkill,
        getGrantedFeats,
        getGrantedProficiencies,
        getSkillBonuses,
        getPendingChoices,
        calculateSkillTotal,
    };
}

// Private helper functions
function isClassSkillEntity(entity: FeatureEntity): boolean {
    // Class skill grants are Other entities that apply to skills with value 0
    // They are part of progressions with featureId 1 (Class Skill feature)
    return entity.type === EntityType.Other &&
        entity.appliesTo === EntityAppliesToType.Skill &&
        entity.value === 0; // Class skill grants have value 0
}

function isFeatGrantEntity(entity: FeatureEntity): boolean {
    return entity.type === EntityType.Other &&
        entity.appliesTo === EntityAppliesToType.Feat;
}

function isProficiencyEntity(entity: FeatureEntity): boolean {
    return entity.type === EntityType.Proficiency &&
        entity.appliesTo === EntityAppliesToType.Feat;
}


function isSkillBonusEntity(entity: FeatureEntity, skillId: number, skillSubId: number | null): boolean {
    return entity.type === EntityType.Bonus &&
        entity.appliesTo === EntityAppliesToType.Skill &&
        entity.appliesToId === skillId &&
        (entity.appliesToSubId === skillSubId || entity.appliesToSubId === -1 || (!entity.appliesToSubId && !skillSubId));
}

function getSourceName(progression: FeatureProgression): string {
    if (progression.class?.name) {
        return progression.class.name;
    }
    // TODO: Add race and domain name resolution
    return 'Unknown Source';
}

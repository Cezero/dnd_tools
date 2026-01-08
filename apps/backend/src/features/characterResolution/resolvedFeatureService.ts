import type { FeatureProgression, FeatureEntity } from '@shared/schema';
import { EntityType, EntityAppliesToType, SpecialFeatureId } from '@shared/static-data';

/**
 * Backend service for extracting resolved feature data
 * Ported from frontend ResolvedFeatureService
 */
export class ResolvedFeatureService {
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
            // Class skills are identified by progression.featureId === SpecialFeatureId.ClassSkill
            if (progression.featureId !== SpecialFeatureId.ClassSkill) {
                continue;
            }

            if (progression.entities) {
                for (const entity of progression.entities) {
                    // Check if this entity applies to skills
                    if (entity.appliesTo !== EntityAppliesToType.Skill || !entity.appliesToId) {
                        continue;
                    }

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
        return false;
    }

    /**
     * Get skill bonuses from resolved features
     * 
     * Includes bonuses from EntityType.Bonus and EntityType.Other entities that have values.
     * Excludes entities with conditions (those are conditional modifiers handled separately).
     */
    static getSkillBonuses(resolvedProgressions: FeatureProgression[]): Array<{ skillId: number; skillSubId: number | null; bonus: number; source: string }> {
        const skillBonuses: Array<{ skillId: number; skillSubId: number | null; bonus: number; source: string }> = [];

        for (const progression of resolvedProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    // Check if entity applies to skills and has a value
                    if (entity.appliesTo === EntityAppliesToType.Skill &&
                        entity.appliesToId !== null &&
                        entity.appliesToId !== undefined &&
                        entity.value !== null &&
                        entity.value !== undefined) {

                        // Skip entities with conditions - these are conditional modifiers
                        if (entity.conditions && entity.conditions.length > 0) {
                            continue;
                        }

                        // Include both Bonus and Other entity types that have values
                        // (racial skill bonuses and familiar benefits may be stored as Other type)
                        if (entity.type === EntityType.Bonus ||
                            (entity.type === EntityType.Other && entity.value !== 0)) {
                            const source = this.getSourceName(progression);
                            skillBonuses.push({
                                skillId: entity.appliesToId,
                                skillSubId: entity.appliesToSubId ?? null,
                                bonus: entity.value,
                                source
                            });
                        }
                    }
                }
            }
        }
        return skillBonuses;
    }

    /**
     * Get granted feats from resolved features
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
     * Get available feats count from resolved features
     */
    static getAvailableFeats(resolvedProgressions: FeatureProgression[], level: number, classLevels: Map<number, number>): number {
        let availableFeats = 0;

        // Base feat at level 1, then every 3 levels (3, 6, 9, 12, 15, 18)
        if (level >= 1) availableFeats++;
        if (level >= 3) availableFeats++;
        if (level >= 6) availableFeats++;
        if (level >= 9) availableFeats++;
        if (level >= 12) availableFeats++;
        if (level >= 15) availableFeats++;
        if (level >= 18) availableFeats++;

        // Check for bonus feats from progressions
        for (const progression of resolvedProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    if (entity.type === EntityType.Choice &&
                        entity.appliesTo === EntityAppliesToType.Feat) {
                        // Check if this feat choice is available at current level
                        if (progression.level <= level) {
                            // Check class level if it's class-specific
                            if (progression.classId) {
                                const classLevel = classLevels.get(progression.classId) ?? 0;
                                if (progression.level <= classLevel) {
                                    availableFeats += entity.value || 1;
                                }
                            } else {
                                availableFeats += entity.value || 1;
                            }
                        }
                    }
                }
            }
        }

        return availableFeats;
    }

    /**
     * Get available fighter bonus feats
     */
    static getAvailableFighterBonusFeats(resolvedProgressions: FeatureProgression[]): number {
        let availableFeats = 0;

        for (const progression of resolvedProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    if (entity.type === EntityType.Choice &&
                        entity.appliesTo === EntityAppliesToType.Feat &&
                        entity.filterType === 1) { // FeatureFeatChoiceFilter.FighterBonus
                        availableFeats += entity.value || 1;
                    }
                }
            }
        }

        return availableFeats;
    }

    /**
     * Check if an entity is a class skill entity
     */
    private static isClassSkillEntity(entity: FeatureEntity): boolean {
        return entity.type === EntityType.Other &&
            entity.appliesTo === EntityAppliesToType.Skill &&
            entity.appliesToId !== null &&
            entity.appliesToId !== undefined;
    }

    /**
     * Get source name for display
     */
    private static getSourceName(progression: FeatureProgression): string {
        if (progression.class?.name) {
            return progression.class.name;
        }
        if (progression.feature?.name) {
            return progression.feature.name;
        }
        // Fallback to source type if no class or feature name available
        if (progression.sourceType === 0) { // FeatureSourceType.Race
            return 'Race';
        }
        if (progression.sourceType === 1) { // FeatureSourceType.Class
            return 'Class';
        }
        return 'Unknown Source';
    }
}











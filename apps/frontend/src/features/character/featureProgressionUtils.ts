import type { FeatureProgression, FeatureEntity } from '@shared/schema';
import { EntityType, EntityAppliesToType, SpecialFeatureId } from '@shared/static-data';

/**
 * Utility functions for working with resolved feature progressions.
 * These are pure utility functions that operate on already-resolved progressions.
 * For feature resolution, use the backend CharacterResolutionApi.
 */

/**
 * Check if a specific skill is a class skill based on resolved progressions
 * 
 * @param skillId - The skill ID to check
 * @param skillSubId - The skill subtype ID (null for base skill)
 * @param resolvedProgressions - Resolved feature progressions from backend API
 * @returns true if the skill is a class skill
 */
export function isClassSkill(
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

                // Check if this entity applies to the skill we're checking
                if (entity.appliesToId === skillId) {
                    // If appliesToSubId === -1, all subtypes are class skills
                    if (entity.appliesToSubId === -1) {
                        return true;
                    }
                    // If appliesToSubId matches skillSubId, specific subtype is a class skill
                    if (entity.appliesToSubId === skillSubId) {
                        return true;
                    }
                    // If both are null/undefined, regular skill is a class skill
                    if (!entity.appliesToSubId && !skillSubId) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

/**
 * Get granted feats from resolved feature progressions
 * 
 * @param resolvedProgressions - Resolved feature progressions from backend API
 * @returns Array of feature entities that grant feats
 */
export function getGrantedFeats(resolvedProgressions: FeatureProgression[]): FeatureEntity[] {
    const grantedFeats: FeatureEntity[] = [];

    for (const progression of resolvedProgressions) {
        if (progression.entities) {
            for (const entity of progression.entities) {
                if (entity.type === EntityType.Other &&
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


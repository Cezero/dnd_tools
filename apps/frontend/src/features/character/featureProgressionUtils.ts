import type { FeatureWithRelations, FeatureEntity } from '@shared/schema';
import { EntityType, EntityAppliesToType, FeatureSourceType } from '@shared/static-data';

/**
 * Utility functions for working with resolved feature features.
 * These are pure utility functions that operate on already-resolved features.
 * For feature resolution, use the backend CharacterResolutionApi.
 */

/**
 * Check if a specific skill is a class skill based on resolved features
 * 
 * @param skillId - The skill ID to check
 * @param skillSubId - The skill subtype ID (null for base skill)
 * @param resolvedProgressions - Resolved feature features from backend API
 * @returns true if the skill is a class skill
 */
export function isClassSkill(
    skillId: number,
    skillSubId: number | null,
    resolvedProgressions: FeatureWithRelations[]
): boolean {
    for (const feature of resolvedProgressions) {
        // Class skills are identified by EntityType.Base + EntityAppliesToType.Skill in class features
        if (feature.sourceType !== FeatureSourceType.Class) {
            continue;
        }

        if (feature.entities) {
            for (const entity of feature.entities) {
                // Check if this entity is a Base skill entity
                if (entity.type !== EntityType.Base || 
                    entity.appliesTo !== EntityAppliesToType.Skill || 
                    !entity.appliesToId) {
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
 * Get granted feats from resolved feature features
 * 
 * @param resolvedProgressions - Resolved feature features from backend API
 * @returns Array of feature entities that grant feats
 */
export function getGrantedFeats(resolvedProgressions: FeatureWithRelations[]): FeatureEntity[] {
    const grantedFeats: FeatureEntity[] = [];

    for (const feature of resolvedProgressions) {
        if (feature.entities) {
            for (const entity of feature.entities) {
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


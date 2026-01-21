import type { FeatureWithRelations } from '@shared/schema';
import {
    EntityType,
    EntityAppliesToType,
    PROFICIENCY_TYPES,
    ITEM_TYPE_ENUM,
} from '@shared/static-data';

import type { ProficiencyResult } from './types';

/**
 * Extract proficiencies from resolved feature features
 * PUBLIC FUNCTION - Used by EquipmentTab and other components
 * 
 * @param resolvedProgressions - Resolved feature features from character
 * @returns Object containing weapon categories, armor categories, and specific item IDs
 */
export function extractProficiencies(resolvedProgressions: FeatureWithRelations[]): ProficiencyResult {
    const weaponCategories = new Set<number>();
    const armorCategories = new Set<number>();
    const itemIds = new Set<number>();

    for (const feature of resolvedProgressions) {
        if (feature.entities) {
            for (const entity of feature.entities) {
                // Check if this is a proficiency entity
                if (entity.type === EntityType.Other && entity.appliesTo === EntityAppliesToType.Proficiency) {
                    if (!entity.appliesToId) continue;

                    // Check if it's a category-based proficiency (appliesToSubId === -1 means "all")
                    if (entity.appliesToSubId === -1 || entity.appliesToSubId === null) {
                        // Category-based proficiency - appliesToId contains the proficiency type ID
                        if (entity.appliesToId) {
                            const proficiencyType = PROFICIENCY_TYPES[entity.appliesToId];
                                if (proficiencyType) {
                                    // Check if it's a weapon or armor proficiency
                                    if (proficiencyType.itemTypeId === ITEM_TYPE_ENUM.Weapon) {
                                        weaponCategories.add(proficiencyType.category);
                                    } else if (proficiencyType.itemTypeId === ITEM_TYPE_ENUM.Armor) {
                                        armorCategories.add(proficiencyType.category);
                                }
                            }
                        }
                    } else if (entity.appliesToSubId && entity.appliesToSubId > 0) {
                        // Specific item proficiency - appliesToSubId is the item ID
                        itemIds.add(entity.appliesToSubId);
                    }
                }
            }
        }
    }

    return {
        weaponCategories: Array.from(weaponCategories),
        armorCategories: Array.from(armorCategories),
        itemIds: Array.from(itemIds),
    };
}


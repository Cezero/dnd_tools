import type {
    CharacterWithAllDetailsResponse,
    FeatureWithRelations,
} from '@shared/schema';
import { EntityAppliesToType } from '@shared/static-data';

/**
 * Represents a character feat with source attribution
 */
export interface CharacterFeat {
    featId: number;
    source: 'advancement' | 'choice';
    sourceFeature?: {
        featureId: number;
        featureEntityId: number;
        featureName: string;
        level: number;
    };
    featSubId?: number | null;
}

/**
 * Get all character feats from both AdvancementFeat and CharacterFeatureChoice sources
 * Combines feats from advancement.feats (regular feats) and resolved feat choices
 * 
 * @param character - Character with all details including advancements
 * @param resolvedProgressions - Resolved feature features containing feat choices
 * @returns Unified list of all character feats with source attribution
 */
export function getAllCharacterFeats(
    character: CharacterWithAllDetailsResponse,
    resolvedProgressions: FeatureWithRelations[]
): CharacterFeat[] {
    const feats: CharacterFeat[] = [];

    // Add feats from AdvancementFeat (regular feats selected at level-up)
    for (const advancement of character.advancements) {
        if (!advancement.feats) continue;

        for (const featSelection of advancement.feats) {
            feats.push({
                featId: featSelection.featId,
                source: 'advancement',
                featSubId: featSelection.featSubId ?? null,
            });
        }
    }

    // Add feats from CharacterFeatureChoice (choice-based feats like fighter bonus feats)
    for (const advancement of character.advancements) {
        if (!advancement.featureChoices) continue;

        for (const choice of advancement.featureChoices) {
            // Find the feature and entity in resolved features
            // The feature should exist because it's the one that contains the choice entity
            let entityAppliesTo: number | null = null;
            let feature: FeatureWithRelations | null = null;
            let entityName: string | null = null;

            // Find the feature that contains this choice entity
            for (const prog of resolvedProgressions) {
                if (prog.id === choice.featureId) {
                    feature = prog;
                    entityName = prog.name || null;

                    // Find the entity within this feature
                    if (prog.entities) {
                        const entity = prog.entities.find(e => e.id === choice.featureEntityId);
                        if (entity) {
                            entityAppliesTo = entity.appliesTo;
                            break;
                        }
                    }
                }
            }

            // Only include if this is a feat choice (entity.appliesTo === EntityAppliesToType.Feat)
            // The choice itself (the selected feat) doesn't create a feature - feats don't have features
            // But the choice entity in the feature tells us what type of choice this is
            if (entityAppliesTo === EntityAppliesToType.Feat) {
                feats.push({
                    featId: choice.appliesToId,
                    source: 'choice',
                    sourceFeature: feature
                        ? {
                            featureId: choice.featureId,
                            featureEntityId: choice.featureEntityId,
                            featureName: entityName || 'Unknown Feature',
                            level: feature.level,
                        }
                        : undefined,
                    featSubId: choice.appliesToSubId ?? null,
                });
            }
        }
    }

    return feats;
}


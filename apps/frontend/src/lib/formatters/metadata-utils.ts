import { FeatQueryResponse } from '@shared/schema';
import type { FeatureProgression } from '@shared/schema';
import { ModifierAppliesToType } from '@shared/static-data';

import type { FormatterMetadata } from './types';
/**
 * Extracts FormatterMetadata from feature progressions
 * @param features - Array of feature progressions to extract metadata from
 * @param feats - Array of loaded feats to look up feat objects
 * @returns FormatterMetadata object with featObjects, featureNames, and itemNames
 */
export function extractFormatterMetadata(
    features: FeatureProgression[] | undefined,
    feats: FeatQueryResponse['results']
): FormatterMetadata {
    const featObjects: FeatQueryResponse['results'] = [];
    const featureNames: Array<{ id: number; name: string }> = [];
    const itemNames: Array<{ id: number; name: string }> = [];

    // Extract feature names from nested choice data
    features?.forEach(progression => {
        progression.choices?.forEach(choice => {
            if (choice.feat && choice.featId) {
                const feat = feats.find(f => f.id === choice.featId);
                if (feat) {
                    featObjects.push(feat);
                }
            }
            if (choice.feature && choice.featureId) {
                featureNames.push({
                    id: choice.featureId,
                    name: choice.feature.name
                });
            }
        });

        progression.modifiers?.forEach(modifier => {
            if (modifier.appliesTo === ModifierAppliesToType.Feat && modifier.appliesToId) {
                // Store full feat object for proficiency formatters
                const feat = feats.find(f => f.id === modifier.appliesToId);
                if (feat) {
                    featObjects.push(feat);
                }
            }

            // Extract item names from modifiers that have item data
            if (modifier.item) {
                itemNames.push({
                    id: modifier.item.id,
                    name: modifier.item.name
                });
            }
        });
    });

    // Remove duplicates
    const uniqueFeatObjects = Array.from(
        new Map(featObjects.map(item => [item.id, item])).values()
    );
    const uniqueFeatureNames = Array.from(
        new Map(featureNames.map(item => [item.id, item])).values()
    );
    const uniqueItemNames = Array.from(
        new Map(itemNames.map(item => [item.id, item])).values()
    );

    return {
        featObjects: uniqueFeatObjects.length > 0 ? uniqueFeatObjects : undefined,
        featureNames: uniqueFeatureNames.length > 0 ? uniqueFeatureNames : undefined,
        itemNames: uniqueItemNames.length > 0 ? uniqueItemNames : undefined
    };
}

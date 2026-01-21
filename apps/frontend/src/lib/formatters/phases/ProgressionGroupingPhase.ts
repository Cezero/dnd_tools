import type {
    GroupedLevelItem
} from '../types';

/**
 * Phase 4: Within-Feature Grouping
 * Handles grouping entities within a feature by featureId at each level
 */
export class ProgressionGroupingPhase {
    /**
     * Group entities within a feature by featureId at each level
     * This groups all entities with the same featureId at each level, regardless of groupingId
     */
    groupWithinProgression(
        withinLevelGrouped: GroupedLevelItem[]
    ): GroupedLevelItem[] {
        if (withinLevelGrouped.length === 0) {
            return [];
        }

        const results: GroupedLevelItem[] = [];

        // Group by level first
        const groupedByLevel = new Map<number, GroupedLevelItem[]>();
        for (const item of withinLevelGrouped) {
            if (!groupedByLevel.has(item.level)) {
                groupedByLevel.set(item.level, []);
            }
            groupedByLevel.get(item.level)!.push(item);
        }

        // For each level, group entities by featureId
        for (const [level, levelItems] of groupedByLevel) {
            if (levelItems.length > 0) {
                // Group ALL entities at this level by featureId
                const entitiesByFeatureId = new Map<number, GroupedLevelItem[]>();

                for (const item of levelItems) {
                    if (!entitiesByFeatureId.has(item.featureId)) {
                        entitiesByFeatureId.set(item.featureId, []);
                    }
                    entitiesByFeatureId.get(item.featureId)!.push(item);
                }

                // For each featureId, combine all entities with ', ' delimiter
                for (const [_featureId, featureEntities] of entitiesByFeatureId) {
                    if (featureEntities.length === 1) {
                        // Single entity - add as-is
                        results.push(featureEntities[0]);
                    } else {
                        // Multiple entities - combine with ', ' delimiter
                        const combinedValue = featureEntities.map(item => item.formattedValue).join(', ');
                        const firstItem = featureEntities[0];
                        results.push({
                            level,
                            featureId: firstItem.featureId,
                            formattedValue: combinedValue,
                            breakdown: { components: [] },
                            descriptionLevel: firstItem.descriptionLevel,
                            entityAppliesTo: undefined,
                            groupingId: 0 // Reset to 0 since we're now grouping by featureId
                        });
                    }
                }
            }
        }

        return results;
    }
}

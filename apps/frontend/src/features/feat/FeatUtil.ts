import { displayStrategyFactory } from '@/lib/formatters';
import { FeatureEntity, FeatureProgression } from '@shared/schema';
import { DisplayType, EntityAppliesToType, FeatureSourceType } from '@shared/static-data';

/**
 * Format a FeatureEntity using the display strategy system
 * Uses the actual FeatureProgression to ensure proper context (sourceType, featId, etc.)
 */
export const formatFeatureEntity = (entity: FeatureEntity, progression: FeatureProgression): string => {
    try {
        // Create a progression with just this entity for formatting
        const entityProgression: FeatureProgression = {
            ...progression,
            entities: [entity],
        };

        // Use Display Strategy to properly orchestrate the formatting process
        const detailStrategy = displayStrategyFactory.createStrategy(DisplayType.Detail);
        const displayResult = detailStrategy.format(entityProgression, {
            currentLevel: progression.level || 1,
            showBreakdown: false,
        });

        // Extract the formatted entity value from levelEntries
        if (displayResult.levelEntries && displayResult.levelEntries.length > 0) {
            const firstLevelEntry = displayResult.levelEntries[0];
            if (firstLevelEntry.items && firstLevelEntry.items.length > 0) {
                return firstLevelEntry.items[0].formattedValue || '';
            }
        }

        // Fallback to formattedValue if levelEntries structure is different
        return displayResult.formattedValue || '';
    } catch (error) {
        console.error('Error formatting feature entity:', error);
        return 'Error formatting entity';
    }
};

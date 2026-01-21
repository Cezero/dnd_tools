import type { FeatureWithRelations } from '@shared/schema';
import { DisplayType, FeatureSourceType } from '@shared/static-data';

import { CharacterSheetDisplayStrategy } from './characterSheetDisplayStrategy';
import { DisplayStrategyBase } from './displayStrategyBase';
import type {
    DisplayContext,
    DisplayResult,
    LevelEntry,
    DisplayStrategy,
    GroupedLevelItem,
    CalculatedValueWithLevel,
} from './types';

export class EditPageDisplayStrategy extends DisplayStrategyBase {
    protected formatProgressions(
        features: FeatureWithRelations[],
        context?: DisplayContext,
        showLabels: boolean = true
    ): DisplayResult {
        // just use the first feature
        return this.orchestrateFormatting(features[0], context, showLabels);
    }

    /**
     * Override Phase 6 to implement DisplayType.Edit specific logic
     */
    protected createDisplayResult(
        withinProgressionGrouped: GroupedLevelItem[],
        context?: DisplayContext,
        feature?: FeatureWithRelations
    ): DisplayResult {
        // Suppress level label for Feat features (feats don't have levels)
        const isFeatProgression = feature?.sourceType === FeatureSourceType.Feat;
        const showLevelLabel = !isFeatProgression;

        if (withinProgressionGrouped.length === 0) {
            return {
                formattedValue: showLevelLabel ? `Level ${feature.level}` : '',
                breakdown: { components: [] },
                showBreakdown: context?.showBreakdown || false,
                components: [],
                levelEntries: []
            };
        }

        // withinProgressionGrouped already contains only the changed items at their respective levels
        // No need to group by level again - just create LevelEntry objects directly
        const levelEntries: LevelEntry[] = withinProgressionGrouped.map(item => ({
            level: item.level,
            description: showLevelLabel ? `Level ${item.level}` : '',
            items: [item]
        }));

        // DisplayType.Edit: Phase 4 already combined all entities at each level
        // Add "Level X:" prefix only if not a Feat feature, then join with "; "
        const levelStrings = withinProgressionGrouped
            .map(item => showLevelLabel ? `Level ${item.level}: ${item.formattedValue}` : item.formattedValue);

        const formattedValue = levelStrings.join('; ');

        return {
            formattedValue,
            breakdown: { components: [] }, // Simplified for now
            showBreakdown: context?.showBreakdown || false,
            components: [],
            levelEntries
        };
    }
}

export class DetailPageDisplayStrategy extends DisplayStrategyBase {
    /**
     * Override generateValues to filter out modifiers with displayInDetail: false
     */
    protected generateValues(
        feature: FeatureWithRelations,
        context?: DisplayContext,
    ): CalculatedValueWithLevel[] {
        // Create a filtered feature with only modifiers that should display in detail
        const filteredProgression: FeatureWithRelations = {
            ...feature,
            entities: feature.entities?.filter(entity => entity.displayInDetail !== false) || []
        };

        // Use the value generation phase with the filtered feature
        return this.valueGenerationPhase.generateValues(filteredProgression, context);
    }

    protected formatProgressions(
        features: FeatureWithRelations[],
        context?: DisplayContext,
        showLabels: boolean = true
    ): DisplayResult {
        if (!features || features.length === 0) {
            return {
                formattedValue: '',
                breakdown: { components: [] },
                showBreakdown: context?.showBreakdown || false,
                components: [],
                levelEntries: []
            };
        }

        // Process each feature individually using the base orchestration
        const progressionResults: DisplayResult[] = [];

        for (const feature of features) {
            // Use orchestrateFormatting for Phases 1-5 (same as EditPageDisplayStrategy)
            const result = this.orchestrateFormatting(feature, context, showLabels);
            progressionResults.push(result);
        }

        // Phase 6: Multi-Feature Level Grouping (Detail only)
        const levelEntries = this.groupMultiProgressionByLevel(progressionResults, features);

        // Preserve formattedPrerequisites from the first feature that has them
        const formattedPrerequisites = progressionResults.find(r => r.formattedPrerequisites && r.formattedPrerequisites.length > 0)?.formattedPrerequisites;

        return {
            formattedValue: 'Full Feature',
            breakdown: { components: [] },
            showBreakdown: context?.showBreakdown || false,
            components: [],
            levelEntries,
            formattedPrerequisites
        };
    }

    /**
     * Override Phase 6 to implement DisplayType.Detail specific logic
     * This is a no-op since DetailPageDisplayStrategy handles Phase 6 in groupMultiProgressionByLevel
     */
    protected createDisplayResult(
        withinProgressionGrouped: GroupedLevelItem[],
        context?: DisplayContext,
        feature?: FeatureWithRelations
    ): DisplayResult {
        // Suppress level label for Feat features (feats don't have levels)
        const isFeatProgression = feature?.sourceType === FeatureSourceType.Feat;
        const showLevelLabel = !isFeatProgression;

        // DisplayType.Detail: This method is a no-op - pass through the data unchanged
        // The actual Phase 6 logic is handled in groupMultiProgressionByLevel
        if (withinProgressionGrouped.length === 0) {
            // for features with no items, return a level entry with an empty item so the feature still displays
            return {
                formattedValue: '',
                breakdown: { components: [] },
                showBreakdown: context?.showBreakdown || false,
                components: [],
                levelEntries: [{
                    level: feature.level,
                    description: showLevelLabel ? `Level ${feature.level}` : '',
                    items: [{
                        level: feature.level,
                        featureId: feature.id,
                        formattedValue: '',
                        breakdown: { components: [] },
                        descriptionLevel: feature.level,
                        entityAppliesTo: undefined,
                        groupingId: 0 // Default grouping for ungrouped entities
                    }]
                }]
            };
        }

        // Create a simple DisplayResult that preserves the data without transformation
        const levelEntries: LevelEntry[] = withinProgressionGrouped.map(item => ({
            level: item.level,
            description: showLevelLabel ? `Level ${item.level}` : '',
            items: [item]
        }));

        return {
            formattedValue: withinProgressionGrouped.map(item => item.formattedValue).join(', '),
            breakdown: { components: [] },
            showBreakdown: context?.showBreakdown || false,
            components: [],
            levelEntries
        };
    }

    /**
     * Phase 6: Multi-Feature Level Grouping (Detail only)
     * Group multiple Features by level
     */
    private groupMultiProgressionByLevel(
        progressionResults: DisplayResult[],
        features: FeatureWithRelations[]
    ): LevelEntry[] {
        // Group by level
        const groupedByLevel = new Map<number, LevelEntry[]>();

        for (const item of progressionResults) {
            for (const levelEntry of item.levelEntries) {
                if (!groupedByLevel.has(levelEntry.level)) {
                    groupedByLevel.set(levelEntry.level, []);
                }
                groupedByLevel.get(levelEntry.level)!.push(levelEntry);
            }
        }

        // Check if any feature is from a Feat to suppress level labels
        const hasFeatProgression = features.some(feature => feature.sourceType === FeatureSourceType.Feat);

        // Create LevelEntry[] for each level
        const levelEntries: LevelEntry[] = [];
        for (const [level, items] of groupedByLevel) {
            levelEntries.push({
                level,
                description: hasFeatProgression ? '' : `Level ${level}`,
                items: items.flatMap(item => item.items)
            });
        }

        // Sort by level
        return levelEntries.sort((a, b) => a.level - b.level);
    }
}

// Private singleton instances - only accessible through factory
const editPageStrategy = new EditPageDisplayStrategy();
const detailPageStrategy = new DetailPageDisplayStrategy();
const characterSheetStrategy = new CharacterSheetDisplayStrategy();

export class DisplayStrategyFactory {
    static createStrategy(displayType: DisplayType): DisplayStrategy {
        switch (displayType) {
            case DisplayType.Edit:
                return editPageStrategy;
            case DisplayType.Detail:
                return detailPageStrategy;
            case DisplayType.CharacterSheet:
                return characterSheetStrategy;
            default:
                throw new Error(`Unknown display type: ${displayType}`);
        }
    }
}

export const displayStrategyFactory = DisplayStrategyFactory;

import type { FeatureProgression } from '@shared/schema';
import { DisplayType, FeatureType } from '@shared/static-data';

import { DisplayStrategyBase } from './displayStrategyBase';
import type {
    DisplayContext,
    DisplayResult,
    LevelEntry,
    DisplayStrategy,
    FormatterMetadata,
    GroupedLevelItem,
    CalculatedValueWithLevel
} from './types';

export class EditPageDisplayStrategy extends DisplayStrategyBase {
    protected formatProgressions(
        progressions: FeatureProgression[],
        context?: DisplayContext,
        metadata?: FormatterMetadata,
        showLabels: boolean = true
    ): DisplayResult {
        // just use the first progression
        return this.orchestrateFormatting(progressions[0], context, metadata, showLabels);
    }

    /**
     * Override Phase 6 to implement DisplayType.Edit specific logic
     */
    protected createDisplayResult(
        withinProgressionGrouped: GroupedLevelItem[],
        context?: DisplayContext,
        progression?: FeatureProgression
    ): DisplayResult {
        if (withinProgressionGrouped.length === 0) {
            return {
                formattedValue: `Level ${progression.level}`,
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
            description: `Level ${item.level}`,
            items: [item]
        }));

        // DisplayType.Edit: Phase 5 already combined all entities at each level
        // Now just add "Level X:" prefix and join with "; "
        const transitionStrings = withinProgressionGrouped
            .map(item => `Level ${item.level}: ${item.formattedValue}`);

        const formattedValue = transitionStrings.join('; ');

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
        progression: FeatureProgression,
        context?: DisplayContext,
        _metadata?: FormatterMetadata
    ): CalculatedValueWithLevel[] {
        // Create a filtered progression with only modifiers that should display in detail
        const filteredProgression: FeatureProgression = {
            ...progression,
            modifiers: progression.modifiers?.filter(modifier => modifier.displayInDetail !== false) || []
        };

        // Use the base implementation with the filtered progression
        return super.generateValues(filteredProgression, context, _metadata);
    }

    protected formatProgressions(
        progressions: FeatureProgression[],
        context?: DisplayContext,
        metadata?: FormatterMetadata,
        showLabels: boolean = true
    ): DisplayResult {
        if (!progressions || progressions.length === 0) {
            return {
                formattedValue: '',
                breakdown: { components: [] },
                showBreakdown: context?.showBreakdown || false,
                components: [],
                levelEntries: []
            };
        }

        // Process each progression individually using the base orchestration
        const progressionResults: DisplayResult[] = [];

        for (const progression of progressions) {
            // Use orchestrateFormatting for Phases 1-5 (same as EditPageDisplayStrategy)
            const result = this.orchestrateFormatting(progression, context, metadata, showLabels);
            progressionResults.push(result);
        }

        // Phase 6: Multi-Progression Level Grouping (Detail only)
        const levelEntries = this.groupMultiProgressionByLevel(progressionResults);

        return {
            formattedValue: 'Full Progression',
            breakdown: { components: [] },
            showBreakdown: context?.showBreakdown || false,
            components: [],
            levelEntries
        };
    }

    /**
     * Override Phase 6 to implement DisplayType.Detail specific logic
     * This is a no-op since DetailPageDisplayStrategy handles Phase 6 in groupMultiProgressionByLevel
     */
    protected createDisplayResult(
        withinProgressionGrouped: GroupedLevelItem[],
        context?: DisplayContext,
        progression?: FeatureProgression
    ): DisplayResult {
        // DisplayType.Detail: This method is a no-op - pass through the data unchanged
        // The actual Phase 6 logic is handled in groupMultiProgressionByLevel
        if (withinProgressionGrouped.length === 0) {
            // for progressions with no items, return a level entry with an empty item so the feature still displays
            return {
                formattedValue: '',
                breakdown: { components: [] },
                showBreakdown: context?.showBreakdown || false,
                components: [],
                levelEntries: [{
                    level: progression.level,
                    description: `Level ${progression.level}`,
                    items: [{
                        level: progression.level,
                        featureId: progression.featureId,
                        formattedValue: '',
                        breakdown: { components: [] },
                        descriptionLevel: progression.level,
                        progressionId: progression.id,
                        entityType: FeatureType.Modifier,
                        entitySubType: 0,
                        entityAppliesTo: undefined,
                        groupingId: 0 // Default grouping for ungrouped entities
                    }]
                }]
            };
        }

        // Create a simple DisplayResult that preserves the data without transformation
        const levelEntries: LevelEntry[] = withinProgressionGrouped.map(item => ({
            level: item.level,
            description: `Level ${item.level}`,
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
     * Phase 6: Multi-Progression Level Grouping (Detail only)
     * Group multiple FeatureProgressions by level
     */
    private groupMultiProgressionByLevel(
        progressionResults: DisplayResult[]
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

        // Create LevelEntry[] for each level
        const levelEntries: LevelEntry[] = [];
        for (const [level, items] of groupedByLevel) {
            levelEntries.push({
                level,
                description: `Level ${level}`,
                items: items.flatMap(item => item.items)
            });
        }

        // Sort by level
        return levelEntries.sort((a, b) => a.level - b.level);
    }
}

export class CharacterSheetDisplayStrategy extends DisplayStrategyBase {
    protected formatProgressions(
        progressions: FeatureProgression[],
        context?: DisplayContext,
        metadata?: FormatterMetadata,
        showLabels: boolean = true
    ): DisplayResult {
        // Character sheet shows current level values only
        const currentLevel = context?.character?.classLevels ?
            Math.max(...Object.values(context.character.classLevels)) : 1;

        const formattedItems: GroupedLevelItem[] = [];

        for (const progression of progressions) {
            // Use orchestration for character sheet display
            const result = this.orchestrateFormatting(progression, context, metadata, showLabels);
            if (result.formattedValue) {
                formattedItems.push({
                    level: currentLevel,
                    featureId: progression.featureId,
                    formattedValue: result.formattedValue,
                    breakdown: result.breakdown,
                    descriptionLevel: progression.level,
                    progressionId: progression.id,
                    entityType: FeatureType.Modifier, // Default type
                    entitySubType: 0, // Default subtype
                    entityAppliesTo: undefined,
                    groupingId: 0 // Default grouping for ungrouped entities
                });
            }
        }

        const levelEntries = [{
            level: currentLevel,
            description: `Level ${currentLevel}`,
            items: formattedItems
        }];

        // Create a DisplayResult from the levelEntries
        const formattedValue = formattedItems.map(item => item.formattedValue).join(', ');

        return {
            formattedValue,
            breakdown: { components: [] },
            showBreakdown: context?.showBreakdown || false,
            components: [],
            levelEntries
        };
    }

    /**
     * Override Phase 6 to implement DisplayType.CharacterSheet specific logic
     */
    protected createDisplayResult(
        withinProgressionGrouped: GroupedLevelItem[],
        context?: DisplayContext,
        _progression?: FeatureProgression
    ): DisplayResult {
        // DisplayType.CharacterSheet: filter to current character level only
        const currentLevel = context?.character?.classLevels ?
            Math.max(...Object.values(context.character.classLevels)) : 1;

        // Find the item for the current level
        const currentItem = withinProgressionGrouped.find(item => item.level === currentLevel);

        if (!currentItem) {
            return {
                formattedValue: '',
                breakdown: { components: [] },
                showBreakdown: context?.showBreakdown || false,
                components: [],
                levelEntries: []
            };
        }

        return {
            formattedValue: currentItem.formattedValue,
            breakdown: { components: [] },
            showBreakdown: context?.showBreakdown || false,
            components: [],
            levelEntries: []
        };
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

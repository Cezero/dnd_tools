import type { FeatureProgression } from '@shared/schema';
import { DisplayType } from '@shared/static-data';

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
        progressions: FeatureProgression[],
        context?: DisplayContext,
        showLabels: boolean = true
    ): DisplayResult {
        // just use the first progression
        return this.orchestrateFormatting(progressions[0], context, showLabels);
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

        // DisplayType.Edit: Phase 4 already combined all entities at each level
        // Now just add "Level X:" prefix and join with "; "
        const levelStrings = withinProgressionGrouped
            .map(item => `Level ${item.level}: ${item.formattedValue}`);

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
        progression: FeatureProgression,
        context?: DisplayContext,
    ): CalculatedValueWithLevel[] {
        // Create a filtered progression with only modifiers that should display in detail
        const filteredProgression: FeatureProgression = {
            ...progression,
            entities: progression.entities?.filter(entity => entity.displayInDetail !== false) || []
        };

        // Use the value generation phase with the filtered progression
        return this.valueGenerationPhase.generateValues(filteredProgression, context);
    }

    protected formatProgressions(
        progressions: FeatureProgression[],
        context?: DisplayContext,
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
            const result = this.orchestrateFormatting(progression, context, showLabels);
            progressionResults.push(result);
        }

        // Phase 6: Multi-Progression Level Grouping (Detail only)
        const levelEntries = this.groupMultiProgressionByLevel(progressionResults);

        // Preserve formattedPrerequisites from the first progression that has them
        const formattedPrerequisites = progressionResults.find(r => r.formattedPrerequisites && r.formattedPrerequisites.length > 0)?.formattedPrerequisites;

        return {
            formattedValue: 'Full Progression',
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

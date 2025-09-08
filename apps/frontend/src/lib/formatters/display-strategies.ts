import type { FeatureProgression } from '@shared/schema';
import { DisplayType, EntityAppliesToType } from '@shared/static-data';

import { DisplayStrategyBase } from './displayStrategyBase';
import type {
    DisplayContext,
    DisplayResult,
    LevelEntry,
    DisplayStrategy,
    GroupedLevelItem,
    CalculatedValueWithLevel,
    FormattedEntityResult,
    CharacterSheetDisplayResult,
    FormattedItemWithLevel,
    CalculatedEntity
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
        showLabels: boolean = true
    ): CharacterSheetDisplayResult {
        // Process all progressions through phases 1-4 (skip grouping phases)
        const allFormattedItems: FormattedItemWithLevel[] = [];

        for (const progression of progressions) {
            const calculatedValues = this.generateValues(progression, context);
            const formattedItems = this.formattingPhase.formatItems(calculatedValues, progression.level, showLabels);
            allFormattedItems.push(...formattedItems);
        }

        // Convert to FormattedEntityResult
        const individualEntities: FormattedEntityResult[] = allFormattedItems.map(item => ({
            formattedValue: item.formattedValue,
            breakdown: item.breakdown,
            entity: item.entity,
            level: item.level,
            computedValue: this.extractComputedValue(item),
            structuredData: this.extractStructuredData(item)
        }));

        // Group by EntityAppliesToType
        const groupedByType = this.groupByEntityType(individualEntities);

        return {
            formattedValue: '', // Not used for character sheet
            breakdown: { components: [] },
            showBreakdown: false,
            components: [],
            levelEntries: [],
            groupedByType,
            individualEntities
        };
    }

    /**
     * Extract computed numeric value from formatted item
     */
    private extractComputedValue(item: FormattedItemWithLevel): number | undefined {
        // For bonuses, try to extract the numeric value
        if (item.entity.type === 0 && item.entity.value !== null) { // EntityType.Bonus
            // Handle both number and string values
            if (typeof item.entity.value === 'number') {
                return item.entity.value;
            }
            // If it's a string, try to parse it as a number
            const parsed = parseFloat(item.entity.value);
            return isNaN(parsed) ? undefined : parsed;
        }

        // For other types, try to extract from breakdown
        if (item.breakdown.components.length > 0) {
            const lastComponent = item.breakdown.components[item.breakdown.components.length - 1];
            if (typeof lastComponent.value === 'number') {
                return lastComponent.value;
            }
        }

        return undefined;
    }

    /**
     * Extract structured data from formatted item
     * TODO: what is the poiunt of this function? when is it called?
     */
    private extractStructuredData(item: FormattedItemWithLevel): FormattedEntityResult['structuredData'] {
        const entity = item.entity;

        // For bonuses
        if (entity.type === 0) { // EntityType.Bonus
            const value = typeof entity.value === 'number' ? entity.value : 0;
            return {
                type: 'bonus',
                value: value,
                target: this.getTargetName(entity)
            };
        }

        // For uses
        if (entity.appliesTo === EntityAppliesToType.Uses) {
            const value = typeof entity.value === 'number' ? entity.value : 0;
            return {
                type: 'uses',
                value: value,
                interval: 'day' // Default, could be extracted from formula params
            };
        }

        // For proficiencies
        if (entity.appliesTo === EntityAppliesToType.Feat) {
            return {
                type: 'proficiency',
                value: 1, // Proficiency is binary
                target: this.getTargetName(entity)
            };
        }

        return undefined;
    }

    /**
     * Get target name for structured data
     */
    private getTargetName(entity: CalculatedEntity): string | undefined {
        if (entity.item?.name) {
            return entity.item.name;
        }
        if (entity.feat?.name) {
            return entity.feat.name;
        }
        if (entity.feature?.name) {
            return entity.feature.name;
        }
        return undefined;
    }

    /**
     * Group entities by EntityAppliesToType
     */
    private groupByEntityType(entities: FormattedEntityResult[]): Record<EntityAppliesToType, FormattedEntityResult[]> {
        const grouped: Record<EntityAppliesToType, FormattedEntityResult[]> = {} as Record<EntityAppliesToType, FormattedEntityResult[]>;

        for (const entity of entities) {
            const appliesTo = entity.entity.appliesTo;
            if (appliesTo !== null && appliesTo !== undefined) {
                if (!grouped[appliesTo]) {
                    grouped[appliesTo] = [];
                }
                grouped[appliesTo].push(entity);
            }
        }

        return grouped;
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

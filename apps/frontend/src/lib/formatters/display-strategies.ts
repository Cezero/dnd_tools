import type {
    DisplayStrategy,
    GroupingStrategy
} from './interfaces';
import type {
    FeatureProgressionWithRelations,
    DisplayContext,
    DisplayResult,
    EditPageDisplayResult,
    LevelEntry,
    LevelFormattedItem
} from '@shared/schema';
import { DisplayType } from '@shared/static-data';
import { formatterRegistry } from './formatter-registry';
import { progressionGenerator, transitionDetector } from './progression-generators';

/**
 * Strategy for Edit Page display (1:1 relationship between FeatureProgression and display)
 */
export class EditPageDisplayStrategy implements DisplayStrategy {
    formatProgression(
        progression: FeatureProgressionWithRelations,
        context?: DisplayContext
    ): EditPageDisplayResult {
        // Each FeatureProgression produces exactly one formatted string
        const formattedValue = this.formatSingleProgression(progression, context);

        // Find formula params in modifiers
        const formulaModifier = progression.modifiers?.find(m => m.formulaParams);
        const breakdown = formulaModifier?.formulaParams ? {
            components: []
        } : undefined;

        return {
            progressionId: progression.id,
            formattedValue,
            breakdown
        };
    }

    private formatSingleProgression(
        progression: FeatureProgressionWithRelations,
        context?: DisplayContext
    ): string {
        // Find formula params in modifiers
        const formulaModifier = progression.modifiers?.find(m => m.formulaParams);

        if (formulaModifier?.formulaParams) {
            // Formula-based progression
            const values = progressionGenerator.generateProgressionValues(
                formulaModifier.formulaParams,
                progression.level,
                20 // Max level for display
            );

            const transitions = transitionDetector.findTransitions(values);

            if (transitions.length === 0) {
                // No transitions - show single value
                return `Level ${progression.level}: ${values[0]?.value || 0}`;
            } else {
                // Show progression with transitions
                const transitionDescriptions = transitions.map(t =>
                    `Level ${t.level}: ${t.value}`
                );
                return `Level ${progression.level} (${transitionDescriptions.join(', ')})`;
            }
        } else if (progression.choices && progression.choices.length > 0) {
            // Choice-based progression
            const choiceFormatter = formatterRegistry.getChoiceFormatter(progression.choices[0].type);
            const choiceDescriptions = progression.choices.map(choice =>
                choiceFormatter.formatChoice(choice, context)
            );
            return `Level ${progression.level} (${choiceDescriptions.join(', ')})`;
        } else {
            // Simple progression
            return `Level ${progression.level}`;
        }
    }
}

/**
 * Strategy for Detail Page display (grouped by Feature + Level)
 */
export class DetailPageDisplayStrategy implements DisplayStrategy {
    formatProgressions(
        progressions: FeatureProgressionWithRelations[],
        context?: DisplayContext
    ): DisplayResult {
        // Group by level, then by feature
        const groupedByLevel = this.groupByLevel(progressions);
        const levelEntries: LevelEntry[] = [];

        for (const [level, levelProgressions] of groupedByLevel) {
            // Group by feature within each level
            const groupedByFeature = this.groupByFeature(levelProgressions);
            const formattedItems: LevelFormattedItem[] = [];

            for (const [featureId, featureProgressions] of groupedByFeature) {
                const formattedValue = this.formatFeatureGroup(featureProgressions, context);
                formattedItems.push({
                    featureId,
                    formattedValue,
                    breakdown: undefined // Detail pages don't need breakdowns
                });
            }

            levelEntries.push({
                level,
                description: `Level ${level}`,
                items: formattedItems
            });
        }

        return {
            formattedValue: "Detail Page Display",
            breakdown: { components: [] },
            showBreakdown: false,
            components: [],
            levelEntries
        };
    }

    private groupByLevel(progressions: FeatureProgressionWithRelations[]): Map<number, FeatureProgressionWithRelations[]> {
        const grouped = new Map<number, FeatureProgressionWithRelations[]>();

        for (const progression of progressions) {
            const level = progression.level;
            if (!grouped.has(level)) {
                grouped.set(level, []);
            }
            grouped.get(level)!.push(progression);
        }

        return grouped;
    }

    private groupByFeature(progressions: FeatureProgressionWithRelations[]): Map<number, FeatureProgressionWithRelations[]> {
        const grouped = new Map<number, FeatureProgressionWithRelations[]>();

        for (const progression of progressions) {
            const featureId = progression.featureId;
            if (!grouped.has(featureId)) {
                grouped.set(featureId, []);
            }
            grouped.get(featureId)!.push(progression);
        }

        return grouped;
    }

    private formatFeatureGroup(
        progressions: FeatureProgressionWithRelations[],
        context?: DisplayContext
    ): string {
        if (progressions.length === 1) {
            return this.formatSingleProgression(progressions[0], context);
        }

        // Multiple progressions for same feature - combine them
        const formattedParts: string[] = [];

        for (const progression of progressions) {
            // Find formula params in modifiers
            const formulaModifier = progression.modifiers?.find(m => m.formulaParams);
            if (formulaModifier?.formulaParams) {
                const values = progressionGenerator.generateProgressionValues(
                    formulaModifier.formulaParams,
                    progression.level,
                    20
                );
                const currentValue = values[0]?.value || 0;
                formattedParts.push(`+${currentValue}`);
            } else if (progression.choices && progression.choices.length > 0) {
                const choiceFormatter = formatterRegistry.getChoiceFormatter(progression.choices[0].type);
                const choiceDescriptions = progression.choices.map(choice =>
                    choiceFormatter.formatChoice(choice, context)
                );
                formattedParts.push(choiceDescriptions.join(', '));
            }
        }

        return formattedParts.join(', ');
    }

    private formatSingleProgression(
        progression: FeatureProgressionWithRelations,
        context?: DisplayContext
    ): string {
        // Find formula params in modifiers
        const formulaModifier = progression.modifiers?.find(m => m.formulaParams);
        if (formulaModifier?.formulaParams) {
            const values = progressionGenerator.generateProgressionValues(
                formulaModifier.formulaParams,
                progression.level,
                20
            );
            const currentValue = values[0]?.value || 0;
            return `+${currentValue}`;
        } else if (progression.choices && progression.choices.length > 0) {
            const choiceFormatter = formatterRegistry.getChoiceFormatter(progression.choices[0].type);
            const choiceDescriptions = progression.choices.map(choice =>
                choiceFormatter.formatChoice(choice, context)
            );
            return choiceDescriptions.join(', ');
        } else {
            return '';
        }
    }
}

/**
 * Strategy for Character Sheet display (minimal grouping, context-specific)
 */
export class CharacterSheetDisplayStrategy implements DisplayStrategy {
    formatProgressions(
        progressions: FeatureProgressionWithRelations[],
        context?: DisplayContext
    ): DisplayResult {
        // Character sheet shows current level values only
        const currentLevel = context?.character?.classLevels ?
            Math.max(...Object.values(context.character.classLevels)) : 1;

        const formattedItems: LevelFormattedItem[] = [];

        for (const progression of progressions) {
            // Find formula params in modifiers
            const formulaModifier = progression.modifiers?.find(m => m.formulaParams);
            if (formulaModifier?.formulaParams) {
                const values = progressionGenerator.generateProgressionValues(
                    formulaModifier.formulaParams,
                    progression.level,
                    currentLevel
                );
                const currentValue = values[values.length - 1]?.value || 0;

                formattedItems.push({
                    featureId: progression.featureId,
                    formattedValue: `+${currentValue}`,
                    breakdown: values[values.length - 1]?.breakdown
                });
            } else if (progression.choices && progression.choices.length > 0) {
                const choiceFormatter = formatterRegistry.getChoiceFormatter(progression.choices[0].type);
                const choiceDescriptions = progression.choices.map(choice =>
                    choiceFormatter.formatChoice(choice, context)
                );

                formattedItems.push({
                    featureId: progression.featureId,
                    formattedValue: choiceDescriptions.join(', '),
                    breakdown: undefined
                });
            }
        }

        return {
            formattedValue: "Character Sheet Display",
            breakdown: { components: [] },
            showBreakdown: false,
            components: [],
            levelEntries: [{
                level: currentLevel,
                description: `Level ${currentLevel}`,
                items: formattedItems
            }]
        };
    }
}

/**
 * Factory for creating display strategies based on context
 */
export class DisplayStrategyFactory {
    static createStrategy(displayType: DisplayType): DisplayStrategy {
        switch (displayType) {
            case DisplayType.Edit:
                return new EditPageDisplayStrategy();
            case DisplayType.Detail:
                return new DetailPageDisplayStrategy();
            case DisplayType.CharacterSheet:
                return new CharacterSheetDisplayStrategy();
            default:
                throw new Error(`Unknown display type: ${displayType}`);
        }
    }
}

// Export singleton instances
export const editPageStrategy = new EditPageDisplayStrategy();
export const detailPageStrategy = new DetailPageDisplayStrategy();
export const characterSheetStrategy = new CharacterSheetDisplayStrategy();
export const displayStrategyFactory = DisplayStrategyFactory;

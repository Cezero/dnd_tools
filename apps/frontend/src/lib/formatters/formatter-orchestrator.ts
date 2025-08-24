import type {
    FormatterOrchestrator
} from './interfaces';
import type {
    FeatureProgressionWithRelations,
    DisplayContext,
    DisplayResult,
    EditPageDisplayResult
} from '@shared/schema';
import { DisplayType } from '@shared/static-data';
import { formatterRegistry } from './formatter-registry';
import { progressionGenerator, transitionDetector } from './progression-generators';
import {
    editPageStrategy,
    detailPageStrategy,
    characterSheetStrategy,
    displayStrategyFactory
} from './display-strategies';

/**
 * Main orchestrator for the formatter system
 * Coordinates all layers: pure formatters, calculations, progression generation, and display strategies
 */
export class FormatterOrchestratorImpl implements FormatterOrchestrator {
    /**
     * Format a single progression for edit pages (1:1 relationship)
     */
    formatProgressionForEdit(
        progression: FeatureProgressionWithRelations,
        context?: DisplayContext
    ): EditPageDisplayResult {
        return editPageStrategy.formatProgression(progression, context);
    }

    /**
     * Format multiple progressions for detail pages (grouped by Feature + Level)
     */
    formatProgressionsForDetail(
        progressions: FeatureProgressionWithRelations[],
        context?: DisplayContext
    ): DisplayResult {
        return detailPageStrategy.formatProgressions(progressions, context);
    }

    /**
     * Format progressions for character sheet (current level values only)
     */
    formatProgressionsForCharacterSheet(
        progressions: FeatureProgressionWithRelations[],
        context?: DisplayContext
    ): DisplayResult {
        return characterSheetStrategy.formatProgressions(progressions, context);
    }

    /**
     * Generic method to format progressions based on display type
     */
    formatProgressions(
        progressions: FeatureProgressionWithRelations[],
        displayType: DisplayType,
        context?: DisplayContext
    ): DisplayResult | EditPageDisplayResult[] {
        switch (displayType) {
            case DisplayType.Edit:
                return progressions.map(progression =>
                    this.formatProgressionForEdit(progression, context)
                );
            case DisplayType.Detail:
                return this.formatProgressionsForDetail(progressions, context);
            case DisplayType.CharacterSheet:
                return this.formatProgressionsForCharacterSheet(progressions, context);
            default:
                throw new Error(`Unknown display type: ${displayType}`);
        }
    }

    /**
     * Get a specific display strategy
     */
    getDisplayStrategy(displayType: DisplayType) {
        return displayStrategyFactory.createStrategy(displayType);
    }

    /**
     * Format a single value using pure formatters
     */
    formatValue(
        value: number,
        appliesToType: number,
        metadata?: any
    ): string {
        const formatter = formatterRegistry.getFormatter(appliesToType as any);
        if (!formatter) {
            return `${value}`; // Fallback to raw value
        }
        return formatter.format(value, metadata);
    }

    /**
     * Format a choice using choice formatters
     */
    formatChoice(
        choice: any,
        context?: DisplayContext
    ): string {
        const choiceFormatter = formatterRegistry.getChoiceFormatter(choice.choiceType);
        if (!choiceFormatter) {
            return 'Choice'; // Fallback
        }
        return choiceFormatter.formatChoice(choice, context);
    }

    /**
     * Generate progression values for a formula
     */
    generateProgressionValues(
        formula: any,
        startLevel: number,
        endLevel: number,
        context?: any
    ): any[] {
        return progressionGenerator.generateValues(formula, startLevel, endLevel, context);
    }

    /**
     * Find transitions in a progression
     */
    findTransitions(values: any[]): any[] {
        return transitionDetector.findTransitions(values);
    }

    /**
     * Get the current value for a progression at a specific level
     */
    getCurrentValue(
        progression: FeatureProgressionWithRelations,
        targetLevel: number,
        context?: DisplayContext
    ): number {
        // Find formula params in modifiers
        const formulaModifier = progression.modifiers?.find(m => m.formulaParams);
        if (!formulaModifier?.formulaParams) {
            return 0;
        }

        const values = progressionGenerator.generateProgressionValues(
            formulaModifier.formulaParams,
            progression.level,
            targetLevel
        );

        // Find the value at or before the target level
        const relevantValues = values.filter(v => v.level <= targetLevel);
        if (relevantValues.length === 0) {
            return 0;
        }

        return relevantValues[relevantValues.length - 1].value;
    }

    /**
     * Get the maximum value for a progression up to a specific level
     */
    getMaxValue(
        progression: FeatureProgressionWithRelations,
        maxLevel: number,
        context?: DisplayContext
    ): number {
        // Find formula params in modifiers
        const formulaModifier = progression.modifiers?.find(m => m.formulaParams);
        if (!formulaModifier?.formulaParams) {
            return 0;
        }

        const values = progressionGenerator.generateProgressionValues(
            formulaModifier.formulaParams,
            progression.level,
            maxLevel
        );

        return Math.max(...values.map(v => v.value));
    }

    /**
     * Check if a progression has transitions up to a specific level
     */
    hasTransitions(
        progression: FeatureProgressionWithRelations,
        maxLevel: number,
        context?: DisplayContext
    ): boolean {
        // Find formula params in modifiers
        const formulaModifier = progression.modifiers?.find(m => m.formulaParams);
        if (!formulaModifier?.formulaParams) {
            return false;
        }

        const values = progressionGenerator.generateProgressionValues(
            formulaModifier.formulaParams,
            progression.level,
            maxLevel
        );

        return values.some((value, index) => {
            if (index === 0) return false;
            return value.value !== values[index - 1].value;
        });
    }

    /**
     * Get all transition levels for a progression
     */
    getTransitionLevels(
        progression: FeatureProgressionWithRelations,
        maxLevel: number,
        context?: DisplayContext
    ): number[] {
        // Find formula params in modifiers
        const formulaModifier = progression.modifiers?.find(m => m.formulaParams);
        if (!formulaModifier?.formulaParams) {
            return [];
        }

        const values = progressionGenerator.generateProgressionValues(
            formulaModifier.formulaParams,
            progression.level,
            maxLevel
        );

        const transitions: number[] = [];
        for (let i = 1; i < values.length; i++) {
            if (values[i].value !== values[i - 1].value) {
                transitions.push(values[i].level);
            }
        }

        return transitions;
    }
}

// Export singleton instance
export const formatterOrchestrator = new FormatterOrchestratorImpl();

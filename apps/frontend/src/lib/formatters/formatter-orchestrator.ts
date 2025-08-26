import type {
    FeatureProgressionWithRelations,
    FeatureChoiceInQueryResponse,
    FeatureModifierInQueryResponse,
    FormulaParamsData,
    FeatureSpecialEffectInQueryResponse
} from '@shared/schema';
import { DisplayType, ModifierAppliesToType, ModifierType, FormulaId, FORMULA_MAP } from '@shared/static-data';

import type {
    DisplayContext,
    DisplayResult,
    EditPageDisplayResult,
    CalculationContext,
    ProgressionValue,
    TransitionPoint,
    FormatterMetadata,
    FormatterOrchestrator,
    BaseFormatter,
    ChoiceFormatter,
    EffectFormatter
} from './types';
import {
    editPageStrategy,
    detailPageStrategy,
    characterSheetStrategy,
    displayStrategyFactory
} from './display-strategies';
import { formatterRegistry } from './formatter-registry';
import { progressionGenerator, transitionDetector } from './progression-generators';
import { ModifierGroupingStrategy } from './grouping-strategies';
import { SignedValueFormatter, DamageFormatter, DiceFormatter, DiceBonusFormatter } from './pure-formatters';

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
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): EditPageDisplayResult {
        return editPageStrategy.formatProgression(progression, context, metadata);
    }

    /**
     * Format a single progression with complete display logic for edit pages
     * This handles the "Level XXX" header logic based on progression characteristics
     */
    formatProgressionForEditDisplay(
        progression: FeatureProgressionWithRelations,
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): string {
        // Check if progression has any associations
        const hasAssociations = (progression.modifiers && progression.modifiers.length > 0) ||
            (progression.choices && progression.choices.length > 0) ||
            (progression.effects && progression.effects.length > 0);

        if (!hasAssociations) {
            // No associations - just show the level
            return `Level ${progression.level}`;
        }

        // Get the formatted progression
        const result = this.formatProgressionForEdit(progression, context, metadata);

        // Check if this is a formula-based progression (modifiers or choices with formulas)
        const isFormulaBased = progression.modifiers?.some(m => m.formulaParams) ||
            progression.choices?.some(c => c.formulaParams?.formulaId);

        if (isFormulaBased) {
            // Formula-based progression - return the raw value without wrapping
            // The formula expansion already includes level information
            return result.formattedValue;
        } else {
            // Regular progression - wrap with level and details
            const details = [];
            if (result.formattedValue) details.push(result.formattedValue);
            if (result.breakdown?.explanation) details.push(result.breakdown.explanation);
            return `Level ${progression.level}${details.length > 0 ? `: ${details.join(', ')}` : ''}`;
        }
    }

    /**
     * Format multiple progressions for detail pages (grouped by Feature + Level)
     */
    formatProgressionsForDetail(
        progressions: FeatureProgressionWithRelations[],
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): DisplayResult {
        return detailPageStrategy.formatProgressions(progressions, context, metadata);
    }

    /**
     * Format progressions for character sheet (current level values only)
     */
    formatProgressionsForCharacterSheet(
        progressions: FeatureProgressionWithRelations[],
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): DisplayResult {
        return characterSheetStrategy.formatProgressions(progressions, context, metadata);
    }

    /**
     * Generic method to format progressions based on display type
     */
    formatProgressions(
        progressions: FeatureProgressionWithRelations[],
        displayType: DisplayType,
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): DisplayResult | EditPageDisplayResult[] {
        switch (displayType) {
            case DisplayType.Edit:
                return progressions.map(progression =>
                    this.formatProgressionForEdit(progression, context, metadata)
                );
            case DisplayType.Detail:
                return this.formatProgressionsForDetail(progressions, context, metadata);
            case DisplayType.CharacterSheet:
                return this.formatProgressionsForCharacterSheet(progressions, context, metadata);
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
        appliesToType: ModifierAppliesToType,
        modifier?: FeatureModifierInQueryResponse,
        metadata?: FormatterMetadata
    ): string {
        // Special handling for Conditional Scaling with string values
        // Check if this is a Conditional Scaling formula with string values in the breakdown
        if (modifier?.formulaParams?.formulaId === FormulaId.CONDITIONAL_SCALING && metadata?.breakdown) {
            const formulaComponent = metadata.breakdown.components.find(comp => comp.source === 'Conditional Scaling');

            if (formulaComponent?.formula && typeof formulaComponent.formula === 'string' && formulaComponent.formula.includes('d')) {
                // This is a dice string from Conditional Scaling, return it directly
                return formulaComponent.formula;
            }
        }

        // Use the new unified formatter lookup
        return this.formatModifier(value, appliesToType, modifier, metadata);
    }

    /**
     * Unified method to format modifiers using the new registry
     */
    formatModifier(
        value: number,
        appliesToType: ModifierAppliesToType,
        modifier?: FeatureModifierInQueryResponse,
        metadata?: FormatterMetadata
    ): string {
        const modifierType = modifier?.type;
        const formatter = formatterRegistry.getFormatter(0, modifierType, appliesToType) as BaseFormatter;

        if (!formatter) {
            return `${value}`; // Fallback to raw value
        }

        return formatter.format(value, modifier || {} as FeatureModifierInQueryResponse, metadata);
    }

    /**
     * Unified method to format effects using the new registry
     */
    formatEffect(
        effect: FeatureSpecialEffectInQueryResponse,
        level: number
    ): string {
        const formatter = formatterRegistry.getFormatter(1, effect.effectType) as EffectFormatter;

        if (!formatter) {
            return `Unknown Effect Type: ${effect.effectType}`; // Fallback
        }

        return formatter.format(effect, level);
    }

    /**
     * Unified method to format choices using the new registry
     */
    formatChoice(
        choice: FeatureChoiceInQueryResponse,
        metadata?: FormatterMetadata
    ): string {
        const formatter = formatterRegistry.getFormatter(2, choice.type) as ChoiceFormatter;

        if (!formatter) {
            return 'Unknown Choice Type'; // Fallback
        }

        return formatter.formatChoice(choice, metadata);
    }

    /**
     * Generate progression values for a formula
     */
    generateProgressionValues(
        formula: FormulaParamsData,
        startLevel: number,
        endLevel: number,
        context?: CalculationContext
    ): ProgressionValue[] {
        return progressionGenerator.generateValues(formula, startLevel, endLevel, context);
    }

    /**
     * Find transitions in a progression
     */
    findTransitions(values: ProgressionValue[]): TransitionPoint[] {
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

        const transitions = transitionDetector.findTransitions(values);
        return transitions.length > 0;
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

        const transitions = transitionDetector.findTransitions(values);
        return transitions.map(t => t.level);
    }

    /**
     * Format all progressions for detail page display
     * Returns a level-indexed map that detail pages can use to display features by level
     */
    formatProgressionsForDetailDisplay(
        progressions: FeatureProgressionWithRelations[],
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): Map<number, Array<{ formattedValue: string; featureId: number; feature?: { id: number; name: string; description: string; slug: string; prerequisites?: unknown[] } }>> {
        const levelMap = new Map<number, Array<{ formattedValue: string; featureId: number; feature?: { id: number; name: string; description: string; slug: string; prerequisites?: unknown[] } }>>();

        // Expand formula-based progressions to generate entries for all affected levels
        const expandedProgressions = this.expandFormulaProgressions(progressions);

        // Group progressions by level, then by feature
        const groupedByLevelAndFeature = this.groupProgressionsByLevelAndFeature(expandedProgressions);

        // Process each level
        for (const [level, featureGroups] of groupedByLevelAndFeature) {
            const levelEntries: Array<{ formattedValue: string; featureId: number; feature?: { id: number; name: string; description: string; slug: string; prerequisites?: unknown[] } }> = [];

            // Process each feature group at this level
            for (const [featureId, featureProgressions] of featureGroups) {
                const formattedValue = this.formatFeatureGroupForDetailDisplay(featureProgressions, context, metadata);
                if (formattedValue) {
                    // Get the feature info from the first progression in the group
                    const feature = featureProgressions[0]?.feature;
                    levelEntries.push({
                        formattedValue,
                        featureId,
                        feature
                    });
                }
            }

            if (levelEntries.length > 0) {
                levelMap.set(level, levelEntries);
            }
        }

        return levelMap;
    }

    private expandFormulaProgressions(
        progressions: FeatureProgressionWithRelations[]
    ): FeatureProgressionWithRelations[] {
        const expanded: FeatureProgressionWithRelations[] = [];

        for (const progression of progressions) {
            // Check if this progression has formula-based modifiers
            const formulaModifiers = progression.modifiers?.filter(m => m.formulaParams) || [];

            if (formulaModifiers.length > 0) {
                // Check formula properties to determine expansion behavior
                const formulaModifier = formulaModifiers[0];
                const formulaDef = FORMULA_MAP[formulaModifier.formulaParams!.formulaId];

                if (formulaDef && formulaDef.hasProgression) {
                    // Only expand formulas that actually have progressions

                    if (formulaDef.isCharacterDependent) {
                        // Character-dependent formulas: Use display strings instead of calculated values
                        const displayStrings = progressionGenerator.generateDisplayStrings(
                            formulaModifier.formulaParams!,
                            progression.level,
                            20
                        );

                        // For character-dependent formulas, we don't need to expand to multiple levels
                        // since we're showing the formula structure, not calculated values
                        // Just add the original progression as-is
                        expanded.push(progression);
                    } else {
                        // Non-character-dependent formulas: Use calculated values
                        const values = progressionGenerator.generateProgressionValues(
                            formulaModifier.formulaParams!,
                            progression.level,
                            20
                        );

                        // Find transition points (levels where the value changes)
                        const transitions = transitionDetector.findTransitions(values);

                        // Create a progression entry for the initial level and each transition level
                        const levelsToCreate = new Set<number>();

                        // Always include the initial level
                        levelsToCreate.add(progression.level);

                        // Add transition levels
                        for (const transition of transitions) {
                            levelsToCreate.add(transition.level);
                        }

                        // Create progression entries for each level
                        for (const level of Array.from(levelsToCreate).sort((a, b) => a - b)) {
                            // Find the value for this level
                            const levelValue = values.find(v => v.level === level) || values[0];

                            const expandedProgression = {
                                ...progression,
                                level: level,
                                modifiers: progression.modifiers?.map(modifier => {
                                    if (modifier.formulaParams) {
                                        // Update the value to the current level's value
                                        return {
                                            ...modifier,
                                            value: levelValue.value
                                        };
                                    }
                                    return modifier;
                                })
                            };
                            expanded.push(expandedProgression);
                        }
                    }
                } else {
                    // Non-progression formulas - add as-is
                    expanded.push(progression);
                }
            } else {
                // Non-formula progression - add as-is
                expanded.push(progression);
            }
        }

        return expanded;
    }

    /**
     * Group progressions by level, then by feature
     */
    private groupProgressionsByLevelAndFeature(
        progressions: FeatureProgressionWithRelations[]
    ): Map<number, Map<number, FeatureProgressionWithRelations[]>> {
        const grouped = new Map<number, Map<number, FeatureProgressionWithRelations[]>>();

        for (const progression of progressions) {
            const level = progression.level;
            const featureId = progression.featureId;

            if (!grouped.has(level)) {
                grouped.set(level, new Map());
            }

            const levelGroup = grouped.get(level)!;
            if (!levelGroup.has(featureId)) {
                levelGroup.set(featureId, []);
            }

            levelGroup.get(featureId)!.push(progression);
        }

        return grouped;
    }

    /**
     * Format a group of progressions for the same feature at the same level
     */
    private formatFeatureGroupForDetailDisplay(
        progressions: FeatureProgressionWithRelations[],
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): string | null {
        if (progressions.length === 0) {
            return null;
        }

        // Check if any progression has associations
        const hasAssociations = progressions.some(progression =>
            (progression.modifiers && progression.modifiers.length > 0) ||
            (progression.choices && progression.choices.length > 0) ||
            (progression.effects && progression.effects.length > 0)
        );

        if (!hasAssociations) {
            return null;
        }

        // Collect all modifiers from all progressions in this group
        const allModifiers: FeatureModifierInQueryResponse[] = [];
        for (const progression of progressions) {
            if (progression.modifiers) {
                allModifiers.push(...progression.modifiers);
            }
        }

        // Use the modifier grouping strategy to format all modifiers together
        const modifierGroupingStrategy = new ModifierGroupingStrategy();
        const formattedItems = allModifiers.map(modifier => ({
            formattedValue: this.formatValue(modifier.value, modifier.appliesTo, modifier, metadata),
            breakdown: { components: [] },
            metadata,
            modifier: modifier
        }));
        const result = modifierGroupingStrategy.group(formattedItems);
        return result.formattedValue;
    }


}

// Export singleton instance
export const formatterOrchestrator = new FormatterOrchestratorImpl();

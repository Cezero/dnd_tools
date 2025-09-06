import type {
    FormulaParamsData,
    FeatureModifier,
    FeatureChoice
} from '@shared/schema';
import { FORMULA_MAP, BreakdownComponentType, FeatureType, ModifierType, DisplayType, CumulativeValueType, FormulaId } from '@shared/static-data';

import { FormulaCalculatorImpl } from './calculators';
import { buildFormulaParams } from './formula-utils';
// Remove circular dependency - calculator will be passed as parameter
import type {
    CalculationContext,
    ProgressionValue,
    TransitionPoint,
    ProgressionGenerator,
    ProgressionGeneratorParams,
    TransitionDetector,
    CalculationBreakdown
} from './types';

// Transition types
const TRANSITION_TYPE = {
    START: 0,
    TRANSITION: 1
} as const;

/**
 * Pure generator for progression values across level ranges
 */
export class ProgressionGeneratorImpl implements ProgressionGenerator {
    generateValues(params: ProgressionGeneratorParams): Array<ProgressionValue> {
        const { formula, startLevel, endLevel, context, modifierValue, formulaCalculator, originalModifier, originalChoice } = params;
        const values: Array<ProgressionValue> = [];
        const formulaDef = FORMULA_MAP[formula.formulaId];

        if (!formulaDef) {
            return values;
        }

        // For choices, we need different logic - only generate values at specific levels
        if (originalChoice) {
            return this.generateChoiceLevels(formula, startLevel, endLevel, context, originalChoice, formulaCalculator);
        }

        // For modifiers, use the standard logic
        // Determine the actual start level based on formulaStartLevel
        const actualStartLevel = formula.formulaStartLevel || startLevel;

        for (let level = actualStartLevel; level <= endLevel; level++) {
            const calculationContext: CalculationContext = {
                level,
                progressionLevel: startLevel,
                characterLevel: context?.characterLevel || level,
                character: context?.character
            };

            // Calculate single value using formula
            const singleValue = this.calculateSingleValue(formula, level, calculationContext, modifierValue, formulaCalculator);
            const breakdown = this.createBreakdown(formulaDef, level, singleValue);

            // Handle cumulative vs non-cumulative logic
            if (formula.cumulative) {
                const applicableValues = this.getApplicableValues(formula, level);

                // For cumulative, generate multiple ProgressionValues
                for (const value of applicableValues) {
                    if (originalModifier) {
                        const modifiedModifier = this.createModifiedModifier(
                            originalModifier,
                            value,
                            formula.valuesRepresent,
                            this.determineGroupingId(originalModifier, formula)
                        );

                        values.push({
                            level,
                            breakdown,
                            conditionalValues: [],
                            modifier: modifiedModifier
                        });
                    }
                }
            } else {
                // Non-cumulative - single ProgressionValue
                if (originalModifier) {
                    const modifiedModifier = this.createModifiedModifier(
                        originalModifier,
                        singleValue,
                        formula.valuesRepresent,
                        originalModifier?.groupingId || 0 // Preserve original groupingId for non-cumulative
                    );

                    values.push({
                        level,
                        breakdown,
                        conditionalValues: [],
                        modifier: modifiedModifier
                    });
                }
            }
        }

        return values;
    }

    /**
     * Generate progression values for choices - only at specific levels where the choice is available
     */
    private generateChoiceLevels(
        formula: FormulaParamsData,
        startLevel: number,
        endLevel: number,
        context: CalculationContext | undefined,
        originalChoice: FeatureChoice,
        _formulaCalculator: FormulaCalculatorImpl | undefined
    ): Array<ProgressionValue> {
        const values: Array<ProgressionValue> = [];
        const formulaDef = FORMULA_MAP[formula.formulaId];

        if (!formulaDef) {
            return values;
        }

        // For choices, we need to determine which levels the choice is available at
        const availableLevels = this.getChoiceAvailableLevels(formula, startLevel, endLevel);

        for (const level of availableLevels) {
            // For choices, we don't need to calculate a value - just create a breakdown
            const breakdown = this.createBreakdown(formulaDef, level, 1); // Use 1 as placeholder value

            const modifiedChoice = this.createModifiedChoice(
                originalChoice,
                1, // Placeholder value for choices
                formula.valuesRepresent,
                originalChoice?.groupingId || 0
            );

            values.push({
                level,
                breakdown,
                conditionalValues: [],
                choice: modifiedChoice
            });
        }

        return values;
    }

    /**
     * Determine which levels a choice is available at based on the formula
     */
    private getChoiceAvailableLevels(formula: FormulaParamsData, startLevel: number, endLevel: number): number[] {
        const availableLevels: number[] = [];

        if (formula.formulaId === FormulaId.EVERY_N_LEVELS) {
            // For EVERY_N_LEVELS, choice is available at formulaStartLevel and then every interval levels
            const formulaStartLevel = formula.formulaStartLevel || startLevel;
            const interval = formula.interval || 1;

            for (let level = formulaStartLevel; level <= endLevel; level += interval) {
                availableLevels.push(level);
            }
        } else if (formula.formulaId === FormulaId.CONDITIONAL_SCALING) {
            // For CONDITIONAL_SCALING, choice is available at each threshold level
            if (formula.thresholds) {
                for (const threshold of formula.thresholds) {
                    if (threshold >= startLevel && threshold <= endLevel) {
                        availableLevels.push(threshold);
                    }
                }
            }
        } else {
            // For other formulas, use the standard logic (every level from startLevel)
            const actualStartLevel = formula.formulaStartLevel || startLevel;
            for (let level = actualStartLevel; level <= endLevel; level++) {
                availableLevels.push(level);
            }
        }

        return availableLevels;
    }

    private getApplicableValues(formula: FormulaParamsData, level: number): Array<number | string> {
        if (!formula.thresholds || !formula.values) {
            return [];
        }

        const applicableValues = [];
        for (let i = 0; i < formula.thresholds.length; i++) {
            if (level >= formula.thresholds[i]) {
                applicableValues.push(formula.values[i]);
            }
        }
        return applicableValues;
    }

    private determineGroupingId(originalEntity: FeatureModifier | FeatureChoice | undefined, formula: FormulaParamsData): number {
        // For cumulative formulas, ensure all generated entities share the same groupingId
        if (formula.cumulative) {
            // If original entity has groupingId > 0, use it
            if (originalEntity && originalEntity.groupingId > 0) {
                return originalEntity.groupingId;
            }

            // If original entity has groupingId === 0, we need to assign a new groupingId
            // to ensure cumulative entities are grouped together
            // Use a deterministic approach based on entity properties
            return this.generateCumulativeGroupingId(originalEntity);
        }

        // For non-cumulative, preserve original groupingId
        return originalEntity?.groupingId || 0;
    }

    private generateCumulativeGroupingId(entity: FeatureModifier | FeatureChoice | undefined): number {
        // Generate a deterministic groupingId for cumulative entities
        // This ensures all cumulative entities from the same original entity
        // get the same groupingId, even if original had groupingId: 0
        if (!entity) {
            return 1; // Fallback for undefined entity
        }

        // Use a combination of entity properties to create a unique groupingId
        // This approach ensures consistency across different runs
        let baseId: number;

        if ('type' in entity && 'appliesTo' in entity) {
            // This is a FeatureModifier
            const modifier = entity as FeatureModifier;
            baseId = Math.abs(
                modifier.id * 1000 +
                modifier.type * 100 +
                (modifier.appliesTo || 0) * 10 +
                (modifier.formulaParamsId || 0)
            );
        } else {
            // This is a FeatureChoice
            const choice = entity as FeatureChoice;
            baseId = Math.abs(
                choice.id * 1000 +
                choice.type * 100 +
                (choice.formulaParamsId || 0)
            );
        }

        // Ensure it's a positive number (groupingId > 0 means grouped)
        return Math.max(1, baseId % 1000000); // Cap at reasonable range
    }

    private createModifiedModifier(
        originalModifier: FeatureModifier | undefined,
        value: number | string,
        valuesRepresent: CumulativeValueType | undefined,
        groupingId: number
    ): FeatureModifier {
        if (!originalModifier) {
            // Fallback if no original modifier provided (shouldn't happen in normal flow)
            console.error('No original modifier provided for createModifiedModifier');
            return {
                id: 0,
                progressionId: 0,
                type: ModifierType.Bonus,
                value: typeof value === 'string' ? 0 : value as number, // Handle string case
                appliesToId: null,
                appliesTo: null,
                bonusType: null,
                formulaParamsId: null,
                itemId: null,
                conditions: [],
                formulaParams: null,
                groupingId: groupingId,
                displayInDetail: true
            };
        }

        // Handle string values from getDisplayString() - these should be treated specially
        if (typeof value === 'string') {
            // For string values, we need to preserve the original modifier structure
            // but indicate that this is a display string case
            return {
                ...originalModifier,
                value: 0, // Use 0 as placeholder for string values
                appliesToId: null,
                groupingId: groupingId,
                // Store the display string in a way that formatters can access it
                // We'll use a special approach: put the string in the breakdown
            };
        }

        return {
            ...originalModifier, // Copy all original properties
            // Override appropriate field based on valuesRepresent
            ...(valuesRepresent === CumulativeValueType.AppliesToId
                ? { appliesToId: value as number }
                : { value: value as number }
            ),
            // Use the determined groupingId
            groupingId: groupingId
        };
    }

    private createModifiedChoice(
        originalChoice: FeatureChoice,
        value: number | string,
        valuesRepresent: CumulativeValueType | undefined,
        groupingId: number
    ): FeatureChoice {
        // For choices, we don't modify the value/appliesToId fields since choices don't have them
        // We just update the groupingId to ensure proper grouping
        return {
            ...originalChoice,
            groupingId: groupingId
        };
    }

    private calculateSingleValue(
        formula: FormulaParamsData,
        level: number,
        context: CalculationContext,
        modifierValue: number | undefined,
        formulaCalculator: FormulaCalculatorImpl | undefined
    ): number | string {
        const formulaDef = FORMULA_MAP[formula.formulaId];

        // Determine whether to use calculate() or getDisplayString() based on formula properties
        if (formulaDef.isCharacterDependent && !context?.character) {
            // Character-dependent formula but no character data available
            const displayContext = context ? {
                character: context.character,
                displayType: DisplayType.Edit,
                currentLevel: context.level,
                showBreakdown: false
            } : undefined;

            const params = buildFormulaParams(
                formula,
                level,
                level, // startLevel
                displayContext,
                modifierValue
            );

            return formulaDef.getDisplayString(params);
        } else {
            // Use calculate() - either non-character-dependent or character data is available
            const calculator = formulaCalculator || new FormulaCalculatorImpl();
            const result = calculator.calculate(formula, level, context, modifierValue);
            return result.value;
        }
    }

    private createBreakdown(formulaDef: { name: string }, level: number, value: number | string): CalculationBreakdown {
        return {
            components: [{
                source: formulaDef.name,
                value: typeof value === 'string' ? 0 : value, // Use 0 for string values
                type: BreakdownComponentType.formula,
                description: typeof value === 'string' ? value : `Level ${level}: ${formulaDef.name}`, // Use string as description
                formula: typeof value === 'string' ? value : formulaDef.name // Use string as formula for display
            }],
            formula: formulaDef.name,
            explanation: typeof value === 'string' ? value : `Calculated using ${formulaDef.name} at level ${level}`
        };
    }

    /**
     * Generate progression values for a level range with custom context
     */
    generateValuesWithContext(
        formula: FormulaParamsData,
        startLevel: number,
        endLevel: number,
        characterContext?: CalculationContext['character']
    ): Array<ProgressionValue> {
        const context: CalculationContext = {
            level: startLevel,
            progressionLevel: startLevel,
            characterLevel: startLevel,
            character: characterContext
        };

        return this.generateValues({
            formula,
            startLevel,
            endLevel,
            context
        });
    }
}

/**
 * Pure detector for transition points in progressions
 */
export class TransitionDetectorImpl implements TransitionDetector {
    findTransitions(values: Array<ProgressionValue>): Array<TransitionPoint> {
        const transitions: Array<TransitionPoint> = [];

        for (let i = 1; i < values.length; i++) {
            const current = values[i];
            const previous = values[i - 1];

            if (current.modifier.value !== previous.modifier.value) {
                transitions.push({
                    level: current.level,
                    type: TRANSITION_TYPE.TRANSITION,
                    description: `Value changes from ${previous.modifier.value} to ${current.modifier.value}`,
                    value: current.modifier.value,
                    previousValue: previous.modifier.value,
                    entityType: FeatureType.Modifier,
                    entitySubType: ModifierType.Bonus,
                    groupingId: 0
                });
            }
        }

        return transitions;
    }
}

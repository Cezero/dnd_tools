import type {
    FormulaParamsData
} from '@shared/schema';
import { FORMULA_MAP, BreakdownComponentType, FeatureType, ModifierType } from '@shared/static-data';

import { FormulaCalculatorImpl } from './calculators';
// Remove circular dependency - calculator will be passed as parameter
import type {
    CalculationContext,
    ProgressionValue,
    TransitionPoint,
    ProgressionGenerator,
    TransitionDetector,
    FormulaCalculator,
    CalculationBreakdown
} from './types';

// Constants
const MAX_CHARACTER_LEVEL = 20; // D&D standard maximum character level

// Transition types
const TRANSITION_TYPE = {
    START: 0,
    TRANSITION: 1
} as const;

/**
 * Pure generator for progression values across level ranges
 */
export class ProgressionGeneratorImpl implements ProgressionGenerator {
    generateValues(
        formula: FormulaParamsData,
        startLevel: number,
        endLevel: number,
        context?: CalculationContext,
        modifierValue?: number,
        formulaCalculator?: FormulaCalculator
    ): Array<ProgressionValue> {
        const values: Array<ProgressionValue> = [];
        const formulaDef = FORMULA_MAP[formula.formulaId];

        if (!formulaDef) {
            return values;
        }

        // If formula doesn't have progression, don't generate progression values
        if (!formulaDef.hasProgression) {
            return values;
        }

        for (let level = startLevel; level <= endLevel; level++) {
            const calculationContext: CalculationContext = {
                level,
                progressionLevel: startLevel,
                characterLevel: context?.characterLevel || level,
                character: context?.character
            };

            let value: number;
            let breakdown: CalculationBreakdown;

            // Determine whether to use calculate() or getDisplayString() based on formula properties
            if (formulaDef.isCharacterDependent && !context?.character) {
                // Character-dependent formula but no character data available
                // Use getDisplayString() and convert to numeric representation
                const params = {
                    level,
                    startLevel,
                    interval: formula.interval,
                    formulaStartLevel: formula.formulaStartLevel,
                    abilityId: formula.abilityId,
                    thresholds: formula.thresholds,
                    values: formula.values
                };

                const displayString = formulaDef.getDisplayString(params);
                // Convert display string to numeric value for comparison purposes
                // This is a simple hash-based approach - in practice, you might want more sophisticated parsing
                value = displayString.split('').reduce((hash, char) => hash + char.charCodeAt(0), 0);
                breakdown = {
                    components: [{
                        source: formulaDef.name,
                        value,
                        type: BreakdownComponentType.formula,
                        description: displayString,
                        formula: displayString
                    }],
                    formula: formulaDef.name,
                    explanation: `Display string: ${displayString}`
                };
            } else {
                // Use calculate() - either non-character-dependent or character data is available
                const calculator = formulaCalculator || new FormulaCalculatorImpl();
                const result = calculator.calculate(formula, level, calculationContext, modifierValue);
                value = result.value;
                breakdown = result.breakdown;
            }

            values.push({
                level,
                value,
                breakdown,
                conditionalValues: [] // Simplified for now
            });
        }

        return values;
    }

    /**
     * Generate display strings for character-dependent formulas without character context
     */
    generateDisplayStrings(
        formula: FormulaParamsData,
        startLevel: number,
        endLevel: number
    ): Array<string> {
        const displayStrings: Array<string> = [];
        const formulaDef = FORMULA_MAP[formula.formulaId];

        if (!formulaDef) {
            return displayStrings;
        }

        for (let level = startLevel; level <= endLevel; level++) {
            const params = {
                level,
                startLevel,
                interval: formula.interval,
                formulaStartLevel: formula.formulaStartLevel,
                abilityId: formula.abilityId,
                thresholds: formula.thresholds,
                values: formula.values
            };

            const displayString = formulaDef.getDisplayString(params);
            displayStrings.push(displayString);
        }

        return displayStrings;
    }

    /**
     * Generate progression values for a specific feature progression
     */
    generateProgressionValues(
        formula: FormulaParamsData,
        progressionLevel: number,
        maxLevel: number = 20,
        context?: CalculationContext,
        modifierValue?: number,
        formulaCalculator?: FormulaCalculator
    ): Array<ProgressionValue> {
        return this.generateValues(formula, progressionLevel, maxLevel, context, modifierValue, formulaCalculator);
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

        return this.generateValues(formula, startLevel, endLevel, context);
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

            if (current.value !== previous.value) {
                transitions.push({
                    level: current.level,
                    type: TRANSITION_TYPE.TRANSITION,
                    description: `Value changes from ${previous.value} to ${current.value}`,
                    value: current.value,
                    previousValue: previous.value,
                    entityType: FeatureType.Modifier,
                    entitySubType: ModifierType.Bonus
                });
            }
        }

        return transitions;
    }

    /**
     * Find transitions for a specific progression
     */
    findProgressionTransitions(
        formula: FormulaParamsData,
        startLevel: number,
        endLevel: number,
        context?: CalculationContext
    ): Array<TransitionPoint> {
        const generator = new ProgressionGeneratorImpl();
        const values = generator.generateValues(formula, startLevel, endLevel, context);
        return this.findTransitions(values);
    }

    /**
     * Find transitions with custom character context
     */
    findTransitionsWithContext(
        values: Array<ProgressionValue>,
        _characterContext?: CalculationContext['character']
    ): Array<TransitionPoint> {
        // For now, character context doesn't affect transition detection
        // In the future, this could be used for conditional transitions
        return this.findTransitions(values);
    }
}

/**
 * Utility functions for progression analysis
 */
export class ProgressionAnalysisUtils {
    /**
     * Get the maximum value in a progression
     */
    static getMaxValue(values: Array<ProgressionValue>): number {
        return Math.max(...values.map(v => v.value));
    }

    /**
     * Get the minimum value in a progression
     */
    static getMinValue(values: Array<ProgressionValue>): number {
        return Math.min(...values.map(v => v.value));
    }

    /**
     * Get the value at a specific level
     */
    static getValueAtLevel(values: Array<ProgressionValue>, level: number): number | undefined {
        const entry = values.find(v => v.level === level);
        return entry?.value;
    }

    /**
     * Check if a progression has any transitions
     */
    static hasTransitions(values: Array<ProgressionValue>): boolean {
        for (let i = 1; i < values.length; i++) {
            if (values[i].value !== values[i - 1].value) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get the number of transitions in a progression
     */
    static getTransitionCount(values: Array<ProgressionValue>): number {
        let count = 0;
        for (let i = 1; i < values.length; i++) {
            if (values[i].value !== values[i - 1].value) {
                count++;
            }
        }
        return count;
    }

    /**
     * Get the levels where transitions occur
     */
    static getTransitionLevels(values: Array<ProgressionValue>): Array<number> {
        const levels: Array<number> = [];
        for (let i = 1; i < values.length; i++) {
            if (values[i].value !== values[i - 1].value) {
                levels.push(values[i].level);
            }
        }
        return levels;
    }
}

// Export utility functions
export const progressionAnalysis = ProgressionAnalysisUtils;

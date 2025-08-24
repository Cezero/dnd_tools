import type {
    ProgressionGenerator,
    TransitionDetector
} from './interfaces';
import type {
    FormulaParamsData,
    CalculationContext,
    ProgressionValue,
    TransitionPoint
} from '@shared/schema';
import { formulaCalculator } from './calculators';

/**
 * Pure generator for progression values across level ranges
 */
export class ProgressionGeneratorImpl implements ProgressionGenerator {
    generateValues(
        formula: FormulaParamsData,
        startLevel: number,
        endLevel: number,
        context?: CalculationContext
    ): Array<ProgressionValue> {
        const values: Array<ProgressionValue> = [];

        for (let level = startLevel; level <= endLevel; level++) {
            const calculationContext: CalculationContext = {
                level,
                progressionLevel: startLevel,
                characterLevel: context?.characterLevel || level,
                character: context?.character
            };

            const result = formulaCalculator.calculate(formula, level, calculationContext);

            values.push({
                level,
                value: result.value,
                breakdown: result.breakdown,
                conditionalValues: result.conditionalValues
            });
        }

        return values;
    }

    /**
     * Generate progression values for a specific feature progression
     */
    generateProgressionValues(
        formula: FormulaParamsData,
        progressionLevel: number,
        maxLevel: number = 20,
        context?: CalculationContext
    ): Array<ProgressionValue> {
        return this.generateValues(formula, progressionLevel, maxLevel, context);
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
                    type: 1, // TransitionPointType.ValueChange
                    description: `Value changes from ${previous.value} to ${current.value}`,
                    value: current.value,
                    previousValue: previous.value
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
        characterContext?: CalculationContext['character']
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

// Export singleton instances
export const progressionGenerator = new ProgressionGeneratorImpl();
export const transitionDetector = new TransitionDetectorImpl();
export const progressionAnalysis = ProgressionAnalysisUtils;

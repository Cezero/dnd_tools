import type {
    FormulaParamsData
} from '@shared/schema';
import { FORMULA_MAP, BreakdownComponentType, FeatureType, ModifierType, DisplayType } from '@shared/static-data';

import { FormulaCalculatorImpl } from './calculators';
import { buildFormulaParams } from './formula-utils';
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

        for (let level = startLevel; level <= endLevel; level++) {
            const calculationContext: CalculationContext = {
                level,
                progressionLevel: startLevel,
                characterLevel: context?.characterLevel || level,
                character: context?.character
            };

            let value: number | string;
            let breakdown: CalculationBreakdown;

            // Determine whether to use calculate() or getDisplayString() based on formula properties
            if (formulaDef.isCharacterDependent && !context?.character) {
                // Character-dependent formula but no character data available
                // Use getDisplayString() and convert to numeric representation
                // Convert CalculationContext to DisplayContext for buildFormulaParams
                const displayContext = context ? {
                    character: context.character,
                    displayType: DisplayType.Edit,
                    currentLevel: context.level,
                    showBreakdown: false
                } : undefined;

                const params = buildFormulaParams(
                    formula,
                    level,
                    startLevel,
                    displayContext,
                    modifierValue
                );

                const displayString = formulaDef.getDisplayString(params);
                value = displayString;
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

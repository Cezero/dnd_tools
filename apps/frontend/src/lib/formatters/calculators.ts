import type {
    FormulaParamsData,
    FeatureModifier,
    FeatureModifierCondition
} from '@shared/schema';
import {
    FORMULA_MAP,
    DisplayType,
    BreakdownComponentType
} from '@shared/static-data';

import { buildFormulaParams } from './formula-utils';
import type {
    CalculationContext,
    CalculationResult,
    ConditionalValue,
    CharacterContext,
    FormulaCalculator,
    ConditionalValueDetector,
    SelectedValue,
    ChoiceBasedCalculation,
    IChoiceCalculator
} from './types';

/**
 * Pure calculator for formula-based value calculations
 */
export class FormulaCalculatorImpl implements FormulaCalculator {
    calculate(formula: FormulaParamsData, level: number, context?: CalculationContext, modifierValue?: number): CalculationResult {
        const formulaDef = FORMULA_MAP[formula.formulaId];
        if (!formulaDef) {
            return {
                value: 0,
                breakdown: {
                    components: [{
                        source: 'Formula',
                        value: 0,
                        type: BreakdownComponentType.formula,
                        description: `Unknown formula ID: ${formula.formulaId}`
                    }],
                    explanation: `Formula ID ${formula.formulaId} not found`
                }
            };
        }

        const calculationLevel = context?.level || level;
        const _characterLevel = context?.characterLevel || calculationLevel;
        const progressionLevel = context?.progressionLevel || calculationLevel;

        const components: Array<{
            source: string;
            value: number | string;
            type: BreakdownComponentType;
            description: string;
            formula?: string;
        }> = [];

        // Build parameters object for the formula calculation
        // Convert CalculationContext to DisplayContext for buildFormulaParams
        const displayContext = context ? {
            character: context.character,
            displayType: DisplayType.Edit,
            currentLevel: context.level,
            showBreakdown: false
        } : undefined;
        const params = buildFormulaParams(formula, calculationLevel, progressionLevel, displayContext, modifierValue);

        // Use the formula's calculate function
        const value = formulaDef.calculate(params);

        // Use the formula's display string function
        const formulaString = formulaDef.getDisplayString ?
            formulaDef.getDisplayString(params) :
            formulaDef.name;

        components.push({
            source: formulaDef.name,
            value,
            type: BreakdownComponentType.formula,
            description: formulaDef.description,
            formula: formulaString
        });
        
        return {
            value,
            breakdown: {
                components,
                formula: formulaDef.name,
                explanation: `Calculated using ${formulaDef.name} formula`
            }
        };
    }
}

/**
 * Pure calculator for choice-based calculations
 */
export class ChoiceCalculatorImpl implements IChoiceCalculator {
    calculateChoiceValue(
        choice: ChoiceBasedCalculation,
        selectedValues: SelectedValue[],
        _context?: CalculationContext
    ): CalculationResult {
        // This is a placeholder for choice-based calculations
        // Will be implemented when we have the choice calculation interfaces defined
        return {
            value: selectedValues.length,
            breakdown: {
                components: [{
                    source: 'Choice',
                    value: selectedValues.length,
                    type: BreakdownComponentType.choice,
                    description: `Selected ${selectedValues.length} choice(s)`
                }],
                explanation: 'Choice-based calculation'
            }
        };
    }
}

/**
 * Pure detector for conditional values
 */
export class ConditionalValueDetectorImpl implements ConditionalValueDetector {
    detectConditionals(modifiers: FeatureModifier[], _context?: CharacterContext): Array<ConditionalValue> {
        const conditionals: Array<ConditionalValue> = [];

        for (const modifier of modifiers) {
            if (modifier.conditions && modifier.conditions.length > 0) {
                for (const condition of modifier.conditions) {
                    const conditionalValue = this.createConditionalValue(modifier, condition, _context);
                    if (conditionalValue) {
                        conditionals.push(conditionalValue);
                    }
                }
            }
        }

        return conditionals;
    }

    private createConditionalValue(
        modifier: FeatureModifier,
        condition: FeatureModifierCondition,
        _context?: CharacterContext
    ): ConditionalValue | null {
        // This is a placeholder for conditional value creation
        // Will be implemented when we have the condition interfaces defined
        return {
            value: modifier.value,
            breakdown: {
                components: [{
                    source: 'Conditional',
                    value: modifier.value,
                    type: BreakdownComponentType.conditional,
                    description: `Conditional bonus: ${modifier.value}`
                }],
                explanation: 'Conditional modifier'
            },
            condition: {
                condition: 'Condition',
                conditionType: condition.conditionType,
                conditionValue: condition.conditionValue,
                description: 'Conditional modifier'
            },
            displayPriority: 1
        };
    }
}

// Export singleton instances
export const formulaCalculator = new FormulaCalculatorImpl();
export const choiceCalculator = new ChoiceCalculatorImpl();
export const conditionalValueDetector = new ConditionalValueDetectorImpl();

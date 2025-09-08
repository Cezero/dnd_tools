import type {
    FormulaParamsData,
    FeatureEntity,
    FeatureEntityCondition
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
    ConditionalValueDetector
} from './types';

/**
 * Pure calculator for formula-based value calculations
 * Works with all entity types (modifiers, choices, etc.) uniformly
 */
export class FormulaCalculatorImpl implements FormulaCalculator {
    calculate(formula: FormulaParamsData, level: number, context?: CalculationContext, entityValue?: number): CalculationResult {
        console.log('FormulaCalculatorImpl.calculate()', formula, level, context, entityValue);
        const formulaDef = FORMULA_MAP[formula.formulaId];
        if (!formulaDef) {
            return {
                value: null, // Return null for invalid scenarios
                breakdown: {
                    components: [],
                    explanation: `Formula ID ${formula.formulaId} not found`
                }
            };
        }

        const calculationLevel = context?.level || level;
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
        const params = buildFormulaParams(formula, calculationLevel, progressionLevel, displayContext, entityValue);

        // Use the formula's calculate function
        const value = formulaDef.calculate(params);

        // Use the formula's display string function
        const formulaString = formulaDef.getDisplayString ?
            formulaDef.getDisplayString(params) :
            formulaDef.name;

        components.push({
            source: formulaDef.name,
            value: value || 0, // Use 0 for breakdown display when value is null
            type: BreakdownComponentType.formula,
            description: value === null ? `Formula does not apply at level ${level}` : formulaDef.description,
            formula: formulaString
        });

        return {
            value, // Keep null values as null
            breakdown: {
                components,
                formula: formulaDef.name,
                explanation: value === null ? `Formula does not apply at level ${level}` : `Calculated using ${formulaDef.name} formula`
            }
        };
    }
}


/**
 * Pure detector for conditional values
 */
export class ConditionalValueDetectorImpl implements ConditionalValueDetector {
    detectConditionals(entities: FeatureEntity[], _context?: CharacterContext): Array<ConditionalValue> {
        const conditionals: Array<ConditionalValue> = [];

        for (const entity of entities) {
            if (entity.conditions && entity.conditions.length > 0) {
                for (const condition of entity.conditions) {
                    const conditionalValue = this.createConditionalValue(entity, condition, _context);
                    if (conditionalValue) {
                        conditionals.push(conditionalValue);
                    }
                }
            }
        }

        return conditionals;
    }

    private createConditionalValue(
        entity: FeatureEntity,
        condition: FeatureEntityCondition,
        _context?: CharacterContext
    ): ConditionalValue | null {
        // This is a placeholder for conditional value creation
        // Will be implemented when we have the condition interfaces defined
        return {
            value: entity.value,
            breakdown: {
                components: [{
                    source: 'Conditional',
                    value: entity.value,
                    type: BreakdownComponentType.conditional,
                    description: `Conditional bonus: ${entity.value}`
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
export const conditionalValueDetector = new ConditionalValueDetectorImpl();

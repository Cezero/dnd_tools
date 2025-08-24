import type {
    FormulaCalculator,
    ProgressionGenerator,
    TransitionDetector,
    ConditionalValueDetector
} from './interfaces';
import type {
    FormulaParamsData,
    CalculationContext,
    CalculationResult,
    ProgressionValue,
    TransitionPoint,
    ConditionalValue,
    CharacterContext
} from '@shared/schema';
import type { FeatureModifierInQueryResponse } from '@shared/schema';
import {
    FORMULA_MAP,
    ABILITY_MAP,
    SIZE_MAP
} from '@shared/static-data';

/**
 * Pure calculator for formula-based value calculations
 */
export class FormulaCalculatorImpl implements FormulaCalculator {
    calculate(formula: FormulaParamsData, level: number, context?: CalculationContext): CalculationResult {
        const formulaDef = FORMULA_MAP[formula.formulaId];
        if (!formulaDef) {
            return {
                value: 0,
                breakdown: {
                    components: [{
                        source: 'Formula',
                        value: 0,
                        type: 1, // BreakdownComponentType.Formula
                        description: `Unknown formula ID: ${formula.formulaId}`
                    }],
                    explanation: `Formula ID ${formula.formulaId} not found`
                }
            };
        }

        const calculationLevel = context?.level || level;
        const characterLevel = context?.characterLevel || calculationLevel;
        const progressionLevel = context?.progressionLevel || calculationLevel;

        let value = 0;
        const components: Array<{
            source: string;
            value: number;
            type: 1 | 2 | 3 | 4 | 5; // BreakdownComponentType
            description: string;
            formula?: string;
        }> = [];

        // Calculate based on formula type
        switch (formula.formulaId) {
            case 1: // EVERY_N_LEVELS
                value = this.calculateEveryNLevels(formula, calculationLevel, progressionLevel);
                components.push({
                    source: 'Formula',
                    value,
                    type: 1, // BreakdownComponentType.Formula
                    description: `Every ${formula.interval} levels starting at level ${formula.formulaStartLevel || progressionLevel}`,
                    formula: `floor((${calculationLevel} - ${formula.formulaStartLevel || progressionLevel}) / ${formula.interval}) + 1`
                });
                break;

            case 2: // CONDITIONAL_SCALING
                value = this.calculateConditionalScaling(formula, calculationLevel, context);
                components.push({
                    source: 'Formula',
                    value,
                    type: 1, // BreakdownComponentType.Formula
                    description: 'Conditional scaling based on thresholds',
                    formula: 'Threshold-based calculation'
                });
                break;

            case 3: // ATTRIBUTE_BASED
                value = this.calculateAttributeBased(formula, calculationLevel, context);
                const attributeName = formula.abilityId ? ABILITY_MAP[formula.abilityId]?.name || `Ability ${formula.abilityId}` : 'Unknown';
                components.push({
                    source: 'Formula',
                    value,
                    type: 1, // BreakdownComponentType.Formula
                    description: `Based on ${attributeName}`,
                    formula: `${attributeName} modifier`
                });
                break;

            case 4: // LEVEL_PLUS_ATTRIBUTE
                value = this.calculateLevelPlusAttribute(formula, calculationLevel, context);
                const attrName = formula.abilityId ? ABILITY_MAP[formula.abilityId]?.name || `Ability ${formula.abilityId}` : 'Unknown';
                components.push({
                    source: 'Formula',
                    value,
                    type: 1, // BreakdownComponentType.Formula
                    description: `Level + ${attrName} modifier`,
                    formula: `${calculationLevel} + ${attrName} modifier`
                });
                break;

            default:
                value = 0;
                components.push({
                    source: 'Formula',
                    value: 0,
                    type: 1, // BreakdownComponentType.Formula
                    description: `Unsupported formula type: ${formula.formulaId}`
                });
        }

        return {
            value,
            breakdown: {
                components,
                formula: formulaDef.name,
                explanation: `Calculated using ${formulaDef.name} formula`
            }
        };
    }

    private calculateEveryNLevels(formula: FormulaParamsData, level: number, startLevel: number): number {
        const interval = formula.interval || 1;
        const formulaStartLevel = formula.formulaStartLevel || startLevel;
        return Math.floor((level - formulaStartLevel) / interval) + 1;
    }

    private calculateConditionalScaling(formula: FormulaParamsData, level: number, context?: CalculationContext): number {
        if (!formula.thresholds || !formula.values) {
            return 0;
        }

        // Find the highest threshold that the current level meets or exceeds
        let result = 0;
        for (let i = 0; i < formula.thresholds.length; i++) {
            if (level >= formula.thresholds[i]) {
                const value = formula.values[i];
                result = typeof value === 'number' ? value : parseInt(value.toString()) || 0;
            }
        }
        return result;
    }

    private calculateAttributeBased(formula: FormulaParamsData, level: number, context?: CalculationContext): number {
        if (!formula.abilityId || !context?.character?.abilityScores) {
            return 0;
        }

        const abilityScore = context.character.abilityScores[formula.abilityId];
        if (abilityScore === undefined) {
            return 0;
        }

        return Math.floor((abilityScore - 10) / 2);
    }

    private calculateLevelPlusAttribute(formula: FormulaParamsData, level: number, context?: CalculationContext): number {
        const levelValue = level;
        const attributeValue = this.calculateAttributeBased(formula, level, context);
        return levelValue + attributeValue;
    }
}

/**
 * Pure calculator for choice-based calculations
 */
export class ChoiceCalculatorImpl {
    calculateChoiceValue(
        choice: any, // Will be properly typed when we have choice calculation interfaces
        selectedValues: Array<{ id: number; name: string; value?: number }>,
        context?: CalculationContext
    ): CalculationResult {
        // This is a placeholder for choice-based calculations
        // Will be implemented when we have the choice calculation interfaces defined
        return {
            value: selectedValues.length,
            breakdown: {
                components: [{
                    source: 'Choice',
                    value: selectedValues.length,
                    type: 2, // BreakdownComponentType.Choice
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
    detectConditionals(modifiers: FeatureModifierInQueryResponse[], context?: CharacterContext): Array<ConditionalValue> {
        const conditionals: Array<ConditionalValue> = [];

        for (const modifier of modifiers) {
            if (modifier.conditions && modifier.conditions.length > 0) {
                for (const condition of modifier.conditions) {
                    const conditionalValue = this.createConditionalValue(modifier, condition, context);
                    if (conditionalValue) {
                        conditionals.push(conditionalValue);
                    }
                }
            }
        }

        return conditionals;
    }

    private createConditionalValue(
        modifier: FeatureModifierInQueryResponse,
        condition: any, // Will be properly typed when we have condition interfaces
        context?: CharacterContext
    ): ConditionalValue | null {
        // This is a placeholder for conditional value creation
        // Will be implemented when we have the condition interfaces defined
        return {
            value: modifier.value,
            breakdown: {
                components: [{
                    source: 'Conditional',
                    value: modifier.value,
                    type: 3, // BreakdownComponentType.Conditional
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

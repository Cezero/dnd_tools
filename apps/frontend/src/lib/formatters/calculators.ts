import type {
    FormulaParamsData,
    FeatureEntity,
    FeatureEntityCondition
} from '@shared/schema';
import {
    FORMULA_MAP,
    DisplayType,
    CalculationMethodType,
    FormulaId,
    GetAbilityModifier,
    ABILITY_MAP
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
            type: CalculationMethodType;
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

        // Create detailed breakdown components for character-dependent formulas
        if (formulaDef.isCharacterDependent && context?.character && value !== null) {
            const componentsBefore = components.length;
            this.createDetailedBreakdown(formula, params, value, components);
            // If detailed breakdown didn't add any components, fall back to generic breakdown
            if (components.length === componentsBefore) {
                components.push({
                    source: formulaDef.name,
                    value: value || 0,
                    type: CalculationMethodType.formula,
                    description: formulaDef.description,
                    formula: formulaString
                });
            }
        } else {
            // Generic breakdown for non-character-dependent formulas or when no character context
            components.push({
                source: formulaDef.name,
                value: value || 0, // Use 0 for breakdown display when value is null
                type: CalculationMethodType.formula,
                description: value === null ? `Formula does not apply at level ${level}` : formulaDef.description,
                formula: formulaString
            });
        }

        return {
            value, // Keep null values as null
            breakdown: {
                components,
                formula: formulaDef.name,
                explanation: value === null ? `Formula does not apply at level ${level}` : `Calculated using ${formulaDef.name} formula`
            }
        };
    }

    /**
     * Create detailed breakdown components for character-dependent formulas
     */
    private createDetailedBreakdown(
        formula: FormulaParamsData,
        params: Record<string, unknown>,
        totalValue: number,
        components: Array<{
            source: string;
            value: number | string;
            type: CalculationMethodType;
            description: string;
            formula?: string;
        }>
    ): void {
        const formulaId = formula.formulaId;

        // ABILITY_BASED: baseValue + ability modifier (e.g., 3 + CHA)
        if (formulaId === FormulaId.ABILITY_BASED) {
            const baseValue = params.baseValue as number;
            const abilityId = params.abilityId as number;
            const abilityName = ABILITY_MAP[abilityId]?.abbreviation || 'ability';

            if (params.context && typeof params.context === 'object' && 'character' in params.context) {
                const context = params.context as { character?: { abilityScores: Record<number, number> } };
                if (context.character && context.character.abilityScores) {
                    const abilityScore = context.character.abilityScores[abilityId];
                    if (abilityScore !== undefined) {
                        const modifier = GetAbilityModifier(abilityScore);

                        // Base value component
                        components.push({
                            source: 'Base value',
                            value: baseValue,
                            type: CalculationMethodType.base,
                            description: `Base value: ${baseValue}`
                        });

                        // Ability modifier component
                        const modifierString = modifier >= 0 ? `+${modifier}` : `${modifier}`;
                        components.push({
                            source: abilityName,
                            value: modifier,
                            type: CalculationMethodType.formula,
                            description: `${abilityName}: ${modifierString}`
                        });
                        return;
                    }
                }
            }
            // Fall back to generic breakdown if character data is not available
            return;
        }

        // ABILITY_MODIFIER: just ability modifier (e.g., +WIS)
        if (formulaId === FormulaId.ABILITY_MODIFIER) {
            const abilityId = params.abilityId as number;
            const abilityName = ABILITY_MAP[abilityId]?.abbreviation || 'ability';

            if (params.context && typeof params.context === 'object' && 'character' in params.context) {
                const context = params.context as { character?: { abilityScores: Record<number, number> } };
                if (context.character && context.character.abilityScores) {
                    const abilityScore = context.character.abilityScores[abilityId];
                    if (abilityScore !== undefined) {
                        const modifier = GetAbilityModifier(abilityScore);

                        const modifierString = modifier >= 0 ? `+${modifier}` : `${modifier}`;
                        components.push({
                            source: abilityName,
                            value: modifier,
                            type: CalculationMethodType.formula,
                            description: `${abilityName}: ${modifierString}`
                        });
                        return;
                    }
                }
            }
            // Fall back to generic breakdown if character data is not available
            return;
        }

        // LEVEL_TIMES_ABILITY: level × ability modifier
        if (formulaId === FormulaId.LEVEL_TIMES_ABILITY) {
            const abilityId = params.abilityId as number;
            const level = params.level as number;
            const abilityName = ABILITY_MAP[abilityId]?.abbreviation || 'ability';

            if (params.context && typeof params.context === 'object' && 'character' in params.context) {
                const context = params.context as { character?: { abilityScores: Record<number, number> } };
                if (context.character && context.character.abilityScores) {
                    const abilityScore = context.character.abilityScores[abilityId];
                    if (abilityScore !== undefined) {
                        const modifier = GetAbilityModifier(abilityScore);

                        components.push({
                            source: 'Level',
                            value: level,
                            type: CalculationMethodType.base,
                            description: `Level: ${level}`
                        });

                        const modifierString = modifier >= 0 ? `+${modifier}` : `${modifier}`;
                        components.push({
                            source: abilityName,
                            value: modifier,
                            type: CalculationMethodType.formula,
                            description: `${abilityName}: ${modifierString}`
                        });
                        return;
                    }
                }
            }
            // Fall back to generic breakdown if character data is not available
            return;
        }

        // LEVEL_PLUS_ABILITY: level + ability modifier
        if (formulaId === FormulaId.LEVEL_PLUS_ABILITY) {
            const abilityId = params.abilityId as number;
            const level = params.level as number;
            const abilityName = ABILITY_MAP[abilityId]?.abbreviation || 'ability';

            if (params.context && typeof params.context === 'object' && 'character' in params.context) {
                const context = params.context as { character?: { abilityScores: Record<number, number> } };
                if (context.character && context.character.abilityScores) {
                    const abilityScore = context.character.abilityScores[abilityId];
                    if (abilityScore !== undefined) {
                        const modifier = GetAbilityModifier(abilityScore);

                        components.push({
                            source: 'Level',
                            value: level,
                            type: CalculationMethodType.base,
                            description: `Level: ${level}`
                        });

                        const modifierString = modifier >= 0 ? `+${modifier}` : `${modifier}`;
                        components.push({
                            source: abilityName,
                            value: modifier,
                            type: CalculationMethodType.formula,
                            description: `${abilityName}: ${modifierString}`
                        });
                        return;
                    }
                }
            }
            // Fall back to generic breakdown if character data is not available
            return;
        }

        // For other formulas, fall back to generic breakdown
        // This will be handled by the caller
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
                    type: CalculationMethodType.conditional,
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

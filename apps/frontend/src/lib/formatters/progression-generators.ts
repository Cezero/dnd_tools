import type {
    FormulaParamsData,
    FeatureEntity
} from '@shared/schema';
import { FORMULA_MAP, CalculationMethodType, EntityType, DisplayType, ConditionalScalingValueType } from '@shared/static-data';

import { FormulaCalculatorImpl } from './calculators';
import { buildFormulaParams } from './formula-utils';
// Remove circular dependency - calculator will be passed as parameter
import type {
    CalculationContext,
    ProgressionValue,
    ProgressionGenerator,
    ProgressionGeneratorParams,
    CalculationBreakdown,
    FormulaCalculator
} from './types';


/**
 * Pure generator for progression values across level ranges
 */
export class ProgressionGeneratorImpl implements ProgressionGenerator {
    generateValues(params: ProgressionGeneratorParams): Array<ProgressionValue> {
        const { formula, startLevel, endLevel, context, entityValue, formulaCalculator, originalEntity } = params;
        const values: Array<ProgressionValue> = [];
        const formulaDef = FORMULA_MAP[formula.formulaId];

        if (!formulaDef) {
            return values;
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
            const singleValue = this.calculateSingleValue(formula, level, calculationContext, entityValue, formulaCalculator);
            const breakdown = this.createBreakdown(formulaDef, level, singleValue);

            // Handle cumulative vs non-cumulative logic
            if (formula.cumulative) {
                const applicableValues = this.getApplicableValues(formula, level);

                // For cumulative, generate multiple ProgressionValues
                for (const value of applicableValues) {
                    if (originalEntity) {
                        const modifiedEntity = this.createModifiedEntity(
                            originalEntity,
                            value,
                            formula.valuesRepresent,
                            this.determineGroupingId(originalEntity, formula)
                        );

                        values.push({
                            level,
                            breakdown,
                            conditionalValues: [],
                            entity: modifiedEntity
                        });
                    }
                }
            } else {
                // Non-cumulative - single ProgressionValue
                if (originalEntity) {
                    const modifiedEntity = this.createModifiedEntity(
                        originalEntity,
                        singleValue,
                        formula.valuesRepresent,
                        originalEntity?.groupingId || 0 // Preserve original groupingId for non-cumulative
                    );

                    values.push({
                        level,
                        breakdown,
                        conditionalValues: [],
                        entity: modifiedEntity
                    });
                }
            }
        }

        return values;
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

    private determineGroupingId(originalEntity: FeatureEntity | undefined, formula: FormulaParamsData): number {
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

    private generateCumulativeGroupingId(entity: FeatureEntity | undefined): number {
        // Generate a deterministic groupingId for cumulative entities
        // This ensures all cumulative entities from the same original entity
        // get the same groupingId, even if original had groupingId: 0
        if (!entity) {
            return 1; // Fallback for undefined entity
        }

        // Use a combination of entity properties to create a unique groupingId
        // This approach ensures consistency across different runs
        let baseId: number;

        const modifier = entity as FeatureEntity;
        baseId = Math.abs(
            modifier.id * 1000 +
            modifier.type * 100 +
            (modifier.appliesTo || 0) * 10 +
            (modifier.formulaParamsId || 0)
        );

        // Ensure it's a positive number (groupingId > 0 means grouped)
        return Math.max(1, baseId % 1000000); // Cap at reasonable range
    }

    private createModifiedEntity(
        originalEntity: FeatureEntity | undefined,
        value: number | string,
        valuesRepresent: ConditionalScalingValueType | undefined,
        groupingId: number
    ): FeatureEntity {
        if (!originalEntity) {
            // Fallback if no original entity provided (shouldn't happen in normal flow)
            console.error('No original entity provided for createModifiedEntity');
            return {
                id: 0,
                progressionId: 0,
                type: EntityType.Bonus,
                value: typeof value === 'string' ? 0 : value as number, // Handle string case
                appliesToId: null,
                appliesTo: null,
                bonusType: null,
                formulaParamsId: null,
                appliesToSubId: null,
                filterType: null,
                conditions: [],
                formulaParams: null,
                groupingId: groupingId,
                displayInDetail: true
            };
        }

        // Handle string values from getDisplayString() - these should be treated specially
        if (typeof value === 'string') {
            // For string values, we need to preserve the original entity structure
            // but indicate that this is a display string case
            return {
                ...originalEntity,
                value: 0, // Use 0 as placeholder for string values
                // Preserve appliesToId for labeler to work correctly
                groupingId: groupingId,
                // Store the display string in a way that formatters can access it
                // We'll use a special approach: put the string in the breakdown
            };
        }

        return {
            ...originalEntity, // Copy all original properties
            // Override appropriate field based on valuesRepresent
            ...(valuesRepresent === ConditionalScalingValueType.AppliesToId
                ? { appliesToId: value as number }
                : { value: value as number }
            ),
            // Use the determined groupingId
            groupingId: groupingId
        };
    }

    private calculateSingleValue(
        formula: FormulaParamsData,
        level: number,
        context: CalculationContext,
        entityValue: number | undefined,
        formulaCalculator: FormulaCalculator | undefined
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
                entityValue
            );

            return formulaDef.getDisplayString(params);
        } else {
            // Use calculate() - either non-character-dependent or character data is available
            const calculator = formulaCalculator || new FormulaCalculatorImpl();
            const result = calculator.calculate(formula, level, context, entityValue);
            return result.value;
        }
    }

    private createBreakdown(formulaDef: { name: string }, level: number, value: number | string): CalculationBreakdown {
        return {
            components: [{
                source: formulaDef.name,
                value: typeof value === 'string' ? 0 : value, // Use 0 for string values
                type: CalculationMethodType.formula,
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

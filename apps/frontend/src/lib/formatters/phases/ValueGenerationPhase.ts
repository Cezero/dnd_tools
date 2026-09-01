import type {
    FeatureWithRelations,
    FeatureEntity,
    FormulaParamsData
} from '@shared/schema';
import {
    CalculationMethodType,
    FORMULA_MAP,
    ConditionalScalingValueType,
    FormulaId
} from '@shared/static-data';

import { calculatorRegistry } from '../calculator-registry';
import { FormulaCalculatorImpl } from '../calculators';
import { buildFormulaParams } from '../formula-utils';
import type {
    DisplayContext,
    ProgressionValue,
    CalculatedValueWithLevel,
    CalculationContext,
    CalculationBreakdown,
    CalculatedEntity
} from '../types';

/**
 * Phase 1: Value Generation & Calculation
 * Handles generating calculated values for each level of each feature
 */
export class ValueGenerationPhase {
    private readonly MAX_CHARACTER_LEVEL = 20; // D&D standard maximum character level

    /**
     * Generate calculated values for each level of each feature
     */
    generateValues(
        feature: FeatureWithRelations,
        context?: DisplayContext,
    ): CalculatedValueWithLevel[] {
        const results: CalculatedValueWithLevel[] = [];

        // For features with formula-based entities: use ProgressionGenerator
        if (this.shouldGenerateProgression(feature, context)) {
            // Process ALL formula entities using feature generation
            const formulaEntities = feature.entities?.filter(e => e.formulaParams) || [];

            for (const formulaEntity of formulaEntities) {
                const progressionValues = this.generateProgressionValuesForSingleEntity(formulaEntity, feature, context);

                // Process all feature values for this entity
                for (const progressionValue of progressionValues) {
                    results.push({
                        breakdown: progressionValue.breakdown,
                        entity: progressionValue.entity,
                        level: progressionValue.level
                    });
                }
            }

            // Also process static entities at the feature level
            this.processStaticEntitiesAtLevel(feature, feature.level, results);
        } else {
            // For features with only static entities: process directly
            this.processEntitiesAtLevel(feature, feature.level, results);
        }

        return results;
    }

    /**
     * Determine if feature generation is needed based on formula properties
     */
    private shouldGenerateProgression(feature: FeatureWithRelations, _context?: DisplayContext): boolean {
        return feature.entities?.some(m =>
            m.formulaParams
        );
    }

    /**
     * Phase 1: Feature Generation for a specific entity
     * Generate feature values for a single formula-based entity
     */
    private generateProgressionValuesForSingleEntity(
        formulaEntity: FeatureEntity,
        feature: FeatureWithRelations,
        context?: DisplayContext
    ): ProgressionValue[] {
        if (!formulaEntity.formulaParams) {
            return [];
        }

        const calculationContext: CalculationContext = {
            level: feature.level,
            progressionLevel: feature.level,
            characterLevel: context?.currentLevel,
            character: context?.character,
            includeNonTransitionLevels: context?.includeNonTransitionLevels
        };

        // Use registry to get feature generator and formula calculator
        // TODO: this code makes no sense, what is it doing?
        const progressionGenerator = calculatorRegistry.getDefaultProgressionGenerator();
        if (!progressionGenerator) {
            return [];
        }

        // For ALL entities with formulas, only generate values at formula-determined intervals
        return this.generateFormulaIntervalValues(formulaEntity, feature, calculationContext);
    }

    /**
     * Generate values for ALL entities only at formula-determined intervals
     * This ensures consistent behavior across all entity types
     */
    private generateFormulaIntervalValues(
        formulaEntity: FeatureEntity,
        feature: FeatureWithRelations,
        calculationContext: CalculationContext
    ): ProgressionValue[] {
        const values: ProgressionValue[] = [];
        const formula = formulaEntity.formulaParams!;
        const formulaDef = FORMULA_MAP[formula.formulaId];

        // Pass FeatureEntity.value and calculationContext to getFormulaIntervalLevels for proper formula calculation
        const intervalData = this.getFormulaIntervalLevels(formula, feature.level, formulaEntity.value, calculationContext);

        for (const [level, calculatedValue] of intervalData) {
            let singleValue: number | string;
            let breakdown: CalculationBreakdown;

            // Convert CalculationContext to DisplayContext for buildFormulaParams
            const displayContext: DisplayContext | undefined = calculationContext.character ? {
                character: calculationContext.character,
                currentLevel: calculationContext.characterLevel,
                level: calculationContext.level
            } : undefined;

            if (formulaDef.isCharacterDependent) {
                // For character-dependent formulas:
                // - If character context is available, use calculate() to get the actual value
                // - If no character context, use getDisplayString() to show the formula
                if (calculationContext.character) {
                    // Character context available - calculate the actual value
                    const calculator = new FormulaCalculatorImpl();
                    const result = calculator.calculate(formula, level, calculationContext, formulaEntity.value);
                    singleValue = result.value ?? calculatedValue; // Fall back to calculatedValue if result.value is null

                    // Use the detailed breakdown from the calculator
                    breakdown = result.breakdown;
                } else {
                    // No character context - use display string
                    const params = buildFormulaParams(formula, level, feature.level, displayContext, formulaEntity.value);
                    singleValue = formulaDef.getDisplayString(params);

                    breakdown = {
                        components: [{
                            source: 'Formula',
                            value: 0, // Use 0 for string values
                            type: CalculationMethodType.formula,
                            description: singleValue as string
                        }]
                    };
                }
            } else {
                // For non-character-dependent formulas, use the pre-calculated value
                singleValue = calculatedValue;
                breakdown = {
                    components: [{
                        source: 'Formula',
                        value: singleValue as number,
                        type: CalculationMethodType.formula,
                        description: `Formula calculation at level ${level}`,
                        // Preserve entity identity so downstream consumers can
                        // reason about what this value represents using only
                        // breakdown metadata (no direct entity access).
                        sourceType: formulaEntity.appliesTo,
                        sourceId: formulaEntity.appliesToId ?? undefined
                    }]
                };
            }

            // Create CalculatedEntity with the calculated value
            // Handle valuesRepresent logic: set either value or appliesToId based on formula.valuesRepresent
            const calculatedEntity: CalculatedEntity = {
                ...formulaEntity,
                ...(formula.valuesRepresent === ConditionalScalingValueType.AppliesToId
                    ? { appliesToId: singleValue as number }
                    : { value: singleValue }), // Can be number or string
                calculatedValue: singleValue
            };

            // Handle cumulative logic
            if (formula.cumulative && values.length > 0) {
                // Get the level of the previous interval
                const previousLevel = values[values.length - 1].level;

                // Find all entities from the previous interval level
                const previousLevelEntities = values.filter(v => v.level === previousLevel);

                // Create new calculated values for current level + all previous level entities
                const newCalculatedValues: ProgressionValue[] = [];

                // Generate the correct groupingId for this level
                const newGroupingId = this.generateCumulativeGroupingId(formulaEntity, level);

                // Add the current entity with the correct groupingId
                const currentEntityWithCorrectGroupingId: CalculatedEntity = {
                    ...calculatedEntity,
                    groupingId: newGroupingId
                };

                newCalculatedValues.push({
                    level,
                    breakdown,
                    conditionalValues: [],
                    entity: currentEntityWithCorrectGroupingId
                });

                // Clone and add all previous level entities with current level and new groupingId
                for (const prevEntity of previousLevelEntities) {
                    const clonedEntity: CalculatedEntity = {
                        ...prevEntity.entity,
                        groupingId: newGroupingId
                    };

                    newCalculatedValues.push({
                        level,
                        breakdown: prevEntity.breakdown,
                        conditionalValues: [],
                        entity: clonedEntity
                    });
                }

                // Push all new calculated values
                values.push(...newCalculatedValues);
            } else {
                // Non-cumulative or first interval - just push the single entity
                values.push({
                    level,
                    breakdown,
                    conditionalValues: [],
                    entity: calculatedEntity
                });
            }
        }

        return values;
    }

    /**
     * Generate a deterministic groupingId for cumulative entities
     * This ensures all cumulative entities from the same original entity
     * get the same groupingId at the same level
     */
    private generateCumulativeGroupingId(entity: FeatureEntity, level: number): number {
        if (!entity) {
            return 1; // Fallback for undefined entity
        }

        // Use a combination of entity properties and level to create a unique groupingId
        // This approach ensures consistency across different runs
        let baseId: number;

        baseId = Math.abs(
            entity.id * 1000 +
            entity.type * 100 +
            (entity.appliesTo || 0) * 10 +
            (entity.formulaParamsId || 0) +
            level * 1000000 // Include level to make it unique per level
        );

        // Ensure it's a positive number (groupingId > 0 means grouped)
        return Math.max(1, baseId % 1000000); // Cap at reasonable range
    }

    /**
     * Get the specific levels where a formula should generate values
     * For ALL entities, this should only be at the formula-determined intervals
     * Returns array of [level, value] tuples for non-null values
     */
    private getFormulaIntervalLevels(
        formula: FormulaParamsData,
        progressionLevel: number,
        entityValue?: number,
        calculationContext?: CalculationContext
    ): Array<[number, number]> {
        const formulaDef = FORMULA_MAP[formula.formulaId];

        // Use real character context if available, otherwise use mock character for interval detection
        const characterContext = calculationContext?.character || {
            abilityScores: {
                1: 12, 2: 12, 3: 12, 4: 12, 5: 12, 6: 12 // All abilities = 12 (modifier = +1)
            },
            classLevels: {
                0: 1 // All classes = 1
            }
        };

        // Convert CalculationContext to DisplayContext for buildFormulaParams
        // Always create displayContext when we have a character-dependent formula to avoid undefined context errors
        const displayContext: DisplayContext = {
            character: characterContext,
            currentLevel: calculationContext?.characterLevel,
            level: calculationContext?.level
        };

        // Special handling for CONDITIONAL_SCALING formulas
        // return the thresholds and values as the changingValues
        // since we want to always include the threshold entries even if the value doesn't change
        if (formula.formulaId === FormulaId.CONDITIONAL_SCALING) {
            return formula.thresholds?.map((threshold, index) => [threshold, formula.values?.[index] as number]) || [];
        }

        // Special handling for STATIC_EVERY_N_LEVELS formulas
        // Always include all levels where value is non-zero, even if it doesn't change
        // This ensures feature displays show all levels (e.g., "1 skill point every level")
        if (formula.formulaId === FormulaId.STATIC_EVERY_N_LEVELS) {
            const allLevels: Array<[number, number]> = [];
            for (let level = progressionLevel; level <= this.MAX_CHARACTER_LEVEL; level++) {
                // Pass entityValue and displayContext to buildFormulaParams - it will use this value or default to 1
                const params = buildFormulaParams(formula, level, progressionLevel, displayContext, entityValue);
                const value = formulaDef.calculate(params);
                // Include all levels where value is non-zero (not null and not 0)
                if (value !== null && value !== 0) {
                    allLevels.push([level, value]);
                }
            }
            return allLevels;
        }

        // Single loop: build array of [level, value] tuples for non-null values
        const changingValues: Array<[number, number]> = [];
        const includeAllLevels = calculationContext?.includeNonTransitionLevels === true;

        for (let level = progressionLevel; level <= this.MAX_CHARACTER_LEVEL; level++) {
            // Pass entityValue and displayContext to buildFormulaParams - it will use this value or default to 1
            const params = buildFormulaParams(formula, level, progressionLevel, displayContext, entityValue);
            const value = formulaDef.calculate(params);

            // Only include non-null values
            if (value !== null) {
                if (includeAllLevels) {
                    // Include every level with a non-null value, even if it matches the previous level
                    changingValues.push([level, value]);
                } else {
                    // Only add if value changed from previous value
                    if (changingValues.length === 0 || value !== changingValues[changingValues.length - 1][1]) {
                        changingValues.push([level, value]);
                    }
                }
            }
        }

        // Return both levels and values
        return changingValues;
    }

    /**
     * Helper method to process static entities (entities without formulas) at a specific level
     * All formula-based entities are handled by the feature generator path
     */
    private processEntitiesAtLevel(
        feature: FeatureWithRelations,
        level: number,
        results: CalculatedValueWithLevel[]
    ): void {
        // Process entities
        this.processStaticEntitiesAtLevel(feature, level, results);
    }

    /**
     * Helper method to process only static entities (without formulas) at a specific level
     */
    private processStaticEntitiesAtLevel(
        feature: FeatureWithRelations,
        level: number,
        results: CalculatedValueWithLevel[]
    ): void {
        // Process only static entities (those without formulas)
        if (feature.entities) {
            for (const entity of feature.entities) {
                if (!entity.formulaParams) {
                    // Create CalculatedEntity for static entities
                    const calculatedEntity: CalculatedEntity = {
                        ...entity,
                        value: entity.value,
                        calculatedValue: entity.value
                    };

                        results.push({
                            breakdown: {
                                components: [{
                                    source: 'Static',
                                    value: entity.value ?? 0,
                                    type: CalculationMethodType.base,
                                    description: `Static modifier: ${entity.value ?? 0}`,
                                    // Preserve entity identity on breakdown for
                                    // downstream consumers.
                                    sourceType: entity.appliesTo,
                                    sourceId: entity.appliesToId ?? undefined
                                }]
                            },
                            entity: calculatedEntity,
                            level
                        });
                }
            }
        }
    }
}

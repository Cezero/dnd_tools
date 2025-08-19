/**
 * Formula Calculator Utility
 * 
 * Provides functions for calculating formula values and previewing formulas
 * during feature editing. This utility bridges the gap between the simplified
 * formula system and the frontend UI.
 */

import type { FeatureModifierInQueryResponse, FormulaContext, FormulaPreview, FormulaValidationResult, CharacterContext } from '@shared/schema';
import { calculateFormula, FORMULA_LIST, FORMULA_MAP, type Formula } from '@shared/static-data';

export const FormulaCalculator = {
    /**
     * Calculate the final value for a modifier using its formula
     */
    calculateModifierValue(modifier: FeatureModifierInQueryResponse, context: FormulaContext): number {
        const formulaId = modifier.formulaParams?.formulaId;
        if (formulaId) {
            const formula = FORMULA_MAP[formulaId];
            if (!formula) {
                console.warn(`Unknown formula ID: ${formulaId}`);
                return modifier.value;
            }

            // Build parameters based on formula requirements
            const params: Record<string, number> = {};

            // Add level from context
            if (context.level) {
                params.level = context.level;
            }

            // Add formula-specific parameters based on the formula definition
            for (const param of formula.parameters) {
                if (param.name === 'level') {
                    // Level is already handled above
                    continue;
                } else if (param.name === 'startLevel') {
                    // Start level comes from the progression level (context.progressionLevel)
                    if (context.progressionLevel) {
                        params[param.name] = context.progressionLevel as number;
                    } else {
                        console.warn('startLevel parameter required but progressionLevel not provided in context');
                        return modifier.value;
                    }
                } else if (param.name === 'scalingValue') {
                    // Scaling value comes from FeatureModifier.value
                    params[param.name] = modifier.value;
                } else if (param.name === 'interval') {
                    // Interval comes from FeatureModifierFormulaParams.interval
                    if ((modifier as any).formulaParams?.interval) {
                        params[param.name] = (modifier as any).formulaParams.interval;
                    } else {
                        // Fallback to using modifier.value as interval (old behavior)
                        params[param.name] = modifier.value;
                    }
                } else if (param.name === 'formulaStartLevel') {
                    // Formula start level comes from FeatureModifierFormulaParams.formulaStartLevel
                    if ((modifier as any).formulaParams?.formulaStartLevel) {
                        params[param.name] = (modifier as any).formulaParams.formulaStartLevel;
                    }
                } else if (param.name === 'thresholds' || param.name === 'values') {
                    // These are special parameters that would need to be stored elsewhere
                    // For now, use default values or skip
                    console.warn(`Parameter ${param.name} not supported yet`);
                    return modifier.value;
                } else if (param.name === 'baseValue') {
                    // Base value comes from FeatureModifier.value (already handled above)
                    params[param.name] = modifier.value;
                } else if (param.name === 'attributeId') {
                    // Attribute ID comes from FeatureModifierFormulaParams.attributeId
                    if ((modifier as any).formulaParams?.attributeId) {
                        params[param.name] = (modifier as any).formulaParams.attributeId;
                    } else {
                        console.warn('attributeId parameter required but not provided in formula params');
                        return modifier.value;
                    }
                }
            }

            // Handle attribute-dependent formulas that need character context
            if (this.isAttributeDependentFormula(formulaId) && context.character) {
                return this.calculateAttributeDependentFormula(formulaId, params, context.character);
            }

            return calculateFormula(formulaId, params);
        }
        return modifier.value;
    },

    /**
     * Preview a formula for levels 1-20
     */
    previewFormula(formulaId: number, parameters: Record<string, string | number | boolean>, character?: CharacterContext): FormulaPreview {
        const formula = FORMULA_MAP[formulaId];
        if (!formula) {
            throw new Error(`Unknown formula ID: ${formulaId}`);
        }

        // Convert parameters to numbers for calculation
        const numericParams: Record<string, number> = {};
        for (const [key, value] of Object.entries(parameters)) {
            if (typeof value === 'number') {
                numericParams[key] = value;
            } else if (typeof value === 'string') {
                const num = parseFloat(value);
                if (!isNaN(num)) {
                    numericParams[key] = num;
                }
            }
        }

        const calculatedValues = [];
        for (let level = 1; level <= 20; level++) {
            try {
                let value: number;

                if (this.isAttributeDependentFormula(formulaId) && character) {
                    value = this.calculateAttributeDependentFormula(formulaId, { ...numericParams, level }, character);
                } else {
                    value = calculateFormula(formulaId, { ...numericParams, level });
                }

                calculatedValues.push({ level, value });
            } catch (error) {
                console.warn(`Failed to calculate formula ${formulaId} for level ${level}:`, error);
                calculatedValues.push({ level, value: 0 });
            }
        }

        return {
            formulaId: formulaId.toString(),
            formula,
            calculatedValues,
            parameters: numericParams
        };
    },

    /**
     * Get all available formulas for selection
     */
    getAvailableFormulas(): Formula[] {
        return FORMULA_LIST;
    },

    /**
     * Validate formula parameters
     */
    validateFormulaParameters(formulaId: number, parameters: Record<string, string | number | boolean>): FormulaValidationResult {
        const formula = FORMULA_MAP[formulaId];
        if (!formula) {
            return {
                valid: false,
                errors: [`Unknown formula ID: ${formulaId}`]
            };
        }

        const errors: string[] = [];
        const numericParams: Record<string, number> = {};

        // Convert and validate parameters
        for (const param of formula.parameters) {
            const value = parameters[param.name];

            if (param.required && (value === undefined || value === null || value === '')) {
                errors.push(`Missing required parameter: ${param.name}`);
                continue;
            }

            if (value !== undefined && value !== null && value !== '') {
                let numValue: number;

                if (typeof value === 'number') {
                    numValue = value;
                } else if (typeof value === 'string') {
                    numValue = parseFloat(value);
                    if (isNaN(numValue)) {
                        errors.push(`Invalid numeric value for parameter ${param.name}: ${value}`);
                        continue;
                    }
                } else {
                    errors.push(`Invalid parameter type for ${param.name}: expected number, got ${typeof value}`);
                    continue;
                }

                numericParams[param.name] = numValue;
            } else if (param.defaultValue !== undefined) {
                numericParams[param.name] = param.defaultValue;
            }
        }

        // Test calculation with provided parameters
        if (errors.length === 0) {
            try {
                calculateFormula(formulaId, numericParams);
            } catch (error) {
                errors.push(`Formula calculation failed: ${error}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    },

    /**
     * Get default parameters for a formula
     */
    getDefaultParameters(formulaId: number): Record<string, number> {
        const formula = FORMULA_MAP[formulaId];
        if (!formula) {
            return {};
        }

        const defaults: Record<string, number> = {};
        formula.parameters.forEach(param => {
            if (param.defaultValue !== undefined) {
                defaults[param.name] = param.defaultValue;
            }
        });

        return defaults;
    },

    /**
     * Format a formula description for display
     */
    formatFormulaDescription(formula: Formula): string {
        const paramList = formula.parameters
            .map(param => `${param.name}${param.required ? '' : '?'}`)
            .join(', ');
        return `${formula.description} (${paramList})`;
    },

    /**
     * Check if a formula is attribute-dependent
     */
    isAttributeDependentFormula(formulaId: number): boolean {
        return formulaId === 6 || formulaId === 7 || formulaId === 8; // ATTRIBUTE_BASED, ATTRIBUTE_MODIFIER, LEVEL_TIMES_ATTRIBUTE
    },

    /**
     * Calculate attribute-dependent formulas
     */
    calculateAttributeDependentFormula(formulaId: number, params: Record<string, number>, character: CharacterContext): number {
        const attributeId = params.attributeId;
        if (!attributeId) {
            console.warn('attributeId parameter required for attribute-dependent formula');
            return 0;
        }

        const abilityScore = character.abilityScores[attributeId];
        if (abilityScore === undefined) {
            console.warn(`Ability score not found for attribute ID: ${attributeId}`);
            return 0;
        }

        // Calculate ability modifier: (score - 10) / 2, rounded down
        const abilityModifier = Math.floor((abilityScore - 10) / 2);

        switch (formulaId) {
            case 6: // ATTRIBUTE_BASED
                const baseValue = params.baseValue || 0;
                return baseValue + abilityModifier;

            case 7: // ATTRIBUTE_MODIFIER
                return abilityModifier;

            case 8: // LEVEL_TIMES_ATTRIBUTE
                const level = params.level || 1;
                return level * abilityModifier;

            default:
                console.warn(`Unknown attribute-dependent formula ID: ${formulaId}`);
                return 0;
        }
    }
};

export default FormulaCalculator;

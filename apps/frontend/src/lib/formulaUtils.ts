import { CharacterContext } from "@shared/schema";
import { ABILITY_MAP, FormulaId } from "@shared/static-data";
import { FormulaCalculator } from "./formulaCalculator";

/**
 * Create a formula context for calculations
 */
export function createFormulaContext(level: number, progressionLevel: number, character?: CharacterContext) {
    return { level, progressionLevel, character };
}

/**
 * Get formula display string for attribute-dependent formulas
 */
export function getFormulaDisplayString(formulaId: number, valueInt: number, attributeId: number, abilityModifier?: number): string {
    const attributeAbbr = ABILITY_MAP[attributeId]?.abbreviation || 'UNK';

    switch (formulaId) {
        case FormulaId.ATTRIBUTE_BASED:
            if (abilityModifier !== undefined) {
                const result = valueInt + abilityModifier;
                return `${valueInt} + ${attributeAbbr} (${abilityModifier}) = ${result}`;
            }
            return `${valueInt} + ${attributeAbbr}`;
        case FormulaId.ATTRIBUTE_MODIFIER:
            if (abilityModifier !== undefined) {
                return `${attributeAbbr} (${abilityModifier}) = ${abilityModifier}`;
            }
            return `+${attributeAbbr}`;
        case FormulaId.LEVEL_TIMES_ATTRIBUTE:
            if (abilityModifier !== undefined) {
                return `level × ${attributeAbbr} (${abilityModifier}) = ${abilityModifier}`;
            }
            return `level × ${attributeAbbr}`;
        default:
            return `${valueInt}`;
    }
}

/**
 * Process attribute-dependent formula and return calculated value or formula display
 */
export function processAttributeFormula(modifier: any, character?: CharacterContext, valueInt?: number, level: number = 1): { calculated?: number; display?: string } {
    if (!modifier?.formulaParams?.formulaId || !FormulaCalculator.isAttributeDependentFormula(modifier.formulaParams.formulaId)) {
        return {};
    }

    const formulaId = modifier.formulaParams.formulaId;
    const attributeId = modifier.formulaParams?.attributeId;

    if (character && attributeId) {
        // With character context - return calculated value
        const context = createFormulaContext(level, 1, character);
        const calculatedValue = FormulaCalculator.calculateModifierValue(modifier, context);
        return { calculated: calculatedValue };
    } else if (attributeId) {
        // Without character context - return formula display
        const formulaDisplay = getFormulaDisplayString(formulaId, valueInt || 0, attributeId);
        return { display: formulaDisplay };
    }

    return {};
}

/**
 * Generate progression values for a modifier across level range
 */
export function generateProgressionValues(modifier: any, startLevel: number, character?: CharacterContext, maxLevel: number = 20): Array<{ level: number; value: number }> {
    const progressionValues: Array<{ level: number; value: number }> = [];

    for (let level = startLevel; level <= maxLevel; level++) {
        const context = createFormulaContext(level, startLevel, character);
        const value = FormulaCalculator.calculateModifierValue(modifier, context);
        progressionValues.push({ level, value });
    }

    return progressionValues;
}

/**
 * Find transition points where values change
 */
export function findTransitionPoints(progressionValues: Array<{ level: number; value: number }>): Array<{ level: number; value: number }> {
    const transitionPoints: Array<{ level: number; value: number }> = [];
    let lastValue = 0;

    for (const { level, value } of progressionValues) {
        if (value !== lastValue) {
            transitionPoints.push({ level, value });
            lastValue = value;
        }
    }

    return transitionPoints;
}

/**
 * Determine the display value from a formula result
 */
export function getDisplayValue(formulaResult: any, valueInt: number, formatSignedValue: (value: number) => string): string {
    if (formulaResult.calculated !== undefined) {
        return formatSignedValue(formulaResult.calculated);
    } else if (formulaResult.display) {
        return formulaResult.display;
    } else {
        return formatSignedValue(valueInt);
    }
}

/**
 * Get display value and pluralize value from formula result with LEVEL_TIMES_ATTRIBUTE handling
 */
export function getDisplayAndPluralizeValue(formulaResult: any, valueInt: number, modifier: any): { displayValue: string; pluralizeValue: number } {
    let displayValue: string;
    let pluralizeValue: number;

    if (formulaResult.calculated !== undefined) {
        displayValue = formulaResult.calculated.toString();
        pluralizeValue = formulaResult.calculated;
    } else if (formulaResult.display) {
        // Special handling for LEVEL_TIMES_ATTRIBUTE to show "level × CHA" format
        if (modifier?.formulaParams?.formulaId === FormulaId.LEVEL_TIMES_ATTRIBUTE) {
            const attributeId = modifier.formulaParams?.attributeId;
            const attributeAbbr = ABILITY_MAP[attributeId]?.abbreviation || 'UNK';
            displayValue = `${valueInt} × ${attributeAbbr}`;
        } else {
            displayValue = formulaResult.display;
        }
        pluralizeValue = valueInt;
    } else {
        displayValue = valueInt.toString();
        pluralizeValue = valueInt;
    }

    return { displayValue, pluralizeValue };
}

/**
 * Format damage dice for replacement modifiers with formulas
 */
export function formatDamageDice(modifier: any, character?: CharacterContext, previewLevel?: number, currentLevel?: number): string {
    if (!modifier?.formulaParams?.formulaId) {
        return `Damage: ${modifier.value}`;
    }

    const formulaId = modifier.formulaParams.formulaId;

    // Handle conditional scaling for damage dice
    if (formulaId === FormulaId.CONDITIONAL_SCALING) {
        // Determine the level to use for calculation
        let calculationLevel: number;
        if (character) {
            // With character context - use total character level
            calculationLevel = Object.values(character.classLevels).reduce((sum, level) => sum + level, 0);
        } else if (previewLevel !== undefined) {
            // In formula preview context - use provided preview level
            calculationLevel = previewLevel;
        } else if (currentLevel !== undefined) {
            // With current level but no character context - calculate for the specific level
            calculationLevel = currentLevel;
        } else {
            // Without character context or current level - show progression pattern
            const { thresholds, values } = modifier.formulaParams;
            if (thresholds && values) {
                const thresholdArray = thresholds.split(',').map(t => t.trim());
                const valueArray = values.split(',').map(v => v.trim());
                const progression = thresholdArray.map((threshold, index) =>
                    `Level ${threshold}: ${valueArray[index] || valueArray[valueArray.length - 1]}`
                ).join(', ');
                return `Unarmed Damage: ${progression}`;
            }
            return `Unarmed Damage: ${modifier.value}`;
        }

        // Calculate and return the damage dice value
        const context = createFormulaContext(calculationLevel, 1, character);
        const calculatedDamageDice = FormulaCalculator.calculateModifierValue(modifier, context);
        return `Unarmed Damage: ${calculatedDamageDice}`;
    }

    return `Unarmed Damage: ${modifier.value}`;
}

import { CharacterContext } from "@shared/schema";
import {
    ModifierAppliesToType,
    ModifierType,
    ABILITY_MAP,
    RPG_DICE,
    DAMAGE_TYPES,
    SAVING_THROW_MAP,
    USES_FREQUENCIES,
    LANGUAGE_SELECT_LIST
} from "@shared/static-data";
import { formatSignedValue, formatWithBonusType, formatLanguageName } from "./formatterUtils";
import { processAttributeFormula, getDisplayValue, getDisplayAndPluralizeValue, formatDamageDice } from "./formulaUtils";

// Helper function to create formatters
const fmt = (fn: (valueInt: number, appliesToId: number, bonusType?: number | null, character?: CharacterContext, modifier?: any, progression?: any) => string) => ({
    value: (valueInt: number | null, appliesToId?: number | null, bonusType?: number | null, character?: CharacterContext, modifier?: any, progression?: any) =>
        fn(valueInt ?? 0, appliesToId ?? 0, bonusType, character, modifier, progression)
});

/**
 * Create a formatter for attribute-dependent modifiers with a custom label
 */
export function createAttributeFormatter(label: string) {
    return fmt((valueInt, appliesToId, bonusType, character, modifier, progression) => {
        const formulaResult = processAttributeFormula(modifier, character, valueInt);
        const displayValue = getDisplayValue(formulaResult, valueInt, formatSignedValue);

        const base = `${label}: ${displayValue}`;
        return formatWithBonusType(base, bonusType);
    });
}

/**
 * Create a formatter for damage modifiers (with replacement formula support)
 */
export function createDamageFormatter(label: string) {
    return fmt((valueInt, appliesToId, bonusType, character, modifier, progression) => {
        // Check if this is a replacement modifier with formula (damage dice)
        if (modifier?.type === ModifierType.Replacement && modifier?.formulaParams?.formulaId) {
            return formatDamageDice(modifier, character, undefined, progression?.level);
        }

        // Handle quantity modifiers (like sneak attack dice)
        if (modifier?.type === ModifierType.Quantity) {
            const diceName = RPG_DICE[appliesToId]?.name || 'd?';
            const base = `${label}: +${valueInt}${diceName}`;
            return formatWithBonusType(base, bonusType);
        }

        // Handle numeric bonuses (existing logic)
        const base = `${label}: ${formatSignedValue(valueInt)}`;
        return formatWithBonusType(base, bonusType);
    });
}

/**
 * Create a formatter for uses/frequency modifiers with special LEVEL_TIMES_ATTRIBUTE handling
 */
export function createUsesFormatter() {
    return fmt((valueInt, appliesToId, bonusType, character, modifier, progression) => {
        const frequencyName = USES_FREQUENCIES[appliesToId]?.name || 'Unknown';
        const formulaResult = processAttributeFormula(modifier, character, valueInt);
        const { displayValue } = getDisplayAndPluralizeValue(formulaResult, valueInt, modifier);

        const base = `${displayValue}/${frequencyName}`;
        return formatWithBonusType(base, bonusType);
    });
}

/**
 * Create a formatter for healing modifiers with special LEVEL_TIMES_ATTRIBUTE handling and pluralization
 */
export function createHealingFormatter() {
    return fmt((valueInt, appliesToId, bonusType, character, modifier, progression) => {
        const formulaResult = processAttributeFormula(modifier, character, valueInt);
        const { displayValue, pluralizeValue } = getDisplayAndPluralizeValue(formulaResult, valueInt, modifier);

        const base = `${displayValue} hit point${pluralizeValue !== 1 ? 's' : ''} per day`;
        return formatWithBonusType(base, bonusType);
    });
}

/**
 * Create a simple formatter with a custom label and value formatting
 */
export function createSimpleFormatter(label: string, valueFormatter: (valueInt: number, appliesToId: number) => string) {
    return fmt((valueInt, appliesToId, bonusType, character, modifier, progression) => {
        const base = valueFormatter(valueInt, appliesToId);
        return formatWithBonusType(base, bonusType);
    });
}

/**
 * Create a formatter for pluralized items (targets, attacks, etc.)
 */
export function createPluralizedFormatter(singular: string, plural: string) {
    return createSimpleFormatter('', (valueInt, appliesToId) => `${valueInt} ${valueInt !== 1 ? plural : singular}`);
}

/**
 * Create a formatter for attribute modifiers with dynamic attribute abbreviation
 */
export function createAttributeWithAbbrFormatter() {
    return fmt((valueInt, appliesToId, bonusType, character, modifier, progression) => {
        const formulaResult = processAttributeFormula(modifier, character, valueInt);

        // Determine which attribute abbreviation to use
        const attributeId = formulaResult.display ? modifier.formulaParams?.attributeId : appliesToId;
        const attributeAbbr = ABILITY_MAP[attributeId]?.abbreviation || (formulaResult.display ? 'UNK' : '');

        const displayValue = getDisplayValue(formulaResult, valueInt, formatSignedValue);

        const base = `${attributeAbbr}: ${displayValue}`;
        return formatWithBonusType(base, bonusType);
    });
}

/**
 * Create a formatter for saving throw modifiers with dynamic save name
 */
export function createSavingThrowFormatter() {
    return fmt((valueInt, appliesToId, bonusType, character, modifier, progression) => {
        const saveName = appliesToId === -1 ? 'All saves' : (SAVING_THROW_MAP[appliesToId]?.abbreviation || '');
        return createAttributeFormatter(saveName).value(valueInt, appliesToId, bonusType, character, modifier, progression);
    });
}

/**
 * Create language formatters
 */
export function createLanguageFormatter() {
    return fmt((valueInt, appliesToId, bonusType, character, modifier, progression) => formatLanguageName(appliesToId, LANGUAGE_SELECT_LIST));
}

/**
 * Create feat formatter
 */
export function createFeatFormatter() {
    return fmt((valueInt, appliesToId, bonusType, character, modifier, progression) => {
        // For direct feat grants, we want to show the feat name
        // appliesToId should be the feat ID
        // The feat name should be available in the modifier data if it was loaded
        if (modifier?.feat?.name) {
            return `Granted Feat: ${modifier.feat.name}`;
        }
        // Fallback to ID if name not available
        return `Granted Feat (ID: ${appliesToId})`;
    });
}

/**
 * Unified choice formatter that handles all choice types consistently
 * 
 * This is the single source of truth for choice formatting across all components.
 * It handles:
 * - Specific feat choices (choice.feat?.name)
 * - Specific feature choices (choice.feature?.name) 
 * - Creature type choices (choice.choiceType === 'CreatureType')
 * - Filtered choices with labels (choice.label)
 * 
 * All choice options are formatted as pipe-delimited strings (e.g., "Bonus Feat|Crippling Strike|Defensive Roll")
 */
export function createUnifiedChoiceFormatter() {
    return fmt((valueInt, appliesToId, bonusType, character, modifier, progression) => {
        if (!progression?.choices || progression.choices.length === 0) {
            return progression?.feature?.name || 'choice';
        }

        // Check if any choices have formulas - if so, return early to let formula pattern handle it
        const hasFormulaChoices = progression.choices.some(choice =>
            choice.formulaParamsId || (choice.formulaParams && choice.formulaParams.formulaId)
        );

        if (hasFormulaChoices) {
            // For progressions with both formula and non-formula choices, 
            // only show the non-formula choices for the original level
            const nonFormulaChoices = progression.choices.filter(choice =>
                !choice.formulaParamsId && !(choice.formulaParams && choice.formulaParams.formulaId)
            );

            if (nonFormulaChoices.length > 0) {
                // Format only the non-formula choices
                const choiceLabels = nonFormulaChoices
                    .map(choice => {
                        // Use filter type label if available, otherwise use the choice label
                        if (choice.filterType !== null && choice.filterType !== undefined) {
                            const filterOption = FEATURE_FEAT_CHOICE_FILTER_SELECT_LIST.find(opt => opt.value === choice.filterType);
                            return filterOption?.label || choice.label;
                        }
                        return choice.label;
                    })
                    .filter(Boolean);

                if (choiceLabels.length > 0) {
                    return choiceLabels.join('|');
                }
            }

            // For synthetic entries (no formula context), format the choices normally
            const choiceLabels = progression.choices
                .filter(choice => choice.label)
                .map(choice => choice.label)
                .filter(Boolean);

            if (choiceLabels.length > 0) {
                return choiceLabels.join('|');
            }

            return 'choice'; // Let the formula pattern handle the formatting
        }

        // For progressions with only non-formula choices, format them normally
        // First, check if we have specific feat or feature choices
        const featNames = progression.choices
            .filter(choice => choice.feat?.name)
            .map(choice => choice.feat.name)
            .filter(Boolean);

        const featureNames = progression.choices
            .filter(choice => choice.feature?.name)
            .map(choice => choice.feature.name)
            .filter(Boolean);

        const creatureTypeChoices = progression.choices
            .filter(choice => choice.type === 2) // FeatureChoiceType.CreatureType
            .map(choice => {
                // For creature type choices, show generic labels based on choice behavior
                if (choice.behavior === 2) { // ChoiceBehavior.Allocation
                    return 'Allocate Bonus';
                } else {
                    return 'Choose Creature Type';
                }
            })
            .filter(Boolean);

        if (featNames.length > 0) {
            // Specific feat choices - show pipe-delimited list of feat names
            return featNames.join('|');
        } else if (featureNames.length > 0) {
            // Specific feature choices - show pipe-delimited list of feature names
            return featureNames.join('|');
        } else if (creatureTypeChoices.length > 0) {
            // Creature type choices - show pipe-delimited list of creature type choices
            return creatureTypeChoices.join('|');
        }

        // If no specific choices found, check for filtered choices with labels
        const choiceLabels = progression.choices
            .filter(choice => choice.label)
            .map(choice => choice.label)
            .filter(Boolean);

        if (choiceLabels.length > 0) {
            return choiceLabels.join('|');
        }

        return progression?.feature?.name || 'choice';
    });
}



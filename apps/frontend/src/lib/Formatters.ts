import { FeatureProgressionWithRelations, CharacterContext } from "@shared/schema";
import {
    ModifierAppliesToType,
    ModifierType,
    ABILITY_MAP,
    FULL_SKILL_SELECT_LIST,
    SKILL_MAP,
    RPG_DICE,
    DAMAGE_TYPES,
    SAVING_THROW_MAP,
    USES_FREQUENCIES,
    FORMULA_MAP,
    FeaturePrerequisiteType,
    ABILITY_SELECT_LIST,
    FormulaId,
    LANGUAGE_SELECT_LIST,
    FeatureSpecialEffectType,
    FEATURE_FEAT_CHOICE_FILTER_SELECT_LIST
} from "@shared/static-data";

import { FormulaCalculator } from "./formulaCalculator";
import { formatSignedValue, formatWithBonusType, joinWithCommas, formatLanguageName, formatDiceDisplay } from "./formatterUtils";
import {
    createFormulaContext,
    getFormulaDisplayString,
    processAttributeFormula,
    generateProgressionValues,
    findTransitionPoints,
    getDisplayValue,
    getDisplayAndPluralizeValue,
    formatDamageDice
} from "./formulaUtils";
import {
    isWildShapeEffect,
    shouldSkipWildShapeEffect,
    processWildShapeEffects,
    processWildShapeModifiers
} from "./wildShapeUtils";
import {
    createAttributeFormatter,
    createDamageFormatter,
    createUsesFormatter,
    createHealingFormatter,
    createSimpleFormatter,
    createPluralizedFormatter,
    createAttributeWithAbbrFormatter,
    createSavingThrowFormatter,
    createLanguageFormatter,
    createFeatFormatter,
    createUnifiedChoiceFormatter
} from "./formatterFactories";

// ============================================================================
// ORIGINAL FUNCTIONS (REFACTORED)
// ============================================================================

/**
 * Check if modifier is a damage dice replacement modifier
 */
function isDamageDiceReplacementModifier(modifier: any): boolean {
    return (modifier.appliesTo === (ModifierAppliesToType as any).UnarmedDamage || modifier.appliesTo === ModifierAppliesToType.Damage) &&
        modifier.type === ModifierType.Replacement;
}

/**
 * Get formatted value for a non-formula modifier
 */
function getNonFormulaModifierValue(modifier: any, formatter: any, character?: CharacterContext, featureName?: string): string {
    return formatter.value(modifier.value, modifier.appliesToId, modifier.bonusType, character, modifier, {});
}

/**
 * Process a single modifier and return its formatted value
 */
export function processModifier(modifier: any, progression: any, character?: CharacterContext, featureName?: string): string {
    const formatter = PROGRESSION_FORMATTERS[modifier.appliesTo];

    // Safety check: if formatter doesn't exist, skip this modifier
    if (!formatter) {
        console.warn(`No formatter found for modifier appliesTo: ${modifier.appliesTo}`);
        return '';
    }

    if (modifier.formulaParamsId) {
        // Special handling for damage dice replacement modifiers
        if (isDamageDiceReplacementModifier(modifier)) {
            // For damage dice, show the calculated value for the current level
            const context = createFormulaContext(progression.level, progression.level, character);
            const calculatedValue = FormulaCalculator.calculateModifierValue(modifier, context);
            return formatter.value(calculatedValue, modifier.appliesToId, modifier.bonusType, character, modifier, {});
        } else {
            // For other formula-based features, return empty to let caller handle progression patterns
            return '';
        }
    } else {
        // For non-formula features, use the static value
        return getNonFormulaModifierValue(modifier, formatter, character, featureName);
    }
}

/**
 * Process formula modifiers and return progression patterns
 */
function processFormulaModifiers(modifiers: any[], progression: any, character?: CharacterContext): { hasFormulaModifiers: boolean; formulaPatterns: string[] } {
    const formulaPatterns: string[] = [];
    let hasFormulaModifiers = false;

    for (const modifier of modifiers) {
        if (modifier.formulaParamsId) {
            hasFormulaModifiers = true;

            // For contexts without character context (ClassDetail.tsx, ClassEdit.tsx), show just the calculated value for the current level
            // For contexts with character context (character sheets), show the full progression pattern
            if (!character) {
                // Skip conditional modifiers when there's no character context (can't determine which one applies)
                if (modifier.appliesIfChoiceKey || modifier.appliesIfChoiceValue) {
                    continue;
                }

                // For unarmed strike with multiple conditional modifiers, only process the base modifier (not conditional ones)
                if (modifier.appliesTo === ModifierAppliesToType.Damage && modifier.type === ModifierType.Replacement) {
                    // Check if we've already processed a damage replacement modifier for this progression
                    const hasProcessedDamage = formulaPatterns.some(pattern =>
                        pattern.includes('Unarmed Damage:') || pattern.includes('Damage:')
                    );
                    if (hasProcessedDamage) {
                        continue;
                    }

                    // For unarmed strike, only process the base modifier (the one without conditional logic)
                    // Skip any modifier that has conditional logic or is part of a conditional set
                    const allDamageModifiers = modifiers.filter(m =>
                        m.appliesTo === ModifierAppliesToType.Damage &&
                        m.type === ModifierType.Replacement
                    );

                    // If this is not the first damage modifier, skip it
                    if (allDamageModifiers.indexOf(modifier) !== 0) {
                        continue;
                    }
                }

                // Show just the calculated value for the current level
                const context = createFormulaContext(progression.level, progression.level, character);
                const calculatedValue = FormulaCalculator.calculateModifierValue(modifier, context);

                if (modifier.appliesTo === ModifierAppliesToType.Choice) {
                    // For Choice modifiers, use the feature name instead of the formatter
                    formulaPatterns.push(progression.feature?.name || `Feature ${progression.featureId}`);
                } else {
                    const formatter = PROGRESSION_FORMATTERS[modifier.appliesTo];
                    if (formatter) {
                        const formattedValue = formatter.value(calculatedValue, modifier.appliesToId, modifier.bonusType, character, modifier, progression);
                        formulaPatterns.push(formattedValue);
                    }
                }
            } else {
                // Show the full progression pattern (for ClassEdit.tsx and other contexts with character)
                const progressionPattern = getFormulaProgressionPattern(modifier, progression.level, character, progression);
                if (progressionPattern) {
                    formulaPatterns.push(progressionPattern);
                } else {
                    // Fallback to single calculated value
                    const context = createFormulaContext(progression.level, progression.level, character);
                    const calculatedValue = FormulaCalculator.calculateModifierValue(modifier, context);

                    if (modifier.appliesTo === ModifierAppliesToType.Choice) {
                        // For Choice modifiers, use the feature name instead of the formatter
                        formulaPatterns.push(progression.feature?.name || `Feature ${progression.featureId}`);
                    } else {
                        // For attribute-dependent formulas without character context, show formula structure
                        if (modifier?.formulaParams?.formulaId && FormulaCalculator.isAttributeDependentFormula(modifier.formulaParams.formulaId) && !character) {
                            const formatter = PROGRESSION_FORMATTERS[modifier.appliesTo];
                            if (formatter) {
                                const formattedValue = formatter.value(calculatedValue, modifier.appliesToId, modifier.bonusType, undefined, modifier, progression);
                                formulaPatterns.push(formattedValue);
                            }
                        } else {
                            const formatter = PROGRESSION_FORMATTERS[modifier.appliesTo];
                            if (formatter) {
                                const formattedValue = formatter.value(calculatedValue, modifier.appliesToId, modifier.bonusType, character, modifier, progression);
                                formulaPatterns.push(formattedValue);
                            }
                        }
                    }
                }
            }
        }
    }

    return { hasFormulaModifiers, formulaPatterns };
}



// ============================================================================
// ORIGINAL FUNCTIONS (REFACTORED)
// ============================================================================



/**
 * Generate a tooltip for attribute-dependent formulas showing the calculation work
 */
export function generateAttributeFormulaTooltip(modifier: any, character: CharacterContext): string | null {
    const formulaId = modifier?.formulaParams?.formulaId;
    const attributeId = modifier?.formulaParams?.attributeId;

    // Early returns for invalid inputs
    if (!formulaId || !FormulaCalculator.isAttributeDependentFormula(formulaId) ||
        !attributeId || !character) {
        return null;
    }

    const abilityScore = character.abilityScores[attributeId];
    if (abilityScore === undefined) {
        return null;
    }

    const abilityModifier = Math.floor((abilityScore - 10) / 2);

    return getFormulaDisplayString(formulaId, modifier.value, attributeId, abilityModifier);
}

// Centralized proficiency formatting logic
function formatProficiencyEffect(featName: string, itemId: number, itemName?: string): { display: string; sort: number } {
    const proficiencyNameMap = {
        "Armor Proficiency (Light)": { display: "light armor", sort: 4 },
        "Armor Proficiency (Medium)": { display: "medium armor", sort: 5 },
        "Armor Proficiency (Heavy)": { display: "heavy armor", sort: 6 },
        "Shield Proficiency": { display: "shields", sort: 7 },
        "Tower Shield Proficiency": { display: "tower shields", sort: 8 },
        "Simple Weapon Proficiency": { display: "simple weapons", sort: 1 },
        "Martial Weapon Proficiency": { display: "martial weapons", sort: 2 },
        "Exotic Weapon Proficiency": { display: "exotic weapons", sort: 3 },
    };

    if (itemId === -1) {
        const mapping = proficiencyNameMap[featName];
        if (!mapping) return { display: featName, sort: 999 }; // fallback

        if (
            featName.startsWith("Armor Proficiency") ||
            featName.startsWith("Shield Proficiency")
        ) {
            return { display: mapping.display, sort: mapping.sort };
        } else {
            return { display: `all ${mapping.display}`, sort: mapping.sort };
        }
    } else {
        return {
            display: itemName?.toLowerCase() || `item ${itemId}`,
            sort: 999 // default sort order for item-based proficiencies
        };
    }
}

export function formatClassProficiencies(proficiencies: Array<{ featId: number; itemId: number; featName: string; itemName?: string }>): string {
    return proficiencies
        .map((proficiency) => formatProficiencyEffect(proficiency.featName, proficiency.itemId, proficiency.itemName))
        .sort((a, b) => a.sort - b.sort)
        .map(({ display }) => display)
        .join(', ');
}

// Helper function to create formatters (imported from formatterFactories)
const fmt = (fn: (valueInt: number, appliesToId: number, bonusType?: number | null, character?: CharacterContext, modifier?: any, progression?: any) => string) => ({
    value: (valueInt: number | null, appliesToId?: number | null, bonusType?: number | null, character?: CharacterContext, modifier?: any, progression?: any) =>
        fn(valueInt ?? 0, appliesToId ?? 0, bonusType, character, modifier, progression)
});

// Default progression formatters
export const PROGRESSION_FORMATTERS = {
    [ModifierAppliesToType.Attribute]: createAttributeWithAbbrFormatter(),
    [ModifierAppliesToType.SavingThrow]: createSavingThrowFormatter(),
    [ModifierAppliesToType.Skill]: fmt((valueInt, appliesToId, bonusType) => {
        const skillName = appliesToId === -1 ? 'Any Skill' : (SKILL_MAP[appliesToId]?.name || 'Unknown Skill');
        const formattedValue = formatSignedValue(valueInt);
        const base = `${skillName} ${formattedValue}`;
        return formatWithBonusType(base, bonusType);
    }),
    [ModifierAppliesToType.AC]: createAttributeFormatter('AC'),
    [ModifierAppliesToType.HitDice]: createSimpleFormatter('Hit Dice', (valueInt, appliesToId) =>
        `${valueInt}${RPG_DICE[appliesToId]?.name || `${valueInt} Unknown Die`}`),
    [ModifierAppliesToType.Damage]: createDamageFormatter('Damage'),
    [ModifierAppliesToType.DamageReduction]: createSimpleFormatter('', (valueInt, appliesToId) =>
        `${valueInt}/${DAMAGE_TYPES[appliesToId]?.name || `${valueInt} Unknown Damage Type`}`),
    [ModifierAppliesToType.MovementSpeed]: createSimpleFormatter('', (valueInt, appliesToId) => `+${valueInt} ft.`),
    [ModifierAppliesToType.Attack]: createAttributeFormatter('Attack'),
    [ModifierAppliesToType.Initiative]: createSimpleFormatter('Initiative', (valueInt, appliesToId) => formatSignedValue(valueInt)),
    [ModifierAppliesToType.Uses]: createUsesFormatter(),
    [ModifierAppliesToType.Targets]: createPluralizedFormatter('target', 'targets'),
    [ModifierAppliesToType.ExtraAttacks]: createPluralizedFormatter('extra attack', 'extra attacks'),
    [ModifierAppliesToType.Healing]: createHealingFormatter(),
    [ModifierAppliesToType.SpellResistance]: createSimpleFormatter('SR', (valueInt, appliesToId) => `${valueInt}`),
    [ModifierAppliesToType.UnarmedDamage]: createDamageFormatter('Unarmed Damage'),
    [ModifierAppliesToType.Distance]: createSimpleFormatter('', (valueInt, appliesToId) => `${valueInt} ft.`),
    [ModifierAppliesToType.Other]: createSimpleFormatter('', (valueInt, appliesToId) => `${valueInt}`),
    [ModifierAppliesToType.BonusLanguage]: createLanguageFormatter(),
    [ModifierAppliesToType.AutomaticLanguage]: createLanguageFormatter(),
    [ModifierAppliesToType.Choice]: createUnifiedChoiceFormatter(),
    [ModifierAppliesToType.Feat]: createFeatFormatter()
};

export function formatProgression(progression: FeatureProgressionWithRelations, character?: CharacterContext): { label: string; value: string; note?: string } {
    const featureName = progression.feature?.name || `Feature ${progression.featureId}`;

    // Special handling for Wild Shape feature
    if (featureName.toLowerCase().includes('wild shape')) {
        return formatWildShapeProgression(progression, character);
    }



    // Check if this progression has FeatureChoice objects with formulas
    const hasFormulaChoices = progression.choices?.some(choice => choice.formulaParamsId || (choice.formulaParams && choice.formulaParams.formulaId)) || false;





    // Set label based on whether we have formula-based choices
    let label = hasFormulaChoices ? '' : `${featureName}:`;

    // Special handling for skill analogues - show "Grants Skill: [Skill Name]"
    const skillModifiers = progression.modifiers?.filter(mod => mod.appliesTo === ModifierAppliesToType.Skill) || [];
    if (skillModifiers.length > 0) {
        const skillModifier = skillModifiers[0];
        const skillName = skillModifier.appliesToId === -1 ? 'Any Skill' : (SKILL_MAP[skillModifier.appliesToId]?.name || 'Unknown Skill');
        label = `Grants Skill: ${skillName}`;

        // For skill analogues, if no character context (detail page), show static formula description
        if (!character && skillModifier.formulaParams?.formulaId === 11) { // LEVEL_PLUS_ATTRIBUTE
            const attributeId = skillModifier.formulaParams?.attributeId;
            const attributeAbbr = attributeId ? ABILITY_MAP[attributeId]?.abbreviation || 'UNK' : 'UNK';
            return {
                label: '', // Empty label since the full description is in value
                value: `Grants Skill: ${skillName} (level + ${attributeAbbr})`,
                note: undefined
            };
        }
    }

    // Check if we have multiple formula modifiers
    const formulaModifiers = progression.modifiers?.filter(mod => mod.formulaParamsId) || [];

    if (formulaModifiers.length > 1) {
        // Multiple formula modifiers - use combined pattern
        const combinedPattern = getCombinedFormulaProgressionPattern(progression.modifiers || [], progression.level, character);
        if (combinedPattern) {
            return {
                label: '', // Empty label to prevent double wrapping
                value: combinedPattern,
                note: undefined
            };
        }
    }

    // Extract value from modifiers if available
    let value = '';

    // Process formula modifiers first
    const { hasFormulaModifiers, formulaPatterns } = processFormulaModifiers(progression.modifiers || [], progression, character);

    // Process formula-based choices
    let choiceFormulaPatterns: string[] = [];
    // Only process formula patterns for synthetic entries (original entries should show simple choice labels)
    const isSyntheticEntryEarly = progression.id > 10000; // Synthetic entries have very large IDs

    if (hasFormulaChoices && progression.choices && isSyntheticEntryEarly) {
        for (const choice of progression.choices) {
            if (choice.formulaParamsId || (choice.formulaParams && choice.formulaParams.formulaId)) {
                const pattern = getFormulaProgressionPattern(choice, progression.level, character, progression);
                if (pattern) {
                    choiceFormulaPatterns.push(pattern);
                }
            }
        }
    }



    // If we have formula patterns from modifiers, use them
    if (hasFormulaModifiers && formulaPatterns.length > 0) {
        let combinedPattern = formulaPatterns.join(', ');



        return {
            label: '', // Empty label to prevent double wrapping
            value: combinedPattern,
            note: undefined
        };
    }



    // Process non-formula modifiers
    for (const modifier of progression.modifiers || []) {
        const modifierValue = processModifier(modifier, progression, character, featureName);
        if (modifierValue) {
            if (value) {
                value += ', ';
            }
            value += modifierValue;
        }
    }





    // For progressions with both formula and non-formula choices, combine them
    // Handle formula-based choices for both synthetic entries and original progressions
    const isSyntheticEntry = progression.id > 10000; // Synthetic entries have very large IDs

    if (hasFormulaChoices && progression.choices && progression.choices.length > 0) {
        // Get non-formula choices
        const nonFormulaChoices = progression.choices.filter(choice =>
            !choice.formulaParamsId && !(choice.formulaParams && choice.formulaParams.formulaId)
        );

        // Get formula-based choices
        const formulaChoices = progression.choices.filter(choice =>
            choice.formulaParamsId || (choice.formulaParams && choice.formulaParams.formulaId)
        );

        const parts: string[] = [];

        // Add non-formula choices
        if (nonFormulaChoices.length > 0) {
            const nonFormulaLabels = nonFormulaChoices
                .map(choice => {
                    if (choice.filterType !== null && choice.filterType !== undefined) {
                        const filterOption = FEATURE_FEAT_CHOICE_FILTER_SELECT_LIST.find(opt => opt.value === choice.filterType);
                        return filterOption?.label || choice.label;
                    }
                    return choice.label;
                })
                .filter(Boolean);

            if (nonFormulaLabels.length > 0) {
                // Format non-formula choices as "Level X (Choice)"
                parts.push(`Level ${progression.level} (${nonFormulaLabels.join('|')})`);
            }
        }

        // Add formula pattern
        if (formulaChoices.length > 0) {
            // Collect all choice labels for the formula pattern
            const choiceLabels = formulaChoices.map(choice => {
                if (choice.filterType !== null && choice.filterType !== undefined) {
                    const filterOption = FEATURE_FEAT_CHOICE_FILTER_SELECT_LIST.find(opt => opt.value === choice.filterType);
                    return filterOption?.label || choice.label;
                } else if (choice.feature?.name) {
                    return choice.feature.name;
                } else if (choice.label) {
                    return choice.label;
                } else if (choice.featId) {
                    return `Specific Feat: ${choice.featId}`;
                } else if (choice.featureId) {
                    return `Specific Feature: ${choice.featureId}`;
                }
                return 'Choice';
            }).filter(Boolean);

            if (choiceLabels.length > 0) {
                if (isSyntheticEntry) {
                    // For synthetic entries, generate the full formula pattern
                    const firstChoice = formulaChoices[0];
                    const pattern = getFormulaProgressionPattern(firstChoice, progression.level, character, progression);
                    if (pattern) {
                        // Replace the choice text with all choice labels combined
                        const combinedChoiceText = choiceLabels.join('|');
                        const combinedPattern = pattern.replace(/\([^)]+\)/g, `(${combinedChoiceText})`);
                        parts.push(combinedPattern);
                    }
                } else {
                    // For original entries, generate the full formula pattern (for ClassEdit.tsx)
                    const firstChoice = formulaChoices[0];
                    const pattern = getFormulaProgressionPattern(firstChoice, progression.level, character, progression);
                    if (pattern) {
                        // Replace the choice text with all choice labels combined
                        const combinedChoiceText = choiceLabels.join('|');
                        const combinedPattern = pattern.replace(/\([^)]+\)/g, `(${combinedChoiceText})`);
                        parts.push(combinedPattern);
                    }
                }
            }
        }

        if (parts.length > 0) {
            if (value) {
                value += ` (${parts.join(', ')})`;
            } else {
                value = parts.join(', ');
            }
        }
    } else {
        // Use the existing unified formatter for other cases
        const unifiedFormatter = createUnifiedChoiceFormatter();
        const choiceOptions = unifiedFormatter.value(0, 0, null, undefined, {}, progression);
        if (choiceOptions && choiceOptions !== 'choice' && choiceOptions !== progression?.feature?.name) {
            if (value) {
                value += ` (${choiceOptions})`;
            } else {
                value = choiceOptions;
            }
        } else if (progression.choices && progression.choices.length > 0) {
            // If no choice options were formatted but we have choices, try to format them directly
            // First check for specific feat or feature choices
            const featNames = progression.choices
                .filter(choice => choice.feat?.name)
                .map(choice => choice.feat.name)
                .filter(Boolean);

            const featureNames = progression.choices
                .filter(choice => choice.feature?.name)
                .map(choice => choice.feature.name)
                .filter(Boolean);

            if (featNames.length > 0) {
                if (value) {
                    value += ` (${featNames.join('|')})`;
                } else {
                    value = featNames.join('|');
                }
            } else if (featureNames.length > 0) {
                if (value) {
                    value += ` (${featureNames.join('|')})`;
                } else {
                    value = featureNames.join('|');
                }
            } else {
                // Fallback to filter type labels or choice labels
                const choiceLabels = progression.choices
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
                    if (value) {
                        value += ` (${choiceLabels.join('|')})`;
                    } else {
                        value = choiceLabels.join('|');
                    }
                }
            }
        }
    }

    // Extract note from effects if available
    let note: string | undefined;
    const proficiencyEffects = progression.effects?.filter(effect =>
        effect.effectType === FeatureSpecialEffectType.Proficiency
    ) || [];

    // Handle weapon familiarity effects
    const weaponFamiliarityEffects = progression.effects.filter(
        effect => effect.effectType === FeatureSpecialEffectType.WeaponFamiliarity
    );

    if (weaponFamiliarityEffects.length > 0) {
        const familiarityDetails = weaponFamiliarityEffects
            .map((effect) => {
                const weaponName = effect.item?.name || `weapon ${effect.numericValue}`;
                return `treat ${weaponName} as martial weapon`;
            })
            .join(', ');

        note = familiarityDetails;
    } else if (proficiencyEffects.length > 0) {
        // Format proficiency effects using the centralized formatter
        const proficiencyDetails = proficiencyEffects
            .map((effect) => {
                const featName = effect.feat?.name || `Feat ${effect.featId}`;
                const itemName = effect.item?.name;
                return formatProficiencyEffect(featName, effect.itemId || -1, itemName);
            })
            .sort((a, b) => a.sort - b.sort)
            .map(({ display }) => display);

        note = proficiencyDetails.join(', ');
    } else {
        // Fallback to original behavior for other effects
        for (const effect of progression.effects) {
            if (effect.value) {
                note = effect.value;
                break;
            }
        }
    }

    // Note: Prerequisites are now handled at the feature level, not progression level
    // This would need to be updated when feature prerequisites are fully integrated
    return {
        label,
        value,
        note
    };
}

/**
 * Special formatter for Wild Shape progressions that separates regular and elemental uses
 */
function formatWildShapeProgression(progression: FeatureProgressionWithRelations, character?: CharacterContext): { label: string; value: string; note?: string } {
    const featureName = progression.feature?.name || `Feature ${progression.featureId}`;
    const label = `${featureName}:`;

    // Check if this is an elemental wild shape progression by looking at the effects
    const hasElementalEffects = progression.effects?.some(effect =>
        effect.key === 'elementalwildshape'
    );

    // Process modifiers (uses per day)
    const uses = processWildShapeModifiers(progression.modifiers || [], progression, character);

    // Process effects (forms and sizes)
    const effects = processWildShapeEffects(progression.effects || [], hasElementalEffects);

    // Combine uses and effects
    const parts: string[] = [];
    if (uses) {
        parts.push(uses);
    }
    if (effects.length > 0) {
        parts.push(...effects);
    }

    return {
        label,
        value: parts.join(', '),
        note: undefined
    };
}

/**
 * Format multiple wild shape progressions together for display
 * This is used when multiple progressions exist for the same feature at the same level
 */
export function formatWildShapeProgressions(progressions: FeatureProgressionWithRelations[], character?: CharacterContext): string {
    let regularUses = '';
    let elementalUses = '';
    let regularEffects: string[] = [];
    let elementalEffects: string[] = [];

    // Process each progression
    for (const progression of progressions) {
        // Check if this is an elemental progression
        const hasElementalEffects = progression.effects?.some(effect =>
            effect.key === 'elementalwildshape'
        );

        // Process modifiers (uses per day)
        const uses = processWildShapeModifiers(progression.modifiers || [], progression, character);
        if (uses) {
            if (hasElementalEffects) {
                // Elemental uses
                if (elementalUses) {
                    elementalUses += ', ';
                }
                elementalUses += uses;
            } else {
                // Regular uses
                if (regularUses) {
                    regularUses += ', ';
                }
                regularUses += uses;
            }
        }

        // Process effects (forms and sizes)
        const effects = processWildShapeEffects(progression.effects || [], hasElementalEffects);
        if (hasElementalEffects) {
            elementalEffects.push(...effects);
        } else {
            regularEffects.push(...effects);
        }
    }

    // Combine all parts
    const parts: string[] = [];

    // Add regular uses first
    if (regularUses) {
        parts.push(regularUses);
    }

    // Add elemental uses
    if (elementalUses) {
        parts.push(`elemental: ${elementalUses}`);
    }

    // Add regular effects
    if (regularEffects.length > 0) {
        parts.push(...regularEffects);
    }

    // Add elemental effects
    if (elementalEffects.length > 0) {
        parts.push(...elementalEffects);
    }

    return parts.join(', ');
}

/**
 * Expand formula-based progressions into multiple entries for display
 * This creates separate progression entries for each transition level
 */
export function expandFormulaProgressions(progressions: FeatureProgressionWithRelations[]): FeatureProgressionWithRelations[] {
    const expanded: FeatureProgressionWithRelations[] = [];

    for (const progression of progressions) {
        const hasFormulaModifiers = progression.modifiers?.some(mod => mod.formulaParamsId);
        const hasFormulaChoices = progression.choices?.some(choice => choice.formulaParamsId || (choice.formulaParams && choice.formulaParams.formulaId));

        if (!hasFormulaModifiers && !hasFormulaChoices) {
            // Non-formula progression, add as-is
            expanded.push(progression);
            continue;
        }

        // Check if this is a skill analogue (skill modifier with LEVEL_PLUS_ATTRIBUTE formula)
        const isSkillAnalogue = progression.modifiers?.some(mod =>
            mod.appliesTo === ModifierAppliesToType.Skill &&
            mod.formulaParams?.formulaId === 11 // LEVEL_PLUS_ATTRIBUTE
        );

        if (isSkillAnalogue) {
            // For skill analogues, don't expand - just add the original progression
            expanded.push(progression);
            continue;
        }

        // For formula-based progressions, add the original progression first
        // Check if this is a formula-only progression (no non-formula choices)
        const hasNonFormulaChoices = progression.choices?.some(choice =>
            !choice.formulaParamsId && !(choice.formulaParams && choice.formulaParams.formulaId)
        ) || false;

        if (hasNonFormulaChoices) {
            // For progressions with both formula and non-formula choices (like Fighter)
            // Only include NON-FORMULA choices in the original progression
            const nonFormulaChoices = progression.choices?.filter(choice =>
                !choice.formulaParamsId && !(choice.formulaParams && choice.formulaParams.formulaId)
            ).map(choice => {
                // Remove formula context for original progression to show simple choice labels
                return {
                    ...choice,
                    // Remove formula context
                    formulaParamsId: null,
                    formulaParams: null,
                    // Keep the filterType and other choice data
                    filterType: choice.filterType,
                    // Use the filter type label instead of the generic label
                    label: choice.filterType !== null && choice.filterType !== undefined ?
                        FEATURE_FEAT_CHOICE_FILTER_SELECT_LIST.find(opt => opt.value === choice.filterType)?.label || choice.label :
                        choice.label,
                    type: choice.type,
                    behavior: choice.behavior
                };
            }) || [];

            const originalProgression = {
                ...progression,
                choices: nonFormulaChoices
            };

            // Add the original progression with non-formula choices
            expanded.push(originalProgression);
        } else {
            // For formula-only progressions (like Wizard), create a modified original progression
            // that removes formula context to show simple choice labels
            const originalProgression = {
                ...progression,
                choices: progression.choices?.map(choice => {
                    return {
                        ...choice,
                        // Remove formula context for original progression to show simple choice labels
                        formulaParamsId: null,
                        formulaParams: null,
                        // Keep the filterType and other choice data
                        filterType: choice.filterType,
                        // Use the filter type label instead of the generic label
                        label: choice.filterType !== null && choice.filterType !== undefined ?
                            FEATURE_FEAT_CHOICE_FILTER_SELECT_LIST.find(opt => opt.value === choice.filterType)?.label || choice.label :
                            choice.label,
                        type: choice.type,
                        behavior: choice.behavior
                    };
                }) || []
            };
            expanded.push(originalProgression);
        }

        // For formula-based progressions, create separate entries for each transition level
        const transitionLevels = getFormulaTransitionLevels(progression);

        // Create synthetic entries for formula-based levels only (excluding the original level)
        for (const level of transitionLevels) {
            // Skip the original progression level - it will be handled separately
            if (level === progression.level) continue;

            const expandedProgression: FeatureProgressionWithRelations = {
                ...progression,
                id: progression.id + level * 1000, // Create unique ID for each level
                level: level,
                modifiers: progression.modifiers?.map(mod => {
                    const context = createFormulaContext(level, progression.level);
                    const calculatedValue = FormulaCalculator.calculateModifierValue(mod, context);

                    // For damage dice replacement modifiers, preserve the formula context
                    const isDamageDiceReplacement = isDamageDiceReplacementModifier(mod);

                    return {
                        ...mod,
                        id: mod.id + level * 1000, // Create unique ID for each modifier
                        formulaParamsId: isDamageDiceReplacement ? mod.formulaParamsId : null, // Preserve formula context for damage dice
                        value: calculatedValue,
                        // Preserve the original appliesTo for Choice modifiers
                        appliesTo: mod.appliesTo
                    };
                }) || [],
                choices: progression.choices?.filter(choice => {
                    // For synthetic entries, only include formula-based choices
                    const hasFormula = choice.formulaParamsId || (choice.formulaParams && choice.formulaParams.formulaId);
                    return hasFormula;
                }).map(choice => {
                    // For choices with formulas, remove the formula context to create synthetic entries
                    const hasFormula = choice.formulaParamsId || (choice.formulaParams && choice.formulaParams.formulaId);

                    return {
                        ...choice,
                        id: choice.id + level * 1000, // Create unique ID for each choice
                        // Remove formula context for synthetic entries
                        formulaParamsId: null,
                        formulaParams: null,
                        // Keep the filterType and other choice data
                        filterType: choice.filterType,
                        // Use the filter type label instead of the generic label
                        label: choice.filterType !== null && choice.filterType !== undefined ?
                            FEATURE_FEAT_CHOICE_FILTER_SELECT_LIST.find(opt => opt.value === choice.filterType)?.label || choice.label :
                            choice.label,
                        type: choice.type,
                        behavior: choice.behavior
                    };
                }) || []
            };
            expanded.push(expandedProgression);
        }
    }

    return expanded;
}

/**
 * Get the transition levels for a formula-based progression
 */
function getFormulaTransitionLevels(progression: FeatureProgressionWithRelations): number[] {
    const levels: number[] = [];

    // Process formula-based modifiers
    for (const modifier of progression.modifiers || []) {
        if (!modifier.formulaParamsId) continue;

        try {
            const formula = FORMULA_MAP[modifier.formulaParams?.formulaId];
            if (!formula) continue;

            // Special handling for choice modifiers with EVERY_N_LEVELS formula
            if (modifier.appliesTo === ModifierAppliesToType.Choice && modifier.formulaParams?.formulaId === 2) { // EVERY_N_LEVELS
                // For choice modifiers, show all levels where the choice is available
                const interval = modifier.formulaParams?.interval || 1;
                const formulaStartLevel = modifier.formulaParams?.formulaStartLevel || progression.level;

                // Generate all levels where choices are available
                for (let level = formulaStartLevel; level <= 20; level += interval) {
                    levels.push(level);
                }
            } else {
                // For other modifiers, use the standard transition point approach
                const progressionValues = generateProgressionValues(modifier, progression.level);
                const transitionPoints = findTransitionPoints(progressionValues);

                // Add all transition levels to the result
                levels.push(...transitionPoints.map(tp => tp.level));
            }
        } catch (error) {
            console.warn('Error getting transition levels:', error);
        }
    }

    // Process formula-based choices
    for (const choice of progression.choices || []) {
        if (!choice.formulaParamsId && !(choice.formulaParams && choice.formulaParams.formulaId)) continue;

        try {
            const formula = FORMULA_MAP[choice.formulaParams?.formulaId];
            if (!formula) continue;

            // Special handling for choices with EVERY_N_LEVELS formula
            if (choice.formulaParams?.formulaId === 2) { // EVERY_N_LEVELS
                // For choices, show all levels where the choice is available
                const interval = choice.formulaParams?.interval || 1;
                const formulaStartLevel = choice.formulaParams?.formulaStartLevel || progression.level;

                // Generate all levels where choices are available
                for (let level = formulaStartLevel; level <= 20; level += interval) {
                    levels.push(level);
                }
            } else {
                // For other choice formulas, use the standard transition point approach
                const progressionValues = generateProgressionValues(choice, progression.level);
                const transitionPoints = findTransitionPoints(progressionValues);

                // Add all transition levels to the result
                levels.push(...transitionPoints.map(tp => tp.level));
            }
        } catch (error) {
            console.warn('Error getting transition levels for choice:', error);
        }
    }

    // Remove duplicates and sort
    return [...new Set(levels)].sort((a, b) => a - b);
}

/**
 * Get a progression pattern string for formula-based features
 */
export function getFormulaProgressionPattern(modifier: any, startLevel: number, character?: CharacterContext, progression?: any): string | null {
    // Handle both modifier and choice structures
    const hasFormulaParams = modifier.formulaParamsId || (modifier.formulaParams && modifier.formulaParams.formulaId);
    if (!hasFormulaParams) {
        return null;
    }

    try {
        const formula = FORMULA_MAP[modifier.formulaParams?.formulaId];
        if (!formula) return null;

        // Determine the appliesTo type for both modifiers and choices
        const isChoice = modifier.type !== undefined && modifier.behavior !== undefined &&
            typeof modifier.type === 'number' && typeof modifier.behavior === 'number';
        const appliesTo = modifier.appliesTo || (isChoice ? ModifierAppliesToType.Choice : null);
        if (!appliesTo) return null;

        const formatter = PROGRESSION_FORMATTERS[appliesTo];
        if (!formatter) return null;

        // For choice modifiers with EVERY_N_LEVELS formula, we need to show all levels where choices are available
        let patternParts: string[] = [];

        if (appliesTo === ModifierAppliesToType.Choice && modifier.formulaParams?.formulaId === 2) { // EVERY_N_LEVELS
            // For choice modifiers, show all levels where the choice is available
            const interval = modifier.formulaParams?.interval || 1;
            const formulaStartLevel = modifier.formulaParams?.formulaStartLevel || startLevel;

            // Generate all levels where choices are available
            for (let level = formulaStartLevel; level <= 20; level += interval) {
                // For choices, use the filter type or specific choices for formatting
                let choiceText = 'Choice';

                if (modifier.filterType !== null && modifier.filterType !== undefined) {
                    // Use the filter type from the imported list
                    const filterOption = FEATURE_FEAT_CHOICE_FILTER_SELECT_LIST.find(opt => opt.value === modifier.filterType);
                    choiceText = filterOption?.label || 'Any';
                } else if (modifier.featId) {
                    // For specific feat selection, use the feat name
                    choiceText = `Specific Feat: ${modifier.featId}`;
                } else if (modifier.featureId) {
                    // For specific feature selection, use the feature name or label
                    if (modifier.feature?.name) {
                        choiceText = modifier.feature.name;
                    } else if (modifier.label) {
                        choiceText = modifier.label;
                    } else {
                        choiceText = `Specific Feature: ${modifier.featureId}`;
                    }
                } else if (modifier.label) {
                    // For choices with labels (like "Bonus Feat"), use the label
                    choiceText = modifier.label;
                }

                patternParts.push(`Level ${level} (${choiceText})`);
            }
        } else {
            // For other modifiers, use the standard transition point approach
            const progressionValues = generateProgressionValues(modifier, startLevel, character);
            const transitionPoints = findTransitionPoints(progressionValues);

            patternParts = transitionPoints.map(({ level, value }) => {
                let formattedValue;
                if (appliesTo === ModifierAppliesToType.Choice) {
                    // For Choice modifiers, use the filter type or specific choices
                    if (modifier.filterType !== null && modifier.filterType !== undefined) {
                        const filterOption = FEATURE_FEAT_CHOICE_FILTER_SELECT_LIST.find(opt => opt.value === modifier.filterType);
                        formattedValue = filterOption?.label || 'Any';
                    } else if (modifier.featId) {
                        formattedValue = `Specific Feat: ${modifier.featId}`;
                    } else if (modifier.featureId) {
                        // For specific feature selection, use the feature name or label
                        if (modifier.feature?.name) {
                            formattedValue = modifier.feature.name;
                        } else if (modifier.label) {
                            formattedValue = modifier.label;
                        } else {
                            formattedValue = `Specific Feature: ${modifier.featureId}`;
                        }
                    } else if (modifier.label) {
                        // For choices with labels (like "Bonus Feat"), use the label
                        formattedValue = modifier.label;
                    } else {
                        formattedValue = 'Choice';
                    }
                } else if (appliesTo === ModifierAppliesToType.Skill && modifier.formulaParams?.formulaId === 11) {
                    // For LEVEL_PLUS_ATTRIBUTE formula with skills, show the proper formula structure
                    const attributeId = modifier.formulaParams?.attributeId;
                    const attributeAbbr = attributeId ? ABILITY_MAP[attributeId]?.abbreviation || 'UNK' : 'UNK';
                    formattedValue = `${level} + ${attributeAbbr}`;
                } else {
                    formattedValue = formatter.value(value, modifier.appliesToId, modifier.bonusType, character, modifier, {});
                }
                return `Level ${level} (${formattedValue})`;
            });
        }

        return patternParts.join(', ');
    } catch (error) {
        console.warn('Error generating progression pattern:', error);
        return null;
    }
}

/**
 * Get a combined progression pattern string for multiple formula-based modifiers
 */
function getCombinedFormulaProgressionPattern(modifiers: any[], startLevel: number, character?: CharacterContext): string | null {
    if (!modifiers || modifiers.length === 0) return null;

    try {
        // Generate progression values starting from the progression's level for all modifiers
        const progressionValues: Array<{ level: number; values: Array<{ modifier: any; value: number; formatted: string }> }> = [];

        for (let level = startLevel; level <= 20; level++) {
            const context = createFormulaContext(level, startLevel, character);
            const levelValues: Array<{ modifier: any; value: number; formatted: string }> = [];

            for (const modifier of modifiers) {
                if (!modifier.formulaParamsId) continue;

                const formula = FORMULA_MAP[modifier.formulaParams?.formulaId];
                if (!formula) continue;

                const formatter = PROGRESSION_FORMATTERS[modifier.appliesTo];
                if (!formatter) continue;

                const value = FormulaCalculator.calculateModifierValue(modifier, context);
                // Include all levels, including when value is 0 (for transition points)
                const formatted = formatter.value(value, modifier.appliesToId, modifier.bonusType, character, modifier, {});
                levelValues.push({ modifier, value, formatted });
            }

            if (levelValues.length > 0) {
                progressionValues.push({ level, values: levelValues });
            }
        }

        // Find transition points where any modifier's value changes
        const transitionPoints: Array<{ level: number; values: Array<{ modifier: any; value: number; formatted: string }> }> = [];
        const lastValues = new Map<number, number>(); // modifier index -> last value

        for (const { level, values } of progressionValues) {
            let hasChanges = false;

            for (let i = 0; i < values.length; i++) {
                const { modifier, value } = values[i];
                const lastValue = lastValues.get(i) || 0;

                if (value !== lastValue) {
                    hasChanges = true;
                    lastValues.set(i, value);
                }
            }

            if (hasChanges) {
                transitionPoints.push({ level, values });
            }
        }

        // Format the combined progression pattern
        const patternParts = transitionPoints.map(({ level, values }) => {
            const formattedValues = values.map(v => v.formatted);
            return `Level ${level} (${formattedValues.join(', ')})`;
        });

        return patternParts.join(', ');
    } catch (error) {
        console.warn('Error generating combined progression pattern:', error);
        return null;
    }
}

/**
 * Format a single prerequisite
 */
function formatPrerequisite(prereq: any): string {
    switch (prereq.type) {
        case FeaturePrerequisiteType.SkillRanks:
            const skillName = FULL_SKILL_SELECT_LIST.find(s => s.value === prereq.skillId)?.label || 'Unknown Skill';
            return `${skillName} ${prereq.minValue} ranks`;
        case FeaturePrerequisiteType.AbilityScore:
            const abilityName = ABILITY_SELECT_LIST.find(ability => ability.value === prereq.abilityId)?.label || 'Unknown Ability';
            return `${abilityName} ${prereq.minValue}+`;
        case FeaturePrerequisiteType.CharacterLevel:
            return `Character Level ${prereq.minValue}+`;
        case FeaturePrerequisiteType.ClassLevel:
            return `Class Level ${prereq.minValue}+`;
        case FeaturePrerequisiteType.BaseAttackBonus:
            return `BAB ${prereq.minValue}+`;
        case FeaturePrerequisiteType.Other:
            return `Other Requirement: ${prereq.minValue}`;
        default:
            return `Requirement: ${prereq.minValue}`;
    }
}

export function formatPrerequisites(prerequisites: any[]): string | null {
    if (!prerequisites || prerequisites.length === 0) return null;

    return prerequisites.map(prereq => formatPrerequisite(prereq)).join(', ');
}





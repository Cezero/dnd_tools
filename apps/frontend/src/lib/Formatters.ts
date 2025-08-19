import { FeatureProgressionWithRelations, CharacterContext } from "@shared/schema";
import {
    ASPECT_FORMATTERS,
    ModifierAppliesToType,
    FeatureBonusType,
    ABILITY_MAP,
    SKILL_SELECT_LIST,
    SAVING_THROW_SELECT_LIST,
    SKILL_MAP,
    RPG_DICE,
    DAMAGE_TYPES,
    SAVING_THROW_MAP,
    USES_FREQUENCIES,
    FORMULA_MAP,
    FeaturePrerequisiteType,
    ABILITY_SELECT_LIST,
    FormulaId,
    LANGUAGE_SELECT_LIST
} from "@shared/static-data";

import { FormulaCalculator } from "./formulaCalculator";

/**
 * Generate a tooltip for attribute-dependent formulas showing the calculation work
 */
export function generateAttributeFormulaTooltip(modifier: any, character: CharacterContext): string | null {
    if (!modifier?.formulaParams?.formulaId || !FormulaCalculator.isAttributeDependentFormula(modifier.formulaParams.formulaId)) {
        return null;
    }

    const formulaId = modifier.formulaParams.formulaId;
    const attributeId = modifier.formulaParams?.attributeId;

    if (!attributeId || !character) {
        return null;
    }

    const abilityScore = character.abilityScores[attributeId];
    if (abilityScore === undefined) {
        return null;
    }

    const abilityModifier = Math.floor((abilityScore - 10) / 2);
    const attributeAbbr = ABILITY_MAP[attributeId]?.abbreviation || 'UNK';

    let calculation = '';
    let result = 0;

    switch (formulaId) {
        case FormulaId.ATTRIBUTE_BASED:
            result = modifier.value + abilityModifier;
            calculation = `${modifier.value} + ${attributeAbbr} (${abilityModifier}) = ${result}`;
            break;
        case FormulaId.ATTRIBUTE_MODIFIER:
            result = abilityModifier;
            calculation = `${attributeAbbr} (${abilityModifier}) = ${result}`;
            break;
        case FormulaId.LEVEL_TIMES_ATTRIBUTE:
            result = 1 * abilityModifier; // Assuming level 1 for tooltip
            calculation = `level × ${attributeAbbr} (${abilityModifier}) = ${result}`;
            break;
        default:
            return null;
    }

    return calculation;
}

export function formatClassProficiencies(proficiencies: Array<{ featId: number; itemId: number; featName: string; itemName?: string }>): string {
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

    return proficiencies
        .map((proficiency) => {
            let display: string;
            let sort: number;

            if (proficiency.itemId === -1) {
                const mapping = proficiencyNameMap[proficiency.featName];
                if (!mapping) return { display: proficiency.featName, sort: 999 }; // fallback

                if (
                    proficiency.featName.startsWith("Armor Proficiency") ||
                    proficiency.featName.startsWith("Shield Proficiency")
                ) {
                    display = mapping.display;
                } else {
                    display = `all ${mapping.display}`;
                }

                sort = mapping.sort;
            } else {
                display = proficiency.itemName?.toLowerCase() || `item ${proficiency.itemId}`;
                sort = 999; // default sort order for item-based proficiencies
            }

            return { display, sort };
        })
        .sort((a, b) => a.sort - b.sort)
        .map(({ display }) => display)
        .join(', ');
}

// Helper function to create formatters
const fmt = (fn: (valueInt: number, appliesToId: number, bonusType?: number | null, character?: CharacterContext, modifier?: any) => string) => ({
    value: (valueInt: number | null, appliesToId?: number | null, bonusType?: number | null, character?: CharacterContext, modifier?: any) =>
        fn(valueInt ?? 0, appliesToId ?? 0, bonusType, character, modifier)
});

// Default progression formatters
export const PROGRESSION_FORMATTERS = {
    [ModifierAppliesToType.Attribute]: fmt((valueInt, appliesToId, bonusType, character, modifier) => {
        // Check if this is an attribute-dependent formula
        if (modifier?.formulaParams?.formulaId && FormulaCalculator.isAttributeDependentFormula(modifier.formulaParams.formulaId)) {
            const formulaId = modifier.formulaParams.formulaId;
            const attributeId = modifier.formulaParams?.attributeId;

            if (character && attributeId) {
                // With character context - show calculated value
                const context = { level: 1, progressionLevel: 1, character };
                const calculatedValue = FormulaCalculator.calculateModifierValue(modifier, context);
                const base = `${ABILITY_MAP[appliesToId]?.abbreviation || ''}: ${calculatedValue > 0 ? `+${calculatedValue}` : calculatedValue}`;
                return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
            } else if (attributeId) {
                // Without character context - show formula structure
                const attributeAbbr = ABILITY_MAP[attributeId]?.abbreviation || 'UNK';
                let formulaDisplay = '';

                switch (formulaId) {
                    case FormulaId.ATTRIBUTE_BASED:
                        formulaDisplay = `${valueInt} + ${attributeAbbr}`;
                        break;
                    case FormulaId.ATTRIBUTE_MODIFIER:
                        formulaDisplay = `${attributeAbbr}`;
                        break;
                    case FormulaId.LEVEL_TIMES_ATTRIBUTE:
                        formulaDisplay = `level × ${attributeAbbr}`;
                        break;
                    default:
                        formulaDisplay = `${valueInt}`;
                }

                const base = `${ABILITY_MAP[appliesToId]?.abbreviation || ''}: ${formulaDisplay}`;
                return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
            }
        }

        // Default behavior for non-attribute formulas
        const base = `${ABILITY_MAP[appliesToId]?.abbreviation || ''}: ${valueInt > 0 ? `+${valueInt}` : valueInt}`;
        return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
    }),
    [ModifierAppliesToType.SavingThrow]: fmt((valueInt, appliesToId, bonusType) => {
        let saveName = '';
        if (appliesToId === -1) {
            saveName = 'All saves';
        } else {
            saveName = SAVING_THROW_MAP[appliesToId]?.abbreviation || '';
        }
        const base = `${saveName}: ${valueInt > 0 ? `+${valueInt}` : valueInt}`;
        return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
    }),
    [ModifierAppliesToType.Skill]: fmt((valueInt, appliesToId, bonusType) => {
        let skillName = '';
        if (appliesToId === -1) {
            skillName = 'Any Skill';
        } else {
            skillName = SKILL_MAP[appliesToId]?.name || '';
        }
        const base = `${skillName}: ${valueInt > 0 ? `+${valueInt}` : valueInt}`;
        return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
    }),
    [ModifierAppliesToType.AC]: fmt((valueInt, appliesToId, bonusType, character, modifier) => {
        // Check if this is an attribute-dependent formula
        if (modifier?.formulaParams?.formulaId && FormulaCalculator.isAttributeDependentFormula(modifier.formulaParams.formulaId)) {
            const formulaId = modifier.formulaParams.formulaId;
            const attributeId = modifier.formulaParams?.attributeId;

            if (character && attributeId) {
                // With character context - show calculated value
                const context = { level: 1, progressionLevel: 1, character };
                const calculatedValue = FormulaCalculator.calculateModifierValue(modifier, context);
                const bonusTypeName = bonusType !== null && bonusType !== undefined ?
                    Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown' : '';
                const base = `AC: ${calculatedValue > 0 ? `+${calculatedValue}` : calculatedValue}`;
                return bonusTypeName ? `${base} (${bonusTypeName})` : base;
            } else if (attributeId) {
                // Without character context - show formula structure
                const attributeAbbr = ABILITY_MAP[attributeId]?.abbreviation || 'UNK';
                let formulaDisplay = '';

                switch (formulaId) {
                    case FormulaId.ATTRIBUTE_BASED:
                        formulaDisplay = `${valueInt} + ${attributeAbbr}`;
                        break;
                    case FormulaId.ATTRIBUTE_MODIFIER:
                        formulaDisplay = `${attributeAbbr}`;
                        break;
                    case FormulaId.LEVEL_TIMES_ATTRIBUTE:
                        formulaDisplay = `level × ${attributeAbbr}`;
                        break;
                    default:
                        formulaDisplay = `${valueInt}`;
                }

                const bonusTypeName = bonusType !== null && bonusType !== undefined ?
                    Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown' : '';
                const base = `AC: ${formulaDisplay}`;
                return bonusTypeName ? `${base} (${bonusTypeName})` : base;
            }
        }

        // Default behavior for non-attribute formulas
        const bonusTypeName = bonusType !== null && bonusType !== undefined ?
            Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown' : '';
        const base = `AC: ${valueInt > 0 ? `+${valueInt}` : valueInt}`;
        return bonusTypeName ? `${base} (${bonusTypeName})` : base;
    }),
    [ModifierAppliesToType.HitDice]: fmt((valueInt, appliesToId, bonusType) => {
        const base = `Hit Dice: ${valueInt}${RPG_DICE[appliesToId]?.name || `${valueInt} Unknown Die`}`;
        return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
    }),
    [ModifierAppliesToType.Damage]: fmt((valueInt, appliesToId, bonusType) => {
        const base = `Damage: ${valueInt > 0 ? `+${valueInt}` : valueInt}`;
        return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
    }),
    [ModifierAppliesToType.DamageReduction]: fmt((valueInt, appliesToId, bonusType) => {
        const base = `${valueInt}/${DAMAGE_TYPES[appliesToId]?.name || `${valueInt} Unknown Damage Type`}`;
        return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
    }),
    [ModifierAppliesToType.MovementSpeed]: fmt((valueInt, appliesToId, bonusType) => {
        const base = `+${valueInt} ft.`;
        return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
    }),
    [ModifierAppliesToType.Attack]: fmt((valueInt, appliesToId, bonusType) => {
        const base = `Attack: ${valueInt > 0 ? `+${valueInt}` : valueInt}`;
        return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
    }),
    [ModifierAppliesToType.Initiative]: fmt((valueInt, appliesToId, bonusType) => {
        const base = `Initiative: ${valueInt > 0 ? `+${valueInt}` : valueInt}`;
        return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
    }),
    [ModifierAppliesToType.Uses]: fmt((valueInt, appliesToId, bonusType, character, modifier) => {
        const frequencyName = USES_FREQUENCIES[appliesToId]?.name || 'Unknown';

        // Check if this is an attribute-dependent formula
        if (modifier?.formulaParams?.formulaId && FormulaCalculator.isAttributeDependentFormula(modifier.formulaParams.formulaId)) {
            const formulaId = modifier.formulaParams.formulaId;
            const attributeId = modifier.formulaParams?.attributeId;

            if (character && attributeId) {
                // With character context - show calculated value
                const context = { level: 1, progressionLevel: 1, character };
                const calculatedValue = FormulaCalculator.calculateModifierValue(modifier, context);
                const base = `${calculatedValue}/${frequencyName}`;
                return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
            } else if (attributeId) {
                // Without character context - show formula structure
                const attributeAbbr = ABILITY_MAP[attributeId]?.abbreviation || 'UNK';
                let formulaDisplay = '';

                switch (formulaId) {
                    case FormulaId.ATTRIBUTE_BASED:
                        formulaDisplay = `${valueInt} + ${attributeAbbr}`;
                        break;
                    case FormulaId.ATTRIBUTE_MODIFIER:
                        formulaDisplay = `${attributeAbbr}`;
                        break;
                    case FormulaId.LEVEL_TIMES_ATTRIBUTE:
                        formulaDisplay = `level × ${attributeAbbr}`;
                        break;
                    default:
                        formulaDisplay = `${valueInt}`;
                }

                const base = `${formulaDisplay}/${frequencyName}`;
                return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
            }
        }

        // Default behavior for non-attribute formulas
        const base = `${valueInt}/${frequencyName}`;
        return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
    }),
    [ModifierAppliesToType.Targets]: fmt((valueInt, appliesToId, bonusType) => {
        const base = `${valueInt} target${valueInt !== 1 ? 's' : ''}`;
        return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
    }),
    [ModifierAppliesToType.Distance]: fmt((valueInt, appliesToId, bonusType) => {
        const base = `${valueInt} ft.`;
        return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
    }),
    [ModifierAppliesToType.Other]: fmt((valueInt, appliesToId, bonusType) => {
        const base = `${valueInt}`;
        return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
    }),
    [ModifierAppliesToType.BonusLanguage]: fmt((valueInt, appliesToId, bonusType) => {
        // For bonus languages, we want to show the language name
        // appliesToId should be the language ID
        const languageOption = LANGUAGE_SELECT_LIST.find(lang => lang.value === appliesToId);
        const languageName = languageOption?.label || `Language ${appliesToId}`;
        return languageName;
    }),
    [ModifierAppliesToType.AutomaticLanguage]: fmt((valueInt, appliesToId, bonusType) => {
        // For automatic languages, we want to show the language name
        // appliesToId should be the language ID
        const languageOption = LANGUAGE_SELECT_LIST.find(lang => lang.value === appliesToId);
        const languageName = languageOption?.label || `Language ${appliesToId}`;
        return languageName;
    })
};

export function formatProgression(progression: FeatureProgressionWithRelations, character?: CharacterContext): { label: string; value: string; note?: string } {
    const featureName = progression.feature?.name || `Feature ${progression.featureId}`;
    const label = `${featureName}:`;

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
    let hasFormulaModifiers = false;
    let formulaPatterns: string[] = [];

    for (let i = 0; i < progression.modifiers.length; i++) {
        const modifier = progression.modifiers[i];

        const formatter = PROGRESSION_FORMATTERS[modifier.appliesTo];

        // Safety check: if formatter doesn't exist, skip this modifier
        if (!formatter) {
            console.warn(`No formatter found for modifier appliesTo: ${modifier.appliesTo}`);
            continue;
        }

        let modifierValue = '';
        if (modifier.formulaParamsId) {
            // For formula-based features, collect the progression pattern
            hasFormulaModifiers = true;
            const progressionPattern = getFormulaProgressionPattern(modifier, progression.level, character);
            if (progressionPattern) {
                formulaPatterns.push(progressionPattern);
                continue; // Skip to next modifier, don't add to regular value
            } else {
                // Fallback to single calculated value
                const context = { level: progression.level, progressionLevel: progression.level, character };
                const calculatedValue = FormulaCalculator.calculateModifierValue(modifier, context);
                modifierValue = formatter.value(calculatedValue, modifier.appliesToId, modifier.bonusType, character, modifier);
            }
        } else {
            // For non-formula features, use the static value
            modifierValue = formatter.value(modifier.value, modifier.appliesToId, modifier.bonusType, character, modifier);
        }

        if (modifierValue) {
            if (value) {
                value += ', ';
            }
            value += modifierValue;
        }
    }

    // If we have formula patterns, combine them and return
    if (hasFormulaModifiers && formulaPatterns.length > 0) {
        return {
            label: '', // Empty label to prevent double wrapping
            value: formulaPatterns.join(', '),
            note: undefined
        };
    }

    // Extract note from effects if available
    let note: string | undefined;
    for (const effect of progression.effects) {
        if (effect.value) {
            note = effect.value;
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
 * Expand formula-based progressions into multiple entries for display
 * This creates separate progression entries for each transition level
 */
export function expandFormulaProgressions(progressions: FeatureProgressionWithRelations[]): FeatureProgressionWithRelations[] {
    const expanded: FeatureProgressionWithRelations[] = [];

    for (const progression of progressions) {
        const hasFormulaModifiers = progression.modifiers?.some(mod => mod.formulaParamsId);

        if (!hasFormulaModifiers) {
            // Non-formula progression, add as-is
            expanded.push(progression);
            continue;
        }

        // For formula-based progressions, create separate entries for each transition level
        const transitionLevels = getFormulaTransitionLevels(progression);

        for (const level of transitionLevels) {
            const expandedProgression: FeatureProgressionWithRelations = {
                ...progression,
                id: progression.id + level * 1000, // Create unique ID for each level
                level: level,
                modifiers: progression.modifiers?.map(mod => {
                    const calculatedValue = FormulaCalculator.calculateModifierValue(mod, {
                        level: level,
                        progressionLevel: progression.level
                    });
                    return {
                        ...mod,
                        id: mod.id + level * 1000, // Create unique ID for each modifier
                        formulaParamsId: null, // Set to null so it's treated as a static value
                        value: calculatedValue
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

    for (const modifier of progression.modifiers || []) {
        if (!modifier.formulaParamsId) continue;

        try {
            const formula = FORMULA_MAP[modifier.formulaParams?.formulaId];
            if (!formula) continue;

            // Generate progression values for levels 1-20
            const progressionValues: Array<{ level: number; value: number }> = [];
            for (let level = 1; level <= 20; level++) {
                const context = { level, progressionLevel: progression.level };
                const value = FormulaCalculator.calculateModifierValue(modifier, context);
                if (value > 0) { // Only include levels where the feature is active
                    progressionValues.push({ level, value });
                }
            }

            // Find transition points where the value changes
            const transitionPoints: number[] = [];
            let lastValue = 0;

            for (const { level, value } of progressionValues) {
                if (value !== lastValue) {
                    transitionPoints.push(level);
                    lastValue = value;
                }
            }

            // Add all transition levels to the result
            levels.push(...transitionPoints);
        } catch (error) {
            console.warn('Error getting transition levels:', error);
        }
    }

    // Remove duplicates and sort
    return [...new Set(levels)].sort((a, b) => a - b);
}

/**
 * Get a progression pattern string for formula-based features
 */
function getFormulaProgressionPattern(modifier: any, startLevel: number, character?: CharacterContext): string | null {
    if (!modifier.formulaParamsId) {
        return null;
    }

    try {
        const formula = FORMULA_MAP[modifier.formulaParams?.formulaId];
        if (!formula) return null;

        const formatter = PROGRESSION_FORMATTERS[modifier.appliesTo];
        if (!formatter) return null;

        // Generate progression values for levels 1-20
        const progressionValues: Array<{ level: number; value: number }> = [];
        for (let level = 1; level <= 20; level++) {
            const context = { level, progressionLevel: startLevel, character };
            const value = FormulaCalculator.calculateModifierValue(modifier, context);
            if (value > 0) { // Only include levels where the feature is active
                progressionValues.push({ level, value });
            }
        }

        // Find transition points where the value changes
        const transitionPoints: Array<{ level: number; value: number }> = [];
        let lastValue = 0;

        for (const { level, value } of progressionValues) {
            if (value !== lastValue) {
                transitionPoints.push({ level, value });
                lastValue = value;
            }
        }

        // Format the progression pattern using the appropriate formatter
        const patternParts = transitionPoints.map(({ level, value }) => {
            const formattedValue = formatter.value(value, modifier.appliesToId, modifier.bonusType, character, modifier);
            return `Level ${level} (${formattedValue})`;
        });

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
        // Generate progression values for levels 1-20 for all modifiers
        const progressionValues: Array<{ level: number; values: Array<{ modifier: any; value: number; formatted: string }> }> = [];

        for (let level = 1; level <= 20; level++) {
            const context = { level, progressionLevel: startLevel, character };
            const levelValues: Array<{ modifier: any; value: number; formatted: string }> = [];

            for (const modifier of modifiers) {
                if (!modifier.formulaParamsId) continue;

                const formula = FORMULA_MAP[modifier.formulaParams?.formulaId];
                if (!formula) continue;

                const formatter = PROGRESSION_FORMATTERS[modifier.appliesTo];
                if (!formatter) continue;

                const value = FormulaCalculator.calculateModifierValue(modifier, context);
                if (value > 0) { // Only include levels where the feature is active
                    const formatted = formatter.value(value, modifier.appliesToId, modifier.bonusType, character, modifier);
                    levelValues.push({ modifier, value, formatted });
                }
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

export function formatPrerequisites(prerequisites: any[]): string | null {
    if (!prerequisites || prerequisites.length === 0) return null;

    return prerequisites.map((prereq, index) => {
        let text = '';

        switch (prereq.type) {
            case FeaturePrerequisiteType.SkillRanks:
                const skillName = SKILL_SELECT_LIST.find(s => s.value === prereq.skillId)?.label || 'Unknown Skill';
                text = `${skillName} ${prereq.minValue} ranks`;
                break;
            case FeaturePrerequisiteType.AbilityScore:
                const abilityName = ABILITY_SELECT_LIST.find(ability => ability.value === prereq.abilityId)?.label || 'Unknown Ability';
                text = `${abilityName} ${prereq.minValue}+`;
                break;
            case FeaturePrerequisiteType.CharacterLevel:
                text = `Character Level ${prereq.minValue}+`;
                break;
            case FeaturePrerequisiteType.ClassLevel:
                text = `Class Level ${prereq.minValue}+`;
                break;
            case FeaturePrerequisiteType.BaseAttackBonus:
                text = `BAB ${prereq.minValue}+`;
                break;
            case FeaturePrerequisiteType.Other:
                text = `Other Requirement: ${prereq.minValue}`;
                break;
            default:
                text = `Requirement: ${prereq.minValue}`;
        }

        return index === prerequisites.length - 1 ? text : text + ', ';
    }).join('');
}

export function formatDiceDisplay(expr: string): string {
    return expr
        .replace('/level', ' per level')
        .replace(/,max(\d+d?\d*)/, ' (max $1)');
}

import { FeatureProgressionWithRelations, CharacterContext, FeaturePrerequisite, FeatureModifierInQueryResponse, FeatureSpecialEffectInQueryResponse } from '@shared/schema';
import {
    FeaturePrerequisiteType,
    ModifierAppliesToType,
    FULL_SKILL_SELECT_LIST,
    ABILITY_SELECT_LIST,
} from '@shared/static-data';

import { ProficiencyEffectFormatter } from './pure-formatters';

/**
 * Format a single prerequisite
 */
function formatPrerequisite(prereq: FeaturePrerequisite): string {
    switch (prereq.type) {
        case FeaturePrerequisiteType.SkillRanks: {
            const skillName = FULL_SKILL_SELECT_LIST.find(s => s.value === prereq.skillId)?.label || 'Unknown Skill';
            return `${skillName} ${prereq.minValue} ranks`;
        }
        case FeaturePrerequisiteType.AbilityScore: {
            // For ability score prerequisites, we need to check if skillId is used for ability ID
            const abilityName = ABILITY_SELECT_LIST.find(ability => ability.value === prereq.skillId)?.label || 'Unknown Ability';
            return `${abilityName} ${prereq.minValue}+`;
        }
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

/**
 * Format prerequisites array into a readable string
 */
export function formatPrerequisites(prerequisites: FeaturePrerequisite[]): string | null {
    if (!prerequisites || prerequisites.length === 0) return null;
    return prerequisites.map(prereq => formatPrerequisite(prereq)).join(', ');
}

/**
 * Format class proficiencies into a readable string
 */
export function formatClassProficiencies(proficiencies: Array<{ featId: number; itemId: number; featName: string; itemName?: string }>): string {
    const formatter = new ProficiencyEffectFormatter();
    return proficiencies
        .map((proficiency) => formatter.format(proficiency.featName, proficiency.itemId, proficiency.itemName))
        .join(', ');
}

/**
 * Process wild shape modifiers for uses per day
 */
function processWildShapeModifiers(modifiers: FeatureModifierInQueryResponse[], progression: FeatureProgressionWithRelations, character?: CharacterContext): string {
    const usesModifiers = modifiers.filter(mod => mod.appliesTo === ModifierAppliesToType.Uses);
    if (usesModifiers.length === 0) return '';

    // For now, return a simple format - this can be enhanced later
    return usesModifiers.map(mod => `${mod.value}/day`).join(', ');
}

/**
 * Process wild shape effects for forms and sizes
 */
function processWildShapeEffects(effects: FeatureSpecialEffectInQueryResponse[], isElemental: boolean): string[] {
    const result: string[] = [];

    for (const effect of effects) {
        if (effect.key === 'elementalwildshape') {
            result.push('elemental forms');
        } else if (effect.key === 'size') {
            result.push(`size ${effect.value}`);
        } else if (effect.key === 'form') {
            result.push(effect.value);
        }
    }

    return result;
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

        // Check if this is a skill analogue (skill modifier with LEVEL_PLUS_ABILITY formula)
        const isSkillAnalogue = progression.modifiers?.some(mod =>
            mod.appliesTo === ModifierAppliesToType.Skill &&
            mod.formulaParams?.formulaId === 11 // LEVEL_PLUS_ABILITY
        );

        if (isSkillAnalogue) {
            // For skill analogues, don't expand - just add the original progression
            expanded.push(progression);
            continue;
        }

        // For now, just add the original progression
        // This can be enhanced later to create multiple entries for transition levels
        expanded.push(progression);
    }

    return expanded;
}

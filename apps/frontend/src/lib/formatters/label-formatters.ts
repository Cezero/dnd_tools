import { SKILL_MAP, ABILITY_MAP, SAVING_THROW_MAP, DAMAGE_TYPES, EntityAppliesToType, ENTITY_APPLIES_TO_TYPES } from '@shared/static-data';

import type { CalculatedEntity } from './types';

// Labeler function for Class Skills (EntityType.Other + EntityAppliesToType.Skill)
export function classSkillLabeler(value: string, modifier: CalculatedEntity): string {
    if (modifier.appliesToId) {
        const skillName = SKILL_MAP[modifier.appliesToId]?.name;
        if (skillName) {
            return skillName; // Just return the skill name, no value
        }
    }
    return value;
}

// Labeler function for Skill Modifiers (EntityType.Bonus + EntityAppliesToType.Skill)
export function skillModifierLabeler(value: string, modifier: CalculatedEntity): string {
    if (modifier.appliesToId) {
        // Check if it's -1 (all skills)
        if (modifier.appliesToId === -1) {
            return `Any Skill: ${value}`;
        }

        const skillName = SKILL_MAP[modifier.appliesToId]?.name;
        if (skillName) {
            return `${skillName}: ${value}`; // Skill name with value
        }
    }
    return value;
}

// Standard labeler that uses displayName from ENTITY_APPLIES_TO_TYPES
export function displayNameLabeler(value: string, modifier: CalculatedEntity): string {
    const typeInfo = ENTITY_APPLIES_TO_TYPES[modifier.appliesTo];
    if (typeInfo?.displayName) {
        return `${typeInfo.displayName}: ${value}`;
    }
    return value;
}

// Labeler that returns the value without any label
export function emptyStringLabeler(value: string, _modifier: CalculatedEntity): string {
    return value; // No label, just return the value
}

// Labeler for Bonus Language modifiers
export function bonusLanguageLabeler(value: string, _modifier: CalculatedEntity): string {
    return `Bonus Language: ${value}`;
}

// Labeler for Automatic Language modifiers
export function automaticLanguageLabeler(value: string, _modifier: CalculatedEntity): string {
    return `Automatic Language: ${value}`;
}

// Labeler for Ability modifiers - shows ability abbreviation
export function abilityModifierLabeler(value: string, modifier: CalculatedEntity): string {
    if (modifier.appliesToId) {
        const abilityName = ABILITY_MAP[modifier.appliesToId]?.abbreviation;
        if (abilityName) {
            return `${abilityName}: ${value}`;
        }
    }
    return value;
}

// Labeler for Saving Throw modifiers - shows saving throw name or "All Save" for -1
export function savingThrowModifierLabeler(value: string, modifier: CalculatedEntity): string {
    if (modifier.appliesToId !== null && modifier.appliesToId !== undefined) {
        // Check if it's -1 (all saving throws)
        if (modifier.appliesToId === -1) {
            return `All Saves: ${value}`;
        }

        const savingThrowName = SAVING_THROW_MAP[modifier.appliesToId]?.abbreviation;
        if (savingThrowName) {
            return `${savingThrowName}: ${value}`;
        }
    }
    return value;
}

// Labeler for Creature Type modifiers
export function creatureTypeLabeler(value: string, _modifier: CalculatedEntity): string {
    return `Type: ${value}`;
}

// Labeler for Size Category modifiers
export function sizeCategoryLabeler(value: string, _modifier: CalculatedEntity): string {
    return `Size: ${value}`;
}

// Labeler for Damage Type modifiers
export function damageTypeLabeler(value: string, modifier: CalculatedEntity): string {
    if (modifier.appliesToId) {
        const damageTypeName = DAMAGE_TYPES[modifier.appliesToId]?.name;
        if (damageTypeName) {
            return `${damageTypeName}: ${value}`;
        }
    }
    return value;
}

// Labeler for individual choices - adds "Select" prefix
export function choiceLabeler(value: string, _choice: CalculatedEntity): string {
    return `Select ${value}`;
}

// Labeler for grouped choices - adds "Choose a ${choiceType}: (${formatted})" format
export function groupedChoiceLabeler(formattedItems: string, choiceType: EntityAppliesToType): string {
    const choiceTypeName = ENTITY_APPLIES_TO_TYPES[choiceType]?.name || 'Option';
    return `Choose a ${choiceTypeName}: (${formattedItems})`;
}

// Labeler for feat grants - adds "Granted Feat:" prefix
export function grantedFeatLabeler(value: string, _modifier: CalculatedEntity): string {
    return `Granted Feat: ${value}`;
}

// Labeler for weapon familiarity - adds "Treat" prefix and "as martial weapon(s)" suffix
export function weaponFamiliarityLabeler(value: string, _modifier: CalculatedEntity): string {
    return `Treat ${value} as martial weapon`;
}

// Labeler for grouped weapon familiarity - handles pluralization
export function groupedWeaponFamiliarityLabeler(formattedItems: string): string {
    // Check if there are multiple weapons (contains comma)
    const isPlural = formattedItems.includes(',');
    const pluralSuffix = isPlural ? 's' : '';
    return `Treat ${formattedItems} as martial weapon${pluralSuffix}`;
}

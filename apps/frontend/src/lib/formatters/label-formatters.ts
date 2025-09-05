import type { FeatureModifier } from '@shared/schema';
import { SKILL_MAP, MODIFIER_APPLIES_TO_TYPES, ABILITY_MAP, SAVING_THROW_MAP } from '@shared/static-data';

// Labeler function for Class Skills (ModifierType.Other + ModifierAppliesToType.Skill)
export function classSkillLabeler(value: string, modifier: FeatureModifier): string {
    if (modifier.appliesToId) {
        const skillName = SKILL_MAP[modifier.appliesToId]?.name;
        if (skillName) {
            return skillName; // Just return the skill name, no value
        }
    }
    return value;
}

// Labeler function for Skill Modifiers (ModifierType.Bonus + ModifierAppliesToType.Skill)
export function skillModifierLabeler(value: string, modifier: FeatureModifier): string {
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

// Standard labeler that uses displayName from MODIFIER_APPLIES_TO_TYPES
export function displayNameLabeler(value: string, modifier: FeatureModifier): string {
    const typeInfo = MODIFIER_APPLIES_TO_TYPES[modifier.appliesTo];
    if (typeInfo?.displayName) {
        return `${typeInfo.displayName}: ${value}`;
    }
    return value;
}

// Labeler that returns the value without any label
export function emptyStringLabeler(value: string, _modifier: FeatureModifier): string {
    return value; // No label, just return the value
}

// Labeler for Bonus Language modifiers
export function bonusLanguageLabeler(value: string, _modifier: FeatureModifier): string {
    return `Bonus Language: ${value}`;
}

// Labeler for Automatic Language modifiers
export function automaticLanguageLabeler(value: string, _modifier: FeatureModifier): string {
    return `Automatic Language: ${value}`;
}

// Labeler for Ability modifiers - shows ability abbreviation
export function abilityModifierLabeler(value: string, modifier: FeatureModifier): string {
    if (modifier.appliesToId) {
        const abilityName = ABILITY_MAP[modifier.appliesToId]?.abbreviation;
        if (abilityName) {
            return `${abilityName}: ${value}`;
        }
    }
    return value;
}

// Labeler for Saving Throw modifiers - shows saving throw name or "All Save" for -1
export function savingThrowModifierLabeler(value: string, modifier: FeatureModifier): string {
    if (modifier.appliesToId) {
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

import { SKILL_MAP, ABILITY_MAP, SAVING_THROW_MAP, DAMAGE_TYPES, EntityAppliesToType, ENTITY_APPLIES_TO_TYPES, CRAFT_SKILL_MAP, KNOWLEDGE_SKILL_MAP, SkillSubType, SKILL_SUB_TYPE_COMPATIBILITY, SPELL_SCHOOL_MAP, AttackBonusAppliesTo, ATTACK_BONUS_APPLIES_TO_TYPES } from '@shared/static-data';

import type { CalculatedEntity } from './types';

// Helper function to get skill name including subtypes
function getSkillNameWithSubtype(skillId: number, skillSubId?: number | null, customSubtype?: string | null): string {
    const skill = SKILL_MAP[skillId];
    if (!skill) {
        return 'Unknown Skill';
    }

    // Check if this skill uses skillSubId (Craft, Knowledge)
    if (SKILL_SUB_TYPE_COMPATIBILITY[SkillSubType.skillSubId].includes(skillId as 6 | 19) && skillSubId !== null && skillSubId !== undefined) {
        if (skillSubId === -1) {
            // Special case: -1 means "All" subtypes
            if (skillId === 6) { // Craft
                return 'Craft (All)';
            }
            if (skillId === 19) { // Knowledge
                return 'Knowledge (All)';
            }
        } else {
            if (skillId === 6) { // Craft
                const craftSubtype = CRAFT_SKILL_MAP[skillSubId];
                if (craftSubtype) {
                    return `Craft (${craftSubtype.name})`;
                }
            }
            if (skillId === 19) { // Knowledge
                const knowledgeSubtype = KNOWLEDGE_SKILL_MAP[skillSubId];
                if (knowledgeSubtype) {
                    return `Knowledge (${knowledgeSubtype.name})`;
                }
            }
        }
    }

    // Check if this skill uses customSubtype (Perform, Profession)
    if (SKILL_SUB_TYPE_COMPATIBILITY[SkillSubType.customSubtype].includes(skillId as 32 | 33) && customSubtype) {
        return `${skill.name} (${customSubtype})`;
    }

    return skill.name;
}

// Labeler function for Class Skills (EntityType.Other + EntityAppliesToType.Skill)
export function classSkillLabeler(value: string, modifier: CalculatedEntity): string {
    if (modifier.appliesToId) {
        const skillName = getSkillNameWithSubtype(modifier.appliesToId, modifier.appliesToSubId);
        return skillName; // Just return the skill name, no value
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

        const skillName = getSkillNameWithSubtype(modifier.appliesToId, modifier.appliesToSubId);
        return `${skillName}: ${value}`; // Skill name with value
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

// Labeler for Attack bonuses - includes appliesToSubId context (main-hand, off-hand, thrown)
export function attackBonusLabeler(value: string, modifier: CalculatedEntity): string {
    const typeInfo = ENTITY_APPLIES_TO_TYPES[modifier.appliesTo];
    const baseLabel = typeInfo?.displayName || 'Atk';
    
    // Check if appliesToSubId is set (for special attack bonus contexts)
    if (modifier.appliesToSubId !== null && modifier.appliesToSubId !== undefined) {
        const contextType = ATTACK_BONUS_APPLIES_TO_TYPES[modifier.appliesToSubId];
        if (contextType) {
            // Convert to lowercase with hyphen for display (e.g., "Main Hand" -> "main-hand")
            const contextName = contextType.name.toLowerCase().replace(/\s+/g, '-');
            return `${baseLabel}: ${value} (${contextName})`;
        }
    }
    
    // Default: just show the base label and value
    return `${baseLabel}: ${value}`;
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

// Labeler for Caster Level modifiers - shows domain name from SPELL_SCHOOL_MAP
export function casterLevelLabeler(value: string, modifier: CalculatedEntity): string {
    if (modifier.appliesToId) {
        const domainName = SPELL_SCHOOL_MAP[modifier.appliesToId]?.name;
        if (domainName) {
            return `Caster Level (${domainName}): ${value}`;
        }
    }
    return `Caster Level: ${value}`;
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

// Labeler for grouped uses - formats as "X/interval - other entities"
export function groupedUsesLabeler(formattedItems: string): string {
    // The formattedItems should already be in the format "uses_formatted, other_entity1, other_entity2"
    // We need to separate the uses from the other entities
    const items = formattedItems.split(', ').map(item => item.trim());

    // Find the uses item (contains "/" which indicates frequency, or is just a number like "1")
    const usesItem = items.find(item => item.includes('/') || /^\d+$/.test(item));
    const otherItems = items.filter(item => !item.includes('/') && !/^\d+$/.test(item));

    if (usesItem && otherItems.length > 0) {
        // If the uses item is just a number, we need to format it properly
        let formattedUses = usesItem;
        if (/^\d+$/.test(usesItem)) {
            // This is a raw number, we need to format it as "X/day" or similar
            // For now, assume it's per day, but this could be enhanced based on context
            formattedUses = `${usesItem}/day`;
        }
        return `${formattedUses} - ${otherItems.join(', ')}`;
    }

    // Fallback: if no uses item found or no other items, return as-is
    return formattedItems;
}

// Labeler for spell save DC
export function spellSaveDCLabeler(value: string, _modifier: CalculatedEntity): string {
    return `DC: ${value}`;
}

// Labeler for resistance - shows "Resistance to [type] [value]" for both individual and grouped
export function groupedResistanceLabeler(formattedItems: string): string {
    return `Resistance to ${formattedItems}`;
}

// Labeler for domain grants - adds "Domain:" prefix
export function domainLabeler(value: string, _modifier: CalculatedEntity): string {
    return `Domain: ${value}`;
}

export function animalCompanionLabeler(value: string, _modifier: CalculatedEntity): string {
    return `Animal Companion: ${value}`;
}

// Labeler for grouped bonus languages - handles pluralization
export function groupedBonusLanguageLabeler(formattedItems: string): string {
    // Check if there are multiple languages (contains comma)
    const isPlural = formattedItems.includes(',');
    const pluralSuffix = isPlural ? 's' : '';
    return `Bonus Language${pluralSuffix}: ${formattedItems}`;
}

// Labeler for grouped automatic languages - handles pluralization
export function groupedAutomaticLanguageLabeler(formattedItems: string): string {
    // Check if there are multiple languages (contains comma)
    const isPlural = formattedItems.includes(',');
    const pluralSuffix = isPlural ? 's' : '';
    return `Automatic Language${pluralSuffix}: ${formattedItems}`;
}

// Labeler for grouped skill points - uses "Bonus Skill Points" instead of "Choose a Skill Points"
export function groupedSkillPointsLabeler(formattedItems: string): string {
    return `Bonus Skill Points: (${formattedItems})`;
}

// Labeler for weapon names - adds suffix based on usage context
export interface WeaponNameLabelerContext {
    isDualWield: boolean;
    isMainHand: boolean;
    isTwoHanded: boolean;
}

export function weaponNameLabeler(
    weaponName: string,
    context: WeaponNameLabelerContext
): string {
    if (context.isDualWield) {
        if (context.isMainHand) {
            return `${weaponName} (main-hand)`;
        } else {
            return `${weaponName} (off-hand)`;
        }
    } else if (context.isTwoHanded) {
        return `${weaponName} (both hands)`;
    }
    return weaponName;
}

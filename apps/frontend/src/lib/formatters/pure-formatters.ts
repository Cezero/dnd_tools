import ordinal from 'ordinal';
import pluralize from 'pluralize';

import { formatSignedValue } from '@/lib/formatterUtils';
import {
    getFeatNameFromCache,
    getFeatureNameFromCache,
    getSpellNameFromCache,
    getDomainNameFromCache,
    getSkillNameFromCache,
    getClassNameFromCache,
    getItemNameFromCache,
    getCompanionNameFromCache,
} from '@/services/cache';
import {
    EntityAppliesToType,
    EntityType,
    FEATURE_FEAT_CHOICE_FILTER_TYPES,
    LANGUAGE_MAP,
    FEATURE_BONUS_TYPES,
    RPG_DICE,
    DAMAGE_TYPES,
    USES_FREQUENCIES,
    PROFICIENCY_TYPES,
    CREATURE_TYPES,
    SIZE_MAP,
    FeaturePrerequisiteType,
    ABILITY_MAP,
    SIZE_LIST,
    PROFICIENCY_TYPE_LIST,
    SAVING_THROW_MAP,
    CASTING_TYPE_MAP,
} from '@shared/static-data';

import type { BaseFormatter, CalculatedEntity, DisplayContext } from './types';


export class DamageFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, context?: DisplayContext): string {
        const value = modifier.value;

        // Handle null/undefined values with detailed logging
        if (value === null || value === undefined) {
            console.warn('[DamageFormatter] Null or undefined value in modifier:', {
                entityId: modifier.id,
                featureId: modifier.featureId,
                appliesTo: modifier.appliesTo,
                appliesToId: modifier.appliesToId,
                entityType: modifier.type,
                value: modifier.value,
                calculatedValue: modifier.calculatedValue,
                context: context ? { level: context.level, currentLevel: context.currentLevel } : 'no context',
                stackTrace: new Error().stack
            });
            return '';
        }

        // For now, use default values since diceType and size aren't in the current schema
        // TODO: figure out if this is ever used, if so switch to using appliesToId to lookup the dice type from RPG_DICE
        const diceType = 'd6';
        return `+${value}${diceType}`;
    }
}

export class DamageBonusFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, context?: DisplayContext): string {
        const value = modifier.value;

        // Handle null/undefined values with detailed logging
        if (value === null || value === undefined) {
            console.warn('[DamageBonusFormatter] Null or undefined value in modifier:', {
                entityId: modifier.id,
                featureId: modifier.featureId,
                appliesTo: modifier.appliesTo,
                appliesToId: modifier.appliesToId,
                entityType: modifier.type,
                value: modifier.value,
                calculatedValue: modifier.calculatedValue,
                context: context ? { level: context.level, currentLevel: context.currentLevel } : 'no context',
                stackTrace: new Error().stack
            });
            return '';
        }

        // For string values, return as-is; for numeric values, format with sign
        const formatContext = {
            entityId: modifier.id,
            featureId: modifier.featureId,
            appliesTo: modifier.appliesTo,
            caller: 'DamageBonusFormatter'
        };
        const baseValue = typeof value === 'string' ? value : formatSignedValue(value, formatContext);

        // Include damage type if appliesToId is present
        if (modifier.appliesToId) {
            return `${baseValue} (${modifier.appliesToId})`;
        }

        return baseValue;
    }
}

export class HealingFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, context?: DisplayContext): string {
        const value = modifier.value;

        // Handle null/undefined values with detailed logging
        if (value === null || value === undefined) {
            console.warn('[HealingFormatter] Null or undefined value in modifier:', {
                entityId: modifier.id,
                featureId: modifier.featureId,
                appliesTo: modifier.appliesTo,
                appliesToId: modifier.appliesToId,
                entityType: modifier.type,
                value: modifier.value,
                calculatedValue: modifier.calculatedValue,
                context: context ? { level: context.level, currentLevel: context.currentLevel } : 'no context',
                stackTrace: new Error().stack
            });
            return '';
        }

        return `${value} hp/day`;
    }
}

export class SignedValueFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, context?: DisplayContext): string {
        const value = modifier.value;

        // Handle null/undefined values with detailed logging
        if (value === null || value === undefined) {
            console.warn('[SignedValueFormatter] Null or undefined value in modifier:', {
                entityId: modifier.id,
                featureId: modifier.featureId,
                appliesTo: modifier.appliesTo,
                appliesToId: modifier.appliesToId,
                appliesToSubId: modifier.appliesToSubId,
                entityType: modifier.type,
                value: modifier.value,
                calculatedValue: modifier.calculatedValue,
                bonusType: modifier.bonusType,
                formulaParamsId: modifier.formulaParamsId,
                groupingId: modifier.groupingId,
                displayInDetail: modifier.displayInDetail,
                filterType: modifier.filterType,
                hasConditions: modifier.conditions && modifier.conditions.length > 0,
                conditionsCount: modifier.conditions?.length || 0,
                context: context ? {
                    level: context.level,
                    currentLevel: context.currentLevel,
                    hasCharacter: !!context.character,
                    hasChoices: !!context.choices,
                    hasCompanions: !!context.companions,
                } : 'no context',
                stackTrace: new Error().stack
            });
            return '';
        }

        // For string values, return as-is; for numeric values, format with sign
        const formatContext = {
            entityId: modifier.id,
            featureId: modifier.featureId,
            appliesTo: modifier.appliesTo,
            caller: 'SignedValueFormatter'
        };
        const baseValue = typeof value === 'string' ? value : formatSignedValue(value, formatContext);

        // Include bonus type if present and displayBonusType is not false
        const displayBonusType = context?.displayBonusType !== false; // Default to true
        if (displayBonusType && modifier.bonusType !== null && modifier.bonusType !== undefined) {
            const bonusTypeName = FEATURE_BONUS_TYPES[modifier.bonusType]?.name?.toLowerCase() || 'unknown';
            return `${baseValue} (${bonusTypeName})`;
        }

        return baseValue;
    }
}

export class EmptyStringFormatter implements BaseFormatter {
    format(_modifier: CalculatedEntity, _context?: DisplayContext): string {
        return '';
    }
}

export class LanguageFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, _context?: DisplayContext): string {
        const value = modifier.value;

        const languageId = modifier.appliesToId;
        if (languageId && LANGUAGE_MAP[languageId]) {
            return LANGUAGE_MAP[languageId].name;
        }
        return `Language ID: ${value}`;
    }
}

export class FeatFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, context?: DisplayContext): string {
        const value = modifier.value;

        // This is a proficiency - get item name from cache
        if (modifier.appliesToId) {
            const itemName = getItemNameFromCache(modifier.appliesToId);
            if (itemName) {
                return itemName.toLowerCase();
            }
        }

        // Use cache helper to get feat name
        const featId = modifier.appliesToId;
        if (featId) {
            const cachedName = getFeatNameFromCache(featId);
            if (cachedName) {
                return cachedName;
            }
        }

        // Fallback to ID
        return `${featId || value} (feat name not found)`;
    }
}

export class DomainFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, context?: DisplayContext): string {
        const value = modifier.value;

        // Priority 1: Use cache helper (domain object no longer on entity)

        // Priority 2: Use cache helper
        const domainId = modifier.appliesToId;
        if (domainId) {
            const cachedName = getDomainNameFromCache(domainId);
            if (cachedName) {
                return cachedName;
            }
        }

        // Priority 3: Fallback to ID
        return `${domainId || value} (domain name not found)`;
    }
}

export class SpellFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, context?: DisplayContext): string {
        const value = modifier.value;

        // Priority 1: Use cache helper (spell object no longer on entity)

        // Priority 2: Use cache helper
        const spellId = modifier.appliesToId;
        if (spellId) {
            const cachedName = getSpellNameFromCache(spellId);
            if (cachedName) {
                return cachedName;
            }
        }

        // Priority 3: Fallback if spell not found
        return `${spellId || value} (spell name not found)`;
    }
}

export class UsesFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, _context?: DisplayContext): string {
        const value = modifier.value;
        const frequencyInfo = USES_FREQUENCIES[modifier.appliesToId || 1];
        const frequency = frequencyInfo?.name || 'day';

        return `${value}/${frequency}`;
    }
}

export class TargetsFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, _context?: DisplayContext): string {
        const value = modifier.value;

        // For string values like "2 + WIS", we can't determine the exact number for pluralization
        // So we'll use a default plural form
        if (typeof value === 'string') {
            return `${value} targets`;
        }

        return `${value} ${pluralize('target', value)}`;
    }
}

export class ValueFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, _context?: DisplayContext): string {
        const value = modifier.value;

        return value.toString();
    }
}

export class DistanceFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, _context?: DisplayContext): string {
        const value = modifier.value;

        return `${value} ft.`;
    }
}

export class MovementSpeedFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, _context?: DisplayContext): string {
        const value = modifier.value;

        return `+${value} ft.`;
    }
}

export class DiceFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, _context?: DisplayContext): string {
        const value = modifier.value;

        // Use appliesToId to determine the dice type
        const diceId = modifier.appliesToId;
        if (diceId !== null && diceId !== undefined && RPG_DICE[diceId]) {
            const diceType = RPG_DICE[diceId].name;
            return `${value}${diceType}`;
        }
        // Fallback to d6 if no valid dice type is found
        return `${value}d6`;
    }
}

// TODO: how is this different from the DiceFormatter?
export class DiceBonusFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, _context?: DisplayContext): string {
        const value = modifier.value;

        // Use appliesToId to determine the dice type
        const diceId = modifier.appliesToId;
        if (diceId !== null && diceId !== undefined && RPG_DICE[diceId]) {
            const diceType = RPG_DICE[diceId].name;
            return `+${value}${diceType}`;
        }
        // Fallback to d6 if no valid dice type is found
        return `+${value}d6`;
    }
}

export class DamageReductionFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, _context?: DisplayContext): string {
        const value = modifier.value;

        const damageTypeId = modifier.appliesToId;
        if (damageTypeId !== null && damageTypeId !== undefined && DAMAGE_TYPES[damageTypeId]) {
            const damageType = DAMAGE_TYPES[damageTypeId].name;
            return `${value}/${damageType}`;
        }
        return `${value}/damage`;
    }
}

// this is not how this should be structured, this bypasses the formatter registry and uses the formatter directly
// this should be refactored to use the formatter registry
export class FeatureEntityFormatter implements BaseFormatter {
    format(choice: CalculatedEntity, context?: DisplayContext): string {
        // If value is already a formatted string, return it directly
        if (typeof choice.value === 'string') {
            return choice.value;
        }

        // CRITICAL: Always use actual names/abbreviations, never IDs
        const choiceName = this.getChoiceName(choice, context);

        switch (choice.type) {
            case EntityType.Choice:
                return choiceName;
            case EntityType.Allocation: {
                // For allocation entities, use base choice name without ordinal
                // Choice/Allocation entities now only generate values at formula-determined intervals
                // so ordinal numbers are not required
                const baseChoiceName = this.getBaseChoiceName(choice, context);
                return `Allocate Bonus to ${baseChoiceName}`;
            }
            default:
                return choiceName;
        }
    }

    private getChoiceName(choice: CalculatedEntity, context?: DisplayContext): string {
        switch (choice.appliesTo) {
            case EntityAppliesToType.Feat:
                return this.getFeatName(choice, context);
            case EntityAppliesToType.Domain:
                return this.getDomainName(choice, context);
            case EntityAppliesToType.Feature:
                return this.getFeatureName(choice, context);
            case EntityAppliesToType.CreatureType:
                return this.getCreatureTypeName(choice);
            case EntityAppliesToType.AnimalCompanion:
                return this.getAnimalCompanionName(choice);
            case EntityAppliesToType.Familiar:
                return this.getFamiliarName(choice);
            case EntityAppliesToType.Ability:
                return this.getAbilityName(choice);
            default:
                // Fallback for unknown appliesTo types
                return `Choice (${choice.appliesTo})`;
        }
    }

    private getFeatName(choice: CalculatedEntity, context?: DisplayContext): string {
        // Use cache helper to get feat name
        if (choice.appliesToId) {
            const cachedName = getFeatNameFromCache(choice.appliesToId);
            if (cachedName) {
                return cachedName;
            }
        }

        // Priority 3: Use static data filter type name (filter type is set)
        if (choice.filterType && FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType]) {
            return FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType].name;
        }

        // Priority 4: Fall back to "Bonus Feat" when no filter type is set
        return 'Bonus Feat';
    }

    private getDomainName(choice: CalculatedEntity, context?: DisplayContext): string {
        // Priority 1: Use cache helper (domain object no longer on entity)
        if (choice.appliesToId) {
            const cachedName = getDomainNameFromCache(choice.appliesToId);
            if (cachedName) {
                return cachedName;
            }
        }

        // Priority 3: Use static data filter type name (filter type is set)
        if (choice.filterType && FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType]) {
            return FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType].name;
        }

        // Priority 4: Fall back to "Domain Choice" when no filter type is set
        return 'Domain Choice';
    }

    private getFeatureName(choice: CalculatedEntity, context?: DisplayContext): string {
        // Priority 1: Use cache helper (feature object no longer on entity)
        if (choice.appliesToId) {
            const cachedName = getFeatureNameFromCache(choice.appliesToId);
            if (cachedName) {
                return cachedName;
            }
        }

        // Priority 3: Use static data filter type name
        if (choice.filterType && FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType]) {
            return FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType].name;
        }

        // Priority 4: Fall back to generic name or ID
        if (choice.appliesToId) {
            console.warn(`Unable to resolve feature name for ID: ${choice.appliesToId}`);
            return `Feature ID: ${choice.appliesToId}`;
        } else {
            return 'Feature Choice';
        }
    }

    private getCreatureTypeName(choice: CalculatedEntity): string {
        // Priority 1: Use included entity data (specific creature type selected)
        if (choice.appliesToId && CREATURE_TYPES[choice.appliesToId]) {
            return CREATURE_TYPES[choice.appliesToId].name;
        }

        // Priority 2: Use static data filter type name (filter type is set)
        if (choice.filterType && FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType]) {
            return FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType].name;
        }

        // Priority 3: Fall back to generic name without ordinal
        // Choice/Allocation entities now only generate values at formula-determined intervals
        // so ordinal numbers are not required
        return 'Creature Type';
    }

    private getAnimalCompanionName(choice: CalculatedEntity): string {
        // Priority 1: Use cache helper (companion object no longer on entity)
        if (choice.appliesToId) {
            const companionName = getCompanionNameFromCache(choice.appliesToId);
            if (companionName) {
                return companionName;
            }
        }

        // Priority 2: Use static data filter type name (filter type is set)
        if (choice.filterType && FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType]) {
            return FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType].name;
        }

        // Priority 3: Fall back to "Animal Companion" (labeler will add "Select" or "Choose a" prefix)
        // This matches the pattern used by Domain Choice and other choice types
        return 'Animal Companion';
    }

    private getFamiliarName(choice: CalculatedEntity): string {
        // Priority 1: Use cache helper (companion object no longer on entity)
        if (choice.appliesToId) {
            const companionName = getCompanionNameFromCache(choice.appliesToId);
            if (companionName) {
                return companionName;
            }
        }

        // Priority 2: Use static data filter type name (filter type is set)
        if (choice.filterType && FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType]) {
            return FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType].name;
        }

        // Priority 3: Fall back to "Familiar" (labeler will add "Select" or "Choose a" prefix)
        return 'Familiar';
    }

    private getAbilityName(choice: CalculatedEntity): string {
        // Priority 1: Use included entity data (specific ability selected)
        if (choice.appliesToId && ABILITY_MAP[choice.appliesToId]) {
            return ABILITY_MAP[choice.appliesToId].name;
        }

        // Priority 2: Fall back to "Select an Ability Increase" when no ability is selected
        return 'Select an Ability Increase';
    }

    private getBaseChoiceName(choice: CalculatedEntity, context?: DisplayContext): string {
        switch (choice.appliesTo) {
            case EntityAppliesToType.Feat:
                return this.getFeatName(choice, context);
            case EntityAppliesToType.Domain:
                return this.getDomainName(choice, context);
            case EntityAppliesToType.Feature:
                return this.getFeatureName(choice, context);
            case EntityAppliesToType.CreatureType:
                return this.getBaseCreatureTypeName(choice);
            case EntityAppliesToType.AnimalCompanion:
                return this.getAnimalCompanionName(choice);
            case EntityAppliesToType.Ability:
                return this.getAbilityName(choice);
            default:
                return `Choice (${choice.appliesTo})`;
        }
    }

    private getBaseCreatureTypeName(choice: CalculatedEntity): string {
        // Priority 1: Use included entity data (specific creature type selected)
        if (choice.appliesToId && CREATURE_TYPES[choice.appliesToId]) {
            return CREATURE_TYPES[choice.appliesToId].name;
        }

        // Priority 2: Use static data filter type name (filter type is set)
        if (choice.filterType && FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType]) {
            return FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType].name;
        }

        // Priority 3: Fall back to generic name without ordinal
        return 'Creature Type';
    }
}

export class ProficiencyFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, _context?: DisplayContext): string {

        if (modifier.appliesToSubId === -1) {
            // Category-based proficiency - appliesToId contains the proficiency type ID
            if (modifier.appliesToId && PROFICIENCY_TYPES[modifier.appliesToId]) {
                return PROFICIENCY_TYPES[modifier.appliesToId].allName;
            }
            // Fallback if proficiency type not found
            return 'all items';
        } else if (modifier.appliesToSubId && modifier.appliesToSubId > 0) {
            // itemId > 0 means a specific item proficiency
            // Use cache to get item name
            if (modifier.appliesToSubId) {
                const itemName = getItemNameFromCache(modifier.appliesToSubId);
                if (itemName) {
                    return itemName.toLowerCase();
                }
            }
            // Fallback if item name not found
            return `item ${modifier.appliesToSubId}`;
        } else if (modifier.appliesToSubId === null || modifier.appliesToSubId === undefined) {
            // appliesToSubId is null/undefined - user must select a specific item
            // Format as "Grants Proficiency [ProficiencyTypeName] (selected weapon)"
            if (modifier.appliesToId && PROFICIENCY_TYPES[modifier.appliesToId]) {
                const proficiencyType = PROFICIENCY_TYPES[modifier.appliesToId];
                return `Grants Proficiency ${proficiencyType.name} (selected weapon)`;
            }
            // Fallback if proficiency type not found
            return 'Grants Proficiency (selected weapon)';
        } else {
            // No specific item, just return a generic message
            return 'proficiency';
        }
    }
}

export class CreatureTypeFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, _context?: DisplayContext): string {
        const value = modifier.value;

        const creatureType = CREATURE_TYPES[modifier.appliesToId];
        if (creatureType) {
            if (value !== 0) {
                const stringValue = typeof value === 'string' ? value : formatSignedValue(value);
                return `${creatureType.name}: ${stringValue}`;
            }
            return creatureType.name;
        }
        return `Creature Type ID: ${modifier.appliesToId}`;
    }
}

export class SizeCategoryFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, _context?: DisplayContext): string {
        const value = modifier.value;

        const sizeCategory = SIZE_MAP[modifier.appliesToId];
        if (sizeCategory) {
            if (value !== 0 && value !== null && value !== undefined) {
                const stringValue = typeof value === 'string' ? value : formatSignedValue(value);
                return `${sizeCategory.name}: ${stringValue}`;
            }
            return sizeCategory.name;
        }
        return `Size Category ID: ${modifier.appliesToId}`;
    }
}

export class DamageTypeFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, _context?: DisplayContext): string {

        if (modifier.appliesToId !== null && modifier.appliesToId !== undefined) {
            const damageType = DAMAGE_TYPES[modifier.appliesToId];
            if (damageType) {
                return damageType.name;
            }
        }
        return `Damage Type ID: ${modifier.appliesToId}`;
    }
}

export class WeaponFamiliarityFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, _context?: DisplayContext): string {
        // Use cache to get weapon name
        if (modifier.appliesToId) {
            const itemName = getItemNameFromCache(modifier.appliesToId);
            if (itemName) {
                return itemName;
            }
        }

        // Fallback if weapon data is missing
        const weaponId = modifier.appliesToId;
        return `Weapon ID: ${weaponId}`;
    }
}

export class SpellSaveDCFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, _context?: DisplayContext): string {
        const value = typeof modifier.value === 'string' ? parseInt(modifier.value, 10) || 0 : modifier.value;
        return formatSignedValue(value);
    }
}

export class SpellbookSpellFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, context?: DisplayContext): string {
        const spellLevel = modifier.appliesToId;

        // Helper to format spell level with ordinal (0th, 1st, 2nd, etc.)
        const formatSpellLevel = (level: number | null | undefined): string => {
            if (level === null || level === undefined) {
                return 'unknown level';
            }
            if (level === 0) {
                return '0th (Cantrip)';
            }
            // Use ordinal library for proper formatting (handles 11th, 12th, 13th, etc.)
            return ordinal(level);
        };

        // If appliesToSubId === -1, show "All {level} level spells"
        if (modifier.appliesToSubId === -1) {
            const levelLabel = formatSpellLevel(spellLevel);
            return `All ${levelLabel} level spells`;
        }

        // If appliesToSubId is a specific spell ID, show the spell name
        if (modifier.appliesToSubId && modifier.appliesToSubId > 0) {
            // Priority 1: Use included spell data if available
            // Priority 1: Use cache helper (spell object no longer on entity)
            const cachedName = getSpellNameFromCache(modifier.appliesToSubId);
            if (cachedName) {
                return cachedName;
            }

            // Priority 3: Fallback
            return `Spell ID: ${modifier.appliesToSubId}`;
        }

        // Fallback for null/undefined appliesToSubId
        if (spellLevel !== null && spellLevel !== undefined) {
            const levelLabel = formatSpellLevel(spellLevel);
            return `${levelLabel} level spell (not selected)`;
        }

        return 'Spellbook spell (not configured)';
    }
}

export class ResistanceFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, _context?: DisplayContext): string {
        const value = modifier.value;

        if (modifier.appliesToId !== null && modifier.appliesToId !== undefined) {
            const damageType = DAMAGE_TYPES[modifier.appliesToId];
            if (damageType) {
                return `${damageType.name.toLowerCase()} ${value}`;
            }
        }

        return `${value}`;
    }
}

export class WeightFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, _context?: DisplayContext): string {
        const value = modifier.value;

        if (value === null || value === undefined) {
            return '';
        }

        // Handle both number and Decimal (Prisma) types
        return `${value.toString()} lb.`;
    }
}

export class CriticalFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, _context?: DisplayContext): string {
        const value = modifier.value;

        if (value === null || value === undefined) {
            return '20/x2'; // Default critical
        }

        // Value should be a string like "20/x2" or "19-20/x2"
        return typeof value === 'string' ? value : value.toString();
    }
}

export class AttackBonusFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, _context?: DisplayContext): string {
        const value = modifier.value;

        if (value === null || value === undefined) {
            return '0';
        }

        const numericValue = typeof value === 'number' ? value : parseFloat(value.toString()) || 0;

        // For character sheet formatting, nonlethal bonus is handled separately
        // This formatter just formats the main attack bonus
        return formatSignedValue(numericValue);
    }

    /**
     * Format attack bonus with nonlethal handling (utility method)
     */
    formatWithNonlethal(lethalBonus: number, nonlethalBonus?: number): string {
        if (nonlethalBonus !== undefined && nonlethalBonus !== lethalBonus) {
            const lethalSign = lethalBonus >= 0 ? '+' : '';
            const nonlethalSign = nonlethalBonus >= 0 ? '+' : '';
            return `${lethalSign}${lethalBonus} (${nonlethalSign}${nonlethalBonus} nonlethal)`;
        }
        return formatSignedValue(lethalBonus);
    }
}

/**
 * Formatter for damage strings (e.g., "1d8+3")
 * Formats damage from components: baseDamage + abilityModifier + featBonus
 */
export class DamageStringFormatter implements BaseFormatter {
    format(entity: CalculatedEntity, _context?: DisplayContext): string {
        // Damage components can be stored in formulaParams or as structured data
        // For now, we'll check if value is a string (legacy) or if we have structured data
        if (typeof entity.value === 'string') {
            // Legacy: already formatted string
            return entity.value;
        }

        // Extract damage components from formulaParams if available
        const formulaParams = entity.formulaParams;
        if (formulaParams && typeof formulaParams === 'object') {
            const baseDamage = (formulaParams as { baseDamage?: string }).baseDamage ?? '1d4';
            const abilityModifier = (formulaParams as { abilityModifier?: number }).abilityModifier ?? 0;
            const featBonus = (formulaParams as { featBonus?: number }).featBonus ?? 0;

            return this.formatFromComponents(baseDamage, abilityModifier, featBonus);
        }

        // Fallback: try to use value as modifier if it's a number
        if (typeof entity.value === 'number') {
            return this.formatFromComponents('1d4', entity.value, 0);
        }

        // Default fallback
        return '1d4';
    }

    /**
     * Format damage from components (utility method for direct use)
     */
    formatFromComponents(baseDamage: string, abilityModifier: number, featBonus: number): string {
        const totalModifier = abilityModifier + featBonus;
        // Only append modifier if it's not zero
        if (totalModifier === 0) {
            return baseDamage;
        }
        const modifierStr = totalModifier >= 0 ? `+${totalModifier}` : `${totalModifier}`;
        return `${baseDamage}${modifierStr}`;
    }
}

/**
 * Formatter for FeaturePrerequisite objects
 * Converts prerequisites to CalculatedEntity-like format for formatting
 */
export class PrerequisiteFormatter implements BaseFormatter {
    format(prereq: CalculatedEntity, context?: DisplayContext): string {
        // Prerequisites are passed as CalculatedEntity with FeaturePrerequisiteType stored in filterType
        // This formatter is called from formatPrerequisites which converts FeaturePrerequisite to CalculatedEntity format
        // The prerequisite type is stored in filterType, appliesToId, and minValue in value

        // Get prerequisite type from filterType (where we stored FeaturePrerequisiteType)
        // Ensure it's a number (FeaturePrerequisiteType is a number enum: 0-10)
        const filterTypeValue = prereq.filterType !== null && prereq.filterType !== undefined
            ? (typeof prereq.filterType === 'number' ? prereq.filterType : Number(prereq.filterType))
            : null;

        if (filterTypeValue === null || isNaN(filterTypeValue)) {
            console.warn('PrerequisiteFormatter: filterType is null/undefined/NaN for prerequisite:', prereq);
            return `Prerequisite ${prereq.id || ''}`;
        }

        const prereqType = filterTypeValue as FeaturePrerequisiteType;
        const appliesToId = prereq.appliesToId;
        const minValue = typeof prereq.value === 'number' ? prereq.value : (prereq.value ? Number(prereq.value) : 0);

        switch (prereqType) {
            case FeaturePrerequisiteType.SkillRanks: {
                // Use cache helper
                if (appliesToId) {
                    const skillName = getSkillNameFromCache(appliesToId);
                    if (skillName) {
                        return `${skillName} ${minValue} ranks`;
                    }
                }
                // Fallback if skill not found
                return appliesToId ? `Skill ${appliesToId} ${minValue} ranks` : `Skill ${minValue} ranks`;
            }
            case FeaturePrerequisiteType.AbilityScore: {
                const abilityName = appliesToId ? ABILITY_MAP[appliesToId]?.abbreviation || 'Unknown' : 'Ability';
                return `${abilityName} ${minValue}+`;
            }
            case FeaturePrerequisiteType.CharacterLevel:
                return `Character Level ${minValue}+`;
            case FeaturePrerequisiteType.ClassLevel: {
                // If appliesToId is set and not -1, it's a class-specific level requirement
                if (appliesToId && appliesToId !== -1) {
                    const className = getClassNameFromCache(appliesToId);
                    if (className) {
                        return `${className} Level ${minValue}+`;
                    }
                }
                // Fallback to generic "Class Level" if no class specified or class name not found
                return `Class Level ${minValue}+`;
            }
            case FeaturePrerequisiteType.BaseAttackBonus:
                return `BAB ${minValue}+`;
            case FeaturePrerequisiteType.Feat: {
                // Priority 1: Use cache helper
                if (appliesToId) {
                    const featName = getFeatNameFromCache(appliesToId);
                    if (featName) {
                        return `Feat: ${featName}`;
                    }
                }
                // Priority 2: Fallback to ID
                return `Feat ${appliesToId || ''}`;
            }
            case FeaturePrerequisiteType.ClassFeature: {
                // Priority 1: Use cache helper
                if (appliesToId) {
                    const featureName = getFeatureNameFromCache(appliesToId);
                    if (featureName) {
                        return `Feature: ${featureName}`;
                    }
                }
                // Priority 2: Fallback to ID
                return `Feature ${appliesToId || ''}`;
            }
            case FeaturePrerequisiteType.Spellcasting:
                // If minValue is set, format as "Caster level Xth"
                if (minValue > 0) {
                    // Format ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
                    const suffix = minValue === 1 ? 'st' : minValue === 2 ? 'nd' : minValue === 3 ? 'rd' : 'th';
                    return `Caster level ${minValue}${suffix}`;
                }
                return `Spellcasting`;
            case FeaturePrerequisiteType.Size: {
                // Size prerequisites use appliesToId to reference SIZE_LIST
                const sizeName = appliesToId ? SIZE_LIST.find(s => s.id === appliesToId)?.name || 'Unknown Size' : 'Size';
                return `${sizeName}`;
            }
            case FeaturePrerequisiteType.Proficiency: {
                // Proficiency prerequisites use appliesToId to reference proficiency types
                const profName = appliesToId ? PROFICIENCY_TYPE_LIST.find(p => p.id === appliesToId)?.name || 'Unknown Proficiency' : 'Proficiency';
                return `${profName}`;
            }
            case FeaturePrerequisiteType.Other:
                return `Other Requirement: ${minValue !== null && minValue !== undefined ? minValue : ''}`;
            default:
                // If we don't recognize the type, try to return something useful
                console.warn('Unknown prerequisite type:', prereqType, 'for prerequisite:', prereq);
                return `Requirement: ${minValue !== null && minValue !== undefined ? minValue : ''}`;
        }
    }
}

/**
 * Formatter for Base Attack Bonus feature
 * Formats the calculated BAB value (e.g., "+1", "+2") from formula resolution
 */
export class BaseAttackBonusFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, _context?: DisplayContext): string {
        const value = modifier.value;

        if (typeof value === 'number') {
            return formatSignedValue(value);
        }

        return 'BAB';
    }
}

/**
 * Formatter for Saving Throw feature
 * Formats the calculated save value (e.g., "+2", "+3") from formula resolution
 */
export class SavingThrowProgressionFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, _context?: DisplayContext): string {
        const value = modifier.value;

        if (typeof value === 'number') {
            const savingThrowId = modifier.appliesToId;
            const savingThrow = savingThrowId !== null && savingThrowId !== undefined
                ? SAVING_THROW_MAP[savingThrowId]
                : null;

            if (savingThrow) {
                return `${savingThrow.name} ${formatSignedValue(value)}`;
            }
            return formatSignedValue(value);
        }

        const savingThrowId = modifier.appliesToId;
        const savingThrow = savingThrowId !== null && savingThrowId !== undefined
            ? SAVING_THROW_MAP[savingThrowId]
            : null;

        return savingThrow ? savingThrow.name : 'Saving Throw';
    }
}

/**
 * Formatter for Speed value
 * Formats the speed value without the "+" prefix (unlike MovementSpeedFormatter)
 */
export class SpeedFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, _context?: DisplayContext): string {
        const value = modifier.value;
        return `${value} ft.`;
    }
}

/**
 * Formatter for Favored Class
 * Formats the class name from appliesToId
 */
export class FavoredClassFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, _context?: DisplayContext): string {
        const classId = modifier.appliesToId;
        if (classId) {
            const cachedName = getClassNameFromCache(classId);
            if (cachedName) {
                return cachedName;
            }
        }
        return `Class ID: ${classId || modifier.value}`;
    }
}

/**
 * Formatter for Level Adjustment
 * Formats the LA value with "+" prefix if positive
 */
export class LevelAdjustmentFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, _context?: DisplayContext): string {
        const value = modifier.value;
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (typeof numValue !== 'number' || Number.isNaN(numValue)) {
            return value !== null && value !== undefined ? String(value) : '';
        }
        // Use the shared formatterUtils helper to keep sign formatting DRY.
        return formatSignedValue(numValue);
    }
}

/**
 * Formatter for Casting Ability
 * Formats the ability abbreviation from appliesToId
 */
export class CastingAbilityFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, _context?: DisplayContext): string {
        const abilityId = modifier.appliesToId;
        if (abilityId !== null && abilityId !== undefined && ABILITY_MAP[abilityId]) {
            return ABILITY_MAP[abilityId].abbreviation;
        }
        return `Ability ID: ${abilityId || modifier.value}`;
    }
}

/**
 * Formatter for Casting Type
 * Formats the casting type name from appliesToId
 */
export class CastingTypeFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity, _context?: DisplayContext): string {
        const castingTypeId = modifier.appliesToId;
        if (castingTypeId !== null && castingTypeId !== undefined && CASTING_TYPE_MAP[castingTypeId]) {
            return CASTING_TYPE_MAP[castingTypeId].name;
        }
        return `Casting Type ID: ${castingTypeId || modifier.value}`;
    }
}

/**
 * Formatter for spellcasting progression (e.g. spell slots per level).
 * Displays the slot/value count, or "—" when zero or absent.
 */
export class SpellcastingProgressionFormatter implements BaseFormatter {
    format(entity: CalculatedEntity, _context?: DisplayContext): string {
        const raw = entity.calculatedValue ?? entity.value;
        if (raw === null || raw === undefined || (typeof raw === 'number' && raw === 0)) {
            return '—';
        }
        return String(raw);
    }
}

/**
 * Spell level label for table column headers (0 = "0", 1 = "1st", … 9 = "9th").
 */
export function formatSpellLevelForTable(spellLevel: number): string {
    if (spellLevel === 0) {
        return '0';
    }
    return ordinal(spellLevel);
}

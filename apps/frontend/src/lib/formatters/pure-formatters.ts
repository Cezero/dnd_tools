import pluralize from 'pluralize';

// FeatureEntity import removed - now using CalculatedEntity
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
    FeatBenefitType,
    CREATURE_TYPES,
    SIZE_MAP,
    SPELL_ID_LIST,
} from '@shared/static-data';

import type { BaseFormatter, CalculatedEntity } from './types';

export class DamageFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity): string {
        const value = modifier.value;

        // For now, use default values since diceType and size aren't in the current schema
        // TODO: figure out if this is ever used, if so switch to using appliesToId to lookup the dice type from RPG_DICE
        const diceType = 'd6';
        return `+${value}${diceType}`;
    }
}

export class DamageBonusFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity): string {
        const value = modifier.value;

        // For string values, return as-is; for numeric values, format with sign
        const baseValue = typeof value === 'string' ? value : formatSignedValue(value);

        // Include damage type if appliesToId is present
        if (modifier.appliesToId) {
            return `${baseValue} (${modifier.appliesToId})`;
        }

        return baseValue;
    }
}

export class HealingFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity): string {
        const value = modifier.value;

        return `${value} hp/day`;
    }
}

export class SignedValueFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity): string {
        const value = modifier.value;

        // For string values, return as-is; for numeric values, format with sign
        const baseValue = typeof value === 'string' ? value : formatSignedValue(value);

        // Include bonus type if present
        if (modifier.bonusType !== null && modifier.bonusType !== undefined) {
            const bonusTypeName = FEATURE_BONUS_TYPES[modifier.bonusType]?.name?.toLowerCase() || 'unknown';
            return `${baseValue} (${bonusTypeName})`;
        }

        return baseValue;
    }
}

export class EmptyStringFormatter implements BaseFormatter {
    format(_modifier: CalculatedEntity): string {
        return '';
    }
}

export class LanguageFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity): string {
        const value = modifier.value;

        const languageId = modifier.appliesToId;
        if (languageId && LANGUAGE_MAP[languageId]) {
            return LANGUAGE_MAP[languageId].name;
        }
        return `Language ID: ${value}`;
    }
}

export class FeatFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity): string {
        const value = modifier.value;

        // This is a proficiency - return the item name
        const itemName = modifier.item?.name;
        if (itemName) {
            return itemName.toLowerCase();
        }

        // Handle general feats - use included entity data
        if (modifier.feat) {
            return modifier.feat.name;
        }

        // Fallback to appliesToId if feat data is missing
        const featId = modifier.appliesToId;
        return `${featId || value} (feat name not found)`;
    }
}

export class SpellFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity): string {
        const value = modifier.value;

        // Use included spell data if available (from backend)
        if (modifier.spell) {
            return modifier.spell.name;
        }

        // Fallback: Look up spell name from static data using appliesToId
        const spellId = modifier.appliesToId;
        if (spellId) {
            const spell = SPELL_ID_LIST.find((s) => s.id === spellId);
            if (spell) {
                return spell.name;
            }
        }

        // Fallback if spell not found
        return `${spellId || value} (spell name not found)`;
    }
}

export class UsesFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity): string {
        const value = modifier.value;
        const frequencyInfo = USES_FREQUENCIES[modifier.appliesToId || 1];
        const frequency = frequencyInfo?.name || 'day';

        return `${value}/${frequency}`;
    }
}

export class TargetsFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity): string {
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
    format(modifier: CalculatedEntity): string {
        const value = modifier.value;

        return value.toString();
    }
}

export class DistanceFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity): string {
        const value = modifier.value;

        return `${value} ft.`;
    }
}

export class MovementSpeedFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity): string {
        const value = modifier.value;

        return `+${value} ft.`;
    }
}

export class DiceFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity): string {
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
    format(modifier: CalculatedEntity): string {
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
    format(modifier: CalculatedEntity): string {
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
    format(choice: CalculatedEntity): string {
        // If value is already a formatted string, return it directly
        if (typeof choice.value === 'string') {
            return choice.value;
        }

        // CRITICAL: Always use actual names/abbreviations, never IDs
        const choiceName = this.getChoiceName(choice);

        switch (choice.type) {
            case EntityType.Choice:
                return choiceName;
            case EntityType.Allocation: {
                // For allocation entities, use base choice name without ordinal
                // Choice/Allocation entities now only generate values at formula-determined intervals
                // so ordinal numbers are not required
                const baseChoiceName = this.getBaseChoiceName(choice);
                return `Allocate Bonus to ${baseChoiceName}`;
            }
            default:
                return choiceName;
        }
    }

    private getChoiceName(choice: CalculatedEntity): string {
        switch (choice.appliesTo) {
            case EntityAppliesToType.Feat:
                return this.getFeatName(choice);
            case EntityAppliesToType.Feature:
                return this.getFeatureName(choice);
            case EntityAppliesToType.CreatureType:
                return this.getCreatureTypeName(choice);
            default:
                // Fallback for unknown appliesTo types
                return `Choice (${choice.appliesTo})`;
        }
    }

    private getFeatName(choice: CalculatedEntity): string {
        // Priority 1: Use included entity data (specific feat selected)
        if (choice.feat) {
            return choice.feat.name;
        }

        // Priority 3: Use static data filter type name (filter type is set)
        if (choice.filterType && FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType]) {
            return FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType].name;
        }

        // Priority 5: Fall back to "Bonus Feat" when no filter type is set
        return 'Bonus Feat';
    }

    private getFeatureName(choice: CalculatedEntity): string {
        // Priority 1: Use included entity data
        if (choice.feature) {
            return choice.feature.name;
        }

        // Priority 3: Use static data filter type name
        if (choice.filterType && FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType]) {
            return FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType].name;
        }

        // Priority 5: Fall back to generic name or ID
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

    private getBaseChoiceName(choice: CalculatedEntity): string {
        switch (choice.appliesTo) {
            case EntityAppliesToType.Feat:
                return this.getFeatName(choice);
            case EntityAppliesToType.Feature:
                return this.getFeatureName(choice);
            case EntityAppliesToType.CreatureType:
                return this.getBaseCreatureTypeName(choice);
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
    format(modifier: CalculatedEntity): string {

        if (modifier.appliesToSubId === -1) {
            // Use included entity data
            if (modifier.feat?.benefits) {
                const proficiencyBenefit = modifier.feat.benefits.find(benefit => benefit.typeId === FeatBenefitType.PROFICIENCY);
                if (proficiencyBenefit) {
                    return PROFICIENCY_TYPES[proficiencyBenefit.referenceId].allName;
                }
            }
            // Fallback if feat object or proficiency benefit not found
            return 'all items';
        } else if (modifier.appliesToSubId && modifier.appliesToSubId > 0) {
            // itemId > 0 means a specific item proficiency
            if (modifier.item) {
                return modifier.item.name.toLowerCase();
            }
            // Fallback if item name not found
            return `item ${modifier.appliesToSubId}`;
        } else {
            // No specific item, just return a generic message
            return 'proficiency';
        }
    }
}

export class CreatureTypeFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity): string {
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
    format(modifier: CalculatedEntity): string {
        const value = modifier.value;

        const sizeCategory = SIZE_MAP[modifier.appliesToId];
        if (sizeCategory) {
            if (value !== 0) {
                const stringValue = typeof value === 'string' ? value : formatSignedValue(value);
                return `${sizeCategory.name}: ${stringValue}`;
            }
            return sizeCategory.name;
        }
        return `Size Category ID: ${modifier.appliesToId}`;
    }
}

export class DamageTypeFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity): string {

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
    format(modifier: CalculatedEntity): string {
        // Use the weapon name from the item data
        if (modifier.item) {
            return modifier.item.name;
        }

        // Fallback if weapon data is missing
        const weaponId = modifier.appliesToId;
        return `Weapon ID: ${weaponId}`;
    }
}

export class SpellSaveDCFormatter implements BaseFormatter {
    format(modifier: CalculatedEntity): string {
        const value = typeof modifier.value === 'string' ? parseInt(modifier.value, 10) || 0 : modifier.value;
        return formatSignedValue(value);
    }
}

// Utility function for formatting signed values
function formatSignedValue(value: number): string {
    if (value > 0) {
        return `+${value}`;
    } else if (value < 0) {
        return `${value}`;
    } else {
        return '0';
    }
}


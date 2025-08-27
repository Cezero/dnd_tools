import pluralize from 'pluralize';

import type {
    FeatureModifier,
    FeatureChoice,
    FeatureSpecialEffect
} from '@shared/schema';
import {
    FeatureChoiceType,
    FeatureChoiceBehavior,
    FEATURE_FEAT_CHOICE_FILTER_TYPES,
    LANGUAGE_MAP,
    FEATURE_BONUS_TYPES,
    RPG_DICE,
    DAMAGE_TYPES
} from '@shared/static-data';

import type { BaseFormatter, ChoiceFormatter, EffectFormatter, FormatterMetadata } from './types';

export class DamageFormatter implements BaseFormatter {
    format(value: number, _modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        // For now, use default values since diceType and size aren't in the current schema
        const diceType = 'd6';
        const sizeSuffix = '';
        return `+${value}${diceType}${sizeSuffix}`;
    }
}

export class DamageBonusFormatter implements BaseFormatter {
    format(value: number, modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        const baseValue = formatSignedValue(value);

        // Include damage type if appliesToId is present
        if (modifier.appliesToId) {
            return `${baseValue} (${modifier.appliesToId})`;
        }

        return baseValue;
    }
}

export class HealingFormatter implements BaseFormatter {
    format(value: number, _modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        return `${value} hp/day`;
    }
}

export class SignedValueFormatter implements BaseFormatter {
    format(value: number, modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        const baseValue = formatSignedValue(value);

        // Include bonus type if present
        if (modifier.bonusType !== null && modifier.bonusType !== undefined) {
            const bonusTypeName = FEATURE_BONUS_TYPES[modifier.bonusType]?.name?.toLowerCase() || 'unknown';
            return `${baseValue} (${bonusTypeName})`;
        }

        return baseValue;
    }
}

export class SkillFormatter implements BaseFormatter {
    format(value: number, _modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        return formatSignedValue(value);
    }
}

export class LanguageFormatter implements BaseFormatter {
    format(value: number, modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        const languageId = modifier.appliesToId;
        if (languageId && LANGUAGE_MAP[languageId]) {
            return LANGUAGE_MAP[languageId].name;
        }
        return `Language ID: ${value}`;
    }
}

export class FeatFormatter implements BaseFormatter {
    format(value: number, modifier: FeatureModifier, metadata?: FormatterMetadata): string {
        const featId = modifier.appliesToId;
        if (featId && metadata?.featNames) {
            const featName = metadata.featNames.find(f => f.id === featId)?.name;
            if (featName) {
                return featName;
            }
        }
        return `${featId || value} (feat name not found)`;
    }
}

export class UsesFormatter implements BaseFormatter {
    format(value: number, _modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        // For now, use default frequency since useType isn't in the current schema
        const frequency = 'day';
        return `${value}/${frequency}`;
    }
}

export class TargetsFormatter implements BaseFormatter {
    format(value: number, _modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        return `${value} ${pluralize('target', value)}`;
    }
}

export class ExtraAttacksFormatter implements BaseFormatter {
    format(value: number, _modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        return `${value} extra ${pluralize('attack', value)}`;
    }
}

export class DistanceFormatter implements BaseFormatter {
    format(value: number, _modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        return `${value} ft.`;
    }
}

export class MovementSpeedFormatter implements BaseFormatter {
    format(value: number, _modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        return `+${value} ft.`;
    }
}

export class DiceFormatter implements BaseFormatter {
    format(value: number, modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
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

export class DiceBonusFormatter implements BaseFormatter {
    format(value: number, modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
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
    format(value: number, modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        const damageTypeId = modifier.appliesToId;
        if (damageTypeId !== null && damageTypeId !== undefined && DAMAGE_TYPES[damageTypeId]) {
            const damageType = DAMAGE_TYPES[damageTypeId].name;
            return `${value}/${damageType}`;
        }
        return `${value}/damage`;
    }
}

export class SpellResistanceFormatter implements BaseFormatter {
    format(value: number, _modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        return `SR ${value}`;
    }
}

export class FeatureChoiceFormatter implements ChoiceFormatter {
    formatChoice(choice: FeatureChoice, metadata?: FormatterMetadata): string {
        // CRITICAL: Always use actual names/abbreviations, never IDs
        const choiceName = this.getChoiceName(choice, metadata);

        switch (choice.behavior) {
            case FeatureChoiceBehavior.Single:
                return `Select ${choiceName}`;
            case FeatureChoiceBehavior.Multiple: {
                const count = choice.pickCount || 1;
                return `Select ${count} ${pluralize(choiceName, count)}`;
            }
            case FeatureChoiceBehavior.Allocation:
                return `Allocate bonus to ${choiceName}`;
            default:
                return `Select ${choiceName}`;
        }
    }

    private getChoiceName(choice: FeatureChoice, metadata?: FormatterMetadata): string {
        switch (choice.type) {
            case FeatureChoiceType.Feat:
                return this.getFeatName(choice, metadata);
            case FeatureChoiceType.Feature:
                return this.getFeatureName(choice, metadata);
            default:
                return choice.label || 'Unknown Choice';
        }
    }

    private getFeatName(choice: FeatureChoice, metadata?: FormatterMetadata): string {
        // Priority 1: Use passed-in feat data (specific feat selected)
        if (choice.feat?.name) {
            return choice.feat.name;
        }

        // Priority 2: Use passed-in name lookup (specific feat selected)
        if (choice.featId && metadata?.featNames) {
            const featName = metadata.featNames.find(f => f.id === choice.featId)?.name;
            if (featName) {
                return featName;
            }
        }

        // Priority 3: Use static data filter type name (filter type is set)
        if (choice.filterType && FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType]) {
            return FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType].name;
        }

        // Priority 4: Use choice label if available
        if (choice.label) {
            return choice.label;
        }

        // Priority 5: Fall back to "Bonus Feat" when no filter type is set
        return 'Bonus Feat';
    }

    private getFeatureName(choice: FeatureChoice, metadata?: FormatterMetadata): string {
        // Priority 1: Use passed-in feature data
        if (choice.feature?.name) {
            return choice.feature.name;
        }

        // Priority 2: Use passed-in name lookup
        if (choice.featureId && metadata?.featureNames) {
            const featureName = metadata.featureNames.find(f => f.id === choice.featureId)?.name;
            if (featureName) {
                return featureName;
            }
        }

        // Priority 3: Use static data filter type name
        if (choice.filterType && FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType]) {
            return FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType].name;
        }

        // Priority 4: Use choice label if available
        if (choice.label) {
            return choice.label;
        }

        // Priority 5: Fall back to generic name or ID
        if (choice.featureId) {
            console.warn(`Unable to resolve feature name for ID: ${choice.featureId}`);
            return `Feature ID: ${choice.featureId}`;
        } else {
            return 'Feature Choice';
        }
    }
}

export class OtherFormatter implements BaseFormatter {
    format(value: number, _modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        return `${value}`;
    }
}

/**
 * Formatter for proficiency effects (FeatureSpecialEffectType.Proficiency)
 * Handles featId/itemId resolution and "all X" vs specific item display
 */
export class ProficiencyEffectFormatter implements EffectFormatter {
    format(effect: FeatureSpecialEffect, _level: number): string {
        const featName = effect.feat?.name || `Feat ${effect.featId}`;
        const itemId = effect.itemId || -1;
        const itemName = effect.item?.name;

        const proficiencyNameMap = {
            "Armor Proficiency (Light)": "light armor",
            "Armor Proficiency (Medium)": "medium armor",
            "Armor Proficiency (Heavy)": "heavy armor",
            "Shield Proficiency": "shields",
            "Tower Shield Proficiency": "tower shields",
            "Simple Weapon Proficiency": "simple weapons",
            "Martial Weapon Proficiency": "martial weapons",
            "Exotic Weapon Proficiency": "exotic weapons",
        };

        if (itemId === -1) {
            const mapping = proficiencyNameMap[featName];
            if (!mapping) return featName; // fallback

            if (
                featName.startsWith("Armor Proficiency") ||
                featName.startsWith("Shield Proficiency")
            ) {
                return mapping;
            } else {
                return `all ${mapping}`;
            }
        } else {
            return itemName?.toLowerCase() || `item ${itemId}`;
        }
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

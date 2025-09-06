import pluralize from 'pluralize';

import type {
    FeatureModifier,
    FeatureChoice,
} from '@shared/schema';
import {
    FeatureChoiceType,
    FeatureChoiceBehavior,
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
} from '@shared/static-data';

import type { BaseFormatter, ChoiceFormatter, FormatterMetadata } from './types';

export class DamageFormatter implements BaseFormatter {
    format(modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        // For now, use default values since diceType and size aren't in the current schema
        const value = modifier.value;
        const diceType = 'd6';
        const sizeSuffix = '';
        return `+${value}${diceType}${sizeSuffix}`;
    }
}

export class DamageBonusFormatter implements BaseFormatter {
    format(modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        const value = modifier.value;
        const baseValue = formatSignedValue(value);

        // Include damage type if appliesToId is present
        if (modifier.appliesToId) {
            return `${baseValue} (${modifier.appliesToId})`;
        }

        return baseValue;
    }
}

export class HealingFormatter implements BaseFormatter {
    format(modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        const value = modifier.value;
        return `${value} hp/day`;
    }
}

export class SignedValueFormatter implements BaseFormatter {
    format(modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        const value = modifier.value;
        const baseValue = formatSignedValue(value);

        // Include bonus type if present
        if (modifier.bonusType !== null && modifier.bonusType !== undefined) {
            const bonusTypeName = FEATURE_BONUS_TYPES[modifier.bonusType]?.name?.toLowerCase() || 'unknown';
            return `${baseValue} (${bonusTypeName})`;
        }

        return baseValue;
    }
}

export class EmptyStringFormatter implements BaseFormatter {
    format(_modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        return '';
    }
}

export class LanguageFormatter implements BaseFormatter {
    format(modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        const value = modifier.value;
        const languageId = modifier.appliesToId;
        if (languageId && LANGUAGE_MAP[languageId]) {
            return LANGUAGE_MAP[languageId].name;
        }
        return `Language ID: ${value}`;
    }
}

export class FeatFormatter implements BaseFormatter {
    format(modifier: FeatureModifier, metadata?: FormatterMetadata): string {
        const value = modifier.value;
        // Handle proficiencies (which have itemId) vs general feats
        if (modifier.itemId !== null && modifier.itemId !== undefined) {
            // This is a proficiency - return the item name
            const itemName = modifier.item?.name;
            if (itemName) {
                return itemName.toLowerCase();
            }
            return `item ${modifier.itemId}`;
        }

        // Handle general feats
        const featId = modifier.appliesToId;
        if (featId && metadata?.featObjects) {
            const feat = metadata.featObjects.find(f => f.id === featId);
            if (feat) {
                return feat.name;
            }
        }
        return `${featId || value} (feat name not found)`;
    }
}

export class UsesFormatter implements BaseFormatter {
    format(modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        const value = modifier.value;
        const frequencyInfo = USES_FREQUENCIES[modifier.appliesToId || 1];
        const frequency = frequencyInfo?.name || 'day';

        return `${value}/${frequency}`;
    }
}

export class TargetsFormatter implements BaseFormatter {
    format(modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        const value = modifier.value;
        return `${value} ${pluralize('target', value)}`;
    }
}

export class ExtraAttacksFormatter implements BaseFormatter {
    format(modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        const value = modifier.value;
        return value.toString();
    }
}

export class DistanceFormatter implements BaseFormatter {
    format(modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        const value = modifier.value;
        return `${value} ft.`;
    }
}

export class MovementSpeedFormatter implements BaseFormatter {
    format(modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        const value = modifier.value;
        return `+${value} ft.`;
    }
}

export class DiceFormatter implements BaseFormatter {
    format(modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
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

export class DiceBonusFormatter implements BaseFormatter {
    format(modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
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
    format(modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        const value = modifier.value;
        const damageTypeId = modifier.appliesToId;
        if (damageTypeId !== null && damageTypeId !== undefined && DAMAGE_TYPES[damageTypeId]) {
            const damageType = DAMAGE_TYPES[damageTypeId].name;
            return `${value}/${damageType}`;
        }
        return `${value}/damage`;
    }
}

export class SpellResistanceFormatter implements BaseFormatter {
    format(modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        const value = modifier.value;
        return value.toString();
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
        if (choice.featId && metadata?.featObjects) {
            const feat = metadata.featObjects.find(f => f.id === choice.featId);
            if (feat) {
                return feat.name;
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
    format(modifier: FeatureModifier, _metadata?: FormatterMetadata): string {

        const value = modifier.value;
        return `${value}`;
    }
}

export class ProficiencyFormatter implements BaseFormatter {
    format(modifier: FeatureModifier, metadata?: FormatterMetadata): string {

        if (modifier.itemId === -1) {
            const featObject = metadata?.featObjects?.find(feat => feat.id === modifier.appliesToId);
            if (featObject?.benefits) {
                const proficiencyBenefit = featObject.benefits.find(benefit => benefit.typeId === FeatBenefitType.PROFICIENCY);
                if (proficiencyBenefit) {
                    return PROFICIENCY_TYPES[proficiencyBenefit.referenceId].allName;
                }
            }
            // Fallback if feat object or proficiency benefit not found
            return 'all items';
        } else if (modifier.itemId && modifier.itemId > 0) {
            // itemId > 0 means a specific item proficiency
            const itemRecord = metadata?.itemNames?.find(item => item.id === modifier.itemId);
            if (itemRecord) {
                return itemRecord.name.toLowerCase();
            }
            // Fallback if item name not found
            return `item ${modifier.itemId}`;
        } else {
            // No specific item, just return a generic message
            return 'proficiency';
        }
    }
}

export class CreatureTypeFormatter implements BaseFormatter {
    format(modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        const value = modifier.value;
        const creatureType = CREATURE_TYPES[modifier.appliesToId];
        if (creatureType) {
            if (value !== 0) {
                const stringValue = formatSignedValue(value);
                return `${creatureType.name}: ${stringValue}`;
            }
            return creatureType.name;
        }
        return `Creature Type ID: ${modifier.appliesToId}`;
    }
}

export class SizeCategoryFormatter implements BaseFormatter {
    format(modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        const value = modifier.value;
        const sizeCategory = SIZE_MAP[modifier.appliesToId];
        if (sizeCategory) {
            if (value !== 0) {
                const stringValue = formatSignedValue(value);
                return `${sizeCategory.name}: ${stringValue}`;
            }
            return sizeCategory.name;
        }
        return `Size Category ID: ${modifier.appliesToId}`;
    }
}

export class DamageTypeFormatter implements BaseFormatter {
    format(modifier: FeatureModifier, _metadata?: FormatterMetadata): string {
        if (modifier.appliesToId !== null && modifier.appliesToId !== undefined) {
            const damageType = DAMAGE_TYPES[modifier.appliesToId];
            if (damageType) {
                return damageType.name;
            }
        }
        return `Damage Type ID: ${modifier.appliesToId}`;
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


import type { BaseFormatter, ChoiceFormatter } from './interfaces';
import type {
  FormatterMetadata,
  DisplayContext
} from '@shared/schema';
import type { FeatureChoiceInQueryResponse } from '@shared/schema';
import {
  FeatureChoiceType,
  FeatureChoiceBehavior
} from '@shared/static-data';
import {
  FEATURE_FEAT_CHOICE_FILTER_TYPES,
  SIZE_MAP,
  ABILITY_MAP,
  SKILL_MAP,
  LANGUAGE_MAP,
  RPG_DICE,
  DAMAGE_TYPES,
  SAVING_THROW_MAP,
  USES_FREQUENCY_ENUM,
  USES_FREQUENCIES
} from '@shared/static-data';
import pluralize from 'pluralize';

export class DamageFormatter implements BaseFormatter {
  format(value: number, metadata?: FormatterMetadata): string {
    const diceType = metadata?.diceType ? RPG_DICE[metadata.diceType]?.name || `d${metadata.diceType}` : 'd6';
    const size = metadata?.size ? SIZE_MAP[metadata.size]?.name || `Size ${metadata.size}` : '';
    const sizeSuffix = size ? ` (${size})` : '';
    return `${value}${diceType}${sizeSuffix}`;
  }
}

export class HealingFormatter implements BaseFormatter {
  format(value: number): string {
    return `${value} hit points per day`;
  }
}

export class SignedValueFormatter implements BaseFormatter {
  format(value: number, metadata?: FormatterMetadata): string {
    return formatSignedValue(value);
  }
}

export class LanguageFormatter implements BaseFormatter {
  format(value: number, metadata?: FormatterMetadata): string {
    const languageId = metadata?.appliesToId;
    if (languageId && LANGUAGE_MAP[languageId]) {
      return LANGUAGE_MAP[languageId].name;
    }
    return `Language ID: ${value}`;
  }
}

export class FeatFormatter implements BaseFormatter {
  format(value: number, metadata?: FormatterMetadata): string {
    const featName = metadata?.featName;
    if (!featName) {
      return `${metadata?.appliesToId || value} (feat name not found)`;
    }
    return featName;
  }
}

export class UsesFormatter implements BaseFormatter {
  format(value: number, metadata?: FormatterMetadata): string {
    const useType = metadata?.useType;
    const frequency = useType ? USES_FREQUENCIES[useType]?.name || 'day' : 'day';
    return `${value}/${frequency}`;
  }
}

export class TargetsFormatter implements BaseFormatter {
  format(value: number): string {
    return `${value} ${pluralize('target', value)}`;
  }
}

export class ExtraAttacksFormatter implements BaseFormatter {
  format(value: number): string {
    return `${value} extra ${pluralize('attack', value)}`;
  }
}

export class DistanceFormatter implements BaseFormatter {
  format(value: number): string {
    return `${value} ft.`;
  }
}

export class DiceFormatter implements BaseFormatter {
  format(value: number, metadata?: FormatterMetadata): string {
    const diceType = metadata?.diceType ? RPG_DICE[metadata.diceType]?.name || `d${metadata.diceType}` : 'd6';
    return `${value}${diceType}`;
  }
}

export class DamageReductionFormatter implements BaseFormatter {
  format(value: number, metadata?: FormatterMetadata): string {
    const damageTypeId = metadata?.appliesToId;
    if (damageTypeId && DAMAGE_TYPES[damageTypeId]) {
      const damageType = DAMAGE_TYPES[damageTypeId].name;
      return `${value}/${damageType}`;
    }
    return `${value}/damage`;
  }
}

export class SpellResistanceFormatter implements BaseFormatter {
  format(value: number): string {
    return `SR ${value}`;
  }
}

export class FeatureChoiceFormatter implements ChoiceFormatter {
  formatChoice(choice: FeatureChoiceInQueryResponse, context?: DisplayContext): string {
    // CRITICAL: Always use actual names/abbreviations, never IDs
    const choiceName = this.getChoiceName(choice, context);

    switch (choice.behavior) {
      case FeatureChoiceBehavior.Single:
        return `Select ${choiceName}`;
      case FeatureChoiceBehavior.Multiple:
        const count = choice.pickCount || 1;
        return `Select ${count} ${pluralize(choiceName, count)}`;
      case FeatureChoiceBehavior.Allocation:
        return `Allocate bonus to ${choiceName}`;
      default:
        return `Select ${choiceName}`;
    }
  }

  private getChoiceName(choice: FeatureChoiceInQueryResponse, context?: DisplayContext): string {
    switch (choice.type) {
      case FeatureChoiceType.Feat:
        return this.getFeatName(choice, context);
      case FeatureChoiceType.Feature:
        return this.getFeatureName(choice, context);
      case FeatureChoiceType.CreatureType:
        return this.getCreatureTypeName(choice, context);
      default:
        return choice.label || 'Unknown Choice';
    }
  }

  private getFeatName(choice: FeatureChoiceInQueryResponse, context?: DisplayContext): string {
    // Priority 1: Use passed-in feat data
    if (choice.feat?.name) {
      return choice.feat.name;
    }

    // Priority 2: Use passed-in name lookup
    if (choice.featId && context?.featNames?.[choice.featId]) {
      return context.featNames[choice.featId];
    }

    // Priority 3: Use static data filter type name
    if (choice.filterType && FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType]) {
      return FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType].name;
    }

    // Priority 4: Fall back to ID with warning
    console.warn(`Unable to resolve feat name for ID: ${choice.featId}`);
    return `Feat ID: ${choice.featId}`;
  }

  private getFeatureName(choice: FeatureChoiceInQueryResponse, context?: DisplayContext): string {
    // Priority 1: Use passed-in feature data
    if (choice.feature?.name) {
      return choice.feature.name;
    }

    // Priority 2: Use passed-in name lookup
    if (choice.featureId && context?.featureNames?.[choice.featureId]) {
      return context.featureNames[choice.featureId];
    }

    // Priority 3: Use static data filter type name
    if (choice.filterType && FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType]) {
      return FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType].name;
    }

    // Priority 4: Fall back to ID with warning
    console.warn(`Unable to resolve feature name for ID: ${choice.featureId}`);
    return `Feature ID: ${choice.featureId}`;
  }

  private getCreatureTypeName(choice: FeatureChoiceInQueryResponse, context?: DisplayContext): string {
    // Priority 1: Use static data filter type name
    if (choice.filterType && FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType]) {
      return FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType].name;
    }

    // Priority 2: Fall back to generic name
    return 'Creature Type';
  }
}









export class OtherFormatter implements BaseFormatter {
  format(value: number, metadata?: FormatterMetadata): string {
    return `${value}`;
  }
}

/**
 * Formatter for proficiency effects (FeatureSpecialEffectType.Proficiency)
 * Handles featId/itemId resolution and "all X" vs specific item display
 */
export class ProficiencyEffectFormatter {
  format(featName: string, itemId: number, itemName?: string): string {
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

import type { FeatureEntityCondition } from '@shared/schema';
import {
    FEATURE_ENTITY_CONDITION_TYPES,
    SIZE_MAP,
    SPELL_SCHOOL_MAP,
    ATTACK_TYPES,
    CREATURE_TYPES,
    SOURCE_TYPES,
    TARGET_TYPES,
    FeatureEntityConditionType
} from '@shared/static-data';

import type { ConditionFormatter } from './types';

/**
 * Formats condition values for display
 */
export function formatConditionValue(conditionType: number, conditionValue: number): string {
    switch (conditionType) {
        case FeatureEntityConditionType.character_size:
            return SIZE_MAP[conditionValue]?.name || `Size ${conditionValue}`;
        case FeatureEntityConditionType.spell_school:
            return SPELL_SCHOOL_MAP[conditionValue]?.name || `Spell School ${conditionValue}`;
        case FeatureEntityConditionType.attack_type:
            return ATTACK_TYPES[conditionValue]?.name || `Attack Type ${conditionValue}`;
        case FeatureEntityConditionType.creature_type:
            return CREATURE_TYPES[conditionValue]?.name || `Creature Type ${conditionValue}`;
        case FeatureEntityConditionType.source:
            return SOURCE_TYPES[conditionValue]?.name || `Source ${conditionValue}`;
        case FeatureEntityConditionType.target:
            return TARGET_TYPES[conditionValue]?.name || `Target ${conditionValue}`;
        default:
            return `Value ${conditionValue}`;
    }
}

/**
 * Formats condition type names for display
 */
export function formatConditionType(conditionType: number): string {
    const conditionTypeInfo = FEATURE_ENTITY_CONDITION_TYPES[conditionType];
    return conditionTypeInfo.displayName !== undefined && conditionTypeInfo.displayName !== null
        ? conditionTypeInfo.displayName
        : conditionTypeInfo.name;
}

/**
 * Formats a single condition for display
 */
export function formatSingleCondition(condition: FeatureEntityCondition): string {
    const conditionTypeName = formatConditionType(condition.conditionType);
    const conditionValueName = formatConditionValue(condition.conditionType, condition.conditionValue);

    // For source conditions, just show the value name (e.g., "Traps" not "Source Traps")
    if (condition.conditionType === FeatureEntityConditionType.source) {
        return conditionValueName;
    }

    return `${conditionTypeName} ${conditionValueName}`;
}

/**
 * Formats all conditions for a modifier
 */
export function formatModifierConditions(entity: { conditions?: FeatureEntityCondition[] }): string {
    if (!entity.conditions || entity.conditions.length === 0) {
        return '';
    }

    const conditionStrings = entity.conditions.map(formatSingleCondition);
    return conditionStrings.join(', ');
}

/**
 * Specific formatter for spell school conditions
 */
export class SpellSchoolConditionFormatter implements ConditionFormatter {
    formatCondition(condition: FeatureEntityCondition, formattedValue: string): string {
        const spellSchoolName = formatConditionValue(condition.conditionType, condition.conditionValue);
        return `${formattedValue} vs ${spellSchoolName}`;
    }
}

/**
 * Specific formatter for creature type conditions
 */
export class CreatureTypeConditionFormatter implements ConditionFormatter {
    formatCondition(condition: FeatureEntityCondition, formattedValue: string): string {
        const creatureTypeName = formatConditionValue(condition.conditionType, condition.conditionValue);
        return `${formattedValue} vs ${creatureTypeName}`;
    }
}

/**
 * Specific formatter for source conditions
 */
export class SourceConditionFormatter implements ConditionFormatter {
    formatCondition(condition: FeatureEntityCondition, formattedValue: string): string {
        const sourceName = formatConditionValue(condition.conditionType, condition.conditionValue);
        return `${formattedValue} vs ${sourceName}`;
    }
}

/**
 * Specific formatter for trigger conditions
 */
export class TriggerConditionFormatter implements ConditionFormatter {
    formatCondition(condition: FeatureEntityCondition, formattedValue: string): string {
        const triggerName = formatConditionValue(condition.conditionType, condition.conditionValue);
        return `${triggerName}: ${formattedValue}`;
    }
}

/**
 * Specific formatter for attack type conditions
 */
export class OtherAttackTypeConditionFormatter implements ConditionFormatter {
    formatCondition(condition: FeatureEntityCondition, formattedValue: string): string {
        const attackTypeName = formatConditionValue(condition.conditionType, condition.conditionValue);
        return `${attackTypeName} treated as ${formattedValue}`;
    }
}

export class QuantityAttackTypeConditionFormatter implements ConditionFormatter {
    formatCondition(condition: FeatureEntityCondition, formattedValue: string): string {
        const attackTypeName = formatConditionValue(condition.conditionType, condition.conditionValue);
        return `${attackTypeName} ${formattedValue}`;
    }
}

/**
 * Specific formatter for character size conditions
 */
export class CharacterSizeConditionFormatter implements ConditionFormatter {
    formatCondition(condition: FeatureEntityCondition, formattedValue: string): string {
        const sizeName = formatConditionValue(condition.conditionType, condition.conditionValue);
        return `${sizeName}: ${formattedValue}`;
    }
}

/**
 * Specific formatter for target conditions
 */
export class TargetConditionFormatter implements ConditionFormatter {
    formatCondition(condition: FeatureEntityCondition, formattedValue: string): string {
        const targetName = formatConditionValue(condition.conditionType, condition.conditionValue);
        return `${formattedValue} (${targetName})`;
    }
}

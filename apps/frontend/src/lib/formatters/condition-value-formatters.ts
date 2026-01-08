import {
    MATERIAL_TYPES,
    CONDITION_SOURCE_TYPES,
    SIZE_MAP,
    CREATURE_TYPES,
    SPELL_SCHOOL_MAP,
    ATTACK_TYPES,
    TARGET_TYPES,
    ENVIRONMENT_TYPES,
    LIGHTING_CONDITION_TYPES,
} from '@shared/static-data';

import type { ConditionValueFormatter } from './types';

/**
 * Material value formatter
 */
export class MaterialValueFormatter implements ConditionValueFormatter {
    format(conditionValue: number): string {
        return MATERIAL_TYPES[conditionValue]?.name || '';
    }
}

/**
 * Source value formatter
 */
export class SourceValueFormatter implements ConditionValueFormatter {
    format(conditionValue: number): string {
        return CONDITION_SOURCE_TYPES[conditionValue]?.name || '';
    }
}

/**
 * Size value formatter
 */
export class SizeValueFormatter implements ConditionValueFormatter {
    format(conditionValue: number): string {
        return SIZE_MAP[conditionValue]?.name || '';
    }
}

/**
 * Creature type value formatter
 */
export class CreatureTypeValueFormatter implements ConditionValueFormatter {
    format(conditionValue: number): string {
        return CREATURE_TYPES[conditionValue]?.name || '';
    }
}

/**
 * Spell school value formatter
 */
export class SpellSchoolValueFormatter implements ConditionValueFormatter {
    format(conditionValue: number): string {
        return SPELL_SCHOOL_MAP[conditionValue]?.name || '';
    }
}

/**
 * Attack type value formatter
 */
export class AttackTypeValueFormatter implements ConditionValueFormatter {
    format(conditionValue: number): string {
        return ATTACK_TYPES[conditionValue]?.name || '';
    }
}

/**
 * Target value formatter
 */
export class TargetValueFormatter implements ConditionValueFormatter {
    format(conditionValue: number): string {
        return TARGET_TYPES[conditionValue]?.name || '';
    }
}

/**
 * Environment value formatter
 */
export class EnvironmentValueFormatter implements ConditionValueFormatter {
    format(conditionValue: number): string {
        return ENVIRONMENT_TYPES[conditionValue]?.name || '';
    }
}

/**
 * Lighting value formatter
 */
export class LightingValueFormatter implements ConditionValueFormatter {
    format(conditionValue: number): string {
        return LIGHTING_CONDITION_TYPES[conditionValue]?.name || '';
    }
}

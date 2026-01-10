import { FeatureEntityConditionType } from '@shared/static-data';

import {
    MaterialValueFormatter,
    SourceValueFormatter,
    SizeValueFormatter,
    CreatureTypeValueFormatter,
    SpellSchoolValueFormatter,
    AttackTypeValueFormatter,
    TargetValueFormatter,
    EnvironmentValueFormatter,
    LightingValueFormatter,
    SpecialValueFormatter
} from './condition-value-formatters';
import type { ConditionValueFormatter } from './types';

/**
 * Registry for condition value formatters
 */
class ConditionValueFormatterRegistry {
    private formatters = new Map<FeatureEntityConditionType, ConditionValueFormatter>();

    constructor() {
        this.initializeDefaultFormatters();
    }

    /**
     * Register a formatter for a specific condition type
     */
    registerFormatter(conditionType: FeatureEntityConditionType, formatter: ConditionValueFormatter): void {
        this.formatters.set(conditionType, formatter);
    }

    /**
     * Get a formatter for a specific condition type
     */
    getFormatter(conditionType: FeatureEntityConditionType): ConditionValueFormatter | undefined {
        return this.formatters.get(conditionType);
    }

    /**
     * Initialize default formatters for all condition types
     */
    private initializeDefaultFormatters(): void {
        this.registerFormatter(FeatureEntityConditionType.material, new MaterialValueFormatter());
        this.registerFormatter(FeatureEntityConditionType.source, new SourceValueFormatter());
        this.registerFormatter(FeatureEntityConditionType.character_size, new SizeValueFormatter());
        this.registerFormatter(FeatureEntityConditionType.creature_type, new CreatureTypeValueFormatter());
        this.registerFormatter(FeatureEntityConditionType.spell_school, new SpellSchoolValueFormatter());
        this.registerFormatter(FeatureEntityConditionType.attack_type, new AttackTypeValueFormatter());
        this.registerFormatter(FeatureEntityConditionType.target, new TargetValueFormatter());
        this.registerFormatter(FeatureEntityConditionType.environment, new EnvironmentValueFormatter());
        this.registerFormatter(FeatureEntityConditionType.lighting, new LightingValueFormatter());
        this.registerFormatter(FeatureEntityConditionType.special, new SpecialValueFormatter());
    }
}

export const conditionValueFormatterRegistry = new ConditionValueFormatterRegistry();

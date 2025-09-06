import type { FeatureModifierCondition } from '@shared/schema';
import { FeatureModifierConditionType } from '@shared/static-data';

import {
    SpellSchoolConditionFormatter,
    CreatureTypeConditionFormatter,
    SourceConditionFormatter,
    TriggerConditionFormatter,
    AttackTypeConditionFormatter,
    CharacterSizeConditionFormatter
} from './condition-formatters';
import type { ConditionFormatter } from './types';

// Unified condition formatter registry interface
interface IConditionFormatterRegistry {
    // Core unified method
    registerConditionFormatter(
        conditionType: FeatureModifierConditionType,
        formatter: ConditionFormatter
    ): void;

    // Core unified getter method
    getConditionFormatter(
        conditionType: FeatureModifierConditionType
    ): ConditionFormatter | undefined;

    // Main formatting method
    formatCondition(
        condition: FeatureModifierCondition,
        formattedValue: string
    ): string;
}

export class ConditionFormatterRegistry implements IConditionFormatterRegistry {
    private formatters = new Map<FeatureModifierConditionType, ConditionFormatter>();

    constructor() {
        this.initializeDefaultFormatters();
    }

    // Core unified registration method
    registerConditionFormatter(
        conditionType: FeatureModifierConditionType,
        formatter: ConditionFormatter
    ): void {
        this.formatters.set(conditionType, formatter);
    }

    // Core unified getter method
    getConditionFormatter(
        conditionType: FeatureModifierConditionType
    ): ConditionFormatter | undefined {
        return this.formatters.get(conditionType);
    }

    // Main formatting method
    formatCondition(
        condition: FeatureModifierCondition,
        formattedValue: string
    ): string {
        const formatter = this.getConditionFormatter(condition.conditionType);
        if (formatter) {
            return formatter.formatCondition(condition, formattedValue);
        }

        // Fallback for unknown condition types
        return `${formattedValue} vs ${condition.conditionValue}`;
    }

    private initializeDefaultFormatters(): void {
        // Create formatter instances
        const spellSchoolConditionFormatter = new SpellSchoolConditionFormatter();
        const creatureTypeConditionFormatter = new CreatureTypeConditionFormatter();
        const sourceConditionFormatter = new SourceConditionFormatter();
        const triggerConditionFormatter = new TriggerConditionFormatter();
        const attackTypeConditionFormatter = new AttackTypeConditionFormatter();
        const characterSizeConditionFormatter = new CharacterSizeConditionFormatter();

        // Register formatters for each condition type
        this.registerConditionFormatter(FeatureModifierConditionType.spell_school, spellSchoolConditionFormatter);
        this.registerConditionFormatter(FeatureModifierConditionType.creature_type, creatureTypeConditionFormatter);
        this.registerConditionFormatter(FeatureModifierConditionType.source, sourceConditionFormatter);
        this.registerConditionFormatter(FeatureModifierConditionType.trigger, triggerConditionFormatter);
        this.registerConditionFormatter(FeatureModifierConditionType.attack_type, attackTypeConditionFormatter);
        this.registerConditionFormatter(FeatureModifierConditionType.character_size, characterSizeConditionFormatter);
    }
}

// Export a singleton instance
export const conditionFormatterRegistry = new ConditionFormatterRegistry();

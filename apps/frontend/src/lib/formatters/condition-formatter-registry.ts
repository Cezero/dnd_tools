import type { FeatureEntityCondition } from '@shared/schema';
import { FeatureEntityConditionType, EntityType } from '@shared/static-data';

import {
    SpellSchoolConditionFormatter,
    CreatureTypeConditionFormatter,
    SourceConditionFormatter,
    TriggerConditionFormatter,
    OtherAttackTypeConditionFormatter,
    QuantityAttackTypeConditionFormatter,
    CharacterSizeConditionFormatter,
    TargetConditionFormatter,
} from './condition-formatters';
import type { ConditionFormatter } from './types';

// Unified condition formatter registry interface
interface IConditionFormatterRegistry {
    // Core unified method
    registerConditionFormatter(
        conditionType: FeatureEntityConditionType,
        entityType: EntityType,
        formatter: ConditionFormatter
    ): void;

    // Core unified getter method
    getConditionFormatter(
        conditionType: FeatureEntityConditionType,
        entityType: EntityType
    ): ConditionFormatter | undefined;

    // Main formatting method
    formatCondition(
        condition: FeatureEntityCondition,
        formattedValue: string,
        entityType: EntityType
    ): string;
}

export class ConditionFormatterRegistry implements IConditionFormatterRegistry {
    private formatters = new Map<string, ConditionFormatter>();

    constructor() {
        this.initializeDefaultFormatters();
    }

    // Core unified registration method
    registerConditionFormatter(
        conditionType: FeatureEntityConditionType,
        entityType: EntityType,
        formatter: ConditionFormatter
    ): void {
        const key = this.generateKey(conditionType, entityType);
        this.formatters.set(key, formatter);
    }

    // Core unified getter method
    getConditionFormatter(
        conditionType: FeatureEntityConditionType,
        entityType: EntityType
    ): ConditionFormatter | undefined {
        const key = this.generateKey(conditionType, entityType);
        return this.formatters.get(key);
    }

    // Main formatting method
    formatCondition(
        condition: FeatureEntityCondition,
        formattedValue: string,
        entityType: EntityType
    ): string {
        const formatter = this.getConditionFormatter(condition.conditionType, entityType);
        if (formatter) {
            return formatter.formatCondition(condition, formattedValue);
        }

        // Fallback for unknown condition types
        return `${formattedValue} vs ${condition.conditionValue}`;
    }

    // Generate key for formatter lookup
    private generateKey(conditionType: FeatureEntityConditionType, entityType: EntityType): string {
        return `${entityType}-${conditionType}`;
    }

    // Convenience wrapper methods for common registration patterns
    registerBonusFormatter(conditionType: FeatureEntityConditionType, formatter: ConditionFormatter): void {
        this.registerConditionFormatter(conditionType, EntityType.Bonus, formatter);
    }

    registerQuantityFormatter(conditionType: FeatureEntityConditionType, formatter: ConditionFormatter): void {
        this.registerConditionFormatter(conditionType, EntityType.Quantity, formatter);
    }

    registerReplacementFormatter(conditionType: FeatureEntityConditionType, formatter: ConditionFormatter): void {
        this.registerConditionFormatter(conditionType, EntityType.Replacement, formatter);
    }

    registerOtherFormatter(conditionType: FeatureEntityConditionType, formatter: ConditionFormatter): void {
        this.registerConditionFormatter(conditionType, EntityType.Other, formatter);
    }

    registerProficiencyFormatter(conditionType: FeatureEntityConditionType, formatter: ConditionFormatter): void {
        this.registerConditionFormatter(conditionType, EntityType.Proficiency, formatter);
    }

    registerChoiceFormatter(conditionType: FeatureEntityConditionType, formatter: ConditionFormatter): void {
        this.registerConditionFormatter(conditionType, EntityType.Choice, formatter);
    }

    registerAllocationFormatter(conditionType: FeatureEntityConditionType, formatter: ConditionFormatter): void {
        this.registerConditionFormatter(conditionType, EntityType.Allocation, formatter);
    }

    private initializeDefaultFormatters(): void {
        // Create formatter instances
        const spellSchoolConditionFormatter = new SpellSchoolConditionFormatter();
        const creatureTypeConditionFormatter = new CreatureTypeConditionFormatter();
        const sourceConditionFormatter = new SourceConditionFormatter();
        const triggerConditionFormatter = new TriggerConditionFormatter();
        const otherAttackTypeConditionFormatter = new OtherAttackTypeConditionFormatter();
        const quantityAttackTypeConditionFormatter = new QuantityAttackTypeConditionFormatter();
        const characterSizeConditionFormatter = new CharacterSizeConditionFormatter();
        const targetConditionFormatter = new TargetConditionFormatter();

        // Register formatters for each condition type and entity type combination
        // Using convenience wrapper methods for explicit registrations

        // Bonus formatters
        this.registerBonusFormatter(FeatureEntityConditionType.spell_school, spellSchoolConditionFormatter);
        this.registerBonusFormatter(FeatureEntityConditionType.creature_type, creatureTypeConditionFormatter);
        this.registerBonusFormatter(FeatureEntityConditionType.source, sourceConditionFormatter);
        this.registerBonusFormatter(FeatureEntityConditionType.trigger, triggerConditionFormatter);
        this.registerBonusFormatter(FeatureEntityConditionType.attack_type, otherAttackTypeConditionFormatter);
        this.registerBonusFormatter(FeatureEntityConditionType.character_size, characterSizeConditionFormatter);
        this.registerBonusFormatter(FeatureEntityConditionType.target, targetConditionFormatter);

        // Quantity formatters
        this.registerQuantityFormatter(FeatureEntityConditionType.spell_school, spellSchoolConditionFormatter);
        this.registerQuantityFormatter(FeatureEntityConditionType.creature_type, creatureTypeConditionFormatter);
        this.registerQuantityFormatter(FeatureEntityConditionType.source, sourceConditionFormatter);
        this.registerQuantityFormatter(FeatureEntityConditionType.trigger, triggerConditionFormatter);
        this.registerQuantityFormatter(FeatureEntityConditionType.attack_type, quantityAttackTypeConditionFormatter);
        this.registerQuantityFormatter(FeatureEntityConditionType.character_size, characterSizeConditionFormatter);
        this.registerQuantityFormatter(FeatureEntityConditionType.target, targetConditionFormatter);

        // Other formatters
        this.registerOtherFormatter(FeatureEntityConditionType.spell_school, spellSchoolConditionFormatter);
        this.registerOtherFormatter(FeatureEntityConditionType.creature_type, creatureTypeConditionFormatter);
        this.registerOtherFormatter(FeatureEntityConditionType.source, sourceConditionFormatter);
        this.registerOtherFormatter(FeatureEntityConditionType.trigger, triggerConditionFormatter);
        this.registerOtherFormatter(FeatureEntityConditionType.attack_type, otherAttackTypeConditionFormatter);
        this.registerOtherFormatter(FeatureEntityConditionType.character_size, characterSizeConditionFormatter);
        this.registerOtherFormatter(FeatureEntityConditionType.target, targetConditionFormatter);
    }
}

// Export a singleton instance
export const conditionFormatterRegistry = new ConditionFormatterRegistry();

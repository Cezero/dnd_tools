import type { FeatureSpecialEffect } from '@shared/schema';
import { ModifierAppliesToType, FeatureChoiceType, ModifierType, FeatureSpecialEffectType, FeatureType } from '@shared/static-data';

import {
    DamageFormatter,
    HealingFormatter,
    SignedValueFormatter,
    SkillFormatter,
    FeatureChoiceFormatter,
    LanguageFormatter,
    FeatFormatter,
    UsesFormatter,
    TargetsFormatter,
    ExtraAttacksFormatter,
    DistanceFormatter,
    MovementSpeedFormatter,
    DiceFormatter,
    DiceBonusFormatter,
    DamageReductionFormatter,
    SpellResistanceFormatter,
    OtherFormatter,
    DamageBonusFormatter,
    ProficiencyEffectFormatter
} from './pure-formatters';
import type { BaseFormatter, ChoiceFormatter } from './types';

// Effect formatter interface (to be implemented)
interface EffectFormatter {
    format(effect: FeatureSpecialEffect, level: number): string;
}

// Unified formatter registry interface
interface IFormatterRegistry {
    // Core unified method
    registerFormatter(
        featureType: FeatureType,
        featureSubType: ModifierType | FeatureSpecialEffectType | FeatureChoiceType,
        formatter: BaseFormatter | EffectFormatter | ChoiceFormatter,
        subTypeId?: ModifierAppliesToType
    ): void;

    // Unified getter method
    getFormatter(
        featureType: FeatureType,
        featureSubType: ModifierType | FeatureSpecialEffectType | FeatureChoiceType,
        subTypeId?: ModifierAppliesToType
    ): BaseFormatter | EffectFormatter | ChoiceFormatter | undefined;
}

export class FormatterRegistry implements IFormatterRegistry {
    // Use hierarchical keys: `${featureType}:${featureSubType}:${subTypeId}`
    private formatters = new Map<string, BaseFormatter | EffectFormatter | ChoiceFormatter>();

    constructor() {
        this.initializeDefaultFormatters();
    }

    // Core unified registration method
    registerFormatter(
        featureType: FeatureType,
        featureSubType: ModifierType | FeatureSpecialEffectType | FeatureChoiceType,
        formatter: BaseFormatter | EffectFormatter | ChoiceFormatter,
        subTypeId?: ModifierAppliesToType
    ): void {
        const key = this.generateKey(featureType, featureSubType, subTypeId);
        this.formatters.set(key, formatter);
    }

    // Core unified getter method
    getFormatter(
        featureType: FeatureType,
        featureSubType: ModifierType | FeatureSpecialEffectType | FeatureChoiceType,
        subTypeId?: ModifierAppliesToType
    ): BaseFormatter | EffectFormatter | ChoiceFormatter | undefined {
        const key = this.generateKey(featureType, featureSubType, subTypeId);
        return this.formatters.get(key);
    }

    // Convenience wrapper methods for common registration patterns

    // Modifier convenience wrappers
    registerBonusFormatter(appliesToType: ModifierAppliesToType, formatter: BaseFormatter): void {
        this.registerFormatter(FeatureType.Modifier, ModifierType.Bonus, formatter, appliesToType);
    }

    registerQuantityFormatter(appliesToType: ModifierAppliesToType, formatter: BaseFormatter): void {
        this.registerFormatter(FeatureType.Modifier, ModifierType.Quantity, formatter, appliesToType);
    }

    registerReplacementFormatter(appliesToType: ModifierAppliesToType, formatter: BaseFormatter): void {
        this.registerFormatter(FeatureType.Modifier, ModifierType.Replacement, formatter, appliesToType);
    }

    registerOtherFormatter(appliesToType: ModifierAppliesToType, formatter: BaseFormatter): void {
        this.registerFormatter(FeatureType.Modifier, ModifierType.Other, formatter, appliesToType);
    }

    // Effect convenience wrapper
    registerEffectFormatter(effectType: FeatureSpecialEffectType, formatter: EffectFormatter): void {
        this.registerFormatter(FeatureType.Effect, effectType, formatter);
    }

    // Choice convenience wrapper
    registerChoiceFormatter(choiceType: FeatureChoiceType, formatter: ChoiceFormatter): void {
        this.registerFormatter(FeatureType.Choice, choiceType, formatter);
    }

    // Generate hierarchical key for formatter storage
    private generateKey(
        featureType: FeatureType,
        featureSubType: ModifierType | FeatureSpecialEffectType | FeatureChoiceType,
        subTypeId?: ModifierAppliesToType
    ): string {
        if (subTypeId !== undefined) {
            return `${featureType}:${featureSubType}:${subTypeId}`;
        }
        return `${featureType}:${featureSubType}`;
    }



    private initializeDefaultFormatters(): void {
        // Create formatter instances
        const damageFormatter = new DamageFormatter();
        const healingFormatter = new HealingFormatter();
        const signedValueFormatter = new SignedValueFormatter();
        const _skillFormatter = new SkillFormatter();
        const languageFormatter = new LanguageFormatter();
        const featFormatter = new FeatFormatter();
        const usesFormatter = new UsesFormatter();
        const targetsFormatter = new TargetsFormatter();
        const extraAttacksFormatter = new ExtraAttacksFormatter();
        const distanceFormatter = new DistanceFormatter();
        const movementSpeedFormatter = new MovementSpeedFormatter();
        const diceFormatter = new DiceFormatter();
        const diceBonusFormatter = new DiceBonusFormatter();
        const damageReductionFormatter = new DamageReductionFormatter();
        const spellResistanceFormatter = new SpellResistanceFormatter();
        const otherFormatter = new OtherFormatter();
        const damageBonusFormatter = new DamageBonusFormatter();

        // Register all modifier combinations using convenience wrappers

        // Bonus-compatible types (using convenience wrapper)
        this.registerBonusFormatter(ModifierAppliesToType.Ability, signedValueFormatter);
        this.registerBonusFormatter(ModifierAppliesToType.Skill, signedValueFormatter);
        this.registerBonusFormatter(ModifierAppliesToType.SavingThrow, signedValueFormatter);
        this.registerBonusFormatter(ModifierAppliesToType.AC, signedValueFormatter);
        this.registerBonusFormatter(ModifierAppliesToType.Attack, signedValueFormatter);
        this.registerBonusFormatter(ModifierAppliesToType.Damage, signedValueFormatter);
        this.registerBonusFormatter(ModifierAppliesToType.DamageReduction, damageReductionFormatter);
        this.registerBonusFormatter(ModifierAppliesToType.Initiative, signedValueFormatter);
        this.registerBonusFormatter(ModifierAppliesToType.Damage, damageBonusFormatter);

        // Quantity-compatible types
        this.registerQuantityFormatter(ModifierAppliesToType.MovementSpeed, movementSpeedFormatter);
        this.registerQuantityFormatter(ModifierAppliesToType.HitDice, diceBonusFormatter);
        this.registerQuantityFormatter(ModifierAppliesToType.Uses, usesFormatter);
        this.registerQuantityFormatter(ModifierAppliesToType.Targets, targetsFormatter);
        this.registerQuantityFormatter(ModifierAppliesToType.Distance, distanceFormatter);
        this.registerQuantityFormatter(ModifierAppliesToType.ExtraAttacks, extraAttacksFormatter);
        this.registerQuantityFormatter(ModifierAppliesToType.Damage, damageFormatter);
        this.registerQuantityFormatter(ModifierAppliesToType.Healing, healingFormatter);
        this.registerQuantityFormatter(ModifierAppliesToType.SpellResistance, spellResistanceFormatter);

        // Replacement-compatible types
        this.registerReplacementFormatter(ModifierAppliesToType.Damage, diceFormatter);
        this.registerReplacementFormatter(ModifierAppliesToType.UnarmedDamage, diceFormatter);
        this.registerReplacementFormatter(ModifierAppliesToType.MovementSpeed, movementSpeedFormatter);
        this.registerReplacementFormatter(ModifierAppliesToType.Ability, signedValueFormatter);

        // Other-compatible types
        this.registerOtherFormatter(ModifierAppliesToType.Other, otherFormatter);
        this.registerOtherFormatter(ModifierAppliesToType.BonusLanguage, languageFormatter);
        this.registerOtherFormatter(ModifierAppliesToType.AutomaticLanguage, languageFormatter);
        this.registerOtherFormatter(ModifierAppliesToType.Feat, featFormatter);

        // Register choice formatters using convenience wrapper
        const choiceFormatter = new FeatureChoiceFormatter();
        this.registerChoiceFormatter(FeatureChoiceType.Feat, choiceFormatter);
        this.registerChoiceFormatter(FeatureChoiceType.Feature, choiceFormatter);
        this.registerChoiceFormatter(FeatureChoiceType.CreatureType, choiceFormatter);

        // Register effect formatters
        this.registerEffectFormatter(FeatureSpecialEffectType.Proficiency, new ProficiencyEffectFormatter());
        // TODO: Register other effect formatters once implementations are created
        // this.registerEffectFormatter(FeatureSpecialEffectType.Other, new OtherEffectFormatter());
        // this.registerEffectFormatter(FeatureSpecialEffectType.FavoredEnemy, new FavoredEnemyEffectFormatter());
        // this.registerEffectFormatter(FeatureSpecialEffectType.ConditionalUpgrade, new ConditionalUpgradeEffectFormatter());
        // this.registerEffectFormatter(FeatureSpecialEffectType.TurnUndead, new TurnUndeadEffectFormatter());
        // this.registerEffectFormatter(FeatureSpecialEffectType.WildShapeForm, new WildShapeFormEffectFormatter());
        // this.registerEffectFormatter(FeatureSpecialEffectType.WildShapeSize, new WildShapeSizeEffectFormatter());
        // this.registerEffectFormatter(FeatureSpecialEffectType.WeaponFamiliarity, new WeaponFamiliarityEffectFormatter());
    }
}

// Export a singleton instance
export const formatterRegistry = new FormatterRegistry();

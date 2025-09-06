import { ModifierAppliesToType, FeatureChoiceType, ModifierType, FeatureType, SpecialFeatureId } from '@shared/static-data';

import {
    DamageFormatter,
    HealingFormatter,
    SignedValueFormatter,
    EmptyStringFormatter,
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
    ProficiencyFormatter,
    CreatureTypeFormatter,
    SizeCategoryFormatter,
    DamageTypeFormatter
} from './pure-formatters';
import { generateKey } from './registry-utils';
import type { BaseFormatter, ChoiceFormatter } from './types';

// Unified formatter registry interface
interface IFormatterRegistry {
    // Core unified method
    registerFormatter(
        featureType: FeatureType,
        featureSubType: ModifierType | FeatureChoiceType,
        formatter: BaseFormatter | ChoiceFormatter,
        subTypeId?: ModifierAppliesToType,
        featureId?: number
    ): void;

    // Unified getter method
    getFormatter(
        featureType: FeatureType,
        featureSubType: ModifierType | FeatureChoiceType,
        subTypeId?: ModifierAppliesToType,
        featureId?: number
    ): BaseFormatter | ChoiceFormatter | undefined;
}

export class FormatterRegistry implements IFormatterRegistry {
    private formatters = new Map<string, BaseFormatter | ChoiceFormatter>();

    constructor() {
        this.initializeDefaultFormatters();
    }

    // Core unified registration method
    registerFormatter(
        featureType: FeatureType,
        featureSubType: ModifierType | FeatureChoiceType,
        formatter: BaseFormatter | ChoiceFormatter,
        subTypeId?: ModifierAppliesToType,
        featureId?: SpecialFeatureId
    ): void {
        const key = generateKey(featureType, featureSubType, subTypeId, featureId);
        this.formatters.set(key, formatter);
    }

    // Core unified getter method
    getFormatter(
        featureType: FeatureType,
        featureSubType: ModifierType | FeatureChoiceType,
        subTypeId?: ModifierAppliesToType,
        featureId?: number
    ): BaseFormatter | ChoiceFormatter | undefined {
        const key = generateKey(featureType, featureSubType, subTypeId, featureId);
        return this.formatters.get(key);
    }

    // Convenience wrapper methods for common registration patterns
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

    registerProficiencyFormatter(appliesToType: ModifierAppliesToType, formatter: BaseFormatter): void {
        this.registerFormatter(FeatureType.Modifier, ModifierType.Proficiency, formatter, appliesToType);
    }

    // Choice convenience wrapper
    registerChoiceFormatter(choiceType: FeatureChoiceType, formatter: ChoiceFormatter): void {
        this.registerFormatter(FeatureType.Choice, choiceType, formatter);
    }

    private initializeDefaultFormatters(): void {
        // Create formatter instances
        const damageFormatter = new DamageFormatter();
        const healingFormatter = new HealingFormatter();
        const signedValueFormatter = new SignedValueFormatter();
        const emptyStringFormatter = new EmptyStringFormatter();
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
        const proficiencyFormatter = new ProficiencyFormatter();
        const creatureTypeFormatter = new CreatureTypeFormatter();
        const sizeCategoryFormatter = new SizeCategoryFormatter();
        const damageTypeFormatter = new DamageTypeFormatter();

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
        this.registerOtherFormatter(ModifierAppliesToType.Skill, emptyStringFormatter);
        this.registerOtherFormatter(ModifierAppliesToType.CreatureType, creatureTypeFormatter);
        this.registerOtherFormatter(ModifierAppliesToType.SizeCategory, sizeCategoryFormatter);
        this.registerOtherFormatter(ModifierAppliesToType.DamageType, damageTypeFormatter);

        // Proficiency-compatible types
        this.registerProficiencyFormatter(ModifierAppliesToType.Feat, proficiencyFormatter);

        // Skill formatter is already registered above via registerOtherFormatter

        // Register choice formatters using convenience wrapper
        const choiceFormatter = new FeatureChoiceFormatter();
        this.registerChoiceFormatter(FeatureChoiceType.Feat, choiceFormatter);
        this.registerChoiceFormatter(FeatureChoiceType.Feature, choiceFormatter);
        this.registerChoiceFormatter(FeatureChoiceType.CreatureType, choiceFormatter);
    }
}

// Export a singleton instance
export const formatterRegistry = new FormatterRegistry();

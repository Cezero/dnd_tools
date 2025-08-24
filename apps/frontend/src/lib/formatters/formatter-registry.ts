import type { BaseFormatter, ChoiceFormatter } from './interfaces';
import { ModifierAppliesToType, FeatureChoiceType } from '@shared/static-data';
import {
  DamageFormatter,
  HealingFormatter,
  SignedValueFormatter,
  FeatureChoiceFormatter,
  LanguageFormatter,
  FeatFormatter,
  UsesFormatter,
  TargetsFormatter,
  ExtraAttacksFormatter,
  DistanceFormatter,
  DiceFormatter,
  DamageReductionFormatter,
  SpellResistanceFormatter,
  OtherFormatter
} from './pure-formatters';

export class FormatterRegistry {
  private formatters = new Map<ModifierAppliesToType, BaseFormatter>();
  private choiceFormatters = new Map<FeatureChoiceType, ChoiceFormatter>();

  constructor() {
    this.initializeDefaultFormatters();
  }

  register(type: ModifierAppliesToType, formatter: BaseFormatter): void {
    this.formatters.set(type, formatter);
  }

  registerChoice(type: FeatureChoiceType, formatter: ChoiceFormatter): void {
    this.choiceFormatters.set(type, formatter);
  }

  getFormatter(type: ModifierAppliesToType): BaseFormatter | undefined {
    return this.formatters.get(type);
  }

  getChoiceFormatter(type: FeatureChoiceType): ChoiceFormatter | undefined {
    return this.choiceFormatters.get(type);
  }

  private initializeDefaultFormatters(): void {
    // Create formatter instances
    const damageFormatter = new DamageFormatter();
    const healingFormatter = new HealingFormatter();
    const signedValueFormatter = new SignedValueFormatter();
    const languageFormatter = new LanguageFormatter();
    const featFormatter = new FeatFormatter();
    const usesFormatter = new UsesFormatter();
    const targetsFormatter = new TargetsFormatter();
    const extraAttacksFormatter = new ExtraAttacksFormatter();
    const distanceFormatter = new DistanceFormatter();
    const diceFormatter = new DiceFormatter();
    const damageReductionFormatter = new DamageReductionFormatter();
    const spellResistanceFormatter = new SpellResistanceFormatter();
    const otherFormatter = new OtherFormatter();

    // Register formatters for all ModifierAppliesToType values
    this.register(ModifierAppliesToType.Attribute, signedValueFormatter);
    this.register(ModifierAppliesToType.Skill, signedValueFormatter);
    this.register(ModifierAppliesToType.SavingThrow, signedValueFormatter);
    this.register(ModifierAppliesToType.AC, signedValueFormatter);
    this.register(ModifierAppliesToType.Attack, signedValueFormatter);
    this.register(ModifierAppliesToType.Damage, damageFormatter);
    this.register(ModifierAppliesToType.DamageReduction, damageReductionFormatter);
    this.register(ModifierAppliesToType.Initiative, signedValueFormatter);
    this.register(ModifierAppliesToType.MovementSpeed, distanceFormatter);
    this.register(ModifierAppliesToType.HitDice, diceFormatter);
    this.register(ModifierAppliesToType.Uses, usesFormatter);
    this.register(ModifierAppliesToType.Targets, targetsFormatter);
    this.register(ModifierAppliesToType.Distance, distanceFormatter);
    this.register(ModifierAppliesToType.ExtraAttacks, extraAttacksFormatter);
    this.register(ModifierAppliesToType.Healing, healingFormatter);
    this.register(ModifierAppliesToType.SpellResistance, spellResistanceFormatter);
    this.register(ModifierAppliesToType.UnarmedDamage, damageFormatter);
    this.register(ModifierAppliesToType.Feat, featFormatter);
    this.register(ModifierAppliesToType.Other, otherFormatter);
    this.register(ModifierAppliesToType.BonusLanguage, languageFormatter);
    this.register(ModifierAppliesToType.AutomaticLanguage, languageFormatter);
    // Note: ModifierAppliesToType.Choice is handled by choice formatters, not base formatters

    // Register choice formatters
    const choiceFormatter = new FeatureChoiceFormatter();
    this.registerChoice(FeatureChoiceType.Feat, choiceFormatter);
    this.registerChoice(FeatureChoiceType.Feature, choiceFormatter);
    this.registerChoice(FeatureChoiceType.CreatureType, choiceFormatter);
  }
}

// Export a singleton instance
export const formatterRegistry = new FormatterRegistry();

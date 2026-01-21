import { EntityAppliesToType, EntityType } from '@shared/static-data';

import {
    DamageFormatter,
    HealingFormatter,
    SignedValueFormatter,
    EmptyStringFormatter,
    FeatureEntityFormatter,
    LanguageFormatter,
    FeatFormatter,
    DomainFormatter,
    SpellFormatter,
    UsesFormatter,
    TargetsFormatter,
    ValueFormatter,
    DistanceFormatter,
    MovementSpeedFormatter,
    DiceFormatter,
    DiceBonusFormatter,
    DamageReductionFormatter,
    DamageBonusFormatter,
    ProficiencyFormatter,
    CreatureTypeFormatter,
    SizeCategoryFormatter,
    DamageTypeFormatter,
    WeaponFamiliarityFormatter,
    SpellSaveDCFormatter,
    ResistanceFormatter,
    PrerequisiteFormatter,
    SpellbookSpellFormatter,
    BaseAttackBonusFormatter,
    SavingThrowProgressionFormatter,
    SpeedFormatter,
    FavoredClassFormatter,
    LevelAdjustmentFormatter,
    CastingAbilityFormatter,
    CastingTypeFormatter,
    SpellcastingProgressionFormatter
} from './pure-formatters';
import { generateKey } from './registry-utils';
import type { BaseFormatter } from './types';

// Unified formatter registry interface
interface IFormatterRegistry {
    // Core unified method
    registerFormatter(
        entityType: EntityType,
        formatter: BaseFormatter,
        appliesToId?: EntityAppliesToType,
        featureId?: number
    ): void;

    // Unified getter method
    getFormatter(
        entityType: EntityType,
        appliesToId?: EntityAppliesToType,
        featureId?: number
    ): BaseFormatter | undefined;
}

export class FormatterRegistry implements IFormatterRegistry {
    private formatters = new Map<string, BaseFormatter>();

    constructor() {
        this.initializeDefaultFormatters();
    }

    // Core unified registration method
    registerFormatter(
        entityType: EntityType,
        formatter: BaseFormatter,
        appliesToId?: EntityAppliesToType,
        featureId?: number
    ): void {
        const key = generateKey(entityType, appliesToId, featureId);
        this.formatters.set(key, formatter);
    }

    // Core unified getter method
    getFormatter(
        entityType: EntityType,
        appliesToId?: EntityAppliesToType,
        featureId?: number
    ): BaseFormatter | undefined {
        const key = generateKey(entityType, appliesToId, featureId);
        return this.formatters.get(key);
    }

    // Convenience wrapper methods for common registration patterns
    registerBonusFormatter(appliesToType: EntityAppliesToType, formatter: BaseFormatter): void {
        this.registerFormatter(EntityType.Bonus, formatter, appliesToType);
    }

    registerQuantityFormatter(appliesToType: EntityAppliesToType, formatter: BaseFormatter): void {
        this.registerFormatter(EntityType.Quantity, formatter, appliesToType);
    }

    registerReplacementFormatter(appliesToType: EntityAppliesToType, formatter: BaseFormatter): void {
        this.registerFormatter(EntityType.Replacement, formatter, appliesToType);
    }

    registerOtherFormatter(appliesToType: EntityAppliesToType, formatter: BaseFormatter): void {
        this.registerFormatter(EntityType.Other, formatter, appliesToType);
    }

    registerBaseFormatter(appliesToType: EntityAppliesToType, formatter: BaseFormatter): void {
        this.registerFormatter(EntityType.Base, formatter, appliesToType);
    }

    registerProficiencyFormatter(appliesToType: EntityAppliesToType, formatter: BaseFormatter): void {
        // Register for both Other and Base types (both can be used with Proficiency)
        this.registerFormatter(EntityType.Other, formatter, appliesToType);
        this.registerFormatter(EntityType.Base, formatter, appliesToType);
    }

    // Entity formatter convenience wrapper
    registerEntityFormatter(entityType: EntityType, appliesTo: EntityAppliesToType, formatter: BaseFormatter): void {
        this.registerFormatter(entityType, formatter, appliesTo);
    }

    private initializeDefaultFormatters(): void {
        // Create formatter instances
        const damageFormatter = new DamageFormatter();
        const healingFormatter = new HealingFormatter();
        const signedValueFormatter = new SignedValueFormatter();
        const emptyStringFormatter = new EmptyStringFormatter();
        const languageFormatter = new LanguageFormatter();
        const featFormatter = new FeatFormatter();
        const domainFormatter = new DomainFormatter();
        const usesFormatter = new UsesFormatter();
        const targetsFormatter = new TargetsFormatter();
        const valueFormatter = new ValueFormatter();
        const distanceFormatter = new DistanceFormatter();
        const movementSpeedFormatter = new MovementSpeedFormatter();
        const diceFormatter = new DiceFormatter();
        const diceBonusFormatter = new DiceBonusFormatter();
        const damageReductionFormatter = new DamageReductionFormatter();
        const damageBonusFormatter = new DamageBonusFormatter();
        const proficiencyFormatter = new ProficiencyFormatter();
        const creatureTypeFormatter = new CreatureTypeFormatter();
        const sizeCategoryFormatter = new SizeCategoryFormatter();
        const damageTypeFormatter = new DamageTypeFormatter();
        const weaponFamiliarityFormatter = new WeaponFamiliarityFormatter();
        const spellSaveDCFormatter = new SpellSaveDCFormatter();
        const resistanceFormatter = new ResistanceFormatter();
        const spellbookSpellFormatter = new SpellbookSpellFormatter();
        const baseAttackBonusFormatter = new BaseAttackBonusFormatter();
        const savingThrowProgressionFormatter = new SavingThrowProgressionFormatter();
        const speedFormatter = new SpeedFormatter();
        const favoredClassFormatter = new FavoredClassFormatter();
        const levelAdjustmentFormatter = new LevelAdjustmentFormatter();
        const castingAbilityFormatter = new CastingAbilityFormatter();
        const castingTypeFormatter = new CastingTypeFormatter();
        const spellcastingProgressionFormatter = new SpellcastingProgressionFormatter();

        // Bonus-compatible types (using convenience wrapper)
        this.registerBonusFormatter(EntityAppliesToType.Ability, signedValueFormatter);
        this.registerBonusFormatter(EntityAppliesToType.Skill, signedValueFormatter);
        this.registerBonusFormatter(EntityAppliesToType.SavingThrow, signedValueFormatter);
        this.registerBonusFormatter(EntityAppliesToType.AC, signedValueFormatter);
        this.registerBonusFormatter(EntityAppliesToType.Attack, signedValueFormatter);
        this.registerBonusFormatter(EntityAppliesToType.Damage, signedValueFormatter);
        this.registerBonusFormatter(EntityAppliesToType.DamageReduction, damageReductionFormatter);
        this.registerBonusFormatter(EntityAppliesToType.Initiative, signedValueFormatter);
        this.registerBonusFormatter(EntityAppliesToType.SpellSvDC, spellSaveDCFormatter);
        this.registerBonusFormatter(EntityAppliesToType.Resistance, resistanceFormatter);
        this.registerBonusFormatter(EntityAppliesToType.CasterLevel, signedValueFormatter);
        this.registerBonusFormatter(EntityAppliesToType.HitPoints, signedValueFormatter);
        this.registerBonusFormatter(EntityAppliesToType.Damage, damageBonusFormatter);

        // Quantity-compatible types
        this.registerQuantityFormatter(EntityAppliesToType.MovementSpeed, movementSpeedFormatter);
        this.registerQuantityFormatter(EntityAppliesToType.HitDice, diceBonusFormatter);
        this.registerQuantityFormatter(EntityAppliesToType.Uses, usesFormatter);
        this.registerQuantityFormatter(EntityAppliesToType.Targets, targetsFormatter);
        this.registerQuantityFormatter(EntityAppliesToType.Distance, distanceFormatter);
        this.registerQuantityFormatter(EntityAppliesToType.ExtraAttacks, valueFormatter);
        this.registerQuantityFormatter(EntityAppliesToType.Damage, damageFormatter);
        this.registerQuantityFormatter(EntityAppliesToType.Healing, healingFormatter);
        this.registerQuantityFormatter(EntityAppliesToType.SpellResistance, valueFormatter);

        // Replacement-compatible types
        this.registerReplacementFormatter(EntityAppliesToType.Damage, diceFormatter);
        this.registerReplacementFormatter(EntityAppliesToType.UnarmedDamage, valueFormatter);
        this.registerReplacementFormatter(EntityAppliesToType.MovementSpeed, movementSpeedFormatter);
        this.registerReplacementFormatter(EntityAppliesToType.Ability, signedValueFormatter);

        // Other-compatible types
        this.registerOtherFormatter(EntityAppliesToType.Other, valueFormatter);
        this.registerOtherFormatter(EntityAppliesToType.BonusLanguage, languageFormatter);
        this.registerOtherFormatter(EntityAppliesToType.AutomaticLanguage, languageFormatter);
        this.registerOtherFormatter(EntityAppliesToType.Feat, featFormatter);
        this.registerOtherFormatter(EntityAppliesToType.Domain, domainFormatter);
        this.registerOtherFormatter(EntityAppliesToType.Spell, new SpellFormatter());
        this.registerOtherFormatter(EntityAppliesToType.Skill, emptyStringFormatter);
        this.registerOtherFormatter(EntityAppliesToType.CreatureType, creatureTypeFormatter);
        this.registerOtherFormatter(EntityAppliesToType.SizeCategory, sizeCategoryFormatter);
        this.registerOtherFormatter(EntityAppliesToType.DamageType, damageTypeFormatter);
        this.registerOtherFormatter(EntityAppliesToType.WeaponFamiliarity, weaponFamiliarityFormatter);

        // Prerequisite formatter
        const prerequisiteFormatter = new PrerequisiteFormatter();
        this.registerOtherFormatter(EntityAppliesToType.Prerequisite, prerequisiteFormatter);

        // SpellbookSpell formatter
        this.registerOtherFormatter(EntityAppliesToType.SpellbookSpell, spellbookSpellFormatter);

        // Class/Race mechanics formatters (EntityType.Base)
        this.registerBaseFormatter(EntityAppliesToType.BaseAttackBonus, baseAttackBonusFormatter);
        this.registerBaseFormatter(EntityAppliesToType.HitDice, diceFormatter);
        this.registerBaseFormatter(EntityAppliesToType.SavingThrow, savingThrowProgressionFormatter);
        this.registerBaseFormatter(EntityAppliesToType.Size, sizeCategoryFormatter);
        this.registerBaseFormatter(EntityAppliesToType.FavoredClass, favoredClassFormatter);
        this.registerBaseFormatter(EntityAppliesToType.LevelAdjustment, levelAdjustmentFormatter);
        this.registerBaseFormatter(EntityAppliesToType.SkillPoints, valueFormatter);
        this.registerBaseFormatter(EntityAppliesToType.CastingAbility, castingAbilityFormatter);
        this.registerBaseFormatter(EntityAppliesToType.CastingType, castingTypeFormatter);
        this.registerBaseFormatter(EntityAppliesToType.SpellcastingProgression, spellcastingProgressionFormatter);
        // MovementSpeed is compatible with both Quantity (bonuses) and Base (base race speed)
        this.registerBaseFormatter(EntityAppliesToType.MovementSpeed, movementSpeedFormatter);
        // Skill is compatible with both Other (skill grants) and Base (class skills)
        this.registerBaseFormatter(EntityAppliesToType.Skill, emptyStringFormatter);

        // Proficiency-compatible types
        this.registerProficiencyFormatter(EntityAppliesToType.Proficiency, proficiencyFormatter);

        // Choice-compatible types
        const featureEntityFormatter = new FeatureEntityFormatter();
        this.registerEntityFormatter(EntityType.Choice, EntityAppliesToType.Feat, featureEntityFormatter);
        this.registerEntityFormatter(EntityType.Choice, EntityAppliesToType.Domain, featureEntityFormatter);
        this.registerEntityFormatter(EntityType.Choice, EntityAppliesToType.Spell, featureEntityFormatter);
        this.registerEntityFormatter(EntityType.Choice, EntityAppliesToType.Feature, featureEntityFormatter);
        this.registerEntityFormatter(EntityType.Choice, EntityAppliesToType.CreatureType, featureEntityFormatter);
        this.registerEntityFormatter(EntityType.Choice, EntityAppliesToType.AnimalCompanion, featureEntityFormatter);
        this.registerEntityFormatter(EntityType.Choice, EntityAppliesToType.Familiar, featureEntityFormatter);
        this.registerEntityFormatter(EntityType.Choice, EntityAppliesToType.Ability, featureEntityFormatter);
        this.registerEntityFormatter(EntityType.Allocation, EntityAppliesToType.Feat, featureEntityFormatter);
        this.registerEntityFormatter(EntityType.Allocation, EntityAppliesToType.Spell, featureEntityFormatter);
        this.registerEntityFormatter(EntityType.Allocation, EntityAppliesToType.Feature, featureEntityFormatter);
        this.registerEntityFormatter(EntityType.Allocation, EntityAppliesToType.CreatureType, featureEntityFormatter);
    }
}

// Export a singleton instance
export const formatterRegistry = new FormatterRegistry();

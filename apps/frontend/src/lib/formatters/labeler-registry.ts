import type { FeatureModifier } from '@shared/schema';
import { ModifierAppliesToType, ModifierType, FeatureType } from '@shared/static-data';

import { classSkillLabeler, skillModifierLabeler, displayNameLabeler, emptyStringLabeler, bonusLanguageLabeler, automaticLanguageLabeler, abilityModifierLabeler, savingThrowModifierLabeler, creatureTypeLabeler, sizeCategoryLabeler } from './label-formatters';
import { generateKey } from './registry-utils';

export interface Labeler {
    (value: string, modifier: FeatureModifier): string;
}

// Unified labeler registry interface
interface ILabelerRegistry {
    // Core unified method
    registerLabeler(
        featureType: FeatureType,
        featureSubType: ModifierType,
        labeler: Labeler,
        subTypeId?: ModifierAppliesToType
    ): void;

    // Core unified getter method
    getLabeler(
        featureType: FeatureType,
        featureSubType: ModifierType,
        subTypeId?: ModifierAppliesToType
    ): Labeler | undefined;
}

export class LabelerRegistry implements ILabelerRegistry {
    private labelers = new Map<string, Labeler>();

    constructor() {
        this.initializeDefaultLabelers();
    }

    // Core unified method
    registerLabeler(
        featureType: FeatureType,
        featureSubType: ModifierType,
        labeler: Labeler,
        subTypeId?: ModifierAppliesToType
    ): void {
        const key = generateKey(featureType, featureSubType, subTypeId);
        this.labelers.set(key, labeler);
    }

    // Core unified getter method
    getLabeler(
        featureType: FeatureType,
        featureSubType: ModifierType,
        subTypeId?: ModifierAppliesToType
    ): Labeler | undefined {
        const key = generateKey(featureType, featureSubType, subTypeId);
        return this.labelers.get(key);
    }

    // Convenience wrapper methods for common registration patterns
    registerBonusLabeler(appliesToType: ModifierAppliesToType, labeler: Labeler): void {
        this.registerLabeler(FeatureType.Modifier, ModifierType.Bonus, labeler, appliesToType);
    }

    registerQuantityLabeler(appliesToType: ModifierAppliesToType, labeler: Labeler): void {
        this.registerLabeler(FeatureType.Modifier, ModifierType.Quantity, labeler, appliesToType);
    }

    registerReplacementLabeler(appliesToType: ModifierAppliesToType, labeler: Labeler): void {
        this.registerLabeler(FeatureType.Modifier, ModifierType.Replacement, labeler, appliesToType);
    }

    registerOtherLabeler(appliesToType: ModifierAppliesToType, labeler: Labeler): void {
        this.registerLabeler(FeatureType.Modifier, ModifierType.Other, labeler, appliesToType);
    }

    registerProficiencyLabeler(appliesToType: ModifierAppliesToType, labeler: Labeler): void {
        this.registerLabeler(FeatureType.Modifier, ModifierType.Proficiency, labeler, appliesToType);
    }

    applyLabel(value: string, modifier: FeatureModifier, showLabel: boolean = true): string {
        if (!showLabel) return value;

        const labeler = this.getLabeler(FeatureType.Modifier, modifier.type, modifier.appliesTo);
        return labeler ? labeler(value, modifier) : value;
    }

    private initializeDefaultLabelers(): void {
        // Register labelers for all ModifierAppliesToType combinations
        // This follows the same pattern as the formatter registry

        // ModifierType.Bonus - use displayName labeler for most types
        this.registerBonusLabeler(ModifierAppliesToType.Ability, abilityModifierLabeler);
        this.registerBonusLabeler(ModifierAppliesToType.AC, displayNameLabeler);
        this.registerBonusLabeler(ModifierAppliesToType.Attack, displayNameLabeler);
        this.registerBonusLabeler(ModifierAppliesToType.Damage, displayNameLabeler);
        this.registerBonusLabeler(ModifierAppliesToType.DamageReduction, displayNameLabeler);
        this.registerBonusLabeler(ModifierAppliesToType.Initiative, displayNameLabeler);
        this.registerBonusLabeler(ModifierAppliesToType.SavingThrow, savingThrowModifierLabeler);
        this.registerBonusLabeler(ModifierAppliesToType.Skill, skillModifierLabeler); // Special case for skills

        // ModifierType.Quantity - use displayName labeler for most types
        this.registerQuantityLabeler(ModifierAppliesToType.MovementSpeed, displayNameLabeler);
        this.registerQuantityLabeler(ModifierAppliesToType.HitDice, displayNameLabeler);
        this.registerQuantityLabeler(ModifierAppliesToType.Uses, displayNameLabeler);
        this.registerQuantityLabeler(ModifierAppliesToType.Targets, displayNameLabeler);
        this.registerQuantityLabeler(ModifierAppliesToType.Distance, displayNameLabeler);
        this.registerQuantityLabeler(ModifierAppliesToType.ExtraAttacks, displayNameLabeler);
        this.registerQuantityLabeler(ModifierAppliesToType.Damage, displayNameLabeler);
        this.registerQuantityLabeler(ModifierAppliesToType.Healing, displayNameLabeler);
        this.registerQuantityLabeler(ModifierAppliesToType.SpellResistance, displayNameLabeler);

        // ModifierType.Replacement - use displayName labeler for most types
        this.registerReplacementLabeler(ModifierAppliesToType.Damage, displayNameLabeler);
        this.registerReplacementLabeler(ModifierAppliesToType.UnarmedDamage, displayNameLabeler);
        this.registerReplacementLabeler(ModifierAppliesToType.MovementSpeed, displayNameLabeler);
        this.registerReplacementLabeler(ModifierAppliesToType.Ability, displayNameLabeler);

        // ModifierType.Other - use emptyString labeler for most types (no labels)
        this.registerOtherLabeler(ModifierAppliesToType.Other, emptyStringLabeler);
        this.registerOtherLabeler(ModifierAppliesToType.BonusLanguage, bonusLanguageLabeler);
        this.registerOtherLabeler(ModifierAppliesToType.AutomaticLanguage, automaticLanguageLabeler);
        this.registerOtherLabeler(ModifierAppliesToType.Feat, emptyStringLabeler);
        this.registerOtherLabeler(ModifierAppliesToType.SizeCategory, sizeCategoryLabeler);
        this.registerOtherLabeler(ModifierAppliesToType.CreatureType, creatureTypeLabeler);
        this.registerOtherLabeler(ModifierAppliesToType.DamageType, emptyStringLabeler);
        this.registerOtherLabeler(ModifierAppliesToType.Skill, classSkillLabeler); // Special case for class skills

        // ModifierType.Proficiency
        this.registerProficiencyLabeler(ModifierAppliesToType.Feat, emptyStringLabeler);
    }
}

// Export singleton instance
export const labelerRegistry = new LabelerRegistry();

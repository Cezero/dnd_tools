import type { QueryClient } from '@tanstack/react-query';
import { EntityAppliesToType, EntityType } from '@shared/static-data';

import { classSkillLabeler, skillModifierLabeler, displayNameLabeler, emptyStringLabeler, bonusLanguageLabeler, automaticLanguageLabeler, abilityModifierLabeler, savingThrowModifierLabeler, creatureTypeLabeler, sizeCategoryLabeler, choiceLabeler, groupedChoiceLabeler, grantedFeatLabeler, weaponFamiliarityLabeler, groupedWeaponFamiliarityLabeler, groupedUsesLabeler, spellSaveDCLabeler, groupedResistanceLabeler, domainLabeler, casterLevelLabeler, groupedBonusLanguageLabeler, groupedAutomaticLanguageLabeler, groupedSkillPointsLabeler, animalCompanionLabeler, attackBonusLabeler } from './label-formatters';
import { generateKey } from './registry-utils';
import type { CalculatedEntity } from './types';

export interface Labeler {
    (value: string, entity: CalculatedEntity, queryClient?: QueryClient): string;
}

// Unified labeler registry interface
interface ILabelerRegistry {
    // Core unified method
    registerLabeler(
        entityType: EntityType,
        labeler: Labeler,
        appliesToId?: EntityAppliesToType
    ): void;

    // Core unified getter method
    getLabeler(
        entityType: EntityType,
        appliesToId?: EntityAppliesToType
    ): Labeler | undefined;
}

export class LabelerRegistry implements ILabelerRegistry {
    private labelers = new Map<string, Labeler>();
    private groupedLabelers = new Map<EntityAppliesToType, (formattedItems: string) => string>();

    constructor() {
        this.initializeDefaultLabelers();
        this.initializeDefaultGroupedLabelers();
    }

    // Core unified method
    registerLabeler(
        entityType: EntityType,
        labeler: Labeler,
        appliesToId?: EntityAppliesToType
    ): void {
        const key = generateKey(entityType, appliesToId);
        this.labelers.set(key, labeler);
    }

    // Core unified getter method
    getLabeler(
        entityType: EntityType,
        appliesToId?: EntityAppliesToType
    ): Labeler | undefined {
        const key = generateKey(entityType, appliesToId);
        return this.labelers.get(key);
    }

    // Convenience wrapper methods for common registration patterns
    registerBonusLabeler(appliesToType: EntityAppliesToType, labeler: Labeler): void {
        this.registerLabeler(EntityType.Bonus, labeler, appliesToType);
    }

    registerQuantityLabeler(appliesToType: EntityAppliesToType, labeler: Labeler): void {
        this.registerLabeler(EntityType.Quantity, labeler, appliesToType);
    }

    registerReplacementLabeler(appliesToType: EntityAppliesToType, labeler: Labeler): void {
        this.registerLabeler(EntityType.Replacement, labeler, appliesToType);
    }

    registerOtherLabeler(appliesToType: EntityAppliesToType, labeler: Labeler): void {
        this.registerLabeler(EntityType.Other, labeler, appliesToType);
    }

    registerProficiencyLabeler(appliesToType: EntityAppliesToType, labeler: Labeler): void {
        this.registerLabeler(EntityType.Other, labeler, appliesToType);
    }

    applyLabel(value: string, modifier: CalculatedEntity, showLabel: boolean = true, queryClient?: QueryClient): string {
        if (!showLabel) return value;

        const labeler = this.getLabeler(modifier.type, modifier.appliesTo);
        return labeler ? labeler(value, modifier, queryClient) : value;
    }

    applyGroupedLabel(formattedItems: string, appliesTo: EntityAppliesToType, showLabel: boolean = true): string {
        if (!showLabel) return formattedItems;

        // Check if there's a specific grouped labeler for this appliesTo type
        const groupedLabeler = this.getGroupedLabeler(appliesTo);
        if (groupedLabeler) {
            return groupedLabeler(formattedItems);
        }

        // Fallback to the default grouped choice labeler
        return groupedChoiceLabeler(formattedItems, appliesTo);
    }

    private initializeDefaultLabelers(): void {
        // Register labelers for all EntityAppliesToType combinations
        // This follows the same pattern as the formatter registry

        // EntityType.Bonus - use displayName labeler for most types
        this.registerBonusLabeler(EntityAppliesToType.Ability, abilityModifierLabeler);
        this.registerBonusLabeler(EntityAppliesToType.AC, displayNameLabeler);
        this.registerBonusLabeler(EntityAppliesToType.Attack, attackBonusLabeler);
        this.registerBonusLabeler(EntityAppliesToType.Damage, displayNameLabeler);
        this.registerBonusLabeler(EntityAppliesToType.DamageReduction, displayNameLabeler);
        this.registerBonusLabeler(EntityAppliesToType.Initiative, displayNameLabeler);
        this.registerBonusLabeler(EntityAppliesToType.SpellSvDC, spellSaveDCLabeler);
        this.registerBonusLabeler(EntityAppliesToType.SavingThrow, savingThrowModifierLabeler);
        this.registerBonusLabeler(EntityAppliesToType.Skill, skillModifierLabeler); // Special case for skills
        this.registerBonusLabeler(EntityAppliesToType.Resistance, groupedResistanceLabeler);
        this.registerBonusLabeler(EntityAppliesToType.CasterLevel, casterLevelLabeler);
        this.registerBonusLabeler(EntityAppliesToType.HitPoints, displayNameLabeler);

        // EntityType.Quantity - use displayName labeler for most types
        this.registerQuantityLabeler(EntityAppliesToType.MovementSpeed, displayNameLabeler);
        this.registerQuantityLabeler(EntityAppliesToType.HitDice, displayNameLabeler);
        this.registerQuantityLabeler(EntityAppliesToType.Uses, displayNameLabeler);
        this.registerQuantityLabeler(EntityAppliesToType.Targets, displayNameLabeler);
        this.registerQuantityLabeler(EntityAppliesToType.Distance, displayNameLabeler);
        this.registerQuantityLabeler(EntityAppliesToType.ExtraAttacks, displayNameLabeler);
        this.registerQuantityLabeler(EntityAppliesToType.Damage, displayNameLabeler);
        this.registerQuantityLabeler(EntityAppliesToType.Healing, displayNameLabeler);
        this.registerQuantityLabeler(EntityAppliesToType.SpellResistance, displayNameLabeler);

        // EntityType.Replacement - use displayName labeler for most types
        this.registerReplacementLabeler(EntityAppliesToType.Damage, displayNameLabeler);
        this.registerReplacementLabeler(EntityAppliesToType.UnarmedDamage, displayNameLabeler);
        this.registerReplacementLabeler(EntityAppliesToType.MovementSpeed, displayNameLabeler);
        this.registerReplacementLabeler(EntityAppliesToType.Ability, displayNameLabeler);

        // EntityType.Other - use emptyString labeler for most types (no labels)
        this.registerOtherLabeler(EntityAppliesToType.Other, emptyStringLabeler);
        this.registerOtherLabeler(EntityAppliesToType.BonusLanguage, bonusLanguageLabeler);
        this.registerOtherLabeler(EntityAppliesToType.AutomaticLanguage, automaticLanguageLabeler);
        this.registerOtherLabeler(EntityAppliesToType.Feat, grantedFeatLabeler);
        this.registerOtherLabeler(EntityAppliesToType.SizeCategory, sizeCategoryLabeler);
        this.registerOtherLabeler(EntityAppliesToType.CreatureType, creatureTypeLabeler);
        this.registerOtherLabeler(EntityAppliesToType.DamageType, emptyStringLabeler);
        this.registerOtherLabeler(EntityAppliesToType.WeaponFamiliarity, weaponFamiliarityLabeler);
        this.registerOtherLabeler(EntityAppliesToType.Skill, classSkillLabeler); // Special case for class skills
        this.registerOtherLabeler(EntityAppliesToType.Domain, domainLabeler); // Domain grants
        this.registerOtherLabeler(EntityAppliesToType.AnimalCompanion, animalCompanionLabeler); // Animal companion grants
        this.registerOtherLabeler(EntityAppliesToType.Familiar, animalCompanionLabeler); // Familiar grants (use same labeler as animal companions)

        // Proficiency (EntityType.Other with appliesTo = EntityAppliesToType.Proficiency)
        this.registerProficiencyLabeler(EntityAppliesToType.Proficiency, emptyStringLabeler);

        // Choice labelers
        this.registerLabeler(EntityType.Choice, choiceLabeler, EntityAppliesToType.AnimalCompanion);
        this.registerLabeler(EntityType.Choice, choiceLabeler, EntityAppliesToType.Familiar);
        this.registerLabeler(EntityType.Choice, choiceLabeler, EntityAppliesToType.Domain);
        this.registerLabeler(EntityType.Choice, choiceLabeler, EntityAppliesToType.Feat);
        this.registerLabeler(EntityType.Choice, choiceLabeler, EntityAppliesToType.Feature);
        this.registerLabeler(EntityType.Choice, choiceLabeler, EntityAppliesToType.CreatureType);
        this.registerLabeler(EntityType.Choice, choiceLabeler, EntityAppliesToType.SkillPoints);
        this.registerLabeler(EntityType.Allocation, emptyStringLabeler, EntityAppliesToType.Feat);
        this.registerLabeler(EntityType.Allocation, emptyStringLabeler, EntityAppliesToType.Feature);
        this.registerLabeler(EntityType.Allocation, emptyStringLabeler, EntityAppliesToType.CreatureType);
    }

    // Grouped labeler methods
    registerGroupedLabeler(appliesTo: EntityAppliesToType, labeler: (formattedItems: string) => string): void {
        this.groupedLabelers.set(appliesTo, labeler);
    }

    getGroupedLabeler(appliesTo: EntityAppliesToType): ((formattedItems: string) => string) | undefined {
        return this.groupedLabelers.get(appliesTo);
    }

    private initializeDefaultGroupedLabelers(): void {
        // Register grouped labelers for entity types that need them
        this.registerGroupedLabeler(EntityAppliesToType.WeaponFamiliarity, groupedWeaponFamiliarityLabeler);
        this.registerGroupedLabeler(EntityAppliesToType.Uses, groupedUsesLabeler);
        this.registerGroupedLabeler(EntityAppliesToType.Resistance, groupedResistanceLabeler);
        this.registerGroupedLabeler(EntityAppliesToType.BonusLanguage, groupedBonusLanguageLabeler);
        this.registerGroupedLabeler(EntityAppliesToType.AutomaticLanguage, groupedAutomaticLanguageLabeler);
        this.registerGroupedLabeler(EntityAppliesToType.SkillPoints, groupedSkillPointsLabeler);
    }
}

// Export singleton instance
export const labelerRegistry = new LabelerRegistry();

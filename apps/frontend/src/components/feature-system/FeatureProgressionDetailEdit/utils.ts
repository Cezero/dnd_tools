import { FeatureSystemApi } from '@/components/feature-system/FeatureSystemApi';
import { FeatApi } from '@/features/feat/FeatApi';
import { ItemApi } from '@/features/item/ItemApi';
import {
    ABILITY_SELECT_LIST,
    FULL_SKILL_SELECT_LIST,
    SAVING_THROW_SELECT_LIST,
    RPG_DICE_SELECT_LIST,
    DAMAGE_TYPE_SELECT_LIST,
    USES_FREQUENCY_SELECT_LIST,
    LANGUAGE_SELECT_LIST,
    SIZE_SELECT_LIST,
    CREATURE_TYPE_SELECT_LIST,
    EntityAppliesToType,
    EntityType,
    ITEM_TYPE_ENUM,
    WEAPON_CATEGORY_ENUM,
    SPELL_ID_LIST,
    CRAFT_SKILL_SELECT_LIST,
    KNOWLEDGE_SKILL_SELECT_LIST,
    Skill,
    ENERGY_DAMAGE_SELECT_LIST
} from '@shared/static-data';
import type { SelectOption } from '@shared/static-data';

/**
 * Get the appropriate select options for AppliesToSubId based on the appliesTo and appliesToId
 */
export function getAppliesToSubIdSelectOptions(appliesTo: EntityAppliesToType, appliesToId: number | null): SelectOption[] {
    // Only show appliesToSubId for specific combinations
    if (appliesTo === EntityAppliesToType.Skill && appliesToId) {
        if (appliesToId === Skill.Craft) {
            return [
                { value: -1, label: 'All Craft Subtypes' },
                ...CRAFT_SKILL_SELECT_LIST
            ];
        }
        if (appliesToId === Skill.Knowledge) {
            return [
                { value: -1, label: 'All Knowledge Subtypes' },
                ...KNOWLEDGE_SKILL_SELECT_LIST
            ];
        }
    }

    // For other combinations (like Feat proficiency), return empty array
    // The existing logic in EntityDetailForm will handle these cases
    return [];
}

/**
 * Get the appropriate select options for AppliesToId based on the appliesTo type
 * Used when valuesRepresent is set to AppliesToId in conditional scaling formulas
 * This mirrors the logic from AppliesToSelector.tsx
 */
export async function getAppliesToSelectOptions(appliesTo: EntityAppliesToType, entityType?: EntityType | null): Promise<SelectOption[]> {

    switch (appliesTo) {
        case EntityAppliesToType.Ability:
            return [
                { value: -1, label: 'Any Ability' },
                ...ABILITY_SELECT_LIST
            ];
        case EntityAppliesToType.Skill:
            return [
                { value: -1, label: 'Any Skill' },
                ...FULL_SKILL_SELECT_LIST
            ];
        case EntityAppliesToType.SavingThrow:
            return [
                { value: -1, label: 'Any Saving Throw' },
                ...SAVING_THROW_SELECT_LIST
            ];
        case EntityAppliesToType.HitDice:
            return RPG_DICE_SELECT_LIST;
        case EntityAppliesToType.Damage:
            return entityType === EntityType.Quantity ? RPG_DICE_SELECT_LIST : DAMAGE_TYPE_SELECT_LIST;
        case EntityAppliesToType.DamageReduction:
            return DAMAGE_TYPE_SELECT_LIST;
        case EntityAppliesToType.Resistance:
            return ENERGY_DAMAGE_SELECT_LIST;
        case EntityAppliesToType.AC:
            return [];
        case EntityAppliesToType.Uses:
            return USES_FREQUENCY_SELECT_LIST;
        case EntityAppliesToType.BonusLanguage:
        case EntityAppliesToType.AutomaticLanguage:
            return [
                { value: -1, label: 'Any Language' },
                ...LANGUAGE_SELECT_LIST
            ];
        case EntityAppliesToType.Feat:
            try {
                const feats = await FeatApi.getFeatList({ queryType: 'all' });
                if (feats && feats.length > 0) {
                    return feats.map(feat => ({
                        value: feat.id,
                        label: feat.name
                    }));
                }
            } catch (error) {
                console.error('Failed to load feats for AppliesToId options:', error);
            }
            return [
                { value: -1, label: 'Select a feat...' }
            ];
        case EntityAppliesToType.Spell:
            return SPELL_ID_LIST.map(spell => ({
                value: spell.id,
                label: spell.name
            }));
        case EntityAppliesToType.Feature:
            try {
                const response = await FeatureSystemApi.getFeatures(undefined, undefined);
                if (response && response.results && response.results.length > 0) {
                    return response.results.map(feature => ({
                        value: feature.id,
                        label: feature.name || feature.slug
                    }));
                }
            } catch (error) {
                console.error('Failed to load features for AppliesToId options:', error);
            }
            return [
                { value: -1, label: 'Select a feature...' }
            ];
        case EntityAppliesToType.CreatureType:
            return [
                { value: -1, label: 'Any Creature Type' },
                ...CREATURE_TYPE_SELECT_LIST
            ];
        case EntityAppliesToType.SizeCategory:
            return [
                { value: -1, label: 'Any Size' },
                ...SIZE_SELECT_LIST
            ];
        case EntityAppliesToType.DamageType:
            return DAMAGE_TYPE_SELECT_LIST;
        case EntityAppliesToType.WeaponFamiliarity:
            try {
                // Fetch exotic weapons for weapon familiarity
                const response = await ItemApi.itemQuery({
                    queryType: 'byCategory',
                    typeId: ITEM_TYPE_ENUM.Weapon,
                    category: WEAPON_CATEGORY_ENUM.Exotic
                });
                if (response && response.results && response.results.length > 0) {
                    return response.results.map(weapon => ({
                        value: weapon.id,
                        label: weapon.name
                    }));
                }
            } catch (error) {
                console.error('Failed to load exotic weapons for Weapon Familiarity:', error);
            }
            return [
                { value: -1, label: 'Select an exotic weapon...' }
            ];
        case EntityAppliesToType.MovementSpeed:
        case EntityAppliesToType.Attack:
        case EntityAppliesToType.Initiative:
        case EntityAppliesToType.Other:
            return [
                { value: -1, label: 'Any/All' },
                { value: 1, label: 'Specific Target 1' },
                { value: 2, label: 'Specific Target 2' }
            ];
        default:
            return [];
    }
}

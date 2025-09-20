import { FeatureSystemApi } from '@/components/feature-system/FeatureSystemApi';
import { DomainApi } from '@/features/domain/DomainApi';
import { FeatApi } from '@/features/feat/FeatApi';
import { ItemApi } from '@/features/item/ItemApi';
import {
    ABILITY_LIST,
    SKILL_LIST,
    SAVING_THROW_LIST,
    RPG_DICE_LIST,
    DAMAGE_TYPE_LIST,
    USES_FREQUENCY_LIST,
    LANGUAGE_LIST,
    SIZE_LIST,
    CREATURE_TYPE_LIST,
    EntityAppliesToType,
    EntityType,
    ITEM_TYPE_ENUM,
    WEAPON_CATEGORY_ENUM,
    SPELL_ID_LIST,
    CRAFT_SKILL_LIST,
    KNOWLEDGE_SKILL_LIST,
    Skill,
    ENERGY_DAMAGE_TYPE_LIST,
    SPELL_SCHOOL_LIST,
    CoreComponent
} from '@shared/static-data';

/**
 * Get the appropriate select options for AppliesToSubId based on the appliesTo and appliesToId
 */
export function getAppliesToSubIdSelectOptions(appliesTo: EntityAppliesToType, appliesToId: number | null): CoreComponent[] {
    // Only show appliesToSubId for specific combinations
    if (appliesTo === EntityAppliesToType.Skill && appliesToId) {
        if (appliesToId === Skill.Craft) {
            return [
                { id: -1, name: 'All Craft Subtypes' },
                ...CRAFT_SKILL_LIST
            ];
        }
        if (appliesToId === Skill.Knowledge) {
            return [
                { id: -1, name: 'All Knowledge Subtypes' },
                ...KNOWLEDGE_SKILL_LIST
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
export async function getAppliesToSelectOptions(appliesTo: EntityAppliesToType, entityType?: EntityType | null): Promise<CoreComponent[]> {

    switch (appliesTo) {
        case EntityAppliesToType.Ability:
            return [
                { id: -1, name: 'Any Ability' },
                ...ABILITY_LIST
            ];
        case EntityAppliesToType.Skill:
            return [
                { id: -1, name: 'Any Skill' },
                ...SKILL_LIST
            ];
        case EntityAppliesToType.SavingThrow:
            return [
                { id: -1, name: 'Any Saving Throw' },
                ...SAVING_THROW_LIST
            ];
        case EntityAppliesToType.HitDice:
            return RPG_DICE_LIST;
        case EntityAppliesToType.Damage:
            return entityType === EntityType.Quantity ? RPG_DICE_LIST : DAMAGE_TYPE_LIST;
        case EntityAppliesToType.DamageReduction:
            return DAMAGE_TYPE_LIST;
        case EntityAppliesToType.Resistance:
            return ENERGY_DAMAGE_TYPE_LIST;
        case EntityAppliesToType.CasterLevel:
            return SPELL_SCHOOL_LIST;
        case EntityAppliesToType.AC:
            return [];
        case EntityAppliesToType.Uses:
            return USES_FREQUENCY_LIST;
        case EntityAppliesToType.BonusLanguage:
        case EntityAppliesToType.AutomaticLanguage:
            return [
                { id: -1, name: 'Any Language' },
                ...LANGUAGE_LIST
            ];
        case EntityAppliesToType.Feat:
            try {
                const feats = await FeatApi.getFeatList({ queryType: 'all' });
                if (feats && feats.length > 0) {
                    return feats;
                }
            } catch (error) {
                console.error('Failed to load feats for AppliesToId options:', error);
            }
            return [
                { id: -1, name: 'Select a feat...' }
            ];
        case EntityAppliesToType.Domain:
            try {
                const domains = await DomainApi.getDomains({});
                if (domains && domains.results && domains.results.length > 0) {
                    return domains.results;
                }
            } catch (error) {
                console.error('Failed to load domains for AppliesToId options:', error);
            }
            return [
                { id: -1, name: 'Select a domain...' }
            ];
        case EntityAppliesToType.Spell:
            return SPELL_ID_LIST;
        case EntityAppliesToType.Feature:
            try {
                const response = await FeatureSystemApi.getFeatures(undefined, undefined);
                if (response && response.results && response.results.length > 0) {
                    return response.results;
                }
            } catch (error) {
                console.error('Failed to load features for AppliesToId options:', error);
            }
            return [
                { id: -1, name: 'Select a feature...' }
            ];
        case EntityAppliesToType.CreatureType:
            return [
                { id: -1, name: 'Any Creature Type' },
                ...CREATURE_TYPE_LIST
            ];
        case EntityAppliesToType.SizeCategory:
            return [
                { id: -1, name: 'Any Size' },
                ...SIZE_LIST
            ];
        case EntityAppliesToType.DamageType:
            return DAMAGE_TYPE_LIST;
        case EntityAppliesToType.WeaponFamiliarity:
            try {
                // Fetch exotic weapons for weapon familiarity
                const response = await ItemApi.itemQuery({
                    queryType: 'byCategory',
                    typeId: ITEM_TYPE_ENUM.Weapon,
                    category: WEAPON_CATEGORY_ENUM.Exotic
                });
                if (response && response.results && response.results.length > 0) {
                    return response.results;
                }
            } catch (error) {
                console.error('Failed to load exotic weapons for Weapon Familiarity:', error);
            }
            return [
                { id: -1, name: 'Select an exotic weapon...' }
            ];
        case EntityAppliesToType.MovementSpeed:
        case EntityAppliesToType.Attack:
        case EntityAppliesToType.Initiative:
        case EntityAppliesToType.Other:
            return [
                { id: -1, name: 'Any/All' },
                { id: 1, name: 'Specific Target 1' },
                { id: 2, name: 'Specific Target 2' }
            ];
        default:
            return [];
    }
}

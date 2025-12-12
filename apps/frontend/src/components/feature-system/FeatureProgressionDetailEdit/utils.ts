import { useMemo } from 'react';

import { DomainQueryHooks } from '@/services/query/DomainQueryHooks';
import { FeatQueryHooks } from '@/services/query/FeatQueryHooks';
import { FeatureQueryHooks } from '@/services/query/FeatureQueryHooks';
import {
    ABILITY_LIST,
    SKILL_LIST,
    SAVING_THROW_LIST,
    RPG_DICE_LIST,
    DAMAGE_TYPE_LIST,
    USES_FREQUENCY_LIST,
    LANGUAGE_LIST,
    EntityAppliesToType,
    EntityType,
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
 * Hook to get applies to select options using query hooks
 */
export function useAppliesToSelectOptions(appliesTo: EntityAppliesToType, entityType?: EntityType | null) {
    // Use the appropriate query hook based on the appliesTo type
    const featQuery = FeatQueryHooks.useGetFeatList({
        requestData: { queryType: 'all' }
    });

    const domainQuery = DomainQueryHooks.useGetDomains({});

    const featureQuery = FeatureQueryHooks.useGetFeatures({
        requestData: { sourceTypes: [EntityAppliesToType.Feature] }
    });

    return useMemo(() => {
        switch (appliesTo) {
            case EntityAppliesToType.Feat:
                if (featQuery.data && featQuery.data.length > 0) {
                    return featQuery.data;
                }
                return [{ id: -1, name: 'Select a feat...' }];

            case EntityAppliesToType.Domain:
                if (domainQuery.data?.results && domainQuery.data.results.length > 0) {
                    return domainQuery.data.results;
                }
                return [{ id: -1, name: 'Select a domain...' }];

            case EntityAppliesToType.Feature:
                if (featureQuery.data?.results && featureQuery.data.results.length > 0) {
                    return featureQuery.data.results;
                }
                return [{ id: -1, name: 'Select a feature...' }];

            default:
                // For other types, use the static options
                return getAppliesToSelectOptionsSync(appliesTo, entityType);
        }
    }, [appliesTo, entityType, featQuery.data, domainQuery.data, featureQuery.data]);
}

/**
 * Synchronous version for static options
 */
export function getAppliesToSelectOptionsSync(appliesTo: EntityAppliesToType, _entityType?: EntityType | null): CoreComponent[] {
    switch (appliesTo) {
        case EntityAppliesToType.Ability:
            return ABILITY_LIST;
        case EntityAppliesToType.Skill:
            return SKILL_LIST;
        case EntityAppliesToType.SavingThrow:
            return SAVING_THROW_LIST;
        case EntityAppliesToType.Damage:
            return RPG_DICE_LIST;
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
        default:
            return [];
    }
}


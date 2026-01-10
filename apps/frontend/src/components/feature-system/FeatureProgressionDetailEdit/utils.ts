import { useMemo, useState, useEffect } from 'react';

import { FeatureSystemService } from '@/components/feature-system/FeatureSystemService';
import { FeatQueryHooks } from '@/services/query/FeatQueryHooks';
import { DomainQueryHooks } from '@/services/query/DomainQueryHooks';
import { FeatureQueryHooks } from '@/services/query/FeatureQueryHooks';
import type { FeatureEntity } from '@shared/schema';
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
    PROFICIENCY_TYPE_LIST,
    PROFICIENCY_TYPES,
    ATTACK_BONUS_APPLIES_TO_LIST,
    CoreComponent
} from '@shared/static-data';

/**
 * Get the appropriate select options for AppliesToSubId based on the appliesTo and appliesToId
 */
export function getAppliesToSubIdSelectOptions(appliesTo: EntityAppliesToType, appliesToId: number | null): CoreComponent[] {
    // Attack bonus special contexts (two-weapon fighting, thrown weapons, etc.)
    if (appliesTo === EntityAppliesToType.Attack) {
        return ATTACK_BONUS_APPLIES_TO_LIST;
    }

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
export function useAppliesToSelectOptions(appliesTo: EntityAppliesToType | null, entityType?: EntityType | null) {
    // Use the appropriate query hook based on the appliesTo type
    const featQuery = FeatQueryHooks.useGetFeats();

    const domainQuery = DomainQueryHooks.useGetDomains({});

    const featureQuery = FeatureQueryHooks.useGetFeatures({
        requestData: { sourceTypes: [EntityAppliesToType.Feature] }
    });

    return useMemo(() => {
        if (appliesTo === null || appliesTo === undefined) {
            return [];
        }

        // For Proficiency, use static proficiency types (not feats)
        if (appliesTo === EntityAppliesToType.Proficiency) {
            return PROFICIENCY_TYPE_LIST;
        }

        switch (appliesTo) {
            case EntityAppliesToType.Feat:
                // GetAllFeatsWithFeatureInfoResponse has a results array
                if (featQuery.data?.results && featQuery.data.results.length > 0) {
                    return featQuery.data.results;
                }
                // Return empty array while loading, placeholder only if not loading
                if (featQuery.isLoading || featQuery.isPending) {
                    return [];
                }
                // If no data but not loading, return placeholder
                return [{ id: -1, name: 'Select a feat...' }];

            case EntityAppliesToType.Domain:
                if (domainQuery.data?.results && domainQuery.data.results.length > 0) {
                    return domainQuery.data.results;
                }
                if (domainQuery.isLoading || domainQuery.isPending) {
                    return [];
                }
                return [{ id: -1, name: 'Select a domain...' }];

            case EntityAppliesToType.Feature:
                if (featureQuery.data?.results && featureQuery.data.results.length > 0) {
                    return featureQuery.data.results;
                }
                if (featureQuery.isLoading || featureQuery.isPending) {
                    return [];
                }
                return [{ id: -1, name: 'Select a feature...' }];

            default:
                // For other types, use the static options
                return getAppliesToSelectOptionsSync(appliesTo, entityType);
        }
    }, [appliesTo, entityType, featQuery.data, featQuery.isLoading, domainQuery.data, domainQuery.isLoading, featureQuery.data, featureQuery.isLoading]);
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
        case EntityAppliesToType.Proficiency:
            return PROFICIENCY_TYPE_LIST;
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

/**
 * Hook to get appliesToSubId options for proficiency entities
 * Fetches items based on the selected feat's proficiency type
 */
export function useProficiencySubIdOptions(
    entity: FeatureEntity | undefined,
    appliesToId: number | null
): { options: CoreComponent[]; isLoading: boolean } {
    const [options, setOptions] = useState<CoreComponent[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadProficiencyItems = async () => {
            // Check if this is a proficiency entity with a feat
            if (
                !entity ||
                entity.type !== EntityType.Other ||
                entity.appliesTo !== EntityAppliesToType.Proficiency ||
                !appliesToId
            ) {
                setOptions([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);

            try {
                // appliesToId contains the proficiency type ID directly
                const proficiencyTypeId = appliesToId;
                const proficiencyType = PROFICIENCY_TYPES[proficiencyTypeId];

                if (!proficiencyType) {
                    setOptions([]);
                    setIsLoading(false);
                    return;
                }

                // Fetch items for this proficiency type
                const itemsResult = await FeatureSystemService.getItemsByProficiencyType(proficiencyTypeId);

                // Transform items to CoreComponent format
                const itemOptions: CoreComponent[] = (itemsResult.results || []).map(item => ({
                    id: item.id,
                    name: item.name
                }));

                // Add "All [category]" option at the beginning
                const allOption: CoreComponent = {
                    id: -1,
                    name: proficiencyType.allName || `All ${proficiencyType.name}`
                };

                // If there's a current appliesToSubId that's not in the list, add it
                // This can happen if the item was selected but isn't in the category (edge case)
                const currentSubId = entity.appliesToSubId;
                let finalOptions: CoreComponent[] = [allOption, ...itemOptions];

                if (currentSubId !== null && currentSubId !== undefined && currentSubId !== -1) {
                    const hasCurrentValue = finalOptions.some(opt => opt.id === currentSubId);
                    if (!hasCurrentValue) {
                        // Try to get the item from entity.item first
                        if (entity.item && entity.item.id === currentSubId) {
                            finalOptions.push({
                                id: entity.item.id,
                                name: entity.item.name
                            });
                        } else {
                            // If we don't have the item in entity.item, try to fetch it
                            // For now, just add a placeholder - the item should be loaded by the backend
                            // but if it's not, we'll show the ID
                            finalOptions.push({
                                id: currentSubId,
                                name: `Item ${currentSubId}`
                            });
                        }
                    }
                }

                setOptions(finalOptions);
            } catch (error) {
                console.error('Failed to load proficiency items:', error);
                setOptions([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadProficiencyItems();
    }, [
        entity?.type,
        entity?.appliesTo,
        entity?.appliesToSubId,
        entity?.item?.id,
        appliesToId
    ]);

    return { options, isLoading };
}


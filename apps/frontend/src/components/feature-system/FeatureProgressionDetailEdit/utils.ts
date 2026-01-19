import { useMemo, useState, useEffect } from 'react';

import { hasSubtypes, getSkillSubtypes } from '@/lib/skill-utils';
import { getSkillSelectFull, getItemsByProficiencyType, useCacheFunctions, getItemNameFromCache } from '@/services/cache';
import { DomainQueryHooks } from '@/services/query/DomainQueryHooks';
import { FeatQueryHooks } from '@/services/query/FeatQueryHooks';
import { FeatureQueryHooks } from '@/services/query/FeatureQueryHooks';
import type { FeatureEntity } from '@shared/schema';
import {
    ABILITY_LIST,
    SAVING_THROW_LIST,
    RPG_DICE_LIST,
    DAMAGE_TYPE_LIST,
    USES_FREQUENCY_LIST,
    LANGUAGE_LIST,
    SIZE_LIST,
    BAB_PROGRESSION_LIST,
    EditionId,
    EntityAppliesToType,
    EntityType,
    ENERGY_DAMAGE_TYPE_LIST,
    SPELL_SCHOOL_LIST,
    PROFICIENCY_TYPE_LIST,
    PROFICIENCY_TYPES,
    ATTACK_BONUS_APPLIES_TO_LIST,
    CASTING_TYPE_LIST,
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

    // For saving throws, appliesToSubId is the progression type (good/poor)
    if (appliesTo === EntityAppliesToType.SavingThrow) {
        return BAB_PROGRESSION_LIST; // Same progression types as BAB (good, average, poor)
    }

    // Only show appliesToSubId for specific combinations
    if (appliesTo === EntityAppliesToType.Skill && appliesToId) {
        if (hasSubtypes(appliesToId)) {
            const subtypes = getSkillSubtypes(appliesToId);
            const skillName = getSkillSelectFull().find(s => s.id === appliesToId)?.name || 'Skill';
            return [
                { id: -1, name: `All ${skillName} Subtypes` },
                ...subtypes.map(s => ({ id: s.id, name: s.name }))
            ];
        }
    }

    // For other combinations (like Feat proficiency), return empty array
    // The existing logic in EntityDetailForm will handle these cases
    return [];
}

/**
 * Hook to get applies to select options using query hooks
 * @param appliesTo - The EntityAppliesToType to get options for
 * @param entityType - Optional EntityType for filtering
 * @param editionId - Optional editionId to use for FavoredClass (defaults to DND_3_5E if not provided)
 */
export function useAppliesToSelectOptions(
    appliesTo: EntityAppliesToType | null,
    entityType?: EntityType | null,
    editionId?: number | null
) {
    // Use the appropriate query hook based on the appliesTo type
    const featQuery = FeatQueryHooks.useGetFeats();

    const domainQuery = DomainQueryHooks.useGetDomains({});

    const featureQuery = FeatureQueryHooks.useGetFeatures({
        requestData: { sourceTypes: [EntityAppliesToType.Feature] }
    });

    // For FavoredClass, we need to get classes - use provided editionId or default to 3.5E
    const { getBaseClassSelectByEdition } = useCacheFunctions();
    const [favoredClassOptions, setFavoredClassOptions] = useState<CoreComponent[]>([]);

    useEffect(() => {
        if (appliesTo === EntityAppliesToType.FavoredClass) {
            // Use provided editionId or default to 3.5E
            const targetEditionId = editionId ?? EditionId.DND_3_5E;
            try {
                const classes = getBaseClassSelectByEdition(targetEditionId);
                const newOptions = [
                    { id: -1, name: 'Any' },
                    ...classes
                ];
                // Only update if the options actually changed to prevent infinite loops
                setFavoredClassOptions(prev => {
                    if (prev.length === newOptions.length &&
                        prev.every((opt, idx) => opt.id === newOptions[idx]?.id && opt.name === newOptions[idx]?.name)) {
                        return prev;
                    }
                    return newOptions;
                });
            } catch {
                setFavoredClassOptions(prev => {
                    const fallbackOptions = [{ id: -1, name: 'Any' }];
                    if (prev.length === 1 && prev[0]?.id === -1) {
                        return prev;
                    }
                    return fallbackOptions;
                });
            }
        } else {
            setFavoredClassOptions(prev => prev.length === 0 ? prev : []);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appliesTo, editionId]); // getBaseClassSelectByEdition is stable, no need in deps

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

            case EntityAppliesToType.FavoredClass:
                // Return classes from cache (async loaded)
                return favoredClassOptions;

            default:
                // For other types, use the static options
                return getAppliesToSelectOptionsSync(appliesTo, entityType);
        }
    }, [appliesTo, entityType, featQuery.data, featQuery.isLoading, domainQuery.data, domainQuery.isLoading, featureQuery.data, featureQuery.isLoading, favoredClassOptions]);
}

/**
 * Synchronous version for static options
 */
export function getAppliesToSelectOptionsSync(appliesTo: EntityAppliesToType, _entityType?: EntityType | null): CoreComponent[] {
    switch (appliesTo) {
        case EntityAppliesToType.Ability:
            return ABILITY_LIST;
        case EntityAppliesToType.Skill:
            return getSkillSelectFull();
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
        // New class mechanics entity types
        // These store their values in appliesToId, not value
        case EntityAppliesToType.HitDice:
            return RPG_DICE_LIST;
        case EntityAppliesToType.Size:
            return SIZE_LIST;
        case EntityAppliesToType.SkillPoints:
            // SkillPoints uses value field (not appliesToId) and should have ABILITY_BASED formula
            // No appliesToId options needed
            return [];
        case EntityAppliesToType.BaseAttackBonus:
            // BAB progression type - should use BAB_PROGRESSION_LIST
            return BAB_PROGRESSION_LIST;
        case EntityAppliesToType.MovementSpeed:
            // MovementSpeed uses value field (not appliesToId) as it's a literal numeric value
            // No appliesToId options needed
            return [];
        case EntityAppliesToType.LevelAdjustment:
            // LevelAdjustment uses value field (not appliesToId) as it's a literal numeric value
            // No appliesToId options needed
            return [];
        case EntityAppliesToType.CastingAbility:
            // CastingAbility stores the ability ID in appliesToId
            return ABILITY_LIST;
        case EntityAppliesToType.CastingType:
            // CastingType stores the casting type ID (Prepared/Spontaneous) in appliesToId
            return CASTING_TYPE_LIST;
        case EntityAppliesToType.SpellcastingProgression:
            // SpellcastingProgression stores the progression ID in appliesToId
            // Return empty array to use number input instead of dropdown
            return [];
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

                // Fetch items for this proficiency type (synchronous, cache is always loaded)
                const itemsResult = getItemsByProficiencyType(proficiencyTypeId);

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
                        // Try to get the item from cache
                        const itemName = getItemNameFromCache(currentSubId);
                        if (itemName) {
                            finalOptions.push({
                                id: currentSubId,
                                name: itemName
                            });
                        } else {
                            // If we don't have the item in cache, add a placeholder
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
        appliesToId
    ]);

    return { options, isLoading };
}


import { useMemo, useState, useEffect } from 'react';

import { hasSubtypes, getSkillSubtypes } from '@/lib/skill-utils';
import { getSkillSelectFull, getItemsByProficiencyType, useCacheFunctions, getItemNameFromCache, getFeatSelectFull, getDomainSelectFull, getFeatureSelectFull } from '@/services/cache';
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
    CoreComponent,
    FormulaId,
    ConditionalScalingValueType
} from '@shared/static-data';

/**
 * Get the appropriate select options for AppliesToSubId based on the appliesTo and appliesToId
 */
export function getAppliesToSubIdSelectOptions(appliesTo: EntityAppliesToType, appliesToId: number | null): CoreComponent[] {
    // Attack bonus special contexts (two-weapon fighting, thrown weapons, etc.)
    if (appliesTo === EntityAppliesToType.Attack) {
        return ATTACK_BONUS_APPLIES_TO_LIST;
    }

    // For saving throws, appliesToSubId is the feature type (good/poor)
    if (appliesTo === EntityAppliesToType.SavingThrow) {
        return BAB_PROGRESSION_LIST; // Same feature types as BAB (good, average, poor)
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
            case EntityAppliesToType.Feat: {
                const feats = getFeatSelectFull();
                if (feats.length > 0) {
                    return feats;
                }
                return [{ id: -1, name: 'Select a feat...' }];
            }

            case EntityAppliesToType.Domain: {
                const domains = getDomainSelectFull();
                if (domains.length > 0) {
                    return domains;
                }
                return [{ id: -1, name: 'Select a domain...' }];
            }

            case EntityAppliesToType.Feature: {
                const features = getFeatureSelectFull();
                if (features.length > 0) {
                    return features;
                }
                return [{ id: -1, name: 'Select a feature...' }];
            }

            case EntityAppliesToType.FavoredClass:
                // Return classes from cache (async loaded)
                return favoredClassOptions;

            default:
                // For other types, use the static options
                return getAppliesToSelectOptionsSync(appliesTo, entityType);
        }
    }, [appliesTo, entityType, favoredClassOptions]);
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
            // BAB feature type - should use BAB_PROGRESSION_LIST
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
            // SpellcastingProgression stores the spell level (0-9) in appliesToId; UI uses dedicated dropdown in AppliesToSelector
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
            // Check if this is a proficiency entity (Base or Other type)
            if (
                !entity ||
                (entity.type !== EntityType.Other && entity.type !== EntityType.Base) ||
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

/**
 * Combinations that never use value or formula (based on database analysis)
 * These combinations have 3+ entities and 0% usage of both value and formula
 */
const COMBINATIONS_WITHOUT_VALUE_OR_FORMULA = new Set<string>([
    `${EntityType.Other}_${EntityAppliesToType.Skill}`,
    `${EntityType.Base}_${EntityAppliesToType.Skill}`,
    `${EntityType.Other}_${EntityAppliesToType.Proficiency}`,
    `${EntityType.Other}_${EntityAppliesToType.BonusLanguage}`,
    `${EntityType.Base}_${EntityAppliesToType.BonusLanguage}`,
    `${EntityType.Base}_${EntityAppliesToType.Proficiency}`,
    `${EntityType.Base}_${EntityAppliesToType.CastingAbility}`,
    `${EntityType.Base}_${EntityAppliesToType.CastingType}`,
    `${EntityType.Other}_${EntityAppliesToType.AutomaticLanguage}`,
    `${EntityType.Base}_${EntityAppliesToType.AutomaticLanguage}`,
    `${EntityType.Other}_${EntityAppliesToType.Feat}`,
    `${EntityType.Base}_${EntityAppliesToType.HitDice}`,
    `${EntityType.Base}_${EntityAppliesToType.Size}`,
    `${EntityType.Base}_${EntityAppliesToType.FavoredClass}`,
    `${EntityType.Other}_${EntityAppliesToType.Spell}`,
    `${EntityType.Other}_${EntityAppliesToType.WeaponFamiliarity}`,
]);

/**
 * Combinations that use formulas but not value
 * These combinations have formulas that don't require the value field
 */
const COMBINATIONS_WITH_FORMULA_BUT_NO_VALUE = new Set<string>([
    // Spell-slot formulas use formulaParams.maxValue (cap), not entity.value
    `${EntityType.Base}_${EntityAppliesToType.SpellcastingProgression}`,
    `${EntityType.Base}_${EntityAppliesToType.SpellsKnownProgression}`,
]);

/**
 * Entity types that use formulas but not value
 */
const ENTITY_TYPES_WITH_FORMULA_BUT_NO_VALUE = new Set<EntityType>([
    EntityType.Replacement,
]);

/**
 * Combinations that can use formulas (based on database analysis)
 * These combinations have >0% formula usage, so the formula field should be shown
 * even when no formula is currently selected, to allow creating new entities with formulas
 */
const COMBINATIONS_WITH_FORMULA = new Set<string>([
    // Base type combinations with formulas
    `${EntityType.Base}_${EntityAppliesToType.SavingThrow}`, // 100% formula
    `${EntityType.Base}_${EntityAppliesToType.BaseAttackBonus}`, // 100% formula
    `${EntityType.Base}_${EntityAppliesToType.MovementSpeed}`, // 9.1% formula
    `${EntityType.Base}_${EntityAppliesToType.SpellcastingProgression}`,
    `${EntityType.Base}_${EntityAppliesToType.SpellsKnownProgression}`,

    // Bonus type combinations with formulas
    `${EntityType.Bonus}_${EntityAppliesToType.Skill}`, // 5.4% formula
    `${EntityType.Bonus}_${EntityAppliesToType.SavingThrow}`, // 20.8% formula
    `${EntityType.Bonus}_${EntityAppliesToType.Ability}`, // 11.1% formula
    `${EntityType.Bonus}_${EntityAppliesToType.Attack}`, // 27.3% formula
    `${EntityType.Bonus}_${EntityAppliesToType.AC}`, // 55.6% formula
    `${EntityType.Bonus}_${EntityAppliesToType.Damage}`, // 50% formula
    `${EntityType.Bonus}_${EntityAppliesToType.DamageReduction}`, // 100% formula
    
    // Quantity type combinations with formulas
    `${EntityType.Quantity}_${EntityAppliesToType.Uses}`, // 75% formula
    `${EntityType.Quantity}_${EntityAppliesToType.Targets}`, // 100% formula
    `${EntityType.Quantity}_${EntityAppliesToType.Healing}`, // 100% formula
    `${EntityType.Quantity}_${EntityAppliesToType.Damage}`, // 100% formula
    `${EntityType.Quantity}_${EntityAppliesToType.Distance}`, // 100% formula
    `${EntityType.Quantity}_${EntityAppliesToType.ExtraAttacks}`, // 100% formula
    `${EntityType.Quantity}_${EntityAppliesToType.SpellResistance}`, // 100% formula
    
    // Replacement type combinations with formulas
    `${EntityType.Replacement}_${EntityAppliesToType.UnarmedDamage}`, // 100% formula
    
    // Other type combinations with formulas (including AppliesToId exception cases)
    `${EntityType.Other}_${EntityAppliesToType.SizeCategory}`, // 100% formula (AppliesToId)
    `${EntityType.Other}_${EntityAppliesToType.DamageType}`, // 100% formula (AppliesToId)
    `${EntityType.Other}_${EntityAppliesToType.CreatureType}`, // 50% formula (AppliesToId)
    
    // Choice type combinations with formulas
    `${EntityType.Choice}_${EntityAppliesToType.Feat}`, // 30.8% formula
    `${EntityType.Choice}_${EntityAppliesToType.Feature}`, // 75% formula
    `${EntityType.Choice}_${EntityAppliesToType.SpellbookSpell}`, // 50% formula
    `${EntityType.Choice}_${EntityAppliesToType.SkillPoints}`, // 50% formula
    `${EntityType.Choice}_${EntityAppliesToType.Ability}`, // 100% formula
    `${EntityType.Choice}_${EntityAppliesToType.CreatureType}`, // 100% formula
    
    // Allocation type combinations with formulas
    `${EntityType.Allocation}_${EntityAppliesToType.CreatureType}`, // 100% formula
]);

/**
 * Check if a combination uses CONDITIONAL_SCALING with AppliesToId (exception case)
 * These formulas use appliesToId lookups instead of value field
 */
function isConditionalScalingWithAppliesToId(
    formulaId: number | null | undefined,
    valuesRepresent: number | null | undefined
): boolean {
    return (
        formulaId === FormulaId.CONDITIONAL_SCALING &&
        valuesRepresent === ConditionalScalingValueType.AppliesToId
    );
}

/**
 * Determine if the value field should be shown for an entity
 * Based on EntityType/EntityAppliesToType combination
 * formulaId and valuesRepresent are only used for the AppliesToId exception case
 * @param entityType The entity type
 * @param appliesTo The appliesTo type
 * @param formulaId The formula ID (if any) - only used for AppliesToId exception check
 * @param valuesRepresent The valuesRepresent setting (for CONDITIONAL_SCALING) - only used for AppliesToId exception check
 * @returns true if value field should be shown
 */
export function shouldShowValue(
    entityType: EntityType | null | undefined,
    appliesTo: EntityAppliesToType | null | undefined,
    formulaId: number | null | undefined,
    valuesRepresent: number | null | undefined
): boolean {
    if (entityType === null || entityType === undefined || appliesTo === null || appliesTo === undefined) {
        return false;
    }

    const combinationKey = `${entityType}_${appliesTo}`;

    // Exception: CONDITIONAL_SCALING with AppliesToId doesn't use value field
    // This only applies when a formula is actually selected
    if (isConditionalScalingWithAppliesToId(formulaId, valuesRepresent)) {
        return false;
    }

    // Combinations that never use value
    if (COMBINATIONS_WITHOUT_VALUE_OR_FORMULA.has(combinationKey)) {
        return false;
    }

    // Combinations that use formulas but not value
    if (COMBINATIONS_WITH_FORMULA_BUT_NO_VALUE.has(combinationKey)) {
        return false;
    }

    // Entity types that use formulas but not value
    if (ENTITY_TYPES_WITH_FORMULA_BUT_NO_VALUE.has(entityType)) {
        return false;
    }

    // Default: show value field (most combinations use it)
    return true;
}

/**
 * Determine if the formula field should be shown for an entity
 * Based on EntityType/EntityAppliesToType combination, not on whether a formula is currently set
 * This allows users to create new entities with formulas for valid combinations
 * @param entityType The entity type
 * @param appliesTo The appliesTo type
 * @param formulaId The formula ID (if any) - only used for documentation, not for visibility logic
 * @param valuesRepresent The valuesRepresent setting (for CONDITIONAL_SCALING) - only used for documentation, not for visibility logic
 * @returns true if formula field should be shown
 */
export function shouldShowFormula(
    entityType: EntityType | null | undefined,
    appliesTo: EntityAppliesToType | null | undefined,
    formulaId: number | null | undefined,
    valuesRepresent: number | null | undefined
): boolean {
    if (entityType === null || entityType === undefined || appliesTo === null || appliesTo === undefined) {
        return false;
    }

    const combinationKey = `${entityType}_${appliesTo}`;

    // Combinations that never use value or formula - hide formula field
    if (COMBINATIONS_WITHOUT_VALUE_OR_FORMULA.has(combinationKey)) {
        return false;
    }

    // Combinations that can use formulas - show formula field (even when no formula is selected)
    if (COMBINATIONS_WITH_FORMULA.has(combinationKey)) {
        return true;
    }

    // Combinations that use formulas but not value - still show formula
    if (COMBINATIONS_WITH_FORMULA_BUT_NO_VALUE.has(combinationKey)) {
        return true;
    }

    // Entity types that use formulas but not value - still show formula
    if (ENTITY_TYPES_WITH_FORMULA_BUT_NO_VALUE.has(entityType)) {
        return true;
    }

    // Default: don't show formula field for combinations not in the analysis
    // This is more conservative and prevents showing formulas for combinations that don't use them
    return false;
}


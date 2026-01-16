import { getFeatByIdFromCache } from '@/services/cache/featCache';
import type {
    CharacterWithAllDetailsResponse,
    CharacterFeatureChoice,
    FeatureProgression,
} from '@shared/schema';
import { AttackBonusAppliesTo, EntityAppliesToType, EntityType, FeatureSourceType } from '@shared/static-data';

import type {
    FeatBenefit,
    FeatBenefitContext,
    FormulaModification,
} from '../types';
import { getAllCharacterFeats } from './featAccessor';

/**
 * Find feature choice for a specific feat
 */
function findFeatureChoiceForFeat(
    character: CharacterWithAllDetailsResponse,
    featId: number
): CharacterFeatureChoice | null {
    for (const advancement of character.advancements) {
        if (!advancement.featureChoices) continue;

        for (const choice of advancement.featureChoices) {
            // For feats, appliesToId is the featId
            if (choice.appliesToId === featId) {
                return choice;
            }
        }
    }
    return null;
}

/**
 * Find feat progression for a given featId
 */
function findFeatProgression(
    resolvedProgressions: FeatureProgression[],
    featId: number
): FeatureProgression | null {
    return resolvedProgressions.find(
        p => p.sourceType === FeatureSourceType.Feat && p.featId === featId
    ) || null;
}


/**
 * Resolve feat benefits from character's selected feats
 * Now includes feats from both AdvancementFeat and CharacterFeatureChoice sources
 */
export function resolveFeatBenefits(
    character: CharacterWithAllDetailsResponse,
    appliesTo: EntityAppliesToType,
    context?: FeatBenefitContext,
    resolvedProgressions?: FeatureProgression[]
): FeatBenefit[] {
    const benefits: FeatBenefit[] = [];

    // Get all feats from both sources using unified accessor
    // If resolvedProgressions not provided, fall back to old method for backward compatibility
    const allFeats = resolvedProgressions
        ? getAllCharacterFeats(character, resolvedProgressions)
        : [];

    // Use unified accessor if available, otherwise fall back to old method
    if (allFeats.length > 0 && resolvedProgressions) {
        // Process feats from unified accessor using FeatureEntity from progressions
        for (const characterFeat of allFeats) {
            // Find the progression for this feat
            const progression = findFeatProgression(resolvedProgressions, characterFeat.featId);
            if (!progression || !progression.entities) {
                continue;
            }

            // Get feat details from cache
            const feat = getFeatByIdFromCache(characterFeat.featId);

            // Find entities that match the appliesTo type
            for (const entity of progression.entities) {
                if (entity.appliesTo !== appliesTo) continue;

                // For proficiency, check entity type and appliesTo
                if (appliesTo === EntityAppliesToType.Proficiency && (entity.type !== EntityType.Other || entity.appliesTo !== EntityAppliesToType.Proficiency)) {
                    continue;
                }
                // For other benefits, check entity type is Bonus
                if (appliesTo !== EntityAppliesToType.Proficiency && entity.type !== EntityType.Bonus) {
                    continue;
                }

                // Handle Attack bonus special contexts (two-weapon fighting, thrown weapons)
                if (appliesTo === EntityAppliesToType.Attack) {
                    // Check appliesToSubId for special attack bonus contexts
                    if (entity.appliesToSubId === AttackBonusAppliesTo.MainHand) {
                        // Only apply when dual-wielding and not off-hand
                        if (!context?.isDualWield || context?.isOffHand) {
                            continue;
                        }
                    } else if (entity.appliesToSubId === AttackBonusAppliesTo.OffHand) {
                        // Only apply when dual-wielding and off-hand
                        if (!context?.isDualWield || !context?.isOffHand) {
                            continue;
                        }
                    } else if (entity.appliesToSubId === AttackBonusAppliesTo.Thrown) {
                        // Only apply when weapon is thrown
                        // TODO: Check context for thrown weapon type
                        // For now, this will need to be determined by weapon properties
                        // This may require additional context flags or weapon type checking
                    }
                    // If appliesToSubId is null, apply to all attacks (normal attack bonus)
                }

                // Handle useSubId feats (player choice feats)
                if (feat?.useSubId) {
                    // For choice-based feats, use the featSubId from the choice
                    // For advancement-based feats, check CharacterFeatureChoice for player's selection
                    const subId = characterFeat.source === 'choice'
                        ? characterFeat.featSubId
                        : (findFeatureChoiceForFeat(character, characterFeat.featId)?.appliesToSubId ?? null);

                    // For item-specific benefits, check if itemId matches
                    if (context?.itemId && subId !== context.itemId) {
                        continue;
                    }

                    benefits.push({
                        amount: entity.value ?? 0,
                        source: {
                            type: 'feat',
                            id: characterFeat.featId,
                            name: feat?.name || progression.feature?.name || 'Unknown Feat',
                        },
                        context: {
                            itemId: subId ?? undefined,
                        },
                    });
                } else {
                    // For non-useSubId feats, appliesToId is the entity ID
                    // For item-specific benefits, check if itemId matches
                    // Only filter if the benefit IS item-specific (appliesToId is not null)
                    if (entity.appliesToId !== null && context?.itemId && entity.appliesToId !== context.itemId) {
                        continue;
                    }

                    benefits.push({
                        amount: entity.value ?? 0,
                        source: {
                            type: 'feat',
                            id: characterFeat.featId,
                            name: feat?.name || progression.feature?.name || 'Unknown Feat',
                        },
                        context: {
                            itemId: entity.appliesToId ?? undefined,
                        },
                    });
                }
            }
        }
    } else {
        // Fallback: if resolvedProgressions not provided, return empty (should not happen in new system)
        // This is kept for backward compatibility during transition
        // Note: This is expected in some cases (e.g., during initial load before progressions are resolved)
    }

    return benefits;
}

/**
 * Resolve formula modifications from feats
 * Now includes feats from both AdvancementFeat and CharacterFeatureChoice sources
 */
export function resolveFeatFormulaModifications(
    character: CharacterWithAllDetailsResponse,
    context?: FeatBenefitContext,
    resolvedProgressions?: FeatureProgression[]
): FormulaModification[] {
    const modifications: FormulaModification[] = [];

    // Get all feats from both sources using unified accessor
    // If resolvedProgressions not provided, fall back to old method for backward compatibility
    const allFeats = resolvedProgressions
        ? getAllCharacterFeats(character, resolvedProgressions)
        : [];

    // Use unified accessor if available
    if (allFeats.length > 0 && resolvedProgressions) {
        // Process feats from unified accessor using FeatureEntity from progressions
        for (const characterFeat of allFeats) {
            // Find the progression for this feat
            const progression = findFeatProgression(resolvedProgressions, characterFeat.featId);
            if (!progression || !progression.entities) {
                continue;
            }

            // TODO: Formula modifications (like ability_replacement for Weapon Finesse) should be provided
            // through FeatureEntity entities with appropriate entity types or formula modification entities,
            // not by matching on feat/feature names. This is a temporary workaround that should be removed
            // once the proper FeatureEntity-based formula modification system is implemented.
            // 
            // The proper implementation should:
            // 1. Check progression.entities for entities that represent formula modifications
            // 2. Extract ability_replacement parameters from entity data (fromAbility, toAbility)
            // 3. Extract weapon type conditions from entity conditions or appliesToSubId
            // 4. Build FormulaModification objects from entity data, not hardcoded name checks
            //
            // Remove this entire block once FeatureEntity-based formula modifications are implemented.
        }
    }

    return modifications;
}


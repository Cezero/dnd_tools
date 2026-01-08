import type {
    CharacterWithAllDetailsResponse,
    CharacterFeatureChoice,
    Feat,
    FeatureProgression,
    FeatureEntity,
} from '@shared/schema';
import { FeatBenefitType, EntityAppliesToType, EntityType, FeatureSourceType } from '@shared/static-data';

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
 * Map FeatBenefitType to EntityAppliesToType for finding matching entities
 */
function mapFeatBenefitTypeToEntityAppliesTo(benefitType: FeatBenefitType): EntityAppliesToType {
    switch (benefitType) {
        case FeatBenefitType.SKILL:
            return EntityAppliesToType.Skill;
        case FeatBenefitType.SAVE:
            return EntityAppliesToType.SavingThrow;
        case FeatBenefitType.PROFICIENCY:
            return EntityAppliesToType.Feat;
        case FeatBenefitType.ATTACK_BONUS:
            return EntityAppliesToType.Attack;
        case FeatBenefitType.DAMAGE_BONUS:
            return EntityAppliesToType.Damage;
        case FeatBenefitType.INITIATIVE:
            return EntityAppliesToType.Initiative;
        case FeatBenefitType.CASTER_LEVEL:
            return EntityAppliesToType.CasterLevel;
        case FeatBenefitType.DIFFICULTY_CLASS:
            return EntityAppliesToType.SpellSvDC;
        default:
            return EntityAppliesToType.Other;
    }
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
    benefitType: FeatBenefitType,
    context?: FeatBenefitContext,
    featsMap?: Map<number, Feat>,
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
        const entityAppliesTo = mapFeatBenefitTypeToEntityAppliesTo(benefitType);
        
        for (const characterFeat of allFeats) {
            // Find the progression for this feat
            const progression = findFeatProgression(resolvedProgressions, characterFeat.featId);
            if (!progression || !progression.entities) {
                continue;
            }

            // Get feat details from map if provided
            const feat = featsMap?.get(characterFeat.featId);

            // Find entities that match the benefit type
            for (const entity of progression.entities) {
                if (entity.appliesTo !== entityAppliesTo) continue;
                
                // For proficiency benefits, check entity type
                if (benefitType === FeatBenefitType.PROFICIENCY && entity.type !== EntityType.Proficiency) {
                    continue;
                }
                // For other benefits, check entity type is Bonus
                if (benefitType !== FeatBenefitType.PROFICIENCY && entity.type !== EntityType.Bonus) {
                    continue;
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

                    // Context filtering for Two-Weapon Fighting benefit types
                    if (benefitType === FeatBenefitType.TWO_WEAPON_MAIN_HAND) {
                        // Only apply when dual-wielding and not off-hand
                        if (!context?.isDualWield || context?.isOffHand) {
                            continue;
                        }
                    } else if (benefitType === FeatBenefitType.TWO_WEAPON_OFF_HAND) {
                        // Only apply when dual-wielding and off-hand
                        if (!context?.isDualWield || !context?.isOffHand) {
                            continue;
                        }
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
        console.warn('resolveFeatBenefits called without resolvedProgressions - feat benefits cannot be resolved');
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
    featsMap?: Map<number, Feat>,
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

            // Get feat details from map if provided
            const feat = featsMap?.get(characterFeat.featId);

            // Check entities for ability replacement (Weapon Finesse)
            // This would be represented as a special entity type or condition
            // For now, check by feat name if available
            if (feat?.name === 'Weapon Finesse' || progression.feature?.name === 'Weapon Finesse') {
                        // Check if weapon type matches (light weapon, rapier, whip, or spiked chain)
                        // This would need weapon type checking from context
                        if (context?.weaponType) {
                            // TODO: Check if weapon type is light, rapier, whip, or spiked chain
                            modifications.push({
                                type: 'ability_replacement',
                                context: {
                                    weaponType: context.weaponType ? [context.weaponType] : undefined,
                                },
                                parameters: {
                                    fromAbility: 1, // Strength
                                    toAbility: 2, // Dexterity
                                },
                                source: {
                                    type: 'feat',
                                    id: characterFeat.featId,
                            name: feat?.name || progression.feature?.name || 'Unknown Feat',
                                },
                            });
                }
            }
        }
    }

    return modifications;
}


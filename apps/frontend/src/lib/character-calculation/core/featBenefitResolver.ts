import type {
    CharacterWithAllDetailsResponse,
    CharacterFeatureChoice,
    Feat,
    FeatureProgression,
} from '@shared/schema';
import { FeatBenefitType } from '@shared/static-data';

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
    if (allFeats.length > 0) {
        // Process feats from unified accessor (includes both advancement and choice-based feats)
        for (const characterFeat of allFeats) {
            // Get feat details from map if provided, otherwise skip
            const feat = featsMap?.get(characterFeat.featId);
            if (!feat?.benefits) {
                continue;
            }

            for (const benefit of feat.benefits) {
                if (benefit.typeId !== benefitType) continue;

                // Handle useSubId feats (player choice feats)
                if (feat.useSubId) {
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
                        amount: benefit.amount ?? 0,
                        source: {
                            type: 'feat',
                            id: characterFeat.featId,
                            name: feat.name,
                        },
                        context: {
                            itemId: subId ?? undefined,
                        },
                    });
                } else {
                    // For non-useSubId feats, referenceId is the entity ID
                    // For item-specific benefits, check if itemId matches
                    // Only filter if the benefit IS item-specific (referenceId is not null)
                    if (benefit.referenceId !== null && context?.itemId && benefit.referenceId !== context.itemId) {
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
                        amount: benefit.amount ?? 0,
                        source: {
                            type: 'feat',
                            id: characterFeat.featId,
                            name: feat.name,
                        },
                        context: {
                            itemId: benefit.referenceId ?? undefined,
                        },
                    });
                }
            }
        }
    } else {
        // Fallback to old method if resolvedProgressions not provided (for backward compatibility)
    for (const advancement of character.advancements) {
        if (!advancement.feats) continue;

        for (const featSelection of advancement.feats) {
            // Get feat details from map if provided, otherwise skip (feat details not available)
            const feat = featsMap?.get(featSelection.featId);
            if (!feat?.benefits) continue;

            for (const benefit of feat.benefits) {
                if (benefit.typeId !== benefitType) continue;

                // Handle useSubId feats (player choice feats)
                if (feat.useSubId) {
                    // Check CharacterFeatureChoice for player's selection
                    const choice = findFeatureChoiceForFeat(character, featSelection.featId);
                    if (!choice) continue;

                    // For item-specific benefits, check if itemId matches
                    if (context?.itemId && choice.appliesToSubId !== context.itemId) {
                        continue;
                    }

                    benefits.push({
                        amount: benefit.amount ?? 0,
                        source: {
                            type: 'feat',
                            id: featSelection.featId,
                            name: feat.name,
                        },
                        context: {
                            itemId: choice.appliesToSubId ?? undefined,
                        },
                    });
                } else {
                    // For non-useSubId feats, referenceId is the entity ID
                    // For item-specific benefits, check if itemId matches
                    // Only filter if the benefit IS item-specific (referenceId is not null)
                    if (benefit.referenceId !== null && context?.itemId && benefit.referenceId !== context.itemId) {
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
                        amount: benefit.amount ?? 0,
                        source: {
                            type: 'feat',
                            id: featSelection.featId,
                            name: feat.name,
                        },
                        context: {
                            itemId: benefit.referenceId ?? undefined,
                        },
                    });
                    }
                }
            }
        }
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

    // Use unified accessor if available, otherwise fall back to old method
    if (allFeats.length > 0) {
        // Process feats from unified accessor
        for (const characterFeat of allFeats) {
            // Get feat details from map if provided, otherwise skip
            const feat = featsMap?.get(characterFeat.featId);
            if (!feat?.benefits) continue;

            for (const benefit of feat.benefits) {
                // Check for ability replacement (Weapon Finesse)
                if (benefit.typeId === FeatBenefitType.ATTACK_ABILITY_REPLACEMENT) {
                    // Weapon Finesse: Use DEX instead of STR for light weapons, rapier, whip, or spiked chain
                    if (feat.name === 'Weapon Finesse') {
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
                                    name: feat.name,
                                },
                            });
                        }
                    }
                }
            }
        }
    } else {
        // Fallback to old method if resolvedProgressions not provided
    for (const advancement of character.advancements) {
        if (!advancement.feats) continue;

        for (const featSelection of advancement.feats) {
            // Get feat details from map if provided, otherwise skip (feat details not available)
            const feat = featsMap?.get(featSelection.featId);
            if (!feat?.benefits) continue;

            for (const benefit of feat.benefits) {
                // Check for ability replacement (Weapon Finesse)
                if (benefit.typeId === FeatBenefitType.ATTACK_ABILITY_REPLACEMENT) {
                    // Weapon Finesse: Use DEX instead of STR for light weapons, rapier, whip, or spiked chain
                    if (feat.name === 'Weapon Finesse') {
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
                                    id: featSelection.featId,
                                    name: feat.name,
                                },
                            });
                        }
                        }
                    }
                }
            }
        }
    }

    return modifications;
}


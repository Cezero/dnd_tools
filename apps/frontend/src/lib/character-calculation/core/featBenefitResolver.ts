import type {
    CharacterWithAllDetailsResponse,
    CharacterFeatureChoice,
    FeatureProgression,
} from '@shared/schema';
import { FeatBenefitType } from '@shared/static-data';
import type {
    FeatBenefit,
    FeatBenefitContext,
    FormulaModification,
} from '../types';

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
 */
export function resolveFeatBenefits(
    character: CharacterWithAllDetailsResponse,
    benefitType: FeatBenefitType,
    context?: FeatBenefitContext
): FeatBenefit[] {
    const benefits: FeatBenefit[] = [];

    for (const advancement of character.advancements) {
        if (!advancement.feats) continue;

        for (const featSelection of advancement.feats) {
            const feat = featSelection.feat;
            if (!feat?.benefits) continue;

            for (const benefit of feat.benefits) {
                if (benefit.typeId !== benefitType) continue;

                // Handle useSubId feats (player choice feats)
                if (feat.useSubId) {
                    // Check CharacterFeatureChoice for player's selection
                    const choice = findFeatureChoiceForFeat(character, feat.id);
                    if (!choice) continue;

                    // For item-specific benefits, check if itemId matches
                    if (context?.itemId && choice.appliesToSubId !== context.itemId) {
                        continue;
                    }

                    benefits.push({
                        amount: benefit.amount ?? 0,
                        source: {
                            type: 'feat',
                            id: feat.id,
                            name: feat.name,
                        },
                        context: {
                            itemId: choice.appliesToSubId ?? undefined,
                            attackType: context?.attackType,
                        },
                    });
                } else {
                    // For non-useSubId feats, referenceId is the entity ID
                    // For item-specific benefits, check if itemId matches
                    if (context?.itemId && benefit.referenceId !== context.itemId) {
                        continue;
                    }

                    // Context filtering for Two-Weapon Fighting
                    if (feat.name === 'Two-Weapon Fighting') {
                        // Only apply when dual-wielding
                        if (
                            context?.attackType !== 'dual-wield' &&
                            context?.attackType !== 'main-hand' &&
                            context?.attackType !== 'off-hand'
                        ) {
                            continue;
                        }
                        // Filter by amount: 2 = main hand, 6 = off-hand
                        const isOffHand = context?.attackType === 'off-hand';
                        if (isOffHand && benefit.amount !== 6) continue;
                        if (!isOffHand && benefit.amount !== 2) continue;
                    }

                    benefits.push({
                        amount: benefit.amount ?? 0,
                        source: {
                            type: 'feat',
                            id: feat.id,
                            name: feat.name,
                        },
                        context: {
                            itemId: benefit.referenceId ?? undefined,
                            attackType: context?.attackType,
                        },
                    });
                }
            }
        }
    }

    return benefits;
}

/**
 * Resolve formula modifications from feats
 */
export function resolveFeatFormulaModifications(
    character: CharacterWithAllDetailsResponse,
    context?: FeatBenefitContext
): FormulaModification[] {
    const modifications: FormulaModification[] = [];

    for (const advancement of character.advancements) {
        if (!advancement.feats) continue;

        for (const featSelection of advancement.feats) {
            const feat = featSelection.feat;
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
                                    id: feat.id,
                                    name: feat.name,
                                },
                            });
                        }
                    }
                }
            }
        }
    }

    return modifications;
}


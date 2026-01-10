import type { CharacterWithAllDetailsResponse, FeatureProgression, Feat } from '@shared/schema';
import { AbilityId, GetAbilityModifier, EntityAppliesToType } from '@shared/static-data';
import { resolveFeatBenefits } from '../core/featBenefitResolver';
import { resolveFeatureBonuses } from '../core/featureBonusResolver';
import { buildBreakdownString, createBreakdownComponent } from '../utils/breakdownBuilder';
import { getAbilityScore } from './abilityScore';
import type { CalculationResult } from '../types';

/**
 * Breakdown map for initiative
 */
export interface InitiativeBreakdownMap {
    dexMod: { value: number; source: string | null; sourceType: 'ability' | null; sourceId?: number };
    feat: { value: number; source: string | null; sourceType: 'feat' | null; sourceId?: number };
    feature: { value: number; source: string | null; sourceType: 'feature' | null; sourceId?: number };
    item: { value: number; source: string | null; sourceType: 'item' | null; sourceId?: number };
}

/**
 * Get initiative modifier
 */
export function getInitiative(
    character: CharacterWithAllDetailsResponse,
    resolvedProgressions: FeatureProgression[],
    featsMap?: Map<number, Feat>
): CalculationResult<InitiativeBreakdownMap> {
    // Get Dex modifier using total ability score (base + racial modifiers + feat bonuses, etc.)
    const dexScoreResult = getAbilityScore(character, AbilityId.Dexterity, resolvedProgressions, featsMap);
    const dexTotalValue = dexScoreResult.value;
    const dexMod = GetAbilityModifier(dexTotalValue);

    // Get feat benefits
    const featBenefits = resolveFeatBenefits(character, EntityAppliesToType.Initiative, undefined, featsMap, resolvedProgressions);
    const featBonus = featBenefits.reduce((sum, b) => sum + b.amount, 0);

    // Get feature bonuses
    const featureBonuses = resolveFeatureBonuses(
        resolvedProgressions,
        EntityAppliesToType.Initiative,
        character,
        character.advancements.length
    );
    const featureBonus = featureBonuses.reduce((sum, b) => sum + b.value, 0);

    // Item bonuses (would come from equipped items)
    const itemBonus = 0; // TODO: Implement item bonus resolution

    // Calculate total
    const total = dexMod + featBonus + featureBonus + itemBonus;

    // Build breakdown
    const breakdown: InitiativeBreakdownMap = {
        dexMod: createBreakdownComponent(dexMod, 'Dex modifier', 'ability', AbilityId.Dexterity),
        feat: createBreakdownComponent(
            featBonus,
            featBonus > 0 ? `Feat: ${featBenefits.map(b => b.source.name).join(', ')}` : null,
            featBonus > 0 ? 'feat' : null,
            featBenefits[0]?.source.id
        ),
        feature: createBreakdownComponent(
            featureBonus,
            featureBonus > 0 ? `Feature: ${featureBonuses.map(b => b.source.name).join(', ')}` : null,
            featureBonus > 0 ? 'feature' : null,
            featureBonuses[0]?.source.id
        ),
        item: createBreakdownComponent(itemBonus, itemBonus > 0 ? 'item' : null, itemBonus > 0 ? 'item' : null),
    };

    const breakdownString = buildBreakdownString(breakdown);

    return {
        value: total,
        breakdownString: `Initiative: ${breakdownString}`,
        breakdown,
    };
}


import type { CharacterWithAllDetailsResponse, FeatureProgression } from '@shared/schema';
import { AbilityId, GetAbilityModifier } from '@shared/static-data';
import { resolveFeatBenefits } from '../core/featBenefitResolver';
import { resolveFeatureBonuses } from '../core/featureBonusResolver';
import { FeatBenefitType, EntityAppliesToType } from '@shared/static-data';
import { buildBreakdownString, createBreakdownComponent } from '../utils/breakdownBuilder';
import type { CalculationResult } from '../types';

/**
 * Breakdown map for ability score
 */
export interface AbilityScoreBreakdownMap {
    base: { value: number; source: string | null; sourceType: 'base' | null; sourceId?: number };
    advancement: { value: number; source: string | null; sourceType: 'advancement' | null; sourceId?: number };
    feat: { value: number; source: string | null; sourceType: 'feat' | null; sourceId?: number };
    feature: { value: number; source: string | null; sourceType: 'feature' | null; sourceId?: number };
    item: { value: number; source: string | null; sourceType: 'item' | null; sourceId?: number };
}

/**
 * Get ability score with all bonuses applied
 */
export function getAbilityScore(
    character: CharacterWithAllDetailsResponse,
    abilityId: number,
    resolvedProgressions: FeatureProgression[]
): CalculationResult<AbilityScoreBreakdownMap> {
    // Get base ability score
    const abilityScore = character.abilityScores.find(a => a.abilityId === abilityId);
    const baseValue = abilityScore?.value ?? 10;

    // Sum advancement bonuses (ability score improvements)
    let advancementBonus = 0;
    for (const advancement of character.advancements) {
        if (advancement.abilityId === abilityId) {
            advancementBonus += 1; // Each advancement adds +1
        }
    }

    // Get feat benefits
    const featBenefits = resolveFeatBenefits(
        character,
        FeatBenefitType.SKILL, // Note: Ability bonuses might be a different type, but for now using SKILL
        { abilityId }
    );
    const featBonus = featBenefits.reduce((sum, b) => sum + b.amount, 0);

    // Get feature bonuses
    const featureBonuses = resolveFeatureBonuses(
        resolvedProgressions,
        EntityAppliesToType.Ability,
        character,
        character.advancements.length,
        { abilityId }
    );
    const featureBonus = featureBonuses.reduce((sum, b) => sum + b.value, 0);

    // Item bonuses (would come from equipped items)
    const itemBonus = 0; // TODO: Implement item bonus resolution

    // Calculate total
    const total = baseValue + advancementBonus + featBonus + featureBonus + itemBonus;

    // Build breakdown
    const breakdown: AbilityScoreBreakdownMap = {
        base: createBreakdownComponent(baseValue, 'base', 'base'),
        advancement: createBreakdownComponent(
            advancementBonus,
            advancementBonus > 0 ? 'ability score improvements' : null,
            'advancement'
        ),
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
        breakdownString: `Ability Score: ${breakdownString}`,
        breakdown,
    };
}

/**
 * Get ability modifier with all bonuses applied
 */
export function getAbilityModifierWithBonuses(
    character: CharacterWithAllDetailsResponse,
    abilityId: number,
    resolvedProgressions: FeatureProgression[]
): number {
    const result = getAbilityScore(character, abilityId, resolvedProgressions);
    return GetAbilityModifier(result.value);
}


import type { CharacterWithAllDetailsResponse, FeatureProgression, Feat } from '@shared/schema';
import { AbilityId, GetAbilityModifier } from '@shared/static-data';
import { resolveFeatBenefits } from '../core/featBenefitResolver';
import { resolveFeatureBonuses } from '../core/featureBonusResolver';
import { FeatBenefitType, EntityAppliesToType } from '@shared/static-data';
import { buildBreakdownString, createBreakdownComponent } from '../utils/breakdownBuilder';
import type { CalculationResult, BreakdownMap, TypedBreakdownComponent } from '../types';

/**
 * Breakdown map for ability score
 */
export interface AbilityScoreBreakdownMap extends BreakdownMap {
    base: TypedBreakdownComponent<'base'>;
    advancement: TypedBreakdownComponent<'advancement'>;
    feat: TypedBreakdownComponent<'feat'>;
    feature: TypedBreakdownComponent<'feature'>;
    item: TypedBreakdownComponent<'item'>;
}

/**
 * Get ability score with all bonuses applied
 */
export function getAbilityScore(
    character: CharacterWithAllDetailsResponse,
    abilityId: number,
    resolvedProgressions: FeatureProgression[],
    featsMap?: Map<number, Feat>
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
        { abilityId },
        featsMap,
        resolvedProgressions
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
        base: createBreakdownComponent(baseValue, 'base', 'base') as TypedBreakdownComponent<'base'>,
        advancement: createBreakdownComponent(
            advancementBonus,
            advancementBonus > 0 ? 'ability score improvements' : null,
            'advancement'
        ) as TypedBreakdownComponent<'advancement'>,
        feat: createBreakdownComponent(
            featBonus,
            featBonus > 0 ? `Feat: ${featBenefits.map(b => b.source.name).join(', ')}` : null,
            featBonus > 0 ? 'feat' : null,
            featBenefits[0]?.source.id
        ) as TypedBreakdownComponent<'feat'>,
        feature: createBreakdownComponent(
            featureBonus,
            featureBonus > 0 ? `Feature: ${featureBonuses.map(b => b.source.name).join(', ')}` : null,
            featureBonus > 0 ? 'feature' : null,
            featureBonuses[0]?.source.id
        ) as TypedBreakdownComponent<'feature'>,
        item: createBreakdownComponent(itemBonus, itemBonus > 0 ? 'item' : null, itemBonus > 0 ? 'item' : null) as TypedBreakdownComponent<'item'>,
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
    resolvedProgressions: FeatureProgression[],
    featsMap?: Map<number, Feat>
): number {
    const result = getAbilityScore(character, abilityId, resolvedProgressions, featsMap);
    return GetAbilityModifier(result.value);
}


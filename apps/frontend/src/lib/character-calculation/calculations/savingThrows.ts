import type { CharacterWithAllDetailsResponse, FeatureProgression } from '@shared/schema';
import { AbilityId, GetAbilityModifier, ABILITY_MAP } from '@shared/static-data';
import { resolveFeatBenefits } from '../core/featBenefitResolver';
import { resolveFeatureBonuses } from '../core/featureBonusResolver';
import { FeatBenefitType, EntityAppliesToType } from '@shared/static-data';
import { buildBreakdownString, createBreakdownComponent } from '../utils/breakdownBuilder';
import type { CalculationResult } from '../types';

/**
 * Save type enum
 */
export const SaveType = {
    Fortitude: 1,
    Reflex: 2,
    Will: 3,
} as const;

/**
 * Breakdown map for saving throw
 */
export interface SavingThrowBreakdownMap {
    base: { value: number; source: string | null; sourceType: 'base' | null; sourceId?: number };
    abilityMod: { value: number; source: string | null; sourceType: 'ability' | null; sourceId?: number };
    feat: { value: number; source: string | null; sourceType: 'feat' | null; sourceId?: number };
    feature: { value: number; source: string | null; sourceType: 'feature' | null; sourceId?: number };
    item: { value: number; source: string | null; sourceType: 'item' | null; sourceId?: number };
}

/**
 * Get saving throw modifier
 */
export function getSavingThrow(
    character: CharacterWithAllDetailsResponse,
    saveType: number,
    resolvedProgressions: FeatureProgression[],
    classDetailsMap: Map<number, { saveProgression?: string }>
): CalculationResult<SavingThrowBreakdownMap> {
    // Determine ability score for this save
    let abilityId: number;
    if (saveType === SaveType.Fortitude) {
        abilityId = AbilityId.Constitution;
    } else if (saveType === SaveType.Reflex) {
        abilityId = AbilityId.Dexterity;
    } else {
        abilityId = AbilityId.Wisdom; // Will
    }

    // Get ability modifier
    const abilityScore = character.abilityScores.find(a => a.abilityId === abilityId);
    const abilityValue = abilityScore?.value ?? 10;
    const abilityMod = GetAbilityModifier(abilityValue);

    // Calculate base save from class levels
    // TODO: Implement proper base save calculation from class progressions
    let baseSave = 0;
    const classLevelCounts = new Map<number, number>();
    for (const advancement of character.advancements) {
        const currentLevel = classLevelCounts.get(advancement.classId) ?? 0;
        classLevelCounts.set(advancement.classId, currentLevel + 1);
    }

    // Calculate base save from class progressions
    for (const [classId, level] of classLevelCounts.entries()) {
        const classDetails = classDetailsMap.get(classId);
        if (classDetails?.saveProgression) {
            // Parse save progression (e.g., "good" = +2 per level after 1st, "poor" = +1 per 3 levels)
            // This is simplified - actual implementation would need proper parsing
            if (classDetails.saveProgression === 'good') {
                baseSave += Math.floor(level / 2) + 2;
            } else {
                baseSave += Math.floor(level / 3);
            }
        }
    }

    // Get feat benefits
    const featBenefits = resolveFeatBenefits(character, FeatBenefitType.SAVE, { saveType });
    const featBonus = featBenefits.reduce((sum, b) => sum + b.amount, 0);

    // Get feature bonuses
    const featureBonuses = resolveFeatureBonuses(
        resolvedProgressions,
        EntityAppliesToType.SavingThrow,
        character,
        character.advancements.length,
        { saveType }
    );
    const featureBonus = featureBonuses.reduce((sum, b) => sum + b.value, 0);

    // Item bonuses (would come from equipped items)
    const itemBonus = 0; // TODO: Implement item bonus resolution

    // Calculate total
    const total = baseSave + abilityMod + featBonus + featureBonus + itemBonus;

    // Build breakdown
    const breakdown: SavingThrowBreakdownMap = {
        base: createBreakdownComponent(baseSave, 'base save', 'base'),
        abilityMod: createBreakdownComponent(
            abilityMod,
            `${ABILITY_MAP[abilityId]?.abbreviation ?? 'MOD'} modifier`,
            'ability',
            abilityId
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
        breakdownString: `Saving Throw: ${breakdownString}`,
        breakdown,
    };
}


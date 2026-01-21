import { extractRaceMechanics } from '@/lib/feature-extraction/raceMechanicsExtractor';
import { getRaceNameFromCache } from '@/services/cache/raceCache';
import type { CharacterWithAllDetailsResponse, FeatureWithRelations } from '@shared/schema';
import { AbilityId, GetAbilityModifier, SIZE_MAP, ARMOR_CATEGORY_ENUM, EntityAppliesToType, SizeId } from '@shared/static-data';

import { getAbilityScore } from './abilityScore';
import { resolveFeatureBonuses, resolveFeatureFormulaModifications } from '../core/featureBonusResolver';
import { getAdditionalAbilityModifiers } from '../core/formulaModifier';
import type { CalculationResult, BreakdownMap, BreakdownComponent } from '../types';
import { createBreakdownComponent } from '../utils/breakdownBuilder';
import { resolveStandardBonuses, buildCalculationResult } from '../utils/calculationHelpers';

/**
 * Breakdown map for armor class calculation.
 * 
 * Follows the standard breakdown component architecture pattern:
 * - Extends BreakdownMap to ensure compatibility with breakdown utilities
 * - Uses BreakdownComponent for all fields (not custom inline types)
 * 
 * @see {@link BreakdownComponent} for the standard breakdown component structure
 * @see {@link BreakdownMap} for the base breakdown map interface
 */
export interface ACBreakdownMap extends BreakdownMap {
    base: BreakdownComponent;
    armor: BreakdownComponent;
    shield: BreakdownComponent;
    dex: BreakdownComponent;
    size: BreakdownComponent;
    natural: BreakdownComponent;
    deflection: BreakdownComponent;
    misc: BreakdownComponent;
}

/**
 * Get armor class with all bonuses applied
 */
export function getAC(
    character: CharacterWithAllDetailsResponse,
    resolvedProgressions: FeatureWithRelations[],
    items?: Array<{ id: number; armor?: { bonus: number | null; category?: number }; weapon?: unknown }>
): CalculationResult<ACBreakdownMap> {
    // Base AC
    const baseAC = 10;

    // Get Dex modifier using total ability score (base + racial modifiers + feat bonuses, etc.)
    const dexScoreResult = getAbilityScore(character, AbilityId.Dexterity, resolvedProgressions);
    const dexTotalValue = dexScoreResult.value;
    const dexMod = GetAbilityModifier(dexTotalValue);

    // Get size modifier from race (extract from resolved features)
    const raceMechanics = character.raceId ? extractRaceMechanics(resolvedProgressions, character.raceId) : null;
    const raceSizeId = raceMechanics?.sizeId ?? SizeId.Medium; // Default to Medium
    const sizeMod = SIZE_MAP[raceSizeId as keyof typeof SIZE_MAP]?.sizeModifier ?? 0;

    // Get armor bonus from equipped items (exclude shields - they have separate bonus)
    let armorBonus = 0;
    let armorSource: string | null = null;
    if (items) {
        for (const item of items) {
            if (item.armor?.bonus) {
                // If category is undefined, treat as armor (not shield)
                const isShield = item.armor.category === ARMOR_CATEGORY_ENUM.Shield;
                if (!isShield) {
                    armorBonus = item.armor.bonus;
                    armorSource = `armor: ${item.id}`; // TODO: Get actual item name
                    break; // Only one armor piece
                }
            }
        }
    }

    // Get shield bonus from equipped items
    let shieldBonus = 0;
    let shieldSource: string | null = null;
    if (items) {
        for (const item of items) {
            if (item.armor?.bonus && item.armor.category === ARMOR_CATEGORY_ENUM.Shield) {
                shieldBonus = item.armor.bonus;
                shieldSource = `shield: ${item.id}`; // TODO: Get actual item name
                break; // Only one shield
            }
        }
    }

    // Get natural armor from features/race
    const naturalBonuses = resolveFeatureBonuses(
        resolvedProgressions,
        EntityAppliesToType.AC,
        character,
        character.advancements.length
    );
    // Filter for natural armor (would need to check entity type or source)
    let naturalAC = 0;
    let naturalSource: string | null = null;
    // TODO: Better detection of natural armor vs other AC bonuses

    // Get deflection bonus from items/features
    let deflectionAC = 0;
    let deflectionSource: string | null = null;
    // TODO: Implement deflection bonus detection

    // Get standard bonuses (feat and feature)
    // Note: AC bonuses from feats would typically be through FeatureEntity with appliesTo: AC
    const { featBonus, featBenefits, featureBonuses } = resolveStandardBonuses(
        character,
        EntityAppliesToType.AC,
        resolvedProgressions
    );

    // Get formula modifications (e.g., Monk AC adds WIS)
    const formulaModifications = resolveFeatureFormulaModifications(resolvedProgressions, character, character.advancements.length);
    const additionalAbilityMods = getAdditionalAbilityModifiers(
        formulaModifications,
        character.abilityScores.map(a => ({ abilityId: a.abilityId, value: a.value })),
        GetAbilityModifier
    );

    // Sum additional ability modifiers (e.g., WIS for Monk AC)
    let additionalAbilityBonus = 0;
    let additionalAbilitySource: string | null = null;
    if (additionalAbilityMods.length > 0) {
        additionalAbilityBonus = additionalAbilityMods.reduce((sum, mod) => sum + mod.modifier, 0);
        additionalAbilitySource = additionalAbilityMods.map(mod => `${mod.source} (${mod.abilityId})`).join(', ');
    }

    // Sum other feature bonuses (non-ability-based, excluding formula modifications)
    const filteredFeatureBonuses = featureBonuses.filter(b => !formulaModifications.some(m => m.source.id === b.source.id));
    const filteredOtherFeatureBonus = filteredFeatureBonuses.reduce((sum, b) => sum + b.value, 0);
    const otherFeatureSource = filteredFeatureBonuses
        .map(b => b.source.name)
        .join(', ') || null;

    // Calculate misc bonus (feats + features that aren't natural/deflection)
    const miscAC = featBonus + filteredOtherFeatureBonus + additionalAbilityBonus;

    // Calculate total
    const totalAC = baseAC + armorBonus + shieldBonus + dexMod + sizeMod + naturalAC + deflectionAC + miscAC;

    // Build breakdown
    const breakdown: ACBreakdownMap = {
        base: createBreakdownComponent(baseAC, 'base', 'base'),
        armor: createBreakdownComponent(armorBonus, armorSource, armorBonus > 0 ? 'item' : null),
        shield: createBreakdownComponent(shieldBonus, shieldSource, shieldBonus > 0 ? 'item' : null),
        dex: createBreakdownComponent(dexMod, 'Dex modifier', 'ability', AbilityId.Dexterity),
        size: createBreakdownComponent(sizeMod, character.raceId ? getRaceNameFromCache(character.raceId) ?? 'size' : 'size', 'base'),
        natural: createBreakdownComponent(naturalAC, naturalSource, naturalAC > 0 ? 'feature' : null),
        deflection: createBreakdownComponent(deflectionAC, deflectionSource, deflectionAC > 0 ? 'item' : null),
        misc: createBreakdownComponent(
            miscAC,
            miscAC > 0
                ? [
                    additionalAbilitySource,
                    otherFeatureSource,
                    featBonus > 0 ? `Feat: ${featBenefits.map(b => b.source.name).join(', ')}` : null,
                ]
                    .filter(Boolean)
                    .join(', ') || null
                : null,
            miscAC > 0 ? (additionalAbilityBonus > 0 ? 'formula_modification' : 'feature') : null,
            additionalAbilityMods[0] ? formulaModifications.find(m => m.type === 'ability_addition')?.source.id : undefined
        ),
    };

    return buildCalculationResult(
        totalAC,
        breakdown,
        'AC',
        formulaModifications.filter(m => m.type === 'ability_addition')
    );
}

/**
 * Get touch AC (AC without armor, shield, natural armor)
 */
export function getTouchAC(
    character: CharacterWithAllDetailsResponse,
    resolvedProgressions: FeatureWithRelations[],
    items?: Array<{ id: number; armor?: { bonus: number | null; category?: number }; weapon?: unknown }>
): number {
    const acResult = getAC(character, resolvedProgressions, items);
    // Touch AC = base + dex + size + deflection + misc (no armor, shield, natural)
    return (
        acResult.breakdown.base.value +
        acResult.breakdown.dex.value +
        acResult.breakdown.size.value +
        acResult.breakdown.deflection.value +
        acResult.breakdown.misc.value
    );
}

/**
 * Get flat-footed AC (AC without Dex modifier and without Dodge bonuses)
 * 
 * Flat-footed AC includes: base + armor + shield + size + natural + deflection + misc (excluding Dex and Dodge)
 */
export function getFlatFootedAC(
    character: CharacterWithAllDetailsResponse,
    resolvedProgressions: FeatureWithRelations[],
    items?: Array<{ id: number; armor?: { bonus: number | null; category?: number }; weapon?: unknown }>
): number {
    const acResult = getAC(character, resolvedProgressions, items);
    // Flat-footed AC = base + armor + shield + size + natural + deflection + misc (no dex, no dodge)
    // Note: Dodge bonuses would need to be filtered from misc if bonusType tracking is implemented
    return (
        acResult.breakdown.base.value +
        acResult.breakdown.armor.value +
        acResult.breakdown.shield.value +
        acResult.breakdown.size.value +
        acResult.breakdown.natural.value +
        acResult.breakdown.deflection.value +
        acResult.breakdown.misc.value
    );
}


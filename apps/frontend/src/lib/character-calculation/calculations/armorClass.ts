import type { CharacterWithAllDetailsResponse, FeatureProgression } from '@shared/schema';
import { AbilityId, GetAbilityModifier, SIZE_MAP } from '@shared/static-data';
import { resolveFeatBenefits } from '../core/featBenefitResolver';
import { resolveFeatureBonuses, resolveFeatureFormulaModifications } from '../core/featureBonusResolver';
import { FeatBenefitType, EntityAppliesToType } from '@shared/static-data';
import { buildBreakdownString, createBreakdownComponent } from '../utils/breakdownBuilder';
import { getAdditionalAbilityModifiers } from '../core/formulaModifier';
import type { CalculationResult } from '../types';

/**
 * Breakdown map for AC
 */
export interface ACBreakdownMap {
    base: { value: number; source: string | null; sourceType: 'base' | null; sourceId?: number };
    armor: { value: number; source: string | null; sourceType: 'item' | null; sourceId?: number };
    shield: { value: number; source: string | null; sourceType: 'item' | null; sourceId?: number };
    dex: { value: number; source: string | null; sourceType: 'ability' | null; sourceId?: number };
    size: { value: number; source: string | null; sourceType: 'base' | null; sourceId?: number };
    natural: { value: number; source: string | null; sourceType: 'feature' | null; sourceId?: number };
    deflection: { value: number; source: string | null; sourceType: 'item' | null; sourceId?: number };
    misc: { value: number; source: string | null; sourceType: 'feat' | 'feature' | 'formula_modification' | null; sourceId?: number };
}

/**
 * Get armor class with all bonuses applied
 */
export function getAC(
    character: CharacterWithAllDetailsResponse,
    resolvedProgressions: FeatureProgression[],
    items?: Array<{ id: number; armor?: { bonus: number | null }; weapon?: unknown }>
): CalculationResult<ACBreakdownMap> {
    // Base AC
    const baseAC = 10;

    // Get Dex modifier
    const dexScore = character.abilityScores.find(a => a.abilityId === AbilityId.Dexterity);
    const dexValue = dexScore?.value ?? 10;
    const dexMod = GetAbilityModifier(dexValue);

    // Get size modifier from race
    const raceSizeId = character.race?.sizeId ?? 5; // Default to Medium
    const sizeMod = SIZE_MAP[raceSizeId as keyof typeof SIZE_MAP]?.sizeModifier ?? 0;

    // Get armor bonus from equipped items
    let armorBonus = 0;
    let armorSource: string | null = null;
    if (items) {
        for (const item of items) {
            if (item.armor?.bonus) {
                armorBonus = item.armor.bonus;
                armorSource = `armor: ${item.id}`; // TODO: Get actual item name
                break; // Only one armor piece
            }
        }
    }

    // Get shield bonus from equipped items
    let shieldBonus = 0;
    let shieldSource: string | null = null;
    // TODO: Implement shield detection from items

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

    // Get feat benefits
    const featBenefits = resolveFeatBenefits(character, FeatBenefitType.ATTACK_BONUS); // Note: AC might need different type
    const featBonus = 0; // TODO: Check if feats can directly affect AC

    // Get feature bonuses (including formula modifications like Monk AC)
    const featureBonuses = resolveFeatureBonuses(
        resolvedProgressions,
        EntityAppliesToType.AC,
        character,
        character.advancements.length
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

    // Sum other feature bonuses (non-ability-based)
    const otherFeatureBonus = featureBonuses
        .filter(b => !formulaModifications.some(m => m.source.id === b.source.id))
        .reduce((sum, b) => sum + b.value, 0);
    const otherFeatureSource = featureBonuses
        .filter(b => !formulaModifications.some(m => m.source.id === b.source.id))
        .map(b => b.source.name)
        .join(', ') || null;

    // Calculate misc bonus (feats + features that aren't natural/deflection)
    const miscAC = featBonus + otherFeatureBonus + additionalAbilityBonus;

    // Calculate total
    const totalAC = baseAC + armorBonus + shieldBonus + dexMod + sizeMod + naturalAC + deflectionAC + miscAC;

    // Build breakdown
    const breakdown: ACBreakdownMap = {
        base: createBreakdownComponent(baseAC, 'base', 'base'),
        armor: createBreakdownComponent(armorBonus, armorSource, armorBonus > 0 ? 'item' : null),
        shield: createBreakdownComponent(shieldBonus, shieldSource, shieldBonus > 0 ? 'item' : null),
        dex: createBreakdownComponent(dexMod, 'Dex modifier', 'ability', AbilityId.Dexterity),
        size: createBreakdownComponent(sizeMod, character.race?.name ?? 'size', 'base'),
        natural: createBreakdownComponent(naturalAC, naturalSource, naturalAC > 0 ? 'feature' : null),
        deflection: createBreakdownComponent(deflectionAC, deflectionSource, deflectionAC > 0 ? 'item' : null),
        misc: createBreakdownComponent(
            miscAC,
            miscAC > 0
                ? [
                      additionalAbilitySource,
                      otherFeatureSource,
                      featBonus > 0 ? 'feat' : null,
                  ]
                      .filter(Boolean)
                      .join(', ') || null
                : null,
            miscAC > 0 ? (additionalAbilityBonus > 0 ? 'formula_modification' : 'feature') : null,
            additionalAbilityMods[0] ? formulaModifications.find(m => m.type === 'ability_addition')?.source.id : undefined
        ),
    };

    const breakdownString = buildBreakdownString(breakdown);

    return {
        value: totalAC,
        breakdownString: `AC: ${breakdownString}`,
        breakdown,
        formulaModifications: formulaModifications.filter(m => m.type === 'ability_addition'),
    };
}

/**
 * Get touch AC (AC without armor, shield, natural armor)
 */
export function getTouchAC(
    character: CharacterWithAllDetailsResponse,
    resolvedProgressions: FeatureProgression[]
): number {
    const acResult = getAC(character, resolvedProgressions);
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
 * Get flat-footed AC (AC without Dex modifier)
 */
export function getFlatFootedAC(
    character: CharacterWithAllDetailsResponse,
    resolvedProgressions: FeatureProgression[]
): number {
    const acResult = getAC(character, resolvedProgressions);
    // Flat-footed AC = base + armor + shield + size + natural + deflection + misc (no dex)
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


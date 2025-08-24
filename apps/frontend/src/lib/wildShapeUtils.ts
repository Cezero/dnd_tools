import { CharacterContext } from "@shared/schema";
import { ModifierAppliesToType, FeatureSpecialEffectType } from "@shared/static-data";
import { joinWithCommas } from "./formatterUtils";
import { processModifier } from "./Formatters";

/**
 * Check if an effect should be processed for wild shape
 */
export function isWildShapeEffect(effect: any): boolean {
    return effect.effectType === FeatureSpecialEffectType.WildShapeForm ||
        effect.effectType === FeatureSpecialEffectType.WildShapeSize;
}

/**
 * Check if an effect should be skipped (elemental form effect)
 */
export function shouldSkipWildShapeEffect(effect: any): boolean {
    return effect.effectType === FeatureSpecialEffectType.WildShapeForm && effect.value === 'elemental';
}

/**
 * Process wild shape effects and return formatted effects array
 */
export function processWildShapeEffects(effects: any[], hasElementalEffects: boolean): string[] {
    return (effects || [])
        .filter(effect => isWildShapeEffect(effect) && !shouldSkipWildShapeEffect(effect) && effect.value)
        .map(effect => hasElementalEffects ? `elemental: ${effect.value}` : effect.value);
}

/**
 * Process wild shape modifiers and return formatted uses string
 */
export function processWildShapeModifiers(modifiers: any[], progression: any, character?: CharacterContext): string {
    const usesValues = (modifiers || [])
        .filter(mod => mod.appliesTo === ModifierAppliesToType.Uses)
        .map(mod => processModifier(mod, progression, character))
        .filter(Boolean);

    return joinWithCommas(...usesValues);
}

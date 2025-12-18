import type { FormulaModification } from '../types';
import { AbilityId } from '@shared/static-data';

/**
 * Apply formula modifications to ability score selection
 */
export function applyAbilityModification(
    baseAbilityId: number,
    modifications: FormulaModification[],
    context?: {
        weaponType?: number;
        itemId?: number;
    }
): number {
    let currentAbilityId = baseAbilityId;

    for (const mod of modifications) {
        if (mod.type === 'ability_replacement') {
            // Check if modification applies to this context
            if (mod.context?.weaponType && context?.weaponType) {
                if (!mod.context.weaponType.includes(context.weaponType)) {
                    continue;
                }
            }
            if (mod.context?.itemIds && context?.itemId) {
                if (!mod.context.itemIds.includes(context.itemId)) {
                    continue;
                }
            }

            // Replace ability modifier
            if (currentAbilityId === mod.parameters.fromAbility) {
                currentAbilityId = mod.parameters.toAbility ?? currentAbilityId;
            }
        }
    }

    return currentAbilityId;
}

/**
 * Get additional ability modifiers (e.g., Monk AC adds WIS)
 */
export function getAdditionalAbilityModifiers(
    modifications: FormulaModification[],
    abilityScores: Array<{ abilityId: number; value: number }>,
    getAbilityModifier: (score: number) => number
): Array<{ abilityId: number; modifier: number; source: string }> {
    const additional: Array<{ abilityId: number; modifier: number; source: string }> = [];

    for (const mod of modifications) {
        if (mod.type === 'ability_addition' && mod.parameters.additionalAbility) {
            const abilityId = mod.parameters.additionalAbility;
            const abilityScore = abilityScores.find(a => a.abilityId === abilityId);
            if (abilityScore) {
                additional.push({
                    abilityId,
                    modifier: getAbilityModifier(abilityScore.value),
                    source: mod.source.name,
                });
            }
        }
    }

    return additional;
}


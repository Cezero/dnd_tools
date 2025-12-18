import type { AttackCalculationInput, AttackCalculationResult } from './types';
import {
    calculateUnarmedStrike,
    calculateMainHandAttack,
    calculateRangedAttack,
    calculateDualWield,
} from './calculations';

const ATTACK_DEFINITION_TYPE_ENUM = {
    UNARMED_STRIKE: 1,
    MAIN_HAND: 2,
    DUAL_WIELD: 3,
    RANGED: 4,
} as const;

/**
 * Calculate attack stats for an attack definition
 */
export function calculateAttackStats(input: AttackCalculationInput): AttackCalculationResult {
    const {
        attackDefinition,
        characterItems,
        items,
    } = input;

    // Handle unarmed strike
    if (attackDefinition.attackTypeId === ATTACK_DEFINITION_TYPE_ENUM.UNARMED_STRIKE) {
        return calculateUnarmedStrike(input);
    }

    // Handle dual wield
    if (attackDefinition.attackTypeId === ATTACK_DEFINITION_TYPE_ENUM.DUAL_WIELD) {
        return calculateDualWield(input);
    }

    // Handle main hand or ranged
    const mainHandItemId = attackDefinition.mainHandCharacterItemId;
    if (!mainHandItemId) {
        throw new Error('Main hand or ranged attack requires a character item');
    }

    const characterItem = characterItems.find(ci => ci.id === mainHandItemId);
    if (!characterItem) {
        throw new Error('Character item not found');
    }

    const item = items.find(i => i.id === characterItem.baseItemId);
    if (!item || !item.weapon) {
        throw new Error('Item or weapon data not found');
    }

    const isRanged = attackDefinition.attackTypeId === ATTACK_DEFINITION_TYPE_ENUM.RANGED;
    
    if (isRanged) {
        return calculateRangedAttack(input, characterItem, item);
    } else {
        return calculateMainHandAttack(input, characterItem, item);
    }
}


import { CARRYING_CAPACITY_TABLE, CARRYING_CAPACITY_SIZE_MULTIPLIERS } from '@shared/static-data';

export interface CarryingCapacityResult {
    light: number;
    medium: number;
    heavy: number;
    liftOver: number;
    liftOffGround: number;
    pushDrag: number;
}

export function calculateCarryingCapacity(strength: number, sizeId?: number): CarryingCapacityResult {
    // For strength > 29, use pattern: find base (20-29) with same ones digit, multiply by 4 for every 10 points above
    let baseStrength = strength;
    let multiplier = 1;
    if (strength > 29) {
        const onesDigit = strength % 10;
        baseStrength = 20 + onesDigit;
        const tensAbove20 = Math.floor((strength - 20) / 10);
        multiplier = Math.pow(4, tensAbove20);
    }

    const base = CARRYING_CAPACITY_TABLE[baseStrength] || CARRYING_CAPACITY_TABLE[20];
    let light = base.light * multiplier;
    let medium = base.medium * multiplier;
    let heavy = base.heavy * multiplier;

    // Apply size multiplier (for non-Medium creatures)
    if (sizeId && sizeId !== 5) { // 5 is Medium
        const sizeMultiplier = CARRYING_CAPACITY_SIZE_MULTIPLIERS[sizeId] || 1;
        light = Math.floor(light * sizeMultiplier);
        medium = Math.floor(medium * sizeMultiplier);
        heavy = Math.floor(heavy * sizeMultiplier);
    }

    return {
        light,
        medium,
        heavy,
        liftOver: heavy,
        liftOffGround: heavy * 2,
        pushDrag: heavy * 5,
    };
}


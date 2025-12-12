import { ProgressionType } from '@shared/static-data';

/**
 * Calculate a variant class ID from base class ID and variant ID
 */
export function calculateVariantId(baseClassId: number, variantId: number): number {
    return baseClassId * 100000 + variantId;
}

/**
 * Check if an ID is a variant class ID
 */
export function isVariantId(id: number): boolean {
    return id >= 100000;
}

/**
 * Extract the base class ID from a variant class ID
 */
export function extractBaseClassId(variantId: number): number {
    return Math.floor(variantId / 100000);
}

/**
 * Extract the variant ID from a variant class ID
 */
export function extractVariantId(customId: number): number {
    return customId % 100000;
}

// Good Save Progression: floor(level / 2) + 2
export function getGoodSave(level: number): number {
    return Math.floor(level / 2) + 2;
}

// Poor Save Progression: floor(level / 3)
export function getPoorSave(level: number): number {
    return Math.floor(level / 3);
}

// Good Base Attack Bonus: Level (full progression)
export function getGoodBAB(level: number): string {
    return formatIterativeBAB(level);
}

// Average Base Attack Bonus: floor(3 * level / 4)
export function getAverageBAB(level: number): string {
    const bab = Math.floor((3 * level) / 4);
    return formatIterativeBAB(bab);
}

// Poor Base Attack Bonus: floor(level / 2)
export function getPoorBAB(level: number): string {
    const bab = Math.floor(level / 2);
    return formatIterativeBAB(bab);
}

// Format iterative BAB like +11/+6/+1 etc.
function formatIterativeBAB(bab: number): string {
    if (bab <= 0) return "+0";

    const attacks: number[] = [];
    let current = bab;

    while (current > 0) {
        attacks.push(current);
        current -= 5;
    }

    return attacks.map(a => `+${a}`).join('/');
}

export function getSaveProgression(level: number, progressionType: typeof ProgressionType.good | typeof ProgressionType.poor): number {
    if (progressionType === ProgressionType.good) return getGoodSave(level);
    if (progressionType === ProgressionType.poor) return getPoorSave(level);
    throw new Error('Invalid progression type');
}

export function getBABProgression(level: number, progressionType: typeof ProgressionType.good | typeof ProgressionType.average | typeof ProgressionType.poor): string {
    if (progressionType === ProgressionType.good) return getGoodBAB(level);
    if (progressionType === ProgressionType.average) return getAverageBAB(level);
    if (progressionType === ProgressionType.poor) return getPoorBAB(level);
    throw new Error('Invalid progression type');
}

const XP_TABLE: number[] = [
    0,     // Level 1
    1000,  // Level 2
    3000,  // Level 3
    6000,  // Level 4
    10000, // Level 5
    15000, // Level 6
    21000, // Level 7
    28000, // Level 8
    36000, // Level 9
    45000, // Level 10
    55000, // Level 11
    66000, // Level 12
    78000, // Level 13
    91000, // Level 14
    105000,// Level 15
    120000,// Level 16
    136000,// Level 17
    153000,// Level 18
    171000,// Level 19
    190000 // Level 20
];

export function getXPTotalForLevel(level: number): number {
    if (level < 21) return XP_TABLE[level];

    // XP at level 20 is 190,000
    // XP increase from level 21 onward is: ∑(i * 1000) for i = 21 to level
    const baseXP = 190000;
    const n = level;
    const m = 20;

    // Sum from m+1 to n: S = 1000 * (n(n+1)/2 - m(m+1)/2)
    const xp = baseXP + 1000 * ((n * (n + 1) - m * (m + 1)) / 2);
    return xp;
}

export function getClassSkillMaxRanks(level: number): number {
    return level + 3;
}

export function getCrossClassSkillMaxRanks(level: number): number {
    return (level + 3) / 2;
}

export function formatHalfRank(ranks: number): string {
    const whole = Math.floor(ranks);
    return ranks === whole
        ? `${whole}`
        : `${whole}-1/2`;
}

export function getFeatCount(level: number): number {
    return 1 + Math.floor((level - 1) / 3);
}

export function getAbilityScoreIncreases(level: number): number {
    return Math.floor(level / 4);
}


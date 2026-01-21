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



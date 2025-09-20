import { ClassSummary, GetAllClassesQuery } from '@shared/schema';
import { ProgressionType } from '@shared/static-data';

import { ClassApi } from './ClassApi';

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

// Select lists for progression types
export const BAB_PROGRESSION_LIST = [
    { id: ProgressionType.good, name: 'Good' },
    { id: ProgressionType.average, name: 'Average' },
    { id: ProgressionType.poor, name: 'Poor' },
];

export const SAVE_PROGRESSION_LIST = [
    { id: ProgressionType.good, name: 'Good' },
    { id: ProgressionType.poor, name: 'Poor' },
];

// =================
// API-based Class Data Functions
// =================

// Cache management
const classCache = new Map<string, { data: ClassSummary[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get classes for a specific edition with optional filtering
 */
export async function getClassesForEdition(editionId: number, options?: {
    includeVariants?: boolean;
    includePrestige?: boolean;
    canCastSpells?: boolean;
    isVisible?: boolean;
}): Promise<ClassSummary[]> {
    const cacheKey = `${editionId}-${JSON.stringify(options || {})}`;

    // Check cache first
    if (classCache.has(cacheKey)) {
        const cached = classCache.get(cacheKey)!;
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }
    }

    // Build query
    const query: GetAllClassesQuery = {
        editionId,
        baseClassesOnly: !options?.includeVariants,
        isPrestige: options?.includePrestige,
        isVisible: options?.isVisible,
        canCastSpells: options?.canCastSpells
    };

    try {
        const response = await ClassApi.getClasses(query);

        // Cache the result
        classCache.set(cacheKey, {
            data: response.results,
            timestamp: Date.now()
        });

        return response.results;
    } catch (error) {
        console.error('Failed to fetch classes:', error);
        return [];
    }
}

/**
 * Get a single class by ID
 */
export async function getClassById(classId: number): Promise<ClassSummary | null> {
    try {
        const classData = await ClassApi.getClassById(undefined, { id: classId });
        // The API returns BaseClassSchema, but we need ClassSummary
        // We need to construct ClassSummary by adding the id field
        return {
            id: classId,
            name: classData.name,
            abbreviation: classData.abbreviation,
            editionId: classData.editionId,
            isPrestige: classData.isPrestige,
            isVisible: classData.isVisible,
            canCastSpells: classData.canCastSpells,
            spellsKnown: classData.spellsKnown,
            hitDie: classData.hitDie,
            skillPoints: classData.skillPoints,
            castingAbilityId: classData.castingAbilityId,
            castingType: classData.castingType,
            babProgression: classData.babProgression,
            fortProgression: classData.fortProgression,
            refProgression: classData.refProgression,
            willProgression: classData.willProgression,
            description: classData.description,
            sourceBookInfo: classData.sourceBookInfo
        } as ClassSummary;
    } catch (error) {
        console.error(`Failed to fetch class ${classId}:`, error);
        return null;
    }
}

/**
 * Get classes suitable for spell selection (can cast spells, visible, not excluded)
 */
export async function getClassesForSpellSelection(editionId: number, excludeIds: number[] = []): Promise<ClassSummary[]> {
    const classes = await getClassesForEdition(editionId, {
        canCastSpells: true,
        isVisible: true
    });

    return classes.filter(cls => !excludeIds.includes(cls.id));
}

/**
 * Get a map of classes by ID for a specific edition
 */
export async function getClassMap(editionId: number): Promise<Record<number, ClassSummary>> {
    const classes = await getClassesForEdition(editionId);
    return classes.reduce((map, cls) => {
        map[cls.id] = cls;
        return map;
    }, {} as Record<number, ClassSummary>);
}

/**
 * Get all classes (including variants and prestige classes) for an edition
 */
export async function getAllClassesForEdition(editionId: number): Promise<ClassSummary[]> {
    return getClassesForEdition(editionId, {
        includeVariants: true,
        includePrestige: true,
        isVisible: true
    });
}

/**
 * Get base classes only (no variants, no prestige) for an edition
 */
export async function getBaseClassesForEdition(editionId: number): Promise<ClassSummary[]> {
    return getClassesForEdition(editionId, {
        includeVariants: false,
        includePrestige: false,
        isVisible: true
    });
}

/**
 * Clear the class cache (useful for testing or when data changes)
 */
export function clearClassCache(): void {
    classCache.clear();
}

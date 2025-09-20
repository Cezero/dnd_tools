import type { CharacterWithAllDetailsResponse, CharacterAdvancementWithDetailsResponse, DnDClass, ClassSummary } from '@shared/schema';

// Types for gestalt calculations
export interface GestaltStats {
    hitPoints: number;
    baseAttackBonus: number;
    savingThrows: {
        fortitude: number;
        reflex: number;
        will: number;
    };
    skillPoints: number;
    classSkills: number[];
    classFeatures: any[]; // Will be properly typed when we implement class features
    spellsPerDay: {
        class1Spells: Record<number, number>;
        class2Spells: Record<number, number>;
    };
}

export interface BABProgression {
    good: number;
    medium: number;
    poor: number;
}

// Character-level gestalt detection
export function isGestaltCharacter(character: CharacterWithAllDetailsResponse): boolean {
    return character.advancements.some(adv => adv.secondaryClassId !== null && adv.secondaryClassId !== 0);
}

// Get classes for a specific advancement level
export function getGestaltClassesForLevel(advancement: CharacterAdvancementWithDetailsResponse, classMap?: Record<number, ClassSummary>): {
    primary: ClassSummary | null;
    secondary: ClassSummary | null;
} {
    return {
        primary: classMap?.[advancement.classId] || null,
        secondary: advancement.secondaryClassId ? (classMap?.[advancement.secondaryClassId] || null) : null
    };
}

// Hit Die calculations
// Note: This is a placeholder implementation - will need actual class data
export function getGestaltHitDie(class1: ClassSummary, class2: ClassSummary): number {
    // Placeholder: assume all classes have d8 hit die for now
    // TODO: Implement with actual class hit die data
    return 8;
}

export function getGestaltHitPoints(level: number, class1: ClassSummary, class2: ClassSummary, conMod: number): number {
    const hitDie = getGestaltHitDie(class1, class2);
    const baseHP = level * hitDie;
    const conBonus = level * conMod;
    return baseHP + conBonus;
}

// Base Attack Bonus calculations
// Note: This is a placeholder implementation - will need actual class data
export function getGestaltBAB(level: number, class1: ClassSummary, class2: ClassSummary): number {
    // Placeholder: assume all classes have good BAB progression for now
    // TODO: Implement with actual class BAB progression data
    return level;
}

// Saving Throw calculations
// Note: This is a placeholder implementation - will need actual class data
export function getGestaltSavingThrows(level: number, class1: ClassSummary, class2: ClassSummary): {
    fortitude: number;
    reflex: number;
    will: number;
} {
    // Placeholder: assume all classes have poor save progression for now
    // TODO: Implement with actual class saving throw progression data
    return {
        fortitude: Math.floor(level / 3),
        reflex: Math.floor(level / 3),
        will: Math.floor(level / 3)
    };
}

// Skill calculations
// Note: This is a placeholder implementation - will need actual class data
export function getGestaltSkillPoints(level: number, class1: ClassSummary, class2: ClassSummary, intMod: number): number {
    // Placeholder: assume all classes have 4 skill points per level for now
    // TODO: Implement with actual class skill point data
    const baseSkillPoints = 4 + intMod;
    return level === 1 ? baseSkillPoints * 4 : baseSkillPoints;
}

export function getGestaltClassSkills(class1: ClassSummary, class2: ClassSummary): number[] {
    // Placeholder: return empty array for now
    // TODO: Implement with actual class skill data
    return [];
}

// Class Features calculations
export function getGestaltClassFeatures(level: number, class1: ClassSummary, class2: ClassSummary): any[] {
    // This is a placeholder - will need to implement based on actual class feature structure
    // For now, return empty array
    return [];
}

// Spell calculations
export function getGestaltSpellsPerDay(level: number, class1: ClassSummary, class2: ClassSummary): {
    class1Spells: Record<number, number>;
    class2Spells: Record<number, number>;
} {
    // This is a placeholder - will need to implement based on actual spell progression structure
    // For now, return empty objects
    return {
        class1Spells: {},
        class2Spells: {}
    };
}

// Main gestalt stats calculation
export function calculateGestaltStats(
    advancement: CharacterAdvancementWithDetailsResponse,
    primaryClass: ClassSummary,
    secondaryClass: ClassSummary,
    conMod: number = 0,
    intMod: number = 0
): GestaltStats {
    const level = advancement.level;

    return {
        hitPoints: getGestaltHitPoints(level, primaryClass, secondaryClass, conMod),
        baseAttackBonus: getGestaltBAB(level, primaryClass, secondaryClass),
        savingThrows: getGestaltSavingThrows(level, primaryClass, secondaryClass),
        skillPoints: getGestaltSkillPoints(level, primaryClass, secondaryClass, intMod),
        classSkills: getGestaltClassSkills(primaryClass, secondaryClass),
        classFeatures: getGestaltClassFeatures(level, primaryClass, secondaryClass),
        spellsPerDay: getGestaltSpellsPerDay(level, primaryClass, secondaryClass)
    };
}

// Validation functions
export function validateGestaltClasses(class1: ClassSummary, class2: ClassSummary): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    // Can't combine two versions of the same class
    if (class1.id === class2.id) {
        errors.push('Cannot combine a class with itself');
    }

    // Add more validation rules as needed
    // - Prestige class restrictions
    // - Prohibited combinations
    // - etc.

    return {
        isValid: errors.length === 0,
        errors
    };
}

// Helper function to get total character stats for gestalt character
export function calculateGestaltCharacterStats(character: CharacterWithAllDetailsResponse, classMap?: Record<number, ClassSummary>): GestaltStats {
    if (!isGestaltCharacter(character)) {
        throw new Error('Character is not gestalt');
    }

    // Sum up all advancement levels
    let totalStats: GestaltStats = {
        hitPoints: 0,
        baseAttackBonus: 0,
        savingThrows: { fortitude: 0, reflex: 0, will: 0 },
        skillPoints: 0,
        classSkills: [],
        classFeatures: [],
        spellsPerDay: { class1Spells: {}, class2Spells: {} }
    };

    character.advancements.forEach(advancement => {
        const { primary, secondary } = getGestaltClassesForLevel(advancement, classMap);
        if (primary && secondary) {
            const levelStats = calculateGestaltStats(advancement, primary, secondary);

            // Accumulate stats
            totalStats.hitPoints += levelStats.hitPoints;
            totalStats.baseAttackBonus = Math.max(totalStats.baseAttackBonus, levelStats.baseAttackBonus);
            totalStats.savingThrows.fortitude = Math.max(totalStats.savingThrows.fortitude, levelStats.savingThrows.fortitude);
            totalStats.savingThrows.reflex = Math.max(totalStats.savingThrows.reflex, levelStats.savingThrows.reflex);
            totalStats.savingThrows.will = Math.max(totalStats.savingThrows.will, levelStats.savingThrows.will);
            totalStats.skillPoints += levelStats.skillPoints;
            totalStats.classSkills = Array.from(new Set([...totalStats.classSkills, ...levelStats.classSkills]));
            totalStats.classFeatures = [...totalStats.classFeatures, ...levelStats.classFeatures];

            // Handle spells (this will need more complex logic)
            // For now, just merge the spell slots
            Object.keys(levelStats.spellsPerDay.class1Spells).forEach(level => {
                totalStats.spellsPerDay.class1Spells[parseInt(level)] =
                    (totalStats.spellsPerDay.class1Spells[parseInt(level)] || 0) +
                    levelStats.spellsPerDay.class1Spells[parseInt(level)];
            });
            Object.keys(levelStats.spellsPerDay.class2Spells).forEach(level => {
                totalStats.spellsPerDay.class2Spells[parseInt(level)] =
                    (totalStats.spellsPerDay.class2Spells[parseInt(level)] || 0) +
                    levelStats.spellsPerDay.class2Spells[parseInt(level)];
            });
        }
    });

    return totalStats;
}

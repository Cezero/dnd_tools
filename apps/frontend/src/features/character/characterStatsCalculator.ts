import type { CharacterWithAllDetailsResponse, DnDClass } from '@shared/schema';
import { AbilityId, GetAbilityModifier, SKILL_LIST, SpecialFeatureId, EntityAppliesToType, CRAFT_SKILL_MAP, KNOWLEDGE_SKILL_MAP, SkillSubType, SKILL_SUB_TYPE_COMPATIBILITY } from '@shared/static-data';
import { getBABProgression, getSaveProgression } from '@shared/utils';
import { ClassSkillService } from '@/features/class/ClassSkillService';

export interface CalculatedAbilityScore {
    abilityId: number;
    score: number;
    modifier: number;
}

export interface CalculatedCombatStats {
    hitPoints: number;
    armorClass: {
        total: number;
        base: number;
        armor: number;
        shield: number;
        dex: number;
        size: number;
        natural: number;
        deflection: number;
        misc: number;
    };
    touchAC: number;
    flatFootedAC: number;
    initiative: {
        total: number;
        dexMod: number;
        misc: number;
    };
    baseAttackBonus: string; // e.g., "+8/+3"
    speed: number;
}

export interface CalculatedSavingThrows {
    fortitude: {
        total: number;
        base: number;
        abilityMod: number;
        misc: number;
    };
    reflex: {
        total: number;
        base: number;
        abilityMod: number;
        misc: number;
    };
    will: {
        total: number;
        base: number;
        abilityMod: number;
        misc: number;
    };
}

export interface CalculatedSkill {
    skillId: number;
    skillSubId: number | null;
    customSubtype: string | null;
    skillName: string;
    total: number;
    abilityMod: number;
    ranks: number;
    misc: number;
    isClassSkill: boolean;
}

export interface CalculatedCharacterStats {
    abilityScores: CalculatedAbilityScore[];
    combatStats: CalculatedCombatStats;
    savingThrows: CalculatedSavingThrows;
    skills: CalculatedSkill[];
    classLevels: Array<{ classId: number; className: string; level: number }>;
    totalLevel: number;
}

/**
 * Calculate all character stats for PDF export
 */
export function calculateCharacterStats(
    character: CharacterWithAllDetailsResponse,
    classDetailsMap: Map<number, DnDClass>
): CalculatedCharacterStats {
    // Calculate ability scores and modifiers
    const abilityScores: CalculatedAbilityScore[] = [];
    for (const abilityId of [AbilityId.Strength, AbilityId.Dexterity, AbilityId.Constitution, AbilityId.Intelligence, AbilityId.Wisdom, AbilityId.Charisma]) {
        const abilityScore = character.abilityScores.find(a => a.abilityId === abilityId);
        const score = abilityScore?.value ?? 10;
        abilityScores.push({
            abilityId,
            score,
            modifier: GetAbilityModifier(score)
        });
    }

    // Calculate class levels (count levels per class)
    const classLevelCounts = new Map<number, number>();
    for (const advancement of character.advancements) {
        const currentLevel = classLevelCounts.get(advancement.classId) ?? 0;
        classLevelCounts.set(advancement.classId, currentLevel + 1);
        
        if (advancement.secondaryClassId) {
            const secondaryLevel = classLevelCounts.get(advancement.secondaryClassId) ?? 0;
            classLevelCounts.set(advancement.secondaryClassId, secondaryLevel + 1);
        }
    }

    const classLevels: Array<{ classId: number; className: string; level: number }> = [];
    for (const [classId, level] of classLevelCounts.entries()) {
        const classDetails = classDetailsMap.get(classId);
        classLevels.push({
            classId,
            className: classDetails?.name ?? `Class ${classId}`,
            level
        });
    }

    const totalLevel = character.advancements.length;

    // Calculate Base Attack Bonus

    let totalBAB = 0;
    for (const [classId, level] of classLevelCounts.entries()) {
        const classDetails = classDetailsMap.get(classId);
        if (classDetails?.babProgression !== undefined) {
            const babString = getBABProgression(level, classDetails.babProgression);
            const match = babString.match(/\+(\d+)/);
            if (match) {
                totalBAB += parseInt(match[1], 10);
            }
        }
    }

    // Format BAB with iterative attacks
    const formatBAB = (bab: number): string => {
        if (bab <= 0) return '+0';
        const attacks: number[] = [];
        let current = bab;
        while (current > 0) {
            attacks.push(current);
            current -= 5;
        }
        return attacks.map(a => `+${a}`).join('/');
    };
    const baseAttackBonus = formatBAB(totalBAB);

    // Calculate Saving Throws
    let fortBase = 0;
    let refBase = 0;
    let willBase = 0;

    // Calculate saves per class level
    for (const [classId, level] of classLevelCounts.entries()) {
        const classDetails = classDetailsMap.get(classId);
        if (classDetails) {
            fortBase += getSaveProgression(level, classDetails.fortProgression);
            refBase += getSaveProgression(level, classDetails.refProgression);
            willBase += getSaveProgression(level, classDetails.willProgression);
        }
    }

    const conMod = abilityScores.find(a => a.abilityId === AbilityId.Constitution)?.modifier ?? 0;
    const dexMod = abilityScores.find(a => a.abilityId === AbilityId.Dexterity)?.modifier ?? 0;
    const wisMod = abilityScores.find(a => a.abilityId === AbilityId.Wisdom)?.modifier ?? 0;

    const savingThrows: CalculatedSavingThrows = {
        fortitude: {
            total: fortBase + conMod,
            base: fortBase,
            abilityMod: conMod,
            misc: 0
        },
        reflex: {
            total: refBase + dexMod,
            base: refBase,
            abilityMod: dexMod,
            misc: 0
        },
        will: {
            total: willBase + wisMod,
            base: willBase,
            abilityMod: wisMod,
            misc: 0
        }
    };

    // Helper function to format skill name with subtype
    const formatSkillName = (skillId: number, skillSubId: number | null, customSubtype: string | null): string => {
        const skillData = SKILL_LIST.find(s => s.id === skillId);
        if (!skillData) return '';

        // Get subtype name
        let subtypeName = '';
        if (SKILL_SUB_TYPE_COMPATIBILITY[SkillSubType.skillSubId].includes(skillId as 6 | 19) && skillSubId) {
            if (skillId === 6) { // Skill.Craft
                const craftSubtype = CRAFT_SKILL_MAP[skillSubId as keyof typeof CRAFT_SKILL_MAP];
                subtypeName = craftSubtype ? craftSubtype.name : '';
            }
            if (skillId === 19) { // Skill.Knowledge
                const knowledgeSubtype = KNOWLEDGE_SKILL_MAP[skillSubId as keyof typeof KNOWLEDGE_SKILL_MAP];
                subtypeName = knowledgeSubtype ? knowledgeSubtype.name : '';
            }
        }
        if (SKILL_SUB_TYPE_COMPATIBILITY[SkillSubType.customSubtype].includes(skillId as 32 | 33) && customSubtype && customSubtype !== '__placeholder__') {
            subtypeName = customSubtype;
        }

        // Format display name
        if (subtypeName) {
            return `${skillData.name} (${subtypeName})`;
        }
        return skillData.name;
    };

    // Calculate skills
    const skills: CalculatedSkill[] = [];
    
    // Collect all unique skill entries (skillId + skillSubId + customSubtype combinations)
    const skillEntryMap = new Map<string, {
        skillId: number;
        skillSubId: number | null;
        customSubtype: string | null;
        totalRanks: number;
        miscBonus: number;
    }>();

    // Get all skills from SKILL_LIST (excluding analog skills and Speak Language which has no total)
    const allocatableSkills = SKILL_LIST.filter(skill => 
        skill.abilityId !== 0 && // Exclude Speak Language
        !skill.isAnalog // Exclude analog skills
    );

    // Process all skill entries from advancements
    if (character.advancements && character.advancements.length > 0) {
        for (const advancement of character.advancements) {
            const classDetails = classDetailsMap.get(advancement.classId);
            
            for (const skillEntry of (advancement.skills || [])) {
                // Only process allocatable skills
                if (!allocatableSkills.some(s => s.id === skillEntry.skillId)) {
                    continue;
                }

                // Create unique key for this skill entry
                const key = `${skillEntry.skillId}|${skillEntry.skillSubId ?? 'null'}|${skillEntry.customSubtype ?? 'null'}`;
                
                // Get or create entry
                let entry = skillEntryMap.get(key);
                if (!entry) {
                    entry = {
                        skillId: skillEntry.skillId,
                        skillSubId: skillEntry.skillSubId,
                        customSubtype: skillEntry.customSubtype,
                        totalRanks: 0,
                        miscBonus: 0
                    };
                    skillEntryMap.set(key, entry);
                }

                // Check if this skill is a class skill for this advancement's class
                const isClassSkill = ClassSkillService.isSkillClassSkillForAdvancement(
                    classDetails,
                    advancement,
                    skillEntry.skillId,
                    skillEntry.skillSubId,
                    skillEntry.customSubtype
                );

                if (isClassSkill) {
                    // Class skills: 1 point = 1 rank
                    entry.totalRanks += skillEntry.pointsSpent;
                } else {
                    // Cross-class skills: 2 points = 1 rank
                    entry.totalRanks += skillEntry.pointsSpent * 0.5;
                }
            }
        }
    }

    // Convert entries to CalculatedSkill objects
    for (const entry of skillEntryMap.values()) {
        const skillData = SKILL_LIST.find(s => s.id === entry.skillId);
        if (!skillData) continue;

        // Get ability score for this skill
        const abilityScore = abilityScores.find(a => a.abilityId === skillData.abilityId);
        const abilityMod = abilityScore?.modifier ?? 0;

        // Floor the ranks (half ranks don't count for the total)
        const ranks = Math.floor(entry.totalRanks);
        const total = ranks + abilityMod + entry.miscBonus;

        // Check if this skill is a class skill for any of the character's classes
        let isClassSkill = false;
        for (const [classId] of classLevelCounts.entries()) {
            const classDetails = classDetailsMap.get(classId);
            if (classDetails && classDetails.features) {
                const hasClassSkill = classDetails.features.some(prog =>
                    prog.featureId === SpecialFeatureId.ClassSkill &&
                    prog.entities?.some(entity =>
                        entity.appliesTo === EntityAppliesToType.Skill &&
                        entity.appliesToId === entry.skillId &&
                        (entity.appliesToSubId === entry.skillSubId || 
                         entity.appliesToSubId === -1 || 
                         (entity.appliesToSubId === null && entry.skillSubId === null))
                    )
                );
                if (hasClassSkill) {
                    isClassSkill = true;
                    break;
                }
            }
        }

        // Format skill name with subtype
        const skillName = formatSkillName(entry.skillId, entry.skillSubId, entry.customSubtype);

        skills.push({
            skillId: entry.skillId,
            skillSubId: entry.skillSubId,
            customSubtype: entry.customSubtype,
            skillName,
            total,
            abilityMod,
            ranks,
            misc: entry.miscBonus,
            isClassSkill
        });
    }

    // Also include skills with 0 ranks that don't have entries yet (for display purposes)
    // Only for skills that don't require subtypes
    for (const skillData of allocatableSkills) {
        const needsSubtype = SKILL_SUB_TYPE_COMPATIBILITY[SkillSubType.skillSubId].includes(skillData.id as 6 | 19) ||
                            SKILL_SUB_TYPE_COMPATIBILITY[SkillSubType.customSubtype].includes(skillData.id as 32 | 33);
        
        if (!needsSubtype) {
            // Check if we already have an entry for this skill (without subtype)
            const hasEntry = skills.some(s => s.skillId === skillData.id && s.skillSubId === null && s.customSubtype === null);
            if (!hasEntry) {
                const abilityScore = abilityScores.find(a => a.abilityId === skillData.abilityId);
                const abilityMod = abilityScore?.modifier ?? 0;

                // Check if this skill is a class skill
                let isClassSkill = false;
                for (const [classId] of classLevelCounts.entries()) {
                    const classDetails = classDetailsMap.get(classId);
                    if (classDetails && classDetails.features) {
                        const hasClassSkill = classDetails.features.some(prog =>
                            prog.featureId === SpecialFeatureId.ClassSkill &&
                            prog.entities?.some(entity =>
                                entity.appliesTo === EntityAppliesToType.Skill &&
                                entity.appliesToId === skillData.id &&
                                (entity.appliesToSubId === -1 || entity.appliesToSubId === null)
                            )
                        );
                        if (hasClassSkill) {
                            isClassSkill = true;
                            break;
                        }
                    }
                }

                skills.push({
                    skillId: skillData.id,
                    skillSubId: null,
                    customSubtype: null,
                    skillName: skillData.name,
                    total: abilityMod,
                    abilityMod,
                    ranks: 0,
                    misc: 0,
                    isClassSkill
                });
            }
        }
    }

    // Sort skills alphabetically by name
    skills.sort((a, b) => a.skillName.localeCompare(b.skillName));
    
    // Debug logging
    console.log('Calculated skills count:', skills.length);
    console.log('Skills with ranks > 0:', skills.filter(s => s.ranks > 0).length);
    if (skills.length > 0) {
        console.log('First few skills:', skills.slice(0, 5).map(s => ({ name: s.skillName, ranks: s.ranks, total: s.total })));
    }

    // Calculate combat stats
    const strMod = abilityScores.find(a => a.abilityId === AbilityId.Strength)?.modifier ?? 0;
    
    // Calculate HP (sum from all advancements)
    const hitPoints = character.advancements.reduce((sum, adv) => sum + adv.hitPoints, 0);

    // Calculate AC (basic calculation - would need equipment data for full calculation)
    const armorAC = 0; // Would come from equipment
    const shieldAC = 0; // Would come from equipment
    const naturalAC = 0; // Would come from race/features
    const deflectionAC = 0; // Would come from items/features
    const sizeMod = 0; // Would come from race size
    const miscAC = 0; // Would come from features/items

    const totalAC = 10 + armorAC + shieldAC + dexMod + sizeMod + naturalAC + deflectionAC + miscAC;
    const touchAC = 10 + dexMod + sizeMod + deflectionAC + miscAC;
    const flatFootedAC = 10 + armorAC + shieldAC + sizeMod + naturalAC + deflectionAC + miscAC;

    // Get speed from race (default 30 if not available)
    const speed = character.race?.speed ?? 30;

    const combatStats: CalculatedCombatStats = {
        hitPoints,
        armorClass: {
            total: totalAC,
            base: 10,
            armor: armorAC,
            shield: shieldAC,
            dex: dexMod,
            size: sizeMod,
            natural: naturalAC,
            deflection: deflectionAC,
            misc: miscAC
        },
        touchAC,
        flatFootedAC,
        initiative: {
            total: dexMod,
            dexMod,
            misc: 0
        },
        baseAttackBonus,
        speed
    };

    return {
        abilityScores,
        combatStats,
        savingThrows,
        skills,
        classLevels,
        totalLevel
    };
}


import type { FeatureProgression, FeatureEntity, CharacterWithAllDetailsResponse, FormulaParamsData } from '@shared/schema';
import { EntityType, EntityAppliesToType, SpecialFeatureId, FORMULA_MAP, FormulaId, GetAbilityModifier } from '@shared/static-data';

/**
 * Parameters for formula calculation
 * Extends FormulaParamsData with runtime calculation fields
 */
interface FormulaCalculationParams extends FormulaParamsData {
    level: number;
    startLevel: number;
    scalingValue: number;
    context: {
        character: {
            abilityScores: Record<number, number>;
        };
    };
    baseValue?: number;
}

/**
 * Backend service for extracting resolved feature data
 * Ported from frontend ResolvedFeatureService
 */
export class ResolvedFeatureService {
    /**
     * Get class skills from resolved features
     */
    static getClassSkills(resolvedProgressions: FeatureProgression[]): Array<{ skillId: number; skillSubId: number | null }> {
        const classSkills: Array<{ skillId: number; skillSubId: number | null }> = [];

        for (const progression of resolvedProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    if (this.isClassSkillEntity(entity)) {
                        if (entity.appliesToId) {
                            if (entity.appliesToSubId === -1) {
                                // All subtypes are class skills (like Knowledge domain)
                                classSkills.push({ skillId: entity.appliesToId, skillSubId: null });
                            } else if (entity.appliesToSubId) {
                                // Specific subtype is a class skill
                                classSkills.push({ skillId: entity.appliesToId, skillSubId: entity.appliesToSubId });
                            } else {
                                // Regular skill is a class skill
                                classSkills.push({ skillId: entity.appliesToId, skillSubId: null });
                            }
                        }
                    }
                }
            }
        }
        return classSkills;
    }

    /**
     * Check if a specific skill is a class skill
     */
    static isClassSkill(
        skillId: number,
        skillSubId: number | null,
        resolvedProgressions: FeatureProgression[]
    ): boolean {
        for (const progression of resolvedProgressions) {
            // Class skills are identified by progression.featureId === SpecialFeatureId.ClassSkill
            if (progression.featureId !== SpecialFeatureId.ClassSkill) {
                continue;
            }

            if (progression.entities) {
                for (const entity of progression.entities) {
                    // Check if this entity applies to skills
                    if (entity.appliesTo !== EntityAppliesToType.Skill || !entity.appliesToId) {
                        continue;
                    }

                    // Check if this entity makes all subtypes of a skill class skills
                    // If appliesToSubId === -1, it means all subtypes are class skills
                    if (entity.appliesToId === skillId && entity.appliesToSubId === -1) {
                        // If this is the base skill or any subtype of this skill, it's a class skill
                        // We check if skillSubId is null (base skill) or if it's a valid subtype
                        // For now, if skillSubId is set, we assume it's a valid subtype
                        return true;
                    }
                    // Check if this entity directly makes this skill a class skill
                    if (entity.appliesToId === skillId) {
                        if (entity.appliesToSubId === -1) {
                            // All subtypes are class skills
                            return true;
                        } else if (entity.appliesToSubId === skillSubId) {
                            // Specific subtype is a class skill
                            return true;
                        } else if (!entity.appliesToSubId && !skillSubId) {
                            // Regular skill is a class skill
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    /**
     * Get skill bonuses from resolved features
     * 
     * Includes bonuses from EntityType.Bonus and EntityType.Other entities that have values.
     * Excludes entities with conditions (those are conditional modifiers handled separately).
     */
    static getSkillBonuses(resolvedProgressions: FeatureProgression[]): Array<{ skillId: number; skillSubId: number | null; bonus: number; source: string }> {
        const skillBonuses: Array<{ skillId: number; skillSubId: number | null; bonus: number; source: string }> = [];

        for (const progression of resolvedProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    // Check if entity applies to skills and has a value
                    if (entity.appliesTo === EntityAppliesToType.Skill &&
                        entity.appliesToId !== null &&
                        entity.appliesToId !== undefined &&
                        entity.value !== null &&
                        entity.value !== undefined) {

                        // Skip entities with conditions - these are conditional modifiers
                        if (entity.conditions && entity.conditions.length > 0) {
                            continue;
                        }

                        // Include both Bonus and Other entity types that have values
                        // (racial skill bonuses and familiar benefits may be stored as Other type)
                        if (entity.type === EntityType.Bonus ||
                            (entity.type === EntityType.Other && entity.value !== 0)) {
                            const source = this.getSourceName(progression);
                            skillBonuses.push({
                                skillId: entity.appliesToId,
                                skillSubId: entity.appliesToSubId ?? null,
                                bonus: entity.value,
                                source
                            });
                        }
                    }
                }
            }
        }
        return skillBonuses;
    }

    /**
     * Get granted feats from resolved features
     */
    static getGrantedFeats(resolvedProgressions: FeatureProgression[]): FeatureEntity[] {
        const grantedFeats: FeatureEntity[] = [];

        for (const progression of resolvedProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    if (entity.type === EntityType.Other &&
                        entity.appliesTo === EntityAppliesToType.Feat) {
                        if (entity.appliesToId) {
                            grantedFeats.push(entity);
                        }
                    }
                }
            }
        }

        return grantedFeats;
    }

    /**
     * Get available feats count from resolved features
     */
    static getAvailableFeats(resolvedProgressions: FeatureProgression[], level: number, classLevels: Map<number, number>): number {
        let availableFeats = 0;

        // Base feat at level 1, then every 3 levels (3, 6, 9, 12, 15, 18)
        if (level >= 1) availableFeats++;
        if (level >= 3) availableFeats++;
        if (level >= 6) availableFeats++;
        if (level >= 9) availableFeats++;
        if (level >= 12) availableFeats++;
        if (level >= 15) availableFeats++;
        if (level >= 18) availableFeats++;

        // Check for bonus feats from progressions
        for (const progression of resolvedProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    if (entity.type === EntityType.Choice &&
                        entity.appliesTo === EntityAppliesToType.Feat) {
                        // Check if this feat choice is available at current level
                        if (progression.level <= level) {
                            // Check class level if it's class-specific
                            if (progression.classId) {
                                const classLevel = classLevels.get(progression.classId) ?? 0;
                                if (progression.level <= classLevel) {
                                    availableFeats += entity.value || 1;
                                }
                            } else {
                                availableFeats += entity.value || 1;
                            }
                        }
                    }
                }
            }
        }

        return availableFeats;
    }

    /**
     * Get available fighter bonus feats
     */
    static getAvailableFighterBonusFeats(resolvedProgressions: FeatureProgression[]): number {
        let availableFeats = 0;

        for (const progression of resolvedProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    if (entity.type === EntityType.Choice &&
                        entity.appliesTo === EntityAppliesToType.Feat &&
                        entity.filterType === 1) { // FeatureFeatChoiceFilter.FighterBonus
                        availableFeats += entity.value || 1;
                    }
                }
            }
        }

        return availableFeats;
    }

    /**
     * Check if an entity is a class skill entity
     */
    private static isClassSkillEntity(entity: FeatureEntity): boolean {
        return entity.type === EntityType.Other &&
            entity.appliesTo === EntityAppliesToType.Skill &&
            entity.appliesToId !== null &&
            entity.appliesToId !== undefined;
    }

    /**
     * Get source name for display
     */
    private static getSourceName(progression: FeatureProgression): string {
        if (progression.class?.name) {
            return progression.class.name;
        }
        if (progression.feature?.name) {
            return progression.feature.name;
        }
        // Fallback to source type if no class or feature name available
        if (progression.sourceType === 0) { // FeatureSourceType.Race
            return 'Race';
        }
        if (progression.sourceType === 1) { // FeatureSourceType.Class
            return 'Class';
        }
        return 'Unknown Source';
    }

    /**
     * Calculate available spellbook spell selections from resolved progressions
     * Sums quantities from all spellbook spell progressions (class + feats) for a given level
     */
    /**
     * Calculate total free spellbook spells available at a given character level.
     * 
     * Sums quantities from all spellbook spell progressions (class features and feats)
     * that are active at or before the specified level. Supports formula-based calculations
     * for dynamic spell grants (e.g., "3 + INT" at 1st level, "2 spells per level" from 2nd onward).
     * 
     * **Formula Support**:
     * - `ABILITY_BASED`: Base value + ability modifier (e.g., "3 + INT" for 1st level wizard)
     * - `STATIC_EVERY_N_LEVELS`: Fixed value every N levels (e.g., "2 spells per level" from 2nd level)
     * 
     * **Filtering**:
     * - Only includes progressions active at or before the specified level
     * - Filters by classId if progression is class-specific
     * - Only processes entities with `EntityType.Choice` and `EntityAppliesToType.SpellbookSpell`
     * 
     * **Usage**:
     * Used by `characterService.addSpellKnown()` to validate free grant limits for spellbook classes.
     * Also used by `characterService.getAvailableSpellsForClass()` to display available free spells.
     * 
     * @param resolvedProgressions - All resolved feature progressions for the character
     * @param level - The character level to calculate available spells for
     * @param classId - The class to calculate spells for (filters class-specific progressions)
     * @param character - Character data with ability scores (needed for ABILITY_BASED formulas)
     * @returns Total number of free spellbook spells available at the specified level
     * 
     * @example
     * // A 1st-level wizard with INT 16 (+3 modifier) and base grant of "3 + INT" = 6 spells
     * // A 3rd-level wizard with same INT and "2 spells per level" from 2nd level = 6 (1st) + 4 (2nd-3rd) = 10 spells
     * 
     * @see characterService.addSpellKnown - Uses this to validate free grant limits
     * @see characterService.getAvailableSpellsForClass - Uses this to display available free spells
     */
    static getAvailableSpellbookSpells(
        resolvedProgressions: FeatureProgression[],
        level: number,
        classId: number,
        character: CharacterWithAllDetailsResponse
    ): number {
        let totalSpells = 0;

        for (const progression of resolvedProgressions) {
            // Only check progressions that are active at or before this level
            if (progression.level > level) {
                continue;
            }

            // Filter by classId if progression is class-specific
            if (progression.classId !== null && progression.classId !== classId) {
                continue;
            }

            if (!progression.entities) {
                continue;
            }

            for (const entity of progression.entities) {
                // Check if this entity is a spellbook spell choice
                if (entity.type !== EntityType.Choice ||
                    entity.appliesTo !== EntityAppliesToType.SpellbookSpell) {
                    continue;
                }

                // Calculate the value for this entity at the given level
                let entityValue = 0;

                if (entity.formulaParams) {
                    // Calculate using formula
                    const formulaDef = FORMULA_MAP[entity.formulaParams.formulaId];
                    if (formulaDef) {
                        const formulaStartLevel = entity.formulaParams.formulaStartLevel ?? progression.level;

                        // Only calculate if level is at or after the formula start level
                        if (level >= formulaStartLevel) {
                            const params: FormulaCalculationParams = {
                                ...entity.formulaParams,
                                level,
                                startLevel: progression.level,
                                scalingValue: entity.value ?? 0,
                                context: {
                                    character: {
                                        abilityScores: Object.fromEntries(
                                            character.abilityScores.map(a => [a.abilityId, a.value])
                                        )
                                    }
                                }
                            };

                            // Add ability-specific params for ABILITY_BASED formula
                            if (entity.formulaParams.formulaId === FormulaId.ABILITY_BASED && entity.formulaParams.abilityId) {
                                params.baseValue = entity.value ?? 0;
                            }

                            try {
                                const calculatedValue = formulaDef.calculate(params);
                                if (typeof calculatedValue === 'number' && calculatedValue > 0) {
                                    entityValue = calculatedValue;
                                }
                            } catch (error) {
                                console.error('Error calculating formula value:', error);
                            }
                        }
                    }
                } else if (entity.value !== null && entity.value !== undefined) {
                    // Static value - only count if level is at or after progression level
                    if (level >= progression.level) {
                        entityValue = entity.value;
                    }
                }

                totalSpells += entityValue;
            }
        }

        return totalSpells;
    }

    /**
     * Check if a class has a feature grant for all 0th level spellbook spells.
     * 
     * Detects the feature-based 0th level spell grant for spellbook classes. This grant
     * is represented by an `EntityType.Other` + `EntityAppliesToType.SpellbookSpell` entity
     * with `appliesToId: 0` (0th level) and `appliesToSubId: -1` (all spells).
     * 
     * **Feature-Based Approach**:
     * Unlike other spell levels, 0th level spells for spellbook classes are not stored in
     * `AdvancementSpell` records. Instead, they are considered "known" if this grant feature
     * exists in the resolved progressions. This is similar to how proficiencies are handled.
     * 
     * **Usage**:
     * Used by `characterService.getAvailableSpellsForClass()` to determine if 0th level
     * spells should be marked as "known" for spellbook classes. Also used by frontend
     * components to display 0th level spells correctly.
     * 
     * @param resolvedProgressions - All resolved feature progressions for the character
     * @param classId - The class to check for the grant (filters class-specific progressions)
     * @returns True if the class has the 0th level spell grant feature, false otherwise
     * 
     * @see characterService.getAvailableSpellsForClass - Uses this to mark 0th level spells as known
     * @see EntityType.Other - The entity type used for feature-based grants
     * @see EntityAppliesToType.SpellbookSpell - The appliesTo type for spellbook spell grants
     */
    static hasZeroLevelSpellbookSpellsGrant(
        resolvedProgressions: FeatureProgression[],
        classId: number
    ): boolean {
        for (const progression of resolvedProgressions) {
            // Filter by classId if progression is class-specific
            if (progression.classId !== null && progression.classId !== classId) {
                continue;
            }

            if (!progression.entities) {
                continue;
            }

            for (const entity of progression.entities) {
                // Check if this entity grants all 0th level spellbook spells
                if (
                    entity.type === EntityType.Other &&
                    entity.appliesTo === EntityAppliesToType.SpellbookSpell &&
                    entity.appliesToId === 0 &&
                    (entity.appliesToSubId === -1 || entity.appliesToSubId === null)
                ) {
                    return true;
                }
            }
        }

        return false;
    }
}











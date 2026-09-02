import { prisma } from '@/lib/prisma';
import type { FeatureWithRelations, FeatureEntity, CharacterWithAllDetailsResponse, FormulaCalculationParams } from '@shared/schema';
import { EntityType, EntityAppliesToType, FORMULA_MAP, FormulaId, FeatureSourceType, SavingThrowId } from '@shared/static-data';

/**
 * Backend service for extracting resolved feature data
 * Ported from frontend ResolvedFeatureService
 */
export class ResolvedFeatureService {
    /**
     * Get class skills from resolved features
     */
    static getClassSkills(resolvedProgressions: FeatureWithRelations[]): Array<{ skillId: number; skillSubId: number | null }> {
        const classSkills: Array<{ skillId: number; skillSubId: number | null }> = [];

        for (const feature of resolvedProgressions) {
            if (feature.entities) {
                for (const entity of feature.entities) {
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
        resolvedProgressions: FeatureWithRelations[]
    ): boolean {
        for (const feature of resolvedProgressions) {
            if (feature.entities) {
                for (const entity of feature.entities) {
                    // Class skills are identified by EntityType.Base + EntityAppliesToType.Skill
                    if (entity.type !== EntityType.Base || entity.appliesTo !== EntityAppliesToType.Skill || !entity.appliesToId) {
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
    static async getSkillBonuses(resolvedProgressions: FeatureWithRelations[]): Promise<Array<{ skillId: number; skillSubId: number | null; bonus: number; source: string }>> {
        const skillBonuses: Array<{ skillId: number; skillSubId: number | null; bonus: number; source: string }> = [];

        for (const feature of resolvedProgressions) {
            if (feature.entities) {
                for (const entity of feature.entities) {
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
                            const source = await this.getSourceName(feature);
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
    static getGrantedFeats(resolvedProgressions: FeatureWithRelations[]): FeatureEntity[] {
        const grantedFeats: FeatureEntity[] = [];

        for (const feature of resolvedProgressions) {
            if (feature.entities) {
                for (const entity of feature.entities) {
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
     * 
     * Counts feat choices from all resolved features, including edition-specific features.
     * Edition features provide feat choices at appropriate levels (e.g., 1st, 3rd, 6th, etc.).
     */
    static getAvailableFeatsCount(resolvedProgressions: FeatureWithRelations[], level: number, classLevels: Map<number, number>): number {
        let availableFeats = 0;

        // Check for feat choices from all features (including edition features)
        for (const feature of resolvedProgressions) {
            if (feature.entities) {
                for (const entity of feature.entities) {
                    if (entity.type === EntityType.Choice &&
                        entity.appliesTo === EntityAppliesToType.Feat) {
                        // Check if this feat choice is available at current level
                        if (feature.level <= level) {
                            // Check class level if it's class-specific
                            if (feature.classes && feature.classes.length > 0) {
                                // Check if any linked class has sufficient level
                                const hasValidLevel = feature.classes.some(c => {
                                    const classLevel = classLevels.get(c.classId) ?? 0;
                                    return feature.level <= classLevel;
                                });
                                if (hasValidLevel) {
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
     * Get available ability score increases count from resolved features
     * 
     * Counts ability score increase choices from all resolved features, including edition-specific features.
     * Edition features provide ability score increase choices at appropriate levels (e.g., 4th, 8th, 12th, etc.).
     */
    static getAvailableAbilityScoreIncreases(resolvedProgressions: FeatureWithRelations[], level: number): number {
        let availableIncreases = 0;

        // Check for ability score increase choices from all features (including edition features)
        for (const feature of resolvedProgressions) {
            if (feature.entities) {
                for (const entity of feature.entities) {
                    if (entity.type === EntityType.Choice &&
                        entity.appliesTo === EntityAppliesToType.Ability) {
                        // Check if this ability score increase choice is available at current level
                        if (feature.level <= level) {
                            availableIncreases += entity.value || 1;
                        }
                    }
                }
            }
        }

        return availableIncreases;
    }

    /**
     * Get available fighter bonus feats
     */
    static getAvailableFighterBonusFeats(resolvedProgressions: FeatureWithRelations[]): number {
        let availableFeats = 0;

        for (const feature of resolvedProgressions) {
            if (feature.entities) {
                for (const entity of feature.entities) {
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
        return entity.type === EntityType.Base &&
            entity.appliesTo === EntityAppliesToType.Skill &&
            entity.appliesToId !== null &&
            entity.appliesToId !== undefined;
    }

    /**
     * Get source name for display
     */
    private static async getSourceName(feature: FeatureWithRelations): Promise<string> {
        // Check for class name via many-to-many relationship
        if (feature.classes && feature.classes.length > 0) {
            const firstClassId = feature.classes[0].classId;
            const classData = await prisma.class.findUnique({
                where: { id: firstClassId },
                select: { name: true }
            });
            if (classData?.name) {
                return classData.name;
            }
        }

        // Check for race name via many-to-many relationship
        if (feature.races && feature.races.length > 0) {
            const firstRaceId = feature.races[0].raceId;
            const raceData = await prisma.race.findUnique({
                where: { id: firstRaceId },
                select: { name: true }
            });
            if (raceData?.name) {
                return raceData.name;
            }
        }

        // Fallback to feature name
        if (feature.name) {
            return feature.name;
        }

        // Fallback to source type if no class, race, or feature name available
        if (feature.sourceType === 0) { // FeatureSourceType.Race
            return 'Race';
        }
        if (feature.sourceType === 1) { // FeatureSourceType.Class
            return 'Class';
        }
        return 'Unknown Source';
    }

    /**
     * Calculate available spellbook spell selections from resolved features
     * Sums quantities from all spellbook spell features (class + feats) for a given level
     */
    /**
     * Calculate total free spellbook spells available at a given character level.
     * 
     * Sums quantities from all spellbook spell features (class features and feats)
     * that are active at or before the specified level. Supports formula-based calculations
     * for dynamic spell grants (e.g., "3 + INT" at 1st level, "2 spells per level" from 2nd onward).
     * 
     * **Formula Support**:
     * - `ABILITY_BASED`: Base value + ability modifier (e.g., "3 + INT" for 1st level wizard)
     * - `STATIC_EVERY_N_LEVELS`: Fixed value every N levels (e.g., "2 spells per level" from 2nd level)
     * 
     * **Filtering**:
     * - Only includes features active at or before the specified level
     * - Filters by classId if feature is class-specific
     * - Only processes entities with `EntityType.Choice` and `EntityAppliesToType.SpellbookSpell`
     * 
     * **Usage**:
     * Used by `characterService.addSpellKnown()` to validate free grant limits for spellbook classes.
     * Also used by `characterService.getAvailableSpellsForClass()` to display available free spells.
     * 
     * @param resolvedProgressions - All resolved feature features for the character
     * @param level - The character level to calculate available spells for
     * @param classId - The class to calculate spells for (filters class-specific features)
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
        resolvedProgressions: FeatureWithRelations[],
        level: number,
        classId: number,
        character: CharacterWithAllDetailsResponse
    ): number {
        let totalSpells = 0;

        for (const feature of resolvedProgressions) {
            // Only check features that are active at or before this level
            if (feature.level > level) {
                continue;
            }

            // Filter by classId if feature is class-specific (check many-to-many relationship)
            if (feature.sourceType === FeatureSourceType.Class) {
                // For class features, must be linked via many-to-many relationship
                if (!feature.classes || feature.classes.length === 0) {
                    continue; // No classes linked, skip
                }
                const appliesToClass = feature.classes.some(c => c.classId === classId);
                if (!appliesToClass) {
                    continue; // Not linked to this class, skip
                }
            }

            if (!feature.entities) {
                continue;
            }

            for (const entity of feature.entities) {
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
                        const formulaStartLevel = entity.formulaParams.formulaStartLevel ?? feature.level;

                        // Calculate if level is at or after the formula start level, or if featureLevelZero is enabled
                        // (featureLevelZero allows formula to return 0 for levels below formulaStartLevel)
                        if (level >= formulaStartLevel || entity.formulaParams.featureLevelZero === true) {
                            // Spell-slot formulas use formulaParams.maxValue (cap); others use entity.value
                            const isSpellSlots = entity.formulaParams.formulaId === FormulaId.SPELL_SLOTS_TRIANGULAR ||
                                entity.formulaParams.formulaId === FormulaId.SPELL_SLOTS_LINEAR;
                            const scalingValue = isSpellSlots
                                ? (entity.formulaParams.maxValue ?? entity.value ?? 1)
                                : (entity.value !== null && entity.value !== undefined ? entity.value : 1);

                            const params: FormulaCalculationParams = {
                                ...entity.formulaParams,
                                level,
                                startLevel: feature.level,
                                scalingValue,
                                context: {
                                    character: {
                                        abilityScores: Object.fromEntries(
                                            (character.abilityScores || []).map(a => [a.abilityId, a.value])
                                        )
                                    }
                                },
                                baseValue: entity.formulaParams.baseValue ?? undefined,
                                divisor: entity.formulaParams.divisor ?? undefined,
                                startingValue: entity.formulaParams.startingValue ?? undefined,
                            };

                            // Add ability-specific params for ABILITY_BASED formula
                            if (entity.formulaParams.formulaId === FormulaId.ABILITY_BASED && entity.formulaParams.abilityId) {
                                params.baseValue = entity.value ?? 0;
                            }

                            try {
                                const calculatedValue = formulaDef.calculate(params);
                                if (typeof calculatedValue === 'number') {
                                    // Allow 0 values when featureLevelZero is enabled
                                    if (calculatedValue > 0 || entity.formulaParams.featureLevelZero === true) {
                                        entityValue = calculatedValue;
                                    }
                                }
                            } catch (error) {
                                console.error('Error calculating formula value:', error);
                            }
                        }
                    }
                } else if (entity.value !== null && entity.value !== undefined) {
                    // Static value - only count if level is at or after feature level
                    if (level >= feature.level) {
                        entityValue = entity.value;
                    }
                }

                totalSpells += entityValue;
            }
        }

        return totalSpells;
    }

    /**
     * Compute the maximum number of spells known per spell level for a given class at a given class level,
     * using FeatureEntity formulas that target SpellsKnownProgression.
     *
     * This is the FeatureEntity-first replacement for any table-based spells-known progressions.
     * It mirrors `getMaxCastableSpellLevelFromFeaturesForClass`, but instead of returning only the
     * highest castable level, it returns a map of `spellLevel -> maxKnown` derived from
     * `EntityType.Base`/`EntityType.Quantity` + `EntityAppliesToType.SpellsKnownProgression` entities.
     *
     * @param features - All resolved feature progressions for the character
     * @param classId - The class ID whose spells-known progression we are resolving
     * @param classLevel - The current level in that class
     * @param character - Character data for ability-based formulas (if used)
     * @returns Record mapping spell level (0–9) to maximum known spells at that level
     */
    static getSpellsKnownByLevelFromFeaturesForClass(
        features: FeatureWithRelations[],
        classId: number,
        classLevel: number,
        character: CharacterWithAllDetailsResponse
    ): Record<number, number> {
        const result: Record<number, number> = {};

        // Build a minimal abilityScores map for potential ability-based spells-known formulas
        const abilityScores: Record<number, number> = {};
        if (character.abilityScores) {
            for (const score of character.abilityScores) {
                abilityScores[score.abilityId] = score.value;
            }
        }

        for (const feature of features) {
            // Only consider class features that apply to this class (via many-to-many)
            if (feature.sourceType === FeatureSourceType.Class) {
                if (!feature.classes || !feature.classes.some(c => c.classId === classId)) {
                    continue;
                }
            }

            if (!feature.entities) {
                continue;
            }

            for (const entity of feature.entities) {
                // Spells-known entities:
                // - type is Base or Quantity
                // - appliesTo is SpellsKnownProgression
                // - appliesToId is the spell level (0–9)
                // - formulaParams is defined for level-scaling
                if (!entity.formulaParams) {
                    continue;
                }
                if (
                    (entity.type !== EntityType.Base && entity.type !== EntityType.Quantity) ||
                    entity.appliesTo !== EntityAppliesToType.SpellsKnownProgression ||
                    entity.appliesToId === null ||
                    entity.appliesToId === undefined
                ) {
                    continue;
                }

                const spellLevel = entity.appliesToId;
                const formulaDef = FORMULA_MAP[entity.formulaParams.formulaId];
                if (!formulaDef) {
                    continue;
                }

                const formulaStartLevel = entity.formulaParams.formulaStartLevel ?? feature.level;
                if (classLevel < formulaStartLevel && entity.formulaParams.featureLevelZero !== true) {
                    continue;
                }

                const scalingValue =
                    entity.value !== null && entity.value !== undefined ? entity.value : 1;

                const params: FormulaCalculationParams = {
                    ...entity.formulaParams,
                    level: classLevel,
                    startLevel: feature.level,
                    scalingValue,
                    context: {
                        character: {
                            abilityScores,
                        },
                    },
                    baseValue: entity.formulaParams.baseValue != null ? entity.formulaParams.baseValue : undefined,
                    divisor: entity.formulaParams.divisor != null ? entity.formulaParams.divisor : undefined,
                    startingValue: entity.formulaParams.startingValue != null ? entity.formulaParams.startingValue : undefined,
                };

                if (entity.formulaParams.formulaId === FormulaId.ABILITY_BASED && entity.formulaParams.abilityId) {
                    params.baseValue = entity.value ?? 0;
                }

                try {
                    const value = formulaDef.calculate(params);
                    if (typeof value === 'number') {
                        const maxKnown = Math.max(0, Math.floor(value));
                        if (maxKnown > 0) {
                            // If multiple entities contribute to the same spell level, sum them
                            const existing = result[spellLevel] ?? 0;
                            result[spellLevel] = existing + maxKnown;
                        }
                    }
                } catch (error) {
                    console.error('Error calculating spells-known formula value:', error);
                }
            }
        }

        return result;
    }

    /**
     * Compute the highest spell level that is castable for a given class at a given class level,
     * using FeatureEntity formulas (SPELL_SLOTS_TRIANGULAR, SPELL_SLOTS_LINEAR, CONDITIONAL_SCALING, etc.).
     *
     * This is the FeatureEntity-first replacement for table-based SpellcastingProgression/SpellcastingSlot
     * for classes that model spell slots via EntityType.Base/Quantity + EntityAppliesToType.SpellcastingProgression
     * with formulaParams.
     *
     * @param features - All feature progressions for the class (FeatureWithRelations)
     * @param classId - The class ID whose spellcasting we are resolving
     * @param classLevel - The current level in that class
     * @param character - Optional character data for ability-based slot formulas
     * @returns Highest spell level with >0 slots, or 0 if none found
     */
    static getMaxCastableSpellLevelFromFeaturesForClass(
        features: FeatureWithRelations[],
        classId: number,
        classLevel: number,
        character: CharacterWithAllDetailsResponse | null = null
    ): number {
        let maxSpellLevel = 0;

        // Build a minimal abilityScores map if character is provided (for potential ability-based slot formulas)
        const abilityScores: Record<number, number> = {};
        if (character?.abilityScores) {
            for (const score of character.abilityScores) {
                abilityScores[score.abilityId] = score.value;
            }
        }

        for (const feature of features) {
            // Only consider class features that apply to this class (via many-to-many)
            if (feature.sourceType === FeatureSourceType.Class) {
                if (!feature.classes || !feature.classes.some(c => c.classId === classId)) {
                    continue;
                }
            }

            if (!feature.entities) {
                continue;
            }

            for (const entity of feature.entities) {
                // Spell slot entities:
                // - type is Base or Quantity
                // - appliesTo is SpellcastingProgression
                // - appliesToId is the spell level (0–9)
                // - formulaParams is defined (FeatureEntity formula-based modeling)
                if (!entity.formulaParams) {
                    continue;
                }
                if (
                    (entity.type !== EntityType.Base && entity.type !== EntityType.Quantity) ||
                    entity.appliesTo !== EntityAppliesToType.SpellcastingProgression ||
                    entity.appliesToId === null ||
                    entity.appliesToId === undefined
                ) {
                    continue;
                }

                const spellLevel = entity.appliesToId;

                const formulaDef = FORMULA_MAP[entity.formulaParams.formulaId];
                if (!formulaDef) {
                    continue;
                }

                const formulaStartLevel = entity.formulaParams.formulaStartLevel ?? feature.level;
                if (classLevel < formulaStartLevel && entity.formulaParams.featureLevelZero !== true) {
                    continue;
                }

                // Spell-slot formulas use formulaParams.maxValue (cap); others use entity.value
                const isSpellSlots = entity.formulaParams.formulaId === FormulaId.SPELL_SLOTS_TRIANGULAR ||
                    entity.formulaParams.formulaId === FormulaId.SPELL_SLOTS_LINEAR;
                const scalingValue = isSpellSlots
                    ? (entity.formulaParams.maxValue ?? entity.value ?? 1)
                    : (entity.value !== null && entity.value !== undefined ? entity.value : 1);

                const params: FormulaCalculationParams = {
                    ...entity.formulaParams,
                    level: classLevel,
                    startLevel: feature.level,
                    scalingValue,
                    context: {
                        character: {
                            abilityScores,
                        },
                    },
                    baseValue: entity.formulaParams.baseValue != null ? entity.formulaParams.baseValue : undefined,
                    divisor: entity.formulaParams.divisor != null ? entity.formulaParams.divisor : undefined,
                    startingValue: entity.formulaParams.startingValue != null ? entity.formulaParams.startingValue : undefined,
                };

                // Allow formulas that rely on ability modifiers in the future
                if (entity.formulaParams.formulaId === FormulaId.ABILITY_BASED && entity.formulaParams.abilityId) {
                    params.baseValue = entity.value ?? 0;
                }

                try {
                    const value = formulaDef.calculate(params);
                    if (typeof value === 'number') {
                        // Treat strictly positive slot counts as castable for that spell level
                        if (value > 0 && spellLevel > maxSpellLevel) {
                            maxSpellLevel = spellLevel;
                        }
                    }
                } catch (error) {
                    console.error('Error calculating spell slot formula value:', error);
                }
            }
        }

        return maxSpellLevel;
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
     * exists in the resolved features. This is similar to how proficiencies are handled.
     * 
     * **Usage**:
     * Used by `characterService.getAvailableSpellsForClass()` to determine if 0th level
     * spells should be marked as "known" for spellbook classes. Also used by frontend
     * components to display 0th level spells correctly.
     * 
     * @param resolvedProgressions - All resolved feature features for the character
     * @param classId - The class to check for the grant (filters class-specific features)
     * @returns True if the class has the 0th level spell grant feature, false otherwise
     * 
     * @see characterService.getAvailableSpellsForClass - Uses this to mark 0th level spells as known
     * @see EntityType.Other - The entity type used for feature-based grants
     * @see EntityAppliesToType.SpellbookSpell - The appliesTo type for spellbook spell grants
     */
    static hasZeroLevelSpellbookSpellsGrant(
        resolvedProgressions: FeatureWithRelations[],
        classId: number
    ): boolean {
        for (const feature of resolvedProgressions) {
            // Filter by classId if feature is class-specific (check many-to-many relationship)
            if (feature.sourceType === FeatureSourceType.Class) {
                // For class features, must be linked via many-to-many relationship
                if (!feature.classes || feature.classes.length === 0) {
                    continue; // No classes linked, skip
                }
                const appliesToClass = feature.classes.some(c => c.classId === classId);
                if (!appliesToClass) {
                    continue; // Not linked to this class, skip
                }
            }

            if (!feature.entities) {
                continue;
            }

            for (const entity of feature.entities) {
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

    /**
     * Resolve formula values for BAB and saving throw entities
     * Returns a map with semantic keys: 'bab' for BAB, 'save_<id>' for saves
     * For non-gestalt: sums all class contributions
     * For gestalt: will be overridden by GestaltMechanicsResolver
     */
    static resolveFormulaValues(
        resolvedProgressions: FeatureWithRelations[],
        character: CharacterWithAllDetailsResponse,
        targetLevel: number
    ): Record<string, number> {
        const resolvedValues: Record<string, number> = {};
        const isGestalt =
            (character.config?.isGestalt ?? false) ||
            !!character.advancements?.some((adv) => adv.secondaryClassId !== null && adv.secondaryClassId !== 0);

        // Calculate class levels for multiclass summing
        const classLevels = new Map<number, number>();
        if (character.advancements) {
            for (const adv of character.advancements) {
                if (adv.classId) {
                    const currentLevel = classLevels.get(adv.classId) ?? 0;
                    classLevels.set(adv.classId, currentLevel + 1);
                }
                if (adv.secondaryClassId && !isGestalt) {
                    // For non-gestalt, secondary class is just another class to sum
                    const currentLevel = classLevels.get(adv.secondaryClassId) ?? 0;
                    classLevels.set(adv.secondaryClassId, currentLevel + 1);
                }
            }
        }

        // Collect all BAB and save entities by the character's matching class IDs.
        // Shared features list every linked class; only those on the character contribute.
        const babEntitiesByClass = new Map<number, Array<{ entity: FeatureEntity; feature: FeatureWithRelations }>>();
        const saveEntitiesByClass = new Map<number, Array<{ entity: FeatureEntity; saveType: number; feature: FeatureWithRelations }>>();

        for (const feature of resolvedProgressions) {
            if (!feature.entities) continue;

            const matchingClassIds = this.matchingClassIds(feature, classLevels);
            if (matchingClassIds.length === 0) continue;

            for (const classId of matchingClassIds) {
                for (const entity of feature.entities) {
                    const isBAB = entity.appliesTo === EntityAppliesToType.BaseAttackBonus;
                    const isSave = entity.appliesTo === EntityAppliesToType.SavingThrow &&
                        entity.appliesToId !== null &&
                        (entity.appliesToId === SavingThrowId.Fortitude ||
                            entity.appliesToId === SavingThrowId.Reflex ||
                            entity.appliesToId === SavingThrowId.Will);

                    if ((isBAB || isSave) && entity.formulaParams) {
                        if (isBAB) {
                            if (!babEntitiesByClass.has(classId)) {
                                babEntitiesByClass.set(classId, []);
                            }
                            babEntitiesByClass.get(classId)!.push({ entity, feature });
                        } else if (isSave) {
                            if (!saveEntitiesByClass.has(classId)) {
                                saveEntitiesByClass.set(classId, []);
                            }
                            saveEntitiesByClass.get(classId)!.push({ entity, saveType: entity.appliesToId ?? 0, feature });
                        }
                    }
                }
            }
        }

        // Calculate BAB: sum all class contributions, including a legitimate 0 at low level
        let totalBAB = 0;
        let hasBabContribution = false;
        for (const [classId, entities] of babEntitiesByClass.entries()) {
            const classLevel = classLevels.get(classId) ?? 0;
            if (classLevel === 0) continue;

            for (const { entity, feature } of entities) {
                const value = this.calculateFormulaValueForEntity(entity, feature, classLevel, character);
                if (value !== null) {
                    totalBAB += value;
                    hasBabContribution = true;
                }
            }
        }
        if (hasBabContribution) {
            resolvedValues['bab'] = totalBAB;
        }

        // Calculate saves: sum all class contributions per save type, including 0
        for (const saveType of [SavingThrowId.Fortitude, SavingThrowId.Reflex, SavingThrowId.Will]) {
            let totalSave = 0;
            let hasSaveContribution = false;
            for (const [classId, entities] of saveEntitiesByClass.entries()) {
                const classLevel = classLevels.get(classId) ?? 0;
                if (classLevel === 0) continue;

                for (const { entity, saveType: entitySaveType, feature } of entities) {
                    if (entitySaveType !== saveType) continue;
                    const value = this.calculateFormulaValueForEntity(entity, feature, classLevel, character);
                    if (value !== null) {
                        totalSave += value;
                        hasSaveContribution = true;
                    }
                }
            }
            if (hasSaveContribution) {
                resolvedValues[`save_${saveType}`] = totalSave;
            }
        }

        return resolvedValues;
    }

    /**
     * Class IDs on both the feature's FeatureClassMap links and the character's class levels.
     * Shared mechanics (poor-bab, good-will-save) list every class that uses them.
     */
    private static matchingClassIds(
        feature: FeatureWithRelations,
        classLevels: Map<number, number>
    ): number[] {
        const linkedClassIds = feature.classes?.map(c => c.classId) ?? [];
        return linkedClassIds.filter(classId => (classLevels.get(classId) ?? 0) > 0);
    }

    /**
     * Calculate formula value for an entity at a specific class level.
     */
    private static calculateFormulaValueForEntity(
        entity: FeatureEntity,
        feature: FeatureWithRelations,
        classLevel: number,
        character: CharacterWithAllDetailsResponse
    ): number | null {
        if (!entity.formulaParams) return null;

        const formulaDef = FORMULA_MAP[entity.formulaParams.formulaId];
        if (!formulaDef) return null;

        const formulaStartLevel = entity.formulaParams.formulaStartLevel ?? feature.level;

        // Only calculate if level is at or after the formula start level, unless featureLevelZero is enabled
        // (featureLevelZero allows formula to return 0 for levels below formulaStartLevel)
        if (classLevel < formulaStartLevel && entity.formulaParams.featureLevelZero !== true) {
            return null;
        }

        // Build formula params
        const abilityScores: Record<number, number> = {};
        if (character.abilityScores) {
            for (const score of character.abilityScores) {
                abilityScores[score.abilityId] = score.value;
            }
        }

        // Spell-slot formulas use formulaParams.maxValue (cap); others use entity.value
        const isSpellSlots = entity.formulaParams.formulaId === FormulaId.SPELL_SLOTS_TRIANGULAR ||
            entity.formulaParams.formulaId === FormulaId.SPELL_SLOTS_LINEAR;
        const scalingValue = isSpellSlots
            ? (entity.formulaParams.maxValue ?? entity.value ?? 1)
            : (entity.value !== null && entity.value !== undefined ? entity.value : 1);

        const params: FormulaCalculationParams = {
            ...entity.formulaParams,
            level: classLevel,
            startLevel: feature.level,
            scalingValue,
            context: {
                character: {
                    abilityScores,
                },
            },
            // Convert null to undefined for baseValue, divisor, and startingValue
            baseValue: entity.formulaParams.baseValue != null ? entity.formulaParams.baseValue : undefined,
            divisor: entity.formulaParams.divisor != null ? entity.formulaParams.divisor : undefined,
            startingValue: entity.formulaParams.startingValue != null ? entity.formulaParams.startingValue : undefined,
        };

        // Add ability-specific params for ABILITY_BASED formula
        if (entity.formulaParams.formulaId === FormulaId.ABILITY_BASED && entity.formulaParams.abilityId) {
            params.baseValue = entity.value ?? 0;
        }

        // Calculate formula value (0 is valid for poor BAB/saves at low level)
        try {
            const value = formulaDef.calculate(params);
            if (value !== null && value !== undefined && typeof value === 'number') {
                return value;
            }
        } catch (error) {
            console.error('Error calculating formula value:', error);
        }

        return null;
    }
}











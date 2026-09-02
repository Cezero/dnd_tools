import type { CharacterWithAllDetailsResponse, FeatureWithRelations, FeatureEntity, FormulaCalculationParams } from '@shared/schema';
import { EntityAppliesToType, EntityType, FeatureSourceType, SavingThrowId, FORMULA_MAP, FormulaId } from '@shared/static-data';

/**
 * Service for resolving gestalt mechanics after full character resolution.
 * 
 * According to D&D 3.5 gestalt rules, when two classes have overlapping mechanics
 * (BAB, saving throws, hit dice, skill points), the better feature should be used.
 * 
 * This resolver operates AFTER full character resolution, allowing it to:
 * - Handle multiclassing within each gestalt "half"
 * - Calculate totals for each half, then compare
 * - For BAB/saves: Sum multiclass contributions per half, then take the better
 * - For skill points/hit dice: Compare per-level, take higher, then sum
 * 
 * The resolver modifies resolvedFormulaValues to apply gestalt rules.
 */
export class GestaltMechanicsResolver {
    /**
     * Resolve gestalt mechanics by comparing halves and taking the better values.
     * 
     * @param character - Character with all advancements
     * @param resolvedProgressions - Fully resolved feature features
     * @param resolvedFormulaValues - Pre-resolved formula values (will be modified)
     * @returns Modified resolvedFormulaValues with gestalt rules applied
     */
    static resolveGestaltMechanics(
        character: CharacterWithAllDetailsResponse,
        resolvedProgressions: FeatureWithRelations[],
        resolvedFormulaValues: Record<string, number>
    ): Record<string, number> {
        const isGestalt =
            (character.config?.isGestalt ?? false) ||
            !!character.advancements?.some((adv) => adv.secondaryClassId !== null && adv.secondaryClassId !== 0);

        if (!isGestalt) {
            // Not a gestalt character, return unchanged
            return resolvedFormulaValues;
        }

        // Calculate class levels for each gestalt half
        const primaryClassLevels = new Map<number, number>();
        const secondaryClassLevels = new Map<number, number>();

        if (character.advancements) {
            for (const adv of character.advancements) {
                if (adv.classId) {
                    const currentLevel = primaryClassLevels.get(adv.classId) ?? 0;
                    primaryClassLevels.set(adv.classId, currentLevel + 1);
                }
                if (adv.secondaryClassId) {
                    const currentLevel = secondaryClassLevels.get(adv.secondaryClassId) ?? 0;
                    secondaryClassLevels.set(adv.secondaryClassId, currentLevel + 1);
                }
            }
        }

        // Resolve BAB and saves (sum per half, then compare)
        this.resolveBABAndSaves(
            character,
            resolvedProgressions,
            resolvedFormulaValues,
            primaryClassLevels,
            secondaryClassLevels
        );

        // Note: Skill points and hit dice require per-level comparison, which is more complex
        // and may need to be handled differently. For now, we focus on BAB and saves.

        return resolvedFormulaValues;
    }

    /**
     * Resolve BAB and saving throws for gestalt characters.
     * Sums multiclass contributions for each half, then takes the better total.
     */
    private static resolveBABAndSaves(
        character: CharacterWithAllDetailsResponse,
        resolvedProgressions: FeatureWithRelations[],
        resolvedFormulaValues: Record<string, number>,
        primaryClassLevels: Map<number, number>,
        secondaryClassLevels: Map<number, number>
    ): void {
        // Find all BAB and save entities from class features
        const babEntities: Array<{ entity: FeatureEntity; classId: number; feature: FeatureWithRelations }> = [];
        const saveEntities: Array<{ entity: FeatureEntity; saveType: number; classId: number; feature: FeatureWithRelations }> = [];

        const allHalfClassIds = new Set<number>([
            ...primaryClassLevels.keys(),
            ...secondaryClassLevels.keys(),
        ]);

        for (const feature of resolvedProgressions) {
            if (feature.sourceType !== FeatureSourceType.Class || !feature.entities) {
                continue;
            }

            const matchingClassIds = (feature.classes ?? [])
                .map(c => c.classId)
                .filter(classId => allHalfClassIds.has(classId));
            if (matchingClassIds.length === 0) continue;

            for (const classId of matchingClassIds) {
                for (const entity of feature.entities) {
                    if (entity.type === EntityType.Base && entity.formulaParams) {
                        if (entity.appliesTo === EntityAppliesToType.BaseAttackBonus) {
                            babEntities.push({ entity, classId, feature });
                        } else if (entity.appliesTo === EntityAppliesToType.SavingThrow) {
                            saveEntities.push({
                                entity,
                                saveType: entity.appliesToId ?? 0,
                                classId,
                                feature
                            });
                        }
                    }
                }
            }
        }

        // Resolve BAB: Calculate per half, then take better
        const primaryBAB = this.calculateBABForHalf(babEntities, primaryClassLevels, character);
        const secondaryBAB = this.calculateBABForHalf(babEntities, secondaryClassLevels, character);
        const bestBAB = Math.max(primaryBAB, secondaryBAB);

        // Override the 'bab' key with the best value
        resolvedFormulaValues['bab'] = bestBAB;

        // For saves: Calculate per half per save type, then take better
        for (const saveType of [SavingThrowId.Fortitude, SavingThrowId.Reflex, SavingThrowId.Will]) {
            const primarySave = this.calculateSaveForHalf(saveEntities, saveType, primaryClassLevels, character);
            const secondarySave = this.calculateSaveForHalf(saveEntities, saveType, secondaryClassLevels, character);
            const bestSave = Math.max(primarySave, secondarySave);

            // Override the save key with the best value
            resolvedFormulaValues[`save_${saveType}`] = bestSave;
        }
    }

    /**
     * Calculate BAB total for a gestalt half by summing multiclass contributions.
     */
    private static calculateBABForHalf(
        babEntities: Array<{ entity: FeatureEntity; classId: number; feature: FeatureWithRelations }>,
        classLevels: Map<number, number>,
        character: CharacterWithAllDetailsResponse
    ): number {
        let total = 0;

        for (const { entity, classId, feature } of babEntities) {
            const classLevel = classLevels.get(classId);
            if (classLevel === undefined || classLevel === 0) continue;

            if (!entity.formulaParams) continue;

            // Calculate formula value for this class at its actual level
            const value = this.calculateFormulaValue(entity, feature, classLevel, character);
            if (value !== null) {
                total += value;
            }
        }

        return total;
    }

    /**
     * Calculate saving throw total for a gestalt half by summing multiclass contributions.
     */
    private static calculateSaveForHalf(
        saveEntities: Array<{ entity: FeatureEntity; saveType: number; classId: number; feature: FeatureWithRelations }>,
        saveType: number,
        classLevels: Map<number, number>,
        character: CharacterWithAllDetailsResponse
    ): number {
        let total = 0;

        for (const { entity, classId, saveType: entitySaveType, feature } of saveEntities) {
            if (entitySaveType !== saveType) continue;

            const classLevel = classLevels.get(classId);
            if (classLevel === undefined || classLevel === 0) continue;

            if (!entity.formulaParams) continue;

            // Calculate formula value for this class at its actual level
            const value = this.calculateFormulaValue(entity, feature, classLevel, character);
            if (value !== null) {
                total += value;
            }
        }

        return total;
    }

    /**
     * Calculate formula value for an entity at a specific level.
     */
    private static calculateFormulaValue(
        entity: FeatureEntity,
        feature: FeatureWithRelations,
        level: number,
        character: CharacterWithAllDetailsResponse
    ): number | null {
        if (!entity.formulaParams) return null;

        const formulaDef = FORMULA_MAP[entity.formulaParams.formulaId];
        if (!formulaDef) return null;

        const formulaStartLevel = entity.formulaParams.formulaStartLevel ?? feature.level;

        // Only calculate if level is at or after the formula start level, unless featureLevelZero is enabled
        // (featureLevelZero allows formula to return 0 for levels below formulaStartLevel)
        if (level < formulaStartLevel && entity.formulaParams.featureLevelZero !== true) {
            return null;
        }

        // Use entity.value for scalingValue if available (for formulas like LEVEL_TIMES_VALUE)
        const scalingValue = entity.value !== null && entity.value !== undefined
            ? entity.value
            : 1;

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
            // Convert null to undefined for baseValue, divisor, and startingValue
            baseValue: entity.formulaParams.baseValue != null ? entity.formulaParams.baseValue : undefined,
            divisor: entity.formulaParams.divisor != null ? entity.formulaParams.divisor : undefined,
            startingValue: entity.formulaParams.startingValue != null ? entity.formulaParams.startingValue : undefined,
        };

        // Add ability-specific params for ABILITY_BASED formula
        if (entity.formulaParams.formulaId === FormulaId.ABILITY_BASED && entity.formulaParams.abilityId) {
            params.baseValue = entity.value ?? 0;
        }

        try {
            const calculatedValue = formulaDef.calculate(params);
            if (typeof calculatedValue === 'number') {
                return calculatedValue;
            }
        } catch (error) {
            console.error('Error calculating formula value in gestalt resolver:', error);
        }

        return null;
    }
}

import type { FeatureWithRelations, FeatureEntity } from '@shared/schema';
import { EntityAppliesToType, SavingThrowId, ProgressionType, EntityType } from '@shared/static-data';

/**
 * Service for filtering overlapping class-mechanics features in gestalt characters.
 * 
 * According to D&D 3.5 gestalt rules, when two classes have overlapping mechanics
 * (BAB, saving throws, hit dice, skill points), only the better feature should be used.
 */
export class GestaltFeatureFilter {
    /**
     * Filter overlapping class-mechanics features.
     * 
     * NOTE: Class-mechanics filtering (BAB, saves, hit dice, skill points) is now deferred
     * until after full character resolution. This allows proper handling of multiclassing
     * within each gestalt half. See GestaltMechanicsResolver for the deferred resolution.
     * 
     * This method now simply returns all features without filtering mechanics.
     * 
     * @param primaryFeatures - Feature features from primary class
     * @param secondaryFeatures - Feature features from secondary class
     * @returns All feature features (mechanics filtering deferred)
     */
    static filterOverlappingMechanics(
        primaryFeatures: FeatureWithRelations[],
        secondaryFeatures: FeatureWithRelations[]
    ): FeatureWithRelations[] {
        // Return all features - mechanics filtering is now deferred to GestaltMechanicsResolver
        return [...primaryFeatures, ...secondaryFeatures];
    }

    /**
     * @deprecated Class-mechanics merging is now deferred to GestaltMechanicsResolver.
     * This method is no longer used but kept for reference.
     */
    private static mergeClassMechanics(
        primary: FeatureWithRelations,
        secondary: FeatureWithRelations
    ): FeatureWithRelations {
        const primaryEntities = primary.entities || [];
        const secondaryEntities = secondary.entities || [];

        // Extract mechanics from both features
        const primaryBAB = this.extractBAB(primaryEntities);
        const secondaryBAB = this.extractBAB(secondaryEntities);
        const primaryHitDie = this.extractHitDie(primaryEntities);
        const secondaryHitDie = this.extractHitDie(secondaryEntities);
        const primarySkillPoints = this.extractSkillPoints(primaryEntities);
        const secondarySkillPoints = this.extractSkillPoints(secondaryEntities);
        const primarySaves = this.extractSavingThrows(primaryEntities);
        const secondarySaves = this.extractSavingThrows(secondaryEntities);

        // Choose the best values
        const bestBAB = this.chooseBetterBAB(primaryBAB, secondaryBAB);
        const bestHitDie = Math.max(primaryHitDie ?? 0, secondaryHitDie ?? 0) || null;
        const bestSkillPoints = Math.max(primarySkillPoints ?? 0, secondarySkillPoints ?? 0) || null;
        const bestSaves = this.chooseBetterSaves(primarySaves, secondarySaves);

        // Build merged entities array - start with primary entities, then update with better values
        const mergedEntities = primary.entities ? primary.entities.map(e => ({ ...e })) : [];

        // Update or add BAB entity
        if (bestBAB !== null) {
            this.updateOrAddEntity(mergedEntities, EntityAppliesToType.BaseAttackBonus, bestBAB, null);
        }

        // Update or add hit die entity
        if (bestHitDie !== null) {
            this.updateOrAddEntity(mergedEntities, EntityAppliesToType.HitDice, bestHitDie, null);
        }

        // Update or add skill points entity
        if (bestSkillPoints !== null) {
            this.updateOrAddEntity(mergedEntities, EntityAppliesToType.SkillPoints, null, bestSkillPoints);
        }

        // Update or add saving throw entities
        for (const [saveType, feature] of Object.entries(bestSaves)) {
            if (feature !== null) {
                const saveTypeId = saveType === 'fortitude' ? SavingThrowId.Fortitude :
                    saveType === 'reflex' ? SavingThrowId.Reflex : SavingThrowId.Will;
                this.updateOrAddEntity(mergedEntities, EntityAppliesToType.SavingThrow, saveTypeId, feature);
            }
        }

        // Return merged feature (use primary as base, update entities)
        return {
            ...primary,
            entities: mergedEntities,
            // Merge class links from both features
            classes: [
                ...(primary.classes || []),
                ...(secondary.classes || [])
            ].filter((c, index, arr) =>
                arr.findIndex(cc => cc.classId === c.classId) === index
            )
        };
    }

    /**
     * Extract BAB feature from entities.
     */
    private static extractBAB(entities: Array<{ appliesTo: number; appliesToId: number | null }>): ProgressionType | null {
        const babEntity = entities.find(
            e => e.appliesTo === EntityAppliesToType.BaseAttackBonus && e.appliesToId !== null
        );
        return (babEntity?.appliesToId as ProgressionType) ?? null;
    }

    /**
     * Extract hit die from entities.
     */
    private static extractHitDie(entities: Array<{ appliesTo: number; appliesToId: number | null }>): number | null {
        const hitDieEntity = entities.find(
            e => e.appliesTo === EntityAppliesToType.HitDice && e.appliesToId !== null
        );
        return hitDieEntity?.appliesToId ?? null;
    }

    /**
     * Extract skill points from entities.
     */
    private static extractSkillPoints(entities: Array<{ appliesTo: number; value: number | null }>): number | null {
        const skillPointsEntity = entities.find(
            e => e.appliesTo === EntityAppliesToType.SkillPoints && e.value !== null
        );
        return skillPointsEntity?.value ?? null;
    }

    /**
     * Extract saving throw features from entities.
     */
    private static extractSavingThrows(
        entities: Array<{ appliesTo: number; appliesToId: number | null; appliesToSubId: number | null }>
    ): { fortitude: ProgressionType | null; reflex: ProgressionType | null; will: ProgressionType | null } {
        const fortEntity = entities.find(
            e =>
                e.appliesTo === EntityAppliesToType.SavingThrow &&
                e.appliesToId === SavingThrowId.Fortitude &&
                e.appliesToSubId !== null
        );
        const refEntity = entities.find(
            e =>
                e.appliesTo === EntityAppliesToType.SavingThrow &&
                e.appliesToId === SavingThrowId.Reflex &&
                e.appliesToSubId !== null
        );
        const willEntity = entities.find(
            e =>
                e.appliesTo === EntityAppliesToType.SavingThrow &&
                e.appliesToId === SavingThrowId.Will &&
                e.appliesToSubId !== null
        );

        return {
            fortitude: (fortEntity?.appliesToSubId as ProgressionType) ?? null,
            reflex: (refEntity?.appliesToSubId as ProgressionType) ?? null,
            will: (willEntity?.appliesToSubId as ProgressionType) ?? null,
        };
    }

    /**
     * Choose the better BAB feature (lower value = better).
     */
    private static chooseBetterBAB(
        primary: ProgressionType | null,
        secondary: ProgressionType | null
    ): ProgressionType | null {
        if (primary === null) return secondary;
        if (secondary === null) return primary;
        // Lower value is better (good=0 < average=1 < poor=2)
        return primary <= secondary ? primary : secondary;
    }

    /**
     * Choose the better saving throw features (lower value = better for each save).
     */
    private static chooseBetterSaves(
        primary: { fortitude: ProgressionType | null; reflex: ProgressionType | null; will: ProgressionType | null },
        secondary: { fortitude: ProgressionType | null; reflex: ProgressionType | null; will: ProgressionType | null }
    ): { fortitude: ProgressionType | null; reflex: ProgressionType | null; will: ProgressionType | null } {
        return {
            fortitude: this.chooseBetterSave(primary.fortitude, secondary.fortitude),
            reflex: this.chooseBetterSave(primary.reflex, secondary.reflex),
            will: this.chooseBetterSave(primary.will, secondary.will),
        };
    }

    /**
     * Choose the better save feature (lower value = better).
     */
    private static chooseBetterSave(
        primary: ProgressionType | null,
        secondary: ProgressionType | null
    ): ProgressionType | null {
        if (primary === null) return secondary;
        if (secondary === null) return primary;
        // Lower value is better (good=0 < poor=2)
        return primary <= secondary ? primary : secondary;
    }

    /**
     * Update or add an entity in the entities array.
     * Updates existing entities in place, preserving all other fields.
     */
    private static updateOrAddEntity(
        entities: FeatureEntity[],
        appliesTo: number,
        appliesToId: number | null,
        valueOrSubId: number | null
    ): void {
        // Try to find existing entity
        let entityIndex = -1;
        if (appliesTo === EntityAppliesToType.SavingThrow) {
            // For saving throws, match by appliesTo and appliesToId
            entityIndex = entities.findIndex(
                e => e.appliesTo === appliesTo && e.appliesToId === appliesToId
            );
        } else if (appliesTo === EntityAppliesToType.SkillPoints) {
            // For skill points, match by appliesTo
            entityIndex = entities.findIndex(e => e.appliesTo === appliesTo);
        } else {
            // For BAB and hit die, match by appliesTo
            entityIndex = entities.findIndex(e => e.appliesTo === appliesTo);
        }

        if (entityIndex >= 0) {
            // Update existing entity - preserve all fields, only update the relevant one
            const entity = entities[entityIndex];
            if (appliesTo === EntityAppliesToType.SavingThrow) {
                entities[entityIndex] = {
                    ...entity,
                    appliesToSubId: valueOrSubId,
                };
            } else if (appliesTo === EntityAppliesToType.SkillPoints) {
                entities[entityIndex] = {
                    ...entity,
                    value: valueOrSubId,
                };
            } else {
                entities[entityIndex] = {
                    ...entity,
                    appliesToId: appliesToId,
                };
            }
        } else {
            // Find a matching entity from secondary to copy structure, or create minimal entity
            // For class-mechanics, entities should already exist, so this is a fallback
            // Create a minimal entity with required fields - id and featureId will be set when saved
            // We use type assertion here because we're creating an incomplete entity that will be
            // completed when the feature is saved to the database
            const newEntity = {
                id: 0, // Temporary - will be set when saved
                featureId: 0, // Temporary - will be set when saved
                appliesTo: appliesTo as EntityAppliesToType,
                appliesToId: appliesTo === EntityAppliesToType.SavingThrow ? appliesToId : (appliesTo === EntityAppliesToType.SkillPoints ? null : appliesToId),
                appliesToSubId: appliesTo === EntityAppliesToType.SavingThrow ? valueOrSubId : null,
                value: appliesTo === EntityAppliesToType.SkillPoints ? valueOrSubId : null,
                type: EntityType.Base,
                groupingId: 0,
                displayInDetail: true,
                bonusType: null,
                formulaParamsId: null,
                filterType: null,
            } as FeatureEntity;
            entities.push(newEntity);
        }
    }
}

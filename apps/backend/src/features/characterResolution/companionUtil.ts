import type { CompanionBenefitMap } from '@shared/schema';
import { EntityAppliesToType, EntityType, FeatureEntityConditionType, FeatureSourceType } from '@shared/static-data';
import type { FeatureEntity } from '@shared/schema';

/**
 * Convert CompanionBenefitMap to FeatureEntity for use with the feature system
 * Ported from frontend CompanionUtil
 */
export function companionBenefitToFeatureEntity(benefit: CompanionBenefitMap): FeatureEntity {
    // Determine appliesTo based on benefit type
    let appliesTo: EntityAppliesToType;
    if (benefit.typeId === 1) { // CompanionBenefitType.Skill
        appliesTo = EntityAppliesToType.Skill;
    } else if (benefit.typeId === 2) { // CompanionBenefitType.SavingThrow
        appliesTo = EntityAppliesToType.SavingThrow;
    } else if (benefit.typeId === 3) { // CompanionBenefitType.HitPoints
        appliesTo = EntityAppliesToType.HitPoints;
    } else {
        appliesTo = EntityAppliesToType.Other;
    }

    // Convert CompanionBenefitCondition to FeatureEntityCondition
    const conditions = (benefit.conditions || []).map(condition => ({
        id: condition.id || 0,
        featureEntityId: benefit.id || 0,
        conditionType: condition.conditionType as FeatureEntityConditionType,
        conditionValue: condition.conditionValue,
    }));

    // Determine entity type based on benefit type
    // HitPoints is compatible with EntityType.Bonus
    const entityType = EntityType.Bonus;

    return {
        id: benefit.id || 0,
        progressionId: 0,
        type: entityType,
        appliesTo: appliesTo,
        appliesToId: benefit.referenceId || null,
        appliesToSubId: null,
        value: benefit.amount || null,
        bonusType: null,
        formulaParamsId: null,
        groupingId: 0,
        displayInDetail: true,
        filterType: null,
        conditions: conditions.length > 0 ? conditions : undefined,
        formulaParams: null,
    };
}











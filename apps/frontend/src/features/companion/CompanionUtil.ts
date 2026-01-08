import { SKILL_LIST, SAVING_THROW_LIST, CoreComponent, EntityAppliesToType, EntityType, FeatureSourceType, FeatureEntityConditionType } from '@shared/static-data';
import { CompanionBenefitType } from '@shared/static-data';
import type { CompanionBenefitMap, FeatureEntity, FeatureProgression, CreateCompanionBenefitMapRequest } from '@shared/schema';
import { displayStrategyFactory } from '@/lib/formatters';
import { DisplayType } from '@shared/static-data';

export const CompanionBenefitOptions = (benefitType: number): CoreComponent[] => {
    switch (benefitType) {
        case CompanionBenefitType.Skill:
            return SKILL_LIST;
        case CompanionBenefitType.SavingThrow:
            return SAVING_THROW_LIST;
        case CompanionBenefitType.HitPoints:
            // Hit points don't need a reference
            return [];
        default:
            return [];
    }
};

/**
 * Convert CompanionBenefitMap (or form data) to FeatureEntity for use with the formatting system
 */
export function companionBenefitToFeatureEntity(benefit: CompanionBenefitMap | CreateCompanionBenefitMapRequest): FeatureEntity {
    // Determine appliesTo based on benefit type
    let appliesTo: EntityAppliesToType;
    if (benefit.typeId === CompanionBenefitType.Skill) {
        appliesTo = EntityAppliesToType.Skill;
    } else if (benefit.typeId === CompanionBenefitType.SavingThrow) {
        appliesTo = EntityAppliesToType.SavingThrow;
    } else if (benefit.typeId === CompanionBenefitType.HitPoints) {
        appliesTo = EntityAppliesToType.HitPoints;
    } else {
        appliesTo = EntityAppliesToType.Other;
    }

    // Convert CompanionBenefitCondition to FeatureEntityCondition
    // Handle both full CompanionBenefitCondition (with id) and form data (without id)
    const conditions = (benefit.conditions || []).map(condition => ({
        id: ('id' in condition && typeof condition.id === 'number') ? condition.id : 0,
        featureEntityId: ('id' in benefit && typeof benefit.id === 'number') ? benefit.id : 0,
        conditionType: condition.conditionType as FeatureEntityConditionType,
        conditionValue: condition.conditionValue,
    }));

    // Determine entity type based on benefit type
    // HitPoints is compatible with EntityType.Bonus
    const entityType = EntityType.Bonus;

    return {
        id: ('id' in benefit && typeof benefit.id === 'number') ? benefit.id : 0,
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

/**
 * Format a companion benefit using the display strategy system
 * Creates a mock FeatureProgression and uses the display strategy to format it properly
 * Accepts both full CompanionBenefitMap (from API) and CreateCompanionBenefitMapRequest (from form)
 */
export const formatCompanionBenefit = (benefit: CompanionBenefitMap | CreateCompanionBenefitMapRequest): string => {
    try {
        // Convert companion benefit to FeatureEntity
        const entity = companionBenefitToFeatureEntity(benefit);

        // Create a mock FeatureProgression (similar to useFormulaPreview.ts)
        const mockProgression: FeatureProgression = {
            id: 0,
            sourceType: FeatureSourceType.Class,
            classId: null,
            raceId: null,
            level: 1,
            featureId: 0,
            feature: {
                id: 0,
                name: 'Companion Benefit',
                description: '',
                slug: 'companion-benefit',
                displayInCharacterSheet: true,
            },
            entities: [entity],
        };

        // Use Display Strategy to properly orchestrate the formatting process
        const detailStrategy = displayStrategyFactory.createStrategy(DisplayType.Detail);
        const displayResult = detailStrategy.format(mockProgression, {
            currentLevel: 1,
            showBreakdown: false,
        });

        // Extract the formatted entity value from levelEntries (not the full progression formattedValue)
        // The formattedValue on DisplayResult is for the full progression, we want just the entity
        if (displayResult.levelEntries && displayResult.levelEntries.length > 0) {
            const firstLevelEntry = displayResult.levelEntries[0];
            if (firstLevelEntry.items && firstLevelEntry.items.length > 0) {
                return firstLevelEntry.items[0].formattedValue || '';
            }
        }

        // Fallback to formattedValue if levelEntries structure is different
        return displayResult.formattedValue || '';
    } catch (error) {
        console.error('Error formatting companion benefit:', error);
        return 'Error formatting benefit';
    }
};


import type {
    FeatureProgression,
    FeatureEntityCondition
} from '@shared/schema';
import { FeatureEntityConditionType, EntityAppliesToType } from '@shared/static-data';

import { conditionLabelerRegistry } from '../condition-labeler-registry';
import { conditionValueFormatterRegistry } from '../condition-value-formatter-registry';
import { EntityGroupingStrategy } from '../grouping-strategies';
import { labelerRegistry } from '../labeler-registry';
import type {
    FormattedItemWithLevel,
    GroupedLevelItem,
    CalculatedEntity,
    DisplayContext
} from '../types';

/**
 * Phase 3: Within-Level Grouping (Pre-Transition)
 * Handles grouping entities by groupingId within each level
 */
export class GroupingPhase {
    /**
     * Group entities by groupingId ONLY (ignore entity type and subType for grouping)
     */
    groupWithinLevel(
        formattedItems: FormattedItemWithLevel[],
        progression: FeatureProgression,
        context?: DisplayContext
    ): GroupedLevelItem[] {
        if (formattedItems.length === 0) {
            return [];
        }

        // STEP 1: Group by level first
        const groupedByLevel = new Map<number, FormattedItemWithLevel[]>();

        for (const item of formattedItems) {
            if (!groupedByLevel.has(item.level)) {
                groupedByLevel.set(item.level, []);
            }
            groupedByLevel.get(item.level)!.push(item);
        }

        const results: GroupedLevelItem[] = [];

        // STEP 2: For each level, group by groupingId ONLY
        for (const [level, itemsAtLevel] of groupedByLevel) {
            const groupedByGroupingId = new Map<number, FormattedItemWithLevel[]>();

            for (const item of itemsAtLevel) {
                const groupingId = item.groupingId; // No || 0 needed - always present
                if (!groupedByGroupingId.has(groupingId)) {
                    groupedByGroupingId.set(groupingId, []);
                }
                groupedByGroupingId.get(groupingId)!.push(item);
            }

            // STEP 3: Process each grouping
            for (const [groupingId, groupedItems] of groupedByGroupingId) {
                if (groupingId === 0) {
                    // Individual items (no grouping) - process each separately
                    for (const item of groupedItems) {
                        let formattedValue = item.formattedValue;

                        // Apply condition formatting to individual items
                        if (item.entity.conditions && item.entity.conditions.length > 0) {
                            formattedValue = this.formatConditions(
                                item.entity.conditions,
                                item.formattedValue,
                                item.entity
                            );
                        }

                        // Labels are already applied in FormattingPhase, don't apply again

                        results.push({
                            level,
                            featureId: progression.featureId,
                            formattedValue,
                            breakdown: { components: [] }, // Simplified for now
                            descriptionLevel: progression.level,
                            progressionId: progression.id,
                            entityAppliesTo: item.entityAppliesTo,
                            groupingId: item.groupingId
                        });
                    }
                } else {
                    // Grouped items - apply grouping strategy first, then conditions
                    const firstItem = groupedItems[0];
                    // Use unified entity grouping strategy
                    const entityGroupingStrategy = new EntityGroupingStrategy();
                    const groupedResult = entityGroupingStrategy.group(groupedItems.map(item => ({
                        formattedValue: item.formattedValue,
                        breakdown: item.breakdown,
                        entity: item.entity,
                        groupingId: item.groupingId
                    })));

                    let formattedValue = groupedResult.formattedValue;

                    // Check if this is a cumulative group (all entities have the same cumulative formula)
                    const firstEntity = groupedItems[0].entity;
                    const isCumulativeGroup = this.isCumulativeGroup(groupedItems);

                    if (isCumulativeGroup) {
                        // For cumulative groups, apply label to the grouped result
                        formattedValue = labelerRegistry.applyLabel(formattedValue, firstEntity, true, context?.queryClient);
                    }
                    // For non-cumulative groups, the individual items are already labeled

                    // Apply condition formatting AFTER grouping (so conditions apply to the entire group)
                    const entitiesWithConditions = groupedItems.filter(item =>
                        item.entity.conditions && item.entity.conditions.length > 0
                    );

                    if (entitiesWithConditions.length > 0) {
                        // Use the first entity's conditions for the group (assuming all entities in a group have the same conditions)
                        const firstEntity = entitiesWithConditions[0].entity;
                        if (firstEntity.conditions && firstEntity.conditions.length > 0) {
                            // Apply conditions to the entire grouped result
                            formattedValue = this.formatConditions(
                                firstEntity.conditions,
                                formattedValue,
                                firstEntity,
                                context
                            );
                        }
                    }

                    results.push({
                        level,
                        featureId: progression.featureId,
                        formattedValue,
                        breakdown: { components: [] }, // Simplified for now
                        descriptionLevel: progression.level,
                        progressionId: progression.id,
                        entityAppliesTo: firstItem.entityAppliesTo,
                        groupingId: firstItem.groupingId
                    });
                }
            }
        }

        return results;
    }

    /**
     * Check if a group of items represents cumulative modifiers
     * Cumulative modifiers are those generated from formulas with cumulative=true
     */
    private isCumulativeGroup(groupedItems: FormattedItemWithLevel[]): boolean {
        if (groupedItems.length === 0) return false;

        // Check if all items in the group are modifiers with the same cumulative formula
        const firstItem = groupedItems[0];
        const firstEntity = firstItem.entity;
        if (!firstEntity.formulaParams) return false;

        // Check if the formula is cumulative
        const isCumulative = firstEntity.formulaParams.cumulative === true;

        // Also verify that all items in the group have the same formula
        return isCumulative && groupedItems.every(item => {
            const entity = item.entity;
            return entity.formulaParams?.formulaId === firstEntity.formulaParams?.formulaId;
        });
    }

    /**
     * Format conditions by grouping conditions of the same type together.
     * Conditions of the same type are grouped and formatted as a comma-separated list.
     * Works for both single and multiple conditions seamlessly.
     */
    private formatConditions(
        conditions: FeatureEntityCondition[],
        formattedValue: string,
        entity: CalculatedEntity,
        context?: DisplayContext
    ): string {
        if (conditions.length === 0) {
            return formattedValue;
        }

        let hasSpellSchoolCondition = false;
        // Step 1: Group conditions by type
        const conditionsByType = new Map<FeatureEntityConditionType, number[]>();
        for (const condition of conditions) {
            if (!conditionsByType.has(condition.conditionType)) {
                conditionsByType.set(condition.conditionType, []);
            }
            conditionsByType.get(condition.conditionType)!.push(condition.conditionValue);
        }

        const formattedConditions: string[] = [];

        // Step 2: Process each condition type
        for (const [conditionType, conditionValues] of conditionsByType) {
            if (conditionType === FeatureEntityConditionType.spell_school) {
                hasSpellSchoolCondition = true;
            }
            // Step 2a: Format each condition value
            const formatter = conditionValueFormatterRegistry.getFormatter(conditionType);
            const formattedValues = conditionValues
                .map(value => formatter ? formatter.format(value) : '')
                .filter(Boolean)
                .join(', ');

            if (formattedValues) {
                // Step 2b: Apply labeler to the formatted values with entity context
                const labeler = conditionLabelerRegistry.getLabeler(conditionType, entity.appliesTo);
                const labeledCondition = labeler ? labeler(formattedValues, entity, context?.queryClient) : formattedValues;
                formattedConditions.push(labeledCondition);
            }
        }

        // Step 3: Combine with the main formatted value
        if (formattedConditions.length === 0) {
            return formattedValue;
        }

        if (hasSpellSchoolCondition && entity.appliesTo === EntityAppliesToType.SpellSvDC) {
            return `${formattedConditions.join(' ')} ${formattedValue}`;
        }

        return `${formattedValue} ${formattedConditions.join(' ')}`;
    }

}

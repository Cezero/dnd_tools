import { EntityAppliesToType, USES_GROUPED_LABEL } from '@shared/static-data';

import { formatterRegistry } from '../formatter-registry';
import { labelerRegistry } from '../labeler-registry';
import type {
    CalculatedValueWithLevel,
    FormattedItemWithLevel,
    BaseFormatter,
    CalculatedEntity,
    DisplayContext
} from '../types';

/**
 * Phase 2: Pure Formatting
 * Handles formatting individual calculated values
 */
export class FormattingPhase {
    /**
     * Format individual calculated values
     */
    formatItems(
        calculatedValues: CalculatedValueWithLevel[],
        progressionLevel: number,
        showLabels: boolean = true,
        context?: DisplayContext
    ): FormattedItemWithLevel[] {
        return calculatedValues.map(({ breakdown, entity, level }) => {
            // Use formatter directly - CalculatedEntity.value can be string or number
            const formatter = formatterRegistry.getFormatter(entity.type, entity.appliesTo) as BaseFormatter;
            let formattedValue = formatter ? formatter.format(entity, context) : `${entity.value}`;

            // Skip labeling for cumulative modifiers - they will be labeled after grouping
            const isCumulativeModifier = entity.formulaParams?.cumulative === true;
            // Also skip labeling for entity types that use grouped labelers when they are grouped (groupingId > 0)
            const usesGroupedLabel = USES_GROUPED_LABEL.includes(entity.appliesTo as EntityAppliesToType);
            const isGrouped = (entity.groupingId || 0) > 0;
            const shouldSkipLabeling = isCumulativeModifier || (usesGroupedLabel && isGrouped);

            if (!shouldSkipLabeling) {
                formattedValue = labelerRegistry.applyLabel(formattedValue, entity, showLabels);
            }

            return {
                formattedValue,
                breakdown,
                entity,
                level,
                descriptionLevel: progressionLevel,
                featureId: this.getFeatureId(entity),
                entityType: entity.type,
                entityAppliesTo: entity.appliesTo,
                groupingId: entity.groupingId || 0
            };
        });
    }

    /**
     * Get the feature ID from an entity
     */
    private getFeatureId(entity: CalculatedEntity): number {
        if ('progressionId' in entity) {
            return entity.progressionId;
        }
        return 0; // Fallback
    }
}

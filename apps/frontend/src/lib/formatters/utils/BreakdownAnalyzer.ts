import type {
    FeatureEntity
} from '@shared/schema';

import type {
    CalculationBreakdown,
    FormattedItemWithLevel
} from '../types';

/**
 * Utility class for analyzing breakdown components and cumulative groups
 */
export class BreakdownAnalyzer {
    /**
     * Check if breakdown contains a display string from getDisplayString()
     * Returns the display string if found, null otherwise
     */
    getDisplayStringFromBreakdown(breakdown: CalculationBreakdown): string | null {
        // Check if this is a display string case by looking at the breakdown
        // When getDisplayString() is used, the formula field contains the display string
        // and the value is 0
        if (breakdown.components.length > 0) {
            const component = breakdown.components[0];
            if (component.value === 0 && component.formula !== component.source) {
                // This indicates a display string case
                return component.formula;
            }
        }
        return null;
    }

    /**
     * Check if a group of items represents cumulative modifiers
     * Cumulative modifiers are those generated from formulas with cumulative=true
     */
    isCumulativeGroup(groupedItems: FormattedItemWithLevel[]): boolean {
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
}

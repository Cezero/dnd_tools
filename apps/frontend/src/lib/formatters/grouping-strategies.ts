
import {
    FeatureChoiceType
} from '@shared/static-data';

import type {
    FormattedItemWithBreakdown,
    GroupedResult,
    GroupingStrategy,
    BreakdownComponent
} from './types';

/**
 * Base class for grouping strategies that handles common grouping logic
 */
abstract class BaseGroupingStrategy implements GroupingStrategy {
    group(items: FormattedItemWithBreakdown[]): GroupedResult {
        if (!items || items.length === 0) {
            return {
                formattedValue: '',
                breakdown: { components: [] },
                components: []
            };
        }

        // STEP 1: Group by groupingId ONLY (ignore subType completely)
        const groupedByGroupingId = new Map<number, FormattedItemWithBreakdown[]>();

        items.forEach(item => {
            const groupingId = item.groupingId; // No || 0 needed - always present
            if (!groupedByGroupingId.has(groupingId)) {
                groupedByGroupingId.set(groupingId, []);
            }
            groupedByGroupingId.get(groupingId)!.push(item);
        });

        // STEP 2: Process each grouping separately
        const groupedResults: string[] = [];
        const allComponents: BreakdownComponent[] = [];

        for (const [groupingId, groupItems] of groupedByGroupingId) {
            if (groupingId === 0) {
                // Ungrouped items - format individually
                const individualResults = groupItems.map(item => this.formatIndividualItem(item));
                groupedResults.push(individualResults.join(', '));
            } else {
                // Grouped items - format as a single unit
                const groupedResult = this.formatGroupedItems(groupItems);
                groupedResults.push(groupedResult);
            }
            allComponents.push(...groupItems.flatMap(item => item.breakdown?.components || []));
        }

        // STEP 3: Join groups with appropriate separators
        const formattedValue = groupedResults.join('; ');

        return {
            formattedValue,
            breakdown: { components: allComponents, formula: undefined, explanation: undefined },
            components: items
        };
    }

    // Abstract methods for subclasses to implement
    protected abstract formatIndividualItem(item: FormattedItemWithBreakdown): string;
    protected abstract formatGroupedItems(items: FormattedItemWithBreakdown[]): string;
}

/**
 * Groups modifiers by groupingId ONLY, then formats them using the appropriate formatter
 * CRITICAL: This class must use ONLY groupingId for grouping, ignoring entity type and subType completely
 */
export class ModifierGroupingStrategy extends BaseGroupingStrategy {
    protected formatIndividualItem(item: FormattedItemWithBreakdown): string {
        // Remove ALL labeling logic - formatters and labeler registry handle this
        // Simply return item.formattedValue (formatters handle labels)
        return item.formattedValue;
    }

    protected formatGroupedItems(items: FormattedItemWithBreakdown[]): string {
        // Join with ', ' delimiter
        return items.map(item => this.formatIndividualItem(item)).join(', ');
    }

}

/**
 * Groups choices by groupingId, using ' | ' delimiters and parentheses
 */
export class ChoiceGroupingStrategy extends BaseGroupingStrategy {
    protected formatIndividualItem(item: FormattedItemWithBreakdown): string {
        // No labels needed for individual choices
        return item.formattedValue;
    }

    protected formatGroupedItems(items: FormattedItemWithBreakdown[]): string {
        // Join with ' | ' delimiter and wrap in parentheses
        const formatted = items.map(item => this.formatIndividualItem(item)).join(' | ');

        // Add group-level label based on the first choice's type
        const firstChoice = items[0];
        if (firstChoice && firstChoice.choice) {
            const choiceType = firstChoice.choice.type;
            const choiceName = this.getChoiceTypeName(choiceType);
            return `Choose a ${choiceName}: (${formatted})`;
        }

        return `(${formatted})`;
    }

    private getChoiceTypeName(choiceType: FeatureChoiceType): string {
        switch (choiceType) {
            case FeatureChoiceType.Feat:
                return 'Feat';
            case FeatureChoiceType.Feature:
                return 'Feature';
            default:
                return 'Option';
        }
    }
}


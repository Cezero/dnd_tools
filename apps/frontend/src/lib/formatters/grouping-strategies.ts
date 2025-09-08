
import { EntityType } from '@shared/static-data';
import { labelerRegistry } from './labeler-registry';
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
 * Groups entities by groupingId ONLY, then formats them using the appropriate formatter
 * CRITICAL: This class must use ONLY groupingId for grouping, ignoring entity type and subType completely
 */
export class EntityGroupingStrategy extends BaseGroupingStrategy {
    protected formatIndividualItem(item: FormattedItemWithBreakdown): string {
        // Remove ALL labeling logic - formatters and labeler registry handle this
        // Simply return item.formattedValue (formatters handle labels)
        return item.formattedValue;
    }

    protected formatGroupedItems(items: FormattedItemWithBreakdown[]): string {
        // Use different delimiters based on entity type
        const firstItem = items[0];
        if (firstItem && firstItem.entity) {
            // For Choice and Allocation types, use ' | ' delimiter with parentheses
            if (firstItem.entity.type === EntityType.Choice || firstItem.entity.type === EntityType.Allocation) {
                const formatted = items.map(item => this.formatIndividualItem(item)).join(' | ');
                return labelerRegistry.applyGroupedLabel(formatted, firstItem.entity.appliesTo, true);
            }
        }

        // For all other types, use ', ' delimiter
        return items.map(item => this.formatIndividualItem(item)).join(', ');
    }
}


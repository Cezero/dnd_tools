
import { getFeatNameFromCache } from '@/services/cache/featCache';
import { EntityType, EntityAppliesToType, USES_GROUPED_LABEL } from '@shared/static-data';

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
        // Sort items alphabetically by their formatted value
        const sortedItems = [...items].sort((a, b) => {
            const aValue = this.formatIndividualItem(a);
            const bValue = this.formatIndividualItem(b);
            return aValue.localeCompare(bValue);
        });

        // Use different delimiters based on entity type
        const firstItem = sortedItems[0];
        if (firstItem && firstItem.entity) {
            // For Choice and Allocation types, use ' | ' delimiter with parentheses
            if (firstItem.entity.type === EntityType.Choice || firstItem.entity.type === EntityType.Allocation) {
                const formatted = sortedItems.map(item => this.formatIndividualItem(item)).join(' | ');
                return labelerRegistry.applyGroupedLabel(formatted, firstItem.entity.appliesTo, true);
            }

            // Check if any entity in the group uses grouped labelers
            const groupedLabelType = sortedItems.find(item =>
                USES_GROUPED_LABEL.includes(item.entity.appliesTo as EntityAppliesToType)
            )?.entity.appliesTo as EntityAppliesToType;

            if (groupedLabelType) {
                // Extract raw data from the entity data (before individual labeling)
                const rawData = sortedItems
                    .map(item => {
                        // For Weapon Familiarity, get the raw weapon name from the entity's item data
                        if (item.entity.appliesTo === EntityAppliesToType.WeaponFamiliarity && item.entity.item) {
                            return item.entity.item.name;
                        }
                        // For Uses, get the formatted value (which includes the frequency)
                        if (item.entity.appliesTo === EntityAppliesToType.Uses) {
                            return item.formattedValue;
                        }
                        // For Bonus Language and Automatic Language, get the language name from appliesToId
                        if (item.entity.appliesTo === EntityAppliesToType.BonusLanguage ||
                            item.entity.appliesTo === EntityAppliesToType.AutomaticLanguage) {
                            // The language name should be in the formatted value (from LanguageFormatter)
                            // Remove the "Bonus Language: " or "Automatic Language: " prefix to get just the language name
                            const prefix = item.entity.appliesTo === EntityAppliesToType.BonusLanguage ?
                                'Bonus Language: ' : 'Automatic Language: ';
                            return item.formattedValue.replace(prefix, '');
                        }
                        // For other entities, get the raw data (spell names, etc.)
                        if (item.entity.spell) {
                            return item.entity.spell.name;
                        }
                        if (item.entity.appliesTo === EntityAppliesToType.Feat && item.entity.appliesToId) {
                            return getFeatNameFromCache(item.entity.appliesToId);
                        }
                        if (item.entity.item) {
                            return item.entity.item.name;
                        }
                        // Fallback to the formatted value if raw data is missing
                        return item.formattedValue;
                    })
                    .filter(data => data)
                    .sort((a, b) => a.localeCompare(b)); // Sort the raw data alphabetically

                const formatted = rawData.join(', ');
                return labelerRegistry.applyGroupedLabel(formatted, groupedLabelType, true);
            }
        }

        // For all other types, use ', ' delimiter
        return sortedItems.map(item => this.formatIndividualItem(item)).join(', ');
    }
}


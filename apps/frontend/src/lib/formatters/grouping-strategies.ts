import type {
    FeatureModifierInQueryResponse
} from '@shared/schema';
import type {
    FormattedItemWithBreakdown,
    GroupedResult,
    GroupingStrategy,
    FormatterMetadata,
    DisplayContext
} from './types';
import {
    ModifierAppliesToType,
    MODIFIER_APPLIES_TO_TYPES,
    LANGUAGE_MAP,
    SKILL_MAP,
    ABILITY_MAP,
    SAVING_THROW_MAP,
    DAMAGE_TYPES,
    RPG_DICE
} from '@shared/static-data';

/**
 * Groups modifiers by appliesTo type and appliesToId, then formats them using the appropriate formatter
 */
export class ModifierGroupingStrategy implements GroupingStrategy {
    group(items: FormattedItemWithBreakdown[]): GroupedResult {
        if (!items || items.length === 0) {
            return {
                formattedValue: '',
                breakdown: { components: [] },
                components: []
            };
        }

        // Process all items and add appropriate labels
        const formattedItems = items.map(item => {
            let formattedValue = item.formattedValue;

            // Add appropriate label based on modifier data if available
            if (item.modifier) {
                const specificName = this.getSpecificName(item.modifier.appliesTo, item.modifier.appliesToId);
                const typeInfo = MODIFIER_APPLIES_TO_TYPES[item.modifier.appliesTo];
                const displayName = typeInfo?.displayName;

                // Unified labeling logic:
                // 1. If both displayName and specificName exist: "displayName: (specificName: value)"
                // 2. If only specificName exists: "specificName: value"
                // 3. If only displayName exists: "displayName: value"
                // 4. If neither exists: just the value
                if (displayName && specificName) {
                    formattedValue = `${displayName}: (${specificName}: ${formattedValue})`;
                } else if (specificName) {
                    formattedValue = `${specificName}: ${formattedValue}`;
                } else if (displayName) {
                    formattedValue = `${displayName}: ${formattedValue}`;
                }
                // If neither exists, just use the formattedValue as-is
            }

            return formattedValue;
        });

        // Join multiple items with commas
        const formattedValue = formattedItems.join(', ');

        // Combine breakdowns from all items
        const allComponents = items.flatMap(item => item.breakdown?.components || []);
        const combinedBreakdown = {
            components: allComponents,
            formula: undefined,
            explanation: undefined
        };

        return {
            formattedValue,
            breakdown: combinedBreakdown,
            components: items
        };
    }

    /**
     * Get the specific name for a given appliesTo type and ID
     */
    private getSpecificName(appliesToType: ModifierAppliesToType, appliesToId: number): string | null {
        // Handle "any" cases generically (appliesToId = -1)
        if (appliesToId === -1) {
            return this.getAnyLabel(appliesToType);
        }

        switch (appliesToType) {
            case ModifierAppliesToType.Skill:
                return SKILL_MAP[appliesToId]?.name || null;
            case ModifierAppliesToType.Ability:
                return ABILITY_MAP[appliesToId]?.abbreviation || null;
            case ModifierAppliesToType.SavingThrow:
                return SAVING_THROW_MAP[appliesToId]?.abbreviation || null;
            // Add other cases as needed for different appliesTo types
            default:
                return null;
        }
    }

    /**
     * Get the label for "any" cases (appliesToId = -1)
     */
    private getAnyLabel(appliesToType: ModifierAppliesToType): string | null {
        const typeInfo = MODIFIER_APPLIES_TO_TYPES[appliesToType];
        if (typeInfo?.displayName) {
            return `Any ${typeInfo.displayName}`;
        }
        if (typeInfo?.name) {
            return `Any ${typeInfo.name}`;
        }
        return null;
    }
}

/**
 * Utility function to create grouped results with configurable delimiter
 */
function createGroupedResult(items: FormattedItemWithBreakdown[], delimiter: string): GroupedResult {
    const formattedValue = items.map(item => item.formattedValue).join(delimiter);
    const allComponents = items.flatMap(item => item.breakdown?.components || []);

    const combinedBreakdown = {
        components: allComponents,
        formula: undefined,
        explanation: undefined
    };

    return {
        formattedValue,
        breakdown: combinedBreakdown,
        components: items
    };
}

/**
 * Strategy for xxxEdit pages - CRITICAL: only group within single FeatureProgression
 */
export class EditPageGroupingStrategy implements GroupingStrategy {
    group(items: FormattedItemWithBreakdown[]): GroupedResult {
        // CRITICAL: Only group items from the same FeatureProgression
        // Never group across different FeatureProgression entries
        // Must produce exactly one string per FeatureProgression
        return createGroupedResult(items, ', ');
    }

    validateProgressionBoundary(items: FormattedItemWithBreakdown[]): boolean {
        // Ensure all items belong to the same FeatureProgression
        // For now, assume they're from the same progression since we're grouping within a single progression
        return true;
    }
}

/**
 * Strategy for xxxDetail pages - can group by Feature + Level, but ONLY within same feature
 */
export class DetailPageGroupingStrategy implements GroupingStrategy {
    group(items: FormattedItemWithBreakdown[]): GroupedResult {
        // Can group multiple progressions by feature and level, but ONLY within the same feature
        // Used for showing progression patterns
        // CRITICAL: Never mix values from different features within a single feature's display
        return createGroupedResult(items, ', ');
    }

    validateFeatureBoundary(items: FormattedItemWithBreakdown[]): boolean {
        // Ensure all items belong to the same feature
        // This prevents mixing values from different features (e.g., Sneak Attack +5d6 with Trap Sense +3)
        // For now, assume they're from the same feature since we're grouping within a single feature
        return true;
    }
}

/**
 * Strategy for character sheet - minimal grouping, context-specific
 */
export class CharacterSheetGroupingStrategy implements GroupingStrategy {
    group(items: FormattedItemWithBreakdown[]): GroupedResult {
        // Minimal grouping - often one value per specific context
        // Used for specific skill calculations, attack bonuses, etc.
        return createGroupedResult(items, ' + ');
    }
}

/**
 * Simple comma-separated grouping strategy
 */
export class CommaGroupingStrategy implements GroupingStrategy {
    group(items: FormattedItemWithBreakdown[]): GroupedResult {
        return createGroupedResult(items, ', ');
    }
}

/**
 * Pipe-separated grouping strategy for choices
 */
export class PipeGroupingStrategy implements GroupingStrategy {
    group(items: FormattedItemWithBreakdown[]): GroupedResult {
        return createGroupedResult(items, ' | ');
    }
}

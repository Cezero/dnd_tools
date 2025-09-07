import type { FeatureModifierCondition } from '@shared/schema';

import { conditionFormatterRegistry } from './condition-formatter-registry';

/**
 * Format multiple conditions by chaining condition formatters together
 * Each condition formatter receives the output of the previous one as formattedValue
 * 
 * @param conditions Array of conditions to format
 * @param initialFormattedValue The initial formatted value to start with
 * @returns The final formatted value after processing all conditions
 */
export function formatMultipleConditions(conditions: FeatureModifierCondition[], initialFormattedValue: string): string {
    if (!conditions || conditions.length === 0) {
        return initialFormattedValue;
    }

    let result = initialFormattedValue;

    // Process each condition in sequence, chaining the output
    for (const condition of conditions) {
        result = conditionFormatterRegistry.formatCondition(condition, result);
    }

    return result;
}

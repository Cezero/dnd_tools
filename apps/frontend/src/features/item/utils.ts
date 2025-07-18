import { CURRENCY } from '@shared/static-data';

/**
 * Formats a cost value (stored as decimal in gold pieces) into a readable currency string
 * Examples:
 * - 3.0 -> "3 gp"
 * - 0.2 -> "2 sp" 
 * - 0.03 -> "3 cp"
 * - 1000.0 -> "1000 gp" (not converted to platinum)
 * - 15.75 -> "15 gp, 7 sp, 5 cp"
 */
export function formatCostAsCurrency(cost: string | number | null): string {
    if (cost === null || cost === undefined || cost === '') {
        return '-';
    }

    // Convert to number if it's a string
    const costValue = typeof cost === 'string' ? parseFloat(cost) : cost;

    if (isNaN(costValue) || costValue < 0) {
        return 'N/A';
    }

    // If it's a whole number, just return as gold pieces
    if (Number.isInteger(costValue)) {
        return `${costValue} gp`;
    }

    // Break down into gold, silver, and copper
    const gold = Math.floor(costValue);
    const silverDecimal = costValue - gold;
    const silver = Math.floor(silverDecimal * 10);
    const copper = Math.round((silverDecimal * 10 - silver) * 10);

    const parts: string[] = [];

    if (gold > 0) {
        parts.push(`${gold} gp`);
    }

    if (silver > 0) {
        parts.push(`${silver} sp`);
    }

    if (copper > 0) {
        parts.push(`${copper} cp`);
    }

    // If no parts (cost is 0), return "0 gp"
    if (parts.length === 0) {
        return '0 gp';
    }

    return parts.join(', ');
}

/**
 * Parses a currency string input and converts it to a decimal value in gold pieces
 * Examples:
 * - "3 gp" -> "3.00"
 * - "2 sp" -> "0.20"
 * - "5 cp" -> "0.05"
 * - "15 gp, 7 sp, 5 cp" -> "15.75"
 * - "1000 gp" -> "1000.00"
 */
export function parseCurrencyInput(input: string): string | null {
    if (!input || input.trim() === '') {
        return null;
    }

    const trimmed = input.trim().toLowerCase();
    let totalGold = 0;

    // Split by commas and process each part
    const parts = trimmed.split(',').map(part => part.trim());

    for (const part of parts) {
        // First try to match currency with units (gp, sp, cp)
        const currencyMatch = part.match(/^(\d+(?:\.\d+)?)\s*(gp|sp|cp)$/);
        if (currencyMatch) {
            const value = parseFloat(currencyMatch[1]);
            const unit = currencyMatch[2];

            switch (unit) {
                case 'gp':
                    totalGold += value;
                    break;
                case 'sp':
                    totalGold += value * 0.1;
                    break;
                case 'cp':
                    totalGold += value * 0.01;
                    break;
            }
        } else {
            // If no currency unit found, try to parse as a plain number (assume gold pieces)
            const numberMatch = part.match(/^(\d+(?:\.\d+)?)$/);
            if (numberMatch) {
                const value = parseFloat(numberMatch[1]);
                totalGold += value;
            }
        }
    }

    // Return null if no valid currency or number was found
    if (totalGold === 0 && !trimmed.match(/\d/)) {
        return null;
    }

    // Format to 2 decimal places
    return totalGold.toFixed(2);
}

/**
 * Parses a weight input string and converts it to a number
 * Examples:
 * - "5" -> 5
 * - "0.5" -> 0.5
 * - "0.25" -> 0.25
 * - "1.5" -> 1.5
 * - "1/2" -> 0.5
 * - "1/4" -> 0.25
 * - "1/10" -> 0.1
 * - "3/4" -> 0.75
 * - "" -> null
 */
export function parseWeightInput(input: string): number | null {
    if (!input || input.trim() === '') {
        return null;
    }

    const trimmed = input.trim();

    // First try to parse as a fraction (e.g., "1/2", "3/4")
    const fractionMatch = trimmed.match(/^(\d+)\/(\d+)$/);
    if (fractionMatch) {
        const numerator = parseInt(fractionMatch[1]);
        const denominator = parseInt(fractionMatch[2]);

        if (denominator === 0) {
            return null; // Division by zero
        }

        const result = numerator / denominator;
        return result >= 0 ? result : null;
    }

    // If not a fraction, try to parse as a decimal number
    const weight = parseFloat(trimmed);

    if (isNaN(weight) || weight < 0) {
        return null;
    }

    return weight;
} 
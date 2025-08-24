/**
 * Utility functions for handling formula parameters in the frontend
 * 
 * Frontend UI uses comma-separated strings for user input
 * Backend expects arrays for validation and processing
 */

/**
 * Convert array to comma-separated string for display
 */
export function arrayToString(input: (string | number)[] | null | undefined): string {
    if (!input || input.length === 0) {
        return '';
    }
    return input.map(v => String(v)).join(', ');
}

/**
 * Convert comma-separated string to array
 */
export function stringToArray(input: string | null | undefined): (string | number)[] {
    if (!input || input.trim() === '') {
        return [];
    }

    return input.split(',').map(s => {
        const trimmed = s.trim();
        // Try to parse as number first, fall back to string
        const num = parseInt(trimmed, 10);
        return isNaN(num) ? trimmed : num;
    });
}

/**
 * Convert array to comma-separated string for number arrays (thresholds)
 */
export function numberArrayToString(input: number[] | null | undefined): string {
    if (!input || input.length === 0) {
        return '';
    }
    return input.map(v => String(v)).join(', ');
}

/**
 * Convert comma-separated string to number array
 */
export function stringToNumberArray(input: string | null | undefined): number[] {
    if (!input || input.trim() === '') {
        return [];
    }

    return input.split(',').map(s => {
        const trimmed = s.trim();
        const num = parseInt(trimmed, 10);
        if (isNaN(num)) {
            throw new Error(`Invalid number: ${trimmed}`);
        }
        return num;
    });
}

/**
 * Validate that thresholds and values arrays have compatible lengths
 */
export function validateThresholdsAndValues(thresholds: number[], values: (string | number)[]): boolean {
    return thresholds.length === values.length;
}

/**
 * Format array for display with proper spacing
 */
export function formatArrayForDisplay(input: (string | number)[] | null | undefined): string {
    if (!input || input.length === 0) {
        return '';
    }
    return input.map(v => String(v)).join(', ');
}

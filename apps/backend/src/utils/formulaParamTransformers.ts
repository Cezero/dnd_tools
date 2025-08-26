/**
 * Utility functions for transforming formula parameters between string/array format
 * 
 * Database stores thresholds and values as comma-separated strings
 * Zod schemas and application logic use arrays for better validation and manipulation
 */

/**
 * Transform array data to string format for database storage
 */
export function transformFormulaParamsForDatabase(formulaParams: {
    id?: number;
    formulaId: number;
    interval?: number | null;
    formulaStartLevel?: number | null;
    abilityId?: number | null;
    thresholds?: (number | string)[] | null;
    values?: (number | string)[] | null;
}): {
    id?: number;
    formulaId: number;
    interval?: number | null;
    formulaStartLevel?: number | null;
    abilityId?: number | null;
    thresholds?: string | null;
    values?: string | null;
} {
    return {
        id: formulaParams.id,
        formulaId: formulaParams.formulaId,
        interval: formulaParams.interval,
        formulaStartLevel: formulaParams.formulaStartLevel,
        abilityId: formulaParams.abilityId,
        // Transform arrays to comma-separated strings
        thresholds: formulaParams.thresholds ? formulaParams.thresholds.join(',') : null,
        values: formulaParams.values ? formulaParams.values.map(v => String(v)).join(',') : null,
    };
}

/**
 * Transform string data from database to array format for application use
 */
export function transformFormulaParamsFromDatabase(formulaParams: {
    id: number;
    formulaId: number;
    interval?: number | null;
    formulaStartLevel?: number | null;
    abilityId?: number | null;
    thresholds?: string | null;
    values?: string | null;
}): {
    id: number;
    formulaId: number;
    interval?: number | null;
    formulaStartLevel?: number | null;
    abilityId?: number | null;
    thresholds?: number[] | null;
    values?: (string | number)[] | null;
} {
    return {
        id: formulaParams.id,
        formulaId: formulaParams.formulaId,
        interval: formulaParams.interval,
        formulaStartLevel: formulaParams.formulaStartLevel,
        abilityId: formulaParams.abilityId,
        // Transform comma-separated strings to arrays
        thresholds: formulaParams.thresholds
            ? formulaParams.thresholds.split(',').map(s => parseInt(s.trim(), 10))
            : null,
        values: formulaParams.values
            ? formulaParams.values.split(',').map(s => {
                const trimmed = s.trim();
                // Check if it's a dice notation (contains 'd')
                if (trimmed.includes('d')) {
                    return trimmed; // Keep as string for dice notation
                }
                // Try to parse as number for non-dice values
                const num = parseInt(trimmed, 10);
                return isNaN(num) ? trimmed : num;
            })
            : null,
    };
}

/**
 * Validate that thresholds and values arrays have compatible lengths
 */
export function validateThresholdsAndValues(thresholds?: (number | string)[] | null, values?: (number | string)[] | null): boolean {
    if (!thresholds || !values) {
        return true; // Both can be null/undefined
    }

    // For conditional scaling, thresholds and values should have the same length
    return thresholds.length === values.length;
}

/**
 * Parse comma-separated string to array (for backward compatibility)
 */
export function parseCommaSeparatedString(input: string | null | undefined): (string | number)[] | null {
    if (!input) {
        return null;
    }

    return input.split(',').map(s => {
        const trimmed = s.trim();
        const num = parseInt(trimmed, 10);
        return isNaN(num) ? trimmed : num;
    });
}

/**
 * Convert array to comma-separated string (for backward compatibility)
 */
export function arrayToCommaSeparatedString(input: (string | number)[] | null | undefined): string | null {
    if (!input || input.length === 0) {
        return null;
    }

    return input.map(v => String(v)).join(',');
}

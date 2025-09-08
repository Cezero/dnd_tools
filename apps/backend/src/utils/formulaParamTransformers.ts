/**
 * Utility functions for transforming formula parameters between string/array format
 * 
 * Database stores thresholds and values as comma-separated strings
 * Zod schemas and application logic use arrays for better validation and manipulation
 */

import { Prisma } from '@shared/prisma-client';
import { CreateFeatureFormulaParamsRequest, FeatureFormulaParams } from '@shared/schema';

/**
 * Transform array data to string format for database storage
 */
export function transformFormulaParamsForDatabase(formulaParams: FeatureFormulaParams): Prisma.FeatureFormulaParamsUpdateInput {
    return {
        ...formulaParams,
        // Transform arrays to comma-separated strings
        thresholds: formulaParams.thresholds ? formulaParams.thresholds.join(',') : null,
        values: formulaParams.values ? formulaParams.values.map(v => String(v)).join(',') : null,
    };
}

/**
 * Transform array data to string format for database storage (for create operations - omits id)
 */
export function transformFormulaParamsForDatabaseCreate(formulaParams: CreateFeatureFormulaParamsRequest): Prisma.FeatureFormulaParamsCreateInput {
    return {
        ...formulaParams,
        // Transform arrays to comma-separated strings
        thresholds: formulaParams.thresholds ? formulaParams.thresholds.join(',') : null,
        values: formulaParams.values ? formulaParams.values.map(v => String(v)).join(',') : null,
    };
}

/**
 * Transform string data from database to array format for application use
 */
export function transformFormulaParamsFromDatabase(formulaParams: Prisma.FeatureFormulaParamsGetPayload<object>): FeatureFormulaParams {
    return {
        ...formulaParams,
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
        // Cast valuesRepresent to the proper enum type
        valuesRepresent: formulaParams.valuesRepresent as FeatureFormulaParams['valuesRepresent'],
    };
}

/**
 * Validate that thresholds and values arrays have compatible lengths
 */
export function validateThresholdsAndValues(thresholds?: number[] | null, values?: (string | number)[] | null): boolean {
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

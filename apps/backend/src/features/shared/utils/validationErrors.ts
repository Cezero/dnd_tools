import { ZodError } from 'zod';

// Import ValidationError type - validation.ts is exported from schema index
import type { ValidationError } from '@shared/schema';

/**
 * Custom error class for validation failures with field paths.
 * 
 * Used when saving entity states to provide detailed validation errors
 * that can be mapped to form fields in the frontend.
 */
export class ValidationErrorWithPaths extends Error {
    public readonly errors: ValidationError[];

    constructor(errors: ValidationError[]) {
        super('Validation failed');
        this.name = 'ValidationErrorWithPaths';
        this.errors = errors;
    }
}

/**
 * Maps Zod validation errors to field paths for frontend error display.
 * 
 * Converts Zod error paths (e.g., ['entities', 0, 'appliesTo']) to
 * dot-notation paths (e.g., 'entities.0.appliesTo') used by the frontend.
 * 
 * @param zodError - The Zod validation error
 * @returns Array of validation errors with field paths
 * 
 * @example
 * ```typescript
 * try {
 *   FeatureWithRelationsSchema.parse(state);
 * } catch (error) {
 *   if (error instanceof ZodError) {
 *     const validationErrors = mapZodErrorsToFieldPaths(error);
 *     throw new ValidationErrorWithPaths(validationErrors);
 *   }
 * }
 * ```
 */
export function mapZodErrorsToFieldPaths(zodError: ZodError): ValidationError[] {
    return zodError.issues.map((issue): ValidationError => {
        // Convert Zod path array to dot-notation string
        // e.g., ['entities', 0, 'appliesTo'] -> 'entities.0.appliesTo'
        const path = issue.path
            .map((segment) => {
                if (typeof segment === 'number') {
                    return segment.toString();
                }
                return String(segment);
            })
            .join('.');

        return {
            path: path || 'root', // Use 'root' if path is empty
            message: issue.message,
            code: String(issue.code), // Ensure code is a string
        };
    });
}

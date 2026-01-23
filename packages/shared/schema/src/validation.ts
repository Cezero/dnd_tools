import { z } from 'zod';

/**
 * Schema for a single validation error with field path and message.
 * 
 * Used in save responses when validation fails, allowing the frontend
 * to highlight specific form fields with errors.
 * 
 * @example
 * ```typescript
 * {
 *   path: "entities.0.appliesTo",
 *   message: "Invalid enum value: expected one of 0|1|2|3...",
 *   code: "invalid_enum"
 * }
 * ```
 */
export const ValidationErrorSchema = z.object({
    /**
     * The path to the field with the error (e.g., "name", "entities.0.type", "sourceBookInfo.editionId").
     * Uses dot notation with array indices to match the path format used in updateValue calls.
     */
    path: z.string().min(1, 'Path is required'),

    /**
     * Human-readable error message describing the validation failure.
     */
    message: z.string().min(1, 'Message is required'),

    /**
     * Error code indicating the type of validation failure (e.g., "required", "invalid_enum", "too_small").
     * Matches Zod error codes for consistency.
     */
    code: z.string().min(1, 'Code is required'),
});

export type ValidationError = z.infer<typeof ValidationErrorSchema>;

/**
 * Schema for validation error response when save operations fail validation.
 * 
 * Contains an array of validation errors, each with a field path, message, and error code.
 * This allows the frontend to:
 * - Display error messages to the user
 * - Highlight specific form fields with errors
 * - Map errors back to the correct form inputs using the path
 * 
 * @example
 * ```typescript
 * {
 *   success: false,
 *   errors: [
 *     {
 *       path: "entities.0.appliesTo",
 *       message: "Invalid enum value: expected one of 0|1|2|3...",
 *       code: "invalid_enum"
 *     },
 *     {
 *       path: "name",
 *       message: "Name is required",
 *       code: "required"
 *     }
 *   ]
 * }
 * ```
 */
export const ValidationErrorResponseSchema = z.object({
    /**
     * Indicates that the operation failed due to validation errors.
     */
    success: z.literal(false),

    /**
     * Array of validation errors, one for each field that failed validation.
     * Empty array if no errors (should not occur when success is false).
     */
    errors: z.array(ValidationErrorSchema).min(1, 'At least one error is required'),
});

export type ValidationErrorResponse = z.infer<typeof ValidationErrorResponseSchema>;

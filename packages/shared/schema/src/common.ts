import { z } from 'zod';

// Common validation patterns
export const commonValidations = {
    /**
     * Validates a name field with configurable max length.
     * Ensures the name is required, trimmed, and within the specified length.
     * 
     * @param maxLength - Maximum length of the name (default: 100)
     * @returns Zod string schema with validation
     * 
     * @example
     * ```typescript
     * name: commonValidations.name(), // max 100 chars
     * shortName: commonValidations.name(50), // max 50 chars
     * ```
     */
    name: (maxLength = 100) => z.string()
        .min(1, 'Name is required')
        .max(maxLength, `Name must be less than ${maxLength} characters`)
        .trim(),

    /**
     * Validates an optional description field with configurable max length.
     * 
     * @param maxLength - Maximum length of the description (default: 2000)
     * @returns Zod optional string schema with validation
     * 
     * @example
     * ```typescript
     * description: commonValidations.description(), // max 2000 chars, optional
     * notes: commonValidations.description(5000), // max 5000 chars, optional
     * ```
     */
    description: (maxLength = 2000) => z.string()
        .max(maxLength, `Description must be less than ${maxLength} characters`)
        .optional(),

    /**
     * Validates a slug field (URL-friendly identifier).
     * Ensures lowercase letters, numbers, and hyphens only.
     * 
     * @param maxLength - Maximum length of the slug (default: 100)
     * @returns Zod string schema with validation
     * 
     * @example
     * ```typescript
     * slug: commonValidations.slug(),
     * ```
     */
    slug: (maxLength = 100) => z.string()
        .min(1, 'Slug is required')
        .max(maxLength, `Slug must be less than ${maxLength} characters`)
        .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
        .trim(),

    /**
     * Validates an email address.
     * Ensures valid email format and max length of 255 characters.
     * 
     * @returns Zod string schema with email validation
     * 
     * @example
     * ```typescript
     * email: commonValidations.email(),
     * ```
     */
    email: z.string()
        .email('Invalid email format')
        .max(255, 'Email must be less than 255 characters'),

    /**
     * Validates a password with security requirements.
     * Requires: minimum 8 characters, at least one lowercase, one uppercase, and one number.
     * 
     * @returns Zod string schema with password validation
     * 
     * @example
     * ```typescript
     * password: commonValidations.password(),
     * ```
     */
    password: z.string()
        .min(8, 'Password must be at least 8 characters long')
        .max(100, 'Password must be less than 100 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),

    /**
     * Validates a username.
     * Requires: 3-50 characters, letters, numbers, and underscores only.
     * 
     * @returns Zod string schema with username validation
     * 
     * @example
     * ```typescript
     * username: commonValidations.username(),
     * ```
     */
    username: z.string()
        .min(3, 'Username must be at least 3 characters long')
        .max(50, 'Username must be less than 50 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),

    /**
     * Validates a positive integer (typically used for IDs).
     * 
     * @param fieldName - Name of the field for error messages (default: 'ID')
     * @returns Zod number schema with positive integer validation
     * 
     * @example
     * ```typescript
     * id: commonValidations.positiveInt('User ID'),
     * userId: commonValidations.positiveInt(),
     * ```
     */
    positiveInt: (fieldName = 'ID') => z.number()
        .int(`${fieldName} must be an integer`)
        .positive(`${fieldName} must be a positive integer`),

    /**
     * Validates a non-negative integer with optional max value.
     * 
     * @param fieldName - Name of the field for error messages (default: 'Value')
     * @param max - Maximum allowed value (default: 1000)
     * @returns Zod number schema with non-negative integer validation
     * 
     * @example
     * ```typescript
     * age: commonValidations.nonNegativeInt('Age', 1000),
     * quantity: commonValidations.nonNegativeInt('Quantity', 10000),
     * ```
     */
    nonNegativeInt: (fieldName = 'Value', max = 1000) => z.number()
        .int(`${fieldName} must be an integer`)
        .min(0, `${fieldName} must be non-negative`)
        .max(max, `${fieldName} must be less than ${max}`),

    /**
     * Pagination query schema for list endpoints.
     * Converts string query parameters to integers with defaults.
     * 
     * @returns Zod object schema for pagination query parameters
     * 
     * @example
     * ```typescript
     * export const MyListQuerySchema = commonValidations.paginationQuery.extend({
     *   filter: z.string().optional(),
     * });
     * ```
     */
    get paginationQuery() {
        return z.object({
            page: this.optionalIntegerParam().default(1),
            limit: this.optionalIntegerParam().default(10),
        });
    },


    /**
     * Validates the Authorization header with Bearer token format.
     * 
     * @returns Zod object schema for authorization header
     * 
     * @example
     * ```typescript
     * export const AuthHeaderSchema = commonValidations.authHeader;
     * ```
     */
    authHeader: z.object({
        authorization: z.string()
            .regex(/^Bearer\s+/, 'Authorization header must start with "Bearer "')
            .min(7, 'Authorization header is too short'),
    }),

    /**
     * Converts a query param like "true"/"false" to a boolean, or undefined if missing.
     * Use this for optional boolean query parameters in URL query strings (e.g., ?includeDetails=true).
     * 
     * @example
     * ```typescript
     * export const MyQuerySchema = z.object({
     *   includeDetails: optionalBooleanParam(),
     * });
     * ```
     */
    optionalBooleanParam: () =>
        z.preprocess(
            (val) =>
                typeof val === 'string'
                    ? val === 'true'
                    : undefined,
            z.boolean().optional()
        ),

    /**
     * Converts a query param like "123" to an integer, or undefined if missing.
     * Use this for optional integer query parameters in URL query strings (e.g., ?page=1&limit=10).
     * 
     * @example
     * ```typescript
     * export const MyQuerySchema = z.object({
     *   page: optionalIntegerParam().default(1),
     *   limit: optionalIntegerParam().default(10),
     * });
     * ```
     */
    optionalIntegerParam: () =>
        z.preprocess(
            (val) =>
                typeof val === 'string' && val !== ''
                    ? parseInt(val, 10)
                    : undefined,
            z.number().int().optional()
        ),

    /**
     * Converts a query param like "abc" to a string, or undefined if missing.
     * Use this for optional string query parameters in URL query strings (e.g., ?search=term).
     * 
     * @example
     * ```typescript
     * export const MyQuerySchema = z.object({
     *   search: optionalStringParam(),
     * });
     * ```
     */
    optionalStringParam: () =>
        z.preprocess(
            (val) => (typeof val === 'string' && val !== '' ? val : undefined),
            z.string().optional()
        ),

    /**
     * Accepts both string and number, transforms to number.
     * Use this for path parameters (URL segments like /users/:id) that may come from URL strings
     * or be passed as numbers from the frontend.
     * 
     * @example
     * ```typescript
     * export const UserIdParamSchema = z.object({
     *   id: numericParam(),
     * });
     * ```
     */
    numericParam: () =>
        z.union([z.string(), z.number()]).transform((val) =>
            typeof val === 'string' ? parseInt(val, 10) : val
        ),
};

// Standalone exports for easier importing
/**
 * @see commonValidations.numericParam
 */
export const numericParam = () => commonValidations.numericParam();

/**
 * @see commonValidations.optionalBooleanParam
 */
export const optionalBooleanParam = () => commonValidations.optionalBooleanParam();

/**
 * @see commonValidations.optionalIntegerParam
 */
export const optionalIntegerParam = () => commonValidations.optionalIntegerParam();

/**
 * @see commonValidations.optionalStringParam
 */
export const optionalStringParam = () => commonValidations.optionalStringParam();

/**
 * Generic parameter schema for entity ID in URL paths.
 * Accepts both string and number, transforms to number.
 * 
 * @example
 * ```typescript
 * export const MyEntityParamsSchema = IdParamSchema;
 * // Validates: { id: 123 } or { id: "123" } -> { id: 123 }
 * ```
 */
export const IdParamSchema = z.object({
    id: numericParam(),
});
export type IdParamRequest = z.infer<typeof IdParamSchema>;

export const UpdateResponseSchema = z.object({
    message: z.string(),
});

export const CreateResponseSchema = z.object({
    id: z.string(),
    message: z.string(),
});

export type UpdateResponse = z.infer<typeof UpdateResponseSchema>;
export type CreateResponse = z.infer<typeof CreateResponseSchema>;

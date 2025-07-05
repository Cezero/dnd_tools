import { z } from 'zod';

// Common validation patterns
export const commonValidations = {
    // String validations
    name: (maxLength = 100) => z.string()
        .min(1, 'Name is required')
        .max(maxLength, `Name must be less than ${maxLength} characters`)
        .trim(),

    description: (maxLength = 2000) => z.string()
        .max(maxLength, `Description must be less than ${maxLength} characters`)
        .optional(),

    slug: (maxLength = 100) => z.string()
        .min(1, 'Slug is required')
        .max(maxLength, `Slug must be less than ${maxLength} characters`)
        .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
        .trim(),

    email: z.string()
        .email('Invalid email format')
        .max(255, 'Email must be less than 255 characters'),

    password: z.string()
        .min(8, 'Password must be at least 8 characters long')
        .max(100, 'Password must be less than 100 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),

    username: z.string()
        .min(3, 'Username must be at least 3 characters long')
        .max(50, 'Username must be less than 50 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),

    // Number validations
    positiveInt: (fieldName = 'ID') => z.number()
        .int(`${fieldName} must be an integer`)
        .positive(`${fieldName} must be a positive integer`),

    nonNegativeInt: (fieldName = 'Value', max = 1000) => z.number()
        .int(`${fieldName} must be an integer`)
        .min(0, `${fieldName} must be non-negative`)
        .max(max, `${fieldName} must be less than ${max}`),

    // Query parameter transformations
    paginationQuery: z.object({
        page: z.string().optional().transform(val => val ? parseInt(val) : 1),
        limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
    }),

    // Common query transformations
    stringQuery: (fieldName: string) => z.string().optional(),
    intQuery: (fieldName: string) => z.string().optional().transform(val => val ? parseInt(val) : undefined),
    booleanQuery: (fieldName: string) => z.string().optional().transform(val => val === 'true'),

    // Common path parameter transformations
    idParam: (paramName = 'id') => z.object({
        [paramName]: z.string().transform(val => parseInt(val)),
    }),

    // Authorization header
    authHeader: z.object({
        authorization: z.string()
            .regex(/^Bearer\s+/, 'Authorization header must start with "Bearer "')
            .min(7, 'Authorization header is too short'),
    }),
};

// Common schema builders
export const schemaBuilders = {
    // Create a pagination query schema with additional filters
    paginationWithFilters: <T extends Record<string, z.ZodTypeAny>>(filters: T) =>
        commonValidations.paginationQuery.extend(filters),

    // Create a create/update schema with common fields
    entityWithCommonFields: <T extends Record<string, z.ZodTypeAny>>(fields: T) =>
        z.object({
            name: commonValidations.name(),
            description: commonValidations.description(),
            ...fields,
        }),

    // Create an update schema that makes all fields optional except required ones
    updateSchema: <T extends Record<string, z.ZodTypeAny>>(
        baseSchema: z.ZodObject<T>,
        requiredFields: (keyof T)[] = []
    ) => {
        const partialSchema = baseSchema.partial();
        const requiredSchema = z.object(
            Object.fromEntries(
                requiredFields.map(field => [field, baseSchema.shape[field]])
            )
        );
        return requiredSchema.merge(partialSchema);
    },
};

// Export commonly used schemas
export const commonSchemas = {
    pagination: commonValidations.paginationQuery,
    authHeader: commonValidations.authHeader,
    idParam: commonValidations.idParam(),
};

export const UpdateResponseSchema = z.object({
    message: z.string(),
});

export const CreateResponseSchema = z.object({
    id: z.string(),
    message: z.string(),
});

export type UpdateResponse = z.infer<typeof UpdateResponseSchema>;
export type CreateResponse = z.infer<typeof CreateResponseSchema>;

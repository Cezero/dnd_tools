import { z, type ZodType } from 'zod';

import type { ApiOptions } from './types';

// RequestInit is available in the DOM types
type RequestInit = globalThis.RequestInit;

/**
 * Internal API function - DO NOT USE DIRECTLY.
 * 
 * This is the low-level implementation function that handles HTTP requests.
 * All API calls should use `typedApi` instead, which provides:
 * - Type-safe request/response handling
 * - Automatic Zod schema validation
 * - Consistent error handling
 * - Better developer experience
 * 
 * @internal
 * @see typedApi - Use this for all API calls instead
 * 
 * @param endpoint - API endpoint path (without /api prefix)
 * @param options - Request options including method, body, schemas, etc.
 * @returns Promise resolving to the response data
 * 
 * @example
 * ```typescript
 * // ❌ DON'T DO THIS - Use typedApi instead
 * const result = await Api<MyResponse>('/my-endpoint', {
 *   method: 'GET',
 *   responseSchema: MyResponseSchema,
 * });
 * 
 * // ✅ DO THIS INSTEAD
 * const myApi = typedApi({
 *   path: '/my-endpoint',
 *   method: 'GET',
 *   responseSchema: MyResponseSchema,
 * });
 * const result = await myApi();
 * ```
 */
export const Api = async <TResponse = unknown, TRequest = unknown, TParams = unknown>(
    endpoint: string,
    options: ApiOptions<TRequest, TParams> = {},
): Promise<TResponse> => {
    const token = localStorage.getItem('token');

    // Default headers
    const defaultHeaders: Record<string, string> = {};
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Handle Content-Type for JSON body
    const method = options.method?.toUpperCase() || 'GET';
    const isJsonBody =
        (method === 'POST' || method === 'PUT' || method === 'PATCH') &&
        options.body &&
        (!options.headers || !options.headers['Content-Type']);

    if (isJsonBody) {
        defaultHeaders['Content-Type'] = 'application/json';
    }

    // Validate and substitute path parameters
    let url = `/api${endpoint}`;
    if (options.params && options.paramsSchema) {
        let validatedParams: TParams;
        if (!options.skipRequestValidation) {
            validatedParams = options.paramsSchema.parse(options.params) as TParams;
        } else {
            validatedParams = options.params as TParams;
        }
        for (const [key, value] of Object.entries(validatedParams)) {
            url = url.replace(`:${key}`, String(value));
        }
    }

    // Validate input if schema is provided
    if (!options.skipRequestValidation && options.requestSchema) {
        const validated = options.requestSchema.parse(options.query ?? options.body) as TRequest;
        if (options.query) options.query = validated;
        if (options.body) options.body = validated;
    }

    // Append query parameters
    if (options.query) {
        const queryParams = new URLSearchParams();
        for (const [key, value] of Object.entries(options.query)) {
            if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
            }
        }
        url += `?${queryParams.toString()}`;
    }

    const config: RequestInit = {
        method,
        headers: {
            ...defaultHeaders,
            ...(options.headers || {}),
        },
        ...(options.body && { body: JSON.stringify(options.body) }),
        ...(options.signal && { signal: options.signal }),
    };

    try {
        const response = await fetch(url, config);

        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return Promise.reject('Unauthorized');
        }

        if (!response.ok) {
            const errorData = await response.json();
            
            // Check if this is a validation error response (400 with success: false and errors array)
            if (response.status === 400 && errorData.success === false && Array.isArray(errorData.errors)) {
                // Create a special error object that includes validation errors
                const validationError = new Error('Validation failed');
                (validationError as { validationErrors?: typeof errorData.errors }).validationErrors = errorData.errors;
                return Promise.reject(validationError);
            }
            
            // Handle different error response formats
            let errorMessage = 'Something went wrong';
            if (errorData.error) {
                if (Array.isArray(errorData.error)) {
                    // Zod validation errors - format them nicely
                    errorMessage = errorData.error.map((issue: { path: string[]; message: string }) => {
                        const field = issue.path.join('.');
                        return `${field}: ${issue.message}`;
                    }).join(', ');
                } else if (typeof errorData.error === 'string') {
                    errorMessage = errorData.error;
                } else if (errorData.error.message) {
                    errorMessage = errorData.error.message;
                }
            } else if (errorData.message) {
                errorMessage = errorData.message;
            }
            return Promise.reject(errorMessage);
        }

        const data = await response.json();
        console.log('[Api] response data:', data);
        // Validate output if schema is provided
        if (options.responseSchema) {
            try {
                return options.responseSchema.parse(data) as TResponse;
            } catch (validationError) {
                console.error('Response validation error:', validationError);
                // If it's a ZodError, extract the error message
                if (validationError instanceof Error && 'issues' in validationError) {
                    const zodError = validationError as { issues: Array<{ path: string[]; message: string }> };
                    const errorMessage = zodError.issues.map((issue: { path: string[]; message: string }) => {
                        const field = issue.path.join('.');
                        return `${field}: ${issue.message}`;
                    }).join(', ');
                    return Promise.reject(`Response validation failed: ${errorMessage}`);
                }
                return Promise.reject(`Response validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown error'}`);
            }
        }

        return data;
    } catch (error) {
        console.error('API call error:', error);
        // If error is already a string (from our error handling above), pass it through
        if (typeof error === 'string') {
            return Promise.reject(error);
        }
        // If it's an Error object, use its message
        if (error instanceof Error) {
            return Promise.reject(error.message);
        }
        return Promise.reject('Network error or unexpected issue');
    }
};

/**
 * Creates a type-safe API function with automatic Zod validation.
 * 
 * This is the **public API** for making HTTP requests. Always use `typedApi` instead of
 * calling `Api` directly. It provides:
 * - **Type Safety**: Full TypeScript type inference from Zod schemas
 * - **Runtime Validation**: Automatic request and response validation using Zod
 * - **Consistent API**: Standardized way to define API endpoints
 * - **Better DX**: Cleaner, more maintainable code
 * 
 * @template TRequestSchema - Zod schema for request body/query (optional)
 * @template TResponseSchema - Zod schema for response (required)
 * @template TParamsSchema - Zod schema for path parameters (optional)
 * 
 * @param config - API configuration
 * @param config.path - API endpoint path with `:paramName` placeholders for path parameters
 * @param config.method - HTTP method (defaults to 'GET')
 * @param config.requestSchema - Zod schema for validating request body (POST/PUT/PATCH) or query params (GET/DELETE)
 * @param config.paramsSchema - Zod schema for validating path parameters
 * @param config.responseSchema - Zod schema for validating response (required)
 * 
 * @returns A typed async function that takes request data and optional path params
 * 
 * @example
 * ```typescript
 * // Basic GET request
 * const getUsers = typedApi({
 *   path: '/users',
 *   method: 'GET',
 *   responseSchema: UsersResponseSchema,
 * });
 * const users = await getUsers();
 * 
 * @example
 * ```typescript
 * // POST with body and path parameters
 * const updateUser = typedApi<typeof UpdateUserSchema, typeof UserSchema, typeof UserIdParamSchema>({
 *   path: '/users/:id',
 *   method: 'PUT',
 *   requestSchema: UpdateUserSchema,
 *   paramsSchema: UserIdParamSchema,
 *   responseSchema: UserSchema,
 * });
 * const user = await updateUser({ name: 'John' }, { id: 123 });
 * 
 * @example
 * ```typescript
 * // GET with query parameters
 * const searchUsers = typedApi<typeof SearchQuerySchema, typeof UsersResponseSchema>({
 *   path: '/users/search',
 *   method: 'GET',
 *   requestSchema: SearchQuerySchema, // Used as query params for GET
 *   responseSchema: UsersResponseSchema,
 * });
 * const results = await searchUsers({ query: 'john', limit: 10 });
 * ```
 * 
 * @see Api - Internal implementation (do not use directly)
 * @see packages/shared/docs/application-overview/frontend-api-patterns.md - Comprehensive documentation
 */
// Function overload: when requestSchema is undefined, requestData parameter is not required
// These are TypeScript function overloads - ESLint no-redeclare rule doesn't understand them
/* eslint-disable no-redeclare */
export function typedApi<
    TRequestSchema extends undefined,
    TResponseSchema extends ZodType,
    TParamsSchema extends ZodType | undefined = undefined
>(
    config: {
        path: string;
        method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        requestSchema?: TRequestSchema;
        paramsSchema?: TParamsSchema;
        responseSchema: TResponseSchema;
    }
): (params?: TParamsSchema extends ZodType ? z.infer<TParamsSchema> : never) => Promise<z.infer<TResponseSchema>>;

// Function overload: when requestSchema is defined, requestData parameter is required
// Uses z.input to get the input type (before transformation) for request schemas
export function typedApi<
    TRequestSchema extends ZodType,
    TResponseSchema extends ZodType,
    TParamsSchema extends ZodType | undefined = undefined
>(
    config: {
        path: string;
        method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        requestSchema?: TRequestSchema;
        paramsSchema?: TParamsSchema;
        responseSchema: TResponseSchema;
    }
): (requestData: z.input<TRequestSchema>, params?: TParamsSchema extends ZodType ? z.infer<TParamsSchema> : never) => Promise<z.infer<TResponseSchema>>;

// Implementation
export function typedApi<
    TRequestSchema extends ZodType | undefined,
    TResponseSchema extends ZodType,
    TParamsSchema extends ZodType | undefined = undefined
>(
    config: {
        path: string;
        method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        requestSchema?: TRequestSchema;
        paramsSchema?: TParamsSchema;
        responseSchema: TResponseSchema;
    }
) {
    // Use z.input for request type to handle schemas with transforms (e.g., query params that transform string to number)
    type RequestType = TRequestSchema extends ZodType ? z.input<TRequestSchema> : undefined;
    type ResponseType = z.infer<TResponseSchema>;
    type ParamsType = TParamsSchema extends ZodType ? z.infer<TParamsSchema> : undefined;

    return async function (
        requestDataOrParams?: RequestType | ParamsType,
        params?: ParamsType
    ): Promise<ResponseType> {
        // If requestSchema is undefined, first argument is params (if paramsSchema exists), otherwise it's requestData
        let actualRequestData: RequestType | undefined;
        let actualParams: ParamsType | undefined;
        
        if (config.requestSchema === undefined) {
            // No request schema - first argument is params (if paramsSchema exists)
            actualRequestData = undefined;
            actualParams = requestDataOrParams as ParamsType;
        } else {
            // Has request schema - first argument is requestData, second is params
            actualRequestData = requestDataOrParams as RequestType;
            actualParams = params;
        }

        const apiOptions: ApiOptions<RequestType, ParamsType> = {
            method: config.method,
            requestSchema: config.requestSchema,
            paramsSchema: config.paramsSchema,
            responseSchema: config.responseSchema,
            skipRequestValidation: true,
        };

        // Map the method to where to put the data
        if (config.method === 'GET' || config.method === 'DELETE') {
            apiOptions.query = actualRequestData as RequestType;
        } else {
            apiOptions.body = actualRequestData as RequestType;
        }

        // Add path parameters if provided
        if (actualParams) {
            apiOptions.params = actualParams;
        }

        return Api<ResponseType, RequestType, ParamsType>(config.path, apiOptions);
    };
}
/* eslint-enable no-redeclare */

import { z, type ZodType } from 'zod';

import type { ApiOptions } from './types';

// RequestInit is available in the DOM types
type RequestInit = globalThis.RequestInit;

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
        console.log('data', data);
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
    type RequestType = TRequestSchema extends ZodType ? z.infer<TRequestSchema> : undefined;
    type ResponseType = z.infer<TResponseSchema>;
    type ParamsType = TParamsSchema extends ZodType ? z.infer<TParamsSchema> : undefined;

    return async function (
        requestData: RequestType extends undefined ? void : RequestType,
        params?: ParamsType
    ): Promise<ResponseType> {
        const apiOptions: ApiOptions<RequestType, ParamsType> = {
            method: config.method,
            requestSchema: config.requestSchema,
            paramsSchema: config.paramsSchema,
            responseSchema: config.responseSchema,
            skipRequestValidation: true,
        };

        // Map the method to where to put the data
        if (config.method === 'GET' || config.method === 'DELETE') {
            apiOptions.query = requestData as RequestType;
        } else {
            apiOptions.body = requestData as RequestType;
        }

        // Add path parameters if provided
        if (params) {
            apiOptions.params = params;
        }

        return Api<ResponseType, RequestType, ParamsType>(config.path, apiOptions);
    };
}

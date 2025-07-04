import { ZodTypeAny, z } from 'zod';

import type { ApiOptions } from './types';

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
            validatedParams = options.paramsSchema.parse(options.params);
        } else {
            validatedParams = options.params;
        }
        for (const [key, value] of Object.entries(validatedParams)) {
            url = url.replace(`:${key}`, String(value));
        }
    }

    // Validate input if schema is provided
    if (!options.skipRequestValidation && options.requestSchema) {
        const validated = options.requestSchema.parse(options.query ?? options.body);
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
            const error = await response.json();
            return Promise.reject(error.message || 'Something went wrong');
        }

        const data = await response.json();
        console.log('data', data);
        // Validate output if schema is provided
        if (options.responseSchema) {
            return options.responseSchema.parse(data);
        }

        return data;
    } catch (error) {
        console.error('API call error:', error);
        return Promise.reject('Network error or unexpected issue');
    }
};

export function typedApi<
    TRequestSchema extends ZodTypeAny | undefined,
    TResponseSchema extends ZodTypeAny,
    TParamsSchema extends ZodTypeAny | undefined = undefined
>(
    config: {
        path: string;
        method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        requestSchema?: TRequestSchema;
        paramsSchema?: TParamsSchema;
        responseSchema: TResponseSchema;
    }
) {
    type RequestType = TRequestSchema extends ZodTypeAny ? z.infer<TRequestSchema> : undefined;
    type ResponseType = z.infer<TResponseSchema>;
    type ParamsType = TParamsSchema extends ZodTypeAny ? z.infer<TParamsSchema> : undefined;

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

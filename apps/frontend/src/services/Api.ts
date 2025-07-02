import { ZodSchema, z } from 'zod';

import type { ApiOptions } from './types';

export const Api = async <TResponse = unknown, TRequest = unknown>(
    endpoint: string,
    options: ApiOptions<TRequest> = {},
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

    // Validate input if schema is provided
    if (options.requestSchema) {
        const validated = options.requestSchema.parse(options.query ?? options.body);
        if (options.query) options.query = validated;
        if (options.body) options.body = validated;
    }

    // Append query parameters
    let url = `/api${endpoint}`;
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
    TRequestSchema extends ZodSchema<any> | undefined,
    TResponseSchema extends ZodSchema<any>
>(
    config: {
        path: string;
        method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        requestSchema?: TRequestSchema;
        responseSchema: TResponseSchema;
    }
) {
    type RequestType = TRequestSchema extends ZodSchema<any> ? z.infer<TRequestSchema> : undefined;
    type ResponseType = z.infer<TResponseSchema>;

    return async function (
        requestData: RequestType extends undefined ? void : RequestType
    ): Promise<ResponseType> {
        const apiOptions: any = {
            method: config.method,
            requestSchema: config.requestSchema,
            responseSchema: config.responseSchema,
        };

        // Map the method to where to put the data
        if (config.method === 'GET' || config.method === 'DELETE') {
            apiOptions.query = requestData;
        } else {
            apiOptions.body = requestData;
        }

        return Api<ResponseType, RequestType>(config.path, apiOptions);
    };
}
